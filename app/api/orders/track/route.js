import { connectDB } from "@/lib/databaseConnection";
import OrderModel from "@/models/Order.model";
import { trackOrderByAwb, normaliseTracking } from "@/lib/shipmozo";

function json(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

/**
 * Public tracking endpoint. Accepts either:
 *   ?orderId=<mongoOrderId>
 *   ?awb=<awbNumber>
 *
 * Returns a merged tracking payload that includes:
 *   - Basic order info from our DB
 *   - Latest live status from ShipMozo (if AWB is available)
 *   - Full tracking history (persisted + live merged)
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const orderId = (searchParams.get("orderId") || "").trim();
    const awb = (searchParams.get("awb") || "").trim();

    if (!orderId && !awb) {
      return json(400, "Please provide an Order ID or AWB number");
    }

    let order = null;
    if (orderId) {
      // Support both full Mongo ID and last 6 chars (shown on UI)
      if (/^[0-9a-fA-F]{24}$/.test(orderId)) {
        order = await OrderModel.findById(orderId).lean();
      } else {
        // Search by shipmozoOrderId or awb inside orderId param
        order = await OrderModel.findOne({
          $or: [
            { shipmozoOrderId: orderId },
            { awbNumber: orderId },
            { _id: { $regex: `${orderId.replace(/[^0-9a-fA-F]/g, "")}$`, $options: "i" } },
          ],
        }).lean().catch(() => null);
      }
    } else if (awb) {
      order = await OrderModel.findOne({ awbNumber: awb }).lean();
    }

    if (!order) return json(404, "Order not found. Please check your Order ID / AWB.");

    // Attempt live tracking via ShipMozo if we have an AWB
    let liveTracking = null;
    if (order.awbNumber) {
      try {
        const raw = await trackOrderByAwb(order.awbNumber);
        // Only merge when ShipMozo actually accepted our AWB (result:1)
        const shipmozoOk = raw && (raw.result === "1" || raw.result === 1);
        liveTracking = normaliseTracking(raw);

        if (shipmozoOk) {
          // Merge live history into our persisted history (dedupe by timestamp+status)
          const seen = new Set(
            (order.trackingHistory || []).map(
              (h) => `${new Date(h.timestamp || 0).toISOString()}::${h.status}`
            )
          );
          const merged = [...(order.trackingHistory || [])];
          for (const ev of liveTracking.history || []) {
            const key = `${new Date(ev.timestamp || 0).toISOString()}::${ev.status}`;
            if (!seen.has(key) && ev.status) {
              merged.push({
                ...ev,
                timestamp: ev.timestamp ? new Date(ev.timestamp) : new Date(),
              });
              seen.add(key);
            }
          }
          merged.sort(
            (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
          );

          // Persist the latest tracking snapshot
          await OrderModel.findByIdAndUpdate(order._id, {
            trackingHistory: merged,
            currentTrackingStatus: liveTracking.status || order.currentTrackingStatus,
            expectedDeliveryDate: liveTracking.expectedDelivery
              ? new Date(liveTracking.expectedDelivery)
              : order.expectedDeliveryDate,
            courierName: liveTracking.courierName || order.courierName,
            lastTrackedAt: new Date(),
          }).catch(() => null);

          order.trackingHistory = merged;
          order.currentTrackingStatus = liveTracking.status || order.currentTrackingStatus;
        } else {
          // Still stamp lastTrackedAt so UI shows we tried
          await OrderModel.findByIdAndUpdate(order._id, {
            lastTrackedAt: new Date(),
          }).catch(() => null);
        }
      } catch (err) {
        console.error("Live tracking failed for AWB", order.awbNumber, err?.message);
      }
    }

    // Public response — never leak sensitive user info
    const payload = {
      orderId: String(order._id),
      shortId: String(order._id).slice(-6).toUpperCase(),
      awbNumber: order.awbNumber || "",
      shipmozoOrderId: order.shipmozoOrderId || "",
      courierName: order.courierName || "",
      status: order.status,
      currentTrackingStatus: order.currentTrackingStatus || order.status,
      expectedDeliveryDate: order.expectedDeliveryDate,
      trackingHistory: order.trackingHistory || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingAddress: {
        city: order.shippingAddress?.city,
        state: order.shippingAddress?.state,
        pincode: order.shippingAddress?.pincode,
      },
      totalAmount: order.totalAmount,
      itemsCount: (order.items || []).length,
      lastTrackedAt: order.lastTrackedAt || new Date(),
      liveTrackingAvailable: Boolean(order.awbNumber),
    };

    return json(200, "Tracking fetched", payload);
  } catch (e) {
    console.error("track order error", e);
    return json(500, e instanceof Error ? e.message : "Failed to track order");
  }
}

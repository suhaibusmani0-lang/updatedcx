import { NextResponse } from "next/server";
import { connectDB } from "@/lib/databaseConnection";
import OrderModel from "@/models/Order.model";

/**
 * ShipMozo webhook receiver.
 *
 * Configure this URL in ShipMozo Dashboard → Settings → Webhook:
 *   {NEXT_PUBLIC_BASE_URL}/api/shipmozo/webhook
 *
 * The webhook can be verified with an optional shared secret (?secret=<token>)
 * matching SHIPMOZO_WEBHOOK_SECRET.
 *
 * Expected payload variants (ShipMozo docs are opaque; we handle multiple shapes):
 *   {
 *     order_id:        "<shipmozo order id>",
 *     reference_id:    "<our internal order id>",
 *     awb_number:      "<awb>",
 *     courier_name:    "<courier>",
 *     status:          "<current status>",
 *     status_code:     "<code>",
 *     remark:          "<remark>",
 *     location:        "<location>",
 *     event_time:      "<timestamp>",
 *     expected_delivery_date: "<yyyy-mm-dd>"
 *   }
 */

async function handle(req) {
  try {
    // Optional shared secret check
    const { searchParams } = new URL(req.url);
    const expected = process.env.SHIPMOZO_WEBHOOK_SECRET;
    const provided = searchParams.get("secret") || req.headers.get("x-webhook-secret");
    if (expected && provided && expected !== provided) {
      return NextResponse.json({ ok: false, message: "Invalid webhook secret" }, { status: 401 });
    }

    // Parse body (support JSON + urlencoded)
    let body = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json().catch(() => ({}));
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = Object.fromEntries(new URLSearchParams(text));
      }
    }

    // Flatten common wrappers
    const payload = body?.data || body?.payload || body;

    const referenceId =
      payload.reference_id ||
      payload.refrence_id ||
      payload.ref_id ||
      payload.order_reference_id ||
      payload.merchant_order_id ||
      "";

    const shipmozoOrderId =
      payload.order_id || payload.shipmozo_order_id || payload.mozo_order_id || "";

    const awbNumber = payload.awb_number || payload.awb || "";
    const courierName = payload.courier_name || payload.courier || "";
    const courierId = String(payload.courier_id || "");
    const statusText = payload.status || payload.current_status || payload.status_description || "";
    const statusCode = String(payload.status_code || payload.code || "");
    const remark = payload.remark || payload.description || payload.activity || statusText;
    const location = payload.location || payload.city || "";
    const eventTime =
      payload.event_time || payload.event_date || payload.timestamp || new Date().toISOString();
    const eddRaw = payload.expected_delivery_date || payload.edd || null;

    if (!referenceId && !shipmozoOrderId && !awbNumber) {
      return NextResponse.json(
        { ok: false, message: "Missing order identifier in webhook payload" },
        { status: 400 }
      );
    }

    await connectDB();

    // Locate the order in our DB
    const orClauses = [];
    if (referenceId && /^[0-9a-fA-F]{24}$/.test(referenceId)) {
      orClauses.push({ _id: referenceId });
    }
    if (shipmozoOrderId) orClauses.push({ shipmozoOrderId: String(shipmozoOrderId) });
    if (awbNumber) orClauses.push({ awbNumber: String(awbNumber) });

    if (orClauses.length === 0) {
      return NextResponse.json({ ok: false, message: "Order not resolvable" }, { status: 404 });
    }

    const order = await OrderModel.findOne({ $or: orClauses });
    if (!order) {
      return NextResponse.json({ ok: false, message: "Order not found in DB" }, { status: 404 });
    }

    // Update AWB / courier fields if freshly assigned
    if (awbNumber) order.awbNumber = String(awbNumber);
    if (shipmozoOrderId) order.shipmozoOrderId = String(shipmozoOrderId);
    if (courierName) order.courierName = courierName;
    if (courierId) order.courierId = courierId;
    if (statusText) order.currentTrackingStatus = statusText;

    if (eddRaw) {
      const d = new Date(eddRaw);
      if (!isNaN(d.getTime())) order.expectedDeliveryDate = d;
    }

    // Map ShipMozo status → our order lifecycle
    const lower = statusText.toLowerCase();
    if (/delivered/.test(lower)) order.status = "Delivered";
    else if (/shipped|out.*for.*delivery|in.?transit|picked/.test(lower)) order.status = "Shipped";
    else if (/cancel|rto/.test(lower)) order.status = "Cancelled";
    else if (/processing|pending.?pickup|manifested|assigned/.test(lower))
      order.status = "Processing";

    // Append new tracking event (dedupe by timestamp+status)
    const ts = new Date(eventTime);
    const existing = (order.trackingHistory || []).some(
      (h) =>
        h.status === statusText &&
        new Date(h.timestamp || 0).getTime() === (isNaN(ts.getTime()) ? 0 : ts.getTime())
    );
    if (!existing && statusText) {
      order.trackingHistory.push({
        status: statusText,
        status_code: statusCode,
        remark,
        location,
        timestamp: isNaN(ts.getTime()) ? new Date() : ts,
      });
    }

    order.lastTrackedAt = new Date();
    await order.save();

    return NextResponse.json({ ok: true, message: "Tracking updated", orderId: String(order._id) });
  } catch (e) {
    console.error("ShipMozo webhook error:", e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  return handle(req);
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "ShipMozo webhook endpoint is live" });
}

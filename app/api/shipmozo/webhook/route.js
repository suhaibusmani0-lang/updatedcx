import { NextResponse } from "next/server";
import { connectDB } from "@/lib/databaseConnection";
import OrderModel from "@/models/Order.model";

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
    
    const courierName = payload.carrier || payload.courier_name || payload.courier || "";
    
    const courierId = String(payload.courier_id || "");
    const statusText = payload.status || payload.current_status || payload.status_description || "";
    const statusCode = String(payload.status_code || payload.code || "");
    const remark = payload.remark || payload.description || payload.activity || statusText;
    const location = payload.location || payload.city || "";
    const eventTime =
      payload.status_time || payload.event_time || payload.event_date || payload.timestamp || new Date().toISOString();
    const eddRaw = payload.expected_delivery_date || payload.edd || null;

    if (!referenceId && !shipmozoOrderId && !awbNumber) {
      return NextResponse.json(
        { ok: false, message: "Missing order identifier in webhook payload" },
        { status: 400 }
      );
    }

    await connectDB();

    const orClauses = [];
    
    [referenceId, shipmozoOrderId].forEach((id) => {
      const cleanId = String(id || "").trim();
      if (cleanId) {
        if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
          orClauses.push({ _id: cleanId });
        }
        orClauses.push({ shipmozoOrderId: cleanId });
      }
    });

    if (awbNumber) {
      orClauses.push({ awbNumber: String(awbNumber).trim() });
    }

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

    // Map Shipmozo status → our order lifecycle
    const lower = statusText.toLowerCase();
    if (/delivered/.test(lower)) order.status = "Delivered";
    else if (/shipped|out.*for.*delivery|in.?transit|picked/.test(lower)) order.status = "Shipped";
    else if (/cancel|rto/.test(lower)) order.status = "Cancelled";
    else if (/processing|pending.?pickup|manifested|assigned/.test(lower))
      order.status = "Processing";

    // SAFETY FIX: Initialize trackingHistory if it doesn't exist
    if (!order.trackingHistory) {
      order.trackingHistory = [];
    }

    if (payload.status_feed && Array.isArray(payload.status_feed.scan)) {
      payload.status_feed.scan.forEach((scanItem) => {
        const ts = new Date(scanItem.date);
        const existing = order.trackingHistory.some(
          (h) =>
            h.status === scanItem.status &&
            new Date(h.timestamp || 0).getTime() === (isNaN(ts.getTime()) ? 0 : ts.getTime())
        );
        if (!existing && scanItem.status) {
          order.trackingHistory.push({
            status: scanItem.status,
            location: scanItem.location || "",
            remark: scanItem.status,
            timestamp: isNaN(ts.getTime()) ? new Date() : ts,
          });
        }
      });
    } else {
      // Append new tracking event (single fallback dedupe)
      const ts = new Date(eventTime);
      const existing = order.trackingHistory.some(
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
    }

    order.lastTrackedAt = new Date();
    await order.save();

    return NextResponse.json({ ok: true, message: "Tracking updated", orderId: String(order._id) });
  } catch (e) {
    console.error("Shipmozo webhook error:", e);
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
  return NextResponse.json({ ok: true, message: "Shipmozo webhook endpoint is live" });
}
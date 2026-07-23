import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import OrderModel from "@/models/Order.model";

async function getRouteId(contextOrRequest, maybeParams) {
  const params = contextOrRequest?.params || maybeParams || {};
  const resolvedParams = params && typeof params.then === "function" ? await params : params;
  const idFromParams = resolvedParams?.id || resolvedParams?.orderId || null;
  if (idFromParams) return idFromParams;

  const requestUrl = contextOrRequest?.url || contextOrRequest?.request?.url || "";
  if (!requestUrl) return null;

  const match = requestUrl.match(/\/api\/admin\/orders\/([^/?#]+)/i);
  return match?.[1] || null;
}

export async function GET(req, context) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const id = await getRouteId(context, req?.params);
    if (!id) return jsonRes(400, "Order id is required");

    const order = await OrderModel.findById(id).populate("user", "name email phone");
    if (!order) return jsonRes(404, "Order not found");
    return jsonRes(200, "Order fetched", order);
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Failed to fetch order");
  }
}

export async function PUT(req, context) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const id = await getRouteId(context, req?.params);
    if (!id) return jsonRes(400, "Order id is required");

    const body = await req.json().catch(() => ({}));
    const { status, paymentStatus, awbNumber, courierName, shipmozoOrderId } = body;
    const setDoc = {
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(awbNumber !== undefined ? { awbNumber: String(awbNumber || "") } : {}),
      ...(courierName !== undefined ? { courierName: String(courierName || "") } : {}),
      ...(shipmozoOrderId !== undefined ? { shipmozoOrderId: String(shipmozoOrderId || "") } : {}),
    };

    const updateOps = { $set: setDoc };

    // If AWB was assigned manually, append an event so timeline shows it
    if (awbNumber) {
      const existing = await OrderModel.findById(id).lean();
      const hasAwbEvent = (existing?.trackingHistory || []).some(
        (h) => (h.status || "").toLowerCase().includes("awb")
      );
      if (!hasAwbEvent) {
        updateOps.$push = {
          trackingHistory: {
            status: "AWB Assigned",
            remark: `AWB ${awbNumber} assigned${courierName ? ` via ${courierName}` : ""}`,
            timestamp: new Date(),
          },
        };
        setDoc.currentTrackingStatus = "AWB Assigned";
      }
    }

    const order = await OrderModel.findByIdAndUpdate(id, updateOps, { new: true });

    if (!order) return jsonRes(404, "Order not found");
    return jsonRes(200, "Order updated", order);
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Failed to update order");
  }
}

export async function DELETE(req, context) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const id = await getRouteId(context, req?.params);
    if (!id) return jsonRes(400, "Order id is required");

    const order = await OrderModel.findByIdAndDelete(id);
    if (!order) return jsonRes(404, "Order not found");
    return jsonRes(200, "Order deleted", order);
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Failed to delete order");
  }
}

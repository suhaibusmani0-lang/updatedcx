import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import OrderModel from "@/models/Order.model";
import { generateOrderPdf } from "@/lib/pdfSlip";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const resolvedParams = await params;
    const orderId = resolvedParams?.id;

    if (!orderId) return jsonRes(400, "Order id is required");

    let order = null;
    try {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await OrderModel.findById(orderId).populate("user", "name email phone");
      }
    } catch (err) {
      // ignore and fall back to a permissive lookup
    }

    if (!order) {
      order = await OrderModel.findOne({ _id: orderId }).populate("user", "name email phone");
    }

    if (!order) return jsonRes(404, "Order not found");

    const generatedPdfBuffer = await generateOrderPdf({
      order,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      totals: {
        subtotal: order.items?.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0),
        shipping: order.shippingCost || 0,
        discount: order.discount || 0,
        paymentDiscount: order.paymentDiscount || 0,
        totalAmount: order.totalAmount || 0,
      },
    });

    const pdfBuffer = Buffer.isBuffer(generatedPdfBuffer) ? generatedPdfBuffer : Buffer.from(generatedPdfBuffer);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="order-${String(order._id).slice(-6)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonRes(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}

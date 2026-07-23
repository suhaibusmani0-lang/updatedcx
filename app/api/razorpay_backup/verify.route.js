import { connectDB } from "@/lib/databaseConnection";
import { getSession } from "@/lib/auth";
import OrderModel from "@/models/Order.model";
import CartModel from "@/models/Cart.model";
import ProductModel from "@/models/Product.model";
import crypto from "crypto";

function jsonRes(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Please login to continue");

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonRes(400, "Incomplete payment details");
    }

    const order = await OrderModel.findOne({ _id: orderId, user: session.userId });
    if (!order) return jsonRes(404, "Order not found");

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return jsonRes(500, "Razorpay credentials are not configured");
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    if (!isAuthentic) return jsonRes(400, "Payment verification failed");

    for (const item of order.items) {
      const productId = item.product?.toString() || item.productId;
      if (!productId) continue;
      const product = await ProductModel.findById(productId);
      if (!product) continue;
      if (product.stock < item.qty) return jsonRes(400, `Insufficient stock for ${item.name}`);
    }

    for (const item of order.items) {
      const productId = item.product?.toString() || item.productId;
      if (!productId) continue;
      await ProductModel.findByIdAndUpdate(productId, { $inc: { stock: -item.qty } });
    }

    order.paymentStatus = "Paid";
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.status = "Processing";
    await order.save();

    await CartModel.findOneAndUpdate({ user: session.userId }, { items: [], totalAmount: 0 });

    return jsonRes(200, "Payment verified", { orderId: order._id });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Payment verification failed");
  }
}

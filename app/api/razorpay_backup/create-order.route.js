import { connectDB } from "@/lib/databaseConnection";
import { getSession } from "@/lib/auth";
import OrderModel from "@/models/Order.model";
import Razorpay from "razorpay";

function jsonRes(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Please login to continue");

    const { orderId, amount } = await req.json();
    if (!orderId || !amount) return jsonRes(400, "Invalid payment request");

    const order = await OrderModel.findOne({ _id: orderId, user: session.userId });
    if (!order) return jsonRes(404, "Order not found");

    const razorpay = getRazorpayClient();

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: String(order._id),
      notes: {
        orderId: String(order._id),
        userId: String(session.userId),
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return jsonRes(200, "Payment order created", {
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
    });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Payment initialization failed");
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/databaseConnection";
import OrderModel from "@/models/Order.model";

export async function POST(req) {
  try {
    await connectDB();
    
    // Sirf orderId catch karo
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ ok: false, message: "Order ID missing" }, { status: 400 });
    }

    await OrderModel.findByIdAndDelete(orderId);

    return NextResponse.json({ ok: true, message: "Order completely deleted due to payment failure" });
    
  } catch (error) {
    console.error("Payment failed API error:", error);
    return NextResponse.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
  }
}
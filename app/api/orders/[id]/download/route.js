import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/databaseConnection";
import { getSession } from "@/lib/auth";
import OrderModel from "@/models/Order.model";
import { generateOrderInvoicePdf } from "@/lib/pdfSlip";

export async function GET(_req, { params }) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, message: "Please login to download your invoice" }, { status: 401 });
    }

    await connectDB();

    const resolved = await params;
    const orderId = resolved?.id;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order id" }, { status: 400 });
    }

    const order = await OrderModel.findById(orderId).populate("user", "name email phone");
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const isOwner = String(order.user?._id || order.user) === String(session.userId);
    const isAdmin = session.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, message: "You are not authorised to view this invoice" }, { status: 403 });
    }

    const { pdfBuffer, invoiceNo } = await generateOrderInvoicePdf(order);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoiceNo}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error?.message || "Server Error" }, { status: 500 });
  }
}

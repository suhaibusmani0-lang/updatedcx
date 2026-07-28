import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin } from "@/lib/adminMiddleware";
import OrderModel from "@/models/Order.model";
import { generateOrderInvoicePdf } from "@/lib/pdfSlip";

export async function GET(_req, { params }) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
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

    const { pdfBuffer, invoiceNo } = await generateOrderInvoicePdf(order);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoiceNo}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error?.message || "Server Error" }, { status: 500 });
  }
}

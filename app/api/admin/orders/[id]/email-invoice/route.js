import { connectDB } from "@/lib/databaseConnection";
import OrderModel from "@/models/Order.model";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import { sendEmail } from "@/lib/sentMail";
import { generateOrderInvoicePdf } from "@/lib/pdfSlip";

export async function POST(_req, { params }) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const resolved = await params;
    const orderId = resolved?.id || resolved?.orderId;
    if (!orderId) return jsonRes(400, "Order id is required");

    const order = await OrderModel.findById(orderId).populate("user", "name email");
    if (!order) return jsonRes(404, "Order not found");

    const customerEmail = order.user?.email || order.billingAddress?.email;
    if (!customerEmail) return jsonRes(400, "Customer email not found");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const trackingLink = `${baseUrl}/track-order?orderId=${order._id}`;
    const orderCode = String(order._id).slice(-6).toUpperCase();

    const subject = `Invoice for Order #${orderCode}`;
    const html = `
      <div style="font-family:Georgia,'Times New Roman',serif;padding:30px;color:#1a1a1a;max-width:600px;border:1px solid #E3D9C9;border-radius:8px;">
        <h2 style="color:#142D4B;text-align:center;letter-spacing:3px;margin:0 0 8px;">COSMOPOLITAN XCESSORIES</h2>
        <p style="text-align:center;color:#8B6F52;font-size:12px;letter-spacing:2px;margin:0 0 20px;">INVOICE ATTACHED</p>
        <p>Hello <strong>${order.user?.name || "Valued Customer"}</strong>,</p>
        <p>Please find the invoice for your order <strong>#${orderCode}</strong> attached with this email.</p>
        <div style="background:#F8F3EA;padding:15px;border-radius:5px;margin:20px 0;">
          <p style="margin:0;"><strong>Total:</strong> Rs. ${(order.totalAmount || 0).toLocaleString("en-IN")}</p>
          <p style="margin:5px 0 0;"><strong>Status:</strong> ${order.status || "Processing"}</p>
        </div>
        <p style="text-align:center;">
          <a href="${trackingLink}" style="color:#8B6F52;font-weight:bold;text-decoration:underline;">Track your live order status</a>
        </p>
        <hr style="border:none;border-top:1px solid #F8F3EA;margin-top:30px;" />
        <p style="font-size:12px;color:#666;text-align:center;">If you have any questions, reply to this email.<br/>&copy; ${new Date().getFullYear()} Cosmopolitan Xccessories.</p>
      </div>`;

    const { pdfBuffer, invoiceNo } = await generateOrderInvoicePdf(order);

    await sendEmail(customerEmail, subject, html, [
      { filename: `${invoiceNo}.pdf`, content: pdfBuffer, contentType: "application/pdf" },
    ]);

    return jsonRes(200, "Invoice sent successfully");
  } catch (error) {
    console.error("Email invoice error:", error);
    return jsonRes(500, error?.message || "Failed to send invoice");
  }
}

import { connectDB } from "@/lib/databaseConnection";
import { getSession } from "@/lib/auth";
import { getFallbackShipping, getShiprocketShippingQuote } from "@/lib/shiprocket";
import OrderModel from "@/models/Order.model";
import UserModel from "@/models/User.model";
import CouponModel from "@/models/Coupon.model";
import CartModel from "@/models/Cart.model";
import ProductModel from "@/models/Product.model";
import { sendEmail } from "@/lib/sentMail";

function jsonRes(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

function buildConfirmationEmail({ userName, order }) {
  const orderCode = String(order._id).slice(-6).toUpperCase();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const trackingLink = `${baseUrl}/track-order?orderId=${order._id}`;
  const accountLink = `${baseUrl}/my-account?orderId=${order._id}`;
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #EFEAE0;">
            <div style="font-size:14px;color:#1A1A1A;">${item.name || "Product"}</div>
            <div style="font-size:12px;color:#8B6F52;">Qty: ${item.qty || 1}</div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #EFEAE0;text-align:right;font-size:14px;color:#1A1A1A;">
            Rs. ${((item.price || 0) * (item.qty || 1)).toLocaleString("en-IN")}
          </td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:600px;margin:0 auto;padding:32px;background:#FFFDF9;color:#1A1A1A;border:1px solid #E3D9C9;border-radius:10px;">
      <h1 style="text-align:center;letter-spacing:3px;color:#142D4B;margin:0 0 6px;font-size:22px;">COSMOPOLITAN XCESSORIES</h1>
      <p style="text-align:center;color:#8B6F52;font-size:12px;letter-spacing:2px;margin:0 0 24px;">ORDER CONFIRMED</p>

      <p style="font-size:15px;line-height:1.6;">Hello <strong>${userName || "Valued Customer"}</strong>,</p>
      <p style="font-size:15px;line-height:1.6;">Thank you for your order. We have received it and are getting things ready for you.</p>

      <div style="background:#F8F3EA;padding:16px 20px;border-radius:6px;margin:20px 0;">
        <div style="display:flex;justify-content:space-between;font-size:14px;">
          <strong>Order:</strong> <span>#${orderCode}</span>
        </div>
        <div style="font-size:14px;margin-top:6px;"><strong>Payment:</strong> ${order.paymentMethod || "N/A"}</div>
        <div style="font-size:14px;margin-top:6px;"><strong>Total:</strong> Rs. ${(order.totalAmount || 0).toLocaleString("en-IN")}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">${itemsHtml}</table>

      <div style="text-align:center;margin:26px 0;">
        <a href="${trackingLink}" style="display:inline-block;background:#142D4B;color:#ffffff;padding:12px 26px;text-decoration:none;border-radius:6px;font-weight:bold;letter-spacing:1px;font-size:13px;">TRACK ORDER</a>
      </div>

      <p style="font-size:13px;color:#555;text-align:center;line-height:1.6;">
        You can download your invoice anytime from your account:<br/>
        <a href="${accountLink}" style="color:#8B6F52;font-weight:bold;text-decoration:underline;">Go to My Account &rarr; Orders</a>
      </p>

      <hr style="border:none;border-top:1px solid #EFEAE0;margin:26px 0;" />
      <p style="font-size:12px;color:#888;text-align:center;line-height:1.6;">
        For any question, simply reply to this email.<br/>
        &copy; ${new Date().getFullYear()} Cosmopolitan Xccessories.
      </p>
    </div>`;
}

async function sendOrderConfirmation(order, user) {
  const to = user?.email || order?.billingAddress?.email;
  if (!to) return;

  const subject = `Order Confirmed - #${String(order._id).slice(-6).toUpperCase()}`;
  const html = buildConfirmationEmail({ userName: user?.name, order });

  try {
    await sendEmail(to, subject, html);
  } catch (err) {
    console.error("Order confirmation email failed:", err?.message || err);
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Please login to place an order");

    const { items, shippingAddress, billingAddress, couponCode, paymentMethod, hasGiftWrap } = await req.json();

    if (!items?.length) return jsonRes(400, "Cart is empty");
    if (!shippingAddress?.name || !shippingAddress?.phone || !shippingAddress?.address ||
        !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.pincode) {
      return jsonRes(400, "Complete shipping address is required");
    }
    if (!billingAddress?.name || !billingAddress?.phone || !billingAddress?.address ||
        !billingAddress?.city || !billingAddress?.state || !billingAddress?.pincode) {
      return jsonRes(400, "Complete billing address is required");
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shiprocketQuote = await getShiprocketShippingQuote({ pincode: shippingAddress.pincode, items });
    const shipping = shiprocketQuote?.shippingCharge ?? getFallbackShipping(subtotal);

    let discount = 0;
    if (couponCode) {
      const coupon = await CouponModel.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date()) && subtotal >= coupon.minOrder) {
        discount = coupon.type === "percent"
          ? Math.round((subtotal * coupon.value) / 100)
          : coupon.value;
        await CouponModel.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    }

    const normalizedPaymentMethod = paymentMethod === "COD" ? "COD" : "Razorpay";
    const paymentDiscount = normalizedPaymentMethod === "Razorpay" ? Math.round(subtotal * 0.1) : 0;
    const codFee = normalizedPaymentMethod === "COD" ? 59 : 0;
    const giftWrapCharge = hasGiftWrap ? 99 : 0;
    const totalAmount = Math.max(
      0,
      subtotal + shipping - discount - paymentDiscount + giftWrapCharge + codFee
    );

    for (const item of items) {
      const productId = item.productId || item.id;
      const product = await ProductModel.findById(productId);
      if (!product) return jsonRes(400, `Product not found: ${item.name}`);
      if (product.stock < item.qty) return jsonRes(400, `Insufficient stock for ${item.name}`);
    }

    const order = await OrderModel.create({
      user: session.userId,
      hasGiftWrap: !!hasGiftWrap,
      items: items.map((i) => ({
        product: i.productId || i.id,
        name: i.name,
        image: i.image,
        price: i.price,
        qty: i.qty,
      })),
      totalAmount,
      shippingAddress,
      billingAddress,
      shippingCost: shipping,
      shippingMethod: shiprocketQuote?.shippingMethod || "standard",
      courierName: shiprocketQuote?.courierName || "Standard",
      status: "Pending",
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: "Unpaid",
    });

    for (const item of items) {
      const productId = item.productId || item.id;
      await ProductModel.findByIdAndUpdate(productId, { $inc: { stock: -item.qty } });
    }

    // Clear the server-side cart so the user's next fetch doesn't re-hydrate old items
    await CartModel.findOneAndUpdate(
      { user: session.userId },
      { $set: { items: [] } }
    ).catch(() => null);

    // Send single, clean confirmation email (no PDF attachment, no download link)
    const user = await UserModel.findById(session.userId).lean();
    sendOrderConfirmation(order, user).catch((err) =>
      console.error("Confirmation email dispatch error:", err)
    );

    return jsonRes(201, "Order placed successfully", {
      orderId: order._id,
      totalAmount,
      shipping,
      discount,
      paymentDiscount,
      giftWrapCharge,
      paymentMethod: normalizedPaymentMethod,
    });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Internal Server Error");
  }
}

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Not authenticated");

    const orders = await OrderModel.find({ user: session.userId }).sort({ createdAt: -1 });
    return jsonRes(200, "Orders fetched", orders);
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Internal Server Error");
  }
}

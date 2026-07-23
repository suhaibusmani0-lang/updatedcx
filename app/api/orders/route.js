import { connectDB } from "@/lib/databaseConnection";
import { getSession } from "@/lib/auth";
import { getFallbackShipping, getShiprocketShippingQuote } from "@/lib/shiprocket";
import OrderModel from "@/models/Order.model";
import UserModel from "@/models/User.model";
// `pdfkit` is dynamically imported at runtime to avoid Next build-time bundling errors
import { sendEmail } from "@/lib/sentMail";

function jsonRes(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function POST(req) {
  try {
    await connectDB();

    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Please login to place an order");

    const { items, shippingAddress, billingAddress, couponCode, paymentMethod } = await req.json();

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

    // Basic coupon check
    if (couponCode) {
      const CouponModel = (await import("@/models/Coupon.model")).default;
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
    const totalAmount = Math.max(0, subtotal + shipping - discount - paymentDiscount);

    const ProductModel = (await import("@/models/Product.model")).default;
    for (const item of items) {
      const productId = item.productId || item.id;
      const product = await ProductModel.findById(productId);
      if (!product) return jsonRes(400, `Product not found: ${item.name}`);
      if (product.stock < item.qty) return jsonRes(400, `Insufficient stock for ${item.name}`);
    }

    const order = await OrderModel.create({
      user: session.userId,
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

    // Generate PDF order slip and email to customer
    try {
      const user = await UserModel.findById(session.userId).lean();

      // attempt to resolve shipping/billing from user's saved addresses when possible
      const pickAddress = (addr, userAddresses) => {
        if (!addr) return {};
        if (!userAddresses || !userAddresses.length) return addr;

        // if frontend passed an address id/reference, prefer that
        const addrId = addr._id || addr.addressId || addr.id || addr.address_id;
        if (addrId) {
          const foundById = userAddresses.find(a => String(a._id) === String(addrId));
          if (foundById) return foundById;
        }

        // try exact match by address text + pincode
        if (addr.address && addr.pincode) {
          const match = userAddresses.find(a => a.address === addr.address && a.pincode === addr.pincode);
          if (match) return match;
        }

        // if frontend sent a named type (Home/Office/Other), try that
        if (addr.type) {
          const byType = userAddresses.find(a => a.type === addr.type);
          if (byType) return byType;
        }

        // fallback to default address
        const def = userAddresses.find(a => a.isDefault);
        return def || addr;
      };

      const shipping = pickAddress(shippingAddress, user?.addresses);
      const billing = pickAddress(billingAddress, user?.addresses);

      const pdfBufferFromOrder = async (orderDoc, shippingAddr, billingAddr) => {
        // Use pdf-lib to avoid native fontkit dependency used by pdfkit
        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([595.28, 841.89]); // A4
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const drawText = (text, x, y, size = 12) => {
          page.drawText(text, { x, y, size, font: helveticaFont, color: rgb(0, 0, 0) });
        };

        let y = 800;
        drawText('Order Slip', 40, y, 18);
        y -= 30;

        drawText(`Order ID: ${String(orderDoc._id)}`, 40, y); y -= 16;
        drawText(`Date: ${new Date(orderDoc.createdAt).toLocaleString()}`, 40, y); y -= 24;

        drawText('Shipping Address', 40, y, 14); y -= 18;
        drawText(`${shippingAddr.name || ''}`, 40, y); y -= 14;
        drawText(`${shippingAddr.address || ''}`, 40, y); y -= 14;
        drawText(`${shippingAddr.city || ''}, ${shippingAddr.state || ''} - ${shippingAddr.pincode || ''}`, 40, y); y -= 14;
        if (shippingAddr.phone) { drawText(`${shippingAddr.phone}`, 40, y); y -= 14; }
        y -= 8;

        drawText('Billing Address', 40, y, 14); y -= 18;
        drawText(`${billingAddr.name || ''}`, 40, y); y -= 14;
        drawText(`${billingAddr.address || ''}`, 40, y); y -= 14;
        drawText(`${billingAddr.city || ''}, ${billingAddr.state || ''} - ${billingAddr.pincode || ''}`, 40, y); y -= 14;
        if (billingAddr.phone) { drawText(`${billingAddr.phone}`, 40, y); y -= 14; }
        y -= 8;

        drawText('Items', 40, y, 14); y -= 18;
        (orderDoc.items || []).forEach((it, idx) => {
          drawText(`${idx + 1}. ${it.name} x ${it.qty} — ₹${(it.price || 0).toLocaleString()}`, 40, y);
          y -= 14;
          if (y < 60) { /* simple pagination: add new page */
            const newPage = pdfDoc.addPage([595.28, 841.89]);
            y = 800;
            page = newPage;
          }
        });

        y -= 8;
        drawText(`Subtotal: ₹${(subtotal || 0).toLocaleString()}`, 40, y); y -= 14;
        drawText(`Shipping: ₹${(shipping || 0).toLocaleString ? shipping.toLocaleString() : shipping}`, 40, y); y -= 14;
        drawText(`Discount: ₹${(discount || 0).toLocaleString ? discount.toLocaleString() : discount}`, 40, y); y -= 14;
        drawText(`Payment Discount: ₹${(paymentDiscount || 0).toLocaleString ? paymentDiscount.toLocaleString() : paymentDiscount}`, 40, y); y -= 20;
        drawText(`Total: ₹${(totalAmount || 0).toLocaleString()}`, 40, y, 14);

        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
      };

      const pdfBuffer = await pdfBufferFromOrder(order, shipping, billing);

      const subject = `Thanks for your order — ${String(order._id).slice(-6)}`;
      const htmlBody = `<p>Hi ${user?.name || 'Customer'},</p>
        <p>Thanks for your order. Please find your order slip attached.</p>`;

      await sendEmail(user?.email || (order?.billingAddress?.email || ''), subject, htmlBody, [
        { filename: `order-${String(order._id).slice(-6)}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }
      ]).catch((e) => console.error('Failed to send order email:', e));
    } catch (err) {
      console.error('Failed to generate/send order PDF:', err);
    }

    return jsonRes(201, "Order placed successfully", {
      orderId: order._id,
      totalAmount,
      shipping,
      discount,
      paymentDiscount,
      paymentMethod: normalizedPaymentMethod,
    });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Internal Server Error");
  }
}

export async function GET(req) {
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

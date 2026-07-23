import { connectDB } from "@/lib/databaseConnection";
import CouponModel from "@/models/Coupon.model";

function jsonRes(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function POST(req) {
  try {
    await connectDB();
    const { code, subtotal } = await req.json();
    if (!code) return jsonRes(400, "Coupon code is required");

    const coupon = await CouponModel.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return jsonRes(404, "Invalid coupon code");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return jsonRes(400, "Coupon has expired");
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return jsonRes(400, "Coupon usage limit reached");
    if (subtotal < coupon.minOrder) return jsonRes(400, `Minimum order of ₹${coupon.minOrder} required`);

    const discount = coupon.type === "percent"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

    return jsonRes(200, `Coupon applied! You save ₹${discount}`, { discount, type: coupon.type, value: coupon.value });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Internal Server Error");
  }
}

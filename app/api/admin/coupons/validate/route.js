import { connectDB } from "@/lib/databaseConnection";
import CouponModel from "@/models/Coupon.model";
import { jsonRes } from "@/lib/adminMiddleware";

export async function POST(req) {
  try {
    await connectDB();
    const { code, subtotal } = await req.json();

    if (!code) return jsonRes(400, "Coupon code is required");
    if (!subtotal || subtotal <= 0) return jsonRes(400, "Invalid subtotal");

    const coupon = await CouponModel.findOne({ 
      code: code.toUpperCase(), 
      isActive: true 
    });

    if (!coupon) return jsonRes(404, "Invalid coupon code");

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return jsonRes(400, "Coupon has expired");
    }

    if (subtotal < coupon.minOrder) {
      return jsonRes(400, `Minimum order amount is ₹${coupon.minOrder}`);
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return jsonRes(400, "Coupon usage limit reached");
    }

    const discount = coupon.type === "percent"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

    return jsonRes(200, "Coupon applied successfully", { discount, coupon });
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

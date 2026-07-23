import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import CouponModel from "@/models/Coupon.model";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const coupons = await CouponModel.find().sort({ createdAt: -1 });
    return jsonRes(200, "Coupons fetched", coupons);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

export async function POST(req) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();
    const { code, type, value } = body;
    if (!code || !type || value === undefined) return jsonRes(400, "Code, type and value are required");
    const exists = await CouponModel.findOne({ code: code.toUpperCase() });
    if (exists) return jsonRes(400, "Coupon code already exists");
    const coupon = await CouponModel.create({ ...body, code: code.toUpperCase() });
    return jsonRes(201, "Coupon created", coupon);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

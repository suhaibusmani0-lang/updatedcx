import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import CouponModel from "@/models/Coupon.model";

export async function PUT(req, { params }) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();
    const coupon = await CouponModel.findByIdAndUpdate(params.id, body, { new: true });
    if (!coupon) return jsonRes(404, "Coupon not found");
    return jsonRes(200, "Coupon updated", coupon);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

export async function DELETE(_, { params }) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    await CouponModel.findByIdAndDelete(params.id);
    return jsonRes(200, "Coupon deleted");
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

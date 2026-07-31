import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import UserModel from "@/models/User.model";
import ProductModel from "@/models/Product.model";
import OrderModel from "@/models/Order.model";
import CategoryModel from "@/models/Category.model";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const [users, products, orders, categories] = await Promise.all([
      UserModel.countDocuments({ role: "user" }),
      ProductModel.countDocuments(),
      OrderModel.countDocuments(),
      CategoryModel.countDocuments(),
    ]);
    const revenue = await OrderModel.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    return jsonRes(200, "Stats fetched", {
      users, products, orders, categories,
      revenue: revenue[0]?.total || 0,
    });
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import OrderModel from "@/models/Order.model";
import ProductModel from "@/models/Product.model";
import UserModel from "@/models/User.model";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRevenue, totalOrders, totalCustomers, totalProducts, recentOrders] = await Promise.all([
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      OrderModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      UserModel.countDocuments({ role: "user" }),
      ProductModel.countDocuments({ isActive: true }),
      OrderModel.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const revenue = totalRevenue[0]?.total || 0;
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const [previousRevenue, previousOrders] = await Promise.all([
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: previousMonthStart, $lt: previousMonthEnd } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      OrderModel.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: previousMonthEnd } }),
    ]);

    const prevRevenue = previousRevenue[0]?.total || 0;
    const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersChange = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;

    return jsonRes(200, "Dashboard stats fetched", {
      revenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      revenueChange: revenueChange.toFixed(1),
      ordersChange: ordersChange.toFixed(1),
      recentOrders: recentOrders.map(order => ({
        id: `#ORD-${order._id.toString().slice(-6)}`,
        customer: order.user?.name || "Unknown",
        product: order.items[0]?.name || "Multiple items",
        amount: `₹${order.totalAmount.toLocaleString()}`,
        status: order.status,
        createdAt: order.createdAt,
      })),
    });
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import OrderModel from "@/models/Order.model";

export async function GET(req) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const query = status ? { status } : {};
    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      OrderModel.countDocuments(query),
    ]);

    return jsonRes(200, "Orders fetched", {
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Failed to fetch orders");
  }
}

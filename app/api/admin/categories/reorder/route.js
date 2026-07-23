import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import CategoryModel from "@/models/Category.model";

/**
 * Reorder categories.
 * Accepts either:
 *  { orders: [{ id: "<catId>", sortOrder: 1 }, ...] }
 * or
 *  { ids: ["<catId>", "<catId>", ...] } — position = sortOrder (0-indexed)
 */
export async function POST(req) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));

    let updates = [];
    if (Array.isArray(body.orders)) {
      updates = body.orders
        .filter((o) => o && o.id)
        .map((o) => ({ id: String(o.id), sortOrder: Number(o.sortOrder ?? 0) }));
    } else if (Array.isArray(body.ids)) {
      updates = body.ids.map((id, idx) => ({ id: String(id), sortOrder: idx }));
    } else {
      return jsonRes(400, "Provide `orders` or `ids` array to reorder");
    }

    if (!updates.length) return jsonRes(400, "No categories to reorder");

    await Promise.all(
      updates.map((u) =>
        CategoryModel.updateOne({ _id: u.id }, { $set: { sortOrder: u.sortOrder } })
      )
    );

    return jsonRes(200, "Categories reordered", { count: updates.length });
  } catch (e) {
    console.error("reorder categories error:", e);
    return jsonRes(500, e instanceof Error ? e.message : "Failed to reorder");
  }
}

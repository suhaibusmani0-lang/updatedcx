import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import ProductModel from "@/models/Product.model";
import { parseBulkInventoryUpdates } from "@/lib/bulkInventory";

export async function POST(req) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return jsonRes(400, "Invalid request body");
    }

    const { updates = [], bulkText = "" } = body;
    const items = Array.isArray(updates) && updates.length > 0
      ? updates
      : parseBulkInventoryUpdates(bulkText).updates;

    if (!items.length) {
      return jsonRes(400, "No inventory updates were provided");
    }

    const results = [];
    for (const item of items) {
      const product = await ProductModel.findOne({ sku: item.sku });
      if (!product) {
        results.push({ sku: item.sku, status: "missing" });
        continue;
      }

      product.stock = Number(item.stock) || 0;
      await product.save();
      results.push({ sku: item.sku, status: "updated", stock: product.stock });
    }

    return jsonRes(200, "Inventory updated", { results });
  } catch (error) {
    console.error("Inventory update error:", error);
    return jsonRes(500, error instanceof Error ? error.message : "Failed to update inventory");
  }
}

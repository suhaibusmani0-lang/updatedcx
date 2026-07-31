import { connectDB } from "@/lib/databaseConnection";
import { jsonRes } from "@/lib/adminMiddleware";
import CategoryModel from "@/models/Category.model";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug")?.trim().toLowerCase();

    if (!slug) {
      return jsonRes(400, "Slug is required");
    }

    const exists = await CategoryModel.findOne({ slug, isDeleted: { $ne: true } });
    return jsonRes(200, "Slug checked", { available: !exists });
  } catch (error) {
    return jsonRes(500, error instanceof Error ? error.message : "Failed to check slug");
  }
}

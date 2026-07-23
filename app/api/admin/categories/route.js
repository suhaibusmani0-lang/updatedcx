import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import CategoryModel from "@/models/Category.model";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    await connectDB();
    const categories = await CategoryModel.find({ isDeleted: false }).sort({ createdAt: -1 });
    return jsonRes(200, "Categories fetched", categories);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

export async function POST(req) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const formData = await req.formData();
    const name = formData.get("name");
    const slug = formData.get("slug");
    const description = formData.get("description") || "";
    const imageFile = formData.get("image");
    const parent = formData.get("parent")?.toString().trim() || "";
    const isActive = formData.get("isActive") === "true";

    if (!name || !slug) return jsonRes(400, "Name and slug are required");

    const exists = await CategoryModel.findOne({ slug });
    if (exists) return jsonRes(400, "Slug already exists");

    let imageData = { url: "", public_id: "" };
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "categories", resource_type: "image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      imageData = { url: result.secure_url, public_id: result.public_id };
    }

    const category = await CategoryModel.create({
      name,
      slug,
      description,
      image: imageData,
      parent: parent || undefined,
      isActive,
    });
    return jsonRes(201, "Category created", category);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

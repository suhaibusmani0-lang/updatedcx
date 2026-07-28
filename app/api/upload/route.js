import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import MediaModel from "@/models/media.model";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const media = await MediaModel.find({ isDeleted: false }).sort({ createdAt: -1 });
    return jsonRes(200, "Media fetched", media);
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
    const file = formData.get("file");
    const alt = formData.get("alt") || "";
    const title = formData.get("title") || "";

    if (!file || file.size === 0) return jsonRes(400, "File is required");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "media", resource_type: "image" },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      ).end(buffer);
    });

    const media = await MediaModel.create({
      assetId: result.asset_id,
      publicId: result.public_id,
      path: result.secure_url,
      thumbnailUrl: result.secure_url,
      alt,
      title: title || file.name,
    });

    return jsonRes(201, "Media uploaded", media);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

export async function DELETE(req) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return jsonRes(400, "Media ID is required");

    const media = await MediaModel.findById(id);
    if (!media) return jsonRes(404, "Media not found");

    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId);
    }

    media.isDeleted = true;
    media.deletedAt = new Date();
    await media.save();

    return jsonRes(200, "Media deleted");
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

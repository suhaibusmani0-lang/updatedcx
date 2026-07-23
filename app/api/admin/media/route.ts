import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import MediaModel from "@/models/media.model";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest } from "next/server";

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
  } catch (error) {
    return jsonRes(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();
    const files = body.files;

    if (!files || !files.length) return jsonRes(400, "Files are required");

    const saved = await Promise.all(
      files.map((file: any) =>
        MediaModel.create({
          assetId: file.asset_id,
          publicId: file.public_id,
          path: file.secure_url,
          thumbnailUrl: file.secure_url,
          alt: "",
          title: file.original_filename || file.public_id,
          isDeleted: false,
        })
      )
    );

    return jsonRes(200, "Media uploaded successfully", saved);
  } catch (error) {
    return jsonRes(500, error instanceof Error ? error.message : "Upload failed");
  }
}

export async function PUT(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();
    const { id, title, alt } = body;

    if (!id) return jsonRes(400, "Media ID is required");

    const media = await MediaModel.findById(id);
    if (!media) return jsonRes(404, "Media not found");

    if (typeof title === "string") media.title = title;
    if (typeof alt === "string") media.alt = alt;

    await media.save();
    return jsonRes(200, "Media updated successfully", media);
  } catch (error) {
    return jsonRes(500, error instanceof Error ? error.message : "Update failed");
  }
}

export async function DELETE(req: NextRequest) {
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
      try {
        await cloudinary.uploader.destroy(media.publicId, { resource_type: "image" });
      } catch {}
    }

    media.isDeleted = true;
    media.deletedAt = new Date();
    await media.save();

    return jsonRes(200, "Media deleted successfully");
  } catch (error) {
    return jsonRes(500, error instanceof Error ? error.message : "Delete failed");
  }
}

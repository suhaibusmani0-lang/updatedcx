import { v2 as cloudinary } from "cloudinary";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    const body = await request.json();
    const paramsToSign = body?.paramsToSign;
    if (!paramsToSign || typeof paramsToSign !== "object") return jsonRes(400, "Upload signing parameters are required");

    const timestamp = Number(paramsToSign.timestamp);
    if (!Number.isInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 600) {
      return jsonRes(400, "Invalid or expired upload timestamp");
    }

    const folder = String(paramsToSign.folder || "");
    if (!/^products(?:\/[a-z0-9_-]+)*$/i.test(folder)) return jsonRes(400, "Invalid upload folder");

    const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, process.env.CLOUDINARY_API_SECRET);
    return jsonRes(200, "Signature generated", { signature });
  } catch (error) {
    console.error("Cloudinary signature error:", error);
    return jsonRes(500, "Failed to generate upload signature");
  }
}

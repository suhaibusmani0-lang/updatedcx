import { connectDB } from "@/lib/databaseConnection";
import ProductModel from "@/models/Product.model";
import { jsonRes, requireAdmin } from "@/lib/adminMiddleware";
import cloudinary from "@/lib/cloudinary";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await ProductModel.findOne({ _id: id, isDeleted: { $ne: true } }).populate("category", "_id name");
    if (!product) return jsonRes(404, "Product not found");
    return jsonRes(200, "Product fetched", product);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

function numberOrNull(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function uploadLegacyFile(file, resourceType, folder) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder, resource_type: resourceType, quality: "auto", fetch_format: "auto" }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }).end(buffer);
  });
}

export async function PUT(req, { params }) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const { id } = await params;
    const existing = await ProductModel.findById(id);
    if (!existing) return jsonRes(404, "Product not found");

    const contentType = req.headers.get("content-type") || "";
    const updateData = {};
    let body = {};
    let formData = null;

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        if (key === "sizes" || key === "colors" || key === "deleteImages" || key === "newImages" || key === "video" || key === "variants") continue;
        body[key] = typeof value === "string" ? value : value;
      }
      body.sizes = formData.getAll("sizes");
      body.colors = formData.getAll("colors");
      body.deleteImages = formData.getAll("deleteImages");
      body.newImages = formData.getAll("newImages");
      body.videoFile = formData.get("video");
      try { body.variants = JSON.parse(formData.get("variants") || "[]"); } catch { body.variants = []; }
    }

    for (const field of ["name", "slug", "sku", "description", "shortDescription", "badge"]) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    for (const field of ["isFeatured", "isNewArrival", "isBestSeller", "isActive"]) {
      if (body[field] !== undefined) updateData[field] = body[field] === true || body[field] === "true";
    }

    if (body.price !== undefined && body.price !== "") {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) return jsonRes(400, "Price must be a positive number");
      updateData.price = price;
    }

    if (body.salePrice !== undefined) {
      const salePrice = numberOrNull(body.salePrice);
      if (salePrice !== null && salePrice < 0) return jsonRes(400, "Sale price must be non-negative");
      const effectivePrice = updateData.price ?? existing.price;
      if (salePrice !== null && salePrice > effectivePrice) return jsonRes(400, "Sale price cannot be greater than regular price");
      updateData.salePrice = salePrice;
    }

    if (body.stock !== undefined) {
      const stock = Number.parseInt(body.stock, 10);
      if (!Number.isFinite(stock) || stock < 0) return jsonRes(400, "Stock must be a non-negative number");
      updateData.stock = stock;
    }

    if (Array.isArray(body.sizes)) updateData.sizes = body.sizes.map(String).map((v) => v.trim()).filter(Boolean);
    if (Array.isArray(body.colors)) updateData.colors = body.colors.map(String).map((v) => v.trim()).filter(Boolean);
    if (Array.isArray(body.variants)) {
      updateData.variants = body.variants.map((variant) => ({
        size: variant?.size ? String(variant.size) : "",
        color: variant?.color ? String(variant.color) : "",
        stock: Math.max(0, Number.parseInt(variant?.stock ?? 0, 10) || 0),
        sku: variant?.sku ? String(variant.sku) : "",
        price: numberOrNull(variant?.price),
        salePrice: numberOrNull(variant?.salePrice),
        image: variant?.image ? String(variant.image) : "",
      }));
    }

    let currentImages = [...(existing.images || [])];
    const deletePublicIds = Array.isArray(body.deleteImages) ? body.deleteImages.filter(Boolean) : [];
    if (deletePublicIds.length) {
      await Promise.all(deletePublicIds.map(async (publicId) => {
        try { await cloudinary.uploader.destroy(publicId, { resource_type: "image" }); } catch (error) { console.error("Image delete failed", error); }
      }));
      currentImages = currentImages.filter((img) => !deletePublicIds.includes(img.public_id));
    }

    if (Array.isArray(body.newImages)) {
      const incoming = body.newImages.filter((image) => image?.url).map((image) => ({ url: String(image.url), public_id: image.public_id ? String(image.public_id) : "" }));
      currentImages = [...currentImages, ...incoming];
    }

    if (formData && body.newImages?.some((file) => file && typeof file.arrayBuffer === "function")) {
      const incomingFiles = body.newImages.filter((file) => file && typeof file.arrayBuffer === "function");
      const uploaded = await Promise.all(incomingFiles.map(async (file) => {
        const result = await uploadLegacyFile(file, "image", "products");
        return { url: result.secure_url, public_id: result.public_id };
      }));
      currentImages = [...currentImages, ...uploaded];
    }
    updateData.images = currentImages;

    const removeVideo = body.removeVideo === true || body.removeVideo === "true";
    const incomingVideo = body.video && typeof body.video === "object" ? body.video : null;
    const legacyVideo = body.videoFile && typeof body.videoFile.arrayBuffer === "function" ? body.videoFile : null;

    if (removeVideo && existing.video?.public_id) {
      try { await cloudinary.uploader.destroy(existing.video.public_id, { resource_type: "video" }); } catch (error) { console.error("Video delete failed", error); }
      updateData.video = { url: "", public_id: "", duration: 0, format: "" };
    }

    if (incomingVideo?.url) {
      const duration = Number(incomingVideo.duration || 0);
      if (duration > 30.05) return jsonRes(400, "Product video must be 30 seconds or shorter");
      if (existing.video?.public_id && existing.video.public_id !== incomingVideo.public_id) {
        try { await cloudinary.uploader.destroy(existing.video.public_id, { resource_type: "video" }); } catch {}
      }
      updateData.video = {
        url: String(incomingVideo.url),
        public_id: incomingVideo.public_id ? String(incomingVideo.public_id) : "",
        duration,
        format: incomingVideo.format ? String(incomingVideo.format) : "",
      };
    } else if (legacyVideo) {
      const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
      if (!allowed.includes(legacyVideo.type)) return jsonRes(400, "Product video must be MP4, WebM, or MOV.");
      if (legacyVideo.size > 50 * 1024 * 1024) return jsonRes(400, "Product video must be 50MB or smaller.");
      const result = await uploadLegacyFile(legacyVideo, "video", "products/videos");
      const duration = Number(result.duration || 0);
      if (duration > 30.05) return jsonRes(400, "Product video must be 30 seconds or shorter.");
      if (existing.video?.public_id) { try { await cloudinary.uploader.destroy(existing.video.public_id, { resource_type: "video" }); } catch {} }
      updateData.video = { url: result.secure_url, public_id: result.public_id, duration, format: result.format || "mp4" };
    }

    const product = await ProductModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    return jsonRes(200, "Product updated", product);
  } catch (e) {
    console.error("[Admin Product PUT]", e);
    return jsonRes(500, e?.message || "Failed to update product");
  }
}

export async function DELETE(req, { params }) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const product = await ProductModel.findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, { isDeleted: true, isActive: false, deletedAt: new Date() }, { new: true });
    if (!product) return jsonRes(404, "Product not found");
    return jsonRes(200, `'${product.name}' moved to recycle bin`);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

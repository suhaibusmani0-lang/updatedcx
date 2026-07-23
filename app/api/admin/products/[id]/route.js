// app/api/admin/products/[id]/route.js
import { connectDB } from "@/lib/databaseConnection";
import ProductModel from "@/models/Product.model";
import { jsonRes } from "@/lib/adminMiddleware";
import cloudinary from "@/lib/cloudinary";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await ProductModel.findOne({ _id: id, isDeleted: { $ne: true } })
      .populate("category", "_id name");
    if (!product) return jsonRes(404, "Product not found");
    return jsonRes(200, "Product fetched", product);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const existing = await ProductModel.findById(id);
    if (!existing) return jsonRes(404, "Product not found");

    const formData = await req.formData();
    const updateData = {};
    const newImageFiles = [];
    const deletePublicIds = [];

    for (const [key, value] of formData.entries()) {
      if (key === "newImages") {
        newImageFiles.push(value);
      } else if (key === "deleteImages") {
        deletePublicIds.push(value);
      } else if (key !== "images") {
        updateData[key] = value;
      }
    }

    // Convert numeric fields
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.salePrice !== undefined) {
      updateData.salePrice = updateData.salePrice ? parseFloat(updateData.salePrice) : 0;
    }
    if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock);

    // Boolean fields
    ["isFeatured", "isNewArrival", "isBestSeller", "isActive"].forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = updateData[field] === "true";
      }
    });

    // Handle image deletions from Cloudinary
    let currentImages = [...(existing.images || [])];
    if (deletePublicIds.length > 0) {
      await Promise.all(
        deletePublicIds.map(publicId => cloudinary.uploader.destroy(publicId))
      );
      currentImages = currentImages.filter(img => !deletePublicIds.includes(img.public_id));
    }

    // Upload new images to Cloudinary
    if (newImageFiles.length > 0) {
      const uploadedImages = await Promise.all(
        newImageFiles.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: "products" },
              (error, result) => {
                if (error) reject(error);
                else resolve({ url: result.secure_url, public_id: result.public_id });
              }
            ).end(buffer);
          });
        })
      );
      currentImages = [...currentImages, ...uploadedImages];
    }

    updateData.images = currentImages;

    const product = await ProductModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: false });
    return jsonRes(200, "Product updated", product);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await ProductModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, isActive: false, deletedAt: new Date() },
      { new: true }
    );
    if (!product) return jsonRes(404, "Product not found");
    return jsonRes(200, `'${product.name}' moved to recycle bin`);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}
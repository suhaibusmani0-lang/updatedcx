import { connectDB } from "@/lib/databaseConnection";
import ProductModel from "@/models/Product.model";
import ReviewModel from "@/models/Review.model";
import { jsonRes } from "@/lib/adminMiddleware";
import { v2 as cloudinary } from "cloudinary";

// ==========================================
// GET METHOD (Exact code you provided)
// ==========================================
export async function GET(_, { params }) {
  try {
    await connectDB();
    const { slug } = await params;
    const product = await ProductModel.findOne({ slug, isActive: true })
      .populate("category", "name slug description image");

    if (!product) return jsonRes(404, "Product not found");

    const reviews = await ReviewModel.find({ product: product._id, isApproved: true })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(10);

    const relatedProducts = await ProductModel.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .populate("category", "name slug")
      .limit(8);

    return jsonRes(200, "Product fetched", { product, reviews, relatedProducts });
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

// ==========================================
// PUT METHOD (With the fixed async/await upload)
// ==========================================
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const formData = await request.formData();
    
    // Make sure "images" matches the field name coming from your frontend
    const files = formData.getAll("images"); 
    
    if (!files || files.length === 0) {
      return jsonRes(400, "No files uploaded");
    }

    // 🔥 FIX: Added 'async' directly before (file) so await arrayBuffer() works
    const uploadPromises = files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "products/variants", resource_type: "image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      return result;
    });

    // Wait for all image uploads to finish
    const uploadedImages = await Promise.all(uploadPromises);

    // ---------------------------------------------------------
    // TODO: Add your logic here to save the image URLs to your DB
    // Example:
    // await ProductModel.findByIdAndUpdate(id, {
    //   $push: { images: { $each: uploadedImages.map(img => img.secure_url) } }
    // });
    // ---------------------------------------------------------

    return jsonRes(200, "Images uploaded successfully", { images: uploadedImages });

  } catch (error) {
    console.error("API Error in products/[id]/route.js:", error);
    return jsonRes(500, error.message || "Internal Server Error");
  }
}
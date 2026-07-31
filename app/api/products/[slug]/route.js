import { connectDB } from "@/lib/databaseConnection";
import ProductModel from "@/models/Product.model";
import ReviewModel from "@/models/Review.model";
import { jsonRes } from "@/lib/adminMiddleware";

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

import { connectDB } from "@/lib/databaseConnection";
import { getSession } from "@/lib/auth";
import ReviewModel from "@/models/Review.model";
import ProductModel from "@/models/Product.model";
import { jsonRes } from "@/lib/adminMiddleware";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const query = { isApproved: true };
    if (productId) query.product = productId;

    const [reviews, total] = await Promise.all([
      ReviewModel.find(query)
        .populate("user", "name avatar")
        .populate("product", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ReviewModel.countDocuments(query),
    ]);

    return jsonRes(200, "Reviews fetched", { reviews, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Not authenticated");

    const { productId, rating, comment } = await req.json();
    if (!productId || !rating) return jsonRes(400, "Product ID and rating are required");
    if (rating < 1 || rating > 5) return jsonRes(400, "Rating must be between 1 and 5");

    const product = await ProductModel.findById(productId);
    if (!product) return jsonRes(404, "Product not found");

    const existingReview = await ReviewModel.findOne({ user: session.userId, product: productId });
    if (existingReview) return jsonRes(400, "You have already reviewed this product");

    const review = await ReviewModel.create({
      user: session.userId,
      product: productId,
      rating,
      comment: comment || "",
      isApproved: true,
    });

    await review.populate("user", "name avatar");

    const allReviews = await ReviewModel.find({ product: productId, isApproved: true });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await ProductModel.findByIdAndUpdate(productId, {
      "ratings.average": avgRating,
      "ratings.count": allReviews.length,
    });

    return jsonRes(201, "Review submitted", review);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

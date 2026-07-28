import { connectDB } from "@/lib/databaseConnection";
import { getSession } from "@/lib/auth";
import ReviewModel from "@/models/Review.model";
import ProductModel from "@/models/Product.model";
import { jsonRes } from "@/lib/adminMiddleware";

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Not authenticated");

    const { rating, comment } = await req.json();
    if (!rating) return jsonRes(400, "Rating is required");
    if (rating < 1 || rating > 5) return jsonRes(400, "Rating must be between 1 and 5");

    const review = await ReviewModel.findById(params.id);
    if (!review) return jsonRes(404, "Review not found");
    if (review.user.toString() !== session.userId) return jsonRes(403, "Not authorized");

    review.rating = rating;
    review.comment = comment || review.comment;
    await review.save();

    const allReviews = await ReviewModel.find({ product: review.product, isApproved: true });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await ProductModel.findByIdAndUpdate(review.product, {
      "ratings.average": avgRating,
      "ratings.count": allReviews.length,
    });

    await review.populate("user", "name avatar");
    return jsonRes(200, "Review updated", review);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

export async function DELETE(_, { params }) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Not authenticated");

    const review = await ReviewModel.findById(params.id);
    if (!review) return jsonRes(404, "Review not found");
    if (review.user.toString() !== session.userId) return jsonRes(403, "Not authorized");

    const productId = review.product;
    await ReviewModel.findByIdAndDelete(params.id);

    const allReviews = await ReviewModel.find({ product: productId, isApproved: true });
    const avgRating = allReviews.length > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
      : 0;
    
    await ProductModel.findByIdAndUpdate(productId, {
      "ratings.average": avgRating,
      "ratings.count": allReviews.length,
    });

    return jsonRes(200, "Review deleted");
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

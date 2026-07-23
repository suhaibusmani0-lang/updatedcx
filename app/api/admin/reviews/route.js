import { connectDB } from '@/lib/databaseConnection';
import { requireAdmin, jsonRes } from '@/lib/adminMiddleware';
import ReviewModel from '@/models/Review.model';
import ProductModel from '@/models/Product.model';

async function recalcProductRatings(productId) {
  const all = await ReviewModel.find({ product: productId, isApproved: true });
  if (!all.length) {
    await ProductModel.findByIdAndUpdate(productId, { 'ratings.average': 0, 'ratings.count': 0 });
    return;
  }
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  await ProductModel.findByIdAndUpdate(productId, { 'ratings.average': avg, 'ratings.count': all.length });
}

export async function GET(request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const approved = searchParams.get('approved');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query = {};
    if (productId) query.product = productId;
    if (approved === 'true') query.isApproved = true;
    if (approved === 'false') query.isApproved = false;

    const [reviews, total] = await Promise.all([
      ReviewModel.find(query)
        .populate('user', 'name email')
        .populate('product', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ReviewModel.countDocuments(query),
    ]);

    return jsonRes(200, 'Admin reviews fetched', { reviews, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : String(e));
  }
}

export async function PUT(request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const payload = await request.json();
    const { id, isApproved } = payload;
    if (!id || typeof isApproved !== 'boolean') return jsonRes(400, 'id and isApproved are required');

    const review = await ReviewModel.findById(id);
    if (!review) return jsonRes(404, 'Review not found');

    review.isApproved = isApproved;
    await review.save();

    // recalc product ratings when approval changes
    await recalcProductRatings(review.product);

    return jsonRes(200, 'Review updated', review);
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : String(e));
  }
}

export async function DELETE(request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return jsonRes(400, 'Review id is required');

    const review = await ReviewModel.findById(id);
    if (!review) return jsonRes(404, 'Review not found');

    const productId = review.product;
    await review.remove();

    // recalc product ratings after deletion
    await recalcProductRatings(productId);

    return jsonRes(200, 'Review deleted');
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : String(e));
  }
}

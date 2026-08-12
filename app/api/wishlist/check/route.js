import { connectDB } from "@/lib/databaseConnection";
import { getSession } from "@/lib/auth";
import WishlistModel from "@/models/Wishlist.model";
import { jsonRes } from "@/lib/adminMiddleware";

export async function GET(req) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Not authenticated");

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) return jsonRes(400, "Product ID is required");

    const wishlist = await WishlistModel.findOne({ user: session.userId });
    const isInWishlist = wishlist
      ? wishlist.items.some((item) => item.product.toString() === productId)
      : false;

    return jsonRes(200, "Wishlist check", { isInWishlist });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Internal Server Error");
  }
}

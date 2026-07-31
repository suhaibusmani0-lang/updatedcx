import { connectDB } from "@/lib/databaseConnection";
import { getSession } from "@/lib/auth";
import WishlistModel from "@/models/Wishlist.model";
import ProductModel from "@/models/Product.model";
import { jsonRes } from "@/lib/adminMiddleware";

export async function GET(req) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Not authenticated");

    const wishlist = await WishlistModel.findOne({ user: session.userId })
      .populate("items.product", "name images price salePrice stock slug isActive badge")
      .sort({ "items.addedAt": -1 });

    if (!wishlist) return jsonRes(200, "Wishlist fetched", { items: [] });

    const validItems = wishlist.items.filter(item => item.product && item.product.isActive);
    if (validItems.length !== wishlist.items.length) {
      wishlist.items = validItems;
      await wishlist.save();
    }

    return jsonRes(200, "Wishlist fetched", wishlist);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Not authenticated");

    const { productId } = await req.json();
    if (!productId) return jsonRes(400, "Product ID is required");

    const product = await ProductModel.findById(productId);
    if (!product) return jsonRes(404, "Product not found");
    if (!product.isActive) return jsonRes(400, "Product is not available");

    let wishlist = await WishlistModel.findOne({ user: session.userId });
    if (!wishlist) {
      wishlist = await WishlistModel.create({ user: session.userId, items: [] });
    }

    const exists = wishlist.items.some(item => item.product.toString() === productId);
    if (exists) return jsonRes(400, "Product already in wishlist");

    wishlist.items.push({
      product: productId,
      addedAt: new Date(),
    });

    await wishlist.save();
    await wishlist.populate("items.product", "name images price salePrice stock slug isActive badge");
    return jsonRes(200, "Product added to wishlist", wishlist);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session?.userId) return jsonRes(401, "Not authenticated");

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) return jsonRes(400, "Product ID is required");

    const wishlist = await WishlistModel.findOne({ user: session.userId });
    if (!wishlist) return jsonRes(404, "Wishlist not found");

    wishlist.items = wishlist.items.filter(item => item.product.toString() !== productId);
    await wishlist.save();
    await wishlist.populate("items.product", "name images price salePrice stock slug isActive badge");
    return jsonRes(200, "Product removed from wishlist", wishlist);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

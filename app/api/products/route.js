import { connectDB } from "@/lib/databaseConnection";
import ProductModel from "@/models/Product.model";
import CategoryModel from "@/models/Category.model";
import { jsonRes } from "@/lib/adminMiddleware";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const priceRanges = (searchParams.get("priceRanges") || "").split(",").filter(Boolean);
    const sort = searchParams.get("sort") || "newest";
    const isFeatured = searchParams.get("isFeatured") === "true";
    const isNewArrival = searchParams.get("isNewArrival") === "true";
    const isBestSeller = searchParams.get("isBestSeller") === "true";
    const isSale = searchParams.get("isSale") === "true";

    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    
    if (category) {
      const categoryDoc = await CategoryModel.findOne({ slug: category, isActive: true, isDeleted: false });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }
    
if (priceRanges.length) {
      const rangeQueries = priceRanges.map((range) => {
        switch (range) {
          case "under500":
            return { price: { $lt: 500 } };
          case "500-1000":
            return { price: { $gte: 500, $lte: 1000 } };
          case "1000-2000":
            return { price: { $gte: 1000, $lte: 2000 } };
          case "2000-5000":
            return { price: { $gte: 2000, $lte: 5000 } };
          case "above5000":
            return { price: { $gt: 5000 } };
          default:
            return null;
        }
      }).filter(Boolean);

      if (rangeQueries.length) {
        query.$or = rangeQueries;
      }
    }

    if (isFeatured) query.isFeatured = true;
    if (isNewArrival) query.isNewArrival = true;
    if (isBestSeller) query.isBestSeller = true;
    if (isSale) query.salePrice = { $exists: true, $ne: null };

    let sortOption = {};
    switch (sort) {
      case "price-low":
        sortOption = { price: 1 };
        break;
      case "price-high":
        sortOption = { price: -1 };
        break;
      case "popular":
        sortOption = { "ratings.count": -1 };
        break;
      case "rating":
        sortOption = { "ratings.average": -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const [products, total] = await Promise.all([
      ProductModel.find(query)
        .populate("category", "name slug")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit),
      ProductModel.countDocuments(query),
    ]);

    return jsonRes(200, "Products fetched", { 
      products, 
      total, 
      page, 
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total 
    });
  } catch (e) {
    return jsonRes(500, e.message);
  }
}
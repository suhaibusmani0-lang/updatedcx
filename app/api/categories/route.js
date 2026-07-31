import { connectDB } from "@/lib/databaseConnection";
import CategoryModel from "@/models/Category.model";
import ProductModel from "@/models/Product.model";
import { jsonRes } from "@/lib/adminMiddleware";
import { filterCategoriesForSearch } from "@/lib/categorySearch";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const category = await CategoryModel.findOne({ slug, isActive: true, isDeleted: false });
      if (!category) return jsonRes(404, "Category not found");

      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "12");
      const sort = searchParams.get("sort") || "newest";

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

      const priceRanges = (searchParams.get("priceRanges") || "").split(",").filter(Boolean);
      const isSale = searchParams.get("isSale") === "true";

      const baseQuery = { category: category._id, isActive: true };
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
          baseQuery.$or = rangeQueries;
        }
      }
      if (isSale) {
        baseQuery.salePrice = { $exists: true, $ne: null };
      }

      const [products, total] = await Promise.all([
        ProductModel.find(baseQuery)
          .populate("category", "name slug")
          .sort(sortOption)
          .skip((page - 1) * limit)
          .limit(limit),
        ProductModel.countDocuments(baseQuery),
      ]);

      return jsonRes(200, "Category fetched", { 
        category, 
        products, 
        total, 
        page, 
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total 
      });
    }

    const search = searchParams.get("search") || "";
    const baseQuery = { isActive: true, isDeleted: false };

    const categories = await CategoryModel.find(baseQuery)
      .sort({ createdAt: -1 });

    const filteredCategories = filterCategoriesForSearch(categories, search);
    return jsonRes(200, "Categories fetched", filteredCategories);
  } catch (e) {
    return jsonRes(500, e.message);
  }
}

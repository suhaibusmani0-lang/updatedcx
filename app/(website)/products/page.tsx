import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, Grid, List } from "lucide-react";
import ProductFilterSidebar from "@/components/website/ProductFilterSidebar";
import MobileToolbar from "@/components/website/MobileToolbar";
import { connectDB } from "@/lib/databaseConnection";
import CategoryModel from "@/models/Category.model";
import ProductModel from "@/models/Product.model";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function buildPriceRangeQueries(priceRanges: string[]) {
  return priceRanges
    .map((range) => {
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
    })
    .filter(Boolean);
}

async function getProducts(searchParams: SearchParams) {
  const getCachedData = unstable_cache(
    async () => {
      try {
        await connectDB();

        const get = (key: string) => {
          const v = searchParams[key];
          return Array.isArray(v) ? v[0] : v;
        };

        const page = parseInt(get("page") || "1");
        const limit = parseInt(get("limit") || "12");
        const search = get("search") || "";
        const categorySlug = get("category") || "";
        const priceRanges = (get("priceRanges") || "").split(",").filter(Boolean);
        const sort = get("sort") || "newest";

        const query: Record<string, unknown> = { isActive: true };

        if (search) query.name = { $regex: search, $options: "i" };

        if (categorySlug) {
          const categoryDoc = await CategoryModel.findOne({
            slug: categorySlug.toLowerCase(),
            isActive: true,
            isDeleted: false,
          }).lean();
          if (categoryDoc) query.category = (categoryDoc as { _id: unknown })._id;
        }

        const rangeQueries = buildPriceRangeQueries(priceRanges);
        if (rangeQueries.length) query.$or = rangeQueries;

        if (get("isFeatured") === "true") query.isFeatured = true;
        if (get("isNewArrival") === "true") query.isNewArrival = true;
        if (get("isBestSeller") === "true") query.isBestSeller = true;
        if (get("isSale") === "true") query.salePrice = { $exists: true, $ne: null };

        let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
        if (sort === "price-low") sortOption = { price: 1 };
        else if (sort === "price-high") sortOption = { price: -1 };
        else if (sort === "popular") sortOption = { "ratings.count": -1 };
        else if (sort === "rating") sortOption = { "ratings.average": -1 };

        const [products, total] = await Promise.all([
          ProductModel.find(query)
            .populate("category", "name slug")
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          ProductModel.countDocuments(query),
        ]);

        return JSON.parse(
          JSON.stringify({
            products,
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          })
        );
      } catch (error) {
        console.error("Products page DB error:", error);
        throw new Error("Failed to fetch products data");
      }
    },
    [`all-products-${JSON.stringify(searchParams)}`],
    { revalidate: 3600 }
  );

  try {
    return await getCachedData();
  } catch (error) {
    console.error("Cache execution error:", error);
    return null;
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const sp = await searchParams as SearchParams;

  const page = parseInt(typeof sp.page === "string" ? sp.page : "1");
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";

  const data = await getProducts(sp);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif text-[#1A1A1A]">
        Products not found
      </div>
    );
  }

  const { products, total, pages, hasMore } = data;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      
      <div className="w-full bg-[#AEAA9B] bg-opacity-30 py-10 md:py-14 px-4 sm:px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center relative z-10">
          <h1 className="text-2xl md:text-3xl font-serif font-bold mb-4 text-[#1A1A1A]">
            All Products
          </h1>
          <p className="text-[#1A1A1A]/80 text-base md:text-lg leading-relaxed w-full text-center font-light">
            Browse our complete collection
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8 pb-20 lg:pb-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar (Desktop Filter) */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilterSidebar basePath="/products" />
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            {/* Toolbar (Desktop) */}
            <div className="hidden lg:flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <p className="text-sm text-[#1A1A1A]/60 font-medium">
                Showing {products.length} of {total} products
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button className="p-2 bg-[#AEAA9B] text-white rounded-none transition-colors hover:bg-[#8B6F52]">
                    <Grid size={18} />
                  </button>

                  <button className="p-2 bg-white text-[#1A1A1A] border border-[#E3D9C9] rounded-none transition-colors hover:bg-[#FAF7F2]">
                    <List size={18} />
                  </button>
                </div>

                <select
                  defaultValue={sort}
                  className="px-4 py-2 border border-[#E3D9C9] rounded-none bg-white text-sm font-medium focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price Low to High</option>
                  <option value="price-high">Price High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {products?.length > 0 ? (
              <>
                {/* 🔥 EDITORIAL THEME: Exact 4px gap and sharp grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[4px]">
                  {products.map((product: any) => (
                    <Link
                      key={product._id}
                      href={`/product/${product.slug}`}
                      className="group flex flex-col h-full bg-white relative"
                    >
                      <div className="relative overflow-hidden rounded-none bg-[#F1EBE1] w-full" style={{ aspectRatio: "1 / 1" }}>
                        
                        {/* 🔥 MAGIC: Inner White Border ONLY ON HOVER */}
                        <div className="absolute inset-[4px] border border-white/60 z-20 pointer-events-none opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 z-10 pointer-events-none transition-colors duration-500" />

                        {product.images?.[0]?.url ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#D4C4B0]">
                            <span className="text-2xl text-[#8B6F52] font-semibold">
                              {product.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {/* Sharp Badges matching exactly 4px offset */}
                        {product.badge && (
                          <div className="absolute top-[4px] left-[4px] bg-[#1A1A1A] text-white text-[10px] font-bold px-3 py-1 uppercase rounded-none shadow-sm tracking-wider z-30">
                            {product.badge}
                          </div>
                        )}
                        
                        {product.salePrice && !product.badge && (
                          <div className="absolute top-[4px] left-[4px] px-2.5 py-1 bg-[#C1121F] text-white text-[10px] tracking-widest uppercase font-bold rounded-none z-30">
                            SALE
                          </div>
                        )}
                      </div>

                      {/* Text Section - Sharp alignment */}
                      <div className="flex flex-col flex-grow mt-3 px-[4px] pb-4">
                        {product.category?.name && (
                          <p className="text-[9px] sm:text-[10px] tracking-widest uppercase text-[#8B6F52] font-semibold mb-[4px]">
                            {product.category.name}
                          </p>
                        )}
                        <h3 className="text-sm sm:text-[15px] text-[#1A1A1A] font-serif leading-snug line-clamp-2">
                          {product.name}
                        </h3>

                        <div className="flex items-center gap-[4px] sm:gap-[6px] mt-[4px] flex-wrap">
                          <span className={`text-sm sm:text-base font-medium ${product.salePrice ? "text-[#C1121F]" : "text-[#1A1A1A]"}`}>
                            ₹{(product.salePrice || product.price).toLocaleString()}
                          </span>

                          {product.salePrice && (
                            <span className="text-[11px] sm:text-xs text-gray-500 line-through">
                              ₹{product.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex justify-center gap-[4px] mt-12">
                    {Array.from(
                      { length: Math.min(5, pages) },
                      (_, i) => i + 1
                    ).map((pageNum) => (
                      <Link
                        key={pageNum}
                        href={`/products?page=${pageNum}&sort=${sort}`}
                        className={`px-4 py-2 rounded-none text-sm font-bold tracking-widest transition-colors border ${
                          pageNum === page
                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                            : "bg-white text-[#1A1A1A] border-[#E3D9C9] hover:border-[#1A1A1A]"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-none border border-[#E3D9C9] p-12 text-center text-[#1A1A1A] font-serif text-lg">
                No Products Found
              </div>
            )}
          </div>
        </div>

        <MobileToolbar 
          currentSort={sort} 
          filterNode={<ProductFilterSidebar basePath="/products" />} 
        />
        
      </div>
    </div>
  );
}
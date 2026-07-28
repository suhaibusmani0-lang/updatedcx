import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Grid, List } from "lucide-react";
import ProductFilterSidebar from "@/components/website/ProductFilterSidebar";
import MobileToolbar from "@/components/website/MobileToolbar";
import { connectDB } from "@/lib/databaseConnection";
import CategoryModel from "@/models/Category.model";
import ProductModel from "@/models/Product.model";
import { unstable_cache } from "next/cache";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://cosmoxs.com";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    await connectDB();
    const category = await CategoryModel.findOne({
      slug: slug.toLowerCase(),
      isActive: true,
      isDeleted: false,
    })
      .select("name slug description image")
      .lean() as any;
    if (!category) return { title: "Category not found" };

    const title = `${category.name} — Shop Premium Collection`;
    const description = (category.description ||
      `Browse our curated ${category.name} collection at Cosmopolitan Xccessories. Premium quality with pan-India shipping.`).slice(0, 160);
    const canonical = `/category/${category.slug}`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}${canonical}`,
        type: "website",
        images: category.image
          ? [{ url: category.image, width: 1200, height: 630, alt: category.name }]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: category.image ? [category.image] : undefined,
      },
    };
  } catch {
    return { title: "Category" };
  }
}

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

async function getCategoryData(slug: string, searchParams: SearchParams) {
  const getCachedData = unstable_cache(
    async () => {
      try {
        await connectDB();

        const category = await CategoryModel.findOne({
          slug: slug.toLowerCase(),
          isActive: true,
          isDeleted: false,
        }).lean();
        
        if (!category) return null;

        const get = (key: string) => {
          const v = searchParams[key];
          return Array.isArray(v) ? v[0] : v;
        };

        const page = parseInt(get("page") || "1");
        const limit = parseInt(get("limit") || "12");
        const sort = get("sort") || "newest";
        const priceRanges = (get("priceRanges") || "").split(",").filter(Boolean);
        const isSale = get("isSale") === "true";

        let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
        if (sort === "price-low") sortOption = { price: 1 };
        else if (sort === "price-high") sortOption = { price: -1 };
        else if (sort === "popular") sortOption = { "ratings.count": -1 };
        else if (sort === "rating") sortOption = { "ratings.average": -1 };

        const subCategories = await CategoryModel.find({ 
          parent: (category as any)._id, 
          isActive: true 
        }).select('_id').lean();
        
        const categoryIds = [(category as any)._id, ...subCategories.map(c => c._id)];

        const baseQuery: Record<string, unknown> = {
          category: { $in: categoryIds },
          isActive: true,
        };

        const rangeQueries = buildPriceRangeQueries(priceRanges);
        if (rangeQueries.length) baseQuery.$or = rangeQueries;
        if (isSale) baseQuery.salePrice = { $exists: true, $ne: null };

        const [products, total] = await Promise.all([
          ProductModel.find(baseQuery)
            .populate("category", "name slug")
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          ProductModel.countDocuments(baseQuery),
        ]);

        return JSON.parse(
          JSON.stringify({
            category,
            products,
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          })
        );
      } catch (error) {
        console.error("Category page DB error:", error);
        return null;
      }
    },
    [`category-${slug.toLowerCase()}-${JSON.stringify(searchParams)}`], 
    { revalidate: 3600 } 
  );

  try {
    return await getCachedData();
  } catch (error) {
    console.error("Cache execution error:", error);
    return null;
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  try {
    const { slug } = await params;
    const sp = await searchParams;
    const page = parseInt(typeof sp.page === "string" ? sp.page : "1");
    const sort = typeof sp.sort === "string" ? sp.sort : "newest";
    const data = await getCategoryData(slug, sp);
    
    if (!data) notFound();

    const { category, products, total, pages, hasMore } = data;

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: category?.name || "Category",
          item: `${SITE_URL}/category/${category?.slug || slug}`,
        },
      ],
    };

    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${category?.name || "Category"} — Cosmopolitan Xccessories`,
      itemListElement: (products || []).slice(0, 20).map((p: any, idx: number) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${SITE_URL}/product/${p?.slug || ""}`,
        name: p?.name || "",
      })),
    };

    return (
      <div className="min-h-screen bg-[#FAF7F2] pb-20 lg:pb-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
        
        <div className="w-full bg-[#AEAA9B] bg-opacity-30 py-10 md:py-14 px-4 sm:px-6 md:px-10">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-[#1A1A1A]">
              {category?.name || "Category"}
            </h1>
            {category?.description && (
              <p className="text-[#1A1A1A]/80 text-base md:text-lg leading-relaxed w-full text-center">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="sticky top-24">
                <ProductFilterSidebar basePath={`/category/${slug}`} />
              </div>
            </aside>

            <div className="flex-1">
              <div className="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <p className="text-sm text-[#1A1A1A]/60">
                  Showing {products?.length || 0} of {total || 0} products
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-[#1A1A1A] text-white rounded-lg">
                      <Grid size={18} />
                    </button>
                    <button className="p-2 bg-white text-[#1A1A1A]/60 rounded-lg hover:bg-gray-50">
                      <List size={18} />
                    </button>
                  </div>
                  <select 
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1A1A1A]"
                    defaultValue={sort}
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="popular">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>

              {products && products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    {products.map((product: any) => (
                      <Link
                        key={product?._id || Math.random()}
                        href={`/product/${product?.slug || ""}`}
                        className="group"
                      >
                        <div className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-square relative">
                            {product?.images?.[0]?.url ? (
                              <Image
                                src={product.images[0].url}
                                alt={product?.name || "Product"}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <span className="text-gray-400">No image</span>
                              </div>
                            )}
                            {product?.badge && (
                              <div className="absolute top-3 left-3 bg-[#1A1A1A] text-white text-[10px] font-bold px-2.5 py-1 uppercase rounded shadow-sm tracking-wider z-10">
                                {product.badge}
                              </div>
                            )}
                            {product?.salePrice && (
                              <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                SALE
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium text-[#1A1A1A] text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                              {product?.name || "Unnamed Product"}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-[#AEAA9B]">
                                ₹{(product?.salePrice || product?.price || 0).toLocaleString()}
                              </p>
                              {product?.salePrice && (
                                <p className="text-sm text-[#1A1A1A]/50 line-through">
                                  ₹{(product?.price || 0).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-xs ${
                                      star <= Math.round(product?.ratings?.average || 0)
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-xs text-[#1A1A1A]/60">
                                ({product?.ratings?.count || 0})
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {pages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      {page > 1 && (
                        <Link
                          href={`/category/${slug}?page=${page - 1}&sort=${sort}`}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                        >
                          Previous
                        </Link>
                      )}
                      {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Link
                            key={pageNum}
                            href={`/category/${slug}?page=${pageNum}&sort=${sort}`}
                            className={`px-4 py-2 rounded-lg text-sm ${
                              pageNum === page
                                ? "bg-[#AEAA9B] text-white"
                                : "bg-white border border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </Link>
                        );
                      })}
                      {hasMore && (
                        <Link
                          href={`/category/${slug}?page=${page + 1}&sort=${sort}`}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                        >
                          Next
                        </Link>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <p className="text-[#1A1A1A]/60 mb-4">No products found in this category.</p>
                  <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-[#AEAA9B] text-white rounded-xl font-medium hover:bg-[#9B9789] transition-colors"
                  >
                    Continue Shopping
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <MobileToolbar 
          currentSort={sort} 
          filterNode={<ProductFilterSidebar basePath={`/category/${slug}`} />} 
        />
      </div>
    );
  } catch (err) {
    console.error("Category Page Rendering Error:", err);
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-sm">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Oops! Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6">We encountered an issue rendering this category page.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#AEAA9B] text-white rounded-xl font-medium hover:bg-[#9B9789] transition-colors"
          >
            Go back to Home
          </Link>
        </div>
      </div>
    );
  }
}
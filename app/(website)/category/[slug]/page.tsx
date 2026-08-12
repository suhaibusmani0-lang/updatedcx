import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import MobileToolbar from "@/components/website/MobileToolbar";
import ProductFilterSidebar from "@/components/website/ProductFilterSidebar";
import ProductDesktopLayout from "@/components/website/ProductDesktopLayout";
import RotatingProductImage from "@/components/website/RotatingProductImage";
import { withMongoRetry } from "@/lib/databaseConnection";
import CategoryModel from "@/models/Category.model";
import ProductModel from "@/models/Product.model";

export const dynamic = "force-dynamic";
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://cosmoxs.com";
type SearchParams = Record<string, string | string[] | undefined>;

function buildPriceRangeQueries(priceRanges: string[]) {
  return priceRanges.map(range => {
    switch (range) {
      case "under500": return { price: { $lt: 500 } };
      case "500-1000": return { price: { $gte: 500, $lte: 1000 } };
      case "1000-2000": return { price: { $gte: 1000, $lte: 2000 } };
      case "2000-5000": return { price: { $gte: 2000, $lte: 5000 } };
      case "above5000": return { price: { $gt: 5000 } };
      default: return null;
    }
  }).filter(Boolean);
}

async function findActiveCategory(slug: string) {
  return CategoryModel.findOne()
    .where("slug", slug.toLowerCase())
    .where("isActive", true)
    .where("isDeleted", false)
    .select("name description")
    .lean();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    await withMongoRetry(async () => undefined, 1);
    const category = await findActiveCategory(slug);
    if (!category) return { title: "Category not found", robots: { index: false, follow: true } };
    const description = (category.description || `Shop ${category.name} at Cosmopolitan Xccessories. Discover premium products with pan-India shipping.`).slice(0, 160);
    return {
      title: category.name,
      description,
      alternates: { canonical: `/category/${slug}` },
      robots: { index: true, follow: true },
      openGraph: { title: `${category.name} | Cosmopolitan Xccessories`, description, url: `${SITE_URL}/category/${slug}`, siteName: "Cosmopolitan Xccessories", type: "website" },
    };
  } catch {
    return { title: "Category | Cosmopolitan Xccessories" };
  }
}

async function getCategoryData(slug: string, searchParams: SearchParams) {
  const load = async () => {
    const category = await findActiveCategory(slug);
    if (!category) return null;
    const get = (key: string) => { const v = searchParams[key]; return Array.isArray(v) ? v[0] : v; };
    const rawPage = Number.parseInt(get("page") || "1", 10), rawLimit = Number.parseInt(get("limit") || "12", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1, limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 48) : 12;
    const sort = get("sort") || "newest", priceRanges = (get("priceRanges") || "").split(",").filter(Boolean), isSale = get("isSale") === "true", isNewArrival = get("isNewArrival") === "true", isBestSeller = get("isBestSeller") === "true";
    const subCategories = await CategoryModel.find()
      .where("parent", category._id)
      .where("isActive", true)
      .where("isDeleted", false)
      .select("_id")
      .lean();
    const categoryIds = [category._id, ...subCategories.map(item => item._id)];
    const baseQuery: Record<string, unknown> = { category: { $in: categoryIds }, isActive: true, isDeleted: { $ne: true } };
    const ranges = buildPriceRangeQueries(priceRanges); if (ranges.length) baseQuery.$or = ranges;
    if (isSale) baseQuery.salePrice = { $exists: true, $ne: null }; if (isNewArrival) baseQuery.isNewArrival = true; if (isBestSeller) baseQuery.isBestSeller = true;
    let sortOption: Record<string, 1 | -1> = { createdAt: -1 }; if (sort === "price-low") sortOption = { price: 1 }; else if (sort === "price-high") sortOption = { price: -1 }; else if (sort === "popular") sortOption = { "ratings.count": -1 }; else if (sort === "rating") sortOption = { "ratings.average": -1 };
    const ProductQueryModel = ProductModel as any;
    const [products, total] = await Promise.all([ProductQueryModel.find(baseQuery).populate("category", "name slug").sort(sortOption).skip((page - 1) * limit).limit(limit).lean(), ProductQueryModel.countDocuments(baseQuery)]);
    return JSON.parse(JSON.stringify({ category, products, total, page, pages: Math.ceil(total / limit), hasMore: page * limit < total }));
  };
  try { return await withMongoRetry(load, 2); } catch (error) { console.error("Category page DB error:", error); return null; }
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> }) {
  const { slug } = await params, sp = await searchParams, page = parseInt(typeof sp.page === "string" ? sp.page : "1"), sort = typeof sp.sort === "string" ? sp.sort : "newest", data = await getCategoryData(slug, sp);
  if (!data) notFound();
  const { category, products, pages, hasMore } = data;
  return <div className="min-h-screen bg-[#FAF7F2] pb-20 lg:pb-0"><div className="w-full bg-[#AEAA9B] bg-opacity-30 py-10 md:py-14 px-4 sm:px-6 md:px-10"><div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center relative z-10"><h1 className="text-2xl md:text-3xl font-bold mb-4 text-[#1A1A1A]">{category.name}</h1>{category.description&&<p className="text-[#1A1A1A]/80 text-base md:text-lg leading-relaxed w-full text-center">{category.description}</p>}</div></div><div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8"><ProductDesktopLayout basePath={`/category/${slug}`} currentSort={sort}>{products.length>0?<><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5 mb-8">{products.map((product:any)=><Link key={product._id} href={`/product/${product.slug}`} className="group"><div className="relative overflow-hidden rounded-none bg-[#F1EBE1] w-full aspect-square"><RotatingProductImage images={product.images||[]} alt={product.name} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"/></div><div className="p-3"><h3 className="font-medium text-[#1A1A1A] text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{product.name}</h3><div className="flex items-center gap-2 mb-2"><p className="font-semibold text-[#AEAA9B]">₹{(Number.isFinite(product.salePrice)&&product.salePrice<product.price?product.salePrice:product.price).toLocaleString()}</p>{Number.isFinite(product.salePrice)&&product.salePrice<product.price&&<p className="text-sm text-[#1A1A1A]/50 line-through">₹{product.price.toLocaleString()}</p>}</div><div className="flex items-center gap-1"><div className="flex">{[1,2,3,4,5].map(star=><span key={star} className={`text-xs ${star<=Math.round(product.ratings?.average||0)?"text-yellow-400":"text-gray-300"}`} aria-hidden="true">★</span>)}</div><span className="text-xs text-[#1A1A1A]/60">({product.ratings?.count||0})</span></div></div></Link>)}</div>{pages>1&&<div className="flex items-center justify-center gap-1">{page>1&&<Link href={`/category/${slug}?page=${page-1}&sort=${sort}`} className="px-4 py-2 bg-white border border-gray-200 text-sm">Previous</Link>}{Array.from({length:Math.min(pages,5)},(_,i)=>i+1).map(pageNum=><Link key={pageNum} href={`/category/${slug}?page=${pageNum}&sort=${sort}`} className={`px-4 py-2 text-sm ${pageNum===page?"bg-[#AEAA9B] text-white":"bg-white border border-gray-200"}`}>{pageNum}</Link>)}{hasMore&&<Link href={`/category/${slug}?page=${page+1}&sort=${sort}`} className="px-4 py-2 bg-white border border-gray-200 text-sm">Next</Link>}</div>}</>:<div className="bg-white p-12 text-center"><p className="text-[#1A1A1A]/60 mb-4">No products found in this category.</p><Link href="/" className="inline-block px-6 py-3 bg-[#AEAA9B] text-white font-medium">Continue Shopping</Link></div>}</ProductDesktopLayout></div><MobileToolbar currentSort={sort} filterNode={<ProductFilterSidebar basePath={`/category/${slug}`} embedded/>}/></div>;
}

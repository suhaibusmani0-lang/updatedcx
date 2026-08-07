import ProductCard from "./ProductCard";
import { Suspense } from "react";
import { connectDB } from "@/lib/databaseConnection";
import ProductModel from "@/models/Product.model";
import CategoryModel from "@/models/Category.model";

// Cache data for 60 seconds to make it super fast and avoid database lag
export const revalidate = 60;

// Define proper types
interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  images: { url: string }[];
  badge?: string;
  category?: { name: string };
  stock: number;
}

interface ProductGridProps {
  limit?: number;
  isNewArrival?: boolean;
  category?: string;
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
}

async function getProducts({ 
  limit = 8, 
  isNewArrival = true, 
  category = "" 
}: { 
  limit?: number; 
  isNewArrival?: boolean; 
  category?: string;
} = {}): Promise<Product[]> {
  const timeoutPromise = new Promise<Product[]>((resolve) =>
    setTimeout(() => resolve([]), 10000)
  );
  const fetchPromise = (async () => {
    try {
      await connectDB();
      const query: Record<string, unknown> = { isActive: true };
      if (isNewArrival) query.isNewArrival = true;
      if (category) {
        const categoryDoc = await CategoryModel.findOne({ slug: category, isActive: true, isDeleted: false });
        if (categoryDoc) query.category = categoryDoc._id;
      }
      const products = await ProductModel.find(query)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return JSON.parse(JSON.stringify(products)) as Product[];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [] as Product[];
    }
  })();
  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch {
    return [];
  }
}

// Loading skeleton component
function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    // 🔥 EDITORIAL THEME: Sharp corners (rounded-none) aur 4px gap lagaya hai
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[4px]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-[#EAE8E3] rounded-none" />
          <div className="mt-3 sm:mt-4 space-y-2 px-1">
            <div className="h-3 bg-[#EAE8E3] rounded-none w-1/3" />
            <div className="h-4 bg-[#EAE8E3] rounded-none w-3/4" />
            <div className="h-3 bg-[#EAE8E3] rounded-none w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🛍️</div>
      <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No products found</h3>
      <p className="text-sm text-[#8B6F52]">Check back later for new arrivals</p>
    </div>
  );
}

export default async function ProductGrid({ 
  limit = 8, 
  isNewArrival = true, 
  category = "",
  title = "New This Week",
  subtitle = "Just Arrived",
  viewAllLink = "/products"
}: ProductGridProps) {
  const products = await getProducts({ limit, isNewArrival, category });

  return (
    // 🔥 VERTICAL GAP REDUCED: py-12 se py-6 kar diya taaki gap lamba na dikhe
    <section className="bg-[#FAF7F2] py-2 lg:py-2 border-t border-[#E3D9C9]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">

        {/* Header row */}
        <div className="flex items-center justify-center mb-2 text-center">
          <div>
            <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#8B6F52] font-bold mb-1 sm:mb-2">
              {subtitle}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1A1A1A]">
              {title}
            </h2>
          </div>
          
        </div>

        {/* Products Grid with Suspense for loading */}
        <Suspense fallback={<ProductGridSkeleton count={limit} />}>
          {products.length > 0 ? (
            // 🔥 EDITORIAL THEME: Products ke beech 4px ka gap
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[4px]">
              {products.map((product: Product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </Suspense>

        {/* Mobile view all */}
        {viewAllLink && products.length > 0 && (
          <div className="mt-8 text-center sm:hidden">
            <a 
              href={viewAllLink} 
              className="text-[11px] font-bold tracking-widest uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#8B6F52] hover:border-[#8B6F52] transition-colors"
            >
              View All
            </a>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center mb-2 mt-4 text-center">
        {viewAllLink && (
            <a
              href={viewAllLink}
              className="hidden sm:inline text-[11px] font-bold tracking-widest uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#8B6F52] hover:border-[#8B6F52] transition-colors whitespace-nowrap"
            >
              View All
            </a>
          )}
      </div>
    </section>
  );
}

// Export the skeleton for use in other components
export { ProductGridSkeleton };
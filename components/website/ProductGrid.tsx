import ProductCard from "./ProductCard";
import { Suspense } from "react";
import { connectDB } from "@/lib/databaseConnection";
import ProductModel from "@/models/Product.model";
import CategoryModel from "@/models/Category.model";

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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-[#F1EBE1] rounded-lg sm:rounded-xl" />
          <div className="mt-2 sm:mt-3 space-y-2">
            <div className="h-3 bg-[#F1EBE1] rounded w-2/3" />
            <div className="h-4 bg-[#F1EBE1] rounded w-3/4" />
            <div className="h-3 bg-[#F1EBE1] rounded w-1/2" />
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
  viewAllLink = "/product?isNewArrival=true"
}: ProductGridProps) {
  const products = await getProducts({ limit, isNewArrival, category });

  return (
    <section className="bg-[#FAF7F2] py-12 sm:py-16 md:py-20 lg:py-24 border-t border-[#E3D9C9]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">

        {/* Header row */}
        <div className="flex items-end justify-between mb-7 sm:mb-10">
          <div>
            <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#8B6F52] mb-1 sm:mb-2">
              {subtitle}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1A1A1A]">
              {title}
            </h2>
          </div>
          {viewAllLink && (
            <a
              href={viewAllLink}
              className="hidden sm:inline text-[11px] tracking-widest uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#e2e2e2] hover:border-[#e2e2e2] transition-colors whitespace-nowrap"
            >
              View All
            </a>
          )}
        </div>

        {/* Products Grid with Suspense for loading */}
        <Suspense fallback={<ProductGridSkeleton count={limit} />}>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
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
          <div className="mt-7 text-center sm:hidden">
            <a 
              href={viewAllLink} 
              className="text-xs tracking-widest uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#e2e2e2] hover:border-[#e2e2e2] transition-colors"
            >
              View All
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// Export the skeleton for use in other components
export { ProductGridSkeleton };
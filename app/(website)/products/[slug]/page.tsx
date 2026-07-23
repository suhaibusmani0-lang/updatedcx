import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/databaseConnection";
import ProductModel from "@/models/Product.model";
import CategoryModel from "@/models/Category.model";

export const dynamic = "force-dynamic";

// ---------- Types ----------
interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  sizes: string[];
  images: { url: string; alt?: string }[];
  category: { name: string; slug: string };
  ratings?: { average: number; count: number };
  isActive: boolean;
}
  
// ---------- Fetch product by slug ----------
async function getProduct(slug: string): Promise<Product | null> {
  try {
    await connectDB();
    const product = await ProductModel.findOne({ slug, isActive: true })
      .populate("category", "name slug")
      .lean();
    if (!product) return null;
    return JSON.parse(JSON.stringify(product)) as Product;
  } catch (error) {
    console.error("[getProduct] DB error:", error);
    return null;
  }
}

// ---------- Fetch similar products (same category) ----------
async function getSimilarProducts(
  categorySlug: string,
  currentProductId: string
): Promise<Product[]> {
  try {
    const category = await CategoryModel.findOne({
      slug: categorySlug,
      isActive: true,
      isDeleted: false,
    }).lean();
    if (!category) return [];
    const products = await ProductModel.find({
      category: (category as { _id: unknown })._id,
      _id: { $ne: currentProductId },
      isActive: true,
    })
      .populate("category", "name slug")
      .limit(4)
      .lean();
    return JSON.parse(JSON.stringify(products)) as Product[];
  } catch {
    return [];
  }
}

// ---------- Page Component ----------
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Fetch the product
  const product = await getProduct(slug);

  if (!product) notFound();
  const similarProducts = product.category
    ? await getSimilarProducts(product.category.slug, product._id)
    : [];

  // 4. (Optional) Recently viewed – implement later with cookies/localStorage
  const recentProducts: Product[] = [];

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      {/* ---------- Breadcrumb ---------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#C17A56]">
          Home
        </Link>
        <span className="mx-2">›</span>
        <Link
          href={`/category/${product.category.slug}`}
          className="hover:text-[#C17A56]"
        >
          {product.category.name}
        </Link>
        
        <span className="mx-2">›</span>
        <span className="text-[#1A1A1A]">{product.name}</span>
      </div>

      {/* ---------- Product Details ---------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.slice(1).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || ""}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            <div className="inline-block bg-[#C17A56] text-white text-xs font-bold px-3 py-1 rounded-full">
              New Arrival
            </div>

            <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>

            <div className="space-y-1">
              <p className="text-2xl font-semibold text-[#C17A56]">
                MRP: ₹{" "}
                {(product.salePrice || product.price).toLocaleString()}
              </p>
              {product.salePrice && (
                <p className="text-sm text-gray-400 line-through">
                  ₹ {product.price.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Price inclusive of all taxes
              </p>
            </div>

            {/* Size selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <p className="font-medium mb-2">PLEASE SELECT SIZE</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:border-[#C17A56] hover:bg-[#C17A56]/5 transition"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="font-medium">QUANTITY</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button className="px-3 py-2 hover:bg-gray-100">-</button>
                <span className="px-4 py-2">1</span>
                <button className="px-3 py-2 hover:bg-gray-100">+</button>
              </div>
            </div>

            <button className="w-full py-4 bg-[#1A1A1A] text-white font-medium rounded-xl hover:bg-[#C17A56] transition-colors">
              ADD TO CART
            </button>
            <button className="w-full py-3 border border-[#1A1A1A] text-[#1A1A1A] font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Make a Free Design Appointment
            </button>

            {/* PIN code check */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                Enter PIN code for better delivery estimate
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Enter your PIN code"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C17A56]"
                />
                <button className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#C17A56] transition">
                  Check
                </button>
              </div>
            </div>

            {/* Expandable details */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                <details className="group">
                  <summary className="cursor-pointer font-medium text-lg py-2 border-b border-gray-100 flex items-center justify-between">
                    <span>+ OVERVIEW</span>
                  </summary>
                  <div className="py-4 text-gray-600 text-sm leading-relaxed">
                    {product.description || "No overview available."}
                  </div>
                </details>
                <details className="group">
                  <summary className="cursor-pointer font-medium text-lg py-2 border-b border-gray-100 flex items-center justify-between">
                    <span>+ DETAILS + DIMENSIONS</span>
                  </summary>
                  <div className="py-4 text-gray-600 text-sm leading-relaxed">
                    <p>
                      <strong>Dimensions:</strong> 30cm x 20cm x 40cm
                    </p>
                    <p>
                      <strong>Material:</strong> Ceramic
                    </p>
                    <p>
                      <strong>Color:</strong> Cream, Terracotta
                    </p>
                    <p>
                      <strong>Care:</strong> Wipe with dry cloth
                    </p>
                  </div>
                </details>
                <details className="group">
                  <summary className="cursor-pointer font-medium text-lg py-2 border-b border-gray-100 flex items-center justify-between">
                    <span>+ ADDITIONAL INFO</span>
                  </summary>
                  <div className="py-4 text-gray-600 text-sm leading-relaxed">
                    <p>
                      Made from high-quality ceramic. Each piece is handcrafted
                      and unique.
                    </p>
                    <p>
                      This product is eligible for return within 30 days of
                      delivery.
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Recently Viewed ---------- */}
        {recentProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recentProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ---------- Similar Looks ---------- */}
        {similarProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">
              Similar Looks You Might Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {similarProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ---------- Reusable Product Card ----------
function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-square bg-gray-100">
          {product.images?.[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              No image
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-sm text-[#1A1A1A] line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          <p className="font-semibold text-[#C17A56] mt-1">
            ₹ {(product.salePrice || product.price).toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star, Truck, Shield, RotateCcw } from "lucide-react";
import mongoose from "mongoose";
import ProductGalleries from "@/components/website/ProductGalleries";
import ProductActions from "@/components/website/ProductActions";
import ReviewForm from "@/components/website/ReviewForm";
import PincodeChecker from "@/components/website/PincodeChecker";
import { connectDB } from "@/lib/databaseConnection";
import ProductModel from "@/models/Product.model";
import ReviewModel from "@/models/Review.model";
import "@/models/Category.model";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://cosmoxs.com";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    await connectDB();
    const products = await ProductModel.find({ isActive: true }).select('slug').lean();
    return products.map((p: any) => ({
      slug: p.slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    await connectDB();
    const product = await ProductModel.findOne({ slug, isActive: true })
      .select("name slug description shortDescription images price salePrice")
      .lean() as any;
    if (!product) return { title: "Product not found" };

    const title = product.name;
    const description = (product.shortDescription || product.description || `Buy ${product.name} online at Cosmopolitan Xccessories. Premium quality with pan-India shipping.`).slice(0, 160);
    const imageUrl = product.images?.[0]?.url;
    const canonical = `/product/${product.slug}`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}${canonical}`,
        type: "website",
        images: imageUrl
          ? [{ url: imageUrl, width: 1200, height: 1200, alt: product.name }]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch {
    return { title: "Product" };
  }
}

type ProductBundle = {
  product: {
    _id: string;
    name: string;
    slug: string;
    sku?: string;
    description?: string;
    shortDescription?: string;
    price: number;
    salePrice?: number;
    sizes?: string[] | string;
    colors?: string[] | string;
    images: { url: string; alt?: string }[];
    badge?: string;
    stock: number;
    category?: { 
      _id: string; 
      name: string; 
      slug: string; 
      parent?: { name: string; slug: string }; 
    };
    ratings?: { average?: number; count?: number };
  };
  reviews: {
    _id: string;
    user?: { name?: string };
    rating: number;
    comment?: string;
    createdAt: string;
  }[];
  relatedProducts: {
    _id: string;
    slug: string;
    name: string;
    images: { url: string }[];
    salePrice?: number;
    price: number;
  }[];
};

async function fetchBundle(slug: string): Promise<ProductBundle | null> {
  try {
    await connectDB();
    const product = await ProductModel.findOne({ slug, isActive: true })
      .populate("category", "name slug description image parent parentCategory")
      .lean();
      
    if (!product) return null;

    // Convert to standard object to allow modifications
    const parsedProduct = JSON.parse(JSON.stringify(product));

    if (parsedProduct.category) {
      const parentId = parsedProduct.category.parent || parsedProduct.category.parentCategory;
      if (parentId) {
        const parentCat = await mongoose.models.Category.findById(parentId).select("name slug").lean();
        if (parentCat) {
          parsedProduct.category.parent = {
            name: (parentCat as any).name,
            slug: (parentCat as any).slug
          };
        }
      }
    }

    const productId = parsedProduct._id;
    const categoryId = parsedProduct.category?._id;

    const [reviews, relatedProducts] = await Promise.all([
      ReviewModel.find({ product: productId, isApproved: true })
        .populate("user", "name avatar")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      categoryId
        ? ProductModel.find({
            category: categoryId,
            _id: { $ne: productId },
            isActive: true,
          })
            .populate("category", "name slug")
            .limit(8)
            .lean()
        : Promise.resolve([]),
    ]);

    return JSON.parse(
      JSON.stringify({ product: parsedProduct, reviews, relatedProducts })
    ) as ProductBundle;
  } catch (error) {
    console.error("Product page DB error:", error);
    return null;
  }
}

async function getProduct(slug: string): Promise<ProductBundle | null> {
  const timeoutPromise = new Promise<ProductBundle | null>((resolve) =>
    setTimeout(() => resolve(null), 12000)
  );
  return Promise.race([fetchBundle(slug), timeoutPromise]);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();

  const { product, reviews, relatedProducts } = data;
  const price = product.salePrice ?? product.price;
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;
  const averageRating = product.ratings?.average || 0;
  const ratingCount = product.ratings?.count || 0;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description || product.name,
    image: (product.images || []).map((i) => i.url).filter(Boolean),
    sku: product.sku,
    brand: { "@type": "Brand", name: "Cosmopolitan Xccessories" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/product/${product.slug}`,
    },
    ...(ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating,
            reviewCount: ratingCount,
          },
        }
      : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(product.category?.parent
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.parent.name,
              item: `${SITE_URL}/category/${product.category.parent.slug}`,
            },
          ]
        : []),
      ...(product.category?.slug
        ? [
            {
              "@type": "ListItem",
              position: product.category?.parent ? 3 : 2,
              name: product.category.name,
              item: `${SITE_URL}/category/${product.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category?.parent ? 4 : product.category?.slug ? 3 : 2,
        name: product.name,
        item: `${SITE_URL}/product/${product.slug}`,
      },
    ],
  };

  return (
   <div className="min-h-screen bg-white text-[#1A1A1A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Breadcrumb - Pottery Barn Style */}
        <nav
          data-testid="product-breadcrumb"
          className="flex flex-wrap items-center gap-2 text-[13px] text-gray-500 mb-8 font-medium"
        >
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          
          
          {product.category?.parent && (
            <>
              <span className="text-gray-400">{">"}</span>
              <Link
                href={`/category/${product.category.parent.slug}`}
                className="hover:text-black whitespace-nowrap"
              >
                {product.category.parent.name}
              </Link>
            </>
          )}

          <span className="text-gray-400">{">"}</span>
          
          {product.category?.slug ? (
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-black whitespace-nowrap"
            >
              {product.category.name}
            </Link>
          ) : (
            <span>{product.category?.name || "Uncategorized"}</span>
          )}
          
          <span className="text-gray-400">{">"}</span>
          <span className="text-black whitespace-nowrap">{product.name}</span>
        </nav>

        {/* Main Product Layout: 7 Columns for Image, 5 for Details */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 mb-16 relative">
          
          {/* Left Side: Product Gallery (with Magnifier) */}
          <div className="w-full lg:w-[60%]">
            <ProductGalleries
              images={product.images}
              name={product.name}
              badge={product.badge}
            />
          </div>

          {/* Right Side: Product Details */}
          <div className="w-full lg:w-[40%] flex flex-col pt-4">
            
            {/* Title & Badge */}
            <div className="flex flex-col mb-4">
              <h1
                data-testid="product-name"
                className="text-2xl md:text-[28px] font-medium text-[#1A1A1A] leading-tight pr-4"
              >
                {product.name}
              </h1>
              
              
              {product.sku && (
                <p className="text-sm text-gray-400 mt-2 font-medium tracking-wide">
                  SKU: <span className="text-gray-700">{product.sku}</span>
                </p>
              )}
            </div>

            
            {product.shortDescription && (
              <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
                {product.shortDescription}
              </p>
            )}

            {/* Pricing Section (Pottery Barn Style) */}
            <div className="flex flex-col mb-6">
              <div className="flex items-center gap-3 mb-1">
                {product.salePrice ? (
                  <>
                    <span className="text-lg text-gray-900 font-semibold">MRP:</span>
                    <span className="text-lg text-gray-500 line-through decoration-1">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-[#C1121F]">
                      ₹{price.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-xl md:text-2xl font-bold text-gray-900">
                    ₹{price.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">Price inclusive of all taxes</p>
            </div>

            {/* Ratings Summary */}
            {ratingCount > 0 && (
              <div className="flex items-center gap-2 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={
                        star <= Math.round(averageRating)
                          ? "fill-[#1A1A1A] text-[#1A1A1A]"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  ({ratingCount} Reviews)
                </span>
              </div>
            )}

            {/* Actions & Buttons */}
            <div className="mb-6 space-y-4">
               <ProductActions
                productId={product._id}
                name={product.name}
                image={product.images[0]?.url || ""}
                price={price}
                slug={product.slug}
                stock={product.stock}
                sizes={product.sizes as any}
                colors={product.colors as any}
              />
            </div>

            {/* Pincode Checker (Grey Box Style) */}
            <div className="bg-[#EAEAEA] p-5 mb-8">
              <p className="text-sm font-medium text-gray-800 mb-3">Enter PIN code for a better delivery estimate</p>
              <div className="bg-white">
                <PincodeChecker />
              </div>
            </div>

          </div>
          
        </div>
        
        <div className="max-w-4xl mx-auto space-y-16 py-12 border-t border-slate-200">
          <section>
            <h2 className="text-2xl font-light text-slate-900 mb-6">Product description</h2>
            <div className="prose prose-slate prose-p:leading-relaxed max-w-none text-slate-600">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p className="italic text-slate-400">No detailed description available.</p>
              )}
            </div>
          </section>

          <section className="pt-16 border-t border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-light text-slate-900">Customer Reviews</h2>
            </div>
            
            {reviews.length > 0 ? (
              <div className="space-y-8 mb-12">
                {reviews.map((review) => (
                  <div key={review._id} className="pb-8 border-b border-slate-100 last:border-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
                          {review.user?.name?.[0] || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {review.user?.name || "Anonymous"}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={
                                  star <= review.rating
                                    ? "fill-slate-900 text-slate-900"
                                    : "text-slate-200"
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-slate-600 leading-relaxed ml-16">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-8 rounded-lg text-center mb-8">
                <p className="text-slate-500">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            )}
            <ReviewForm productId={product._id} />
          </section>
        </div>

        {/* Keep Exploring Similar Items (Related Products) */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-10 border-t border-gray-200">
            <h2 className="text-xl text-center font-medium text-[#1A1A1A] mb-10">
              Keep Exploring Similar Items
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct._id}
                  href={`/product/${relatedProduct.slug}`}
                  className="group flex flex-col"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-50 mb-3">
                    {relatedProduct.images[0] ? (
                      <Image
                        src={relatedProduct.images[0].url}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-[#1A1A1A] text-sm mb-1 line-clamp-1 group-hover:underline">
                    {relatedProduct.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#1A1A1A] text-sm">
                      ₹{(relatedProduct.salePrice || relatedProduct.price).toLocaleString()}
                    </p>
                    {relatedProduct.salePrice && (
                      <p className="text-xs text-gray-400 line-through">
                        ₹{relatedProduct.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
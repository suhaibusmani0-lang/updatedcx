import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import mongoose from "mongoose";

import ProductVariantPanel from "@/components/website/ProductVariantPanel";
import ReviewForm from "@/components/website/ReviewForm";
import PincodeChecker from "@/components/website/PincodeChecker";
import ProductGalleries from "@/components/website/ProductGalleries";

import { connectDB } from "@/lib/databaseConnection";
import ProductModel from "@/models/Product.model";
import ReviewModel from "@/models/Review.model";

// IMPORTANT:
// Register these models before populate() is used.
import "@/models/User.model";
import "@/models/Category.model";

const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://cosmoxs.com";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    await connectDB();

    const products = await ProductModel.find({
      isActive: true,
    })
      .select("slug")
      .lean();

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

    const product = (await ProductModel.findOne({
      slug,
      isActive: true,
    })
      .select(
        "name slug description shortDescription images price salePrice"
      )
      .lean()) as any;

    if (!product) {
      return {
        title: "Product not found",
      };
    }

    const description = (
      product.shortDescription ||
      product.description ||
      `Buy ${product.name} online at Cosmopolitan Xccessories. Premium quality with pan-India shipping.`
    ).slice(0, 160);

    const title = product.name;
    const imageUrl = product.images?.[0]?.url;
    const canonical = `/product/${product.slug}`;

    return {
      title,
      description,

      alternates: {
        canonical,
      },

      openGraph: {
        title,
        description,
        url: `${SITE_URL}${canonical}`,
        type: "website",

        images: imageUrl
          ? [
              {
                url: imageUrl,
                width: 1200,
                height: 1200,
                alt: product.name,
              },
            ]
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
    return {
      title: "Product",
    };
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

    images: {
      url: string;
      alt?: string;
    }[];

    video?: {
      url: string;
      duration?: number;
      format?: string;
    };

    badge?: string;
    stock: number;

    variants?: Array<{
      size?: string;
      color?: string;
      stock?: number;
      sku?: string;
      price?: number | null;
      salePrice?: number | null;
      image?: string;
    }>;

    category?: {
      _id: string;
      name: string;
      slug: string;

      parent?: {
        name: string;
        slug: string;
      };
    };

    ratings?: {
      average?: number;
      count?: number;
    };
  };

  reviews: {
    _id: string;

    user?: {
      name?: string;
    };

    rating: number;
    comment?: string;
    createdAt: string;
  }[];

  relatedProducts: {
    _id: string;
    slug: string;
    name: string;

    images: {
      url: string;
    }[];

    salePrice?: number;
    price: number;
  }[];
};

async function fetchBundle(
  slug: string
): Promise<ProductBundle | null> {
  try {
    await connectDB();

    const product = await ProductModel.findOne({
      slug,
      isActive: true,
    })
      .populate(
        "category",
        "name slug description image parent parentCategory"
      )
      .lean();

    if (!product) {
      return null;
    }

    const parsedProduct = JSON.parse(
      JSON.stringify(product)
    );

    if (parsedProduct.category) {
      const parentId =
        parsedProduct.category.parent ||
        parsedProduct.category.parentCategory;

      if (parentId) {
        const parentCat =
          await mongoose.models.Category.findById(parentId)
            .select("name slug")
            .lean();

        if (parentCat) {
          parsedProduct.category.parent = {
            name: (parentCat as any).name,
            slug: (parentCat as any).slug,
          };
        }
      }
    }

    const productId = parsedProduct._id;
    const categoryId = parsedProduct.category?._id;

    const [reviews, relatedProducts] =
      await Promise.all([
        ReviewModel.find({
          product: productId,
          isApproved: true,
        })
          .populate("user", "name avatar")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),

        categoryId
          ? ProductModel.find({
              category: categoryId,
              _id: {
                $ne: productId,
              },
              isActive: true,
            })
              .populate("category", "name slug")
              .limit(8)
              .lean()
          : Promise.resolve([]),
      ]);

    return JSON.parse(
      JSON.stringify({
        product: parsedProduct,
        reviews,
        relatedProducts,
      })
    ) as ProductBundle;
  } catch (error) {
    console.error("Product page DB error:", error);
    return null;
  }
}

async function getProduct(
  slug: string
): Promise<ProductBundle | null> {
  const timeoutPromise =
    new Promise<ProductBundle | null>((resolve) =>
      setTimeout(() => resolve(null), 12000)
    );

  return Promise.race([
    fetchBundle(slug),
    timeoutPromise,
  ]);
}

// FIX: Convert hidden non-breaking spaces to regular spaces
function cleanHTML(html?: string) {
  if (!html) return "";
  return html.replace(/&nbsp;/gi, " ").replace(/\u00A0/g, " ");
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await getProduct(slug);

  if (!data) {
    notFound();
  }

  const {
    product,
    reviews,
    relatedProducts,
  } = data;

  const salePrice = Number(product.salePrice);

  const hasSale =
    Number.isFinite(salePrice) &&
    salePrice < product.price;

  const price = hasSale
    ? salePrice
    : product.price;

  const averageRating =
    product.ratings?.average || 0;

  const ratingCount =
    product.ratings?.count || 0;

  /* =====================================================
     COLORS
  ===================================================== */

  const rawColors = product.colors || [];

  const displayColors = (
    Array.isArray(rawColors)
      ? rawColors
      : [rawColors]
  )
    .flatMap((c) =>
      typeof c === "string"
        ? c.split(",")
        : []
    )
    .map((c) => c.trim())
    .filter(Boolean);

  /* =====================================================
     SIZES
  ===================================================== */

  const rawSizes = product.sizes || [];

  const displaySizes = (
    Array.isArray(rawSizes)
      ? rawSizes
      : [rawSizes]
  )
    .flatMap((s) =>
      typeof s === "string"
        ? s.split(",")
        : []
    )
    .map((s) => s.trim())
    .filter(Boolean);

  /* =====================================================
     PRODUCT SCHEMA
  ===================================================== */

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",

    name: product.name,

    description:
      product.shortDescription ||
      product.description ||
      product.name,

    image: (product.images || [])
      .map((i) => i.url)
      .filter(Boolean),

    sku: product.sku,

    brand: {
      "@type": "Brand",
      name: "Cosmopolitan Xccessories",
    },

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

  /* =====================================================
     BREADCRUMB SCHEMA
  ===================================================== */

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",

    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },

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
              position: product.category?.parent
                ? 3
                : 2,
              name: product.category.name,
              item: `${SITE_URL}/category/${product.category.slug}`,
            },
          ]
        : []),

      {
        "@type": "ListItem",

        position: product.category?.parent
          ? 4
          : product.category?.slug
            ? 3
            : 2,

        name: product.name,

        item: `${SITE_URL}/product/${product.slug}`,
      },
    ],
  };

  return (
    <>
      {/* Product Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productSchema
          ),
        }}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema
          ),
        }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* =====================================================
            BREADCRUMB
        ===================================================== */}

        <nav
          data-testid="product-breadcrumb"
          className="flex flex-wrap items-center gap-2 text-[13px] text-gray-500 mb-8 font-medium uppercase tracking-wide"
        >
          <Link
            href="/"
            className="hover:text-black transition-colors"
          >
            Home
          </Link>

          {product.category?.parent && (
            <>
              <span className="text-gray-300">
                /
              </span>

              <Link
                href={`/category/${product.category.parent.slug}`}
                className="hover:text-black transition-colors whitespace-nowrap"
              >
                {product.category.parent.name}
              </Link>
            </>
          )}

          <span className="text-gray-300">
            /
          </span>

          {product.category?.slug ? (
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-black transition-colors whitespace-nowrap"
            >
              {product.category.name}
            </Link>
          ) : (
            <span>
              {product.category?.name ||
                "Uncategorized"}
            </span>
          )}

          <span className="text-gray-300">
            /
          </span>

          <span className="text-[#1A1A1A] whitespace-nowrap font-semibold">
            {product.name}
          </span>
        </nav>

        {/* =====================================================
            MAIN PRODUCT
        ===================================================== */}

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 mb-2 relative">

          {/* Product Gallery */}

          <div className="w-full lg:w-[55%]">
            <ProductGalleries
              images={product.images || []}
              name={product.name}
            />

            {product.video?.url && (
              <div className="mt-5 border border-gray-200 bg-[#FAFAFA] p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1A1A1A]">
                      Product Video
                    </p>

                    <p className="mt-1 text-[11px] text-gray-500">
                      See the product in detail
                    </p>
                  </div>

                  {product.video.duration ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {product.video.duration.toFixed(
                        1
                      )}{" "}
                      sec
                    </span>
                  ) : null}
                </div>

                <div className="aspect-video overflow-hidden bg-black">
                  <video
                    src={product.video.url}
                    poster={
                      product.images?.[0]?.url ||
                      undefined
                    }
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* =====================================================
              PRODUCT INFORMATION
          ===================================================== */}

          <div className="w-full lg:w-[45%] flex flex-col pt-4 min-w-0">

            <div className="flex flex-col mb-4 min-w-0">

              <h1
                data-testid="product-name"
                className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] leading-tight pr-4 tracking-tight"
              >
                {product.name}
              </h1>

              {product.sku && (
                <p className="text-xs text-[#1A1A1A] mt-2 font-semibold uppercase tracking-widest">
                  SKU:{" "}
                  <span className="text-[#1A1A1A]">
                    {product.sku}
                  </span>
                </p>
              )}

            </div>

            {/* =====================================================
                SHORT DESCRIPTION
            ===================================================== */}

            {product.shortDescription && (
              <div className="relative mb-6 min-w-0 w-full">

                <input
                  type="checkbox"
                  id="short-desc-toggle"
                  className="peer sr-only"
                />

                <div
                  className="
                    product-description
                    text-[15px]
                    text-[#1A1A1A]
                    leading-relaxed
                    prose
                    prose-sm
                    max-w-none
                    w-full
                    min-w-0
                    relative
                    overflow-hidden
                    max-h-[4.5rem]
                    peer-checked:max-h-[2000px]
                    transition-all
                    duration-500
                    ease-in-out
                    prose-p:text-[#1A1A1A]
                    prose-headings:text-[#1A1A1A]
                    prose-li:text-[#1A1A1A]
                    prose-strong:text-[#1A1A1A]
                    prose-img:max-w-full
                    prose-img:h-auto
                    prose-img:mx-auto
                    prose-table:block
                    prose-table:w-full
                    prose-table:max-w-full
                  "
                  dangerouslySetInnerHTML={{
                    __html: cleanHTML(product.shortDescription),
                  }}
                />

                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent peer-checked:hidden pointer-events-none" />

                <label
                  htmlFor="short-desc-toggle"
                  className="inline-block mt-3 mb-2 text-xs font-bold uppercase tracking-widest cursor-pointer underline underline-offset-4 peer-checked:hidden hover:text-gray-400 transition-colors"
                  style={{
                    color: "#1A1A1A",
                    opacity: 1,
                  }}
                >
                  Read More
                </label>

                <label
                  htmlFor="short-desc-toggle"
                  className="hidden mt-3 mb-2 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] cursor-pointer underline underline-offset-4 peer-checked:inline-block hover:text-gray-400 transition-colors"
                >
                  Show Less
                </label>

              </div>
            )}

            {/* =====================================================
                PRICING
            ===================================================== */}

            <div className="flex flex-col mb-4">

              <div className="flex items-center gap-4 mb-1">

                {hasSale ? (
                  <>
                    <span className="text-sm font-semibold uppercase tracking-widest text-[#1A1A1A]">
                      MRP:
                    </span>

                    <span className="text-lg text-[#1A1A1A] line-through decoration-1">
                      ₹
                      {product.price.toLocaleString()}
                    </span>

                    <span className="text-2xl font-bold text-[#C1121F]">
                      ₹{price.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-[#1A1A1A]">
                    ₹{price.toLocaleString()}
                  </span>
                )}

              </div>

              <p className="text-xs text-[#1A1A1A] font-medium uppercase tracking-wide">
                Price inclusive of all taxes
              </p>

            </div>

            {/* =====================================================
                VARIANTS
            ===================================================== */}

            <ProductVariantPanel
              productId={product._id}
              name={product.name}
              image={
                product.images?.[0]?.url || ""
              }
              price={
                product.salePrice ??
                product.price
              }
              slug={product.slug}
              stock={product.stock}
              sizes={displaySizes}
              colors={displayColors}
              variants={product.variants || []}
              images={product.images || []}
              badge={product.badge}
            />

            {/* =====================================================
                RATINGS
            ===================================================== */}

            {ratingCount > 0 && (
              <div className="flex items-center gap-3 mt-6 mb-6 pb-6 border-b border-gray-200">

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(
                    (star) => (
                      <Star
                        key={star}
                        size={16}
                        className={
                          star <=
                          Math.round(
                            averageRating
                          )
                            ? "fill-[#1A1A1A] text-[#1A1A1A]"
                            : "text-gray-200"
                        }
                      />
                    )
                  )}
                </div>

                <span className="text-sm font-medium text-[#1A1A1A] uppercase tracking-wide">
                  ({ratingCount} Reviews)
                </span>

              </div>
            )}

            {/* =====================================================
                PINCODE
            ===================================================== */}

            <div className="bg-[#FAFAFA] border border-gray-200 p-6 mt-4 mb-2">

              <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] mb-4">
                Delivery Estimate
              </p>

              <div className="bg-white">
                <PincodeChecker />
              </div>

            </div>

          </div>
        </div>

        {/* =====================================================
            DESCRIPTION + REVIEWS
        ===================================================== */}

        <div className="max-w-4xl mx-auto space-y-10 py-8 border-t border-gray-200 mt-4 min-w-0">

          {/* =====================================================
              PRODUCT DESCRIPTION
          ===================================================== */}

          <section className="min-w-0">

            <h2 className="text-xl md:text-2xl font-semibold text-[#1A1A1A] mb-5 uppercase tracking-wide underline underline-offset-[8px] decoration-2">
              Product Description
            </h2>

            {product.description ? (
              <div className="relative min-w-0 w-full">

                <input
                  type="checkbox"
                  id="full-desc-toggle"
                  className="peer sr-only"
                />

                <div
                  className="
                    product-description
                    prose
                    prose-sm
                    md:prose-base
                    prose-p:leading-relaxed
                    max-w-none
                    w-full
                    min-w-0
                    text-[#1A1A1A]
                    relative
                    overflow-hidden
                    max-h-[150px]
                    peer-checked:max-h-[5000px]
                    transition-all
                    duration-700
                    ease-in-out
                    prose-p:text-[#1A1A1A]
                    prose-headings:text-[#1A1A1A]
                    prose-li:text-[#1A1A1A]
                    prose-strong:text-[#1A1A1A]
                    prose-img:max-w-full
                    prose-img:h-auto
                    prose-img:mx-auto
                    prose-video:max-w-full
                    prose-video:h-auto
                    prose-iframe:max-w-full
                    prose-table:block
                    prose-table:w-full
                    prose-table:max-w-full
                  "
                  dangerouslySetInnerHTML={{
                    __html: cleanHTML(product.description),
                  }}
                />

                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent peer-checked:hidden pointer-events-none" />

                <label
                  htmlFor="full-desc-toggle"
                  className="inline-block mt-4 mb-6 text-xs font-bold uppercase tracking-widest cursor-pointer underline peer-checked:hidden transition-colors hover:text-gray-400"
                  style={{
                    color: "#1A1A1A",
                    opacity: 1,
                  }}
                >
                  Read Full Description
                </label>

                <label
                  htmlFor="full-desc-toggle"
                  className="hidden mt-4 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] cursor-pointer underline peer-checked:inline-block hover:text-gray-400 transition-colors"
                >
                  Show Less
                </label>

              </div>
            ) : (
              <p className="italic text-[#1A1A1A] text-sm">
                No detailed description available.
              </p>
            )}

          </section>

          {/* =====================================================
              CUSTOMER REVIEWS
          ===================================================== */}

          <section className="pt-8 border-t border-gray-200">

            <div className="flex items-center justify-between mb-10">

              <h2 className="text-xl md:text-2xl font-semibold text-[#1A1A1A] uppercase tracking-wide underline underline-offset-[8px] decoration-2">
                Customer Reviews
              </h2>

            </div>

            {reviews.length > 0 ? (
              <div className="space-y-8 mb-12">

                {reviews.map((review) => (

                  <div
                    key={review._id}
                    className="pb-8 border-b border-gray-100 last:border-0"
                  >

                    <div className="flex items-start justify-between mb-4">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 bg-gray-100 border border-gray-200 flex items-center justify-center text-[#1A1A1A] font-bold uppercase shrink-0">
                          {review.user?.name?.[0] ||
                            "U"}
                        </div>

                        <div>

                          <p className="font-semibold text-[#1A1A1A]">
                            {review.user?.name ||
                              "Anonymous"}
                          </p>

                          <div className="flex items-center gap-1 mt-1">

                            {[1, 2, 3, 4, 5].map(
                              (star) => (
                                <Star
                                  key={star}
                                  size={14}
                                  className={
                                    star <=
                                    review.rating
                                      ? "fill-[#1A1A1A] text-[#1A1A1A]"
                                      : "text-gray-200"
                                  }
                                />
                              )
                            )}

                          </div>
                        </div>

                      </div>

                      <span className="text-xs font-medium text-[#1A1A1A] uppercase tracking-widest">
                        {new Date(
                          review.createdAt
                        ).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>

                    </div>

                    {review.comment && (
                      <p className="text-[#1A1A1A] leading-relaxed ml-16 text-sm md:text-base">
                        {review.comment}
                      </p>
                    )}

                  </div>

                ))}

              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 p-8 text-center mb-8">

                <p className="text-[#1A1A1A] font-medium">
                  No reviews yet. Be the first to
                  share your thoughts!
                </p>

              </div>
            )}

            <ReviewForm
              productId={product._id}
            />

          </section>

        </div>

        {/* =====================================================
            KEEP EXPLORING
        ===================================================== */}

        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">

            <h2 className="text-xl md:text-2xl text-center font-semibold text-[#1A1A1A] mb-12 uppercase tracking-wide">
              Keep Exploring
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

              {relatedProducts.map(
                (relatedProduct) => (

                  <Link
                    key={relatedProduct._id}
                    href={`/product/${relatedProduct.slug}`}
                    className="group flex flex-col min-w-0"
                  >

                    <div className="relative aspect-square w-full overflow-hidden bg-gray-50 border border-transparent group-hover:border-gray-200 transition-colors mb-4">

                      {relatedProduct.images[0] ? (
                        <Image
                          src={
                            relatedProduct
                              .images[0]
                              .url
                          }
                          alt={
                            relatedProduct.name
                          }
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">

                          <span className="text-[#1A1A1A] text-xs font-medium uppercase">
                            No Image
                          </span>

                        </div>
                      )}

                    </div>

                    <h3 className="font-semibold text-[#1A1A1A] text-sm mb-1 line-clamp-1 group-hover:underline">
                      {relatedProduct.name}
                    </h3>

                    <div className="flex items-center gap-2">

                      <p className="font-bold text-[#1A1A1A] text-sm">
                        ₹
                        {(
                          relatedProduct.salePrice ||
                          relatedProduct.price
                        ).toLocaleString()}
                      </p>

                      {relatedProduct.salePrice && (
                        <p className="text-xs text-[#1A1A1A] line-through">
                          ₹
                          {relatedProduct.price.toLocaleString()}
                        </p>
                      )}

                    </div>

                  </Link>

                )
              )}

            </div>

          </div>
        )}

      </div>
    </>
  );
}
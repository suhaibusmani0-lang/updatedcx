import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import ProductModel from "@/models/Product.model";
import CategoryModel from "@/models/Category.model";

function numberOrNull(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function POST(request) {
  const deny = await requireAdmin();
  if (deny) return deny;

  try {
    await connectDB();
    const body = await request.json();

    const {
      name,
      slug,
      sku,
      description = "",
      shortDescription = "",
      price,
      salePrice,
      category,
      badge = "",
      stock = 0,
      sizes = [],
      colors = [],
      images = [],
      video = null,
      variants = [],
      isFeatured = false,
      isNewArrival = false,
      isBestSeller = false,
      isActive = true,
    } = body || {};

    if (!name || !slug || !sku || price === undefined || price === null || !category) {
      return jsonRes(400, "Name, slug, sku, price and category are required");
    }

    const numericPrice = Number(price);
    const numericSalePrice = numberOrNull(salePrice);
    const numericStock = Number.parseInt(stock, 10);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return jsonRes(400, "Price must be a positive number");
    }

    if (numericSalePrice !== null) {
      if (numericSalePrice < 0) return jsonRes(400, "Sale price must be non-negative");
      if (numericSalePrice > numericPrice) {
        return jsonRes(400, "Sale price cannot be greater than regular price");
      }
    }

    if (!Number.isFinite(numericStock) || numericStock < 0) {
      return jsonRes(400, "Stock must be a non-negative number");
    }

    if (!Array.isArray(images) || images.length < 1 || images.length > 10) {
      return jsonRes(400, "At least 1 and at most 10 product images are required");
    }

    const categoryExists = await CategoryModel.exists({ _id: category });
    if (!categoryExists) return jsonRes(400, "Selected category was not found");

    const exists = await ProductModel.findOne({ slug });
    if (exists) return jsonRes(400, "Slug already exists");

    const skuExists = await ProductModel.findOne({ sku });
    if (skuExists) return jsonRes(400, "SKU already exists");

    const cleanImages = images
      .filter((image) => image && typeof image === "object" && image.url)
      .map((image) => ({
        url: String(image.url),
        public_id: image.public_id ? String(image.public_id) : "",
        alt: image.alt ? String(image.alt) : "",
      }));

    if (!cleanImages.length) return jsonRes(400, "Valid product images are required");

    let cleanVideo = { url: "", public_id: "", duration: 0, format: "" };
    if (video && typeof video === "object" && video.url) {
      cleanVideo = {
        url: String(video.url),
        public_id: video.public_id ? String(video.public_id) : "",
        duration: Number(video.duration || 0),
        format: video.format ? String(video.format) : "",
      };
      if (cleanVideo.duration > 30.05) {
        return jsonRes(400, "Product video must be 30 seconds or shorter.");
      }
    }

    const cleanVariants = Array.isArray(variants)
      ? variants.slice(0, 100).map((variant) => ({
          size: variant?.size ? String(variant.size) : "",
          color: variant?.color ? String(variant.color) : "",
          stock: Math.max(0, Number.parseInt(variant?.stock ?? 0, 10) || 0),
          sku: variant?.sku ? String(variant.sku) : "",
          price: numberOrNull(variant?.price),
          salePrice: numberOrNull(variant?.salePrice),
          image: variant?.image ? String(variant.image) : "",
        }))
      : [];

    const product = await ProductModel.create({
      name: String(name).trim(),
      slug: String(slug).trim().toLowerCase(),
      sku: String(sku).trim().toUpperCase(),
      description: String(description || ""),
      shortDescription: String(shortDescription || ""),
      price: numericPrice,
      salePrice: numericSalePrice,
      category,
      images: cleanImages,
      video: cleanVideo,
      badge: String(badge || ""),
      sizes: Array.isArray(sizes) ? sizes.map(String) : [],
      colors: Array.isArray(colors) ? colors.map(String) : [],
      stock: numericStock,
      variants: cleanVariants,
      isFeatured: Boolean(isFeatured),
      isNewArrival: Boolean(isNewArrival),
      isBestSeller: Boolean(isBestSeller),
      isActive: Boolean(isActive),
    });

    return jsonRes(201, "Product created", product);
  } catch (error) {
    console.error("[Admin Products Create]", error);
    return jsonRes(500, error?.message || "Failed to create product");
  }
}

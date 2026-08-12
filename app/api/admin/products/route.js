import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import ProductModel from "@/models/Product.model";
import CategoryModel from "@/models/Category.model";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with your environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const isFeatured = searchParams.get("isFeatured") === "true";
    const isNewArrival = searchParams.get("isNewArrival") === "true";
    const isBestSeller = searchParams.get("isBestSeller") === "true";

    const query = { isDeleted: { $ne: true } };
    const status = searchParams.get("status");
    if (status === "active") query.isActive = true;
    else if (status === "inactive") query.isActive = false;
    if (search) query.name = { $regex: search, $options: "i" };
    if (category) query.category = category;
    if (isFeatured) query.isFeatured = true;
    if (isNewArrival) query.isNewArrival = true;
    if (isBestSeller) query.isBestSeller = true;

    const [products, total] = await Promise.all([
      // Do not use populate() here. A legacy product with a stale/invalid
      // category id can make populate throw and turn the entire admin list into 500.
      ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(query),
    ]);

    // Resolve categories in one query and safely leave missing categories as null.
    // This keeps the admin products page usable even if old data contains a
    // deleted category or a malformed category reference.
    const categoryIds = [
      ...new Set(
        products
          .map((product) => product?.category)
          .filter((id) => id && typeof id === "object" && id.toString)
          .map((id) => id.toString())
      ),
    ];

    let categoryMap = new Map();
    if (categoryIds.length) {
      try {
        const categories = await CategoryModel.find({ _id: { $in: categoryIds } })
          .select("name slug")
          .lean();
        categoryMap = new Map(categories.map((item) => [item._id.toString(), item]));
      } catch (categoryError) {
        console.error("[Admin Products] Category lookup failed:", categoryError);
      }
    }

    const safeProducts = products.map((product) => ({
      ...product,
      category: product?.category
        ? categoryMap.get(product.category.toString()) || null
        : null,
    }));

    return jsonRes(200, "Products fetched", {
      products: safeProducts,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("[Admin Products GET] Failed to fetch products:", e);
    return jsonRes(500, e?.message || "Failed to fetch products");
  }
}

export async function POST(req) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const formData = await req.formData();
    const name = formData.get("name");
    const slug = formData.get("slug");
    const sku = formData.get("sku");
    const description = formData.get("description") || "";
    const shortDescription = formData.get("shortDescription") || "";
    const price = formData.get("price");
    const salePrice = formData.get("salePrice");
    const category = formData.get("category");
    const badge = formData.get("badge") || "";
    const stock = formData.get("stock") || "0";
    const sizes = formData.getAll("sizes");
    const colors = formData.getAll("colors");
    const isFeatured = formData.get("isFeatured") === "true";
    const isNewArrival = formData.get("isNewArrival") === "true";
    const isBestSeller = formData.get("isBestSeller") === "true";
    const isActive = formData.get("isActive") === "true";

    if (!name || !slug || !sku || !price || !category) {
      return jsonRes(400, "Name, slug, sku, price and category are required");
    }

    const numericPrice = Number.parseFloat(price);
    const numericSalePrice =
      salePrice !== null && salePrice !== undefined && String(salePrice).trim() !== ""
        ? Number.parseFloat(salePrice)
        : null;

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return jsonRes(400, "Price must be a positive number");
    }

    if (numericSalePrice !== null) {
      if (!Number.isFinite(numericSalePrice) || numericSalePrice < 0) {
        return jsonRes(400, "Sale price must be a valid non-negative number");
      }
      if (numericSalePrice > numericPrice) {
        return jsonRes(400, "Sale price cannot be greater than regular price");
      }
    }

    const exists = await ProductModel.findOne({ slug });
    if (exists) return jsonRes(400, "Slug already exists");

    const skuExists = await ProductModel.findOne({ sku });
    if (skuExists) return jsonRes(400, "SKU already exists");

    const images = [];
    const imageFiles = formData.getAll("images");
    const videoFile = formData.get("video");

    let video = { url: "", public_id: "", duration: 0, format: "" };
    if (videoFile && typeof videoFile.arrayBuffer === "function" && videoFile.size > 0) {
      const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
      if (!allowedVideoTypes.includes(videoFile.type)) {
        return jsonRes(400, "Product video must be MP4, WebM, or MOV.");
      }
      if (videoFile.size > 50 * 1024 * 1024) {
        return jsonRes(400, "Product video must be 50MB or smaller.");
      }
      try {
        const bytes = await videoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "products/videos", resource_type: "video", quality: "auto", fetch_format: "auto" },
            (error, result) => error ? reject(error) : resolve(result)
          ).end(buffer);
        });
        const duration = Number(result?.duration || 0);
        if (duration > 30.05) {
          if (result?.public_id) {
            await cloudinary.uploader.destroy(result.public_id, { resource_type: "video" });
          }
          return jsonRes(400, "Product video must be 30 seconds or shorter.");
        }
        video = {
          url: result.secure_url,
          public_id: result.public_id,
          duration,
          format: result.format || videoFile.type.split("/")[1] || "mp4",
        };
      } catch (uploadError) {
        console.error("Product video upload error:", uploadError);
        return jsonRes(500, `Failed to upload product video: ${uploadError.message}`);
      }
    }
    
    for (const imageFile of imageFiles) {
      if (imageFile && imageFile.size > 0) {
        try {
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { 
                folder: "products", 
                resource_type: "image",
                transformation: [{ quality: "auto", fetch_format: "auto" }]
              },
              (error, result) => error ? reject(error) : resolve(result)
            ).end(buffer);
          });
          images.push({ url: result.secure_url, public_id: result.public_id });
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          return jsonRes(500, `Failed to upload image: ${uploadError.message}`);
        }
      }
    }

    const variants = [];
    const variantData = formData.get("variants");
    const variantImageFiles = new Map();

    for (const [key, value] of formData.entries()) {
      if (typeof key === "string" && key.startsWith("variantImage_")) {
        const index = Number(key.split("_")[1]);
        if (!Number.isNaN(index) && value && typeof value.arrayBuffer === "function") {
          variantImageFiles.set(index, value);
        }
      }
    }

    if (variantData) {
      try {
        const parsedVariants = JSON.parse(variantData);
        if (Array.isArray(parsedVariants)) {
          for (let index = 0; index < parsedVariants.length; index++) {
            const variant = parsedVariants[index];
            if (!variant || typeof variant !== "object") continue;
            const parsedVariant = {
              size: variant.size || "",
              color: variant.color || "",
              stock: Number(variant.stock || 0),
              sku: variant.sku || "",
              price: variant.price ? Number(variant.price) : null,
              salePrice: variant.salePrice ? Number(variant.salePrice) : null,
              image: variant.image || "",
            };

            const file = variantImageFiles.get(index);
            if (file && typeof file.arrayBuffer === "function") {
              try {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const result = await new Promise((resolve, reject) => {
                  cloudinary.uploader.upload_stream(
                    { folder: "products/variants", resource_type: "image", transformation: [{ quality: "auto", fetch_format: "auto" }] },
                    (error, result) => error ? reject(error) : resolve(result)
                  ).end(buffer);
                });
                if (result && result.secure_url) parsedVariant.image = result.secure_url;
              } catch (uploadError) {
                console.error("Error uploading variant image:", uploadError);
              }
            }

            if (
              parsedVariant.size || parsedVariant.color || parsedVariant.sku || parsedVariant.stock ||
              parsedVariant.price !== null || parsedVariant.salePrice !== null || parsedVariant.image
            ) {
              variants.push(parsedVariant);
            }
          }
        }
      } catch (e) {
        console.error("Error parsing variants:", e);
      }
    }

    const product = await ProductModel.create({
      name, slug, sku, description, shortDescription, price: numericPrice,
      salePrice: numericSalePrice, category, images, video, badge, sizes, colors,
      stock: parseInt(stock), variants, isFeatured, isNewArrival, isBestSeller, isActive,
    });
    
    return jsonRes(201, "Product created", product);
  } catch (e) {
    console.error("Product creation error:", e);
    return jsonRes(500, e.message);
  }
}
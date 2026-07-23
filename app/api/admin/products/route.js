import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import ProductModel from "@/models/Product.model";
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
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
      ProductModel.find(query).populate("category", "name slug").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      ProductModel.countDocuments(query),
    ]);
    return jsonRes(200, "Products fetched", { products, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    return jsonRes(500, e.message);
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
    const isFeatured = formData.get("isFeatured") === "true";
    const isNewArrival = formData.get("isNewArrival") === "true";
    const isBestSeller = formData.get("isBestSeller") === "true";
    const isActive = formData.get("isActive") === "true";

    if (!name || !slug || !sku || !price || !category) {
      return jsonRes(400, "Name, slug, sku, price and category are required");
    }

    const exists = await ProductModel.findOne({ slug });
    if (exists) return jsonRes(400, "Slug already exists");

    const skuExists = await ProductModel.findOne({ sku });
    if (skuExists) return jsonRes(400, "SKU already exists");

    const images = [];
    const imageFiles = formData.getAll("images");
    
    // Upload images to Cloudinary
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
                transformation: [
                  { quality: "auto", fetch_format: "auto" }
                ]
              },
              (error, result) => {
                if (error) {
                  console.error("Cloudinary upload error:", error);
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            ).end(buffer);
          });
          
          images.push({ 
            url: result.secure_url, 
            public_id: result.public_id 
          });
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          return jsonRes(500, `Failed to upload image: ${uploadError.message}`);
        }
      }
    }

    const variants = [];
    const variantData = formData.get("variants");
    if (variantData) {
      try {
        const parsedVariants = JSON.parse(variantData);
        variants.push(...parsedVariants);
      } catch (e) {
        console.error("Error parsing variants:", e);
      }
    }

    const product = await ProductModel.create({
      name,
      slug,
      sku,
      description,
      shortDescription,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      category,
      images,
      badge,
      stock: parseInt(stock),
      variants,
      isFeatured,
      isNewArrival,
      isBestSeller,
      isActive,
    });
    
    return jsonRes(201, "Product created", product);
  } catch (e) {
    console.error("Product creation error:", e);
    return jsonRes(500, e.message);
  }
}
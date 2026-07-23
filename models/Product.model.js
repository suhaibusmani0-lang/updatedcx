 import mongoose from "mongoose";

 const variantSchema = new mongoose.Schema({
   size: { type: String, default: "" },
   color: { type: String, default: "" },
   stock: { type: Number, default: 0 },
   sku: { type: String, default: "" },
 });

 const productSchema = new mongoose.Schema({
   name: { type: String, required: true, trim: true },
   slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
   sku: { type: String, required: true, unique: true },
   description: { type: String, default: "" },
   shortDescription: { type: String, default: "" },
   price: { type: Number, required: true, min: 0 },
   salePrice: { type: Number, default: null },
   category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
   images: [{
     url: { type: String, required: true },
     public_id: { type: String, default: "" },
   }],
   badge: { type: String, default: "" },
   variants: [variantSchema],
   stock: { type: Number, default: 0 },
   isActive: { type: Boolean, default: true },
   isResized: { type: Boolean, default: false },
   isFeatured: { type: Boolean, default: false },
   isNewArrival: { type: Boolean, default: false },
   isBestSeller: { type: Boolean, default: false },
   isDeleted: { type: Boolean, default: false },
   deletedAt: { type: Date, default: null },
   ratings: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
 }, { timestamps: true });

 const ProductModel = mongoose.models.Product || mongoose.model("Product", productSchema, "products");
 export default ProductModel;


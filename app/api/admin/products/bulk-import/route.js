import { connectDB } from "@/lib/databaseConnection";
import { requireAdmin, jsonRes } from "@/lib/adminMiddleware";
import ProductModel from "@/models/Product.model";
import CategoryModel from "@/models/Category.model";
import * as XLSX from "xlsx";
import { parseBooleanValue, parseNumberValue, normalizeBadge } from "@/lib/bulkImport";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const slugify = (value) => {
  if (!value) return "";
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 200);
};

const generateSku = async (name) => {
  const normalized = slugify(name).replace(/-/g, "").slice(0, 10).toUpperCase();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = normalized ? `${normalized}-${suffix}` : `PRD-${Date.now()}-${suffix}`;
    const exists = await ProductModel.findOne({ sku: candidate }).lean();
    if (!exists) return candidate;
  }
  return `PRD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

const findCategory = async (value) => {
  if (!value || !String(value).trim()) return null;
  const raw = String(value).trim();
  const slug = slugify(raw);
  const category = await CategoryModel.findOne({
    $or: [
      { slug },
      { name: new RegExp(`^${raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    ],
  }).lean();
  return category;
};

export async function POST(request) {
  console.log("[Bulk Import] Starting...");
  const deny = await requireAdmin();
  if (deny) {
    console.log("[Bulk Import] Admin check failed:", deny);
    return deny;
  }

  try {
    await connectDB();
    console.log("[Bulk Import] Connected to DB");
    
    const formData = await request.formData();
    console.log("[Bulk Import] FormData received, keys:", Array.from(formData.keys()));
    
    const upload = formData.get("file");
    console.log("[Bulk Import] File received:", upload?.name, "Size:", upload?.size);

    if (!upload || typeof upload.arrayBuffer !== "function") {
      console.log("[Bulk Import] Invalid file upload");
      return jsonRes(400, "Please provide an Excel (.xlsx) file.");
    }

    const fileName = String(upload.name || "").toLowerCase();
    if (!fileName.endsWith(".xlsx")) {
      return jsonRes(400, "Only .xlsx files are supported.");
    }

    const fileSize = upload.size || 0;
    if (fileSize > MAX_FILE_SIZE) {
      return jsonRes(400, "File size exceeds the 5MB limit.");
    }

    const rawBuffer = await upload.arrayBuffer();
    const workbook = XLSX.read(rawBuffer, { type: "array" });
    if (!workbook.SheetNames.length) {
      return jsonRes(400, "The Excel file does not contain any sheets.");
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (!rows.length) {
      return jsonRes(400, "The Excel template is empty. Add at least one product row.");
    }

    const results = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    console.log("[Bulk Import] Processing", rows.length, "rows");

    const seenSlugs = new Set();
    const seenSkus = new Set();

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      const row = rows[index];
      console.log(`[Bulk Import] Processing row ${rowNumber}:`, row.Name || row["Product Name"]);

      const name = String(row["Name"] || row["Product Name"] || "").trim();
      const categoryValue = String(row["Category"] || "").trim();
      const priceValue = parseNumberValue(row["Price"]);
      const stockValue = parseNumberValue(row["Stock"]);
      const description = String(row["Description"] || "").trim();
      const shortDescription = String(row["Short Description"] || "").trim();
      const badgeValue = String(row["Badge"] || "").trim();
      const statusValue = String(row["Status"] || "").trim();
      const featuredValue = String(row["Featured"] || "").trim();
      const newArrivalValue = String(row["New Arrival"] || "").trim();
      const bestSellerValue = String(row["Best Seller"] || "").trim();
      const salePriceValue = parseNumberValue(row["Sale Price"]);

      if (!name) {
        results.errors.push({ row: rowNumber, message: "Name is required." });
        results.skipped += 1;
        continue;
      }
      if (!categoryValue) {
        results.errors.push({ row: rowNumber, message: "Category is required." });
        results.skipped += 1;
        continue;
      }
      if (priceValue === null || Number.isNaN(priceValue)) {
        results.errors.push({ row: rowNumber, message: "Price is required and must be a number." });
        results.skipped += 1;
        continue;
      }
      const price = priceValue;
      if (price < 0) {
        results.errors.push({ row: rowNumber, message: "Price cannot be negative." });
        results.skipped += 1;
        continue;
      }
      let salePrice = null;
      if (salePriceValue !== null) {
        salePrice = salePriceValue;
        if (salePrice < 0) {
          results.errors.push({ row: rowNumber, message: "Sale Price cannot be negative." });
          results.skipped += 1;
          continue;
        }
      }
      const stock = stockValue === null ? 0 : stockValue;
      if (Number.isNaN(stock) || stock < 0) {
        results.errors.push({ row: rowNumber, message: "Stock must be a non-negative number." });
        results.skipped += 1;
        continue;
      }

      const badge = normalizeBadge(badgeValue);

      const isActive = parseBooleanValue(statusValue) ?? true;
      const isFeatured = parseBooleanValue(featuredValue) ?? false;
      const isNewArrival = parseBooleanValue(newArrivalValue) ?? false;
      const isBestSeller = parseBooleanValue(bestSellerValue) ?? false;

      const slug = slugify(name) || `product-${Date.now()}-${rowNumber}`;
      if (seenSlugs.has(slug)) {
        results.errors.push({ row: rowNumber, message: "Duplicate product slug detected inside file." });
        results.skipped += 1;
        continue;
      }

      const existingBySlug = await ProductModel.findOne({ slug }).lean();
      if (existingBySlug) {
        results.errors.push({ row: rowNumber, message: "A product with this slug already exists." });
        results.skipped += 1;
        continue;
      }

      const sku = await generateSku(name);
      if (seenSkus.has(sku)) {
        results.errors.push({ row: rowNumber, message: "Duplicate SKU generated inside file." });
        results.skipped += 1;
        continue;
      }
      const existingBySku = await ProductModel.findOne({ sku }).lean();
      if (existingBySku) {
        results.errors.push({ row: rowNumber, message: "A product with this SKU already exists." });
        results.skipped += 1;
        continue;
      }

      const category = await findCategory(categoryValue);
      if (!category) {
        results.errors.push({ row: rowNumber, message: `Category not found: '${categoryValue}'` });
        results.skipped += 1;
        continue;
      }

      seenSlugs.add(slug);
      seenSkus.add(sku);

      const productData = {
        name,
        slug,
        sku,
        description,
        shortDescription,
        price,
        salePrice,
        category: category._id,
        badge,
        stock,
        isActive,
        isFeatured,
        isNewArrival,
        isBestSeller,
      };

      try {
        const created = await ProductModel.create(productData);
        console.log(`[Bulk Import] Row ${rowNumber} created successfully:`, created._id);
        results.imported += 1;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to create product.";
        console.log(`[Bulk Import] Row ${rowNumber} failed:`, errorMsg);
        results.errors.push({ row: rowNumber, message: errorMsg });
        results.skipped += 1;
      }
    }

    console.log("[Bulk Import] Complete - Imported:", results.imported, "Skipped:", results.skipped);
    return jsonRes(200, "Bulk import finished.", results);
  } catch (error) {
    console.error("[Bulk Import] Fatal error:", error);
    return jsonRes(500, error instanceof Error ? error.message : "Import failed.");
  }
}
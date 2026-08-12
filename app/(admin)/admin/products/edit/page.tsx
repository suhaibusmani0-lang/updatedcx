"use client"; // This page needs client-side interactivity (form state, etc.)

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { showToast } from "@/lib/showToast";
import { Plus, Trash2 } from "lucide-react";

// 🔥 USING react-quill-new FOR REACT 19 COMPATIBILITY (Same as Add Page)
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"], // Added 'link' to match Add Page
  ],
};

// Added bg-white so the editor looks clean
const quillWrapperCls = "w-full border rounded-lg overflow-hidden transition bg-white border-gray-300 [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[100px]";

// Types for your data
interface Category {
  _id: string;
  name: string;
}

interface ProductImage {
  url: string;
  // add other fields if needed
}

interface ProductVariantInput {
  size: string;
  color: string;
  stock: string;
  sku: string;
  price: string;
  salePrice: string;
  image: string;
  imageFile?: File | null;
}

interface ProductForm {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: string;
  salePrice: string;
  category: string; // we store the category ID as string
  stock: string;
  sizes: string;
  colors: string;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  images: ProductImage[];
}

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProductPage({ params }: Props) {
  const router = useRouter();
  
  // ---------- State ----------
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [id, setId] = useState<string>("");

  // Form fields
  const [form, setForm] = useState<ProductForm>({
    name: "",
    slug: "",
    sku: "",
    description: "",
    shortDescription: "",
    price: "",
    salePrice: "",
    category: "",
    stock: "",
    sizes: "",
    colors: "",
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    images: [],
  });

  // New image files to upload
  const [newImages, setNewImages] = useState<File[]>([]);
  const [variants, setVariants] = useState<ProductVariantInput[]>([]);

  // ---------- Fetch product & categories ----------
  useEffect(() => {
    async function unwrapParamsAndFetch() {
      try {
        const unwrappedParams = await params;
        const productId = unwrappedParams.id;
        setId(productId);

        setLoading(true);
        // 1) Fetch product details
        const productRes = await fetch(`/api/admin/products/${productId}`);
        if (!productRes.ok) throw new Error("Failed to fetch product");
        const productData = await productRes.json();
        // Ensure category is stored as string (ID)
        const product = productData.product;
        
        setForm({
          ...product,
          category: product.category?._id || product.category || "",
          sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : product.sizes || "",
          colors: Array.isArray(product.colors) ? product.colors.join(", ") : product.colors || "",
        });

        setVariants(
          Array.isArray(product.variants)
            ? product.variants.map((variant: any) => ({
                size: String(variant.size || ""),
                color: String(variant.color || ""),
                stock: String(variant.stock ?? "0"),
                sku: String(variant.sku || ""),
                price: variant.price != null ? String(variant.price) : "",
                salePrice: variant.salePrice != null ? String(variant.salePrice) : "",
                image: String(variant.image || ""),
                imageFile: null,
              }))
            : []
        );

        // 2) Fetch categories for dropdown
        const catRes = await fetch("/api/admin/categories");
        if (!catRes.ok) throw new Error("Failed to fetch categories");
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }
    
    unwrapParamsAndFetch();
  }, [params]);

  // ---------- Handle text/select/checkbox changes ----------
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type} = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // ---------- Handle Rich Text changes ----------
  function handleRichTextChange(name: keyof ProductForm, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // ---------- Handle image file selection ----------
  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setNewImages(files);
  }

  const updateVariant = (index: number, field: keyof ProductVariantInput, value: string) => {
    setVariants((prev) => prev.map((variant, variantIndex) => variantIndex === index ? { ...variant, [field]: value } : variant));
  };

  const updateVariantFile = (index: number, file: File | null) => {
    setVariants((prev) => prev.map((variant, variantIndex) => variantIndex === index ? { ...variant, imageFile: file } : variant));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { size: "", color: "", stock: "0", sku: "", price: "", salePrice: "", image: "", imageFile: null }]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, variantIndex) => variantIndex !== index));
  };

  // ---------- Submit update ----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Build FormData
      const formData = new FormData();

      // Append all form fields except images, sizes, colors
      for (const [key, value] of Object.entries(form)) {
        if (key === "images" || key === "sizes" || key === "colors") continue; 
        if (typeof value === "boolean") {
          formData.append(key, String(value));
        } else {
          formData.append(key, value as string);
        }
      }

      if (form.sizes) {
        form.sizes.split(',').map(s => s.trim()).filter(Boolean).forEach(s => formData.append("sizes", s));
      }
      if (form.colors) {
        form.colors.split(',').map(c => c.trim()).filter(Boolean).forEach(c => formData.append("colors", c));
      }

      const variantPayload = variants.map((variant) => ({
        size: variant.size.trim(),
        color: variant.color.trim(),
        stock: Number(variant.stock || 0),
        sku: variant.sku.trim(),
        price: variant.price ? Number(variant.price) : null,
        salePrice: variant.salePrice ? Number(variant.salePrice) : null,
        image: variant.image.trim(),
      }));

      variantPayload.forEach((variant, index) => {
        const file = variants[index]?.imageFile;
        if (file instanceof File) {
          formData.append(`variantImage_${index}`, file);
        }
      });

      formData.append("variants", JSON.stringify(variantPayload));

      // Append new image files
      newImages.forEach((file) => {
        formData.append("images", file); // multiple files under the same field
      });

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        showToast("error", err.message || "Update failed");
        return; // stop execution on error
      }

      // Success -> redirect back to product list
      router.push("/admin/products");
      router.refresh(); // refresh server data
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setSaving(false);
    }
  }

  // ---------- Loading & Error states ----------
  if (loading) return <div className="p-8">Loading product...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  // ---------- Render form ----------
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU *</label>
            <input
              type="text"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 🔥 FIXED: Short Description & Description now use ReactQuill */}
        <div>
          <label className="block text-sm font-medium mb-1">Short Description</label>
          <div className={quillWrapperCls}>
            <ReactQuill
              theme="snow"
              value={form.shortDescription}
              onChange={(val) => handleRichTextChange("shortDescription", val)}
              modules={quillModules}
              placeholder="Brief Product Description..."
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Full Description</label>
          <div className={quillWrapperCls}>
            <ReactQuill
              theme="snow"
              value={form.description}
              onChange={(val) => handleRichTextChange("description", val)}
              modules={quillModules}
              placeholder="Detailed Product Description..."
              className="[&_.ql-editor]:min-h-[200px]"
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price *</label>
            <input
              type="number"
              step="0.01"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sale Price</label>
            <input
              type="number"
              step="0.01"
              name="salePrice"
              value={form.salePrice || ""}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Colors (Comma separated)</label>
            <input
              type="text"
              name="colors"
              value={form.colors}
              onChange={handleChange}
              placeholder="e.g., Red, Blue, Green"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sizes (Comma separated)</label>
            <input
              type="text"
              name="sizes"
              value={form.sizes}
              onChange={handleChange}
              placeholder="e.g., S, M, L, XL"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Variant Options</h3>
              <p className="text-xs text-gray-500">Add stock, SKU, price overrides, and image links for each variant.</p>
            </div>
            <button type="button" onClick={addVariant} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-100">
              <Plus size={16} /> Add Variant
            </button>
          </div>
          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-3 md:grid-cols-5">
                <input value={variant.size} onChange={(e) => updateVariant(index, "size", e.target.value)} placeholder="Size" className="rounded border border-gray-300 px-3 py-2 text-sm" />
                <input value={variant.color} onChange={(e) => updateVariant(index, "color", e.target.value)} placeholder="Color" className="rounded border border-gray-300 px-3 py-2 text-sm" />
                <input type="number" min="0" value={variant.stock} onChange={(e) => updateVariant(index, "stock", e.target.value)} placeholder="Stock" className="rounded border border-gray-300 px-3 py-2 text-sm" />
                <input value={variant.sku} onChange={(e) => updateVariant(index, "sku", e.target.value)} placeholder="SKU" className="rounded border border-gray-300 px-3 py-2 text-sm" />
                <div className="grid grid-cols-1 gap-2">
                  <input type="number" min="0" step="0.01" value={variant.price} onChange={(e) => updateVariant(index, "price", e.target.value)} placeholder="Price" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                  <input type="number" min="0" step="0.01" value={variant.salePrice} onChange={(e) => updateVariant(index, "salePrice", e.target.value)} placeholder="Sale Price" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                  <input value={variant.image} onChange={(e) => updateVariant(index, "image", e.target.value)} placeholder="Image URL" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                  <label className="text-sm text-gray-600">
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateVariantFile(index, e.target.files?.[0] || null)}
                      className="w-full text-sm mt-1"
                    />
                  </label>
                  {variant.imageFile && (
                    <p className="text-xs text-gray-500">Selected file: {variant.imageFile.name}</p>
                  )}
                </div>
                <button type="button" onClick={() => removeVariant(index)} className="mt-1 rounded border border-red-200 p-2 text-red-500 hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Flags (checkboxes) */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={handleChange}
            />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isNewArrival"
              checked={form.isNewArrival}
              onChange={handleChange}
            />
            New Arrival
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isBestSeller"
              checked={form.isBestSeller}
              onChange={handleChange}
            />
            Best Seller
          </label>
        </div>

        {/* Images - existing preview */}
        <div>
          <label className="block text-sm font-medium mb-1">Current Images</label>
          <div className="flex flex-wrap gap-2">
            {form.images?.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden">
                <Image
                  src={img.url}
                  alt="Product"
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Upload new images */}
        <div>
          <label className="block text-sm font-medium mb-1">Add New Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border rounded px-3 py-2"
          />
          {newImages.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {newImages.length} file(s) selected
            </p>
          )}
        </div>

        {/* Submit & Error */}
        {error && <div className="text-red-500">{error}</div>}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#1A1A1A] text-white rounded hover:bg-[#AEAA9B] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Update Product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
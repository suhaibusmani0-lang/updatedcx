"use client"; // This page needs client-side interactivity (form state, etc.)

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { showToast } from "@/lib/showToast";

// Types for your data
interface Category {
  _id: string;
  name: string;
}

interface ProductImage {
  url: string;
  // add other fields if needed
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
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  images: ProductImage[];
}

interface Props {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: Props) {
  const { id } = params;

  const router = useRouter();
  // ---------- State ----------
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

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
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    images: [],
  });

  // New image files to upload
  const [newImages, setNewImages] = useState<File[]>([]);

  // ---------- Fetch product & categories ----------
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 1) Fetch product details
        const productRes = await fetch(`/api/admin/products/${id}`);
        if (!productRes.ok) throw new Error("Failed to fetch product");
        const productData = await productRes.json();
        // Ensure category is stored as string (ID)
        const product = productData.product;
        setForm({
          ...product,
          category: product.category?._id || product.category || "",
        });

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
    fetchData();
  }, [id]);

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

  // ---------- Handle image file selection ----------
  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setNewImages(files);
  }

  // ---------- Submit update ----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Build FormData
      const formData = new FormData();

      // Append all form fields except images (we'll send them separately)
      for (const [key, value] of Object.entries(form)) {
        if (key === "images") continue; // skip existing images array
        if (typeof value === "boolean") {
          formData.append(key, String(value));
        } else {
          formData.append(key, value);
        }
      }

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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Short Description</label>
          <input
            type="text"
            name="shortDescription"
            value={form.shortDescription}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
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
            className="px-6 py-2 bg-[#C17A56] text-white rounded hover:bg-[#a86545] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update Product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
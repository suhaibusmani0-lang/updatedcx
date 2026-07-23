// app/admin/products/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle, CheckCircle, X } from "lucide-react";

interface Category {
  _id: string;
  name: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    sku: "",
    description: "",
    shortDescription: "",
    price: "",
    salePrice: "",
    category: "",
    badge: "",
    stock: "0",
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    isActive: true,
  });

  // Fetch product & categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, catRes] = await Promise.all([
          fetch(`/api/admin/products/${productId}`),
          fetch("/api/admin/categories"),
        ]);
        if (!productRes.ok) throw new Error("Failed to fetch product");
        const productData = await productRes.json();
        if (!productData.ok || !productData.data) throw new Error(productData.message || "Product not found");
        const product = productData.data;

        const catData = await catRes.json();
        setCategories(catData.data || []);

        setForm({
          name: product.name || "",
          slug: product.slug || "",
          sku: product.sku || "",
          description: product.description || "",
          shortDescription: product.shortDescription || "",
          price: product.price?.toString() || "",
          salePrice: product.salePrice?.toString() || "",
          category: product.category?._id || "",
          badge: product.badge || "",
          stock: product.stock?.toString() || "0",
          isFeatured: product.isFeatured || false,
          isNewArrival: product.isNewArrival || false,
          isBestSeller: product.isBestSeller || false,
          isActive: product.isActive !== undefined ? product.isActive : true,
        });
      } catch (error) {
        console.error(error);
        setSubmitError("Failed to load product data");
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchData();
  }, [productId]);

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.sku.trim()) newErrors.sku = "SKU is required";
    if (!form.category) newErrors.category = "Please select a category";
    const priceNum = parseFloat(form.price);
    if (!form.price || isNaN(priceNum) || priceNum <= 0)
      newErrors.price = "Price must be a positive number";
    const salePriceNum = parseFloat(form.salePrice);
    if (form.salePrice && (isNaN(salePriceNum) || salePriceNum < 0))
      newErrors.salePrice = "Sale price must be positive";
    if (form.salePrice && salePriceNum >= priceNum)
      newErrors.salePrice = "Sale price must be less than regular price";
    const stockNum = parseInt(form.stock);
    if (!form.stock || isNaN(stockNum) || stockNum < 0)
      newErrors.stock = "Stock must be a non‑negative number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "name") {
      setForm((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
    } else if (name === "sku") {
      setForm((prev) => ({ ...prev, sku: value.toUpperCase() }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      document.querySelector(`[name="${firstError}"]`)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setSaving(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        payload.append(key, String(val));
      });

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        body: payload,
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitSuccess("Product updated successfully!");
        setIsDirty(false);
        setTimeout(() => router.push("/admin/products"), 1500);
      } else {
        setSubmitError(data.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      setSubmitError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !confirm("Unsaved changes. Leave?")) return;
    router.push("/admin/products");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#C17A56]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

        {submitSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2">
            <CheckCircle className="text-green-600 mt-0.5" size={18} />
            <span className="text-green-800">{submitSuccess}</span>
            <button onClick={() => setSubmitSuccess(null)} className="ml-auto text-green-600">
              <X size={16} />
            </button>
          </div>
        )}
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
            <AlertCircle className="text-red-600 mt-0.5" size={18} />
            <span className="text-red-800">{submitError}</span>
            <button onClick={() => setSubmitError(null)} className="ml-auto text-red-600">
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleInputChange}
              className={`w-full border rounded p-3 focus:ring-2 focus:ring-[#C17A56] ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input
              name="slug"
              value={form.slug}
              readOnly
              className="w-full border border-gray-300 rounded p-3 bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SKU *</label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleInputChange}
              className={`w-full border rounded p-3 focus:ring-2 focus:ring-[#C17A56] ${
                errors.sku ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleInputChange}
              className={`w-full border rounded p-3 focus:ring-2 focus:ring-[#C17A56] ${
                errors.category ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleInputChange}
                className={`w-full border rounded p-3 focus:ring-2 focus:ring-[#C17A56] ${
                  errors.price ? "border-red-500" : "border-gray-300"
                }`}
                step="0.01"
                min="0"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sale Price</label>
              <input
                type="number"
                name="salePrice"
                value={form.salePrice}
                onChange={handleInputChange}
                className={`w-full border rounded p-3 focus:ring-2 focus:ring-[#C17A56] ${
                  errors.salePrice ? "border-red-500" : "border-gray-300"
                }`}
                step="0.01"
                min="0"
              />
              {errors.salePrice && <p className="text-red-500 text-sm mt-1">{errors.salePrice}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stock *</label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleInputChange}
              className={`w-full border rounded p-3 focus:ring-2 focus:ring-[#C17A56] ${
                errors.stock ? "border-red-500" : "border-gray-300"
              }`}
              min="0"
            />
            {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Badge</label>
            <input
              name="badge"
              value={form.badge}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-[#C17A56]"
              placeholder="e.g. Sale, New"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Short Description</label>
            <textarea
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleInputChange}
              rows={2}
              className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-[#C17A56]"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Full Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              rows={5}
              className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-[#C17A56]"
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded">
            {[
              ["isFeatured", "Featured"],
              ["isNewArrival", "New Arrival"],
              ["isBestSeller", "Best Seller"],
              ["isActive", "Active"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name={key}
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#C17A56] focus:ring-[#C17A56] rounded"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1A1A1A] text-white px-6 py-3 rounded hover:bg-[#C17A56] transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : "Update Product"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="border border-gray-300 px-6 py-3 rounded hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            {isDirty && <span className="text-xs text-amber-600 ml-auto">* Unsaved changes</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle, CheckCircle, X, Upload, Trash2, Plus } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";

// React Quill New Imports (React 19 Compatible)
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Dynamic import to avoid Next.js SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface Category {
  _id: string;
  name: string;
}

interface FormErrors {
  name?: string;
  slug?: string;
  sku?: string;
  category?: string;
  price?: string;
  salePrice?: string;
  stock?: string;
  images?: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [productVideo, setProductVideo] = useState<File | null>(null);
  const [productVideoPreview, setProductVideoPreview] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [variants, setVariants] = useState<Array<{ size: string; color: string; stock: string; sku: string; price: string; salePrice: string; image: string }>>([]);
  const [variantFiles, setVariantFiles] = useState<Record<number, File>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Toolbar configuration for professional writing
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

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
    sizes: "",
    colors: "",
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    isActive: true,
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        abortControllerRef.current = new AbortController();
        const res = await fetch("/api/admin/categories", {
          signal: abortControllerRef.current.signal,
        });
        const data = await res.json();
        setCategories(data.data || []);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Error fetching categories:", error);
      }
    };
    
    fetchCategories();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clean up image previews
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, []);

  const generateSlug = useCallback((value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    // Name validation
    if (!form.name.trim()) {
      newErrors.name = "Product name is required";
    } else if (form.name.length < 3) {
      newErrors.name = "Product name must be at least 3 characters";
    } else if (form.name.length > 100) {
      newErrors.name = "Product name must be less than 100 characters";
    }
    
    // Slug validation
    if (!form.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(form.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    }
    
    // SKU validation
    if (!form.sku.trim()) {
      newErrors.sku = "SKU is required";
    } else if (form.sku.length < 2) {
      newErrors.sku = "SKU must be at least 2 characters";
    }
    
    // Category validation
    if (!form.category) {
      newErrors.category = "Please select a category";
    }
    
    // Price validation
    const priceNum = parseFloat(form.price);
    if (!form.price) {
      newErrors.price = "Price is required";
    } else if (isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = "Price must be a positive number";
    }
    
    // Sale price validation
    const salePriceNum = parseFloat(form.salePrice);
    if (form.salePrice) {
      if (isNaN(salePriceNum) || salePriceNum < 0) {
        newErrors.salePrice = "Sale price must be a positive number";
      } else if (salePriceNum > priceNum) {
        newErrors.salePrice = "Sale price cannot be greater than regular price";
      }
    }
    
    // Stock validation
    const stockNum = parseInt(form.stock);
    if (!form.stock) {
      newErrors.stock = "Stock is required";
    } else if (isNaN(stockNum) || stockNum < 0) {
      newErrors.stock = "Stock must be a non-negative number";
    }
    
    // Images validation
    if (images.length === 0) {
      newErrors.images = "Please add at least one product image";
    } else if (images.length > 10) {
      newErrors.images = "Maximum 10 images allowed";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, images]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "name") {
      setForm((prev) => ({ 
        ...prev, 
        name: value, 
        slug: generateSlug(value) 
      }));
    } else if (name === "sku") {
      setForm((prev) => ({ ...prev, sku: value.toUpperCase() }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    
    setIsDirty(true);
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Validate total images
    if (images.length + files.length > 10) {
      setErrors((prev) => ({ 
        ...prev, 
        images: `Maximum 10 images allowed. You can add ${10 - images.length} more.` 
      }));
      return;
    }
    
    // Validate each file
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large, max 5MB)`);
      } else if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        invalidFiles.push(`${file.name} (invalid format)`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (invalidFiles.length > 0) {
      setErrors((prev) => ({ 
        ...prev, 
        images: `Invalid files: ${invalidFiles.join(", ")}` 
      }));
      return;
    }
    
    // Add valid files
    setImages((prev) => [...prev, ...validFiles]);
    
    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    
    setIsDirty(true);
    setErrors((prev) => ({ ...prev, images: undefined }));
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProductVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, images: "Product video must be MP4, WebM, or MOV." }));
      e.target.value = "";
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, images: "Product video must be 50MB or smaller." }));
      e.target.value = "";
      return;
    }
    const preview = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const duration = probe.duration;
      URL.revokeObjectURL(probe.src);
      if (!Number.isFinite(duration) || duration > 30.05) {
        URL.revokeObjectURL(preview);
        setProductVideo(null);
        setProductVideoPreview("");
        setErrors((prev) => ({ ...prev, images: "Product video must be 30 seconds or shorter." }));
        e.target.value = "";
        return;
      }
      if (productVideoPreview) URL.revokeObjectURL(productVideoPreview);
      setProductVideo(file);
      setProductVideoPreview(preview);
      setErrors((prev) => ({ ...prev, images: undefined }));
      setIsDirty(true);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(probe.src);
      URL.revokeObjectURL(preview);
      setErrors((prev) => ({ ...prev, images: "Could not read the selected video." }));
      e.target.value = "";
    };
    probe.src = preview;
  };

  const removeProductVideo = () => {
    if (productVideoPreview) URL.revokeObjectURL(productVideoPreview);
    setProductVideo(null);
    setProductVideoPreview("");
    setIsDirty(true);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const addVariantRow = () => {
    setVariants((prev) => [...prev, { size: "", color: "", stock: "0", sku: "", price: "", salePrice: "", image: "" }]);
    setIsDirty(true);
  };

  const updateVariant = (index: number, field: string, value: string) => {
    setVariants((prev) => prev.map((variant, variantIndex) => (variantIndex === index ? { ...variant, [field]: value } : variant)));
    setIsDirty(true);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, variantIndex) => variantIndex !== index));
    setVariantFiles((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setIsDirty(true);
  };

  const handleVariantFileChange = (index: number, file: File | null) => {
    if (!file) return;
    setVariantFiles((prev) => ({ ...prev, [index]: file }));
    setIsDirty(true);
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        router.push("/admin/products");
      }
    } else {
      router.push("/admin/products");
    }
  };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      setLoading(true);
      setSubmitError(null);
      setSubmitSuccess(null);
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Large media is uploaded directly to Cloudinary. Only lightweight JSON
      // metadata is sent to the application, avoiding hosting 413 limits.
      const [uploadedImages, uploadedVideo, uploadedVariantImages] = await Promise.all([
        Promise.all(images.map((file) => uploadToCloudinary(file, "products", "image", signal))),
        productVideo ? uploadToCloudinary(productVideo, "products/videos", "video", signal) : Promise.resolve(null),
        Promise.all(Object.entries(variantFiles).map(async ([index, file]) => ({
          index: Number(index),
          uploaded: await uploadToCloudinary(file, "products/variants", "image", signal),
        }))),
      ]);

      if (uploadedVideo && Number(uploadedVideo.duration || 0) > 30.05) {
        throw new Error("Product video must be 30 seconds or shorter.");
      }

      const variantMap = new Map(uploadedVariantImages.map(({ index, uploaded }) => [index, uploaded]));
      const cleanVariants = variants
        .map((variant, index) => {
          const uploaded = variantMap.get(index);
          return {
            size: variant.size,
            color: variant.color,
            stock: Number(variant.stock || 0),
            sku: variant.sku,
            price: variant.price ? Number(variant.price) : null,
            salePrice: variant.salePrice ? Number(variant.salePrice) : null,
            image: uploaded?.url || variant.image || "",
          };
        })
        .filter((variant) => variant.size || variant.color || variant.sku || variant.stock || variant.price !== null || variant.salePrice !== null || variant.image);

      const payload = {
        ...form,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        stock: Number(form.stock),
        sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(",").map((c) => c.trim()).filter(Boolean),
        images: uploadedImages.map((image) => ({ url: image.url, public_id: image.public_id })),
        video: uploadedVideo ? {
          url: uploadedVideo.url,
          public_id: uploadedVideo.public_id,
          duration: Number(uploadedVideo.duration || 0),
          format: uploadedVideo.format || "",
        } : null,
        variants: cleanVariants,
      };

      const res = await fetch("/api/admin/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
        signal,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to create product");

      setSubmitSuccess("Product created successfully!");
      setIsDirty(false);
      setForm({ name: "", slug: "", sku: "", description: "", shortDescription: "", price: "", salePrice: "", category: "", badge: "", stock: "0", sizes: "", colors: "", isFeatured: false, isNewArrival: false, isBestSeller: false, isActive: true });
      setImages([]);
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setImagePreviews([]);
      if (productVideoPreview) URL.revokeObjectURL(productVideoPreview);
      setProductVideo(null);
      setProductVideoPreview("");
      setVariants([]);
      setVariantFiles({});
      setTimeout(() => router.push("/admin/products"), 1200);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Error creating product:", error);
      setSubmitError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, children: React.ReactNode, error?: string) => (
    <div>
      <label className="block mb-2 font-medium text-sm">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );

  const inputCls = (hasError?: boolean) => 
    `w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#AEAA9B] transition ${
      hasError ? "border-red-500" : "border-gray-300"
    }`;

  const quillWrapperCls = (hasError?: boolean) => 
    `w-full border rounded-lg overflow-hidden transition bg-white ${
      hasError ? "border-red-500" : "border-gray-300"
    } [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[100px]`;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Add Product</h1>
        
        {/* Success Message */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800">{submitSuccess}</p>
            </div>
            <button
              type="button"
              onClick={() => setSubmitSuccess(null)}
              className="text-green-600 hover:text-green-800"
              aria-label="Dismiss success message"
            >
              <X size={18} />
            </button>
          </div>
        )}
        
        {/* Error Message */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800">{submitError}</p>
            </div>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="text-red-600 hover:text-red-800"
              aria-label="Dismiss error message"
            >
              <X size={18} />
            </button>
          </div>
        )}
        
        <form onSubmit={submitHandler} className="space-y-5">
          {/* Product Name */}
          {field("Product Name *", 
            <input 
              name="name"
              className={inputCls(!!errors.name)} 
              required 
              value={form.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              maxLength={100}
              autoFocus
            />,
            errors.name
          )}
          
          {/* Slug */}
          {field("Slug *", 
            <input 
              name="slug"
              className={`${inputCls(!!errors.slug)} bg-gray-100 cursor-not-allowed`} 
              readOnly 
              value={form.slug} 
            />,
            errors.slug
          )}
          
          {/* SKU */}
          {field("SKU *", 
            <input 
              name="sku"
              className={inputCls(!!errors.sku)} 
              required 
              value={form.sku}
              onChange={handleInputChange}
              placeholder="e.g., PROD-001"
              maxLength={20}
            />,
            errors.sku
          )}
          
          {/* Category */}
          {field("Category *", 
            <select 
              name="category"
              className={inputCls(!!errors.category)} 
              required 
              value={form.category}
              onChange={handleInputChange}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>,
            errors.category
          )}
          
          {/* Price & Sale Price */}
          <div className="grid grid-cols-2 gap-4">
            {field("Price (₹) *", 
              <input 
                type="number" 
                name="price"
                className={inputCls(!!errors.price)} 
                required 
                min="0" 
                step="0.01"
                value={form.price}
                onChange={handleInputChange}
                placeholder="0.00"
              />,
              errors.price
            )}
            {field("Sale Price (₹)", 
              <input 
                type="number" 
                name="salePrice"
                className={inputCls(!!errors.salePrice)} 
                min="0" 
                step="0.01"
                value={form.salePrice}
                onChange={handleInputChange}
                placeholder="0.00"
              />,
              errors.salePrice
            )}
          </div>
          
          {/* Stock */}
          {field("Stock *", 
            <input 
              type="number" 
              name="stock"
              className={inputCls(!!errors.stock)} 
              min="0" 
              value={form.stock}
              onChange={handleInputChange}
              placeholder="0"
            />,
            errors.stock
          )}
          
          {/* Badge */}
          {field("Badge", 
            <input 
              name="badge"
              className={inputCls()} 
              placeholder="e.g., New, Sale, Best Seller"
              value={form.badge}
              onChange={handleInputChange}
              maxLength={20}
            />
          )}

          {field("Colors (Comma separated, optional)", 
            <input 
              name="colors"
              className={inputCls()} 
              placeholder="e.g., Space Black, Rose Gold, Ivory"
              value={form.colors}
              onChange={handleInputChange}
            />
          )}

          {field("Sizes (Comma separated, optional)", 
            <input 
              name="sizes"
              className={inputCls()} 
              placeholder="e.g., S, M, L, XL"
              value={form.sizes}
              onChange={handleInputChange}
            />
          )}

          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm">Variant Options</h3>
                <p className="text-xs text-gray-500">Add stock, SKU, and price overrides for size/color combinations.</p>
              </div>
              <button type="button" onClick={addVariantRow} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-100">
                <Plus size={16} /> Add Variant
              </button>
            </div>
            <div className="space-y-3">
              {variants.length === 0 ? (
                <p className="text-sm text-gray-500">No variant rows yet. Add combinations for size/color-specific stock, SKU, pricing, or gallery images.</p>
              ) : variants.map((variant, index) => (
                <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Variant {index + 1}</h4>
                    <button type="button" onClick={() => removeVariant(index)} className="text-sm text-red-600 hover:text-red-700">
                      <Trash2 size={14} className="inline mr-1" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input value={variant.size} onChange={(e) => updateVariant(index, "size", e.target.value)} className={inputCls()} placeholder="Size (e.g. S, M, XL)" />
                    <input value={variant.color} onChange={(e) => updateVariant(index, "color", e.target.value)} className={inputCls()} placeholder="Color" />
                    <input type="number" min="0" value={variant.stock} onChange={(e) => updateVariant(index, "stock", e.target.value)} className={inputCls()} placeholder="Stock" />
                    <input value={variant.sku} onChange={(e) => updateVariant(index, "sku", e.target.value)} className={inputCls()} placeholder="SKU" />
                    <input type="number" min="0" step="0.01" value={variant.price} onChange={(e) => updateVariant(index, "price", e.target.value)} className={inputCls()} placeholder="Price override" />
                    <input type="number" min="0" step="0.01" value={variant.salePrice} onChange={(e) => updateVariant(index, "salePrice", e.target.value)} className={inputCls()} placeholder="Sale price override" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Variant image (optional)</label>
                    <input type="file" accept="image/*" onChange={(e) => handleVariantFileChange(index, e.target.files?.[0] || null)} className="w-full rounded-lg border border-gray-300 p-2 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {field("Short Description", 
            <div className={quillWrapperCls()}>
              <ReactQuill 
                theme="snow"
                value={form.shortDescription} 
                onChange={(content) => {
                  setForm(prev => ({...prev, shortDescription: content}));
                  setIsDirty(true);
                }} 
                modules={quillModules}
              />
            </div>
          )}

          {field("Full Description", 
            <div className={quillWrapperCls()}>
              <ReactQuill 
                theme="snow"
                value={form.description} 
                onChange={(content) => {
                  setForm(prev => ({...prev, description: content}));
                  setIsDirty(true);
                }} 
                modules={quillModules}
              />
            </div>
          )}

          {field("Gallery Images *", 
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className={inputCls(!!errors.images)}
              />
              <p className="text-gray-400 text-xs mt-1">
                Max 10 images, 5MB each (JPEG, PNG, WEBP, GIF)
              </p>
            </div>,
            errors.images
          )}

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                  <Image src={preview} alt={`Preview ${index + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="mb-3">
              <h3 className="font-semibold text-sm">Product Video</h3>
              <p className="mt-1 text-xs text-gray-500">Optional · one video · maximum 30 seconds · MP4, WebM or MOV · max 50MB.</p>
            </div>
            {productVideoPreview ? (
              <div className="relative aspect-video max-w-xl overflow-hidden rounded-lg border bg-black">
                <video src={productVideoPreview} controls muted className="h-full w-full object-contain" />
                <button type="button" onClick={removeProductVideo} aria-label="Remove product video" className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white hover:bg-red-600"><X size={16} /></button>
              </div>
            ) : (
              <label className="flex max-w-xl cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 py-8 text-center transition-colors hover:border-gray-500">
                <div>
                  <Upload className="mx-auto mb-2 text-gray-500" size={24} />
                  <span className="block text-sm font-medium">Choose product video</span>
                  <span className="mt-1 block text-xs text-gray-400">Maximum duration: 30 seconds</span>
                </div>
                <input type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v" onChange={handleProductVideoChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
            {[
              ["isFeatured", "Featured Product"],
              ["isNewArrival", "New Arrival"],
              ["isBestSeller", "Best Seller"],
              ["isActive", "Active"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name={key}
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#AEAA9B] focus:ring-[#AEAA9B] rounded"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1A1A1A] text-white px-6 py-3 rounded-lg hover:bg-[#AEAA9B] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Product"
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {isDirty && (
              <span className="text-xs text-amber-600 ml-auto">* You have unsaved changes</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
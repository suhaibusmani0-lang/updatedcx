"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle, CheckCircle, X, Upload, Trash2 } from "lucide-react";

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
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
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
      } else if (salePriceNum >= priceNum) {
        newErrors.salePrice = "Sale price must be less than regular price";
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

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
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
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      setLoading(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const payload = new FormData();
      
      // Append form data
      Object.entries(form).forEach(([key, val]) => {
        if (typeof val === "boolean") {
          payload.append(key, String(val));
        } else {
          payload.append(key, String(val));
        }
      });
      
      // Append images
      images.forEach((img) => payload.append("images", img));

      abortControllerRef.current = new AbortController();

      const res = await fetch("/api/admin/products", { 
        method: "POST", 
        body: payload,
        signal: abortControllerRef.current.signal,
      });
      
      const data = await res.json();

      if (data.ok) {
        setSubmitSuccess("Product created successfully!");
        setIsDirty(false);
        
        // Reset form
        setForm({
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
        
        // Clear images
        setImages([]);
        imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
        setImagePreviews([]);
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/admin/products");
        }, 1500);
      } else {
        setSubmitError(data.message || "Failed to create product");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error creating product:", error);
      setSubmitError("Something went wrong. Please try again.");
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
    `w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#C17A56] transition ${
      hasError ? "border-red-500" : "border-gray-300"
    }`;

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
          
          {/* Short Description */}
          {field("Short Description", 
            <textarea 
              name="shortDescription"
              className={inputCls()} 
              rows={2} 
              value={form.shortDescription}
              onChange={handleInputChange}
              placeholder="Brief product description"
              maxLength={200}
            />
          )}
          <p className="text-gray-400 text-xs -mt-3">
            {form.shortDescription.length}/200 characters
          </p>
          
          {/* Full Description */}
          {field("Full Description", 
            <textarea 
              name="description"
              className={inputCls()} 
              rows={5} 
              value={form.description}
              onChange={handleInputChange}
              placeholder="Detailed product description"
              maxLength={2000}
            />
          )}
          <p className="text-gray-400 text-xs -mt-3">
            {form.description.length}/2000 characters
          </p>
          
          {/* Gallery Images */}
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
          
          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X size={12} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Checkboxes */}
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
                  className="w-4 h-4 text-[#C17A56] focus:ring-[#C17A56] rounded"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1A1A1A] text-white px-6 py-3 rounded-lg hover:bg-[#C17A56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ADMIN_CATEGORIES } from "@/routes/adminPanelRoutes";
import { Loader2, AlertCircle, CheckCircle, X, Upload } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image?: { url: string; public_id: string };
  parent?: { _id: string; name: string; slug: string } | string | null;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parent: "",
    isActive: true,
  });
  const [parentOptions, setParentOptions] = useState<
    { _id: string; name: string; slug: string }[]
  >([]);

  // Fetch available root categories for parent selector
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        if (data?.ok && Array.isArray(data.data)) {
          setParentOptions(
            data.data
              .filter(
                (c: { _id: string; parent?: unknown }) =>
                  !c.parent && c._id !== id
              )
              .map((c: { _id: string; name: string; slug: string }) => ({
                _id: c._id,
                name: c.name,
                slug: c.slug,
              }))
          );
        }
      } catch (err) {
        console.error("Failed to load parent categories:", err);
      }
    })();
  }, [id]);

  const generateSlug = useCallback((value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Category name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Category name must be less than 50 characters";
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }
    
    if (image && image.size > 5 * 1024 * 1024) {
      newErrors.image = "Image size must be less than 5MB";
    }
    
    if (image && !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.type)) {
      newErrors.image = "Image must be JPEG, PNG, WEBP, or GIF";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, image]);

  useEffect(() => {
    if (!id) {
      router.push(ADMIN_CATEGORIES);
      return;
    }

    const fetchCategory = async () => {
      try {
        abortControllerRef.current = new AbortController();
        
        const res = await fetch(`/api/admin/categories/${id}`, {
          signal: abortControllerRef.current.signal,
        });
        
        const data = await res.json();
        
        if (data.ok && data.data) {
          const cat = data.data;
          setCategory(cat);
          const parentId =
            cat.parent && typeof cat.parent === "object"
              ? cat.parent._id
              : typeof cat.parent === "string"
              ? cat.parent
              : "";
          setFormData({
            name: cat.name || "",
            slug: cat.slug || "",
            description: cat.description || "",
            parent: parentId,
            isActive: cat.isActive ?? true,
          });
        } else {
          setSubmitError(data.message || "Category not found");
          setTimeout(() => router.push(ADMIN_CATEGORIES), 2000);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Error fetching category:", error);
        setSubmitError("Failed to load category");
        setTimeout(() => router.push(ADMIN_CATEGORIES), 2000);
      } finally {
        setFetching(false);
      }
    };
    
    fetchCategory();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [id, router]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ 
      ...prev, 
      name: value, 
      slug: generateSlug(value) 
    }));
    setIsDirty(true);
    // Clear error for this field
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ 
          ...prev, 
          image: "Image size must be less than 5MB" 
        }));
        return;
      }
      
      // Validate file type
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        setErrors((prev) => ({ 
          ...prev, 
          image: "Image must be JPEG, PNG, WEBP, or GIF" 
        }));
        return;
      }
      
      setImage(file);
      setIsDirty(true);
      
      // Create preview
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: undefined }));
    } else {
      setImage(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    }
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsDirty(true);
  };

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!id) {
      setSubmitError("Category ID is missing");
      return;
    }

    // Validate form
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
      payload.append("name", formData.name.trim());
      payload.append("slug", formData.slug.trim());
      payload.append("description", formData.description.trim());
      payload.append("parent", formData.parent || "");
      payload.append("isActive", String(formData.isActive));
      if (image) {
        payload.append("image", image);
      }

      const res = await fetch(`/api/admin/categories/${id}`, { 
        method: "PUT", 
        body: payload 
      });
      
      const data = await res.json();

      if (data.ok) {
        setSubmitSuccess("Category updated successfully!");
        setIsDirty(false);
        // Redirect after a short delay
        setTimeout(() => {
          router.push(ADMIN_CATEGORIES);
        }, 1500);
      } else {
        setSubmitError(data.message || "Failed to update category");
        // Scroll to error message
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Loader2 size={40} className="animate-spin mx-auto text-[#C17A56] mb-4" />
          <p className="text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Category</h1>
        
        {/* Success Message */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800">{submitSuccess}</p>
            </div>
            <button
              onClick={() => setSubmitSuccess(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X size={18} />
            </button>
          </div>
        )}
        
        {/* Error Message */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800">{submitError}</p>
            </div>
            <button
              onClick={() => setSubmitError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X size={18} />
            </button>
          </div>
        )}
        
        <form onSubmit={submitHandler} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block mb-2 font-medium text-sm">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Enter category name"
              className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#C17A56] transition ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              required
              maxLength={50}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              {formData.name.length}/50 characters
            </p>
          </div>
          
          {/* Slug */}
          <div>
            <label className="block mb-2 font-medium text-sm">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              readOnly
              className={`w-full border rounded-lg p-3 bg-gray-100 cursor-not-allowed ${
                errors.slug ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              URL-friendly name (auto-generated from name)
            </p>
          </div>
          
          {/* Description */}
          <div>
            <label className="block mb-2 font-medium text-sm">Description</label>
            <textarea
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Category description"
              className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#C17A56] transition ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              maxLength={500}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Parent Category (optional) */}
          <div>
            <label className="block mb-2 font-medium text-sm">
              Parent Category
              <span className="text-gray-400 text-xs ml-2">(leave empty for a root category)</span>
            </label>
            <select
              name="parent"
              value={formData.parent}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, parent: e.target.value }));
                setIsDirty(true);
              }}
              className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#C17A56] transition"
              data-testid="edit-category-parent-select"
            >
              <option value="">— No parent (Root category) —</option>
              {parentOptions.map((opt) => (
                <option key={opt._id} value={opt._id}>
                  {opt.name}
                </option>
              ))}
            </select>
            <p className="text-gray-400 text-xs mt-1">
              Choose a parent to make this a sub-category. Only root categories are shown.
            </p>
          </div>
          
          {/* Image */}
          <div>
            <label className="block mb-2 font-medium text-sm">Category Image</label>
            
            {/* Current Image */}
            {category?.image?.url && !image && !imagePreview && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Current Image:</p>
                <div className="relative w-32 h-32 rounded-lg border overflow-hidden">
                  <Image
                    src={category.image.url}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">New Image Preview:</p>
                <div className="relative w-32 h-32 rounded-lg border overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={`flex-1 border rounded-lg p-3 ${
                  errors.image ? "border-red-500" : "border-gray-300"
                }`}
              />
              {image && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition"
                >
                  Remove
                </button>
              )}
            </div>
            
            {errors.image && (
              <p className="text-red-500 text-sm mt-1">{errors.image}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              Recommended: 800x800px, Max 5MB (JPEG, PNG, WEBP, GIF)
            </p>
          </div>
          
          {/* Active Status */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => {
                setFormData({ ...formData, isActive: e.target.checked });
                setIsDirty(true);
              }}
              className="w-4 h-4 text-[#C17A56] focus:ring-[#C17A56] rounded"
            />
            <label htmlFor="isActive" className="font-medium text-sm">
              Active Category
            </label>
            <span className="text-xs text-gray-400">
              {formData.isActive ? "(Visible on website)" : "(Hidden from website)"}
            </span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading || !isDirty}
              className="bg-[#1A1A1A] text-white px-6 py-3 rounded-lg hover:bg-[#C17A56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Category"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isDirty) {
                  if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
                    router.push(ADMIN_CATEGORIES);
                  }
                } else {
                  router.push(ADMIN_CATEGORIES);
                }
              }}
              className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {!isDirty && formData.name && (
              <span className="text-xs text-gray-400 ml-auto">No changes to save</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
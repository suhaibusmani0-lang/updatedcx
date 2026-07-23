"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle, CheckCircle, X, Upload, Image as ImageIcon } from "lucide-react";

interface FormErrors {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
}

export default function AddCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSlugChecking, setIsSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const slugTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parent: "",
    isActive: true,
  });
  const [parentOptions, setParentOptions] = useState<
    { _id: string; name: string; depth: number }[]
  >([]);

  // Load available root categories for parent selection
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        if (data?.ok && Array.isArray(data.data)) {
          // Build hierarchical parent options so admin can pick any category as parent.
          const cats: any[] = data.data;

          const map: Record<string, any> = {};
          cats.forEach((c) => {
            map[c._id] = { ...c, children: [] };
          });

          const roots: any[] = [];
          cats.forEach((c) => {
            const pid = c.parent && typeof c.parent === "object" ? c.parent._id : c.parent;
            if (pid) {
              if (map[pid]) map[pid].children.push(map[c._id]);
              else roots.push(map[c._id]);
            } else {
              roots.push(map[c._id]);
            }
          });

          const ordered: { _id: string; name: string; depth: number }[] = [];
          const dfs = (node: any, depth = 0) => {
            ordered.push({ _id: node._id, name: node.name, depth });
            node.children.sort((a: any, b: any) => a.name.localeCompare(b.name)).forEach((ch: any) => dfs(ch, depth + 1));
          };

          roots.sort((a, b) => a.name.localeCompare(b.name)).forEach((r) => dfs(r, 0));

          setParentOptions(ordered.map((o) => ({ _id: o._id, name: o.name, depth: o.depth })));
        }
      } catch (err) {
        console.error("Failed to load parent categories:", err);
      }
    })();
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (slugTimeoutRef.current) {
        clearTimeout(slugTimeoutRef.current);
      }
    };
  }, [imagePreview]);

  const generateSlug = useCallback((value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, []);

  // Check if slug is available
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      return;
    }

    setIsSlugChecking(true);
    try {
      const res = await fetch(`/api/admin/categories/check-slug?slug=${slug}`);
      const data = await res.json();
      setSlugAvailable(data.available);
      if (!data.available) {
        setErrors((prev) => ({ 
          ...prev, 
          slug: "This slug is already taken. Please change the category name." 
        }));
      } else {
        setErrors((prev) => ({ ...prev, slug: undefined }));
      }
    } catch (error) {
      console.error("Error checking slug:", error);
    } finally {
      setIsSlugChecking(false);
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Category name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Category name must be less than 50 characters";
    }
    
    // Slug validation
    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    } else if (formData.slug.length < 2) {
      newErrors.slug = "Slug must be at least 2 characters";
    } else if (slugAvailable === false) {
      newErrors.slug = "This slug is already taken";
    }
    
    // Description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }
    
    // Image validation
    if (image) {
      if (image.size > 5 * 1024 * 1024) {
        newErrors.image = "Image size must be less than 5MB";
      } else if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.type)) {
        newErrors.image = "Image must be JPEG, PNG, WEBP, or GIF";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, image, slugAvailable]);

  // Debounced slug check
  useEffect(() => {
    if (slugTimeoutRef.current) {
      clearTimeout(slugTimeoutRef.current);
    }

    if (formData.slug && formData.slug.length >= 2) {
      slugTimeoutRef.current = setTimeout(() => {
        checkSlugAvailability(formData.slug);
      }, 500);
    }

    return () => {
      if (slugTimeoutRef.current) {
        clearTimeout(slugTimeoutRef.current);
      }
    };
  }, [formData.slug, checkSlugAvailability]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const slug = generateSlug(value);
    setFormData((prev) => ({ 
      ...prev, 
      name: value, 
      slug 
    }));
    setIsDirty(true);
    setSlugAvailable(null);
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setIsImageUploading(true);
      setImage(file);
      setIsDirty(true);
      
      // Create preview
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: undefined }));
      setIsImageUploading(false);
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

  const handleCancel = () => {
    if (isDirty) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        router.push("/admin/categories");
      }
    } else {
      router.push("/admin/categories");
    }
  };

  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
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
      payload.append("isActive", String(formData.isActive)); // ✅ Fixed: Now sending isActive
      if (image) {
        payload.append("image", image);
      }

      abortControllerRef.current = new AbortController();

      const res = await fetch("/api/admin/categories", { 
        method: "POST", 
        body: payload,
        signal: abortControllerRef.current.signal,
      });
      
      const data = await res.json();

      if (data.ok) {
        setSubmitSuccess("Category created successfully!");
        setIsDirty(false);
        // Reset form after successful creation
        setFormData({
          name: "",
          slug: "",
          description: "",
          parent: "",
          isActive: true,
        });
        setImage(null);
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview(null);
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setSlugAvailable(null);
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/admin/categories");
        }, 1500);
      } else {
        setSubmitError(data.message || "Failed to add category");
        // Scroll to error message
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error adding category:", error);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Add Category</h1>
        
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
              autoFocus
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
            <div className="relative">
              <input
                type="text"
                name="slug"
                value={formData.slug}
                readOnly
                className={`w-full border rounded-lg p-3 bg-gray-100 cursor-not-allowed pr-10 ${
                  errors.slug ? "border-red-500" : slugAvailable === false ? "border-red-500" : slugAvailable === true ? "border-green-500" : "border-gray-300"
                }`}
              />
              {isSlugChecking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              )}
              {slugAvailable === true && !isSlugChecking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle size={16} className="text-green-500" />
                </div>
              )}
              {slugAvailable === false && !isSlugChecking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AlertCircle size={16} className="text-red-500" />
                </div>
              )}
            </div>
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
            )}
            {slugAvailable === true && !errors.slug && (
              <p className="text-green-500 text-sm mt-1">✓ Slug is available</p>
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
              data-testid="add-category-parent-select"
            >
              <option value="">— No parent (Root category) —</option>
              {parentOptions.map((opt) => (
                <option key={opt._id} value={opt._id}>
                  {"\u00A0".repeat((opt.depth || 0) * 4)}{opt.name}
                </option>
              ))}
            </select>
            <p className="text-gray-400 text-xs mt-1">
              Choose a parent to create a sub-category. Only root categories are shown.
            </p>
          </div>
          
          {/* Image */}
          <div>
            <label className="block mb-2 font-medium text-sm">Category Image</label>
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3 animate-in fade-in duration-200">
                <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
                <div className="relative w-32 h-32 rounded-lg border overflow-hidden group">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                      aria-label="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={`w-full border rounded-lg p-3 ${
                    errors.image ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-[#C17A56]`}
                  aria-label="Upload category image"
                  disabled={isImageUploading}
                />
                {isImageUploading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {image && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition whitespace-nowrap"
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
            <label htmlFor="isActive" className="font-medium text-sm cursor-pointer">
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
              disabled={loading || isSlugChecking || slugAvailable === false}
              className="bg-[#1A1A1A] text-white px-6 py-3 rounded-lg hover:bg-[#C17A56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Category"
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {!isDirty && formData.name && (
              <span className="text-xs text-gray-400 ml-auto">No changes to save</span>
            )}
            {isDirty && (
              <span className="text-xs text-amber-600 ml-auto">* You have unsaved changes</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
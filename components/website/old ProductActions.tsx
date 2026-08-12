"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ShoppingCart, Heart, Share2, Check, Loader2, Bell } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addToCart, setCart, mapApiCartItems } from "@/store/reducer/cartReducer";
import type { RootState } from "@/store/store";

interface ProductVariant {
  size?: string;
  color?: string;
  stock?: number;
  sku?: string;
  price?: number | null;
  salePrice?: number | null;
  image?: string;
}

interface ProductActionsProps {
  productId: string;
  name: string;
  image: string;
  price: number;
  slug: string;
  stock: number;
  sizes?: string[] | string;
  colors?: string[] | string;
  variants?: ProductVariant[];
  onVariantChange?: (variant: ProductVariant | null) => void;
}

export default function ProductActions({ 
  productId, 
  name, 
  image, 
  price, 
  slug, 
  stock,
  sizes = [],
  colors = [],
  variants = [],
  onVariantChange,
}: ProductActionsProps) {
  
  const safeColors = useMemo(() => Array.isArray(colors) 
    ? colors 
    : (typeof colors === 'string' ? colors.split(',').map(s => s.trim()).filter(Boolean) : []), [colors]);
    
  const safeSizes = useMemo(() => Array.isArray(sizes) 
    ? sizes 
    : (typeof sizes === 'string' ? sizes.split(',').map(s => s.trim()).filter(Boolean) : []), [sizes]);

  const normalizedVariants = useMemo<ProductVariant[]>(() => Array.isArray(variants)
    ? variants.filter((variant): variant is ProductVariant => Boolean(variant && typeof variant === "object")).map((variant) => ({
        size: (variant.size || "").toString().trim(),
        color: (variant.color || "").toString().trim(),
        stock: Number(variant.stock || 0),
        sku: (variant.sku || "").toString().trim(),
        price: typeof variant.price === "number" && !Number.isNaN(variant.price) ? variant.price : null,
        salePrice: typeof variant.salePrice === "number" && !Number.isNaN(variant.salePrice) ? variant.salePrice : null,
        image: (variant.image || "").toString().trim(),
      }))
    : [], [variants]);

  const resolvedSizes = useMemo(() => {
    if (safeSizes.length > 0) return safeSizes;
    return Array.from(
      new Set(
        normalizedVariants
          .map((variant) => variant.size)
          .filter((size): size is string => Boolean(size))
      )
    );
  }, [safeSizes, normalizedVariants]);

  const resolvedColors = useMemo(() => {
    if (safeColors.length > 0) return safeColors;
    return Array.from(
      new Set(
        normalizedVariants
          .map((variant) => variant.color)
          .filter((color): color is string => Boolean(color))
      )
    );
  }, [safeColors, normalizedVariants]);

  // Existing States
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection States
  const [selectedSize, setSelectedSize] = useState<string>(resolvedSizes[0] || "");
  const [selectedColor, setSelectedColor] = useState<string>(resolvedColors[0] || "");

  // Notify Me States
  const [showModal, setShowModal] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", contact: "" });

  const auth = useSelector((state: RootState) => state.authStore?.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const effectiveSelectedSize = resolvedSizes.includes(selectedSize) ? selectedSize : (resolvedSizes[0] || "");
  const effectiveSelectedColor = resolvedColors.includes(selectedColor) ? selectedColor : (resolvedColors[0] || "");

  const activeVariant = useMemo<ProductVariant | null>(() => {
    if (normalizedVariants.length === 0) return null;

    return normalizedVariants.find((variant) => {
      const matchesSize = resolvedSizes.length === 0 || !variant.size || variant.size === effectiveSelectedSize;
      const matchesColor = resolvedColors.length === 0 || !variant.color || variant.color === effectiveSelectedColor;
      return matchesSize && matchesColor;
    }) || null;
  }, [normalizedVariants, resolvedSizes, resolvedColors, effectiveSelectedSize, effectiveSelectedColor]);

  const derivedPrice = activeVariant?.salePrice ?? activeVariant?.price ?? price;
  const selectedVariantImage = useMemo(() => activeVariant?.image || image, [activeVariant, image]);

  useEffect(() => {
    if (!onVariantChange) return;
    const defaultVariant: ProductVariant = {
      size: effectiveSelectedSize,
      color: effectiveSelectedColor,
      price: derivedPrice,
      salePrice: null,
      image: selectedVariantImage,
    };
    onVariantChange(activeVariant ?? defaultVariant);
  }, [activeVariant, derivedPrice, selectedVariantImage, effectiveSelectedColor, effectiveSelectedSize, onVariantChange]);

  // Check if product is in wishlist on mount
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!auth) return;
      
      try {
        const res = await fetch(`/api/wishlist/check?productId=${productId}`);
        if (res.ok) {
          const data = await res.json();
          setWished(data.isInWishlist || false);
        }
      } catch (error) {
        console.error("Failed to check wishlist status:", error);
      }
    };

    checkWishlistStatus();
  }, [auth, productId]);

  const addItem = useCallback(async () => {
    const effectiveStock = activeVariant?.stock ?? stock;
    if (effectiveStock === 0 || isAddingToCart) return;
    
    // Validation using resolved arrays
    if (resolvedColors.length > 0 && !selectedColor) {
      setError("Please select a color before adding to cart.");
      return;
    }
    if (resolvedSizes.length > 0 && !selectedSize) {
      setError("Please select a size before adding to cart.");
      return;
    }
    if (normalizedVariants.length > 0 && !activeVariant) {
      setError("Please select a valid size and color combination before adding to cart.");
      return;
    }
    
    setError(null);
    setIsAddingToCart(true);

    try {
      const selectedVariant = {
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        sku: activeVariant?.sku || undefined,
        price: activeVariant?.price ?? undefined,
        salePrice: activeVariant?.salePrice ?? undefined,
        image: activeVariant?.image || undefined,
      };

      if (auth) {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, qty, variant: selectedVariant, price: derivedPrice }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to add to cart");
        }

        if (data.data?.items) {
          dispatch(setCart(mapApiCartItems(data.data.items)));
        }
      } else {
        // Redux Local Cart Logic
        const cartItemId = [productId, selectedSize, selectedColor].filter(Boolean).join("-");
        
        for (let i = 0; i < qty; i++) {
          dispatch(addToCart({
            id: cartItemId,
            productId,
            name,
            category: "",
            price: derivedPrice,
            image: selectedVariantImage,
            variant: selectedVariant,
          }));
        }
      }
      
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setError(error instanceof Error ? error.message : "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  }, [auth, productId, qty, stock, dispatch, name, derivedPrice, isAddingToCart, resolvedColors, resolvedSizes, selectedColor, selectedSize, normalizedVariants, activeVariant, selectedVariantImage]);

  const toggleWishlist = useCallback(async () => {
    if (!auth) {
      router.push("/auth/login");
      return;
    }
    
    if (isTogglingWishlist) return;
    
    setError(null);
    setIsTogglingWishlist(true);

    try {
      if (wished) {
        const res = await fetch(`/api/wishlist?productId=${productId}`, { 
          method: "DELETE" 
        });
        
        if (!res.ok) {
          throw new Error("Failed to remove from wishlist");
        }
        setWished(false);
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        
        if (!res.ok) {
          throw new Error("Failed to add to wishlist");
        }
        setWished(true);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      setError(error instanceof Error ? error.message : "Failed to update wishlist");
    } finally {
      setIsTogglingWishlist(false);
    }
  }, [auth, wished, productId, router, isTogglingWishlist]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/product/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setError(null);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error sharing:", error);
        setError("Failed to share");
      }
    }
  }, [slug, name]);

  const handleBuyNow = useCallback(async () => {
    const effectiveStock = activeVariant?.stock ?? stock;
    if (effectiveStock === 0) return;
    if (resolvedColors.length > 0 && !selectedColor) {
      setError("Please select a color before buying.");
      return;
    }
    if (resolvedSizes.length > 0 && !selectedSize) {
      setError("Please select a size before buying.");
      return;
    }
    if (normalizedVariants.length > 0 && !activeVariant) {
      setError("Please select a valid size and color combination before buying.");
      return;
    }
    await addItem();
    router.push("/checkout");
  }, [addItem, router, stock, resolvedColors, resolvedSizes, selectedColor, selectedSize, normalizedVariants, activeVariant]);

  const submitNotifyRequest = async (userName: string, contactDetails: string) => {
    setNotifyLoading(true);
    try {
      const response = await fetch("/api/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          productName: name,
          userName,
          contactDetails,
        }),
      });

      if (response.ok) {
        alert("Thank you! The admin has been notified.");
        setShowModal(false);
        setFormData({ name: "", contact: "" });
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error notifying admin:", error);
    } finally {
      setNotifyLoading(false);
    }
  };

  const handleNotifyClick = () => {
    if (auth) {
      const user = auth as { name?: string; email?: string; phone?: string } | null;
      submitNotifyRequest(
        user?.name || "Logged-in User", 
        user?.email || user?.phone || "User Account"
      );
    } else {
      setShowModal(true);
    }
  };

  const effectiveStock = activeVariant?.stock ?? stock;
  const isOutOfStock = effectiveStock === 0;

  return (
    <>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 flex justify-between items-center">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-2 text-red-800 hover:text-red-900"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* 🔴 COLORS UI (Exactly like image) */}
      {!isOutOfStock && resolvedColors.length > 0 && (
        <div className="mb-6">
          <p className="text-[13px] text-gray-600 uppercase tracking-wide mb-3">
            COLOURS &ndash; <span className="text-gray-900 capitalize">{selectedColor || 'None'}</span>
          </p>
          <div className="flex items-center gap-3">
            {resolvedColors.map((color: string) => {
              const isActive = selectedColor === color;
              const colorCode = color.toLowerCase() === 'silver' ? '#B0B0B0' : (color.toLowerCase() === 'black' ? '#000000' : color.toLowerCase());
              
              return (
                <button
                  key={color}
                  onClick={() => { setSelectedColor(color); setError(null); }}
                  title={color}
                  style={{ backgroundColor: colorCode }}
                  className={`w-9 h-9 rounded-full border-2 border-white focus:outline-none transition-all ${
                    isActive ? "ring-1 ring-black shadow-[0_0_0_1.5px_#000]" : "shadow-[0_0_0_1px_#e5e7eb] hover:shadow-[0_0_0_1.5px_#9ca3af]"
                  }`}
                  aria-label={`Select ${color}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 🔴 SIZES UI (Exactly like image with blue highlight and wrap) */}
      {!isOutOfStock && resolvedSizes.length > 0 && (
        <div className="mb-8">
          <p className="text-[13px] text-gray-600 uppercase tracking-wide mb-3">SIZE</p>
          <div className="flex flex-wrap gap-3">
            {resolvedSizes.map((size: string) => {
              const isActive = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => { setSelectedSize(size); setError(null); }}
                  className={`text-[13px] font-medium px-4 py-3 rounded-sm border transition-colors ${
                    isActive
                      ? "bg-[#1C2024] text-white border-[#1C2024]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {/* Adds blue highlight if size has '|' and is active */}
                  {isActive && size.includes('|') ? (
                    <>
                      <span className="text-[#64B5F6]">{size.split('|')[0]}</span> | {size.split('|')[1]}
                    </>
                  ) : (
                    size
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 🔴 ADD TO CART & BUY NOW (Exact layout matching the image) */}
      {isOutOfStock ? (
        <div className="mt-4">
          <button
            onClick={handleNotifyClick}
            disabled={notifyLoading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#C1121F] text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-70"
          >
            {notifyLoading ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
            <span>{notifyLoading ? "NOTIFYING..." : "NOTIFY ME WHEN IN STOCK"}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-4 max-w-[400px]">
          
          <div className="flex items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center bg-gray-50 rounded-full border border-gray-200">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-11 h-12 flex items-center justify-center text-gray-600 hover:text-black transition-colors disabled:opacity-50"
                disabled={isOutOfStock}
              >
                &minus;
              </button>
              <span className="w-8 text-center text-[15px] font-medium text-black">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(Math.min(effectiveStock, qty + 1))}
                className="w-11 h-12 flex items-center justify-center text-gray-600 hover:text-black transition-colors disabled:opacity-50"
                disabled={isOutOfStock || qty >= effectiveStock}
              >
                &#43;
              </button>
            </div>
            
            {/* Add to Cart Button */}
            <button
              onClick={addItem}
              disabled={isOutOfStock || added || isAddingToCart}
              className={`flex-1 h-12 rounded-full text-[13px] font-bold tracking-widest transition-colors flex items-center justify-center gap-2 ${
                added
                  ? "bg-green-500 text-white"
                  : "bg-[#1A1A1A] text-white hover:bg-black"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isAddingToCart ? (
                <Loader2 size={18} className="animate-spin" />
              ) : added ? (
                <><Check size={18} /><span>ADDED</span></>
              ) : (
                "ADD TO CART"
              )}
            </button>
          </div>

          {/* Buy Now Button (Dark Navy Blue) */}
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock || isAddingToCart}
            className="w-full h-12 bg-[#1A2B50] text-white rounded-full text-[13px] font-bold tracking-widest hover:bg-[#111C33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAddingToCart ? (
              <><Loader2 size={18} className="animate-spin" /> PROCESSING...</>
            ) : (
              "BUY IT NOW"
            )}
          </button>
        </div>
      )}

      {/* WISHLIST & SHARE BUTTONS */}
      <div className="flex items-center gap-3 mt-4 max-w-[400px]">
        <button
          onClick={toggleWishlist}
          disabled={isTogglingWishlist}
          className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-medium transition-colors ${
            wished 
              ? "bg-[#AEAA9B] text-white border-[#AEAA9B]" 
              : "border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isTogglingWishlist ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Heart size={18} className={wished ? "fill-white" : ""} />
          )}
          <span>{wished ? "Wishlisted" : "Wishlist"}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#1A1A1A] rounded-xl font-medium hover:bg-[#1A1A1A] hover:text-white transition-colors"
        >
          <Share2 size={18} />
          <span>Share</span>
        </button>
      </div>

      {/* NOTIFY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
            <h3 className="text-xl font-semibold mb-3 text-[#1A1A1A]">Notify Me</h3>
            <p className="text-sm text-gray-600 mb-5">
              Leave your details below and we will notify you when <strong>{name}</strong> is back in stock.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              submitNotifyRequest(formData.name, formData.contact);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AEAA9B]"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email / Phone Number</label>
                <input
                  required
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AEAA9B]"
                  placeholder="name@example.com or +91 9876543210"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={notifyLoading}
                  className="px-5 py-2.5 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#AEAA9B] transition-colors disabled:opacity-70 font-medium flex items-center gap-2"
                >
                  {notifyLoading ? "Sending..." : "Notify Me"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
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
    if (normalizedVariants.length > 0) {
      return Array.from(new Set(normalizedVariants.map((variant) => variant.size).filter(Boolean))) as string[];
    }
    return safeSizes;
  }, [safeSizes, normalizedVariants]);

  const resolvedColors = useMemo(() => {
    if (normalizedVariants.length > 0) {
      return Array.from(new Set(normalizedVariants.map((variant) => variant.color).filter(Boolean))) as string[];
    }
    return safeColors;
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

  const normalizeOption = useCallback((value?: string | null) => (value || "").toString().trim().toLowerCase(), []);

  const activeVariant = useMemo<ProductVariant | null>(() => {
    if (normalizedVariants.length === 0) return null;
    return (
      normalizedVariants.find((variant) => {
        const variantSize = normalizeOption(variant.size);
        const variantColor = normalizeOption(variant.color);
        const chosenSize = normalizeOption(selectedSize);
        const chosenColor = normalizeOption(selectedColor);

        const matchesSize = resolvedSizes.length === 0 || !variantSize || variantSize === chosenSize;
        const matchesColor = resolvedColors.length === 0 || !variantColor || variantColor === chosenColor;
        return matchesSize && matchesColor;
      }) || null
    );
  }, [normalizedVariants, resolvedSizes, resolvedColors, selectedSize, selectedColor, normalizeOption]);

  const derivedPrice = activeVariant?.salePrice ?? activeVariant?.price ?? price;
  const selectedVariantImage = activeVariant?.image || image;
  const effectiveStock = activeVariant?.stock ?? stock;
  const hasVariantSelection = Boolean(selectedSize || selectedColor);

  const filteredSizes = useMemo(() => {
    if (normalizedVariants.length === 0) return resolvedSizes;
    if (!selectedColor) return resolvedSizes;

    const colorLower = selectedColor.trim().toLowerCase();
    return Array.from(
      new Set(
        normalizedVariants
          .filter((variant) => {
            const variantColor = (variant.color || "").trim().toLowerCase();
            return !variantColor || variantColor === colorLower;
          })
          .map((variant) => variant.size)
          .filter(Boolean)
      )
    ) as string[];
  }, [normalizedVariants, resolvedSizes, selectedColor]);

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

  useEffect(() => {
    if (onVariantChange) {
      onVariantChange(activeVariant ?? null);
    }
  }, [activeVariant, onVariantChange]);

  const addItem = useCallback(async () => {
    if (effectiveStock === 0 || isAddingToCart) return;
    
    if (resolvedColors.length > 0 && !selectedColor) {
      setError("Please select a color before adding to cart.");
      return;
    }
    if (resolvedSizes.length > 0 && !selectedSize) {
      setError("Please select a size before adding to cart.");
      return;
    }
    if (normalizedVariants.length > 0 && (resolvedColors.length > 0 || resolvedSizes.length > 0)) {
      const hasSelection = Boolean(selectedSize || selectedColor);
      if (hasSelection && !activeVariant) {
        setError("Please select a valid size and color combination before adding to cart.");
        return;
      }
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
            size: selectedSize || undefined,
            color: selectedColor || undefined,
            variant: selectedVariant,
          } as any)); 
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
  }, [auth, productId, qty, effectiveStock, dispatch, name, derivedPrice, selectedVariantImage, isAddingToCart, resolvedColors, resolvedSizes, selectedColor, selectedSize, normalizedVariants, activeVariant]);

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
  }, [addItem, router, effectiveStock, resolvedColors, resolvedSizes, selectedColor, selectedSize, normalizedVariants, activeVariant]);

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
      const user = auth as any;
      submitNotifyRequest(
        user.name || "Logged-in User", 
        user.email || user.phone || "User Account"
      );
    } else {
      setShowModal(true);
    }
  };

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

      
      {!isOutOfStock && (resolvedColors.length > 0 || resolvedSizes.length > 0 || normalizedVariants.length > 0) && (
        <div className="mb-5 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm tracking-wide text-gray-800">VARIANT OPTIONS</span>
              {activeVariant?.sku && <span className="text-xs font-medium text-[#AEAA9B]">SKU {activeVariant.sku}</span>}
            </div>
            {resolvedColors.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">COLOR</span>
                  {selectedColor && <span className="text-sm font-medium text-[#AEAA9B]">{selectedColor}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {resolvedColors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => { setSelectedColor(color); setError(null); }}
                      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all ${
                        selectedColor === color ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-md' : 'border-gray-300 bg-white text-gray-700 hover:border-[#AEAA9B]'
                      }`}
                    >
                      <span className="h-3.5 w-3.5 rounded-full border border-white" style={{ backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : color }} />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredSizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">SIZE</span>
                  {selectedSize && <span className="text-sm font-medium text-[#AEAA9B]">{selectedSize}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredSizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => { setSelectedSize(size); setError(null); }}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        selectedSize === size ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-md' : 'border-gray-300 bg-white text-gray-700 hover:border-[#AEAA9B]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeVariant && (
            <div className="rounded-xl border border-dashed border-[#AEAA9B]/60 bg-[#F8F4EE] px-4 py-3 text-sm text-gray-700">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-800">Selected variant</span>
                <span className="text-[#AEAA9B]">{[activeVariant.color, activeVariant.size].filter(Boolean).join(' / ') || 'Standard'}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                <span>Stock: {activeVariant.stock ?? effectiveStock}</span>
                <span>SKU: {activeVariant.sku || '—'}</span>
                <span>Price: ₹{(activeVariant.salePrice ?? activeVariant.price ?? derivedPrice).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

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
        <>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-4 py-3 text-[#1A1A1A] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isOutOfStock}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="px-4 py-3 font-medium min-w-[40px] text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(Math.min(stock, qty + 1))}
                className="px-4 py-3 text-[#1A1A1A] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isOutOfStock || qty >= stock}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              onClick={addItem}
              disabled={isOutOfStock || added || isAddingToCart}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                isOutOfStock
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : added
                  ? "bg-green-500 text-white"
                  : "bg-[#1A1A1A] text-white hover:bg-[#AEAA9B]"
              }`}
            >
              {isAddingToCart ? (
                <Loader2 size={18} className="animate-spin" />
              ) : added ? (
                <><Check size={18} /><span>Added</span></>
              ) : (
                <><ShoppingCart size={18} /><span>Add to Cart</span></>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock || isAddingToCart}
              className="flex-1 py-3 bg-[#AEAA9B] text-white rounded-xl font-medium hover:bg-[#9B9789] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingToCart ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                "Buy Now"
              )}
            </button>
          </div>
        </>
      )}

      <div className="flex items-center gap-3 mt-4">
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
          <span>{wished ? "Added to Wishlist" : "Wishlist"}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#1A1A1A] rounded-xl font-medium hover:bg-[#1A1A1A] hover:text-white transition-colors"
        >
          <Share2 size={18} />
          <span>Share</span>
        </button>
      </div>

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
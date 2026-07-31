"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Heart, Check, Loader2, Bell } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, setCart, mapApiCartItems } from "@/store/reducer/cartReducer";
import Link from "next/link";
import type { RootState } from "@/store/store";
import { showToast } from "@/lib/showToast";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  images: { url: string }[];
  badge?: string;
  category?: { name: string };
  stock: number;
}

export default function ProductCard({ product }: { product: Product }) {
  // Existing States
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notify Me States
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", contact: "" });
  
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.authStore?.auth);

  // Check if product is in wishlist on mount or when auth changes
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!auth) {
        setWished(false);
        return;
      }

      try {
        const res = await fetch(`/api/wishlist/check?productId=${product._id}`);
        if (res.ok) {
          const data = await res.json();
          setWished(data.isInWishlist || false);
        }
      } catch (error) {
        console.error("Failed to check wishlist status:", error);
      }
    };

    checkWishlistStatus();
  }, [auth, product._id]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock === 0 || isAddingToCart) return;
    
    setError(null);
    setIsAddingToCart(true);

    try {
      if (auth) {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id, qty: 1 }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          showToast("error", data.message || "Failed to add to cart");
          return;
        }

        if (data.data?.items) {
          dispatch(setCart(mapApiCartItems(data.data.items)));
        }
      } else {
        dispatch(addToCart({
          id: product._id,
          productId: product._id,
          name: product.name,
          category: product.category?.name || "",
          price: product.salePrice || product.price,
          image: product.images[0]?.url || "",
        }));
      }
      
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setError(error instanceof Error ? error.message : "Failed to add to cart");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsAddingToCart(false);
    }
  }, [auth, product, dispatch, isAddingToCart]);

  const toggleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isTogglingWishlist) return;
    
    if (!auth) {
      setError("Please login to add to wishlist");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setError(null);
    setIsTogglingWishlist(true);
    const previousWished = wished;
    setWished(!wished);

    try {
      if (wished) {
        const res = await fetch(`/api/wishlist?productId=${product._id}`, { 
          method: "DELETE" 
        });
        
        if (!res.ok) {
          showToast("error", "Failed to remove from wishlist");
        }
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id }),
        });
        
        if (!res.ok) {
          showToast("error", "Failed to add to wishlist");
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      setWished(previousWished);
      setError(error instanceof Error ? error.message : "Failed to update wishlist");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsTogglingWishlist(false);
    }
  }, [auth, wished, product._id, isTogglingWishlist]);

  // Combined Notify Request Function
  const submitNotifyRequest = async (userName: string, contactDetails: string) => {
    setNotifyLoading(true);
    try {
      const response = await fetch("/api/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          productName: product.name,
          userName,
          contactDetails,
        }),
      });

      if (response.ok) {
        showToast("success", "Thank you! The admin has been notified.");
        setShowNotifyModal(false);
        setFormData({ name: "", contact: "" });
      } else {
        showToast("error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error notifying admin:", error);
      showToast("error", "Failed to submit request.");
    } finally {
      setNotifyLoading(false);
    }
  };

  const formatPrice = (price: number) => `₹${price.toLocaleString()}`;
  
  const displayPrice = product.salePrice || product.price;
  const hasSale = !!product.salePrice && product.salePrice < product.price;
  const isOutOfStock = product.stock === 0;

  return (
    <>
      <Link href={`/product/${product.slug}`} className="group block relative">
        {error && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-red-500 text-white text-xs p-2 rounded-t-lg text-center">
            {error}
          </div>
        )}
        
        <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-[#F1EBE1] w-full" style={{ aspectRatio: "1 / 1" }}>
          {product.images[0]?.url ? (
            <div className="relative w-full h-full">
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#D4C4B0]">
              <span className="text-2xl text-[#8B6F52] font-semibold">
                {product.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {product.badge && (
            <span 
              className={`absolute top-2 sm:top-3 left-2 sm:left-3 uppercase rounded z-10 
              ${product.badge === "Sale" 
                ? "bg-[#e2e2e2] text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 font-semibold tracking-widest" 
                : "bg-[#1A1A1A] text-white text-[10px] font-bold px-2.5 py-1 shadow-sm tracking-wider"}`}
            >
              {product.badge}
            </span>
          )}

          {hasSale && !product.badge && (
            <span className="absolute top-2 sm:top-3 left-2 sm:left-3 text-[9px] sm:text-[10px] tracking-widest uppercase px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-semibold bg-red-500 text-white z-10">
              SALE
            </span>
          )}

          <button
            onClick={toggleWishlist}
            disabled={isTogglingWishlist}
            className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/80 hover:bg-white rounded-full p-1 sm:p-1.5 transition-colors shadow-sm z-10 disabled:opacity-50"
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isTogglingWishlist ? (
              <Loader2 size={12} className="sm:w-[14px] sm:h-[14px] animate-spin text-[#1A1A1A]" />
            ) : (
              <Heart 
                size={12} 
                className={`sm:w-[14px] sm:h-[14px] transition-colors ${
                  wished ? "fill-[#e2e2e2] text-[#e2e2e2]" : "text-[#1A1A1A]"
                }`} 
              />
            )}
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isOutOfStock) {
                // Modified condition based on login state
                if (auth) {
                  const user = auth as any; // <-- TS Error fix
                  submitNotifyRequest(user.name || "Logged-in User", user.email || user.phone || "User Account");
                } else {
                  setShowNotifyModal(true);
                }
              } else {
                handleAddToCart(e);
              }
            }}
            disabled={(!isOutOfStock && isAddingToCart) || notifyLoading}
            data-testid="product-card-add-to-cart"
            className={`absolute bottom-0 left-0 right-0 text-[10px] sm:text-xs tracking-widest uppercase text-center py-2.5 sm:py-3 transition-all duration-300 font-semibold z-10 translate-y-0 md:translate-y-full md:group-hover:translate-y-0
              ${added ? "bg-[#e2e2e2] text-white" : 
                isOutOfStock ? "bg-[#C1121F] text-white hover:bg-red-700" : 
                "bg-[#1A1A1A] text-white hover:bg-[#e2e2e2]"}`}
          >
            {notifyLoading ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                Notifying...
              </span>
            ) : isAddingToCart ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                Adding...
              </span>
            ) : added ? (
              <span className="flex items-center justify-center gap-1">
                <Check size={12} /> Added
              </span>
            ) : isOutOfStock ? (
              <span className="flex items-center justify-center gap-1">
                <Bell size={12} /> Notify Me
              </span>
            ) : (
              "Add to Cart"
            )}
          </button>
        </div>

        <div className="mt-2 sm:mt-3 px-0.5">
          <p className="text-[9px] sm:text-[10px] tracking-widest uppercase text-[#8B6F52]">
            {product.category?.name || ""}
          </p>
          <p className="text-xs sm:text-sm text-[#1A1A1A] mt-0.5 font-medium leading-snug line-clamp-1">
            {product.name}
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
            <span className={`text-xs sm:text-sm font-semibold text-[#1A1A1A] ${hasSale ? "text-red-600" : ""}`}>
              {formatPrice(displayPrice)}
            </span>
            {hasSale && (
              <span className="text-[10px] sm:text-xs text-[#8B6F52] line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          {isOutOfStock && (
            <span className="text-[10px] text-[#C1121F] font-medium mt-1 inline-block">
              Out of Stock
            </span>
          )}
        </div>
      </Link>

      {/* Notify Me Modal (Placed outside Link to prevent navigation issues) */}
      {showNotifyModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative text-left">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifyModal(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
            <h3 className="text-xl font-semibold mb-3 text-[#1A1A1A]">Notify Me</h3>
            <p className="text-sm text-gray-600 mb-5">
              Leave your details below and we will notify you when <strong>{product.name}</strong> is back in stock.
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AEAA9B] text-black"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AEAA9B] text-black"
                  placeholder="name@example.com or +91 9876543210"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifyModal(false);
                  }}
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
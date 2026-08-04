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
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", contact: "" });
  
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.authStore?.auth);

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

  useEffect(() => {
    if (!product?.images || product.images.length <= 1) return;
    let interval: NodeJS.Timeout;
    const randomDelay = Math.floor(Math.random() * 2500);

    const timeout = setTimeout(() => {
      setCurrentImgIndex((prevIndex) => 
        prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
      );
      interval = setInterval(() => {
        setCurrentImgIndex((prevIndex) => 
          prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
        );
      }, 3500);
    }, randomDelay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [product?.images]);

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
        const res = await fetch(`/api/wishlist?productId=${product._id}`, { method: "DELETE" });
        if (!res.ok) showToast("error", "Failed to remove from wishlist");
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id }),
        });
        if (!res.ok) showToast("error", "Failed to add to wishlist");
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
  
  if (!product) return null;

  const displayPrice = product.salePrice || product.price;
  const hasSale = !!product.salePrice && product.salePrice < product.price;
  const isOutOfStock = product.stock === 0;
  const productImages = product.images || [];

  return (
    <>
      {/* 🔥 CSS CONFLICT FIXED: Hata diya 'block' jo 'flex' ke sath clash kar raha tha, aur 'w-full' lagaya taaki card 100% width le */}
      <Link href={`/product/${product.slug}`} className="group relative h-full flex flex-col w-full bg-white">
        {error && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-red-500 text-white text-xs p-2 text-center">
            {error}
          </div>
        )}
        
        <div className="relative overflow-hidden rounded-none bg-[#F1EBE1] w-full" style={{ aspectRatio: "1 / 1" }}>
          
          <div className="absolute inset-[4px] border border-white/60 z-20 pointer-events-none opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 z-10 pointer-events-none transition-colors duration-500" />

          {productImages.length > 0 ? (
            productImages.map((img, index) => (
              <div
                key={index}
                className="absolute inset-0 w-full h-full transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateX(${(index - currentImgIndex) * 100}%)` }}
              >
                <Image
                  src={img.url}
                  alt={`${product.name} - Image ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#D4C4B0]">
              <span className="text-2xl text-[#8B6F52] font-semibold">
                {product.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {product.badge && (
            <span 
              className={`absolute top-[4px] left-[4px] uppercase rounded-none z-30 
              ${product.badge === "Sale" 
                ? "bg-white text-black text-[9px] sm:text-[10px] px-2.5 py-1 font-bold tracking-widest border border-gray-200" 
                : "bg-[#1A1A1A] text-white text-[10px] font-bold px-3 py-1 tracking-wider"}`}
            >
              {product.badge}
            </span>
          )}

          {hasSale && !product.badge && (
            <span className="absolute top-[4px] left-[4px] text-[9px] sm:text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-none font-bold bg-[#C1121F] text-white z-30">
              SALE
            </span>
          )}

          <button
            onClick={toggleWishlist}
            disabled={isTogglingWishlist}
            className="absolute top-[4px] right-[4px] bg-white/90 hover:bg-white rounded-none p-2 transition-colors shadow-sm z-30 disabled:opacity-50"
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isTogglingWishlist ? (
              <Loader2 size={14} className="animate-spin text-[#1A1A1A]" />
            ) : (
              <Heart 
                size={14} 
                className={`transition-colors ${
                  wished ? "fill-[#C1121F] text-[#C1121F]" : "text-[#1A1A1A]"
                }`} 
              />
            )}
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isOutOfStock) {
                if (auth) {
                  const user = auth as any;
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
            className={`absolute bottom-0 left-0 right-0 text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-center py-3.5 transition-all duration-300 font-bold z-30 translate-y-0 md:translate-y-full md:group-hover:translate-y-0 rounded-none
              ${added ? "bg-white text-black border-t border-gray-200" : 
                isOutOfStock ? "bg-[#C1121F] text-white hover:bg-red-800" : 
                "bg-[#1A1A1A] text-white hover:bg-[#333333]"}`}
          >
            {notifyLoading ? (
              <span className="flex items-center justify-center gap-[4px]">
                <Loader2 size={14} className="animate-spin" />
                Notifying...
              </span>
            ) : isAddingToCart ? (
              <span className="flex items-center justify-center gap-[4px]">
                <Loader2 size={14} className="animate-spin" />
                Adding...
              </span>
            ) : added ? (
              <span className="flex items-center justify-center gap-[4px]">
                <Check size={14} /> Added
              </span>
            ) : isOutOfStock ? (
              <span className="flex items-center justify-center gap-[4px]">
                <Bell size={14} /> Notify Me
              </span>
            ) : (
              "Add to Cart"
            )}
          </button>
        </div>

        <div className="flex flex-col flex-grow mt-3 px-[4px]">
          <p className="text-[9px] sm:text-[10px] tracking-widest uppercase text-[#8B6F52] font-semibold mb-[4px]">
            {product.category?.name || ""}
          </p>
          <p className="text-sm sm:text-[15px] text-[#1A1A1A] font-serif leading-snug line-clamp-2">
            {product.name}
          </p>
          <div className="flex items-center gap-[4px] sm:gap-[6px] mt-[4px] flex-wrap">
            <span className={`text-sm sm:text-base font-medium ${hasSale ? "text-[#C1121F]" : "text-[#1A1A1A]"}`}>
              {formatPrice(displayPrice)}
            </span>
            {hasSale && (
              <span className="text-[11px] sm:text-xs text-gray-500 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          {isOutOfStock && (
            <span className="text-[10px] text-[#C1121F] font-bold uppercase tracking-widest mt-[4px] inline-block">
              Out of Stock
            </span>
          )}
        </div>
      </Link>

      {showNotifyModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="bg-white rounded-none p-8 w-full max-w-md shadow-2xl relative text-left">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifyModal(false);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-[#1A1A1A] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-2xl font-serif mb-2 text-[#1A1A1A]">Notify Me</h3>
            <p className="text-sm text-gray-500 mb-6 font-light">
              Leave your details below and we will notify you when <strong>{product.name}</strong> is back in stock.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              submitNotifyRequest(formData.name, formData.contact);
            }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-800 mb-2">Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-[#1A1A1A] text-[#1A1A1A] transition-colors bg-[#FAF7F2]"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-800 mb-2">Email / Phone</label>
                <input
                  required
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-[#1A1A1A] text-[#1A1A1A] transition-colors bg-[#FAF7F2]"
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
                  className="px-6 py-3 text-[11px] font-bold tracking-widest uppercase text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={notifyLoading}
                  className="px-6 py-3 bg-[#1A1A1A] text-white rounded-none hover:bg-[#333333] transition-colors disabled:opacity-70 text-[11px] font-bold tracking-widest uppercase flex items-center gap-[4px]"
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
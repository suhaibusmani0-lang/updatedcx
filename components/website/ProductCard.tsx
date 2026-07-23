"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Heart, Check, Loader2 } from "lucide-react";
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
      // Auto-clear error after 3 seconds
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
      // Redirect to login or show message
      setError("Please login to add to wishlist");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setError(null);
    setIsTogglingWishlist(true);
    // Optimistic update
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
      // Revert optimistic update on error
      setWished(previousWished);
      setError(error instanceof Error ? error.message : "Failed to update wishlist");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsTogglingWishlist(false);
    }
  }, [auth, wished, product._id, isTogglingWishlist]);

  const formatPrice = (price: number) => `₹${price.toLocaleString()}`;
  
  const displayPrice = product.salePrice || product.price;
  const hasSale = !!product.salePrice && product.salePrice < product.price;
  const isOutOfStock = product.stock === 0;

  return (
    
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
          <span className={`absolute top-2 sm:top-3 left-2 sm:left-3 text-[9px] sm:text-[10px] tracking-widest uppercase px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-semibold z-10
            ${product.badge === "Sale" ? "bg-[#e2e2e2] text-white" : "bg-[#1A1A1A] text-white"}`}>
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
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAddingToCart}
          data-testid="product-card-add-to-cart"
          className={`absolute bottom-0 left-0 right-0 text-[10px] sm:text-xs tracking-widest uppercase text-center py-2.5 sm:py-3 transition-all duration-300 font-semibold z-10 translate-y-0 md:translate-y-full md:group-hover:translate-y-0
            ${added ? "bg-[#e2e2e2] text-white" : 
              isOutOfStock ? "bg-gray-400 text-white cursor-not-allowed" : 
              "bg-[#1A1A1A] text-white hover:bg-[#e2e2e2]"}`}
        >
          {isAddingToCart ? (
            <span className="flex items-center justify-center gap-1">
              <Loader2 size={12} className="animate-spin" />
              Adding...
            </span>
          ) : added ? (
            <span className="flex items-center justify-center gap-1">
              <Check size={12} /> Added
            </span>
          ) : isOutOfStock ? (
            "Out of Stock"
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
          <span className="text-[10px] text-red-500 font-medium mt-1 inline-block">
            Out of Stock
          </span>
        )}
      </div>
    </Link>
  );
}
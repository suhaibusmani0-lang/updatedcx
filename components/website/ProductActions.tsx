"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ShoppingCart, Heart, Share2, Check, Loader2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addToCart, setCart, mapApiCartItems } from "@/store/reducer/cartReducer";
import type { RootState } from "@/store/store";

interface ProductActionsProps {
  productId: string;
  name: string;
  image: string;
  price: number;
  slug: string;
  stock: number;
}

export default function ProductActions({ 
  productId, 
  name, 
  image, 
  price, 
  slug, 
  stock 
}: ProductActionsProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const auth = useSelector((state: RootState) => state.authStore?.auth);
  const dispatch = useDispatch();
  const router = useRouter();

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
    if (stock === 0 || isAddingToCart) return;
    
    setError(null);
    setIsAddingToCart(true);

    try {
      if (auth) {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, qty }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to add to cart");
        }

        if (data.data?.items) {
          dispatch(setCart(mapApiCartItems(data.data.items)));
        }
      } else {
        for (let i = 0; i < qty; i++) {
          dispatch(addToCart({
            id: productId,
            productId,
            name,
            category: "",
            price,
            image,
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
  }, [auth, productId, qty, stock, dispatch, name, price, image, isAddingToCart]);

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
        // Use a toast notification instead of alert for better UX
        setError(null);
        // You could add a "Copied!" state here
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
    if (stock === 0) return;
    await addItem();
    router.push("/checkout");
  }, [addItem, router, stock]);

  const isOutOfStock = stock === 0;

  return (
    <>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
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
              : "bg-[#1A1A1A] text-white hover:bg-[#C17A56]"
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
          className="flex-1 py-3 bg-[#C17A56] text-white rounded-xl font-medium hover:bg-[#A06245] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={toggleWishlist}
          disabled={isTogglingWishlist}
          className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-medium transition-colors ${
            wished 
              ? "bg-[#C17A56] text-white border-[#C17A56]" 
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
    </>
  );
}
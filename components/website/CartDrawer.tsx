"use client";

import { useSelector, useDispatch } from "react-redux";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { removeFromCart, updateQty, clearCart, setCart, mapApiCartItems, type CartItem } from "@/store/reducer/cartReducer";
import { useEffect, useState, useCallback } from "react";
import type { RootState } from "@/store/store";
import Link from "next/link";
import Image from "next/image";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const items: CartItem[] = useSelector((state: RootState) => state.cart.items);
  const auth = useSelector((state: RootState) => state.authStore?.auth);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const fetchCart = useCallback(async () => {
    if (!auth) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        if (data.data?.items) {
          dispatch(setCart(mapApiCartItems(data.data.items)));
        } else {
          dispatch(setCart([]));
        }
      } else if (res.status === 404 || res.status === 401) {
        dispatch(setCart([]));
      } else {
        dispatch(setCart([]));
      }
    } catch (error) {
      dispatch(setCart([]));
    } finally {
      setIsLoading(false);
    }
  }, [auth, dispatch]);

  useEffect(() => {
    if (auth) {
      fetchCart();
    }
  }, [auth, fetchCart]);

  useEffect(() => {
    if (open && auth) {
      fetchCart();
    }
  }, [open, auth, fetchCart]);

  const handleUpdateQty = useCallback(async (id: string, qty: number) => {
    if (qty < 1) return;
    
    dispatch(updateQty({ id, qty }));
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id, qty }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.data?.items) {
          dispatch(setCart(mapApiCartItems(data.data.items)));
        }
      } else {
        fetchCart();
      }
    } catch (error) {
      console.error("Failed to update cart:", error);
      fetchCart();
    }
  }, [dispatch, fetchCart]);

  const handleRemoveItem = useCallback(async (id: string) => {
    dispatch(removeFromCart(id));
    try {
      const res = await fetch(`/api/cart?itemId=${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.items) {
          dispatch(setCart(mapApiCartItems(data.data.items)));
        }
      } else {
        console.error("Failed to remove item:", res.status);
        fetchCart();
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
      fetchCart();
    }
  }, [dispatch, fetchCart]);

  const handleClearCart = useCallback(async () => {
    dispatch(clearCart());
    try {
      const res = await fetch("/api/cart?clear=true", { method: "DELETE" });
      if (!res.ok) {
        console.error("Failed to clear cart:", res.status);
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  }, [dispatch]);

  const formatPrice = (price: number) => `₹${price.toLocaleString()}`;

  // Helper function to get image source with fallback
  const getImageSrc = (image: string) => {
    if (!image || image.trim() === "") {
      return "/placeholder-image.jpg";
    }
    return image;
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[80] bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 z-[90] h-full w-full max-w-[400px] bg-white flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3D9C9]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#1A1A1A]" />
            <span className="text-sm tracking-widest uppercase font-semibold text-[#1A1A1A]">
              Cart ({items.reduce((s, i) => s + i.qty, 0)})
            </span>
          </div>
          <button onClick={onClose} className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-8 h-8 border-2 border-[#E3D9C9] border-t-[#1A1A1A] rounded-full animate-spin" />
              <p className="text-sm text-[#8B6F52]">Loading your cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag size={40} className="text-[#E3D9C9]" />
              <p className="text-sm text-[#8B6F52]">Your cart is empty</p>
              <button 
                onClick={onClose} 
                className="text-xs tracking-widest uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-16 h-20 rounded-lg bg-[#F1EBE1] shrink-0 overflow-hidden relative">
                  {getImageSrc(item.image) && (
                    <img 
                      src={getImageSrc(item.image)} 
                      alt={item.name || "Product"} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] tracking-widest uppercase text-[#8B6F52]">{item.category}</p>
                  <p className="text-sm font-medium text-[#1A1A1A] leading-snug line-clamp-1">{item.name}</p>
                  <p className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                      className="w-6 h-6 rounded-full border border-[#E3D9C9] flex items-center justify-center hover:bg-[#F1EBE1] transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-sm w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                      className="w-6 h-6 rounded-full border border-[#E3D9C9] flex items-center justify-center hover:bg-[#F1EBE1] transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={10} />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="ml-auto text-[#8B6F52] hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {!isLoading && items.length > 0 && (
          <div className="border-t border-[#E3D9C9] px-5 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-widest uppercase text-[#8B6F52]">Subtotal</span>
              <span className="text-base font-semibold text-[#1A1A1A]">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-[10px] text-[#8B6F52] text-center">Shipping & taxes calculated at checkout</p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full bg-[#1A1A1A] text-white text-xs tracking-widest uppercase text-center py-3.5 hover:bg-[#C17A56] transition-colors"
            >
              Checkout
            </Link>
            <button
              onClick={handleClearCart}
              className="block w-full text-center text-xs tracking-widest uppercase text-[#8B6F52] hover:text-[#1A1A1A] transition-colors"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
"use client";

import { useState, useCallback, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  setCart,
  mapApiCartItems,
  updateQty,
  removeFromCart,
} from "@/store/reducer/cartReducer";
import type { RootState } from "@/store/store";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty?: number;
  disabled?: boolean;
  stock?: number;
}

export default function AddToCartButton({
  productId,
  name,
  image,
  price,
  disabled,
  stock = 99,
}: AddToCartButtonProps) {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.authStore?.auth);
  const cartItem = useSelector((state: RootState) =>
    state.cart.items.find((i) => i.productId === productId || i.id === productId)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const currentQty = cartItem?.qty ?? 0;

  const persistCartToServer = useCallback(
    async (newQty: number) => {
      if (!auth) return;
      if (newQty <= 0) {
        if (!cartItem?.id) return;
        await fetch(`/api/cart?itemId=${cartItem.id}`, { method: "DELETE" });
        return;
      }
      if (!cartItem?.id) {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, qty: newQty }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to add to cart");
        if (data?.data?.items) dispatch(setCart(mapApiCartItems(data.data.items)));
      } else {
        const res = await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: cartItem.id, qty: newQty }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to update cart");
        if (data?.data?.items) dispatch(setCart(mapApiCartItems(data.data.items)));
      }
    },
    [auth, cartItem, dispatch, productId]
  );

  const handleAdd = useCallback(async () => {
    if (disabled || loading || stock === 0) return;
    setError(null);
    setLoading(true);
    try {
      if (auth) {
        await persistCartToServer(1);
      } else {
        dispatch(
          addToCart({
            id: productId,
            productId,
            name,
            category: "",
            price,
            image,
          })
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  }, [
    auth,
    disabled,
    dispatch,
    image,
    loading,
    name,
    persistCartToServer,
    price,
    productId,
    stock,
  ]);

  const handleIncrement = useCallback(async () => {
    if (loading || currentQty >= stock) return;
    setError(null);
    setLoading(true);
    try {
      const newQty = currentQty + 1;
      if (auth) {
        await persistCartToServer(newQty);
      } else if (cartItem) {
        dispatch(updateQty({ id: cartItem.id, qty: newQty }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update quantity");
    } finally {
      setLoading(false);
    }
  }, [auth, cartItem, currentQty, dispatch, loading, persistCartToServer, stock]);

  const handleDecrement = useCallback(async () => {
    if (loading || currentQty <= 0) return;
    setError(null);
    setLoading(true);
    try {
      const newQty = currentQty - 1;
      if (auth) {
        await persistCartToServer(newQty);
        if (newQty <= 0 && cartItem?.id) {
          dispatch(removeFromCart(cartItem.id));
        } else if (cartItem?.id) {
          dispatch(updateQty({ id: cartItem.id, qty: newQty }));
        }
      } else if (cartItem) {
        if (newQty <= 0) dispatch(removeFromCart(cartItem.id));
        else dispatch(updateQty({ id: cartItem.id, qty: newQty }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update quantity");
    } finally {
      setLoading(false);
    }
  }, [auth, cartItem, currentQty, dispatch, loading, persistCartToServer]);

  const isOutOfStock = stock === 0;

  if (currentQty > 0) {
    return (
      <div className="flex-1">
        <div
          data-testid="cart-qty-control"
          className="flex items-center justify-between border-2 border-[#1A1A1A] rounded-xl overflow-hidden"
        >
          <button
            type="button"
            onClick={handleDecrement}
            disabled={loading}
            data-testid="cart-qty-decrease"
            className="px-4 py-3 text-[#1A1A1A] hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          <span
            data-testid="cart-qty-value"
            className="px-4 py-3 font-semibold min-w-[40px] text-center"
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : currentQty}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={loading || currentQty >= stock}
            data-testid="cart-qty-increase"
            className="px-4 py-3 text-[#1A1A1A] hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>
        {error && (
          <p data-testid="cart-error" className="text-red-500 text-xs mt-1 text-center">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1">
      <button
        onClick={handleAdd}
        disabled={disabled || loading || isOutOfStock}
        data-testid="add-to-cart-btn"
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
          isOutOfStock || disabled
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-[#1A1A1A] text-white hover:bg-[#C17A56]"
        }`}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            <ShoppingCart size={18} />
            <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
          </>
        )}
      </button>
      {error && (
        <p data-testid="cart-error" className="text-red-500 text-xs mt-1 text-center">
          {error}
        </p>
      )}
    </div>
  );
}

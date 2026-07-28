"use client";

import { useState, useCallback, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Loader2, Bell } from "lucide-react";
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
  
  // Cart States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notify Me States
  const [showModal, setShowModal] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", contact: "" });

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const currentQty = cartItem?.qty ?? 0;
  const isOutOfStock = stock === 0;

  // --- Cart Functions ---
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
    if (disabled || loading || isOutOfStock) return;
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
  }, [auth, disabled, dispatch, image, loading, name, persistCartToServer, price, productId, isOutOfStock]);

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

  // --- Notify Me Form Submission ---
  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyLoading(true);

    try {
      const response = await fetch("/api/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          productName: name,
          userName: formData.name,
          contactDetails: formData.contact,
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

  // Quantity control UI (If already in cart)
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
    <div className="flex-1 relative">
      {/* Conditionally Render Notify Me OR Add to Cart */}
      {isOutOfStock ? (
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors bg-red-600 text-white hover:bg-red-700"
        >
          <Bell size={18} />
          <span>Notify Me When In Stock</span>
        </button>
      ) : (
        <button
          onClick={handleAdd}
          disabled={disabled || loading}
          data-testid="add-to-cart-btn"
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
            disabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#1A1A1A] text-white hover:bg-[#AEAA9B]"
          }`}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <ShoppingCart size={18} />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p data-testid="cart-error" className="text-red-500 text-xs mt-1 text-center">
          {error}
        </p>
      )}

      {/* Notify Me Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg text-left">
            <h3 className="text-xl font-bold mb-4 text-[#1A1A1A]">Notify Me</h3>
            <p className="text-sm text-gray-600 mb-4">
              Leave your details and we will notify you when <strong>{name}</strong> is back in stock.
            </p>
            <form onSubmit={handleNotifySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AEAA9B]"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email / Phone Number</label>
                <input
                  required
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AEAA9B]"
                  placeholder="name@example.com or +91 9876543210"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={notifyLoading}
                  className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#AEAA9B] transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {notifyLoading ? "Sending..." : "Notify Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CartItem = {
  id: string;
  productId?: string;
  name: string;
  category: string;
  price: number;
  image: string;
  qty: number;
  variant?: { size?: string; color?: string; sku?: string; price?: number; salePrice?: number; image?: string };
};

type ApiCartItem = {
  _id: string;
  product: { _id: string; category?: { name?: string } } | string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  variant?: { size?: string; color?: string };
};

export function mapApiCartItems(items: ApiCartItem[]): CartItem[] {
  return items
    .filter((item) => item.product)
    .map((item) => ({
      id: item._id,
      productId: typeof item.product === "string" ? item.product : item.product._id,
      name: item.name,
      category: typeof item.product === "object" ? item.product.category?.name || "" : "",
      price: item.price,
      image: item.image || "",
      qty: item.qty,
      variant: item.variant,
    }));
}

type CartState = { items: CartItem[] };

const initialState: CartState = { items: [] };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<Omit<CartItem, "qty">>) {
      const payload = {
        ...action.payload,
        id: action.payload.id || [action.payload.productId, action.payload.variant?.sku, action.payload.variant?.size, action.payload.variant?.color].filter(Boolean).join("-") || "cart-item",
      };

      const existing = state.items.find((i) => {
        if (i.id === payload.id) return true;
        if (!i.productId || !payload.productId || i.productId !== payload.productId) return false;
        return (
          (i.variant?.sku || "") === (payload.variant?.sku || "") &&
          (i.variant?.size || "") === (payload.variant?.size || "") &&
          (i.variant?.color || "") === (payload.variant?.color || "")
        );
      });

      if (existing) {
        existing.qty += 1;
        existing.price = payload.price;
        existing.image = payload.image;
        existing.name = payload.name;
        existing.variant = payload.variant;
      } else {
        state.items.push({ ...payload, qty: 1 });
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    updateQty(state, action: PayloadAction<{ id: string; qty: number }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.qty = Math.max(1, action.payload.qty);
      }
    },
    setCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, updateQty, setCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

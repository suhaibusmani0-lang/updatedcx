import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CartItem = {
  id: string;
  productId?: string;
  name: string;
  category: string;
  price: number;
  image: string;
  qty: number;
  variant?: { size?: string; color?: string };
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
      const existing = state.items.find(
        (i) => i.id === action.payload.id || i.productId === action.payload.productId
      );
      if (existing) {
        existing.qty += 1;
      } else {
        state.items.push({ ...action.payload, qty: 1 });
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

import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  image: { type: String, default: "" },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, default: 1 },
  variant: {
    size: { type: String, default: "" },
    color: { type: String, default: "" },
  },
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [cartItemSchema],
  totalAmount: { type: Number, default: 0 },
  coupon: {
    code: { type: String, default: "" },
    discount: { type: Number, default: 0 },
  },
}, { timestamps: true });

cartSchema.pre("save", async function () {
  this.totalAmount =
    this.items.reduce((sum, item) => sum + item.price * item.qty, 0) -
    (this.coupon?.discount || 0);
});

const CartModel = mongoose.models.Cart || mongoose.model("Cart", cartSchema, "carts");
export default CartModel;

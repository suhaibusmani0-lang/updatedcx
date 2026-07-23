import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  image: String,
  price: Number,
  qty: Number,
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  shippingMethod: { type: String, default: "standard" },
  courierName: { type: String, default: "Standard" },
  // Order lifecycle status
  status: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Refund"], default: "Pending" },
  paymentStatus: { type: String, enum: ["Unpaid", "Paid", "Refunded"], default: "Unpaid" },
  paymentMethod: { type: String, default: "Razorpay" },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  shippingAddress: {
    name: String, phone: String, address: String, city: String, state: String, pincode: String,
  },
  billingAddress: {
    name: String, phone: String, address: String, city: String, state: String, pincode: String,
  },
}, { timestamps: true });

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema, "orders");
export default OrderModel;

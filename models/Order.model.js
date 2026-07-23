import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  image: String,
  price: Number,
  qty: Number,
  sku: String,
  category: String,
});

const trackingEventSchema = new mongoose.Schema(
  {
    status: String,
    status_code: String,
    remark: String,
    location: String,
    timestamp: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    shippingMethod: { type: String, default: "standard" },
    courierName: { type: String, default: "Standard" },
    courierId: { type: String, default: "" },
    // Order lifecycle status
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Refund"],
      default: "Pending",
    },
    paymentStatus: { type: String, enum: ["Unpaid", "Paid", "Refunded"], default: "Unpaid" },
    paymentMethod: { type: String, default: "Razorpay" },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    shippingAddress: {
      name: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    billingAddress: {
      name: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
    },

    // --- ShipMozo tracking fields ---
    shipmozoOrderId: { type: String, default: "" }, // ShipMozo internal order ID
    awbNumber: { type: String, default: "" }, // Air Waybill number from courier
    trackingUrl: { type: String, default: "" }, // ShipMozo public tracking URL
    currentTrackingStatus: { type: String, default: "" }, // Latest status text
    expectedDeliveryDate: { type: Date, default: null },
    trackingHistory: { type: [trackingEventSchema], default: [] },
    lastTrackedAt: { type: Date, default: null },
    shipmozoPushed: { type: Boolean, default: false }, // Was order pushed to ShipMozo
    shipmozoRawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

// Public tracking token is derived from _id for lookup by anyone with the order id
orderSchema.index({ awbNumber: 1 });
orderSchema.index({ shipmozoOrderId: 1 });

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema, "orders");
export default OrderModel;

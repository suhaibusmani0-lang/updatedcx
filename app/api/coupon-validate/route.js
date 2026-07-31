import { connectDB } from "@/lib/databaseConnection";
import CouponModel from "@/models/Coupon.model";
// Order model import karna padega firstOrderOnly check karne ke liye
// import OrderModel from "@/models/Order.model"; 

function jsonRes(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // ==========================================
    // ADMIN: CREATE COUPON WITH FILTERS
    // ==========================================
    if (body.action === "create") {
      const { 
        code, type, value, minOrder, maxUses, expiresAt,
        applicableProducts, applicableCategories, firstOrderOnly, usagePerUser // New Filters
      } = body.couponData;

      if (!code || !type || !value) return jsonRes(400, "Missing required fields");

      const newCoupon = await CouponModel.create({
        code: code.toUpperCase(),
        type,
        value,
        minOrder: minOrder || 0,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        // Saving the filters
        applicableProducts: applicableProducts || [],
        applicableCategories: applicableCategories || [],
        firstOrderOnly: firstOrderOnly || false,
        usagePerUser: usagePerUser || 1,
      });
      return jsonRes(201, "Coupon created with advanced filters successfully", newCoupon);
    }

    // ==========================================
    // CUSTOMER: APPLY COUPON & VALIDATE FILTERS
    // ==========================================
    const { code, subtotal, userId, cartItems } = body;
    if (!code) return jsonRes(400, "Coupon code is required");

    const coupon = await CouponModel.findOne({ code: code.toUpperCase(), isActive: true });
    
    // 1. Basic Checks
    if (!coupon) return jsonRes(404, "Invalid coupon code");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return jsonRes(400, "Coupon has expired");
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return jsonRes(400, "Coupon overall usage limit reached");
    if (subtotal < coupon.minOrder) return jsonRes(400, `Minimum order of ₹${coupon.minOrder} required`);

    // 2. First Order Only Check (Requires OrderModel & userId)
    /* 
    if (coupon.firstOrderOnly && userId) {
      const previousOrders = await OrderModel.countDocuments({ user: userId });
      if (previousOrders > 0) {
        return jsonRes(400, "This coupon is valid for first-time customers only");
      }
    }
    */

    // 3. Category & Product Restrictions
    if ((coupon.applicableProducts.length > 0 || coupon.applicableCategories.length > 0) && cartItems) {
      // Check if any cart item matches the allowed products or categories
      const hasValidProduct = cartItems.some(item => 
        coupon.applicableProducts.includes(item.productId) || 
        coupon.applicableCategories.includes(item.categoryId)
      );

      if (!hasValidProduct) {
        return jsonRes(400, "This coupon is not applicable to the items in your cart");
      }
    }

    // Calculation logic
    const discount = coupon.type === "percent"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

    return jsonRes(200, `Coupon applied! You save ₹${discount}`, { 
      id: coupon._id,
      discount, 
      type: coupon.type, 
      value: coupon.value 
    });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : "Internal Server Error");
  }
}

// GET, PUT, DELETE methods exact purane wale hi rahenge...
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/databaseConnection";
import OrderModel from "@/models/Order.model";
import { pushOrder } from "@/lib/shipmozo";

export async function POST(req) {
  try {
    const orderData = await req.json();

    const paymentMethod = String(orderData.paymentMethod || "").toLowerCase();
    const paymentType =
      paymentMethod === "razorpay" || paymentMethod === "prepaid" ? "PREPAID" : "COD";
    const items = Array.isArray(orderData.items) ? orderData.items : [];

    const payload = {
      order_id: String(orderData.orderId),
      order_date: new Date().toISOString().split("T")[0],
      consignee_name: orderData.customerName,
      consignee_phone: Number(orderData.phone),
      consignee_email: orderData.email || "",
      consignee_address_line_one: orderData.address,
      consignee_pin_code: Number(orderData.pincode),
      consignee_city: orderData.city,
      consignee_state: orderData.state,
      payment_type: paymentType,
      cod_amount: paymentType === "COD" ? String(orderData.totalAmount || 0) : "",
      weight: 500,
      length: 10,
      width: 10,
      height: 10,
      warehouse_id: "26652",
      product_detail: items.map((item) => ({
        name: item.name || "Product",
        sku_number: String(item.sku || item.id || ""),
        quantity: Number(item.units || item.qty || 1),
        unit_price: Number(item.selling_price || item.price || 0),
        product_category: item.category || "Other",
        discount: "",
        hsn: "",
      })),
    };

    let data;
    try {
      data = await pushOrder(payload);
    } catch (err) {
      console.error("ShipMozo upstream error", err?.response || err?.message);
      // Still keep the order in our DB even if push fails
      try {
        await connectDB();
        await OrderModel.findByIdAndUpdate(orderData.orderId, {
          shipmozoPushed: false,
          shipmozoRawResponse: err?.response || { message: err?.message },
        }).catch(() => null);
      } catch {}
      return NextResponse.json(
        { success: false, error: err?.message || "Failed to push order to ShipMozo" },
        { status: 500 }
      );
    }

    // Extract shipmozo order id (their internal id) from response
    const shipmozoOrderId = data?.data?.order_id || data?.order_id || "";
    const referenceId = data?.data?.refrence_id || data?.data?.reference_id || String(orderData.orderId);

    // Persist to our order document so we can track it later
    try {
      await connectDB();
      await OrderModel.findByIdAndUpdate(
        orderData.orderId,
        {
          shipmozoOrderId: String(shipmozoOrderId || ""),
          shipmozoPushed: true,
          shipmozoRawResponse: data,
          currentTrackingStatus: "Order Pushed",
          trackingHistory: [
            {
              status: "Order Pushed to ShipMozo",
              remark: "Order successfully queued for shipping",
              timestamp: new Date(),
            },
          ],
          status: "Processing",
        },
        { new: true }
      ).catch((e) => console.error("Order update after ShipMozo push failed:", e));
    } catch (dbErr) {
      console.error("DB update failed after ShipMozo push:", dbErr?.message);
    }

    return NextResponse.json({
      success: true,
      data,
      shipmozoOrderId,
      referenceId,
    });
  } catch (error) {
    console.error("ShipMozo Sync Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

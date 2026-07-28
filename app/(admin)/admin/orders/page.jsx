"use client";

import { useEffect, useState } from "react";

const statusOptions = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Refund"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [fetchingAwbIds, setFetchingAwbIds] = useState(new Set()); 

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await res.json();
      setOrders(data?.orders || data?.data?.orders || data?.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (orderId) => {
    const url = `/api/admin/orders/${orderId}/download`;
    const popup = window.open(url, "_blank", "noopener,noreferrer");

    if (!popup) {
      window.location.assign(url);
    }
  };

  const deleteOrder = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this order?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete order");
      }

      await fetchOrders();
      window.alert("Order deleted successfully");
    } catch (e) {
      window.alert(e?.message || "Failed to delete order");
    }
  };

  const updateStatus = async (id, status) => {
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    setUpdatingIds((s) => new Set(s).add(id));

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, orderId: id }),
      });

      if (!res.ok) {
        await fetchOrders();
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to update order status");
      }
    } catch (e) {
      await fetchOrders();
      alert(e?.message || "Failed to update order status");
    } finally {
      setUpdatingIds((s) => {
        const copy = new Set(s);
        copy.delete(id);
        return copy;
      });
    }
  };

  const assignAwb = async (id) => {
    const awb = window.prompt("Enter AWB number from ShipMozo:")?.trim();
    if (!awb) return;
    const courierName = window.prompt("Courier name (optional):", "")?.trim() || "";
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awbNumber: awb, courierName, status: "Shipped" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to assign AWB");
      }
      await fetchOrders();
      alert("AWB assigned successfully. Live tracking will begin shortly.");
    } catch (e) {
      alert(e?.message || "Failed to assign AWB");
    }
  };

  const handleFetchAwb = async (id) => {
    setFetchingAwbIds((s) => new Set(s).add(id));
    try {
      const res = await fetch("/api/shipmozo/sync-awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      
      if (!res.ok) throw new Error("API failed");
      
      await fetchOrders();
    } catch (e) {
      alert("Failed to fetch AWB from Shipmozo. Please try again.");
    } finally {
      setFetchingAwbIds((s) => {
        const copy = new Set(s);
        copy.delete(id);
        return copy;
      });
    }
  };

  const handleWhatsAppInvoice = (order) => {
    const phone = order.shippingAddress?.phone || order.billingAddress?.phone;
    const customerName = order.user?.name || order.shippingAddress?.name || "Customer";

    if (!phone) {
      alert("No phone number found for this customer.");
      return;
    }
    
    const cleanPhone = phone.replace(/\D/g, "");
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    // Items ki list banai
    const itemsList = (order.items || []).map(item => 
      `▪ ${item.qty}x ${item.name} (Rs. ${item.price})`
    ).join("\n");

    // Extra charges add kiye
    let extraCharges = "";
    if (order.shippingCost > 0) extraCharges += `Shipping: Rs. Free`;
    if (order.hasGiftWrap) extraCharges += `Gift Wrap: Rs. 99\n`;
    if (String(order.paymentMethod).toUpperCase() === "COD") extraCharges += `COD Fee: Rs. 59\n`;

    // Tracking details check
    const trackingLink = `${window.location.origin}/track-order?orderId=${order._id}`;
    let trackingText = `*Track Order:* \n🔗 ${trackingLink}`;
    if (order.awbNumber) {
      trackingText = `*Tracking Details:*\nCourier: ${order.courierName || 'Partner'}\nAWB: ${order.awbNumber}\n🔗 ${trackingLink}`;
    }

    // Pura message format kiya
    const rawText = `Hello ${customerName},\n\nThank you for shopping with Cosmopolitan Xccessories! 🛍️\n\nHere is your Order Summary for #${order._id.slice(-6).toUpperCase()}:\n\n*ITEMS:*\n${itemsList}\n\n${extraCharges}*GRAND TOTAL: Rs. ${(order.totalAmount || 0).toLocaleString()}*\n\n------------------------\n${trackingText}\n------------------------\n\nRegards,\nTeam Cosmoxs`;
    
    const encodedText = encodeURIComponent(rawText);
    const url = `https://wa.me/${finalPhone}?text=${encodedText}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmailInvoice = async (orderId, email) => {
    if (!email) {
      alert("No email address found for this customer.");
      return;
    }
    
    const confirmed = window.confirm(`Send invoice via email to ${email}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/email-invoice`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Email API not configured or failed");
      
      alert("Invoice sent successfully via Email! 📧");
    } catch (e) {
      alert("Failed to send email. Please ensure backend email API is configured.");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Order ID</th>
              <th className="border p-3 text-left">Customer</th>
              <th className="border p-3 text-left">Items</th>
              <th className="border p-3 text-left">Amount</th>
              <th className="border p-3 text-left">Status</th>
              <th className="border p-3 text-left">Tracking</th>
              <th className="border p-3 text-left">Date</th>
              <th className="border p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center p-6">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="text-center p-6">No orders found</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id}>
                  <td className="border p-3 font-mono text-xs align-top">
                    <div>#{order._id.slice(-6)}</div>
                    {order.hasGiftWrap && (
                      <div className="mt-2 font-sans">
                        <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-pink-200 whitespace-nowrap">
                          Gift Wrap
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="border p-3">
                    <p className="font-medium">{order.user?.name || "Guest"}</p>
                    <p className="text-gray-500 text-xs">{order.user?.email}</p>
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      <p className="font-semibold">Shipping</p>
                      <p>{order.shippingAddress?.name || "N/A"}</p>
                      <p>{order.shippingAddress?.address || "N/A"}</p>
                      <p>{[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.pincode].filter(Boolean).join(", ") || "N/A"}</p>
                      <p>{order.shippingAddress?.phone || "N/A"}</p>
                      <p className="font-semibold mt-2">Billing</p>
                      <p>{order.billingAddress?.name || "N/A"}</p>
                      <p>{order.billingAddress?.address || "N/A"}</p>
                      <p>{[order.billingAddress?.city, order.billingAddress?.state, order.billingAddress?.pincode].filter(Boolean).join(", ") || "N/A"}</p>
                      <p>{order.billingAddress?.phone || "N/A"}</p>
                    </div>
                  </td>
                  <td className="border p-3">{order.items?.length || 0} items</td>
                  <td className="border p-3 font-semibold">₹{order.totalAmount?.toLocaleString()}</td>
                  <td className="border p-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="border rounded px-2 py-1 text-xs"
                      disabled={updatingIds.has(order._id)}
                    >
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="border p-3 text-xs">
                    {order.awbNumber ? (
                      <div className="space-y-1">
                        <p><span className="text-gray-500">AWB:</span> <span className="font-mono">{order.awbNumber}</span></p>
                        {order.courierName && <p><span className="text-gray-500">Courier:</span> {order.courierName}</p>}
                        {order.currentTrackingStatus && (
                          <p className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-blue-700">
                            {order.currentTrackingStatus}
                          </p>
                        )}
                        <a
                          href={`/track-order?orderId=${order._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[#AEAA9B] hover:underline"
                        >
                          View live tracking →
                        </a>
                      </div>
                    ) : order.shipmozoPushed ? (
                      <div className="space-y-1">
                        <span className="text-amber-600 font-semibold">Awaiting AWB</span>
                        
                        <button
                          type="button"
                          onClick={() => handleFetchAwb(order._id)}
                          disabled={fetchingAwbIds.has(order._id)}
                          className="block mt-1 text-[#1A1A1A] font-semibold hover:text-[#AEAA9B] transition-colors disabled:opacity-50"
                        >
                          {fetchingAwbIds.has(order._id) ? "Fetching..." : "↻ Fetch AWB"}
                        </button>

                        <button
                          type="button"
                          onClick={() => assignAwb(order._id)}
                          className="block text-gray-400 text-[10px] mt-1 hover:underline"
                        >
                          + Assign manually
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-gray-400">Not pushed</span>
                        <button
                          type="button"
                          onClick={() => assignAwb(order._id)}
                          className="block text-[#AEAA9B] hover:underline"
                        >
                          + Assign AWB manually
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="border p-3 text-gray-500 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    })}
                  </td>
                  <td className="border p-3">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(order._id)}
                        className="inline-flex items-center justify-center rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        📄 Download PDF
                      </button>
                      
                      {/* BHT ZAROORI CHANGE: Poora order object bhej diya */}
                      <button
                        type="button"
                        onClick={() => handleWhatsAppInvoice(order)}
                        className="inline-flex items-center justify-center rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        💬 WhatsApp Bill
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleEmailInvoice(order._id, order.user?.email)}
                        className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        📧 Email Bill
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteOrder(order._id)}
                        className="inline-flex items-center justify-center rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 mt-2"
                      >
                        🗑️ Delete Order
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
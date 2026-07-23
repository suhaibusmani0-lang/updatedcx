"use client";

import { useEffect, useState } from "react";

const statusOptions = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Refund"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState(new Set());

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data?.data?.orders || data?.data || []);
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
    // Optimistic UI: apply change locally first
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    setUpdatingIds((s) => new Set(s).add(id));

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, orderId: id }),
      });

      if (!res.ok) {
        // revert on failure
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
              <th className="border p-3 text-left">Date</th>
              <th className="border p-3 text-left">Ship PDF</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center p-6">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-6">No orders found</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id}>
                  <td className="border p-3 font-mono text-xs">#{order._id.slice(-6)}</td>
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
                  <td className="border p-3 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border p-3">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(order._id)}
                        className="inline-flex items-center justify-center rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        Download PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteOrder(order._id)}
                        className="inline-flex items-center justify-center rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Delete Order
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

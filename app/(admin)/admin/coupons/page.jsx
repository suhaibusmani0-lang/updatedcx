"use client";

import { useEffect, useState } from "react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // State for Add Form
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "",
    minOrder: "0",
    expiresAt: "",
    isActive: true,
  });

  // State for Edit Modal
  const [editingCoupon, setEditingCoupon] = useState(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data?.data || []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        couponData: {
          ...form,
          value: parseFloat(form.value),
          minOrder: parseFloat(form.minOrder),
          expiresAt: form.expiresAt || undefined,
        }
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setShowForm(false);
      setForm({ code: "", type: "percent", value: "", minOrder: "0", expiresAt: "", isActive: true });
      fetchCoupons();
    } else {
      alert(data.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/admin/coupons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _id: editingCoupon._id,
        code: editingCoupon.code,
        type: editingCoupon.type,
        value: parseFloat(editingCoupon.value),
        minOrder: parseFloat(editingCoupon.minOrder),
        expiresAt: editingCoupon.expiresAt || undefined,
        isActive: editingCoupon.isActive,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setEditingCoupon(null);
      fetchCoupons();
    } else {
      alert(data.message);
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this coupon?")) return;
    
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCoupons();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert("Something went wrong!");
    }
  };

  const handleEditClick = (coupon) => {
    setEditingCoupon({
      ...coupon,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "",
    });
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-black text-white px-4 py-2 rounded">
          {showForm ? "Cancel" : "Add Coupon"}
        </button>
      </div>

      {/* --- ADD COUPON FORM --- */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Code</label>
            <input required className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-black" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER50" />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Discount Type</label>
            <select className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-black" value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Discount Value</label>
            <input type="number" required min="0" className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-black" value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="e.g. 50" />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Minimum Order (₹)</label>
            <input type="number" min="0" className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-black" value={form.minOrder}
              onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="0" />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Expiry Date (Optional)</label>
            <input type="date" className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-black" value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button type="submit" className="bg-black text-white px-6 py-2 rounded w-full md:w-auto hover:bg-gray-800 transition">Create Coupon</button>
          </div>
        </form>
      )}

      {/* --- COUPONS TABLE --- */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Code</th>
              <th className="border p-3 text-left">Type</th>
              <th className="border p-3 text-left">Value</th>
              <th className="border p-3 text-left">Min Order</th>
              <th className="border p-3 text-left">Used</th>
              <th className="border p-3 text-left">Status</th>
              <th className="border p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center p-6">Loading coupons...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-6 text-gray-500">No coupons found. Click "Add Coupon" to create one.</td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition">
                  <td className="border p-3 font-mono font-semibold text-black">{c.code}</td>
                  <td className="border p-3 capitalize">{c.type}</td>
                  <td className="border p-3 font-medium">{c.type === "percent" ? `${c.value}%` : `₹${c.value}`}</td>
                  <td className="border p-3">₹{c.minOrder}</td>
                  <td className="border p-3">{c.usedCount || 0}</td>
                  <td className="border p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="border p-3">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleEditClick(c)} className="text-blue-600 hover:text-blue-800 font-medium transition">Edit</button>
                      <button onClick={() => deleteCoupon(c._id)} className="text-red-600 hover:text-red-800 font-medium transition">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- EDIT COUPON MODAL --- */}
      {editingCoupon && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Coupon</h2>
              <button onClick={() => setEditingCoupon(null)} className="text-gray-400 hover:text-black text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Code</label>
                <input required className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 font-mono" value={editingCoupon.code}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })} />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Discount Type</label>
                <select className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-black" value={editingCoupon.type}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value })}>
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Discount Value</label>
                <input type="number" required min="0" className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-black" value={editingCoupon.value}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, value: e.target.value })} />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Minimum Order (₹)</label>
                <input type="number" min="0" className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-black" value={editingCoupon.minOrder}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, minOrder: e.target.value })} />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Expiry Date</label>
                <input type="date" className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-black" value={editingCoupon.expiresAt}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, expiresAt: e.target.value })} />
              </div>

              <div className="flex items-center mt-6">
                <label className="flex items-center cursor-pointer gap-2">
                  <input type="checkbox" checked={editingCoupon.isActive}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
                  <span className="text-sm font-medium text-gray-700">Coupon is Active</span>
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setEditingCoupon(null)} className="px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-black text-white hover:bg-gray-800 rounded-lg font-medium transition">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
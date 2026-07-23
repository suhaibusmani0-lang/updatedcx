"use client";

import { useEffect, useState } from "react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "",
    minOrder: "0",
    expiresAt: "",
    isActive: true,
  });

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
        ...form,
        value: parseFloat(form.value),
        minOrder: parseFloat(form.minOrder),
        expiresAt: form.expiresAt || undefined,
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

  const deleteCoupon = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (res.ok) fetchCoupons();
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

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Code</label>
            <input required className="w-full border rounded p-2" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Discount Type</label>
            <select className="w-full border rounded p-2" value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percentage</option>
              <option value="flat">Flat Amount</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Discount Value</label>
            <input type="number" required min="0" className="w-full border rounded p-2" value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Minimum Order (₹)</label>
            <input type="number" min="0" className="w-full border rounded p-2" value={form.minOrder}
              onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Expiry Date</label>
            <input type="date" className="w-full border rounded p-2" value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button type="submit" className="bg-black text-white px-6 py-2 rounded">Create Coupon</button>
          </div>
        </form>
      )}

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
              <th className="border p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center p-6">Loading...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-6">No coupons found</td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c._id}>
                  <td className="border p-3 font-mono font-semibold">{c.code}</td>
                  <td className="border p-3 capitalize">{c.type}</td>
                  <td className="border p-3">{c.type === "percent" ? `${c.value}%` : `₹${c.value}`}</td>
                  <td className="border p-3">₹{c.minOrder}</td>
                  <td className="border p-3">{c.usedCount || 0}</td>
                  <td className="border p-3">
                    <span className={`px-2 py-1 rounded text-xs ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="border p-3">
                    <button onClick={() => deleteCoupon(c._id)} className="text-red-500 text-sm hover:underline">Delete</button>
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

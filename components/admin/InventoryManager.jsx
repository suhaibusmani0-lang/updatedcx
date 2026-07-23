"use client";

import { useState } from "react";
import { Loader2, Package, CheckCircle2, AlertTriangle } from "lucide-react";

export default function InventoryManager({ onComplete }) {
  const [bulkText, setBulkText] = useState("SKU1 10\nSKU2 0");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/products/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulkText }),
      });

      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "Inventory updated successfully." });
        if (onComplete) onComplete();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update inventory" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update inventory" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Package className="h-5 w-5 text-[#C17A56]" />
        <div>
          <h3 className="font-semibold text-[#1A1A1A]">Bulk Inventory Manager</h3>
          <p className="text-sm text-gray-500">Update stock by SKU in bulk.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={8}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C17A56]"
          placeholder="SKU stock\nSKU2 12"
        />
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <AlertTriangle className="h-4 w-4" />
          Use one SKU and stock value per line.
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm text-white hover:bg-[#C17A56] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
          {loading ? "Updating..." : "Update Inventory"}
        </button>
      </form>

      {message && (
        <div className={`mt-3 rounded-lg border p-3 text-sm ${message.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message.text}
          </div>
        </div>
      )}
    </div>
  );
}

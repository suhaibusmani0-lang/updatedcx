"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Download } from "lucide-react";

export default function AdminNewslettersPage() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/newsletters")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setSubscribers(data.data);
      })
      .catch((err) => console.error("Error fetching subscribers:", err))
      .finally(() => setLoading(false));
  }, []);

  // CSV Export Function (Taki saare emails download kar sako)
  const downloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + ["Email", "Subscribed At", ...subscribers.map(s => `${s.email},${new Date(s.createdAt).toLocaleDateString()}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "newsletter_subscribers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Newsletter Subscribers</h1>
          <p className="text-sm text-gray-500">Total Subscribers: {subscribers.length}</p>
        </div>
        {subscribers.length > 0 && (
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-2 rounded-xl text-xs tracking-widest uppercase hover:bg-[#AEAA9B] transition-colors font-semibold"
          >
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="animate-spin text-[#AEAA9B]" />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Mail size={40} className="mx-auto mb-2 opacity-40" />
            <p>No newsletter subscribers found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="py-4 px-6">#</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Subscribed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {subscribers.map((sub, index) => (
                  <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-gray-400">{index + 1}</td>
                    <td className="py-4 px-6 font-medium text-[#1A1A1A]">{sub.email}</td>
                    <td className="py-4 px-6 text-gray-500">
                      {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
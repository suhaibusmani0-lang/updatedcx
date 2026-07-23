"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { RootState } from "@/store/store";
import { ShoppingBag, Users, TrendingUp, Package, ArrowUpRight } from "lucide-react";

interface DashboardStats {
  revenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: string;
  ordersChange: string;
  recentOrders: Array<{
    id: string;
    customer: string;
    product: string;
    amount: string;
    status: string;
    createdAt: Date;
  }>;
}

const statusColor: Record<string, string> = {
  Delivered: "bg-green-100 text-green-700",
  Processing: "bg-blue-100 text-blue-700",
  Shipped: "bg-yellow-100 text-yellow-700",
  Pending: "bg-gray-100 text-gray-600",
  Cancelled: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const auth = useSelector((s: RootState) => s.authStore.auth) as any;
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) router.push("/auth/login");
    else if (auth.role !== "admin") router.push("/my-account");
  }, [auth, router]);

  useEffect(() => {
    if (auth?.role === "admin") {
      fetchStats();
    }
  }, [auth]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!auth || auth.role !== "admin") return null;

  const statsData = stats || {
    revenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenueChange: "0",
    ordersChange: "0",
    recentOrders: [],
  };

  const displayStats = [
    { 
      label: "Total Revenue", 
      value: `₹${statsData.revenue.toLocaleString()}`, 
      change: `${statsData.revenueChange}%`, 
      icon: TrendingUp, 
      color: "bg-[#C17A56]/10 text-[#C17A56]" 
    },
    { 
      label: "Total Orders", 
      value: statsData.totalOrders.toLocaleString(), 
      change: `${statsData.ordersChange}%`, 
      icon: ShoppingBag, 
      color: "bg-blue-50 text-blue-600" 
    },
    { 
      label: "Total Customers", 
      value: statsData.totalCustomers.toLocaleString(), 
      change: "+5.1%", 
      icon: Users, 
      color: "bg-green-50 text-green-600" 
    },
    { 
      label: "Total Products", 
      value: statsData.totalProducts.toLocaleString(), 
      change: "+2.4%", 
      icon: Package, 
      color: "bg-purple-50 text-purple-600" 
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {auth.name?.split(" ")[0]} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Here's what's happening with your store today.</p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {displayStats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm text-gray-500 font-medium">{s.label}</span>
                <div className={`p-2 rounded-lg ${s.color}`}>
                  <s.icon size={16} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{s.value}</p>
              <p className={`text-xs font-medium mt-1 flex items-center gap-0.5 ${
                parseFloat(s.change) >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                {parseFloat(s.change) >= 0 ? <ArrowUpRight size={12} /> : null} {s.change} this month
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <button onClick={() => router.push("/admin/orders")} className="text-xs text-[#C17A56] hover:underline tracking-wide">View all</button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : statsData.recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {["Order ID", "Customer", "Product", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {statsData.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{o.id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{o.customer}</td>
                    <td className="px-5 py-3.5 text-gray-600">{o.product}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{o.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold tracking-wide ${statusColor[o.status] || statusColor.Pending}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Logged in user info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Session Info</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {[
            { label: "Name", value: auth.name },
            { label: "Email", value: auth.email },
            { label: "Role", value: auth.role },
            { label: "Verified", value: auth.isEmailVerified ? "✅ Yes" : "❌ No" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
              <p className="font-medium text-gray-900 capitalize truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

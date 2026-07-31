"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { RootState } from "@/store/store";
import { ShoppingBag, Users, TrendingUp, Package, ArrowUpRight, Mail } from "lucide-react";

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

// Premium pill styling for status
const statusColor: Record<string, string> = {
  Delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  Processing: "bg-blue-50 text-blue-700 border border-blue-200/60",
  Shipped: "bg-amber-50 text-amber-700 border border-amber-200/60",
  Pending: "bg-slate-50 text-slate-600 border border-slate-200/60",
  Cancelled: "bg-rose-50 text-rose-700 border border-rose-200/60",
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
      color: "bg-[#AEAA9B]/15 text-[#8B6F52]" 
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
      color: "bg-emerald-50 text-emerald-600" 
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
    <div className="min-h-screen bg-[#FAF7F2]/40 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Welcome back, {auth.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-[#8B6F52] mt-1.5 font-medium">
            Here's what's happening with your store today.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/newsletters")}
          className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white px-5 py-2.5 rounded-xl text-xs tracking-widest uppercase hover:bg-[#AEAA9B] hover:shadow-[0_8px_20px_rgba(174,170,155,0.4)] transition-all duration-300 font-semibold shadow-md sm:w-auto w-full"
        >
          <Mail size={16} /> View Subscribers
        </button>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-5 sm:p-6 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="h-4 bg-gray-100 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayStats.map((s) => (
            <div 
              key={s.label} 
              className="group bg-white rounded-2xl border border-gray-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 p-5 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs sm:text-sm text-[#8B6F52] font-semibold tracking-wide uppercase">{s.label}</span>
                <div className={`p-2.5 rounded-xl transition-colors duration-300 ${s.color}`}>
                  <s.icon size={18} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">{s.value}</p>
              <p className={`text-xs font-semibold mt-2.5 flex items-center gap-1 ${
                parseFloat(s.change) >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}>
                {parseFloat(s.change) >= 0 ? <ArrowUpRight size={14} strokeWidth={2.5} /> : null} 
                {s.change} <span className="text-gray-400 font-medium">this month</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <h2 className="font-bold text-lg text-[#1A1A1A]">Recent Orders</h2>
          <button 
            onClick={() => router.push("/admin/orders")} 
            className="text-xs font-semibold text-[#AEAA9B] hover:text-[#1A1A1A] hover:underline tracking-widest uppercase transition-colors"
          >
            View all
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-[#8B6F52] text-sm animate-pulse">Fetching recent orders...</div>
          ) : statsData.recentOrders.length === 0 ? (
            <div className="p-10 text-center text-[#8B6F52] text-sm">No recent orders to show</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-[#FAF7F2]/50 text-[11px] text-[#8B6F52] uppercase tracking-widest font-bold">
                <tr>
                  {["Order ID", "Customer", "Product", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-6 py-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {statsData.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF7F2]/30 transition-colors duration-200 group">
                    <td className="px-6 py-4 text-[#AEAA9B] font-mono text-xs whitespace-nowrap">#{o.id.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4 font-semibold text-[#1A1A1A] whitespace-nowrap">{o.customer}</td>
                    <td className="px-6 py-4 text-[#8B6F52] truncate max-w-[200px]">{o.product}</td>
                    <td className="px-6 py-4 font-bold text-[#1A1A1A] whitespace-nowrap">{o.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center text-[10px] px-3 py-1.5 rounded-full font-bold tracking-widest uppercase ${statusColor[o.status] || statusColor.Pending}`}>
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

      {/* Session Info (Logged in user) */}
      <div className="bg-white rounded-2xl border border-gray-100/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6">
        <h2 className="font-bold text-[#1A1A1A] mb-5">Admin Session Info</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: "Name", value: auth.name },
            { label: "Email", value: auth.email },
            { label: "Access Level", value: auth.role },
            { label: "Status", value: auth.isEmailVerified ? "Verified User" : "Unverified" },
          ].map((item) => (
            <div key={item.label} className="bg-[#FAF7F2]/50 p-4 rounded-xl border border-gray-50">
              <p className="text-[10px] text-[#8B6F52] uppercase tracking-widest font-bold mb-1.5">{item.label}</p>
              <p className="font-bold text-[#1A1A1A] truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
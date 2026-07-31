// app/admin/notify-requests/page.tsx
import { connectDB } from "@/lib/databaseConnection";
import NotifyRequestModel from "@/models/NotifyRequest.model";
import { Bell, Clock, Package } from "lucide-react";

// Ye line ensure karegi ki page hamesha fresh data dikhaye (cache na ho)
export const dynamic = "force-dynamic";

export default async function NotifyRequestsAdminPage() {
  // Database se connect karo
  await connectDB();

  const requests = await NotifyRequestModel.find()
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] flex items-center gap-3">
              <Bell className="text-[#C1121F]" size={28} />
              Out of Stock Requests
            </h1>
            <p className="text-gray-500 mt-2">
              Manage customers who want to be notified when products are back in stock.
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
            <Package size={20} className="text-gray-400" />
            <span className="font-semibold text-[#1A1A1A]">{requests.length}</span>
            <span className="text-gray-500 text-sm">Total Requests</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Product Name</th>
                  <th className="p-4 font-medium">Customer Details</th>
                  <th className="p-4 font-medium">Contact</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.length > 0 ? (
                  requests.map((request: any) => (
                    <tr key={request._id.toString()} className="hover:bg-gray-50 transition-colors">
                      {/* Date Column */}
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(request.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      
                      {/* Product Name Column */}
                      <td className="p-4">
                        <div className="font-medium text-[#1A1A1A]">
                          {request.productName}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          ID: {request.productId.toString().slice(-6)} {/* Short ID for reference */}
                        </div>
                      </td>
                      
                      {/* Customer Name Column */}
                      <td className="p-4 text-sm font-medium text-gray-800">
                        {request.userName}
                      </td>
                      
                      {/* Contact Details Column */}
                      <td className="p-4 text-sm text-blue-600">
                        {request.contactDetails}
                      </td>
                      
                      {/* Status Column */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock size={12} />
                          {request.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No notify requests found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
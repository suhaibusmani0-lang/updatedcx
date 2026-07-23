"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { User, ShoppingBag, MapPin, Settings, LogOut, Package, Heart, CreditCard, ChevronRight, Edit2, Check } from "lucide-react";
import { logout } from "@/store/reducer/authReducer";
import { persistor } from "@/store/store";
import { showToast } from "@/lib/showToast";

export default function MyAccount() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addressForm, setAddressForm] = useState({
    type: "Home",
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const searchParams = useSearchParams();
  const orderIdFromQuery = searchParams.get("orderId");

  // --- PASSWORD CHANGE STATES ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: "", text: "" });
  // ------------------------------

  const dispatch = useDispatch();
  const auth = useSelector((s) => s.authStore.auth);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      router.push("/auth/login");
      return;
    }
    if (orderIdFromQuery) {
      setActiveTab("orders");
    }
    fetchData();
    let pollId = null;
    if (activeTab === "orders") {
      pollId = setInterval(() => {
        fetchData();
      }, 8000);
    }
    return () => {
      if (pollId) clearInterval(pollId);
    };
  }, [activeTab, auth, router, orderIdFromQuery]);

  const fetchData = async () => {
    if (!auth) return;
    try {
      setLoading(true);

      if (activeTab === "orders") {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          let orderList = data.data || [];
          if (orderIdFromQuery) {
            orderList = orderList.filter((order) => order._id === orderIdFromQuery);
          }
          setOrders(orderList);
        }
      } else if (activeTab === "addresses") {
        const res = await fetch("/api/user/addresses");
        if (res.ok) {
          const data = await res.json();
          setAddresses(data.data || []);
        }
      } else if (activeTab === "wishlist") {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          setWishlist(data.data?.items || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    dispatch(logout());
    await persistor.purge();
    window.location.href = "/";
  };

  const handleRemoveFromWishlist = async (productId) => {
    if (!auth) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Failed to remove from wishlist:", data.message || res.statusText);
        return;
      }

      setWishlist(data.data?.items || wishlist.filter((item) => item.product?._id !== productId));
    } catch (error) {
      console.error("Error removing wishlist item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address._id);
    setAddressForm({
      type: address.type || "Home",
      name: address.name || "",
      phone: address.phone || "",
      address: address.address || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      isDefault: address.isDefault || false,
    });
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm({
      type: "Home",
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
  };

  const handleSaveAddress = async () => {
    if (!auth) return;
    const { type, name, phone, address, city, state, pincode, isDefault } = addressForm;
    if (!name || !phone || !address || !city || !state || !pincode) {
      showToast("error", "All address fields are required");
      return;
    }

    try {
      setLoading(true);
      const method = editingAddressId ? "PUT" : "POST";
      const body = editingAddressId
        ? { addressId: editingAddressId, type, name, phone, address, city, state, pincode, isDefault }
        : { type, name, phone, address, city, state, pincode, isDefault };
      const res = await fetch("/api/user/addresses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.message || "Unable to save address");
        return;
      }
      showToast("success", editingAddressId ? "Address updated" : "Address added");
      setAddresses(data.data || []);
      resetAddressForm();
    } catch (error) {
      console.error("Address save error:", error);
      showToast("error", "Unable to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!auth || !addressId) return;
    if (!confirm("Delete this address?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/user/addresses?id=${addressId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.message || "Failed to delete address");
        return;
      }
      showToast("success", "Address deleted");
      setAddresses(data.data || []);
      if (editingAddressId === addressId) resetAddressForm();
    } catch (error) {
      console.error("Delete address error:", error);
      showToast("error", "Failed to delete address");
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (order) => {
    if (!auth) return;
    try {
      setLoading(true);
      let hasError = false;
      for (const item of order.items || []) {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: item.product, qty: item.qty || 1 }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          hasError = true;
          showToast("error", result.message || `Unable to add ${item.name} to cart`);
          break;
        }
      }
      if (!hasError) {
        showToast("success", "Order items added to cart successfully.");
        router.push("/cart");
      }
    } catch (error) {
      console.error("Reorder failed:", error);
      showToast("error", error.message || "Failed to reorder items");
    } finally {
      setLoading(false);
    }
  };

  // --- PASSWORD UPDATE HANDLER ---
  const handleUpdatePassword = async () => {
    setPassMessage({ type: "", text: "" }); 
    
    if (!currentPassword || !newPassword) {
      setPassMessage({ type: "error", text: "Please fill both password fields." });
      return;
    }
    
    if (newPassword.length < 6) {
      setPassMessage({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    try {
      setPassLoading(true);
      const res = await fetch("/api/user/change-password", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: auth?.email, // Backend ko email bhejna zaroori hai
          currentPassword, 
          newPassword 
        }),
      });
      
      const data = await res.json();

      if (res.ok) {
        setPassMessage({ type: "success", text: "Password updated successfully!" });
        setCurrentPassword(""); 
        setNewPassword("");
      } else {
        setPassMessage({ type: "error", text: data.message || "Failed to update password." });
      }
    } catch (error) {
      setPassMessage({ type: "error", text: "Something went wrong. Please try again." });
      console.error("Password update error:", error);
    } finally {
      setPassLoading(false);
    }
  };
  // -------------------------------

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4 sm:px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-wide">My Account</h1>
          <p className="text-[#1A1A1A]/60 mt-2">Welcome back, {auth?.name || "User"}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
              {/* User Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#C17A56] flex items-center justify-center text-white font-bold text-lg">
                  {auth?.name?.[0] || "U"}
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A1A]">{auth?.name || "User"}</p>
                  <p className="text-xs text-[#1A1A1A]/60">{auth?.email || "user@example.com"}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? "bg-[#C17A56] text-white"
                          : "text-[#1A1A1A]/70 hover:bg-gray-50 hover:text-[#1A1A1A]"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium tracking-wide">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-xl text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium tracking-wide">Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">Profile Information</h2>
                  <button className="flex items-center gap-2 text-[#C17A56] hover:text-[#A06245] transition-colors">
                    <Edit2 size={16} />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A]/60 mb-2">Full Name</label>
                    <p className="text-[#1A1A1A] font-medium">{auth?.name || "John Doe"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A]/60 mb-2">Email Address</label>
                    <p className="text-[#1A1A1A] font-medium">{auth?.email || "john@example.com"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A]/60 mb-2">Phone Number</label>
                    <p className="text-[#1A1A1A] font-medium">{auth?.phone || "+91 98765 43210"}</p>
                  </div>
                </div>

                {/* Password Change Section (UPDATED) */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A]/60 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#C17A56] focus:ring-2 focus:ring-[#C17A56]/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A]/60 mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#C17A56] focus:ring-2 focus:ring-[#C17A56]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {passMessage.text && (
                    <p className={`mt-3 text-sm font-medium ${passMessage.type === "error" ? "text-red-500" : "text-green-600"}`}>
                      {passMessage.text}
                    </p>
                  )}

                  <button 
                    onClick={handleUpdatePassword}
                    disabled={passLoading}
                    className={`mt-4 px-6 py-3 rounded-xl font-medium transition-colors ${
                      passLoading 
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                      : "bg-[#C17A56] text-white hover:bg-[#A06245]"
                    }`}
                  >
                    {passLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-6">Order History</h2>

                {loading ? (
                  <div className="text-center py-8 text-[#1A1A1A]/60">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-[#1A1A1A]/60">No orders found</div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border border-gray-100 rounded-xl p-4 hover:border-[#C17A56]/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                              <Package size={20} className="text-[#C17A56]" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#1A1A1A]">ORD-{order._id.slice(-6)}</p>
                              <p className="text-sm text-[#1A1A1A]/60">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="font-semibold text-[#1A1A1A]">₹{order.totalAmount.toLocaleString()}</p>
                              <p className="text-sm text-[#1A1A1A]/60">{order.items.length} items</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === "Delivered" ? "bg-green-100 text-green-700" :
                                order.status === "Shipped" ? "bg-blue-100 text-blue-700" :
                                order.status === "Processing" ? "bg-yellow-100 text-yellow-700" :
                                order.status === "Refund" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {order.status}
                              </span>
                              <ChevronRight size={16} className="text-[#1A1A1A]/40" />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 mt-3">
                          <a
                            href={`/track-order?orderId=${order._id}`}
                            className="px-4 py-2 border border-[#C17A56] text-[#C17A56] rounded-xl text-sm font-medium hover:bg-[#C17A56] hover:text-white transition-colors inline-flex items-center gap-1.5"
                            data-testid={`track-order-btn-${order._id}`}
                          >
                            <Package size={14} />
                            Track Order
                          </a>
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="px-4 py-2 bg-[#C17A56] text-white rounded-xl text-sm font-medium hover:bg-[#A06245] transition-colors"
                          >
                            Reorder
                          </button>
                        </div>

                        <div className="space-y-3">
                          {order.items?.map((item) => (
                            <div key={`${order._id}-${item.product || item.name}`} className="flex items-center gap-4 p-3 rounded-2xl bg-[#FAF7F2]">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200">
                                <img
                                  src={item.image || "/assets/images/placeholder.png"}
                                  alt={item.name || "Product Image"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#1A1A1A] truncate">{item.name || "Product"}</p>
                                <p className="text-sm text-[#1A1A1A]/60">Qty: {item.qty || 1}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-[#1A1A1A]">₹{(item.price || 0).toLocaleString()}</p>
                                <p className="text-xs text-[#1A1A1A]/60">Subtotal: ₹{((item.price || 0) * (item.qty || 1)).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}

                          <div className="grid grid-cols-2 gap-4 text-sm text-[#1A1A1A]/70">
                            <div className="rounded-2xl bg-[#F7F5F1] p-4">
                              <p className="font-medium text-[#1A1A1A]">Shipping</p>
                              <p>₹{(order.shippingCost || 0).toLocaleString()}</p>
                            </div>
                            <div className="rounded-2xl bg-[#F7F5F1] p-4">
                              <p className="font-medium text-[#1A1A1A]">Payment Method</p>
                              <p>{order.paymentMethod || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-[#1A1A1A]">Saved Addresses</h2>
                    <p className="text-sm text-[#1A1A1A]/60">Manage shipping and billing addresses stored in your profile.</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetAddressForm}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C17A56] text-white rounded-xl font-medium hover:bg-[#A06245] transition-colors"
                  >
                    <MapPin size={16} />
                    <span className="text-sm">Add New Address</span>
                  </button>
                </div>

                <div className="grid gap-4 mb-6">
                  <div className="bg-[#FAF7F2] rounded-2xl p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-[#1A1A1A]">Address Type</span>
                        <select
                          value={addressForm.type}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, type: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white"
                        >
                          <option>Home</option>
                          <option>Office</option>
                          <option>Shipping</option>
                          <option>Billing</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-[#1A1A1A]">Name</span>
                        <input
                          value={addressForm.name}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                          placeholder="Full name"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-[#1A1A1A]">Phone</span>
                        <input
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                          placeholder="Phone number"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-[#1A1A1A]">Pincode</span>
                        <input
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, pincode: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                          placeholder="Pin code"
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="text-sm font-medium text-[#1A1A1A]">Address</span>
                        <textarea
                          value={addressForm.address}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                          rows={3}
                          placeholder="Street address"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-[#1A1A1A]">City</span>
                        <input
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3"
                          placeholder="City"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-[#1A1A1A]">State</span>
                        <select
                          value={addressForm.state}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 bg-white"
                        >
                          <option value="">Select State</option>
                          <option>Andhra Pradesh</option>
                          <option>Arunachal Pradesh</option>
                          <option>Assam</option>
                          <option>Bihar</option>
                          <option>Chhattisgarh</option>
                          <option>Goa</option>
                          <option>Gujarat</option>
                          <option>Haryana</option>
                          <option>Himachal Pradesh</option>
                          <option>Jharkhand</option>
                          <option>Karnataka</option>
                          <option>Kerala</option>
                          <option>Madhya Pradesh</option>
                          <option>Maharashtra</option>
                          <option>Manipur</option>
                          <option>Meghalaya</option>
                          <option>Mizoram</option>
                          <option>Nagaland</option>
                          <option>Odisha</option>
                          <option>Punjab</option>
                          <option>Rajasthan</option>
                          <option>Sikkim</option>
                          <option>Tamil Nadu</option>
                          <option>Telangana</option>
                          <option>Tripura</option>
                          <option>Uttar Pradesh</option>
                          <option>Uttarakhand</option>
                          <option>West Bengal</option>
                          <option>Andaman and Nicobar Islands</option>
                          <option>Chandigarh</option>
                          <option>Dadra and Nagar Haveli and Daman and Diu</option>
                          <option>Delhi</option>
                          <option>Jammu and Kashmir</option>
                          <option>Ladakh</option>
                          <option>Lakshadweep</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-3 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                          className="accent-[#C17A56]"
                        />
                        <span className="text-sm text-[#1A1A1A]">Set as default address</span>
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveAddress}
                        className="px-5 py-3 bg-[#C17A56] text-white rounded-xl font-medium hover:bg-[#A06245] transition-colors"
                      >
                        {editingAddressId ? "Update Address" : "Save Address"}
                      </button>
                      {editingAddressId && (
                        <button
                          type="button"
                          onClick={resetAddressForm}
                          className="px-5 py-3 border border-gray-200 rounded-xl font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-8 text-[#1A1A1A]/60">No addresses saved</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address, idx) => (
                      <div key={idx} className="border border-gray-100 rounded-xl p-4 hover:border-[#C17A56]/30 transition-colors">
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div>
                            <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-[#1A1A1A]">{address.type}</span>
                            {address.isDefault && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#E6F5EA] px-2 py-1 text-xs font-medium text-[#1A7F39]">
                                <Check size={12} />
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditAddress(address)}
                              className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#1A1A1A] hover:border-[#C17A56] hover:text-[#C17A56] transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(address._id)}
                              className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="font-medium text-[#1A1A1A]">{address.name}</p>
                        <p className="text-sm text-[#1A1A1A]/70 mt-1">{address.address}</p>
                        <p className="text-sm text-[#1A1A1A]/70">{address.city}, {address.state} - {address.pincode}</p>
                        <p className="text-sm text-[#1A1A1A]/70 mt-1">{address.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "wishlist" && (
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-6">My Wishlist</h2>

                {loading ? (
                  <div className="text-center py-8 text-[#1A1A1A]/60">Loading wishlist...</div>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-8 text-[#1A1A1A]/60">Your wishlist is empty</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.map((item) => (
                      <div key={item._id} className="border border-gray-100 rounded-xl overflow-hidden hover:border-[#C17A56]/30 transition-colors group">
                        <div className="relative aspect-square bg-gray-50">
                          {item.product?.images?.[0]?.url ? (
                            <img
                              src={item.product.images[0].url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#1A1A1A]/20">
                              <Package size={48} />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveFromWishlist(item.product?._id)}
                            className="absolute top-3 right-3 rounded-full bg-white p-2 shadow-sm text-[#1A1A1A] hover:bg-[#C17A56] hover:text-white transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-[#1A1A1A] text-sm">{item.product?.name || "Product"}</h3>
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-semibold text-[#C17A56]">
                              ₹{(item.product?.salePrice || item.product?.price || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-6">Account Settings</h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                        <CreditCard size={20} className="text-[#C17A56]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">Payment Methods</p>
                        <p className="text-sm text-[#1A1A1A]/60">Manage your saved cards</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-[#1A1A1A]/40" />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                        <MapPin size={20} className="text-[#C17A56]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">Shipping Preferences</p>
                        <p className="text-sm text-[#1A1A1A]/60">Default shipping address</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-[#1A1A1A]/40" />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                        <Settings size={20} className="text-[#C17A56]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">Notification Settings</p>
                        <p className="text-sm text-[#1A1A1A]/60">Email and push notifications</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-[#1A1A1A]/40" />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                        <User size={20} className="text-[#C17A56]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">Privacy Settings</p>
                        <p className="text-sm text-[#1A1A1A]/60">Data and privacy controls</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-[#1A1A1A]/40" />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Danger Zone</h3>
                  <button className="px-6 py-3 border border-red-200 text-red-500 rounded-xl font-medium hover:bg-red-50 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RootState } from "@/store/store";
import { clearCart, removeFromCart, updateQty } from "@/store/reducer/cartReducer";
import { formatPrice } from "@/lib/data";
import { ShoppingBag, Tag, ChevronRight, Truck, Shield } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required").max(13),
  email: z.string().email("Valid email required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits").regex(/^\d+$/, "Digits only"),
  paymentMethod: z.enum(["COD", "Razorpay"]),
  useSameBillingAddress: z.boolean(),
  billingName: z.string().optional(),
  billingPhone: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPincode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const INDIAN_STATES = ["Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const items = useSelector((s: RootState) => s.cart.items);
  const auth = useSelector((s: RootState) => s.authStore.auth) as any;

  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shipping, setShipping] = useState(0);
  const [shippingMeta, setShippingMeta] = useState<{ courierName?: string; shippingMethod?: string } | null>(null);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: auth?.name || "",
      email: auth?.email || "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      paymentMethod: "Razorpay",
      useSameBillingAddress: true,
      billingName: "",
      billingPhone: "",
      billingAddress: "",
      billingCity: "",
      billingState: "",
      billingPincode: "",
    },
  });

  const pincode = form.watch("pincode");
  const paymentMethod = form.watch("paymentMethod");
  const useSameBillingAddress = form.watch("useSameBillingAddress");
  const paymentDiscount = paymentMethod === "Razorpay" ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + shipping - discount - paymentDiscount;

  useEffect(() => {
    if (useSameBillingAddress) {
      form.setValue("billingName", form.getValues("name"));
      form.setValue("billingPhone", form.getValues("phone"));
      form.setValue("billingAddress", form.getValues("address"));
      form.setValue("billingCity", form.getValues("city"));
      form.setValue("billingState", form.getValues("state"));
      form.setValue("billingPincode", form.getValues("pincode"));
    }
  }, [useSameBillingAddress, form.watch("name"), form.watch("phone"), form.watch("address"), form.watch("city"), form.watch("state"), form.watch("pincode")]);

  useEffect(() => {
    const fallbackShipping = subtotal >= 2999 ? 0 : 99;
    setShipping(fallbackShipping);
    setShippingMeta(null);
  }, [subtotal]);

  useEffect(() => {
    if (!pincode || pincode.length !== 6 || !items.length) {
      setShipping(subtotal >= 2999 ? 0 : 99);
      setShippingMeta(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pincode, items }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!controller.signal.aborted && data.ok && typeof data.data?.shippingCharge === "number") {
          setShipping(data.data.shippingCharge);
          setShippingMeta({ courierName: data.data.courierName, shippingMethod: data.data.shippingMethod });
        } else {
          setShipping(subtotal >= 2999 ? 0 : 99);
          setShippingMeta(null);
        }
      } catch {
        setShipping(subtotal >= 2999 ? 0 : 99);
        setShippingMeta(null);
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [items, pincode, subtotal]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch("/api/coupon-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const data = await res.json();
      setCouponMsg({ text: data.message, ok: data.ok });
      if (data.ok) setDiscount(data.data.discount);
      else setDiscount(0);
    } catch (error) {
      setCouponMsg({ text: "Invalid coupon code", ok: false });
      setDiscount(0);
    }
  };

  const loadRazorpayScript = () => new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("Browser only"));
    if ((window as any).Razorpay) return resolve();

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay"));
    document.body.appendChild(script);
  });

  // --- NEW SHIPMOZO SYNC HELPER FUNCTION ---
  const syncOrderToShipMozo = async (orderId: string, currentFormData: FormData, totalAmount: number) => {
    try {
      const payload = {
        orderId: String(orderId),
        customerName: currentFormData.name,
        email: currentFormData.email || "",
        address: currentFormData.address,
        city: currentFormData.city,
        state: currentFormData.state,
        pincode: currentFormData.pincode,
        phone: currentFormData.phone,
        paymentMethod: currentFormData.paymentMethod === "Razorpay" ? "Prepaid" : "COD",
        totalAmount: totalAmount,
        items: items.map((item) => ({
          name: item.name,
          id: String(item.id),
          qty: item.qty,
          price: item.price,
          category: item.category || "Other",
          sku: String(item.id),
          units: item.qty,
          selling_price: item.price,
        })),
      };

      await fetch("/api/shipmozo/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      console.log("Order synced to ShipMozo successfully");
    } catch (error) {
      console.error("Failed to sync with ShipMozo:", error);
    }
  };
  // ------------------------------------------

  const handleSubmit = async (formData: FormData) => {
    if (!auth) { router.push(`/auth/login?callback=/checkout`); return; }
    if (!items.length) { setError("Your cart is empty"); return; }

    setLoading(true);
    setError("");

    try {
      const shippingAddress = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      };

      const billingAddress = formData.useSameBillingAddress
        ? shippingAddress
        : {
            name: formData.billingName?.trim() || formData.name,
            phone: formData.billingPhone?.trim() || formData.phone,
            address: formData.billingAddress?.trim() || formData.address,
            city: formData.billingCity?.trim() || formData.city,
            state: formData.billingState?.trim() || formData.state,
            pincode: formData.billingPincode?.trim() || formData.pincode,
          };

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          shippingAddress,
          billingAddress,
          couponCode: couponCode || undefined,
          paymentMethod: formData.paymentMethod,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || "Unable to create order");

      if (formData.paymentMethod === "COD") {
        // CALLING SHIPMOZO SYNC FOR COD
        await syncOrderToShipMozo(orderData.data.orderId, formData, total);

        dispatch(clearCart());
        router.push(`/checkout/success?orderId=${orderData.data.orderId}`);
        setLoading(false);
        return;
      }

      await loadRazorpayScript();

      const paymentRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.data.orderId, amount: orderData.data.totalAmount }),
      });
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) throw new Error(paymentData.message || "Unable to initialize payment");

      const options = {
        key: paymentData.data.key,
        amount: paymentData.data.amount,
        currency: paymentData.data.currency,
        name: "Ecommerce",
        description: `Order #${String(orderData.data.orderId).slice(-6).toUpperCase()}`,
        order_id: paymentData.data.razorpayOrderId,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#C17A56" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderData.data.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed");

            // CALLING SHIPMOZO SYNC FOR RAZORPAY PREPAID
            await syncOrderToShipMozo(orderData.data.orderId, formData, total);

            dispatch(clearCart());
            router.push(`/checkout/success?orderId=${orderData.data.orderId}`);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Payment verification failed");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled. You can try again.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <ShoppingBag size={48} className="text-[#E3D9C9]" />
        <p className="text-[#8B6F52] text-sm">Your cart is empty</p>
        <Link href="/" className="text-xs tracking-widest uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#C17A56] hover:border-[#C17A56] transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 sm:py-12">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-xs text-[#8B6F52] mb-3">
            <Link href="/" className="hover:text-[#1A1A1A]">Home</Link>
            <ChevronRight size={12} />
            <Link href="/" className="hover:text-[#1A1A1A]">Cart</Link>
            <ChevronRight size={12} />
            <span className="text-[#1A1A1A]">Checkout</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1A1A1A]">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          {/* Left — Shipping Form */}
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-[#E3D9C9] p-5 sm:p-6">
              <h2 className="text-sm tracking-widest uppercase font-semibold text-[#1A1A1A] mb-5">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" error={form.formState.errors.name?.message}>
                  <input {...form.register("name")} placeholder="Aryan Sharma" className={input()} />
                </Field>
                <Field label="Phone Number" error={form.formState.errors.phone?.message}>
                  <input {...form.register("phone")} placeholder="+91 98765 43210" className={input()} />
                </Field>
                <Field label="Email Address" error={form.formState.errors.email?.message} className="sm:col-span-2">
                  <input {...form.register("email")} placeholder="you@example.com" className={input()} />
                </Field>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl border border-[#E3D9C9] p-5 sm:p-6">
              <h2 className="text-sm tracking-widest uppercase font-semibold text-[#1A1A1A] mb-5">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Street Address" error={form.formState.errors.address?.message} className="sm:col-span-2">
                  <input {...form.register("address")} placeholder="123, Street Name, Area" className={input()} />
                </Field>
                <Field label="City" error={form.formState.errors.city?.message}>
                  <input {...form.register("city")} placeholder="Mumbai" className={input()} />
                </Field>
                <Field label="State" error={form.formState.errors.state?.message}>
                  <select {...form.register("state")} className={input()}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Pincode" error={form.formState.errors.pincode?.message}>
                  <input {...form.register("pincode")} placeholder="400001" maxLength={6} className={input()} />
                </Field>
              </div>
            </div>
            {/* Billing Address */}
            <div className="bg-white rounded-2xl border border-[#E3D9C9] p-5 sm:p-6 mt-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm tracking-widest uppercase font-semibold text-[#1A1A1A]">Billing Address</h2>
                <label className="flex items-center gap-2 text-sm text-[#8B6F52]">
                  <input type="checkbox" className="accent-[#C17A56]" {...form.register("useSameBillingAddress")} />
                  <span>Same as shipping</span>
                </label>
              </div>

              {!useSameBillingAddress && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" className="sm:col-span-2">
                    <input {...form.register("billingName")} placeholder="Aarav Sharma" className={input()} />
                  </Field>
                  <Field label="Phone Number">
                    <input {...form.register("billingPhone")} placeholder="+91 98765 43210" className={input()} />
                  </Field>
                  <Field label="Street Address" className="sm:col-span-2">
                    <input {...form.register("billingAddress")} placeholder="123, Street Name, Area" className={input()} />
                  </Field>
                  <Field label="City">
                    <input {...form.register("billingCity")} placeholder="Mumbai" className={input()} />
                  </Field>
                  <Field label="State">
                    <select {...form.register("billingState")} className={input()}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Pincode">
                    <input {...form.register("billingPincode")} placeholder="400001" maxLength={6} className={input()} />
                  </Field>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-[#E3D9C9] p-5 sm:p-6">
              <h2 className="text-sm tracking-widest uppercase font-semibold text-[#1A1A1A] mb-5">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-start gap-3 rounded-xl border border-[#E3D9C9] bg-[#F8F3EA] p-4 cursor-pointer">
                  <input type="radio" value="COD" className="accent-[#C17A56] mt-1" {...form.register("paymentMethod")} />
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">Cash on Delivery</p>
                    <p className="text-xs text-[#8B6F52]">Pay on delivery at the original price.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 rounded-xl border border-[#E3D9C9] bg-[#F8F3EA] p-4 cursor-pointer">
                  <input type="radio" value="Razorpay" className="accent-[#C17A56] mt-1" {...form.register("paymentMethod")} />
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">Pay with Razorpay</p>
                    <p className="text-xs text-[#8B6F52]">Get 10% off your cart total with online payment.</p>
                  </div>
                </label>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] text-white text-xs tracking-widest uppercase py-4 rounded-xl hover:bg-[#C17A56] transition-colors disabled:opacity-60 font-semibold"
            >
              {loading ? "Processing Payment…" : `Pay & Place Order · ${formatPrice(total)}`}
            </button>

            {!auth && (
              <p className="text-center text-xs text-[#8B6F52]">
                You need to{" "}
                <Link href="/auth/login?callback=/checkout" className="text-[#C17A56] underline">login</Link>
                {" "}to place an order.
              </p>
            )}
          </form>

          {/* Right — Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E3D9C9] p-5">
              <h2 className="text-sm tracking-widest uppercase font-semibold text-[#1A1A1A] mb-5">
                Order Summary ({items.reduce((s, i) => s + i.qty, 0)} items)
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-4 rounded-xl border border-[#E3D9C9] bg-[#F8F3EA] p-3 text-sm text-[#8B6F52]">
                {paymentMethod === "Razorpay" ? (
                  <p>Razorpay checkout gets a 10% discount on the cart subtotal.</p>
                ) : (
                  <p>Cash on delivery keeps the original price with no discount.</p>
                )}
              </div>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative shrink-0">
                      <img src={item.image} alt={item.name} className="w-14 h-18 object-cover rounded-lg bg-[#F1EBE1]" style={{ height: 72 }} />
                      <span className="absolute -top-1.5 -right-1.5 bg-[#1A1A1A] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{item.qty}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#8B6F52] uppercase tracking-widest">{item.category}</p>
                      <p className="text-sm font-medium text-[#1A1A1A] line-clamp-1">{item.name}</p>
                      <p className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{formatPrice(item.price * item.qty)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.qty <= 1) {
                              dispatch(removeFromCart(item.id));
                              return;
                            }
                            dispatch(updateQty({ id: item.id, qty: item.qty - 1 }));
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E3D9C9] text-[#1A1A1A] hover:bg-[#F1EBE1]"
                          aria-label={`Decrease quantity for ${item.name}`}
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold text-[#1A1A1A]">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => dispatch(updateQty({ id: item.id, qty: item.qty + 1 }))}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E3D9C9] text-[#1A1A1A] hover:bg-[#F1EBE1]"
                          aria-label={`Increase quantity for ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E3D9C9] mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-[#8B6F52]">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#8B6F52]">
                  <span>Shipping</span>
                  <div className="text-right">
                    <div className={shipping === 0 ? "text-green-600 font-medium" : ""}>{shipping === 0 ? "FREE" : formatPrice(shipping)}</div>
                    {shippingMeta?.courierName && (
                      <div className="text-[11px] text-[#8B6F52]">via {shippingMeta.courierName}</div>
                    )}
                  </div>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount</span><span>−{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[#1A1A1A] pt-2 border-t border-[#E3D9C9]">
                  <span>Total</span><span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-2xl border border-[#E3D9C9] p-5">
              <h2 className="text-sm tracking-widest uppercase font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                <Tag size={14} /> Coupon Code
              </h2>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponMsg(null); }}
                  placeholder="ENTER CODE"
                  className="flex-1 border border-[#E3D9C9] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#8B6F52]/50 outline-none focus:border-[#C17A56] tracking-widest uppercase"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-xs tracking-widest uppercase hover:bg-[#C17A56] transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponMsg && (
                <p className={`text-xs mt-2 ${couponMsg.ok ? "text-green-600" : "text-red-500"}`}>{couponMsg.text}</p>
              )}
            </div>

            {/* Trust badges */}
            <div className="bg-[#F1EBE1] rounded-2xl border border-[#E3D9C9] p-4 space-y-3">
              {[
                { icon: Truck, text: "Free shipping on orders above ₹2,999" },
                { icon: Shield, text: "Secure checkout with SSL encryption" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-[#8B6F52]">
                  <Icon size={14} className="text-[#C17A56] shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function input() {
  return "w-full border border-[#E3D9C9] rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#C17A56] transition-colors bg-white placeholder:text-[#8B6F52]/40";
}

function Field({ label, error, children, className = "" }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs tracking-wide text-[#8B6F52] uppercase mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
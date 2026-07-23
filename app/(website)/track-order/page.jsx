"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  Search,
  Truck,
  MapPin,
  Calendar,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

const POLL_INTERVAL_MS = 30_000; // real-time refresh every 30s

function formatDate(input) {
  if (!input) return "—";
  try {
    return new Date(input).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function statusDotClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("delivered")) return "bg-emerald-600";
  if (s.includes("cancel") || s.includes("rto")) return "bg-red-500";
  if (
    s.includes("out for delivery") ||
    s.includes("shipped") ||
    s.includes("in transit") ||
    s.includes("in-transit")
  )
    return "bg-blue-500";
  if (s.includes("picked") || s.includes("manifested") || s.includes("processing"))
    return "bg-amber-500";
  return "bg-gray-400";
}

function TrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || searchParams.get("id") || "";
  const initialAwb = searchParams.get("awb") || "";

  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [awbInput, setAwbInput] = useState(initialAwb);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const pollRef = useRef(null);
  const activeQueryRef = useRef({ orderId: "", awb: "" });

  const buildUrl = (orderId, awb) => {
    const params = new URLSearchParams();
    if (orderId) params.set("orderId", orderId);
    if (awb) params.set("awb", awb);
    return `/api/orders/track?${params.toString()}`;
  };

  const doFetch = async (orderId, awb, isAutoRefresh = false) => {
    if (!orderId && !awb) return;
    if (isAutoRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const res = await fetch(buildUrl(orderId, awb), { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "Unable to track this order");
        if (!isAutoRefresh) setTracking(null);
        return;
      }
      setTracking(data.data);
      setLastRefreshed(new Date());
      activeQueryRef.current = { orderId, awb };
    } catch (e) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const oid = orderIdInput.trim();
    const awb = awbInput.trim();
    if (!oid && !awb) {
      setError("Please enter your Order ID or AWB number to track.");
      return;
    }
    // Update URL for shareability
    const qs = new URLSearchParams();
    if (oid) qs.set("orderId", oid);
    if (awb) qs.set("awb", awb);
    router.replace(`/track-order?${qs.toString()}`);
    doFetch(oid, awb, false);
  };

  // Initial auto-fetch when URL has params
  useEffect(() => {
    if (initialOrderId || initialAwb) {
      doFetch(initialOrderId, initialAwb, false);
    }
  }, []);

  // Real-time polling — every 30s
  useEffect(() => {
    if (!tracking) return;
    if (pollRef.current) clearInterval(pollRef.current);
    // Stop polling for terminal states
    const s = (tracking.currentTrackingStatus || tracking.status || "").toLowerCase();
    if (s.includes("delivered") || s.includes("cancel")) return;

    pollRef.current = setInterval(() => {
      const { orderId, awb } = activeQueryRef.current;
      if (orderId || awb) doFetch(orderId, awb, true);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tracking]);

  const sortedHistory = useMemo(() => {
    const list = [...((tracking && tracking.trackingHistory) || [])];
    return list.sort(
      (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );
  }, [tracking]);

  const currentStatus =
    (tracking && (tracking.currentTrackingStatus || tracking.status)) || "Pending";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        {/* Header */}
        <div className="mb-8 text-center" data-testid="track-order-header">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#C17A56]/10">
            <Package className="h-7 w-7 text-[#C17A56]" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 md:text-4xl">Track Your Order</h1>
          <p className="mt-2 text-sm text-gray-600 md:text-base">
            Real-time shipment tracking powered by ShipMozo — updates every 30 seconds.
          </p>
        </div>

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
          data-testid="track-order-form"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Order ID
              </label>
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Enter your Order ID"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C17A56] focus:ring-2 focus:ring-[#C17A56]/20"
                data-testid="track-order-id-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                AWB Number (optional)
              </label>
              <input
                type="text"
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                placeholder="If you know the AWB"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#C17A56] focus:ring-2 focus:ring-[#C17A56]/20"
                data-testid="track-order-awb-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#C17A56] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#a86641] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:min-w-[180px]"
            data-testid="track-order-submit-button"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Fetching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Track Order
              </>
            )}
          </button>

          {error && (
            <div
              className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              data-testid="track-order-error"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </form>

        {/* Tracking Result */}
        {tracking && (
          <div className="space-y-6" data-testid="track-order-result">
            {/* Summary Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Order
                  </p>
                  <p className="text-lg font-semibold text-gray-900" data-testid="track-order-short-id">
                    #{tracking.shortId}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    {tracking.awbNumber && (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">AWB:</span>
                        <span className="font-mono text-gray-900" data-testid="track-order-awb">
                          {tracking.awbNumber}
                        </span>
                      </div>
                    )}
                    {tracking.courierName && (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <span className="font-medium">Courier:</span>
                        <span>{tracking.courierName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Current Status
                  </p>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-800" data-testid="track-order-current-status">
                    <span className={`h-2 w-2 rounded-full ${statusDotClass(currentStatus)}`} />
                    {currentStatus}
                  </div>
                  {tracking.expectedDeliveryDate && (
                    <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      Expected by {new Date(tracking.expectedDeliveryDate).toLocaleDateString("en-IN")}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {tracking.shippingAddress?.city || "—"},{" "}
                  {tracking.shippingAddress?.state || ""} {tracking.shippingAddress?.pincode || ""}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Placed on {formatDate(tracking.createdAt)}
                  </div>
                  <button
                    type="button"
                    onClick={() => doFetch(activeQueryRef.current.orderId, activeQueryRef.current.awb, true)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    disabled={refreshing}
                    data-testid="track-order-refresh-button"
                  >
                    <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing" : "Refresh"}
                  </button>
                </div>
              </div>

              {!tracking.awbNumber && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  AWB not yet assigned. Live courier tracking will begin once your order is
                  manifested by ShipMozo.
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" data-testid="track-order-timeline">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Shipment Journey</h2>
                {lastRefreshed && (
                  <span className="text-[11px] text-gray-400">
                    Updated {formatDate(lastRefreshed)}
                  </span>
                )}
              </div>

              {sortedHistory.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No tracking events recorded yet. Please check back shortly.
                </div>
              ) : (
                <ol className="relative border-l border-gray-200">
                  {sortedHistory.map((event, idx) => (
                    <li
                      key={idx}
                      className="mb-6 ml-6 last:mb-0"
                      data-testid={`track-order-event-${idx}`}
                    >
                      <span
                        className={`absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${statusDotClass(
                          event.status
                        )}`}
                      >
                        {idx === 0 ? (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {event.status || "Update"}
                        </p>
                        <time className="text-xs text-gray-500">{formatDate(event.timestamp)}</time>
                      </div>
                      {event.remark && event.remark !== event.status && (
                        <p className="mt-1 text-sm text-gray-600">{event.remark}</p>
                      )}
                      {event.location && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}

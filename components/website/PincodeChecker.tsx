"use client";

import { useState, useCallback } from "react";
import { MapPin, Loader2, CheckCircle, AlertCircle, Truck } from "lucide-react";

type EstimateResult = {
  valid: boolean;
  pincode: string;
  city: string | null;
  state: string | null;
  district?: string;
  estimate: { minDays: number; maxDays: number; label: string };
  message?: string;
};

export default function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmed = pincode.trim();

      if (!/^[1-9][0-9]{5}$/.test(trimmed)) {
        setResult(null);
        setError("Please enter a valid 6-digit PIN code");
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch(
          `/api/shipping/pincode-check?pincode=${trimmed}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.data) {
          setError(data?.message || "Unable to check PIN code");
          return;
        }
        setResult(data.data as EstimateResult);
      } catch {
        setError("Unable to check PIN code. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [pincode]
  );

  return (
    <div
      data-testid="pincode-checker"
      className="bg-white border border-gray-200 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A] mb-3">
        <MapPin size={16} className="text-[#C17A56]" />
        <span>Enter PIN code for a better delivery estimate</span>
      </div>

      <form onSubmit={handleCheck} className="flex items-stretch gap-2">
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
            setPincode(v);
            if (error) setError(null);
            if (result) setResult(null);
          }}
          placeholder="Enter your Pincode"
          data-testid="pincode-input"
          className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C17A56] focus:border-[#C17A56]"
          aria-label="Enter your PIN code"
        />
        <button
          type="submit"
          disabled={loading || pincode.length !== 6}
          data-testid="pincode-check-btn"
          className="bg-[#1A1A1A] text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-[#C17A56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Check"}
        </button>
      </form>

      {error && (
        <div
          data-testid="pincode-error"
          className="mt-3 flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg p-3"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && result.valid && result.city && result.state && (
        <div
          data-testid="pincode-result-valid"
          className="mt-3 flex items-start gap-3 bg-green-50 border border-green-100 rounded-lg p-3"
        >
          <CheckCircle
            size={18}
            className="text-green-600 mt-0.5 flex-shrink-0"
          />
          <div className="text-sm text-[#1A1A1A]">
            <p className="font-medium">
              Delivers to{" "}
              <span className="text-green-700">
                {result.city}, {result.state}
              </span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[#1A1A1A]/70">
              <Truck size={14} className="text-[#C17A56]" />
              Estimated delivery in{" "}
              <span className="font-semibold text-[#1A1A1A]">
                {result.estimate.label}
              </span>
            </p>
          </div>
        </div>
      )}

      {result && !result.valid && (
        <div
          data-testid="pincode-result-invalid"
          className="mt-3 flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-lg p-3"
        >
          <AlertCircle
            size={18}
            className="text-yellow-600 mt-0.5 flex-shrink-0"
          />
          <div className="text-sm text-[#1A1A1A]">
            <p className="font-medium">Delivery available</p>
            <p className="mt-1 flex items-center gap-1.5 text-[#1A1A1A]/70">
              <Truck size={14} className="text-[#C17A56]" />
              Estimated delivery in{" "}
              <span className="font-semibold text-[#1A1A1A]">
                {result.estimate.label}
              </span>
            </p>
            {result.message && (
              <p className="mt-1 text-xs text-[#1A1A1A]/60">{result.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

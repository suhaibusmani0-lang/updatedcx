"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-[70vh] bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#E3D9C9] p-8 text-center">
        <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
        <h1 className="text-2xl font-serif text-[#1A1A1A] mb-2">Order Placed!</h1>
        <p className="text-sm text-[#8B6F52] mb-6">
          Thank you for your purchase. Your order has been received and is being processed.
        </p>
        {orderId && (
          <p className="text-xs font-mono bg-[#F1EBE1] rounded-lg px-4 py-2 mb-6 text-[#1A1A1A]">
            Order ID: #{orderId.slice(-8).toUpperCase()}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={orderId ? `/my-account?orderId=${orderId}` : "/my-account"}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white text-xs tracking-widest uppercase rounded-xl hover:bg-[#C17A56] transition-colors"
          >
            <ShoppingBag size={14} />
            View Orders
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-[#E3D9C9] text-[#1A1A1A] text-xs tracking-widest uppercase rounded-xl hover:border-[#C17A56] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-[#FAF7F2] flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

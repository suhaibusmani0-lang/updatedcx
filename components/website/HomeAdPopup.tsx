"use client";

import { useEffect, useState } from "react";

export default function HomeAdPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem("home-ad-popup-seen");
    if (!hasSeenPopup) {
      const timer = window.setTimeout(() => setIsOpen(true), 800);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const closePopup = () => {
    sessionStorage.setItem("home-ad-popup-seen", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C17A56]">Special Offer</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">New arrivals are now live</h3>
          </div>
          <button
            type="button"
            onClick={closePopup}
            className="text-xl font-semibold text-slate-500"
            aria-label="Close popup"
          >
            ×
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Discover fresh styles and limited-time deals for your home and lifestyle.
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={closePopup}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Close
          </button>
          <a
            href="/products"
            onClick={closePopup}
            className="rounded-full bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white"
          >
            Shop Now
          </a>
        </div>
      </div>
    </div>
  );
}

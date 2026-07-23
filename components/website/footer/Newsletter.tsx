// components/footer/Newsletter.tsx
"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email submitted:", email);
    setEmail("");
  };

  return (
    <div className="border-b border-[#1A1A1A]/10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-12 flex flex-col md:flex-row items-center md:items-center justify-between gap-6 text-center">
        <div>
          <h3 className="text-lg sm:text-xl font-serif mb-1 text-[#1A1A1A]">Stay in the Loop</h3>
          <p className="text-xs sm:text-sm text-[#1A1A1A]/60">
            New arrivals, exclusive offers — straight to your inbox.
          </p>
        </div>
        <form className="flex w-full md:w-auto" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="bg-white text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 text-xs sm:text-sm px-4 py-3 outline-none flex-1 md:w-64 lg:w-72 border border-[#1A1A1A]/20 min-w-0"
            required
          />
          <button
            type="submit"
            className="bg-[#1A1A1A] text-white hover:bg-[#C17A56] px-4 py-3 transition-colors shrink-0"
            aria-label="Subscribe"
          >
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

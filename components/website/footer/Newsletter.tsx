// components/footer/Newsletter.tsx
"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Check } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("Thanks for subscribing!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage("Something went wrong. Try again.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to subscribe.");
    }

    // 3 second baad message hata denge aur normal state me aa jayenge
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 3000);
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
        <div className="flex flex-col w-full md:w-auto">
          <form className="flex w-full md:w-auto" onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              disabled={status === "loading"}
              className="bg-white text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 text-xs sm:text-sm px-4 py-3 outline-none flex-1 md:w-64 lg:w-72 border border-[#1A1A1A]/20 min-w-0 disabled:opacity-70"
              required
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="bg-[#1A1A1A] text-white hover:bg-[#AEAA9B] px-4 py-3 transition-colors shrink-0 disabled:opacity-70 flex items-center justify-center min-w-[48px]"
              aria-label="Subscribe"
            >
              {status === "loading" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : status === "success" ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <ArrowRight size={16} />
              )}
            </button>
          </form>
          {message && (
            <p className={`text-[11px] mt-2 text-left ${status === "success" ? "text-green-600" : "text-red-500"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
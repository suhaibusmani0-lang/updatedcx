"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import type { RootState } from "@/store/store";

interface ReviewFormProps {
  productId: string;
  onSubmitted?: () => void;
}

export default function ReviewForm({ productId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionUser, setSessionUser] = useState<any>(null);
  const auth = useSelector((s: RootState) => s.authStore.auth);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = await res.json();
        if (active && data?.ok && data?.data) {
          setSessionUser(data.data);
        } else if (active) {
          setSessionUser(null);
        }
      } catch {
        if (active) {
          setSessionUser(null);
        }
      }
    };

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentUser = auth || sessionUser;
    if (!currentUser) {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = await res.json();
        if (data?.ok && data?.data) {
          setSessionUser(data.data);
        } else {
          router.push("/auth/login");
          return;
        }
      } catch {
        router.push("/auth/login");
        return;
      }
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.ok) {
        setComment("");
        setRating(5);
        setMessage("Review submitted successfully!");
        onSubmitted?.();
      } else {
        setMessage(data.message || "Failed to submit review");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-gray-100">
      <h3 className="font-medium text-[#1A1A1A] mb-3">Write a Review</h3>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => setRating(star)}>
            <Star size={20} className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience..."
        rows={3}
        className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#C17A56] mb-3"
      />
      {message && <p className={`text-sm mb-3 ${message.includes("success") ? "text-green-600" : "text-red-500"}`}>{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 bg-[#1A1A1A] text-white text-sm rounded-xl hover:bg-[#C17A56] transition-colors disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

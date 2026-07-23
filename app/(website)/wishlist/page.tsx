"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ArrowRight, Heart, Package, ShoppingBag, Trash2 } from "lucide-react";
import type { RootState } from "@/store/store";

type WishlistProduct = {
  _id?: string;
  name?: string;
  slug?: string;
  price?: number;
  salePrice?: number;
  stock?: number;
  images?: Array<{ url?: string }>;
  badge?: string;
  isActive?: boolean;
};

type WishlistItem = {
  _id?: string;
  product?: WishlistProduct;
};

export default function WishlistPage() {
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.authStore.auth) as any;
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWishlist = async () => {
    if (!auth) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/wishlist");
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Unable to load wishlist");
      }

      const wishlistItems = (data.data?.items || []).filter((item: WishlistItem) => item.product);
      setItems(wishlistItems);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load wishlist");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth) {
      setItems([]);
      setLoading(false);
      return;
    }

    fetchWishlist();
  }, [auth]);

  const handleRemove = async (productId?: string) => {
    if (!auth || !productId) return;

    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Unable to remove item");
      }

      setItems((prev) => prev.filter((item) => item.product?._id !== productId));
      window.dispatchEvent(new Event("wishlist:updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove item");
    }
  };

  const formatPrice = (product?: WishlistProduct) => {
    const price = product?.salePrice ?? product?.price ?? 0;
    return `₹${price.toLocaleString()}`;
  };

  if (!auth && !loading) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5E8DD] text-[#C17A56]">
            <Heart size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Your wishlist is waiting</h1>
          <p className="mt-3 text-sm text-[#1A1A1A]/70">
            Sign in to view and manage your favourite products.
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#C17A56] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A56245]"
          >
            Sign in
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#C17A56]">Wishlist</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1A1A1A]">Your saved favourites</h1>
          <p className="mt-2 text-sm text-[#1A1A1A]/70">
            Keep track of products you love and revisit them anytime.
          </p>
        </div>

        <div className="rounded-2xl bg-[#F8EFE9] px-4 py-3 text-sm font-medium text-[#1A1A1A]">
          {items.length} item{items.length === 1 ? "" : "s"} saved
        </div>
      </div>

      {loading ? (
        <div className="rounded-[24px] border border-gray-200 bg-white p-10 text-center text-sm text-[#1A1A1A]/70 shadow-sm">
          Loading your wishlist...
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-gray-200 bg-white p-10 text-center text-sm text-red-600 shadow-sm">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5E8DD] text-[#C17A56]">
            <Heart size={24} />
          </div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">No favourites yet</h2>
          <p className="mt-2 text-sm text-[#1A1A1A]/70">
            Start exploring products and save the ones you want to buy later.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#C17A56] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A56245]"
          >
            Browse products
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const product = item.product;
            const imageUrl = product?.images?.[0]?.url;

            return (
              <article key={item._id || product?._id} className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="relative aspect-square bg-[#FAF7F2]">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product?.name || "Wishlist item"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#1A1A1A]/25">
                      <Package size={48} />
                    </div>
                  )}

                  {product?.badge ? (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#C17A56] shadow-sm">
                      {product.badge}
                    </span>
                  ) : null}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1A1A1A]">{product?.name || "Product"}</h3>
                      <p className="mt-1 text-sm text-[#1A1A1A]/60">
                        {product?.stock ? `${product.stock} in stock` : "Availability may vary"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(product?._id)}
                      className="rounded-full border border-gray-200 p-2 text-[#1A1A1A]/70 transition hover:border-[#C17A56] hover:bg-[#FFF5EE] hover:text-[#C17A56]"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-[#C17A56]">{formatPrice(product)}</p>
                    </div>
                    <Link
                      href={product?.slug ? `/product/${product.slug}` : "/products"}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] transition hover:text-[#C17A56]"
                    >
                      View
                      <ArrowRight size={14} />
                    </Link>
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#FAF7F2] px-3 py-2 text-sm text-[#1A1A1A]/70">
                    <ShoppingBag size={16} className="text-[#C17A56]" />
                    Ready for checkout whenever you are.
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

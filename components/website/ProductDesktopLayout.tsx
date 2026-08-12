"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductFilterSidebar from "@/components/website/ProductFilterSidebar";

interface ProductDesktopLayoutProps {
  basePath: string;
  currentSort: string;
  children: ReactNode;
}

export default function ProductDesktopLayout({
  basePath,
  currentSort,
  children,
}: ProductDesktopLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname || basePath}?${params.toString()}`);
  };

  return (
    <div className="min-w-0 flex-1">
      {/* DESKTOP FILTER ONLY */}
      <div className="hidden md:block">
        {!filterOpen && (
          <ProductFilterSidebar
            basePath={basePath}
            desktopDrawer
            desktopOpen={false}
            onDesktopOpenChange={setFilterOpen}
          />
        )}
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        {/* SORT - DESKTOP ONLY */}
        <select
          value={currentSort}
          onChange={(event) => handleSort(event.target.value)}
          aria-label="Sort products"
          className="hidden md:block ml-auto h-10 w-[190px] border border-[#1A1A1A] bg-white px-3 text-sm font-medium text-[#1A1A1A] focus:outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price Low to High</option>
          <option value="price-high">Price High to Low</option>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {children}
    </div>
  );
}
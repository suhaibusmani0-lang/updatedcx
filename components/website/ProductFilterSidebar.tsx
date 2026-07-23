"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const priceOptions = [
  { key: "under500", label: "Under ₹500" },
  { key: "500-1000", label: "₹500 - ₹1000" },
  { key: "1000-2000", label: "₹1000 - ₹2000" },
  { key: "2000-5000", label: "₹2000 - ₹5000" },
  { key: "above5000", label: "Above ₹5000" },
];

const specialOptions = [
  { key: "isNewArrival", label: "New Arrivals" },
  { key: "isSale", label: "Sale" },
  { key: "isBestSeller", label: "Best Sellers" },
];

interface ProductFilterSidebarProps {
  basePath: string;
}

export default function ProductFilterSidebar({ basePath }: ProductFilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPriceRanges = useMemo(
    () => searchParams?.get("priceRanges")?.split(",").filter(Boolean) || [],
    [searchParams]
  );

  const currentSpecials = useMemo(
    () => ({
      isNewArrival: searchParams?.get("isNewArrival") === "true",
      isSale: searchParams?.get("isSale") === "true",
      isBestSeller: searchParams?.get("isBestSeller") === "true",
    }),
    [searchParams]
  );

  const [priceRanges, setPriceRanges] = useState<string[]>(currentPriceRanges);
  const [specials, setSpecials] = useState({
    isNewArrival: false,
    isSale: false,
    isBestSeller: false,
  });

  useEffect(() => {
    setPriceRanges(currentPriceRanges);
  }, [currentPriceRanges]);

  useEffect(() => {
    setSpecials(currentSpecials);
  }, [currentSpecials]);

  const togglePriceRange = (key: string) => {
    setPriceRanges((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const toggleSpecial = (key: keyof typeof specials) => {
    setSpecials((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const buildSearch = () => {
    const params = new URLSearchParams();
    const entries = Array.from(searchParams?.entries() || []);

    entries.forEach(([key, value]) => {
      if (["priceRanges", "isNewArrival", "isSale", "isBestSeller", "page"].includes(key)) {
        return;
      }
      params.set(key, value);
    });

    if (priceRanges.length) {
      params.set("priceRanges", priceRanges.join(","));
    }
    if (specials.isNewArrival) params.set("isNewArrival", "true");
    if (specials.isSale) params.set("isSale", "true");
    if (specials.isBestSeller) params.set("isBestSeller", "true");

    return params.toString();
  };

  const applyFilters = () => {
    const query = buildSearch();
    router.push(`${basePath}${query ? `?${query}` : ""}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    const entries = Array.from(searchParams?.entries() || []);
    entries.forEach(([key, value]) => {
      if (["priceRanges", "isNewArrival", "isSale", "isBestSeller", "page"].includes(key)) return;
      params.set(key, value);
    });
    const query = params.toString();
    setPriceRanges([]);
    setSpecials({ isNewArrival: false, isSale: false, isBestSeller: false });
    router.push(`${basePath}${query ? `?${query}` : ""}`);
  };

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1A1A1A]">Filters</h3>
        <span className="text-[#1A1A1A]/60">
          {priceRanges.length + Number(specials.isNewArrival) + Number(specials.isSale) + Number(specials.isBestSeller)} selected
        </span>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Price Range</h4>
        <div className="space-y-2">
          {priceOptions.map((option) => (
            <label key={option.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={priceRanges.includes(option.key)}
                onChange={() => togglePriceRange(option.key)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-[#1A1A1A]/70">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">Special Offers</h4>
        <div className="space-y-2">
          {specialOptions.map((option) => (
            <label key={option.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={specials[option.key as keyof typeof specials]}
                onChange={() => toggleSpecial(option.key as keyof typeof specials)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-[#1A1A1A]/70">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={applyFilters}
        className="w-full py-3 bg-[#1A1A1A] text-white rounded-lg font-medium hover:bg-[#333] transition-colors"
      >
        Apply Filters
      </button>
      <button
        type="button"
        onClick={clearFilters}
        className="w-full mt-3 py-3 border border-[#1A1A1A] text-[#1A1A1A] rounded-lg font-medium hover:bg-gray-50 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
}

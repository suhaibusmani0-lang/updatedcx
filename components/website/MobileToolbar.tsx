"use client";

import { useState, useEffect, ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MobileToolbar({
  filterNode,
  currentSort,
}: {
  filterNode: ReactNode;
  currentSort: string;
}) {
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // ==========================================
  // MAGIC FIX: Close drawer automatically when filters are applied (URL changes)
  // ==========================================
  useEffect(() => {
    setShowFilter(false);
  }, [searchParams]);

  const handleSort = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", val);
    router.push("?" + params.toString());
    setShowSort(false);
  };

  const sortOptions = [
    { label: "Newest First", value: "newest" },
    { label: "Price Low to High", value: "price-low" },
    { label: "Price High to Low", value: "price-high" },
    { label: "Most Popular", value: "popular" },
  ];

  const activeSortLabel = sortOptions.find((opt) => opt.value === currentSort)?.label || "Newest First";

  return (
    <>
      {/* STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex h-[52px] bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] lg:hidden">
        <button
          onClick={() => setShowSort(true)}
          className="flex-1 flex items-center justify-center font-medium text-[14px] text-[#1A1A1A] border-r border-gray-200"
        >
          Sort By {activeSortLabel.split(" ")[0]}
        </button>
        <button
          onClick={() => setShowFilter(true)}
          className="flex-1 flex items-center justify-center gap-2 font-medium text-[14px] text-[#1A1A1A]"
        >
          Filter <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* SORT MODAL (Neeche se aayega) */}
      {showSort && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/60 lg:hidden">
          <div className="w-full bg-white rounded-t-2xl pb-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg">Sort by</h3>
              {/* YAHAN FIX KIYA HAI: aria-label="Close" add kiya hai */}
              <button aria-label="Close" onClick={() => setShowSort(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col px-4 py-2">
              {sortOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-none cursor-pointer"
                >
                  <input
                    type="radio"
                    name="mobile-sort"
                    className="w-5 h-5 accent-[#AEAA9B]"
                    checked={currentSort === option.value}
                    onChange={() => handleSort(option.value)}
                  />
                  <span className="text-[15px] text-[#1A1A1A]">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FILTER MODAL (Right Side se aayega) */}
      {showFilter && (
        <>
          {/* Background Black Overlay (Bahar click karne pe band hoga) */}
          <div 
            className="fixed inset-0 z-[60] bg-black/60 lg:hidden animate-in fade-in duration-300"
            onClick={() => setShowFilter(false)}
          />
          
          {/* Side Panel Drawer */}
          <div className="fixed inset-y-0 right-0 z-[70] w-[85vw] max-w-[350px] bg-white flex flex-col lg:hidden animate-in slide-in-from-right-full duration-300 shadow-2xl">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shadow-sm">
              <h3 className="font-semibold text-lg">Filters</h3>
              {/* YAHAN FIX KIYA HAI: aria-label="Close" add kiya hai */}
              <button 
                aria-label="Close"
                onClick={() => setShowFilter(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Main Filter Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {filterNode}
            </div>

          </div>
        </>
      )}
    </>
  );
}
"use client";

import React, { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import Image from "next/image";

// Define proper types (Aapke original code se)
interface CategoryImage {
  url: string;
  alt?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: CategoryImage;
  description?: string;
}

export default function CategoryCarousel({ categories }: { categories: Category[] }) {
  // Embla Carousel Hook
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    dragFree: true,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative group">
      {/* Left Navigation Button */}
      <button 
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white text-[#1A1A1A] w-12 h-12 flex items-center justify-center rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex hover:bg-[#FAF7F2]"
        aria-label="Previous"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
      </button>

      {/* Embla Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        {/* gap-[2px] for ultra-thin magazine style spacing[cite: 1] */}
        <div className="flex gap-[2px] pb-6">
          {categories.map((cat: Category) => (
            <Link
              key={cat._id}
              href={`/category/${cat.slug}`}
              // Sharp corners (no rounding) & perfect 4-column sizing on desktop[cite: 1]
              // Note: group/item used to prevent arrow hover from triggering inner borders
              className="group/item relative bg-[#1A1A1A] flex-none w-[85vw] sm:w-[48vw] md:w-[32vw] lg:w-[calc(25%-1.5px)] aspect-[4/5] overflow-hidden"
            >
              {/* Image Section[cite: 1] */}
              {cat.image?.url ? (
                <div className="relative w-full h-full opacity-90 transition-opacity duration-500 group-hover/item:opacity-100">
                  <Image
                    src={cat.image.url}
                    alt={cat.image.alt || cat.name}
                    fill
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 48vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover/item:scale-105"
                    priority={false}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#D4C4B0]">
                  <span className="text-3xl text-[#8B6F52] font-semibold">
                    {cat.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* 🔥 MAGIC 1 FIXED: Inner White Border NOW ONLY SHOWS ON HOVER[cite: 1] */}
              {/* Pehle border visible tha, ab `opacity-0` hai aur hover par `group-hover:opacity-100` hota hai[cite: 1] */}
              <div className="absolute inset-4 sm:inset-5 border border-white z-10 pointer-events-none opacity-0 transition-opacity duration-500 group-hover/item:opacity-100" />

              {/* 🔥 MAGIC 2 FIXED: Clean Solid White Box WITHOUT hover color change[cite: 1] */}
              {/* Yahan se maine hover properties hata di hain taaki text/box color same rahe[cite: 1] */}
              <div className="absolute bottom-8 sm:bottom-12 inset-x-0 flex justify-center z-20">
                <div className="bg-white text-[#1A1A1A] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] px-8 py-2.5 sm:px-10 sm:py-3 shadow-sm">
                  {cat.name}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Right Navigation Button */}
      <button 
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white text-[#1A1A1A] w-12 h-12 flex items-center justify-center rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex hover:bg-[#FAF7F2]"
        aria-label="Next"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}
"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// TypeScript ka error solve karne ke liye sirf yeh interface add kiya hai
interface ProductGalleryProps {
  images?: { url: string; alt?: string }[] | any[];
  name?: string;
  badge?: any;
}

export default function ProductGallery({ images = [], name = "Product", badge }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({ backgroundPosition: "0% 0%" });
  const [lensStyle, setLensStyle] = useState({ left: 0, top: 0 });
  
  // Naya State: Popup/Lightbox ko handle karne ke liye
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Jab popup open ho, toh background scroll disable karne ke liye
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLightboxOpen]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] w-full bg-gray-100 flex items-center justify-center text-gray-400">
        No image available
      </div>
    );
  }

  const currentImage = images[currentIndex]?.url || images[currentIndex];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || isLightboxOpen) return;
    
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    
    const x = e.clientX - left;
    const y = e.clientY - top;

    const xPercent = (x / width) * 100;
    const yPercent = (y / height) * 100;

    setZoomStyle({
      backgroundPosition: `${xPercent}% ${yPercent}%`,
    });

    const lensSize = 150; 
    let lensX = x - lensSize / 2;
    let lensY = y - lensSize / 2;

    lensX = Math.max(0, Math.min(lensX, width - lensSize));
    lensY = Math.max(0, Math.min(lensY, height - lensSize));

    setLensStyle({ left: lensX, top: lensY });
  };

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Agar popup ke andar click ho toh event bubble na ho
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const scrollThumbnails = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200; 
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative flex flex-col">
      {/* 1. Main Image Area with Hover Zoom & Click Popup */}
      <div
        ref={containerRef}
        // onClick add kiya hai taki image par click karte hi popup open ho
        onClick={() => setIsLightboxOpen(true)} 
        className="relative aspect-[4/3] w-full bg-[#F5F5F5] overflow-visible cursor-zoom-in group flex items-center justify-center mb-4"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={currentImage}
          alt={`${name} - view ${currentIndex + 1}`}
          fill
          className="object-contain"
          priority
        />

        {badge && (
          <span className="absolute top-4 left-4 bg-white px-2 py-1 text-xs text-gray-800 border border-gray-200 shadow-sm z-10">
            {badge}
          </span>
        )}

        {/* 2. The Magnifying Lens Box */}
        {isZooming && !isLightboxOpen && (
          <div
            className="hidden lg:block absolute bg-white/20 border border-black/30 pointer-events-none transition-none shadow-[0_0_0_9999px_rgba(255,255,255,0.4)]"
            style={{
              width: "150px",
              height: "150px",
              left: lensStyle.left,
              top: lensStyle.top,
              zIndex: 20
            }}
          />
        )}

        {/* 3. The Side Zoom Projection */}
        {isZooming && !isLightboxOpen && (
          <div
            className="hidden lg:block absolute top-0 w-[95%] h-full bg-white border border-gray-300 shadow-2xl z-50 pointer-events-none"
            style={{
              left: "calc(100% + 20px)",
              backgroundImage: `url(${currentImage})`,
              backgroundPosition: zoomStyle.backgroundPosition,
              backgroundSize: "250%",
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
      </div>

      {/* 4. Thumbnail Carousel */}
      <div className="relative flex items-center justify-center max-w-2xl mx-auto w-full px-8">
        <button
          onClick={() => scrollThumbnails("left")}
          className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center bg-white border border-gray-300 text-gray-600 hover:text-black hover:border-black transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth py-2 px-1"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-20 w-20 flex-shrink-0 bg-white border transition-all ${
                currentIndex === idx
                  ? "border-black shadow-sm"
                  : "border-gray-200 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img?.url || img}
                alt={`${name} thumbnail ${idx + 1}`}
                fill
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => scrollThumbnails("right")}
          className="absolute right-0 z-10 flex h-8 w-8 items-center justify-center bg-white border border-gray-300 text-gray-600 hover:text-black hover:border-black transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 5. The Lightbox / Popup Modal (NEW) */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm">
          
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-50 p-2"
            aria-label="Close popup"
          >
            <X size={32} />
          </button>

          {/* Previous Button */}
          <button
            onClick={prevImage}
            className="absolute left-4 md:left-10 text-white/70 hover:text-white transition-colors z-50 p-2"
            aria-label="Previous image"
          >
            <ChevronLeft size={40} />
          </button>

          {/* Full Screen Image */}
          <div className="relative w-full max-w-6xl h-[80vh] px-16">
            <Image
              src={currentImage}
              alt={`${name} full view`}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Next Button */}
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-10 text-white/70 hover:text-white transition-colors z-50 p-2"
            aria-label="Next image"
          >
            <ChevronRight size={40} />
          </button>
          
          {/* Bottom Thumbnails Indicator (Optional, text based) */}
          <div className="absolute bottom-6 text-white/50 text-sm tracking-widest">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
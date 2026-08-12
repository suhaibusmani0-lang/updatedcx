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
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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
    }
  }, [isLightboxOpen]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full bg-[#F1EBE1] flex items-center justify-center text-[#8B6F52] rounded-none">
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
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
      {/* 1. Main Image Area - Sharp Edges and Theme Background */}
      <div
        ref={containerRef}
        onClick={() => setIsLightboxOpen(true)} 
        className="relative aspect-square w-full bg-[#F1EBE1] overflow-visible cursor-zoom-in group flex items-center justify-center mb-[4px] rounded-none border border-transparent hover:border-[#D4C4B0] transition-colors"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={currentImage}
          alt={`${name} - view ${currentIndex + 1}`}
          fill
          className="object-cover" 
          priority
          loading="eager"
          fetchPriority="high"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-[4px] md:left-[8px] z-20 p-2 md:p-2.5 bg-white/90 hover:bg-white rounded-none shadow-sm text-[#1A1A1A] transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 border border-[#E3D9C9]"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-[4px] md:right-[8px] z-20 p-2 md:p-2.5 bg-white/90 hover:bg-white rounded-none shadow-sm text-[#1A1A1A] transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 border border-[#E3D9C9]"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Sharp Badge matching 4px offset */}
        {badge && (
          <span 
            className={`absolute top-[4px] left-[4px] uppercase rounded-none z-10 
            ${badge === "Sale" 
              ? "bg-[#C1121F] text-white text-[10px] px-2.5 py-1 font-bold tracking-widest" 
              : "bg-[#1A1A1A] text-white text-[10px] font-bold px-3 py-1 shadow-sm tracking-wider"}`}
          >
            {badge}
          </span>
        )}

        {/* 2. The Magnifying Lens Box - Sharp Edges */}
        {isZooming && !isLightboxOpen && (
          <div
            className="hidden lg:block absolute bg-white/10 border border-white/60 pointer-events-none transition-none shadow-[0_0_0_9999px_rgba(26,26,26,0.3)] rounded-none"
            style={{
              width: "150px",
              height: "150px",
              left: lensStyle.left,
              top: lensStyle.top,
              zIndex: 20
            }}
          />
        )}

        {/* 3. The Side Zoom Projection - Sharp Border */}
        {isZooming && !isLightboxOpen && (
          <div
            className="hidden lg:block absolute top-0 w-[95%] h-full bg-white border border-[#E3D9C9] shadow-xl z-50 pointer-events-none rounded-none"
            style={{
              left: "calc(100% + 12px)",
              backgroundImage: `url(${currentImage})`,
              backgroundPosition: zoomStyle.backgroundPosition,
              backgroundSize: "250%",
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
      </div>

      {/* 4. Thumbnail Carousel - 4px Gaps and Sharp Corners */}
      <div className="relative flex items-center justify-center w-full px-8">
        <button
          onClick={() => scrollThumbnails("left")}
          className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center bg-white border border-[#E3D9C9] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-colors rounded-none"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex gap-[4px] overflow-x-auto scrollbar-hide scroll-smooth py-1"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-20 w-20 flex-shrink-0 bg-[#F1EBE1] rounded-none transition-all border ${
                currentIndex === idx
                  ? "border-[#1A1A1A]"
                  : "border-transparent opacity-60 hover:opacity-100 hover:border-[#D4C4B0]"
              }`}
            >
              <Image
                src={img?.url || img}
                alt={`${name} thumbnail ${idx + 1}`}
                fill
                className="object-cover" 
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => scrollThumbnails("right")}
          className="absolute right-0 z-10 flex h-8 w-8 items-center justify-center bg-white border border-[#E3D9C9] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-colors rounded-none"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 5. The Lightbox / Popup Modal - Sharp theme elements */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm">
          
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-50 p-2 rounded-none"
            aria-label="Close popup"
          >
            <X size={32} />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 md:left-10 text-white/60 hover:text-white transition-colors z-50 p-2 rounded-none"
            aria-label="Previous image"
          >
            <ChevronLeft size={40} />
          </button>

          <div className="relative w-full max-w-6xl h-[80vh] px-16">
            <Image
              src={currentImage}
              alt={`${name} full view`}
              fill
              className="object-contain"
              priority
              loading="eager"
              fetchPriority="high"
            />
          </div>

          <button
            onClick={nextImage}
            className="absolute right-4 md:right-10 text-white/60 hover:text-white transition-colors z-50 p-2 rounded-none"
            aria-label="Next image"
          >
            <ChevronRight size={40} />
          </button>
          
          <div className="absolute bottom-6 text-white/50 text-xs font-bold tracking-widest uppercase">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
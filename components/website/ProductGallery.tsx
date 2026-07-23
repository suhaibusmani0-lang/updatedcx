"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

interface ImageItem {
  url: string;
  alt?: string;
}

export default function ProductGallery({ 
  images, 
  name, 
  badge 
}: { 
  images: ImageItem[]; 
  name: string; 
  badge?: string;
}) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Reset zoom when changing images
  useEffect(() => {
    setZoomed(false);
    setImageLoaded(false);
    setImageError(false);
  }, [selected]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      
      if (e.key === "Escape") {
        setIsFullscreen(false);
        setZoomed(false);
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  const handlePrevious = useCallback(() => {
    setSelected((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setSelected((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleThumbnailClick = useCallback((index: number) => {
    setSelected(index);
    setZoomed(false);
    // Scroll thumbnail into view
    const thumbnails = thumbnailContainerRef.current?.children;
    if (thumbnails && thumbnails[index]) {
      thumbnails[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, []);

  const toggleZoom = useCallback(() => {
    setZoomed((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
    if (!isFullscreen) {
      setZoomed(false);
    }
  }, [isFullscreen]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoaded(false);
    setImageError(true);
  }, []);

  if (!images?.length) {
    return (
      <div className="aspect-square bg-[#F1EBE1] rounded-2xl flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-[#E3D9C9] rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl text-[#8B6F52]">📷</span>
        </div>
        <p className="text-sm text-[#8B6F52]">No image available</p>
      </div>
    );
  }

  const currentImage = images[selected];
  const hasMultipleImages = images.length > 1;

  return (
    <div ref={galleryRef} className="space-y-4">
      {/* Main Image */}
      <div
        className={`aspect-square bg-[#F1EBE1] rounded-2xl overflow-hidden relative ${
          !isFullscreen ? "cursor-zoom-in" : "cursor-zoom-out"
        }`}
        onClick={!isFullscreen ? toggleZoom : toggleFullscreen}
        role="img"
        aria-label={`${name} - Image ${selected + 1} of ${images.length}`}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F1EBE1]">
            <div className="w-12 h-12 border-2 border-[#e2e2e2] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F1EBE1]">
            <span className="text-4xl mb-2">🖼️</span>
            <p className="text-sm text-[#8B6F52]">Failed to load image</p>
          </div>
        ) : (
          <Image
            src={currentImage.url}
            alt={currentImage.alt || name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-transform duration-300 ${
              zoomed && !isFullscreen ? "scale-150" : "scale-100"
            } ${isFullscreen ? "object-contain" : ""}`}
            priority={selected === 0}
            onLoad={handleImageLoad}
            onError={handleImageError}
            quality={90}
          />
        )}

        {/* Zoom indicator */}
        {!isFullscreen && imageLoaded && !imageError && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
          </div>
        )}

        {/* Fullscreen toggle */}
        {imageLoaded && !imageError && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <X size={20} /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5v4m0-4h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>}
          </button>
        )}

        {badge && (
          <div className="absolute top-4 left-4 px-3 py-1 bg-[#e2e2e2] text-white text-xs font-bold rounded-full z-10">
            {badge}
          </div>
        )}

        {/* Navigation arrows for mobile */}
        {hasMultipleImages && !isFullscreen && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors md:hidden"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors md:hidden"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Image counter */}
        {hasMultipleImages && !isFullscreen && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
            {selected + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultipleImages && !isFullscreen && (
        <div 
          ref={thumbnailContainerRef}
          className="grid grid-cols-5 gap-2 overflow-x-auto pb-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(images.length, 5)}, 1fr)` }}
        >
          {images.slice(0, 5).map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleThumbnailClick(idx)}
              className={`aspect-square bg-[#F1EBE1] rounded-lg overflow-hidden relative transition-all ${
                selected === idx 
                  ? "ring-2 ring-[#e2e2e2] ring-offset-2" 
                  : "hover:ring-2 hover:ring-[#e2e2e2]/50"
              }`}
              aria-label={`View image ${idx + 1}`}
              aria-current={selected === idx ? "true" : "false"}
            >
              <Image
                src={img.url}
                alt={img.alt || `${name} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 20vw, (max-width: 768px) 15vw, 10vw"
                loading="lazy"
                onError={(e) => {
                  // Hide broken thumbnails
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </button>
          ))}
          
          {images.length > 5 && (
            <button
              type="button"
              onClick={() => {
                // Scroll to show more or open a modal
                const container = thumbnailContainerRef.current;
                if (container) {
                  container.scrollBy({ left: 100, behavior: "smooth" });
                }
              }}
              className="aspect-square bg-[#1A1A1A] rounded-lg flex items-center justify-center text-white text-xs font-medium hover:bg-[#e2e2e2] transition-colors"
            >
              +{images.length - 5}
            </button>
          )}
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={toggleFullscreen}
        >
          <div 
            className="relative w-full h-full max-w-7xl mx-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {imageError ? (
                <div className="text-white text-center">
                  <span className="text-6xl mb-4 block">🖼️</span>
                  <p>Failed to load image</p>
                </div>
              ) : (
                <Image
                  src={currentImage.url}
                  alt={currentImage.alt || name}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  quality={100}
                  onError={handleImageError}
                />
              )}
            </div>

            {/* Fullscreen controls */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2 transition-colors"
              aria-label="Close fullscreen"
            >
              <X size={32} />
            </button>

            {hasMultipleImages && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 transition-colors bg-black/30 rounded-full hover:bg-black/50"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 transition-colors bg-black/30 rounded-full hover:bg-black/50"
                  aria-label="Next image"
                >
                  <ChevronRight size={32} />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                  {selected + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
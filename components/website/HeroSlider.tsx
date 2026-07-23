"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Slide data – add optional `video` field
const slides = [
  {
    // mode: "CX",
    // eyebrow: "Cosmopolitan Xccessories",
    headline: "The Art of Burning Bakhoor",
    sub: "The art of burning bakhoor encompasses much more than the simple act of lighting incense.",
    cta: "Buy Now",
    href: "/products",
    image: "https://talkfragrance.com/wp-content/uploads/2025/03/image_fx_-36.png",
    video: "https://res.cloudinary.com/dd62irk0g/video/upload/v1784644362/cn/banner_gjksp0.mp4",
    overlay: "bg-gradient-to-t from-[#1A1A1A]/70 via-[#1A1A1A]/20 to-transparent",
  },
  {
    // mode: "CX",
    // eyebrow: "Cosmopolitan Xccessories",
    headline: "Oud Essential Oil Diffuser Gift Set",
    sub: "Experience luxury aromatherapy with our pure Oud Diffuser Oils. This carefully curated set features a wide assortment of floral.",
    cta: "BuyNow",
    href: "/products",
    image: "https://d3k81ch9hvuctc.cloudfront.net/company/R7MZQi/images/2bd6a764-2632-4e0a-acbc-0c008d5da2d6.jpeg",
    overlay: "bg-gradient-to-t from-[#8B6F52]/80 via-[#8B6F52]/20 to-transparent",
    video: "https://res.cloudinary.com/dd62irk0g/video/upload/v1784644362/cn/banner_gjksp0.mp4",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  };

  const slide = slides[current];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "clamp(420px, 80vh, 600px)" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides - hidden on mobile, visible on desktop */}
      <div className="hidden md:block relative w-full h-full">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Video or Image */}
            {s.video ? (
              <video
                src={s.video}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={s.image}
                alt={s.headline}
                className="w-full h-full object-cover object-center"
              />
            )}
            {/* Overlay */}
            <div className={`absolute inset-0 ${s.overlay}`} />
          </div>
        ))}

        {/* Desktop Content */}
        <div className="absolute inset-0 flex flex-col justify-end px-5 sm:px-10 md:px-16 lg:px-24 pb-12 sm:pb-16 md:pb-20 lg:pb-28 text-white">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif leading-[1.1] mb-3 sm:mb-4 whitespace-pre-line">
            {slide.headline}
          </h1>
          <p className="text-xs sm:text-sm md:text-base mb-6 sm:mb-8 max-w-xs sm:max-w-sm md:max-w-md opacity-90 leading-relaxed">
            {slide.sub}
          </p>
          <a
            href={slide.href}
            className="inline-block bg-white text-[#1A1A1A] text-[10px] sm:text-xs tracking-widest uppercase px-6 sm:px-8 py-2.5 sm:py-3 hover:bg-[#e2e2e2] hover:text-white transition-colors w-fit font-semibold"
          >
            {slide.cta}
          </a>
        </div>

        {/* Navigation arrows – hidden on mobile */}
        <button
          onClick={prev}
          aria-label="Previous"
          className="hidden sm:flex absolute left-3 md:left-5 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 md:p-2.5 transition-colors items-center justify-center"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          aria-label="Next"
          className="hidden sm:flex absolute right-3 md:right-5 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 md:p-2.5 transition-colors items-center justify-center"
        >
          <ChevronRight size={18} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-white w-6 sm:w-8" : "bg-white/50 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>

      {/* MOBILE ONLY VIEW */}
      <div className="md:hidden relative w-full h-full">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Video or Image */}
            {s.video ? (
              <video
                src={s.video}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={s.image}
                alt={s.headline}
                className="w-full h-full object-cover object-center"
              />
            )}
            {/* Overlay */}
            <div className={`absolute inset-0 ${s.overlay}`} />
          </div>
        ))}

        {/* Mobile Content - centered layout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <h1 className="text-2xl font-serif leading-[1.1] mb-3 whitespace-pre-line">
            {slide.headline}
          </h1>
          <p className="text-xs mb-6 max-w-xs opacity-90 leading-relaxed">
            {slide.sub}
          </p>
          <a
            href={slide.href}
            className="inline-block bg-white text-[#1A1A1A] text-[10px] tracking-widest uppercase px-6 py-2.5 hover:bg-[#e2e2e2] hover:text-white transition-colors w-fit font-semibold"
          >
            {slide.cta}
          </a>
        </div>

        {/* Mobile Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-white w-6" : "bg-white/50 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
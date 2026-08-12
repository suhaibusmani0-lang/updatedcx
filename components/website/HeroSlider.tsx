"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HOMEPAGE_VIDEO = "https://res.cloudinary.com/dd62irk0g/video/upload/q_auto:good,vc_auto,w_1280/v1784644362/cn/banner_gjksp0.mp4";
const HOMEPAGE_POSTER = "https://res.cloudinary.com/dd62irk0g/video/upload/so_0,f_auto,q_auto,w_1280/v1784644362/cn/banner_gjksp0.jpg";
const slides = [
  { headline:"The Art of Burning Bakhoor", sub:"The art of burning bakhoor encompasses much more than the simple act of lighting incense.", cta:"Buy Now", href:"/products", image:HOMEPAGE_POSTER, video:HOMEPAGE_VIDEO, overlay:"bg-gradient-to-t from-[#1A1A1A]/70 via-[#1A1A1A]/20 to-transparent" },
  { headline:"Oud Essential Oil Diffuser Gift Set", sub:"Experience luxury aromatherapy with our pure Oud Diffuser Oils. This carefully curated set features a wide assortment of floral.", cta:"BuyNow", href:"/products", image:HOMEPAGE_POSTER, video:HOMEPAGE_VIDEO, overlay:"bg-gradient-to-t from-[#8B6F52]/80 via-[#8B6F52]/20 to-transparent" },
];

function SlideMedia({ slide, priority }: { slide:(typeof slides)[number]; priority:boolean }) {
  const [videoReady,setVideoReady]=useState(false), [loadVideo,setLoadVideo]=useState(false);
  useEffect(()=>{
    const mobile=window.matchMedia("(max-width: 767px)").matches;
    const delay=mobile?(priority?6000:7000):(priority?2500:3500);
    const activate=()=>setLoadVideo(true);
    const timeoutId=setTimeout(activate,delay);
    return()=>clearTimeout(timeoutId);
  },[priority]);
  return <>
    <img src={slide.image} alt="" aria-hidden="true" fetchPriority={priority?"high":"auto"} loading={priority?"eager":"lazy"} decoding="async" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${videoReady?"opacity-0":"opacity-100"}`} />
    {slide.video&&loadVideo&&<video src={slide.video} poster={slide.image} autoPlay muted loop playsInline preload="none" onCanPlay={()=>setVideoReady(true)} aria-hidden="true" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${videoReady?"opacity-100":"opacity-0"}`} />}
  </>;
}

export default function HeroSlider(){
  const [current,setCurrent]=useState(0); const touchStartX=useRef(0);
  useEffect(()=>{const t=setInterval(()=>setCurrent(c=>(c+1)%slides.length),11000);return()=>clearInterval(t)},[]);
  const prev=()=>setCurrent(c=>(c-1+slides.length)%slides.length), next=()=>setCurrent(c=>(c+1)%slides.length);
  const onTouchStart=(e:React.TouchEvent)=>{touchStartX.current=e.touches[0].clientX};
  const onTouchEnd=(e:React.TouchEvent)=>{const diff=touchStartX.current-e.changedTouches[0].clientX;if(Math.abs(diff)>50)diff>0?next():prev()};
  const slide=slides[current];
  return <section className="relative w-full overflow-hidden" style={{height:"clamp(420px, 80vh, 600px)"}} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <div className="absolute inset-0"><SlideMedia slide={slide} priority={current===0}/><div className={`absolute inset-0 ${slide.overlay}`}/></div>
    <div className="hidden md:flex absolute inset-0 flex-col justify-end px-5 sm:px-10 md:px-16 lg:px-24 pb-12 sm:pb-16 md:pb-20 lg:pb-28 text-white">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif leading-[1.1] mb-3 sm:mb-4 whitespace-pre-line">{slide.headline}</h1>
      <p className="text-xs sm:text-sm md:text-base mb-6 sm:mb-8 max-w-xs sm:max-w-sm md:max-w-md opacity-90 leading-relaxed">{slide.sub}</p>
      <a href={slide.href} className="inline-block bg-white text-[#1A1A1A] text-[10px] sm:text-xs tracking-widest uppercase px-6 sm:px-8 py-2.5 sm:py-3 hover:bg-[#e2e2e2] hover:text-white transition-colors w-fit font-semibold">{slide.cta}</a>
    </div>
    <div className="hidden md:flex absolute inset-0 pointer-events-none items-center justify-between px-3 md:px-5">
      <button onClick={prev} aria-label="Previous slide" className="pointer-events-auto hidden sm:flex bg-white/20 hover:bg-white/40 text-white rounded-full p-2 md:p-2.5 transition-colors items-center justify-center"><ChevronLeft size={18}/></button>
      <button onClick={next} aria-label="Next slide" className="pointer-events-auto hidden sm:flex bg-white/20 hover:bg-white/40 text-white rounded-full p-2 md:p-2.5 transition-colors items-center justify-center"><ChevronRight size={18}/></button>
    </div>
    <div className="hidden md:flex absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 gap-1.5 sm:gap-2">{slides.map((_,i)=><button key={i} onClick={()=>setCurrent(i)} aria-label={`Slide ${i+1}`} className="relative flex h-6 w-6 items-center justify-center"><span aria-hidden="true" className={`block h-1.5 w-1.5 origin-center rounded-full bg-white/50 transition-transform duration-300 will-change-transform ${i===current?"scale-x-[4] bg-white":"scale-x-100"}`}/></button>)}</div>
    <div className="md:hidden absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
      <h1 className="text-2xl font-serif leading-[1.1] mb-3 whitespace-pre-line">{slide.headline}</h1><p className="text-xs mb-6 max-w-xs opacity-90 leading-relaxed">{slide.sub}</p>
      <a href={slide.href} className="inline-block bg-white text-[#1A1A1A] text-[10px] tracking-widest uppercase px-6 py-2.5 hover:bg-[#e2e2e2] hover:text-white transition-colors w-fit font-semibold">{slide.cta}</a>
    </div>
    <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">{slides.map((_,i)=><button key={i} onClick={()=>setCurrent(i)} aria-label={`Slide ${i+1}`} className="relative flex h-6 w-6 items-center justify-center"><span aria-hidden="true" className={`block h-1.5 w-1.5 origin-center rounded-full bg-white/50 transition-transform duration-300 will-change-transform ${i===current?"scale-x-[4] bg-white":"scale-x-100"}`}/></button>)}</div>
  </section>;
}

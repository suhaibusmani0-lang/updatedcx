import React from "react";
import Image from "next/image";

const HomePageCenterItem = () => {
  return (
    <section className="bg-[#FAF7F2] py-2 sm:py-2">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
        
        {/* 🔥 2px EDITORIAL GAPPING: Container ka bg #E3D9C9 hai, aur gap-[2px] se ekdum patli crisp lines banengi */}
        <div className="bg-[#E3D9C9] grid grid-cols-1 lg:grid-cols-12 gap-[2px] border-[2px] border-[#E3D9C9] items-stretch">
          
          {/* 1. Main Gift Banner – Tumhara purana Beige Color bg-[#EAE8E3] */}
          <div className="lg:col-span-7 xl:col-span-8 relative bg-[#EAE8E3] h-full flex flex-col md:flex-row items-center group overflow-hidden">
            
            {/* Pottery Barn style hover inner border */}
            <div className="absolute inset-3 sm:inset-4 border border-[#9A7B4F]/50 z-20 pointer-events-none opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Glowing background effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-white/60 rounded-full blur-[80px] transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-[#D4AF37]/10 rounded-full blur-[80px] transition-transform duration-1000 group-hover:scale-110" />
            </div>

            <div className="relative z-10 w-full md:w-1/2 p-8 md:p-12 flex justify-center items-center">
              <div className="relative w-full max-w-[280px] aspect-[4/5]">
                <div className="absolute inset-0 bg-white/40 blur-2xl rounded-full" />
                <Image
                  src="/assets/images/giftpack.jpeg"
                  alt="Premium Gift Wrapping"
                  width={400}
                  height={500}
                  className="relative z-10 w-full h-full object-contain drop-shadow-xl transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            <div className="relative z-10 w-full md:w-1/2 p-8 md:p-12 md:pl-0 flex flex-col justify-center text-center md:text-left">
              <span className="text-[#9A7B4F] text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-4 block">
                The Art of Gifting
              </span>
              <h3 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6 leading-tight">
                Unforgettable <br />
                <span className="font-semibold italic text-transparent bg-clip-text bg-gradient-to-r from-[#9A7B4F] to-[#C5A059]">
                  Unboxing Experience
                </span>
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-light mb-8 max-w-md mx-auto md:mx-0">
                Thoughtfully wrapped using premium materials and refined finishes. Whether it's for birthdays, anniversaries, or corporate gifting, we ensure your gift arrives beautifully presented and ready to delight.
              </p>
              
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-800 hover:text-[#9A7B4F] transition-colors cursor-pointer group/cta w-max mx-auto md:mx-0">
                <span className="text-xs font-bold tracking-[0.2em] uppercase border-b border-gray-800 pb-0.5 group-hover/cta:border-[#9A7B4F]">Explore Gifting</span>
                <svg className="w-4 h-4 transform transition-transform group-hover/cta:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>

          {/* 2. Supporting Cards Grid – Yahan bhi gap-[2px] chalega */}
          <div className="lg:col-span-5 xl:col-span-4 grid grid-cols-2 gap-[2px] h-full">
            
            {/* Card 1: Tumhare White Cards bina individual border ke (kyunki gap border ka kaam karega) */}
            <div className="relative bg-white p-6 flex flex-col justify-center items-center text-center group h-full min-h-[240px]">
              <div className="absolute inset-2 sm:inset-3 border border-[#D4C4B0] opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
              
              <div className="w-12 h-12 bg-[#FAF7F2] rounded-none flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-[#EAE8E3] relative z-10">
                <svg className="w-5 h-5 text-gray-700 group-hover:text-[#9A7B4F] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h4 className="font-serif text-gray-900 text-[15px] tracking-wide relative z-10">Bulk Orders</h4>
              <p className="text-[12px] text-gray-500 mt-1.5 font-light relative z-10">Wholesale pricing available</p>
            </div>

            {/* Card 2 */}
            <div className="relative bg-white p-6 flex flex-col justify-center items-center text-center group h-full min-h-[240px]">
              <div className="absolute inset-2 sm:inset-3 border border-[#D4C4B0] opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
              
              <div className="w-12 h-12 bg-[#FAF7F2] rounded-none flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-[#EAE8E3] relative z-10">
                <svg className="w-5 h-5 text-gray-700 group-hover:text-[#9A7B4F] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h4 className="font-serif text-gray-900 text-[15px] tracking-wide relative z-10">Curated</h4>
              <p className="text-[12px] text-gray-500 mt-1.5 font-light relative z-10">Tailored to your needs</p>
            </div>

            {/* Card 3 */}
            <div className="relative bg-white p-6 flex flex-col justify-center items-center text-center group h-full min-h-[240px]">
              <div className="absolute inset-2 sm:inset-3 border border-[#D4C4B0] opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
              
              <div className="w-12 h-12 bg-[#FAF7F2] rounded-none flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-[#EAE8E3] relative z-10">
                <svg className="w-5 h-5 text-gray-700 group-hover:text-[#9A7B4F] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-serif text-gray-900 text-[15px] tracking-wide relative z-10">Fast Dispatch</h4>
              <p className="text-[12px] text-gray-500 mt-1.5 font-light relative z-10">Pan-India shipping</p>
            </div>

            {/* Card 4 */}
            <div className="relative bg-white p-6 flex flex-col justify-center items-center text-center group h-full min-h-[240px]">
              <div className="absolute inset-2 sm:inset-3 border border-[#D4C4B0] opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
              
              <div className="w-12 h-12 bg-[#FAF7F2] rounded-none flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-[#EAE8E3] relative z-10">
                <svg className="w-5 h-5 text-gray-700 group-hover:text-[#9A7B4F] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h4 className="font-serif text-gray-900 text-[15px] tracking-wide relative z-10">Premium</h4>
              <p className="text-[12px] text-gray-500 mt-1.5 font-light relative z-10">Highest standards</p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePageCenterItem;
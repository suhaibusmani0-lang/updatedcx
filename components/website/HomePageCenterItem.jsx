import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import React from "react";
import Image from "next/image";

const HomePageCenterItem = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 py-8">
      {/* Main Gift Banner – Dark Premium Card */}
      <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 p-6 sm:p-8 md:col-span-2 lg:col-span-1 lg:row-span-2 flex flex-col items-center">
        {/* Decorative soft glow effects */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#AEAA9B]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#AEAA9B]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Image Section - Auto Height for perfect aspect ratio */}
        <div className="relative z-10 w-full flex justify-center mb-8 mt-2">
          <Image 
            src="/assets/images/giftpack.jpeg" 
            alt="Gift Banner" 
            width={400} 
            height={500} 
            className="w-[85%] sm:w-[75%] h-auto object-contain rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] ring-1 ring-white/10" 
          />
        </div>

        {/* Text Section - Premium Typography */}
        <div className="relative z-10 flex flex-col justify-center flex-1 text-center px-1 sm:px-3">
          <p className="text-[14px] sm:text-[15px] text-gray-300 leading-loose font-light tracking-wide">
            Make every gift unforgettable with our elegant gift wrapping service with personalized messages. Thoughtfully wrapped using premium materials and refined finishes, each package is designed to create a memorable unboxing experience. Whether it's for birthdays, anniversaries, festivals, housewarmings, or corporate gifting, we'll ensure your gift arrives beautifully presented and ready to delight.
          </p>
        </div>
      </div>

      {/* Supporting Cards – Light Gray / White */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-4 border border-gray-100">
          🎯
        </div>
        <h4 className="font-semibold text-gray-800 text-base">Bulk Orders</h4>
        <p className="text-sm text-gray-500 mt-2">Wholesale pricing available</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-4 border border-gray-100">
          🎨
        </div>
        <h4 className="font-semibold text-gray-800 text-base">Custom Curation</h4>
        <p className="text-sm text-gray-500 mt-2">Tailored to your needs</p>
      </div>

      {/* Hidden on small screens, visible on lg */}
      <div className="hidden lg:flex bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-4 border border-gray-100">
          🚀
        </div>
        <h4 className="font-semibold text-gray-800 text-base">Fast Delivery</h4>
        <p className="text-sm text-gray-500 mt-2">Pan-India shipping</p>
      </div>

      <div className="hidden lg:flex bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-4 border border-gray-100">
          💎
        </div>
        <h4 className="font-semibold text-gray-800 text-base">Premium Quality</h4>
        <p className="text-sm text-gray-500 mt-2">Curated with care</p>
      </div>
    </div>
  );
};

export default HomePageCenterItem;
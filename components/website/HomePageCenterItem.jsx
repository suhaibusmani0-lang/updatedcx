import React from "react";

const HomePageCenterItem = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 py-8">
      {/* Main Gift Banner – Dark Gradient Card */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl shadow-xl overflow-hidden border border-gray-600/30 p-6 md:col-span-2 lg:col-span-1 lg:row-span-2">
        {/* Decorative blur circles */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gray-500/30 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gray-500/20 rounded-full blur-xl" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Gift icon & badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🎁</span>
            <span className="text-xs font-medium text-gray-300 tracking-wider uppercase bg-gray-700/50 px-3 py-1 rounded-full border border-gray-500/30">
              Premium Gifts
            </span>
          </div>

          {/* Headlines */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            <span className="text-white">Gift Better.</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
              Gift Xccessories
            </span>
          </h2>

          {/* Sub-headline */}
          <p className="mt-3 text-sm font-medium text-gray-400 uppercase tracking-wider">
            Looking To Gift In Bulk
          </p>

          {/* Divider */}
          <div className="w-12 h-0.5 bg-gradient-to-r from-gray-400 to-gray-500 my-4" />

          {/* Description */}
          <p className="text-gray-300 text-sm leading-relaxed">
            One Inquiry.
            <span className="block font-semibold text-white">
              Every Gift Taken Care Of.
            </span>
          </p>

          {/* Brand */}
          <div className="mt-auto pt-12 flex items-center justify-between">
            <span className="text-lg font-bold tracking-widest text-gray-200/80">
            Cosmopolitan Xccessories
            </span>
          </div>
        </div>
      </div>

      {/* Supporting Cards – Light Gray / White */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl mb-3">
          🎯
        </div>
        <h4 className="font-semibold text-gray-800 text-sm">Bulk Orders</h4>
        <p className="text-xs text-gray-500 mt-1">Wholesale pricing available</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl mb-3">
          🎨
        </div>
        <h4 className="font-semibold text-gray-800 text-sm">Custom Curation</h4>
        <p className="text-xs text-gray-500 mt-1">Tailored to your needs</p>
      </div>

      {/* Hidden on small screens, visible on lg */}
      <div className="hidden lg:flex bg-white rounded-2xl shadow-md border border-gray-200 p-5 flex-col items-center text-center hover:shadow-lg transition-shadow duration-300">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl mb-3">
          🚀
        </div>
        <h4 className="font-semibold text-gray-800 text-sm">Fast Delivery</h4>
        <p className="text-xs text-gray-500 mt-1">Pan-India shipping</p>
      </div>

      <div className="hidden lg:flex bg-white rounded-2xl shadow-md border border-gray-200 p-5 flex-col items-center text-center hover:shadow-lg transition-shadow duration-300">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl mb-3">
          💎
        </div>
        <h4 className="font-semibold text-gray-800 text-sm">Premium Quality</h4>
        <p className="text-xs text-gray-500 mt-1">Curated with care</p>
      </div>
    </div>
  );
};

export default HomePageCenterItem;
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Business to Business | Cosmopolitan Xccessories",
  description: "Partner with Cosmopolitan Xccessories for premium incense, bakhoor, burners, bulk orders, and private labeling.",
};

export default function B2BPage() {
  return (
    <div className="bg-white min-h-screen pb-16">
      {/* Breadcrumb Navigation */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5 py-6">
        <nav className="flex items-center gap-2 text-xs text-[#8B6F52]">
          <Link href="/" className="hover:text-[#1A1A1A] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#1A1A1A]">Business to Business</span>
        </nav>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Heading Section (Above the Image) */}
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1A1A1A]">
            Business to Business
          </h1>
        </div>

        {/* Top Image Section (First Photo) */}
        <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden mb-12 sm:mb-16">
          <Image
            src="https://res.cloudinary.com/dd62irk0g/image/upload/v1784818892/cn/B2Bpage_mjpnpb.jpg" 
            alt="Cosmopolitan Xccessories B2B Meeting Room"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Text Content Section (Below the Image) */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Partner with Cosmopolitan Xccessories for premium incense, bakhoor, burners, home décor, and lifestyle essentials. We offer reliable manufacturing, private labeling, bulk orders, and export-ready solutions tailored to your business needs.
          </p>
        </div>

        {/* Contact Buttons Section (Second Photo Design - Resized & Minimal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
          
          {/* Email Button */}
          <a
            href="mailto: b2b@cosmoxs.com"
            className="group block bg-[#F4F3F0] py-6 sm:py-8 px-4 text-center hover:bg-[#EAE8E4] transition-colors duration-300"
          >
            <h3 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] mb-2 group-hover:text-[#C17A56] transition-colors">
              Email Us
            </h3>
            <p className="text-[11px] sm:text-xs tracking-[0.15em] text-[#555] uppercase font-medium">
              b2b@cosmoxs.com
            </p>
          </a>

          {/* Call Button */}
          <a
            href="tel:+918882353728"
            className="group block bg-[#F4F3F0] py-6 sm:py-8 px-4 text-center hover:bg-[#EAE8E4] transition-colors duration-300"
          >
            <h3 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] mb-2 group-hover:text-[#C17A56] transition-colors">
              Call Us
            </h3>
            <p className="text-[11px] sm:text-xs tracking-[0.15em] text-[#555] uppercase font-medium">
              +91 88823 53728
            </p>
          </a>

        </div>

      </div>
    </div>
  );
}
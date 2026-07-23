// components/footer/BrandSection.tsx

import { footerConfig } from "@/data/footerData";
import SocailLink from "./SocialLink";

export function BrandSection() {


  return (
   <div className="lg:block lg:ml-[110px] col-span-2 md:col-span-1">
  {/* Added -mt-[41px] for negative margin-top */}
  <p className=" whitespace-nowrap text-base sm:text-[15px] md:text-lg tracking-[0.15em] sm:tracking-[0.2em] uppercase font-bold mb-3 text-[#1A1A1A] text-center">
    {footerConfig.brandName}
  </p>
  
  <p className="text-xs text-center sm:text-sm text-[#1A1A1A]/70 leading-relaxed max-w-[350px]">
    {footerConfig.brandDescription}
  </p>
  
  <div className="flex gap-4 mt-5 justify-center">
    <SocailLink />
  </div>
</div>
  );
}

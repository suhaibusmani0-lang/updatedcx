// components/Footer.tsx (simplified main component)
import { footerLinks } from "@/data/footerData";
import { Newsletter } from "./Newsletter";
import { BrandSection } from "./BrandSection";
import { LinkSection } from "./LinkSection";
import { LegalBar } from "./LegalBar";
import SocailLink from "./SocialLink";
// types/footer.ts
export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

 
export interface LegalLink {
  label: string;
  href: string;
}
export default function Footer() {
  
  return (
    <footer className="bg-[#e8e4dc] text-[#1A1A1A]">
      <Newsletter />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14 grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 justify-items-center ">
        <BrandSection />
       
        {footerLinks.map((section) => (
          <LinkSection key={section.title} title={section.title} links={section.links} />
        ))}
      </div>
      <LegalBar />
    </footer>
  );
}
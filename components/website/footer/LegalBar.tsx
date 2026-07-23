"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { legalLinks } from "@/data/footerData";

const routeTitles: Record<string, string> = {
  "/": "Home",
  "/products": "Products",
  "/about": "About Us",
  "/contact": "Contact",
  "/checkout": "Checkout",
  "/my-account": "My Account",
  "/search": "Search Results",
};

function getPageTitle(pathname: string | null) {
  if (!pathname) return "Website";
  if (pathname.startsWith("/category/")) return "Category";
  if (pathname.startsWith("/product/")) return "Product Details";
  if (pathname.startsWith("/search")) return "Search Results";
  return routeTitles[pathname] || "Website";
}

export function LegalBar() {
  const pathname = usePathname();
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);
  const currentYear = new Date().getFullYear();

  return (
    <div className="border-t border-[#1A1A1A]/10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-[#1A1A1A]/60 center">
        <p className="text-center md:text-left">
          {pageTitle} • © {currentYear} All rights reserved by Cosmopolitan Xccessories. Developed by <a href="https://zarnetic.com" className="hover:text-[#1A1A1A]" target="_blank" rel="noopener noreferrer">Zarnetic</a>
        </p>
        <div className="flex gap-4">
          {legalLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="hover:text-[#1A1A1A] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
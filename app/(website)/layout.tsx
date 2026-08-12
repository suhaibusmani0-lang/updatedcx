import type { Metadata } from "next";
import Header from "@/components/website/header/Header";
import Footer from "@/components/website/footer/Footer";
import AccessibilityGuard from "@/components/website/AccessibilityGuard";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://cosmoxs.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Cosmopolitan Xccessories — Premium Home Decor, Fragrance & Bakhoor", template: "%s | Cosmopolitan Xccessories" },
  description: "Shop premium home decor, bakhoor burners, luxury fragrances, tabletop accessories, gifts and holiday collections at Cosmopolitan Xccessories. Curated designs with pan-India shipping.",
  keywords: ["home decor","bakhoor burner","luxury fragrances","tabletop accessories","gift items","premium home decor India","Cosmopolitan Xccessories","cosmoxs"],
  applicationName: "Cosmopolitan Xccessories", authors: [{ name: "Cosmopolitan Xccessories", url: SITE_URL }], creator: "Cosmopolitan Xccessories", publisher: "Cosmopolitan Xccessories", alternates: { canonical: "/" },
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: { title: "Cosmopolitan Xccessories | Premium Home Decor & Fragrance", description: "Discover premium home decor, bakhoor burners, fragrances, and tabletop accessories to elevate your living spaces.", url: SITE_URL, siteName: "Cosmopolitan Xccessories", images: [{ url: "/assets/images/burner.jpg", width: 1200, height: 630, alt: "Cosmopolitan Xccessories Collection" }], locale: "en_IN", type: "website" },
  twitter: { card: "summary_large_image", title: "Cosmopolitan Xccessories | Premium Home Decor", description: "Discover premium home decor, bakhoor burners, fragrances, and tabletop accessories.", images: ["/assets/images/burner.jpg"] },
  robots: { index: true, follow: true, nocache: false, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
  icons: { icon: "/assets/images/favicon.ico", shortcut: "/assets/images/favicon.ico", apple: "/assets/images/favicon.ico" },
};

const organizationSchema={"@context":"https://schema.org","@type":"Organization",name:"Cosmopolitan Xccessories",url:SITE_URL,logo:`${SITE_URL}/assets/images/logo-black1.png`,sameAs:["https://www.instagram.com/cosmopolitanxccessories","https://www.facebook.com/cosmopolitanxccessories"],contactPoint:{"@type":"ContactPoint",contactType:"customer service",availableLanguage:["English","Hindi"],areaServed:"IN"}};
const websiteSchema={"@context":"https://schema.org","@type":"WebSite",name:"Cosmopolitan Xccessories",url:`${SITE_URL}/`,potentialAction:{"@type":"SearchAction",target:`${SITE_URL}/search?q={search_term_string}`,"query-input":"required name=search_term_string"}};
export default function WebsiteLayout({children}:{children:React.ReactNode}){return <div className="min-h-screen flex flex-col bg-[#FAF7F2]"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organizationSchema)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(websiteSchema)}}/><link rel="preconnect" href="https://res.cloudinary.com"/><AccessibilityGuard/><Header/><main className="flex-1">{children}</main><Footer/></div>}

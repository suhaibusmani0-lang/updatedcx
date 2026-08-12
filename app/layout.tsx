import type { Metadata } from "next";
import { Lato, Raleway } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import Analytics from "@/components/Analytics";
import Providers from "@/components/providers/ThemeProvider";
import GlobalProvider from "@/components/application/GlobalProvider";
import ClientOverlays from "@/components/application/ClientOverlays";

const SITE_URL = "https://cosmoxs.com";
const BRAND_NAME = "Cosmopolitan Xccessories";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || SITE_URL),
  applicationName: BRAND_NAME,
  title: {
    default: BRAND_NAME,
    template: `%s | ${BRAND_NAME}`,
  },
  description: "Shop premium fragrances, bakhoor, oud, home accessories and curated lifestyle products at Cosmopolitan Xccessories.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: {
    icon: "/assets/images/favicon.ico",
    shortcut: "/assets/images/favicon.ico",
    apple: "/assets/images/favicon.ico",
  },
  openGraph: {
    title: BRAND_NAME,
    description: "Shop premium fragrances, bakhoor, oud, home accessories and curated lifestyle products at Cosmopolitan Xccessories.",
    url: SITE_URL,
    siteName: BRAND_NAME,
    type: "website",
  },
};

const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway", display: "swap", preload: false });
const lato = Lato({ subsets: ["latin"], variable: "--font-lato", weight: ["400", "700"], display: "swap", preload: false });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: BRAND_NAME,
    alternateName: ["Cosmopolitan Xccessories", "CosmoXS", "cosmoxs.com"],
    url: `${SITE_URL}/`,
  };

  const heroPoster = "https://res.cloudinary.com/dd62irk0g/video/upload/so_0,f_auto,q_auto,w_1280/v1784644362/cn/banner_gjksp0.jpg";

  return (
    <html lang="en" suppressHydrationWarning className={`${raleway.variable} ${lato.variable}`}>
      <head>
        <link rel="preload" as="image" href={heroPoster} fetchPriority="high" />
      </head>
      <body className="min-h-screen flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <Suspense fallback={null}><Analytics /></Suspense>
        <GlobalProvider><Providers>{children}<ClientOverlays /></Providers></GlobalProvider>
      </body>
    </html>
  );
}

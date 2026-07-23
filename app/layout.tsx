import type { Metadata } from "next";
import { Lato, Playfair_Display, Raleway } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";
import "react-toastify/dist/ReactToastify.css";

import AutoTitle from "@/components/AutoTitle";
import Analytics from "@/components/Analytics";
import Providers from "@/components/providers/ThemeProvider";
import GlobalProvider from "@/components/application/GlobalProvider";

import { ToastContainer } from "react-toastify";

export const metadata: Metadata = {
  title: {
    default: "Shop Store",
    template: "%s | Cosmopolitan Xccessories",
  },
  description: "Cosmopolitan Xccessories",
  icons: {
    icon: "/assets/images/favicon.ico",
    shortcut: "/assets/images/favicon.ico",
    apple: "/assets/images/favicon.ico",
  },
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: ["400", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${playfair.variable} ${raleway.variable} ${lato.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <AutoTitle />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>

        <GlobalProvider>
          <Providers>
            {children}
            <ToastContainer position="top-right" autoClose={3000} />
          </Providers>
        </GlobalProvider>
      </body>
    </html>
  );
}
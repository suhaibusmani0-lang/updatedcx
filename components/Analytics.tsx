"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// 💡 AGAR TUM REDUX USE KAR RAHE HO TOH INKO UNCOMMENT KAR LENA:
// import { useSelector } from "react-redux";
// import type { RootState } from "@/store/store";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-VPY34LER6S";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1559963569009412";

const PLACEHOLDERS = new Set(["", "G-DEMO", "DEMO", "REPLACE_ME"]);

const gaEnabled = !!GA_ID && !PLACEHOLDERS.has(GA_ID);
const pixelEnabled = !!META_PIXEL_ID && !PLACEHOLDERS.has(META_PIXEL_ID);

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: any[];
  }
}

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 🔥 USER TRACKING TAGS (Email & Name)
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // 👉 METHOD 1: Redux Se (Agar Analytics component Provider ke andar hai toh ise use karo)
  // const auth = useSelector((state: RootState) => state.authStore?.auth);
  // useEffect(() => {
  //   if (auth?.email) setUserEmail(auth.email);
  //   if (auth?.name) setUserName(auth.name);
  // }, [auth]);

  // 👉 METHOD 2: LocalStorage Se (Safe method, kisi bhi component mein chalega)
  useEffect(() => {
    try {
      // Apne hisaab se LocalStorage ki key change kar lena (e.g., 'user' ya 'persist:root')
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user?.email) setUserEmail(user.email);
        if (user?.name) setUserName(user.name);
      }
    } catch (error) {
      console.error("Could not fetch user data for tracking", error);
    }
  }, [pathname]);


  useEffect(() => {
    if (!pathname) return;

    const url =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // --- 1. GOOGLE ANALYTICS (GA4) ---
    if (gaEnabled && typeof window.gtag === "function") {
      const gaConfig: Record<string, string | boolean> = { page_path: url };
      
      // Email ID Tag for GA4
      if (userEmail) {
        gaConfig.user_id = userEmail;
      }
      window.gtag("config", GA_ID as string, gaConfig);
    }

    // --- 2. META PIXEL (FACEBOOK) ---
    if (pixelEnabled && typeof window.fbq === "function") {
      
      // Advanced Matching Tags (Email ID aur Name)
      if (userEmail) {
        window.fbq("init", META_PIXEL_ID as string, {
          em: userEmail.toLowerCase(),
          ...(userName && { fn: userName.toLowerCase() }) // Name Tag
        });
      } else {
        // Bina login wale users ke liye normal init
        window.fbq("init", META_PIXEL_ID as string);
      }
      
      // Hit PageView
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams, userEmail, userName]);

  return (
    <>
      {gaEnabled && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="lazyOnload"
          />
          <Script id="ga-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              // Config is handled dynamically in useEffect above to pass Email Tags
            `}
          </Script>
        </>
      )}

      {pixelEnabled && (
        <>
          <Script id="fb-pixel-init" strategy="lazyOnload">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              
              // Initialization & Tracking handled dynamically in useEffect above to pass Email/Name Tags
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
    </>
  );
}
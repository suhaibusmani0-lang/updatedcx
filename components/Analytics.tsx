"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageViewMeta } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-VPY34LER6S";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1559963569009412";
const PLACEHOLDERS = new Set(["", "G-DEMO", "DEMO", "REPLACE_ME"]);
const gaEnabled = !!GA_ID && !PLACEHOLDERS.has(GA_ID);
const pixelEnabled = !!META_PIXEL_ID && !PLACEHOLDERS.has(META_PIXEL_ID);

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
    __cosmoAnalyticsInitialized?: boolean;
    __cosmoMetaInitialized?: boolean;
  }
}

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const activate = () => setReady(true);

    // Keep analytics completely off the critical rendering path. User interaction
    // activates it immediately; passive visitors are activated after 20 seconds.
    const timeoutId = window.setTimeout(activate, 20000);
    window.addEventListener("pointerdown", activate, { once: true, passive: true });
    window.addEventListener("keydown", activate, { once: true, passive: true });
    window.addEventListener("touchstart", activate, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("keydown", activate);
      window.removeEventListener("touchstart", activate);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!ready || !pathname) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    let analyticsUserId: string | undefined;
    try {
      const rawUser = localStorage.getItem("user");
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      analyticsUserId = parsedUser?._id || parsedUser?.id || undefined;
    } catch {
      analyticsUserId = undefined;
    }
    if (gaEnabled && typeof window.gtag === "function") {
      window.gtag("config", GA_ID, {
        page_path: url,
        send_page_view: false,
        ...(analyticsUserId ? { user_id: analyticsUserId } : {}),
      });
      window.gtag("event", "page_view", {
        page_location: window.location.href,
        page_path: url,
        page_title: document.title,
      });
    }
    if (pixelEnabled && typeof window.fbq === "function") trackPageViewMeta();
  }, [ready, pathname, searchParams]);

  if (!ready) return null;

  return (
    <>
      {gaEnabled && (
        <>
          <Script
            id="google-analytics-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="lazyOnload"
          />
          <Script id="ga-init" strategy="lazyOnload">
            {`if(!window.__cosmoAnalyticsInitialized){window.__cosmoAnalyticsInitialized=true;window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false,allow_google_signals:true,allow_ad_personalization_signals:true});}`}
          </Script>
        </>
      )}
      {pixelEnabled && (
        <>
          <Script id="meta-pixel-loader" strategy="lazyOnload">
            {`if(!window.__cosmoMetaInitialized){window.__cosmoMetaInitialized=true;!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');}`}
          </Script>
          <noscript>
            <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      )}
    </>
  );
}

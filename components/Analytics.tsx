"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Google Analytics 4 + Meta (Facebook) Pixel integration.
 * Injects tracking scripts and fires page_view events on route changes.
 *
 * IDs are read from environment variables:
 *   NEXT_PUBLIC_GA_ID      – GA4 Measurement ID (e.g. G-XXXXXXXXXX)
 *   NEXT_PUBLIC_META_PIXEL_ID – Meta Pixel ID (e.g. 1234567890123456)
 *
 * If an ID is missing or set to the placeholder value, the corresponding
 * script is skipped (safe no-op).
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Placeholders to skip (so builds don't emit real events with dummy IDs)
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
    showSignInPopup?: () => void;
  }
}

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const url =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    if (gaEnabled && typeof window.gtag === "function") {
      window.gtag("config", GA_ID as string, {
        page_path: url,
      });
    }
    if (pixelEnabled && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return (
    <>
      {gaEnabled && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: true });
            `}
          </Script>
        </>
      )}

      {pixelEnabled && (
        <>
          <Script id="fb-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
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

// Backwards-compatible helpers. Pixel initialization is intentionally owned by
// components/Analytics.tsx so the same Pixel ID is never initialized twice.
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export const pageview = () => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
};

export const trackEvent = (eventName, eventData = {}) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", eventName, eventData);
  }
};

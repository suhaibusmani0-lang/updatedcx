"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false }
);

const WhatsAppButton = dynamic(
  () => import("@/components/website/WhatsAppButton"),
  { ssr: false }
);

export default function ClientOverlays() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    const activate = () => setReady(true);

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(activate, { timeout: 2500 });
    } else {
      timeoutId = setTimeout(activate, 1200);
    }

    return () => {
      if (idleId !== undefined) {
        window.cancelIdleCallback?.(idleId);
      }

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <ToastContainer />
      <WhatsAppButton />
    </>
  );
}
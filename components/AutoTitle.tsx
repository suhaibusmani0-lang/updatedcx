"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AutoTitle() {
  const pathname = usePathname();

  useEffect(() => {
    const pageName =
      pathname === "/"
        ? "Home"
        : pathname
            .split("/")
            .filter(Boolean)
            .pop()
            ?.replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

    document.title = `${pageName} | Shop Store`;
  }, [pathname]);

  return null;
}
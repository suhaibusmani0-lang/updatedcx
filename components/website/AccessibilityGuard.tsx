"use client";

import { useEffect } from "react";

function ensureButtonName(button: HTMLButtonElement) {
  if (button.hasAttribute("aria-label") || button.hasAttribute("aria-labelledby")) return;

  const text = (button.innerText || button.textContent || "").replace(/\s+/g, " ").trim();
  const title = button.getAttribute("title")?.trim();

  if (text) return;
  if (title) {
    button.setAttribute("aria-label", title);
    return;
  }

  // Icon-only controls need an accessible name for screen readers and AI agents.
  button.setAttribute("aria-label", "Button");
}

export default function AccessibilityGuard() {
  useEffect(() => {
    const scan = () => {
      document.querySelectorAll<HTMLButtonElement>("button").forEach(ensureButtonName);
    };

    scan();

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}

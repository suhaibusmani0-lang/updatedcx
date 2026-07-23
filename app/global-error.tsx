"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to browser console for debugging
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#faf7f2] px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 mb-6 rounded-full bg-[#e8d9c8] flex items-center justify-center text-3xl">
            !
          </div>
          <h1 className="text-2xl font-serif text-[#1A1A1A] mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-[#1A1A1A]/70 mb-6">
            We&apos;re having trouble loading this page. Please try again in a moment.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-lg bg-[#1A1A1A] text-white text-sm font-medium hover:bg-[#C17A56] transition-colors"
              data-testid="global-error-retry"
            >
              Try again
            </button>
            <a
              href="/"
              className="px-5 py-2.5 rounded-lg border border-[#1A1A1A]/20 text-[#1A1A1A] text-sm font-medium hover:bg-[#1A1A1A]/5 transition-colors"
              data-testid="global-error-home"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

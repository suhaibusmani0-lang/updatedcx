"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WEBSITE_HOME } from "@/routes/websiteRoutes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function EmailVerificationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = React.useState("verifying");
  const [message, setMessage] = React.useState("Verifying your email address...");

  const hasVerified = React.useRef(false);

  React.useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || "Verification failed");
        setStatus("success");
        setMessage(data.message || "Email verified successfully.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Something went wrong. Please try again.");
      });
  }, [token, email]);

  return (
    <CardContent className="space-y-4 text-center">
      {status === "success" && (
        <div className="flex justify-center">
          <Image src="/assets/images/verified.gif" alt="Verified" width={180} height={180} priority unoptimized style={{ height: "auto" }} />
        </div>
      )}
      {status === "error" && (
        <div className="flex justify-center">
          <Image src="/assets/images/verification-failed.gif" alt="Verification Failed" width={180} height={180} priority unoptimized style={{ height: "auto" }} />
        </div>
      )}
      {status === "verifying" && (
        <div className="flex justify-center">
          <Image src="/assets/images/loading.gif" alt="Loading" width={120} height={120} priority unoptimized style={{ height: "auto" }} />
        </div>
      )}
      <p className={`text-sm font-medium ${status === "success" ? "text-green-600" : status === "error" ? "text-red-600" : "text-muted-foreground"}`}>
        {message}
      </p>
      {status === "success" && (
        <Link href={WEBSITE_HOME} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Go to Home
        </Link>
      )}
    </CardContent>
  );
}

export default function EmailVerification() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Image src="/assets/images/logo-black1.png" alt="E-commerce Logo" width={180} height={90} priority style={{ height: "auto" }} />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>Confirm your email and continue to your account.</CardDescription>
        </CardHeader>
        <Suspense fallback={
          <CardContent className="text-center text-sm text-muted-foreground">Loading...</CardContent>
        }>
          <EmailVerificationContent />
        </Suspense>
      </Card>
    </div>
  );
}

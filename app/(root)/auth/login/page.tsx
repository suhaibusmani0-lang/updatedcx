"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { WEBSITE_REGISTER, WEBSITE_FORGOT_PASSWORD, WEBSITE_USER_DASHBOARD } from "@/routes/websiteRoutes";
import ButtonLoading from "@/components/application/buttonLoading";
import { showToast } from "@/lib/showToast";
import { Eye, EyeOff, Smartphone } from "lucide-react";
import OtpVarification from "@/components/application/otpvarification";
import { useDispatch } from "react-redux";
import { login } from "@/store/reducer/authReducer";
import { ADMIN_DASHBOARD } from "@/routes/adminPanelRoutes";
import { auth, isFirebaseConfigured, createFirebaseRecaptchaVerifier } from "@/lib/firebase";
import { ConfirmationResult, GoogleAuthProvider, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export const ROUTES = {
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
};

export const formSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const LoginPage = () => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const callback = searchParams.get("callback");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((result) => {
        if (result.ok && result.data) {
          dispatch(login(result.data));
          window.location.href = "/";
        }
      })
      .catch(() => {});
  }, [dispatch]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [istypePassword, setIsTypePassword] = useState(true);
  const [otpmail, setOtpMail] = useState("");
  const [error, setError] = useState("");
  const [activeMode, setActiveMode] = useState<"email" | "mobile">("email");
  const [mobilePhone, setMobilePhone] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileStep, setMobileStep] = useState<"phone" | "otp">("phone");
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const clearRecaptcha = () => {
    if (typeof window !== "undefined" && (window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (error) {
        console.warn("Failed to clear existing reCAPTCHA verifier", error);
      }
      delete (window as any).recaptchaVerifier;
    }
  };

  const resetMobileFlow = () => {
    setMobilePhone("");
    setMobileOtp("");
    setMobileStep("phone");
    setMobileError("");
    setConfirmationResult(null);
    clearRecaptcha();
  };

  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
  }, []);

  const handleResendOtp = async (email: string) => {
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Failed to resend OTP");
      showToast("success", result?.message || "OTP resent successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend OTP";
      showToast("error", message);
    }
  };

  const heandotpVarification = async (data: { otp: string }) => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpmail,
          otp: data.otp,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Invalid OTP");
      }

      showToast("success", result?.message || "OTP verified successfully.");
      const user = result?.data?.user;
      dispatch(login(user || { email: otpmail }));
      if (callback && callback.startsWith("/")) {
        router.push(callback);
      } else {
        router.push(user?.role === "admin" ? ADMIN_DASHBOARD : WEBSITE_USER_DASHBOARD);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "OTP verification failed";
      showToast("error", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const rawText = await res.text();
      const result = rawText ? JSON.parse(rawText) : null;

      if (!res.ok) {
        throw new Error(result?.message || "Login failed");
      }
      setOtpMail(data.email);
      form.reset();
      const otpMessage = result?.data?.otp
        ? `OTP sent successfully. Development code: ${result.data.otp}`
        : result?.message || "Login successful.";
      showToast("success", otpMessage);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMobileOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setMobileError("");
    setMobileLoading(true);

    try {
      if (!isFirebaseConfigured) {
        throw new Error("Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* values to your environment variables.");
      }

      const normalizedPhone = mobilePhone.trim();
      if (!normalizedPhone) {
        throw new Error("Phone number is required");
      }

      if (!auth) {
        throw new Error("Firebase auth is unavailable");
      }

      const verifier = (window as any).recaptchaVerifier || await createFirebaseRecaptchaVerifier("firebase-recaptcha-container");
      const result = await signInWithPhoneNumber(auth, normalizedPhone, verifier);
      setConfirmationResult(result);
      setMobileStep("otp");
      showToast("success", "OTP sent to your phone number");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send OTP";
      setMobileError(message);
      showToast("error", message);
    } finally {
      setMobileLoading(false);
    }
  };

  const handleVerifyMobileOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setMobileError("");
    setMobileLoading(true);

    try {
      if (!confirmationResult) {
        throw new Error("Please request a code first");
      }

      const userCredential = await confirmationResult.confirm(mobileOtp);
      const firebaseUser = userCredential.user;

      const response = await fetch("/api/auth/firebase-phone-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: firebaseUser.phoneNumber || mobilePhone,
          name: firebaseUser.displayName || mobilePhone,
          uid: firebaseUser.uid,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Unable to complete login");
      }

      dispatch(login(result?.data?.user || { phone: mobilePhone }));
      showToast("success", result?.message || "Logged in successfully");

      if (callback && callback.startsWith("/")) {
        router.push(callback);
      } else {
        router.push(WEBSITE_USER_DASHBOARD);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "OTP verification failed";
      setMobileError(message);
      showToast("error", message);
    } finally {
      setMobileLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setMobileError("");
    setGoogleLoading(true);

    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error("Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* values to your environment variables.");
      }

      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const response = await fetch("/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "Customer",
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Google login failed");
      }

      dispatch(login(data?.data?.user || { email: firebaseUser.email, name: firebaseUser.displayName || "Customer", role: "user" }));
      showToast("success", data?.message || "Logged in successfully");

      if (callback && callback.startsWith("/")) {
        router.push(callback);
      } else {
        router.push(WEBSITE_USER_DASHBOARD);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google login failed";
      const friendlyMessage = message.includes("operation-not-allowed")
        ? "Google sign-in is not enabled in your Firebase project. Please enable the Google sign-in provider in Firebase Authentication > Sign-in method."
        : message;
      setError(friendlyMessage);
      showToast("error", friendlyMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center px-4 border-none">
      <Card className="w-[650px] max-w-sm">
        {!otpmail ? (
          <>
          
            <CardHeader>
              <div className="flex justify-center mb-4">
               <div className="text-center">
                  <Link href="/" className="inline-block">
                    <span className="block w-min mx-auto sm:w-auto text-center text-base sm:text-lg font-bold uppercase">
                      Cosmopolitan Xccessories
                    </span>
                  </Link>
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">Login</h1>
                <p>Choose your preferred login method and access your account.</p>
              </div>
            </CardHeader>

            <CardContent>
              <div className="mb-4 flex rounded-full border p-1">
                <button
                  type="button"
                  className={`flex-1 rounded-full px-3 py-2 text-sm ${activeMode === "email" ? "bg-secondary text-white" : "text-muted-foreground"}`}
                  onClick={() => {
                    setActiveMode("email");
                    resetMobileFlow();
                  }}
                >
                  Email / Password
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-full px-3 py-2 text-sm ${activeMode === "mobile" ? "bg-secondary text-white" : "text-muted-foreground"}`}
                  onClick={() => {
                    setActiveMode("mobile");
                    resetMobileFlow();
                  }}
                >
                  Mobile Number
                </button>
              </div>

              {activeMode === "email" ? (
                <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="space-y-4 relative">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Email</label>
                    <input
                      type="email"
                      placeholder="Example@example.com"
                      {...form.register("email")}
                      className="w-full border p-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Password</label>
                    <div className="relative">
                      <input
                        type={istypePassword ? "password" : "text"}
                        placeholder="Password"
                        {...form.register("password")}
                        className="w-full border p-2 rounded pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setIsTypePassword(!istypePassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        {istypePassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <ButtonLoading type="submit" loading={loading} text="Login" className="cursor-pointer" />

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    <span className="text-base">G</span>
                    {googleLoading ? "Connecting..." : "Continue with Google"}
                  </button>
                </form>
              ) : (
                <form onSubmit={mobileStep === "phone" ? handleSendMobileOtp : handleVerifyMobileOtp} className="space-y-4">
                  <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    <div className="mb-2 flex items-center gap-2 font-medium text-foreground hidden">
                      <Smartphone size={16} />
                      Firebase phone login
                    </div>
                    <p className="hidden">{mobileStep === "phone" ? "Enter your phone number to receive an OTP using Firebase." : "Enter the OTP sent to your phone."}</p>
                  </div>

                  {mobileStep === "phone" ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium">Phone Number</label>
                      <input
                        type="tel"
                        value={mobilePhone}
                        onChange={(event) => setMobilePhone(event.target.value)}
                        placeholder="+1 555 123 4567"
                        className="w-full border p-2 rounded"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-sm font-medium">OTP Code</label>
                      <input
                        type="text"
                        value={mobileOtp}
                        onChange={(event) => setMobileOtp(event.target.value)}
                        placeholder="123456"
                        className="w-full border p-2 rounded"
                      />
                    </div>
                  )}

                  {mobileError && <p className="text-red-500 text-sm">{mobileError}</p>}

                  {mobileStep === "phone" && <div id="firebase-recaptcha-container" />}

                  <ButtonLoading
                    type="submit"
                    loading={mobileLoading}
                    text={mobileStep === "phone" ? "Send OTP" : "Verify OTP"}
                    className="cursor-pointer"
                  />

                  {mobileStep === "otp" && (
                    <button
                      type="button"
                      className="text-sm text-secondary underline"
                      onClick={() => {
                        setMobileStep("phone");
                        setMobileOtp("");
                        setConfirmationResult(null);
                      }}
                    >
                      Change phone number
                    </button>
                  )}
                </form>
              )}

              <div className="mt-6 text-center">
                <div className="flex justify-center items-center gap-1">
                  <p>Don&apos;t have account?</p>
                  <Link href={WEBSITE_REGISTER} className="text-secondary underline">
                    Create account!
                  </Link>
                </div>
                <div className="flex justify-center items-center gap-1 mt-2">
                  <p>Forgot password?</p>
                  <Link href={WEBSITE_FORGOT_PASSWORD} className="text-secondary underline">
                    Reset here!
                  </Link>
                </div>
              </div>
            </CardContent>
          
          </>
        ) : (
          <div className="w-[380px] max-w-sm">
            <CardHeader>
              <div className="flex justify-center mb-4">
              <div className="text-center">
                  <Link href="/" className="inline-block">
                    <span className="block w-min mx-auto sm:w-auto text-center text-base sm:text-lg md:text-xl font-bold uppercase">
                      Cosmopolitan Xccessories
                    </span>
                  </Link>
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">Please Complete OTP Verification</h1>
                <p>We have sent an OTP to your email. Please enter it to verify your account.</p>
              </div>
            </CardHeader>
            <OtpVarification email={otpmail} onSubmit={heandotpVarification} onResend={handleResendOtp} loading={loading} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;
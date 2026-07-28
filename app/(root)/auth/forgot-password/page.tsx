"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { WEBSITE_REGISTER } from "@/routes/websiteRoutes";
import ButtonLoading from "@/components/application/buttonLoading";
import OtpVarification from "@/components/application/otpvarification";
import UpdatePassword from "@/components/application/UpdatePassword";
import { showToast } from "@/lib/showToast";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type FormData = z.infer<typeof formSchema>;

function ForgetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [otpmail, setOtpMail] = useState("");
  const [error, setError] = useState("");
  const [IsotpVerify, setIsotpverify]=useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  // Send OTP
  const handleEmailVarification = async (data: FormData) => {
    setLoading(true);
    setError("");

    try {
     const res = await fetch("/api/auth/forget-password/sendotp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      const text = await res.text();

      console.log("Response:", text);
      const result = JSON.parse(text);
      if (!res.ok) {
        throw new Error(result.message || "Failed to send OTP");
      }

      setOtpMail(data.email);

      const otpMessage = result?.data?.otp
        ? `OTP sent successfully. Development code: ${result.data.otp}`
        : result.message || "OTP sent successfully";

      showToast(
        "success",
        otpMessage
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to send OTP";

      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleOtpVerification = async (data: { otp: string }) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forget-password/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: otpmail,
          otp: data.otp,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Invalid OTP");
      }

      showToast(
        "success",
        result.message || "OTP verified successfully"
      );
      setIsotpverify(true);
      // Redirect or next step here
      // router.push("/reset-password");

    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "OTP verification failed";

      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
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
                <h1 className="text-3xl font-bold mb-2">
                  Reset Your Password
                </h1>
                <p>
                  Enter your email to receive an OTP.
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={form.handleSubmit(
                  handleEmailVarification
                )}
                className="space-y-4"
              >
                <div>
                  <label className="block mb-1">
                    Email Address
                  </label>

                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    {...form.register("email")}
                    className="w-full border rounded-md p-2"
                  />

                  {form.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {
                        form.formState.errors.email
                          .message
                      }
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-red-500 text-sm">
                    {error}
                  </p>
                )}

                <ButtonLoading
                  type="submit"
                  loading={loading}
                  text="Send OTP"
                  className="w-full"
                />

                <div className="text-center text-sm">
                  Don't have an account?{" "}
                  <Link
                    href={WEBSITE_REGISTER}
                    className="text-blue-500 hover:underline"
                  >
                    Register
                  </Link>
                </div>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Image
                  src="/assets/images/logo-black1.png"
                  alt="Logo"
                  width={200}
                  height={100}
                  priority
                />
              </div>

              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">
                  OTP Verification
                </h1>

                <p>
                  We have sent an OTP to:
                  <br />
                  <strong>{otpmail}</strong>
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <>
               {!IsotpVerify
               ?
               <OtpVarification
                email={otpmail}
                onSubmit={handleOtpVerification}
                onResend={(email: string) => handleEmailVarification({ email })}
                loading={loading}
              />
                :
                <UpdatePassword email={otpmail}   />
                }
              </>
             
              
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

export default ForgetPasswordPage;
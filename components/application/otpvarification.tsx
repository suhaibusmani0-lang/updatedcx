import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ButtonLoading from "@/components/application/buttonLoading";
import { CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
  email: z.string().email("Invalid email"),
});

interface OtpVarificationProps {
  email?: string;
  onSubmit: (data: { otp: string; email: string }) => Promise<void>;
  onResend?: (email: string) => void;
  loading?: boolean;
}

const RESEND_COOLDOWN = 30;

const OtpVarification = ({ email = "", onSubmit, onResend, loading = false }: OtpVarificationProps) => {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  const form = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
      email: email || "",
    },
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      setCanResend(true);
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const handleOtpSubmit = async (data: { otp: string; email: string }) => {
    if (typeof onSubmit === "function") {
      await onSubmit({ ...data, email: email || data.email });
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    try {
      if (typeof onResend === "function") await onResend(email);
      form.setValue("otp", "");
      setSecondsLeft(RESEND_COOLDOWN);
      setCanResend(false);
    } finally {
      setResending(false);
    }
  };

  return (
    <CardContent>
      <form onSubmit={form.handleSubmit(handleOtpSubmit)} className="space-y-4 relative">
        <div className="space-y-2 text-center">
          <p className="text-sm text-gray-600">We sent a 6-digit code to</p>
          <p className="font-semibold text-gray-900">{email}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-center justify-center">Enter One-Time Password</label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={form.watch("otp")}
              onChange={(value) => form.setValue("otp", value, { shouldValidate: true })}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {form.formState.errors.otp && (
            <p className="text-red-500 text-xs text-center">{form.formState.errors.otp.message}</p>
          )}
        </div>

        {/* Resend row — hidden when onResend not provided */}
        {typeof onResend === "function" && (
        <div className="text-center text-sm text-gray-500">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary underline hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? "Sending…" : "Resend OTP"}
            </button>
          ) : (
            <span>
              Resend code in{" "}
              <span className="font-medium text-gray-800">
                0:{String(secondsLeft).padStart(2, "0")}
              </span>
            </span>
          )}
        </div>
        )}

        <ButtonLoading
          type="submit"
          loading={loading}
          text="Verify OTP"
          className="cursor-pointer"
        />
      </form>
    </CardContent>
  );
};

export default OtpVarification;

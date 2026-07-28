"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { showToast } from "@/lib/showToast";
import ButtonLoading from "@/components/application/buttonLoading";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function UpdatePassword({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forget-password/update-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: data.password }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Failed to update password");

      showToast("success", result.message || "Password updated successfully");
      router.push("/auth/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="relative">
        <label className="block mb-1">New Password</label>
        <input
          type={showPass ? "text" : "password"}
          placeholder="Enter new password"
          {...form.register("password")}
          className="w-full border rounded-md p-2 pr-10"
        />
        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-9">
          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        {form.formState.errors.password && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="block mb-1">Confirm Password</label>
        <input
          type={showPass ? "text" : "password"}
          placeholder="Confirm new password"
          {...form.register("confirmPassword")}
          className="w-full border rounded-md p-2"
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      <ButtonLoading type="submit" loading={loading} text="Update Password" className="w-full" />
    </form>
  );
}

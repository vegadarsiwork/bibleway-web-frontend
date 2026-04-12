"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAPI } from "../lib/api";

function ConfirmPasswordResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await fetchAPI("/accounts/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword }),
      });
      setMessage("Your password has been reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?message=reset_success");
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Please check your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="font-headline text-4xl text-on-surface text-center mb-2">
        Create new password
      </h1>
      <p className="text-on-surface-variant text-center mb-10">
        Enter the 6-digit code sent to <span className="text-primary font-bold">{email}</span> and your new password.
      </p>

      {error && (
        <div className="bg-red-500/10 text-red-600 p-4 rounded-xl mb-6 text-sm text-center">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-500/10 text-green-700 p-4 rounded-xl mb-6 text-sm text-center font-medium">
          {message}
        </div>
      )}

      {!message && (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
              Verification Code
            </label>
            <input
              type="text"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
              maxLength={6}
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 pr-12 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors p-1">
                <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || otpCode.length < 6}
            className="w-full bg-linear-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-sm tracking-widest uppercase shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      )}

      <div className="mt-8 text-center">
        <Link href="/login" className="text-sm font-bold text-primary hover:underline">
          Return to Login
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmPasswordResetPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <Link href="/" className="mb-12">
        <img src="/bibleway-logo.png" alt="Bibleway" className="h-12 w-auto" />
      </Link>
      
      <Suspense fallback={<div className="text-on-surface-variant">Loading...</div>}>
        <ConfirmPasswordResetForm />
      </Suspense>
    </div>
  );
}

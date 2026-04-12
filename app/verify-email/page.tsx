"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAPI } from "../lib/api";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await fetchAPI("/accounts/verify-email/", {
        method: "POST",
        body: JSON.stringify({ email, otp_code: otpCode }),
      });
      // Redirect to login with success message
      router.push("/login?registered=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed. Please check your code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError("");
    setMessage("");
    try {
      await fetchAPI("/accounts/auth/resend-otp/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage("A new verification code has been sent to your email.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="font-headline text-4xl text-on-surface text-center mb-2">
        Verify your email
      </h1>
      <p className="text-on-surface-variant text-center mb-10">
        We&apos;ve sent a 6-digit code to <span className="text-primary font-bold">{email}</span>. Please enter it below.
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

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block text-center">
            Verification Code
          </label>
          <input
            type="text"
            placeholder="000000"
            value={otpCode}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            maxLength={6}
            className="w-full bg-surface-container-high border-none rounded-xl px-4 py-6 text-center text-3xl tracking-[0.5em] focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-bold placeholder:tracking-normal placeholder:font-medium placeholder:text-lg"
          />
        </div>
        <button
          type="submit"
          disabled={loading || otpCode.length !== 6}
          className="w-full bg-linear-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-sm tracking-widest uppercase shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify Account"}
        </button>
      </form>

      <div className="mt-10 text-center">
        <p className="text-sm text-on-surface-variant mb-2">
          Didn&apos;t receive the code?
        </p>
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-primary font-bold hover:underline disabled:opacity-50"
        >
          {resending ? "Sending..." : "Resend Code"}
        </button>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/login" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
          Return to Login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <Link href="/" className="mb-12">
        <img src="/bibleway-logo.png" alt="Bibleway" className="h-12 w-auto" />
      </Link>
      
      <Suspense fallback={<div className="text-on-surface-variant">Loading...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}

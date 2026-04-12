"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "../lib/api";
import { useTranslation } from "../lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await fetchAPI("/accounts/password-reset/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      // Redirect to confirm reset page
      router.push(`/confirm-password-reset?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <Link href="/" className="mb-12">
        <img src="/bibleway-logo.png" alt="Bibleway" className="h-12 w-auto" />
      </Link>

      <div className="w-full max-w-md">
        <h1 className="font-headline text-4xl text-on-surface text-center mb-2">
          Reset password
        </h1>
        <p className="text-on-surface-variant text-center mb-10">
          Enter your email and we&apos;ll send you instructions to reset your password.
        </p>

        {message && (
          <div className="bg-green-500/10 text-green-700 p-4 rounded-xl mb-6 text-sm text-center font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 text-red-600 p-4 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {!message && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
                Email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-sm tracking-widest uppercase shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center flex flex-col space-y-4">
          <Link
            href="/login"
            className="text-sm font-bold text-primary hover:underline"
          >
            Return to Log in
          </Link>
          <Link
            href="/register"
            className="text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Need an account? Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

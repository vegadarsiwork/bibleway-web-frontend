"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAPI } from "../lib/api";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useTranslation } from "../lib/i18n";

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const resetSuccess = searchParams.get("message") === "reset_success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetchAPI("/accounts/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      const tokenData = response.data || response;
      const accessToken = tokenData.access || tokenData.access_token;
      const refreshToken = tokenData.refresh || tokenData.refresh_token;
      if (accessToken) {
        localStorage.setItem("access_token", accessToken);
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }
        if (tokenData.user_id) {
          localStorage.setItem("user_id", tokenData.user_id);
        }

        // Fetch and store user profile (matches mobile flow)
        try {
          const profileRes = await fetchAPI("/accounts/profile/");
          const profile = profileRes?.data || profileRes;
          if (profile) {
            localStorage.setItem("user", JSON.stringify(profile));
            if (profile.id) localStorage.setItem("user_id", profile.id);
          }
        } catch {
          // Profile fetch is non-blocking — continue to home
        }
      }

      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password.";
      // Django's default SimpleJWT response for invalid creds or inactive (unverified) users
      if (
        msg.toLowerCase().includes("no active account found") ||
        msg.toLowerCase().includes("verify") ||
        msg.toLowerCase().includes("not verified")
      ) {
        setError("Invalid email/password, or email not verified. Please check your credentials or inbox.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="font-headline text-4xl text-on-surface text-center mb-2">
        {t("auth.welcomeBack")}
      </h1>
      <p className="text-on-surface-variant text-center mb-10">
        {t("auth.signInSubtitle")}
      </p>

      {registered && (
        <div className="bg-green-500/10 text-green-700 p-4 rounded-xl mb-6 text-sm text-center font-medium">
          {t("auth.accountVerified")}
        </div>
      )}

      {resetSuccess && (
        <div className="bg-green-500/10 text-green-700 p-4 rounded-xl mb-6 text-sm text-center font-medium">
          {t("auth.resetSuccess")}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 text-red-600 p-4 rounded-xl mb-6 text-sm text-center">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">
            {t("auth.email")}
          </label>
          <input
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">
              {t("auth.password")}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline font-medium"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 pr-12 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-linear-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-sm tracking-widest uppercase shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </button>
      </form>

      <GoogleSignInButton />

      <p className="mt-10 text-sm text-on-surface-variant text-center">
        {t("auth.noAccount")}{" "}
        <Link
          href="/register"
          className="text-primary font-bold hover:underline"
        >
          {t("auth.signUpLink")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <Link href="/" className="mb-12">
        <img src="/bibleway-logo.png" alt="Bibleway" className="h-12 w-auto" />
      </Link>
      
      <Suspense fallback={<div className="text-on-surface-variant">{t("common.loading")}</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/confirm-password-reset",
  "/verify-email",
  "/complete-profile",
  "/landing",
  "/launch",
];

// Pages that an already-authenticated user should NOT see — they get bounced home.
const GUEST_ONLY_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/confirm-password-reset",
  "/landing",
];

function isPublicPath(pathname: string): boolean {
  // Exact matches
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Landing page — for now redirect behavior handled below
  if (pathname === "/") return false;
  // Gated content page: /read/[bibleId]/[chapterId]
  if (/^\/read\/[^/]+\/[^/]+$/.test(pathname)) return true;
  return false;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setHasToken(!!token && token !== "undefined" && token !== "null");
  }, [pathname]);

  // Unauthenticated on home page — redirect to landing
  useEffect(() => {
    if (hasToken === false && pathname === "/") {
      router.replace("/landing");
    }
  }, [hasToken, pathname, router]);

  // Authenticated on a guest-only page (login / register / etc.) — bounce home
  useEffect(() => {
    if (hasToken === true && GUEST_ONLY_PATHS.includes(pathname)) {
      router.replace("/");
    }
  }, [hasToken, pathname, router]);

  // Still checking — show nothing to prevent flash of authenticated content
  if (hasToken === null) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  // Redirect in progress for home page
  if (hasToken === false && pathname === "/") return null;

  // Redirect in progress for guest-only pages
  if (hasToken === true && GUEST_ONLY_PATHS.includes(pathname)) return null;

  // Authenticated or on a public path — render normally
  if (hasToken || isPublicPath(pathname)) return <>{children}</>;

  // Unauthenticated on a protected page — show blurred overlay
  return (
    <div className="relative min-h-screen">
      {/* Page content rendered but blurred */}
      <div className="filter blur-md brightness-75 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Full-screen overlay */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
        <div className="bg-surface-container-lowest rounded-2xl p-10 max-w-md w-full flex flex-col items-center text-center border border-outline-variant/10 shadow-2xl">
          {/* Lock icon */}
          <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mb-6">
            <span
              className="material-symbols-outlined text-primary text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lock
            </span>
          </div>

          <h2 className="font-headline text-3xl text-on-surface mb-3">
            The journey continues
          </h2>
          <p className="text-on-surface-variant mb-8 text-lg leading-relaxed">
            Sign in to access all of Bibleway&apos;s features &mdash; Bible reading, community, and more.
          </p>

          <div className="w-full space-y-4">
            {/* Continue with Email */}
            <Link
              href="/register"
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-br from-primary to-primary-container rounded-full text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-medium"
            >
              <span className="material-symbols-outlined">mail</span>
              <span>Continue with Email</span>
            </Link>
          </div>

          <p className="mt-8 text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-bold hover:underline"
            >
              Log in
            </Link>
          </p>

          <Link
            href="/landing"
            className="mt-4 text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

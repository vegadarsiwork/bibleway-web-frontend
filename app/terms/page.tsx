"use client";

import { useRouter } from "next/navigation";
import TermsBody from "./TermsBody";

export default function TermsPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky top bar */}
      <header className="border-b border-outline-variant/15 bg-surface/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>
          <h1 className="font-headline text-lg sm:text-xl text-on-surface flex-1">
            Terms &amp; Conditions
          </h1>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <TermsBody />
      </article>
    </div>
  );
}

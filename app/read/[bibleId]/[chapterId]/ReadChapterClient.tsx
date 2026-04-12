"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import GoogleSignInButton from "../../../components/GoogleSignInButton";
import Footer from "../../../components/Footer";
import { useTheme } from "../../../lib/ThemeContext";
import { useToast } from "../../../components/Toast";
import { sanitizeHTML } from "../../../lib/sanitize";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all"
      title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="material-symbols-outlined text-[20px]">
        {resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api-bibleway.up.railway.app/api/v1";

interface ChapterData {
  id: string;
  bible_id: string;
  reference: string;
  content: string;
  bible_name?: string;
  book_name?: string;
  number?: string;
  message?: string;
}

interface BibleVersion {
  id: string;
  name: string;
  nameLocal?: string;
  language?: { name: string; nameLocal?: string };
  description?: string;
  abbreviation?: string;
  abbreviationLocal?: string;
}

/* ---- Bible Showcase Carousel ---- */
function BibleShowcase() {
  const [bibles, setBibles] = useState<BibleVersion[]>([]);

  useEffect(() => {
    async function fetchBibles() {
      try {
        const res = await fetch(`${API_BASE_URL}/bible/api-bible/bibles/`);
        if (!res.ok) return;
        const json = await res.json();
        const list = json?.data || json?.results || json || [];
        setBibles(Array.isArray(list) ? list : []);
      } catch {
        /* silent */
      }
    }
    fetchBibles();
  }, []);

  if (bibles.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...bibles, ...bibles, ...bibles];

  return (
    <div className="w-full overflow-hidden py-6">
      <p className="text-center text-xs font-label uppercase tracking-widest text-on-surface-variant/50 mb-4">
        Available Bible versions
      </p>
      <div className="relative">
        <div
          className="flex gap-4 animate-bible-scroll"
          style={{ width: `${items.length * 220}px` }}
        >
          {items.map((bible, i) => (
            <div
              key={`${bible.id}-${i}`}
              className="flex-shrink-0 w-[200px] bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center mb-3">
                <span
                  className="material-symbols-outlined text-primary text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  menu_book
                </span>
              </div>
              <p className="font-semibold text-on-surface text-sm line-clamp-2 mb-1">
                {bible.nameLocal || bible.name || bible.abbreviation || "Bible"}
              </p>
              <p className="text-xs text-on-surface-variant">
                {bible.language?.nameLocal || bible.language?.name || ""}
              </p>
              {bible.abbreviationLocal && (
                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">
                  {bible.abbreviationLocal}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes bibleScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-bible-scroll {
          animation: bibleScroll 20s linear infinite;
        }
        .animate-bible-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

export default function ReadChapterClient({
  bibleId,
  chapterId,
}: {
  bibleId: string;
  chapterId: string;
}) {
  const { showToast } = useToast();
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;
      const hasToken = !!token && token !== "undefined" && token !== "null";
      setIsAuthenticated(hasToken);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (hasToken) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const url = bibleId === "study"
          ? `${API_BASE_URL}/study/pages/${chapterId}/`
          : `${API_BASE_URL}/bible/api-bible/bibles/${bibleId}/chapters/${chapterId}?content-type=html`;

        const res = await fetch(url, { headers });

        if (!res.ok) {
          throw new Error(`Failed to load chapter (${res.status})`);
        }

        const json = await res.json();
        const data = json?.data || json;

        // Check if this is a preview response
        const previewMessage = json?.message || data?.message || "";
        const isPreviewResponse =
          previewMessage.toLowerCase().includes("preview") ||
          previewMessage.toLowerCase().includes("sign in");

        setIsPreview(isPreviewResponse);
        setChapter({
          id: data.id || chapterId,
          bible_id: data.bibleId || bibleId,
          reference: data.reference || data.title || chapterId,
          content: data.content || "",
          bible_name: data.bible_name || data.bibleName || (bibleId === "study" ? "Bible Study" : ""),
          book_name: data.book_name || data.bookName || (bibleId === "study" ? "Study Module" : ""),
          number: data.number || "",
          message: previewMessage,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [bibleId, chapterId]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!chapter) {
    return <ErrorState message="Chapter not found." />;
  }

  return (
    <>
      {/* Minimal top navigation — no sidebar, no bottom nav */}
      <nav className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 border-b border-outline-variant/10">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <Link href={isAuthenticated ? "/" : "/login"} className="block">
            <img
              src="/bibleway-logo.png"
              alt="Bibleway"
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link
                href="/bible"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg">menu_book</span>
                <span className="hidden sm:inline">Bible Reader</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/landing"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">home</span>
                  <span className="hidden sm:inline">Home</span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center px-5 py-2 text-sm font-semibold text-primary border border-primary/30 rounded-full hover:bg-primary/5 transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="relative min-h-screen">
        {/* Article content */}
        <article className="max-w-3xl mx-auto px-6 pt-16 pb-12">
          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <span className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                Scripture
              </span>
              {chapter.bible_name && (
                <span className="text-on-surface-variant text-sm tracking-wide">
                  {chapter.bible_name}
                </span>
              )}
            </div>

            <h1 className="font-headline text-5xl md:text-6xl text-on-surface leading-tight mb-6 -tracking-[0.02em]">
              {chapter.reference}
            </h1>

            {chapter.bible_name && (
              <p className="text-on-surface-variant text-lg serif-italic">
                {chapter.bible_name}
              </p>
            )}

            <div className="flex items-center space-x-4 mt-8">
              <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-primary text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_stories
                </span>
              </div>
              <div>
                <p className="font-semibold text-on-surface">
                  {chapter.book_name || "Holy Bible"}
                </p>
                <p className="text-on-surface-variant text-sm">
                  Chapter {chapter.number || ""}
                </p>
              </div>
            </div>
          </header>

          {/* Divider */}
          <div className="w-16 h-px bg-primary/30 mb-12" />

          {/* Content area — show all content the backend sends, no frontend truncation */}
          <div
            className={`relative ${isPreview ? "pb-0" : "pb-24"}`}
          >
            <div
              className={`prose prose-stone prose-lg max-w-none leading-[1.85] text-[1.125rem]
                ${bibleId === "study"
                  ? "[&>p]:mb-5 [&>p]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-6 [&_blockquote]:py-3 [&_blockquote]:my-6 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_h1]:text-3xl [&_h1]:font-headline [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-headline [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-headline [&_h3]:mt-6 [&_h3]:mb-3 [&_ul]:pl-8 [&_ul]:space-y-2 [&_ol]:pl-8 [&_ol]:space-y-2 [&_strong]:text-on-surface [&_strong]:font-bold [&_em]:italic text-on-surface-variant"
                  : "text-on-surface [&_p]:mb-6 [&_p]:text-on-surface/90 [&_span.v]:text-primary/60 [&_span.v]:text-xs [&_span.v]:font-bold [&_span.v]:align-super [&_span.v]:mr-1 [&_h3]:text-2xl [&_h3]:font-headline [&_h3]:mt-8 [&_h3]:mb-4 [&_h4]:text-xl [&_h4]:font-headline [&_h4]:mt-6 [&_h4]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-tertiary-fixed-dim [&_blockquote]:pl-6 [&_blockquote]:my-6 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-lg [&_blockquote]:italic"
                }`}
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(
                  bibleId === "study" && typeof window !== "undefined"
                    ? (require("marked").marked(chapter.content) || "")
                    : chapter.content
                ),
              }}
            />

            {/* Gradient fade overlay for preview mode */}
            {isPreview && (
              <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-surface via-surface/95 to-transparent pointer-events-none" />
            )}
          </div>
        </article>

        {/* Gated sign-up CTA */}
        {isPreview && (
          <div className="relative z-10 -mt-8 pb-12">
            {/* Bible showcase carousel */}
            <div className="max-w-3xl mx-auto px-6 mb-8">
              <BibleShowcase />
            </div>

            <div className="max-w-xl mx-auto px-6">
              <div className="bg-surface-container-lowest rounded-2xl p-10 editorial-shadow flex flex-col items-center text-center border border-outline-variant/10">
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
                <p className="text-on-surface-variant mb-2 text-lg">
                  Create an account to read the full chapter.
                </p>
                <p className="text-on-surface-variant/70 mb-8 text-sm">
                  Join a community of members exploring the Bible together.
                </p>

                <div className="w-full space-y-0">
                  {/* Email sign-up button */}
                  <Link
                    href="/register"
                    className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-br from-primary to-primary-container rounded-full text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    <span className="material-symbols-outlined">mail</span>
                    <span className="font-medium">Continue with Email</span>
                  </Link>

                  {/* Google sign-in */}
                  <GoogleSignInButton />
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
              </div>
            </div>
          </div>
        )}

        {/* Full content: share button row */}
        {!isPreview && !loading && chapter && (
          <div className="max-w-3xl mx-auto px-6 pb-16">
            <div className="flex items-center justify-between pt-8 border-t border-outline-variant/10">
              <Link
                href="/bible"
                className="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
                Back to Bible
              </Link>
              <button
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: chapter.reference,
                        url: window.location.href,
                      });
                    } catch { /* user cancelled */ }
                  } else {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast("success", "Link Copied", "Link copied to clipboard!");
                  }
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  share
                </span>
                Share
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-30 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-tertiary-fixed/10 rounded-full blur-[120px]" />
      </div>

      <Footer />
    </>
  );
}

/* --- Loading skeleton --- */
function LoadingSkeleton() {
  return (
    <>
      <nav className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 border-b border-outline-variant/10">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="h-8 w-28 rounded bg-surface-container-high animate-pulse" />
          <div className="h-8 w-20 rounded-full bg-surface-container-high animate-pulse" />
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <div className="mb-12 space-y-4">
          <div className="h-4 w-24 rounded bg-surface-container-high animate-pulse" />
          <div className="h-14 w-3/4 rounded bg-surface-container-high animate-pulse" />
          <div className="h-5 w-48 rounded bg-surface-container-high animate-pulse" />
          <div className="flex items-center space-x-4 mt-8">
            <div className="w-12 h-12 rounded-full bg-surface-container-high animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-surface-container-high animate-pulse" />
              <div className="h-3 w-20 rounded bg-surface-container-high animate-pulse" />
            </div>
          </div>
        </div>
        <div className="w-16 h-px bg-surface-container-high mb-12" />
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-surface-container-high animate-pulse"
              style={{ width: `${85 + Math.random() * 15}%` }}
            />
          ))}
        </div>
      </main>
    </>
  );
}

/* --- Error state --- */
function ErrorState({ message }: { message: string }) {
  return (
    <>
      <nav className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 border-b border-outline-variant/10">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <Link href="/login" className="block">
            <img
              src="/bibleway-logo.png"
              alt="Bibleway"
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-24 text-center">
        <span
          className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-6 block"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          error
        </span>
        <h1 className="font-headline text-3xl text-on-surface mb-4">
          Unable to load chapter
        </h1>
        <p className="text-on-surface-variant mb-8">{message}</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-medium hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">login</span>
          Sign In
        </Link>
      </main>
    </>
  );
}

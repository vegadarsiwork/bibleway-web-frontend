"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import MainLayout from "./components/MainLayout";
import { fetchAPI } from "./lib/api";
import Shimmer from "./components/Shimmer";
import FeedCard from "./components/FeedCard";
import PostingModal from "./components/PostingModal";
import RecommendedPeople from "./components/RecommendedPeople";
import { useTranslation } from "./lib/i18n";
import VerseOnboarding from "./components/VerseOnboarding";
import VerseShareDropdown from "./components/VerseShareCard";
import { useToast } from "./components/Toast";
import { REACTIONS, VERSE_BACKGROUNDS } from "./lib/constants";
import { mapFeedItem, FeedItem } from "./lib/mapFeedItem";
import type { Post, Prayer } from "./types";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"post" | "prayer">("post");
  const [feedPosts, setFeedPosts] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [verseData, setVerseData] = useState<{ text: string; reference: string } | null>(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Verse onboarding
  const [showVerseOnboarding, setShowVerseOnboarding] = useState(false);
  const [showVerseShare, setShowVerseShare] = useState(false);
  const verseShareRef = useRef<HTMLDivElement>(null);

  // UI State
  const [openReactionId, setOpenReactionId] = useState<string | null>(null);
  const [animatingReaction, setAnimatingReaction] = useState<{ postId: string; emoji: string } | null>(null);
  const [showPostingModal, setShowPostingModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: string; id: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportCategory, setReportCategory] = useState("inappropriate");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const { showToast: showSystemToast } = useToast();

  // Reaction debounce - prevent rapid-fire clicks
  const reactingPosts = useRef<Set<string>>(new Set());

  function showToast(msg: string) {
    showSystemToast("info", "", msg);
  }

  // Infinite scroll state
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);


  // View tracking
  const viewedPosts = useRef<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Verse navigation
  const [verseDate, setVerseDate] = useState<string>("");
  const [today, setToday] = useState<string>("");

  const { t } = useTranslation();
  const reactionRef = useRef<HTMLDivElement>(null);
  const [bgIndex, setBgIndex] = useState(0);
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    setVerseDate(dateStr);
    setToday(dateStr);
    setBgIndex(now.getDay() % VERSE_BACKGROUNDS.length);
  }, []);
  const currentBg = VERSE_BACKGROUNDS[bgIndex];

  // Close reaction picker + verse share on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) {
        setOpenReactionId(null);
      }
      if (verseShareRef.current && !verseShareRef.current.contains(e.target as Node)) {
        setShowVerseShare(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadFeed() {
    setLoading(true);
    setFeedError(null);
    try {
      const [postsRes, prayersRes] = await Promise.all([
        fetchAPI("/social/posts/").catch(() => null),
        fetchAPI("/social/prayers/").catch(() => null)
      ]);

      const posts = (postsRes?.data?.results ?? postsRes?.results ?? []).map((p: Post) => mapFeedItem(p, "post"));
      const prayers = (prayersRes?.data?.results ?? prayersRes?.results ?? []).map((p: Prayer) => mapFeedItem(p, "prayer"));

      // Track pagination cursor from posts response
      const nextUrl = postsRes?.data?.next ?? postsRes?.next ?? null;
      setNextPageUrl(nextUrl);

      setFeedPosts([...posts, ...prayers].sort((a, b) =>
        new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
      ));
    } catch {
      setFeedError("Failed to load feed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    setIsLoggedIn(!!token);
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("user_id");
      if (storedId) setCurrentUserId(storedId);
    }

    async function loadInitialData() {
      try {
        const verseRes = await fetchAPI("/verse-of-day/today/").catch(() => null);
        const verse = verseRes?.data;
        if (verse?.verse_text) {
          setVerseData({ text: `"${verse.verse_text}"`, reference: `\u2014 ${verse.bible_reference}` });
          // Check if onboarding should show (first visit today)
          const today = new Date().toISOString().split("T")[0];
          const lastSeen = localStorage.getItem("verse_onboarding_date");
          if (lastSeen !== today) {
            setShowVerseOnboarding(true);
            localStorage.setItem("verse_onboarding_date", today);
          }
        }
      } catch { /* verse fetch failed */ } finally {
        setVerseLoading(false);
      }

      if (typeof window !== "undefined") {
        const dTab = localStorage.getItem("draft_tab");
        if (dTab === "post" || dTab === "prayer") setActiveTab(dTab);
      }
      await loadFeed();
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("draft_tab", activeTab);
  }, [activeTab]);

  const displayedPosts = feedPosts.filter((post) => post.type === activeTab);

  async function handleReact(postId: string, postType: string, emojiType: string) {
    // Prevent rapid-fire clicks while a reaction is in-flight
    if (reactingPosts.current.has(postId)) return;
    reactingPosts.current.add(postId);

    const emoji = REACTIONS.find(r => r.type === emojiType)?.emoji || "\u2764\uFE0F";
    setAnimatingReaction({ postId, emoji });
    setTimeout(() => setAnimatingReaction(null), 700);
    setOpenReactionId(null);

    // Optimistic update: apply immediately, revert on error
    const currentPost = feedPosts.find(p => p.id === postId);
    const countKey = postType === "post" ? "likes" : "prayers";
    const isRemoving = currentPost?.userReaction === emojiType;
    setFeedPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        [countKey]: isRemoving ? Math.max(0, (p[countKey] || 0) - 1) : (p[countKey] || 0) + (p.userReaction ? 0 : 1),
        userReaction: isRemoving ? null : emojiType,
      };
    }));

    try {
      const endpoint = postType === "post" ? `/social/posts/${postId}/react/` : `/social/prayers/${postId}/react/`;
      const res = await fetchAPI(endpoint, { method: "POST", body: JSON.stringify({ emoji_type: emojiType }) });
      // Sync with server truth
      const wasRemoved = res?.message === "Reaction removed.";
      const serverCount = res?.data?.reaction_count;
      setFeedPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          [countKey]: serverCount !== undefined ? serverCount : p[countKey],
          userReaction: wasRemoved ? null : emojiType,
        };
      }));
    } catch (err: unknown) {
      // Revert optimistic update on error
      if (currentPost) {
        setFeedPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, [countKey]: currentPost[countKey], userReaction: currentPost.userReaction }));
      }
      if ((err as Error)?.message?.includes("token")) showSystemToast("error", "Session Expired", "Session expired. Please log in again.");
    } finally {
      reactingPosts.current.delete(postId);
    }
  }

  async function handleShare(postId: string, postType: string) {
    const fallbackUrl = `${window.location.origin}/${postType === "prayer" ? "prayer" : "post"}/${postId}`;
    try {
      const endpoint = postType === "post" ? `/social/posts/${postId}/share/` : `/social/prayers/${postId}/share/`;
      const res = await fetchAPI(endpoint).catch(() => null);
      await navigator.clipboard.writeText(res?.data?.url || res?.url || fallbackUrl);
    } catch {
      await navigator.clipboard.writeText(fallbackUrl).catch(() => { prompt("Copy this link:", fallbackUrl); });
    }
    showToast(t("feed.linkCopied"));
  }

  async function handleReport() {
    if (!reportTarget || !reportCategory || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      await fetchAPI("/social/reports/", {
        method: "POST",
        body: JSON.stringify({
          content_type_model: reportTarget.type,
          object_id: reportTarget.id,
          reason: reportCategory,
          description: reportReason.trim(),
        }),
      });
      setReportTarget(null);
      setReportReason("");
      setReportCategory("inappropriate");
      showToast("Report submitted. Thank you.");
    } catch {
      showToast("Failed to submit report. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
  }

  async function navigateVerse(direction: -1 | 1) {
    const d = new Date(verseDate);
    d.setDate(d.getDate() + direction);
    const newDate = d.toISOString().split("T")[0];
    if (newDate > today) return;
    setVerseDate(newDate);
    setVerseLoading(true);
    try {
      const res = await fetchAPI(`/verse-of-day/${newDate}/`);
      const verse = res?.data;
      if (verse?.verse_text) {
        setVerseData({ text: `"${verse.verse_text}"`, reference: `\u2014 ${verse.bible_reference}` });
      } else {
        setVerseData(null);
      }
    } catch {
      setVerseData(null);
    } finally {
      setVerseLoading(false);
    }
  }

  // Infinite scroll: load next page
  const loadMorePosts = useCallback(async () => {
    if (!nextPageUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const urlObj = new URL(nextPageUrl);
      const params = urlObj.search;
      const endpoint = `/social/posts/${params}`;
      const res = await fetchAPI(endpoint);

      const newPosts = (res?.data?.results ?? res?.results ?? []).map((p: Post) => mapFeedItem(p, "post"));
      const newNextUrl = res?.data?.next ?? res?.next ?? null;
      setNextPageUrl(newNextUrl);
      setFeedPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const unique = newPosts.filter((p: FeedItem) => !existingIds.has(p.id));
        return [...prev, ...unique];
      });
    } catch { /* failed to load more */ } finally {
      setLoadingMore(false);
    }
  }, [nextPageUrl, loadingMore]);

  // IntersectionObserver for infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const scrollObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextPageUrl && !loadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );
    scrollObserver.observe(sentinel);
    return () => scrollObserver.disconnect();
  }, [nextPageUrl, loadingMore, loadMorePosts]);

  const trackView = useCallback((postId: string, postType: string) => {
    if (viewedPosts.current.has(postId)) return;
    viewedPosts.current.add(postId);
    fetchAPI("/analytics/views/", { method: "POST", body: JSON.stringify({ content_type: postType, object_id: postId }) }).catch(() => {});
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          if (el.dataset.postId && el.dataset.postType) trackView(el.dataset.postId, el.dataset.postType);
        }
      });
    }, { threshold: 0.5 });
    return () => observerRef.current?.disconnect();
  }, [trackView]);

  useEffect(() => {
    if (!observerRef.current || loading) return;
    const articles = document.querySelectorAll("[data-post-id]");
    articles.forEach((el) => observerRef.current?.observe(el));
    return () => articles.forEach((el) => observerRef.current?.unobserve(el));
  }, [feedPosts, loading, activeTab]);

  async function handleDelete(id: string, type: string) {
    if (!confirm("Are you sure you want to delete this?")) return;
    try {
      await fetchAPI(type === "post" ? `/social/posts/${id}/` : `/social/prayers/${id}/`, { method: "DELETE" });
      setFeedPosts(prev => prev.filter(p => p.id !== id));
    } catch { /* delete failed */ }
  }

  const ShimmerPost = () => (
    <div className="bg-surface-container-lowest rounded-xl p-8 editorial-shadow">
      <div className="flex items-center space-x-4 mb-6"><Shimmer className="w-12 h-12 rounded-full" /><div className="space-y-2"><Shimmer className="h-4 w-32" /><Shimmer className="h-3 w-16" /></div></div>
      <div className="space-y-3 mb-6"><Shimmer className="h-4 w-full" /><Shimmer className="h-4 w-5/6" /><Shimmer className="h-4 w-4/6" /></div>
      <div className="h-8 w-full border-t border-outline-variant/10 pt-4 flex gap-6"><Shimmer className="h-6 w-12" /><Shimmer className="h-6 w-12" /></div>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col xl:flex-row gap-8 xl:gap-12">
        <section className="flex-1 space-y-12">
          {/* Verse Header */}
          <div className="relative overflow-hidden rounded-xl bg-primary-container text-white p-5 sm:p-8 md:p-12 editorial-shadow min-h-[220px] sm:min-h-[300px] flex items-center" style={{ backgroundImage: `url('/${currentBg}')`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="relative z-10 w-full">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block text-[10px] font-label uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full tracking-widest">{verseDate === today ? t("feed.verseOfDay") : verseDate}</span>
                <div className="flex gap-2">
                  <button onClick={() => navigateVerse(-1)} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                  <button onClick={() => navigateVerse(1)} disabled={verseDate >= today} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-30"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
              </div>
              {verseLoading ? (
                <>
                  <div className="h-12 w-3/4 bg-white/10 rounded-lg mb-4 animate-pulse" />
                  <div className="h-12 w-1/2 bg-white/10 rounded-lg mb-4 animate-pulse" />
                  <div className="h-5 w-40 bg-white/10 rounded-lg animate-pulse" />
                </>
              ) : verseData ? (
                <>
                  <blockquote className="text-2xl sm:text-4xl md:text-5xl font-headline leading-tight mb-4 max-w-3xl">{verseData.text}</blockquote>
                  <cite className="text-base text-white/80 font-body">{verseData.reference}</cite>
                  {/* Share + Replay buttons */}
                  <div className="flex items-center gap-3 mt-6">
                    <div className="relative" ref={verseShareRef}>
                      <button
                        onClick={() => setShowVerseShare(!showVerseShare)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/25 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">share</span>
                        Share
                      </button>
                      {showVerseShare && (
                        <div className="absolute bottom-full left-0 mb-2">
                          <VerseShareDropdown
                            verseText={verseData.text}
                            verseReference={verseData.reference}
                            onClose={() => setShowVerseShare(false)}
                            onToast={showToast}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowVerseOnboarding(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/25 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">replay</span>
                      Replay
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xl text-white/60 font-headline italic">No verse available for this day.</p>
              )}
            </div>
          </div>

          {/* Feed Tabs */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center justify-center gap-6 sm:gap-10 flex-1 md:flex-none">
              <button onClick={() => setActiveTab("post")} className={`pb-2 border-b-2 transition-all font-medium tracking-wide ${activeTab === "post" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary"}`}>{t("feed.posts")}</button>
              <button onClick={() => setActiveTab("prayer")} className={`pb-2 border-b-2 transition-all font-medium tracking-wide ${activeTab === "prayer" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary"}`}>{t("feed.prayers")}</button>
            </div>
            {isLoggedIn && (
              <button onClick={() => setShowPostingModal(true)} className="hidden md:flex bg-primary text-on-primary px-6 py-2.5 rounded-xl font-semibold text-sm items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 shrink-0">
                <span className="material-symbols-outlined text-lg">add</span>
                {activeTab === "post" ? t("feed.createPost") : t("feed.createPrayer")}
              </button>
            )}
          </div>

          {/* Feed */}
          <div className="space-y-8 stagger-children">
            {feedError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center">
                {feedError} <button onClick={loadFeed} className="font-bold underline ml-2">Retry</button>
              </div>
            )}
            {loading ? (<><ShimmerPost /><ShimmerPost /><ShimmerPost /></>) : displayedPosts.length > 0 ? (
              displayedPosts.map((post) => (
                <FeedCard key={post.id} post={post} currentUserId={currentUserId} onReact={handleReact} onDelete={handleDelete} onShare={handleShare} onReport={(type, id) => setReportTarget({ type, id })} animatingReaction={animatingReaction} openReactionId={openReactionId} setOpenReactionId={setOpenReactionId} reactionRef={reactionRef} />
              ))
            ) : (
              <div className="text-center py-20 bg-surface-container-lowest rounded-xl border border-dashed text-on-surface-variant">{activeTab === "post" ? t("feed.noPostsYet") : t("feed.noPrayersYet")}</div>
            )}
            {/* Infinite scroll sentinel */}
            {activeTab === "post" && (
              <>
                <div ref={sentinelRef} className="h-4" />
                {loadingMore && (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="hidden xl:block w-80 space-y-8">
          {/* Trending Posts */}
          <div className="bg-surface-container-lowest rounded-xl p-6 editorial-shadow">
            <h3 className="font-headline text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">trending_up</span>
              Trending
            </h3>
            <div className="space-y-3">
              {feedPosts.filter(p => p.type === "post").sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3).map((p, i) => (
                <Link href={`/post/${p.id}`} key={p.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-container-low transition-all group">
                  <span className="text-xs font-bold text-primary/40 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface line-clamp-2 group-hover:text-primary transition-colors">{p.content}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{p.author} &middot; {p.likes || 0} {REACTIONS[0].emoji}</p>
                  </div>
                </Link>
              ))}
              {feedPosts.filter(p => p.type === "post").length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-2">{t("common.empty")}</p>
              )}
            </div>
          </div>

          {/* Recommended People */}
          {isLoggedIn && <RecommendedPeople />}

          {/* Prayer Wall */}
          <div className="bg-surface-container-lowest rounded-xl p-6 editorial-shadow">
            <h3 className="font-headline text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">folded_hands</span>
              {t("feed.prayers")}
            </h3>
            <div className="space-y-3">
              {feedPosts.filter(p => p.type === "prayer").slice(0, 3).map((p) => (
                <Link href={`/prayer/${p.id}`} key={p.id} className="block p-3 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-low transition-all group">
                  <p className="text-sm font-headline text-on-surface group-hover:text-primary transition-colors line-clamp-1">{p.title || "Prayer"}</p>
                  <p className="text-xs text-on-surface-variant italic line-clamp-2 mt-1">{p.content}</p>
                  <p className="text-xs text-on-surface-variant/60 mt-2">{p.author}</p>
                </Link>
              ))}
              {feedPosts.filter(p => p.type === "prayer").length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-2">{t("common.empty")}</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-surface-container-lowest rounded-xl p-6 editorial-shadow">
            <div className="space-y-1">
              <Link href="/bible" className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all text-sm font-medium">
                <span className="material-symbols-outlined text-lg">menu_book</span> {t("bible.bible")}
              </Link>
              <Link href="/shop" className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all text-sm font-medium">
                <span className="material-symbols-outlined text-lg">shopping_bag</span> {t("shop.shop")}
              </Link>
              <Link href="/analytics" className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all text-sm font-medium">
                <span className="material-symbols-outlined text-lg">analytics</span> {t("analytics.analytics")}
              </Link>
              <Link href="/settings" className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all text-sm font-medium">
                <span className="material-symbols-outlined text-lg">settings</span> {t("settings.settings")}
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {showPostingModal && <PostingModal activeTab={activeTab} onClose={() => setShowPostingModal(false)} onPostCreated={loadFeed} />}

      {/* Report Modal — via portal to escape overflow */}
      {reportTarget && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setReportTarget(null)}>
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-8 shadow-2xl border border-outline-variant/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline text-xl mb-4">{t("feed.reportContent")}</h3>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Reason</label>
            <div className="space-y-2 mb-4">
              {[
                { value: "inappropriate", label: "Inappropriate" },
                { value: "spam", label: "Spam" },
                { value: "false_teaching", label: "False Teaching" },
                { value: "other", label: "Other" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setReportCategory(opt.value)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${reportCategory === opt.value ? "bg-red-50 text-red-700 font-semibold ring-1 ring-red-200" : "bg-surface-container-high text-on-surface hover:bg-surface-container-low"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <textarea placeholder="Additional details (optional)..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} rows={2} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/40 text-sm text-on-surface mb-4 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => { setReportTarget(null); setReportReason(""); setReportCategory("inappropriate"); }} className="flex-1 py-3 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold">Cancel</button>
              <button onClick={handleReport} disabled={reportSubmitting} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50">{reportSubmitting ? "Submitting..." : "Report"}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Verse of the Day Onboarding */}
      {showVerseOnboarding && verseData && (
        <VerseOnboarding
          verseText={verseData.text}
          verseReference={verseData.reference}
          onDismiss={() => setShowVerseOnboarding(false)}
          onToast={showToast}
        />
      )}

      {/* Unified Toast */}
      {/* Floating Action Button for creating posts — portaled to escape overflow */}
      {isLoggedIn && typeof document !== "undefined" && createPortal(
        <button
          onClick={() => setShowPostingModal(true)}
          className="md:hidden fixed bottom-28 right-4 w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xl shadow-primary/30 hover:opacity-90 active:scale-95 transition-all z-[100] press-effect"
          aria-label="Create post"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>,
        document.body
      )}
    </MainLayout>
  );
}

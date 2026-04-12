"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "../components/MainLayout";
import { fetchAPI } from "../lib/api";
import Shimmer from "../components/Shimmer";
import { useToast } from "../components/Toast";
import { openRazorpayCheckout, RazorpayPaymentResponse } from "../lib/razorpay";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PostMedia {
  id: string;
  file: string;
  media_type: string;
  order: number;
}

interface Post {
  id: string;
  text_content?: string;
  content?: string;
  text?: string;
  media?: PostMedia[];
  reaction_count?: number;
  reactions_count?: number;
  likes_count?: number;
  comment_count?: number;
  comments_count?: number;
  created_at?: string;
  created?: string;
  is_boosted?: boolean;
}

interface Boost {
  id: string;
  post: string;
  tier: string;
  platform: string;
  duration_days: number;
  is_active: boolean;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface Tier {
  id: string;
  apiTier: string; // maps to the backend tier name
  name: string;
  days: number;
  price: number; // in INR
  description: string;
  multiplier: string;
  popular?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants – pricing from API spec                                  */
/* ------------------------------------------------------------------ */

const TIERS: Tier[] = [
  {
    id: "starter",
    apiTier: "boost_tier_1",
    name: "Starter",
    days: 7,
    price: 99,
    description: "Great for testing the waters",
    multiplier: "2x",
  },
  {
    id: "growth",
    apiTier: "boost_tier_2",
    name: "Growth",
    days: 7,
    price: 249,
    description: "Most popular",
    multiplier: "5x",
    popular: true,
  },
  {
    id: "premium",
    apiTier: "boost_tier_3",
    name: "Premium",
    days: 7,
    price: 499,
    description: "Maximum visibility",
    multiplier: "10x",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getPostText(post: Post): string {
  const raw = post.text_content || post.content || post.text || "";
  return raw.length > 120 ? raw.slice(0, 120) + "..." : raw;
}

function formatDate(post: Post): string {
  const date = post.created_at || post.created;
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFirstImage(post: Post): string | null {
  if (!post.media || post.media.length === 0) return null;
  const img = post.media.find((m) => m.media_type === "image");
  return img?.file || null;
}

function getRemainingDays(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ current }: { current: number }) {
  const steps = ["Select Post", "Choose Tier", "Payment"];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-6 sm:w-10 ${
                  isDone ? "bg-primary" : "bg-outline-variant/30"
                }`}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : isDone
                    ? "bg-primary/20 text-primary"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-sm">check</span>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isActive ? "text-on-surface" : "text-on-surface-variant"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Selected post preview (compact)                                    */
/* ------------------------------------------------------------------ */

function SelectedPostPreview({
  post,
  onClear,
}: {
  post: Post;
  onClear: () => void;
}) {
  const thumb = getFirstImage(post);
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 flex items-center gap-4">
      {thumb && (
        <img
          src={thumb}
          alt=""
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-on-surface font-medium truncate">
          {getPostText(post)}
        </p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          {formatDate(post)}
        </p>
      </div>
      <button
        onClick={onClear}
        className="text-on-surface-variant hover:text-on-surface p-1"
        title="Change post"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main boost content                                                 */
/* ------------------------------------------------------------------ */

function BoostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const preselectedPostId = searchParams.get("post");

  const [step, setStep] = useState(preselectedPostId ? 2 : 1);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(
    TIERS.find((t) => t.popular) || null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active boosts
  const [activeBoosts, setActiveBoosts] = useState<Boost[]>([]);
  const [boostsLoading, setBoostsLoading] = useState(true);

  /* Load posts and active boosts */
  useEffect(() => {
    async function load() {
      try {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
          router.push("/login");
          return;
        }

        const [postsRes, boostsRes] = await Promise.all([
          fetchAPI(`/social/posts/?author=${userId}`),
          fetchAPI("/analytics/boosts/list/?active_only=true").catch(
            () => null,
          ),
        ]);

        const results =
          postsRes?.data?.results ??
          postsRes?.results ??
          postsRes?.data ??
          [];
        setPosts(results);

        if (boostsRes) {
          const boostList =
            boostsRes?.data?.results ??
            boostsRes?.results ??
            boostsRes?.data ??
            [];
          setActiveBoosts(boostList);
        }

        // If preselected post, find it
        if (preselectedPostId) {
          const found = results.find(
            (p: Post) => p.id === preselectedPostId,
          );
          if (found) {
            setSelectedPost(found);
            setStep(2);
          }
        }
      } catch {
        setError("Failed to load your posts.");
      } finally {
        setLoading(false);
        setBoostsLoading(false);
      }
    }
    load();
  }, [router, preselectedPostId]);

  /* Select a post */
  const handleSelectPost = useCallback((post: Post) => {
    setSelectedPost(post);
    setStep(2);
    setError(null);
  }, []);

  /* Go back a step */
  const handleBack = useCallback(() => {
    if (step === 2) {
      setStep(1);
      setSelectedPost(null);
      setSelectedTier(TIERS.find((t) => t.popular) || null);
    } else if (step === 1) {
      router.back();
    }
  }, [step, router]);

  /* ──────────────────────────────────────────────────────────────── */
  /*  Razorpay 3-step checkout                                       */
  /* ──────────────────────────────────────────────────────────────── */

  const handleBoostNow = useCallback(async () => {
    if (!selectedPost || !selectedTier || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const userEmail = localStorage.getItem("user_email") || "";

      // Step 1: Create Razorpay order on backend
      const orderRes = await fetchAPI("/analytics/boosts/razorpay/create-order/", {
        method: "POST",
        body: JSON.stringify({
          post_id: selectedPost.id,
          tier: selectedTier.apiTier,
          duration_days: selectedTier.days,
        }),
      });
      const order = orderRes.data || orderRes;

      // Step 2 & 3: Open Razorpay checkout, then verify
      await openRazorpayCheckout({
        order,
        name: "Bibleway",
        description: `Post Boost – ${selectedTier.name}`,
        email: userEmail,
        onSuccess: async (response: RazorpayPaymentResponse) => {
          try {
            // Step 3: Verify payment
            await fetchAPI("/analytics/boosts/razorpay/verify/", {
              method: "POST",
              body: JSON.stringify({
                post_id: selectedPost.id,
                tier: selectedTier.apiTier,
                duration_days: selectedTier.days,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            showToast(
              "success",
              "Boost Activated!",
              `Your post will be boosted for ${selectedTier.days} days.`,
            );

            router.push("/boost/analytics");
          } catch (verifyErr: unknown) {
            showToast(
              "error",
              "Verification Failed",
              verifyErr instanceof Error ? verifyErr.message : "Payment succeeded but verification failed. Contact support.",
            );
          }
        },
        onFailure: (errorMsg) => {
          showToast("error", "Payment Failed", errorMsg);
        },
        onDismiss: () => {
          // User closed checkout
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [selectedPost, selectedTier, submitting, router, showToast]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8" data-page>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all press-effect"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline text-3xl text-on-surface">
              Boost Post
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Increase your reach with a promoted post
            </p>
          </div>
        </div>

        <StepIndicator current={step} />

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-6 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* ============ STEP 1: Select a post ============ */}
        {step === 1 && (
          <div>
            <h2 className="font-headline text-xl text-on-surface mb-4">
              Select a Post to Boost
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Shimmer key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl editorial-shadow p-8 text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-3 block">
                  edit_note
                </span>
                <p className="text-on-surface-variant text-lg mb-1">
                  No posts yet
                </p>
                <p className="text-on-surface-variant text-sm mb-4">
                  Create a post first, then come back to boost it.
                </p>
                <Link
                  href="/feed"
                  className="bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold press-effect inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Create Post
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {posts.map((post) => {
                  const thumb = getFirstImage(post);
                  const reactions =
                    post.reaction_count ??
                    post.reactions_count ??
                    post.likes_count ??
                    0;
                  const comments =
                    post.comment_count ?? post.comments_count ?? 0;

                  return (
                    <button
                      key={post.id}
                      onClick={() => handleSelectPost(post)}
                      className="w-full text-left bg-surface-container-lowest rounded-xl editorial-shadow p-4 sm:p-5 transition-all hover:bg-surface-container-low hover:shadow-md active:scale-[0.99] group"
                    >
                      <div className="flex items-start gap-4">
                        {thumb && (
                          <img
                            src={thumb}
                            alt=""
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-on-surface leading-relaxed line-clamp-2">
                            {getPostText(post)}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-on-surface-variant">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">
                                favorite
                              </span>
                              {reactions}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">
                                chat_bubble
                              </span>
                              {comments}
                            </span>
                            <span>{formatDate(post)}</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors flex-shrink-0 mt-1">
                          chevron_right
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============ STEP 2: Select a tier ============ */}
        {step === 2 && selectedPost && (
          <div>
            <SelectedPostPreview
              post={selectedPost}
              onClear={() => {
                setStep(1);
                setSelectedPost(null);
              }}
            />

            <h2 className="font-headline text-xl text-on-surface mb-4">
              Choose a Boost Tier
            </h2>

            <div className="space-y-4 mb-8">
              {TIERS.map((tier) => {
                const isSelected = selectedTier?.id === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`w-full text-left rounded-xl p-5 transition-all relative overflow-hidden ${
                      isSelected
                        ? "bg-primary/5 ring-2 ring-primary editorial-shadow"
                        : "bg-surface-container-lowest editorial-shadow hover:bg-surface-container-low"
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                        Popular
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-headline text-lg text-on-surface">
                            {tier.name}
                          </h3>
                          <span className="bg-tertiary/10 text-tertiary text-xs font-bold px-2 py-0.5 rounded-full">
                            {tier.multiplier} reach
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant">
                          {tier.description}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {tier.days} day{tier.days > 1 ? "s" : ""} duration
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-headline text-2xl text-on-surface">
                          <span className="text-base text-on-surface-variant">
                            ₹
                          </span>
                          {tier.price}
                        </p>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    <div className="absolute left-0 top-0 bottom-0 w-1">
                      <div
                        className={`h-full rounded-r transition-all ${
                          isSelected ? "bg-primary" : "bg-transparent"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Boost Now button */}
            <button
              onClick={handleBoostNow}
              disabled={!selectedTier || submitting}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-semibold text-lg disabled:opacity-50 press-effect flex items-center justify-center gap-2 transition-all hover:opacity-90"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-on-primary/30 border-t-on-primary" />
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">
                    rocket_launch
                  </span>
                  Boost Now
                  {selectedTier && (
                    <span className="opacity-80">
                      {" "}
                      &middot; ₹{selectedTier.price}
                    </span>
                  )}
                </>
              )}
            </button>

            <p className="text-center text-xs text-on-surface-variant/50 mt-3 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-sm">lock</span>
              Secure payment powered by Razorpay
            </p>
          </div>
        )}

        {/* ============ Active Boosts Section ============ */}
        <div className="mt-12">
          <h2 className="font-headline text-xl text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              trending_up
            </span>
            Active Boosts
          </h2>

          {boostsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Shimmer key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : activeBoosts.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl editorial-shadow p-6 text-center">
              <p className="text-on-surface-variant text-sm">
                No active boosts. Boost a post to increase its reach.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBoosts.map((boost) => {
                const remaining = getRemainingDays(boost.expires_at);
                const tierInfo = TIERS.find((t) => t.apiTier === boost.tier || t.id === boost.tier);

                return (
                  <div
                    key={boost.id}
                    className="bg-surface-container-lowest rounded-xl editorial-shadow p-5 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                        {tierInfo && (
                          <span className="text-xs text-on-surface-variant font-medium">
                            {tierInfo.name} Tier
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface">
                        {boost.duration_days} day boost &middot;{" "}
                        <span className="text-on-surface-variant">
                          {remaining} day{remaining !== 1 ? "s" : ""} remaining
                        </span>
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Started{" "}
                        {boost.activated_at
                          ? new Date(boost.activated_at).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "recently"}
                      </p>
                    </div>
                    <Link
                      href="/boost/analytics"
                      className="text-primary hover:underline text-sm font-medium flex items-center gap-1 flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">
                        analytics
                      </span>
                      <span className="hidden sm:inline">View Analytics</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  Export with Suspense boundary                                       */
/* ------------------------------------------------------------------ */

export default function BoostPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="max-w-2xl mx-auto px-4 py-8">
            <Shimmer className="h-10 w-48 mb-8" />
            <Shimmer className="h-6 w-64 mb-6" />
            <Shimmer className="h-24 w-full mb-4" />
            <Shimmer className="h-24 w-full mb-4" />
            <Shimmer className="h-24 w-full" />
          </div>
        </MainLayout>
      }
    >
      <BoostContent />
    </Suspense>
  );
}

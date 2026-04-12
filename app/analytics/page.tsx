"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "../components/MainLayout";
import { fetchAPI } from "../lib/api";
import Shimmer from "../components/Shimmer";
import { useToast } from "../components/Toast";
import { useTranslation } from "../lib/i18n";
import type { PostAnalytics, PostBoost, BoostAnalyticSnapshot } from "../types";

interface OverviewAnalytics {
  total_views: number;
  total_reactions: number;
  total_comments: number;
  top_posts: { id: string; text_content?: string; title?: string; view_count?: number }[];
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState<OverviewAnalytics | null>(null);
  const [boosts, setBoosts] = useState<PostBoost[]>([]);
  const [loading, setLoading] = useState(true);
  const [boostPostId, setBoostPostId] = useState("");
  const [boostBudget, setBoostBudget] = useState("");
  const [creatingBoost, setCreatingBoost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [postAnalytics, setPostAnalytics] = useState<PostAnalytics | null>(null);
  const [postAnalyticsLoading, setPostAnalyticsLoading] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<string | null>(null);
  const [boostAnalytics, setBoostAnalytics] = useState<BoostAnalyticSnapshot | null>(null);
  const [boostAnalyticsLoading, setBoostAnalyticsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [analyticsRes, boostsRes] = await Promise.all([
          fetchAPI("/analytics/me/").catch(() => null),
          fetchAPI("/analytics/boosts/list/").catch(() => null),
        ]);
        if (analyticsRes) setAnalytics(analyticsRes.data || analyticsRes);
        if (boostsRes) setBoosts(boostsRes?.data?.results || boostsRes?.results || boostsRes?.data || []);
      } catch (err) {
        /* error */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreateBoost() {
    if (!boostPostId.trim() || !boostBudget || creatingBoost) return;
    setCreatingBoost(true);
    try {
      await fetchAPI("/analytics/boosts/", {
        method: "POST",
        body: JSON.stringify({ post_id: boostPostId, budget: Number(boostBudget) }),
      });
      setBoostPostId("");
      setBoostBudget("");
      const res = await fetchAPI("/analytics/boosts/list/").catch(() => null);
      if (res) setBoosts(res?.data?.results || res?.results || res?.data || []);
    } catch (err: unknown) {
      showToast("error", "Boost Failed", err instanceof Error ? err.message : "Failed to create boost.");
    } finally {
      setCreatingBoost(false);
    }
  }

  async function viewPostAnalytics(postId: string) {
    setSelectedPost(postId);
    setPostAnalyticsLoading(true);
    try {
      const res = await fetchAPI(`/analytics/posts/${postId}/`);
      setPostAnalytics(res.data || res);
    } catch {
      /* error */
      setPostAnalytics(null);
    } finally {
      setPostAnalyticsLoading(false);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Shimmer className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((i) => <Shimmer key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
        <div>
          <Link href="/profile" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-4">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">Back to Profile</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-headline text-on-surface">Analytics</h1>
          <p className="text-on-surface-variant mt-2">Track your engagement and reach.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-8 editorial-shadow text-center">
            <span className="material-symbols-outlined text-3xl text-primary mb-2 block">visibility</span>
            <p className="font-headline text-3xl text-on-surface">{analytics?.total_views ?? 0}</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">Total Views</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-8 editorial-shadow text-center">
            <span className="material-symbols-outlined text-3xl text-primary mb-2 block">favorite</span>
            <p className="font-headline text-3xl text-on-surface">{analytics?.total_reactions ?? 0}</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">Total Reactions</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-8 editorial-shadow text-center">
            <span className="material-symbols-outlined text-3xl text-primary mb-2 block">chat_bubble</span>
            <p className="font-headline text-3xl text-on-surface">{analytics?.total_comments ?? 0}</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">Total Comments</p>
          </div>
        </div>

        {/* Top Posts */}
        {analytics?.top_posts && analytics.top_posts.length > 0 && (
          <div>
            <h2 className="font-headline text-2xl mb-6">Top Posts</h2>
            <div className="space-y-3">
              {analytics.top_posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => viewPostAnalytics(post.id)}
                  className="w-full text-left bg-surface-container-lowest rounded-xl p-6 editorial-shadow hover:shadow-md transition-shadow flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-on-surface font-medium truncate">{post.text_content || post.title || "Post"}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{post.view_count || 0} views</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Post Analytics Detail */}
        {selectedPost && (
          <div className="bg-surface-container-low rounded-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-xl">Post Analytics</h3>
              <button onClick={() => { setSelectedPost(null); setPostAnalytics(null); }} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {postAnalyticsLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>
            ) : postAnalytics ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="font-headline text-2xl text-primary">{postAnalytics.views ?? 0}</p>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Views</p>
                </div>
                <div className="text-center">
                  <p className="font-headline text-2xl text-primary">{postAnalytics.reactions ?? 0}</p>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Reactions</p>
                </div>
                <div className="text-center">
                  <p className="font-headline text-2xl text-primary">{postAnalytics.comments ?? 0}</p>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Comments</p>
                </div>
              </div>
            ) : (
              <p className="text-on-surface-variant text-center py-4">No analytics data available.</p>
            )}
          </div>
        )}

        {/* Boosts */}
        <div>
          <h2 className="font-headline text-2xl mb-6">Boosts</h2>

          {/* Create Boost */}
          <div className="bg-surface-container-lowest rounded-xl p-6 editorial-shadow mb-6">
            <h3 className="font-headline text-lg mb-4">Create a Boost</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Post ID"
                value={boostPostId}
                onChange={(e) => setBoostPostId(e.target.value)}
                className="flex-1 bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <input
                type="number"
                placeholder="Budget"
                value={boostBudget}
                onChange={(e) => setBoostBudget(e.target.value)}
                className="w-full sm:w-32 bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <button
                onClick={handleCreateBoost}
                disabled={creatingBoost || !boostPostId.trim() || !boostBudget}
                className="bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {creatingBoost ? "Creating..." : "Boost"}
              </button>
            </div>
          </div>

          {/* Boosts List */}
          {boosts.length > 0 ? (
            <div className="space-y-3">
              {boosts.map((boost) => (
                <button key={boost.id} onClick={async () => {
                  setSelectedBoost(boost.id);
                  setBoostAnalyticsLoading(true);
                  try {
                    const res = await fetchAPI(`/analytics/boosts/${boost.id}/analytics/`);
                    setBoostAnalytics(res.data || res);
                  } catch { setBoostAnalytics(null); }
                  finally { setBoostAnalyticsLoading(false); }
                }} className="w-full bg-surface-container-lowest rounded-xl p-6 editorial-shadow flex items-center justify-between hover:shadow-md transition-shadow text-left">
                  <div>
                    <p className="font-medium text-on-surface">Boost #{boost.id?.slice(0, 8)}</p>
                    <p className="text-xs text-on-surface-variant mt-1">Budget: ${boost.budget} &middot; Status: {boost.status || "active"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-headline text-lg text-primary">{boost.impressions || 0}</p>
                    <p className="text-xs text-on-surface-variant">impressions</p>
                  </div>
                </button>
              ))}
              {selectedBoost && (
                <div className="bg-surface-container-low rounded-xl p-6 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-headline text-lg">Boost Analytics</h4>
                    <button onClick={() => { setSelectedBoost(null); setBoostAnalytics(null); }} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  {boostAnalyticsLoading ? (
                    <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div></div>
                  ) : boostAnalytics ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div><p className="font-headline text-xl text-primary">{boostAnalytics.impressions ?? 0}</p><p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Impressions</p></div>
                      <div><p className="font-headline text-xl text-primary">{boostAnalytics.clicks ?? 0}</p><p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Clicks</p></div>
                      <div><p className="font-headline text-xl text-primary">{boostAnalytics.engagement ?? 0}</p><p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Engagement</p></div>
                    </div>
                  ) : <p className="text-on-surface-variant text-center py-2">No data available.</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
              <p className="text-on-surface-variant">No boosts yet. Boost a post to increase its reach.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "../../components/MainLayout";
import { fetchAPI } from "../../lib/api";
import { useChat } from "../../lib/ChatContext";
import { useToast } from "../../components/Toast";
import type { UserPublicProfile, Post, Prayer, UserListItem, FollowRelationship } from "../../types";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState<"block" | "unblock" | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [showFollowersModal, setShowFollowersModal] = useState<"followers" | "following" | null>(null);
  const [followList, setFollowList] = useState<UserListItem[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messagingLoading, setMessagingLoading] = useState(false);
  useEffect(() => { setCurrentUserId(localStorage.getItem("user_id")); }, []);
  const router = useRouter();
  const { startConversation } = useChat();
  const { showToast } = useToast();

  useEffect(() => {
    if (!userId) return;
    async function load() {
      try {
        const profRes = await fetchAPI(`/accounts/users/${userId}/`);
        const userData = profRes.data || profRes;
        setProfile(userData);
        setIsFollowing(userData.follow_status === "following");

        const [postsRes, prayersRes] = await Promise.all([
          fetchAPI(`/social/posts/?author=${userId}`).catch(() => ({ data: { results: [] } })),
          fetchAPI(`/social/prayers/?author=${userId}`).catch(() => ({ data: { results: [] } })),
        ]);
        setPosts(postsRes?.data?.results || postsRes?.results || []);
        setPrayers(prayersRes?.data?.results || prayersRes?.results || []);
      } catch { /* failed to load profile */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  async function handleFollow() {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await fetchAPI(`/accounts/users/${userId}/follow/`, { method: "DELETE" });
        setIsFollowing(false);
        setProfile((p) => p ? ({ ...p, follower_count: Math.max(0, (p.follower_count || 0) - 1) }) : p);
      } else {
        await fetchAPI(`/accounts/users/${userId}/follow/`, { method: "POST", body: JSON.stringify({}) });
        setIsFollowing(true);
        setProfile((p) => p ? ({ ...p, follower_count: (p.follower_count || 0) + 1 }) : p);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not complete the action.";
      showToast("error", "Action failed", message);
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleBlock() {
    try {
      await fetchAPI(`/accounts/users/${userId}/block/`, { method: "POST" });
      setActionToast("User blocked.");
      setTimeout(() => setActionToast(null), 2500);
    } catch { /* block failed */ }
    setBlockConfirm(null);
    setShowMenu(false);
  }

  async function handleUnblock() {
    try {
      await fetchAPI(`/accounts/users/${userId}/block/`, { method: "DELETE" });
      setActionToast("User unblocked.");
      setTimeout(() => setActionToast(null), 2500);
    } catch { /* unblock failed */ }
    setBlockConfirm(null);
    setShowMenu(false);
  }

  async function openFollowList(type: "followers" | "following") {
    setShowFollowersModal(type);
    setFollowListLoading(true);
    try {
      const res = await fetchAPI(`/accounts/users/${userId}/${type}/`);
      const raw = res?.data?.results || res?.results || res?.data || [];
      // Extract the nested user from FollowRelationship objects
      const users = raw.map((r: FollowRelationship) => type === "followers" ? r.follower : r.following).filter(Boolean);
      setFollowList(users);
    } catch { /* failed to load follow list */ } finally {
      setFollowListLoading(false);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h1 className="text-3xl font-headline mb-4">User Not Found</h1>
          <Link href="/" className="text-primary font-bold">Go Home</Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Profile Header — compact on mobile, sidebar on desktop */}
        <section className="lg:col-span-4 mb-6 lg:mb-0">
          <div className="sticky top-28">
            {/* Mobile: horizontal compact layout */}
            <div className="flex items-center gap-4 lg:hidden mb-4">
              <div className="w-20 h-20 rounded-xl bg-surface-container-high shadow-lg flex items-center justify-center overflow-hidden border-2 border-white shrink-0">
                {profile.profile_photo ? (
                  <img src={profile.profile_photo} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">person</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-headline text-xl text-on-surface truncate">{profile.full_name}</h1>
                {profile.bio && <p className="text-on-surface-variant text-sm line-clamp-2 mt-0.5">{profile.bio}</p>}
                <div className="flex gap-5 mt-2">
                  <button onClick={() => openFollowList("followers")} className="hover:opacity-70">
                    <span className="font-bold text-primary">{profile.follower_count || 0}</span>
                    <span className="text-[10px] text-on-surface-variant ml-1">followers</span>
                  </button>
                  <button onClick={() => openFollowList("following")} className="hover:opacity-70">
                    <span className="font-bold text-primary">{profile.following_count || 0}</span>
                    <span className="text-[10px] text-on-surface-variant ml-1">following</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop: vertical sidebar layout */}
            <div className="hidden lg:flex flex-col items-start space-y-6">
              <div className="w-40 h-40 rounded-xl bg-surface-container-high shadow-2xl shadow-primary/5 flex items-center justify-center overflow-hidden border-2 border-white">
                {profile.profile_photo ? (
                  <img src={profile.profile_photo} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">person</span>
                )}
              </div>
              <div>
                <h1 className="font-headline text-4xl text-on-surface mb-1">{profile.full_name}</h1>
                <p className="text-on-surface-variant font-body leading-relaxed max-w-sm">
                  {profile.bio || "No bio yet."}
                </p>
              </div>
              <div className="flex gap-8 border-y border-outline-variant/15 py-4 w-full">
                <button onClick={() => openFollowList("followers")} className="text-left hover:opacity-70 transition-opacity">
                  <span className="block font-headline text-2xl text-primary">{profile.follower_count || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Followers</span>
                </button>
                <button onClick={() => openFollowList("following")} className="text-left hover:opacity-70 transition-opacity">
                  <span className="block font-headline text-2xl text-primary">{profile.following_count || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Following</span>
                </button>
              </div>
            </div>

            {currentUserId !== userId && (
              <div className="flex gap-2 lg:flex-col lg:space-y-2 lg:gap-0 w-full mt-4 lg:mt-0">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex-1 lg:w-full py-2.5 lg:py-3 rounded-xl font-semibold shadow-lg transition-all text-sm lg:text-base ${
                    isFollowing
                      ? "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                      : "bg-linear-to-br from-primary to-primary-container text-on-primary shadow-primary/20 hover:opacity-90"
                  }`}
                >
                  {followLoading ? "..." : isFollowing ? "Unfollow" : "Follow"}
                </button>
                <button
                  onClick={async () => {
                    if (messagingLoading) return;
                    setMessagingLoading(true);
                    try {
                      const conv = await startConversation(userId);
                      if (conv?.id) router.push(`/chat/${conv.id}`);
                    } catch (err: unknown) {
                      const message = err instanceof Error ? err.message : "Could not start conversation.";
                      showToast("error", "Message failed", message);
                    } finally {
                      setMessagingLoading(false);
                    }
                  }}
                  disabled={messagingLoading}
                  className="flex-1 lg:w-full bg-surface-container-low text-primary py-2.5 lg:py-3 rounded-xl font-semibold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm lg:text-base"
                >
                  <span className="material-symbols-outlined text-lg">{messagingLoading ? "hourglass_empty" : "chat"}</span>
                  {messagingLoading ? "Opening..." : "Message"}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="h-full lg:w-full bg-surface-container-low text-on-surface-variant py-2.5 lg:py-3 px-3 lg:px-0 rounded-xl font-semibold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">more_horiz</span>
                    <span className="hidden lg:inline">More</span>
                  </button>
                  {showMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 z-50 overflow-hidden">
                      <button onClick={() => { setBlockConfirm("block"); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">block</span>
                        Block User
                      </button>
                      <button onClick={() => { setBlockConfirm("unblock"); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Unblock User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="lg:col-span-8 space-y-6 lg:space-y-12">
          <div className="flex space-x-8 lg:space-x-12 border-b border-outline-variant/15">
            <button onClick={() => setActiveTab("posts")} className={`pb-3 lg:pb-4 text-sm lg:text-base font-medium ${activeTab === "posts" ? "text-primary border-b-2 border-primary font-semibold" : "text-on-surface-variant hover:text-primary"}`}>
              Posts ({posts.length})
            </button>
            <button onClick={() => setActiveTab("prayers")} className={`pb-3 lg:pb-4 text-sm lg:text-base font-medium ${activeTab === "prayers" ? "text-primary border-b-2 border-primary font-semibold" : "text-on-surface-variant hover:text-primary"}`}>
              Prayers ({prayers.length})
            </button>
          </div>

          {activeTab === "posts" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.length > 0 ? posts.map((post) => (
                <Link href={`/post/${post.id}`} key={post.id} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group border border-outline-variant/10 hover:shadow-md transition-shadow">
                  {post.media?.[0] && (
                    <div className="h-48 overflow-hidden bg-surface-container">
                      <img src={post.media[0].file} alt="Post" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-on-surface mb-4 line-clamp-3">{post.text_content}</p>
                    <div className="flex items-center gap-4 text-on-surface-variant text-sm">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">favorite</span> {post.reaction_count || 0}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">chat_bubble</span> {post.comment_count || 0}</span>
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="md:col-span-2 text-center py-12 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
                  <p className="text-on-surface-variant">No posts yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "prayers" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prayers.length > 0 ? prayers.map((prayer) => (
                <Link href={`/prayer/${prayer.id}`} key={prayer.id} className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between border border-outline-variant/10 hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-headline text-2xl mb-4">{prayer.title}</h4>
                    <p className="text-on-surface-variant italic leading-relaxed line-clamp-4">{prayer.description}</p>
                  </div>
                  <div className="mt-8 flex justify-between items-center text-xs text-on-surface-variant">
                    <span>{new Date(prayer.created_at).toLocaleDateString()}</span>
                    <div className="flex gap-3">
                      <span>{prayer.reaction_count || 0} prayers</span>
                      <span>{prayer.comment_count || 0} comments</span>
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="md:col-span-2 text-center py-12 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                  <p className="text-on-surface-variant">No prayer requests yet.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Block/Unblock Confirmation Modal */}
      {blockConfirm && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setBlockConfirm(null)}>
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-8 editorial-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className={`material-symbols-outlined text-2xl ${blockConfirm === "block" ? "text-red-500" : "text-primary"}`}>
                {blockConfirm === "block" ? "block" : "person_add"}
              </span>
              <h3 className="font-headline text-xl">
                {blockConfirm === "block" ? "Block User" : "Unblock User"}
              </h3>
            </div>
            <p className="text-on-surface-variant text-sm mb-6">
              {blockConfirm === "block"
                ? `Are you sure you want to block ${profile.full_name}? They won't be able to see your posts or follow you.`
                : `Unblock ${profile.full_name}? They will be able to see your profile and follow you again.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBlockConfirm(null)} className="flex-1 py-3 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold">Cancel</button>
              <button
                onClick={blockConfirm === "block" ? handleBlock : handleUnblock}
                className={`flex-1 py-3 rounded-xl font-semibold text-white ${blockConfirm === "block" ? "bg-red-600" : "bg-primary"}`}
              >
                {blockConfirm === "block" ? "Block" : "Unblock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Toast */}
      {actionToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-6 py-3 rounded-full shadow-xl z-[200] text-sm font-medium">
          {actionToast}
        </div>
      )}

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setShowFollowersModal(null)}>
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl overflow-hidden editorial-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="font-headline text-xl capitalize">{showFollowersModal}</h3>
              <button onClick={() => setShowFollowersModal(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              {followListLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>
              ) : followList.length > 0 ? (
                <div className="space-y-3">
                  {followList.map((u) => (
                    <Link href={`/user/${u.id}`} key={u.id} onClick={() => setShowFollowersModal(null)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center">
                        {u.profile_photo ? <img src={u.profile_photo} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-on-surface-variant">person</span>}
                      </div>
                      <span className="font-semibold text-on-surface">{u.full_name || "User"}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-on-surface-variant py-8">No {showFollowersModal} yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

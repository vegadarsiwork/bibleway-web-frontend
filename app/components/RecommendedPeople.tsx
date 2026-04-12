"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchAPI } from "../lib/api";
import type { UserListItem, FollowRelationship } from "../types";

export default function RecommendedPeople() {
  const [people, setPeople] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const currentUserId = localStorage.getItem("user_id");
        const res = await fetchAPI("/accounts/users/search/?q=");
        const data = res?.data?.results ?? res?.results ?? res?.data ?? [];
        const filtered = Array.isArray(data) ? data.filter((u: UserListItem) => u.id !== currentUserId) : [];
        setPeople(filtered.slice(0, 5));
        // Pre-populate follow state from current user's following list
        if (currentUserId) {
          try {
            const followingRes = await fetchAPI(`/accounts/users/${currentUserId}/following/`);
            const followingRaw = followingRes?.data?.results || followingRes?.results || followingRes?.data || [];
            const ids = new Set<string>(followingRaw.map((r: FollowRelationship) => r.following?.id).filter(Boolean));
            setFollowingIds(ids);
          } catch { /* ignore */ }
        }
      } catch { /* failed */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleFollow(userId: string) {
    if (loadingFollow) return;
    setLoadingFollow(userId);
    try {
      if (followingIds.has(userId)) {
        await fetchAPI(`/accounts/users/${userId}/follow/`, { method: "DELETE" });
        setFollowingIds((prev) => { const next = new Set(prev); next.delete(userId); return next; });
      } else {
        await fetchAPI(`/accounts/users/${userId}/follow/`, { method: "POST" });
        setFollowingIds((prev) => new Set(prev).add(userId));
      }
    } catch { /* follow failed */ } finally {
      setLoadingFollow(null);
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 editorial-shadow">
      <h3 className="font-headline text-lg mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-lg">group_add</span>
        Recommended People
      </h3>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div>
        </div>
      ) : people.length > 0 ? (
        <div className="space-y-3">
          {people.map((person) => (
            <div key={person.id} className="flex items-center gap-3">
              <Link href={`/user/${person.id}`} className="w-9 h-9 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center shrink-0">
                {person.profile_photo ? (
                  <img src={person.profile_photo} alt={person.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/user/${person.id}`} className="text-sm font-medium text-on-surface hover:text-primary transition-colors line-clamp-1">
                  {person.full_name || "User"}
                </Link>
              </div>
              <button
                onClick={() => handleFollow(person.id)}
                disabled={loadingFollow === person.id}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                  followingIds.has(person.id)
                    ? "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-low"
                    : "bg-primary text-on-primary hover:opacity-90"
                } ${loadingFollow === person.id ? "opacity-50" : ""}`}
              >
                {loadingFollow === person.id ? "..." : followingIds.has(person.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant text-center py-2">No suggestions yet</p>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import { useChat } from "../../lib/ChatContext";
import { fetchAPI } from "../../lib/api";

interface UserResult {
  id: string;
  full_name: string;
  profile_photo?: string;
  bio?: string;
  age?: number;
}

export default function NewChatPage() {
  const router = useRouter();
  const { startConversation } = useChat();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchAPI(`/accounts/users/search/?q=${encodeURIComponent(query.trim())}`);
        const users = res?.data?.results || res?.data || res?.results || [];
        setResults(users);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function handleSelectUser(user: UserResult) {
    if (starting) return;
    const currentUserId = localStorage.getItem("user_id");
    if (currentUserId && user.id === currentUserId) {
      setError("You cannot start a conversation with yourself.");
      return;
    }
    setError("");
    setStarting(user.id);
    try {
      const conv = await startConversation(user.id);
      if (conv?.id) {
        router.push(`/chat/${conv.id}`);
        return;
      }
      setError("Failed to start conversation. Please try again.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start conversation.";
      setError(msg.includes("API error") ? "Something went wrong. Please try again." : msg);
    }
    setStarting(null);
  }

  return (
    <MainLayout hideFooter>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8" data-page>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/chat")}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-[22px] text-on-surface">arrow_back</span>
          </button>
          <h1 className="font-headline text-2xl text-on-surface">New Message</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg">search</span>
          <input
            type="text"
            placeholder="Search people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="space-y-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-3 block">person_search</span>
              <p className="text-on-surface-variant/60 text-sm">No users found for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-3 block">group</span>
              <p className="text-on-surface-variant/60 text-sm">Search for someone to start a conversation</p>
            </div>
          )}

          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              disabled={starting === user.id}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-surface-container-high transition-all disabled:opacity-50 text-left"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0 border border-outline-variant/20">
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant/50">person</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-on-surface truncate">{user.full_name}</p>
                {user.bio && <p className="text-sm text-on-surface-variant truncate">{user.bio}</p>}
              </div>
              {starting === user.id ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[20px]">chat_bubble_outline</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

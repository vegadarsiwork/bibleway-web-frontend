"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "./api";
import { CACHE_DURATIONS } from "./cache";
import { ENDPOINTS } from "./endpoints";
import { mapFeedItem } from "./mapFeedItem";
import type {
  BibleVersion,
  BibleBook,
  BibleChapterSummary,
  BibleChapterContent,
  BibleSearchResult,
  SegregatedSection,
  SegregatedChapter,
  SegregatedPage,
  SegregatedPageDetail,
  Bookmark,
  Highlight,
  Note,
  Post,
  Prayer,
  FeedItem,
  UserProfile,
  UserPublicProfile,
  ProductListItem,
  Purchase,
  Notification,
} from "../types";

// ═══════════════════════════════════════════════════════════════
// BIBLE
// ═══════════════════════════════════════════════════════════════

export function useBibles() {
  return useQuery({
    queryKey: ["bibles"],
    queryFn: async () => {
      const res = await fetchAPI<BibleVersion[]>(`${ENDPOINTS.bible.apiBibleBibles}?language=eng`);
      return res?.data || [];
    },
    ...CACHE_DURATIONS.bibleVersions,
  });
}

export function useBooks(bibleId: string | null) {
  return useQuery({
    queryKey: ["books", bibleId],
    queryFn: async () => {
      const res = await fetchAPI<BibleBook[]>(ENDPOINTS.bible.apiBibleBooks(bibleId!));
      return res?.data || [];
    },
    enabled: !!bibleId,
    ...CACHE_DURATIONS.bibleVersions,
  });
}

export function useChapters(bibleId: string | null, bookId: string | null) {
  return useQuery({
    queryKey: ["chapters", bibleId, bookId],
    queryFn: async () => {
      const res = await fetchAPI<BibleChapterSummary[]>(ENDPOINTS.bible.apiBibleChapters(bibleId!, bookId!));
      return (res?.data || []).filter((ch) => ch.number !== "intro");
    },
    enabled: !!bibleId && !!bookId,
    ...CACHE_DURATIONS.bibleVersions,
  });
}

export function useChapterContent(bibleId: string | null, chapterId: string | null) {
  return useQuery({
    queryKey: ["chapterContent", bibleId, chapterId],
    queryFn: async () => {
      const res = await fetchAPI<BibleChapterContent>(`${ENDPOINTS.bible.apiBibleChapter(bibleId!, chapterId!)}?content-type=html`);
      return res?.data || null;
    },
    enabled: !!bibleId && !!chapterId,
    ...CACHE_DURATIONS.bibleContent,
  });
}

// ── Study ────────────────────────────────────────────────────

export function useStudySections() {
  return useQuery({
    queryKey: ["studySections"],
    queryFn: async () => {
      const res = await fetchAPI<SegregatedSection[]>(ENDPOINTS.bible.sections);
      return res?.data || [];
    },
    ...CACHE_DURATIONS.segregatedPages,
  });
}

export function useStudyChapters(sectionId: string | null) {
  return useQuery({
    queryKey: ["studyChapters", sectionId],
    queryFn: async () => {
      const res = await fetchAPI<SegregatedChapter[]>(ENDPOINTS.bible.chapters(sectionId!));
      return res?.data || [];
    },
    enabled: !!sectionId,
    ...CACHE_DURATIONS.segregatedPages,
  });
}

export function useStudyPages(chapterId: string | null) {
  return useQuery({
    queryKey: ["studyPages", chapterId],
    queryFn: async () => {
      const res = await fetchAPI<SegregatedPage[]>(ENDPOINTS.bible.pages(chapterId!));
      return res?.data || [];
    },
    enabled: !!chapterId,
    ...CACHE_DURATIONS.segregatedPages,
  });
}

export function useStudyPageDetail(pageId: string | null) {
  return useQuery({
    queryKey: ["studyPageDetail", pageId],
    queryFn: async () => {
      const res = await fetchAPI<SegregatedPageDetail>(ENDPOINTS.bible.pageDetail(pageId!));
      return res?.data || null;
    },
    enabled: !!pageId,
    ...CACHE_DURATIONS.segregatedPages,
  });
}

// ── Bible Study Tools ────────────────────────────────────────

export function useBookmarks() {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const res = await fetchAPI<Bookmark[] | { results: Bookmark[] }>(ENDPOINTS.bible.bookmarks);
      const data = res?.data;
      if (Array.isArray(data)) return data;
      return (data as { results: Bookmark[] })?.results || [];
    },
    ...CACHE_DURATIONS.bibleContent,
  });
}

export function useHighlights() {
  return useQuery({
    queryKey: ["highlights"],
    queryFn: async () => {
      const res = await fetchAPI<Highlight[] | { results: Highlight[] }>(ENDPOINTS.bible.highlights);
      const data = res?.data;
      if (Array.isArray(data)) return data;
      return (data as { results: Highlight[] })?.results || [];
    },
    ...CACHE_DURATIONS.bibleContent,
  });
}

export function useNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await fetchAPI<Note[] | { results: Note[] }>(ENDPOINTS.bible.notes);
      const data = res?.data;
      if (Array.isArray(data)) return data;
      return (data as { results: Note[] })?.results || [];
    },
    ...CACHE_DURATIONS.bibleContent,
  });
}

export function useBibleSearch(query: string) {
  return useQuery({
    queryKey: ["bibleSearch", query],
    queryFn: async () => {
      const res = await fetchAPI<{ results: SegregatedPageDetail[] }>(`${ENDPOINTS.bible.search}?q=${encodeURIComponent(query)}`);
      const data = res?.data;
      return (data as { results: SegregatedPageDetail[] })?.results || [];
    },
    enabled: !!query.trim(),
    ...CACHE_DURATIONS.segregatedPages,
  });
}

// ═══════════════════════════════════════════════════════════════
// FEED
// ═══════════════════════════════════════════════════════════════

export function useFeed() {
  return useQuery<FeedItem[]>({
    queryKey: ["feed"],
    queryFn: async () => {
      const [postsRes, prayersRes] = await Promise.all([
        fetchAPI<{ results: Post[] }>(ENDPOINTS.social.posts).catch(() => null),
        fetchAPI<{ results: Prayer[] }>(ENDPOINTS.social.prayers).catch(() => null),
      ]);
      const posts = (postsRes?.data?.results ?? []).map((p) => mapFeedItem(p, "post"));
      const prayers = (prayersRes?.data?.results ?? []).map((p) => mapFeedItem(p, "prayer"));
      return [...posts, ...prayers].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
    },
    ...CACHE_DURATIONS.feed,
  });
}

export function useVerseOfDay(date: string) {
  return useQuery({
    queryKey: ["verseOfDay", date],
    queryFn: async () => {
      const isToday = date === new Date().toISOString().split("T")[0];
      const endpoint = isToday ? ENDPOINTS.verseOfDay.today : ENDPOINTS.verseOfDay.byDate(date);
      const res = await fetchAPI<{ verse_text: string; bible_reference: string }>(endpoint);
      const verse = res?.data;
      if (verse?.verse_text) return { text: `"${verse.verse_text}"`, reference: `\u2014 ${verse.bible_reference}` };
      return null;
    },
    ...CACHE_DURATIONS.verseOfDay,
  });
}

// ═══════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetchAPI<UserProfile>(ENDPOINTS.profile.me);
      return res?.data || (res as unknown as UserProfile);
    },
    ...CACHE_DURATIONS.profile,
  });
}

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const res = await fetchAPI<UserPublicProfile>(ENDPOINTS.profile.userDetail(userId!));
      return res?.data || (res as unknown as UserPublicProfile);
    },
    enabled: !!userId,
    ...CACHE_DURATIONS.profile,
  });
}

// ═══════════════════════════════════════════════════════════════
// SHOP
// ═══════════════════════════════════════════════════════════════

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetchAPI<{ results: ProductListItem[] }>(ENDPOINTS.shop.products);
      return res?.data?.results || [];
    },
    ...CACHE_DURATIONS.shopProducts,
  });
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ["productSearch", query],
    queryFn: async () => {
      const res = await fetchAPI<{ results: ProductListItem[] }>(`${ENDPOINTS.shop.productSearch}?q=${encodeURIComponent(query)}`);
      return res?.data?.results || [];
    },
    enabled: !!query.trim(),
    ...CACHE_DURATIONS.shopProducts,
  });
}

export function usePurchases() {
  return useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const res = await fetchAPI<{ results: Purchase[] }>(ENDPOINTS.shop.purchaseList);
      return res?.data?.results || [];
    },
    ...CACHE_DURATIONS.shopProducts,
  });
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      const res = await fetchAPI<{ count: number }>(ENDPOINTS.notifications.unreadCount);
      return res?.data?.count ?? 0;
    },
    ...CACHE_DURATIONS.unreadCount,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetchAPI<{ results: Notification[] }>(ENDPOINTS.notifications.list);
      return res?.data?.results || [];
    },
    ...CACHE_DURATIONS.notifications,
  });
}

// ═══════════════════════════════════════════════════════════════
// COMMENTS & REPLIES
// ═══════════════════════════════════════════════════════════════

export function useCommentReplies(commentId: string | null) {
  return useQuery({
    queryKey: ["replies", commentId],
    queryFn: async () => {
      const res = await fetchAPI<{ results: import("../types").Reply[] }>(ENDPOINTS.social.replies(commentId!));
      return res?.data?.results ?? [];
    },
    enabled: !!commentId,
    ...CACHE_DURATIONS.feed,
  });
}

export function useCreateReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, text }: { commentId: string; text: string }) => {
      return fetchAPI(ENDPOINTS.social.replies(commentId), {
        method: "POST",
        body: JSON.stringify({ text }),
      });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["replies", variables.commentId] });
    },
  });
}

export function useDeleteReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, replyId }: { commentId: string; replyId: string }) => {
      return fetchAPI(ENDPOINTS.social.replyDetail(commentId, replyId), { method: "DELETE" });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["replies", variables.commentId] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// SHARE TRACKING
// ═══════════════════════════════════════════════════════════════

export function useShareContent() {
  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "post" | "prayer" }) => {
      const endpoint = type === "post" ? ENDPOINTS.social.postShare(id) : ENDPOINTS.social.prayerShare(id);
      return fetchAPI(endpoint);
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// MEDIA UPLOAD
// ═══════════════════════════════════════════════════════════════

export function useMediaUpload() {
  return useMutation({
    mutationFn: async (files: File | File[]) => {
      const formData = new FormData();
      const fileArr = Array.isArray(files) ? files : [files];
      fileArr.forEach((f) => formData.append("files", f));
      const res = await fetchAPI<import("../types").MediaUploadResult[]>(ENDPOINTS.social.mediaUpload, { method: "POST", body: formData });
      return res.data;
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// SHOP DOWNLOADS
// ═══════════════════════════════════════════════════════════════

export function useDownload() {
  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetchAPI<{ url?: string; download_url?: string }>(ENDPOINTS.shop.download(productId));
      return res.data?.url || res.data?.download_url || "";
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// MUTATIONS (shared)
// ═══════════════════════════════════════════════════════════════

export function useReact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type, emojiType }: { id: string; type: string; emojiType: string }) => {
      const endpoint = type === "post" ? ENDPOINTS.social.postReact(id) : ENDPOINTS.social.prayerReact(id);
      return fetchAPI(endpoint, { method: "POST", body: JSON.stringify({ emoji_type: emojiType }) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feed"] }); },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, body }: { type: "post" | "prayer"; body: Record<string, unknown> }) => {
      const endpoint = type === "post" ? ENDPOINTS.social.posts : ENDPOINTS.social.prayers;
      return fetchAPI(endpoint, { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feed"] }); },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const endpoint = type === "post" ? ENDPOINTS.social.postDetail(id) : ENDPOINTS.social.prayerDetail(id);
      return fetchAPI(endpoint, { method: "DELETE" });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feed"] }); },
  });
}

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "follow" | "unfollow" }) => {
      return fetchAPI(ENDPOINTS.profile.follow(userId), { method: action === "follow" ? "POST" : "DELETE" });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); },
  });
}

export function useAddBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { bookmark_type: string; verse_reference?: string; content_type?: number; object_id?: string }) => {
      return fetchAPI(ENDPOINTS.bible.bookmarks, { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookmarks"] }); },
  });
}

export function useRemoveBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return fetchAPI(ENDPOINTS.bible.bookmarkDetail(id), { method: "DELETE" });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookmarks"] }); },
  });
}

export function useAddHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { highlight_type: string; color: string; selected_text?: string; verse_reference?: string; content_type?: number; object_id?: string; selection_start?: number; selection_end?: number }) => {
      return fetchAPI(ENDPOINTS.bible.highlights, { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["highlights"] }); },
  });
}

export function useRemoveHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return fetchAPI(ENDPOINTS.bible.highlightDetail(id), { method: "DELETE" });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["highlights"] }); },
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { note_type: string; text: string; verse_reference?: string; content_type?: number; object_id?: string }) => {
      return fetchAPI(ENDPOINTS.bible.notes, { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); },
  });
}

export function useRemoveNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return fetchAPI(ENDPOINTS.bible.noteDetail(id), { method: "DELETE" });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      return fetchAPI(ENDPOINTS.bible.noteDetail(id), { method: "PATCH", body: JSON.stringify({ text }) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); },
  });
}

export function useApiBibleSearch(bibleId: string, query: string) {
  return useQuery({
    queryKey: ["apiBibleSearch", bibleId, query],
    queryFn: async () => {
      const res = await fetchAPI<BibleSearchResult>(`${ENDPOINTS.bible.apiBibleSearch(bibleId)}?query=${encodeURIComponent(query)}`);
      return res?.data || { verses: [] };
    },
    enabled: !!bibleId && !!query.trim(),
    ...CACHE_DURATIONS.segregatedPages,
  });
}

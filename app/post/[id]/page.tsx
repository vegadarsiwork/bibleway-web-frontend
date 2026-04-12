"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MainLayout from "../../components/MainLayout";
import { fetchAPI } from "../../lib/api";
import { containsProfanity, getProfanityWarning } from "../../lib/contentFilter";
import { useToast } from "../../components/Toast";

import { REACTIONS } from "../../lib/constants";
import type { Post, Comment, Reply, EmojiType } from "../../types";

function PostDetailCarousel({ media }: { media: { id?: string; file: string; media_type: string }[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollTo(index: number) {
    const clamped = Math.max(0, Math.min(index, media.length - 1));
    setActiveIndex(clamped);
    scrollRef.current?.children[clamped]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }

  if (media.length === 1) {
    return (
      <div className="rounded-xl overflow-hidden mb-6 bg-surface-container-low">
        <img src={media[0].file} alt="Post media" className="w-full object-cover max-h-[600px] min-h-[200px]" />
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden mb-6 bg-surface-container-low">
      <div ref={scrollRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {media.map((item, i) => (
          <div key={item.id || i} className="w-full shrink-0 snap-center">
            <img src={item.file} alt={`Media ${i + 1}`} className="w-full object-cover max-h-[600px] min-h-[200px]" />
          </div>
        ))}
      </div>
      {media.length > 1 && (
        <>
          {activeIndex > 0 && (
            <button onClick={() => scrollTo(activeIndex - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
          )}
          {activeIndex < media.length - 1 && (
            <button onClick={() => scrollTo(activeIndex + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          )}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {media.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? "bg-white w-3" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SinglePostPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [openReaction, setOpenReaction] = useState(false);
  const reactionRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reacting, setReacting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  const [repliesData, setRepliesData] = useState<Record<string, Reply[]>>({});
  const [repliesLoading, setRepliesLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState(false);
  const [editPostText, setEditPostText] = useState("");
  const [savingPost, setSavingPost] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const { showToast } = useToast();
  useEffect(() => { setCurrentUserId(localStorage.getItem("user_id")); }, []);

  // Close reaction picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) {
        setOpenReaction(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!postId) return;
    async function load() {
      try {
        const res = await fetchAPI(`/social/posts/${postId}/`);
        const data = res.data || res;
        setPost(data);
        loadComments();
      } catch {
        /* failed to load post */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  async function loadComments() {
    setCommentsLoading(true);
    try {
      const res = await fetchAPI(`/social/posts/${postId}/comments/`);
      setComments(res?.data?.results ?? res?.results ?? []);
    } catch { /* failed to load comments */ } finally {
      setCommentsLoading(false);
    }
  }

  async function handleReact(emojiType: string) {
    if (reacting) return;
    setReacting(true);
    setOpenReaction(false);

    const prevCount = post?.reaction_count || 0;
    const prevReaction = post?.user_reaction;
    const isRemoving = prevReaction === emojiType;

    // Optimistic update
    setPost((p) => p ? ({
      ...p,
      reaction_count: isRemoving ? Math.max(0, prevCount - 1) : prevCount + (prevReaction ? 0 : 1),
      user_reaction: isRemoving ? null : emojiType as EmojiType,
    }) : p);

    try {
      const res = await fetchAPI(`/social/posts/${postId}/react/`, {
        method: "POST",
        body: JSON.stringify({ emoji_type: emojiType }),
      });
      const wasRemoved = res?.message === "Reaction removed.";
      const serverCount = res?.data?.reaction_count;
      setPost((p) => p ? ({
        ...p,
        reaction_count: serverCount !== undefined ? serverCount : p.reaction_count,
        user_reaction: wasRemoved ? null : emojiType as EmojiType,
      }) : p);
    } catch {
      // Revert on error
      setPost((p) => p ? ({ ...p, reaction_count: prevCount, user_reaction: prevReaction }) : p);
    } finally {
      setReacting(false);
    }
  }

  async function handlePostComment() {
    if (!newComment.trim() || postingComment) return;
    setPostingComment(true);
    try {
      await fetchAPI(`/social/posts/${postId}/comments/`, {
        method: "POST",
        body: JSON.stringify({ text: newComment.trim() }),
      });
      setNewComment("");
      await loadComments();
      setPost((p) => p ? ({ ...p, comment_count: (p.comment_count || 0) + 1 }) : p);
    } catch { /* failed to post comment */ } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete comment?")) return;
    try {
      await fetchAPI(`/social/comments/${commentId}/`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((p) => p ? ({ ...p, comment_count: Math.max(0, (p.comment_count || 0) - 1) }) : p);
    } catch { /* failed to delete comment */ }
  }

  async function loadReplies(commentId: string) {
    setRepliesLoading(commentId);
    try {
      const res = await fetchAPI(`/social/comments/${commentId}/replies/`);
      setRepliesData((prev) => ({ ...prev, [commentId]: res?.data?.results ?? res?.results ?? [] }));
    } catch { /* failed to load replies */ } finally {
      setRepliesLoading(null);
    }
  }

  async function handlePostReply(commentId: string) {
    if (!replyText.trim() || postingReply) return;
    setPostingReply(true);
    try {
      await fetchAPI(`/social/comments/${commentId}/replies/`, { method: "POST", body: JSON.stringify({ text: replyText.trim() }) });
      setReplyText("");
      setReplyingTo(null);
      await loadReplies(commentId);
    } catch { /* failed to post reply */ } finally {
      setPostingReply(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/post/${postId}`;
    try {
      await fetchAPI(`/social/posts/${postId}/share/`).catch(() => null);
      await navigator.clipboard.writeText(url);
    } catch {
      await navigator.clipboard.writeText(url).catch(() => { prompt("Copy this link:", url); });
    }
    setToast("Link copied to clipboard!");
    setTimeout(() => setToast(null), 2500);
  }

  async function handleEditPost() {
    const trimmed = editPostText.trim();
    if (!trimmed || savingPost) return;
    if (containsProfanity(trimmed)) {
      showToast("error", "Language Warning", getProfanityWarning());
      return;
    }
    setSavingPost(true);
    try {
      await fetchAPI(`/social/posts/${postId}/`, { method: "PATCH", body: JSON.stringify({ text_content: trimmed }) });
      setPost((p) => p ? ({ ...p, text_content: trimmed }) : p);
      setEditingPost(false);
      showToast("success", "Updated", "Your post has been updated.");
    } catch {
      showToast("error", "Error", "Failed to update post.");
    } finally {
      setSavingPost(false);
    }
  }

  async function handleEditComment(commentId: string) {
    const trimmed = editCommentText.trim();
    if (!trimmed || savingComment) return;
    if (containsProfanity(trimmed)) {
      showToast("error", "Language Warning", getProfanityWarning());
      return;
    }
    setSavingComment(true);
    try {
      await fetchAPI(`/social/comments/${commentId}/`, { method: "PATCH", body: JSON.stringify({ text: trimmed }) });
      setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, text: trimmed } : c));
      setEditingCommentId(null);
      showToast("success", "Updated", "Comment updated.");
    } catch {
      showToast("error", "Error", "Failed to update comment.");
    } finally {
      setSavingComment(false);
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

  if (!post) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h1 className="text-3xl font-headline mb-4">Post Not Found</h1>
          <Link href="/" className="text-primary font-bold">Go Home</Link>
        </div>
      </MainLayout>
    );
  }

  const userReactionEmoji = post.user_reaction ? REACTIONS.find((r) => r.type === post.user_reaction)?.emoji : null;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="text-sm font-medium">Back to Feed</span>
        </Link>

        <article className="bg-surface-container-lowest rounded-xl p-4 sm:p-8 editorial-shadow">
          <div className="flex items-center space-x-4 mb-6">
            <Link href={`/user/${post.author?.id}`} className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center">
              {post.author?.profile_photo ? (
                <img src={post.author.profile_photo} alt={post.author.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant">person</span>
              )}
            </Link>
            <div>
              <Link href={`/user/${post.author?.id}`} className="font-headline text-lg hover:text-primary transition-colors">{post.author?.full_name || "Anonymous"}</Link>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider">{new Date(post.created_at).toLocaleDateString()}</p>
            </div>
            {currentUserId && post.author?.id === currentUserId && !editingPost && (
              <button onClick={() => { setEditingPost(true); setEditPostText(post.text_content || ""); }} className="ml-auto text-on-surface-variant hover:text-primary transition-colors p-2" title="Edit post">
                <span className="material-symbols-outlined">edit</span>
              </button>
            )}
          </div>

          {editingPost ? (
            <div className="mb-6">
              <textarea
                value={editPostText}
                onChange={(e) => setEditPostText(e.target.value)}
                className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-lg leading-relaxed resize-none min-h-[80px]"
                rows={3}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button onClick={handleEditPost} disabled={savingPost || !editPostText.trim()} className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-medium disabled:opacity-50">
                  {savingPost ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditingPost(false)} disabled={savingPost} className="px-4 py-1.5 bg-surface-container-high text-on-surface rounded-lg text-sm font-medium">
                  Cancel
                </button>
              </div>
            </div>
          ) : post.text_content ? (
            <p className="text-on-surface text-lg leading-relaxed mb-6">{post.text_content}</p>
          ) : null}

          {post.media?.length > 0 && (
            <PostDetailCarousel media={post.media} />
          )}

          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10" ref={reactionRef}>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <button
                  onClick={() => {
                    if (post.user_reaction) handleReact(post.user_reaction);
                    else setOpenReaction(!openReaction);
                  }}
                  className={`flex items-center space-x-2 transition-all ${post.user_reaction ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
                >
                  {userReactionEmoji ? <span className="text-xl">{userReactionEmoji}</span> : <span className="material-symbols-outlined">favorite</span>}
                  <span className="text-sm font-medium">{post.reaction_count || 0}</span>
                </button>
                {openReaction && (
                  <div className="absolute bottom-full left-0 mb-2 bg-surface-container-lowest rounded-full shadow-xl border border-outline-variant/20 p-1.5 flex items-center gap-1 z-50">
                    {REACTIONS.map((r) => (
                      <button key={r.type} onClick={() => handleReact(r.type)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high hover:scale-125 transition-all">
                        <span className="text-xl">{r.emoji}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="flex items-center space-x-2 text-on-surface-variant">
                <span className="material-symbols-outlined">chat_bubble</span>
                <span className="text-sm font-medium">{post.comment_count || 0}</span>
              </span>
            </div>
            <button onClick={handleShare} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </article>

        {/* Comments */}
        <div className="mt-8 space-y-4">
          <h3 className="font-headline text-xl">Comments</h3>
          <div className="flex items-start gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm"
              />
              <button onClick={handlePostComment} disabled={!newComment.trim() || postingComment} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary disabled:opacity-30">
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </div>
          </div>

          {commentsLoading ? (
            <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div></div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id}>
                  <div className="bg-surface-container-low rounded-xl px-4 py-3">
                    <div className="flex justify-between items-start">
                      <Link href={`/user/${c.user?.id}`} className="font-semibold text-sm hover:text-primary">{c.user?.full_name || "User"}</Link>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); if (!repliesData[c.id]) loadReplies(c.id); }} className="text-on-surface-variant hover:text-primary transition-colors" title="Reply">
                          <span className="material-symbols-outlined text-xs">reply</span>
                        </button>
                        {currentUserId && c.user?.id === currentUserId && (
                          <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.text); }} className="text-on-surface-variant hover:text-primary transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-xs">edit</span>
                          </button>
                        )}
                        {currentUserId && c.user?.id === currentUserId && (
                          <button onClick={() => handleDeleteComment(c.id)} className="text-on-surface-variant hover:text-red-500 transition-colors" title="Delete">
                            <span className="material-symbols-outlined text-xs">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                    {editingCommentId === c.id ? (
                      <div className="mt-1">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="w-full bg-surface-container-high rounded-lg px-3 py-1.5 text-sm resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => handleEditComment(c.id)} disabled={savingComment || !editCommentText.trim()} className="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-medium disabled:opacity-50">
                            {savingComment ? "Saving..." : "Save"}
                          </button>
                          <button onClick={() => setEditingCommentId(null)} disabled={savingComment} className="px-3 py-1 bg-surface-container-high text-on-surface rounded-lg text-xs font-medium">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface-variant">{c.text}</p>
                    )}
                  </div>
                  {replyingTo === c.id && (
                    <div className="ml-8 mt-2 space-y-2">
                      {repliesLoading === c.id ? (
                        <div className="flex justify-center py-1"><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary"></div></div>
                      ) : (repliesData[c.id] || []).map((r) => (
                        <div key={r.id} className="bg-surface-container-high rounded-lg px-3 py-1.5">
                          <Link href={`/user/${r.user?.id}`} className="font-semibold text-xs hover:text-primary">{r.user?.full_name || "User"}</Link>
                          <p className="text-xs text-on-surface-variant">{r.text}</p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input type="text" placeholder="Write a reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePostReply(c.id)} className="flex-1 bg-surface-container-high rounded-lg px-3 py-1.5 text-xs" />
                        <button onClick={() => handlePostReply(c.id)} disabled={!replyText.trim() || postingReply} className="text-primary disabled:opacity-30"><span className="material-symbols-outlined text-sm">send</span></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-6 py-3 rounded-full shadow-xl z-[20000] text-sm font-medium">
          {toast}
        </div>
      )}
    </MainLayout>
  );
}

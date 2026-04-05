"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { fetchAPI } from "../lib/api";
import StickerPicker, { STICKERS } from "./StickerPicker";
import { containsProfanity, getProfanityWarning } from "../lib/contentFilter";
import { useToast } from "./Toast";
import { useTranslation } from "../lib/i18n";

interface MediaItem {
  id?: string;
  file: string;
  media_type: string;
  order?: number;
}

interface FeedPost {
  id: string;
  author: string;
  authorId: string;
  authorPhoto: string | null;
  time: string;
  rawDate: string;
  title?: string;
  content: string;
  image?: string;
  media?: MediaItem[];
  likes: number;
  prayers?: number;
  comments: number;
  type: "post" | "prayer";
  userReaction: string | null;
  is_boosted?: boolean;
}

import { REACTIONS } from "../lib/constants";

function MediaLightbox({ src, mediaType, onClose }: { src: string; mediaType: string; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center cursor-zoom-out" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-50">
        <span className="material-symbols-outlined">close</span>
      </button>
      <div className="max-w-[100vw] w-full h-[100dvh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {mediaType === "video" ? (
          <video src={src} className="max-w-full max-h-[100dvh] h-full object-contain" controls autoPlay playsInline />
        ) : (
          <img src={src} alt="Preview" className="max-w-full max-h-[100dvh] object-contain" />
        )}
      </div>
    </div>
  );
}

function CustomVideoPlayer({ src, onMaximize }: { src: string, onMaximize?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const ob = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        videoRef.current?.play().catch(()=>{});
        setIsPlaying(true);
      } else {
        videoRef.current?.pause();
        setIsPlaying(false);
      }
    }, { threshold: 0.6 });
    if (videoRef.current) ob.observe(videoRef.current);
    return () => ob.disconnect();
  }, []);

  function togglePlay(e: React.MouseEvent) {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  }

  return (
    <div 
      className="relative w-full h-full bg-black group flex items-center justify-center"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
    >
      <video 
        ref={videoRef}
        src={src} 
        className="w-full h-full object-cover max-h-[700px] min-h-[400px]" 
        loop playsInline muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none transition-opacity">
          <div className="w-16 h-16 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md">
            <span className="material-symbols-outlined text-4xl ml-2">play_arrow</span>
          </div>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        
        <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <button onClick={togglePlay} className="text-white hover:text-white/80 p-1">
            <span className="material-symbols-outlined text-2xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>
          
          <div className="flex gap-3">
            <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-white/80 p-1">
              <span className="material-symbols-outlined text-2xl">{isMuted ? 'volume_off' : 'volume_up'}</span>
            </button>
            {onMaximize && (
              <button onClick={onMaximize} className="text-white hover:text-white/80 p-1">
                <span className="material-symbols-outlined text-2xl">fullscreen</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostMediaCarousel({ media, postHref }: { media: { file: string; media_type: string }[]; postHref?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxMedia, setLightboxMedia] = useState<{src: string, type: string} | null>(null);
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

  return (
    <>
      <div className="relative rounded-xl overflow-hidden mb-6 bg-surface-container-low">
        <div ref={scrollRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar text-[0]">
          {media.map((item, i) => (
            <div key={i} className={`w-full shrink-0 snap-center relative bg-surface-container ${media.length > 1 ? 'aspect-[4/5] sm:aspect-[1/1] md:aspect-[4/5] max-h-[650px]' : ''}`}>
              {item.media_type === "video" ? (
                <CustomVideoPlayer src={item.file} onMaximize={() => setLightboxMedia({ src: item.file, type: "video" })} />
              ) : postHref ? (
                <Link href={postHref} className={`block w-full h-full ${media.length === 1 ? 'max-h-[700px] min-h-[300px]' : ''}`}>
                  <img
                    src={item.file}
                    alt={`Media ${i + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                  />
                </Link>
              ) : (
                <img
                  src={item.file}
                  alt={`Media ${i + 1}`}
                  onClick={() => setLightboxMedia({ src: item.file, type: "image" })}
                  className={`w-full h-full object-cover cursor-zoom-in ${media.length === 1 ? 'max-h-[700px] min-h-[300px]' : ''}`}
                />
              )}
            </div>
          ))}
        </div>
        {media.length > 1 && (
          <>
            {activeIndex > 0 && (
              <button onClick={(e) => { e.stopPropagation(); scrollTo(activeIndex - 1); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
            )}
            {activeIndex < media.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); scrollTo(activeIndex + 1); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
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
      {lightboxMedia && <MediaLightbox src={lightboxMedia.src} mediaType={lightboxMedia.type} onClose={() => setLightboxMedia(null)} />}
    </>
  );
}

interface FeedCardProps {
  post: FeedPost;
  currentUserId: string | null;
  onReact: (postId: string, postType: string, emojiType: string) => void;
  onDelete: (id: string, type: string) => void;
  onShare: (postId: string, postType: string) => void;
  onReport: (type: string, id: string) => void;
  animatingReaction: { postId: string; emoji: string } | null;
  openReactionId: string | null;
  setOpenReactionId: (id: string | null) => void;
  reactionRef: React.RefObject<HTMLDivElement | null>;
}

export default function FeedCard({
  post, currentUserId, onReact, onDelete, onShare, onReport,
  animatingReaction, openReactionId, setOpenReactionId, reactionRef,
}: FeedCardProps) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  const [repliesData, setRepliesData] = useState<Record<string, any[]>>({});
  const [repliesLoading, setRepliesLoading] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editPostText, setEditPostText] = useState("");
  const [savingPost, setSavingPost] = useState(false);
  const [localContent, setLocalContent] = useState(post.content);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [openMenu]);

  async function loadComments() {
    setCommentsLoading(true);
    try {
      const endpoint = post.type === "post"
        ? `/social/posts/${post.id}/comments/`
        : `/social/prayers/${post.id}/comments/`;
      const res = await fetchAPI(endpoint);
      setComments(res?.data?.results ?? res?.results ?? []);
    } catch { /* failed to load comments */ } finally {
      setCommentsLoading(false);
    }
  }

  function toggleComments() {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    if (comments.length === 0) loadComments();
  }

  async function handlePostComment() {
    if (!newComment.trim() || postingComment) return;
    if (containsProfanity(newComment)) {
      showToast("error", "Language Warning", getProfanityWarning());
      return;
    }
    setPostingComment(true);
    try {
      const endpoint = post.type === "post"
        ? `/social/posts/${post.id}/comments/`
        : `/social/prayers/${post.id}/comments/`;
      await fetchAPI(endpoint, { method: "POST", body: JSON.stringify({ text: newComment.trim() }) });
      setNewComment("");
      setCommentCount((c) => c + 1);
      await loadComments();
    } catch { /* failed to post comment */ } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete comment?")) return;
    try {
      await fetchAPI(`/social/comments/${commentId}/`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((c) => Math.max(0, c - 1));
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
    if (containsProfanity(replyText)) {
      showToast("error", "Language Warning", getProfanityWarning());
      return;
    }
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

  async function handleEditPost() {
    const trimmed = editPostText.trim();
    if (!trimmed || savingPost) return;
    if (containsProfanity(trimmed)) {
      showToast("error", "Language Warning", getProfanityWarning());
      return;
    }
    setSavingPost(true);
    try {
      const endpoint = post.type === "post"
        ? `/social/posts/${post.id}/`
        : `/social/prayers/${post.id}/`;
      const body = post.type === "post"
        ? { text_content: trimmed }
        : { description: trimmed };
      await fetchAPI(endpoint, { method: "PATCH", body: JSON.stringify(body) });
      setLocalContent(trimmed);
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

  function handleStickerSelect(stickerId: string) {
    setShowStickerPicker(false);
    const numId = stickerId.startsWith("gif_") ? stickerId.replace("gif_", "") : stickerId;
    setNewComment(`[sticker:${numId}]`);
    // Auto-submit the sticker as a comment
    (async () => {
      setPostingComment(true);
      try {
        const endpoint = post.type === "post"
          ? `/social/posts/${post.id}/comments/`
          : `/social/prayers/${post.id}/comments/`;
        await fetchAPI(endpoint, { method: "POST", body: JSON.stringify({ text: `[sticker:${numId}]` }) });
        setNewComment("");
        setCommentCount((c) => c + 1);
        await loadComments();
      } catch { /* failed to post sticker */ } finally {
        setPostingComment(false);
      }
    })();
  }

  function renderCommentText(text: string) {
    const stickerMatch = text.match(/^\[sticker:(\w+)\]$/);
    if (stickerMatch) {
      const stickerId = stickerMatch[1];
      // GIF sticker (gif_1 through gif_87)
      const gifMatch = stickerId.match(/^gif_(\d+)$/);
      if (gifMatch) {
        return <img src={`/stickers/sticker_${gifMatch[1]}.gif`} alt="Sticker" className="w-16 h-16 object-contain" />;
      }
      // Emoji sticker fallback
      const sticker = STICKERS.find((s) => s.id === stickerId);
      if (sticker) {
        return <span className="text-4xl leading-none">{sticker.emoji}</span>;
      }
    }
    return <>{text}</>;
  }

  function renderPostContent(text: string, type: string) {
    return <p className={`text-on-surface leading-relaxed mb-6 ${type === "prayer" ? "italic text-xl" : "text-lg"}`}>{text}</p>;
  }

  const userReactionEmoji = post.userReaction ? REACTIONS.find((r) => r.type === post.userReaction)?.emoji : null;

  return (
    <article data-post-id={post.id} data-post-type={post.type} className="bg-surface-container-lowest rounded-xl p-8 editorial-shadow relative">
      {animatingReaction?.postId === post.id && (
        <div className="reaction-animate top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{animatingReaction.emoji}</div>
      )}

      {post.is_boosted && (
        <div className="absolute top-4 right-4 bg-tertiary-fixed/20 text-tertiary px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-10">
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
          Boosted
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href={`/user/${post.authorId}`} className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center">
            {post.authorPhoto ? <img src={post.authorPhoto} alt={post.author} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-on-surface-variant">person</span>}
          </Link>
          <div>
            <Link href={`/user/${post.authorId}`} className="font-headline text-lg leading-tight hover:text-primary transition-colors">{post.author}</Link>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider">{post.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {currentUserId && post.authorId === currentUserId && (
            <button onClick={() => onDelete(post.id, post.type)} className="text-on-surface-variant hover:text-red-500 transition-colors p-2" title="Delete">
              <span className="material-symbols-outlined">delete</span>
            </button>
          )}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setOpenMenu(!openMenu)} className="text-on-surface-variant hover:text-primary transition-colors p-2">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            {openMenu && (
              <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 z-50 overflow-hidden w-44">
                {currentUserId && post.authorId === currentUserId && (
                  <button onClick={() => { setEditingPost(true); setEditPostText(localContent); setOpenMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">edit</span> Edit Post
                  </button>
                )}
                {currentUserId && post.authorId === currentUserId && (
                  <Link href={`/boost?post=${post.id}`} onClick={() => setOpenMenu(false)} className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">rocket_launch</span> Boost Post
                  </Link>
                )}
                <button onClick={() => { onReport(post.type, post.id); setOpenMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">flag</span> Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingPost ? (
        <div className="mb-6">
          {post.title && <h3 className="text-2xl font-headline mb-3">{post.title}</h3>}
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
      ) : (
        <Link href={`/${post.type === "prayer" ? "prayer" : "post"}/${post.id}`} className="block">
          {post.title && <h3 className="text-2xl font-headline mb-3 hover:text-primary transition-colors">{post.title}</h3>}
          {renderPostContent(localContent, post.type)}
        </Link>
      )}

      {(() => {
        const media = post.media && post.media.length > 0 ? post.media : post.image ? [{ file: post.image, media_type: "image" }] : [];
        if (media.length === 0) return null;
        return <PostMediaCarousel media={media} postHref={`/${post.type === "prayer" ? "prayer" : "post"}/${post.id}`} />;
      })()}

      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10" ref={openReactionId === post.id ? reactionRef : undefined}>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <button
              onClick={() => { if (post.userReaction) onReact(post.id, post.type, post.userReaction); else setOpenReactionId(openReactionId === post.id ? null : post.id); }}
              className={`flex items-center space-x-2 transition-all ${post.userReaction ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
            >
              {userReactionEmoji ? <span className="text-xl">{userReactionEmoji}</span> : <span className="material-symbols-outlined">{post.type === "prayer" ? "folded_hands" : "favorite"}</span>}
              <span className="text-sm font-medium">{post.likes || post.prayers || 0}</span>
            </button>
            {openReactionId === post.id && (
              <div className="absolute bottom-full left-0 mb-2 bg-surface-container-lowest rounded-full shadow-xl border border-outline-variant/20 p-1.5 flex items-center gap-1 z-50 animate-in fade-in zoom-in duration-200">
                {REACTIONS.map((r) => (
                  <button key={r.type} onClick={() => onReact(post.id, post.type, r.type)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high hover:scale-125 transition-all">
                    <span className="text-xl">{r.emoji}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={toggleComments} className={`flex items-center space-x-2 transition-colors ${showComments ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}>
            <span className="material-symbols-outlined">chat_bubble</span>
            <span className="text-sm font-medium">{commentCount}</span>
          </button>
        </div>
        <button onClick={() => onShare(post.id, post.type)} className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">share</span></button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-outline-variant/10">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1 relative">
              <input type="text" placeholder="Write a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePostComment()} className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 pr-16 text-sm" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <div className="relative">
                  <button onClick={() => setShowStickerPicker(!showStickerPicker)} className="text-on-surface-variant hover:text-primary transition-colors" title="Stickers">
                    <span className="material-symbols-outlined text-lg">sentiment_satisfied</span>
                  </button>
                  {showStickerPicker && (
                    <StickerPicker onSelect={handleStickerSelect} onClose={() => setShowStickerPicker(false)} />
                  )}
                </div>
                <button onClick={handlePostComment} disabled={!newComment.trim() || postingComment} className="text-primary disabled:opacity-30"><span className="material-symbols-outlined text-lg">send</span></button>
              </div>
            </div>
          </div>
          {commentsLoading ? (
            <div className="flex justify-center"><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div></div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((c: any) => (
                <div key={c.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 bg-surface-container-low rounded-xl px-4 py-2 relative">
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
                        <p className="text-sm text-on-surface-variant">{renderCommentText(c.text)}</p>
                      )}
                    </div>
                  </div>
                  {replyingTo === c.id && (
                    <div className="ml-8 mt-2 space-y-2">
                      {repliesLoading === c.id ? (
                        <div className="flex justify-center py-1"><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary"></div></div>
                      ) : (repliesData[c.id] || []).map((r: any) => (
                        <div key={r.id} className="bg-surface-container-high rounded-lg px-3 py-1.5">
                          <span className="font-semibold text-xs">{r.user?.full_name || "User"}</span>
                          <p className="text-xs text-on-surface-variant">{renderCommentText(r.text)}</p>
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
      )}
    </article>
  );
}

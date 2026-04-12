"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { fetchAPI } from "../lib/api";
import ImageCropper from "./ImageCropper";
import { containsProfanity, getProfanityWarning } from "../lib/contentFilter";
import { useToast } from "./Toast";

const MAX_IMAGES = 5;

interface PostingModalProps {
  activeTab: "post" | "prayer";
  onClose: () => void;
  onPostCreated: () => void;
}

export default function PostingModal({ activeTab: initialTab, onClose, onPostCreated }: PostingModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [postTitle, setPostTitle] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("draft_title") || "";
    return "";
  });
  const [postContent, setPostContent] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("draft_content") || "";
    return "";
  });
  const [posting, setPosting] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const userName = typeof window !== "undefined"
    ? (() => { try { return JSON.parse(localStorage.getItem("user") || "{}").full_name; } catch { return null; } })()
    : null;

  function handleMediaSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    if (mediaInputRef.current) mediaInputRef.current.value = "";

    const remaining = MAX_IMAGES - mediaPreviews.length;
    const selected = files.slice(0, remaining);
    if (selected.length === 0) return;

    const newPreviews = selected.map((f) => URL.createObjectURL(f));
    const newTypes = selected.map((f) => f.type.startsWith("video/") ? "video" : "image");

    setMediaPreviews((prev) => [...prev, ...newPreviews]);
    setMediaFiles((prev) => [...prev, ...selected]);
    setMediaTypes((prev) => [...prev, ...newTypes]);
  }

  function removeMedia(index: number) {
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaTypes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCropDone(blob: Blob) {
    if (editingIndex === null) return;
    const newPreview = URL.createObjectURL(blob);
    setMediaPreviews((prev) => prev.map((p, i) => i === editingIndex ? newPreview : p));
    const newFile = new File([blob], `cropped_${Date.now()}.jpg`, { type: "image/jpeg" });
    setMediaFiles((prev) => prev.map((f, i) => i === editingIndex ? newFile : f));
    setEditingIndex(null);
  }

  const { showToast } = useToast();

  async function handleCreatePost() {
    const hasText = postContent.trim().length > 0;
    const hasMedia = mediaFiles.length > 0;
    if ((!hasText && !hasMedia) || posting) return;
    if (containsProfanity(postContent) || containsProfanity(postTitle)) {
      showToast("error", "Content Warning", getProfanityWarning());
      return;
    }
    setPosting(true);
    setUploadingMedia(true);
    setUploadError(null);
    try {
      let finalMediaKeys: string[] = [];
      let finalMediaTypes: string[] = [];

      if (mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach((file) => formData.append("files", file));
        const uploadRes = await fetchAPI("/social/media/upload/", { method: "POST", body: formData });
        const raw = uploadRes?.data || uploadRes;
        const results = Array.isArray(raw) ? raw : raw ? [raw] : [];
        if (!results.length) {
          throw new Error("Upload returned no results. Please try again.");
        }
        finalMediaKeys = results.map((r: { key?: string; id?: string }) => r.key || r.id || "");
        finalMediaTypes = mediaTypes;
      }

      const endpoint = activeTab === "post" ? "/social/posts/" : "/social/prayers/";
      const body: Record<string, unknown> = activeTab === "post"
        ? { text_content: postContent }
        : { title: postTitle || "Prayer Request", description: postContent };
      if (finalMediaKeys.length > 0) {
        body.media_keys = finalMediaKeys;
        body.media_types = finalMediaTypes;
      }

      await fetchAPI(endpoint, { method: "POST", body: JSON.stringify(body) });

      if (typeof window !== "undefined") {
        localStorage.removeItem("draft_content");
        localStorage.removeItem("draft_title");
      }
      onClose();
      onPostCreated();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Something went wrong.");
      const msg = error.name === "AbortError" ? "Upload timed out. Try a smaller file or check your connection." : error.message;
      setUploadError(msg);
      showToast("error", "Failed to publish", msg);
    } finally {
      setPosting(false);
      setUploadingMedia(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const modal = (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/10 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-primary text-xl">
                {activeTab === "post" ? "edit" : "folded_hands"}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-headline text-on-surface">
                {activeTab === "post" ? "Create Post" : "Prayer Request"}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                Posting as <span className="text-primary">{userName || "You"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 sm:px-8 flex gap-4 border-b border-outline-variant/10">
          <button
            onClick={() => setActiveTab("post")}
            className={`pb-2.5 text-sm font-semibold transition-all border-b-2 ${activeTab === "post" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}
          >
            Post
          </button>
          <button
            onClick={() => setActiveTab("prayer")}
            className={`pb-2.5 text-sm font-semibold transition-all border-b-2 ${activeTab === "prayer" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}
          >
            Prayer Request
          </button>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 space-y-4 overflow-y-auto flex-1">
          {uploadError && (
            <div className="flex items-center gap-2 text-sm text-error bg-error-container/20 px-4 py-3 rounded-xl">
              <span className="material-symbols-outlined text-sm">error</span>
              {uploadError}
            </div>
          )}
          {mediaPreviews.length > 0 && (<>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {mediaPreviews.map((preview, i) => (
                <div key={i} className="relative shrink-0 w-24 h-24 group/thumb">
                  {mediaTypes[i] === "video" ? (
                    <video src={preview} className="w-full h-full object-cover rounded-xl" muted playsInline />
                  ) : (
                    <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
                  )}
                  <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 z-10">
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                  {mediaTypes[i] !== "video" && (
                    <button
                      onClick={() => setEditingIndex(i)}
                      className="absolute bottom-1 left-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10"
                      title="Crop & adjust"
                    >
                      <span className="material-symbols-outlined text-xs">crop</span>
                    </button>
                  )}
                </div>
              ))}
              {mediaFiles.length < MAX_IMAGES && (
                <button
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-on-surface-variant/50 hover:border-primary/40 hover:text-primary/60 transition-all"
                >
                  <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
                  <span className="text-[10px] mt-0.5">{mediaFiles.length}/{MAX_IMAGES}</span>
                </button>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/60 mt-1">
              <span className="material-symbols-outlined text-[13px]">info</span>
              Tall photos will be cropped to fit the feed. Tap <span className="material-symbols-outlined text-[11px]">crop</span> to adjust.
            </p>
          </>)}

          {activeTab === "prayer" && (
            <input
              type="text"
              placeholder="Subject of your prayer..."
              value={postTitle}
              onChange={(e) => { setPostTitle(e.target.value); localStorage.setItem("draft_title", e.target.value); }}
              className="w-full bg-transparent border-b border-outline-variant/30 px-0 py-3 focus:outline-none focus:border-primary transition-colors text-xl font-headline placeholder:text-on-surface-variant/30 text-on-surface"
            />
          )}

          <textarea
            rows={6}
            placeholder={activeTab === "post" ? "What's on your heart today?" : "Describe your prayer request..."}
            value={postContent}
            onChange={(e) => { setPostContent(e.target.value); localStorage.setItem("draft_content", e.target.value); }}
            className="w-full bg-transparent p-0 focus:outline-none resize-none text-lg font-body leading-relaxed placeholder:text-on-surface-variant/20 text-on-surface no-scrollbar min-h-[160px]"
          />
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-outline-variant/10 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button onClick={() => mediaInputRef.current?.click()} disabled={mediaFiles.length >= MAX_IMAGES} className="flex items-center gap-2 text-on-surface-variant font-bold text-xs uppercase tracking-widest py-2.5 px-4 rounded-full hover:bg-surface-container-high transition-all disabled:opacity-30">
              <span className="material-symbols-outlined text-lg">{uploadingMedia ? "hourglass_empty" : "image"}</span>
              {uploadingMedia ? "Uploading..." : mediaFiles.length > 0 ? `Media (${mediaFiles.length}/${MAX_IMAGES})` : "Photo/Reel"}
            </button>
            <input type="file" ref={mediaInputRef} onChange={handleMediaSelect} className="hidden" accept="image/*,video/*" multiple />
          </div>
          <button
            onClick={handleCreatePost}
            disabled={(!postContent.trim() && mediaFiles.length === 0) || posting}
            className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold uppercase tracking-widest text-[11px] disabled:opacity-30 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {posting ? "Publishing..." : activeTab === "post" ? "Publish" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );

  // Render via portal to escape overflow-hidden containers
  if (!mounted) return null;
  return (
    <>
      {createPortal(modal, document.body)}
      {editingIndex !== null && mediaPreviews[editingIndex] && (
        <ImageCropper
          imageSrc={mediaPreviews[editingIndex]}
          onCropComplete={handleCropDone}
          onCancel={() => setEditingIndex(null)}
        />
      )}
    </>
  );
}

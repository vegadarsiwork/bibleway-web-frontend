import { useState, useCallback, useRef } from "react";
import { fetchAPI } from "../lib/api";
import { ENDPOINTS } from "../lib/endpoints";
import type { EmojiType, ContentType } from "../types";

interface UseReactionReturn {
  react: (emojiType: EmojiType) => Promise<void>;
  userReaction: EmojiType | null;
  reactionCount: number;
  isAnimating: boolean;
  openReactionPicker: boolean;
  setOpenReactionPicker: (open: boolean) => void;
}

/**
 * Shared hook for reaction (like/pray) logic with optimistic updates.
 *
 * Handles:
 * - Toggling reactions (add/remove)
 * - Optimistic count updates with server reconciliation
 * - Animation state for reaction feedback
 * - Debouncing to prevent rapid-fire clicks
 */
export function useReaction(
  contentType: ContentType,
  objectId: string,
  initialReaction: EmojiType | null,
  initialCount: number,
): UseReactionReturn {
  const [userReaction, setUserReaction] = useState<EmojiType | null>(initialReaction);
  const [reactionCount, setReactionCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [openReactionPicker, setOpenReactionPicker] = useState(false);
  const reactingRef = useRef(false);

  const react = useCallback(
    async (emojiType: EmojiType) => {
      if (reactingRef.current) return;
      reactingRef.current = true;
      setOpenReactionPicker(false);

      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 700);

      const prevReaction = userReaction;
      const prevCount = reactionCount;
      const isRemoving = prevReaction === emojiType;

      // Optimistic update
      setUserReaction(isRemoving ? null : emojiType);
      setReactionCount(
        isRemoving
          ? Math.max(0, prevCount - 1)
          : prevCount + (prevReaction ? 0 : 1),
      );

      try {
        const endpoint =
          contentType === "post"
            ? ENDPOINTS.social.postReact(objectId)
            : ENDPOINTS.social.prayerReact(objectId);

        const res = await fetchAPI(endpoint, {
          method: "POST",
          body: JSON.stringify({ emoji_type: emojiType }),
        });

        const wasRemoved = res?.message === "Reaction removed.";
        const serverCount = res?.data?.reaction_count;

        setUserReaction(wasRemoved ? null : emojiType);
        if (serverCount !== undefined) {
          setReactionCount(serverCount);
        }
      } catch {
        // Revert on error
        setUserReaction(prevReaction);
        setReactionCount(prevCount);
      } finally {
        reactingRef.current = false;
      }
    },
    [contentType, objectId, userReaction, reactionCount],
  );

  return {
    react,
    userReaction,
    reactionCount,
    isAnimating,
    openReactionPicker,
    setOpenReactionPicker,
  };
}

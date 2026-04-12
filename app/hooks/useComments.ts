import { useState, useCallback } from "react";
import { fetchAPI } from "../lib/api";
import { ENDPOINTS } from "../lib/endpoints";
import { containsProfanity, getProfanityWarning } from "../lib/contentFilter";
import type { Comment, Reply, ContentType } from "../types";

interface UseCommentsReturn {
  comments: Comment[];
  commentsLoading: boolean;
  loadComments: () => Promise<void>;
  handlePostComment: (text: string) => Promise<boolean>;
  handleDeleteComment: (commentId: string) => Promise<boolean>;
  handleEditComment: (commentId: string, text: string) => Promise<{ success: boolean; error?: string }>;
  repliesData: Record<string, Reply[]>;
  repliesLoading: string | null;
  loadReplies: (commentId: string) => Promise<void>;
  handlePostReply: (commentId: string, text: string) => Promise<boolean>;
  handleDeleteReply: (commentId: string, replyId: string) => Promise<boolean>;
  editingCommentId: string | null;
  setEditingCommentId: (id: string | null) => void;
}

/**
 * Shared hook for comment CRUD operations across post and prayer detail pages.
 *
 * Encapsulates:
 * - Loading comments from `/social/{type}s/{id}/comments/`
 * - Posting comments (with profanity check)
 * - Loading replies from `/social/comments/{commentId}/replies/`
 * - Posting replies (with profanity check)
 * - Deleting comments and replies
 * - Editing comments
 */
export function useComments(contentType: ContentType, objectId: string): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [repliesData, setRepliesData] = useState<Record<string, Reply[]>>({});
  const [repliesLoading, setRepliesLoading] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const getCommentsEndpoint = useCallback(() => {
    return contentType === "post"
      ? ENDPOINTS.social.postComments(objectId)
      : ENDPOINTS.social.prayerComments(objectId);
  }, [contentType, objectId]);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await fetchAPI(getCommentsEndpoint());
      setComments(res?.data?.results ?? res?.results ?? []);
    } catch {
      /* failed to load comments */
    } finally {
      setCommentsLoading(false);
    }
  }, [getCommentsEndpoint]);

  const handlePostComment = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      if (containsProfanity(trimmed)) {
        return false;
      }
      try {
        await fetchAPI(getCommentsEndpoint(), {
          method: "POST",
          body: JSON.stringify({ text: trimmed }),
        });
        await loadComments();
        return true;
      } catch {
        return false;
      }
    },
    [getCommentsEndpoint, loadComments],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string): Promise<boolean> => {
      try {
        await fetchAPI(ENDPOINTS.social.commentDetail(commentId), {
          method: "DELETE",
        });
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const handleEditComment = useCallback(
    async (
      commentId: string,
      text: string,
    ): Promise<{ success: boolean; error?: string }> => {
      const trimmed = text.trim();
      if (!trimmed) return { success: false, error: "Content cannot be empty" };
      if (containsProfanity(trimmed)) {
        return { success: false, error: getProfanityWarning() };
      }
      try {
        await fetchAPI(ENDPOINTS.social.commentDetail(commentId), {
          method: "PATCH",
          body: JSON.stringify({ text: trimmed }),
        });
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, text: trimmed } : c,
          ),
        );
        setEditingCommentId(null);
        return { success: true };
      } catch {
        return { success: false, error: "Failed to update comment." };
      }
    },
    [],
  );

  const loadReplies = useCallback(async (commentId: string) => {
    setRepliesLoading(commentId);
    try {
      const res = await fetchAPI(ENDPOINTS.social.replies(commentId));
      setRepliesData((prev) => ({
        ...prev,
        [commentId]: res?.data?.results ?? res?.results ?? [],
      }));
    } catch {
      /* failed to load replies */
    } finally {
      setRepliesLoading(null);
    }
  }, []);

  const handlePostReply = useCallback(
    async (commentId: string, text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      if (containsProfanity(trimmed)) {
        return false;
      }
      try {
        await fetchAPI(ENDPOINTS.social.replies(commentId), {
          method: "POST",
          body: JSON.stringify({ text: trimmed }),
        });
        await loadReplies(commentId);
        return true;
      } catch {
        return false;
      }
    },
    [loadReplies],
  );

  const handleDeleteReply = useCallback(
    async (commentId: string, replyId: string): Promise<boolean> => {
      try {
        await fetchAPI(ENDPOINTS.social.replyDetail(commentId, replyId), {
          method: "DELETE",
        });
        setRepliesData((prev) => ({
          ...prev,
          [commentId]: (prev[commentId] || []).filter((r) => r.id !== replyId),
        }));
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  return {
    comments,
    commentsLoading,
    loadComments,
    handlePostComment,
    handleDeleteComment,
    handleEditComment,
    repliesData,
    repliesLoading,
    loadReplies,
    handlePostReply,
    handleDeleteReply,
    editingCommentId,
    setEditingCommentId,
  };
}

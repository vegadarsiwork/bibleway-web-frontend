import type { FeedItem, Post, Prayer, ContentType } from "../types";

export type { FeedItem };

export function mapFeedItem(p: Post | Prayer, type: ContentType): FeedItem {
  const isPost = type === "post";
  const post = isPost ? (p as Post) : undefined;
  const prayer = !isPost ? (p as Prayer) : undefined;

  return {
    id: p.id,
    author: p.author?.full_name || "Anonymous",
    authorId: p.author?.id,
    authorPhoto: p.author?.profile_photo,
    time: new Date(p.created_at).toLocaleDateString(),
    rawDate: p.created_at,
    title: prayer?.title ?? "",
    content: post?.text_content ?? prayer?.description ?? "",
    image: p.media?.[0]?.file,
    media: p.media || [],
    likes: p.reaction_count ?? 0,
    prayers: !isPost ? (p.reaction_count ?? 0) : undefined,
    comments: p.comment_count ?? 0,
    type,
    userReaction: p.user_reaction || null,
    is_boosted: post?.is_boosted ?? false,
  };
}

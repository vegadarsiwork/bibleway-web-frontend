import {
  BookmarkType,
  ContentType,
  EmojiType,
  Gender,
  HighlightColor,
  HighlightType,
  MediaType,
  NoteType,
  NotificationType,
  Platform,
} from "./enums";

// ═══════════════════════════════════════════════════════════════
// USER
// ═══════════════════════════════════════════════════════════════

export interface Author {
  id: string;
  full_name: string;
  profile_photo: string | null;
  age: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  preferred_language: string;
  country: string;
  phone_number: string;
  profile_photo: string | null;
  bio: string;
  is_email_verified: boolean;
  date_joined: string;
  age: number;
  follower_count: number;
  following_count: number;
  post_count: number;
  prayer_count: number;
}

export interface UserPublicProfile {
  id: string;
  full_name: string;
  gender: Gender;
  preferred_language: string;
  country: string;
  profile_photo: string | null;
  bio: string;
  date_joined: string;
  age: number;
  follower_count: number;
  following_count: number;
  post_count: number;
  prayer_count: number;
  follow_status: "none" | "following" | "self";
}

export interface UserListItem {
  id: string;
  full_name: string;
  profile_photo: string | null;
  bio: string;
  age: number;
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL
// ═══════════════════════════════════════════════════════════════

export interface MediaItem {
  id: string;
  file: string;
  media_type: MediaType;
  order: number;
}

export interface Post {
  id: string;
  author: Author;
  text_content: string;
  is_boosted: boolean;
  media: MediaItem[];
  reaction_count: number;
  comment_count: number;
  user_reaction: EmojiType | null;
  created_at: string;
  updated_at?: string;
}

export interface Prayer {
  id: string;
  author: Author;
  title: string;
  description: string;
  media: MediaItem[];
  reaction_count: number;
  comment_count: number;
  user_reaction: EmojiType | null;
  created_at: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  user: Author;
  text: string;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface Reply {
  id: string;
  user: Author;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface FollowRelationship {
  id: string;
  follower: UserListItem;
  following: UserListItem;
  created_at: string;
}

export interface BlockRelationship {
  id: string;
  blocked: UserListItem;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// FEED (mapped view-model for rendering)
// ═══════════════════════════════════════════════════════════════

export interface FeedItem {
  id: string;
  author: string;
  authorId: string;
  authorPhoto: string | null;
  time: string;
  rawDate: string;
  title: string;
  content: string;
  image: string | undefined;
  media: MediaItem[];
  likes: number;
  prayers: number | undefined;
  comments: number;
  type: ContentType;
  userReaction: EmojiType | null;
  is_boosted: boolean;
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION
// ═══════════════════════════════════════════════════════════════

export interface Notification {
  id: string;
  sender: Author | null;
  notification_type: NotificationType;
  title: string;
  body?: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// BIBLE (API Bible)
// ═══════════════════════════════════════════════════════════════

export interface ApiBibleLanguage {
  id: string;
  name: string;
  nameLocal: string;
  script: string;
  scriptDirection: string;
}

export interface ApiBibleCountry {
  id: string;
  name: string;
  nameLocal: string;
}

export interface BibleVersion {
  id: string;
  dblId: string;
  abbreviation: string;
  abbreviationLocal: string;
  name: string;
  nameLocal: string;
  description: string;
  descriptionLocal: string;
  language: ApiBibleLanguage;
  countries: ApiBibleCountry[];
  type: string;
  updatedAt: string;
}

export interface BibleBook {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
  chapters?: BibleChapterSummary[];
}

export interface BibleChapterSummary {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
}

export interface BibleChapterContent {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
  content: string;
  copyright: string;
  next: { id: string; bookId: string; number: string } | null;
  previous: { id: string; bookId: string; number: string } | null;
}

export interface BibleSearchVerse {
  id: string;
  orgId: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  text: string;
}

export interface BibleSearchResult {
  query: string;
  limit: number;
  offset: number;
  total: number;
  verseCount: number;
  verses: BibleSearchVerse[];
}

// ═══════════════════════════════════════════════════════════════
// BIBLE (Segregated Study)
// ═══════════════════════════════════════════════════════════════

export interface SegregatedSection {
  id: string;
  title: string;
  age_min: number;
  age_max: number;
  order: number;
  is_active: boolean;
  chapter_count: number;
  is_prioritized: boolean;
}

export interface SegregatedChapter {
  id: string;
  section: string;
  title: string;
  order: number;
  is_active: boolean;
  page_count: number;
}

export interface SegregatedPage {
  id: string;
  chapter: string;
  title: string;
  youtube_url: string;
  order: number;
  is_active: boolean;
}

export interface SegregatedPageDetail extends SegregatedPage {
  content: string;
  section_title: string;
  chapter_title: string;
  is_preview?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// BIBLE STUDY TOOLS
// ═══════════════════════════════════════════════════════════════

export interface Bookmark {
  id: string;
  bookmark_type: BookmarkType;
  verse_reference: string;
  content_type: number | null;
  object_id: string | null;
  content_object: unknown;
  created_at: string;
}

export interface Highlight {
  id: string;
  highlight_type: HighlightType;
  color: HighlightColor;
  verse_reference: string;
  selected_text?: string;
  content_type: number | null;
  object_id: string | null;
  content_object: unknown;
  selection_start: number | null;
  selection_end: number | null;
  created_at: string;
}

export interface Note {
  id: string;
  note_type: NoteType;
  text: string;
  verse_reference: string;
  content_type: number | null;
  object_id: string | null;
  content_object: unknown;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// SHOP
// ═══════════════════════════════════════════════════════════════

export interface ProductListItem {
  id: string;
  title: string;
  cover_image: string;
  category: string;
  is_free: boolean;
  price_tier: string;
  apple_product_id: string;
  google_product_id: string;
  created_at: string;
}

export interface Product extends ProductListItem {
  description: string;
  download_count: number;
  download_url: string | null;
  updated_at: string;
}

export interface ProductInline {
  id: string;
  title: string;
  cover_image: string;
  category: string;
  is_free: boolean;
}

export interface Purchase {
  id: string;
  product: ProductInline;
  platform: Platform;
  transaction_id: string;
  is_validated: boolean;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// VERSE OF DAY
// ═══════════════════════════════════════════════════════════════

export interface VerseOfDay {
  id: string;
  bible_reference: string;
  verse_text: string;
  background_image: string | null;
  display_date: string;
  source: string;
}

// ═══════════════════════════════════════════════════════════════
// ANALYTICS & BOOST
// ═══════════════════════════════════════════════════════════════

export interface PostAnalytics {
  views: number;
  reactions: number;
  comments: number;
  shares: number;
}

export interface PostBoost {
  id: string;
  post: string;
  user: string;
  tier: string;
  platform: Platform;
  duration_days: number;
  is_active: boolean;
  budget?: number;
  status?: string;
  impressions?: number;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface BoostAnalyticSnapshot {
  id: string;
  boost: string;
  impressions: number;
  reach: number;
  engagement_rate: number;
  link_clicks: number;
  clicks?: number;
  engagement?: number;
  profile_visits: number;
  snapshot_date: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════════════

export interface Conversation {
  id: string;
  other_user: Author;
  last_message_text: string;
  last_message_at: string | null;
  last_message_is_mine: boolean;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  sender: Author;
  text: string;
  is_read: boolean;
  created_at: string;
}

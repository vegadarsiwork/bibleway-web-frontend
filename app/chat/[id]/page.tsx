"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import StickerPicker from "../../components/StickerPicker";
import { useChat } from "../../lib/ChatContext";
import { fetchAPI } from "../../lib/api";
import { containsProfanity, getProfanityWarning } from "../../lib/contentFilter";
import { useToast } from "../../components/Toast";

interface ChatMessageLocal {
  id: string;
  sender: { id: string; full_name: string; profile_photo: string | null; age?: number };
  text: string;
  is_read: boolean;
  created_at: string;
}

interface MessageGroup {
  senderId: string;
  senderName: string;
  isOwn: boolean;
  messages: ChatMessageLocal[];
}

export default function ChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const convId = params.id as string;
  const {
    messages, loadMessages, sendMessage,
    markRead, sendTyping, typingUsers, getPresence, onlineUsers,
    conversations, connected,
  } = useChat();
  const [text, setText] = useState("");
  const [stickerOpen, setStickerOpen] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => { setCurrentUserId(localStorage.getItem("user_id")); }, []);
  const convMessages = messages[convId] || [];
  const typing = typingUsers[convId] || [];
  const currentConv = conversations.find(c => c.id === convId);
  const [fetchedOtherUser, setFetchedOtherUser] = useState<{ id: string; full_name: string; profile_photo: string | null } | null>(null);
  // Prefer fetched data (always fresh) over conversations list (may be stale/empty)
  const otherUser = fetchedOtherUser || currentConv?.other_user || null;

  useEffect(() => {
    if (convId) {
      loadMessages(convId);
      markRead(convId);
      getPresence(convId);
    }
  }, [convId, loadMessages, markRead, getPresence]);

  // Always fetch conversation details to get the other user's name
  // (conversations list may not be loaded when navigating from notifications/profile)
  useEffect(() => {
    if (!convId) return;
    fetchAPI(`/chat/conversations/${convId}/`).then(res => {
      const conv = res?.data || res;
      if (conv?.other_user) setFetchedOtherUser(conv.other_user);
    }).catch(() => {});
  }, [convId]);

  const [newMsgCount, setNewMsgCount] = useState(0);
  const prevMsgCountRef = useRef<number>(0);
  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  useEffect(() => {
    const isInitialLoad = prevMsgCountRef.current === 0 && convMessages.length > 0;
    prevMsgCountRef.current = convMessages.length;

    if (isInitialLoad) {
      // Scroll to bottom on first load without showing "new messages" badge
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      return;
    }

    if (isNearBottom()) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      setNewMsgCount(0);
    } else if (convMessages.length > 0) {
      // User is scrolled up — show unread indicator
      setNewMsgCount(prev => prev + 1);
    }
  }, [convMessages.length, isNearBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [text]);

  // Group consecutive messages from same sender within 2 minutes
  const groupedMessages = useMemo(() => {
    const groups: MessageGroup[] = [];
    for (const msg of convMessages) {
      const senderId = msg.sender?.id || "";
      const isOwn = senderId === currentUserId;
      const lastGroup = groups[groups.length - 1];

      if (
        lastGroup &&
        lastGroup.senderId === senderId
      ) {
        const lastMsgTime = new Date(lastGroup.messages[lastGroup.messages.length - 1].created_at).getTime();
        const thisMsgTime = new Date(msg.created_at).getTime();
        if (thisMsgTime - lastMsgTime < 2 * 60 * 1000) {
          lastGroup.messages.push(msg);
          continue;
        }
      }

      groups.push({
        senderId,
        senderName: msg.sender?.full_name || "User",
        isOwn,
        messages: [msg],
      });
    }
    return groups;
  }, [convMessages, currentUserId]);

  const { showToast } = useToast();

  async function handleSend() {
    if (!text.trim()) return;
    if (text.trim().length > 1000) {
      showToast("error", "Message too long", "Messages are limited to 1000 characters.");
      return;
    }
    if (containsProfanity(text)) {
      showToast("error", "Language Warning", getProfanityWarning());
      return;
    }
    await sendMessage(convId, text.trim());
    setText("");
    setStickerOpen(false);
  }

  function handleTyping() {
    sendTyping(convId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(convId, false), 2000);
  }

  const [sending, setSending] = useState(false);
  async function handleStickerSelect(stickerId: string) {
    if (sending) return;
    setSending(true);
    setStickerOpen(false);
    // Send as [sticker:N] (number only) to match mobile format
    const numId = stickerId.startsWith("gif_") ? stickerId.replace("gif_", "") : stickerId;
    await sendMessage(convId, `[sticker:${numId}]`);
    setSending(false);
  }

  function parseStickerMessage(text: string): { isSticker: boolean; stickerId: string } {
    if (!text) return { isSticker: false, stickerId: "" };
    const match = text.match(/^\[sticker:(.+)\]$/);
    if (!match) return { isSticker: false, stickerId: "" };
    const raw = match[1];
    // Normalize: if raw is just a number like "42", treat as "gif_42"
    // If raw is "gif_42", keep as-is
    if (/^\d+$/.test(raw)) {
      return { isSticker: true, stickerId: `gif_${raw}` };
    }
    return { isSticker: true, stickerId: raw };
  }

  async function handleTranslate(msgId: string) {
    if (translating[msgId]) return;
    // Toggle off if already translated
    if (translations[msgId]) {
      setTranslations(prev => { const n = { ...prev }; delete n[msgId]; return n; });
      return;
    }
    setTranslating(prev => ({ ...prev, [msgId]: true }));
    try {
      const userLang = localStorage.getItem("preferred_language") || navigator.language?.split("-")[0] || "en";
      const targetLang = userLang === "en" ? "es" : userLang;
      const res = await fetchAPI("/chat/messages/translate/", {
        method: "POST",
        body: JSON.stringify({ message_id: msgId, target_language: targetLang }),
      });
      const translated = res?.data?.translated_text || res?.translated_text || "";
      if (translated) {
        setTranslations(prev => ({ ...prev, [msgId]: translated }));
      }
    } catch (err: unknown) {
      console.error("Translate failed:", err instanceof Error ? err.message : err);
    }
    setTranslating(prev => ({ ...prev, [msgId]: false }));
  }


  function renderSticker(stickerId: string) {
    if (stickerId.startsWith("gif_")) {
      const num = stickerId.replace("gif_", "");
      return <img src={`/stickers/sticker_${num}.gif`} alt="Sticker" className="w-28 h-28 object-contain" />;
    }
    const EMOJI_MAP: Record<string, string> = {
      praying: "\u{1F64F}", heart: "\u2764\uFE0F", fire: "\u{1F525}", cross: "\u271D\uFE0F",
      dove: "\u{1F54A}\uFE0F", angel: "\u{1F47C}", church: "\u26EA", star: "\u2B50",
      rainbow: "\u{1F308}", candle: "\u{1F56F}\uFE0F", raised_hands: "\u{1F64C}",
      sparkling_heart: "\u{1F496}", folded_hands: "\u{1F932}", peace: "\u262E\uFE0F",
      sunrise: "\u{1F305}", light: "\u{1F4A1}", crown: "\u{1F451}", olive_branch: "\u{1F343}",
      open_book: "\u{1F4D6}", muscle: "\u{1F4AA}",
    };
    return <span className="text-6xl">{EMOJI_MAP[stickerId] || stickerId}</span>;
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function renderBubble(msg: ChatMessageLocal, isOwn: boolean, isFirst: boolean, isLast: boolean) {
    const { isSticker, stickerId } = parseStickerMessage(msg.text || "");
    const ownCorners = "rounded-2xl rounded-br-sm";
    const otherCorners = "rounded-2xl rounded-bl-sm";
    const isMenuOpen = menuMsgId === msg.id;

    return (
      <div
        key={msg.id}
        className={`flex ${isOwn ? "justify-end" : "justify-start"} group/msg relative ${isLast ? "mb-0.5" : "mb-px"}`}
      >
        <div className="max-w-full min-w-0 overflow-hidden">
          {/* Sticker message - no bubble */}
          {isSticker ? (
            <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-1`}>
              <div className="py-1">
                {renderSticker(stickerId)}
                <p className={`text-[10px] mt-1 ${isOwn ? "text-right" : "text-left"} text-on-surface-variant/40`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ) : (
            /* Text message bubble */
            <div
              className={`${isOwn
                ? ownCorners + " bg-primary text-on-primary"
                : otherCorners + " bg-surface-container-high text-on-surface"
              } px-3.5 py-2.5 cursor-pointer transition-colors relative max-w-full min-w-[120px] break-words`}
              onClick={() => setMenuMsgId(isMenuOpen ? null : msg.id)}
            >
              {/* Message text */}
              {msg.text && <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words overflow-hidden" style={{ overflowWrap: "anywhere" }}>{msg.text}</p>}

              {/* Translation */}
              {translations[msg.id] && (
                <div className={`mt-2 pt-2 border-t ${isOwn ? "border-white/20" : "border-outline-variant/20"}`}>
                  <p className={`text-[11px] font-medium mb-0.5 ${isOwn ? "text-on-primary/50" : "text-on-surface-variant/50"}`}>Translated</p>
                  <p className={`text-[13px] ${isOwn ? "text-on-primary/90" : "text-on-surface/80"}`}>
                    {translations[msg.id]}
                  </p>
                </div>
              )}

              {/* Timestamp + read receipt */}
              <div className={`flex items-center gap-1 mt-1.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                <span className={`text-[10px] ${isOwn ? "text-on-primary/50" : "text-on-surface-variant/40"}`}>
                  {formatTime(msg.created_at)}
                </span>
                {isOwn && (
                  <span className={`material-symbols-outlined text-[13px] ${msg.is_read ? "text-on-primary/70" : "text-on-primary/40"}`}>
                    {msg.is_read ? "done_all" : "done"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action menu - tap to show (not just hover) */}
          {isMenuOpen && !isSticker && (
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
              {!isOwn && msg.text && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleTranslate(msg.id); setMenuMsgId(null); }}
                  disabled={!!translating[msg.id]}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[14px]">translate</span>
                  {translations[msg.id] ? "Untranslate" : "Translate"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <MainLayout hideFooter>
      <div className="flex flex-col h-[calc(100dvh-4rem-5.5rem)] md:h-[calc(100dvh-4rem)]" data-page>
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2.5 border-b border-outline-variant/10 bg-surface-container-lowest/90 backdrop-blur-md sticky top-16 z-10">
          <button
            onClick={() => router.push("/chat")}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all press-effect"
          >
            <span className="material-symbols-outlined text-[22px] text-on-surface">arrow_back</span>
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
              {otherUser?.profile_photo ? (
                <img src={otherUser.profile_photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant/60">person</span>
              )}
            </div>
            {otherUser?.id && onlineUsers[otherUser.id] && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-surface-container-lowest" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-[15px] text-on-surface truncate">
              {otherUser?.full_name || "Conversation"}
            </h2>
            <p className="text-[11px] text-on-surface-variant/60">
              {typing.length > 0 ? (
                <span className="text-primary font-medium">
                  {typing.join(", ")} typing...
                </span>
              ) : otherUser?.id && onlineUsers[otherUser.id] ? (
                <span className="text-emerald-500">Online</span>
              ) : connected ? "Last seen recently" : "Connecting..."}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowHeaderMenu(prev => !prev)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">more_vert</span>
            </button>
            {showHeaderMenu && (
              <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 py-1 z-50 min-w-[160px]">
                <button
                  onClick={() => { if (otherUser?.id) router.push(`/user/${otherUser.id}`); setShowHeaderMenu(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  View Profile
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); setShowHeaderMenu(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-[13px] text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">link</span>
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          onScroll={() => { if (isNearBottom()) setNewMsgCount(0); }}
          className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-3 py-4 custom-scrollbar bg-surface"
        >
          {convMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/25">waving_hand</span>
              </div>
              <p className="text-on-surface-variant/60 text-sm">No messages yet. Say hello!</p>
            </div>
          )}

          {groupedMessages.map((group, gi) => (
            <div key={gi} className={`flex ${group.isOwn ? "justify-end" : "justify-start"} mb-3`}>
              {/* Avatar for other user - only on first group or if gap */}
              {!group.isOwn && (
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 self-end mr-2 overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant/50 text-[16px]">person</span>
                </div>
              )}

              <div className={`flex flex-col ${group.isOwn ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[80%] min-w-0 overflow-hidden`}>
                {/* Sender name for non-own messages */}
                {!group.isOwn && (
                  <p className="text-[11px] font-semibold text-on-surface-variant/60 mb-1 ml-1">
                    {group.senderName}
                  </p>
                )}

                {/* Messages in group */}
                {group.messages.map((msg, mi) => {
                  const isFirst = mi === 0;
                  const isLast = mi === group.messages.length - 1;
                  return renderBubble(msg, group.isOwn, isFirst, isLast);
                })}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing.length > 0 && (
            <div className="flex justify-start mb-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 self-end mr-2">
                <span className="material-symbols-outlined text-on-surface-variant/50 text-[16px]">person</span>
              </div>
              <div className="bg-surface-container-low rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-on-surface-variant/30 rounded-full animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.6s" }} />
                  <span className="w-2 h-2 bg-on-surface-variant/30 rounded-full animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.6s" }} />
                  <span className="w-2 h-2 bg-on-surface-variant/30 rounded-full animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.6s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* New messages indicator */}
        {newMsgCount > 0 && (
          <button
            onClick={() => {
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
              setNewMsgCount(0);
            }}
            className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all -mt-2 mb-2 relative z-10"
          >
            <span className="material-symbols-outlined text-sm">arrow_downward</span>
            {newMsgCount} new message{newMsgCount > 1 ? "s" : ""}
          </button>
        )}

        {/* Input area */}
        <div className="px-3 py-2.5 border-t border-outline-variant/8 bg-surface-container-lowest">
          {/* Sticker picker */}
          <div className="relative">
            {stickerOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2">
                <StickerPicker onSelect={handleStickerSelect} onClose={() => setStickerOpen(false)} />
              </div>
            )}
          </div>

          <div className="flex items-end gap-1.5">
            {/* Sticker button */}
            <button
              onClick={() => setStickerOpen(prev => !prev)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${stickerOpen ? "bg-primary/10 text-primary" : "text-on-surface-variant/50 hover:text-on-surface-variant hover:bg-surface-container-high"}`}
            >
              <span className="material-symbols-outlined text-[22px]">sentiment_satisfied</span>
            </button>

            {/* Text input */}
            <div className="flex-1 bg-surface-container-low rounded-2xl px-3.5 py-0.5 flex items-end">
              <textarea
                ref={textareaRef}
                value={text}
                autoFocus
                onChange={(e) => {
                  const val = e.target.value;
                  // /sticker slash command
                  if (val.match(/^\/sticker[\s]?$/i)) {
                    setText("");
                    setStickerOpen(true);
                    return;
                  }
                  setText(val);
                  handleTyping();
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Message..."
                rows={1}
                className="flex-1 bg-transparent text-[14px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none resize-none py-2 leading-snug"
                style={{ maxHeight: "120px" }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-25 press-effect flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

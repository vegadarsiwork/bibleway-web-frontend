"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "../lib/api";
import { useTranslation } from "../lib/i18n";
import type { Notification } from "../types";

function getNotificationLink(n: Notification): string | null {
  const data = n.data || {};
  switch (n.notification_type) {
    case "new_message":
      return data.conversation_id ? `/chat/${data.conversation_id}` : "/chat";
    case "comment":
    case "reaction":
    case "share":
      return data.post_id ? `/post/${data.post_id}` : null;
    case "prayer_comment":
      return data.prayer_id ? `/prayer/${data.prayer_id}` : null;
    case "follow":
      return data.user_id ? `/user/${data.user_id}` : (n.sender?.id ? `/user/${n.sender.id}` : null);
    case "boost_live":
    case "boost_digest":
      return "/analytics";
    default:
      return null;
  }
}

export default function NotificationDropdown() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 60s, pause when tab is hidden
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchUnreadCount();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchUnreadCount() {
    try {
      const res = await fetchAPI("/notifications/unread-count/");
      const count = res?.data?.unread_count ?? res?.unread_count ?? 0;
      setUnreadCount(count);
    } catch (e) {
      // Ignore auth errors on mount
    }
  }

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetchAPI("/notifications/");
      const data = res?.results ?? res?.data?.results ?? [];
      setNotifications(data);
    } catch { /* failed to load notifications */ }
    setLoading(false);
  }

  function handleToggle() {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  }

  async function markAsRead(id: string) {
    try {
      await fetchAPI("/notifications/read/", {
        method: "POST",
        body: JSON.stringify({ notification_id: id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* failed to mark read */ }
  }

  async function deleteNotification(id: string) {
    try {
      await fetchAPI(`/notifications/${id}/`, { method: "DELETE" });
      setNotifications(prev => {
        const notif = prev.find(n => n.id === id);
        if (notif && !notif.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== id);
      });
    } catch { /* failed to delete notification */ }
  }

  async function markAllAsRead() {
    try {
      await fetchAPI("/notifications/read/", {
        method: "POST",
        body: JSON.stringify({ notification_id: null }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* failed to mark all read */ }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all duration-200 relative cursor-pointer"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest rounded-2xl editorial-shadow border border-outline-variant/20 z-[100] overflow-hidden dropdown-enter">
          <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest sticky top-0 z-10">
            <h3 className="font-headline font-bold text-lg text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-primary font-bold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[min(calc(100vh-100px),400px)] overflow-y-auto custom-scrollbar bg-surface-container-lowest">
            {loading ? (
              <div className="p-8 flex justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-6 text-center text-on-surface-variant flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-surface-container mb-4 flex items-center justify-center">
                   <span className="material-symbols-outlined text-3xl opacity-50">notifications_off</span>
                </div>
                <p className="font-medium">You're all caught up!</p>
                <p className="text-xs opacity-70 mt-1">No new notifications.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 transition-colors cursor-pointer group relative ${!n.is_read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface-container-low'}`}
                    onClick={() => {
                        if (!n.is_read) markAsRead(n.id);
                        const link = getNotificationLink(n);
                        if (link) { setIsOpen(false); router.push(link); }
                    }}
                  >
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-container-high flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline-variant/20">
                        {n.sender?.profile_photo ? (
                          <img src={n.sender.profile_photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant">person</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm text-on-surface leading-tight">
                          <span className="font-bold mr-1">{n.sender?.full_name || 'Someone'}</span>
                          {n.title}
                        </p>
                        <p className="text-xs text-on-surface-variant font-medium mt-1.5 opacity-80">
                          {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-start gap-1 flex-shrink-0">
                        {!n.is_read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 shadow-sm shadow-primary/30" />
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-red-500 p-1"
                          title="Dismiss"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

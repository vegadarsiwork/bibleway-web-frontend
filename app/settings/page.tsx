"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import { fetchAPI } from "../lib/api";
import { useTranslation } from "../lib/i18n";
import { useTheme } from "../lib/ThemeContext";
import { useToast } from "../components/Toast";

import { LANGUAGES } from "../lib/constants";

export default function SettingsPage() {
  const router = useRouter();
  const { t, setLocale, locale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [language, setLanguage] = useState("en");
  const [savingLang, setSavingLang] = useState(false);
  const [privacy, setPrivacy] = useState({ account_visibility: "public", hide_followers_list: false });
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setPushEnabled(!!localStorage.getItem("push_token"));
    setLanguage(locale);
    fetchAPI("/accounts/profile/").then((res) => {
      const d = res.data || res;
      const lang = d?.preferred_language || "en";
      setLanguage(lang);
      if (lang !== locale) setLocale(lang);
      if (typeof window !== "undefined") localStorage.setItem("preferred_language", lang);
      setPrivacy({ account_visibility: d?.account_visibility || "public", hide_followers_list: d?.hide_followers_list || false });
    }).catch(() => {});
  }, []);

  async function togglePanel(panel: string) {
    const opening = activePanel !== panel;
    setActivePanel(opening ? panel : null);
    if (!opening) return;

    if (panel === "blocked" && blockedUsers.length === 0) {
      setLoadingBlocked(true);
      try { const r = await fetchAPI("/accounts/blocked-users/"); setBlockedUsers(r?.data?.results || r?.results || r?.data || []); } catch {} finally { setLoadingBlocked(false); }
    }
    if (panel === "requests" && followRequests.length === 0) {
      setLoadingRequests(true);
      try { const r = await fetchAPI("/accounts/follow-requests/"); setFollowRequests(r?.data?.results || r?.results || r?.data || []); } catch {} finally { setLoadingRequests(false); }
    }
    if (panel === "purchases" && purchases.length === 0) {
      setLoadingPurchases(true);
      try { const r = await fetchAPI("/shop/purchases/list/"); setPurchases(r?.data?.results || r?.results || r?.data || []); } catch {} finally { setLoadingPurchases(false); }
    }
    if (panel === "bookmarks" && bookmarks.length === 0) {
      setLoadingBookmarks(true);
      try { const r = await fetchAPI("/bible/bookmarks/"); setBookmarks(r?.data?.results || r?.results || r?.data || []); } catch {} finally { setLoadingBookmarks(false); }
    }
    if (panel === "notes" && notes.length === 0) {
      setLoadingNotes(true);
      try { const r = await fetchAPI("/bible/notes/"); setNotes(r?.data?.results || r?.results || r?.data || []); } catch {} finally { setLoadingNotes(false); }
    }
  }

  async function saveLanguage() {
    setSavingLang(true);
    try {
      await fetchAPI("/accounts/profile/", { method: "PATCH", body: JSON.stringify({ preferred_language: language }) });
      setLocale(language);
      if (typeof window !== "undefined") localStorage.setItem("preferred_language", language);
    } catch {} finally { setSavingLang(false); }
  }

  async function savePrivacy() {
    setSavingPrivacy(true);
    try { await fetchAPI("/accounts/privacy/", { method: "PUT", body: JSON.stringify(privacy) }); } catch {} finally { setSavingPrivacy(false); }
  }

  async function handleUnblock(userId: string, relationId: string) {
    try { await fetchAPI(`/accounts/users/${userId}/block/`, { method: "DELETE" }); setBlockedUsers((p) => p.filter((u) => u.id !== relationId)); } catch {}
  }

  async function handleFollowRequest(id: string, action: "accept" | "reject") {
    try { await fetchAPI(`/accounts/follow-requests/${id}/`, { method: action === "accept" ? "POST" : "DELETE" }); setFollowRequests((p) => p.filter((r) => r.id !== id)); } catch {}
  }

  async function handleDownload(productId: string) {
    try {
      const r = await fetchAPI(`/shop/downloads/${productId}/`);
      const url = r.data?.url || r.url || r.data?.download_url || r.download_url;
      if (url) window.open(url, "_blank");
      else showToast("error", "Download Error", "Download not available.");
    } catch { showToast("error", "Download Error", "Download failed."); }
  }

  async function handlePushToggle(enabled: boolean) {
    if (enabled) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        const token = crypto.randomUUID();
        try { await fetchAPI("/notifications/device-tokens/", { method: "POST", body: JSON.stringify({ token, device_type: "web" }) }); localStorage.setItem("push_token", token); setPushEnabled(true); } catch {}
      }
    } else {
      const token = localStorage.getItem("push_token");
      if (token) { try { await fetchAPI("/notifications/device-tokens/deregister/", { method: "POST", body: JSON.stringify({ token }) }); } catch {} localStorage.removeItem("push_token"); setPushEnabled(false); }
    }
  }

  async function handleLogout() {
    try {
      const refresh = localStorage.getItem("refresh_token");
      await fetchAPI("/accounts/logout/", { method: "POST", body: JSON.stringify({ refresh }) }).catch(() => {});
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("user_id");
      try { const { firebaseSignOut } = await import("../lib/firebase"); await firebaseSignOut(); } catch {}
      window.location.href = "/login";
    }
  }

  const Spinner = () => <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div></div>;

  const SettingsRow = ({ icon, label, panel }: { icon: string; label: string; panel: string }) => (
    <button onClick={() => togglePanel(panel)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-all group text-left">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">{icon}</span>
        <span className="font-medium text-on-surface">{label}</span>
      </div>
      <span className={`material-symbols-outlined text-on-surface-variant/40 text-sm transition-transform duration-200 ${activePanel === panel ? "rotate-90" : ""}`}>chevron_right</span>
    </button>
  );

  const Panel = ({ panel, children }: { panel: string; children: React.ReactNode }) =>
    activePanel === panel ? <div className="px-6 pb-4 pt-2 bg-surface-container-low/50 dropdown-enter">{children}</div> : null;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8" data-page>
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all press-effect">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline text-3xl text-on-surface">{t("settings.settings")}</h1>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl editorial-shadow overflow-hidden divide-y divide-outline-variant/10 stagger-children">
          {/* Edit Profile — links out */}
          <Link href="/profile" className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-all group">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">person</span>
              <span className="font-medium text-on-surface">{t("settings.editProfile")}</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant/40 text-sm">chevron_right</span>
          </Link>

          {/* Theme */}
          <div>
            <SettingsRow icon={theme === "dark" ? "dark_mode" : theme === "light" ? "light_mode" : "brightness_auto"} label="Theme" panel="theme" />
            <Panel panel="theme">
              <div className="space-y-2">
                {([
                  { value: "light" as const, label: "Light", icon: "light_mode" },
                  { value: "dark" as const, label: "Dark", icon: "dark_mode" },
                  { value: "system" as const, label: "System", icon: "brightness_auto" },
                ]).map((opt) => (
                  <button key={opt.value} onClick={() => setTheme(opt.value)} className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between ${theme === opt.value ? "bg-primary/10 text-primary font-semibold" : "hover:bg-surface-container-high text-on-surface"}`}>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                      {opt.label}
                    </div>
                    {theme === opt.value && <span className="material-symbols-outlined text-sm">check</span>}
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          {/* Language */}
          <div>
            <button onClick={() => togglePanel("language")} className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-all group text-left">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">language</span>
                <div>
                  <span className="font-medium text-on-surface">{t("settings.language")}</span>
                  <p className="text-xs text-on-surface-variant">{LANGUAGES.find((l) => l.code === language)?.name || language}</p>
                </div>
              </div>
              <span className={`material-symbols-outlined text-on-surface-variant/40 text-sm transition-transform duration-200 ${activePanel === "language" ? "rotate-90" : ""}`}>chevron_right</span>
            </button>
            <Panel panel="language">
              <div className="space-y-2">
                {LANGUAGES.map((l) => (
                  <button key={l.code} onClick={() => setLanguage(l.code)} className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between ${language === l.code ? "bg-primary/10 text-primary font-semibold" : "hover:bg-surface-container-high text-on-surface"}`}>
                    <span className="flex items-center gap-3"><img src={`https://flagcdn.com/w40/${l.countryCode}.png`} alt={l.short} className="w-5 h-4 rounded-sm object-cover" />{l.name}</span>
                    {language === l.code && <span className="material-symbols-outlined text-sm">check</span>}
                  </button>
                ))}
              </div>
              <button onClick={saveLanguage} disabled={savingLang} className="mt-3 bg-primary text-on-primary px-6 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 press-effect">{savingLang ? "Saving..." : "Save"}</button>
            </Panel>
          </div>

          {/* Privacy */}
          <div>
            <SettingsRow icon="lock" label={t("settings.privacy")} panel="privacy" />
            <Panel panel="privacy">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><p className="font-medium text-sm text-on-surface">Private Profile</p><p className="text-xs text-on-surface-variant">Only approved members can see your posts</p></div>
                  <div className="relative inline-flex items-center cursor-pointer"><input className="sr-only peer" type="checkbox" checked={privacy.account_visibility === "private"} onChange={(e) => setPrivacy((p) => ({ ...p, account_visibility: e.target.checked ? "private" : "public" }))} /><div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div></div>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="font-medium text-sm text-on-surface">Push Notifications</p><p className="text-xs text-on-surface-variant">Receive alerts for activity</p></div>
                  <div className="relative inline-flex items-center cursor-pointer"><input className="sr-only peer" type="checkbox" checked={pushEnabled} onChange={(e) => handlePushToggle(e.target.checked)} /><div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div></div>
                </div>
                <button onClick={savePrivacy} disabled={savingPrivacy} className="bg-primary text-on-primary px-6 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 press-effect">{savingPrivacy ? "Saving..." : "Save"}</button>
              </div>
            </Panel>
          </div>

          {/* Blocked Users */}
          <div>
            <SettingsRow icon="block" label={t("settings.blockedUsers")} panel="blocked" />
            <Panel panel="blocked">
              {loadingBlocked ? <Spinner /> : blockedUsers.length > 0 ? (
                <div className="space-y-2">{blockedUsers.map((u) => {
                  const user = u.blocked || u;
                  return (
                    <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-surface-container-high transition-all">
                      <div className="flex items-center gap-3">
                        {user.profile_photo ? (
                          <img src={user.profile_photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center"><span className="material-symbols-outlined text-sm text-on-surface-variant">person</span></div>
                        )}
                        <span className="text-sm font-medium text-on-surface">{user.full_name || "User"}</span>
                      </div>
                      <button onClick={() => handleUnblock(user.id, u.id)} className="text-xs text-red-600 font-bold hover:underline press-effect">Unblock</button>
                    </div>
                  );
                })}</div>
              ) : <p className="text-sm text-on-surface-variant py-3 text-center">No blocked users</p>}
            </Panel>
          </div>

          {/* Follow Requests */}
          <div>
            <SettingsRow icon="person_add" label={t("settings.followRequests")} panel="requests" />
            <Panel panel="requests">
              {loadingRequests ? <Spinner /> : followRequests.length > 0 ? (
                <div className="space-y-2">{followRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-surface-container-high transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center"><span className="material-symbols-outlined text-sm text-on-surface-variant">person</span></div>
                      <span className="text-sm font-medium text-on-surface">{r.from_user?.full_name || "User"}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleFollowRequest(r.id, "accept")} className="text-xs bg-primary text-on-primary px-3 py-1 rounded-lg font-bold press-effect">Accept</button>
                      <button onClick={() => handleFollowRequest(r.id, "reject")} className="text-xs bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-lg font-bold press-effect">Reject</button>
                    </div>
                  </div>
                ))}</div>
              ) : <p className="text-sm text-on-surface-variant py-3 text-center">No pending requests</p>}
            </Panel>
          </div>

          {/* My Purchases — inline */}
          <div>
            <SettingsRow icon="shopping_bag" label={t("settings.myPurchases")} panel="purchases" />
            <Panel panel="purchases">
              {loadingPurchases ? <Spinner /> : purchases.length > 0 ? (
                <div className="space-y-2">{purchases.map((p: any) => {
                  const product = p.product || p;
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-surface-container-high transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden">
                          {product.cover_image ? <img src={product.cover_image} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-on-surface-variant text-sm">description</span>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-on-surface">{product.title || "Product"}</p>
                          <p className="text-xs text-on-surface-variant">{new Date(p.created_at || p.purchased_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDownload(product.id)} className="text-xs text-primary font-bold hover:underline flex items-center gap-1 press-effect">
                        <span className="material-symbols-outlined text-sm">download</span> Download
                      </button>
                    </div>
                  );
                })}</div>
              ) : <p className="text-sm text-on-surface-variant py-3 text-center">No purchases yet</p>}
            </Panel>
          </div>

          {/* Bookmarks — inline */}
          <div>
            <SettingsRow icon="bookmark" label={t("settings.bookmarks")} panel="bookmarks" />
            <Panel panel="bookmarks">
              {loadingBookmarks ? <Spinner /> : bookmarks.length > 0 ? (
                <div className="space-y-1">{bookmarks.map((bm: any, i: number) => (
                  <div key={bm.id || i} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-surface-container-high transition-all">
                    <span className="material-symbols-outlined text-primary text-sm">bookmark</span>
                    <span className="text-sm text-on-surface">{bm.reference || bm.chapter_id || `Bookmark ${i + 1}`}</span>
                  </div>
                ))}</div>
              ) : <p className="text-sm text-on-surface-variant py-3 text-center">No bookmarks yet</p>}
            </Panel>
          </div>

          {/* Notes — inline */}
          <div>
            <SettingsRow icon="edit_note" label={t("settings.notes")} panel="notes" />
            <Panel panel="notes">
              {loadingNotes ? <Spinner /> : notes.length > 0 ? (
                <div className="space-y-2">{notes.map((n: any, i: number) => (
                  <div key={n.id || i} className="py-2 px-3 rounded-xl bg-surface-container-high/50">
                    <p className="text-xs text-primary font-semibold">{n.reference || n.chapter_id || "Chapter"}</p>
                    <p className="text-sm text-on-surface-variant">{n.text}</p>
                  </div>
                ))}</div>
              ) : <p className="text-sm text-on-surface-variant py-3 text-center">No notes yet</p>}
            </Panel>
          </div>

          {/* Change Password — links out */}
          <Link href="/change-password" className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-all group">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">lock_reset</span>
              <span className="font-medium text-on-surface">{t("settings.changePassword")}</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant/40 text-sm">chevron_right</span>
          </Link>

          {/* Danger Zone */}
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-all text-left press-effect">
            <span className="material-symbols-outlined text-red-500">logout</span>
            <span className="font-medium text-red-600">{t("settings.logout")}</span>
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-all text-left press-effect">
            <span className="material-symbols-outlined text-red-500">delete_forever</span>
            <span className="font-medium text-red-600">{t("settings.deleteAccount")}</span>
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-8 editorial-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-2xl text-red-500">delete_forever</span>
              <h3 className="font-headline text-xl">Delete Account</h3>
            </div>
            <p className="text-on-surface-variant text-sm mb-2">Are you sure you want to delete your account? This cannot be undone.</p>
            <p className="text-on-surface-variant text-sm mb-6">Please contact <span className="text-primary font-semibold">support@bibleway.app</span> to proceed with account deletion.</p>
            <button onClick={() => setShowDeleteModal(false)} className="w-full py-3 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold">Close</button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

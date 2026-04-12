"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MainLayout from "../components/MainLayout";
import { fetchAPI } from "../lib/api";
import ImageCropper from "../components/ImageCropper";
import { useToast } from "../components/Toast";
import { useTranslation } from "../lib/i18n";
import type { UserProfile, Post, Prayer } from "../types";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    date_of_birth: "",
    country: "",
    phone_number: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const contentRef = useRef<HTMLElement>(null);

  async function loadProfileData() {
    try {
      const profRes = await fetchAPI("/accounts/profile/");
      const userData = profRes.data;
      setProfile(userData);
      setEditForm({
        full_name: userData?.full_name || "",
        bio: userData?.bio || "",
        date_of_birth: userData?.date_of_birth || "",
        country: userData?.country || "",
        phone_number: userData?.phone_number || "",
      });

      if (userData?.id) {
        const [postsRes, prayersRes] = await Promise.all([
          fetchAPI(`/social/posts/?author=${userData.id}`).catch(() => ({ data: { results: [] } })),
          fetchAPI(`/social/prayers/?author=${userData.id}`).catch(() => ({ data: { results: [] } })),
        ]);
        setPosts(postsRes?.data?.results || postsRes?.results || []);
        setPrayers(prayersRes?.data?.results || prayersRes?.results || []);
      }
    } catch {
      /* error */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfileData();
  }, []);

  async function handleSaveProfile() {
    if (saving) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetchAPI("/accounts/profile/", {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setProfile((prev) => prev ? ({ ...prev, ...res.data }) : prev);
      setSaveMessage("Profile updated!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err: unknown) {
      setSaveMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleCroppedPhoto(blob: Blob) {
    setCropSrc(null);
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("profile_photo", new File([blob], "profile.jpg", { type: "image/jpeg" }));

    try {
      const res = await fetchAPI("/accounts/profile/", {
        method: "PATCH",
        body: formData,
      });
      setProfile((prev) => prev ? ({ ...prev, profile_photo: res.data?.profile_photo || res.profile_photo }) : prev);
    } catch {
      showToast("error", "Upload Failed", "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
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

  if (!profile) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h1 className="text-3xl font-headline mb-4">Please Sign In</h1>
          <p className="text-on-surface-variant mb-8">You need to be logged in to view your profile.</p>
          <a href="/login" className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold">Sign In</a>
        </div>
      </MainLayout>
    );
  }

  const getAge = (dob: string) => {
    if (!dob) return null;
    const b = new Date(dob), t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
    return age;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Profile Header — compact on mobile, sidebar on desktop */}
        <section className="lg:col-span-4 mb-6 lg:mb-0">
          <div className="sticky top-28">
            {/* Mobile: horizontal compact layout */}
            <div className="flex items-center gap-4 lg:hidden mb-4">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-xl bg-surface-container-high shadow-lg flex items-center justify-center overflow-hidden border-2 border-white">
                  {profile.profile_photo ? (
                    <img src={profile.profile_photo} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">person</span>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-primary text-on-primary w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="material-symbols-outlined text-xs">edit</span>
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-headline text-xl text-on-surface truncate">{profile.full_name}</h1>
                {profile.bio && <p className="text-on-surface-variant text-sm line-clamp-1 mt-0.5">{profile.bio}</p>}
                <div className="flex gap-5 mt-2">
                  <div>
                    <span className="font-bold text-primary">{profile.follower_count || 0}</span>
                    <span className="text-[10px] text-on-surface-variant ml-1">followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-primary">{profile.following_count || 0}</span>
                    <span className="text-[10px] text-on-surface-variant ml-1">following</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Mobile action buttons */}
            <div className="flex gap-2 lg:hidden mb-4">
              <button onClick={() => { setActiveTab("edit"); setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }} className="flex-1 bg-primary text-on-primary py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/20">Edit Profile</button>
              <Link href="/settings" className="flex-1 bg-surface-container-low text-on-surface-variant py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-base">settings</span>
                Settings
              </Link>
            </div>

            {/* Desktop: vertical sidebar layout */}
            <div className="hidden lg:flex flex-col items-start space-y-6">
              <div className="relative group">
                <div className="w-40 h-40 rounded-xl bg-surface-container-high shadow-2xl shadow-primary/5 flex items-center justify-center overflow-hidden border-2 border-white">
                  {profile.profile_photo ? (
                    <img src={profile.profile_photo} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">person</span>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </div>
              <div>
                <h1 className="font-headline text-4xl text-on-surface mb-1">{profile.full_name}</h1>
                <p className="text-on-surface-variant font-body leading-relaxed max-w-sm">
                  {profile.bio || "No bio yet. Tell the community about your journey with faith."}
                </p>
              </div>
              <div className="flex gap-8 border-y border-outline-variant/15 py-4 w-full">
                <div className="text-left">
                  <span className="block font-headline text-2xl text-primary">{profile.follower_count || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Followers</span>
                </div>
                <div className="text-left">
                  <span className="block font-headline text-2xl text-primary">{profile.following_count || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Following</span>
                </div>
              </div>
              <div className="w-full space-y-2">
                <button onClick={() => { setActiveTab("edit"); setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }} className="w-full bg-linear-to-br from-primary to-primary-container text-on-primary py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">Edit Profile</button>
                <Link href="/settings" className="w-full bg-surface-container-low text-on-surface-variant py-3 rounded-xl font-semibold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">settings</span>
                  Settings
                </Link>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" accept="image/*" />
          </div>
        </section>

        {/* Main Content */}
        <section ref={contentRef} className="lg:col-span-8 space-y-6 lg:space-y-12">
          {/* Tabs */}
          <div className="flex gap-6 lg:gap-12 border-b border-outline-variant/15 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab("posts")} className={`pb-3 lg:pb-4 transition-all whitespace-nowrap text-sm lg:text-base font-medium ${activeTab === "posts" ? "text-primary border-b-2 border-primary font-semibold" : "text-on-surface-variant hover:text-primary"}`}>Posts ({posts.length})</button>
            <button onClick={() => setActiveTab("prayers")} className={`pb-3 lg:pb-4 transition-all whitespace-nowrap text-sm lg:text-base font-medium ${activeTab === "prayers" ? "text-primary border-b-2 border-primary font-semibold" : "text-on-surface-variant hover:text-primary"}`}>Prayers ({prayers.length})</button>
            <button onClick={() => { setActiveTab("edit"); setTimeout(() => window.scrollTo({ top: (contentRef.current?.offsetTop || 0) - 80, behavior: "smooth" }), 50); }} className={`pb-3 lg:pb-4 transition-all whitespace-nowrap text-sm lg:text-base font-medium ${activeTab === "edit" ? "text-primary border-b-2 border-primary font-semibold" : "text-on-surface-variant hover:text-primary"}`}>Edit</button>
            <Link href="/analytics" className="pb-3 lg:pb-4 transition-all whitespace-nowrap text-sm lg:text-base font-medium text-on-surface-variant hover:text-primary">Analytics</Link>
          </div>

          {/* Posts */}
          {activeTab === "posts" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Link href={`/post/${post.id}`} key={post.id} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group border border-outline-variant/10 hover:shadow-md transition-shadow">
                    {post.media?.[0] && (
                      <div className={`relative overflow-hidden bg-surface-container ${post.media[0].media_type === 'video' ? 'aspect-[9/16]' : 'h-48'}`}>
                        {post.media[0].media_type === "video" ? (
                          <video src={post.media[0].file} className="w-full h-full object-cover" muted loop playsInline />
                        ) : (
                          <img src={post.media[0].file} alt="Post" className="w-full h-full object-cover" />
                        )}
                        {post.media[0].media_type === "video" && (
                           <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white flex items-center justify-center pointer-events-none">
                             <span className="material-symbols-outlined text-sm">play_arrow</span>
                           </div>
                        )}
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-on-surface mb-4 line-clamp-3">{post.text_content}</p>
                      <div className="flex items-center gap-4 text-on-surface-variant text-sm">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">favorite</span> {post.reaction_count || 0}</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">chat_bubble</span> {post.comment_count || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="md:col-span-2 text-center py-12 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
                  <p className="text-on-surface-variant">You haven&apos;t posted any reflections yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Prayers */}
          {activeTab === "prayers" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prayers.length > 0 ? (
                prayers.map((prayer) => (
                  <Link href={`/prayer/${prayer.id}`} key={prayer.id} className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between border border-outline-variant/10 hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="font-headline text-2xl mb-4">{prayer.title}</h4>
                      <p className="text-on-surface-variant italic leading-relaxed line-clamp-4">{prayer.description}</p>
                    </div>
                    <div className="mt-8 flex justify-between items-center text-xs text-on-surface-variant">
                      <span>{new Date(prayer.created_at).toLocaleDateString()}</span>
                      <div className="flex gap-3">
                        <span>{prayer.reaction_count || 0} prayers</span>
                        <span>{prayer.comment_count || 0} comments</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="md:col-span-2 text-center py-12 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                  <p className="text-on-surface-variant">You haven&apos;t shared any prayer requests yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Edit Profile */}
          {activeTab === "edit" && (
            <div className="bg-surface-container-low rounded-2xl p-8 lg:p-12 space-y-8">
              <div className="max-w-xl"><h2 className="font-headline text-3xl mb-2">Edit Profile</h2><p className="text-on-surface-variant font-body">Update your personal information.</p></div>
              {saveMessage && (<div className={`px-4 py-3 rounded-xl text-sm font-medium ${saveMessage.includes("updated") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{saveMessage}</div>)}
              <div className="grid grid-cols-1 gap-6 max-w-xl">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary block">Full Name</label>
                  <input type="text" value={editForm.full_name} onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-on-surface" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary block">Bio</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))} rows={3} maxLength={250} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-on-surface resize-none" placeholder="Tell the community about your journey..." />
                  <span className="text-xs text-on-surface-variant/50">{editForm.bio.length}/250</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary block">Date of Birth</label>
                  <div className="relative">
                    <input type="date" value={editForm.date_of_birth} onChange={(e) => setEditForm(prev => ({ ...prev, date_of_birth: e.target.value }))} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3.5 pr-24 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-on-surface" />
                    {editForm.date_of_birth && (<span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold pointer-events-none">{getAge(editForm.date_of_birth)} yrs</span>)}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary block">Country</label>
                  <input type="text" value={editForm.country} onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-on-surface" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary block">Phone Number</label>
                  <input type="tel" value={editForm.phone_number} onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-on-surface" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={handleSaveProfile} disabled={saving} className="bg-primary text-on-primary px-10 py-4 rounded-xl font-bold text-sm tracking-widest uppercase hover:opacity-90 transition-all disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
                  <button onClick={() => setActiveTab("posts")} className="px-8 py-4 rounded-xl text-on-surface-variant font-semibold text-sm hover:bg-surface-container-high transition-all">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          aspect={1}
          circular
          onCropComplete={handleCroppedPhoto}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </MainLayout>
  );
}

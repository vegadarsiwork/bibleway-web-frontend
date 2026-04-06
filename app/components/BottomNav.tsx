"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "../lib/i18n";
import { useTheme } from "../lib/ThemeContext";
import { fetchAPI } from "../lib/api";

import { LANGUAGES } from "../lib/constants";

export default function BottomNav() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];
  const themeIcon = theme === "system" ? "brightness_auto" : resolvedTheme === "dark" ? "dark_mode" : "light_mode";

  function handleLanguageChange(code: string) {
    setLocale(code);
    setMoreOpen(false);
    fetchAPI("/accounts/profile/", { method: "PATCH", body: JSON.stringify({ preferred_language: code }) }).catch(() => {});
  }

  const bottomLinks = [
    { href: "/", label: t("feed.home"), icon: "home" },
    { href: "/bible", label: t("bible.bible"), icon: "menu_book" },
    { href: "/games", label: t("nav.games", "Games"), icon: "sports_esports" },
    { href: "/chat", label: t("nav.chat", "Chat"), icon: "chat" },
  ];

  const moreActive = ["/profile", "/settings"].some(p => pathname.startsWith(p));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface/90 backdrop-blur-2xl rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.03)] border-t border-outline-variant/10">
      {bottomLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center px-3 py-1.5 transition-transform hover:scale-105 ${
              isActive
                ? "bg-primary/10 text-primary rounded-xl"
                : "text-on-surface-variant"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {link.icon}
            </span>
            <span className="font-sans uppercase tracking-widest text-[10px] font-bold mt-1">
              {link.label}
            </span>
          </Link>
        );
      })}

      {/* More menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMoreOpen(prev => !prev)}
          className={`flex flex-col items-center justify-center px-3 py-1.5 transition-transform hover:scale-105 ${
            moreActive || moreOpen ? "bg-primary/10 text-primary rounded-xl" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined" style={moreActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            menu
          </span>
          <span className="font-sans uppercase tracking-widest text-[10px] font-bold mt-1">{t("nav.more", "More")}</span>
        </button>

        {moreOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-56 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/20 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
            {/* Language */}
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 px-1 mb-1">Language</p>
              <div className="flex flex-wrap gap-1">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`px-2 py-1 rounded-lg transition-colors text-xs font-bold ${locale === lang.code ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "text-on-surface-variant hover:bg-surface-container-high"}`}
                    title={lang.label}
                  >
                    <img src={`https://flagcdn.com/w40/${lang.countryCode}.png`} alt={lang.short} className="w-4 h-3 rounded-sm object-cover inline-block" />
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-outline-variant/10" />

            {/* Theme */}
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 px-1 mb-1">Theme</p>
              <div className="flex gap-1">
                {([
                  { value: "light" as const, icon: "light_mode", label: "Light" },
                  { value: "dark" as const, icon: "dark_mode", label: "Dark" },
                  { value: "system" as const, icon: "brightness_auto", label: "Auto" },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setTheme(opt.value); setMoreOpen(false); }}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs transition-colors ${
                      theme === opt.value ? "bg-primary/10 text-primary font-semibold" : "text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-outline-variant/10" />

            {/* Links */}
            <Link href="/profile" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px]">person</span>
              {t("profile.profile", "Profile")}
            </Link>
            <Link href="/settings" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              {t("settings.settings", "Settings")}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

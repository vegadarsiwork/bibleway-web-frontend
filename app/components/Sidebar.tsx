"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "../lib/i18n";
import { useTheme } from "../lib/ThemeContext";
import { fetchAPI } from "../lib/api";

import { LANGUAGES } from "../lib/constants";

const sideLinks: { href: string; tKey: string; fallback: string; icon: string; isComingSoon?: boolean }[] = [
  { href: "/", tKey: "feed.home", fallback: "Home", icon: "home" },
  { href: "/bible", tKey: "bible.bible", fallback: "Bible", icon: "menu_book" },
  { href: "/shop", tKey: "shop.shop", fallback: "Shop", icon: "shopping_bag" },
  { href: "/chat", tKey: "nav.chat", fallback: "Chat", icon: "chat" },
  { href: "/games", tKey: "nav.games", fallback: "Games", icon: "sports_esports" },
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // On tablet (md to lg), always render as collapsed regardless of prop
  // Use CSS media queries for initial render to avoid hydration mismatch
  const [isTablet, setIsTablet] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    function check() {
      const w = window.innerWidth;
      setIsTablet(w >= 768 && w < 1024);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const isCollapsed = collapsed || (mounted && isTablet);

  const themeIcon = theme === "system" ? "brightness_auto" : resolvedTheme === "dark" ? "dark_mode" : "light_mode";
  const themeLabel = theme === "system" ? "System" : resolvedTheme === "dark" ? "Dark" : "Light";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLanguageChange(code: string) {
    setLocale(code);
    setLangOpen(false);
    fetchAPI("/accounts/profile/", { method: "PATCH", body: JSON.stringify({ preferred_language: code }) }).catch(() => {});
  }

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <>
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] pt-6 pb-8 bg-surface-container z-40 transition-all duration-300 ease-in-out border-r border-outline-variant/10 ${
          isCollapsed ? "w-[72px]" : "lg:w-64 w-[72px]"
        }`}
      >
        <div className={`mb-8 overflow-y-auto overflow-x-hidden flex-1 min-h-0 transition-all duration-300 ${isCollapsed ? "px-2" : "px-6"}`}>
          {!isCollapsed && (
            <h3 className="hidden lg:block text-xs font-label uppercase tracking-[0.2em] text-on-surface-variant/60 mb-6 transition-opacity duration-200">
              {t("nav.navigation", "Navigation")}
            </h3>
          )}
          <nav className="space-y-1">
            {sideLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={isCollapsed ? t(link.tKey, link.fallback) : undefined}
                  className={`flex items-center gap-4 py-2.5 transition-all duration-200 rounded-xl ${
                    isActive
                      ? isCollapsed
                        ? "text-primary font-bold bg-primary/10 justify-center px-2"
                        : "text-primary font-bold border-l-4 border-tertiary-fixed-dim pl-4 bg-surface-container-high/50"
                      : isCollapsed
                        ? "text-on-surface-variant hover:bg-surface-container-high justify-center px-2"
                        : "text-on-surface-variant pl-5 hover:bg-surface-container-high"
                  } ${link.isComingSoon ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={(e) => link.isComingSoon && e.preventDefault()}
                >
                  <div className="relative shrink-0">
                    <span className="material-symbols-outlined">{link.icon}</span>
                    {link.isComingSoon && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-tertiary rounded-full"></span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="hidden lg:inline font-headline text-lg whitespace-nowrap overflow-hidden">
                      {t(link.tKey, link.fallback)}
                      {link.isComingSoon && <span className="ml-2 text-[8px] font-label uppercase tracking-widest opacity-60">Soon</span>}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className={`mt-auto space-y-1 transition-all duration-300 ${isCollapsed ? "px-2" : "px-6"}`}>
          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              title={isCollapsed ? `Language: ${currentLang.label}` : undefined}
              className={`flex items-center gap-4 text-on-surface-variant hover:text-primary transition-colors duration-200 py-3 rounded-xl w-full ${
                isCollapsed ? "justify-center px-2" : "pl-5"
              }`}
            >
              <img src={`https://flagcdn.com/w40/${currentLang.countryCode}.png`} alt={currentLang.short} className="w-5 h-4 rounded-sm object-cover shrink-0" />
              {!isCollapsed && <span className="hidden lg:inline text-sm font-medium">{currentLang.label}</span>}
            </button>
            {langOpen && (
              <div className={`absolute bottom-full mb-2 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 z-50 overflow-hidden max-h-[60vh] overflow-y-auto ${
                isCollapsed ? "left-full ml-2 w-48" : "left-0 right-0"
              }`}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                      locale === lang.code
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    <img src={`https://flagcdn.com/w40/${lang.countryCode}.png`} alt={lang.short} className="w-5 h-4 rounded-sm object-cover shrink-0" />
                    <span>{lang.label}</span>
                    {locale === lang.code && <span className="material-symbols-outlined text-[16px] ml-auto">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Picker */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              title={isCollapsed ? `Theme: ${themeLabel}` : undefined}
              className={`flex items-center gap-4 text-on-surface-variant hover:text-primary transition-colors duration-200 py-3 rounded-xl w-full ${
                isCollapsed ? "justify-center px-2" : "pl-5"
              }`}
            >
              <span className="material-symbols-outlined shrink-0">{themeIcon}</span>
              {!isCollapsed && <span className="hidden lg:inline text-sm font-medium">{themeLabel}</span>}
            </button>
            {themeOpen && (
              <div className={`absolute bottom-full mb-2 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 z-50 overflow-hidden ${
                isCollapsed ? "left-full ml-2 w-40" : "left-0 right-0"
              }`}>
                {([
                  { value: "light" as const, icon: "light_mode", label: "Light" },
                  { value: "dark" as const, icon: "dark_mode", label: "Dark" },
                  { value: "system" as const, icon: "brightness_auto", label: "System" },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setTheme(opt.value); setThemeOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                      theme === opt.value
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                    {opt.label}
                    {theme === opt.value && <span className="material-symbols-outlined text-[16px] ml-auto">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            title={isCollapsed ? "Settings" : undefined}
            className={`flex items-center gap-4 text-on-surface-variant hover:text-primary transition-colors duration-200 py-3 rounded-xl ${
              isCollapsed ? "justify-center px-2" : "pl-5"
            }`}
          >
            <span className="material-symbols-outlined shrink-0">settings</span>
            {!isCollapsed && <span className="hidden lg:inline text-sm font-medium">{t("settings.settings", "Settings")}</span>}
          </Link>
        </div>
      </aside>

      {/* Spacer to push main content */}
      <div
        className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[72px]" : "lg:w-64 w-[72px]"
        }`}
      />
    </>
  );
}

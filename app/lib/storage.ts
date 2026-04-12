type StorageKey =
  | "access_token"
  | "refresh_token"
  | "user_id"
  | "draft_tab"
  | "verse_onboarding_date"
  | "theme"
  | "language"
  | "sidebar_collapsed";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export const storage = {
  get(key: StorageKey): string | null {
    if (!isClient()) return null;
    return localStorage.getItem(key);
  },

  set(key: StorageKey, value: string): void {
    if (!isClient()) return;
    localStorage.setItem(key, value);
  },

  remove(key: StorageKey): void {
    if (!isClient()) return;
    localStorage.removeItem(key);
  },

  clear(): void {
    if (!isClient()) return;
    localStorage.clear();
  },

  getAccessToken(): string | null {
    const token = this.get("access_token");
    if (token && token !== "undefined" && token !== "null") return token;
    return null;
  },

  setTokens(access: string, refresh: string): void {
    this.set("access_token", access);
    this.set("refresh_token", refresh);
  },

  clearAuth(): void {
    this.remove("access_token");
    this.remove("refresh_token");
    this.remove("user_id");
  },
};

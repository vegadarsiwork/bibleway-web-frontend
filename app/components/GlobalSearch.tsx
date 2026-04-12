"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { fetchAPI } from "../lib/api";

interface SearchUser {
  id: string;
  full_name: string;
  profile_photo: string | null;
}

interface SearchProduct {
  id: string;
  title: string;
  name?: string;
  cover_image?: string;
  image?: string;
  is_free?: boolean;
  price_tier?: string;
  price?: number;
}

interface SearchBibleResult {
  id: string;
  reference?: string;
  verse_reference?: string;
  title?: string;
  text?: string;
  verse_text?: string;
  snippet?: string;
  content?: string;
}

interface SearchResults {
  users: SearchUser[];
  products: SearchProduct[];
  bible: SearchBibleResult[];
}

export default function GlobalSearch() {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ users: [], products: [], bible: [] });
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ users: [], products: [], bible: [] });
      setLoading(false);
      return;
    }

    async function performSearch() {
      setLoading(true);
      try {
        const [usersRes, productsRes, bibleRes] = await Promise.allSettled([
          fetchAPI(`/accounts/users/search/?q=${encodeURIComponent(debouncedQuery)}`),
          fetchAPI(`/shop/products/search/?q=${encodeURIComponent(debouncedQuery)}`),
          fetchAPI(`/bible/search/?q=${encodeURIComponent(debouncedQuery)}`),
        ]);

        let users: SearchUser[] = [];
        let products: SearchProduct[] = [];
        let bible: SearchBibleResult[] = [];

        if (usersRes.status === "fulfilled" && usersRes.value) {
          const val = usersRes.value;
          users = val.results || val.data?.results || (Array.isArray(val.data) ? val.data : []);
        }

        if (productsRes.status === "fulfilled" && productsRes.value) {
          const val = productsRes.value;
          products = val.results || val.data?.results || (Array.isArray(val.data) ? val.data : []);
        }

        if (bibleRes.status === "fulfilled" && bibleRes.value) {
          const val = bibleRes.value;
          bible = val.results || val.data?.results || (Array.isArray(val.data) ? val.data : []);
        }

        setResults({
          users: Array.isArray(users) ? users.slice(0, 4) : [],
          products: Array.isArray(products) ? products.slice(0, 4) : [],
          bible: Array.isArray(bible) ? bible.slice(0, 6) : [],
        });
      } catch { /* search failed */ }
      setLoading(false);
    }

    performSearch();
  }, [debouncedQuery]);

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const hasResults = results.users.length > 0 || results.products.length > 0 || results.bible.length > 0;
  const isSearching = loading || (query.trim() !== "" && query !== debouncedQuery);
  const showDropdown = isFocused && query.trim() !== "";

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative w-full max-w-xl" ref={containerRef}>
      {/* Mobile: icon button */}
      <button
        onClick={() => { setMobileOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all"
        aria-label="Search"
      >
        <span className="material-symbols-outlined text-[22px]">search</span>
      </button>

      {/* Mobile: fullscreen overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[200] bg-surface p-4">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => { setMobileOpen(false); clearSearch(); }} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex-1 flex items-center bg-surface-container rounded-full px-4 py-2">
              <span className="material-symbols-outlined text-on-surface-variant/60 text-lg shrink-0">search</span>
              <input
                ref={inputRef}
                type="text"
                className="bg-transparent border-none outline-none w-full px-3 text-sm text-on-surface placeholder-on-surface-variant/50"
                placeholder="Search Bible, people, shop..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                autoFocus
              />
              {query && (
                <button onClick={clearSearch} className="cursor-pointer text-on-surface-variant hover:text-on-surface shrink-0">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop: inline search bar */}
      <div className={`hidden md:flex items-center w-full bg-surface-container rounded-full px-4 py-2 transition-all duration-200 ${
        isFocused ? "outline outline-2 outline-primary shadow-lg shadow-primary/5" : "hover:bg-surface-container-high"
      }`}>
        <span className="material-symbols-outlined text-on-surface-variant/60 text-lg shrink-0">search</span>
        <input
          ref={inputRef}
          type="text"
          className="bg-transparent border-none outline-none w-full px-3 text-sm text-on-surface placeholder-on-surface-variant/50"
          placeholder="Search Bible, people, shop..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        {query && (
          <button onClick={clearSearch} className="cursor-pointer text-on-surface-variant hover:text-on-surface shrink-0">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className={`bg-surface-container-lowest rounded-2xl editorial-shadow border border-outline-variant/20 z-[201] overflow-hidden ${
          mobileOpen ? "fixed left-4 right-4 top-20" : "absolute top-12 left-0 right-0"
        }`}>
          <div className="max-h-[min(calc(100vh-100px),560px)] overflow-y-auto custom-scrollbar">

            {isSearching ? (
              <div className="p-8 flex justify-center items-center flex-col gap-3 text-on-surface-variant">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <p className="text-sm">Searching...</p>
              </div>
            ) : !hasResults ? (
              <div className="p-8 flex justify-center items-center flex-col text-on-surface-variant text-center">
                <span className="material-symbols-outlined text-4xl opacity-50 mb-2">search_off</span>
                <p className="font-medium">No results found</p>
                <p className="text-xs opacity-70 mt-1">Try a different keyword.</p>
              </div>
            ) : (
              <div className="py-1">
                {/* Bible Results - shown first and prominently */}
                {results.bible.length > 0 && (
                  <div className="mb-1">
                    <h4 className="px-4 py-2.5 text-xs font-bold text-primary uppercase tracking-wider bg-primary/5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">menu_book</span>
                      Bible
                    </h4>
                    <div className="divide-y divide-outline-variant/10">
                      {results.bible.map((item, idx: number) => (
                        <Link
                          href={`/bible?highlight=${encodeURIComponent(item.reference || item.verse_reference || "")}`}
                          key={item.id || idx}
                          onClick={() => { setIsFocused(false); setQuery(""); }}
                          className="block px-4 py-3 hover:bg-surface-container-low transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary/60 text-lg mt-0.5 shrink-0">book_2</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-on-surface">{item.reference || item.verse_reference || item.title || "Verse"}</p>
                              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{item.text || item.verse_text || item.snippet || item.content || ""}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {results.bible.length >= 6 && (
                      <Link
                        href={`/bible?search=${encodeURIComponent(query)}`}
                        onClick={() => { setIsFocused(false); }}
                        className="block px-4 py-2.5 text-xs text-primary font-semibold text-center hover:bg-primary/5 transition-colors"
                      >
                        View all Bible results
                      </Link>
                    )}
                  </div>
                )}

                {/* Users Section */}
                {results.users.length > 0 && (
                  <div className="mb-1">
                    <h4 className="px-4 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container-low/50 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">group</span>
                      People
                    </h4>
                    <div className="divide-y divide-outline-variant/10">
                      {results.users.map((user) => (
                        <Link
                          href={`/user/${user.id}`}
                          key={user.id}
                          onClick={() => { setIsFocused(false); setQuery(""); }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/20 flex items-center justify-center shrink-0">
                            {user.profile_photo ? (
                              <img src={user.profile_photo} alt={user.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-on-surface">{user.full_name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Section */}
                {results.products.length > 0 && (
                  <div>
                    <h4 className="px-4 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container-low/50 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">shopping_bag</span>
                      Shop
                    </h4>
                    <div className="divide-y divide-outline-variant/10">
                      {results.products.map((product) => (
                        <Link
                          href={`/shop/product/${product.id}`}
                          key={product.id}
                          onClick={() => { setIsFocused(false); setQuery(""); }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-colors"
                        >
                          <div className="w-10 h-10 bg-surface-container overflow-hidden rounded-md border border-outline-variant/20 flex items-center justify-center shrink-0">
                            {(product.cover_image || product.image) ? (
                              <img src={product.cover_image || product.image} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant text-sm">shopping_bag</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-on-surface truncate">{product.title || product.name}</span>
                            <span className="text-xs text-primary font-medium">{product.is_free ? "Free" : product.price_tier || (product.price ? `$${product.price}` : "")}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {hasResults && (
            <div className="p-2.5 border-t border-outline-variant/10 bg-surface-container-lowest text-center">
              <span className="text-xs text-on-surface-variant">Press Esc to close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

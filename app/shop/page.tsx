"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "../components/MainLayout";
import { fetchAPI } from "../lib/api";
import Shimmer from "../components/Shimmer";
import { useTranslation } from "../lib/i18n";

export default function ShopPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<import("../types").ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Server-side search — also reload all products when query is cleared
  const [allProducts, setAllProducts] = useState<import("../types").ProductListItem[]>([]);
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      // Restore full product list when search is cleared
      if (allProducts.length > 0) setProducts(allProducts);
      return;
    }
    async function serverSearch() {
      try {
        const res = await fetchAPI(`/shop/products/search/?q=${encodeURIComponent(debouncedQuery)}`);
        const results = res?.data?.results || res?.results || [];
        if (results.length > 0) setProducts(results);
      } catch {
        // Fall back to client-side filtering
      }
    }
    serverSearch();
  }, [debouncedQuery]);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const res = await fetchAPI("/shop/products/");
        const items = res?.data?.results || res?.results || [];
        setProducts(items);
        setAllProducts(items);
      } catch { /* failed to load products */ } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Client-side search filter
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-32">
        {/* Hero */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="max-w-2xl">
              <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-primary-container text-on-primary-container font-label text-[11px] font-bold uppercase tracking-widest">
                The Curated Collection
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-headline text-on-surface leading-tight mb-4 sm:mb-6">
                Digital <span className="serif-italic">Sanctuary</span>
              </h1>
              <p className="text-lg text-on-surface-variant max-w-lg">
                Deepen your faith with premium study guides and atmospheric
                media designed for focused reflection.
              </p>
              <div className="flex items-center gap-6 mt-4">
                <Link href="/shop/purchases" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
                  <span className="material-symbols-outlined text-lg">shopping_bag</span>
                  My Purchases
                </Link>
                <Link href="/shop/downloads" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
                  <span className="material-symbols-outlined text-lg">download</span>
                  My Downloads
                </Link>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                search
              </span>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 
                  text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col">
                <Shimmer className="aspect-[3/4] mb-6 w-full" />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Shimmer className="h-6 w-1/2" />
                    <Shimmer className="h-5 w-16" />
                  </div>
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-12 w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 stagger-children">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, i) => (
                <Link
                  href={`/shop/product/${product.id}`}
                  key={product.id}
                  className="group flex flex-col"
                >
                  <div className="relative aspect-[3/4] mb-6 overflow-hidden rounded-xl bg-surface-container-low transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(18,18,18,0.08)] group-hover:-translate-y-1 flex items-center justify-center img-zoom">
                    {product.cover_image ? (
                        <img src={product.cover_image} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                        <span className="material-symbols-outlined text-8xl text-on-surface-variant/10">
                          description
                        </span>
                    )}
                    <div className="absolute top-4 right-4 px-3 py-1 bg-surface-container-lowest/90 backdrop-blur-sm rounded-full text-[10px] font-bold tracking-widest uppercase">
                      {product.category || "Digital"}
                    </div>
                    {product.is_free && (
                        <div className="absolute top-4 left-4 px-3 py-1 bg-primary text-on-primary rounded-full text-[10px] font-bold tracking-widest uppercase">
                            Free
                        </div>
                    )}
                  </div>
                  <div className="px-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-headline text-on-surface group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      <span className="font-body font-semibold text-on-surface-variant tracking-tight">
                        {product.is_free ? "FREE" : (product.price_tier || "Paid")}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant mb-6 line-clamp-2">
                      {product.description || "Premium digital asset for your spiritual sanctuary."}
                    </p>
                    <span className="w-full py-4 rounded-xl bg-linear-to-br from-primary to-primary-container text-on-primary font-semibold tracking-wide flex items-center justify-center gap-2 group-hover:opacity-90 transition-all">
                      <span>{product.is_free ? "Download" : "Purchase"}</span>
                      <span className="material-symbols-outlined text-sm">
                        {product.is_free ? "download" : "shopping_bag"}
                      </span>
                    </span>
                  </div>
                </Link>
              ))
            ) : (
                <div className="col-span-full py-24 text-center bg-surface-container-low rounded-2xl">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4 block">search_off</span>
                    <p className="text-on-surface-variant">
                      {searchQuery ? `No products matching "${searchQuery}"` : "No products found."}
                    </p>
                </div>
            )}
          </div>
        )}


      </div>
    </MainLayout>
  );
}

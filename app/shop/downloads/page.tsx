"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "../../components/MainLayout";
import { fetchAPI } from "../../lib/api";
import Shimmer from "../../components/Shimmer";
import { useToast } from "../../components/Toast";

export default function DownloadsPage() {
  const { showToast } = useToast();
  const [purchases, setPurchases] = useState<import("../../types").Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchAPI("/shop/purchases/list/");
        setPurchases(res?.data?.results || res?.results || res?.data || []);
      } catch {
        /* failed to load */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDownload(productId: string) {
    setDownloadingId(productId);
    try {
      const res = await fetchAPI(`/shop/downloads/${productId}/`);
      const url =
        res.data?.url ||
        res.url ||
        res.data?.download_url ||
        res.download_url;
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = "";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        showToast("error", "Download Error", "Download not available.");
      }
    } catch {
      showToast("error", "Download Error", "Download failed. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-32">
        <div className="flex items-center justify-between mb-12">
          <div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-4"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-sm font-medium">Back to Shop</span>
            </Link>
            <h1 className="text-4xl font-headline text-on-surface">
              My Downloads
            </h1>
            <p className="text-on-surface-variant mt-2">
              Download your purchased content.
            </p>
          </div>
          <Link
            href="/shop/purchases"
            className="hidden sm:inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">
              shopping_bag
            </span>
            View Purchases
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col">
                <Shimmer className="aspect-[4/3] mb-4 w-full rounded-xl" />
                <Shimmer className="h-6 w-3/4 mb-2" />
                <Shimmer className="h-10 w-full mt-4" />
              </div>
            ))}
          </div>
        ) : purchases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {purchases.map((purchase) => {
              const product = purchase.product || purchase;
              const isDownloading = downloadingId === product.id;
              return (
                <div
                  key={purchase.id}
                  className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow border border-outline-variant/10"
                >
                  <div className="aspect-[4/3] bg-surface-container-low flex items-center justify-center overflow-hidden">
                    {product.cover_image ? (
                      <img
                        src={product.cover_image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-6xl text-on-surface-variant/10">
                        description
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-headline text-lg text-on-surface">
                        {product.title}
                      </h3>
                      {product.category && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-tertiary-fixed/20 text-on-tertiary-fixed-variant text-[10px] font-bold uppercase tracking-widest">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mb-4">
                      Purchased{" "}
                      {new Date(
                        purchase.created_at || purchase.purchased_at
                      ).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleDownload(product.id)}
                      disabled={isDownloading}
                      className="w-full py-3 rounded-xl bg-primary text-on-primary font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isDownloading ? "hourglass_empty" : "download"}
                      </span>
                      {isDownloading ? "Preparing..." : "Download"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-surface-container-low rounded-2xl">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4 block">
              download
            </span>
            <p className="text-on-surface-variant text-lg mb-4">
              No downloads yet.
            </p>
            <Link
              href="/shop"
              className="text-primary font-bold hover:underline"
            >
              Browse the Shop
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

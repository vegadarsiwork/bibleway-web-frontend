"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MainLayout from "../../../components/MainLayout";
import { fetchAPI } from "../../../lib/api";
import Shimmer from "../../../components/Shimmer";
import { useToast } from "../../../components/Toast";
import { openRazorpayCheckout, RazorpayPaymentResponse } from "../../../lib/razorpay";

export default function ProductDetailPage() {
  const { showToast } = useToast();
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    async function load() {
      try {
        const res = await fetchAPI(`/shop/products/${productId}/`);
        const data = res.data || res;
        setProduct(data);
        // If the product already has a download_url, user owns it
        if (data.download_url) setPurchased(true);
      } catch { /* failed to load */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  // ─── Free product: direct claim ──────────────────────────────────
  async function handleFreeClaim() {
    setPurchasing(true);
    try {
      await fetchAPI("/shop/purchases/", {
        method: "POST",
        body: JSON.stringify({ product_id: productId }),
      });
      setPurchased(true);
      showToast("success", "Downloaded!", "Free product added to your library.");
    } catch (err: any) {
      showToast("error", "Failed", err.message || "Could not claim free product.");
    } finally {
      setPurchasing(false);
    }
  }

  // ─── Paid product: Razorpay 3-step flow ──────────────────────────
  async function handlePaidPurchase() {
    if (purchasing) return;
    setPurchasing(true);

    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await fetchAPI("/shop/razorpay/create-order/", {
        method: "POST",
        body: JSON.stringify({ product_id: productId }),
      });
      const order = orderRes.data || orderRes;

      const userEmail = typeof window !== "undefined" ? localStorage.getItem("user_email") || "" : "";

      // Step 2: Open Razorpay Checkout
      await openRazorpayCheckout({
        order,
        name: "Bibleway",
        description: product?.title || "Product Purchase",
        email: userEmail,
        onSuccess: async (response: RazorpayPaymentResponse) => {
          try {
            // Step 3: Verify payment
            await fetchAPI("/shop/razorpay/verify/", {
              method: "POST",
              body: JSON.stringify({
                product_id: productId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            setPurchased(true);
            showToast("success", "Purchase Complete!", `"${product?.title}" is now yours.`);
          } catch (verifyErr: any) {
            showToast(
              "error",
              "Verification Failed",
              verifyErr?.message || "Payment succeeded but verification failed. Contact support."
            );
          }
        },
        onFailure: (errorMsg) => {
          showToast("error", "Payment Failed", errorMsg);
        },
        onDismiss: () => {
          // User closed the checkout modal
        },
      });
    } catch (err: any) {
      showToast("error", "Error", err.message || "Something went wrong. Please try again.");
    } finally {
      setPurchasing(false);
    }
  }

  // ─── Download handler ────────────────────────────────────────────
  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetchAPI(`/shop/downloads/${productId}/`);
      const url = res.data?.url || res.url || res.data?.download_url || res.download_url;
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = "";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast("success", "Downloading", "Your file is being downloaded.");
      } else {
        showToast("error", "Download Error", "Download not available.");
      }
    } catch {
      showToast("error", "Download Error", "Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  // ─── Purchase click dispatcher ───────────────────────────────────
  function handlePurchaseClick() {
    if (product.is_free) {
      handleFreeClaim();
    } else {
      handlePaidPurchase();
    }
  }

  // ─── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Shimmer className="h-8 w-32 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Shimmer className="aspect-[3/4] w-full rounded-xl" />
            <div className="space-y-4">
              <Shimmer className="h-10 w-3/4" />
              <Shimmer className="h-6 w-1/4" />
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-4 w-2/3" />
              <Shimmer className="h-14 w-full mt-8" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ─── Not found ───────────────────────────────────────────────────
  if (!product) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h1 className="text-3xl font-headline mb-4">Product Not Found</h1>
          <Link href="/shop" className="text-primary font-bold">Back to Shop</Link>
        </div>
      </MainLayout>
    );
  }

  // ─── Price display ───────────────────────────────────────────────
  const priceDisplay = product.is_free
    ? "FREE"
    : product.price
      ? `₹${product.price}`
      : product.price_tier || "Paid";

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/shop" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="text-sm font-medium">Back to Shop</span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-container-low flex items-center justify-center editorial-shadow">
            {product.cover_image ? (
              <img src={product.cover_image} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-8xl text-on-surface-variant/10">description</span>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary dark:bg-primary/20 text-[10px] font-bold uppercase tracking-widest w-fit">
              {product.category || "Digital"}
            </div>
            <h1 className="text-4xl font-headline text-on-surface mb-4">{product.title}</h1>
            <p className="text-2xl font-headline text-primary mb-6">{priceDisplay}</p>
            <p className="text-on-surface-variant leading-relaxed mb-8">{product.description}</p>

            {product.download_count !== undefined && (
              <p className="text-xs text-on-surface-variant/60 mb-6 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">download</span>
                {product.download_count} downloads
              </p>
            )}

            {purchased ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  You own this product
                </div>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full py-4 rounded-xl bg-linear-to-br from-primary to-primary-container text-on-primary font-semibold tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">{downloading ? "hourglass_empty" : "download"}</span>
                  {downloading ? "Preparing..." : "Download"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handlePurchaseClick}
                  disabled={purchasing}
                  className="w-full py-4 rounded-xl bg-linear-to-br from-primary to-primary-container text-on-primary font-semibold tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {purchasing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-on-primary/30 border-t-on-primary" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">{product.is_free ? "download" : "shopping_bag"}</span>
                      {product.is_free ? "Download Free" : `Buy for ${priceDisplay}`}
                    </>
                  )}
                </button>
                {!product.is_free && (
                  <p className="text-center text-xs text-on-surface-variant/50 flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Secure payment powered by Razorpay
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

/**
 * Shared Razorpay utilities for web payments.
 *
 * Flow:
 * 1. Backend creates a Razorpay order → returns order_id, amount, currency, razorpay_key
 * 2. Frontend opens the Razorpay Checkout widget with that data
 * 3. On success, frontend sends razorpay_order_id, razorpay_payment_id, razorpay_signature to backend verify endpoint
 */

// ── Types ──────────────────────────────────────────────────────────

export interface RazorpayOrderResponse {
  order_id: string;
  amount: number; // in paise
  currency: string;
  razorpay_key: string;
  [key: string]: unknown; // extra fields like product_id, post_id, tier, etc.
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  /** From create-order response */
  order: RazorpayOrderResponse;
  /** Display name in checkout */
  name?: string;
  /** Description shown in checkout */
  description?: string;
  /** Prefill email */
  email?: string;
  /** Theme color (hex) */
  color?: string;
  /** Called with payment response on success */
  onSuccess: (response: RazorpayPaymentResponse) => void;
  /** Called when payment fails */
  onFailure?: (error: string) => void;
  /** Called when user dismisses the modal */
  onDismiss?: () => void;
}

// ── Script loader ──────────────────────────────────────────────────

let scriptLoaded = false;
let scriptLoading: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (scriptLoaded || (typeof window !== "undefined" && (window as unknown as { Razorpay?: unknown }).Razorpay)) {
    scriptLoaded = true;
    return Promise.resolve(true);
  }

  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      scriptLoaded = true;
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return scriptLoading;
}

// ── Checkout launcher ──────────────────────────────────────────────

const PRIMARY_COLOR = "#59021a";

export async function openRazorpayCheckout(opts: RazorpayCheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error("Failed to load Razorpay. Please check your internet connection.");
  }

  return new Promise<void>((resolve, reject) => {
    const options = {
      key: opts.order.razorpay_key,
      amount: opts.order.amount,
      currency: opts.order.currency,
      order_id: opts.order.order_id,
      name: opts.name || "Bibleway",
      description: opts.description || "Payment",
      prefill: { email: opts.email || "" },
      theme: { color: opts.color || PRIMARY_COLOR },
      handler: (response: RazorpayPaymentResponse) => {
        opts.onSuccess(response);
        resolve();
      },
      modal: {
        ondismiss: () => {
          opts.onDismiss?.();
          resolve();
        },
      },
    };

    const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { on: (event: string, cb: (resp: { error?: { description?: string } }) => void) => void; open: () => void } }).Razorpay;
    const rzp = new RazorpayConstructor(options);

    rzp.on("payment.failed", (resp: { error?: { description?: string } }) => {
      const errorMsg = resp?.error?.description || "Payment could not be processed.";
      opts.onFailure?.(errorMsg);
      reject(new Error(errorMsg));
    });

    rzp.open();
  });
}

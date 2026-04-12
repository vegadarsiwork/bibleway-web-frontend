import type { ApiResponse } from "../types/api";
import { storage } from "./storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-bibleway.up.railway.app/api/v1";

const FETCH_TIMEOUT_MS = 15000;
const UPLOAD_TIMEOUT_MS = 120000; // 2 minutes for file uploads

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Prevent multiple simultaneous token refresh requests
let refreshPromise: Promise<string | null> | null = null;

function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

async function doTokenRefresh(): Promise<string | null> {
  const refreshToken = storage.get("refresh_token");
  if (!refreshToken) return null;

  try {
    const refreshRes = await fetchWithTimeout(`${API_BASE_URL}/accounts/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (refreshRes.ok) {
      const responseData = await refreshRes.json();
      const tokens = responseData.data || responseData;
      const newAccessToken = tokens.access || tokens.access_token;
      if (newAccessToken) {
        storage.set("access_token", newAccessToken);
        return newAccessToken;
      }
    }

    // Refresh token is invalid/expired — force re-login
    storage.clearAuth();
    window.location.href = "/login";
    return null;
  } catch (err) {
    console.error("Token refresh failed:", err);
    storage.clearAuth();
    window.location.href = "/login";
    return null;
  }
}

export async function fetchAPI<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = typeof window !== "undefined" && options.body instanceof FormData;
  const timeout = isFormData ? UPLOAD_TIMEOUT_MS : FETCH_TIMEOUT_MS;

  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  Object.assign(headers, (options.headers as Record<string, string>) || {});

  if (typeof window !== "undefined") {
    const token = storage.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response = await fetchWithTimeout(url, {
    ...options,
    headers,
  }, timeout);

  // Handle Token Refresh on 401 Unauthorized
  if (response.status === 401 && typeof window !== "undefined") {
    // Use a single shared promise so concurrent 401s don't all refresh independently
    if (!refreshPromise) {
      refreshPromise = doTokenRefresh().finally(() => { refreshPromise = null; });
    }
    const newToken = await refreshPromise;

    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetchWithTimeout(url, {
        ...options,
        headers,
      }, timeout);
    } else {
      // Refresh failed — doTokenRefresh already handles redirect
      return { data: null as T, message: "Unauthorized" };
    }
  }

  if (!response.ok) {
    let errorMsg = `API error: ${response.status} ${response.statusText}`;
    let details: Record<string, unknown> | undefined;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMsg = errorData.message;
      }
      if (errorData.data && typeof errorData.data === "object") {
        details = errorData.data as Record<string, unknown>;
        const detailStr = Object.entries(details)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" | ");
        errorMsg += ` (${detailStr})`;
      } else if (errorData.detail) {
          errorMsg = errorData.detail;
      }
    } catch {
      // Ignore JSON parsing errors
    }
    throw new ApiError(errorMsg, response.status, details);
  }

  if (response.status === 204) return { data: null as T, message: "Success" };
  return response.json();
}

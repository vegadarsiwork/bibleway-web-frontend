"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import { fetchAPI } from "../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const ENDPOINTS = [
  { name: "Verse of the Day", path: "/verse-of-day/today/" },
  { name: "Social Posts", path: "/social/posts/" },
  { name: "Prayer Requests", path: "/social/prayers/" },
  { name: "Own Profile (Requires Auth)", path: "/accounts/profile/" },
  { name: "List Bibles (API.Bible proxy)", path: "/bible/api-bible/v1/bibles?language=eng" },
  { name: "Shop Products", path: "/shop/products/" },
];

export default function ApiTestPage() {
  const router = useRouter();
  if (process.env.NODE_ENV === "production") {
    router.replace("/");
    return null;
  }
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<string>("Checking...");

  const [authEmail, setAuthEmail] = useState("test@bibleway.app");
  const [authPassword, setAuthPassword] = useState("StrongPassword123!");

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    setTokenStatus(token ? "Valid Token Present ✓" : "No Token Found ✗");
  };

  const quickLogin = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setActiveEndpoint("Quick Login");
    try {
      const res = await fetch(`${API_URL}/accounts/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (res.ok && data.data?.access) {
        localStorage.setItem("access_token", data.data.access);
        if (data.data.refresh) localStorage.setItem("refresh_token", data.data.refresh);
        checkToken();
        setResponse({ message: "Successfully logged in!", ...data });
      } else {
        throw new Error(JSON.stringify(data));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (path: string) => {
    setActiveEndpoint(path);
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetchAPI(path);
      setResponse(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isLocal = API_URL.includes("localhost");

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <span className="text-xs font-label uppercase tracking-[0.3em] text-on-tertiary-fixed-variant bg-tertiary-fixed/30 px-3 py-1 rounded-full mb-4 inline-block">
              Temporary Tools
            </span>
            <h1 className="text-4xl font-headline text-on-surface mb-2">
              API Testing Playground
            </h1>
            <p className="text-on-surface-variant font-medium">
              Backend:&nbsp;
              <span className={`font-mono ml-2 px-2 py-1 rounded ${isLocal ? "text-green-600 bg-green-500/10" : "text-primary bg-primary/10"}`}>
                {API_URL}
              </span>
              {isLocal && (
                <span className="ml-2 text-xs text-green-600 font-semibold">● Local</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Controls */}
          <div className="w-full lg:w-1/3 space-y-4">
            <h3 className="font-headline text-xl mb-4">Available Endpoints</h3>

            {/* Quick Auth Box */}
            <div className="bg-tertiary-fixed/20 p-4 rounded-xl border border-tertiary-fixed-dim/30 mb-6">
              <h4 className="font-bold text-sm text-on-tertiary-fixed-variant mb-2">Authentication Status</h4>
              <p className={`text-xs font-mono mb-4 ${tokenStatus.includes("✓") ? "text-green-600" : "text-red-500"}`}>
                {tokenStatus}
              </p>

              <div className="space-y-2 mb-3">
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-surface-container-lowest border border-outline-variant/30"
                  placeholder="Email"
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-surface-container-lowest border border-outline-variant/30"
                  placeholder="Password"
                />
              </div>
              <button
                onClick={quickLogin}
                className="w-full bg-primary text-on-primary text-xs font-bold py-2 rounded shadow-sm hover:opacity-90"
              >
                Quick Login & Save Token
              </button>
              <p className="text-[10px] text-on-surface-variant mt-2 text-center">
                {isLocal
                  ? "Using local backend — log in with your local account credentials."
                  : "Using production backend — use your production account."}
              </p>
            </div>

            {ENDPOINTS.map((endpoint) => (
              <button
                key={endpoint.path}
                onClick={() => testEndpoint(endpoint.path)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  activeEndpoint === endpoint.path
                    ? "bg-primary text-on-primary border-primary shadow-lg"
                    : "bg-surface-container-lowest text-on-surface border-outline-variant/20 hover:border-primary/50"
                }`}
              >
                <div className="font-bold mb-1">{endpoint.name}</div>
                <div className={`font-mono text-xs ${activeEndpoint === endpoint.path ? "text-on-primary/70" : "text-on-surface-variant"}`}>
                  GET {endpoint.path}
                </div>
              </button>
            ))}
          </div>

          {/* Viewer */}
          <div className="w-full lg:w-2/3">
            <h3 className="font-headline text-xl mb-4">JSON Response</h3>
            <div className="bg-[#1e1e1e] rounded-xl overflow-hidden min-h-[500px] flex flex-col shadow-xl">

              {/* Header */}
              <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-[#404040]">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                </div>
                <div className="font-mono text-xs text-gray-400">
                  {loading ? "Fetching..." : activeEndpoint || "Awaiting Request"}
                </div>
                <div></div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-auto bg-[#1e1e1e] flex-1">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-gray-500 font-mono animate-pulse">
                    Executing Request...
                  </div>
                ) : error ? (
                  <div className="text-[#ff5f56] font-mono whitespace-pre-wrap">
                    <span className="font-bold">Error:</span> {error}
                  </div>
                ) : response ? (
                  <pre className="text-[#9cdcfe] font-mono text-sm whitespace-pre-wrap">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-600 font-mono">
                    Select an endpoint from the left menu.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

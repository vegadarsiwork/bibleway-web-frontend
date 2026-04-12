"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "../lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await fetchAPI("/accounts/change-password/", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      setMessage("Password changed successfully!");
      setTimeout(() => router.push("/profile"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <Link href="/" className="mb-12">
        <img src="/bibleway-logo.png" alt="Bibleway" className="h-12 w-auto" />
      </Link>

      <div className="w-full max-w-md">
        <h1 className="font-headline text-4xl text-on-surface text-center mb-2">Change password</h1>
        <p className="text-on-surface-variant text-center mb-10">
          Enter your current password and choose a new one.
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-600 p-4 rounded-xl mb-6 text-sm text-center">{error}</div>
        )}
        {message && (
          <div className="bg-green-500/10 text-green-700 p-4 rounded-xl mb-6 text-sm text-center font-medium">{message}</div>
        )}

        {!message && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 pr-12 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
                />
                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors p-1">
                  <span className="material-symbols-outlined text-[20px]">{showPasswords ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">New Password</label>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">Confirm New Password</label>
              <input
                type={showPasswords ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 focus:ring-1 focus:ring-tertiary-fixed-dim focus:bg-surface-container-lowest transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-sm tracking-widest uppercase shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? "Updating..." : "Change Password"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link href="/profile" className="text-sm font-bold text-primary hover:underline">
            Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

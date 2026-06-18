"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useRouter } from "next/navigation";
import { createToastHelpers } from "../../store/toastStore";
import ToastContainer from "../components/ToastContainer";
import Navbar from "../components/Navbar";
import { usePipelineStore } from "../../store/pipelineStore";

export default function ResetPasswordPage() {
  const { theme } = usePipelineStore();
  const isDark = theme === "dark";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const router = useRouter();
  const toast = createToastHelpers();

  useEffect(() => {
    // Check if there is an active session (recovery link automatically sets it)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
      } else {
        setHasSession(false);
        setError("No active recovery session found. Please request a new password reset link.");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      toast.success("Password updated successfully! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/clean");
      }, 2000);
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-250 ${
      isDark ? "bg-zinc-950 text-zinc-300" : "bg-gray-50 text-gray-900"
    }`}>
      <ToastContainer />
      <Navbar activeTab="home" />
      
      <main className="max-w-md mx-auto px-6 py-20">
        <div className={`border rounded-2xl p-8 shadow-lg space-y-6 ${
          isDark ? "bg-zinc-900 border-zinc-800 text-zinc-200" : "bg-white border-zinc-100"
        }`}>
          <div className="text-center">
            <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              Update Password
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Enter your new secure password below to update your credentials.
            </p>
          </div>

          {error && (
            <div className={`p-3 text-xs font-semibold rounded-lg border flex items-center gap-2 ${
              isDark ? "text-rose-400 bg-rose-950/20 border-rose-900/30" : "text-rose-600 bg-rose-50 border-rose-100"
            }`}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {hasSession !== false ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all ${
                    isDark
                      ? "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-violet-500"
                      : "bg-white border-zinc-200 text-zinc-800 placeholder-gray-400 focus:border-violet-500"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all ${
                    isDark
                      ? "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-violet-500"
                      : "bg-white border-zinc-200 text-zinc-800 placeholder-gray-400 focus:border-violet-500"
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading || hasSession === null}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl transition-all shadow-md"
              >
                Go to Homepage
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { usePipelineStore } from "../../store/pipelineStore";
import { supabase } from "../../utils/supabaseClient";
import { createToastHelpers } from "../../store/toastStore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: "signup" | "login";
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = "signup" }: AuthModalProps) {
  const { theme } = usePipelineStore();
  const isDark = theme === "dark";
  const toast = createToastHelpers();

  const [mode, setMode] = useState<"signup" | "login" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please fill in email field.");
      return;
    }

    if (mode !== "forgot" && !password) {
      setError("Please fill in password field.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || email.split("@")[0],
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          if (data?.session) {
            toast.success("Successfully registered and logged in!");
            onSuccess();
            onClose();
          } else {
            toast.success("Sign up successful! Please check your email for the confirmation link.", 6000);
            onClose();
          }
        }
      } else if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        } else {
          toast.success("Successfully logged in!");
          onSuccess();
          onClose();
        }
      } else if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetError) {
          setError(resetError.message);
        } else {
          toast.success("Password reset email sent! Check your inbox.");
          setMode("login");
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    setLoading(true);
    setError("");
    try {
      const { error: socialError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/clean`,
        },
      });
      if (socialError) {
        setError(socialError.message);
        setLoading(false);
      }
    } catch (err) {
      setError(`Failed to initiate ${provider} sign in.`);
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 ${
      isDark ? "bg-black/75" : "bg-black/50"
    }`}>
      {/* Modal Card */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200 ${
        isDark ? "bg-zinc-900 border-zinc-800 text-zinc-200 shadow-black/80" : "bg-white border-zinc-100 text-gray-900"
      }`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${
            isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="p-8">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 text-violet-500 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span className="text-xl font-extrabold tracking-tight">RefineML</span>
            </div>
            <h3 className={`text-xl font-bold ${isDark ? "text-zinc-100" : "text-gray-900"}`}>
              {mode === "signup" ? "Get started for free" : mode === "login" ? "Welcome back" : "Reset password"}
            </h3>
            <p className={`text-xs mt-1 ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
              {mode === "signup"
                ? "Create an account to unlock Auto Clean and export datasets."
                : mode === "login"
                ? "Sign in to access your dataset preprocessing pipeline."
                : "Enter your email to receive a password reset link."}
            </p>
          </div>

          {/* Tab Selector - Hide in forgot password mode */}
          {mode !== "forgot" ? (
            <div className={`flex border-b mb-6 ${isDark ? "border-zinc-800" : "border-zinc-100"}`}>
              <button
                onClick={() => { setMode("signup"); setError(""); }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  mode === "signup"
                    ? "border-violet-500 text-violet-500 font-bold"
                    : isDark
                    ? "border-transparent text-zinc-500 hover:text-zinc-300"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  mode === "login"
                    ? "border-violet-500 text-violet-500 font-bold"
                    : isDark
                    ? "border-transparent text-zinc-500 hover:text-zinc-300"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Log In
              </button>
            </div>
          ) : null}

          {/* Error Message */}
          {error && (
            <div className={`mb-4 p-3 text-xs font-semibold rounded-lg border flex items-center gap-2 ${
              isDark ? "text-rose-400 bg-rose-950/20 border-rose-900/30" : "text-rose-600 bg-rose-50 border-rose-100"
            }`}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? "text-zinc-400" : "text-gray-600"}`}>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all ${
                    isDark
                      ? "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-violet-500"
                      : "bg-white border-zinc-200 text-zinc-800 placeholder-gray-400 focus:border-violet-500"
                  }`}
                />
              </div>
            )}

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? "text-zinc-400" : "text-gray-600"}`}>Email Address</label>
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all ${
                  isDark
                    ? "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-violet-500"
                    : "bg-white border-zinc-200 text-zinc-800 placeholder-gray-400 focus:border-violet-500"
                }`}
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`block text-xs font-bold uppercase tracking-wide ${isDark ? "text-zinc-400" : "text-gray-600"}`}>Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setError(""); }}
                      className="text-xs font-bold text-violet-500 hover:text-violet-600 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : mode === "signup" ? (
                "Create Account"
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {mode === "forgot" && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                className="text-xs font-bold text-violet-500 hover:text-violet-600 cursor-pointer"
              >
                Back to Log In
              </button>
            </div>
          )}

          {/* Divider - Hide in forgot password mode */}
          {mode !== "forgot" && (
            <>
              <div className="relative my-6 text-center">
                <hr className={isDark ? "border-zinc-800" : "border-zinc-100"} />
                <span className={`absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 px-3 text-xs font-medium uppercase tracking-wide ${
                  isDark ? "bg-zinc-900 text-zinc-500" : "bg-white text-gray-400"
                }`}>Or continue with</span>
              </div>

              {/* Social Logins */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSocialLogin("google")}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 py-2 border rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.7 0 3.23.59 4.43 1.73l3.31-3.3C17.74 1.57 15.06 1 12 1 7.35 1 3.39 3.66 1.45 7.55l3.86 3C6.27 7.74 8.92 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.56v2.96h3.9c2.28-2.1 3.55-5.19 3.55-8.76z" />
                    <path fill="#FBBC05" d="M5.31 10.55c-.24-.72-.37-1.5-.37-2.3 0-.8.13-1.58.37-2.3L1.45 2.95C.53 4.79 0 6.84 0 9s.53 4.21 1.45 6.05l3.86-3z" />
                    <path fill="#34A853" d="M12 18.96c-3.08 0-5.73-2.7-6.69-5.51l-3.86 3C3.39 20.34 7.35 23 12 23c2.95 0 5.64-.99 7.54-2.68l-3.9-2.96c-1.04.68-2.4 1.6-3.64 1.6z" />
                  </svg>
                  Google
                </button>
                <button
                  onClick={() => handleSocialLogin("github")}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 py-2 border rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  GitHub
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

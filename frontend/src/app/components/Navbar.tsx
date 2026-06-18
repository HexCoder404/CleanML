"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePipelineStore } from "../../store/pipelineStore";
import { createToastHelpers } from "../../store/toastStore";
import AuthModal from "./AuthModal";
import { supabase } from "../../utils/supabaseClient";

interface NavbarProps {
  activeTab?: "clean" | "visualize" | "feedback" | "docs" | "home";
  isLanding?: boolean;
}

export default function Navbar({ activeTab, isLanding = false }: NavbarProps) {
  const { user, setUser, theme, setTheme } = usePipelineStore();
  const toast = createToastHelpers();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("cleanml_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    const storedTheme = localStorage.getItem("cleanml_theme") as "light" | "dark" | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, [setUser, setTheme]);

  const handleAuthSuccess = () => {
    const storedUser = localStorage.getItem("cleanml_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      router.refresh();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("cleanml_user");
    setUser(null);
    toast.success("Logged out successfully.");
    router.push("/");
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("cleanml_theme", next);
    localStorage.setItem("cleanml_docs_theme", next); // keep in sync
  };

  const isDark = theme === "dark";

  const linkClass = (tab: string) => {
    const activeColor = isDark ? "text-violet-400 border-violet-400 font-bold" : "text-indigo-600 border-indigo-600 font-bold";
    const inactiveColor = isDark ? "text-zinc-400 hover:text-zinc-200 border-transparent hover:border-zinc-800" : "text-gray-500 hover:text-indigo-600 border-transparent hover:border-gray-200";
    const base = "transition-all pb-1 border-b-2 px-1 text-sm duration-200";
    if (activeTab === tab) {
      return `${base} ${activeColor}`;
    }
    return `${base} ${inactiveColor}`;
  };

  const renderThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md border transition-all cursor-pointer shrink-0 ${
        isDark
          ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 shadow-sm"
      }`}
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
    >
      {isDark ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );

  return (
    <>
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
      <nav className={`px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm h-16 border-b transition-colors duration-250 ${
        isDark ? "bg-zinc-950/90 border-zinc-800 text-white shadow-black/20 backdrop-blur-md" : "bg-white/95 border-zinc-200 text-gray-900 backdrop-blur-md"
      }`}>
        <Link href="/" className="flex items-center space-x-3 text-indigo-600 hover:opacity-90 transition-opacity shrink-0">
          <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
          <span className={`text-2xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>RefineML</span>
        </Link>

        {isLanding ? (
          /* Landing Page Navbar */
          <div className="flex items-center space-x-4">
            <div className={`hidden md:flex space-x-6 text-sm font-semibold items-center ${
              isDark ? "text-zinc-400" : "text-gray-500"
            }`}>
              <Link href="/feedback" className={isDark ? "hover:text-white transition-colors" : "hover:text-violet-600 transition-colors"}>Feedback</Link>
              <Link href="/docs" className={isDark ? "hover:text-white transition-colors" : "hover:text-violet-600 transition-colors"}>Docs</Link>
            </div>
            
            {renderThemeToggle()}
            
            {user ? (
              <div className={`flex items-center space-x-4 pl-4 border-l ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                <Link
                  href="/clean"
                  className="text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 px-5 py-2 rounded-full transition-all shadow-sm"
                >
                  Go to App
                </Link>
                <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs ${
                  isDark ? "bg-zinc-800 text-zinc-200" : "bg-violet-100 text-violet-600"
                }`} title={user.email}>
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setIsAuthOpen(true);
                  }}
                  className={`text-sm font-semibold px-3 py-1.5 transition-colors ${
                    isDark ? "text-neutral-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthMode("signup");
                    setIsAuthOpen(true);
                  }}
                  className="text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 px-5 py-2 rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  Try Free
                </button>
              </div>
            )}
          </div>
        ) : (
          /* App Pages Navbar */
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-6 text-sm font-medium items-center">
              <Link href="/clean" className={linkClass("clean")}>Clean</Link>
              <Link href="/visualize" className={linkClass("visualize")}>Visualize Data</Link>
              <Link href="/feedback" className={linkClass("feedback")}>Feedback</Link>
              <Link href="/docs" className={linkClass("docs")}>Docs</Link>
            </div>

            {renderThemeToggle()}

            {user ? (
              <div className={`flex items-center space-x-3 pl-4 border-l ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs ${
                  isDark ? "bg-zinc-800 text-zinc-200" : "bg-violet-100 text-violet-700"
                }`} title={user.email}>
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className={`text-xs font-semibold transition-all ${
                    isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setIsAuthOpen(true);
                }}
                className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  isDark
                    ? "text-violet-400 bg-violet-950/20 hover:bg-violet-900/30 border border-violet-900/30"
                    : "text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100"
                }`}
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePipelineStore } from "../../store/pipelineStore";
import { createToastHelpers } from "../../store/toastStore";
import AuthModal from "./AuthModal";

interface NavbarProps {
  activeTab?: "clean" | "visualize" | "feedback" | "docs" | "home";
  isLanding?: boolean;
}

export default function Navbar({ activeTab, isLanding = false }: NavbarProps) {
  const { user, setUser } = usePipelineStore();
  const toast = createToastHelpers();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("cleanml_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, [setUser]);

  const handleAuthSuccess = () => {
    const stored = localStorage.getItem("cleanml_user");
    if (stored) {
      setUser(JSON.parse(stored));
      router.refresh();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cleanml_user");
    setUser(null);
    toast.success("Logged out successfully.");
    router.push("/");
  };

  const linkClass = (tab: string) => {
    const base = "hover:text-indigo-600 hover:border-indigo-600/50 active:text-indigo-600 active:border-indigo-600 transition-all pb-1";
    if (activeTab === tab) {
      return `${base} font-semibold text-indigo-600 border-b-2 border-indigo-600`;
    }
    return `${base} border-b-2 border-transparent`;
  };

  return (
    <>
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm h-16">
        <Link href="/" className="flex items-center space-x-3 text-indigo-650 hover:opacity-90 transition-opacity shrink-0">
          <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
          <span className="text-2xl font-extrabold tracking-tight text-gray-900">CleanML</span>
        </Link>

        {isLanding ? (
          /* Landing Page Navbar */
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-6 text-sm font-semibold text-gray-500 items-center">
              <Link href="/feedback" className="hover:text-violet-600 transition-colors">Feedback</Link>
              <Link href="/docs" className="hover:text-violet-600 transition-colors">Docs</Link>
            </div>
            
            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-gray-150">
                <Link
                  href="/clean"
                  className="text-sm font-bold text-white bg-violet-600 hover:bg-violet-750 px-5 py-2 rounded-full transition-all shadow-sm"
                >
                  Go to App
                </Link>
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-750 font-bold flex items-center justify-center text-xs" title={user.email}>
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
                  className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthMode("signup");
                    setIsAuthOpen(true);
                  }}
                  className="text-sm font-bold text-white bg-violet-600 hover:bg-violet-750 px-5 py-2 rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  Try Free
                </button>
              </div>
            )}
          </div>
        ) : (
          /* App Pages Navbar */
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-500 items-center">
              <Link href="/clean" className={linkClass("clean")}>Clean</Link>
              <Link href="/visualize" className={linkClass("visualize")}>Visualize Data</Link>
              <Link href="/feedback" className={linkClass("feedback")}>Feedback</Link>
              <Link href="/docs" className={linkClass("docs")}>Docs</Link>
            </div>

            {user ? (
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-150">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-750 font-bold flex items-center justify-center text-xs" title={user.email}>
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition-all"
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
                className="text-sm font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-4 py-1.5 rounded-full transition-all"
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

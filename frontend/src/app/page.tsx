"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthModal from "./components/AuthModal";
import Navbar from "./components/Navbar";
import { usePipelineStore } from "../store/pipelineStore";

export default function LandingPage() {
  const router = useRouter();
  const { user, setUser, theme } = usePipelineStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [activeTab, setActiveTab] = useState<"clean" | "suggest" | "viz" | "beforeafter">("clean");

  const handleAuthSuccess = () => {
    const storedUser = localStorage.getItem("cleanml_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      router.push("/clean");
    }
  };

  const handleTryFreeClick = () => {
    if (user) {
      router.push("/clean");
    } else {
      setAuthMode("signup");
      setIsAuthOpen(true);
    }
  };

  const isDark = theme === "dark";

  const tabs = [
    {
      id: "clean" as const,
      label: "Auto Clean",
      title: "One-Click Automated Dataset Preprocessing",
      desc: "Instantly identify and correct missing values, remove duplicates, and encode categorical columns in seconds. Watch your dataset quality score jump.",
      img: "/screenshot_auto_clean.png",
    },
    {
      id: "suggest" as const,
      label: "Smart Suggestions",
      title: "Intelligent Feature Preprocessing Guidelines",
      desc: "Our analytics engine scans your data profile to recommend optimal scaling, encoding strategies, or transformations tailored to standard ML models.",
      img: "/screenshot_smart_suggestions.png",
    },
    {
      id: "viz" as const,
      label: "ML Visualizations",
      title: "Instant Profiling & Target Distributions",
      desc: "Explore skewness, outliers, feature correlations, and histograms automatically. No need to write complex matplotlib or seaborn configurations.",
      img: "/screenshot_visualizations.png",
    },
    {
      id: "beforeafter" as const,
      label: "Before vs After",
      title: "See the Transformation Instantly",
      desc: "Compare dirty raw source files containing empty rows and raw strings side-by-side with clean, numerical, ML-ready outputs.",
      img: "/screenshot_before_after.png",
    },
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-250 ${
      isDark ? "bg-zinc-950 text-zinc-300" : "bg-zinc-50 text-zinc-800"
    }`}>
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

      {/* Navbar */}
      <Navbar isLanding={true} activeTab="home" />

      {/* Hero Section */}
      <header className={`relative py-20 px-8 transition-colors ${
        isDark ? "bg-gradient-to-b from-zinc-950 to-zinc-900/50" : "bg-gradient-to-b from-white to-gray-50/50"
      }`}>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className={`text-5xl md:text-6xl font-extrabold tracking-tight leading-tight ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            Clean and prepare datasets for <span className="text-violet-500 bg-clip-text">machine learning</span> in seconds
          </h1>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${
            isDark ? "text-neutral-400" : "text-gray-500"
          }`}>
            Upload CSV, Excel, or JSON files. Automatically detect issues, clean data, generate visualizations, and export ML-ready datasets — no coding required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleTryFreeClick}
              className="w-full sm:w-auto px-8 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer"
            >
              {user ? "Go to Dashboard" : "Try Free"}
            </button>
            <Link
              href="/clean?demo=true"
              className={`w-full sm:w-auto px-8 py-3.5 border font-bold rounded-full transition-all shadow-sm hover:shadow-md text-center ${
                isDark
                  ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white"
                  : "bg-white border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900"
              }`}
            >
              View Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Product Gallery Section (Tabbed Screenshots Showcase) */}
      <section className="py-16 px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-10">
          <h2 className={`text-3xl font-extrabold tracking-tight ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            People trust products they can <span className="text-violet-500">SEE</span>.
          </h2>
          <p className={isDark ? "text-zinc-500" : "text-gray-500"}>
            Take a look inside RefineML. See how you can profile, structure, and refine dataset columns in real-time.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border cursor-pointer ${
                activeTab === tab.id
                  ? "bg-violet-600 text-white border-violet-600 shadow-md"
                  : isDark
                    ? "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700 shadow-sm"
                    : "bg-white text-gray-500 hover:text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className={`rounded-2xl border shadow-xl overflow-hidden grid md:grid-cols-5 gap-0 transition-colors ${
          isDark ? "bg-zinc-900 border-zinc-800 shadow-black/40" : "bg-white border-zinc-200"
        }`}>
          {/* Text Description */}
          <div className={`p-8 md:p-12 md:col-span-2 flex flex-col justify-center space-y-4 ${
            isDark
              ? "bg-gradient-to-br from-zinc-950/10 to-transparent"
              : "bg-gradient-to-br from-violet-50/20 to-transparent"
          }`}>
            <span className="text-xs font-bold text-violet-500 uppercase tracking-widest">Feature Focus</span>
            <h3 className={`text-2xl font-bold leading-snug ${
              isDark ? "text-neutral-100" : "text-gray-900"
            }`}>
              {tabs.find((t) => t.id === activeTab)?.title}
            </h3>
            <p className={`text-sm leading-relaxed ${
              isDark ? "text-neutral-400" : "text-gray-500"
            }`}>
              {tabs.find((t) => t.id === activeTab)?.desc}
            </p>
            <div className="pt-2">
              <button
                onClick={handleTryFreeClick}
                className="text-xs font-bold text-violet-500 hover:text-violet-400 flex items-center gap-1.5 hover:underline cursor-pointer"
              >
                <span>Unlock feature now</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>

          {/* Screenshot Container */}
          <div className={`md:col-span-3 p-4 border-t md:border-t-0 md:border-l flex items-center justify-center min-h-[300px] transition-colors ${
            isDark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"
          }`}>
            {/* Embedded image with a shadow wrapper representing UI preview */}
            <div className={`relative w-full max-w-xl rounded-xl border shadow-lg overflow-hidden transition-colors ${
              isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
            }`}>
              {/* Fake Window Chrome Header */}
              <div className={`px-4 py-2 border-b flex items-center gap-1.5 shrink-0 select-none transition-colors ${
                isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50/80 border-zinc-200"
              }`}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                <div className={`w-16 h-3 rounded-full ml-2 ${
                  isDark ? "bg-neutral-800" : "bg-gray-200"
                }`}></div>
              </div>
              
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tabs.find((t) => t.id === activeTab)?.img}
                alt={tabs.find((t) => t.id === activeTab)?.title}
                className="w-full h-auto object-cover max-h-[360px] select-none"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* "How It Works" Section */}
      <section className={`py-16 px-8 transition-colors ${
        isDark ? "bg-zinc-950 border-y border-zinc-800" : "bg-white border-y border-zinc-200"
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <span className="text-xs font-bold text-violet-500 uppercase tracking-widest">Workflow</span>
            <h2 className={`text-3xl font-extrabold tracking-tight ${
              isDark ? "text-white" : "text-gray-900"
            }`}>How It Works</h2>
            <p className={`text-sm ${
              isDark ? "text-zinc-500" : "text-gray-500"
            }`}>Prepare datasets ready for model training in three simple steps.</p>
          </div>

          {/* Timeline Sequence */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 space-y-3 relative group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-105 transition-all shadow-sm ${
                isDark
                  ? "bg-neutral-900 border-neutral-800 text-violet-400"
                  : "bg-violet-50 border-violet-100 text-violet-600"
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold ${
                isDark ? "text-neutral-200" : "text-gray-900"
              }`}>1. Upload</h3>
              <p className={`text-sm leading-relaxed ${
                isDark ? "text-neutral-500" : "text-gray-500"
              }`}>
                Upload CSV, Excel, or JSON dataset. Files are processed securely.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 space-y-3 relative group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-105 transition-all shadow-sm ${
                isDark
                  ? "bg-neutral-900 border-neutral-800 text-violet-400"
                  : "bg-violet-50 border-violet-100 text-violet-600"
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold ${
                isDark ? "text-neutral-200" : "text-gray-900"
              }`}>2. Analyze</h3>
              <p className={`text-sm leading-relaxed ${
                isDark ? "text-zinc-500" : "text-gray-500"
              }`}>
                RefineML profiles your dataset automatically, identifying missing cells, skewness, and duplicates.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 space-y-3 relative group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-105 transition-all shadow-sm ${
                isDark
                  ? "bg-neutral-900 border-neutral-800 text-violet-400"
                  : "bg-violet-50 border-violet-100 text-violet-600"
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold ${
                isDark ? "text-neutral-200" : "text-gray-900"
              }`}>3. Export</h3>
              <p className={`text-sm leading-relaxed ${
                isDark ? "text-neutral-500" : "text-gray-500"
              }`}>
                Download ML-ready CSV or PKL instantly, formatted to import into pandas or scikit-learn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold text-violet-500 uppercase tracking-widest">Capabilities</span>
          <h2 className={`text-3xl font-extrabold tracking-tight ${
            isDark ? "text-white" : "text-gray-900"
          }`}>Dataset Preprocessing Made Easy</h2>
          <p className={`text-sm ${
            isDark ? "text-neutral-500" : "text-gray-500"
          }`}>High-performance tools to build robust data pipelines.</p>
        </div>        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className={`rounded-xl border p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
            isDark
              ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 shadow-sm shadow-black/20"
              : "bg-white border-zinc-200 hover:border-zinc-300 text-gray-800"
          }`}>
            <div className="space-y-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                isDark
                  ? "bg-zinc-950 border-zinc-800 text-violet-400"
                  : "bg-violet-50 border-violet-100 text-violet-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold ${
                isDark ? "text-neutral-200" : "text-gray-900"
              }`}>Smart Auto Clean</h3>
              <p className={`text-sm leading-relaxed ${
                isDark ? "text-zinc-400" : "text-gray-500"
              }`}>
                Automatically fix missing values and encode categories. Optimally imputes datasets in a single tap.
              </p>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className={`rounded-xl border p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
            isDark
              ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 shadow-sm shadow-black/20"
              : "bg-white border-zinc-200 hover:border-zinc-300 text-gray-800"
          }`}>
            <div className="space-y-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                isDark
                  ? "bg-zinc-950 border-zinc-800 text-violet-400"
                  : "bg-violet-50 border-violet-100 text-violet-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold ${
                isDark ? "text-neutral-200" : "text-gray-900"
              }`}>ML Visualizations</h3>
              <p className={`text-sm leading-relaxed ${
                isDark ? "text-zinc-400" : "text-gray-500"
              }`}>
                Generate charts, histograms, correlation heatmaps, and outlier boxplots instantly without writing code.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className={`rounded-xl border p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
            isDark
              ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 shadow-sm shadow-black/20"
              : "bg-white border-zinc-200 hover:border-zinc-300 text-gray-800"
          }`}>
            <div className="space-y-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                isDark
                  ? "bg-zinc-950 border-zinc-800 text-violet-400"
                  : "bg-violet-50 border-violet-100 text-violet-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold ${
                isDark ? "text-neutral-200" : "text-gray-900"
              }`}>Smart Suggestions</h3>
              <p className={`text-sm leading-relaxed ${
                isDark ? "text-zinc-400" : "text-gray-500"
              }`}>
                Get recommended preprocessing operations based on numeric skewness and categorical cardinality ratios.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className={`rounded-xl border p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
            isDark
              ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 shadow-sm shadow-black/20"
              : "bg-white border-zinc-200 hover:border-zinc-300 text-gray-800"
          }`}>
            <div className="space-y-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                isDark
                  ? "bg-zinc-950 border-zinc-800 text-violet-400"
                  : "bg-violet-50 border-violet-100 text-violet-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold ${
                isDark ? "text-neutral-200" : "text-gray-900"
              }`}>Export Ready</h3>
              <p className={`text-sm leading-relaxed ${
                isDark ? "text-zinc-400" : "text-gray-500"
              }`}>
                Download cleaned CSV or Pickle (.pkl) files ready to integrate straight into Python ML models.
              </p>
            </div>
          </div>

          {/* Card 5 */}
          <div className={`rounded-xl border p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
            isDark
              ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 shadow-sm shadow-black/20"
              : "bg-white border-zinc-200 hover:border-zinc-300 text-gray-800"
          }`}>
            <div className="space-y-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                isDark
                  ? "bg-zinc-950 border-zinc-800 text-violet-400"
                  : "bg-violet-50 border-violet-100 text-violet-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold ${
                isDark ? "text-neutral-200" : "text-gray-900"
              }`}>Feedback Driven</h3>
              <p className={`text-sm leading-relaxed ${
                isDark ? "text-zinc-400" : "text-gray-500"
              }`}>
                Suggest features directly to improve RefineML's engine. We build features that students and researchers ask for.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Banner */}
      <section className={`py-12 px-8 text-center transition-colors border-t ${
        isDark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-100 border-zinc-200"
      }`}>
        <div className="max-w-2xl mx-auto space-y-2">
          <p className={`text-xs font-bold uppercase tracking-widest ${
            isDark ? "text-neutral-500" : "text-gray-400"
          }`}>Built for details</p>
          <p className={`text-lg font-semibold leading-relaxed italic ${
            isDark ? "text-neutral-400" : "text-gray-600"
          }`}>
            &ldquo;Designed to simplify dataset preparation for machine learning workflows. Built for students, analysts, and ML beginners.&rdquo;
          </p>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-br from-violet-900 to-indigo-950 text-white py-16 px-8 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Ready to clean your dataset?</h2>
          <p className="text-violet-200 text-sm max-w-sm mx-auto leading-relaxed">
            Get your CSV, JSON, or Excel files ready for PyTorch, TensorFlow, or Scikit-Learn in minutes.
          </p>
          <div className="pt-2">
            <button
              onClick={handleTryFreeClick}
              className="px-8 py-3.5 bg-white text-violet-900 hover:bg-violet-50 hover:text-violet-950 font-bold rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
            >
              Try RefineML Free
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthModal from "./components/AuthModal";
import Navbar from "./components/Navbar";
import { usePipelineStore } from "../store/pipelineStore";

export default function LandingPage() {
  const router = useRouter();
  const { user, setUser } = usePipelineStore();
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

  const tabs = [
    {
      id: "clean" as const,
      label: "⚡ Auto Clean",
      title: "One-Click Automated Dataset Preprocessing",
      desc: "Instantly identify and correct missing values, remove duplicates, and encode categorical columns in seconds. Watch your dataset quality score jump.",
      img: "/screenshot_auto_clean.png",
    },
    {
      id: "suggest" as const,
      label: "✨ Smart Suggestions",
      title: "Intelligent Feature Preprocessing Guidelines",
      desc: "Our analytics engine scans your data profile to recommend optimal scaling, encoding strategies, or transformations tailored to standard ML models.",
      img: "/screenshot_smart_suggestions.png",
    },
    {
      id: "viz" as const,
      label: "📊 ML Visualizations",
      title: "Instant Profiling & Target Distributions",
      desc: "Explore skewness, outliers, feature correlations, and histograms automatically. No need to write complex matplotlib or seaborn configurations.",
      img: "/screenshot_visualizations.png",
    },
    {
      id: "beforeafter" as const,
      label: "⚖️ Before vs After",
      title: "See the Transformation Instantly",
      desc: "Compare dirty raw source files containing empty rows and raw strings side-by-side with clean, numerical, ML-ready outputs.",
      img: "/screenshot_before_after.png",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

      {/* Navbar */}
      <Navbar isLanding={true} activeTab="home" />

      {/* Hero Section */}
      <header className="relative py-20 px-8 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Clean and prepare datasets for <span className="text-violet-600 bg-clip-text">machine learning</span> in seconds
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Upload CSV, Excel, or JSON files. Automatically detect issues, clean data, generate visualizations, and export ML-ready datasets — no coding required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleTryFreeClick}
              className="w-full sm:w-auto px-8 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              {user ? "Go to Dashboard" : "Try Free"}
            </button>
            <Link
              href="/clean?demo=true"
              className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 font-bold rounded-full transition-all shadow-sm hover:shadow-md text-center"
            >
              View Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Product Gallery Section (Tabbed Screenshots Showcase) */}
      <section className="py-16 px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            People trust products they can <span className="text-violet-600">SEE</span>.
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Take a look inside CleanML. See how you can profile, structure, and refine dataset columns in real-time.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                activeTab === tab.id
                  ? "bg-violet-600 text-white border-violet-600 shadow-md"
                  : "bg-white text-gray-500 hover:text-gray-700 border-gray-200 hover:border-gray-300 shadow-sm"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden grid md:grid-cols-5 gap-0">
          {/* Text Description */}
          <div className="p-8 md:p-12 md:col-span-2 flex flex-col justify-center space-y-4 bg-gradient-to-br from-violet-50/20 to-transparent">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Feature Focus</span>
            <h3 className="text-2xl font-bold text-gray-900 leading-snug">
              {tabs.find((t) => t.id === activeTab)?.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {tabs.find((t) => t.id === activeTab)?.desc}
            </p>
            <div className="pt-2">
              <button
                onClick={handleTryFreeClick}
                className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1.5 hover:underline"
              >
                <span>Unlock feature now</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>

          {/* Screenshot Container */}
          <div className="bg-gray-50 md:col-span-3 p-4 border-t md:border-t-0 md:border-l border-gray-100 flex items-center justify-center min-h-[300px]">
            {/* Embedded image with a shadow wrapper representing UI preview */}
            <div className="relative w-full max-w-xl rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-white">
              {/* Fake Window Chrome Header */}
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/80 flex items-center gap-1.5 shrink-0 select-none">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                <div className="w-16 h-3 bg-gray-200 rounded-full ml-2"></div>
              </div>
              
              {/* Image itself */}
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
      <section className="py-16 px-8 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Workflow</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">How It Works</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">Prepare datasets ready for model training in three simple steps.</p>
          </div>

          {/* Timeline Sequence */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 space-y-3 relative group">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-2xl font-bold border border-violet-100 group-hover:scale-105 transition-all shadow-sm">
                ☁️
              </div>
              <h3 className="text-lg font-bold text-gray-900">1. Upload</h3>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Upload CSV, Excel, or JSON dataset. Files are processed securely.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 space-y-3 relative group">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-2xl font-bold border border-violet-100 group-hover:scale-105 transition-all shadow-sm">
                🔍
              </div>
              <h3 className="text-lg font-bold text-gray-900">2. Analyze</h3>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                CleanML profiles your dataset automatically, identifying missing cells, skewness, and duplicates.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 space-y-3 relative group">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-2xl font-bold border border-violet-100 group-hover:scale-105 transition-all shadow-sm">
                📦
              </div>
              <h3 className="text-lg font-bold text-gray-900">3. Export</h3>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Download ML-ready CSV or PKL instantly, formatted to import into pandas or scikit-learn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Capabilities</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Dataset Preprocessing Made Easy</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">High-performance tools to build robust data pipelines.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-lg font-semibold border border-violet-100">⚡</div>
              <h3 className="text-lg font-bold text-gray-900">Smart Auto Clean</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Automatically fix missing values and encode categories. Optimally imputes datasets in a single tap.
              </p>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-lg font-semibold border border-violet-100">📊</div>
              <h3 className="text-lg font-bold text-gray-900">ML Visualizations</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Generate charts, histograms, correlation heatmaps, and outlier boxplots instantly without writing code.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-lg font-semibold border border-violet-100">✨</div>
              <h3 className="text-lg font-bold text-gray-900">Smart Suggestions</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Get recommended preprocessing operations based on numeric skewness and categorical cardinality ratios.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-lg font-semibold border border-violet-100">📦</div>
              <h3 className="text-lg font-bold text-gray-900">Export Ready</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Download cleaned CSV or Pickle (.pkl) files ready to integrate straight into Python ML models.
              </p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-lg font-semibold border border-violet-100">💬</div>
              <h3 className="text-lg font-bold text-gray-900">Feedback Driven</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Suggest features directly to improve CleanML's engine. We build features that students and researchers ask for.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Banner */}
      <section className="bg-gray-100 py-12 px-8 border-t border-gray-150 text-center">
        <div className="max-w-2xl mx-auto space-y-2">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Built for details</p>
          <p className="text-lg font-semibold text-gray-600 leading-relaxed italic">
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
              className="px-8 py-3.5 bg-white text-violet-900 hover:bg-violet-50 hover:text-violet-950 font-bold rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Try CleanML Free
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

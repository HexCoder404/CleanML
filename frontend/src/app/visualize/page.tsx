"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePipelineStore } from "../../store/pipelineStore";
import Navbar from "../components/Navbar";
import CustomSelect from "../components/CustomSelect";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const INDIGO  = "#6366F1";
const AMBER   = "#F59E0B";
const EMERALD = "#10B981";
const ROSE    = "#F43F5E";
const BLUE    = "#3B82F6";
const PURPLE  = "#A855F7";
const BAR_COLORS = [INDIGO, BLUE, PURPLE, EMERALD, AMBER, ROSE];

function corrColor(v: number | null) {
  if (v === null) return "#1f1f23";
  const intensity = Math.abs(v);
  if (v > 0) return `rgba(99,102,241,${0.15 + intensity * 0.85})`;
  return `rgba(244,63,94,${0.15 + intensity * 0.85})`;
}

function SectionHeader({ title, isDark }: { title: string; isDark: boolean }) {
  return (
    <div className="flex items-center space-x-3 mb-6">
      <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h2>
      <div className={`flex-1 h-px ${isDark ? "bg-zinc-800" : "bg-gray-200"}`}></div>
    </div>
  );
}

function StatCard({ label, value, color, isDark }: { label: string; value: string | number; color: string; isDark: boolean }) {
  return (
    <div className={`rounded-xl border p-5 relative overflow-hidden transition-all ${
      isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300 shadow-[0_8px_30px_rgb(0,0,0,0.4)]" : "bg-white border-gray-100 shadow-sm"
    }`}>
      <div className={`absolute right-0 top-0 h-full w-1.5 ${color}`}></div>
      <p className={`text-xs uppercase tracking-wide font-medium mb-1 ${isDark ? "text-zinc-500" : "text-gray-500"}`}>{label}</p>
      <p className={`text-3xl font-bold ${isDark ? "text-zinc-100" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function BoxPlotBar({ col, data, isDark }: { col: string; data: any; isDark: boolean }) {
  const range = data.max - data.min || 1;
  const toPercent = (v: number) => ((v - data.min) / range) * 100;
  const whiskerLow  = toPercent(data.lower_fence);
  const q1p         = toPercent(data.q1);
  const medp        = toPercent(data.median);
  const q3p         = toPercent(data.q3);
  const whiskerHigh = toPercent(data.upper_fence);
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-semibold ${isDark ? "text-zinc-300" : "text-gray-700"}`}>{col}</span>
        {data.outlier_count > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isDark ? "bg-rose-950/40 text-rose-400 border border-rose-900/50" : "bg-rose-100 text-rose-700"
          }`}>
            {data.outlier_count} outlier{data.outlier_count > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className={`relative w-full h-10 rounded-full transition-colors ${
        isDark ? "bg-zinc-950" : "bg-gray-100"
      }`}>
        <div className="absolute top-1/2 -translate-y-0.5 h-0.5 bg-gray-400" style={{ left: `${whiskerLow}%`, width: `${q1p - whiskerLow}%` }} />
        <div className="absolute top-1/2 -translate-y-0.5 h-0.5 bg-gray-400" style={{ left: `${q3p}%`, width: `${whiskerHigh - q3p}%` }} />
        <div className="absolute top-1 bottom-1 bg-indigo-400/60 border-2 border-indigo-500 rounded" style={{ left: `${q1p}%`, width: `${q3p - q1p}%` }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-indigo-600" style={{ left: `${medp}%` }} />
      </div>
      <div className="flex justify-between text-xs text-zinc-500 mt-1">
        <span>{Number(data.min).toFixed(2)}</span>
        <span>Median: {Number(data.median).toFixed(2)}</span>
        <span>{Number(data.max).toFixed(2)}</span>
      </div>
    </div>
  );
}

function CorrHeatmap({ cols, data, isDark }: { cols: string[]; data: any[]; isDark: boolean }) {
  const lookup: Record<string, number | null> = {};
  data.forEach((d) => { lookup[`${d.x}|||${d.y}`] = d.value; });
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-1"></th>
            {cols.map((c) => (
              <th key={c} className="p-1 text-zinc-500 font-medium" style={{ writingMode: "vertical-rl", maxWidth: 60 }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cols.map((r) => (
            <tr key={r}>
              <td className="pr-2 text-zinc-500 font-medium whitespace-nowrap text-right" style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis" }}>{r}</td>
              {cols.map((c) => {
                const v = lookup[`${r}|||${c}`] ?? null;
                const cellBg = v === null ? (isDark ? "#121214" : "#e5e7eb") : corrColor(v);
                return (
                  <td key={c} className="w-12 h-10 text-center font-bold transition-all border border-zinc-800/20"
                    style={{ background: cellBg, color: v !== null && Math.abs(v) > 0.5 ? "#fff" : (isDark ? "#a3a3a3" : "#374151") }}
                    title={`${r} vs ${c}: ${v}`}>
                    {v !== null ? v.toFixed(2) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function VisualizePage() {
  const { currentFileId, setCurrentFileId, addUploadedFileId, user, theme } = usePipelineStore();

  const [file, setFile]               = useState<File | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [vizData, setVizData]           = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [activeHistCol, setActiveHistCol] = useState("");
  const [activeBoxCol,  setActiveBoxCol]  = useState("");
  const [activeCatCol,  setActiveCatCol]  = useState("");

  const isDark = theme === "dark";

  useEffect(() => {
    if (!currentFileId) return;
    setLoading(true);
    setError(null);
    setVizData(null);
    fetch(`/api/visualization?file_id=${encodeURIComponent(currentFileId)}`)
      .then((r) => { if (!r.ok) throw new Error("Failed to load visualization data"); return r.json(); })
      .then((d) => {
        setVizData(d);
        setActiveHistCol(Object.keys(d.histograms)[0] || "");
        setActiveBoxCol(Object.keys(d.boxplots)[0]  || "");
        setActiveCatCol(Object.keys(d.categorical)[0] || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [currentFileId]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/dataset/upload`, { method: "POST", body: formData });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Upload failed"); }
      const data = await res.json();
      setCurrentFileId(data.file_id);
      addUploadedFileId(data.file_id);
    } catch (e: any) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };  return (
    <div className={`min-h-screen font-sans transition-colors duration-250 ${
      isDark ? "bg-zinc-950 text-zinc-300" : "bg-gray-50 text-gray-900"
    }`}>
      <Navbar activeTab="visualize" />

      <main className="max-w-7xl mx-auto px-8 py-10 space-y-14">
        <header className="text-center space-y-2">
          <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Dataset Visualizer</h1>
          <p className={isDark ? "text-zinc-500" : "text-gray-500"}>Explore your ML-ready dataset with automatic charts and actionable statistics.</p>
        </header>

        {currentFileId && (
          <div className={`border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 gap-4 ${
            isDark ? "bg-violet-900/10 border-violet-900/30 text-violet-300" : "bg-indigo-50 border-indigo-100 text-indigo-900"
          }`}>
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <div>
                <p className={`font-semibold ${isDark ? "text-violet-200" : "text-indigo-900"}`}>Active Session Linked</p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-violet-400" : "text-indigo-700"}`}>We loaded your dataset directly from the Clean module.</p>
              </div>
            </div>
            <button className="whitespace-nowrap text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow transition-all cursor-pointer" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
              View Charts ↓
            </button>
          </div>
        )}

        {/* Upload Section */}
        <section className={`p-8 rounded-2xl border flex flex-col items-center space-y-6 transition-colors ${
          isDark ? "bg-zinc-900 border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]" : "bg-white border-gray-100 shadow-sm"
        }`}>
          <div className="flex items-center justify-center w-full max-w-xl">
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
              className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                isDragging
                  ? isDark
                    ? "border-violet-500 bg-violet-900/20 ring-4 ring-violet-900/20"
                    : "border-indigo-500 bg-indigo-100 ring-4 ring-indigo-50"
                  : isDark
                    ? "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/30"
                    : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className={`w-10 h-10 mb-4 ${isDragging ? "text-indigo-500 animate-bounce" : "text-indigo-400"}`} fill="none" viewBox="0 0 20 16" xmlns="http://www.w3.org/2000/svg">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                </svg>
                <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold text-violet-500">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-zinc-500">CSV, Excel, or JSON (MAX. 150k rows)</p>
              </div>
              <input type="file" className="hidden" accept=".csv,.xls,.xlsx,.json" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
            </label>
          </div>

          {file && <div className={`text-sm font-medium px-4 py-2 rounded-lg ${
            isDark ? "bg-zinc-950 text-zinc-300" : "bg-gray-100 text-gray-700"
          }`}>Selected: {file.name}</div>}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-8 py-3 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition-all shadow-md hover:shadow-lg min-w-[200px] flex justify-center cursor-pointer"
          >
            {uploading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                <span>Uploading…</span>
              </span>
            ) : "Visualize Dataset"}
          </button>

          {uploadError && <div className="text-red-500 text-sm font-medium p-4 bg-red-950/10 border border-red-900/30 rounded-lg w-full max-w-xl text-center">{uploadError}</div>}
        </section>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <svg className="animate-spin h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-zinc-500 font-medium">Crunching numbers…</p>
          </div>
        )}

        {error && <div className="bg-red-950/10 border border-red-900/30 text-red-400 rounded-xl p-6 text-center">{error}</div>}

        {vizData && !loading && (
          <>
            {/* SECTION 1: Overview */}
            <section>
              <SectionHeader title="Dataset Overview" isDark={isDark} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Rows"       value={vizData.overview.row_count.toLocaleString()} color="bg-indigo-500" isDark={isDark} />
                <StatCard label="Total Columns"    value={vizData.overview.column_count}              color="bg-blue-500"   isDark={isDark} />
                <StatCard label="Numeric Cols"     value={vizData.overview.numeric_count}             color="bg-emerald-500" isDark={isDark} />
                <StatCard label="Categorical Cols" value={vizData.overview.categorical_count}         color="bg-amber-500"  isDark={isDark} />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className={`rounded-xl border p-6 transition-colors ${
                  isDark ? "bg-zinc-900 border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]" : "bg-white border-gray-100 shadow-sm"
                }`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${
                    isDark ? "text-zinc-400" : "text-gray-700"
                  }`}>Missing Values per Column</h3>
                  {vizData.overview.missing_values.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-emerald-600 space-y-2">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      <p className="font-semibold">No missing values!</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={vizData.overview.missing_values} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#262626" : "#e5e7eb"} />
                        <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: isDark ? "#737373" : "#4b5563" }} />
                        <YAxis type="category" dataKey="column" width={100} tick={{ fontSize: 11, fill: isDark ? "#737373" : "#4b5563" }} />
                        <Tooltip contentStyle={isDark ? { background: '#09090b', borderColor: '#262626', color: '#fff' } : undefined} formatter={(v: any) => [`${v}%`, "Missing"]} />
                        <Bar dataKey="missing_percent" radius={[0, 4, 4, 0]}>
                          {vizData.overview.missing_values.map((_: any, i: number) => <Cell key={i} fill={i < 3 ? ROSE : AMBER} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className={`rounded-xl border p-6 transition-colors ${
                  isDark ? "bg-zinc-900 border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]" : "bg-white border-gray-100 shadow-sm"
                }`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${
                    isDark ? "text-zinc-400" : "text-gray-700"
                  }`}>Data Type Distribution</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={vizData.overview.dtype_distribution} margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#262626" : "#e5e7eb"} />
                      <XAxis dataKey="type" tick={{ fontSize: 12, fill: isDark ? "#737373" : "#4b5563" }} />
                      <YAxis tick={{ fontSize: 11, fill: isDark ? "#737373" : "#4b5563" }} />
                      <Tooltip contentStyle={isDark ? { background: '#09090b', borderColor: '#262626', color: '#fff' } : undefined} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {vizData.overview.dtype_distribution.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* SECTION 2: Numeric Features */}
            {Object.keys(vizData.histograms).length > 0 && (
              <section>
                <SectionHeader title="Numeric Features" isDark={isDark} />
                <div className="grid md:grid-cols-2 gap-6">
                  <div className={`rounded-xl border p-6 transition-colors ${
                    isDark ? "bg-zinc-900 border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]" : "bg-white border-gray-100 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-sm font-bold uppercase tracking-wide ${
                        isDark ? "text-zinc-400" : "text-gray-700"
                      }`}>Histogram</h3>
                      <CustomSelect
                        value={activeHistCol}
                        onChange={(val: any) => setActiveHistCol(val)}
                        isDark={isDark}
                        className="w-40 shrink-0"
                        options={Object.keys(vizData.histograms).map((c) => ({ value: c, label: c }))}
                      />
                    </div>
                    {activeHistCol && (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={vizData.histograms[activeHistCol]} margin={{ top: 4, right: 8, bottom: 40, left: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#262626" : "#e5e7eb"} />
                          <XAxis dataKey="bin" tick={{ fontSize: 9, fill: isDark ? "#737373" : "#4b5563" }} angle={-35} textAnchor="end" interval={2} />
                          <YAxis tick={{ fontSize: 11, fill: isDark ? "#737373" : "#4b5563" }} />
                          <Tooltip contentStyle={isDark ? { background: '#09090b', borderColor: '#262626', color: '#fff' } : undefined} />
                          <Bar dataKey="count" fill={INDIGO} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className={`rounded-xl border p-6 transition-colors ${
                    isDark ? "bg-zinc-900 border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]" : "bg-white border-gray-100 shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-sm font-bold uppercase tracking-wide ${
                        isDark ? "text-zinc-400" : "text-gray-700"
                      }`}>Box Plot — Outlier Detection</h3>
                      <CustomSelect
                        value={activeBoxCol}
                        onChange={(val: any) => setActiveBoxCol(val)}
                        isDark={isDark}
                        className="w-40 shrink-0"
                        options={Object.keys(vizData.boxplots).map((c) => ({ value: c, label: c }))}
                      />
                    </div>
                    {activeBoxCol && <BoxPlotBar col={activeBoxCol} data={vizData.boxplots[activeBoxCol]} isDark={isDark} />}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-center">
                      {activeBoxCol && ([
                        ["Min",      vizData.boxplots[activeBoxCol]?.min],
                        ["Q1",       vizData.boxplots[activeBoxCol]?.q1],
                        ["Median",   vizData.boxplots[activeBoxCol]?.median],
                        ["Q3",       vizData.boxplots[activeBoxCol]?.q3],
                        ["Max",      vizData.boxplots[activeBoxCol]?.max],
                        ["Outliers", vizData.boxplots[activeBoxCol]?.outlier_count],
                      ] as [string, number][]).map(([l, v]) => (
                        <div key={l} className={`rounded-lg p-2 border transition-colors ${
                          isDark ? "bg-zinc-950/40 border-zinc-800 text-zinc-300" : "bg-gray-50 border-gray-100 text-gray-800"
                        }`}>
                          <p className="text-zinc-500 font-medium mb-0.5">{l}</p>
                          <p className={`font-bold ${isDark ? "text-zinc-200" : "text-gray-800"}`}>{typeof v === "number" ? Number(v).toFixed(2) : v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 3: Categorical Features */}
            {Object.keys(vizData.categorical).length > 0 && (
              <section>
                <SectionHeader title="Categorical Features" isDark={isDark} />
                <div className={`rounded-xl border p-6 transition-colors ${
                  isDark ? "bg-zinc-900 border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]" : "bg-white border-gray-100 shadow-sm"
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-sm font-bold uppercase tracking-wide ${
                      isDark ? "text-zinc-400" : "text-gray-700"
                    }`}>Category Frequency — Top 10</h3>
                    <CustomSelect
                      value={activeCatCol}
                      onChange={(val: any) => setActiveCatCol(val)}
                      isDark={isDark}
                      className="w-40 shrink-0"
                      options={Object.keys(vizData.categorical).map((c) => ({ value: c, label: c }))}
                    />
                  </div>
                  {activeCatCol && (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={vizData.categorical[activeCatCol]} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#262626" : "#e5e7eb"} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: isDark ? "#737373" : "#4b5563" }} />
                        <YAxis type="category" dataKey="value" width={140} tick={{ fontSize: 11, fill: isDark ? "#737373" : "#4b5563" }} />
                        <Tooltip contentStyle={isDark ? { background: '#09090b', borderColor: '#262626', color: '#fff' } : undefined} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {vizData.categorical[activeCatCol].map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>
            )}

            {/* SECTION 4: Correlation Heatmap */}
            {vizData.correlation.columns.length >= 2 && (
              <section>
                <SectionHeader title="Correlation Heatmap" isDark={isDark} />
                <div className={`rounded-xl border p-6 transition-colors ${
                  isDark ? "bg-zinc-900 border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]" : "bg-white border-gray-100 shadow-sm"
                }`}>
                  <p className={`text-xs mb-4 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                    Values range from <span className="text-rose-500 font-semibold">-1 (negative)</span> to <span className="text-indigo-600 font-semibold">+1 (positive)</span>. Strong correlations (|r| &gt; 0.7) may indicate feature redundancy.
                  </p>
                  <CorrHeatmap cols={vizData.correlation.columns} data={vizData.correlation.data} isDark={isDark} />
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

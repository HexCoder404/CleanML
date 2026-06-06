"use client";
import { useState } from "react";
import Link from "next/link";

const NAV = [
  {
    group: "Getting Started",
    items: [
      { id: "what-is-cleanml",  label: "What is CleanML?" },
      { id: "input-formats",    label: "Input Formats" },
      { id: "quick-start",      label: "Quick Start" },
    ],
  },
  {
    group: "Clean Page",
    items: [
      { id: "profiling",        label: "Dataset Profiling" },
      { id: "auto-clean",       label: "⚡ Auto Clean" },
      { id: "smart-suggestions",label: "Smart Suggestions" },
      { id: "pipeline",         label: "Building a Pipeline" },
      { id: "operations",       label: "Operations Reference" },
      { id: "export",           label: "Exporting Results" },
    ],
  },
  {
    group: "Visualize Page",
    items: [
      { id: "viz-overview",     label: "Overview Charts" },
      { id: "viz-numeric",      label: "Numeric Features" },
      { id: "viz-categorical",  label: "Categorical Features" },
      { id: "viz-correlation",  label: "Correlation Heatmap" },
    ],
  },
  {
    group: "Reference",
    items: [
      { id: "api",              label: "REST API" },
      { id: "limits",           label: "Limits & Constraints" },
    ],
  },
];

const ON_THIS_PAGE = [
  "What is CleanML?", "Input Formats", "Quick Start",
  "Dataset Profiling", "Auto Clean", "Smart Suggestions", "Pipeline Operations",
  "Visualize Page", "REST API",
];

function Code({ children }: { children: string }) {
  return (
    <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-sm font-mono overflow-x-auto leading-relaxed my-4">
      <code>{children}</code>
    </pre>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="pb-12 border-b border-gray-100 last:border-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-xl p-4">
      <span className="text-indigo-500 mt-0.5">💡</span>
      <p className="text-sm text-indigo-800 leading-relaxed">{children}</p>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("what-is-cleanml");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Top nav */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-14 flex items-center px-6 justify-between">
        <Link href="/" className="flex items-center space-x-2 text-indigo-600">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span className="text-lg font-extrabold tracking-tight">CleanML</span>
        </Link>
        <div className="flex items-center space-x-6 text-sm font-medium text-gray-500">
          <Link href="/clean" className="hover:text-indigo-600 hover:border-indigo-600/50 active:text-indigo-600 active:border-indigo-600 transition-all border-b-2 border-transparent pb-1">Clean</Link>
          <Link href="/visualize" className="hover:text-indigo-600 hover:border-indigo-600/50 active:text-indigo-600 active:border-indigo-600 transition-all border-b-2 border-transparent pb-1">Visualize Data</Link>
          <Link href="/feedback" className="hover:text-indigo-600 hover:border-indigo-600/50 active:text-indigo-600 active:border-indigo-600 transition-all border-b-2 border-transparent pb-1">Feedback</Link>
          <Link href="/docs" className="hover:text-indigo-600 hover:border-indigo-600/50 active:text-indigo-600 active:border-indigo-600 transition-all font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-1">Docs</Link>
        </div>
      </header>

      <div className="flex">
        {/* Left sidebar */}
        <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-60 flex-shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50/60 py-6 px-4">
          {NAV.map((section) => (
            <div key={section.group} className="mb-6">
              <p className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-gray-400">{section.group}</p>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors mb-0.5 ${
                    activeSection === item.id
                      ? "bg-indigo-100 text-indigo-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-10 py-10 max-w-3xl space-y-14">

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Documentation</p>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">CleanML Docs</h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Everything you need to prepare, clean, and visualize your datasets for Machine Learning — without writing code.
            </p>
          </div>

          {/* Getting Started */}
          <Section id="what-is-cleanml" title="What is CleanML?">
            <p className="text-gray-600 leading-relaxed">
              CleanML is a no-code web application designed to prepare messy raw datasets for Machine Learning.
              It accepts standard formats (CSV, Excel, JSON) and provides a visual pipeline builder to rapidly
              identify and fix data issues — missing values, duplicates, wrong types — without needing to write Pandas code.
            </p>
          </Section>

          <Section id="input-formats" title="Input Formats">
            <p className="text-gray-600 leading-relaxed mb-4">CleanML accepts the following file formats:</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { ext: ".csv", label: "CSV", desc: "Comma-separated values, UTF-8 or Latin-1" },
                { ext: ".xlsx / .xls", label: "Excel", desc: "Microsoft Excel workbooks" },
                { ext: ".json", label: "JSON", desc: "Array of row objects" },
              ].map((f) => (
                <div key={f.ext} className="border border-gray-200 rounded-xl p-4 text-center">
                  <p className="font-mono font-bold text-indigo-600 text-sm mb-1">{f.ext}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>
            <Note>Maximum dataset size is <strong>200,000 rows</strong>. Files larger than this will be rejected on upload.</Note>
          </Section>

          <Section id="quick-start" title="Quick Start">
            <ol className="space-y-4 text-gray-600">
              {[
                { n: "01", t: "Upload your dataset", d: "Drag & drop or click to select a CSV, Excel, or JSON file on the Clean or Visualize page." },
                { n: "02", t: "Review the profile", d: "CleanML instantly shows row count, column count, missing values, duplicates, and a Quality Score." },
                { n: "03", t: "Clean Data", d: "Click Auto Clean to instantly apply best practices, or build your own pipeline step-by-step." },
                { n: "04", t: "Export", d: "Export the cleaned data as CSV or PKL to use in your models." },
              ].map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">{s.n}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{s.t}</p>
                    <p className="text-sm text-gray-500">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          {/* Clean Page */}
          <Section id="profiling" title="Dataset Profiling">
            <p className="text-gray-600 leading-relaxed mb-4">
              When you upload a file, CleanML generates a profile with the following statistics:
            </p>
            <div className="overflow-x-auto">
              <table className="text-sm w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2 border border-gray-200 font-semibold text-gray-700">Metric</th>
                    <th className="px-4 py-2 border border-gray-200 font-semibold text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {[
                    ["Row Count", "Total number of rows in the dataset"],
                    ["Column Count", "Total columns, split by numeric and categorical"],
                    ["Missing Values", "Count of null/NaN cells per column"],
                    ["Duplicate Rows", "Number of exactly repeated rows"],
                    ["Quality Score", "0–100 score penalizing missing values and duplicates"],
                  ].map(([m, d]) => (
                    <tr key={m} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border border-gray-200 font-mono text-indigo-700">{m}</td>
                      <td className="px-4 py-2 border border-gray-200">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="auto-clean" title="⚡ Auto Clean">
            <p className="text-gray-600 leading-relaxed mb-4">
              If your dataset has obvious data quality issues, CleanML will display an <strong>Auto Clean</strong> banner under the preview table. This feature allows you to instantly apply AI-recommended cleaning steps with a single click.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600 text-sm">
              <li><strong>Toggle Operations:</strong> Before applying, you can toggle specific groups of operations: Fill Missing Values, Encode Categories, and Scale Numeric columns.</li>
              <li><strong>Improvement Scorecard:</strong> After completion, an improvement card summarizes changes to the Quality Score, Missing Values count, Duplicates, and Row count.</li>
              <li><strong>Expandable List:</strong> You can click the applied operations link to view the exact list of steps that were executed automatically.</li>
            </ul>
            <Note>If you don't like the result, you can use the <strong>Revert Last Pipeline Step</strong> button to restore the data to its previous state.</Note>
          </Section>

          <Section id="smart-suggestions" title="Smart Suggestions">
            <p className="text-gray-600 leading-relaxed">
              After profiling, CleanML's suggestion engine scans your dataset and recommends relevant
              cleaning and feature engineering operations. Suggestions appear <strong>once per session</strong> and
              disappear after you act on them. If you <strong>revert</strong> a pipeline step, suggestions reappear.
            </p>
            <SubSection title="Suggestion Categories">
              <div className="space-y-3 mt-2">
                {[
                  { badge: "🧹 Cleaning", desc: "Impute missing values using median (numeric) or mode (categorical) strategies." },
                  { badge: "⚙️ Engineering", desc: "Label-encode low-cardinality string columns; standardise numeric columns using Z-Score." },
                ].map((s) => (
                  <div key={s.badge} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="font-semibold text-sm text-gray-800 whitespace-nowrap">{s.badge}</span>
                    <p className="text-sm text-gray-600">{s.desc}</p>
                  </div>
                ))}
              </div>
            </SubSection>
          </Section>

          <Section id="pipeline" title="Building a Pipeline">
            <p className="text-gray-600 leading-relaxed">
              Use the <strong>Data Cleaning Pipeline</strong> panel to queue operations manually. Operations are executed
              in order when you click <strong>Apply Pipeline</strong>. You can remove any step before applying.
            </p>
            <Note>Only one operation per column is allowed per pipeline. Adding a second operation on the same column will show an error.</Note>
            <SubSection title="Revert">
              <p className="text-sm text-gray-600">After applying a pipeline, an amber <strong>Revert Last Pipeline Step</strong> button appears. Clicking it restores the dataset and profile to the previous state and re-shows Smart Suggestions.</p>
            </SubSection>
          </Section>

          <Section id="operations" title="Operations Reference">
            <div className="space-y-5">
              {[
                { op: "drop_duplicates", args: "none", desc: "Removes rows that are exact duplicates of another row." },
                { op: "drop_columns", args: "columns[]", desc: "Permanently drops the selected column(s) from the dataset." },
                { op: "impute", args: "columns[], strategy", desc: <>Fill missing values. Strategies: <Code>mean</Code>, <Code>median</Code>, <Code>mode</Code>, <Code>constant</Code>, <Code>drop</Code>.</> },
                { op: "encode", args: "columns[], strategy", desc: <>Convert categorical strings to numbers. Strategies: <Code>label</Code> (ordinal integers), <Code>onehot</Code> (new boolean columns).</> },
                { op: "scale", args: "columns[], strategy", desc: <>Normalise numeric columns. Strategies: <Code>standard</Code> (Z-Score, mean 0 / std 1), <Code>minmax</Code> (range 0–1).</> },
              ].map((r) => (
                <div key={r.op} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Code>{r.op}</Code>
                    <span className="text-xs text-gray-400 font-mono">{r.args}</span>
                  </div>
                  <p className="text-sm text-gray-600">{r.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="export" title="Exporting Results">
            <p className="text-gray-600 leading-relaxed">
              After applying at least one pipeline or Auto Clean step, export options appear below the pipeline tracker. You can export the clean dataset in two formats:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600 text-sm">
              <li><strong>Export CSV:</strong> Downloads the dataset as a standard comma-separated values (<Code>.csv</Code>) file.</li>
              <li><strong>Export PKL:</strong> Downloads a Python Pickle (<Code>.pkl</Code>) version, which perfectly preserves data types when loaded back into pandas via <Code>pd.read_pickle()</Code>.</li>
            </ul>
            <Note>CleanML securely manages file downloads using browser blobs to prevent unneeded page navigation or unintended file cleanup.</Note>
          </Section>

          {/* Visualize Page */}
          <Section id="viz-overview" title="Visualize — Overview Charts">
            <p className="text-gray-600 leading-relaxed">
              The Visualize page accepts a dataset upload independently. It shows four stat cards at the top
              (rows, columns, numeric count, categorical count), followed by charts for missing values and data-type distribution.
            </p>
          </Section>

          <Section id="viz-numeric" title="Visualize — Numeric Features">
            <p className="text-gray-600 leading-relaxed">Up to 6 numeric columns are available for:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600 text-sm">
              <li><strong>Histogram</strong> — 20-bin frequency distribution to reveal skewness and modality.</li>
              <li><strong>Box Plot</strong> — Shows min, Q1, median, Q3, max, and flags outliers beyond 1.5×IQR.</li>
            </ul>
          </Section>

          <Section id="viz-categorical" title="Visualize — Categorical Features">
            <p className="text-gray-600 leading-relaxed">
              For each string column (up to 6), CleanML renders a horizontal bar chart of the top 10 most frequent
              category values, sorted by descending count.
            </p>
          </Section>

          <Section id="viz-correlation" title="Visualize — Correlation Heatmap">
            <p className="text-gray-600 leading-relaxed">
              A pairwise Pearson correlation matrix is computed for up to 10 numeric columns.
              Cells are colour-coded: <span className="text-indigo-600 font-semibold">indigo = positive</span>,{" "}
              <span className="text-rose-500 font-semibold">rose = negative</span>. High absolute values (|r| &gt; 0.7)
              may indicate redundant features.
            </p>
          </Section>

          {/* Reference */}
          <Section id="api" title="REST API">
            <p className="text-gray-600 mb-4">Base URL: <Code>http://localhost:8000</Code> (local) or your Render deployment URL.</p>
            <div className="space-y-4 text-sm">
              {[
                { method: "POST",   path: "/api/dataset/upload",    desc: "Upload a CSV / Excel / JSON file. Returns file_id." },
                { method: "GET",    path: "/api/dataset/profile",   desc: "Returns row count, column stats, duplicates, missing values." },
                { method: "GET",    path: "/api/dataset/preview",   desc: "Returns first N rows as JSON." },
                { method: "POST",   path: "/api/dataset/clean",     desc: "Apply an ordered list of CleanOperations. Returns new file_id." },
                { method: "GET",    path: "/api/dataset/export",    desc: "Download the dataset as CSV." },
                { method: "GET",    path: "/api/dataset/export/pkl",desc: "Download the dataset as PKL." },
                { method: "DELETE", path: "/api/dataset/cleanup",   desc: "Delete a parquet file from the server." },
                { method: "GET",    path: "/api/visualization",     desc: "Returns histograms, boxplots, categorical freq, and correlation matrix." },
              ].map((e) => (
                <div key={e.path} className="flex gap-3 items-start border border-gray-200 rounded-xl p-3">
                  <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-md ${
                    e.method === "GET" ? "bg-blue-100 text-blue-700" :
                    e.method === "POST" ? "bg-emerald-100 text-emerald-700" :
                    "bg-rose-100 text-rose-700"
                  }`}>{e.method}</span>
                  <div>
                    <Code>{e.path}</Code>
                    <p className="text-gray-500 mt-1">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="limits" title="Limits & Constraints">
            <div className="overflow-x-auto">
              <table className="text-sm w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 border border-gray-200 text-left font-semibold text-gray-700">Constraint</th>
                    <th className="px-4 py-2 border border-gray-200 text-left font-semibold text-gray-700">Limit</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {[
                    ["Max rows", "200,000"],
                    ["Supported formats", "CSV, XLSX, XLS, JSON"],
                    ["Max columns in histogram / boxplot", "6"],
                    ["Max columns in correlation heatmap", "10"],
                    ["Max categorical top values shown", "10"],
                    ["Operations per column in one pipeline", "1"],
                  ].map(([k, v]) => (
                    <tr key={k} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border border-gray-200">{k}</td>
                      <td className="px-4 py-2 border border-gray-200 font-mono text-indigo-700">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

        </main>

        {/* Right TOC */}
        <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-52 flex-shrink-0 overflow-y-auto py-8 px-4 hidden xl:block">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">On this page</p>
          <nav className="space-y-1">
            {ON_THIS_PAGE.map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className="block text-sm text-gray-500 hover:text-indigo-600 transition-colors py-0.5"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

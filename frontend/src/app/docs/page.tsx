"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { usePipelineStore } from "../../store/pipelineStore";

const NAV = [
  {
    group: "Getting Started",
    items: [
      { id: "what-is-refineml",  label: "What is RefineML?" },
      { id: "input-formats",    label: "Input Formats" },
      { id: "quick-start",      label: "Quick Start" },
    ],
  },
  {
    group: "Clean Page",
    items: [
      { id: "profiling",        label: "Dataset Profiling" },
      { id: "auto-clean",       label: "Auto Clean" },
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
  { id: "what-is-refineml", label: "What is RefineML?" },
  { id: "input-formats", label: "Input Formats" },
  { id: "quick-start", label: "Quick Start" },
  { id: "profiling", label: "Dataset Profiling" },
  { id: "auto-clean", label: "Auto Clean" },
  { id: "smart-suggestions", label: "Smart Suggestions" },
  { id: "pipeline", label: "Building a Pipeline" },
  { id: "operations", label: "Operations Reference" },
  { id: "export", label: "Exporting Results" },
  { id: "viz-overview", label: "Visualize Page" },
  { id: "api", label: "REST API" },
  { id: "limits", label: "Limits & Constraints" },
];

interface ThemeProps {
  theme: "light" | "dark";
}

function Code({ children, theme }: { children: string; theme: "light" | "dark" }) {
  return (
    <code className={`px-1.5 py-0.5 rounded text-xs font-mono border transition-colors ${
      theme === "dark"
        ? "bg-zinc-900 border-zinc-800 text-zinc-300"
        : "bg-zinc-100 border-zinc-200 text-indigo-700"
    }`}>{children}</code>
  );
}

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group my-4 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900 text-zinc-500 font-mono text-[11px]">
        <span>JSON / BASH</span>
        <button
          onClick={handleCopy}
          className="hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-zinc-400">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Section({ id, title, theme, children }: { id: string; title: string; theme: "light" | "dark"; children: React.ReactNode }) {
  return (
    <section id={id} className={`pb-12 border-b last:border-0 scroll-mt-24 transition-colors ${
      theme === "dark" ? "border-zinc-800" : "border-zinc-100"
    }`}>
      <h2 className={`text-2xl font-bold tracking-tight mb-4 flex items-center gap-2 ${
        theme === "dark" ? "text-zinc-100" : "text-zinc-900"
      }`}>
        <span className="text-violet-500 font-mono text-lg font-normal">#</span> {title}
      </h2>
      {children}
    </section>
  );
}

function SubSection({ title, theme, children }: { title: string; theme: "light" | "dark"; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className={`text-base font-semibold mb-2 ${
        theme === "dark" ? "text-zinc-200" : "text-zinc-800"
      }`}>{title}</h3>
      {children}
    </div>
  );
}

function Note({ children, theme }: { children: React.ReactNode; theme: "light" | "dark" }) {
  return (
    <div className={`my-5 flex gap-3 border rounded-r-lg p-4 text-sm leading-relaxed transition-colors ${
      theme === "dark"
        ? "bg-zinc-900/40 border-y-zinc-800 border-r-zinc-800 border-l-2 border-l-violet-500 text-zinc-400"
        : "bg-indigo-50/50 border-y-indigo-100/50 border-r-indigo-100/50 border-l-2 border-l-indigo-500 text-indigo-950"
    }`}>
      <svg className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

function AccordionItem({ title, badge, theme, children }: { title: string; badge?: string; theme: "light" | "dark"; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border rounded-lg overflow-hidden mb-3 transition-colors ${
      theme === "dark"
        ? "border-zinc-800 bg-zinc-950/20"
        : "border-zinc-200 bg-white shadow-sm"
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors focus:outline-none ${
          theme === "dark" ? "hover:bg-zinc-900/10" : "hover:bg-zinc-50/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`font-mono text-sm font-semibold ${
            theme === "dark" ? "text-zinc-200" : "text-zinc-800"
          }`}>{title}</span>
          {badge && (
            <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border transition-colors ${
              theme === "dark"
                ? "bg-zinc-900 border-zinc-800 text-zinc-400"
                : "bg-zinc-50 border-zinc-200 text-zinc-600"
            }`}>
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className={`px-4 pb-4 pt-2 border-t text-sm leading-relaxed transition-colors ${
          theme === "dark"
            ? "border-zinc-800 text-zinc-400 bg-zinc-950/10"
            : "border-zinc-200 text-zinc-600 bg-zinc-50/20"
        }`}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("what-is-refineml");
  const { theme, setTheme } = usePipelineStore();

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("cleanml_theme", next);
    localStorage.setItem("cleanml_docs_theme", next);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-10% 0px -70% 0px" }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((sec) => observer.observe(sec));

    return () => {
      sections.forEach((sec) => observer.unobserve(sec));
    };
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Offset for sticky navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-250 ${
      theme === "dark" ? "bg-zinc-950 text-zinc-300" : "bg-white text-zinc-600"
    }`}>
      <Navbar activeTab="docs" />

      <div className="flex max-w-[1440px] mx-auto">
        {/* Left sidebar */}
        <aside className={`sticky top-16 h-[calc(100vh-4rem)] w-64 flex-shrink-0 overflow-y-auto border-r py-6 px-5 transition-colors duration-250 ${
          theme === "dark" ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50/60"
        }`}>
          <div className="flex items-center justify-between mb-6 px-2">
            <span className={`text-[11px] font-mono tracking-wider uppercase font-bold ${
              theme === "dark" ? "text-zinc-500" : "text-zinc-400"
            }`}>Navigation</span>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-md border transition-all cursor-pointer ${
                theme === "dark"
                  ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm"
              }`}
              title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {theme === "dark" ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>

          <nav className="space-y-6">
            {NAV.map((section) => (
              <div key={section.group}>
                <p className={`mb-2 px-2 text-[10px] font-bold uppercase tracking-wider ${
                    theme === "dark" ? "text-zinc-500" : "text-zinc-400"
                }`}>{section.group}</p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className={`w-full text-left px-3.5 py-1.5 rounded-md text-[13px] transition-all cursor-pointer ${
                        activeSection === item.id
                          ? theme === "dark"
                            ? "bg-violet-900/40 text-violet-400 border-l border-violet-500 pl-[13px] font-medium"
                            : "bg-indigo-50/60 text-indigo-700 border-l border-indigo-500 pl-[13px] font-medium"
                          : theme === "dark"
                            ? "text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-100"
                            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-12 py-10 max-w-3xl space-y-16">
          <div className="border-b pb-8 transition-colors border-zinc-800/10 dark:border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-2">Documentation</p>
            <h1 className={`text-4xl font-extrabold tracking-tight mb-4 ${
              theme === "dark" ? "text-white" : "text-zinc-900"
            }`}>RefineML Docs</h1>
            <p className={`text-base leading-relaxed ${
              theme === "dark" ? "text-zinc-400" : "text-zinc-500"
            }`}>
              Everything you need to prepare, clean, and visualize your datasets for Machine Learning — without writing code.
            </p>
          </div>

          {/* Getting Started */}
          <Section id="what-is-refineml" title="What is RefineML?" theme={theme}>
            <p className="leading-relaxed text-sm">
              RefineML is a no-code web application designed to prepare messy raw datasets for Machine Learning.
              It accepts standard formats (CSV, Excel, JSON) and provides a visual pipeline builder to rapidly
              identify and fix data issues — missing values, duplicates, wrong types — without needing to write Pandas code.
            </p>
          </Section>

          <Section id="input-formats" title="Input Formats" theme={theme}>
            <p className="leading-relaxed text-sm mb-4">RefineML accepts the following file formats:</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { ext: ".csv", label: "CSV", desc: "Comma-separated values, UTF-8 or Latin-1" },
                { ext: ".xlsx / .xls", label: "Excel", desc: "Microsoft Excel workbooks" },
                { ext: ".json", label: "JSON", desc: "Array of row objects" },
              ].map((f) => (
                <div key={f.ext} className={`border rounded-xl p-4 text-center transition-colors ${
                  theme === "dark"
                    ? "border-zinc-800 bg-zinc-950/20"
                    : "border-zinc-200 bg-white shadow-sm hover:shadow-md"
                }`}>
                  <p className="font-mono font-bold text-violet-500 text-xs mb-1">{f.ext}</p>
                  <p className={`text-[11px] ${
                      theme === "dark" ? "text-zinc-500" : "text-zinc-400"
                  }`}>{f.desc}</p>
                </div>
              ))}
            </div>
            <Note theme={theme}>Maximum dataset size is <strong>150,000 rows</strong>. Files larger than this will be rejected on upload.</Note>
          </Section>

          <Section id="quick-start" title="Quick Start" theme={theme}>
            <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 transition-colors before:bg-zinc-800 dark:before:bg-zinc-800 before:bg-zinc-200">
              {[
                { n: "01", t: "Upload your dataset", d: "Drag & drop or click to select a CSV, Excel, or JSON file on the Clean or Visualize page." },
                { n: "02", t: "Review the profile", d: "RefineML instantly shows row count, column count, missing values, duplicates, and a Quality Score." },
                { n: "03", t: "Clean Data", d: "Click Auto Clean to instantly apply best practices, or build your own pipeline step-by-step." },
                { n: "04", t: "Export", d: "Export the cleaned data as CSV or PKL to use in your models." },
              ].map((s) => (
                <div key={s.n} className="relative flex gap-4">
                  <span className={`absolute -left-6 transform -translate-x-[12px] flex-shrink-0 w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center border transition-all ${
                    theme === "dark"
                      ? "bg-zinc-900 border-zinc-800 text-violet-400"
                      : "bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm"
                  }`}>{s.n}</span>
                  <div className="pl-6">
                    <p className={`font-semibold text-[14px] ${
                      theme === "dark" ? "text-zinc-200" : "text-zinc-800"
                    }`}>{s.t}</p>
                    <p className={`text-[13px] mt-0.5 leading-relaxed ${
                      theme === "dark" ? "text-zinc-500" : "text-zinc-500"
                    }`}>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Clean Page */}
          <Section id="profiling" title="Dataset Profiling" theme={theme}>
            <p className="leading-relaxed text-sm mb-4">
              When you upload a file, RefineML generates a profile with the following statistics:
            </p>
            <div className={`overflow-x-auto border rounded-lg transition-colors ${
              theme === "dark" ? "border-zinc-800 bg-zinc-950/10" : "border-zinc-200 bg-white"
            }`}>
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className={`text-left border-b transition-colors ${
                    theme === "dark" ? "bg-zinc-900/30 border-zinc-800 text-zinc-400" : "bg-zinc-50 border-zinc-200 text-zinc-600"
                  }`}>
                    <th className="px-4 py-2.5 font-semibold">Metric</th>
                    <th className="px-4 py-2.5 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/10 dark:divide-zinc-800">
                  {[
                    ["Row Count", "Total number of rows in the dataset"],
                    ["Column Count", "Total columns, split by numeric and categorical"],
                    ["Missing Values", "Count of null/NaN cells per column"],
                    ["Duplicate Rows", "Number of exactly repeated rows"],
                    ["Quality Score", "0–100 score penalizing missing values and duplicates"],
                  ].map(([m, d]) => (
                    <tr key={m} className={`transition-colors ${
                      theme === "dark" ? "hover:bg-zinc-900/20 text-zinc-400" : "hover:bg-zinc-50/50 text-zinc-700"
                    }`}>
                      <td className={`px-4 py-2.5 font-mono font-medium ${
                        theme === "dark" ? "text-violet-400" : "text-indigo-600"
                      }`}>{m}</td>
                      <td className="px-4 py-2.5">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="auto-clean" title="Auto Clean" theme={theme}>
            <p className="leading-relaxed text-sm mb-4">
              If your dataset has data quality issues, RefineML will display an <strong>Auto Clean</strong> banner under the preview table. This feature allows you to instantly apply AI-recommended cleaning steps with a single click.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
              <li><strong>Toggle Operations:</strong> Before applying, you can toggle specific groups of operations: Fill Missing Values, Encode Categories, and Scale Numeric columns.</li>
              <li><strong>Improvement Scorecard:</strong> After completion, an improvement card summarizes changes to the Quality Score, Missing Values count, Duplicates, and Row count.</li>
              <li><strong>Expandable List:</strong> You can click the applied operations link to view the exact list of steps that were executed automatically.</li>
            </ul>
            <Note theme={theme}>If you don't like the result, you can use the <strong>Revert Last Pipeline Step</strong> button to restore the data to its previous state.</Note>
          </Section>

          <Section id="smart-suggestions" title="Smart Suggestions" theme={theme}>
            <p className="leading-relaxed text-sm">
              After profiling, RefineML's suggestion engine scans your dataset and recommends relevant
              cleaning and feature engineering operations. Suggestions appear <strong>once per session</strong> and
              disappear after you act on them. If you <strong>revert</strong> a pipeline step, suggestions reappear.
            </p>
            <SubSection title="Suggestion Categories" theme={theme}>
              <div className="space-y-3 mt-3">
                {[
                  { label: "Cleaning", desc: "Impute missing values using median (numeric) or mode (categorical) strategies." },
                  { label: "Engineering", desc: "Label-encode low-cardinality string columns; standardise numeric columns using Z-Score." },
                ].map((s) => (
                  <div key={s.label} className={`flex gap-3 p-3.5 border rounded-lg transition-colors ${
                    theme === "dark"
                      ? "bg-zinc-950/20 border-zinc-800"
                      : "bg-zinc-50/50 border-zinc-200 shadow-sm"
                  }`}>
                    <span className={`font-semibold text-xs whitespace-nowrap ${
                      theme === "dark" ? "text-zinc-200" : "text-zinc-800"
                    }`}>{s.label}</span>
                    <p className="text-xs">{s.desc}</p>
                  </div>
                ))}
              </div>
            </SubSection>
          </Section>

          <Section id="pipeline" title="Building a Pipeline" theme={theme}>
            <p className="leading-relaxed text-sm">
              Use the <strong>Data Cleaning Pipeline</strong> panel to queue operations manually. Operations are executed
              in order when you click <strong>Apply Pipeline</strong>. You can remove any step before applying.
            </p>
            <Note theme={theme}>Only one operation per column is allowed per pipeline. Adding a second operation on the same column will show an error.</Note>
            <SubSection title="Revert" theme={theme}>
              <p className="text-sm">After applying a pipeline, an amber <strong>Revert Last Pipeline Step</strong> button appears. Clicking it restores the dataset and profile to the previous state and re-shows Smart Suggestions.</p>
            </SubSection>
          </Section>

          <Section id="operations" title="Operations Reference" theme={theme}>
            <p className="leading-relaxed text-sm mb-4">Click on an operation to view its details and arguments:</p>
            <div className="space-y-2">
              {[
                {
                  op: "drop_duplicates",
                  args: "none",
                  desc: "Removes rows that are exact duplicates of another row in the dataset, keeping only the first occurrence."
                },
                {
                  op: "drop_columns",
                  args: "columns[]",
                  desc: "Permanently removes the specified columns from the data frame."
                },
                {
                  op: "impute",
                  args: "columns[], strategy",
                  desc: (
                    <>
                      Fills null cells in the selected columns. Supported strategies include:{" "}
                      <Code theme={theme}>mean</Code>, <Code theme={theme}>median</Code>, <Code theme={theme}>mode</Code>, <Code theme={theme}>constant</Code>, and <Code theme={theme}>drop</Code> (removes any rows containing nulls in the selected columns).
                    </>
                  )
                },
                {
                  op: "encode",
                  args: "columns[], strategy",
                  desc: (
                    <>
                      Converts non-numeric/string columns to numbers. Supported strategies include:{" "}
                      <Code theme={theme}>label</Code> (map categories to integer indices) and <Code theme={theme}>onehot</Code> (pivot categories into separate boolean indicator columns).
                    </>
                  )
                },
                {
                  op: "scale",
                  args: "columns[], strategy",
                  desc: (
                    <>
                      Normalizes the numerical ranges of selected columns. Supported strategies include:{" "}
                      <Code theme={theme}>standard</Code> (Z-Score scaling to mean=0, std=1) and <Code theme={theme}>minmax</Code> (scales values strictly to the [0, 1] range).
                    </>
                  )
                }
              ].map((r) => (
                <AccordionItem key={r.op} title={r.op} badge={r.args} theme={theme}>
                  <p className="text-xs">{r.desc}</p>
                </AccordionItem>
              ))}
            </div>
          </Section>

          <Section id="export" title="Exporting Results" theme={theme}>
            <p className="leading-relaxed text-sm">
              After applying at least one pipeline or Auto Clean step, export options appear below the pipeline tracker. You can export the clean dataset in two formats:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2 text-sm leading-relaxed">
              <li><strong>Export CSV:</strong> Downloads the dataset as a standard comma-separated values (<Code theme={theme}>.csv</Code>) file.</li>
              <li><strong>Export PKL:</strong> Downloads a Python Pickle (<Code theme={theme}>.pkl</Code>) version, which perfectly preserves data types when loaded back into pandas via <Code theme={theme}>pd.read_pickle()</Code>.</li>
            </ul>
            <Note theme={theme}>RefineML securely manages file downloads using browser blobs to prevent unneeded page navigation or unintended file cleanup.</Note>
          </Section>

          {/* Visualize Page */}
          <Section id="viz-overview" title="Visualize — Overview Charts" theme={theme}>
            <p className="leading-relaxed text-sm mb-4">
              The Visualize page accepts a dataset upload independently. It shows four stat cards at the top
              (rows, columns, numeric count, categorical count), followed by charts for missing values and data-type distribution.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Numeric Features", desc: "Allows deep analysis on up to 6 numeric columns. Renders histograms (20 bins) for skewness and modality, and Box Plots displaying min, Q1, median, Q3, max, and flags outliers." },
                { title: "Categorical Features", desc: "Supports up to 6 categorical/string columns. Renders clean, horizontal bar charts for the top 10 most frequent categories, sorted in descending order." },
                { title: "Correlation Heatmap", desc: "Computes pairwise Pearson correlation coefficients for up to 10 numeric columns. Rendered cells are color-coded dynamically (indigo for positive correlation, rose for negative correlation)." }
              ].map((chart) => (
                <div key={chart.title} className={`p-4 border rounded-xl transition-colors ${
                  theme === "dark" ? "bg-zinc-950/20 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
                }`}>
                  <p className={`font-semibold text-xs mb-1.5 ${
                    theme === "dark" ? "text-zinc-200" : "text-zinc-800"
                  }`}>{chart.title}</p>
                  <p className={`text-[11px] leading-relaxed ${
                      theme === "dark" ? "text-zinc-500" : "text-zinc-400"
                  }`}>{chart.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Reference */}
          <Section id="api" title="REST API" theme={theme}>
            <p className="leading-relaxed text-sm mb-4">Base URL: <Code theme={theme}>http://localhost:8000</Code> (local) or your Render deployment URL.</p>
            <div className="space-y-2">
              {[
                {
                  method: "POST",
                  path: "/api/dataset/upload",
                  desc: "Uploads a CSV, Excel, or JSON dataset. Form data requires key 'file'.",
                  example: `// Response\n{\n  "file_id": "8f2d9c4e-1284-4b53-90d1-0f727c62d0e8",\n  "filename": "customer_records.csv"\n}`
                },
                {
                  method: "GET",
                  path: "/api/dataset/profile",
                  desc: "Retrieves dataset metadata: rows, columns count, duplicates, missing cells.",
                  example: `// Request Params: ?file_id=8f2d9c4e-1284-4b53-90d1-0f727c62d0e8\n// Response\n{\n  "row_count": 12500,\n  "column_count": 8,\n  "duplicates": 12,\n  "missing_cells": 45,\n  "quality_score": 98.4\n}`
                },
                {
                  method: "GET",
                  path: "/api/dataset/preview",
                  desc: "Returns the first N rows of the dataset as a serialized JSON list.",
                  example: `// Request Params: ?file_id=8f2d9c4e-1284-4b53-90d1-0f727c62d0e8&limit=5\n// Response\n{\n  "columns": ["id", "age", "salary"],\n  "rows": [\n    [1, 28, 55000.0],\n    [2, 34, 62000.5]\n  ]\n}`
                },
                {
                  method: "POST",
                  path: "/api/dataset/clean",
                  desc: "Runs an ordered pipeline of cleaning operations. Generates a new file reference.",
                  example: `// Request Body\n{\n  "file_id": "8f2d9c4e-1284-4b53-90d1-0f727c62d0e8",\n  "operations": [\n    {\n      "op": "drop_duplicates"\n    },\n    {\n      "op": "impute",\n      "columns": ["salary"],\n      "strategy": "mean"\n    }\n  ]\n}\n// Response\n{\n  "file_id": "a9e8f4c2-0192-4d2a-88f5-4e892c90a1ff",\n  "message": "Pipeline completed successfully"\n}`
                },
                {
                  method: "GET",
                  path: "/api/dataset/export",
                  desc: "Downloads the clean dataset formatted as a standard comma-separated CSV.",
                  example: `// GET /api/dataset/export?file_id=a9e8f4c2-0192-4d2a-88f5-4e892c90a1ff\n// Returns: customer_records_clean.csv (application/octet-stream)`
                },
                {
                  method: "GET",
                  path: "/api/dataset/export/pkl",
                  desc: "Downloads the clean dataset as a compressed Python Pickle object.",
                  example: `// GET /api/dataset/export/pkl?file_id=a9e8f4c2-0192-4d2a-88f5-4e892c90a1ff\n// Returns: customer_records_clean.pkl (application/octet-stream)`
                },
                {
                  method: "DELETE",
                  path: "/api/dataset/cleanup",
                  desc: "Deletes temporary Parquet and uploaded raw files from the server cache.",
                  example: `// DELETE /api/dataset/cleanup?file_id=8f2d9c4e-1284-4b53-90d1-0f727c62d0e8\n// Response\n{\n  "status": "success",\n  "message": "Temporary cache cleared"\n}`
                },
                {
                  method: "GET",
                  path: "/api/visualization",
                  desc: "Calculates stats, distribution histograms, and correlation coefficients.",
                  example: `// Request Params: ?file_id=a9e8f4c2-0192-4d2a-88f5-4e892c90a1ff\n// Response\n{\n  "histograms": { "age": [...] },\n  "boxplots": { "salary": [...] },\n  "correlation": [ [1.0, 0.25], [0.25, 1.0] ]\n}`
                }
              ].map((e) => (
                <AccordionItem key={e.path} title={e.path} badge={e.method} theme={theme}>
                  <p className="text-xs mb-3 text-zinc-400 dark:text-zinc-400 leading-relaxed">{e.desc}</p>
                  <CodeBlock>{e.example}</CodeBlock>
                </AccordionItem>
              ))}
            </div>
          </Section>

          <Section id="limits" title="Limits & Constraints" theme={theme}>
            <div className={`overflow-x-auto border rounded-lg transition-colors ${
              theme === "dark" ? "border-zinc-800 bg-zinc-950/10" : "border-zinc-200 bg-white"
            }`}>
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className={`text-left border-b transition-colors ${
                    theme === "dark" ? "bg-zinc-900/30 border-zinc-800 text-zinc-400" : "bg-zinc-50 border-zinc-200 text-zinc-600"
                  }`}>
                    <th className="px-4 py-2.5 font-semibold">Constraint</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/10 dark:divide-zinc-800">
                  {[
                    ["Max rows", "150,000"],
                    ["Supported formats", "CSV, XLSX, XLS, JSON"],
                    ["Max columns in histogram / boxplot", "6"],
                    ["Max columns in correlation heatmap", "10"],
                    ["Max categorical top values shown", "10"],
                    ["Operations per column in one pipeline", "1"],
                  ].map(([k, v]) => (
                    <tr key={k} className={`transition-colors ${
                      theme === "dark" ? "hover:bg-zinc-900/20 text-zinc-400" : "hover:bg-zinc-50/50 text-zinc-700"
                    }`}>
                      <td className="px-4 py-2.5 font-medium">{k}</td>
                      <td className={`px-4 py-2.5 font-mono text-right font-semibold ${
                        theme === "dark" ? "text-violet-400" : "text-indigo-600"
                      }`}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </main>

        {/* Right TOC */}
        <aside className="sticky top-16 h-[calc(100vh-4rem)] w-56 flex-shrink-0 overflow-y-auto py-8 px-5 hidden xl:block">
          <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-3 ${
            theme === "dark" ? "text-zinc-500" : "text-zinc-400"
          }`}>On this page</p>
          <nav className="space-y-1">
            {ON_THIS_PAGE.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`block w-full text-left text-xs transition-colors py-1 cursor-pointer ${
                  activeSection === item.id
                    ? theme === "dark"
                      ? "text-violet-400 font-medium"
                      : "text-indigo-600 font-medium"
                    : theme === "dark"
                      ? "text-zinc-500 hover:text-zinc-300"
                      : "text-zinc-400 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

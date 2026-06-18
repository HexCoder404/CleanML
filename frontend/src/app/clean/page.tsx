"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { usePipelineStore, CleanOperation } from "../../store/pipelineStore";
import { useToastStore, createToastHelpers } from "../../store/toastStore";
import ToastContainer from "../components/ToastContainer";
import AuthModal from "../components/AuthModal";
import Navbar from "../components/Navbar";
import CustomSelect from "../components/CustomSelect";

function CleanAppContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Simulated Auth & Demo Mode
  const [isDemo, setIsDemo] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [authReason, setAuthReason] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [prevProfile, setPrevProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [autoCleaning, setAutoCleaning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showApplied, setShowApplied] = useState(false);
  const [autoCleanOptions, setAutoCleanOptions] = useState({
    fillMissing: true,
    encodeCategories: true,
    scaleNumeric: true,
  });
  const [autoCleanResult, setAutoCleanResult] = useState<{
    scoreBefore: number; scoreAfter: number;
    missingBefore: number; missingAfter: number;
    dupsBefore: number; dupsAfter: number;
    rowsBefore: number; rowsAfter: number;
    opsApplied: number;
    appliedLabels: string[];
  } | null>(null);
  const toast = createToastHelpers();

  type HistoryStep = {
    fileId: string;
    profile: any;
    preview: any[];
    prevProfile: any;
  };
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const sessionFiles = useRef<Set<string>>(new Set());

  const { operations, hasSeenSuggestions, currentFileId, addOperation, removeOperation, clearOperations, markSuggestionsSeen, resetSuggestions, setCurrentFileId, addUploadedFileId, user, setUser, theme } = usePipelineStore();
  const [opType, setOpType] = useState<CleanOperation["type"]>("drop_duplicates");
  const [selectedCol, setSelectedCol] = useState<string>("");
  
  // Strategies
  const [imputeStrategy, setImputeStrategy] = useState<Exclude<CleanOperation["strategy"], undefined>>("mean");
  const [encodeStrategy, setEncodeStrategy] = useState<Exclude<CleanOperation["strategy"], undefined>>("label");
  const [scaleStrategy, setScaleStrategy] = useState<Exclude<CleanOperation["strategy"], undefined>>("standard");
  const [fillValue, setFillValue] = useState<string>("");

  const MAX_FILE_SIZE_MB = 50;
  const ALLOWED_EXT = [".csv", ".xls", ".xlsx", ".json"];

  // Authenticate user check on mount
  useEffect(() => {
    const demoParam = searchParams.get("demo") === "true";
    if (user) {
      setIsDemo(false);
    } else {
      setIsDemo(demoParam || true); // Default to demo mode if not logged in
    }
  }, [user, searchParams]);

  const handleAuthSuccess = () => {
    const storedUser = localStorage.getItem("cleanml_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsDemo(false);
      toast.success("Successfully authenticated! All RefineML features are now unlocked.");
      router.replace("/clean");
    }
  };

  const validateFile = (f: File): boolean => {
    const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "");
    if (!ALLOWED_EXT.includes(ext)) {
      toast.error(`Wrong format: "${f.name}". Please upload CSV, Excel, or JSON.`);
      return false;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large: ${(f.size / 1024 / 1024).toFixed(1)} MB. Max allowed is ${MAX_FILE_SIZE_MB} MB.`);
      return false;
    }
    return true;
  };



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      if (validateFile(f)) setFile(f);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0];
      if (validateFile(f)) setFile(f);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!validateFile(file)) return;
    setLoading(true);

    let sleepId: string | null = null;
    const sleepTimer = setTimeout(() => {
      sleepId = toast.loading("Backend is waking up — this may take a few seconds on first request…");
    }, 3000);

    const formData = new FormData();
    formData.append("file", file);

    try {
      sessionFiles.current.forEach(id => {
        fetch(`/api/dataset/cleanup?file_id=${id}`, { method: 'DELETE' }).catch(e => console.error(e));
      });
      sessionFiles.current.clear();
      setHistory([]);

      const uploadRes = await fetch(`/api/dataset/upload`, { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.message || `Upload failed (${uploadRes.status})`);
      }
      const uploadData = await uploadRes.json();
      setFileId(uploadData.file_id);
      setCurrentFileId(uploadData.file_id);
      sessionFiles.current.add(uploadData.file_id);
      addUploadedFileId(uploadData.file_id);

      const profileRes = await fetch(`/api/dataset/profile?file_id=${uploadData.file_id}`);
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      setProfile(await profileRes.json());
      setPrevProfile(null);

      const previewRes = await fetch(`/api/dataset/preview?file_id=${uploadData.file_id}&limit=10`);
      if (!previewRes.ok) throw new Error("Failed to fetch preview");
      setPreview(await previewRes.json());

      clearOperations();
      resetSuggestions();
      setAutoCleanResult(null);
      toast.success("Dataset uploaded and profiled successfully!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      clearTimeout(sleepTimer);
      if (sleepId) useToastStore.getState().removeToast(sleepId);
      setLoading(false);
    }
  };

  const handleAddOperation = () => {
    if ((opType === "impute" || opType === "drop_columns" || opType === "encode" || opType === "scale") && !selectedCol) return;
    if (opType === "impute" && imputeStrategy === "constant" && !fillValue) return;

    if (selectedCol && operations.some(op => op.columns?.includes(selectedCol))) {
      toast.error(`Operation already scheduled for "${selectedCol}". Only one operation per column per pipeline.`, 5000);
      return;
    }

    addOperation({
      type: opType,
      ...(selectedCol && opType !== "drop_duplicates" ? { columns: [selectedCol] } : {}),
      ...(opType === "impute" ? { strategy: imputeStrategy } : {}),
      ...(opType === "encode" ? { strategy: encodeStrategy } : {}),
      ...(opType === "scale" ? { strategy: scaleStrategy } : {}),
      ...(opType === "impute" && imputeStrategy === "constant" ? { fill_value: fillValue } : {})
    });
    
    if (opType === "drop_columns" || opType === "impute" || opType === "encode" || opType === "scale") setSelectedCol("");
  };

  const handleApplyPipeline = async () => {
    if (!fileId || operations.length === 0) return;
    setCleaning(true);

    let sleepId: string | null = null;
    const sleepTimer = setTimeout(() => {
      sleepId = toast.loading("Processing pipeline — backend is working on it…");
    }, 3000);

    try {
      const cleanRes = await fetch(`/api/dataset/clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId, operations }),
      });
      if (!cleanRes.ok) {
        const errData = await cleanRes.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to clean dataset");
      }
      const cleanData = await cleanRes.json();

      if (fileId && profile && preview) {
        setHistory(prev => [...prev, { fileId, profile, preview, prevProfile }]);
      }
      setFileId(cleanData.file_id);
      setCurrentFileId(cleanData.file_id);
      sessionFiles.current.add(cleanData.file_id);
      addUploadedFileId(cleanData.file_id);
      clearOperations();

      const profileRes = await fetch(`/api/dataset/profile?file_id=${cleanData.file_id}`);
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      setPrevProfile(profile);
      setProfile(await profileRes.json());

      const previewRes = await fetch(`/api/dataset/preview?file_id=${cleanData.file_id}&limit=10`);
      if (!previewRes.ok) throw new Error("Failed to fetch preview");
      setPreview(await previewRes.json());

      toast.success("Pipeline applied! Dataset cleaned successfully.");
    } catch (err: any) {
      toast.error(err.message || "Pipeline failed. Please try again.");
    } finally {
      clearTimeout(sleepTimer);
      if (sleepId) useToastStore.getState().removeToast(sleepId);
      setCleaning(false);
    }
  };

  const handleRevert = () => {
    if (history.length === 0) return;
    const lastStep = history[history.length - 1];
    setFileId(lastStep.fileId);
    setProfile(lastStep.profile);
    setPreview(lastStep.preview);
    setPrevProfile(lastStep.prevProfile);
    setHistory(prev => prev.slice(0, -1));
    resetSuggestions();
    setAutoCleanResult(null);
    toast.success("Reverted to previous step.");
  };

  const handleAutoClean = async () => {
    if (!fileId || !profile) return;
    const allSugg = getSmartSuggestions().filter(s => !s.infoOnly);
    const suggestions = allSugg.filter(s => {
      if (s.type === 'impute' && !autoCleanOptions.fillMissing) return false;
      if (s.type === 'encode' && !autoCleanOptions.encodeCategories) return false;
      if (s.type === 'scale' && !autoCleanOptions.scaleNumeric) return false;
      return true;
    });
    if (suggestions.length === 0) {
      toast.error("No operations match your selected options.");
      return;
    }

    setAutoCleaning(true);
    const scoreBefore = calculateQualityScore(profile, Object.values(profile.columns).reduce((a: number, c: any) => a + c.null_count, 0) as number);
    const missingBefore = Object.values(profile.columns).reduce((a: number, c: any) => a + c.null_count, 0) as number;
    const dupsBefore = profile.duplicate_count as number;
    const rowsBefore = profile.row_count as number;

    const buildLabel = (s: any): string => {
      const col = s.columns?.[0];
      if (s.type === 'impute') {
        const strat = s.strategy === 'median' ? 'median' : s.strategy === 'mean' ? 'mean' : s.strategy === 'mode' ? 'mode' : s.strategy;
        return `Filled "${col}" with ${strat}`;
      }
      if (s.type === 'encode') return `Encoded "${col}" (${s.strategy === 'onehot' ? 'one-hot' : 'label'})`;
      if (s.type === 'scale') return `Scaled "${col}" (${s.strategy === 'minmax' ? 'min-max' : 'standard'})`;
      if (s.type === 'drop_duplicates') return 'Removed duplicate rows';
      if (s.type === 'drop_columns') return `Dropped column "${col}"`;
      return s.type;
    };
    const appliedLabels = suggestions.map(buildLabel);

    try {
      const ops = suggestions.map(({ explanation, why, category, infoOnly, ...op }: any) => ({
        id: Math.random().toString(36).slice(2),
        ...op,
      }));
      const cleanRes = await fetch(`/api/dataset/clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId, operations: ops }),
      });
      if (!cleanRes.ok) {
        const errData = await cleanRes.json().catch(() => ({}));
        throw new Error(errData.message || "Auto clean failed");
      }
      const cleanData = await cleanRes.json();

      if (fileId && profile && preview) {
        setHistory(prev => [...prev, { fileId, profile, preview, prevProfile }]);
      }
      setFileId(cleanData.file_id);
      setCurrentFileId(cleanData.file_id);
      sessionFiles.current.add(cleanData.file_id);
      addUploadedFileId(cleanData.file_id);
      clearOperations();
      markSuggestionsSeen();

      const profileRes = await fetch(`/api/dataset/profile?file_id=${cleanData.file_id}`);
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      const newProfile = await profileRes.json();
      setPrevProfile(profile);
      setProfile(newProfile);

      const previewRes = await fetch(`/api/dataset/preview?file_id=${cleanData.file_id}&limit=10`);
      if (!previewRes.ok) throw new Error("Failed to fetch preview");
      setPreview(await previewRes.json());

      const missingAfter = Object.values(newProfile.columns).reduce((a: number, c: any) => a + c.null_count, 0) as number;
      const scoreAfter = calculateQualityScore(newProfile, missingAfter);
      setShowApplied(false);
      setAutoCleanResult({
        scoreBefore, scoreAfter,
        missingBefore, missingAfter,
        dupsBefore, dupsAfter: newProfile.duplicate_count,
        rowsBefore, rowsAfter: newProfile.row_count,
        opsApplied: ops.length,
        appliedLabels,
      });
      toast.success(`Auto Clean applied ${ops.length} operations!`);
    } catch (err: any) {
      toast.error(err.message || "Auto clean failed. Please try again.");
    } finally {
      setAutoCleaning(false);
    }
  };

  const handleExport = async (format: "csv" | "pkl" = "csv") => {
    if (!fileId) return;
    const encodedId = encodeURIComponent(fileId);
    const url = format === "pkl"
      ? `/api/dataset/export/pkl?file_id=${encodedId}`
      : `/api/dataset/export?file_id=${encodedId}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const nameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const filename = nameMatch ? nameMatch[1].replace(/['"]/g, "") : `export.${format}`;

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

      toast.success(`${format.toUpperCase()} download started!`);
    } catch (err: any) {
      toast.error(err.message || "Export failed. Please try again.");
    }
  };

  const totalMissing = profile ? Object.values(profile.columns).reduce((acc: number, col: any) => acc + col.null_count, 0) : 0;
  const prevTotalMissing = prevProfile ? Object.values(prevProfile.columns).reduce((acc: number, col: any) => acc + col.null_count, 0) : 0;
  
  const calculateQualityScore = (p: any, missing: number) => {
    if (!p || p.row_count === 0) return 0;
    const totalCells = p.row_count * p.column_count;
    const missingPenalty = Math.min((missing / totalCells) * 100 * 2, 40);
    const duplicatePenalty = Math.min((p.duplicate_count / p.row_count) * 100 * 2, 40);
    return Math.max(0, Math.round(100 - missingPenalty - duplicatePenalty));
  };

  const qualityScore = calculateQualityScore(profile, totalMissing);
  const prevQualityScore = prevProfile ? calculateQualityScore(prevProfile, prevTotalMissing) : null;
  const currentStep = !profile ? 1 : !prevProfile ? 2 : operations.length > 0 ? 3 : 4;
  const isNumericCol = selectedCol && profile?.columns[selectedCol]?.dtype.match(/(int|float|numeric)/i);

  type SuggestionCategory = 'Cleaning' | 'Engineering' | 'Info';
  type Suggestion = Omit<CleanOperation, "id"> & {
    explanation: string;
    why: string;
    category: SuggestionCategory;
    infoOnly?: boolean;
  };

  const getSmartSuggestions = (): Suggestion[] => {
    if (!profile) return [];
    const suggestions: Suggestion[] = [];
    const idPatterns = ["id", "index", "uuid", "key", "_id"];
    const skipEncodePatterns = ["title", "description", "text", "comment", "content", "url", "link", "address", "name"];
    const HIGH_CARDINALITY = 15;
    const totalRows = profile.row_count || 1;
    const sortedCols = Object.keys(profile.columns).sort(
      (a, b) => profile.columns[b].null_count - profile.columns[a].null_count
    );

    sortedCols.forEach((colName) => {
      const lowerCol = colName.toLowerCase();
      if (idPatterns.some((p) => lowerCol.includes(p))) return;
      const colInfo = profile.columns[colName];
      if (colInfo.null_count === 0) return;
      if (suggestions.filter(s => s.type === 'impute').length >= 5) return;
      const isNum = !!colInfo.dtype.match(/(int|float|numeric)/i);
      const missingPct = ((colInfo.null_count / totalRows) * 100).toFixed(1);
      const strategy: any = isNum ? 'median' : 'mode';
      suggestions.push({
        type: 'impute', columns: [colName], strategy,
        explanation: `${colInfo.null_count} missing values (${missingPct}% of rows)`,
        why: isNum
          ? `Median is resistant to outliers, so extreme values won't skew the fill-in.`
          : `Mode fills with the most common real value, preserving the natural distribution.`,
        category: 'Cleaning',
      });
    });

    let encodeCount = 0;
    Object.keys(profile.columns).forEach((colName) => {
      const lowerCol = colName.toLowerCase();
      if (idPatterns.some((p) => lowerCol.includes(p))) return;
      if (skipEncodePatterns.some((p) => lowerCol.includes(p))) return;
      if (encodeCount >= 2) return;
      const colInfo = profile.columns[colName];
      const isNum = !!colInfo.dtype.match(/(int|float|numeric)/i);
      if (isNum || colInfo.is_datetime_like) return;
      const uniqueCount = colInfo.unique_count || 0;
      const cardinalityRatio = colInfo.cardinality_ratio || 0;
      if (uniqueCount < 2 || uniqueCount > HIGH_CARDINALITY || cardinalityRatio > 0.5) return;
      suggestions.push({
        type: 'encode', columns: [colName], strategy: 'label' as any,
        explanation: `${uniqueCount} unique categories (${(cardinalityRatio * 100).toFixed(1)}% cardinality)`,
        why: uniqueCount === 2
          ? `Binary column — label encoding converts to 0/1, exactly what classifiers expect.`
          : `Only ${uniqueCount} unique values. Label encoding is safe and avoids dimension explosion.`,
        category: 'Engineering',
      });
      encodeCount++;
    });

    let scaleCount = 0;
    Object.keys(profile.columns).forEach((colName) => {
      const lowerCol = colName.toLowerCase();
      if (idPatterns.some((p) => lowerCol.includes(p))) return;
      if (scaleCount >= 2) return;
      const colInfo = profile.columns[colName];
      if (!colInfo.dtype.match(/(int|float|numeric)/i)) return;
      suggestions.push({
        type: 'scale', columns: [colName], strategy: 'standard' as any,
        explanation: `Range: ${colInfo.min?.toFixed(2)} to ${colInfo.max?.toFixed(2)}`,
        why: `Standardization ensures this column's scale does not dominate model coefficients or distance metrics.`,
        category: 'Engineering',
      });
      scaleCount++;
    });

    Object.keys(profile.columns).forEach((colName) => {
      const lowerCol = colName.toLowerCase();
      if (idPatterns.some((p) => lowerCol.includes(p))) return;
      const colInfo = profile.columns[colName];
      if (!colInfo.dtype.match(/(int|float|numeric)/i)) return;
      if (colInfo.skewness === null || colInfo.skewness === undefined) return;
      if (Math.abs(colInfo.skewness) < 1.5) return;
      suggestions.push({
        type: 'scale' as any, columns: [colName],
        explanation: `Skewness: ${colInfo.skewness > 0 ? '+' : ''}${colInfo.skewness?.toFixed(2)}`,
        why: `Values are heavily skewed (|skew| > 1.5). A log transform compresses the long tail. Apply manually:\ndf['${colName}'] = np.log1p(df['${colName}'])`,
        category: 'Info', infoOnly: true,
      });
    });

    Object.keys(profile.columns).forEach((colName) => {
      const colInfo = profile.columns[colName];
      if (!colInfo.is_datetime_like) return;
      suggestions.push({
        type: 'drop_columns' as any, columns: [colName],
        explanation: `Detected as a date/time column`,
        why: `Raw date strings are meaningless to ML. Extract components instead:\ndf['${colName}_year'] = pd.to_datetime(df['${colName}']).dt.year\ndf['${colName}_month'] = pd.to_datetime(df['${colName}']).dt.month`,
        category: 'Info', infoOnly: true,
      });
    });

    return suggestions;
  };

  const allSuggestions = profile ? getSmartSuggestions() : [];
  const actionableSuggestions = allSuggestions
    .filter(s => !s.infoOnly)
    .filter(s => !operations.some(op => op.columns?.includes(s.columns?.[0] || '')));
  const infoSuggestions = allSuggestions.filter(s => s.infoOnly);
  const smartSuggestions = actionableSuggestions;
  const cleaningSuggestions = smartSuggestions.filter(s => s.category === 'Cleaning');
  const engineeringSuggestions = smartSuggestions.filter(s => s.category === 'Engineering');
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen font-sans transition-colors duration-250 ${
      isDark ? "bg-zinc-950 text-zinc-300" : "bg-gray-50 text-gray-900"
    }`}>
      <ToastContainer />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

      {/* Navbar */}
      <Navbar activeTab="clean" />

      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8 relative">

          {/* Demo Mode Banner */}
          {isDemo && (
            <div className={`px-6 py-4 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300 border ${
              isDark
                ? "bg-gradient-to-r from-violet-950/30 to-indigo-950/30 border-violet-900/40 text-violet-300"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent"
            }`}>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-semibold">
                  You are previewing RefineML in <strong>Demo Mode</strong>. Create a free account to unlock Auto Clean, suggestions, and download files.
                </span>
              </div>
              <button
                onClick={() => {
                  setAuthReason("Unlock Auto Clean, suggestions, and exports by signing up.");
                  setAuthMode("signup");
                  setIsAuthOpen(true);
                }}
                className={`px-5 py-2 font-bold text-xs rounded-xl shadow transition-all shrink-0 hover:scale-105 cursor-pointer ${
                  isDark ? "bg-zinc-900 border border-zinc-800 text-violet-400 hover:bg-zinc-800" : "bg-white text-violet-700 hover:bg-violet-50"
                }`}
              >
                Sign Up Free
              </button>
            </div>
          )}

          <header className="text-center space-y-4 pt-4">
            <h1 className={`text-4xl font-extrabold tracking-tight ${
              isDark ? "text-white" : "text-gray-900"
            }`}>Get your dataset ML-ready</h1>
            <p className={`text-lg ${isDark ? "text-neutral-500" : "text-gray-500"}`}>Upload your dataset to profile, clean, and export without writing code.</p>
          </header>

          {/* Step Progress Bar */}
          <div className="flex items-center justify-center gap-0">
            {([{n: 1, label: 'Upload'}, {n: 2, label: 'Review'}, {n: 3, label: 'Clean'}, {n: 4, label: 'Export'}] as const).map(({n, label}, i) => {
              const done = currentStep > n;
              const active = currentStep === n;
              return (
                <React.Fragment key={n}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-all ${
                      done
                        ? isDark
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                          : 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200' 
                        : active
                        ? isDark
                          ? 'bg-violet-600 border-violet-600 text-white shadow-md ring-4 ring-violet-900/50'
                          : 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-100' 
                        : isDark
                        ? 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}>
                      {done ? '✓' : n}
                    </div>
                    <span className={`mt-1.5 text-xs font-semibold ${
                      done ? 'text-emerald-600' : active ? 'text-indigo-600' : 'text-neutral-500'
                    }`}>{label}</span>
                  </div>
                  {i < 3 && (
                    <div className={`flex-1 h-0.5 min-w-[40px] max-w-[80px] mx-1 mt-[-20px] transition-all ${
                      currentStep > n + 1
                        ? 'bg-emerald-505'
                        : currentStep === n + 1
                          ? isDark ? 'bg-violet-500' : 'bg-indigo-300'
                          : isDark ? 'bg-neutral-900' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

        {/* Upload Section */}
        <section className={`p-8 rounded-2xl border flex flex-col items-center space-y-6 transition-colors ${
          isDark ? "bg-[#131316] border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]" : "bg-white border-gray-100 shadow-sm"
        }`}>
          <div className="flex items-center justify-center w-full max-w-xl">
            <label 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                isDragging 
                  ? isDark
                    ? "border-violet-500 bg-violet-900/20 ring-4 ring-violet-900/10"
                    : "border-indigo-500 bg-indigo-100 ring-4 ring-indigo-50" 
                  : isDark
                    ? "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80"
                    : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className={`w-10 h-10 mb-4 ${isDragging ? "text-indigo-600 animate-bounce" : "text-indigo-400"}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                </svg>
                <p className="mb-2 text-sm text-zinc-400"><span className={`font-semibold ${isDark ? "text-violet-400" : "text-indigo-600"}`}>Click to upload</span> or drag and drop</p>
                <p className="text-xs text-zinc-500">CSV, Excel, or JSON (MAX. 150k rows)</p>
              </div>
              <input type="file" className="hidden" accept=".csv,.xls,.xlsx,.json" onChange={handleFileChange} />
            </label>
          </div>
          
          {file && (
            <div className={`text-sm font-medium px-4 py-2 rounded-lg border ${
              isDark ? "bg-zinc-900 text-zinc-300 border-zinc-800" : "bg-gray-100 text-gray-700 border-gray-200"
            }`}>
              Selected: {file.name}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`px-8 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition-all shadow-md hover:shadow-lg min-w-[200px] flex justify-center cursor-pointer ${
              isDark ? "bg-violet-600 hover:bg-violet-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Uploading...</span>
              </span>
            ) : (
              "Generate Profile"
            )}
          </button>
        </section>

        {/* Profile & Preview Section */}
        {profile && (
          <div className="space-y-8 animate-in fade-in duration-505">
            {/* Stats Cards */}
            <section className="grid grid-cols-1 md:grid-cols-5 gap-6">

              {/* Quality Score Card */}
              <div className={`p-6 rounded-xl border relative overflow-hidden col-span-1 md:col-span-2 md:row-span-2 flex flex-col justify-center transition-all ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 bg-gradient-to-br from-zinc-950/20 to-zinc-900/10 shadow-md shadow-black/30"
                  : "bg-white border-emerald-100 bg-gradient-to-br from-white to-emerald-50"
              }`}>
                 <div className="absolute right-0 top-0 h-full w-2 bg-emerald-500"></div>
                 <h3 className={`text-sm font-bold uppercase tracking-wide mb-1 flex items-center space-x-2 ${
                   isDark ? "text-emerald-400" : "text-emerald-800"
                 }`}>
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
                    <span>Dataset Quality Score</span>
                 </h3>
                 <div className="flex items-end space-x-4 mt-2">
                    <p className={`text-6xl font-black ${qualityScore >= 80 ? 'text-emerald-600' : qualityScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {qualityScore}
                    </p>
                    <p className="text-zinc-500 font-semibold mb-2">/ 100</p>
                 </div>
                 {prevQualityScore !== null && prevQualityScore !== qualityScore && (
                    <div className={`mt-4 inline-flex items-center space-x-1.5 text-sm font-medium px-3 py-1 rounded-full w-fit ${
                      isDark ? "bg-emerald-950/20 border border-emerald-900/30 text-emerald-400" : "bg-emerald-100/50 text-emerald-700"
                    }`}>
                       <span>Score improved from {prevQualityScore}</span>
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                    </div>
                 )}
                 <p className={`text-xs mt-4 leading-relaxed ${isDark ? "text-zinc-500" : "text-gray-500"}`}>
                   Based on missing values ({totalMissing}), duplicates ({profile.duplicate_count}), and data health.
                 </p>
              </div>

              {/* Standard Cards */}
              <div className={`p-6 rounded-xl border relative overflow-hidden transition-all ${
                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300 shadow-md shadow-black/20" : "bg-white border-zinc-200"
              }`}>
                <div className="absolute right-0 top-0 h-full w-2 bg-indigo-500"></div>
                <h3 className={isDark ? "text-zinc-500 text-sm font-medium" : "text-gray-500 text-sm font-medium"}>Total Rows</h3>
                <p className={`text-3xl font-bold mt-2 ${isDark ? "text-zinc-100" : "text-gray-900"}`}>
                  {prevProfile && prevProfile.row_count !== profile.row_count && (
                    <span className="text-zinc-500 line-through text-xl mr-2">{prevProfile.row_count.toLocaleString()}</span>
                  )}
                  {profile.row_count.toLocaleString()}
                </p>
              </div>
              <div className={`p-6 rounded-xl border relative overflow-hidden transition-all ${
                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300 shadow-md shadow-black/20" : "bg-white border-zinc-200"
              }`}>
                <div className="absolute right-0 top-0 h-full w-2 bg-blue-500"></div>
                <h3 className={isDark ? "text-zinc-500 text-sm font-medium" : "text-gray-500 text-sm font-medium"}>Total Columns</h3>
                <p className={`text-3xl font-bold mt-2 ${isDark ? "text-zinc-100" : "text-gray-900"}`}>
                  {prevProfile && prevProfile.column_count !== profile.column_count && (
                    <span className="text-zinc-500 line-through text-xl mr-2">{prevProfile.column_count.toLocaleString()}</span>
                  )}
                  {profile.column_count.toLocaleString()}
                </p>
              </div>
              <div className={`p-6 rounded-xl border relative overflow-hidden transition-all ${
                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300 shadow-md shadow-black/20" : "bg-white border-zinc-200"
              }`}>
                <div className="absolute right-0 top-0 h-full w-2 bg-amber-500"></div>
                <h3 className={isDark ? "text-zinc-500 text-sm font-medium" : "text-gray-500 text-sm font-medium"}>Duplicate Rows</h3>
                <p className={`text-3xl font-bold mt-2 ${isDark ? "text-zinc-100" : "text-gray-900"}`}>
                  {prevProfile && prevProfile.duplicate_count !== profile.duplicate_count && (
                    <span className="text-zinc-500 line-through text-xl mr-2">{prevProfile.duplicate_count.toLocaleString()}</span>
                  )}
                  {profile.duplicate_count.toLocaleString()}
                </p>
              </div>
              <div className={`p-6 rounded-xl border relative overflow-hidden transition-all ${
                isDark ? "bg-zinc-900 border-zinc-800 shadow-md shadow-black/20" : "bg-white border-red-50 bg-gradient-to-br from-white to-red-50"
              }`}>
                <div className="absolute right-0 top-0 h-full w-2 bg-red-400"></div>
                <h3 className={isDark ? "text-zinc-500 text-sm font-medium" : "text-gray-500 text-sm font-medium"}>Missing Values</h3>
                <p className="text-3xl font-bold text-red-500 mt-2">
                   {prevProfile && prevTotalMissing !== totalMissing && (
                    <span className="text-red-300 line-through text-xl mr-2">{prevTotalMissing.toLocaleString()}</span>
                  )}
                  {totalMissing.toLocaleString()}
                </p>
              </div>
            </section>

            {/* Preview Table */}
            <section className={`rounded-xl border overflow-hidden transition-colors ${
              isDark ? "bg-zinc-900 border-zinc-800 shadow-lg" : "bg-white border-zinc-200 shadow-sm"
            }`}>
              <div className={`px-6 py-4 border-b transition-colors ${
                isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"
              }`}>
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Dataset Preview (First 10 Rows)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className={`text-xs uppercase transition-colors ${
                    isDark ? "bg-zinc-950/40 text-zinc-400" : "bg-gray-50 text-gray-700"
                  }`}>
                    <tr>
                      {Object.keys(profile.columns).map((colName) => (
                        <th key={colName} className="px-6 py-3 font-medium whitespace-nowrap">
                          {colName}
                          <span className="block text-[10px] text-zinc-500 normal-case mt-1">{profile.columns[colName].dtype}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors ${
                    isDark ? "divide-zinc-800" : "divide-gray-100"
                  }`}>
                    {preview.map((row, idx) => (
                      <tr key={idx} className={`transition-colors ${
                        isDark ? "hover:bg-zinc-950/40 text-zinc-300" : "hover:bg-gray-50 text-gray-600"
                      }`}>
                        {Object.keys(profile.columns).map((colName) => (
                          <td key={`${idx}-${colName}`} className={`px-6 py-4 whitespace-nowrap border-r last:border-0 truncate max-w-[200px] ${
                            isDark ? "border-zinc-800/40" : "border-gray-100"
                          }`}>
                            {row[colName] !== null && row[colName] !== "" ? String(row[colName]) : (
                              <span className={`px-2 py-0.5 rounded text-xs italic ${
                                isDark ? "bg-rose-950/20 border border-rose-900/30 text-rose-400" : "bg-red-50 text-red-500"
                              }`}>null</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Auto Clean banner */}
            {!autoCleanResult && actionableSuggestions.length > 0 && (
              <section className={`rounded-2xl shadow-lg p-6 space-y-4 border transition-colors ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 text-zinc-300 shadow-lg shadow-black/20"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent"
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span>Auto Clean</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isDark ? "bg-zinc-950 border border-zinc-800 text-violet-400" : "bg-white/20 text-white"
                      }`}>
                        {[
                          autoCleanOptions.fillMissing ? actionableSuggestions.filter(s => s.type === 'impute').length : 0,
                          autoCleanOptions.encodeCategories ? actionableSuggestions.filter(s => s.type === 'encode').length : 0,
                          autoCleanOptions.scaleNumeric ? actionableSuggestions.filter(s => s.type === 'scale').length : 0,
                        ].reduce((a, b) => a + b, 0)} fixes ready
                      </span>
                    </h2>
                    <p className={`text-sm ${isDark ? "text-zinc-500" : "text-violet-100"}`}>
                      Automatically selects and schedules the best cleaning steps.
                    </p>
                  </div>
                  <button
                    id="auto-clean-btn"
                    onClick={() => {
                      if (isDemo) {
                        setAuthReason("Auto Clean is only available for registered users.");
                        setAuthMode("signup");
                        setIsAuthOpen(true);
                        return;
                      }
                      handleAutoClean();
                    }}
                    disabled={autoCleaning}
                    className={`shrink-0 flex items-center gap-2 px-6 py-3 font-bold rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 min-w-[160px] justify-center cursor-pointer ${
                      isDark
                        ? "bg-violet-600 hover:bg-violet-700 text-white"
                        : "bg-white text-violet-700 hover:bg-violet-50"
                    }`}
                  >
                    {autoCleaning ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                        <span>Cleaning…</span>
                      </>
                    ) : (
                      <>
                        {isDemo && (
                          <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                        <span>Auto Clean Now</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {([
                    { key: 'fillMissing', label: 'Fill Missing Values' },
                    { key: 'encodeCategories', label: 'Encode Categories' },
                    { key: 'scaleNumeric', label: 'Scale Numeric' },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setAutoCleanOptions(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        autoCleanOptions[key]
                          ? isDark
                            ? 'bg-violet-900/45 border-violet-900 text-violet-400'
                            : 'bg-white/20 border-white/40 text-white'
                          : isDark
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-500 line-through opacity-60'
                            : 'bg-white/5 border-white/15 text-violet-200 line-through opacity-60'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] shrink-0 ${
                        autoCleanOptions[key]
                          ? isDark ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white text-violet-700 border-white'
                          : 'border-violet-300'
                      }`}>
                        {autoCleanOptions[key] && '✓'}
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {/* Auto Clean Improvement Card */}
            {autoCleanResult && (
              <section className={`rounded-2xl overflow-hidden shadow-lg border transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                isDark ? "bg-zinc-900 border-zinc-800 shadow-lg" : "bg-gradient-to-br from-emerald-50 to-white border-emerald-200"
              }`}>
                <div className={`px-6 py-4 flex items-center justify-between ${
                  isDark ? "bg-emerald-950/60 border-b border-emerald-900" : "bg-emerald-600"
                }`}>
                  <div className="flex items-center gap-3 text-white">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border text-white ${isDark ? "bg-emerald-900/20 border-emerald-800" : "bg-white/20 border-transparent"}`}>
                      <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-white">Auto Clean Complete</h2>
                      <button
                        onClick={() => setShowApplied(v => !v)}
                        className={`text-sm flex items-center gap-1 transition-colors cursor-pointer ${
                          isDark ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-100 hover:text-white"
                        }`}
                      >
                        {autoCleanResult.opsApplied} operations applied
                        <svg className={`w-3.5 h-3.5 transition-transform ${showApplied ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setAutoCleanResult(null)} className="text-white/60 hover:text-white transition-colors p-1 cursor-pointer" title="Dismiss">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {showApplied && (
                  <div className={`px-6 py-4 border-b ${isDark ? "border-zinc-800 bg-zinc-950/10" : "border-emerald-100 bg-emerald-50/60"}`}>
                    <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDark ? "text-emerald-400" : "text-emerald-800"}`}>Applied:</p>
                    <ul className="space-y-1.5">
                      {autoCleanResult.appliedLabels.map((label, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                          <span className={isDark ? "text-zinc-300" : "text-emerald-900"}>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`rounded-xl p-4 border shadow-sm text-center transition-colors ${
                    isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-white border-emerald-100"
                  }`}>
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-2">Quality Score</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-neutral-500 line-through">{autoCleanResult.scoreBefore}</span>
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      <span className="text-3xl font-black text-emerald-600">{autoCleanResult.scoreAfter}</span>
                    </div>
                    <span className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${autoCleanResult.scoreAfter > autoCleanResult.scoreBefore ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/40' : 'bg-zinc-950 text-zinc-500'}`}>
                      {autoCleanResult.scoreAfter > autoCleanResult.scoreBefore ? `+${autoCleanResult.scoreAfter - autoCleanResult.scoreBefore} pts` : 'No change'}
                    </span>
                  </div>
                  <div className={`rounded-xl p-4 border shadow-sm text-center transition-colors ${
                    isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-white border-emerald-100"
                  }`}>
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-2">Missing Values</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-red-300 line-through">{autoCleanResult.missingBefore.toLocaleString()}</span>
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      <span className="text-3xl font-black text-emerald-600">{autoCleanResult.missingAfter.toLocaleString()}</span>
                    </div>
                    <span className="mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-950/35 text-emerald-400 border border-emerald-900/40">
                      −{(autoCleanResult.missingBefore - autoCleanResult.missingAfter).toLocaleString()} fixed
                    </span>
                  </div>
                  <div className={`rounded-xl p-4 border shadow-sm text-center transition-colors ${
                    isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-white border-emerald-100"
                  }`}>
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-2">Duplicates</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-amber-300 line-through">{autoCleanResult.dupsBefore.toLocaleString()}</span>
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      <span className="text-3xl font-black text-emerald-600">{autoCleanResult.dupsAfter.toLocaleString()}</span>
                    </div>
                    <span className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${autoCleanResult.dupsBefore > autoCleanResult.dupsAfter ? 'bg-emerald-950/35 text-emerald-400 border border-emerald-900/40' : 'bg-zinc-950 text-zinc-500'}`}>
                      {autoCleanResult.dupsBefore > autoCleanResult.dupsAfter ? `−${(autoCleanResult.dupsBefore - autoCleanResult.dupsAfter).toLocaleString()} removed` : 'None removed'}
                    </span>
                  </div>
                  <div className={`rounded-xl p-4 border shadow-sm text-center transition-colors ${
                    isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-white border-emerald-100"
                  }`}>
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-2">Rows</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-neutral-500 line-through">{autoCleanResult.rowsBefore.toLocaleString()}</span>
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      <span className={`text-3xl font-black ${isDark ? "text-neutral-100" : "text-gray-800"}`}>{autoCleanResult.rowsAfter.toLocaleString()}</span>
                    </div>
                    <span className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${autoCleanResult.rowsBefore !== autoCleanResult.rowsAfter ? 'bg-amber-950/35 text-amber-400 border border-amber-900/40' : 'bg-gray-100 text-gray-500'}`}>
                      {autoCleanResult.rowsBefore !== autoCleanResult.rowsAfter ? `−${(autoCleanResult.rowsBefore - autoCleanResult.rowsAfter).toLocaleString()} dropped` : 'All preserved'}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Smart Suggestions */}
            {(smartSuggestions.length > 0 || infoSuggestions.length > 0) && !hasSeenSuggestions && (
              <section className={`rounded-xl border overflow-hidden mt-8 transition-colors ${
                isDark ? "bg-zinc-900 border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]" : "bg-gradient-to-r from-indigo-50 to-white border-indigo-100 shadow-sm"
              }`}>
                <div className={`px-6 py-4 border-b ${isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-indigo-50/80"}`}>
                  <h2 className={`text-lg font-semibold ${isDark ? "text-neutral-100" : "text-indigo-900"}`}>Smart Preprocessing Suggestions</h2>
                  <p className={`text-sm mt-1 ${isDark ? "text-zinc-400" : "text-indigo-700"}`}>We analyzed your dataset and recommend these changes to get it ML-ready.</p>
                </div>
                <div className="p-6 space-y-8">

                  {/* Cleaning Suggestions */}
                  {cleaningSuggestions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                        <span>Data Cleaning</span><div className={`h-px flex-1 ${isDark ? "bg-zinc-800" : "bg-gray-200"}`} />
                      </h3>
                      {cleaningSuggestions.map((sugg, idx) => (
                        <div key={`clean-${idx}`} className={`flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-lg border shadow-sm gap-4 transition-colors ${
                          isDark ? "bg-zinc-950/20 border-zinc-800" : "bg-white border-indigo-50"
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-amber-400" />
                            <div>
                              <p className={`text-sm font-bold mb-0.5 ${isDark ? "text-zinc-200" : "text-gray-900"}`}>
                                Impute &ldquo;{sugg.columns?.[0]}&rdquo; &rarr; {sugg.strategy === 'median' ? 'Median' : 'Mode'}
                              </p>
                              <p className={`text-xs ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{sugg.explanation}</p>
                              <p className="text-xs text-indigo-500 mt-1 italic font-medium">Why: {sugg.why}</p>
                            </div>
                          </div>
                          <button onClick={() => {
                            if (isDemo) {
                              setAuthReason("Applying smart suggestions automatically is only available for registered users.");
                              setAuthMode("signup");
                              setIsAuthOpen(true);
                              return;
                            }
                            const { explanation, why, category, infoOnly, ...op } = sugg as any;
                            addOperation(op);
                          }}
                            className={`shrink-0 py-1.5 px-4 text-xs font-bold rounded-md border transition-all flex items-center gap-1 cursor-pointer ${
                              isDark
                                ? "bg-violet-950/30 border-violet-900/60 text-violet-400 hover:bg-violet-900/40 hover:text-white"
                                : "bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border-indigo-200"
                            }`}>
                            {isDemo && (
                              <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                            Add to Pipeline
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Engineering Suggestions */}
                  {engineeringSuggestions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                        <span>Feature Engineering</span><div className={`h-px flex-1 ${isDark ? "bg-zinc-800" : "bg-gray-200"}`} />
                      </h3>
                      {engineeringSuggestions.map((sugg, idx) => (
                        <div key={`eng-${idx}`} className={`flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-lg border shadow-sm gap-4 transition-colors ${
                          isDark ? "bg-zinc-950/20 border-zinc-800" : "bg-white border-indigo-50"
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-blue-400" />
                            <div>
                              <p className={`text-sm font-bold mb-0.5 ${isDark ? "text-zinc-200" : "text-gray-900"}`}>
                                {sugg.type === 'encode' && `Encode "${sugg.columns?.[0]}"`}
                                {sugg.type === 'scale'  && `Scale "${sugg.columns?.[0]}"`}
                              </p>
                              <p className={`text-xs ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{sugg.explanation}</p>
                              <p className="text-xs text-indigo-500 mt-1 italic font-medium">Why: {sugg.why}</p>
                            </div>
                          </div>
                          <button onClick={() => {
                            if (isDemo) {
                              setAuthReason("Applying smart suggestions automatically is only available for registered users.");
                              setAuthMode("signup");
                              setIsAuthOpen(true);
                              return;
                            }
                            const { explanation, why, category, infoOnly, ...op } = sugg as any;
                            addOperation(op);
                          }}
                            className={`shrink-0 py-1.5 px-4 text-xs font-bold rounded-md border transition-all flex items-center gap-1 cursor-pointer ${
                              isDark
                                ? "bg-violet-950/30 border-violet-900/60 text-violet-400 hover:bg-violet-900/40 hover:text-white"
                                : "bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border-indigo-200"
                            }`}>
                            {isDemo && (
                              <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                            Add to Pipeline
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Info-only Suggestions */}
                  {infoSuggestions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
                        <span>Data Insights</span><div className={`h-px flex-1 ${isDark ? "bg-zinc-800" : "bg-gray-200"}`} />
                        <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${isDark ? "bg-teal-950/40 border border-teal-900/40 text-teal-400" : "bg-teal-100 text-teal-700"}`}>Info only</span>
                      </h3>
                      {infoSuggestions.map((sugg, idx) => (
                        <div key={`info-${idx}`} className={`border rounded-lg p-4 flex items-start gap-3 transition-colors ${
                          isDark ? "bg-teal-950/10 border-teal-900/40 text-zinc-300" : "bg-teal-50 border-teal-200"
                        }`}>
                          <span className="text-teal-500 text-lg shrink-0 mt-0.5">
                            {sugg.why?.includes('skew') ? (
                              <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </span>
                          <div>
                            <p className={`text-sm font-bold mb-0.5 ${isDark ? "text-teal-400" : "text-teal-900"}`}>
                              {sugg.why?.includes('skew') ? `High Skew Detected: "${sugg.columns?.[0]}"` : `Date Column: "${sugg.columns?.[0]}"`}
                            </p>
                            <p className={`text-xs ${isDark ? "text-teal-400" : "text-teal-700"}`}>{sugg.explanation}</p>
                            <p className={`text-xs mt-1.5 leading-relaxed whitespace-pre-line ${isDark ? "text-zinc-400" : "text-gray-600"}`}>{sugg.why}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Apply All Actionable Suggestions */}
                  {smartSuggestions.length > 1 && (
                    <div className={`pt-4 border-t flex justify-end ${isDark ? "border-zinc-800" : "border-indigo-100"}`}>
                      <button onClick={() => {
                        if (isDemo) {
                          setAuthReason("Applying smart suggestions automatically is only available for registered users.");
                          setAuthMode("signup");
                          setIsAuthOpen(true);
                          return;
                        }
                        smartSuggestions.forEach(s => { const { explanation, why, category, infoOnly, ...op } = s as any; addOperation(op); });
                        markSuggestionsSeen();
                      }} className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm transition-all hover:shadow-md flex items-center gap-2 cursor-pointer">
                        {isDemo ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Apply All Suggestions</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span>Apply All Suggestions</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Data Cleaning Pipeline UI */}
            <section className={`rounded-xl border mt-8 transition-colors ${
              isDark ? "bg-zinc-900 border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]" : "bg-white border-gray-100 shadow-sm"
            }`}>
              <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors ${
                isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-gray-50 border-gray-100"
              }`}>
                <h2 className={`text-lg font-semibold flex items-center space-x-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  <span>Data Preprocessing Pipeline</span>
                </h2>
              </div>
              <div className="p-6 flex flex-col md:flex-row gap-8">
                {/* Operations Form */}
                <div className="flex-1 space-y-4">
                    <CustomSelect
                      value={opType}
                      onChange={(val: any) => { setOpType(val); setSelectedCol(""); }}
                      isDark={isDark}
                      options={[
                        { value: "drop_duplicates", label: "Remove Duplicate Rows", group: "Data Cleaning" },
                        { value: "drop_columns", label: "Drop Column", group: "Data Cleaning" },
                        { value: "impute", label: "Fill Missing Values (Impute)", group: "Data Cleaning" },
                        { value: "encode", label: "Encode Categorical (Strings only)", group: "Feature Engineering" },
                        { value: "scale", label: "Scale Numerical (Numerics only)", group: "Feature Engineering" },
                      ]}
                    />

                  {opType !== "drop_duplicates" && (
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-zinc-400" : "text-gray-700"}`}>Select Column</label>
                      <CustomSelect
                        value={selectedCol}
                        onChange={(val) => {
                          setSelectedCol(val);
                          const isColNum = profile?.columns[val]?.dtype.match(/(int|float|numeric)/i);
                          if (!isColNum && (imputeStrategy === "mean" || imputeStrategy === "median")) {
                            setImputeStrategy("mode");
                          }
                        }}
                        isDark={isDark}
                        placeholder="-- Select --"
                        options={[
                          { value: "", label: "-- Select --" },
                          ...Object.keys(profile.columns)
                            .filter(col => {
                              const isNum = profile.columns[col].dtype.match(/(int|float|numeric)/i);
                              if (opType === "encode" && isNum) return false;
                              if (opType === "scale" && !isNum) return false;
                              return true;
                            })
                            .sort((a, b) => profile.columns[b].null_count - profile.columns[a].null_count)
                            .map(col => {
                              const isNum = profile.columns[col].dtype.match(/(int|float|numeric)/i);
                              const missingCount = profile.columns[col].null_count;
                              const isImputeDisabled = opType === "impute" && missingCount === 0;
                              return {
                                value: col,
                                label: `${col} [${isNum ? "numeric" : "string"}] (missing: ${missingCount})${isImputeDisabled ? " [no missing]" : ""}`,
                                disabled: isImputeDisabled
                              };
                            })
                        ]}
                      />
                    </div>
                  )}

                  {opType === "impute" && selectedCol && profile?.columns[selectedCol]?.null_count === 0 && (
                     <div className={`text-sm p-2 rounded-md border ${
                       isDark ? "bg-amber-950/20 border-amber-900/40 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700"
                     }`}>
                        This column has no missing values. Imputation is not needed.
                     </div>
                  )}

                  {opType === "impute" && selectedCol && profile?.columns[selectedCol]?.null_count > 0 && (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-zinc-400" : "text-gray-700"}`}>Strategy</label>
                        <CustomSelect
                          value={imputeStrategy}
                          onChange={(val: any) => setImputeStrategy(val)}
                          isDark={isDark}
                          options={[
                            ...(isNumericCol ? [
                              { value: "mean", label: "Mean (numerical only)" },
                              { value: "median", label: "Median (numerical only)" }
                            ] : []),
                            { value: "mode", label: "Mode (most frequent)" },
                            { value: "constant", label: "Constant Value" },
                            { value: "drop", label: "Drop rows with missing" }
                          ]}
                        />
                      </div>
                      {imputeStrategy === "constant" && (
                        <div>
                          <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-zinc-400" : "text-gray-700"}`}>Fill Value</label>
                          <input type="text" value={fillValue} onChange={(e) => setFillValue(e.target.value)} className={`w-full rounded-md shadow-sm p-2 border outline-none ${
                            isDark ? "bg-zinc-950 border-zinc-800 text-white focus:ring-violet-500/20 focus:border-violet-500 hover:border-zinc-700" : "bg-white border-gray-300 text-gray-700 focus:ring-indigo-500/20 focus:border-indigo-500"
                          }`} placeholder="e.g. Unknown or 0" />
                        </div>
                      )}
                    </>
                  )}

                  {opType === "encode" && (
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-zinc-400" : "text-gray-700"}`}>Encoding Strategy</label>
                      <CustomSelect
                        value={encodeStrategy}
                        onChange={(val: any) => setEncodeStrategy(val)}
                        isDark={isDark}
                        options={[
                          { value: "label", label: "Label Encoding (0, 1, 2...)" },
                          { value: "onehot", label: "One-Hot Encoding (Creates new columns)" }
                        ]}
                      />
                    </div>
                  )}

                  {opType === "scale" && (
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-zinc-400" : "text-gray-700"}`}>Scaling Strategy</label>
                      <CustomSelect
                        value={scaleStrategy}
                        onChange={(val: any) => setScaleStrategy(val)}
                        isDark={isDark}
                        options={[
                          { value: "standard", label: "Standard Scaler (Z-Score)" },
                          { value: "minmax", label: "Min-Max Scaler (0 to 1)" }
                        ]}
                      />
                    </div>
                  )}

                  <button onClick={handleAddOperation} className={`w-full py-2 px-4 font-semibold rounded-md transition-colors border cursor-pointer ${
                    isDark ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800" : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200"
                  }`}>
                    Add Step to Pipeline
                  </button>
                </div>

                {/* Pipeline Display */}
                <div className={`flex-1 p-4 rounded-xl border flex flex-col transition-colors ${
                  isDark ? "bg-zinc-950 border-zinc-800" : "bg-gray-50 border-gray-100"
                }`}>
                  <h3 className={`font-semibold mb-4 ${isDark ? "text-zinc-200" : "text-gray-800"}`}>Pending Pipeline Steps</h3>
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-64">
                    {operations.length === 0 ? (
                      <div className="text-gray-400 text-sm text-center italic py-8">No steps added yet.</div>
                    ) : (
                      operations.map((op, idx) => (
                        <div key={op.id} className={`p-3 rounded-lg border shadow-sm flex items-center justify-between group transition-colors ${
                          isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-gray-200 text-gray-800"
                        }`}>
                          <div className="flex items-center space-x-3">
                            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-full">{idx + 1}</span>
                            <div>
                              <p className={`text-sm font-medium ${isDark ? "text-zinc-200" : "text-gray-800"}`}>
                                {op.type === "drop_duplicates" && "Drop Duplicates"}
                                {op.type === "drop_columns" && `Drop Col: ${op.columns?.join(", ")}`}
                                {op.type === "impute" && `Impute: ${op.columns?.join(", ")}`}
                                {op.type === "encode" && `Encode: ${op.columns?.join(", ")}`}
                                {op.type === "scale" && `Scale: ${op.columns?.join(", ")}`}
                              </p>
                              {op.type !== "drop_duplicates" && op.type !== "drop_columns" && (
                                <p className="text-xs text-zinc-500">
                                  Strategy: {op.strategy === "onehot" ? "One-Hot" : op.strategy === "label" ? "Label" : op.strategy} {op.fill_value && `(${op.fill_value})`}
                                </p>
                              )}
                            </div>
                          </div>
                          <button onClick={() => removeOperation(op.id)} className="text-zinc-500 hover:text-red-500 transition-colors p-1 cursor-pointer" title="Remove Step">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {operations.length > 0 && (
                    <button onClick={handleApplyPipeline} disabled={cleaning} className="mt-4 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm transition-colors flex justify-center items-center cursor-pointer">
                      {cleaning ? (
                        <span className="flex items-center space-x-2"><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Processing pipeline...</span></span>
                      ) : "Apply Pipeline"}
                    </button>
                  )}
                  {history.length > 0 && operations.length === 0 && (
                    <button onClick={handleRevert} className="mt-4 w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md shadow-sm transition-colors flex justify-center items-center space-x-2 cursor-pointer">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                      <span>Revert Last Pipeline Step</span>
                    </button>
                  )}
                  {prevProfile && operations.length === 0 && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          if (isDemo) {
                            setAuthReason("Downloading cleaned datasets is only available for registered users.");
                            setAuthMode("signup");
                            setIsAuthOpen(true);
                            return;
                          }
                          handleExport("csv");
                        }}
                        className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm transition-colors flex justify-center items-center space-x-2 cursor-pointer"
                        title="Download as CSV"
                      >
                        {isDemo ? (
                          <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                        <span>Export CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          if (isDemo) {
                            setAuthReason("Downloading cleaned datasets is only available for registered users.");
                            setAuthMode("signup");
                            setIsAuthOpen(true);
                            return;
                          }
                          handleExport("pkl");
                        }}
                        className="flex-1 py-3 px-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-md shadow-sm transition-colors flex justify-center items-center space-x-2 cursor-pointer"
                        title="Download as Pickle (.pkl) — load with pandas.read_pickle()"
                      >
                        {isDemo ? (
                          <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                        <span>Export PKL</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default function CleanPage() {
  const { theme } = usePipelineStore();
  const isDark = theme === "dark";
  
  return (
    <Suspense fallback={
      <div className={`min-h-screen flex items-center justify-center transition-colors ${
        isDark ? "bg-zinc-950 text-zinc-400" : "bg-gray-50 text-gray-500"
      }`}>
        <div className="text-center">
          <div className={`animate-spin h-8 w-8 mx-auto mb-4 border-4 rounded-full ${
            isDark ? "border-zinc-800 border-t-violet-500" : "border-indigo-200 border-t-indigo-600"
          }`}></div>
          <p className="font-medium">Loading RefineML...</p>
        </div>
      </div>
    }>
      <CleanAppContent />
    </Suspense>
  );
}

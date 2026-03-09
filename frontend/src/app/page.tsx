"use client";
import React, { useState, useEffect } from "react";
import { usePipelineStore, CleanOperation } from "../store/pipelineStore";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [prevProfile, setPrevProfile] = useState<any>(null); // To store before applying pipeline
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { operations, addOperation, removeOperation, clearOperations } = usePipelineStore();
  const [opType, setOpType] = useState<CleanOperation["type"]>("drop_duplicates");
  const [selectedCol, setSelectedCol] = useState<string>("");
  
  // Strategies
  const [imputeStrategy, setImputeStrategy] = useState<Exclude<CleanOperation["strategy"], undefined>>("mean");
  const [encodeStrategy, setEncodeStrategy] = useState<Exclude<CleanOperation["strategy"], undefined>>("label");
  const [scaleStrategy, setScaleStrategy] = useState<Exclude<CleanOperation["strategy"], undefined>>("standard");
  const [fillValue, setFillValue] = useState<string>("");

  // Memory cleanup tracking
  useEffect(() => {
    return () => {
      if (fileId) {
        // Use browser keepalive to reliably send cleanup request even during unmount/close
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/dataset/cleanup?file_id=${fileId}`, {
          method: 'DELETE',
          keepalive: true
        }).catch(err => console.error("Cleanup failed", err));
      }
    };
  }, [fileId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
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
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // If there's an existing file, clean it up before uploading the new one
      if (fileId) {
         await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/dataset/cleanup?file_id=${fileId}`, { method: 'DELETE' }).catch(e => console.error(e));
      }

      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/dataset/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.message || "Failed to upload file");
      }

      const uploadData = await uploadRes.json();
      setFileId(uploadData.file_id);

      // Fetch Profile
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/dataset/profile?file_id=${uploadData.file_id}`);
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      const profileData = await profileRes.json();
      setProfile(profileData);
      setPrevProfile(null); // Reset prev

      // Fetch Preview
      const previewRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/dataset/preview?file_id=${uploadData.file_id}&limit=10`);
      if (!previewRes.ok) throw new Error("Failed to fetch preview");
      const previewData = await previewRes.json();
      setPreview(previewData);
      
      // Reset pipeline automatically on new upload
      clearOperations();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperation = () => {
    if ((opType === "impute" || opType === "drop_columns" || opType === "encode" || opType === "scale") && !selectedCol) return;
    if (opType === "impute" && imputeStrategy === "constant" && !fillValue) return;

    // Prevent duplicate operations on the same column
    if (selectedCol && operations.some(op => op.columns?.includes(selectedCol))) {
      setError(`An operation is already scheduled for column '${selectedCol}'. You can only apply one operation per column per pipeline.`);
      setTimeout(() => setError(null), 5000);
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
    
    // Reset selections slightly
    if (opType === "drop_columns" || opType === "impute" || opType === "encode" || opType === "scale") setSelectedCol("");
  };

  const handleApplyPipeline = async () => {
    if (!fileId || operations.length === 0) return;
    setCleaning(true);
    setError(null);

    try {
      const cleanRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/dataset/clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId, operations }),
      });

      if (!cleanRes.ok) {
        const errData = await cleanRes.json();
        throw new Error(errData.message || "Failed to clean dataset");
      }

      const cleanData = await cleanRes.json();
      setFileId(cleanData.file_id); // Update fileId to the newly cleaned parquet
      clearOperations(); // applied

      // Fetch Profile for newly cleaned dataset
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/dataset/profile?file_id=${cleanData.file_id}`);
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      setPrevProfile(profile); // Save old profile
      setProfile(await profileRes.json());

      // Fetch Preview for newly cleaned dataset
      const previewRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/dataset/preview?file_id=${cleanData.file_id}&limit=10`);
      if (!previewRes.ok) throw new Error("Failed to fetch preview");
      setPreview(await previewRes.json());

    } catch (err: any) {
      setError(err.message);
    } finally {
      setCleaning(false);
    }
  };

  const handleExport = () => {
    if (!fileId) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.href = `${baseUrl}/api/dataset/export?file_id=${fileId}`;
    setSuccessMsg("Dataset exported successfully!");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const totalMissing = profile ? Object.values(profile.columns).reduce((acc: number, col: any) => acc + col.null_count, 0) : 0;
  const prevTotalMissing = prevProfile ? Object.values(prevProfile.columns).reduce((acc: number, col: any) => acc + col.null_count, 0) : 0;
  
  // Calculate Dataset Quality Score (0 to 100)
  const calculateQualityScore = (p: any, missing: number) => {
    if (!p || p.row_count === 0) return 0;
    const totalCells = p.row_count * p.column_count;
    // Deduct points for missing values (max 40 pts penalty)
    const missingPenalty = Math.min((missing / totalCells) * 100 * 2, 40);
    // Deduct points for duplicates (max 40 pts penalty)
    const duplicatePenalty = Math.min((p.duplicate_count / p.row_count) * 100 * 2, 40);
    
    // Base score 100
    return Math.max(0, Math.round(100 - missingPenalty - duplicatePenalty));
  };

  const qualityScore = calculateQualityScore(profile, totalMissing);
  const prevQualityScore = prevProfile ? calculateQualityScore(prevProfile, prevTotalMissing) : null;

  const isNumericCol = selectedCol && profile?.columns[selectedCol]?.dtype.match(/(int|float|numeric)/i);

  type Suggestion = Omit<CleanOperation, "id"> & { explanation: string, category: 'Cleaning' | 'Engineering' };

  const getSmartSuggestions = (): Suggestion[] => {
    if (!profile) return [];
    
    const suggestions: Suggestion[] = [];
    const idPatterns = ["id", "index", "uuid"];
    const avoidEncodePatterns = ["title", "description", "name", "date", "url"];

    const sortedCols = Object.keys(profile.columns).sort((a, b) => profile.columns[b].null_count - profile.columns[a].null_count);

    // 1. Impute missing values
    sortedCols.forEach((colName) => {
      const lowerCol = colName.toLowerCase();
      if (idPatterns.some((pattern) => lowerCol.includes(pattern))) return;

      const colInfo = profile.columns[colName];
      const isNum = colInfo.dtype.match(/(int|float|numeric)/i);

      if (colInfo.null_count > 0 && suggestions.length < 5) {
        suggestions.push({
          type: "impute",
          columns: [colName],
          strategy: isNum ? "median" : "mode",
          explanation: `Missing ${colInfo.null_count} values (${colInfo.null_percent}%). Best to fill with ${isNum ? 'median' : 'mode'} to maintain distribution.`,
          category: 'Cleaning'
        });
      }
    });

    // 2. Feature Engineering: Encode
    let encodeCount = 0;
    Object.keys(profile.columns).forEach((colName) => {
      const lowerCol = colName.toLowerCase();
      if (idPatterns.some((pattern) => lowerCol.includes(pattern))) return;
      if (avoidEncodePatterns.some((pattern) => lowerCol.includes(pattern))) return;

      const colInfo = profile.columns[colName];
      const isNum = colInfo.dtype.match(/(int|float|numeric)/i);
      // Backend guarantees unique_count but fallback to 0 safely on old loads
      const uniqueCount = colInfo.unique_count || 0; 

      // Only recommend encoding on non-numeric, with reasonable missing count, avoid suggesting everything
      // ONLY SUGGEST if unique values < 50 to prevent huge ML feature spaces (like director names)
      if (!isNum && uniqueCount > 0 && uniqueCount < 50 && encodeCount < 2) {
        suggestions.push({
          type: "encode",
          columns: [colName],
          strategy: "label",
          explanation: `Feature has only ${uniqueCount} unique categories. Label encoding converts this to ML-friendly numbers safely.`,
          category: 'Engineering'
        });
        encodeCount++;
      }
    });

    // 3. Feature Engineering: Scale
    let scaleCount = 0;
    Object.keys(profile.columns).forEach((colName) => {
      const lowerCol = colName.toLowerCase();
      if (idPatterns.some((pattern) => lowerCol.includes(pattern))) return;

      const colInfo = profile.columns[colName];
      const isNum = colInfo.dtype.match(/(int|float|numeric)/i);

      if (isNum && scaleCount < 2) {
         suggestions.push({
           type: "scale",
           columns: [colName],
           strategy: "standard",
           explanation: 'Numeric values should be scaled (standardized) so ML models do not give them biased weight due to large ranges.',
           category: 'Engineering'
         });
         scaleCount++;
      }
    });

    return suggestions;
  };
  
  // Get suggestions and filter out any that already have an operation applied to their column
  const smartSuggestions = profile 
    ? getSmartSuggestions().filter(sugg => !operations.some(op => op.columns?.includes(sugg.columns?.[0] || "")))
    : [];

  const cleaningSuggestions = smartSuggestions.filter(s => s.category === 'Cleaning');
  const engineeringSuggestions = smartSuggestions.filter(s => s.category === 'Engineering');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3 text-indigo-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
          <span className="text-2xl font-extrabold tracking-tight">CleanML</span>
        </div>
        <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-500">
          <a href="/docs" target="_blank" className="hover:text-indigo-600 transition-colors">Documentation</a>
          <a href="https://github.com/HexCoder404/CleanML" target="_blank" className="hover:text-indigo-600 transition-colors">GitHub Repo</a>
        </div>
      </nav>

      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8 relative">

          {/* Toast Notification */}
          {successMsg && (
            <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg font-medium flex items-center space-x-3 z-50 animate-in slide-in-from-bottom-5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span>{successMsg}</span>
            </div>
          )}

          <header className="text-center space-y-4 pt-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Get your dataset ML-ready</h1>
            <p className="text-lg text-gray-500">Upload your dataset to profile, clean, and export without writing code.</p>
          </header>

        {/* Upload Section */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center space-y-6">
          <div className="flex items-center justify-center w-full max-w-xl">
            <label 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                isDragging 
                  ? "border-indigo-500 bg-indigo-100 ring-4 ring-indigo-50" 
                  : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className={`w-10 h-10 mb-4 ${isDragging ? "text-indigo-600 animate-bounce" : "text-indigo-500"}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                </svg>
                <p className="mb-2 text-sm text-gray-600"><span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">CSV, Excel, or JSON (MAX. 200k rows)</p>
              </div>
              <input type="file" className="hidden" accept=".csv,.xls,.xlsx,.json" onChange={handleFileChange} />
            </label>
          </div>
          
          {file && (
            <div className="text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">
              Selected: {file.name}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-8 py-3 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-indigo-300 min-w-[200px] flex justify-center"
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
          
          {error && <div className="text-red-500 text-sm font-medium p-4 bg-red-50 rounded-lg">{error}</div>}
        </section>

        {/* Profile & Preview Section */}
        {profile && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Cards */}
            <section className="grid grid-cols-1 md:grid-cols-5 gap-6">

              {/* Quality Score Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 relative overflow-hidden bg-gradient-to-br from-white to-emerald-50 col-span-1 md:col-span-2 md:row-span-2 flex flex-col justify-center">
                 <div className="absolute right-0 top-0 h-full w-2 bg-emerald-400"></div>
                 <h3 className="text-emerald-800 text-sm font-bold uppercase tracking-wide mb-1 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
                    <span>Dataset Quality Score</span>
                 </h3>
                 <div className="flex items-end space-x-4 mt-2">
                    <p className={`text-6xl font-black ${qualityScore >= 80 ? 'text-emerald-600' : qualityScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {qualityScore}
                    </p>
                    <p className="text-gray-400 font-semibold mb-2">/ 100</p>
                 </div>
                 {prevQualityScore !== null && prevQualityScore !== qualityScore && (
                    <div className="mt-4 inline-flex items-center space-x-1.5 text-sm font-medium text-emerald-700 bg-emerald-100/50 px-3 py-1 rounded-full w-fit">
                       <span>Score improved from {prevQualityScore}</span>
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                    </div>
                 )}
                 <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                   Based on missing values ({totalMissing}), duplicates ({profile.duplicate_count}), and data health.
                 </p>
              </div>

              {/* Standard Cards */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-2 bg-indigo-500"></div>
                <h3 className="text-gray-500 text-sm font-medium">Total Rows</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {prevProfile && prevProfile.row_count !== profile.row_count && (
                    <span className="text-gray-400 line-through text-xl mr-2">{prevProfile.row_count.toLocaleString()}</span>
                  )}
                  {profile.row_count.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-2 bg-blue-500"></div>
                <h3 className="text-gray-500 text-sm font-medium">Total Columns</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {prevProfile && prevProfile.column_count !== profile.column_count && (
                    <span className="text-gray-400 line-through text-xl mr-2">{prevProfile.column_count.toLocaleString()}</span>
                  )}
                  {profile.column_count.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-2 bg-amber-500"></div>
                <h3 className="text-gray-500 text-sm font-medium">Duplicate Rows</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {prevProfile && prevProfile.duplicate_count !== profile.duplicate_count && (
                    <span className="text-gray-400 line-through text-xl mr-2">{prevProfile.duplicate_count.toLocaleString()}</span>
                  )}
                  {profile.duplicate_count.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-red-50 relative overflow-hidden bg-gradient-to-br from-white to-red-50">
                <div className="absolute right-0 top-0 h-full w-2 bg-red-400"></div>
                <h3 className="text-gray-600 text-sm font-medium">Missing Values</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">
                   {prevProfile && prevTotalMissing !== totalMissing && (
                    <span className="text-red-300 line-through text-xl mr-2">{prevTotalMissing.toLocaleString()}</span>
                  )}
                  {totalMissing.toLocaleString()}
                </p>
              </div>
            </section>

            {/* Preview Table */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Dataset Preview (First 10 Rows)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      {Object.keys(profile.columns).map((colName) => (
                        <th key={colName} className="px-6 py-3 font-medium whitespace-nowrap">
                          {colName}
                          <span className="block text-[10px] text-gray-400 normal-case mt-1">{profile.columns[colName].dtype}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                        {Object.keys(profile.columns).map((colName) => (
                          <td key={`${idx}-${colName}`} className="px-6 py-4 whitespace-nowrap text-gray-600 border-r border-gray-100 last:border-0 truncate max-w-[200px]">
                            {row[colName] !== null && row[colName] !== "" ? String(row[colName]) : <span className="text-red-400 italic bg-red-50 px-2 py-1 rounded text-xs">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Smart Suggestions */}
            {smartSuggestions.length > 0 && (
              <section className="bg-gradient-to-r from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50/80 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-indigo-900 flex items-center space-x-2">
                    <span>✨ Smart Suggestions</span>
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-indigo-800 font-medium mb-6">We analyzed your dataset and found issues. You can add these suggested steps to your pipeline:</p>
                  
                  <div className="flex flex-col md:flex-row gap-8">
                     {/* Category 1: Cleaning */}
                     {cleaningSuggestions.length > 0 && (
                        <div className="flex-1 space-y-3">
                           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                              <span>🧹 Data Cleaning</span>
                              <div className="h-px bg-gray-200 flex-1"></div>
                           </h3>
                           {cleaningSuggestions.map((sugg, idx) => (
                              <div key={`clean-${idx}`} className="flex flex-col xl:flex-row xl:items-center justify-between bg-white p-4 rounded-lg border border-indigo-50 shadow-sm gap-4">
                                 <div className="flex items-start space-x-3">
                                     <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                     <div>
                                         <span className="text-sm font-bold text-gray-900 block mb-1">
                                              {sugg.type === "impute" && `Impute "${sugg.columns?.[0]}" → ${sugg.strategy === 'median' ? 'Median' : 'Mode'}`}
                                         </span>
                                         <span className="text-xs text-gray-500 block leading-tight">{sugg.explanation}</span>
                                     </div>
                                 </div>
                                 <button onClick={() => {
                                    const { explanation, category, ...cleanOp } = sugg;
                                    addOperation(cleanOp);
                                 }} className="shrink-0 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 transition-colors w-max self-start xl:self-auto">
                                    Add
                                 </button>
                              </div>
                           ))}
                        </div>
                     )}

                     {/* Category 2: Feature Engineering */}
                     {engineeringSuggestions.length > 0 && (
                        <div className="flex-1 space-y-3">
                           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                              <span>⚙️ Feature Engineering</span>
                              <div className="h-px bg-gray-200 flex-1"></div>
                           </h3>
                           {engineeringSuggestions.map((sugg, idx) => (
                              <div key={`eng-${idx}`} className="flex flex-col xl:flex-row xl:items-center justify-between bg-white p-4 rounded-lg border border-indigo-50 shadow-sm gap-4">
                                 <div className="flex items-start space-x-3">
                                     <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                     <div>
                                         <span className="text-sm font-bold text-gray-900 block mb-1">
                                              {sugg.type === "encode" && `Encode "${sugg.columns?.[0]}"`}
                                              {sugg.type === "scale" && `Scale "${sugg.columns?.[0]}"`}
                                         </span>
                                         <span className="text-xs text-gray-500 block leading-tight">{sugg.explanation}</span>
                                     </div>
                                 </div>
                                 <button onClick={() => {
                                    const { explanation, category, ...cleanOp } = sugg;
                                    addOperation(cleanOp);
                                 }} className="shrink-0 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 transition-colors w-max self-start xl:self-auto">
                                    Add
                                 </button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                  
                  {smartSuggestions.length > 1 && (
                     <div className="mt-8 pt-4 border-t border-indigo-100 flex justify-end">
                        <button onClick={() => {
                           smartSuggestions.forEach(s => {
                              const { explanation, category, ...cleanOp } = s;
                              addOperation(cleanOp);
                           });
                        }} className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm transition-all hover:shadow-md flex items-center space-x-2">
                           <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                           <span>Apply All Suggestions</span>
                        </button>
                     </div>
                  )}
                </div>
              </section>
            )}

            {/* Data Cleaning Pipeline UI */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  <span>Data Cleaning Pipeline</span>
                </h2>
              </div>
              <div className="p-6 flex flex-col md:flex-row gap-8">
                {/* Operations Form */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type</label>
                    <select value={opType} onChange={(e: any) => { setOpType(e.target.value); setSelectedCol(""); }} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border">
                      <optgroup label="🧹 Data Cleaning">
                        <option value="drop_duplicates">Remove Duplicate Rows</option>
                        <option value="drop_columns">Drop Column</option>
                        <option value="impute">Fill Missing Values (Impute)</option>
                      </optgroup>
                      <optgroup label="⚙️ Feature Engineering">
                        <option value="encode">Encode Categorical (Strings only)</option>
                        <option value="scale">Scale Numerical (Numerics only)</option>
                      </optgroup>
                    </select>
                  </div>

                  {opType !== "drop_duplicates" && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Select Column</label>
                       <select value={selectedCol} onChange={(e) => {
                          setSelectedCol(e.target.value);
                          const isColNum = profile?.columns[e.target.value]?.dtype.match(/(int|float|numeric)/i);
                          if (!isColNum && (imputeStrategy === "mean" || imputeStrategy === "median")) {
                            setImputeStrategy("mode");
                          }
                       }} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
                         <option value="">-- Select --</option>
                         {Object.keys(profile.columns)
                           .filter(col => {
                              // Filter out numeric for encode, filter out strings for scale
                              const isNum = profile.columns[col].dtype.match(/(int|float|numeric)/i);
                              if (opType === "encode" && isNum) return false;
                              if (opType === "scale" && !isNum) return false;
                              return true;
                           })
                           .sort((a, b) => profile.columns[b].null_count - profile.columns[a].null_count) // Sort by missing values descending
                           .map(col => {
                             const isNum = profile.columns[col].dtype.match(/(int|float|numeric)/i);
                             const missingCount = profile.columns[col].null_count;
                             const isImputeDisabled = opType === "impute" && missingCount === 0;

                             return (
                               <option key={col} value={col} disabled={isImputeDisabled}>
                                 {col} [{isNum ? "numeric" : "string"}] (missing: {missingCount}) {isImputeDisabled ? " 🔒" : ""}
                               </option>
                             );
                           }
                         )}
                       </select>
                     </div>
                  )}

                  {opType === "impute" && selectedCol && profile?.columns[selectedCol]?.null_count === 0 && (
                     <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                        This column has no missing values. Imputation is not needed.
                     </div>
                  )}

                  {opType === "impute" && selectedCol && profile?.columns[selectedCol]?.null_count > 0 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Strategy</label>
                        <select value={imputeStrategy} onChange={(e: any) => setImputeStrategy(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
                          {isNumericCol && <option value="mean">Mean (numerical only)</option>}
                          {isNumericCol && <option value="median">Median (numerical only)</option>}
                          <option value="mode">Mode (most frequent)</option>
                          <option value="constant">Constant Value</option>
                          <option value="drop">Drop rows with missing</option>
                        </select>
                      </div>
                      {imputeStrategy === "constant" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fill Value</label>
                          <input type="text" value={fillValue} onChange={(e) => setFillValue(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" placeholder="e.g. Unknown or 0" />
                        </div>
                      )}
                    </>
                  )}

                  {opType === "encode" && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Encoding Strategy</label>
                       <select value={encodeStrategy} onChange={(e: any) => setEncodeStrategy(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
                         <option value="label">Label Encoding (0, 1, 2...)</option>
                         <option value="onehot">One-Hot Encoding (Creates new columns)</option>
                       </select>
                     </div>
                  )}

                  {opType === "scale" && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Scaling Strategy</label>
                       <select value={scaleStrategy} onChange={(e: any) => setScaleStrategy(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
                         <option value="standard">Standard Scaler (Z-Score)</option>
                         <option value="minmax">Min-Max Scaler (0 to 1)</option>
                       </select>
                     </div>
                  )}

                  <button onClick={handleAddOperation} className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors border border-gray-200">
                    Add Step to Pipeline
                  </button>
                </div>

                {/* Pipeline Display */}
                <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col">
                  <h3 className="font-semibold text-gray-800 mb-4">Pending Pipeline Steps</h3>
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-64">
                    {operations.length === 0 ? (
                      <div className="text-gray-400 text-sm text-center italic py-8">No steps added yet.</div>
                    ) : (
                      operations.map((op, idx) => (
                        <div key={op.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between group">
                          <div className="flex items-center space-x-3">
                            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-full">{idx + 1}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {op.type === "drop_duplicates" && "Drop Duplicates"}
                                {op.type === "drop_columns" && `Drop Col: ${op.columns?.join(", ")}`}
                                {op.type === "impute" && `Impute: ${op.columns?.join(", ")}`}
                                {op.type === "encode" && `Encode: ${op.columns?.join(", ")}`}
                                {op.type === "scale" && `Scale: ${op.columns?.join(", ")}`}
                              </p>
                              {op.type !== "drop_duplicates" && op.type !== "drop_columns" && (
                                <p className="text-xs text-gray-500">
                                  Strategy: {op.strategy === "onehot" ? "One-Hot" : op.strategy === "label" ? "Label" : op.strategy} {op.fill_value && `(${op.fill_value})`}
                                </p>
                              )}
                            </div>
                          </div>
                          <button onClick={() => removeOperation(op.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Remove Step">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {operations.length > 0 && (
                    <button onClick={handleApplyPipeline} disabled={cleaning} className="mt-4 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm transition-colors flex justify-center items-center">
                      {cleaning ? (
                        <span className="flex items-center space-x-2"><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Processing pipeline...</span></span>
                      ) : "Apply Pipeline"}
                    </button>
                  )}
                  {prevProfile && operations.length === 0 && (
                    <button onClick={handleExport} className="mt-4 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm transition-colors flex justify-center items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      <span>Export Clean Dataset</span>
                    </button>
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

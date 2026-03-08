"use client";
import { useState } from "react";
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

  const { operations, addOperation, removeOperation, clearOperations } = usePipelineStore();
  const [opType, setOpType] = useState<CleanOperation["type"]>("drop_duplicates");
  const [selectedCol, setSelectedCol] = useState<string>("");
  
  // Strategies
  const [imputeStrategy, setImputeStrategy] = useState<Exclude<CleanOperation["strategy"], undefined>>("mean");
  const [encodeStrategy, setEncodeStrategy] = useState<Exclude<CleanOperation["strategy"], undefined>>("label");
  const [scaleStrategy, setScaleStrategy] = useState<Exclude<CleanOperation["strategy"], undefined>>("standard");
  const [fillValue, setFillValue] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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
  
  const isNumericCol = selectedCol && profile?.columns[selectedCol]?.dtype.match(/(int|float|numeric)/i);

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
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-indigo-300 border-dashed rounded-xl cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-4 text-indigo-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
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
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

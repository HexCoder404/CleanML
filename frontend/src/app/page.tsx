"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const uploadRes = await fetch("http://localhost:8000/api/dataset/upload", {
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
      const profileRes = await fetch(`http://localhost:8000/api/dataset/profile?file_id=${uploadData.file_id}`);
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      const profileData = await profileRes.json();
      setProfile(profileData);

      // Fetch Preview
      const previewRes = await fetch(`http://localhost:8000/api/dataset/preview?file_id=${uploadData.file_id}&limit=10`);
      if (!previewRes.ok) throw new Error("Failed to fetch preview");
      const previewData = await previewRes.json();
      setPreview(previewData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalMissing = profile ? Object.values(profile.columns).reduce((acc: number, col: any) => acc + col.null_count, 0) : 0;

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
          <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">GitHub Repo</a>
        </div>
      </nav>

      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
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
                <p className="text-3xl font-bold text-gray-900 mt-2">{profile.row_count.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-2 bg-blue-500"></div>
                <h3 className="text-gray-500 text-sm font-medium">Total Columns</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{profile.column_count.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-2 bg-amber-500"></div>
                <h3 className="text-gray-500 text-sm font-medium">Duplicate Rows</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{profile.duplicate_count.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-red-50 relative overflow-hidden bg-gradient-to-br from-white to-red-50">
                <div className="absolute right-0 top-0 h-full w-2 bg-red-400"></div>
                <h3 className="text-gray-600 text-sm font-medium">Missing Values</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">{totalMissing.toLocaleString()}</p>
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

            {/* Data Cleaning Section Placeholder */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  <span>Data Cleaning Operations</span>
                </h2>
              </div>
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                  <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Configure Cleaning Steps</h3>
                <p className="text-sm text-gray-500 max-w-md">The cleaning wizard is coming in the next milestone, enabling imputation, duplicates removal, and column dropping.</p>
              </div>
            </section>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

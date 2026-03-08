import Link from "next/link";

export default function Docs() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <Link href="/" className="flex items-center space-x-3 text-indigo-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
          <span className="text-2xl font-extrabold tracking-tight">CleanML Documentation</span>
        </Link>
        <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-500">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Back to App</Link>
          <a href="https://github.com/HexCoder404/CleanML" target="_blank" className="hover:text-indigo-600 transition-colors">GitHub Repo</a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-8 space-y-12">
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold mb-4">What is CleanML?</h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            CleanML is an intuitive, no-code web application designed to prepare messy raw datasets for Machine Learning applications.
            It accepts standard formats (CSV, Excel, JSON) and provides a visual pipeline builder to rapidly identify and neutralize 
            data issues—like missing values or duplicate rows—without needing to write Pandas code.
          </p>
        </section>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-2xl font-bold border-b border-gray-100 pb-2">How to use CleanML</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-600">1. Input Format</h3>
            <p className="text-gray-600">
              CleanML accepts <code>.csv</code>, <code>.xlsx</code>, and <code>.json</code> files containing up to 200,000 rows.
              We automatically standardize diverse text encodings seamlessly.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-600">2. Generating the Profile</h3>
            <p className="text-gray-600">
              Upon successful upload, CleanML profiles your dataset indicating exactly how many rows, columns, and absolute missing values
              exist across your data payload. It automatically scans your schema separating Columns into <code>[string]</code> and <code>[numeric]</code> types.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-600">3. Building the Pipeline</h3>
            <p className="text-gray-600">
              The Data Cleaning Operations wizard is where the magic happens. Here you create sequences.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Impute Missing Values:</strong> Select a target column. If the column has Missing Values, you can select from Mean, Median, Mode, Constant Replacement, or outright Dropping rows. (Mean/Median are locked for Strings).</li>
              <li><strong>Drop Columns:</strong> Specify highly corrupted or un-usable ID columns to shrink the dimensionality of your model.</li>
              <li><strong>Drop Duplicates:</strong> Clear identically repeating rows entirely.</li>
            </ul>
            <p className="text-gray-500 italic mt-2 text-sm bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-400">
              <strong>Example Workflow:</strong> You upload &apos;netflix_titles.csv&apos;. You notice &apos;director&apos; has 2,634 missing values. You select Impute -&gt; &apos;director&apos; -&gt; Constant Value -&gt; &quot;Unknown&quot;. Finally, add another step to Drop Duplicates.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-600">4. Processing & Output</h3>
            <p className="text-gray-600">
              Click <strong>Apply Pipeline</strong>. CleanML runs these sequential tasks. Our interface instantly flashes visual <span className="line-through text-red-400">Before</span> vs <span>After</span> statistics demonstrating the impact of your pipeline on your dataset.

              Once completed, an <strong className="text-green-600">Export Clean Dataset</strong> button appears, triggering a fast download of the clean CSV.
            </p>
          </div>

        </section>

      </main>
    </div>
  );
}

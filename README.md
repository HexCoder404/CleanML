# CleanML

CleanML is an intuitive, no-code web application designed to prepare datasets for Machine Learning. Upload your messy datasets and use the intuitive pipeline builder to profile, clean, and export ML-ready data—all securely contained from right within your browser.

🌐 **GitHub Repository:** [HexCoder404/CleanML](https://github.com/HexCoder404/CleanML)

---

## 🚀 Features

- **Blazing Fast Uploads:** Supports CSV, Excel, and JSON files up to 200,000 rows. Instantly converts payloads into high-performance `Parquet` format on the backend.
- **Deep Data Profiling:** Automatically parses the dataset to highlight row/column sizes, duplicate thresholds, categorical vs numeric separation, and missing values context.
- **Visual Data Cleaning Pipeline:** A "wizard" style builder that allows you to sequentially stack operations. You can see the Before → After metrics happen in real-time.
  - **Imputation:** Handles missing data. Supports Mean, Median, Mode, Constants, and safe row drops. Intelligently prevents arithmetic operations on string columns.
  - **Deduplication:** Rapidly drops duplicate rows.
  - **Column Pruning:** Shed unneeded or identifier columns instantly.
- **Actionable Outputs:** Export the newly refined dataset directly to `.csv` with a single click.

---

## 🛠️ Architecture

CleanML fundamentally features a decoupled Client-Server architecture.

### Frontend (User Interface)
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS (Vanilla responsive utility approach)
- **State Management:** Zustand to hold the volatile data cleaning pipeline logic gracefully without prop-drilling.

### Backend (Data Engine)
- **Framework:** FastAPI (Python)
- **Core Engine:** Pandas (vectorized operations for massive speeds) + PyArrow (Parquet engine)
- **Design Pattern:** Organized strictly by modular services (`FileService`, `CleanService`, `ProfileService`) for maximum separation of concerns.

---

## 💻 Running Locally

### 1. Requirements
Ensure you have the following installed:
- Node.js (v18+)
- Python (3.12+)

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Virtual Environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn pandas pyarrow python-multipart scikit-learn
   ```
4. Start the server (runs on `http://localhost:8000`):
   ```bash
   cd app
   uvicorn main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development environment (runs on `http://localhost:3000`):
   ```bash
   npm run dev
   ```

---

## 📖 How It Works (Step-by-Step Example)

1. **Upload:** Navigate to the Localhost page and click the upload zone to give it a dirty CSV file (for instance, `netflix_titles.csv`).
2. **Review Profile:** Within milliseconds, CleanML processes the payload and shows you the top-level stats. It might show `Total Rows: 8,807`, `Missing Values: 4,307`. It also lists the columns in the dataset preview.
3. **Draft a Pipeline Step:** Scroll down to the *Data Cleaning Pipeline* section.
   - You notice `director` has over 2,634 missing values and is flagged as a `[string]`.
   - You select **Fill Missing Values (Impute)** as the type, **director** as the target column, and **Constant Value** as the strategy. You enter "Unknown Director" as the value, and click **Add Step**.
4. **Build Further:** Add another step to **Remove Duplicate Rows**.
5. **Apply:** Click **Apply Pipeline**. The UI sends the sequential rules `[{type: impute, col: director...}, {type: drop_duplicates}]` to the FastAPI `/clean` endpoint.
6. **Results Live:** The Pandas engine sequentially drops dupes, fills `director` with "Unknown Director", saves this sequence as a new Parquet file dynamically, and responds back. The UI instantly updates the missing values tracker (showing the drop from `4,307` to a slashed smaller value) to confirm the change.
7. **Export:** A shiny green button now appears named **Export Clean Dataset**. Click it to securely fetch `/api/dataset/export`, delivering the final, analysis-ready `.csv` file straight to your downloads folder.

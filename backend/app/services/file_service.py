import pandas as pd
import io
import os
from fastapi import UploadFile, HTTPException
from app.utils.exceptions import ProcessingError

# Absolute path to the uploads directory, anchored to this file's location.
# This makes it CWD-independent regardless of where uvicorn is launched from.
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_UPLOADS_DIR = os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "uploads"))

class FileService:
    def __init__(self, upload_dir: str | None = None):
        self.upload_dir = os.path.abspath(upload_dir or _UPLOADS_DIR)
        os.makedirs(self.upload_dir, exist_ok=True)

    async def process_upload(self, file: UploadFile) -> str:
        """
        Reads an uploaded CSV, Excel, or JSON file, saves it as Parquet, and returns the absolute file path.
        """
        content = await file.read()
        filename = file.filename

        file_ext = filename.split(".")[-1].lower() if "." in filename else ""

        try:
            if file_ext == "csv":
                try:
                    df = pd.read_csv(io.BytesIO(content), encoding="utf-8")
                except UnicodeDecodeError:
                    df = pd.read_csv(io.BytesIO(content), encoding="unicode_escape")
            elif file_ext in ["xls", "xlsx"]:
                df = pd.read_excel(io.BytesIO(content))
            elif file_ext == "json":
                df = pd.read_json(io.BytesIO(content))
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, Excel, or JSON.")
        except Exception as e:
            raise ProcessingError(f"Error reading file {filename}: {str(e)}")

        # Validate constraints
        if len(df) > 200000:
            raise HTTPException(status_code=400, detail="Dataset exceeds 200,000 rows limit.")

        # Save to parquet using an absolute path
        parquet_filename = f"{filename.split('.')[0]}.parquet"
        parquet_path = os.path.join(self.upload_dir, parquet_filename)
        df.to_parquet(parquet_path, engine="pyarrow", index=False)

        return parquet_path

    def _resolve_path(self, filepath: str) -> str:
        """Normalize path separators and resolve relative paths to absolute."""
        filepath = os.path.normpath(filepath)
        if not os.path.isabs(filepath):
            # Relative path (e.g. uploads\foo.parquet) — resolve against uploads dir's parent
            filepath = os.path.normpath(os.path.join(self.upload_dir, "..", filepath))
        return filepath

    def read_parquet(self, filepath: str) -> pd.DataFrame:
        filepath = self._resolve_path(filepath)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found.")
        return pd.read_parquet(filepath, engine="pyarrow")

    def cleanup_file(self, file_id: str):
        """
        Deletes the specified parquet file and its associated export files to free memory.
        """
        try:
            filepath = self._resolve_path(file_id)

            if os.path.exists(filepath):
                os.remove(filepath)

            for suffix in ["_export.csv", "_export.pkl"]:
                export_path = filepath.replace(".parquet", suffix)
                if os.path.exists(export_path):
                    os.remove(export_path)
        except Exception as e:
            # We explicitly don't throw an error here to not block the user interaction
            print(f"Failed to cleanup files for {file_id}: {e}")

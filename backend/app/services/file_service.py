import pandas as pd
import io
import os
from fastapi import UploadFile, HTTPException
from utils.exceptions import ProcessingError

class FileService:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    async def process_upload(self, file: UploadFile) -> str:
        """
        Reads an uploaded CSV, Excel, or JSON file, saves it as Parquet, and returns the file path.
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
        
        # Save to parquet
        parquet_filename = f"{filename.split('.')[0]}.parquet"
        parquet_path = os.path.join(self.upload_dir, parquet_filename)
        df.to_parquet(parquet_path, engine="pyarrow", index=False)
        
        return parquet_path
    
    def read_parquet(self, filepath: str) -> pd.DataFrame:
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found.")
        return pd.read_parquet(filepath, engine="pyarrow")

    def cleanup_file(self, file_id: str):
        """
        Deletes the specified parquet file and its associated export CSV to free memory.
        """
        try:
            if os.path.exists(file_id):
                os.remove(file_id)
            
            export_path = file_id.replace(".parquet", "_export.csv")
            if os.path.exists(export_path):
                os.remove(export_path)
        except Exception as e:
            # We explicitly don't throw an error here to not block the user interaction
            print(f"Failed to cleanup files for {file_id}: {e}")

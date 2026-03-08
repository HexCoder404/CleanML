from fastapi import APIRouter, UploadFile, File, HTTPException
from services.file_service import FileService
from services.profile_service import ProfileService
from typing import Dict, Any

router = APIRouter()
file_service = FileService()
profile_service = ProfileService()

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Endpoint to upload a dataset (CSV, Excel, JSON).
    Returns the file ID (path) to be used in subsequent requests.
    """
    parquet_path = await file_service.process_upload(file)
    return {"message": "File uploaded successfully", "file_id": parquet_path}

@router.get("/profile")
async def get_profile(file_id: str):
    """
    Endpoint to generate a profile for a previously uploaded dataset.
    """
    df = file_service.read_parquet(file_id)
    profile = profile_service.generate_profile(df)
    return profile

@router.get("/preview")
async def get_preview(file_id: str, limit: int = 100):
    """
    Endpoint to return the first `limit` rows of a dataset for preview.
    """
    df = file_service.read_parquet(file_id)
    
    # Return first `limit` rows as a list of dictionaries. Handle NaNs.
    preview_df = df.head(limit).fillna("")
    return preview_df.to_dict(orient="records")

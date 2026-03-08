from fastapi import APIRouter, UploadFile, File, HTTPException
from services.file_service import FileService
from services.profile_service import ProfileService
from services.clean_service import CleanService
from models.cleaning import CleanRequest
from typing import Dict, Any

router = APIRouter()
file_service = FileService()
profile_service = ProfileService()
clean_service = CleanService()

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

@router.post("/clean")
async def clean_dataset(request: CleanRequest):
    """
    Endpoint to apply cleaning operations to a dataset.
    Returns the new file_id (path) generated from the operations.
    """
    df = file_service.read_parquet(request.file_id)
    df_clean = clean_service.apply_operations(df, request.operations)
    
    new_file_id = clean_service.save_cleaned_dataset(df_clean, request.file_id)
    
    return {
        "message": "Dataset cleaned successfully",
        "file_id": new_file_id
    }

@router.get("/export")
async def export_dataset(file_id: str):
    """
    Exports a parquet file back to a downloadable CSV.
    """
    import os
    from fastapi.responses import FileResponse
    
    df = file_service.read_parquet(file_id)
    export_path = file_id.replace(".parquet", "_export.csv")
    
    df.to_csv(export_path, index=False)
    
    filename = os.path.basename(export_path)
    
    return FileResponse(
        path=export_path, 
        filename=filename, 
        media_type='text/csv'
    )

@router.delete("/cleanup")
async def cleanup_dataset(file_id: str):
    """
    Deletes the dataset file from the server's uploads folder.
    Intended to be called by the frontend when the user closes the page or starts a new session.
    """
    file_service.cleanup_file(file_id)
    return {"message": "Files cleaned up successfully"}

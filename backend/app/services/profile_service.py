import pandas as pd
import numpy as np
from typing import Dict, Any

class ProfileService:
    def generate_profile(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generates summary statistics for a DataFrame as required by the MVP.
        """
        num_rows, num_cols = df.shape
        
        columns_profile = {}
        for col in df.columns:
            series = df[col]
            dtype = str(series.dtype)
            null_count = int(series.isnull().sum())
            null_percent = round((null_count / num_rows) * 100, 2) if num_rows > 0 else 0
            
            col_stats = {
                "dtype": dtype,
                "null_count": null_count,
                "null_percent": null_percent,
                "unique_count": int(series.nunique())
            }
            
            if pd.api.types.is_numeric_dtype(series):
                col_stats.update({
                    "min": float(series.min()) if not pd.isna(series.min()) else None,
                    "max": float(series.max()) if not pd.isna(series.max()) else None,
                    "mean": float(series.mean()) if not pd.isna(series.mean()) else None,
                    "std": float(series.std()) if not pd.isna(series.std()) else None,
                })
                
            columns_profile[col] = col_stats
            
        duplicate_count = int(df.duplicated().sum())
            
        profile = {
            "row_count": num_rows,
            "column_count": num_cols,
            "duplicate_count": duplicate_count,
            "columns": columns_profile
        }
        
        return profile

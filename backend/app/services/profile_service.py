import pandas as pd
import numpy as np
from typing import Dict, Any

class ProfileService:
    def generate_profile(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generates summary statistics for a DataFrame.
        Includes skewness, datetime detection, and cardinality ratio
        to power smarter frontend suggestions.
        """
        num_rows, num_cols = df.shape

        columns_profile = {}
        for col in df.columns:
            series = df[col]
            dtype = str(series.dtype)
            null_count = int(series.isnull().sum())
            null_percent = round((null_count / num_rows) * 100, 2) if num_rows > 0 else 0
            unique_count = int(series.nunique())
            cardinality_ratio = round(unique_count / num_rows, 4) if num_rows > 0 else 0

            col_stats = {
                "dtype": dtype,
                "null_count": null_count,
                "null_percent": null_percent,
                "unique_count": unique_count,
                "cardinality_ratio": cardinality_ratio,
                "is_datetime_like": False,
                "skewness": None,
            }

            if pd.api.types.is_numeric_dtype(series):
                non_null = series.dropna()
                skewness = float(non_null.skew()) if len(non_null) > 2 else None
                col_stats.update({
                    "min": float(series.min()) if not pd.isna(series.min()) else None,
                    "max": float(series.max()) if not pd.isna(series.max()) else None,
                    "mean": float(series.mean()) if not pd.isna(series.mean()) else None,
                    "std": float(series.std()) if not pd.isna(series.std()) else None,
                    "skewness": round(skewness, 3) if skewness is not None and not np.isnan(skewness) else None,
                })
            else:
                # Heuristic datetime detection: try parsing a sample of non-null values
                non_null = series.dropna()
                if len(non_null) > 0:
                    try:
                        sample = non_null.head(50).astype(str)
                        pd.to_datetime(sample, infer_datetime_format=True, errors="raise")
                        col_stats["is_datetime_like"] = True
                    except Exception:
                        col_stats["is_datetime_like"] = False

            columns_profile[col] = col_stats

        duplicate_count = int(df.duplicated().sum())

        return {
            "row_count": num_rows,
            "column_count": num_cols,
            "duplicate_count": duplicate_count,
            "columns": columns_profile,
        }

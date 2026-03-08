import pandas as pd
import os
import uuid
from typing import List
from models.cleaning import CleanOperation
from utils.exceptions import ProcessingError

class CleanService:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir

    def apply_operations(self, df: pd.DataFrame, operations: List[CleanOperation]) -> pd.DataFrame:
        df_clean = df.copy()
        for op in operations:
            try:
                if op.type == "drop_duplicates":
                    if op.columns:
                        df_clean = df_clean.drop_duplicates(subset=op.columns)
                    else:
                        df_clean = df_clean.drop_duplicates()
                elif op.type == "drop_columns":
                    if op.columns:
                        cols_to_drop = [c for c in op.columns if c in df_clean.columns]
                        df_clean = df_clean.drop(columns=cols_to_drop)
                elif op.type == "impute":
                    if not op.columns:
                        raise ProcessingError("Columns must be specified for impute operation")
                    for col in op.columns:
                        if col not in df_clean.columns:
                            continue
                        
                        if op.strategy == "mean":
                            if pd.api.types.is_numeric_dtype(df_clean[col]):
                                df_clean[col] = df_clean[col].fillna(df_clean[col].mean())
                            else:
                                raise ProcessingError(f"Cannot apply mean imputation to non-numeric column '{col}'")
                        elif op.strategy == "median":
                            if pd.api.types.is_numeric_dtype(df_clean[col]):
                                df_clean[col] = df_clean[col].fillna(df_clean[col].median())
                            else:
                                raise ProcessingError(f"Cannot apply median imputation to non-numeric column '{col}'")
                        elif op.strategy == "mode":
                            mode_val = df_clean[col].mode()
                            if not mode_val.empty:
                                df_clean[col] = df_clean[col].fillna(mode_val[0])
                        elif op.strategy == "constant":
                            if op.fill_value is None:
                                raise ProcessingError("fill_value must be provided for constant strategy")
                            df_clean[col] = df_clean[col].fillna(op.fill_value)
                        elif op.strategy == "drop":
                            df_clean = df_clean.dropna(subset=[col])
                        else:
                            raise ProcessingError(f"Unknown impute strategy: {op.strategy}")
                else:
                    raise ProcessingError(f"Unknown operation type: {op.type}")
            except ProcessingError as pe:
                 raise pe
            except Exception as e:
                raise ProcessingError(f"Failed to apply operation {op.type}: {str(e)}")
        
        return df_clean

    def save_cleaned_dataset(self, df: pd.DataFrame, original_file_id: str) -> str:
        base_name = os.path.basename(original_file_id)
        name_part = base_name.replace(".parquet", "")
        new_filename = f"{name_part}_cleaned_{uuid.uuid4().hex[:8]}.parquet"
        new_filepath = os.path.join(self.upload_dir, new_filename)
        df.to_parquet(new_filepath, engine="pyarrow", index=False)
        return new_filepath

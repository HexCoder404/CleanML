from fastapi import APIRouter
from app.services.file_service import FileService
import pandas as pd
import numpy as np

router = APIRouter()
file_service = FileService()


def safe_val(v):
    """Convert numpy/nan types to JSON-safe Python types."""
    if v is None:
        return None
    if isinstance(v, float) and np.isnan(v):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return float(v)
    return v


@router.get("")
async def get_visualization(file_id: str):
    df = file_service.read_parquet(file_id)

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

    # ── 1. Missing values ────────────────────────────────────────────
    total_rows = len(df)
    missing_values = [
        {
            "column": col,
            "missing_count": int(df[col].isna().sum()),
            "missing_percent": round(df[col].isna().sum() / total_rows * 100, 2) if total_rows > 0 else 0,
        }
        for col in df.columns
        if df[col].isna().sum() > 0
    ]
    missing_values.sort(key=lambda x: x["missing_percent"], reverse=True)

    # ── 2. Data-type distribution ────────────────────────────────────
    dtype_distribution = {}
    for col in df.columns:
        dtype = str(df[col].dtype)
        if dtype.startswith("int") or dtype.startswith("float"):
            label = "Numeric"
        elif dtype == "bool":
            label = "Boolean"
        elif dtype == "object" or dtype == "string":
            label = "Text/Category"
        else:
            label = "Other"
        dtype_distribution[label] = dtype_distribution.get(label, 0) + 1
    dtype_chart = [{"type": k, "count": v} for k, v in dtype_distribution.items()]

    # ── 3. Numeric histograms ────────────────────────────────────────
    histograms = {}
    for col in numeric_cols[:6]:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        counts, bin_edges = np.histogram(series, bins=20)
        histograms[col] = [
            {"bin": f"{bin_edges[i]:.2f}–{bin_edges[i+1]:.2f}", "count": int(counts[i])}
            for i in range(len(counts))
        ]

    # ── 4. Box-plot stats ────────────────────────────────────────────
    boxplots = {}
    for col in numeric_cols[:6]:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outliers = series[(series < lower) | (series > upper)].tolist()
        boxplots[col] = {
            "min": safe_val(float(series.min())),
            "q1": safe_val(q1),
            "median": safe_val(float(series.median())),
            "q3": safe_val(q3),
            "max": safe_val(float(series.max())),
            "outlier_count": len(outliers),
            "lower_fence": safe_val(max(float(series.min()), lower)),
            "upper_fence": safe_val(min(float(series.max()), upper)),
        }

    # ── 5. Categorical frequencies ───────────────────────────────────
    categorical = {}
    for col in categorical_cols[:6]:
        vc = df[col].value_counts().head(10)
        categorical[col] = [{"value": str(k), "count": int(v)} for k, v in vc.items()]

    # ── 6. Correlation matrix ────────────────────────────────────────
    correlation = []
    if len(numeric_cols) >= 2:
        corr_df = df[numeric_cols[:10]].corr()
        for i, row_col in enumerate(corr_df.columns):
            for j, col_col in enumerate(corr_df.columns):
                val = corr_df.iloc[i, j]
                correlation.append({
                    "x": row_col,
                    "y": col_col,
                    "value": safe_val(round(val, 3)) if not np.isnan(val) else None,
                })

    return {
        "overview": {
            "row_count": total_rows,
            "column_count": len(df.columns),
            "numeric_count": len(numeric_cols),
            "categorical_count": len(categorical_cols),
            "missing_values": missing_values,
            "dtype_distribution": dtype_chart,
        },
        "histograms": histograms,
        "boxplots": boxplots,
        "categorical": categorical,
        "correlation": {
            "columns": numeric_cols[:10],
            "data": correlation,
        },
    }

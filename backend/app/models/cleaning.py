from pydantic import BaseModel
from typing import List, Optional, Any

class CleanOperation(BaseModel):
    id: str
    type: str  # "drop_duplicates", "drop_columns", "impute"
    columns: Optional[List[str]] = None
    strategy: Optional[str] = None # "mean", "median", "mode", "constant", "drop"
    fill_value: Optional[Any] = None

class CleanRequest(BaseModel):
    file_id: str
    operations: List[CleanOperation]

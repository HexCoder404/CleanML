from pydantic import BaseModel
from typing import List, Optional, Any

class CleanOperation(BaseModel):
    id: str
    type: str  # "drop_duplicates", "drop_columns", "impute", "encode", "scale"
    columns: Optional[List[str]] = None
    strategy: Optional[str] = None # impute: "mean", "median", "mode", "constant", "drop" | encode: "label", "onehot" | scale: "standard", "minmax"
    fill_value: Optional[Any] = None

class CleanRequest(BaseModel):
    file_id: str
    operations: List[CleanOperation]

from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class TableStatusSchema(BaseModel):
    table_id: str
    status: str
    confidence: float
    last_seen: datetime

class SummarySchema(BaseModel):
    total_tables: int
    empty_tables: int
    occupied_tables: int
    total_people: int

class ModelMetaSchema(BaseModel):
    model: str
    process_time_ms: int

class ModelDataSchema(BaseModel):
    location_id: str
    camera_id: str
    timestamp: datetime
    summary: SummarySchema
    tables: List[TableStatusSchema]
    meta: Optional[ModelMetaSchema] = None


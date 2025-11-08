from pydantic import BaseModel
from datetime import datetime

class ClientSummarySchema(BaseModel):
    total_tables: int
    empty_tables: int
    occupied_tables: int
    total_people: int

class ClientDataSchema(BaseModel):
    location_name: str
    timestamp: datetime
    summary: ClientSummarySchema
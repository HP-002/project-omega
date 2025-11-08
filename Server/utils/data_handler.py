from fastapi import Depends
from sqlalchemy.orm import Session
from schemas.model_data import ModelDataSchema
from schemas.client_data import ClientDataSchema, ClientSummarySchema
from database import crud
from database.connection import SessionLocal
from utils.socket_manager import client_manager

class DataHandler:
    def __init__(self) -> None:
        pass

    async def handle_data(self, data: ModelDataSchema) -> None:
        """
        Process data received from model:
        1. Save to database
        2. Transform to client data format
        3. Broadcast to all connected clients
        """
        db = SessionLocal()
        try:
            saved_data = crud.save_model_data(db, data)

            location = crud.get_location_by_id(db, saved_data.location_id)
            location_name = location.name if location else f"Location {data.location_id}"

            client_data = ClientDataSchema(
                location_name=location_name,
                timestamp=data.timestamp,
                summary=ClientSummarySchema(
                    total_tables=data.summary.total_tables,
                    empty_tables=data.summary.empty_tables,
                    occupied_tables=data.summary.occupied_tables,
                    total_people=data.summary.total_people
                )
            )
            

            if client_manager.has_connections():
                await client_manager.broadcast(client_data.model_dump())

        except Exception as e:
            pass

ta_handler = DataHandler()
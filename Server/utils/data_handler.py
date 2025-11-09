from fastapi import Depends
# from schemas.model_data import ModelDataSchema
# from schemas.client_data import ClientDataSchema, ClientSummarySchema
# from database import crud
# from database.connection import SessionLocal
from utils.socket_manager import client_manager

class DataHandler:
    def __init__(self) -> None:
        self.places = {
            "OW_1": "One World",
            "Flint_1": "Flint Loop",
            "PaulaPlaza_1": "Paula Plaza",
            "SU_1": "Student Union 1",
            "SU_2": "Student Union 2",
            "SU_3": "Student Union 3",
            "Tims_1": "Tim Hortons",
        }

    async def handle_data(self, data):
        # 1 - Save to database
        #self.add_to_database(data)

        # 2 - Transform to client data format
        client_data = self.transform_to_client_data(data)

        # 3 - Broadcast to all connected clients
        if client_manager.has_connections():
            print("Broadcasting to clients--------------------------------")
            await client_manager.broadcast(client_data)

    def transform_to_client_data(self, data):
        location_name = self.places[data["camera"]]
        timestamp = data["timestamp"]
        people_detected = data["summary"]["total_people"]
        occupancy_percent = len(data["summary"]["occupied"]) / (len(data["summary"]["free"]) + len(data["summary"]["occupied"])) * 100

        return {
            "location_name": location_name,
            "timestamp": timestamp,
            "people_detected": people_detected,
            "occupancy_percent": occupancy_percent
        }

    async def add_to_database(self, data):
        pass


data_handler = DataHandler()
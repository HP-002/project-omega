from fastapi import WebSocket
from typing import Set, Dict

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def send_json(self, websocket: WebSocket, data:Dict):
        try:
            await websocket.send_json(data)
        except Exception as e:
            self.disconnect(websocket)
            raise

    async def broadcast(self, data:Dict):
        failed_connections = []
        for websocket in self.active_connections:
            try:
                await websocket.send_json(data)
            except Exception as e:
                failed_connections.append(websocket)
        
        for websocket in failed_connections:
            self.disconnect(websocket)
        
    async def receive_json(self, websocket: WebSocket) -> Dict:
        try:
            return await websocket.receive_json()
        except Exception as e:
            self.disconnect(websocket)
            raise

    def has_connections(self) -> bool:
        return len(self.active_connections) > 0
    
    def get_connection_count(self) -> int:
        return len(self.active_connections)
    
model_manager = ConnectionManager()
client_manager = ConnectionManager()

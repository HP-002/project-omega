from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from utils.socket_manager import client_manager

router = APIRouter(prefix='/client', tags=['client'])

@router.websocket('/ws/connect')
async def connect_client(websocket: WebSocket):
    await client_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        client_manager.disconnect(websocket)
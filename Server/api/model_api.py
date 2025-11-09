import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
from utils.data_handler import data_handler
from utils.socket_manager import model_manager
# from schemas.model_data import ModelDataSchema
# from pydantic import ValidationError

router = APIRouter(prefix='/model', tags=['model'])

@router.websocket('/ws/connect')
async def connect_model(websocket: WebSocket):
    await model_manager.connect(websocket)
    try:
        while True:
            data = await model_manager.receive_json(websocket)
            # try:
            #     model_data = ModelDataSchema(**data)
            #     await data_handler.handle_data(model_data)
            # except ValidationError as e:
            #     print(f"Invalid data format: {e}")
            await data_handler.handle_data(data)
            
    except WebSocketDisconnect:
        model_manager.disconnect(websocket)
    
@router.get('/count')
async def get_model_count() -> Dict[str,int]:
    return {"count": model_manager.get_connection_count()}
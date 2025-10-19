# app/routes/ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

router = APIRouter()

# Keep track of connected users in each room
rooms: dict[str, set[WebSocket]] = {}

@router.websocket("/ws/{room_name}")
async def websocket_endpoint(websocket: WebSocket, room_name: str):
    await websocket.accept()

    if room_name not in rooms:
        rooms[room_name] = set()
    rooms[room_name].add(websocket)

    print(f"{websocket.client} joined room {room_name}")

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Broadcast to everyone in the same room
            for ws in rooms[room_name]:
                if ws != websocket:
                    await ws.send_json(message)

    except WebSocketDisconnect:
        print(f"{websocket.client} left room {room_name}")
        rooms[room_name].remove(websocket)
        if not rooms[room_name]:
            del rooms[room_name]

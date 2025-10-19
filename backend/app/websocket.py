# app/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, List[tuple[WebSocket, str]]] = {} 
        self.room_states: Dict[str, dict] = {}

    async def connect(self, room: str, websocket: WebSocket, peer_id: str = None):
        await websocket.accept()
        if room not in self.rooms:
            self.rooms[room] = []
            self.room_states[room] = {
                "isRunning": False,
                "timeLeft": 25 * 60
            }
        
        self.rooms[room].append((websocket, peer_id))
        
        # Send current timer state to the new joiner
        if room in self.room_states:
            try:
                await websocket.send_json({
                    "type": "timer-sync",
                    "data": self.room_states[room]
                })
            except Exception as e:
                print(f"Error sending timer sync: {e}")
        
        # Notify everyone about member count (AFTER adding the new member)
        member_count = len(self.rooms[room])
        print(f"Room {room} now has {member_count} members")
        await self.broadcast(room, {
            "type": "members",
            "count": member_count,
        })
        
        # Notify existing peers about new peer (excluding the new peer itself)
        await self.broadcast_except(room, websocket, {
            "type": "new-peer",
            "id": peer_id
        })

    def disconnect(self, room: str, websocket: WebSocket):
        if room in self.rooms:
            # Find and remove the connection
            peer_id = None
            for ws, pid in self.rooms[room]:
                if ws == websocket:
                    peer_id = pid
                    break
            
            self.rooms[room] = [(ws, pid) for ws, pid in self.rooms[room] if ws != websocket]
            
            # Clean up empty rooms
            if len(self.rooms[room]) == 0:
                del self.rooms[room]
                if room in self.room_states:
                    del self.room_states[room]
            
            return peer_id

    async def broadcast(self, room: str, message: dict):
        """Send message to all connections in a room"""
        if room not in self.rooms:
            return
        
        dead_connections = []
        for conn, _ in self.rooms[room]:
            try:
                await conn.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to connection: {e}")
                dead_connections.append(conn)
        
        # Clean up dead connections
        for conn in dead_connections:
            self.disconnect(room, conn)

    async def broadcast_except(self, room: str, exclude_ws: WebSocket, message: dict):
        """Send message to all connections except one"""
        if room not in self.rooms:
            return
        
        dead_connections = []
        for conn, _ in self.rooms[room]:
            if conn != exclude_ws:
                try:
                    await conn.send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to connection: {e}")
                    dead_connections.append(conn)
        
        # Clean up dead connections
        for conn in dead_connections:
            self.disconnect(room, conn)

    async def send_to_peer(self, room: str, peer_id: str, message: dict):
        """Send message to a specific peer"""
        if room not in self.rooms:
            return
        
        for conn, pid in self.rooms[room]:
            if pid == peer_id:
                try:
                    await conn.send_json(message)
                except Exception as e:
                    print(f"Error sending to peer {peer_id}: {e}")
                break
    
    def update_timer_state(self, room: str, is_running: bool, time_left: int):
        """Update the timer state for a room"""
        if room not in self.room_states:
            self.room_states[room] = {}
        self.room_states[room]["isRunning"] = is_running
        self.room_states[room]["timeLeft"] = time_left
        print(f"Updated timer state for room {room}: running={is_running}, time={time_left}")

manager = ConnectionManager()

@router.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str):
    peer_id = None
    await websocket.accept()
    
    try:
        # Wait for join message to get peer ID
        data = await websocket.receive_json()
        if data.get("type") == "join":
            peer_id = data.get("id")
            print(f"Peer {peer_id} attempting to join room {room}")
            await manager.connect(room, websocket, peer_id)
            print(f"Peer {peer_id} successfully joined room {room}")
        else:
            print(f"First message was not 'join', got: {data.get('type')}")
            await websocket.close()
            return
        
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            print(f"Received {msg_type} from {peer_id} in room {room}")

            if msg_type == "chat":
                # Broadcast chat to everyone in the room
                await manager.broadcast(room, {
                    "type": "chat",
                    "text": data.get("text"),
                    "sender": data.get("sender", "Anonymous"),
                    "from": data.get("from") 
                })
                print(f"Broadcasted chat to {len(manager.rooms.get(room, []))} peers")

            elif msg_type == "timer":
                # Update room timer state
                action = data.get("action")
                timer_data = data.get("data", {})
                
                if action == "start":
                    manager.update_timer_state(room, True, timer_data.get("duration", 25 * 60))
                elif action == "pause":
                    manager.update_timer_state(room, False, timer_data.get("timeLeft", 0))
                elif action == "resume":
                    manager.update_timer_state(room, True, timer_data.get("timeLeft", 0))
                elif action == "reset":
                    manager.update_timer_state(room, False, 25 * 60)
                
                # Broadcast timer actions to everyone
                await manager.broadcast(room, {
                    "type": "timer",
                    "action": action,
                    "data": timer_data,
                    "from": data.get("from")
                })

            elif msg_type in ["offer", "answer", "candidate"]:
                # Forward WebRTC signaling to specific peer
                to_peer = data.get("to")
                if to_peer:
                    await manager.send_to_peer(room, to_peer, data)
                else:
                    # If no specific target, broadcast (for backward compatibility)
                    await manager.broadcast(room, data)

            else:
                # Broadcast any other message type
                await manager.broadcast(room, data)
                
    except WebSocketDisconnect:
        print(f"Peer {peer_id} disconnected from room {room}")
        manager.disconnect(room, websocket)
        
        # Notify others about the disconnect
        await manager.broadcast(room, {
            "type": "peer-left",
            "id": peer_id
        })
        
        # Update member count
        room_members = manager.rooms.get(room, [])
        await manager.broadcast(room, {
            "type": "members",
            "count": len(room_members)
        })
    except Exception as e:
        print(f"Error in websocket for peer {peer_id}: {e}")
        import traceback
        traceback.print_exc()
        if peer_id and room:
            manager.disconnect(room, websocket)
            # Update member count after error disconnect
            room_members = manager.rooms.get(room, [])
            if room_members:
                await manager.broadcast(room, {
                    "type": "members",
                    "count": len(room_members)
                })
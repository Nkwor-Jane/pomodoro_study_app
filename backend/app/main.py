from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routes import rooms, chat, ws_chat
from . import websocket

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pomodoro Study App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms.router)
app.include_router(ws_chat.router)
app.include_router(chat.router)
app.include_router(websocket.router)

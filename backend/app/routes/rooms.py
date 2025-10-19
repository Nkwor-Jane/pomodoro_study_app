# Study rooms & Pomodoro
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import schemas, services, database

router = APIRouter(prefix="/rooms", tags=["rooms"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Room)
def create_room(room: schemas.RoomCreate, db: Session = Depends(get_db)):
    return services.create_room(db, room, owner_id=1) 

@router.get("/", response_model=list[schemas.Room])
def list_rooms(db: Session = Depends(get_db)):
    return services.get_rooms(db)

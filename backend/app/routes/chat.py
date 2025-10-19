# Messages
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import schemas, services, database

router = APIRouter(prefix="/chat", tags=["chat"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/{room_id}", response_model=schemas.Message)
def send_message(room_id: int, msg: schemas.MessageCreate, db: Session = Depends(get_db)):
    return services.create_message(db, msg, user_id=1, room_id=room_id)

@router.get("/{room_id}", response_model=list[schemas.Message])
def get_messages(room_id: int, db: Session = Depends(get_db)):
    return services.get_messages(db, room_id)

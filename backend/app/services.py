# Business Logic
from sqlalchemy.orm import Session
from . import models, schemas

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(username=user.username, password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_room(db: Session, room: schemas.RoomCreate, owner_id: int):
    db_room = models.Room(name=room.name, owner_id=owner_id)
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

def create_message(db: Session, message: schemas.MessageCreate, user_id: int, room_id: int):
    db_msg = models.Message(content=message.content, user_id=user_id, room_id=room_id)
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg

def get_rooms(db: Session):
    return db.query(models.Room).all()

def get_messages(db: Session, room_id: int):
    return db.query(models.Message).filter(models.Message.room_id == room_id).all()

### app/routers/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User, UserRole
from ..schemas.user import User as UserSchema
from ..auth.routes import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/doctors", response_model=List[UserSchema])
def get_doctors(db: Session = Depends(get_db)):
    doctors = db.query(User).filter(User.role == UserRole.DOCTOR).all()
    return doctors

@router.get("/me", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

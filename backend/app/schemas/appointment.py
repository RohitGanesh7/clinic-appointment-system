### app/schemas/appointment.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.appointment import AppointmentStatus

class AppointmentBase(BaseModel):
    doctor_id: int
    appointment_date: datetime
    reason: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None

class Appointment(AppointmentBase):
    id: int
    patient_id: int
    status: AppointmentStatus
    notes: Optional[str] = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

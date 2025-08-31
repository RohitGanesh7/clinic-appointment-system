# app/routers/appointments.py - Fixed version

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models.appointment import Appointment, AppointmentStatus
from ..models.user import User, UserRole
from ..schemas.appointment import AppointmentCreate, AppointmentUpdate, Appointment as AppointmentSchema
from ..auth.routes import get_current_user
from ..utils.crew_ai import (
    book_appointment_with_crew,
    confirm_appointment_with_crew,
    get_pending_confirmations
)

router = APIRouter(prefix="/appointments", tags=["Appointments"])

# Pydantic models for CrewAI requests
from pydantic import BaseModel

class CrewAIBookingRequest(BaseModel):
    doctor_id: int
    preferred_date: str  # ISO format datetime string
    reason: str

class DoctorConfirmationRequest(BaseModel):
    appointment_id: int
    action: str  # "confirm" or "reject"
    notes: str = ""

@router.post("/book-with-ai", response_model=Dict[str, Any])
def book_appointment_with_ai(
    booking_request: CrewAIBookingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Book appointment using CrewAI workflow"""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can book appointments")
    
    # Verify doctor exists
    doctor = db.query(User).filter(
        User.id == booking_request.doctor_id,
        User.role == UserRole.DOCTOR
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Use CrewAI to process the booking
    try:
        result = book_appointment_with_crew(
            patient_id=current_user.id,
            doctor_id=booking_request.doctor_id,
            preferred_date=booking_request.preferred_date,
            reason=booking_request.reason,
            db=db  # Pass the database session
        )
        
        if result["success"]:
            return {
                "success": True,
                "message": "Appointment booking processed by AI crew",
                "workflow_status": result["status"],
                "details": result["workflow_result"],
                "next_steps": "Doctor will review and confirm your appointment request"
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        print(f"Error occurred while booking appointment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Booking workflow failed: {str(e)}")

@router.post("/confirm-with-ai", response_model=Dict[str, Any])
def confirm_appointment_with_ai(
    confirmation_request: DoctorConfirmationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm or reject appointment using CrewAI workflow"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can confirm appointments")
    
    # Verify appointment exists and belongs to doctor
    appointment = db.query(Appointment).filter(
        Appointment.id == confirmation_request.appointment_id,
        Appointment.doctor_id == current_user.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or not authorized")
    
    # Use CrewAI to process the confirmation
    try:
        result = confirm_appointment_with_crew(
            appointment_id=confirmation_request.appointment_id,
            doctor_id=current_user.id,
            action=confirmation_request.action,
            notes=confirmation_request.notes,
            db=db  # Pass the database session
        )
        
        if result["success"]:
            return {
                "success": True,
                "message": f"Appointment {confirmation_request.action} processed by AI crew",
                "confirmation_status": result["status"],
                "details": result["confirmation_result"],
                "patient_notified": True
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        print(f"Error occurred while confirming appointment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Confirmation workflow failed: {str(e)}")

@router.get("/pending-confirmations", response_model=List[Dict[str, Any]])
def get_pending_confirmations_for_doctor(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get appointments pending confirmation by the doctor"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can view pending confirmations")
    
    try:
        pending_appointments = get_pending_confirmations(current_user.id, db)
        return pending_appointments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch pending confirmations: {str(e)}")

@router.get("/workflow-status/{appointment_id}", response_model=Dict[str, Any])
def get_appointment_workflow_status(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed workflow status of an appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check authorization
    if current_user.role == UserRole.PATIENT and appointment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this appointment")
    elif current_user.role == UserRole.DOCTOR and appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this appointment")
    
    # Analyze notes to determine workflow status
    notes = appointment.notes or ""
    workflow_status = "unknown"
    
    if "Booking requested" in notes:
        if "CONFIRMED" in notes:
            workflow_status = "confirmed"
        elif "REJECTED" in notes:
            workflow_status = "rejected"
        elif "Scheduled" in notes:
            workflow_status = "scheduled_pending_confirmation"
        else:
            workflow_status = "booking_requested"
    
    # Get patient and doctor info
    patient = db.query(User).filter(User.id == appointment.patient_id).first()
    doctor = db.query(User).filter(User.id == appointment.doctor_id).first()
    
    return {
        "appointment_id": appointment.id,
        "workflow_status": workflow_status,
        "appointment_status": appointment.status.value,
        "patient_name": patient.full_name if patient else "Unknown",
        "doctor_name": doctor.full_name if doctor else "Unknown",
        "appointment_date": appointment.appointment_date.isoformat(),
        "reason": appointment.reason,
        "workflow_history": notes.split(" | ") if notes else [],
        "created_at": appointment.created_at.isoformat() if appointment.created_at else None
    }

# Keep original appointment endpoints for backward compatibility
@router.post("/", response_model=AppointmentSchema)
def create_appointment_traditional(
    appointment: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Traditional appointment booking (without CrewAI)"""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can book appointments")
    
    db_appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        reason=appointment.reason
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.get("/", response_model=List[AppointmentSchema])
def get_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get appointments for current user"""
    if current_user.role == UserRole.DOCTOR:
        appointments = db.query(Appointment).filter(Appointment.doctor_id == current_user.id).all()
    else:
        appointments = db.query(Appointment).filter(Appointment.patient_id == current_user.id).all()
    
    return appointments

@router.put("/{appointment_id}", response_model=AppointmentSchema)
def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Traditional appointment update (without CrewAI)"""
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if current_user.role == UserRole.DOCTOR and db_appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == UserRole.PATIENT and db_appointment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    for field, value in appointment_update.dict(exclude_unset=True).items():
        setattr(db_appointment, field, value)
    
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.get("/doctor/dashboard-summary", response_model=Dict[str, Any])
def get_doctor_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get doctor dashboard summary with CrewAI workflow information"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")
    
    try:
        # Get today's appointments
        from datetime import date
        today = date.today()
        today_appointments = db.query(Appointment).filter(
            Appointment.doctor_id == current_user.id,
            Appointment.appointment_date.date() == today
        ).all()
        
        # Get pending confirmations
        pending = get_pending_confirmations(current_user.id, db)
        
        # Get all appointments for statistics
        all_appointments = db.query(Appointment).filter(
            Appointment.doctor_id == current_user.id
        ).all()
        
        # Calculate statistics
        total_appointments = len(all_appointments)
        completed_appointments = len([a for a in all_appointments if a.status == AppointmentStatus.COMPLETED])
        cancelled_appointments = len([a for a in all_appointments if a.status == AppointmentStatus.CANCELLED])
        
        return {
            "doctor_name": current_user.full_name,
            "today_appointments_count": len(today_appointments),
            "pending_confirmations_count": len(pending),
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "cancelled_appointments": cancelled_appointments,
            "completion_rate": (completed_appointments / total_appointments * 100) if total_appointments > 0 else 0,
            "today_schedule": [
                {
                    "appointment_id": apt.id,
                    "time": apt.appointment_date.strftime("%H:%M"),
                    "patient_id": apt.patient_id,
                    "reason": apt.reason,
                    "status": apt.status.value,
                    "workflow_status": "confirmed" if "CONFIRMED" in (apt.notes or "") else "pending" if "Scheduled" in (apt.notes or "") else "unknown"
                }
                for apt in sorted(today_appointments, key=lambda x: x.appointment_date)
            ],
            "pending_confirmations": pending
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard summary: {str(e)}")

# New endpoint for batch confirmation actions
@router.post("/batch-confirm", response_model=Dict[str, Any])
def batch_confirm_appointments(
    confirmation_requests: List[DoctorConfirmationRequest],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Batch confirm/reject multiple appointments using CrewAI"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can confirm appointments")
    
    results = []
    errors = []
    
    for request in confirmation_requests:
        try:
            # Verify appointment belongs to doctor
            appointment = db.query(Appointment).filter(
                Appointment.id == request.appointment_id,
                Appointment.doctor_id == current_user.id
            ).first()
            
            if not appointment:
                errors.append(f"Appointment {request.appointment_id} not found or not authorized")
                continue
            
            # Process with CrewAI
            result = confirm_appointment_with_crew(
                appointment_id=request.appointment_id,
                doctor_id=current_user.id,
                action=request.action,
                notes=request.notes,
                db=db  # Pass the database session
            )
            
            if result["success"]:
                results.append({
                    "appointment_id": request.appointment_id,
                    "action": request.action,
                    "status": "processed"
                })
            else:
                errors.append(f"Failed to process appointment {request.appointment_id}: {result['error']}")
                
        except Exception as e:
            errors.append(f"Error processing appointment {request.appointment_id}: {str(e)}")
    
    return {
        "success": len(errors) == 0,
        "processed_count": len(results),
        "results": results,
        "errors": errors
    }
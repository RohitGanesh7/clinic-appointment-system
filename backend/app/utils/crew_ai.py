# app/utils/crew_ai.py - Fixed version

from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
from typing import List, Dict, Any, Optional
import openai
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.appointment import Appointment, AppointmentStatus
from ..models.user import User, UserRole
from ..config import OPENAI_API_KEY
import json
from enum import Enum

# Initialize OpenAI
openai.api_key = OPENAI_API_KEY

class BookingStatus(Enum):
    REQUESTED = "requested"
    SCHEDULED = "scheduled" 
    CONFIRMED = "confirmed"
    REJECTED = "rejected"

# Global variable to store database session for tools
_current_db_session = None

def set_db_session(db: Session):
    """Set the current database session for tools to use"""
    global _current_db_session
    _current_db_session = db

def get_db_session() -> Session:
    """Get the current database session"""
    global _current_db_session
    if _current_db_session is None:
        raise RuntimeError("Database session not set. Call set_db_session() first.")
    return _current_db_session

class AppointmentBookingTool(BaseTool):
    """Tool for creating appointment booking requests"""
    
    name: str = "appointment_booking"
    description: str = "Books appointments and creates scheduling requests"
    
    def _run(self, patient_id: int, doctor_id: int, preferred_date: str, 
             reason: str, duration: int = 30) -> str:
        """Create an appointment booking request"""
        try:
            db = get_db_session()
            
            # Convert preferred_date to datetime
            appointment_date = datetime.fromisoformat(preferred_date.replace('Z', '+00:00'))
            
            # Create appointment with REQUESTED status initially
            new_appointment = Appointment(
                patient_id=patient_id,
                doctor_id=doctor_id,
                appointment_date=appointment_date,
                reason=reason,
                status=AppointmentStatus.SCHEDULED,  # We'll manage workflow status separately
                notes=f"Booking requested at {datetime.now().isoformat()}"
            )
            
            db.add(new_appointment)
            db.commit()
            db.refresh(new_appointment)
            
            result = {
                "success": True,
                "appointment_id": new_appointment.id,
                "status": "booking_requested",
                "appointment_date": appointment_date.isoformat(),
                "message": "Appointment booking request created successfully"
            }
            return json.dumps(result)
            
        except Exception as e:
            result = {"success": False, "error": str(e)}
            return json.dumps(result)

class SchedulingTool(BaseTool):
    """Tool for checking doctor availability and scheduling appointments"""
    
    name: str = "scheduling_checker"
    description: str = "Checks doctor availability and schedules appointments"
    
    def _run(self, appointment_id: int, doctor_id: int, proposed_date: str) -> str:
        """Check availability and schedule appointment"""
        try:
            db = get_db_session()
            
            # Get the appointment
            appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
            if not appointment:
                result = {"success": False, "error": "Appointment not found"}
                return json.dumps(result)
            
            # Get doctor info
            doctor = db.query(User).filter(
                User.id == doctor_id, 
                User.role == UserRole.DOCTOR
            ).first()
            if not doctor:
                result = {"success": False, "error": "Doctor not found"}
                return json.dumps(result)
            
            # Check doctor's existing appointments
            proposed_datetime = datetime.fromisoformat(proposed_date.replace('Z', '+00:00'))
            
            # Check for conflicts (1 hour buffer)
            conflict_start = proposed_datetime - timedelta(minutes=30)
            conflict_end = proposed_datetime + timedelta(minutes=30)
            
            conflicting_appointments = db.query(Appointment).filter(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date.between(conflict_start, conflict_end),
                Appointment.status == AppointmentStatus.SCHEDULED,
                Appointment.id != appointment_id
            ).all()
            
            if conflicting_appointments:
                # Suggest alternative times
                alternative_slots = self._suggest_alternatives(
                    doctor_id, proposed_datetime, db
                )
                result = {
                    "success": False,
                    "conflict": True,
                    "message": "Time slot conflicts with existing appointment",
                    "alternative_slots": alternative_slots
                }
                return json.dumps(result)
            
            # Check business hours (8 AM to 6 PM)
            if not (8 <= proposed_datetime.hour < 18):
                result = {
                    "success": False,
                    "error": "Appointment time outside business hours (8 AM - 6 PM)"
                }
                return json.dumps(result)
            
            # Check if it's a working day (Monday to Saturday)
            if proposed_datetime.weekday() == 6:  # Sunday
                result = {
                    "success": False,
                    "error": "Appointments not available on Sundays"
                }
                return json.dumps(result)
            
            # Update appointment as scheduled
            appointment.appointment_date = proposed_datetime
            appointment.notes += f" | Scheduled at {datetime.now().isoformat()}"
            db.commit()
            
            result = {
                "success": True,
                "status": "scheduled",
                "appointment_id": appointment_id,
                "scheduled_time": proposed_datetime.isoformat(),
                "doctor_name": doctor.full_name,
                "message": "Appointment successfully scheduled"
            }
            return json.dumps(result)
            
        except Exception as e:
            result = {"success": False, "error": str(e)}
            return json.dumps(result)
    
    def _suggest_alternatives(self, doctor_id: int, preferred_date: datetime, 
                            db: Session, num_suggestions: int = 3) -> List[Dict]:
        """Suggest alternative appointment times"""
        alternatives = []
        base_date = preferred_date.replace(hour=8, minute=0, second=0, microsecond=0)
        
        for days_offset in range(0, 7):  # Check next 7 days
            check_date = base_date + timedelta(days=days_offset)
            if check_date.weekday() == 6:  # Skip Sundays
                continue
                
            for hour in range(8, 18):  # 8 AM to 6 PM
                for minute in [0, 30]:  # 30-minute slots
                    slot_time = check_date.replace(hour=hour, minute=minute)
                    
                    # Skip if it's in the past
                    if slot_time <= datetime.now():
                        continue
                    
                    # Check for conflicts
                    conflict_start = slot_time - timedelta(minutes=15)
                    conflict_end = slot_time + timedelta(minutes=45)
                    
                    conflicts = db.query(Appointment).filter(
                        Appointment.doctor_id == doctor_id,
                        Appointment.appointment_date.between(conflict_start, conflict_end),
                        Appointment.status == AppointmentStatus.SCHEDULED
                    ).count()
                    
                    if conflicts == 0:
                        alternatives.append({
                            "datetime": slot_time.isoformat(),
                            "display": slot_time.strftime("%A, %B %d at %I:%M %p")
                        })
                        
                        if len(alternatives) >= num_suggestions:
                            return alternatives
        
        return alternatives

class DoctorConfirmationTool(BaseTool):
    """Tool for doctor confirmation workflow"""
    
    name: str = "doctor_confirmation"
    description: str = "Handles doctor confirmation of appointments"
    
    def _run(self, appointment_id: int, doctor_id: int, action: str, 
             notes: str = "") -> str:
        """Handle doctor confirmation or rejection"""
        try:
            db = get_db_session()
            
            # Get appointment
            appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
            if not appointment:
                result = {"success": False, "error": "Appointment not found"}
                return json.dumps(result)
            
            # Verify doctor ownership
            if appointment.doctor_id != doctor_id:
                result = {"success": False, "error": "Unauthorized: Not your appointment"}
                return json.dumps(result)
            
            # Get patient info
            patient = db.query(User).filter(User.id == appointment.patient_id).first()
            
            if action.lower() == "confirm":
                appointment.notes += f" | CONFIRMED by doctor at {datetime.now().isoformat()}"
                if notes:
                    appointment.notes += f" | Doctor notes: {notes}"
                
                status_message = "Appointment confirmed by doctor"
                confirmation_status = "confirmed"
                
            elif action.lower() == "reject":
                appointment.status = AppointmentStatus.CANCELLED
                appointment.notes += f" | REJECTED by doctor at {datetime.now().isoformat()}"
                if notes:
                    appointment.notes += f" | Rejection reason: {notes}"
                
                status_message = "Appointment rejected by doctor"
                confirmation_status = "rejected"
                
            else:
                result = {"success": False, "error": "Invalid action. Use 'confirm' or 'reject'"}
                return json.dumps(result)
            
            db.commit()
            
            result = {
                "success": True,
                "appointment_id": appointment_id,
                "action": action,
                "status": confirmation_status,
                "patient_name": patient.full_name if patient else "Unknown",
                "appointment_time": appointment.appointment_date.isoformat(),
                "message": status_message,
                "doctor_notes": notes
            }
            return json.dumps(result)
            
        except Exception as e:
            result = {"success": False, "error": str(e)}
            return json.dumps(result)

class NotificationTool(BaseTool):
    """Tool for sending notifications to patients and doctors"""
    
    name: str = "notification_sender"
    description: str = "Sends notifications about appointment status changes"
    
    def _run(self, appointment_id: int, recipient_type: str, message_type: str) -> str:
        """Send notifications (simulated - in real app would integrate with email/SMS)"""
        try:
            db = get_db_session()
            
            appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
            if not appointment:
                result = {"success": False, "error": "Appointment not found"}
                return json.dumps(result)
            
            patient = db.query(User).filter(User.id == appointment.patient_id).first()
            doctor = db.query(User).filter(User.id == appointment.doctor_id).first()
            
            notifications = []
            
            if recipient_type in ["patient", "both"]:
                patient_message = self._generate_patient_notification(
                    message_type, appointment, doctor
                )
                notifications.append({
                    "recipient": patient.email if patient else "unknown",
                    "recipient_type": "patient",
                    "message": patient_message,
                    "sent_at": datetime.now().isoformat()
                })
            
            if recipient_type in ["doctor", "both"]:
                doctor_message = self._generate_doctor_notification(
                    message_type, appointment, patient
                )
                notifications.append({
                    "recipient": doctor.email if doctor else "unknown",
                    "recipient_type": "doctor", 
                    "message": doctor_message,
                    "sent_at": datetime.now().isoformat()
                })
            
            result = {
                "success": True,
                "notifications_sent": len(notifications),
                "notifications": notifications
            }
            return json.dumps(result)
            
        except Exception as e:
            result = {"success": False, "error": str(e)}
            return json.dumps(result)
    
    def _generate_patient_notification(self, message_type: str, appointment: Appointment, doctor: User) -> str:
        """Generate patient notification message"""
        messages = {
            "booking_requested": f"Your appointment request with Dr. {doctor.full_name if doctor else 'Unknown'} has been submitted and is being processed.",
            "scheduled": f"Your appointment with Dr. {doctor.full_name if doctor else 'Unknown'} has been scheduled for {appointment.appointment_date.strftime('%A, %B %d at %I:%M %p')}.",
            "confirmed": f"Your appointment with Dr. {doctor.full_name if doctor else 'Unknown'} on {appointment.appointment_date.strftime('%A, %B %d at %I:%M %p')} has been confirmed.",
            "rejected": f"Unfortunately, your appointment request with Dr. {doctor.full_name if doctor else 'Unknown'} could not be accommodated. Please contact us to reschedule."
        }
        return messages.get(message_type, "Appointment status update")
    
    def _generate_doctor_notification(self, message_type: str, appointment: Appointment, patient: User) -> str:
        """Generate doctor notification message"""
        messages = {
            "booking_requested": f"New appointment request from {patient.full_name if patient else 'Unknown Patient'} for {appointment.appointment_date.strftime('%A, %B %d at %I:%M %p')}. Please review and confirm.",
            "scheduled": f"Appointment scheduled with {patient.full_name if patient else 'Unknown Patient'} for {appointment.appointment_date.strftime('%A, %B %d at %I:%M %p')}.",
            "confirmed": f"You have confirmed the appointment with {patient.full_name if patient else 'Unknown Patient'} on {appointment.appointment_date.strftime('%A, %B %d at %I:%M %p')}.",
            "rejected": f"You have rejected the appointment request from {patient.full_name if patient else 'Unknown Patient'}."
        }
        return messages.get(message_type, "Appointment status update")

# Define AI Agents for Booking Workflow
def create_booking_agent():
    """Create booking request agent"""
    return Agent(
        role='Appointment Booking Coordinator',
        goal='Process patient appointment requests and create initial bookings',
        backstory="""You are a professional appointment booking coordinator with years of 
        experience in healthcare administration. You handle patient requests with care and 
        attention to detail, ensuring all necessary information is captured.""",
        tools=[AppointmentBookingTool()],
        verbose=True,
        allow_delegation=True
    )

def create_scheduling_agent():
    """Create scheduling agent"""
    return Agent(
        role='Medical Scheduler',
        goal='Check doctor availability and schedule appointments optimally',
        backstory="""You are an expert medical scheduler who understands doctor availability 
        patterns and patient needs. You work efficiently to find the best appointment slots 
        while avoiding conflicts and maintaining optimal scheduling.""",
        tools=[SchedulingTool()],
        verbose=True,
        allow_delegation=True
    )

def create_confirmation_agent():
    """Create confirmation agent"""
    return Agent(
        role='Doctor Confirmation Coordinator',
        goal='Facilitate doctor confirmation of appointments and handle responses',
        backstory="""You are a coordination specialist who manages the communication between 
        the scheduling system and doctors. You ensure doctors can easily review and confirm 
        appointments while maintaining professional workflow.""",
        tools=[DoctorConfirmationTool()],
        verbose=True,
        allow_delegation=True
    )

def create_notification_agent():
    """Create notification agent"""
    return Agent(
        role='Communication Specialist',
        goal='Send timely and clear notifications to patients and doctors about appointment status',
        backstory="""You are a healthcare communication specialist who ensures all parties 
        are informed about appointment changes. You craft clear, professional messages that 
        keep everyone updated on appointment status.""",
        tools=[NotificationTool()],
        verbose=True,
        allow_delegation=False
    )

class AppointmentBookingCrew:
    """Main crew for handling complete appointment booking workflow"""
    
    def __init__(self):
        self.booking_agent = create_booking_agent()
        self.scheduling_agent = create_scheduling_agent()
        self.confirmation_agent = create_confirmation_agent()
        self.notification_agent = create_notification_agent()
    
    def process_appointment_booking(self, patient_id: int, doctor_id: int, 
                                  preferred_date: str, reason: str, 
                                  db: Session) -> Dict[str, Any]:
        """Complete appointment booking workflow"""
        
        # Set the database session for tools to use
        set_db_session(db)
        
        # Task 1: Create booking request
        booking_task = Task(
            description=f"""
            Create an appointment booking request with the following details:
            - Patient ID: {patient_id}
            - Doctor ID: {doctor_id}
            - Preferred Date: {preferred_date}
            - Reason: {reason}
            
            Use the appointment_booking tool to process the booking request and create the initial appointment record.
            Return the result as JSON.
            """,
            agent=self.booking_agent,
            expected_output="JSON result with booking request status and appointment ID"
        )
        
        # Task 2: Schedule the appointment
        scheduling_task = Task(
            description=f"""
            Check doctor availability and schedule the appointment:
            - Use the appointment ID from the previous booking task result
            - Verify doctor availability for the requested time
            - Check for scheduling conflicts
            - If conflicts exist, suggest alternative times
            - If available, confirm the scheduling
            
            Use the scheduling_checker tool with the appointment details.
            """,
            agent=self.scheduling_agent,
            expected_output="JSON result with scheduling status and confirmation details"
        )
        
        # Task 3: Send initial notifications
        initial_notification_task = Task(
            description=f"""
            Send initial notifications about the appointment:
            - Use the appointment ID from the previous tasks
            - Send notification to patient that booking request has been processed
            - Send notification to doctor about new appointment requiring confirmation
            
            Use the notification_sender tool to send appropriate messages.
            """,
            agent=self.notification_agent,
            expected_output="JSON result with notification status"
        )
        
        # Create and run the crew
        crew = Crew(
            agents=[self.booking_agent, self.scheduling_agent, self.notification_agent],
            tasks=[booking_task, scheduling_task, initial_notification_task],
            process=Process.sequential,
            verbose=True
        )
        
        try:
            result = crew.kickoff()
            return {
                "success": True,
                "workflow_result": str(result),
                "status": "appointment_scheduled_pending_confirmation",
                "message": "Appointment booking workflow completed successfully"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def process_doctor_confirmation(self, appointment_id: int, doctor_id: int, 
                                   action: str, db: Session, notes: str = "") -> Dict[str, Any]:
        """Handle doctor confirmation workflow"""
        
        # Set the database session for tools to use
        set_db_session(db)
        
        # Task 1: Process doctor response
        confirmation_task = Task(
            description=f"""
            Process doctor confirmation for appointment:
            - Appointment ID: {appointment_id}
            - Doctor ID: {doctor_id}
            - Action: {action}
            - Notes: {notes}
            
            Use the doctor_confirmation tool to handle the doctor's response and update appointment status accordingly.
            """,
            agent=self.confirmation_agent,
            expected_output="JSON result with confirmation processing status"
        )
        
        # Task 2: Send confirmation notifications
        confirmation_notification_task = Task(
            description=f"""
            Send confirmation notifications:
            - Use the appointment ID: {appointment_id}
            - Notify patient about appointment confirmation status
            - Send confirmation receipt to doctor
            - Include any relevant notes or next steps
            
            Use the notification_sender tool to send appropriate messages.
            """,
            agent=self.notification_agent,
            expected_output="JSON result with notification status"
        )
        
        # Create and run the crew
        crew = Crew(
            agents=[self.confirmation_agent, self.notification_agent],
            tasks=[confirmation_task, confirmation_notification_task],
            process=Process.sequential,
            verbose=True
        )
        
        try:
            result = crew.kickoff()
            return {
                "success": True,
                "confirmation_result": str(result),
                "status": "confirmation_completed",
                "message": "Doctor confirmation workflow completed successfully"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

# Updated utility functions for FastAPI integration
def book_appointment_with_crew(patient_id: int, doctor_id: int, preferred_date: str, 
                              reason: str, db: Session) -> Dict[str, Any]:
    """Book appointment using CrewAI workflow"""
    crew = AppointmentBookingCrew()
    return crew.process_appointment_booking(patient_id, doctor_id, preferred_date, reason, db)


def confirm_appointment_with_crew(appointment_id: int, doctor_id: int, action: str, 
                                 db: Session, notes: str = "") -> Dict[str, Any]:
    """Confirm appointment using CrewAI workflow"""
    crew = AppointmentBookingCrew()
    return crew.process_doctor_confirmation(appointment_id, doctor_id, action, db, notes)
def get_pending_confirmations(doctor_id: int, db: Session) -> List[Dict[str, Any]]:
    """Get appointments pending doctor confirmation"""
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status == AppointmentStatus.SCHEDULED,
        Appointment.notes.like('%Scheduled at%'),
        ~Appointment.notes.like('%CONFIRMED%'),
        ~Appointment.notes.like('%REJECTED%')
    ).all()
    
    pending = []
    for apt in appointments:
        patient = db.query(User).filter(User.id == apt.patient_id).first()
        pending.append({
            "appointment_id": apt.id,
            "patient_name": patient.full_name if patient else "Unknown",
            "patient_email": patient.email if patient else "unknown@email.com",
            "appointment_date": apt.appointment_date.isoformat(),
            "reason": apt.reason,
            "created_at": apt.created_at.isoformat() if apt.created_at else None
        })
    
    return pending

# Export main functions
__all__ = [
    'AppointmentBookingCrew',
    'book_appointment_with_crew',
    'confirm_appointment_with_crew', 
    'get_pending_confirmations'
]
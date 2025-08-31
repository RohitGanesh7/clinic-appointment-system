🏥 AI-Powered Clinic Appointment System
A comprehensive clinic appointment management system built with FastAPI, React, PostgreSQL, and CrewAI for intelligent appointment scheduling and workflow automation.


🚀 Features
🤖 AI-Powered Workflow

Smart Appointment Scheduling - CrewAI agents find optimal time slots
Symptom Analysis - AI analyzes patient symptoms for better care
Automatic Notifications - Intelligent messaging system for patients and doctors
Doctor Confirmation Workflow - Seamless booking → scheduling → confirmation process
Workload Optimization - AI balances doctor schedules for maximum efficiency

👨‍⚕️ For Doctors

AI Dashboard - Real-time overview of appointments and pending confirmations
One-Click Confirmations - Quick approve/reject AI-processed appointments
Batch Processing - Handle multiple appointments simultaneously
Workflow Timeline - Complete audit trail of AI processing
Schedule Optimization - AI recommendations for better time management

👤 For Patients

AI Booking Assistant - Intelligent appointment scheduling with symptom analysis
Real-Time Status Updates - Track appointment progress through AI workflow
Smart Notifications - Automated updates on appointment status
Dual Booking Options - Choose between AI-powered or standard booking
Medical History - View past appointments and treatment notes

🎨 Modern UI/UX

Responsive Design - Works seamlessly on desktop, tablet, and mobile
Medical Theme - Professional healthcare-focused interface
Real-Time Updates - Live status indicators and notifications
Accessibility - WCAG compliant design for all users


🚀 Quick Start
1. Clone the Repository

git clone https://github.com/yourusername/clinic-appointment-system.git
cd clinic-appointment-system

2. Backend Setup

# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database (interactive)
python setup_database.py

# Or create .env file manually:
cp .env.example .env
# Edit .env with your database credentials and OpenAI API key


3. Frontend Setup

# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start


4. Start the Application

# Terminal 1 - Backend
cd backend
python -m app.main

# Terminal 2 - Frontend (new terminal)
cd frontend
npm start


🤖 AI Configuration
OpenAI Setup

Get your API key from OpenAI
Add to .env file:

OPENAI_API_KEY=sk-your-openai-api-key-here


CrewAI Agents
The system includes specialized AI agents:

Booking Agent - Handles appointment requests
Scheduling Agent - Manages doctor availability
Confirmation Agent - Processes doctor approvals
Notification Agent - Sends intelligent updates

📚 API Documentation
Once the backend is running, visit:

Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc

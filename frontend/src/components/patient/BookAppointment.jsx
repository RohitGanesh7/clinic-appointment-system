// Updated BookAppointment component with CrewAI integration
// src/components/patient/BookAppointmentAI.jsx

import React, { useState, useEffect } from 'react';
import { userAPI, appointmentAPI } from '../../services/api';

const BookAppointmentAI = ({ onClose, onSuccess }) => {
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctor_id: '',
    preferred_date: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await userAPI.getDoctors();
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Use CrewAI booking endpoint
      const response = await appointmentAPI.bookWithAI({
        doctor_id: parseInt(formData.doctor_id),
        preferred_date: formData.preferred_date,
        reason: formData.reason
      });

      if (response.data.success) {
        setWorkflowStatus({
          status: 'success',
          message: response.data.message,
          workflowStatus: response.data.workflow_status,
          nextSteps: response.data.next_steps
        });
        
        // Auto close after showing success for 3 seconds
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error) {
      setWorkflowStatus({
        status: 'error',
        message: error.response?.data?.detail || 'Failed to book appointment. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (workflowStatus) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
          <div className="text-center">
            {workflowStatus.status === 'success' ? (
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🤖 AI Booking Successful!
                </h3>
                <p className="text-gray-600 mb-4">{workflowStatus.message}</p>
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Status:</strong> {workflowStatus.workflowStatus}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {workflowStatus.nextSteps}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Failed</h3>
                <p className="text-gray-600">{workflowStatus.message}</p>
              </div>
            )}
            
            <button
              onClick={workflowStatus.status === 'success' ? onSuccess : () => setWorkflowStatus(null)}
              className="btn-primary w-full"
            >
              {workflowStatus.status === 'success' ? 'Continue' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">🤖 AI-Powered Booking</h2>
            <p className="text-sm text-gray-600">Let AI handle your appointment scheduling</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Doctor
            </label>
            <select
              className="input-field"
              value={formData.doctor_id}
              onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
              required
            >
              <option value="">Choose a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Date & Time
            </label>
            <input
              type="datetime-local"
              className="input-field"
              value={formData.preferred_date}
              onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Visit
            </label>
            <textarea
              className="input-field h-24 resize-none"
              placeholder="Describe your symptoms or reason for visit (AI will analyze this)"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              required
            />
            <p className="text-xs text-blue-600 mt-1">
              💡 Our AI will analyze your symptoms and optimize scheduling
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-1">AI Workflow Process:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>✓ AI analyzes your request and symptoms</li>
              <li>✓ Checks doctor availability and schedules optimally</li>
              <li>✓ Sends notifications to you and the doctor</li>
              <li>✓ Doctor reviews and confirms the appointment</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary relative"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  AI Processing...
                </div>
              ) : (
                '🤖 Book with AI'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointmentAI;


import React, { useState, useEffect } from 'react';
import { appointmentAPI, showToast, apiUtils } from '../../services/api';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    fetchAppointments();
    fetchPendingConfirmations();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getAll();
      setAppointments(response.data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingConfirmations = async () => {
    try {
      const response = await appointmentAPI.getPendingConfirmations();
      setPendingConfirmations(response.data);
    } catch (error) {
      console.error('Failed to fetch pending confirmations:', error);
    }
  };

  const handleConfirmation = async (appointmentId, action, notes = '') => {
    setProcessingIds(prev => new Set([...prev, appointmentId]));
    
    try {
      const response = await appointmentAPI.confirmWithAI({
        appointment_id: appointmentId,
        action: action,
        notes: notes
      });

      if (response.data?.success) {
        // Remove from pending list
        setPendingConfirmations(prev => 
          prev.filter(apt => apt.appointment_id !== appointmentId)
        );
        
        // Refresh appointments
        fetchAppointments();
        
        showToast.success(`Appointment ${action}ed successfully! Patient has been notified.`);
      }
    } catch (error) {
      showToast.error(`Failed to ${action} appointment: ${error.response?.data?.detail || error.message}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const updateAppointmentStatus = async (appointmentId, status, notes = '') => {
    try {
      await appointmentAPI.update(appointmentId, { status, notes });
      fetchAppointments();
      showToast.success('Appointment updated successfully!');
    } catch (error) {
      showToast.error('Failed to update appointment.');
    }
  };

  const handleAddNotes = (appointmentId) => {
    const notes = prompt('Add notes for this appointment:');
    if (notes) {
      updateAppointmentStatus(appointmentId, 'completed', notes);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    const aptDate = new Date(apt.appointment_date).toDateString();
    return today === aptDate;
  });

  const upcomingAppointments = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.appointment_date);
    return aptDate > today && apt.status === 'scheduled';
  });

  const getStatusIcon = (appointment) => {
    const notes = appointment.notes || '';
    if (notes.includes('CONFIRMED')) return '✅';
    if (notes.includes('REJECTED')) return '❌';
    if (notes.includes('Scheduled')) return '⏳';
    return '📝';
  };

  const getWorkflowStatus = (appointment) => {
    const notes = appointment.notes || '';
    if (notes.includes('CONFIRMED')) return { text: 'Confirmed', color: 'text-green-600' };
    if (notes.includes('REJECTED')) return { text: 'Rejected', color: 'text-red-600' };
    if (notes.includes('Scheduled')) return { text: 'Pending Confirmation', color: 'text-yellow-600' };
    return { text: 'Standard', color: 'text-gray-600' };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🤖 AI Doctor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your patient appointments with AI assistance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Appointments</h3>
            <p className="text-3xl font-bold text-blue-600">{todayAppointments.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🤖 Pending Confirmations</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingConfirmations.length}</p>
            <p className="text-sm text-gray-500">AI processed</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upcoming</h3>
            <p className="text-3xl font-bold text-orange-600">{upcomingAppointments.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
            <p className="text-3xl font-bold text-purple-600">
              {appointments.filter(a => a.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* AI Pending Confirmations Section */}
        {pendingConfirmations.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-sm p-6 mb-8 border-l-4 border-yellow-500">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">🤖 AI Appointment Confirmations</h2>
                <p className="text-gray-600">{pendingConfirmations.length} appointments waiting for your confirmation</p>
              </div>
            </div>

            <div className="space-y-4">
              {pendingConfirmations.map((appointment) => (
                <div key={appointment.appointment_id} className="bg-white border border-yellow-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">⏳</span>
                        <h3 className="font-medium text-gray-900">
                          {appointment.patient_name}
                        </h3>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          AI Processed - Pending Your Confirmation
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1 ml-8">
                        <p>
                          📅 <strong>Date:</strong> {' '}
                          {new Date(appointment.appointment_date).toLocaleDateString()} at {' '}
                          {new Date(appointment.appointment_date).toLocaleTimeString()}
                        </p>
                        <p>📧 <strong>Patient:</strong> {appointment.patient_email}</p>
                        <p>📝 <strong>Reason:</strong> {appointment.reason}</p>
                        <p className="text-xs text-blue-600">
                          🤖 AI has verified availability and scheduled this appointment
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-8">
                    <button
                      onClick={() => {
                        const notes = prompt('Add confirmation notes (optional):');
                        handleConfirmation(appointment.appointment_id, 'confirm', notes || '');
                      }}
                      disabled={processingIds.has(appointment.appointment_id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingIds.has(appointment.appointment_id) ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        '✅ Confirm Appointment'
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection:');
                        if (reason) {
                          handleConfirmation(appointment.appointment_id, 'reject', reason);
                        }
                      }}
                      disabled={processingIds.has(appointment.appointment_id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Today's Schedule</h2>
            {todayAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No appointments today</p>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => {
                  const workflowStatus = getWorkflowStatus(appointment);
                  return (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getStatusIcon(appointment)}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Patient #{appointment.patient_id}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(appointment.appointment_date).toLocaleTimeString()}
                            </p>
                            <span className={`text-xs ${workflowStatus.color}`}>
                              {workflowStatus.text}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                      
                      {appointment.reason && (
                        <p className="text-sm text-gray-600 mb-3 ml-11">
                          <strong>Reason:</strong> {appointment.reason}
                        </p>
                      )}
                      
                      {appointment.status === 'scheduled' && workflowStatus.text === 'Confirmed' && (
                        <div className="flex space-x-2 ml-11">
                          <button
                            onClick={() => handleAddNotes(appointment.id)}
                            className="text-sm btn-primary"
                          >
                            Complete Visit
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                            className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      
                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded ml-11">
                          <p className="text-sm"><strong>Notes:</strong> {appointment.notes}</p>
                        </div>
                      )}

                      {/* AI Workflow Timeline */}
                      {appointment.notes && appointment.notes.includes('AI') && (
                        <div className="mt-3 ml-11 border-l-2 border-blue-200 pl-3">
                          <p className="text-xs text-blue-600 font-medium mb-1">🤖 AI Workflow:</p>
                          {appointment.notes.split(' | ').map((note, index) => (
                            <p key={index} className="text-xs text-gray-500">
                              • {note}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Appointments</h2>
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {upcomingAppointments.slice(0, 10).map((appointment) => {
                  const workflowStatus = getWorkflowStatus(appointment);
                  return (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getStatusIcon(appointment)}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Patient #{appointment.patient_id}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(appointment.appointment_date).toLocaleDateString()} at {' '}
                              {new Date(appointment.appointment_date).toLocaleTimeString()}
                            </p>
                            <span className={`text-xs ${workflowStatus.color}`}>
                              {workflowStatus.text}
                            </span>
                            {appointment.reason && (
                              <p className="text-sm text-gray-600 mt-1">
                                {appointment.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* AI System Status */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">🤖 CrewAI System Status</h3>
              <p className="text-blue-100">
                AI agents are actively managing appointment workflows and notifications.
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Active</span>
              </div>
              <p className="text-xs text-blue-200 mt-1">
                Pending: {pendingConfirmations.length} | Active: {appointments.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
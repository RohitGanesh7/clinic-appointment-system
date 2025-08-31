import React, { useState, useEffect } from 'react';
import { appointmentAPI, showToast } from '../../services/api';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed
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
        setPendingConfirmations(prev => 
          prev.filter(apt => apt.appointment_id !== appointmentId)
        );
        fetchAppointments();
        showToast.success(`Appointment ${action}ed successfully!`);
      }
    } catch (error) {
      showToast.error(`Failed to ${action} appointment`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (appointment) => {
    const notes = appointment.notes || '';
    if (notes.includes('CONFIRMED')) return '✅';
    if (notes.includes('REJECTED')) return '❌';
    if (notes.includes('Scheduled')) return '⏳';
    return '📝';
  };

  const getWorkflowStatus = (appointment) => {
    const notes = appointment.notes || '';
    if (notes.includes('CONFIRMED')) return 'confirmed';
    if (notes.includes('REJECTED')) return 'rejected';
    if (notes.includes('Scheduled')) return 'pending';
    return 'standard';
  };

  const filteredAppointments = appointments.filter(appointment => {
    const workflowStatus = getWorkflowStatus(appointment);
    if (filter === 'all') return true;
    if (filter === 'pending') return workflowStatus === 'pending';
    if (filter === 'confirmed') return workflowStatus === 'confirmed';
    if (filter === 'completed') return appointment.status === 'completed';
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🤖 AI Appointment Management</h1>
          <p className="text-gray-600 mt-2">Manage all appointments with AI workflow integration</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'all', name: 'All Appointments', count: appointments.length },
                { id: 'pending', name: '⏳ Pending Confirmation', count: pendingConfirmations.length },
                { id: 'confirmed', name: '✅ Confirmed', count: appointments.filter(a => getWorkflowStatus(a) === 'confirmed').length },
                { id: 'completed', name: '🏁 Completed', count: appointments.filter(a => a.status === 'completed').length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    filter === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.name}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Pending Confirmations Section (when filter is 'pending' or there are pending items) */}
        {(filter === 'pending' || (filter === 'all' && pendingConfirmations.length > 0)) && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-sm p-6 mb-6 border-l-4 border-yellow-500">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🤖 AI Pending Confirmations</h2>
            {pendingConfirmations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending confirmations</p>
            ) : (
              <div className="space-y-4">
                {pendingConfirmations.map((appointment) => (
                  <div key={appointment.appointment_id} className="bg-white border border-yellow-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">⏳</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{appointment.patient_name}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(appointment.appointment_date).toLocaleString()}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            AI Processed
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 ml-11">
                          <strong>Reason:</strong> {appointment.reason}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleConfirmation(appointment.appointment_id, 'confirm')}
                          disabled={processingIds.has(appointment.appointment_id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {processingIds.has(appointment.appointment_id) ? 'Processing...' : '✅ Confirm'}
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for rejection:');
                            if (reason) handleConfirmation(appointment.appointment_id, 'reject', reason);
                          }}
                          disabled={processingIds.has(appointment.appointment_id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Appointments List */}
        {filter !== 'pending' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {filter === 'all' ? 'All Appointments' : 
               filter === 'confirmed' ? 'Confirmed Appointments' :
               filter === 'completed' ? 'Completed Appointments' : 'Appointments'}
            </h2>
            
            {filteredAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No appointments found</p>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => {
                  const workflowStatus = getWorkflowStatus(appointment);
                  return (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="text-2xl">{getStatusIcon(appointment)}</span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-gray-900">
                                Appointment #{appointment.id} - Patient #{appointment.patient_id}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                workflowStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                                workflowStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                workflowStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {workflowStatus === 'confirmed' ? 'AI Confirmed' :
                                 workflowStatus === 'pending' ? 'AI Pending' :
                                 workflowStatus === 'rejected' ? 'AI Rejected' : 'Standard'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(appointment.appointment_date).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Reason:</strong> {appointment.reason}
                            </p>
                            
                            {/* AI Workflow Info */}
                            {appointment.notes && appointment.notes.includes('AI') && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                <p className="text-blue-700 font-medium">🤖 AI Workflow History:</p>
                                <div className="mt-1 space-y-1">
                                  {appointment.notes.split(' | ').map((note, index) => (
                                    <p key={index} className="text-blue-600">• {note}</p>
                                  ))}
                                </div>
                              </div>
                            )}
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default AppointmentList;
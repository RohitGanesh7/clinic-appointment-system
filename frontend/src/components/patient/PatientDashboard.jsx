
import React, { useState, useEffect } from 'react';
import { appointmentAPI } from '../../services/api';
import BookAppointment from './BookAppointment';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
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

  const handleAppointmentBooked = () => {
    setShowBooking(false);
    fetchAppointments();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your appointments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Your Appointments</h2>
                <button
                  onClick={() => setShowBooking(true)}
                  className="btn-primary"
                >
                  Book Appointment
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No appointments yet. Book your first appointment!
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Appointment #{appointment.id}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(appointment.appointment_date).toLocaleString()}
                          </p>
                          {appointment.reason && (
                            <p className="text-sm text-gray-600 mt-1">
                              Reason: {appointment.reason}
                            </p>
                          )}
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
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Appointments</span>
                  <span className="font-medium">{appointments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Upcoming</span>
                  <span className="font-medium text-blue-600">
                    {appointments.filter(a => a.status === 'scheduled').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">
                    {appointments.filter(a => a.status === 'completed').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showBooking && (
          <BookAppointment 
            onClose={() => setShowBooking(false)}
            onSuccess={handleAppointmentBooked}
          />
        )}
      </div>
    </div>
  );
};
export default PatientDashboard;
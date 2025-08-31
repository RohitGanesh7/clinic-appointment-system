import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthService } from '../../services/auth';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = AuthService.getUser();

  const doctorMenuItems = [
    {
      name: 'Dashboard',
      path: '/doctor-dashboard',
      icon: '📊'
    },
    {
      name: 'Appointments',
      path: '/doctor-appointments',
      icon: '📅'
    },
    {
      name: 'Patients',
      path: '/doctor-patients',
      icon: '👥'
    },
    {
      name: 'Schedule',
      path: '/doctor-schedule',
      icon: '⏰'
    }
  ];

  const patientMenuItems = [
    {
      name: 'Dashboard',
      path: '/patient-dashboard',
      icon: '📊'
    },
    {
      name: 'My Appointments',
      path: '/patient-appointments',
      icon: '📅'
    },
    {
      name: 'Book Appointment',
      path: '/book-appointment',
      icon: '➕'
    },
    {
      name: 'Medical History',
      path: '/medical-history',
      icon: '📋'
    }
  ];

  const menuItems = user?.role === 'doctor' ? doctorMenuItems : patientMenuItems;

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-white shadow-lg h-full w-64 fixed left-0 top-16 z-40 border-r border-gray-200">
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                isActive(item.path)
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <button
            onClick={() => {
              AuthService.logout();
              navigate('/login');
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gray-50 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">Quick Action</p>
          {user?.role === 'patient' ? (
            <button
              onClick={() => navigate('/book-appointment')}
              className="w-full btn-primary text-sm py-2"
            >
              Book Appointment
            </button>
          ) : (
            <button
              onClick={() => navigate('/doctor-dashboard')}
              className="w-full btn-primary text-sm py-2"
            >
              View Today's Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
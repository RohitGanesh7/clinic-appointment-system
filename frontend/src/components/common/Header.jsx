
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/auth';

const Header = () => {
  const navigate = useNavigate();
  const user = AuthService.getUser();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">
              MediCare Clinic
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.full_name}
            </span>
            <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { AuthService } from '../../services/auth';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isAuthenticated = AuthService.isAuthenticated();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Sidebar */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {sidebarOpen && <Sidebar />}
      </div>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} pt-16`}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 right-6 lg:hidden bg-primary-500 text-white p-3 rounded-full shadow-lg z-50 hover:bg-primary-600 transition-colors"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Floating Action Button for Quick Actions */}
      <div className="fixed bottom-6 left-6 z-40">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>System Online</span>
          </div>
        </div>
      </div>

      {/* Notification Toast Container */}
      <div id="toast-container" className="fixed top-20 right-6 z-50 space-y-2">
        {/* Toast notifications will be rendered here */}
      </div>
    </div>
  );
};

export default Layout;
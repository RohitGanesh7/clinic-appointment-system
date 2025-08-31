
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthService } from './services/auth';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PatientDashboard from './components/patient/PatientDashboard';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import Header from './components/common/Header';

const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  const user = AuthService.getUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
};

function App() {
  const isAuthenticated = AuthService.isAuthenticated();
  const user = AuthService.getUser();

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                user?.role === 'doctor' ? 
                <Navigate to="/doctor-dashboard" /> : 
                <Navigate to="/patient-dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/patient-dashboard" 
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor-dashboard" 
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

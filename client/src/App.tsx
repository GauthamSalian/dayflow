import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

// Simple Route Protection wrapper
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) => {
  const sessionUser = localStorage.getItem('user');
  
  if (!sessionUser) {
    return <Navigate to="/login" replace />;
  }
  
  const user = JSON.parse(sessionUser);
  if (user.role !== allowedRole) {
    // Redirect wrong roles to their respective correct dashboards
    return user.role === 'ADMIN' ? <Navigate to="/dashboard" replace /> : <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Employee Routes */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute allowedRole="EMPLOYEE">
              <Home />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback routing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

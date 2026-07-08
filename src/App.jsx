// src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import LandingPage from './pages/LandingPage';
import { useAuth } from './context/AuthContext';
import TrackingPage from './pages/TrackingPage';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route 
        path="/login" 
        element={user ? <Navigate to="/chat" /> : <LoginPage />} 
      />

      <Route 
        path="/chat" 
        element={user ? <ChatPage /> : <Navigate to="/login" />} 
      />

      <Route path="/tracking" element={user ? <TrackingPage /> : <Navigate to="/login" />} />
      
    </Routes>
  );
}

export default App;
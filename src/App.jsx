/**
 * Componente raíz de la aplicación con definición de rutas.
 *
 * - `/`: LandingPage pública (marketing)
 * - `/login`: Login (redirige a /chat si ya autenticado)
 * - `/chat`: Chat principal (requiere autenticación)
 * - `/tracking`: Agenda de seguimiento (requiere autenticación)
 *
 * Las rutas protegidas redirigen a `/login` si no hay usuario autenticado.
 */

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
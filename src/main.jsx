/**
 * Punto de entrada de la aplicación ClariDoc.
 *
 * Monta la app con:
 * - React StrictMode (detección de problemas en desarrollo)
 * - BrowserRouter (enrutamiento del lado del cliente)
 * - AuthProvider (contexto de autenticación Firebase)
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
        <AuthProvider>
            <App />
        </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
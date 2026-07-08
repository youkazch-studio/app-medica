// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config'; // Asegúrate que la ruta sea correcta

// 1. Creamos el contexto
const AuthContext = createContext();

// 2. Creamos un hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Creamos el componente Proveedor
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Para saber si aún estamos verificando la sesión

  useEffect(() => {
    // onAuthStateChanged es un observador de Firebase que se activa
    // cada vez que el estado de autenticación cambia (login/logout).
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Terminamos de cargar
    });

    // Nos desuscribimos del observador cuando el componente se desmonta
    return () => unsubscribe();
  }, []);

  // El valor que proveeremos a los componentes hijos
  const value = {
    user,
  };

  // No mostramos la app hasta que sepamos si hay un usuario o no
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
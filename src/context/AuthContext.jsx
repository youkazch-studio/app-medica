/**
 * Proveedor de contexto de autenticación de Firebase.
 *
 * Escucha los cambios en el estado de autenticación (onAuthStateChanged)
 * y provee el usuario actual a toda la aplicación.
 *
 * @component AuthProvider - Envuelve la app y expone el usuario via useAuth()
 * @hook useAuth() - Hook personalizado para acceder al usuario autenticado
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext();

/**
 * Hook para acceder al contexto de autenticación desde cualquier componente.
 * @returns {{ user: import('firebase/auth').User | null }} Objeto con el usuario actual
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * Proveedor que observa el estado de autenticación y lo propaga por la app.
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
import { createContext, useContext, useState, useEffect } from 'react';
import { obtenerPerfil } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('boltrain_token');
    if (token) {
      obtenerPerfil()
        .then(({ data }) => setUsuario(data.user))
        .catch(() => localStorage.removeItem('boltrain_token'))
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, []);

  const guardarSesion = (token, user) => {
    localStorage.setItem('boltrain_token', token);
    setUsuario(user);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('boltrain_token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, guardarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};

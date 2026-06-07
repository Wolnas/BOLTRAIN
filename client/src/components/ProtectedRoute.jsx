import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen bg-selva-deep flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-dorado border-t-transparent rounded-full animate-spin" />
          <p className="text-crema/60 font-body text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return usuario ? children : <Navigate to="/" replace />;
}

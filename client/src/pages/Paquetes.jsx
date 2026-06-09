import { useAuth } from '../context/AuthContext';
import AdminPaquetes from '../components/paquetes/AdminPaquetes';
import TrabajadorPaquetes from '../components/paquetes/TrabajadorPaquetes';
import ViewerPaquetes from '../components/paquetes/ViewerPaquetes';

/* Despacha la vista de Paquetes según el rol del usuario. */
export default function Paquetes() {
  const { usuario } = useAuth();

  if (usuario?.rol === 'trabajador') return <TrabajadorPaquetes />;
  if (usuario?.rol === 'admin') return <AdminPaquetes />;
  return <ViewerPaquetes />;
}

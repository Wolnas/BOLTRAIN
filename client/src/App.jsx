import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Inicio from './pages/Inicio';
import Pedidos from './pages/Pedidos';
import Clientes from './pages/Clientes';
import Paquetes from './pages/Paquetes';
import Finanzas from './pages/Finanzas';
import Locutorios from './pages/Locutorios';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Inicio />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="paquetes" element={<Paquetes />} />
            <Route path="finanzas" element={<Finanzas />} />
            <Route path="locutorios" element={<Locutorios />} />
          </Route>
          <Route path="*" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

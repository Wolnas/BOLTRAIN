import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, ShoppingBag, Package, LogOut, X, User, Shield, Users,
  Wallet, Settings, Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* Ítems del menú. `roles` = lista de roles que pueden verlo (undefined = todos). */
const NAV_ITEMS = [
  { to: '/dashboard',            label: 'Inicio',    icon: Home,       end: true },
  { to: '/dashboard/clientes',   label: 'Clientes',  icon: Users,      roles: ['admin'] },
  { to: '/dashboard/pedidos',    label: 'Pedidos',   icon: ShoppingBag, roles: ['admin'] },
  { to: '/dashboard/paquetes',   label: 'Paquetes',  icon: Package },
  { to: '/dashboard/finanzas',   label: 'Finanzas',  icon: Wallet,     roles: ['admin'] },
  { to: '/dashboard/locutorios', label: 'Locutorios', icon: Building2, roles: ['admin'], grupo: 'Configuración' },
];

const ROL_LABEL = { admin: 'Administrador', viewer: 'Cliente', trabajador: 'Trabajador' };

export default function Sidebar({ abierto, onCerrar }) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    cerrarSesion();
    navigate('/');
  };

  const puedeVer = (item) => !item.roles || item.roles.includes(usuario?.rol);
  const items = NAV_ITEMS.filter(puedeVer);

  const contenido = (
    <div className="flex flex-col h-full" style={{ background: '#0d1f0d' }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="font-display font-black text-xl tracking-wider select-none">
          <span style={{ color: '#f5f0e8' }}>BOL</span>
          <span style={{ color: '#c9a84c' }}>TRAIN</span>
        </div>
        {onCerrar && (
          <button
            onClick={onCerrar}
            className="lg:hidden text-crema/40 hover:text-crema transition-colors p-1"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon, end, grupo }, i) => (
          <div key={to}>
            {grupo && (
              <p className="px-4 pt-4 pb-1.5 text-[10px] uppercase tracking-widest text-crema/30 font-body">
                {grupo}
              </p>
            )}
            <NavLink
              to={to}
              end={end}
              onClick={onCerrar}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-2.5 rounded-xl font-body text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-dorado/15 text-dorado border border-dorado/20'
                    : 'text-crema/60 hover:text-crema hover:bg-white/5 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.5}
                    className="transition-transform duration-200 group-hover:scale-110"
                  />
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-dorado"
                      style={{ boxShadow: '0 0 8px #c9a84c' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* Usuario + Logout */}
      <div className="px-3 pb-4 border-t border-white/5 pt-4 space-y-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(74,124,89,0.2)', border: '1px solid rgba(74,124,89,0.3)' }}
          >
            <User size={14} className="text-selva-light" />
          </div>
          <div className="min-w-0">
            <p className="font-body text-sm text-crema font-medium truncate">
              {usuario?.nombre} {usuario?.apellido}
            </p>
            <div className="flex items-center gap-1.5">
              <Shield size={10} className="text-dorado shrink-0" />
              <span className="font-body text-xs text-crema/40">
                {ROL_LABEL[usuario?.rol] || usuario?.rol}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={salir}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-body text-sm text-crema/50 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/15 transition-all duration-200"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: sidebar fijo */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/5 h-screen sticky top-0">
        {contenido}
      </aside>

      {/* Mobile: drawer con overlay.
          FIX bug crítico: el overlay queda SIEMPRE montado pero solo intercepta
          clics cuando el drawer está abierto (`pointerEvents`). Antes el overlay
          vivía dentro de un AnimatePresence que no completaba su `exit`, dejando
          un <div fixed inset-0> invisible (opacity 0 pero pointer-events:auto)
          sobre toda la pantalla → todos los botones dejaban de responder hasta
          recargar. Con pointerEvents atado a `abierto` nunca bloquea al cerrar. */}
      <motion.div
        initial={false}
        animate={{ opacity: abierto ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: abierto ? 'auto' : 'none' }}
        className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        onClick={onCerrar}
      />
      <AnimatePresence>
        {abierto && (
          <motion.aside
            key="drawer-panel"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-60 lg:hidden"
          >
            {contenido}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

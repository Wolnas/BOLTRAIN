import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Globe, Calendar, Shield, ShoppingBag, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROL_LABEL = { admin: 'Administrador', viewer: 'Visor' };
const BANDERA = { España: '🇪🇸', Bolivia: '🇧🇴' };

export default function Inicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-bold text-crema mb-1">
          Bienvenido, <span style={{ color: '#c9a84c' }}>{usuario.nombre}</span>
        </h1>
        <p className="font-body text-crema/50 text-sm">{usuario.email}</p>
      </motion.div>

      {/* Info de cuenta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card rounded-2xl p-6 mb-6"
      >
        <h2 className="font-body text-xs text-crema/40 uppercase tracking-widest mb-5">
          Tu cuenta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-crema/40 mb-2">
              <Shield size={13} />
              <span className="font-body text-xs uppercase tracking-wider">Rol</span>
            </div>
            <span
              className={`font-body text-sm font-semibold px-3 py-1 rounded-full border w-fit block ${
                usuario.rol === 'admin'
                  ? 'text-dorado border-dorado/40 bg-dorado/10'
                  : 'text-selva-light border-selva-tropical/40 bg-selva-tropical/10'
              }`}
            >
              {ROL_LABEL[usuario.rol] || usuario.rol}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-crema/40 mb-2">
              <Globe size={13} />
              <span className="font-body text-xs uppercase tracking-wider">País</span>
            </div>
            <span className="font-body text-sm text-crema font-medium">
              {BANDERA[usuario.pais] || ''} {usuario.pais}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-crema/40 mb-2">
              <Calendar size={13} />
              <span className="font-body text-xs uppercase tracking-wider">Miembro desde</span>
            </div>
            <span className="font-body text-sm text-crema/70">
              {usuario.created_at
                ? new Date(usuario.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })
                : 'Hoy'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Accesos rápidos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="font-body text-xs text-crema/40 uppercase tracking-widest mb-4">
          Acceso rápido
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {usuario.rol === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard/pedidos')}
              className="glass-card rounded-2xl p-5 text-left flex items-center gap-4 hover:border-dorado/20 transition-all"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
              >
                <ShoppingBag size={20} style={{ color: '#c9a84c' }} />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-crema">Pedidos</p>
                <p className="font-body text-xs text-crema/40 mt-0.5">
                  Registrar y gestionar compras
                </p>
              </div>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/paquetes')}
            className="glass-card rounded-2xl p-5 text-left flex items-center gap-4 hover:border-selva-tropical/30 transition-all"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(74,124,89,0.1)', border: '1px solid rgba(74,124,89,0.2)' }}
            >
              <Package size={20} className="text-selva-tropical" />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-crema">Paquetes</p>
              <p className="font-body text-xs text-crema/40 mt-0.5">
                {usuario.rol === 'admin' ? 'Gestionar envíos' : 'Ver estado de mis envíos'}
              </p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

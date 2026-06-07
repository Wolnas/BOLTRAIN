import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Package, ChevronDown, Truck, MapPin } from 'lucide-react';
import { listarPaquetes, pedidosDisponibles, crearPaquete, actualizarEstado, eliminarPaquete } from '../api/paquetes';
import { listarUsuarios, listarLocutorios } from '../api/usuarios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Estado del paquete ─── */
const ESTADO_CONFIG = {
  pendiente:   { label: 'Pendiente',   cls: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10', punto: '#eab308' },
  en_transito: { label: 'En Tránsito', cls: 'text-blue-300 border-blue-500/40 bg-blue-500/10',      punto: '#3b82f6' },
  entregado:   { label: 'Entregado',   cls: 'text-green-300 border-green-500/40 bg-green-500/10',   punto: '#22c55e' },
};

/* ─── Caja 3D animada ─── */
function Caja3D({ items, cerrandose }) {
  return (
    <div className="flex flex-col items-center" style={{ perspective: '600px', perspectiveOrigin: '50% 30%' }}>
      <div style={{ transform: 'rotateX(4deg)', transformStyle: 'preserve-3d' }}>
        {/* Tapa */}
        <motion.div
          initial={{ rotateX: -145 }}
          animate={{ rotateX: cerrandose ? 0 : -145 }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          style={{
            width: '200px',
            height: '38px',
            background: 'linear-gradient(135deg, #243a24 0%, #1a2e1a 100%)',
            border: '2px solid #c9a84c',
            borderRadius: '6px 6px 0 0',
            transformOrigin: 'top center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
            boxShadow: '0 -4px 12px rgba(201,168,76,0.12)',
          }}
        >
          <span style={{
            fontSize: '11px', letterSpacing: '3px', color: '#c9a84c',
            fontWeight: '700', fontFamily: 'Playfair Display, serif',
          }}>
            BOLTRAIN
          </span>
        </motion.div>

        {/* Cuerpo */}
        <div
          style={{
            width: '200px',
            minHeight: '160px',
            background: 'linear-gradient(180deg, #162b18 0%, #0d1f0d 100%)',
            border: '2px solid #c9a84c',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            padding: '10px 8px 10px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '6px 6px 0 rgba(0,0,0,0.5), inset 0 0 24px rgba(0,0,0,0.4)',
          }}
        >
          {/* Panel lateral derecho para efecto 3D */}
          <div style={{
            position: 'absolute',
            right: '-8px', top: 0, bottom: 0,
            width: '8px',
            background: 'linear-gradient(90deg, rgba(201,168,76,0.12) 0%, rgba(0,0,0,0.25) 100%)',
            borderRadius: '0 4px 4px 0',
          }} />
          {/* Panel inferior para efecto 3D */}
          <div style={{
            position: 'absolute',
            bottom: '-6px', left: '8px', right: '-8px',
            height: '6px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)',
            borderRadius: '0 0 4px 4px',
          }} />

          {items.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: '130px', color: 'rgba(245,240,232,0.2)',
              fontSize: '12px', fontFamily: 'Raleway, sans-serif', textAlign: 'center', gap: '8px',
            }}>
              <Package size={28} style={{ color: 'rgba(201,168,76,0.2)' }} />
              Selecciona pedidos<br />para agregar
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ y: -80, opacity: 0, scale: 0.6 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    style={{
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.22)',
                      borderRadius: '5px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      color: '#f5f0e8',
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontFamily: 'Raleway, sans-serif',
                    }}
                  >
                    <span>📦</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {item.descripcion}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Contador */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 flex items-center gap-2"
        >
          <span style={{
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: '999px',
            padding: '3px 12px',
            fontSize: '12px',
            color: '#c9a84c',
            fontFamily: 'Raleway, sans-serif',
            fontWeight: '600',
          }}>
            {items.length} {items.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Card de paquete (admin) ─── */
function CardPaqueteAdmin({ paquete, onCambiarEstado, onEliminar }) {
  const cfg = ESTADO_CONFIG[paquete.estado] || ESTADO_CONFIG.pendiente;
  const descripciones = paquete.pedidos_desc ? paquete.pedidos_desc.split('|||') : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-body text-sm font-semibold text-crema">
            {paquete.cliente_nombre} {paquete.cliente_apellido}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin size={11} className="text-crema/40" />
            <span className="font-body text-xs text-crema/40">
              {paquete.locutorio_nombre} · {paquete.locutorio_ciudad}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Badge estado con animación para pendiente */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-body font-medium border ${cfg.cls}`}
            style={paquete.estado === 'pendiente' ? {
              animation: 'pulse 2s ease-in-out infinite',
            } : {}}
          >
            {cfg.label}
          </span>
          <button
            onClick={() => onEliminar(paquete.id)}
            className="p-1.5 text-crema/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Pedidos */}
      <div className="space-y-1.5 mb-4">
        {descripciones.slice(0, 3).map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs">📦</span>
            <span className="font-body text-xs text-crema/60 truncate">{d}</span>
          </div>
        ))}
        {descripciones.length > 3 && (
          <p className="font-body text-xs text-crema/30 pl-5">
            +{descripciones.length - 3} más
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          {paquete.fecha_estimada && (
            <span className="font-body text-xs text-crema/40">
              Est. {new Date(paquete.fecha_estimada).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            </span>
          )}
          {paquete.numero_seguimiento && (
            <div className="flex items-center gap-1">
              <Truck size={11} className="text-crema/30" />
              <span className="font-body text-xs text-crema/40">{paquete.numero_seguimiento}</span>
            </div>
          )}
        </div>
        <select
          value={paquete.estado}
          onChange={e => onCambiarEstado(paquete.id, e.target.value)}
          className="bg-selva-dark border border-white/10 rounded-lg px-2 py-1 text-crema font-body text-xs focus:border-dorado/50 focus:outline-none"
        >
          <option value="pendiente">Pendiente</option>
          <option value="en_transito">En Tránsito</option>
          <option value="entregado">Entregado</option>
        </select>
      </div>
    </motion.div>
  );
}

/* ─── Card de paquete (viewer) ─── */
function CardPaqueteViewer({ paquete }) {
  const cfg = ESTADO_CONFIG[paquete.estado] || ESTADO_CONFIG.pendiente;
  const descripciones = paquete.pedidos_desc ? paquete.pedidos_desc.split('|||') : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: cfg.punto, boxShadow: `0 0 6px ${cfg.punto}` }}
          />
          <span className={`px-2.5 py-1 rounded-full text-xs font-body font-medium border ${cfg.cls}`}>
            {cfg.label}
          </span>
        </div>
        {paquete.fecha_estimada && (
          <span className="font-body text-xs text-crema/40">
            Llega aprox. {new Date(paquete.fecha_estimada).toLocaleDateString('es-ES', {
              day: '2-digit', month: 'long',
            })}
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <p className="font-body text-xs text-crema/40 uppercase tracking-wider">Contenido</p>
        {descripciones.map((d, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-sm">📦</span>
            <span className="font-body text-sm text-crema/80">{d}</span>
          </div>
        ))}
      </div>

      {paquete.numero_seguimiento && (
        <div className="pt-3 border-t border-white/5 flex items-center gap-2">
          <Truck size={14} className="text-dorado" />
          <span className="font-body text-sm text-crema/70">Seguimiento: </span>
          <span className="font-body text-sm text-dorado font-medium">{paquete.numero_seguimiento}</span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Modal crear paquete ─── */
function ModalCrearPaquete({ onCerrar, onCreado }) {
  const [usuarios, setUsuarios] = useState([]);
  const [locutorios, setLocutorios] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [pedidosLibres, setPedidosLibres] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [locutorioId, setLocutorioId] = useState('');
  const [fechaEstimada, setFechaEstimada] = useState('');
  const [seguimiento, setSeguimiento] = useState('');
  const [notas, setNotas] = useState('');
  const [cerrandose, setCerrandose] = useState(false);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Promise.all([
      listarUsuarios().then(({ data }) => setUsuarios(data.usuarios)),
      listarLocutorios().then(({ data }) => setLocutorios(data.locutorios)),
    ]).catch(() => toast.error('Error cargando datos'));
  }, []);

  useEffect(() => {
    if (!clienteId) { setPedidosLibres([]); setSeleccionados([]); return; }
    setCargandoPedidos(true);
    pedidosDisponibles(clienteId)
      .then(({ data }) => setPedidosLibres(data.pedidos))
      .catch(() => toast.error('Error cargando pedidos'))
      .finally(() => setCargandoPedidos(false));
    setSeleccionados([]);
  }, [clienteId]);

  const togglePedido = (pedido) => {
    setSeleccionados(prev => {
      const yaEsta = prev.find(p => p.id === pedido.id);
      if (yaEsta) return prev.filter(p => p.id !== pedido.id);
      return [...prev, pedido];
    });
  };

  const handleCrear = async () => {
    if (seleccionados.length === 0) return toast.error('Selecciona al menos un pedido');
    if (!locutorioId) return toast.error('Selecciona un locutorio');

    setCerrandose(true);
    await new Promise(r => setTimeout(r, 900));

    setEnviando(true);
    try {
      await crearPaquete({
        cliente_id: clienteId,
        locutorio_id: locutorioId,
        pedido_ids: seleccionados.map(p => p.id),
        numero_seguimiento: seguimiento || null,
        fecha_estimada: fechaEstimada || null,
        notas_internas: notas || null,
      });
      toast.success('Paquete creado');
      onCreado();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear paquete');
      setCerrandose(false);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onCerrar()}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="glass-card rounded-2xl p-6 w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        style={{ border: '1px solid rgba(201,168,76,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-crema">Crear Paquete</h2>
          <button onClick={onCerrar} className="text-crema/40 hover:text-crema transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ─ Columna izquierda: caja + formulario ─ */}
          <div className="space-y-5">
            {/* Caja 3D */}
            <Caja3D items={seleccionados} cerrandose={cerrandose} />

            {/* Cliente */}
            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                Cliente
              </label>
              <select
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none"
              >
                <option value="">Seleccionar cliente...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                ))}
              </select>
            </div>

            {/* Locutorio */}
            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                Locutorio en España
              </label>
              {locutorios.length === 0 ? (
                <p className="font-body text-xs text-crema/30 py-2">No hay locutorios registrados</p>
              ) : (
                <select
                  value={locutorioId}
                  onChange={e => setLocutorioId(e.target.value)}
                  className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none"
                >
                  <option value="">Seleccionar locutorio...</option>
                  {locutorios.map(l => (
                    <option key={l.id} value={l.id}>{l.nombre} — {l.ciudad}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Fecha estimada + Seguimiento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                  Fecha Estimada
                </label>
                <input
                  type="date"
                  value={fechaEstimada}
                  onChange={e => setFechaEstimada(e.target.value)}
                  className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                  Nº Seguimiento
                </label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={seguimiento}
                  onChange={e => setSeguimiento(e.target.value)}
                  className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20"
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                Notas Internas
              </label>
              <textarea
                rows={2}
                placeholder="Observaciones..."
                value={notas}
                onChange={e => setNotas(e.target.value)}
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20 resize-none"
              />
            </div>
          </div>

          {/* ─ Columna derecha: pedidos disponibles ─ */}
          <div className="flex flex-col">
            <p className="font-body text-xs text-crema/40 uppercase tracking-wider mb-3">
              Pedidos disponibles{clienteId ? '' : ' — selecciona un cliente'}
            </p>

            {cargandoPedidos ? (
              <div className="flex items-center justify-center flex-1 py-12">
                <div className="w-6 h-6 border-2 border-dorado border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !clienteId ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-crema/20">
                <Package size={36} />
                <p className="font-body text-sm mt-3">Selecciona un cliente primero</p>
              </div>
            ) : pedidosLibres.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-crema/30">
                <span className="text-3xl mb-3">📭</span>
                <p className="font-body text-sm">Este cliente no tiene pedidos disponibles</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-80 pr-1">
                {pedidosLibres.map(pedido => {
                  const estaSeleccionado = seleccionados.some(p => p.id === pedido.id);
                  return (
                    <motion.button
                      key={pedido.id}
                      onClick={() => togglePedido(pedido)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full text-left rounded-xl p-3 border transition-all ${
                        estaSeleccionado
                          ? 'bg-dorado/10 border-dorado/30'
                          : 'bg-white/3 border-white/8 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            estaSeleccionado
                              ? 'bg-dorado border-dorado'
                              : 'border-white/20'
                          }`}
                        >
                          {estaSeleccionado && <Check size={12} className="text-selva-dark" strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm text-crema font-medium truncate">{pedido.descripcion}</p>
                          <p className="font-body text-xs text-crema/50 mt-0.5">
                            {pedido.tienda_origen} · {pedido.moneda} {parseFloat(pedido.precio_total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Botón cerrar paquete */}
            <motion.button
              onClick={handleCrear}
              disabled={seleccionados.length === 0 || !locutorioId || enviando}
              whileHover={{ scale: seleccionados.length > 0 && locutorioId ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 w-full py-3 rounded-xl font-body font-semibold text-sm text-selva-dark transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}
            >
              {cerrandose
                ? '📦 Cerrando caja...'
                : enviando
                ? 'Guardando...'
                : `Cerrar Paquete${seleccionados.length > 0 ? ` (${seleccionados.length})` : ''}`}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Página principal ─── */
export default function Paquetes() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await listarPaquetes();
      setPaquetes(data.paquetes);
    } catch {
      toast.error('Error cargando paquetes');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCambiarEstado = async (id, estado) => {
    try {
      await actualizarEstado(id, { estado });
      setPaquetes(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este paquete?')) return;
    try {
      await eliminarPaquete(id);
      toast.success('Paquete eliminado');
      cargar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-crema">
            {esAdmin ? 'Paquetes' : 'Mis Paquetes'}
          </h1>
          <p className="font-body text-sm text-crema/50 mt-0.5">
            {esAdmin
              ? 'Gestión de envíos a locutorios'
              : 'Estado de tus envíos desde España'}
          </p>
        </div>

        {esAdmin && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setModalCrear(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-selva-dark transition-all"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}
          >
            <Plus size={15} />
            Crear Paquete
          </motion.button>
        )}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-dorado border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paquetes.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-crema/40">
          <Package size={48} strokeWidth={1} className="mb-4" />
          <p className="font-display text-xl mb-2">Sin paquetes</p>
          <p className="font-body text-sm">
            {esAdmin ? 'Crea el primer paquete.' : 'Aún no tienes paquetes registrados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {paquetes.map(paquete =>
              esAdmin ? (
                <CardPaqueteAdmin
                  key={paquete.id}
                  paquete={paquete}
                  onCambiarEstado={handleCambiarEstado}
                  onEliminar={handleEliminar}
                />
              ) : (
                <CardPaqueteViewer key={paquete.id} paquete={paquete} />
              )
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modal crear */}
      <AnimatePresence>
        {modalCrear && (
          <ModalCrearPaquete
            onCerrar={() => setModalCrear(false)}
            onCreado={() => {
              setModalCrear(false);
              cargar();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

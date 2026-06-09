import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Truck, MapPin, Check, Plus, PackageCheck, Send, Boxes, ShoppingBag,
} from 'lucide-react';
import { listarPedidos, cambiarEstadoPedido } from '../../api/pedidos';
import { listarPaquetes, actualizarEstado } from '../../api/paquetes';
import { PageWrapper, Spinner, VacioEstado, Tabs, staggerContainer, staggerItem } from '../dashboard/ui';
import ModalCrearPaquete from './ModalCrearPaquete';
import toast from 'react-hot-toast';

/* ══════════════ SECCIÓN 1 — Paquetes por Recoger (pedidos) ══════════════ */

const RECOGER_CFG = {
  pendiente:    { label: 'Registrado',             punto: '#9ca3af', cls: 'text-gray-300 border-gray-500/40 bg-gray-500/10',     pulse: null },
  en_transito:  { label: 'Viajando al locutorio', punto: '#3b82f6', cls: 'text-blue-300 border-blue-500/40 bg-blue-500/10',     pulse: 'pulse' },
  en_locutorio: { label: 'Listo para recoger',     punto: '#c9a84c', cls: 'text-dorado border-dorado/40 bg-dorado/10',           pulse: 'glow' },
  recogido:     { label: 'Recogido',               punto: '#22c55e', cls: 'text-green-300 border-green-500/40 bg-green-500/10',  pulse: null },
};
const RECOGER_ESTADOS = ['pendiente', 'en_transito', 'en_locutorio', 'recogido'];
const RECOGER_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'en_transito', label: 'En Tránsito' },
  { key: 'en_locutorio', label: 'En Locutorio' },
  { key: 'recogido', label: 'Recogidos' },
];

function CardRecoger({ pedido, onAvanzar }) {
  const [saliendo, setSaliendo] = useState(false);
  const [hechoCheck, setHechoCheck] = useState(false);
  const cfg = RECOGER_CFG[pedido.estado] || RECOGER_CFG.pendiente;

  const marcarRecogido = async () => {
    setHechoCheck(true);
    await new Promise((r) => setTimeout(r, 650));
    setSaliendo(true);
    await new Promise((r) => setTimeout(r, 350));
    onAvanzar(pedido.id, 'recogido');
  };

  return (
    <motion.div
      layout
      variants={staggerItem}
      animate={saliendo ? { opacity: 0, x: 60, scale: 0.95 } : { opacity: 1, x: 0, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="relative glass-card rounded-2xl p-5 overflow-hidden"
      style={{ borderLeft: '3px solid #c9a84c' }}
    >
      {/* Glow dorado al hacer hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
        style={{ boxShadow: 'inset 0 0 40px rgba(201,168,76,0.06)' }} />

      <AnimatePresence>
        {hechoCheck && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ background: 'rgba(13,31,13,0.7)', backdropFilter: 'blur(2px)' }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'radial-gradient(circle at 35% 30%, #4ade80, #22c55e)', boxShadow: '0 4px 18px rgba(34,197,94,0.6)' }}
            >
              <Check size={28} className="text-selva-dark" strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-crema truncate">
            {pedido.cliente_nombre} {pedido.cliente_apellido}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ShoppingBag size={11} className="text-crema/40" />
            <span className="font-body text-xs text-crema/40 truncate">{pedido.tienda_origen}</span>
          </div>
        </div>
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-body font-medium border ${cfg.cls}`}
          style={cfg.pulse === 'pulse'
            ? { animation: 'pulse 2s ease-in-out infinite' }
            : cfg.pulse === 'glow'
            ? { animation: 'pulseGold 2s ease-in-out infinite' }
            : {}}
        >
          {cfg.label}
        </span>
      </div>

      <div className="flex items-start gap-2 mb-4">
        <span className="text-sm">📦</span>
        <span className="font-body text-sm text-crema/75">{pedido.descripcion}</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="font-body text-xs text-crema/40">
          {pedido.fecha_compra ? new Date(pedido.fecha_compra).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
        </span>

        {pedido.estado === 'en_locutorio' ? (
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={marcarRecogido}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold text-selva-dark"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}
          >
            <PackageCheck size={13} /> Marcar como Recogido
          </motion.button>
        ) : pedido.estado === 'recogido' ? (
          <span className="flex items-center gap-1.5 text-xs font-body text-green-400">
            <Check size={13} /> Completado
          </span>
        ) : (
          <span className="font-body text-xs text-crema/30">{cfg.label}</span>
        )}
      </div>
    </motion.div>
  );
}

function SeccionRecoger() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await listarPedidos();
      // Solo los pedidos relevantes para recogida (pendiente → recogido)
      setPedidos(data.pedidos.filter((p) => RECOGER_ESTADOS.includes(p.estado)));
    } catch {
      toast.error('Error cargando pedidos');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const avanzar = useCallback(async (id, estado) => {
    try {
      await cambiarEstadoPedido(id, estado);
      setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
      if (estado === 'recogido') toast.success('Pedido recogido');
    } catch {
      toast.error('Error al actualizar');
      cargar();
    }
  }, [cargar]);

  const conteos = useMemo(() => ({
    todos: pedidos.length,
    en_transito: pedidos.filter((p) => p.estado === 'en_transito').length,
    en_locutorio: pedidos.filter((p) => p.estado === 'en_locutorio').length,
    recogido: pedidos.filter((p) => p.estado === 'recogido').length,
  }), [pedidos]);

  const visibles = filtro === 'todos' ? pedidos : pedidos.filter((p) => p.estado === filtro);
  const tabs = RECOGER_TABS.map((t) => ({ ...t, count: conteos[t.key] }));

  return (
    <div>
      <Tabs tabs={tabs} activo={filtro} onChange={setFiltro} />
      {cargando ? (
        <Spinner />
      ) : visibles.length === 0 ? (
        <VacioEstado icono={<Truck size={44} strokeWidth={1} />} titulo="Nada por aquí" texto="No hay paquetes en este estado." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {visibles.map((p) => <CardRecoger key={p.id} pedido={p} onAvanzar={avanzar} />)}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/* ══════════════ SECCIÓN 2 — Paquetes para Bolivia (paquetes) ══════════════ */

const BOLIVIA_CFG = {
  armando:   { label: 'Armando paquete',   cls: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10', pulse: true,  icon: Boxes,        siguiente: { estado: 'enviado',   texto: 'Marcar Enviado' } },
  enviado:   { label: 'Enviado a Bolivia', cls: 'text-blue-300 border-blue-500/40 bg-blue-500/10',       pulse: false, icon: Send,         siguiente: { estado: 'entregado', texto: 'Marcar Entregado' } },
  entregado: { label: 'Entregado',         cls: 'text-green-300 border-green-500/40 bg-green-500/10',     pulse: false, icon: PackageCheck, siguiente: null },
};
const BOLIVIA_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'armando', label: 'Armando' },
  { key: 'enviado', label: 'Enviados' },
  { key: 'entregado', label: 'Entregados' },
];

function CardBolivia({ paquete, onAvanzar }) {
  const cfg = BOLIVIA_CFG[paquete.estado] || BOLIVIA_CFG.armando;
  const descripciones = paquete.pedidos_desc ? paquete.pedidos_desc.split('|||') : [];
  const Icon = cfg.icon;

  return (
    <motion.div layout variants={staggerItem} whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="glass-card rounded-2xl p-5" style={{ borderLeft: '3px solid #c9a84c' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-crema truncate">
            {paquete.cliente_nombre} {paquete.cliente_apellido}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin size={11} className="text-crema/40" />
            <span className="font-body text-xs text-crema/40 truncate">{paquete.locutorio_nombre} · {paquete.locutorio_ciudad}</span>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-medium border ${cfg.cls}`}
          style={cfg.pulse ? { animation: 'pulse 2s ease-in-out infinite' } : {}}>
          <Icon size={11} /> {cfg.label}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        {descripciones.slice(0, 3).map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs">📦</span>
            <span className="font-body text-xs text-crema/60 truncate">{d}</span>
          </div>
        ))}
        {descripciones.length > 3 && <p className="font-body text-xs text-crema/30 pl-5">+{descripciones.length - 3} más</p>}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="font-body text-xs text-crema/40">
          {paquete.total_pedidos} item{paquete.total_pedidos !== '1' ? 's' : ''}
        </span>
        {cfg.siguiente ? (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onAvanzar(paquete.id, cfg.siguiente.estado)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold text-selva-dark"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
            {cfg.siguiente.texto}
          </motion.button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-body text-green-400"><Check size={13} /> Entregado</span>
        )}
      </div>
    </motion.div>
  );
}

function SeccionBolivia() {
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [modal, setModal] = useState(false);

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

  const avanzar = useCallback(async (id, estado) => {
    try {
      await actualizarEstado(id, { estado });
      setPaquetes((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
  }, []);

  const conteos = useMemo(() => ({
    todos: paquetes.length,
    armando: paquetes.filter((p) => p.estado === 'armando').length,
    enviado: paquetes.filter((p) => p.estado === 'enviado').length,
    entregado: paquetes.filter((p) => p.estado === 'entregado').length,
  }), [paquetes]);

  const visibles = filtro === 'todos' ? paquetes : paquetes.filter((p) => p.estado === filtro);
  const tabs = BOLIVIA_TABS.map((t) => ({ ...t, count: conteos[t.key] }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <Tabs tabs={tabs} activo={filtro} onChange={setFiltro} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-selva-dark shrink-0 -mt-6"
          style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
          <Plus size={15} /> Armar Paquete
        </motion.button>
      </div>

      {cargando ? (
        <Spinner />
      ) : visibles.length === 0 ? (
        <VacioEstado icono={<Package size={44} strokeWidth={1} />} titulo="Sin paquetes" texto="Arma el primer paquete para un cliente." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {visibles.map((p) => <CardBolivia key={p.id} paquete={p} onAvanzar={avanzar} />)}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {modal && (
          <ModalCrearPaquete
            hidePrecios
            onCerrar={() => setModal(false)}
            onCreado={() => { setModal(false); cargar(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════ Contenedor con las dos secciones ══════════════ */

export default function TrabajadorPaquetes() {
  const [seccion, setSeccion] = useState('recoger');

  return (
    <PageWrapper className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-crema">Paquetes</h1>
        <p className="font-body text-sm text-crema/50 mt-0.5">Gestión de paquetes en España</p>
      </div>

      {/* Selector de sección */}
      <div className="flex gap-1 mb-7 bg-selva-dark/60 p-1 rounded-xl w-fit">
        {[
          { key: 'recoger', label: 'Paquetes por Recoger', icon: Truck },
          { key: 'bolivia', label: 'Paquetes para Bolivia', icon: Send },
        ].map((s) => {
          const Icon = s.icon;
          const active = seccion === s.key;
          return (
            <button key={s.key} onClick={() => setSeccion(s.key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors duration-200 ${active ? 'text-selva-dark' : 'text-crema/60 hover:text-crema'}`}>
              {active && (
                <motion.div layoutId="seccion-trabajador" className="absolute inset-0 rounded-lg bg-dorado"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <span className="relative flex items-center gap-2"><Icon size={15} /> {s.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={seccion}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {seccion === 'recoger' ? <SeccionRecoger /> : <SeccionBolivia />}
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  );
}

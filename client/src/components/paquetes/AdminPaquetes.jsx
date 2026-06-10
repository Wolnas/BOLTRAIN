import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MapPin, Truck, Package, ShoppingBag, Store, Boxes, Calendar } from 'lucide-react';
import {
  listarPaquetesTienda, actualizarEstadoTienda, eliminarPaqueteTienda,
  listarPaquetesCliente, actualizarEstadoCliente, eliminarPaqueteCliente,
} from '../../api/paquetes';
import { PageWrapper, Spinner, VacioEstado, Tabs, staggerContainer, staggerItem } from '../dashboard/ui';
import { TIENDA_CFG, TIENDA_TABS, CLIENTE_CFG, CLIENTE_TABS, pulseStyle } from './estados';
import ModalCrearTienda from './ModalCrearTienda';
import ModalCrearPaquete from './ModalCrearPaquete';
import toast from 'react-hot-toast';

const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : null;

/* ══════════════ TAB 1 — Paquetes de Tiendas ══════════════ */

function CardTienda({ paquete, onEstado, onEliminar }) {
  const cfg = TIENDA_CFG[paquete.estado] || TIENDA_CFG.en_transito;
  return (
    <motion.div layout variants={staggerItem} whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="glass-card rounded-2xl p-5" style={{ borderLeft: '3px solid #c9a84c' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-crema truncate">{paquete.cliente_nombre} {paquete.cliente_apellido}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ShoppingBag size={11} className="text-crema/40" />
            <span className="font-body text-xs text-crema/40 truncate">{paquete.tienda_origen}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-body font-medium border ${cfg.cls}`} style={pulseStyle(cfg.pulse)}>{cfg.label}</span>
          <button onClick={() => onEliminar(paquete.id)} className="p-1.5 text-crema/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><X size={13} /></button>
        </div>
      </div>

      <div className="flex items-start gap-2 mb-4">
        <span className="text-sm">📦</span>
        <span className="font-body text-sm text-crema/75">{paquete.descripcion}</span>
      </div>

      <div className="flex items-center gap-1.5 mb-3 text-crema/45">
        <MapPin size={12} className="text-dorado" />
        <span className="font-body text-xs">{paquete.locutorio_nombre} · {paquete.locutorio_ciudad}</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="font-body text-xs text-crema/40 flex items-center gap-1">
          {paquete.fecha_estimada_locutorio && <><Calendar size={11} /> {fmtFecha(paquete.fecha_estimada_locutorio)}</>}
        </span>
        <select value={paquete.estado} onChange={(e) => onEstado(paquete.id, e.target.value)}
          className="bg-selva-dark border border-white/10 rounded-lg px-2 py-1 text-crema font-body text-xs focus:border-dorado/50 focus:outline-none">
          <option value="en_transito">En tránsito</option>
          <option value="en_locutorio">En locutorio</option>
          <option value="recogido">Recogido</option>
        </select>
      </div>
    </motion.div>
  );
}

function TabTienda() {
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [modal, setModal] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await listarPaquetesTienda();
      setPaquetes(data.paquetes);
    } catch { toast.error('Error cargando paquetes de tienda'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = useCallback(async (id, estado) => {
    try {
      await actualizarEstadoTienda(id, { estado });
      setPaquetes((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
      toast.success('Estado actualizado');
    } catch { toast.error('Error al actualizar'); }
  }, []);

  const eliminar = useCallback(async (id) => {
    if (!window.confirm('¿Eliminar este paquete de tienda?')) return;
    try {
      await eliminarPaqueteTienda(id);
      setPaquetes((prev) => prev.filter((p) => p.id !== id));
      toast.success('Paquete eliminado');
    } catch { toast.error('Error al eliminar'); }
  }, []);

  const conteos = useMemo(() => ({
    todos: paquetes.length,
    en_transito: paquetes.filter((p) => p.estado === 'en_transito').length,
    en_locutorio: paquetes.filter((p) => p.estado === 'en_locutorio').length,
    recogido: paquetes.filter((p) => p.estado === 'recogido').length,
  }), [paquetes]);

  const visibles = filtro === 'todos' ? paquetes : paquetes.filter((p) => p.estado === filtro);
  const tabs = TIENDA_TABS.map((t) => ({ ...t, count: conteos[t.key] }));

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <Tabs tabs={tabs} activo={filtro} onChange={setFiltro} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-selva-dark shrink-0"
          style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
          <Plus size={15} /> Nuevo Paquete
        </motion.button>
      </div>

      {cargando ? <Spinner /> : visibles.length === 0 ? (
        <VacioEstado icono={<Truck size={48} strokeWidth={1} />} titulo="Sin paquetes de tienda" texto="Registra el primer pedido en camino a España." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {visibles.map((p) => <CardTienda key={p.id} paquete={p} onEstado={cambiarEstado} onEliminar={eliminar} />)}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {modal && <ModalCrearTienda onCerrar={() => setModal(false)} onCreado={() => { setModal(false); cargar(); }} />}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════ TAB 2 — Paquetes para Clientes ══════════════ */

function CardCliente({ paquete, onEstado, onEliminar }) {
  const cfg = CLIENTE_CFG[paquete.estado] || CLIENTE_CFG.armando;
  const descripciones = paquete.pedidos_desc ? paquete.pedidos_desc.split('|||') : [];
  const cobrado = parseFloat(paquete.precio_envio_bolivia || 0);

  return (
    <motion.div layout variants={staggerItem} whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }} className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-crema truncate">{paquete.cliente_nombre} {paquete.cliente_apellido}</p>
          <span className="font-body text-xs text-crema/40">{paquete.total_pedidos} pedido{paquete.total_pedidos === '1' ? '' : 's'} · ${cobrado.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-body font-medium border ${cfg.cls}`} style={pulseStyle(cfg.pulse)}>{cfg.label}</span>
          <button onClick={() => onEliminar(paquete.id)} className="p-1.5 text-crema/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><X size={13} /></button>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {descripciones.slice(0, 3).map((d, i) => (
          <div key={i} className="flex items-center gap-2"><span className="text-xs">📦</span><span className="font-body text-xs text-crema/60 truncate">{d}</span></div>
        ))}
        {descripciones.length > 3 && <p className="font-body text-xs text-crema/30 pl-5">+{descripciones.length - 3} más</p>}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        {paquete.numero_seguimiento ? (
          <div className="flex items-center gap-1"><Truck size={11} className="text-crema/30" /><span className="font-body text-xs text-crema/40 truncate max-w-[100px]">{paquete.numero_seguimiento}</span></div>
        ) : <span className="font-body text-xs text-crema/30">{fmtFecha(paquete.fecha_estimada) || ''}</span>}
        <select value={paquete.estado} onChange={(e) => onEstado(paquete.id, e.target.value)}
          className="bg-selva-dark border border-white/10 rounded-lg px-2 py-1 text-crema font-body text-xs focus:border-dorado/50 focus:outline-none">
          <option value="armando">Armando</option>
          <option value="enviado">Enviado</option>
          <option value="entregado">Entregado</option>
        </select>
      </div>
    </motion.div>
  );
}

function TabCliente() {
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [modal, setModal] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await listarPaquetesCliente();
      setPaquetes(data.paquetes);
    } catch { toast.error('Error cargando paquetes de cliente'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = useCallback(async (id, estado) => {
    try {
      await actualizarEstadoCliente(id, { estado });
      setPaquetes((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
      toast.success('Estado actualizado');
    } catch { toast.error('Error al actualizar'); }
  }, []);

  const eliminar = useCallback(async (id) => {
    if (!window.confirm('¿Eliminar este paquete?')) return;
    try {
      await eliminarPaqueteCliente(id);
      setPaquetes((prev) => prev.filter((p) => p.id !== id));
      toast.success('Paquete eliminado');
    } catch { toast.error('Error al eliminar'); }
  }, []);

  const conteos = useMemo(() => ({
    todos: paquetes.length,
    armando: paquetes.filter((p) => p.estado === 'armando').length,
    enviado: paquetes.filter((p) => p.estado === 'enviado').length,
    entregado: paquetes.filter((p) => p.estado === 'entregado').length,
  }), [paquetes]);

  const visibles = filtro === 'todos' ? paquetes : paquetes.filter((p) => p.estado === filtro);
  const tabs = CLIENTE_TABS.map((t) => ({ ...t, count: conteos[t.key] }));

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <Tabs tabs={tabs} activo={filtro} onChange={setFiltro} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-selva-dark shrink-0"
          style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
          <Plus size={15} /> Armar Paquete
        </motion.button>
      </div>

      {cargando ? <Spinner /> : visibles.length === 0 ? (
        <VacioEstado icono={<Package size={48} strokeWidth={1} />} titulo="Sin paquetes" texto="Arma el primer paquete para un cliente." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {visibles.map((p) => <CardCliente key={p.id} paquete={p} onEstado={cambiarEstado} onEliminar={eliminar} />)}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {modal && <ModalCrearPaquete onCerrar={() => setModal(false)} onCreado={() => { setModal(false); cargar(); }} />}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════ Contenedor admin con los dos tabs ══════════════ */

export default function AdminPaquetes() {
  const [tab, setTab] = useState('tienda');

  return (
    <PageWrapper className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-crema">Paquetes</h1>
        <p className="font-body text-sm text-crema/50 mt-0.5">Gestión de los dos flujos de envío</p>
      </div>

      {/* Selector de flujo */}
      <div className="flex gap-1 mb-7 bg-selva-dark/60 p-1 rounded-xl w-fit">
        {[
          { key: 'tienda', label: 'Paquetes de Tiendas', icon: Store },
          { key: 'cliente', label: 'Paquetes para Clientes', icon: Boxes },
        ].map((s) => {
          const Icon = s.icon;
          const active = tab === s.key;
          return (
            <button key={s.key} onClick={() => setTab(s.key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors duration-200 ${active ? 'text-selva-dark' : 'text-crema/60 hover:text-crema'}`}>
              {active && <motion.div layoutId="tab-admin-paquetes" className="absolute inset-0 rounded-lg bg-dorado" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative flex items-center gap-2"><Icon size={15} /> {s.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {tab === 'tienda' ? <TabTienda /> : <TabCliente />}
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  );
}

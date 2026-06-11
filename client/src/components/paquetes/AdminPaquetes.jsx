import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Truck, Package, ShoppingBag, Store, Boxes, Calendar, Users, Eye } from 'lucide-react';
import {
  listarPaquetesTienda, actualizarEstadoTienda, eliminarPaqueteTienda,
  listarPaquetesBolivia, actualizarEstadoBolivia, eliminarPaqueteBolivia,
} from '../../api/paquetes';
import { PageWrapper, Spinner, VacioEstado, Tabs, staggerContainer, staggerItem } from '../dashboard/ui';
import { TIENDA_CFG, TIENDA_TABS, BOLIVIA_CFG, BOLIVIA_TABS, pulseStyle } from './estados';
import ModalCrearTienda from './ModalCrearTienda';
import ModalCrearBolivia from './ModalCrearBolivia';
import TimelinePedido from './TimelinePedido';
import toast from 'react-hot-toast';

const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : null;

/* ══════════════ TAB 1 — Paquetes de Tienda ══════════════ */

function CardTienda({ paquete, onEstado, onEliminar }) {
  const cfg = TIENDA_CFG[paquete.estado] || TIENDA_CFG.en_camino;
  const descripciones = paquete.descripciones ? paquete.descripciones.split('|||') : [];
  return (
    <motion.div layout variants={staggerItem} whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="glass-card rounded-2xl p-5" style={{ borderLeft: '3px solid #c9a84c' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-crema truncate">{paquete.cliente_nombre} {paquete.cliente_apellido}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ShoppingBag size={11} className="text-crema/40" />
            <span className="font-body text-xs text-crema/40 truncate">{paquete.total_pedidos} pedido{paquete.total_pedidos === '1' ? '' : 's'}</span>
          </div>
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
        <span className="font-body text-xs text-crema/40 flex items-center gap-1">
          {paquete.fecha_estimada_llegada && <><Calendar size={11} /> {fmtFecha(paquete.fecha_estimada_llegada)}</>}
        </span>
        <select value={paquete.estado} onChange={(e) => onEstado(paquete.id, e.target.value)}
          className="bg-selva-dark border border-white/10 rounded-lg px-2 py-1 text-crema font-body text-xs focus:border-dorado/50 focus:outline-none">
          <option value="en_camino">En camino</option>
          <option value="en_warehouse">En warehouse</option>
          <option value="enviado_bolivia">Enviado Bolivia</option>
          <option value="entregado">Entregado</option>
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
    en_camino: paquetes.filter((p) => p.estado === 'en_camino').length,
    en_warehouse: paquetes.filter((p) => p.estado === 'en_warehouse').length,
    enviado_bolivia: paquetes.filter((p) => p.estado === 'enviado_bolivia').length,
    entregado: paquetes.filter((p) => p.estado === 'entregado').length,
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
          <Plus size={15} /> Nuevo Paquete de Tienda
        </motion.button>
      </div>

      {cargando ? <Spinner /> : visibles.length === 0 ? (
        <VacioEstado icono={<Truck size={48} strokeWidth={1} />} titulo="Sin paquetes de tienda" texto="Registra el primer pedido en camino al warehouse." />
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

/* ══════════════ TAB 2 — Cajas para Bolivia ══════════════ */

function CardBolivia({ caja, onEstado, onEliminar }) {
  const cfg = BOLIVIA_CFG[caja.estado] || BOLIVIA_CFG.armando;
  const contenido = caja.contenido ? caja.contenido.split('|||') : [];
  const total = parseFloat(caja.precio_envio_total || 0);

  return (
    <motion.div layout variants={staggerItem} whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }} className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-crema truncate flex items-center gap-1.5">
            <Boxes size={14} className="text-dorado" /> Caja #{caja.id}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-body text-xs text-crema/40 flex items-center gap-1"><Package size={11} /> {caja.total_pedidos} pedidos</span>
            <span className="font-body text-xs text-crema/40 flex items-center gap-1"><Users size={11} /> {caja.total_clientes} clientes</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-body font-medium border ${cfg.cls}`} style={pulseStyle(cfg.pulse)}>{cfg.label}</span>
          <button onClick={() => onEliminar(caja.id)} className="p-1.5 text-crema/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><X size={13} /></button>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {contenido.slice(0, 3).map((c, i) => (
          <div key={i} className="flex items-center gap-2"><span className="text-xs">📦</span><span className="font-body text-xs text-crema/60 truncate">{c}</span></div>
        ))}
        {contenido.length > 3 && <p className="font-body text-xs text-crema/30 pl-5">+{contenido.length - 3} más</p>}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="font-body text-xs text-crema/40">
          {total > 0 ? `$${total.toFixed(2)}` : (fmtFecha(caja.fecha_estimada) || (caja.numero_seguimiento || ''))}
        </span>
        <select value={caja.estado} onChange={(e) => onEstado(caja.id, e.target.value)}
          className="bg-selva-dark border border-white/10 rounded-lg px-2 py-1 text-crema font-body text-xs focus:border-dorado/50 focus:outline-none">
          <option value="armando">Armando</option>
          <option value="enviado">Enviada</option>
          <option value="entregado">Entregada</option>
        </select>
      </div>
    </motion.div>
  );
}

function TabBolivia() {
  const [cajas, setCajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [modal, setModal] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await listarPaquetesBolivia();
      setCajas(data.paquetes);
    } catch { toast.error('Error cargando cajas para Bolivia'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = useCallback(async (id, estado) => {
    try {
      await actualizarEstadoBolivia(id, { estado });
      setCajas((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)));
      toast.success('Estado actualizado');
    } catch { toast.error('Error al actualizar'); }
  }, []);

  const eliminar = useCallback(async (id) => {
    if (!window.confirm('¿Eliminar esta caja?')) return;
    try {
      await eliminarPaqueteBolivia(id);
      setCajas((prev) => prev.filter((c) => c.id !== id));
      toast.success('Caja eliminada');
    } catch { toast.error('Error al eliminar'); }
  }, []);

  const conteos = useMemo(() => ({
    todos: cajas.length,
    armando: cajas.filter((c) => c.estado === 'armando').length,
    enviado: cajas.filter((c) => c.estado === 'enviado').length,
    entregado: cajas.filter((c) => c.estado === 'entregado').length,
  }), [cajas]);

  const visibles = filtro === 'todos' ? cajas : cajas.filter((c) => c.estado === filtro);
  const tabs = BOLIVIA_TABS.map((t) => ({ ...t, count: conteos[t.key] }));

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <Tabs tabs={tabs} activo={filtro} onChange={setFiltro} />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-selva-dark shrink-0"
          style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
          <Plus size={15} /> Nueva Caja para Bolivia
        </motion.button>
      </div>

      {cargando ? <Spinner /> : visibles.length === 0 ? (
        <VacioEstado icono={<Boxes size={48} strokeWidth={1} />} titulo="Sin cajas" texto="Arma la primera caja para Bolivia." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {visibles.map((c) => <CardBolivia key={c.id} caja={c} onEstado={cambiarEstado} onEliminar={eliminar} />)}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {modal && <ModalCrearBolivia onCerrar={() => setModal(false)} onCreado={() => { setModal(false); cargar(); }} />}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════ TAB 3 — Vista Cliente (preview) ══════════════ */

function TabPreview() {
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await listarPaquetesTienda();
      setPaquetes(data.paquetes);
    } catch { toast.error('Error cargando preview'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Expande cada paquete de tienda en sus pedidos, como los ve el cliente.
  // Todos los pedidos de un mismo paquete comparten el estado del paquete.
  const pedidos = useMemo(() => paquetes.flatMap((p) => {
    const tiendas = p.tiendas ? p.tiendas.split('|||') : [];
    const descripciones = p.descripciones ? p.descripciones.split('|||') : [];
    return descripciones.map((desc, i) => ({
      id: `${p.id}-${i}`,
      tienda_origen: tiendas[i] || '',
      descripcion: desc,
      estado: p.estado,
      fecha_estimada: p.fecha_estimada_llegada,
      numero_seguimiento: p.numero_seguimiento,
      cliente_nombre: p.cliente_nombre,
      cliente_apellido: p.cliente_apellido,
    }));
  }), [paquetes]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-dorado/8 border border-dorado/20 w-fit">
        <Eye size={14} className="text-dorado" />
        <span className="font-body text-xs text-crema/60">Así ve cada cliente sus propios pedidos (sin precios, locutorio ni otros clientes)</span>
      </div>

      {cargando ? <Spinner /> : pedidos.length === 0 ? (
        <VacioEstado icono={<Package size={48} strokeWidth={1} />} titulo="Sin pedidos" texto="No hay pedidos para previsualizar." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">
          {pedidos.map((p) => (
            <div key={p.id}>
              <p className="font-body text-xs text-crema/35 mb-1.5 pl-1">👤 {p.cliente_nombre} {p.cliente_apellido}</p>
              <TimelinePedido pedido={p} />
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ══════════════ Contenedor admin con los 3 tabs ══════════════ */

export default function AdminPaquetes() {
  const [tab, setTab] = useState('tienda');

  const TABS = [
    { key: 'tienda', label: 'Paquetes de Tienda', icon: Store },
    { key: 'bolivia', label: 'Cajas para Bolivia', icon: Boxes },
    { key: 'preview', label: 'Vista Cliente', icon: Eye },
  ];

  return (
    <PageWrapper className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-crema">Paquetes</h1>
        <p className="font-body text-sm text-crema/50 mt-0.5">Del warehouse en España a la puerta del cliente en Bolivia</p>
      </div>

      <div className="flex gap-1 mb-7 bg-selva-dark/60 p-1 rounded-xl w-fit">
        {TABS.map((s) => {
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
          {tab === 'tienda' ? <TabTienda /> : tab === 'bolivia' ? <TabBolivia /> : <TabPreview />}
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  );
}

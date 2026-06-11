import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Truck, Check, Plus, PackageCheck, Send, Boxes, ShoppingBag, Calendar, Warehouse, Users, MapPin,
} from 'lucide-react';
import {
  listarPaquetesTienda, actualizarEstadoTienda,
  listarPaquetesBolivia, actualizarEstadoBolivia,
} from '../../api/paquetes';
import { PageWrapper, Spinner, VacioEstado, Tabs, staggerContainer, staggerItem } from '../dashboard/ui';
import { TIENDA_CFG, WAREHOUSE_TABS, BOLIVIA_CFG, BOLIVIA_TABS, pulseStyle } from './estados';
import ModalCrearBolivia from './ModalCrearBolivia';
import toast from 'react-hot-toast';

const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

/* ══════════════ SECCIÓN 1 — Paquetes en Warehouse (paquetes_tienda) ══════════════ */

function CardWarehouse({ paquete, onAvanzar }) {
  const [saliendo, setSaliendo] = useState(false);
  const [hechoCheck, setHechoCheck] = useState(false);
  const cfg = TIENDA_CFG[paquete.estado] || TIENDA_CFG.en_camino;
  const descripciones = paquete.descripciones ? paquete.descripciones.split('|||') : [];

  // en_camino → en_warehouse ; en_warehouse → enviado_bolivia (recogido)
  const accion = paquete.estado === 'en_camino'
    ? { estado: 'en_warehouse', texto: 'Marcar en Warehouse', desliza: true }
    : paquete.estado === 'en_warehouse'
    ? { estado: 'enviado_bolivia', texto: 'Marcar Recogido', desliza: true }
    : null;

  const ejecutar = async () => {
    if (!accion) return;
    setHechoCheck(true);
    await new Promise((r) => setTimeout(r, 650));
    setSaliendo(true);
    await new Promise((r) => setTimeout(r, 350));
    onAvanzar(paquete.id, accion.estado);
  };

  return (
    <motion.div
      layout variants={staggerItem}
      animate={saliendo ? { opacity: 0, x: 60, scale: 0.95 } : { opacity: 1, x: 0, scale: 1 }}
      whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(201,168,76,0.18)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="relative glass-card rounded-2xl p-5 overflow-hidden"
      style={{ borderLeft: '3px solid #c9a84c', background: 'rgba(13,31,13,0.55)' }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
        style={{ boxShadow: 'inset 0 0 40px rgba(201,168,76,0.06)' }} />

      <AnimatePresence>
        {hechoCheck && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ background: 'rgba(13,31,13,0.7)', backdropFilter: 'blur(2px)' }}>
            <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'radial-gradient(circle at 35% 30%, #4ade80, #22c55e)', boxShadow: '0 4px 18px rgba(34,197,94,0.6)' }}>
              <Check size={28} className="text-selva-dark" strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-crema truncate">{paquete.cliente_nombre} {paquete.cliente_apellido}</p>
          {paquete.locutorio_nombre ? (
            <p className="font-body text-xs text-dorado/80 truncate flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="shrink-0" /> {paquete.locutorio_nombre}{paquete.locutorio_ciudad ? ` — ${paquete.locutorio_ciudad}` : ''}
            </p>
          ) : (
            <p className="font-body text-xs text-crema/30 truncate flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="shrink-0" /> Sin locutorio asignado
            </p>
          )}
          <span className="font-body text-xs text-crema/40 flex items-center gap-1 mt-0.5"><ShoppingBag size={11} /> {paquete.total_pedidos} pedido{paquete.total_pedidos === '1' ? '' : 's'}</span>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-body font-medium border ${cfg.cls}`} style={pulseStyle(cfg.pulse)}>{cfg.label}</span>
      </div>

      {/* Contenido (sin locutorio ni precios) */}
      <div className="space-y-1.5 mb-4">
        {descripciones.slice(0, 3).map((d, i) => (
          <div key={i} className="flex items-center gap-2"><span className="text-xs">📦</span><span className="font-body text-xs text-crema/65 truncate">{d}</span></div>
        ))}
        {descripciones.length > 3 && <p className="font-body text-xs text-crema/30 pl-5">+{descripciones.length - 3} más</p>}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="font-body text-xs text-crema/40 flex items-center gap-1">
          {paquete.fecha_estimada_locutorio && <><Calendar size={11} /> {fmtFecha(paquete.fecha_estimada_locutorio)}</>}
        </span>
        {accion ? (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={ejecutar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold text-selva-dark"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
            {paquete.estado === 'en_camino' ? <Warehouse size={13} /> : <PackageCheck size={13} />} {accion.texto}
          </motion.button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-body text-green-400"><Check size={13} /> {cfg.label}</span>
        )}
      </div>
    </motion.div>
  );
}

function SeccionWarehouse() {
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await listarPaquetesTienda();
      setPaquetes(data.paquetes);
    } catch { toast.error('Error cargando paquetes'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const avanzar = useCallback(async (id, estado) => {
    try {
      await actualizarEstadoTienda(id, { estado });
      setPaquetes((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
      toast.success(estado === 'en_warehouse' ? 'Marcado en warehouse' : 'Marcado como recogido');
    } catch {
      toast.error('Error al actualizar');
      cargar();
    }
  }, [cargar]);

  const conteos = useMemo(() => ({
    todos: paquetes.length,
    en_camino: paquetes.filter((p) => p.estado === 'en_camino').length,
    en_warehouse: paquetes.filter((p) => p.estado === 'en_warehouse').length,
    recogidos: paquetes.filter((p) => p.estado === 'enviado_bolivia' || p.estado === 'entregado').length,
  }), [paquetes]);

  const visibles = useMemo(() => {
    if (filtro === 'todos') return paquetes;
    if (filtro === 'recogidos') return paquetes.filter((p) => p.estado === 'enviado_bolivia' || p.estado === 'entregado');
    return paquetes.filter((p) => p.estado === filtro);
  }, [paquetes, filtro]);

  const tabs = WAREHOUSE_TABS.map((t) => ({ ...t, count: conteos[t.key] }));

  return (
    <div>
      <Tabs tabs={tabs} activo={filtro} onChange={setFiltro} />
      {cargando ? <Spinner /> : visibles.length === 0 ? (
        <VacioEstado icono={<Warehouse size={44} strokeWidth={1} />} titulo="Nada por aquí" texto="No hay paquetes en este estado." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {visibles.map((p) => <CardWarehouse key={p.id} paquete={p} onAvanzar={avanzar} />)}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/* ══════════════ SECCIÓN 2 — Armar Cajas para Bolivia (paquetes_bolivia) ══════════════ */

const ICON_BOLIVIA = { armando: Boxes, enviado: Send, entregado: PackageCheck };

function CardCaja({ caja, onAvanzar }) {
  const cfg = BOLIVIA_CFG[caja.estado] || BOLIVIA_CFG.armando;
  const contenido = caja.contenido ? caja.contenido.split('|||') : [];
  const Icon = ICON_BOLIVIA[caja.estado] || Boxes;

  return (
    <motion.div layout variants={staggerItem} whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="glass-card rounded-2xl p-5" style={{ borderLeft: '3px solid #c9a84c' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-crema flex items-center gap-1.5"><Boxes size={14} className="text-dorado" /> Caja #{caja.id}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-body text-xs text-crema/40 flex items-center gap-1"><Package size={11} /> {caja.total_pedidos}</span>
            <span className="font-body text-xs text-crema/40 flex items-center gap-1"><Users size={11} /> {caja.total_clientes}</span>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body font-medium border ${cfg.cls}`} style={pulseStyle(cfg.pulse)}>
          <Icon size={11} /> {cfg.label}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        {contenido.slice(0, 3).map((c, i) => (
          <div key={i} className="flex items-center gap-2"><span className="text-xs">📦</span><span className="font-body text-xs text-crema/60 truncate">{c}</span></div>
        ))}
        {contenido.length > 3 && <p className="font-body text-xs text-crema/30 pl-5">+{contenido.length - 3} más</p>}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="font-body text-xs text-crema/40">{fmtFecha(caja.fecha_estimada) || (caja.numero_seguimiento || '')}</span>
        {cfg.siguiente ? (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => onAvanzar(caja.id, cfg.siguiente.estado)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold text-selva-dark"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
            {cfg.siguiente.texto}
          </motion.button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-body text-green-400"><Check size={13} /> Entregada</span>
        )}
      </div>
    </motion.div>
  );
}

function SeccionCajas() {
  const [cajas, setCajas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [modal, setModal] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await listarPaquetesBolivia();
      setCajas(data.paquetes);
    } catch { toast.error('Error cargando cajas'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const avanzar = useCallback(async (id, estado) => {
    try {
      await actualizarEstadoBolivia(id, { estado });
      setCajas((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)));
      toast.success('Estado actualizado');
    } catch { toast.error('Error al actualizar'); }
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
          <Plus size={15} /> Nueva Caja
        </motion.button>
      </div>

      {cargando ? <Spinner /> : visibles.length === 0 ? (
        <VacioEstado icono={<Boxes size={44} strokeWidth={1} />} titulo="Sin cajas" texto="Arma la primera caja para Bolivia." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {visibles.map((c) => <CardCaja key={c.id} caja={c} onAvanzar={avanzar} />)}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {modal && <ModalCrearBolivia hidePrecios onCerrar={() => setModal(false)} onCreado={() => { setModal(false); cargar(); }} />}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════ Contenedor con las dos secciones ══════════════ */

export default function TrabajadorPaquetes() {
  const [seccion, setSeccion] = useState('warehouse');

  return (
    <PageWrapper className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-crema">Paquetes</h1>
        <p className="font-body text-sm text-crema/50 mt-0.5">Gestión del warehouse en España</p>
      </div>

      <div className="flex gap-1 mb-7 bg-selva-dark/60 p-1 rounded-xl w-fit">
        {[
          { key: 'warehouse', label: 'Paquetes en Warehouse', icon: Warehouse },
          { key: 'cajas', label: 'Armar Cajas para Bolivia', icon: Send },
        ].map((s) => {
          const Icon = s.icon;
          const active = seccion === s.key;
          return (
            <button key={s.key} onClick={() => setSeccion(s.key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors duration-200 ${active ? 'text-selva-dark' : 'text-crema/60 hover:text-crema'}`}>
              {active && <motion.div layoutId="seccion-trabajador" className="absolute inset-0 rounded-lg bg-dorado" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative flex items-center gap-2"><Icon size={15} /> {s.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={seccion} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {seccion === 'warehouse' ? <SeccionWarehouse /> : <SeccionCajas />}
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  );
}

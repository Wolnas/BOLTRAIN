import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MapPin, Truck, Package, DollarSign, Pencil } from 'lucide-react';
import { listarPaquetes, actualizarEstado, actualizarEnvio, eliminarPaquete } from '../../api/paquetes';
import { PageWrapper, Spinner, VacioEstado, Tabs, staggerContainer, staggerItem } from '../dashboard/ui';
import ModalCrearPaquete from './ModalCrearPaquete';
import toast from 'react-hot-toast';

const ESTADO_CFG = {
  armando:   { label: 'Armando',   cls: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10', pulse: true },
  enviado:   { label: 'Enviado',   cls: 'text-blue-300 border-blue-500/40 bg-blue-500/10',       pulse: false },
  entregado: { label: 'Entregado', cls: 'text-green-300 border-green-500/40 bg-green-500/10',     pulse: false },
};
const TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'armando', label: 'Armando' },
  { key: 'enviado', label: 'Enviados' },
  { key: 'entregado', label: 'Entregados' },
];

function ModalEnvio({ paquete, onCerrar, onGuardado }) {
  const [precio, setPrecio] = useState(paquete.precio_envio_bolivia ?? '');
  const [seg, setSeg] = useState(paquete.numero_seguimiento ?? '');
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    setEnviando(true);
    try {
      await actualizarEnvio(paquete.id, {
        precio_envio_bolivia: precio || null,
        numero_seguimiento: seg || null,
      });
      toast.success('Envío actualizado');
      onGuardado();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <motion.div initial={{ opacity: 0, y: 28, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="glass-card rounded-2xl p-6 w-full max-w-sm" style={{ border: '1px solid rgba(201,168,76,0.2)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg text-crema">Datos de Envío</h2>
          <button onClick={onCerrar} className="text-crema/40 hover:text-crema p-1"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Precio cobrado al cliente</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dorado text-sm">$</span>
              <input type="number" min="0" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)}
                className="w-full bg-selva-dark border border-white/10 rounded-lg pl-7 pr-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Nº Seguimiento</label>
            <input type="text" value={seg} onChange={(e) => setSeg(e.target.value)} placeholder="Opcional"
              className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20" />
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={guardar} disabled={enviando}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm text-selva-dark disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CardAdmin({ paquete, onEstado, onEliminar, onEnvio }) {
  const cfg = ESTADO_CFG[paquete.estado] || ESTADO_CFG.armando;
  const descripciones = paquete.pedidos_desc ? paquete.pedidos_desc.split('|||') : [];
  const cobrado = parseFloat(paquete.precio_envio_bolivia || 0);

  return (
    <motion.div layout variants={staggerItem} whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }} className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-crema truncate">{paquete.cliente_nombre} {paquete.cliente_apellido}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin size={11} className="text-crema/40" />
            <span className="font-body text-xs text-crema/40 truncate">{paquete.locutorio_nombre} · {paquete.locutorio_ciudad}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-body font-medium border ${cfg.cls}`}
            style={cfg.pulse ? { animation: 'pulse 2s ease-in-out infinite' } : {}}>{cfg.label}</span>
          <button onClick={() => onEliminar(paquete.id)} className="p-1.5 text-crema/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><X size={13} /></button>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {descripciones.slice(0, 3).map((d, i) => (
          <div key={i} className="flex items-center gap-2"><span className="text-xs">📦</span><span className="font-body text-xs text-crema/60 truncate">{d}</span></div>
        ))}
        {descripciones.length > 3 && <p className="font-body text-xs text-crema/30 pl-5">+{descripciones.length - 3} más</p>}
      </div>

      {/* Envío */}
      <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
        <div className="flex items-center gap-1.5">
          <DollarSign size={12} className="text-dorado" />
          <span className="font-body text-xs text-crema/50">Envío Bolivia: ${cobrado.toFixed(2)}</span>
        </div>
        <button onClick={() => onEnvio(paquete)} className="p-1 text-crema/40 hover:text-dorado transition-colors"><Pencil size={12} /></button>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        {paquete.numero_seguimiento ? (
          <div className="flex items-center gap-1"><Truck size={11} className="text-crema/30" /><span className="font-body text-xs text-crema/40">{paquete.numero_seguimiento}</span></div>
        ) : <span />}
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

export default function AdminPaquetes() {
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [modalCrear, setModalCrear] = useState(false);
  const [editEnvio, setEditEnvio] = useState(null);

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

  const cambiarEstado = async (id, estado) => {
    try {
      await actualizarEstado(id, { estado });
      setPaquetes((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
      toast.success('Estado actualizado');
    } catch { toast.error('Error al actualizar'); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este paquete?')) return;
    try {
      await eliminarPaquete(id);
      setPaquetes((prev) => prev.filter((p) => p.id !== id));
      toast.success('Paquete eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  const conteos = useMemo(() => ({
    todos: paquetes.length,
    armando: paquetes.filter((p) => p.estado === 'armando').length,
    enviado: paquetes.filter((p) => p.estado === 'enviado').length,
    entregado: paquetes.filter((p) => p.estado === 'entregado').length,
  }), [paquetes]);

  const visibles = filtro === 'todos' ? paquetes : paquetes.filter((p) => p.estado === filtro);
  const tabs = TABS.map((t) => ({ ...t, count: conteos[t.key] }));

  return (
    <PageWrapper className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="font-display text-3xl font-bold text-crema">Paquetes</h1>
          <p className="font-body text-sm text-crema/50 mt-0.5">Envíos a Bolivia</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setModalCrear(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-selva-dark"
          style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
          <Plus size={15} /> Armar Paquete
        </motion.button>
      </div>

      <Tabs tabs={tabs} activo={filtro} onChange={setFiltro} />

      {cargando ? (
        <Spinner />
      ) : visibles.length === 0 ? (
        <VacioEstado icono={<Package size={48} strokeWidth={1} />} titulo="Sin paquetes" texto="Arma el primer paquete." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {visibles.map((p) => (
              <CardAdmin key={p.id} paquete={p} onEstado={cambiarEstado} onEliminar={eliminar} onEnvio={setEditEnvio} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {modalCrear && <ModalCrearPaquete onCerrar={() => setModalCrear(false)} onCreado={() => { setModalCrear(false); cargar(); }} />}
        {editEnvio && <ModalEnvio paquete={editEnvio} onCerrar={() => setEditEnvio(null)} onGuardado={() => { setEditEnvio(null); cargar(); }} />}
      </AnimatePresence>
    </PageWrapper>
  );
}

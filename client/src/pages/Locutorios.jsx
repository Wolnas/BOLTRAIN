import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, X, Building2, MapPin, Phone } from 'lucide-react';
import {
  listarTodosLocutorios, crearLocutorio, actualizarLocutorio, toggleActivoLocutorio,
} from '../api/locutorios';
import { useAuth } from '../context/AuthContext';
import { PageWrapper, Spinner, VacioEstado } from '../components/dashboard/ui';
import toast from 'react-hot-toast';

const FORM_VACIO = { nombre: '', ciudad: '', direccion: '', telefono: '' };

function Switch({ value, onChange }) {
  return (
    <motion.button type="button" onClick={() => onChange(!value)} whileTap={{ scale: 0.92 }}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
      style={{ background: value ? '#c9a84c' : 'rgba(255,255,255,0.1)' }}>
      <motion.div animate={{ x: value ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow" />
    </motion.button>
  );
}

function ModalLocutorio({ editando, onCerrar, onGuardado }) {
  const [form, setForm] = useState(
    editando
      ? { nombre: editando.nombre, ciudad: editando.ciudad, direccion: editando.direccion, telefono: editando.telefono || '' }
      : FORM_VACIO
  );
  const [enviando, setEnviando] = useState(false);
  const campo = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if (editando) {
        await actualizarLocutorio(editando.id, form);
        toast.success('Locutorio actualizado');
      } else {
        await crearLocutorio(form);
        toast.success('Locutorio creado');
      }
      onGuardado();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setEnviando(false);
    }
  };

  const inputCls = 'w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20';
  const labelCls = 'block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <motion.div initial={{ opacity: 0, y: 28, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="glass-card rounded-2xl p-6 w-full max-w-md" style={{ border: '1px solid rgba(201,168,76,0.2)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-crema">{editando ? 'Editar Locutorio' : 'Nuevo Locutorio'}</h2>
          <button onClick={onCerrar} className="text-crema/40 hover:text-crema p-1"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelCls}>Nombre</label>
            <input required value={form.nombre} onChange={campo('nombre')} placeholder="Locutorio Central" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ciudad</label>
              <input required value={form.ciudad} onChange={campo('ciudad')} placeholder="Madrid" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input value={form.telefono} onChange={campo('telefono')} placeholder="+34 600 000 000" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Dirección</label>
            <input required value={form.direccion} onChange={campo('direccion')} placeholder="Calle Mayor 1" className={inputCls} />
          </div>
          <motion.button type="submit" disabled={enviando} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm text-selva-dark disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
            {enviando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear Locutorio'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Locutorios() {
  const { usuario } = useAuth();
  const [locutorios, setLocutorios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await listarTodosLocutorios();
      setLocutorios(data.locutorios);
    } catch {
      toast.error('Error cargando locutorios');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggle = async (id) => {
    try {
      const { data } = await toggleActivoLocutorio(id);
      setLocutorios((prev) => prev.map((l) => (l.id === id ? { ...l, activo: data.activo } : l)));
      toast.success(data.activo ? 'Locutorio activado' : 'Locutorio desactivado');
    } catch { toast.error('Error al cambiar estado'); }
  };

  if (usuario?.rol !== 'admin') {
    return <div className="flex items-center justify-center h-64"><p className="text-crema/40 font-body">Acceso restringido a administradores</p></div>;
  }

  return (
    <PageWrapper className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-crema">Locutorios</h1>
          <p className="font-body text-sm text-crema/50 mt-0.5">Puntos de recogida en España</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setEditando(null); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-selva-dark"
          style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
          <Plus size={15} /> Nuevo Locutorio
        </motion.button>
      </div>

      {cargando ? (
        <Spinner />
      ) : locutorios.length === 0 ? (
        <VacioEstado icono={<Building2 size={48} strokeWidth={1} />} titulo="Sin locutorios" texto="Crea el primer punto de recogida." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {locutorios.map((l, i) => (
              <motion.div key={l.id} layout
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
                whileHover={{ y: -3 }}
                className="glass-card rounded-2xl p-5"
                style={{ borderLeft: `3px solid ${l.activo ? '#c9a84c' : 'rgba(255,255,255,0.1)'}`, opacity: l.activo ? 1 : 0.6 }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                      <Building2 size={17} className="text-dorado" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold text-crema truncate">{l.nombre}</p>
                      <span className={`font-body text-[11px] ${l.activo ? 'text-green-400' : 'text-crema/40'}`}>
                        {l.activo ? '● Activo' : '○ Inactivo'}
                      </span>
                    </div>
                  </div>
                  <Switch value={!!l.activo} onChange={() => toggle(l.id)} />
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-crema/60">
                    <MapPin size={12} className="text-crema/30 shrink-0" />
                    <span className="font-body text-xs truncate">{l.ciudad} · {l.direccion}</span>
                  </div>
                  {l.telefono && (
                    <div className="flex items-center gap-2 text-crema/60">
                      <Phone size={12} className="text-crema/30 shrink-0" />
                      <span className="font-body text-xs">{l.telefono}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-white/5">
                  <button onClick={() => { setEditando(l); setModal(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs text-crema/50 hover:text-dorado hover:bg-white/5 transition-colors">
                    <Edit2 size={13} /> Editar
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <ModalLocutorio editando={editando} onCerrar={() => { setModal(false); setEditando(null); }}
            onGuardado={() => { setModal(false); setEditando(null); cargar(); }} />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, UserCheck, UserX, Search, X, Eye, EyeOff } from 'lucide-react';
import { listarUsuarios, crearCliente, actualizarCliente, toggleActivoCliente } from '../api/usuarios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Constantes ─── */
const PAISES = ['Bolivia', 'España'];
const BANDERA = { España: '🇪🇸', Bolivia: '🇧🇴' };

const FORM_VACIO = {
  nombre: '', apellido: '', email: '',
  password: '', pais: 'Bolivia', activo: 1,
};

/* ─── Componente Switch ─── */
function Switch({ value, onChange }) {
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
      style={{ background: value ? '#c9a84c' : 'rgba(255,255,255,0.1)' }}
      whileTap={{ scale: 0.92 }}
    >
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
      />
    </motion.button>
  );
}

/* ─── Modal crear / editar ─── */
function ModalCliente({ editando, onCerrar, onGuardado }) {
  const [form, setForm] = useState(
    editando
      ? { nombre: editando.nombre, apellido: editando.apellido, email: editando.email,
          password: '', pais: editando.pais, activo: editando.activo }
      : FORM_VACIO
  );
  const [verPass, setVerPass] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const campo = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editando && !form.password) return toast.error('La contraseña es requerida');
    setEnviando(true);
    try {
      const datos = { ...form };
      if (!datos.password) delete datos.password;
      if (editando) {
        await actualizarCliente(editando.id, datos);
        toast.success('Cliente actualizado');
      } else {
        await crearCliente(datos);
        toast.success('Cliente creado');
      }
      onGuardado();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
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
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onCerrar()}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="glass-card rounded-2xl p-6 w-full max-w-md"
        style={{ border: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-crema">
            {editando ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onCerrar} className="text-crema/40 hover:text-crema transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                Nombre
              </label>
              <input
                required value={form.nombre} onChange={campo('nombre')}
                placeholder="Juan"
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20"
              />
            </div>
            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                Apellido
              </label>
              <input
                required value={form.apellido} onChange={campo('apellido')}
                placeholder="Pérez"
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              required type="email" value={form.email} onChange={campo('email')}
              placeholder="juan@ejemplo.com"
              className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20"
            />
          </div>

          <div>
            <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
              Contraseña {editando && <span className="normal-case text-crema/30">(dejar vacío para no cambiar)</span>}
            </label>
            <div className="relative">
              <input
                type={verPass ? 'text' : 'password'}
                value={form.password} onChange={campo('password')}
                placeholder={editando ? '••••••' : 'Mínimo 6 caracteres'}
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 pr-10 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20"
              />
              <button
                type="button"
                onClick={() => setVerPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-crema/30 hover:text-crema/60 transition-colors"
              >
                {verPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
              País
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAISES.map(p => (
                <motion.button
                  key={p}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, pais: p }))}
                  whileTap={{ scale: 0.97 }}
                  className={`py-2.5 rounded-xl font-body text-sm font-medium border transition-all ${
                    form.pais === p
                      ? 'bg-dorado/15 text-dorado border-dorado/30'
                      : 'text-crema/60 border-white/10 hover:border-white/20 hover:text-crema'
                  }`}
                >
                  {BANDERA[p]} {p}
                </motion.button>
              ))}
            </div>
          </div>

          {editando && (
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/3 border border-white/5">
              <span className="font-body text-sm text-crema/70">Estado de la cuenta</span>
              <div className="flex items-center gap-3">
                <span className={`font-body text-xs ${form.activo ? 'text-green-400' : 'text-red-400'}`}>
                  {form.activo ? 'Activo' : 'Inactivo'}
                </span>
                <Switch value={!!form.activo} onChange={v => setForm(f => ({ ...f, activo: v ? 1 : 0 }))} />
              </div>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={enviando}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl font-body font-semibold text-sm text-selva-dark transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}
          >
            {enviando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear Cliente'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ─── Página principal ─── */
export default function Clientes() {
  const { usuario } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPais, setFiltroPais] = useState('todos');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await listarUsuarios({ rol: 'viewer' });
      setClientes(data.usuarios);
    } catch {
      toast.error('Error cargando clientes');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const clientesFiltrados = clientes.filter(c => {
    const q = busqueda.toLowerCase();
    const matchQ = !q ||
      c.nombre.toLowerCase().includes(q) ||
      c.apellido.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    const matchPais = filtroPais === 'todos' || c.pais === filtroPais;
    return matchQ && matchPais;
  });

  const handleToggle = async (id, nombreCompleto) => {
    try {
      const { data } = await toggleActivoCliente(id);
      setClientes(prev =>
        prev.map(c => c.id === id ? { ...c, activo: data.activo } : c)
      );
      toast.success(`${nombreCompleto} ${data.activo ? 'activado' : 'desactivado'}`);
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleGuardado = () => {
    setModal(false);
    setEditando(null);
    cargar();
  };

  if (usuario?.rol !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-crema/40 font-body">Acceso restringido a administradores</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-crema">Clientes</h1>
          <p className="font-body text-sm text-crema/50 mt-0.5">
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setEditando(null); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-selva-dark"
          style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}
        >
          <Plus size={15} />
          Nuevo Cliente
        </motion.button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Buscador */}
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-crema/30" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-selva-dark/80 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-crema font-body text-sm focus:border-dorado/40 focus:outline-none placeholder:text-crema/25"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-crema/30 hover:text-crema transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtro país */}
        <div className="flex gap-1 bg-selva-dark/60 p-1 rounded-xl">
          {['todos', 'Bolivia', 'España'].map(p => (
            <motion.button
              key={p}
              onClick={() => setFiltroPais(p)}
              whileTap={{ scale: 0.96 }}
              className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-all duration-200 ${
                filtroPais === p
                  ? 'bg-dorado text-selva-dark shadow-sm'
                  : 'text-crema/60 hover:text-crema hover:bg-white/5'
              }`}
            >
              {p === 'todos' ? 'Todos' : `${BANDERA[p]} ${p}`}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-card rounded-2xl overflow-x-auto">
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-dorado border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-crema/40">
            <span className="text-5xl mb-4">👥</span>
            <p className="font-body text-sm">
              {busqueda || filtroPais !== 'todos'
                ? 'No hay clientes que coincidan con los filtros'
                : 'Aún no hay clientes registrados'}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/5">
                {['Cliente', 'Email', 'País', 'Estado', 'Registro', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-crema/40 font-body uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {clientesFiltrados.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/[0.025] transition-colors"
                  >
                    {/* Nombre */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-body font-semibold text-sm"
                          style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}
                        >
                          {c.nombre[0]}{c.apellido[0]}
                        </div>
                        <div>
                          <p className="font-body text-sm text-crema font-medium">
                            {c.nombre} {c.apellido}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 font-body text-sm text-crema/60">{c.email}</td>

                    {/* País */}
                    <td className="px-5 py-4 font-body text-sm text-crema/80">
                      {BANDERA[c.pais]} {c.pais}
                    </td>

                    {/* Activo */}
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-body font-medium border ${
                          c.activo
                            ? 'bg-green-500/15 text-green-300 border-green-500/25'
                            : 'bg-red-500/15 text-red-300 border-red-500/25'
                        }`}
                      >
                        {c.activo ? '● Activo' : '● Inactivo'}
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className="px-5 py-4 font-body text-sm text-crema/40">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { setEditando(c); setModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-crema/40 hover:text-dorado transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleToggle(c.id, `${c.nombre} ${c.apellido}`)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            c.activo
                              ? 'hover:bg-red-500/10 text-crema/40 hover:text-red-400'
                              : 'hover:bg-green-500/10 text-crema/40 hover:text-green-400'
                          }`}
                          title={c.activo ? 'Desactivar' : 'Activar'}
                        >
                          {c.activo ? <UserX size={14} /> : <UserCheck size={14} />}
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <ModalCliente
            editando={editando}
            onCerrar={() => { setModal(false); setEditando(null); }}
            onGuardado={handleGuardado}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

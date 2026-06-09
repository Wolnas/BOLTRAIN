import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, Edit2, Trash2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { listarPedidos, crearPedido, actualizarPedido, eliminarPedido } from '../api/pedidos';
import { listarClientes } from '../api/usuarios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Constantes ─── */
const ESTADOS = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_transito', label: 'En Tránsito' },
  { key: 'en_locutorio', label: 'En Locutorio' },
  { key: 'recogido', label: 'Recogido' },
  { key: 'en_camino', label: 'En Camino' },
  { key: 'entregado', label: 'Entregado' },
];

const BADGE = {
  pendiente:    'bg-gray-500/20 text-gray-300 border-gray-500/30',
  en_transito:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  en_locutorio: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  recogido:     'bg-teal-500/20 text-teal-300 border-teal-500/30',
  en_camino:    'bg-orange-500/20 text-orange-300 border-orange-500/30',
  entregado:    'bg-green-500/20 text-green-300 border-green-500/30',
};

const LABEL_ESTADO = {
  pendiente: 'Pendiente', en_transito: 'En Tránsito', en_locutorio: 'En Locutorio',
  recogido: 'Recogido', en_camino: 'En Camino', entregado: 'Entregado',
};

const FORM_VACIO = {
  cliente_id: '', tienda_origen: '', descripcion: '',
  precio_producto: '', precio_envio: '', precio_venta: '',
  precio_cotizado_bob: '', tipo_cambio_aplicado: '',
  moneda: 'EUR', estado: 'pendiente',
  fecha_compra: new Date().toISOString().split('T')[0], notas: '',
};

/* ─── Contador animado ─── */
function ContadorAnimado({ valor, decimales = 0, prefijo = '' }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const inicio = prevRef.current;
    const fin = valor;
    prevRef.current = fin;
    if (inicio === fin) return;
    const duracion = 900;
    const inicio_t = performance.now();
    const step = (t) => {
      const progreso = Math.min((t - inicio_t) / duracion, 1);
      const ease = 1 - Math.pow(1 - progreso, 3);
      setDisplay(inicio + (fin - inicio) * ease);
      if (progreso < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [valor]);

  const formateado = decimales > 0 ? display.toFixed(decimales) : Math.round(display);
  return `${prefijo}${formateado}`;
}

/* ─── Card de stat ─── */
function StatCard({ label, valor, prefijo = '', decimales = 0, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card rounded-2xl p-5"
    >
      <p className="font-body text-xs text-crema/40 uppercase tracking-widest mb-3">{label}</p>
      <p className="font-display text-2xl font-bold" style={{ color }}>
        <ContadorAnimado valor={valor} decimales={decimales} prefijo={prefijo} />
      </p>
    </motion.div>
  );
}

/* ─── Input reutilizable ─── */
const Input = ({ label, ...props }) => (
  <div>
    {label && (
      <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
        {label}
      </label>
    )}
    <input
      {...props}
      className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20"
    />
  </div>
);

/* ─── Componente principal ─── */
export default function Pedidos() {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [enviando, setEnviando] = useState(false);

  /* Calculados en tiempo real */
  const precioTotal = parseFloat(form.precio_producto || 0) + parseFloat(form.precio_envio || 0);
  const ganancia = parseFloat(form.precio_venta || 0) - precioTotal;
  /* Conversión BOB → USD en vivo */
  const cotizadoBob = parseFloat(form.precio_cotizado_bob || 0);
  const tipoCambio = parseFloat(form.tipo_cambio_aplicado || 0);
  const cotizadoUsd = tipoCambio > 0 ? cotizadoBob / tipoCambio : 0;

  /* Stats */
  const totalInvertido = pedidos.reduce((s, p) => s + parseFloat(p.precio_total || 0), 0);
  const totalGanancia = pedidos.reduce((s, p) => s + parseFloat(p.ganancia || 0), 0);
  const porRecoger = pedidos.filter(p => ['pendiente', 'en_locutorio', 'recogido'].includes(p.estado)).length;

  const pedidosFiltrados = filtro === 'todos' ? pedidos : pedidos.filter(p => p.estado === filtro);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await listarPedidos();
      setPedidos(data.pedidos);
    } catch {
      toast.error('Error cargando pedidos');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    listarClientes()
      .then(({ data }) => setUsuarios(data.usuarios))
      .catch(() => {});
  }, [cargar]);

  /* Abrir modal */
  const abrirModal = (pedido = null) => {
    if (pedido) {
      setEditando(pedido);
      setForm({
        cliente_id: pedido.cliente_id,
        tienda_origen: pedido.tienda_origen,
        descripcion: pedido.descripcion,
        precio_producto: pedido.precio_producto,
        precio_envio: pedido.precio_envio,
        precio_venta: pedido.precio_venta,
        precio_cotizado_bob: pedido.precio_cotizado_bob ?? '',
        tipo_cambio_aplicado: pedido.tipo_cambio_aplicado ?? '',
        moneda: pedido.moneda,
        estado: pedido.estado,
        fecha_compra: pedido.fecha_compra?.split('T')[0] || '',
        notas: pedido.notas || '',
      });
    } else {
      setEditando(null);
      setForm(FORM_VACIO);
    }
    setModal(true);
  };

  const cerrarModal = () => {
    setModal(false);
    setEditando(null);
    setForm(FORM_VACIO);
  };

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const datos = {
        ...form,
        precio_total: precioTotal.toFixed(2),
        ganancia: ganancia.toFixed(2),
      };
      if (editando) {
        await actualizarPedido(editando.id, datos);
        toast.success('Pedido actualizado');
      } else {
        await crearPedido(datos);
        toast.success('Pedido registrado');
      }
      cerrarModal();
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setEnviando(false);
    }
  };

  /* Eliminar */
  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return;
    try {
      await eliminarPedido(id);
      toast.success('Pedido eliminado');
      cargar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  /* Exportar Excel */
  const exportarExcel = () => {
    const data = pedidos.map(p => ({
      Cliente: `${p.cliente_nombre} ${p.cliente_apellido}`,
      Tienda: p.tienda_origen,
      Descripción: p.descripcion,
      'Precio Producto': parseFloat(p.precio_producto),
      'Precio Envío': parseFloat(p.precio_envio),
      'Precio Total': parseFloat(p.precio_total),
      'Precio Venta': parseFloat(p.precio_venta),
      Ganancia: parseFloat(p.ganancia),
      Moneda: p.moneda,
      'Cotizado (Bs)': p.precio_cotizado_bob != null ? parseFloat(p.precio_cotizado_bob) : '',
      'Tipo Cambio': p.tipo_cambio_aplicado != null ? parseFloat(p.tipo_cambio_aplicado) : '',
      Estado: LABEL_ESTADO[p.estado],
      'Fecha Compra': p.fecha_compra?.split('T')[0] || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    XLSX.writeFile(wb, `pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel descargado');
  };

  if (usuario?.rol !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-crema/40 font-body">Acceso restringido a administradores</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-crema">Pedidos</h1>
          <p className="font-body text-sm text-crema/50 mt-0.5">Registro de compras en tiendas de España</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={exportarExcel}
            disabled={pedidos.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm border border-selva-tropical/40 text-selva-light hover:bg-selva-tropical/10 transition-all disabled:opacity-40"
          >
            <Download size={15} />
            Exportar Excel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => abrirModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-selva-dark transition-all"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}
          >
            <Plus size={15} />
            Nuevo Pedido
          </motion.button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Pedidos" valor={pedidos.length} color="#c9a84c" delay={0} />
        <StatCard label="Total Invertido" valor={totalInvertido} prefijo="€ " decimales={2} color="#3b82f6" delay={0.05} />
        <StatCard label="Total Ganancia" valor={totalGanancia} prefijo="€ " decimales={2} color="#22c55e" delay={0.1} />
        <StatCard label="Por Recoger" valor={porRecoger} color="#f97316" delay={0.15} />
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-1 mb-6 bg-selva-dark/60 p-1 rounded-xl w-fit">
        {ESTADOS.map(est => (
          <motion.button
            key={est.key}
            onClick={() => setFiltro(est.key)}
            whileTap={{ scale: 0.96 }}
            className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-all duration-200 ${
              filtro === est.key
                ? 'bg-dorado text-selva-dark shadow-sm'
                : 'text-crema/60 hover:text-crema hover:bg-white/5'
            }`}
          >
            {est.label}
          </motion.button>
        ))}
      </div>

      {/* ── Tabla ── */}
      <div className="glass-card rounded-2xl overflow-x-auto">
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-dorado border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-crema/40">
            <span className="text-5xl mb-4">📭</span>
            <p className="font-body text-sm">
              No hay pedidos{filtro !== 'todos' ? ` con estado "${LABEL_ESTADO[filtro]}"` : ''}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5">
                {['Cliente', 'Tienda', 'Descripción', 'Producto', 'Envío', 'Total', 'Venta', 'Ganancia', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-crema/40 font-body uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {pedidosFiltrados.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="border-b border-white/5 hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="px-4 py-3 font-body text-sm text-crema whitespace-nowrap">
                      {p.cliente_nombre} {p.cliente_apellido}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-crema/70 whitespace-nowrap">{p.tienda_origen}</td>
                    <td className="px-4 py-3 font-body text-sm text-crema/70 max-w-[160px]">
                      <span className="block truncate">{p.descripcion}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-crema/80 whitespace-nowrap">
                      {p.moneda} {parseFloat(p.precio_producto).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-crema/60 whitespace-nowrap">
                      {p.moneda} {parseFloat(p.precio_envio).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-crema font-semibold whitespace-nowrap">
                      {p.moneda} {parseFloat(p.precio_total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-crema/80 whitespace-nowrap">
                      {p.moneda} {parseFloat(p.precio_venta).toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 font-body text-sm font-semibold whitespace-nowrap ${parseFloat(p.ganancia) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {p.moneda} {parseFloat(p.ganancia).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-body font-medium border whitespace-nowrap ${BADGE[p.estado]}`}>
                        {LABEL_ESTADO[p.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => abrirModal(p)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-crema/40 hover:text-dorado transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleEliminar(p.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-crema/40 hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal crear/editar ── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={e => e.target === e.currentTarget && cerrarModal()}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              style={{ border: '1px solid rgba(201,168,76,0.2)' }}
            >
              {/* Header modal */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-crema">
                  {editando ? 'Editar Pedido' : 'Nuevo Pedido'}
                </h2>
                <button onClick={cerrarModal} className="text-crema/40 hover:text-crema transition-colors p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Cliente */}
                <div>
                  <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                    Cliente
                  </label>
                  <select
                    required
                    value={form.cliente_id}
                    onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
                    className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellido} — {u.pais}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tienda */}
                <Input
                  label="Tienda Origen"
                  required
                  type="text"
                  placeholder="Primor, Sephora, El Corte Inglés..."
                  value={form.tienda_origen}
                  onChange={e => setForm(f => ({ ...f, tienda_origen: e.target.value }))}
                />

                {/* Descripción */}
                <div>
                  <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Perfume XYZ 100ml, edición limitada..."
                    value={form.descripcion}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20 resize-none"
                  />
                </div>

                {/* Precios de compra */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Precio Producto"
                    required type="number" min="0" step="0.01"
                    value={form.precio_producto}
                    onChange={e => setForm(f => ({ ...f, precio_producto: e.target.value }))}
                  />
                  <Input
                    label="Precio Envío"
                    type="number" min="0" step="0.01"
                    placeholder="0.00"
                    value={form.precio_envio}
                    onChange={e => setForm(f => ({ ...f, precio_envio: e.target.value }))}
                  />
                </div>

                {/* Precio total calculado */}
                <div className="flex justify-between items-center bg-selva-dark/60 border border-white/5 rounded-lg px-4 py-3">
                  <span className="font-body text-sm text-crema/50">Precio Total:</span>
                  <span className="font-body text-sm text-crema font-semibold">
                    {form.moneda} {precioTotal.toFixed(2)}
                  </span>
                </div>

                {/* Precio venta y ganancia */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Precio Venta"
                    type="number" min="0" step="0.01"
                    placeholder="0.00"
                    value={form.precio_venta}
                    onChange={e => setForm(f => ({ ...f, precio_venta: e.target.value }))}
                  />
                  <div>
                    <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                      Ganancia
                    </label>
                    <div
                      className={`border border-white/10 rounded-lg px-3 py-2 font-body text-sm font-semibold ${
                        ganancia >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                      style={{ background: ganancia >= 0 ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)' }}
                    >
                      {form.moneda} {ganancia.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Moneda y Estado */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                      Moneda
                    </label>
                    <select
                      value={form.moneda}
                      onChange={e => setForm(f => ({ ...f, moneda: e.target.value }))}
                      className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none"
                    >
                      <option value="EUR">EUR €</option>
                      <option value="USD">USD $</option>
                      <option value="BOB">BOB Bs.</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                      Estado
                    </label>
                    <select
                      value={form.estado}
                      onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                      className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none"
                    >
                      {ESTADOS.filter(e => e.key !== 'todos').map(e => (
                        <option key={e.key} value={e.key}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cotización en Bolivianos */}
                <div className="rounded-xl border border-dorado/15 bg-dorado/[0.03] p-4 space-y-3">
                  <p className="font-body text-xs text-dorado/70 uppercase tracking-wider">Cotización al cliente (Bolivia)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                        Precio Cotizado
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dorado font-body text-sm">Bs</span>
                        <input
                          type="number" min="0" step="0.01" placeholder="0.00"
                          value={form.precio_cotizado_bob}
                          onChange={e => setForm(f => ({ ...f, precio_cotizado_bob: e.target.value }))}
                          className="w-full bg-selva-dark border border-white/10 rounded-lg pl-9 pr-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                        Tipo de Cambio
                      </label>
                      <input
                        type="number" min="0" step="0.0001" placeholder="ej: 10.40"
                        value={form.tipo_cambio_aplicado}
                        onChange={e => setForm(f => ({ ...f, tipo_cambio_aplicado: e.target.value }))}
                        className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20"
                      />
                    </div>
                  </div>
                  {/* USD en tiempo real */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-body text-sm text-crema/50">Equivale a:</span>
                    <motion.span
                      key={cotizadoUsd.toFixed(2)}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-display text-lg font-bold text-dorado"
                    >
                      $ {cotizadoUsd.toFixed(2)} USD
                    </motion.span>
                  </div>
                </div>

                {/* Fecha */}
                <Input
                  label="Fecha de Compra"
                  required type="date"
                  value={form.fecha_compra}
                  onChange={e => setForm(f => ({ ...f, fecha_compra: e.target.value }))}
                />

                {/* Notas */}
                <div>
                  <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">
                    Notas Internas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Observaciones internas..."
                    value={form.notas}
                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                    className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20 resize-none"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={enviando}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3 rounded-xl font-body font-semibold text-sm text-selva-dark transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}
                >
                  {enviando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Registrar Pedido'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

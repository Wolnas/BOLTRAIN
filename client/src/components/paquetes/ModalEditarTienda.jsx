import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Search, MapPin, Save } from 'lucide-react';
import { actualizarEstadoTienda } from '../../api/paquetes';
import { listarClientes, listarLocutorios } from '../../api/usuarios';
import toast from 'react-hot-toast';

/* Normaliza una fecha del backend a YYYY-MM-DD para el input date. */
const aInputDate = (f) => (f ? new Date(f).toISOString().slice(0, 10) : '');

/* Modal "Editar Paquete de Tienda": cliente, locutorio destino, estado,
   fecha estimada, nº seguimiento y notas internas. Guarda con PUT /api/paquetes/:id.
   Animación spring de Framer Motion. */
export default function ModalEditarTienda({ paquete, onCerrar, onActualizado }) {
  const [clientes, setClientes] = useState([]);
  const [locutorios, setLocutorios] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteId, setClienteId] = useState(String(paquete.cliente_id || ''));
  const [locutorioId, setLocutorioId] = useState(String(paquete.locutorio_id || ''));
  const [estado, setEstado] = useState(paquete.estado || 'en_camino');
  const [fechaEstimada, setFechaEstimada] = useState(aInputDate(paquete.fecha_estimada_locutorio));
  const [seguimiento, setSeguimiento] = useState(paquete.numero_seguimiento || '');
  const [notas, setNotas] = useState(paquete.notas_internas || '');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([
      listarClientes().then(({ data }) => setClientes(data.usuarios)),
      listarLocutorios().then(({ data }) => setLocutorios(data.locutorios)),
    ]).catch(() => toast.error('Error cargando datos'));
  }, []);

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.toLowerCase();
    return clientes.filter((c) => !q || `${c.nombre} ${c.apellido} ${c.email}`.toLowerCase().includes(q));
  }, [clientes, busquedaCliente]);

  const handleGuardar = async () => {
    if (!clienteId) return toast.error('Selecciona un cliente');
    if (!locutorioId) return toast.error('Selecciona un locutorio');

    setGuardando(true);
    try {
      const datos = {
        cliente_id: clienteId,
        locutorio_id: locutorioId,
        estado,
        fecha_estimada_locutorio: fechaEstimada || null,
        numero_seguimiento: seguimiento || null,
        notas_internas: notas || null,
      };
      await actualizarEstadoTienda(paquete.id, datos);
      const loc = locutorios.find((l) => String(l.id) === String(locutorioId));
      const cli = clientes.find((c) => String(c.id) === String(clienteId));
      toast.success('Paquete actualizado');
      onActualizado(paquete.id, {
        ...datos,
        cliente_nombre: cli?.nombre ?? paquete.cliente_nombre,
        cliente_apellido: cli?.apellido ?? paquete.cliente_apellido,
        locutorio_nombre: loc?.nombre ?? paquete.locutorio_nombre,
        locutorio_ciudad: loc?.ciudad ?? paquete.locutorio_ciudad,
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar el paquete');
      setGuardando(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && !guardando && onCerrar()}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto"
        style={{ border: '1px solid rgba(201,168,76,0.2)', background: '#0d1f0d' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl text-crema">Editar Paquete de Tienda</h2>
            <p className="font-body text-xs text-crema/40 mt-0.5">Paquete #{paquete.id} · {paquete.total_pedidos} pedido{paquete.total_pedidos === '1' ? '' : 's'}</p>
          </div>
          <button onClick={onCerrar} disabled={guardando} className="text-crema/40 hover:text-crema transition-colors p-1 disabled:opacity-30"><X size={20} /></button>
        </div>

        <div className="space-y-5">
          {/* Cliente */}
          <div>
            <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Cliente</label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-crema/30" />
              <input value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} placeholder="Buscar cliente..." disabled={guardando}
                className="w-full bg-selva-dark border border-white/10 rounded-lg pl-9 pr-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20 disabled:opacity-50" />
            </div>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} disabled={guardando}
              className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none disabled:opacity-50">
              <option value="">Seleccionar cliente...</option>
              {clientesFiltrados.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
            </select>
          </div>

          {/* Locutorio destino */}
          <div>
            <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin size={12} className="text-dorado" /> Locutorio destino</label>
            {locutorios.length === 0 ? (
              <p className="font-body text-xs text-crema/30 py-2">No hay locutorios registrados</p>
            ) : (
              <select value={locutorioId} onChange={(e) => setLocutorioId(e.target.value)} disabled={guardando}
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none disabled:opacity-50">
                <option value="">Seleccionar locutorio...</option>
                {locutorios.map((l) => <option key={l.id} value={l.id}>{l.nombre} — {l.ciudad}</option>)}
              </select>
            )}
          </div>

          {/* Estado + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} disabled={guardando}
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none disabled:opacity-50">
                <option value="en_camino">En camino</option>
                <option value="en_warehouse">En warehouse</option>
                <option value="enviado_bolivia">Enviado Bolivia</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Fecha estimada</label>
              <input type="date" value={fechaEstimada} onChange={(e) => setFechaEstimada(e.target.value)} disabled={guardando}
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none disabled:opacity-50" />
            </div>
          </div>

          {/* Seguimiento */}
          <div>
            <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Nº Seguimiento <span className="text-crema/25 normal-case tracking-normal">(opcional)</span></label>
            <input type="text" value={seguimiento} onChange={(e) => setSeguimiento(e.target.value)} placeholder="Opcional" disabled={guardando}
              className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20 disabled:opacity-50" />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Notas Internas <span className="text-crema/25 normal-case tracking-normal">(opcional)</span></label>
            <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones..." disabled={guardando}
              className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20 resize-none disabled:opacity-50" />
          </div>

          <motion.button onClick={handleGuardar} disabled={!clienteId || !locutorioId || guardando}
            whileHover={{ scale: (clienteId && locutorioId && !guardando) ? 1.02 : 1 }} whileTap={{ scale: 0.98 }}
            className="mt-1 w-full py-3 rounded-xl font-body font-semibold text-sm text-selva-dark transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
            <Save size={15} /> {guardando ? 'Guardando...' : 'Guardar cambios'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

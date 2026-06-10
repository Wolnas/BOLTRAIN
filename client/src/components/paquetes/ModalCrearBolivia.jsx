import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Package, Search, ShoppingBag, Users } from 'lucide-react';
import { pedidosSinCaja, crearPaqueteBolivia } from '../../api/paquetes';
import toast from 'react-hot-toast';
import Caja3D from './Caja3D';

/* Modal para armar una Caja para Bolivia. Puede mezclar pedidos de VARIOS
   clientes (toma del warehouse lo que no está en otra caja).
   `hidePrecios` oculta el precio de producto por pedido (vista trabajador). */
export default function ModalCrearBolivia({ onCerrar, onCreado, hidePrecios = false }) {
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [seguimiento, setSeguimiento] = useState('');
  const [precioEnvio, setPrecioEnvio] = useState('');
  const [fechaEstimada, setFechaEstimada] = useState('');
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cerrandose, setCerrandose] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    pedidosSinCaja()
      .then(({ data }) => setPedidos(data.pedidos))
      .catch(() => toast.error('Error cargando pedidos disponibles'))
      .finally(() => setCargando(false));
  }, []);

  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return pedidos.filter((p) =>
      !q || `${p.cliente_nombre} ${p.cliente_apellido} ${p.descripcion} ${p.tienda_origen}`.toLowerCase().includes(q)
    );
  }, [pedidos, busqueda]);

  const togglePedido = (pedido) => {
    setSeleccionados((prev) =>
      prev.find((p) => p.id === pedido.id)
        ? prev.filter((p) => p.id !== pedido.id)
        : [...prev, pedido]
    );
  };

  const nClientes = useMemo(
    () => new Set(seleccionados.map((p) => p.cliente_id)).size,
    [seleccionados]
  );

  const handleCrear = async () => {
    if (seleccionados.length === 0) return toast.error('Selecciona al menos un pedido');

    setCerrandose(true);
    await new Promise((r) => setTimeout(r, 1100));

    setEnviando(true);
    try {
      await crearPaqueteBolivia({
        pedidos: seleccionados.map((p) => p.id),
        numero_seguimiento: seguimiento || null,
        precio_envio_total: precioEnvio || null,
        fecha_estimada: fechaEstimada || null,
        notas_internas: notas || null,
      });
      toast.success('Caja cerrada y enviada a armado');
      onCreado();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear la caja');
      setCerrandose(false);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="glass-card rounded-2xl p-6 w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        style={{ border: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl text-crema">Nueva Caja para Bolivia</h2>
            <p className="font-body text-xs text-crema/40 mt-0.5">Mezcla pedidos de varios clientes en una sola caja</p>
          </div>
          <button onClick={onCerrar} className="text-crema/40 hover:text-crema transition-colors p-1"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda: caja 3D + datos de la caja */}
          <div className="space-y-5">
            <Caja3D items={seleccionados} cerrandose={cerrandose} />

            {seleccionados.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs font-body text-crema/50">
                <Users size={12} className="text-dorado" />
                {nClientes} cliente{nClientes === 1 ? '' : 's'} · {seleccionados.length} pedido{seleccionados.length === 1 ? '' : 's'}
              </div>
            )}

            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Precio Envío a Bolivia</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dorado font-body text-sm">$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={precioEnvio} onChange={(e) => setPrecioEnvio(e.target.value)}
                  className="w-full bg-selva-dark border border-white/10 rounded-lg pl-7 pr-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Nº Seguimiento</label>
                <input type="text" placeholder="Opcional" value={seguimiento} onChange={(e) => setSeguimiento(e.target.value)}
                  className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20" />
              </div>
              <div>
                <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Fecha Estimada</label>
                <input type="date" value={fechaEstimada} onChange={(e) => setFechaEstimada(e.target.value)}
                  className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Notas Internas</label>
              <textarea rows={2} placeholder="Observaciones..." value={notas} onChange={(e) => setNotas(e.target.value)}
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20 resize-none" />
            </div>
          </div>

          {/* Columna derecha: pedidos disponibles (cualquier cliente) */}
          <div className="flex flex-col">
            <p className="font-body text-xs text-crema/40 uppercase tracking-wider mb-2">Pedidos disponibles en warehouse</p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-crema/30" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar cliente, tienda o producto..."
                className="w-full bg-selva-dark border border-white/10 rounded-lg pl-9 pr-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20" />
            </div>

            {cargando ? (
              <div className="flex items-center justify-center flex-1 py-12">
                <div className="w-6 h-6 border-2 border-dorado border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pedidosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-crema/30">
                <Package size={36} />
                <p className="font-body text-sm mt-3 text-center">No hay pedidos disponibles para enviar</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-80 pr-1">
                {pedidosFiltrados.map((pedido) => {
                  const sel = seleccionados.some((p) => p.id === pedido.id);
                  return (
                    <motion.button key={pedido.id} onClick={() => togglePedido(pedido)}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      className={`w-full text-left rounded-xl p-3 border transition-all ${sel ? 'bg-dorado/10 border-dorado/30' : 'bg-white/3 border-white/8 hover:border-white/15'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${sel ? 'bg-dorado border-dorado' : 'border-white/20'}`}>
                          {sel && <Check size={12} className="text-selva-dark" strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm text-crema font-medium truncate">{pedido.cliente_nombre} {pedido.cliente_apellido}</p>
                          <p className="font-body text-xs text-crema/55 truncate mt-0.5">{pedido.descripcion}</p>
                          <p className="font-body text-xs text-crema/40 mt-0.5 flex items-center gap-1">
                            <ShoppingBag size={10} /> {pedido.tienda_origen}
                            {!hidePrecios && pedido.precio_total != null && (
                              <span className="text-dorado ml-1">· {pedido.moneda} {parseFloat(pedido.precio_total).toFixed(2)}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            <motion.button onClick={handleCrear} disabled={seleccionados.length === 0 || enviando}
              whileHover={{ scale: seleccionados.length > 0 ? 1.02 : 1 }} whileTap={{ scale: 0.98 }}
              className="mt-6 w-full py-3 rounded-xl font-body font-semibold text-sm text-selva-dark transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
              {cerrandose ? '📦 Sellando caja...' : enviando ? 'Guardando...' : `Cerrar Caja${seleccionados.length > 0 ? ` (${seleccionados.length})` : ''}`}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

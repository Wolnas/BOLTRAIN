import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Package, ShoppingBag } from 'lucide-react';
import { pedidosSinTienda, crearPaqueteTienda } from '../../api/paquetes';
import { listarClientes, listarLocutorios } from '../../api/usuarios';
import toast from 'react-hot-toast';

/* Modal para registrar un Paquete de Tienda: un pedido que viaja
   desde la tienda hasta un locutorio en España.
   Orden lógico: 1º cliente → 2º pedido (filtrado por cliente y sin paquete_tienda)
   → 3º locutorio → 4º estado → 5º fecha → 6º seguimiento → 7º notas.
   `hidePrecios` oculta precios de producto (vista trabajador). */
export default function ModalCrearTienda({ onCerrar, onCreado, hidePrecios = false }) {
  const [clientes, setClientes] = useState([]);
  const [locutorios, setLocutorios] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [pedidoId, setPedidoId] = useState('');
  const [locutorioId, setLocutorioId] = useState('');
  const [estado, setEstado] = useState('en_transito');
  const [fechaEstimada, setFechaEstimada] = useState('');
  const [seguimiento, setSeguimiento] = useState('');
  const [notas, setNotas] = useState('');
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Carga inicial: clientes (viewers) y locutorios activos
  useEffect(() => {
    Promise.all([
      listarClientes().then(({ data }) => setClientes(data.usuarios)),
      listarLocutorios().then(({ data }) => setLocutorios(data.locutorios)),
    ]).catch(() => toast.error('Error cargando datos'));
  }, []);

  // Al elegir cliente → cargar sus pedidos sin paquete_tienda
  useEffect(() => {
    setPedidoId('');
    if (!clienteId) { setPedidos([]); return; }
    setCargandoPedidos(true);
    pedidosSinTienda(clienteId)
      .then(({ data }) => setPedidos(data.pedidos))
      .catch(() => toast.error('Error cargando pedidos'))
      .finally(() => setCargandoPedidos(false));
  }, [clienteId]);

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.toLowerCase();
    return clientes.filter((c) =>
      !q || `${c.nombre} ${c.apellido} ${c.email}`.toLowerCase().includes(q)
    );
  }, [clientes, busquedaCliente]);

  const handleCrear = async () => {
    if (!clienteId) return toast.error('Selecciona un cliente');
    if (!pedidoId) return toast.error('Selecciona un pedido');
    if (!locutorioId) return toast.error('Selecciona un locutorio');

    setEnviando(true);
    try {
      await crearPaqueteTienda({
        pedido_id: pedidoId,
        locutorio_id: locutorioId,
        estado,
        fecha_estimada_locutorio: fechaEstimada || null,
        numero_seguimiento: seguimiento || null,
        notas_internas: notas || null,
      });
      toast.success('Paquete de tienda registrado');
      onCreado();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar el paquete');
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
        className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto"
        style={{ border: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl text-crema">Nuevo Paquete de Tienda</h2>
            <p className="font-body text-xs text-crema/40 mt-0.5">Un pedido en camino a un locutorio en España</p>
          </div>
          <button onClick={onCerrar} className="text-crema/40 hover:text-crema transition-colors p-1"><X size={20} /></button>
        </div>

        {/* 1. CLIENTE */}
        <div className="mb-5">
          <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">1 · Cliente</label>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-crema/30" />
            <input value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} placeholder="Buscar cliente..."
              className="w-full bg-selva-dark border border-white/10 rounded-lg pl-9 pr-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20" />
          </div>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}
            className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none">
            <option value="">Seleccionar cliente...</option>
            {clientesFiltrados.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
          </select>
        </div>

        {/* 2. PEDIDO (sólo del cliente seleccionado, sin paquete_tienda) */}
        <div className="mb-5">
          <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">2 · Pedido</label>
          {!clienteId ? (
            <div className="flex items-center gap-2 px-3 py-3 rounded-lg bg-white/3 border border-white/8 text-crema/30">
              <Package size={16} />
              <span className="font-body text-sm">Selecciona un cliente primero</span>
            </div>
          ) : cargandoPedidos ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-dorado border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-crema/30">
              <span className="text-2xl mb-2">📭</span>
              <p className="font-body text-sm">Este cliente no tiene pedidos pendientes</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {pedidos.map((p) => {
                const sel = String(p.id) === String(pedidoId);
                return (
                  <motion.button key={p.id} onClick={() => setPedidoId(p.id)}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className={`w-full text-left rounded-xl p-3 border transition-all ${sel ? 'bg-dorado/10 border-dorado/40' : 'bg-white/3 border-white/8 hover:border-white/15'}`}>
                    <p className="font-body text-sm text-crema font-medium truncate">{p.descripcion}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 font-body text-xs text-crema/45"><ShoppingBag size={11} />{p.tienda_origen}</span>
                      {!hidePrecios && p.precio_total != null && (
                        <span className="font-body text-xs text-dorado">{p.moneda || ''} {parseFloat(p.precio_total).toFixed(2)}</span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. LOCUTORIO */}
        <div className="mb-5">
          <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">3 · Locutorio destino</label>
          {locutorios.length === 0 ? (
            <p className="font-body text-xs text-crema/30 py-2">No hay locutorios registrados</p>
          ) : (
            <select value={locutorioId} onChange={(e) => setLocutorioId(e.target.value)}
              className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none">
              <option value="">Seleccionar locutorio...</option>
              {locutorios.map((l) => <option key={l.id} value={l.id}>{l.nombre} — {l.ciudad}</option>)}
            </select>
          )}
        </div>

        {/* 4. ESTADO + 5. FECHA */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">4 · Estado inicial</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)}
              className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none">
              <option value="en_transito">En tránsito</option>
              <option value="en_locutorio">En locutorio</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">5 · Llegada estimada</label>
            <input type="date" value={fechaEstimada} onChange={(e) => setFechaEstimada(e.target.value)}
              className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none" />
          </div>
        </div>

        {/* 6. SEGUIMIENTO */}
        <div className="mb-5">
          <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">6 · Nº Seguimiento <span className="text-crema/25 normal-case tracking-normal">(opcional)</span></label>
          <input type="text" value={seguimiento} onChange={(e) => setSeguimiento(e.target.value)} placeholder="Opcional"
            className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20" />
        </div>

        {/* 7. NOTAS */}
        <div className="mb-6">
          <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">7 · Notas Internas <span className="text-crema/25 normal-case tracking-normal">(opcional)</span></label>
          <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones..."
            className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20 resize-none" />
        </div>

        <motion.button onClick={handleCrear} disabled={!clienteId || !pedidoId || !locutorioId || enviando}
          whileHover={{ scale: clienteId && pedidoId && locutorioId ? 1.02 : 1 }} whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl font-body font-semibold text-sm text-selva-dark transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
          {enviando ? 'Registrando...' : 'Registrar Paquete'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

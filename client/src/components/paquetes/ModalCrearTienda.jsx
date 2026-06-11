import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Package, ShoppingBag, Check } from 'lucide-react';
import { pedidosSinTienda, crearPaqueteTienda } from '../../api/paquetes';
import { listarClientes, listarLocutorios } from '../../api/usuarios';
import toast from 'react-hot-toast';
import CajaTienda3D from './CajaTienda3D';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Modal "Nuevo Paquete de Tienda": cliente → multi-select de pedidos →
   locutorio/estado/fecha/seguimiento/notas. Con caja 3D animada que recibe
   los pedidos en vuelo y se sella al registrar.
   `hidePrecios` oculta precios de producto (vista trabajador). */
export default function ModalCrearTienda({ onCerrar, onCreado, hidePrecios = false }) {
  const [clientes, setClientes] = useState([]);
  const [locutorios, setLocutorios] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [locutorioId, setLocutorioId] = useState('');
  const [estado, setEstado] = useState('en_camino');
  const [fechaEstimada, setFechaEstimada] = useState('');
  const [seguimiento, setSeguimiento] = useState('');
  const [notas, setNotas] = useState('');
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [fase, setFase] = useState('idle');           // idle | cerrando | exito
  const [volando, setVolando] = useState([]);          // ítems en vuelo hacia/desde la caja

  const cajaRef = useRef(null);
  const bloqueado = fase !== 'idle';

  useEffect(() => {
    Promise.all([
      listarClientes().then(({ data }) => setClientes(data.usuarios)),
      listarLocutorios().then(({ data }) => setLocutorios(data.locutorios)),
    ]).catch(() => toast.error('Error cargando datos'));
  }, []);

  useEffect(() => {
    setSeleccionados([]);
    if (!clienteId) { setPedidos([]); return; }
    setCargandoPedidos(true);
    pedidosSinTienda(clienteId)
      .then(({ data }) => setPedidos(data.pedidos))
      .catch(() => toast.error('Error cargando pedidos'))
      .finally(() => setCargandoPedidos(false));
  }, [clienteId]);

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.toLowerCase();
    return clientes.filter((c) => !q || `${c.nombre} ${c.apellido} ${c.email}`.toLowerCase().includes(q));
  }, [clientes, busquedaCliente]);

  const estaSeleccionado = (id) => seleccionados.some((p) => p.id === id);

  /* Vuelo curvo de un ítem entre el botón de la lista y la caja. */
  const lanzarVuelo = (desde, hacia, pedido, alLlegar) => {
    const key = `${pedido.id}-${Date.now()}`;
    setVolando((prev) => [...prev, { key, pedido, desde, hacia, alLlegar }]);
  };
  const finVuelo = (key) => {
    setVolando((prev) => {
      const v = prev.find((x) => x.key === key);
      if (v && v.alLlegar) v.alLlegar();
      return prev.filter((x) => x.key !== key);
    });
  };

  const togglePedido = (e, pedido) => {
    if (bloqueado) return;
    const btnRect = e.currentTarget.getBoundingClientRect();
    const boxRect = cajaRef.current?.getBoundingClientRect();
    if (!boxRect) return;
    const enBoton = { x: btnRect.left + 12, y: btnRect.top + 6 };
    const enCaja = { x: boxRect.left + boxRect.width / 2 - 70, y: boxRect.top + boxRect.height / 2 - 12 };

    if (estaSeleccionado(pedido.id)) {
      // Deseleccionar: el ítem sube de la caja y vuela de vuelta a la lista
      setSeleccionados((prev) => prev.filter((p) => p.id !== pedido.id));
      lanzarVuelo(enCaja, enBoton, pedido, null);
    } else {
      // Seleccionar: vuela del botón a la caja y cae dentro al llegar
      lanzarVuelo(enBoton, enCaja, pedido, () => setSeleccionados((prev) => [...prev, pedido]));
    }
  };

  const handleCrear = async () => {
    if (!clienteId) return toast.error('Selecciona un cliente');
    if (seleccionados.length === 0) return toast.error('Selecciona al menos un pedido');
    if (!locutorioId) return toast.error('Selecciona un locutorio');

    setFase('cerrando');
    try {
      const peticion = crearPaqueteTienda({
        cliente_id: clienteId,
        pedidos: seleccionados.map((p) => p.id),
        locutorio_id: locutorioId,
        estado,
        fecha_estimada_locutorio: fechaEstimada || null,
        numero_seguimiento: seguimiento || null,
        notas_internas: notas || null,
      });
      await sleep(1400);            // deja correr el cierre + sello
      await peticion;
      setFase('exito');
      await sleep(1700);            // check dibujado + texto
      onCreado();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar el paquete');
      setFase('idle');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && !bloqueado && onCerrar()}
    >
      {/* Capa de ítems en vuelo (coordenadas de viewport) */}
      <div className="fixed inset-0 pointer-events-none z-[60]">
        <AnimatePresence>
          {volando.map((v) => {
            const midX = (v.desde.x + v.hacia.x) / 2;
            const midY = Math.min(v.desde.y, v.hacia.y) - 70;
            return (
              <motion.div
                key={v.key}
                initial={{ x: v.desde.x, y: v.desde.y, scale: 0.8, rotate: -6, opacity: 0.95 }}
                animate={{ x: [v.desde.x, midX, v.hacia.x], y: [v.desde.y, midY, v.hacia.y], scale: [0.8, 1.05, 0.85], rotate: [-6, 5, 0], opacity: [0.95, 1, 1] }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], times: [0, 0.55, 1] }}
                onAnimationComplete={() => finVuelo(v.key)}
                className="absolute top-0 left-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ width: 150, background: 'rgba(26,46,26,0.95)', border: '1px solid #c9a84c', boxShadow: '0 6px 18px rgba(201,168,76,0.4)' }}
              >
                <Package size={12} style={{ color: '#c9a84c', flexShrink: 0 }} />
                <span className="font-body text-[11px] text-crema truncate">{v.pedido.descripcion}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="glass-card rounded-2xl p-6 w-full max-w-4xl max-h-[92vh] overflow-y-auto"
        style={{ border: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl text-crema">Nuevo Paquete de Tienda</h2>
            <p className="font-body text-xs text-crema/40 mt-0.5">Agrupa los pedidos de un cliente que llegan juntos al warehouse</p>
          </div>
          <button onClick={onCerrar} disabled={bloqueado} className="text-crema/40 hover:text-crema transition-colors p-1 disabled:opacity-30"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda: caja 3D + datos */}
          <div className="space-y-5">
            <div ref={cajaRef}>
              <CajaTienda3D items={seleccionados} fase={fase} />
            </div>

            {/* 1. Cliente */}
            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Cliente</label>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-crema/30" />
                <input value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} placeholder="Buscar cliente..." disabled={bloqueado}
                  className="w-full bg-selva-dark border border-white/10 rounded-lg pl-9 pr-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20 disabled:opacity-50" />
              </div>
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} disabled={bloqueado}
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none disabled:opacity-50">
                <option value="">Seleccionar cliente...</option>
                {clientesFiltrados.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
              </select>
            </div>

            {/* 3. Locutorio */}
            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Locutorio destino</label>
              {locutorios.length === 0 ? (
                <p className="font-body text-xs text-crema/30 py-2">No hay locutorios registrados</p>
              ) : (
                <select value={locutorioId} onChange={(e) => setLocutorioId(e.target.value)} disabled={bloqueado}
                  className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none disabled:opacity-50">
                  <option value="">Seleccionar locutorio...</option>
                  {locutorios.map((l) => <option key={l.id} value={l.id}>{l.nombre} — {l.ciudad}</option>)}
                </select>
              )}
            </div>

            {/* 4. Estado + 5. Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Estado inicial</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} disabled={bloqueado}
                  className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none disabled:opacity-50">
                  <option value="en_camino">En camino</option>
                  <option value="en_warehouse">En warehouse</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Llegada estimada</label>
                <input type="date" value={fechaEstimada} onChange={(e) => setFechaEstimada(e.target.value)} disabled={bloqueado}
                  className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none disabled:opacity-50" />
              </div>
            </div>

            {/* 6. Seguimiento */}
            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Nº Seguimiento <span className="text-crema/25 normal-case tracking-normal">(opcional)</span></label>
              <input type="text" value={seguimiento} onChange={(e) => setSeguimiento(e.target.value)} placeholder="Opcional" disabled={bloqueado}
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20 disabled:opacity-50" />
            </div>

            {/* 7. Notas */}
            <div>
              <label className="block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5">Notas Internas <span className="text-crema/25 normal-case tracking-normal">(opcional)</span></label>
              <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones..." disabled={bloqueado}
                className="w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20 resize-none disabled:opacity-50" />
            </div>
          </div>

          {/* Columna derecha: multi-select de pedidos */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-xs text-crema/40 uppercase tracking-wider">Pedidos del cliente</p>
              {seleccionados.length > 0 && (
                <motion.span key={seleccionados.length} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                  className="font-body text-xs font-semibold text-dorado">
                  {seleccionados.length} seleccionado{seleccionados.length === 1 ? '' : 's'}
                </motion.span>
              )}
            </div>

            {cargandoPedidos ? (
              <div className="flex items-center justify-center flex-1 py-12">
                <div className="w-6 h-6 border-2 border-dorado border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !clienteId ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-crema/20">
                <Package size={36} />
                <p className="font-body text-sm mt-3">Selecciona un cliente primero</p>
              </div>
            ) : pedidos.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-crema/30">
                <span className="text-3xl mb-3">📭</span>
                <p className="font-body text-sm text-center">Este cliente no tiene pedidos pendientes</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
                {pedidos.map((pedido) => {
                  const sel = estaSeleccionado(pedido.id);
                  return (
                    <motion.button key={pedido.id} onClick={(e) => togglePedido(e, pedido)} disabled={bloqueado}
                      whileHover={{ scale: bloqueado ? 1 : 1.01 }} whileTap={{ scale: bloqueado ? 1 : 0.99 }}
                      className={`w-full text-left rounded-xl p-3 border transition-all disabled:opacity-60 ${sel ? 'bg-dorado/10 border-dorado/40' : 'bg-white/3 border-white/8 hover:border-white/15'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${sel ? 'bg-dorado border-dorado' : 'border-white/20'}`}>
                          {sel && <Check size={12} className="text-selva-dark" strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm text-crema font-medium truncate">{pedido.descripcion}</p>
                          <p className="font-body text-xs text-crema/50 mt-0.5 flex items-center gap-1">
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

            <motion.button onClick={handleCrear} disabled={!clienteId || seleccionados.length === 0 || !locutorioId || bloqueado}
              whileHover={{ scale: (clienteId && seleccionados.length && locutorioId && !bloqueado) ? 1.02 : 1 }} whileTap={{ scale: 0.98 }}
              className="mt-6 w-full py-3 rounded-xl font-body font-semibold text-sm text-selva-dark transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
              {fase === 'cerrando' ? '📦 Cerrando paquete...' : fase === 'exito' ? '✓ Registrado' : `Registrar Paquete${seleccionados.length > 0 ? ` (${seleccionados.length})` : ''}`}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

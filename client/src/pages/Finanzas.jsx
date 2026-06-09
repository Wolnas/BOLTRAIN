import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import {
  Download, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Package, Send, DollarSign, Plus, Trash2, Wallet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  obtenerResumen, obtenerBalance,
  listarComprasDolares, crearCompraDolares, eliminarCompraDolares,
} from '../api/finanzas';
import { useAuth } from '../context/AuthContext';
import { PageWrapper, Spinner, ContadorAnimado } from '../components/dashboard/ui';
import toast from 'react-hot-toast';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const num = (v) => parseFloat(v || 0);

/* ─── Tarjeta resumen con contador y glow ─── */
function ResumenCard({ label, valor, prefijo = '€ ', icon: Icon, delay, signo = false }) {
  const positivo = valor >= 0;
  const glow = signo ? (positivo ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)') : 'rgba(201,168,76,0.12)';
  const color = signo ? (positivo ? '#22c55e' : '#ef4444') : '#c9a84c';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay }}
      className="glass-card rounded-2xl p-5 relative overflow-hidden"
      style={{ boxShadow: `0 0 24px ${glow}, 0 8px 32px rgba(0,0,0,0.4)` }}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-body text-xs text-crema/40 uppercase tracking-widest">{label}</p>
        {Icon && <Icon size={15} style={{ color }} />}
      </div>
      <p className="font-display text-2xl font-bold" style={{ color }}>
        {signo && positivo ? '+' : ''}<ContadorAnimado valor={valor} decimales={2} prefijo={prefijo} />
      </p>
    </motion.div>
  );
}

/* ─── Tooltip del gráfico ─── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="glass-card rounded-lg px-3 py-2" style={{ border: '1px solid rgba(201,168,76,0.3)' }}>
      <p className="font-body text-xs text-crema/60 capitalize">{label}</p>
      <p className="font-body text-sm font-semibold" style={{ color: v >= 0 ? '#22c55e' : '#ef4444' }}>€ {num(v).toFixed(2)}</p>
    </div>
  );
}

/* ─── Formulario de compra de dólares ─── */
function FormCompra({ onCreado }) {
  const hoy = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ fecha: hoy, bolivianos: '', tipo_cambio: '', dolares: '', notas: '' });
  const [enviando, setEnviando] = useState(false);
  const campo = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  // Sugerencia automática de dólares
  const sugerido = num(form.tipo_cambio) > 0 ? (num(form.bolivianos) / num(form.tipo_cambio)) : 0;

  const submit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await crearCompraDolares({ ...form, dolares: form.dolares || sugerido.toFixed(2) });
      toast.success('Compra registrada');
      setForm({ fecha: hoy, bolivianos: '', tipo_cambio: '', dolares: '', notas: '' });
      onCreado();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar');
    } finally {
      setEnviando(false);
    }
  };

  const inputCls = 'w-full bg-selva-dark border border-white/10 rounded-lg px-3 py-2 text-crema font-body text-sm focus:border-dorado/50 focus:outline-none placeholder:text-crema/20';
  const labelCls = 'block text-xs text-crema/50 font-body uppercase tracking-wider mb-1.5';

  return (
    <form onSubmit={submit} className="glass-card rounded-2xl p-5">
      <p className="font-body text-sm font-semibold text-crema mb-4">Registrar compra de dólares</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <label className={labelCls}>Fecha</label>
          <input type="date" required value={form.fecha} onChange={campo('fecha')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Bolivianos</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dorado text-sm">Bs</span>
            <input type="number" min="0" step="0.01" required placeholder="0.00" value={form.bolivianos} onChange={campo('bolivianos')} className={`${inputCls} pl-9`} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Tipo de Cambio</label>
          <input type="number" min="0" step="0.0001" required placeholder="ej: 10.40" value={form.tipo_cambio} onChange={campo('tipo_cambio')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Dólares</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 text-sm">$</span>
            <input type="number" min="0" step="0.01" placeholder={sugerido ? sugerido.toFixed(2) : '0.00'} value={form.dolares} onChange={campo('dolares')} className={`${inputCls} pl-7`} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <label className={labelCls}>Notas</label>
          <input value={form.notas} onChange={campo('notas')} placeholder="Opcional" className={inputCls} />
        </div>
        <motion.button type="submit" disabled={enviando} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-selva-dark disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
          <Plus size={15} /> {enviando ? 'Guardando...' : 'Agregar'}
        </motion.button>
      </div>
    </form>
  );
}

export default function Finanzas() {
  const { usuario } = useAuth();
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [data, setData] = useState(null);
  const [balance, setBalance] = useState([]);
  const [compras, setCompras] = useState({ compras: [], totalDolares: 0 });
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [r, b, c] = await Promise.all([
        obtenerResumen(mes, anio),
        obtenerBalance(),
        listarComprasDolares(mes, anio),
      ]);
      setData(r.data);
      setBalance(b.data.meses);
      setCompras(c.data);
    } catch {
      toast.error('Error cargando finanzas');
    } finally {
      setCargando(false);
    }
  }, [mes, anio]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarMes = (delta) => {
    let m = mes + delta, a = anio;
    if (m < 1) { m = 12; a--; } else if (m > 12) { m = 1; a++; }
    setMes(m); setAnio(a);
  };

  const exportar = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    const pedidos = data.pedidos.map((p) => ({
      Cliente: `${p.cliente_nombre} ${p.cliente_apellido}`, Descripción: p.descripcion,
      Total: num(p.precio_total), Venta: num(p.precio_venta), Ganancia: num(p.ganancia),
      'Cotizado Bs': num(p.precio_cotizado_bob), 'Tipo Cambio': num(p.tipo_cambio_aplicado),
    }));
    const envios = data.paquetes.map((p) => ({
      Cliente: `${p.cliente_nombre} ${p.cliente_apellido}`,
      'Envío Bolivia': num(p.precio_envio_bolivia),
    }));
    const comprasX = compras.compras.map((c) => ({
      Fecha: c.fecha?.split('T')[0], Bolivianos: num(c.bolivianos), 'Tipo Cambio': num(c.tipo_cambio),
      Dólares: num(c.dolares), Notas: c.notas || '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pedidos), 'Productos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(envios), 'Envíos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(comprasX), 'Compras USD');
    XLSX.writeFile(wb, `finanzas_${MESES[mes - 1]}_${anio}.xlsx`);
    toast.success('Excel descargado');
  };

  if (usuario?.rol !== 'admin') {
    return <div className="flex items-center justify-center h-64"><p className="text-crema/40 font-body">Acceso restringido a administradores</p></div>;
  }

  const r = data?.resumen;
  // Totales productos en EUR / BOB / USD
  const totEUR = data ? data.pedidos.reduce((s, p) => s + num(p.ganancia), 0) : 0;
  const totBOB = data ? data.pedidos.reduce((s, p) => s + num(p.precio_cotizado_bob), 0) : 0;
  const totUSD = data ? data.pedidos.reduce((s, p) => s + (num(p.tipo_cambio_aplicado) > 0 ? num(p.precio_cotizado_bob) / num(p.tipo_cambio_aplicado) : 0), 0) : 0;

  return (
    <PageWrapper className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="font-display text-3xl font-bold text-crema">Finanzas</h1>
          <p className="font-body text-sm text-crema/50 mt-0.5">Resumen económico del mes</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Selector mes/año */}
          <div className="flex items-center gap-1 glass-card rounded-xl px-1 py-1">
            <button onClick={() => cambiarMes(-1)} className="p-1.5 rounded-lg text-crema/50 hover:text-dorado hover:bg-white/5 transition-colors"><ChevronLeft size={16} /></button>
            <AnimatePresence mode="wait">
              <motion.span key={`${mes}-${anio}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
                className="font-body text-sm font-medium text-crema min-w-32 text-center">
                {MESES[mes - 1]} {anio}
              </motion.span>
            </AnimatePresence>
            <button onClick={() => cambiarMes(1)} className="p-1.5 rounded-lg text-crema/50 hover:text-dorado hover:bg-white/5 transition-colors"><ChevronRight size={16} /></button>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportar}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-selva-dark"
            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8d5a3,#c9a84c)', backgroundSize: '200% auto' }}>
            <Download size={15} /> Excel
          </motion.button>
        </div>
      </div>

      {cargando || !r ? (
        <Spinner />
      ) : (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <ResumenCard label="Invertido" valor={r.totalInvertido} icon={Package} delay={0} />
            <ResumenCard label="Cobrado" valor={r.totalCobrado} icon={DollarSign} delay={0.05} />
            <ResumenCard label="Gananc. Productos" valor={r.gananciaProductos} icon={TrendingUp} delay={0.1} signo />
            <ResumenCard label="Result. Envíos" valor={r.resultadoEnvios} icon={Send} delay={0.15} signo />
            <ResumenCard label="Balance Total" valor={r.balance} icon={Wallet} delay={0.2} signo />
          </div>

          {/* ── Sección 1: Ganancia Productos ── */}
          <Seccion titulo="Ganancia de Productos" icon={Package}>
            {data.pedidos.length === 0 ? (
              <p className="font-body text-sm text-crema/30 py-6 text-center">Sin pedidos este mes</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Cliente', 'Descripción', 'Total', 'Venta', 'Ganancia'].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs text-crema/40 font-body uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.pedidos.map((p, i) => {
                        const g = num(p.ganancia);
                        return (
                          <motion.tr key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                            className="border-b border-white/5" style={g < 0 ? { background: 'rgba(239,68,68,0.06)' } : {}}>
                            <td className="px-4 py-2.5 font-body text-sm text-crema whitespace-nowrap">{p.cliente_nombre} {p.cliente_apellido}</td>
                            <td className="px-4 py-2.5 font-body text-sm text-crema/60 max-w-[200px]"><span className="block truncate">{p.descripcion}</span></td>
                            <td className="px-4 py-2.5 font-body text-sm text-crema/70 whitespace-nowrap">{p.moneda} {num(p.precio_total).toFixed(2)}</td>
                            <td className="px-4 py-2.5 font-body text-sm text-crema/70 whitespace-nowrap">{p.moneda} {num(p.precio_venta).toFixed(2)}</td>
                            <td className={`px-4 py-2.5 font-body text-sm font-semibold whitespace-nowrap ${g >= 0 ? 'text-green-400' : 'text-red-400'}`}>{p.moneda} {g.toFixed(2)}</td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Totales multi-moneda */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/5">
                  <TotalChip label="Ganancia EUR" valor={`€ ${totEUR.toFixed(2)}`} />
                  <TotalChip label="Cotizado BOB" valor={`Bs ${totBOB.toFixed(2)}`} />
                  <TotalChip label="Cotizado USD" valor={`$ ${totUSD.toFixed(2)}`} />
                </div>
              </>
            )}
          </Seccion>

          {/* ── Sección 2: Ganancia Envíos ── */}
          <Seccion titulo="Ganancia de Envíos" icon={Send}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MiniStat label="Cobrado por envíos a Bolivia" valor={r.enviosCobrado} color="#3b82f6" />
              <MiniStat label="Resultado del mes" valor={r.resultadoEnvios} color={r.resultadoEnvios >= 0 ? '#22c55e' : '#ef4444'} signo />
            </div>
          </Seccion>

          {/* ── Sección 3: Compras de Dólares ── */}
          <Seccion titulo="Compras de Dólares" icon={DollarSign}>
            <FormCompra onCreado={cargar} />
            <div className="mt-4">
              {compras.compras.length === 0 ? (
                <p className="font-body text-sm text-crema/30 py-4 text-center">Sin compras este mes</p>
              ) : (
                <div className="space-y-2">
                  {compras.compras.map((c) => (
                    <motion.div key={c.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between glass-card rounded-xl px-4 py-3">
                      <div className="flex items-center gap-4">
                        <span className="font-body text-xs text-crema/40">{c.fecha?.split('T')[0]}</span>
                        <span className="font-body text-sm text-crema">Bs {num(c.bolivianos).toFixed(2)}</span>
                        <span className="font-body text-xs text-crema/40">× {num(c.tipo_cambio).toFixed(2)}</span>
                        <span className="font-body text-sm font-semibold text-green-400">$ {num(c.dolares).toFixed(2)}</span>
                        {c.notas && <span className="font-body text-xs text-crema/30 hidden md:inline">· {c.notas}</span>}
                      </div>
                      <button onClick={async () => { await eliminarCompraDolares(c.id); cargar(); }}
                        className="p-1.5 text-crema/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={13} /></button>
                    </motion.div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <span className="font-body text-sm text-crema/60">Total comprado: <span className="font-semibold text-green-400">$ {num(compras.totalDolares).toFixed(2)}</span></span>
                  </div>
                </div>
              )}
            </div>
          </Seccion>

          {/* ── Balance 6 meses ── */}
          <Seccion titulo="Balance — últimos 6 meses" icon={r.balance >= 0 ? TrendingUp : TrendingDown}>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <ComposedChart data={balance} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(245,240,232,0.4)', fontSize: 12, fontFamily: 'Raleway' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(245,240,232,0.4)', fontSize: 11, fontFamily: 'Raleway' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="balance" radius={[6, 6, 0, 0]} animationDuration={900} barSize={38}>
                    {balance.map((m, i) => (
                      <Cell key={i} fill={m.balance >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="balance" stroke="#c9a84c" strokeWidth={2.5} dot={{ fill: '#c9a84c', r: 4 }} animationDuration={1100}
                    activeDot={{ r: 6, fill: '#e8d5a3' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Seccion>
        </>
      )}
    </PageWrapper>
  );
}

/* ─── Helpers de presentación ─── */
function Seccion({ titulo, icon: Icon, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }} className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <Icon size={16} className="text-dorado" />
        </div>
        <h2 className="font-display text-lg text-crema">{titulo}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function TotalChip({ label, valor }) {
  return (
    <div className="flex flex-col px-4 py-2 rounded-xl bg-white/3 border border-white/5">
      <span className="font-body text-[10px] text-crema/40 uppercase tracking-wider">{label}</span>
      <span className="font-body text-sm font-semibold text-crema">{valor}</span>
    </div>
  );
}

function MiniStat({ label, valor, color, signo = false }) {
  return (
    <div className="rounded-xl bg-white/3 border border-white/5 p-4">
      <p className="font-body text-xs text-crema/40 uppercase tracking-wider mb-2">{label}</p>
      <p className="font-display text-xl font-bold" style={{ color }}>
        {signo && valor >= 0 ? '+' : ''}<ContadorAnimado valor={valor} decimales={2} prefijo="€ " />
      </p>
    </div>
  );
}

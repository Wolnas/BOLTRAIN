import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, Check, Clock } from 'lucide-react';
import { listarPaquetes } from '../../api/paquetes';
import { PageWrapper, Spinner, VacioEstado, staggerContainer, staggerItem } from '../dashboard/ui';
import toast from 'react-hot-toast';

/* Pasos del timeline del cliente. El estado interno (armando/enviado/entregado)
   se mapea a una etiqueta amigable. */
const PASOS = [
  { key: 'armando',   label: 'Pendiente',   icon: Clock },
  { key: 'enviado',   label: 'En Tránsito', icon: Truck },
  { key: 'entregado', label: 'Entregado',   icon: Check },
];
const INDICE = { armando: 0, enviado: 1, entregado: 2 };

function Timeline({ estado }) {
  const actual = INDICE[estado] ?? 0;
  return (
    <div className="flex items-center justify-between mt-5 mb-1 relative">
      {/* Línea base */}
      <div className="absolute left-5 right-5 top-4 h-0.5 bg-white/8" />
      <motion.div
        className="absolute left-5 top-4 h-0.5 bg-dorado"
        style={{ boxShadow: '0 0 6px rgba(201,168,76,0.6)' }}
        initial={{ width: 0 }}
        animate={{ width: `calc(${(actual / (PASOS.length - 1)) * 100}% - ${actual === 0 ? 0 : 0}px)` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {PASOS.map((paso, i) => {
        const completado = i < actual;
        const esActual = i === actual;
        const Icon = paso.icon;
        return (
          <div key={paso.key} className="relative z-10 flex flex-col items-center gap-2" style={{ flex: 1 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.12 + 0.2, type: 'spring', stiffness: 300, damping: 18 }}
              className="w-8 h-8 rounded-full flex items-center justify-center border-2"
              style={{
                background: completado || esActual ? '#c9a84c' : '#0d1f0d',
                borderColor: completado || esActual ? '#c9a84c' : 'rgba(255,255,255,0.12)',
                animation: esActual ? 'pulseGold 2s ease-in-out infinite' : 'none',
              }}
            >
              {completado ? (
                <Check size={15} className="text-selva-dark" strokeWidth={3} />
              ) : (
                <Icon size={14} className={esActual ? 'text-selva-dark' : 'text-crema/30'} />
              )}
            </motion.div>
            <span className={`font-body text-[11px] ${completado || esActual ? 'text-dorado' : 'text-crema/30'}`}>
              {paso.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CardCliente({ paquete }) {
  const descripciones = paquete.pedidos_desc ? paquete.pedidos_desc.split('|||') : [];
  return (
    <motion.div
      variants={staggerItem}
      className="glass-card rounded-2xl p-5"
      style={{ border: '1px solid rgba(201,168,76,0.15)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-dorado" />
          <span className="font-body text-sm font-semibold text-crema">Paquete #{paquete.id}</span>
        </div>
        {paquete.fecha_estimada && (
          <span className="font-body text-xs text-crema/40">
            Llega aprox. {new Date(paquete.fecha_estimada).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
          </span>
        )}
      </div>

      <Timeline estado={paquete.estado} />

      <div className="space-y-1.5 mt-5 pt-4 border-t border-white/5">
        <p className="font-body text-xs text-crema/40 uppercase tracking-wider mb-2">Contenido</p>
        {descripciones.map((d, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-sm">📦</span>
            <span className="font-body text-sm text-crema/80">{d}</span>
          </div>
        ))}
      </div>

      {paquete.numero_seguimiento && (
        <div className="pt-3 mt-3 border-t border-white/5 flex items-center gap-2">
          <Truck size={14} className="text-dorado" />
          <span className="font-body text-sm text-crema/70">Seguimiento:</span>
          <span className="font-body text-sm text-dorado font-medium">{paquete.numero_seguimiento}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function ViewerPaquetes() {
  const [paquetes, setPaquetes] = useState([]);
  const [cargando, setCargando] = useState(true);

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

  return (
    <PageWrapper className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-crema">Mis Paquetes</h1>
        <p className="font-body text-sm text-crema/50 mt-0.5">Sigue el estado de tus envíos desde España</p>
      </div>

      {cargando ? (
        <Spinner />
      ) : paquetes.length === 0 ? (
        <VacioEstado icono={<Package size={48} strokeWidth={1} />} titulo="Sin paquetes" texto="Aún no tienes paquetes registrados." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
          {paquetes.map((p) => <CardCliente key={p.id} paquete={p} />)}
        </motion.div>
      )}
    </PageWrapper>
  );
}

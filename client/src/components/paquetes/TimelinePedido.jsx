import { motion } from 'framer-motion';
import { Truck, Warehouse, Send, Check, Package, ShoppingBag } from 'lucide-react';
import { staggerItem } from '../dashboard/ui';
import { TIMELINE_PASOS, TIMELINE_INDICE } from './estados';

const ICONOS = [Truck, Warehouse, Send, Check];

/* Timeline horizontal de 4 pasos del viaje de un pedido.
   Paso actual con pulso dorado, completados con check verde. */
function Timeline({ estado }) {
  const actual = TIMELINE_INDICE[estado] ?? 0;
  return (
    <div className="flex items-start justify-between mt-5 mb-1 relative">
      {/* Línea base + progreso */}
      <div className="absolute left-4 right-4 top-4 h-0.5 bg-white/8" />
      <motion.div
        className="absolute left-4 top-4 h-0.5 bg-dorado"
        style={{ boxShadow: '0 0 6px rgba(201,168,76,0.6)' }}
        initial={{ width: 0 }}
        animate={{ width: `calc(${(actual / (TIMELINE_PASOS.length - 1)) * 100}% - ${(actual / (TIMELINE_PASOS.length - 1)) * 32}px)` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {TIMELINE_PASOS.map((paso, i) => {
        const completado = i < actual;
        const esActual = i === actual;
        const Icon = ICONOS[i];
        return (
          <div key={paso.key} className="relative z-10 flex flex-col items-center gap-2" style={{ flex: 1 }}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 + 0.15, type: 'spring', stiffness: 300, damping: 18 }}
              className="w-8 h-8 rounded-full flex items-center justify-center border-2"
              style={{
                background: completado ? '#22c55e' : esActual ? '#c9a84c' : '#0d1f0d',
                borderColor: completado ? '#22c55e' : esActual ? '#c9a84c' : 'rgba(255,255,255,0.12)',
                animation: esActual ? 'pulseGold 2s ease-in-out infinite' : 'none',
              }}
            >
              {completado ? (
                <Check size={15} className="text-selva-dark" strokeWidth={3} />
              ) : (
                <Icon size={14} className={esActual ? 'text-selva-dark' : 'text-crema/30'} />
              )}
            </motion.div>
            <span className={`font-body text-[10px] text-center leading-tight ${completado ? 'text-green-400' : esActual ? 'text-dorado' : 'text-crema/30'}`}>
              {paso.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* Card de un pedido tal como lo ve el cliente: tienda, descripción,
   timeline y fecha estimada. Sin precios, locutorio ni notas. */
export default function TimelinePedido({ pedido }) {
  return (
    <motion.div variants={staggerItem} whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="glass-card rounded-2xl p-5" style={{ border: '1px solid rgba(201,168,76,0.15)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={13} className="text-dorado shrink-0" />
            <span className="font-body text-sm font-semibold text-crema truncate">{pedido.tienda_origen}</span>
          </div>
          <div className="flex items-start gap-2 mt-2">
            <Package size={13} className="text-crema/40 shrink-0 mt-0.5" />
            <span className="font-body text-sm text-crema/75">{pedido.descripcion}</span>
          </div>
        </div>
        {pedido.fecha_estimada && (
          <span className="shrink-0 font-body text-xs text-crema/40 text-right">
            Llega aprox.<br />{new Date(pedido.fecha_estimada).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
          </span>
        )}
      </div>

      <Timeline estado={pedido.estado} />

      {pedido.numero_seguimiento && (
        <div className="pt-3 mt-4 border-t border-white/5 flex items-center gap-2">
          <Truck size={13} className="text-dorado" />
          <span className="font-body text-xs text-crema/60">Seguimiento:</span>
          <span className="font-body text-xs text-dorado font-medium">{pedido.numero_seguimiento}</span>
        </div>
      )}
    </motion.div>
  );
}

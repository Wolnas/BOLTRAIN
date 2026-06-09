import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/* ─── Variantes de animación reutilizables ─── */
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

/* Envoltorio de página: fade + slide up suave al entrar */
export function PageWrapper({ children, className = '' }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Contador animado (números que suben al cargar) ─── */
export function ContadorAnimado({ valor, decimales = 0, prefijo = '', sufijo = '' }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const inicio = prevRef.current;
    const fin = Number(valor) || 0;
    prevRef.current = fin;
    if (inicio === fin) { setDisplay(fin); return; }
    const duracion = 900;
    const t0 = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min((t - t0) / duracion, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(inicio + (fin - inicio) * ease);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [valor]);

  const formateado = decimales > 0
    ? display.toLocaleString('es-ES', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
    : Math.round(display).toLocaleString('es-ES');
  return `${prefijo}${formateado}${sufijo}`;
}

/* ─── Tabs con contador y subrayado dorado animado ─── */
export function Tabs({ tabs, activo, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 mb-6 relative">
      {tabs.map((t) => {
        const isActive = activo === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors duration-200 ${
              isActive ? 'text-dorado' : 'text-crema/50 hover:text-crema'
            }`}
          >
            <span className="flex items-center gap-2">
              {t.label}
              {t.count !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold transition-colors ${
                    isActive ? 'bg-dorado/20 text-dorado' : 'bg-white/5 text-crema/40'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </span>
            {isActive && (
              <motion.div
                layoutId={`tab-underline-${tabs.map((x) => x.key).join('')}`}
                className="absolute left-2 right-2 -bottom-0.5 h-0.5 rounded-full bg-dorado"
                style={{ boxShadow: '0 0 8px rgba(201,168,76,0.6)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Estado vacío ─── */
export function VacioEstado({ icono, titulo, texto }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-20 text-crema/40"
    >
      <div className="mb-4 opacity-60">{icono}</div>
      <p className="font-display text-xl mb-1">{titulo}</p>
      {texto && <p className="font-body text-sm text-crema/30">{texto}</p>}
    </motion.div>
  );
}

/* ─── Spinner ─── */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-dorado border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

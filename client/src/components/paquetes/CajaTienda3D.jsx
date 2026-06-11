import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Package, Check } from 'lucide-react';

/* ════════════════════════════════════════════════════════════
 *  Caja 3D isométrica animada — centro visual del formulario
 *  "Nuevo Paquete de Tienda".
 *
 *  props:
 *   - items: pedidos dentro de la caja (array)
 *   - fase:  'idle' | 'guardando' | 'cerrando' | 'exito'
 *  Paleta BOLTRAIN: frente #1a2e1a, lado #0d1f0d, tapa #2d4a2d, dorado #c9a84c.
 * ════════════════════════════════════════════════════════════ */
export default function CajaTienda3D({ items = [], fase = 'idle' }) {
  const controls = useAnimationControls();      // wiggle del cuerpo al recibir/soltar
  const prevCount = useRef(items.length);

  // Shake (wiggle) cada vez que cambia el nº de ítems dentro
  useEffect(() => {
    const prev = prevCount.current;
    const now = items.length;
    if (now > prev) {
      controls.start({ rotate: [0, -3, 3, -1.5, 0], transition: { duration: 0.5, ease: 'easeInOut' } });
    } else if (now < prev) {
      controls.start({ rotate: [0, 2, -2, 0], transition: { duration: 0.4, ease: 'easeInOut' } });
    }
    prevCount.current = now;
  }, [items.length, controls]);

  const cerrada = fase === 'cerrando' || fase === 'exito';
  const guardando = fase === 'guardando';
  const visibles = items.slice(0, 3);
  const extra = items.length - visibles.length;

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ minHeight: 280 }}>
      {/* Badge contador encima de la caja */}
      <div style={{ height: 28 }} className="mb-1 flex items-center justify-center">
        <AnimatePresence>
          {items.length > 0 && fase === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="px-3 py-1 rounded-full flex items-center gap-1.5"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.35)' }}
            >
              <motion.span
                key={items.length}                                   /* re-anima el número al cambiar */
                initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                style={{ color: '#c9a84c', fontWeight: 700, fontFamily: 'Raleway, sans-serif', fontSize: 13 }}
              >
                {items.length}
              </motion.span>
              <span style={{ color: '#c9a84c', fontFamily: 'Raleway, sans-serif', fontSize: 12 }}>
                {items.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Escena 3D */}
      <motion.div
        data-caja-target                                              /* referencia para el vuelo de ítems */
        animate={
          fase === 'exito'
            ? { opacity: 0, scale: 0.9, transition: { duration: 0.5, delay: 0.1 } }
            : guardando
            ? { y: [0, -12, 0], rotateY: [0, 360], transition: { duration: 1.6, repeat: Infinity, ease: 'linear' } }
            : { opacity: 1, scale: 1, y: 0 }
        }
        style={{ perspective: 700, perspectiveOrigin: '50% 35%', position: 'relative', width: 210, height: 200 }}
      >
        <motion.div animate={controls} style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%' }}>

          {/* Brillo dorado pulsante alrededor de la caja */}
          <motion.div
            animate={{ opacity: items.length > 0 ? [0.35, 0.7, 0.35] : [0.15, 0.3, 0.15] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: '24px 6px 30px 6px', borderRadius: 14,
              boxShadow: '0 0 32px 6px rgba(201,168,76,0.45)', pointerEvents: 'none', zIndex: 0,
            }}
          />

          {/* TAPA — abierta oscilando / cerrada en submit */}
          <motion.div
            animate={
              cerrada
                ? { rotateX: 0 }
                : { rotateX: [-20, -35, -20] }
            }
            transition={
              cerrada
                ? { duration: 1, ease: 'easeIn' }
                : { duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }
            }
            style={{
              position: 'absolute', top: 38, left: 5, width: 168, height: 40,
              background: 'linear-gradient(135deg, #3a5a3a 0%, #2d4a2d 100%)',
              border: '2px solid #c9a84c', borderRadius: '6px 6px 2px 2px',
              transformOrigin: 'bottom center', transformStyle: 'preserve-3d',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6,
              boxShadow: '0 -4px 14px rgba(201,168,76,0.18)',
            }}
          >
            <span style={{ fontSize: 10, letterSpacing: 3, color: '#c9a84c', fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>
              BOLTRAIN
            </span>
          </motion.div>

          {/* CUERPO — cara frontal */}
          <div style={{
            position: 'absolute', top: 66, left: 5, width: 168, height: 118,
            background: 'linear-gradient(180deg, #1a2e1a 0%, #16281a 100%)',
            border: '2px solid #c9a84c', borderRadius: '2px 0 8px 8px',
            padding: '12px 10px', overflow: 'hidden', zIndex: 5,
            boxShadow: 'inset 0 6px 18px rgba(0,0,0,0.45)',
          }}>
            {/* Glow interno dorado cuando hay pedidos */}
            <AnimatePresence>
              {items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 20%, rgba(201,168,76,0.22), transparent 70%)', pointerEvents: 'none' }}
                />
              )}
            </AnimatePresence>

            {items.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(245,240,232,0.22)', fontSize: 11, fontFamily: 'Raleway, sans-serif', textAlign: 'center', gap: 6 }}>
                <Package size={26} style={{ color: 'rgba(201,168,76,0.25)' }} />
                Selecciona pedidos
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative', zIndex: 1 }}>
                <AnimatePresence mode="popLayout">
                  {visibles.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ y: -70, opacity: 0, scale: 0.6, rotate: -6 }}
                      animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ y: -50, opacity: 0, scale: 0.7, transition: { duration: 0.25 } }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}   /* rebote suave */
                      style={{
                        background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
                        borderRadius: 5, padding: '4px 7px', fontSize: 10, color: '#f5f0e8',
                        display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Raleway, sans-serif',
                      }}
                    >
                      <Package size={11} style={{ color: '#c9a84c', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.descripcion}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {extra > 0 && (
                  <motion.span layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ fontSize: 10, color: 'rgba(201,168,76,0.7)', fontFamily: 'Raleway, sans-serif', paddingLeft: 4 }}>
                    +{extra} más
                  </motion.span>
                )}
              </div>
            )}
          </div>

          {/* CUERPO — cara lateral derecha (profundidad 3D) */}
          <div style={{
            position: 'absolute', top: 70, left: 171, width: 26, height: 114,
            background: 'linear-gradient(180deg, #0d1f0d 0%, #081408 100%)',
            border: '2px solid #c9a84c', borderLeft: 'none', borderRadius: '0 8px 8px 0',
            transform: 'skewY(28deg)', transformOrigin: 'left top', zIndex: 4,
            boxShadow: 'inset -6px 0 12px rgba(0,0,0,0.5)',
          }} />

          {/* Sello dorado de impacto al cerrar */}
          <AnimatePresence>
            {cerrada && (
              <motion.div
                initial={{ scale: 2, opacity: 0, rotate: -25 }}
                animate={{ scale: 1, opacity: 1, rotate: -10 }}
                transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.7 }}
                style={{
                  position: 'absolute', top: 96, left: '50%', x: '-50%', zIndex: 10,
                  width: 62, height: 62, borderRadius: '50%', marginLeft: -31,
                  background: 'radial-gradient(circle at 35% 30%, #e8d5a3, #c9a84c 70%)',
                  border: '3px solid #fff6df', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 18px rgba(201,168,76,0.6)',
                }}
              >
                <span style={{ fontSize: 9, fontWeight: 800, color: '#1a2e1a', fontFamily: 'Playfair Display, serif', letterSpacing: 1, textAlign: 'center', lineHeight: 1 }}>
                  BOL<br />TRAIN
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Sombra proyectada debajo */}
      <motion.div
        animate={{ scaleX: guardando ? [1, 0.8, 1] : 1, opacity: fase === 'exito' ? 0 : 0.5 }}
        transition={guardando ? { duration: 1.6, repeat: Infinity } : { duration: 0.4 }}
        style={{ width: 150, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', filter: 'blur(7px)', marginTop: -6 }}
      />

      {/* Éxito: checkmark verde dibujado + texto */}
      <AnimatePresence>
        {fase === 'exito' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          >
            <svg width="84" height="84" viewBox="0 0 84 84">
              <motion.circle cx="42" cy="42" r="38" fill="none" stroke="#22c55e" strokeWidth="4"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeInOut' }} />
              <motion.path d="M24 43 L37 56 L60 30" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: 'easeOut', delay: 0.5 }} />
            </svg>
            <motion.p
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              className="font-display text-lg text-crema"
            >
              ¡Paquete registrado!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

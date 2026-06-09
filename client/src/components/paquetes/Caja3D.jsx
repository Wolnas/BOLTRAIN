import { motion, AnimatePresence } from 'framer-motion';
import { Package, Check } from 'lucide-react';

/* Caja 3D animada: la tapa se abre/cierra y los pedidos "caen" dentro
   con una animación de gravedad. Al cerrar aparece un sello dorado. */
export default function Caja3D({ items, cerrandose }) {
  return (
    <div className="flex flex-col items-center" style={{ perspective: '600px', perspectiveOrigin: '50% 30%' }}>
      <div style={{ transform: 'rotateX(4deg)', transformStyle: 'preserve-3d', position: 'relative' }}>
        {/* Tapa */}
        <motion.div
          initial={{ rotateX: -145 }}
          animate={{ rotateX: cerrandose ? 0 : -145 }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          style={{
            width: '200px', height: '38px',
            background: 'linear-gradient(135deg, #243a24 0%, #1a2e1a 100%)',
            border: '2px solid #c9a84c', borderRadius: '6px 6px 0 0',
            transformOrigin: 'top center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 10,
            boxShadow: '0 -4px 12px rgba(201,168,76,0.12)',
          }}
        >
          <span style={{ fontSize: '11px', letterSpacing: '3px', color: '#c9a84c', fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>
            BOLTRAIN
          </span>
        </motion.div>

        {/* Cuerpo */}
        <div
          style={{
            width: '200px', minHeight: '160px',
            background: 'linear-gradient(180deg, #162b18 0%, #0d1f0d 100%)',
            border: '2px solid #c9a84c', borderTop: 'none', borderRadius: '0 0 10px 10px',
            padding: '10px 8px 10px', position: 'relative', overflow: 'hidden',
            boxShadow: '6px 6px 0 rgba(0,0,0,0.5), inset 0 0 24px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ position: 'absolute', right: '-8px', top: 0, bottom: 0, width: '8px', background: 'linear-gradient(90deg, rgba(201,168,76,0.12) 0%, rgba(0,0,0,0.25) 100%)', borderRadius: '0 4px 4px 0' }} />
          <div style={{ position: 'absolute', bottom: '-6px', left: '8px', right: '-8px', height: '6px', background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)', borderRadius: '0 0 4px 4px' }} />

          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '130px', color: 'rgba(245,240,232,0.2)', fontSize: '12px', fontFamily: 'Raleway, sans-serif', textAlign: 'center', gap: '8px' }}>
              <Package size={28} style={{ color: 'rgba(201,168,76,0.2)' }} />
              Selecciona pedidos<br />para agregar
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ y: -90, opacity: 0, scale: 0.6, rotate: -8 }}
                    animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.22)', borderRadius: '5px', padding: '4px 8px', fontSize: '10px', color: '#f5f0e8', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'Raleway, sans-serif' }}
                  >
                    <span>📦</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {item.descripcion}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Sello dorado al cerrar */}
        <AnimatePresence>
          {cerrandose && (
            <motion.div
              initial={{ scale: 0, rotate: -40, opacity: 0 }}
              animate={{ scale: 1, rotate: -12, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.5 }}
              style={{
                position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-50%)',
                width: '64px', height: '64px', borderRadius: '50%', zIndex: 20,
                background: 'radial-gradient(circle at 35% 30%, #e8d5a3, #c9a84c 70%)',
                border: '2px solid #fff6df',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(201,168,76,0.6)',
              }}
            >
              <Check size={30} className="text-selva-dark" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {items.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 flex items-center gap-2">
          <span style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '999px', padding: '3px 12px', fontSize: '12px', color: '#c9a84c', fontFamily: 'Raleway, sans-serif', fontWeight: 600 }}>
            {items.length} {items.length === 1 ? 'pedido' : 'pedidos'} dentro
          </span>
        </motion.div>
      )}
    </div>
  );
}

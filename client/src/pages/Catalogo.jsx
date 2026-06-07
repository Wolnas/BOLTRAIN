import { motion } from 'framer-motion';
import FallingLeaves from '../components/FallingLeaves';

export default function Catalogo() {
  return (
    <div className="relative flex-1 flex items-center justify-center min-h-[60vh] overflow-hidden">
      <FallingLeaves />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 text-center px-8"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-6xl mb-6"
        >
          🌿
        </motion.div>

        <h1 className="font-display text-4xl md:text-5xl font-bold text-crema mb-4">
          Catálogo
        </h1>

        <div
          className="inline-block px-5 py-2 rounded-full font-body text-sm font-semibold mb-6"
          style={{
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.3)',
            color: '#c9a84c',
            letterSpacing: '0.15em',
          }}
        >
          PRÓXIMAMENTE
        </div>

        <p className="font-body text-crema/50 text-lg max-w-sm mx-auto leading-relaxed">
          El catálogo de productos estará disponible muy pronto.
        </p>

        <div className="flex justify-center gap-2 mt-8">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#c9a84c' }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

import { motion } from 'framer-motion';
import FallingLeaves from './FallingLeaves';

export default function HeroSection({ onScrollToLogin, onScrollToRegister }) {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #243824 0%, #1a2e1a 50%, #0f1f0f 100%)',
      }}
    >
      <FallingLeaves />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 70%, rgba(74,124,89,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 30%, rgba(201,168,76,0.05) 0%, transparent 50%)
          `,
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mb-6"
        >
          <div
            className="font-display font-black tracking-wider leading-none select-none"
            style={{ fontSize: 'clamp(4rem, 12vw, 9rem)', letterSpacing: '0.05em' }}
          >
            <span style={{ color: '#f5f0e8' }}>BOL</span>
            <span style={{ color: '#c9a84c', textShadow: '0 0 40px rgba(201,168,76,0.4)' }}>TRAIN</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-24 h-px mb-6"
          style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="font-body font-light tracking-[0.3em] uppercase text-crema/70 mb-12"
          style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}
        >
          Importación mayorista de perfumería
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex gap-4 flex-wrap justify-center"
        >
          <button
            onClick={onScrollToRegister}
            className="btn-dorado px-8 py-3 text-sm font-semibold tracking-widest uppercase"
          >
            Crear cuenta
          </button>
          <button
            onClick={onScrollToLogin}
            className="px-8 py-3 text-sm font-semibold tracking-widest uppercase rounded-lg border border-dorado/40 text-dorado hover:bg-dorado/10 transition-all duration-300"
          >
            Iniciar sesión
          </button>
        </motion.div>
      </div>

      <motion.button
        onClick={() => document.getElementById('quienes').scrollIntoView({ behavior: 'smooth' })}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 1.5, duration: 0.6 },
          y: { repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 1.5 },
        }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-crema/40 hover:text-dorado transition-colors duration-300 z-10"
        aria-label="Desplazarse hacia abajo"
      >
        <span className="font-body text-xs tracking-widest uppercase">Descubrir</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 7L10 13L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.button>
    </section>
  );
}

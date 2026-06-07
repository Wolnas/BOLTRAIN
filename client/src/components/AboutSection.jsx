import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: 'easeOut' },
  }),
};

const IconImportacion = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="18" stroke="#c9a84c" strokeWidth="1.5" />
    <ellipse cx="20" cy="20" rx="8" ry="18" stroke="#c9a84c" strokeWidth="1" strokeDasharray="3 2" />
    <line x1="2" y1="20" x2="38" y2="20" stroke="#c9a84c" strokeWidth="1" />
    <path d="M26 14L32 20L26 26" stroke="#4a7c59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="20" x2="32" y2="20" stroke="#4a7c59" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconCalidad = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path
      d="M20 4L23.5 14H34L25.8 20.5L29 31L20 25L11 31L14.2 20.5L6 14H16.5L20 4Z"
      stroke="#c9a84c"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M20 10L22.2 17H29.5L23.8 21.2L25.8 28.5L20 24.8L14.2 28.5L16.2 21.2L10.5 17H17.8L20 10Z"
      fill="rgba(201,168,76,0.15)"
    />
  </svg>
);

const IconMayorista = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect x="4" y="22" width="32" height="14" rx="2" stroke="#c9a84c" strokeWidth="1.5" />
    <rect x="10" y="14" width="20" height="10" rx="1" stroke="#c9a84c" strokeWidth="1.5" />
    <rect x="15" y="8" width="10" height="8" rx="1" stroke="#4a7c59" strokeWidth="1.5" />
    <line x1="4" y1="29" x2="36" y2="29" stroke="#c9a84c" strokeWidth="1" />
    <rect x="17" y="29" width="6" height="7" rx="1" fill="rgba(201,168,76,0.2)" />
  </svg>
);

const PILARES = [
  {
    Icono: IconImportacion,
    titulo: 'Importación Global',
    texto: 'Traemos fragancias de los mercados más exclusivos del mundo directamente a tu negocio.',
  },
  {
    Icono: IconCalidad,
    titulo: 'Calidad Premium',
    texto: 'Cada perfume pasa por un riguroso control de autenticidad y calidad antes de llegar a vos.',
  },
  {
    Icono: IconMayorista,
    titulo: 'Distribución Mayorista',
    texto: 'Precios competitivos y volúmenes flexibles para revendedores, boutiques y grandes superficies.',
  },
];

export default function AboutSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="quienes"
      ref={ref}
      className="section-selva py-28 px-6"
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.4em] uppercase text-dorado/70 mb-4">
            Nuestra historia
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-crema mb-6">
            ¿Quiénes somos?
          </h2>
          <div
            className="w-16 h-px mx-auto mb-8"
            style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }}
          />
          <p className="font-body font-light text-lg text-crema/70 max-w-2xl mx-auto leading-relaxed">
            BOLTRAIN es una empresa dedicada a la importación mayorista de perfumería de lujo.
            Llevamos fragancias exclusivas desde el mundo hasta tus manos, con presencia
            en Bolivia y España.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PILARES.map(({ Icono, titulo, texto }, i) => (
            <motion.div
              key={titulo}
              custom={i + 1}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="glass-card rounded-2xl p-8 flex flex-col items-center text-center group hover:border-dorado/20 transition-colors duration-500"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="mb-5 p-4 rounded-full"
                style={{ background: 'rgba(74,124,89,0.15)' }}
              >
                <Icono />
              </motion.div>
              <h3 className="font-display text-xl font-semibold text-crema mb-3">{titulo}</h3>
              <p className="font-body font-light text-crema/60 leading-relaxed text-sm">{texto}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

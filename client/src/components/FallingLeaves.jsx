import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const LeafSVG = ({ size, color, opacity }) => (
  <svg
    width={size}
    height={size * 1.5}
    viewBox="0 0 40 60"
    fill="none"
    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
  >
    <path
      d="M20 2 C20 2 38 16 38 30 C38 46 30 58 20 58 C10 58 2 46 2 30 C2 16 20 2 20 2Z"
      fill={color}
      opacity={opacity}
    />
    <line x1="20" y1="58" x2="20" y2="8" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M20 22 C14 18 9 13 11 6" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" fill="none" />
    <path d="M20 22 C26 18 31 13 29 6" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" fill="none" />
    <path d="M20 36 C13 32 8 26 10 19" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" fill="none" />
    <path d="M20 36 C27 32 32 26 30 19" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" fill="none" />
  </svg>
);

const PALETA = ['#4a7c59', '#3d6b4a', '#5a8c69', '#2d5a3d', '#6a9c79', '#3a7050', '#4e8860'];

const HOJAS_DATA = [
  { id: 0,  x: 8,  size: 28, dur: 14, delay: 0,   drift: 35,  r0: 20,  r1: 200,  par: 0.4, color: PALETA[0], op: 0.75 },
  { id: 1,  x: 18, size: 20, dur: 11, delay: 2.5,  drift: -25, r0: 80,  r1: -100, par: 0.6, color: PALETA[1], op: 0.65 },
  { id: 2,  x: 30, size: 36, dur: 16, delay: 1,    drift: 50,  r0: 140, r1: 320,  par: 0.3, color: PALETA[2], op: 0.7  },
  { id: 3,  x: 45, size: 18, dur: 10, delay: 4,    drift: -40, r0: 60,  r1: -80,  par: 0.7, color: PALETA[3], op: 0.6  },
  { id: 4,  x: 58, size: 30, dur: 13, delay: 0.5,  drift: 30,  r0: 200, r1: 380,  par: 0.5, color: PALETA[4], op: 0.75 },
  { id: 5,  x: 70, size: 22, dur: 12, delay: 3,    drift: -20, r0: 30,  r1: 180,  par: 0.4, color: PALETA[5], op: 0.68 },
  { id: 6,  x: 82, size: 40, dur: 18, delay: 1.5,  drift: 45,  r0: 100, r1: 280,  par: 0.25,color: PALETA[6], op: 0.55 },
  { id: 7,  x: 92, size: 16, dur: 9,  delay: 5,    drift: -35, r0: 250, r1: 70,   par: 0.7, color: PALETA[0], op: 0.65 },
  { id: 8,  x: 3,  size: 32, dur: 15, delay: 7,    drift: 60,  r0: 180, r1: 360,  par: 0.35,color: PALETA[1], op: 0.7  },
  { id: 9,  x: 25, size: 24, dur: 11, delay: 8,    drift: -50, r0: 45,  r1: -150, par: 0.55,color: PALETA[2], op: 0.65 },
  { id: 10, x: 52, size: 19, dur: 10, delay: 2,    drift: 25,  r0: 300, r1: 120,  par: 0.6, color: PALETA[3], op: 0.6  },
  { id: 11, x: 65, size: 35, dur: 17, delay: 6,    drift: -30, r0: 70,  r1: 240,  par: 0.3, color: PALETA[4], op: 0.7  },
  { id: 12, x: 78, size: 21, dur: 12, delay: 9,    drift: 40,  r0: 160, r1: -20,  par: 0.5, color: PALETA[5], op: 0.65 },
  { id: 13, x: 40, size: 27, dur: 14, delay: 3.5,  drift: -45, r0: 90,  r1: 270,  par: 0.45,color: PALETA[6], op: 0.72 },
  { id: 14, x: 88, size: 14, dur: 8,  delay: 4.5,  drift: 20,  r0: 220, r1: 40,   par: 0.75,color: PALETA[0], op: 0.6  },
];

export default function FallingLeaves() {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const handleMouse = (e) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 40);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 20);
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {HOJAS_DATA.map((h) => (
        <motion.div
          key={h.id}
          style={{ position: 'absolute', left: `${h.x}%`, top: 0 }}
          animate={{
            y: ['-60px', '110vh'],
            x: [0, h.drift],
            rotate: [h.r0, h.r1],
          }}
          transition={{
            duration: h.dur,
            repeat: Infinity,
            delay: h.delay,
            ease: 'linear',
          }}
        >
          <motion.div
            style={{
              x: springX.get() * h.par,
              y: springY.get() * h.par,
            }}
          >
            <LeafSVG size={h.size} color={h.color} opacity={h.op} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

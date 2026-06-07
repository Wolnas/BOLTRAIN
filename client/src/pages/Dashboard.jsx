import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';

export default function Dashboard() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: 'radial-gradient(ellipse at top left, #243824 0%, #1a2e1a 40%, #0d1f0d 100%)',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        abierto={sidebarAbierto}
        onCerrar={() => setSidebarAbierto(false)}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar móvil */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 border-b border-white/5 sticky top-0 z-30"
          style={{ background: 'rgba(13,31,13,0.9)', backdropFilter: 'blur(12px)' }}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarAbierto(true)}
            className="text-crema/60 hover:text-crema transition-colors"
          >
            <Menu size={22} />
          </motion.button>
          <div className="font-display font-black text-lg tracking-wider select-none">
            <span style={{ color: '#f5f0e8' }}>BOL</span>
            <span style={{ color: '#c9a84c' }}>TRAIN</span>
          </div>
        </header>

        {/* Página activa */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

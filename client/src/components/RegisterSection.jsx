import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { registrar } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const CONFETTI_COLORS = ['#c9a84c', '#4a7c59', '#f5f0e8', '#e8d5a3', '#6a9c79'];
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: -80 + i * 10,
  y: -80 - (i % 3) * 40,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rotate: i * 25,
  size: 4 + (i % 3) * 3,
}));

function SuccessOverlay({ nombre }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-10 overflow-hidden"
      style={{ background: 'rgba(13,31,13,0.97)', backdropFilter: 'blur(8px)' }}
    >
      <div className="relative flex items-center justify-center mb-6">
        {CONFETTI.map((c) => (
          <motion.div
            key={c.id}
            className="absolute rounded-sm"
            style={{ width: c.size, height: c.size, background: c.color, borderRadius: '2px' }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
            animate={{ x: c.x, y: c.y, opacity: 0, rotate: c.rotate, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <CheckCircle2 size={72} className="text-dorado" strokeWidth={1.5} />
        </motion.div>
      </div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="font-display text-2xl text-crema mb-2"
      >
        ¡Bienvenido, {nombre}!
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="font-body text-crema/60 text-sm"
      >
        Cuenta creada correctamente
      </motion.p>
    </motion.div>
  );
}

function CampoInput({ label, id, error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-body text-xs text-crema/50 tracking-widest uppercase">
        {label}
      </label>
      <input
        id={id}
        className={`input-selva ${error ? 'error' : ''}`}
        {...props}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-400 text-xs font-body"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RegisterSection({ onScrollToLogin }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '', confirmar: '', pais: '',
  });
  const [errores, setErrores] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errores[name]) setErrores((er) => ({ ...er, [name]: '' }));
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.apellido.trim()) e.apellido = 'El apellido es requerido';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Ingresá un email válido';
    if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirmar) e.confirmar = 'Las contraseñas no coinciden';
    if (!form.pais) e.pais = 'Seleccioná un país';
    return e;
  };

  const enviar = async (e) => {
    e.preventDefault();
    const errs = validar();
    if (Object.keys(errs).length) { setErrores(errs); return; }

    setCargando(true);
    try {
      const { data } = await registrar({
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
        pais: form.pais,
      });
      setExito(true);
      setTimeout(() => {
        guardarSesion(data.token, data.user);
        navigate('/dashboard');
      }, 2200);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Error al registrar';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) {
        setErrores((er) => ({ ...er, email: msg }));
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <section
      id="registro"
      ref={ref}
      className="py-24 px-6 relative"
      style={{
        background: 'linear-gradient(180deg, #0d1f0d 0%, #1a2e1a 100%)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at 60% 40%, rgba(74,124,89,0.08) 0%, transparent 60%)`,
        }}
      />
      <div className="max-w-md mx-auto relative z-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-10"
        >
          <p className="font-body text-xs tracking-[0.4em] uppercase text-dorado/70 mb-3">
            Únite a BOLTRAIN
          </p>
          <h2 className="font-display text-4xl font-bold text-crema mb-4">Crear cuenta</h2>
          <div className="w-12 h-px mx-auto" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-8 relative overflow-hidden"
        >
          <AnimatePresence>
            {exito && <SuccessOverlay nombre={form.nombre} />}
          </AnimatePresence>

          <form onSubmit={enviar} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <CampoInput
                label="Nombre"
                id="reg-nombre"
                name="nombre"
                type="text"
                placeholder="Juan"
                autoComplete="given-name"
                value={form.nombre}
                onChange={cambiar}
                error={errores.nombre}
              />
              <CampoInput
                label="Apellido"
                id="reg-apellido"
                name="apellido"
                type="text"
                placeholder="Pérez"
                autoComplete="family-name"
                value={form.apellido}
                onChange={cambiar}
                error={errores.apellido}
              />
            </div>

            <CampoInput
              label="Email"
              id="reg-email"
              name="email"
              type="email"
              placeholder="juan@ejemplo.com"
              autoComplete="email"
              value={form.email}
              onChange={cambiar}
              error={errores.email}
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="reg-pass" className="font-body text-xs text-crema/50 tracking-widest uppercase">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="reg-pass"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={cambiar}
                  className={`input-selva pr-12 ${errores.password ? 'error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-crema/30 hover:text-dorado transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <AnimatePresence>
                {errores.password && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs font-body">
                    {errores.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="reg-confirm" className="font-body text-xs text-crema/50 tracking-widest uppercase">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  name="confirmar"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repetí tu contraseña"
                  autoComplete="new-password"
                  value={form.confirmar}
                  onChange={cambiar}
                  className={`input-selva pr-12 ${errores.confirmar ? 'error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-crema/30 hover:text-dorado transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <AnimatePresence>
                {errores.confirmar && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs font-body">
                    {errores.confirmar}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="reg-pais" className="font-body text-xs text-crema/50 tracking-widest uppercase">
                País
              </label>
              <select
                id="reg-pais"
                name="pais"
                value={form.pais}
                onChange={cambiar}
                className={`input-selva ${errores.pais ? 'error' : ''}`}
                style={{ appearance: 'none', background: 'transparent url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23f5f0e8\' opacity=\'0.4\' d=\'M2 4l4 4 4-4\'/%3E%3C/svg%3E") no-repeat right 12px center' }}
              >
                <option value="" disabled style={{ background: '#1a2e1a' }}>Seleccioná un país</option>
                <option value="España" style={{ background: '#1a2e1a' }}>🇪🇸 España</option>
                <option value="Bolivia" style={{ background: '#1a2e1a' }}>🇧🇴 Bolivia</option>
              </select>
              <AnimatePresence>
                {errores.pais && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs font-body">
                    {errores.pais}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="submit"
              disabled={cargando || exito}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-dorado w-full mt-2 flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <span className="w-4 h-4 border-2 border-selva-dark/40 border-t-selva-dark rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                'Crear cuenta'
              )}
            </motion.button>
          </form>

          <p className="text-center mt-6 font-body text-sm text-crema/40">
            ¿Ya tenés cuenta?{' '}
            <button
              onClick={onScrollToLogin}
              className="text-dorado hover:underline transition-all"
            >
              Iniciá sesión →
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

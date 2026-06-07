import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { iniciarSesion } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

export default function LoginSection({ onScrollToRegister }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [errorGlobal, setErrorGlobal] = useState('');
  const [suspendido, setSuspendido] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [cargando, setCargando] = useState(false);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errores[name]) setErrores((er) => ({ ...er, [name]: '' }));
    if (errorGlobal) setErrorGlobal('');
    if (suspendido) setSuspendido(false);
  };

  const validar = () => {
    const e = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Ingresá un email válido';
    if (!form.password) e.password = 'La contraseña es requerida';
    return e;
  };

  const enviar = async (e) => {
    e.preventDefault();
    const errs = validar();
    if (Object.keys(errs).length) { setErrores(errs); return; }

    setCargando(true);
    setErrorGlobal('');
    setSuspendido(false);

    try {
      const { data } = await iniciarSesion({ email: form.email, password: form.password });
      guardarSesion(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || 'Error al iniciar sesión';

      if (status === 403) {
        setSuspendido(true);
      } else {
        setErrorGlobal(msg);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <section
      id="login"
      ref={ref}
      className="py-24 px-6 relative"
      style={{
        background: 'linear-gradient(180deg, #1a2e1a 0%, #0d1f0d 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at 40% 60%, rgba(201,168,76,0.05) 0%, transparent 55%)`,
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
            Acceso exclusivo
          </p>
          <h2 className="font-display text-4xl font-bold text-crema mb-4">Iniciar sesión</h2>
          <div className="w-12 h-px mx-auto" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-8"
        >
          <AnimatePresence>
            {suspendido && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6 p-4 rounded-xl flex items-start gap-3"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <AlertTriangle size={20} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-body font-semibold text-red-400 text-sm">Cuenta suspendida</p>
                  <p className="font-body text-red-300/70 text-xs mt-1">
                    Tu cuenta ha sido suspendida. Contactá al administrador.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {errorGlobal && !suspendido && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 text-center font-body text-sm text-red-400 p-3 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {errorGlobal}
              </motion.p>
            )}
          </AnimatePresence>

          <form onSubmit={enviar} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="font-body text-xs text-crema/50 tracking-widest uppercase">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                value={form.email}
                onChange={cambiar}
                className={`input-selva ${errores.email ? 'error' : ''}`}
              />
              <AnimatePresence>
                {errores.email && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs font-body">
                    {errores.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="login-pass" className="font-body text-xs text-crema/50 tracking-widest uppercase">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-pass"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
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

            <motion.button
              type="submit"
              disabled={cargando}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-dorado w-full mt-2 flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <span className="w-4 h-4 border-2 border-selva-dark/40 border-t-selva-dark rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </motion.button>
          </form>

          <p className="text-center mt-6 font-body text-sm text-crema/40">
            ¿No tenés cuenta?{' '}
            <button
              onClick={onScrollToRegister}
              className="text-dorado hover:underline transition-all"
            >
              Registrate →
            </button>
          </p>
        </motion.div>
      </div>

      <div
        className="mt-16 text-center font-body text-xs text-crema/20 tracking-widest uppercase"
      >
        © 2024 BOLTRAIN — Todos los derechos reservados
      </div>
    </section>
  );
}

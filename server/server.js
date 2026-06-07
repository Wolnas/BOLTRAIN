require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const pedidosRoutes = require('./routes/pedidos');
const paquetesRoutes = require('./routes/paquetes');
const usuariosRoutes = require('./routes/usuarios');
const locutoriosRoutes = require('./routes/locutorios');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

/* ─── CORS ─── */
const origenesPermitidos = isProd
  ? process.env.CLIENT_URL || true   // true = acepta cualquier origen en prod
  : 'http://localhost:5173';

app.use(cors({ origin: origenesPermitidos, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ─── Rutas API ─── */
app.use('/api/auth',       authRoutes);
app.use('/api/pedidos',    pedidosRoutes);
app.use('/api/paquetes',   paquetesRoutes);
app.use('/api/usuarios',   usuariosRoutes);
app.use('/api/locutorios', locutoriosRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'BOLTRAIN', timestamp: new Date().toISOString() });
});

/* ─── Servir frontend compilado en producción ─── */
if (isProd) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

/* ─── Error handler ─── */
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🌿 Servidor BOLTRAIN corriendo en http://localhost:${PORT}`);
});

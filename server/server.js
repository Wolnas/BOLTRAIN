require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const pedidosRoutes = require('./routes/pedidos');
const paquetesRoutes = require('./routes/paquetes');
const usuariosRoutes = require('./routes/usuarios');
const locutoriosRoutes = require('./routes/locutorios');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/paquetes', paquetesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/locutorios', locutoriosRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'BOLTRAIN', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌿 Servidor BOLTRAIN corriendo en http://localhost:${PORT}`);
});

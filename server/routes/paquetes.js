const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const {
  listarTienda, pedidosSinTienda, crearTienda, actualizarEstadoTienda, eliminarTienda,
  listarCliente, misPaquetesCliente, pedidosDisponiblesCliente,
  crearCliente, actualizarEstadoCliente, eliminarCliente,
} = require('../controllers/paquetes');

/* ─── FLUJO 1: Paquetes de Tienda (admin + trabajador) ─── */
router.get('/tienda/pedidos-disponibles', auth, roles(1, 3), pedidosSinTienda);
router.get('/tienda', auth, roles(1, 3), listarTienda);
router.post('/tienda', auth, roles(1, 3), crearTienda);
router.put('/tienda/:id', auth, roles(1, 3), actualizarEstadoTienda);
router.delete('/tienda/:id', auth, roles(1), eliminarTienda);

/* ─── FLUJO 2: Paquetes de Cliente ─── */
// El viewer sólo ve los suyos (rutas específicas antes de las genéricas)
router.get('/cliente/mios', auth, misPaquetesCliente);
router.get('/cliente/pedidos-disponibles/:clienteId', auth, roles(1, 3), pedidosDisponiblesCliente);
router.get('/cliente', auth, roles(1, 3), listarCliente);
router.post('/cliente', auth, roles(1, 3), crearCliente);
router.put('/cliente/:id', auth, roles(1, 3), actualizarEstadoCliente);
router.delete('/cliente/:id', auth, roles(1), eliminarCliente);

module.exports = router;

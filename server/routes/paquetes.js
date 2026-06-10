const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const {
  listarTienda, pedidosSinTienda, crearTienda, actualizarEstadoTienda, eliminarTienda,
  listarBolivia, pedidosSinCaja, crearBolivia, actualizarEstadoBolivia, eliminarBolivia,
  misPedidos,
} = require('../controllers/paquetes');

/* ─── Vista cliente (cualquier autenticado ve los suyos) ─── */
router.get('/mispedidos', auth, misPedidos);

/* ─── Paquetes de Tienda (admin + trabajador) ─── */
router.get('/tienda/pedidos-disponibles', auth, roles(1, 3), pedidosSinTienda);
router.get('/tienda', auth, roles(1, 3), listarTienda);
router.post('/tienda', auth, roles(1, 3), crearTienda);
router.put('/tienda/:id', auth, roles(1, 3), actualizarEstadoTienda);
router.delete('/tienda/:id', auth, roles(1), eliminarTienda);

/* ─── Cajas para Bolivia (admin + trabajador) ─── */
router.get('/bolivia/pedidos-disponibles', auth, roles(1, 3), pedidosSinCaja);
router.get('/bolivia', auth, roles(1, 3), listarBolivia);
router.post('/bolivia', auth, roles(1, 3), crearBolivia);
router.put('/bolivia/:id', auth, roles(1, 3), actualizarEstadoBolivia);
router.delete('/bolivia/:id', auth, roles(1), eliminarBolivia);

module.exports = router;

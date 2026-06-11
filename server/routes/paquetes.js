const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const {
  listar, pedidosSinPaquete, crear, actualizarEstado, eliminar,
  listarBolivia, pedidosDisponibles, crearBolivia, actualizarEstadoBolivia, eliminarBolivia,
  misPedidos,
} = require('../controllers/paquetes');

/* ─── Vista cliente (cualquier autenticado ve los suyos) ─── */
router.get('/mispedidos', auth, misPedidos);

/* ─── Cajas para Bolivia (rutas específicas antes que /:id) ─── */
router.get('/bolivia', auth, roles(1, 3), listarBolivia);
router.post('/bolivia', auth, roles(1, 3), crearBolivia);
router.put('/bolivia/:id', auth, roles(1, 3), actualizarEstadoBolivia);
router.delete('/bolivia/:id', auth, roles(1), eliminarBolivia);

/* Pedidos disponibles */
router.get('/disponibles', auth, roles(1, 3), pedidosDisponibles);            // para caja Bolivia
router.get('/disponibles-tienda', auth, roles(1, 3), pedidosSinPaquete);      // para paquete de tienda (por cliente)

/* ─── Paquetes de tienda ─── */
router.get('/', auth, roles(1, 3), listar);
router.post('/', auth, roles(1, 3), crear);
router.put('/:id', auth, roles(1, 3), actualizarEstado);
router.delete('/:id', auth, roles(1), eliminar);

module.exports = router;

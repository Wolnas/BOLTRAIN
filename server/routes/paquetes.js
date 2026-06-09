const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const {
  listar, pedidosDisponibles, crear,
  actualizarEstado, actualizarEnvio, eliminar,
} = require('../controllers/paquetes');

// Todos los autenticados pueden listar (el controlador filtra según rol)
router.get('/', auth, listar);
// admin (1) y trabajador (3) arman paquetes
router.get('/pedidos-disponibles/:clienteId', auth, roles(1, 3), pedidosDisponibles);
router.post('/', auth, roles(1, 3), crear);
router.put('/:id/estado', auth, roles(1, 3), actualizarEstado);
router.put('/:id/envio', auth, roles(1), actualizarEnvio);
router.delete('/:id', auth, roles(1, 3), eliminar);

module.exports = router;

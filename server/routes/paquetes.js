const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const esAdmin = require('../middleware/esAdmin');
const { listar, pedidosDisponibles, crear, actualizarEstado, eliminar } = require('../controllers/paquetes');

router.get('/', auth, listar);
router.get('/pedidos-disponibles/:clienteId', auth, esAdmin, pedidosDisponibles);
router.post('/', auth, esAdmin, crear);
router.put('/:id/estado', auth, esAdmin, actualizarEstado);
router.delete('/:id', auth, esAdmin, eliminar);

module.exports = router;

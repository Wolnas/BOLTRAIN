const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { listar, crear, actualizar, cambiarEstado, eliminar } = require('../controllers/pedidos');

// admin (1) y trabajador (3) ven y cambian estado; solo admin crea/edita/borra
router.get('/', auth, roles(1, 3), listar);
router.post('/', auth, roles(1), crear);
router.put('/:id', auth, roles(1), actualizar);
router.patch('/:id/estado', auth, roles(1, 3), cambiarEstado);
router.delete('/:id', auth, roles(1), eliminar);

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { listar, listarTodos, crear, actualizar, toggleActivo } = require('../controllers/locutorios');

// Selector (activos) — cualquier autenticado
router.get('/', auth, listar);
// Gestión — solo admin
router.get('/todos', auth, roles(1), listarTodos);
router.post('/', auth, roles(1), crear);
router.put('/:id', auth, roles(1), actualizar);
router.patch('/:id/activo', auth, roles(1), toggleActivo);

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const esAdmin = require('../middleware/esAdmin');
const { listar, crear, actualizar, eliminar } = require('../controllers/pedidos');

router.get('/', auth, esAdmin, listar);
router.post('/', auth, esAdmin, crear);
router.put('/:id', auth, esAdmin, actualizar);
router.delete('/:id', auth, esAdmin, eliminar);

module.exports = router;

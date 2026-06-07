const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const esAdmin = require('../middleware/esAdmin');
const { listar, crear, actualizar, toggleActivo } = require('../controllers/usuarios');

router.get('/',       auth, esAdmin, listar);
router.post('/',      auth, esAdmin, crear);
router.put('/:id',    auth, esAdmin, actualizar);
router.patch('/:id/activo', auth, esAdmin, toggleActivo);

module.exports = router;

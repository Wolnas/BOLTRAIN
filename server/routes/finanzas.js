const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const {
  resumen, balanceMensual,
  listarCompras, crearCompra, eliminarCompra,
} = require('../controllers/finanzas');

// Todo el módulo de finanzas es solo para admin (1)
router.get('/resumen', auth, roles(1), resumen);
router.get('/balance', auth, roles(1), balanceMensual);
router.get('/compras-dolares', auth, roles(1), listarCompras);
router.post('/compras-dolares', auth, roles(1), crearCompra);
router.delete('/compras-dolares/:id', auth, roles(1), eliminarCompra);

module.exports = router;

// Fábrica de middleware de autorización por rol.
// Uso: roles(1)         -> solo admin
//      roles(1, 3)      -> admin o trabajador
const ROL = { ADMIN: 1, VIEWER: 2, TRABAJADOR: 3 };

const roles = (...permitidos) => (req, res, next) => {
  if (!req.user || !permitidos.includes(req.user.rol_id)) {
    return res.status(403).json({ error: 'No tienes permiso para esta acción' });
  }
  next();
};

module.exports = roles;
module.exports.ROL = ROL;

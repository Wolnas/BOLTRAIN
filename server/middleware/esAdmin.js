module.exports = (req, res, next) => {
  if (req.user?.rol_id !== 1) {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
};

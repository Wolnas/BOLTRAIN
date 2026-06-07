const pool = require('../config/db');

const listar = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM locutorios WHERE activo = 1 ORDER BY nombre ASC'
    );
    res.json({ locutorios: rows });
  } catch (err) {
    console.error('Error listando locutorios:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = { listar };

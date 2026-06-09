const pool = require('../config/db');

/* Lista para selectores: solo locutorios activos (cualquier usuario autenticado) */
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

/* Lista completa (incluye inactivos) — solo admin */
const listarTodos = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM locutorios ORDER BY nombre ASC');
    res.json({ locutorios: rows });
  } catch (err) {
    console.error('Error listando locutorios:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, ciudad, direccion, telefono } = req.body;
    if (!nombre || !ciudad || !direccion) {
      return res.status(400).json({ error: 'Nombre, ciudad y dirección son requeridos' });
    }
    const [result] = await pool.execute(
      'INSERT INTO locutorios (nombre, ciudad, direccion, telefono, activo) VALUES (?, ?, ?, ?, 1)',
      [nombre, ciudad, direccion, telefono || null]
    );
    const [rows] = await pool.execute('SELECT * FROM locutorios WHERE id = ?', [result.insertId]);
    res.status(201).json({ locutorio: rows[0] });
  } catch (err) {
    console.error('Error creando locutorio:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, ciudad, direccion, telefono } = req.body;
    const [check] = await pool.execute('SELECT id FROM locutorios WHERE id = ?', [id]);
    if (check.length === 0) return res.status(404).json({ error: 'Locutorio no encontrado' });

    await pool.execute(
      'UPDATE locutorios SET nombre=?, ciudad=?, direccion=?, telefono=? WHERE id=?',
      [nombre, ciudad, direccion, telefono || null, id]
    );
    const [rows] = await pool.execute('SELECT * FROM locutorios WHERE id = ?', [id]);
    res.json({ locutorio: rows[0] });
  } catch (err) {
    console.error('Error actualizando locutorio:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const toggleActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT activo FROM locutorios WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Locutorio no encontrado' });
    const nuevo = rows[0].activo ? 0 : 1;
    await pool.execute('UPDATE locutorios SET activo = ? WHERE id = ?', [nuevo, id]);
    res.json({ activo: nuevo });
  } catch (err) {
    console.error('Error toggling locutorio:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = { listar, listarTodos, crear, actualizar, toggleActivo };

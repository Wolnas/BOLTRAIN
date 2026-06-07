const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const FIELDS = `u.id, u.nombre, u.apellido, u.email, u.pais, u.activo, u.created_at, r.nombre AS rol`;
const JOIN   = `FROM usuarios u JOIN roles r ON u.rol_id = r.id`;

const listar = async (req, res) => {
  try {
    const { rol } = req.query;
    const params = [];
    let where = '';
    if (rol) {
      where = 'WHERE r.nombre = ?';
      params.push(rol);
    }
    const [rows] = await pool.execute(
      `SELECT ${FIELDS} ${JOIN} ${where} ORDER BY u.nombre ASC`,
      params
    );
    res.json({ usuarios: rows });
  } catch (err) {
    console.error('Error listando usuarios:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, apellido, email, password, pais } = req.body;

    if (!nombre || !apellido || !email || !password || !pais) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre, apellido, email, password, pais, rol_id, activo)
       VALUES (?, ?, ?, ?, ?, 2, 1)`,
      [nombre, apellido, email, hash, pais]
    );

    const [rows] = await pool.execute(
      `SELECT ${FIELDS} ${JOIN} WHERE u.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ usuario: rows[0] });
  } catch (err) {
    console.error('Error creando cliente:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, pais, activo, password } = req.body;

    const [check] = await pool.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (check.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [dup] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, id]
    );
    if (dup.length > 0) return res.status(409).json({ error: 'Este email ya está en uso' });

    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await pool.execute(
        `UPDATE usuarios SET nombre=?, apellido=?, email=?, pais=?, activo=?, password=? WHERE id=?`,
        [nombre, apellido, email, pais, activo ?? 1, hash, id]
      );
    } else {
      await pool.execute(
        `UPDATE usuarios SET nombre=?, apellido=?, email=?, pais=?, activo=? WHERE id=?`,
        [nombre, apellido, email, pais, activo ?? 1, id]
      );
    }

    const [rows] = await pool.execute(
      `SELECT ${FIELDS} ${JOIN} WHERE u.id = ?`, [id]
    );
    res.json({ usuario: rows[0] });
  } catch (err) {
    console.error('Error actualizando usuario:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const toggleActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT activo FROM usuarios WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const nuevo = rows[0].activo ? 0 : 1;
    await pool.execute('UPDATE usuarios SET activo = ? WHERE id = ?', [nuevo, id]);
    res.json({ activo: nuevo });
  } catch (err) {
    console.error('Error toggling activo:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = { listar, crear, actualizar, toggleActivo };

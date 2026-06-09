const pool = require('../config/db');

const ES_TRABAJADOR = (req) => req.user.rol_id === 3;

/* ─── Listar pedidos ───
   - admin: todos los datos (incluye precios y ganancia)
   - trabajador: vista "por recoger" SIN precios ni ganancias */
const listar = async (req, res) => {
  try {
    const { estado } = req.query;
    const tieneEstado = estado && estado !== 'todos';

    if (ES_TRABAJADOR(req)) {
      // El trabajador no ve precios de productos ni ganancias.
      const sql = `
        SELECT p.id, p.cliente_id, p.locutorio_id, p.tienda_origen, p.descripcion,
               p.estado, p.fecha_compra, p.created_at,
               uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido,
               l.nombre AS locutorio_nombre, l.ciudad AS locutorio_ciudad
        FROM pedidos p
        JOIN usuarios uc ON p.cliente_id = uc.id
        LEFT JOIN locutorios l ON p.locutorio_id = l.id
        ${tieneEstado ? 'WHERE p.estado = ?' : ''}
        ORDER BY p.created_at DESC
      `;
      const [rows] = await pool.execute(sql, tieneEstado ? [estado] : []);
      return res.json({ pedidos: rows });
    }

    const sql = `
      SELECT p.*,
             uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido,
             ur.nombre AS registrado_nombre,
             l.nombre AS locutorio_nombre, l.ciudad AS locutorio_ciudad
      FROM pedidos p
      JOIN usuarios uc ON p.cliente_id = uc.id
      JOIN usuarios ur ON p.registrado_por = ur.id
      LEFT JOIN locutorios l ON p.locutorio_id = l.id
      ${tieneEstado ? 'WHERE p.estado = ?' : ''}
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.execute(sql, tieneEstado ? [estado] : []);
    res.json({ pedidos: rows });
  } catch (err) {
    console.error('Error listando pedidos:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const crear = async (req, res) => {
  try {
    const {
      cliente_id, locutorio_id, tienda_origen, descripcion,
      precio_producto, precio_envio, precio_total,
      precio_venta, ganancia, moneda, estado,
      precio_cotizado_bob, tipo_cambio_aplicado,
      fecha_compra, notas,
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO pedidos
         (cliente_id, locutorio_id, registrado_por, tienda_origen, descripcion,
          precio_producto, precio_envio, precio_total, precio_venta,
          ganancia, moneda, estado, precio_cotizado_bob, tipo_cambio_aplicado,
          fecha_compra, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id, locutorio_id || null, req.user.id, tienda_origen, descripcion,
        precio_producto, precio_envio || 0, precio_total,
        precio_venta || 0, ganancia || 0, moneda || 'EUR',
        estado || 'pendiente', precio_cotizado_bob || null, tipo_cambio_aplicado || null,
        fecha_compra, notas || null,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT p.*, uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido
       FROM pedidos p JOIN usuarios uc ON p.cliente_id = uc.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ pedido: rows[0] });
  } catch (err) {
    console.error('Error creando pedido:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cliente_id, locutorio_id, tienda_origen, descripcion,
      precio_producto, precio_envio, precio_total,
      precio_venta, ganancia, moneda, estado,
      precio_cotizado_bob, tipo_cambio_aplicado,
      fecha_compra, notas,
    } = req.body;

    const [check] = await pool.execute('SELECT id FROM pedidos WHERE id = ?', [id]);
    if (check.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    await pool.execute(
      `UPDATE pedidos SET
         cliente_id=?, locutorio_id=?, tienda_origen=?, descripcion=?,
         precio_producto=?, precio_envio=?, precio_total=?,
         precio_venta=?, ganancia=?, moneda=?, estado=?,
         precio_cotizado_bob=?, tipo_cambio_aplicado=?,
         fecha_compra=?, notas=?
       WHERE id = ?`,
      [
        cliente_id, locutorio_id || null, tienda_origen, descripcion,
        precio_producto, precio_envio || 0, precio_total,
        precio_venta || 0, ganancia || 0, moneda || 'EUR',
        estado, precio_cotizado_bob || null, tipo_cambio_aplicado || null,
        fecha_compra, notas || null, id,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT p.*, uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido
       FROM pedidos p JOIN usuarios uc ON p.cliente_id = uc.id
       WHERE p.id = ?`,
      [id]
    );
    res.json({ pedido: rows[0] });
  } catch (err) {
    console.error('Error actualizando pedido:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

/* ─── Cambiar solo el estado (admin + trabajador) ─── */
const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const ESTADOS = ['pendiente','en_transito','en_locutorio','recogido','en_camino','entregado'];
    if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    const [result] = await pool.execute('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ mensaje: 'Estado actualizado', estado });
  } catch (err) {
    console.error('Error cambiando estado de pedido:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM pedidos WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ mensaje: 'Pedido eliminado' });
  } catch (err) {
    console.error('Error eliminando pedido:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = { listar, crear, actualizar, cambiarEstado, eliminar };

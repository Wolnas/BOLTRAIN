const pool = require('../config/db');

const listar = async (req, res) => {
  try {
    const esAdmin = req.user.rol_id === 1;

    if (esAdmin) {
      const [rows] = await pool.execute(`
        SELECT pk.*,
               uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido,
               l.nombre AS locutorio_nombre, l.ciudad AS locutorio_ciudad,
               GROUP_CONCAT(p.descripcion ORDER BY p.id SEPARATOR '|||') AS pedidos_desc,
               COUNT(pp.pedido_id) AS total_pedidos
        FROM paquetes pk
        JOIN usuarios uc ON pk.cliente_id = uc.id
        JOIN locutorios l ON pk.locutorio_id = l.id
        LEFT JOIN paquete_pedidos pp ON pk.id = pp.paquete_id
        LEFT JOIN pedidos p ON pp.pedido_id = p.id
        GROUP BY pk.id
        ORDER BY pk.created_at DESC
      `);
      return res.json({ paquetes: rows });
    }

    const [rows] = await pool.execute(
      `SELECT pk.id, pk.estado, pk.fecha_estimada, pk.numero_seguimiento,
              GROUP_CONCAT(p.descripcion ORDER BY p.id SEPARATOR '|||') AS pedidos_desc,
              COUNT(pp.pedido_id) AS total_pedidos
       FROM paquetes pk
       LEFT JOIN paquete_pedidos pp ON pk.id = pp.paquete_id
       LEFT JOIN pedidos p ON pp.pedido_id = p.id
       WHERE pk.cliente_id = ?
       GROUP BY pk.id
       ORDER BY pk.created_at DESC`,
      [req.user.id]
    );
    res.json({ paquetes: rows });
  } catch (err) {
    console.error('Error listando paquetes:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const pedidosDisponibles = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const [rows] = await pool.execute(
      `SELECT p.* FROM pedidos p
       WHERE p.cliente_id = ?
         AND p.id NOT IN (SELECT pedido_id FROM paquete_pedidos)
       ORDER BY p.fecha_compra DESC`,
      [clienteId]
    );
    res.json({ pedidos: rows });
  } catch (err) {
    console.error('Error obteniendo pedidos disponibles:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const crear = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { cliente_id, locutorio_id, pedido_ids, numero_seguimiento, estado, fecha_estimada, notas_internas } = req.body;

    if (!pedido_ids || pedido_ids.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'El paquete debe contener al menos un pedido' });
    }

    const [result] = await conn.execute(
      `INSERT INTO paquetes (cliente_id, locutorio_id, registrado_por, numero_seguimiento, estado, fecha_estimada, notas_internas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cliente_id, locutorio_id, req.user.id, numero_seguimiento || null, estado || 'pendiente', fecha_estimada || null, notas_internas || null]
    );

    const paqueteId = result.insertId;
    for (const pedidoId of pedido_ids) {
      await conn.execute(
        'INSERT INTO paquete_pedidos (paquete_id, pedido_id) VALUES (?, ?)',
        [paqueteId, pedidoId]
      );
    }

    await conn.commit();
    res.status(201).json({ paquete: { id: paqueteId } });
  } catch (err) {
    await conn.rollback();
    console.error('Error creando paquete:', err);
    res.status(500).json({ error: 'Error interno' });
  } finally {
    conn.release();
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, numero_seguimiento } = req.body;

    const fechaEntrega = estado === 'entregado' ? new Date() : null;

    await pool.execute(
      `UPDATE paquetes
       SET estado = ?,
           fecha_entrega = ?,
           numero_seguimiento = COALESCE(?, numero_seguimiento)
       WHERE id = ?`,
      [estado, fechaEntrega, numero_seguimiento || null, id]
    );

    res.json({ mensaje: 'Estado actualizado' });
  } catch (err) {
    console.error('Error actualizando estado paquete:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const eliminar = async (req, res) => {
  const conn = await pool.getConnection();
  const { id } = req.params;
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM paquete_pedidos WHERE paquete_id = ?', [id]);
    await conn.execute('DELETE FROM paquetes WHERE id = ?', [id]);
    await conn.commit();
    res.json({ mensaje: 'Paquete eliminado' });
  } catch (err) {
    await conn.rollback();
    console.error('Error eliminando paquete:', err);
    res.status(500).json({ error: 'Error interno' });
  } finally {
    conn.release();
  }
};

module.exports = { listar, pedidosDisponibles, crear, actualizarEstado, eliminar };

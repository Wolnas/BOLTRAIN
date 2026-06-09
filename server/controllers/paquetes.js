const pool = require('../config/db');

const ROL = { ADMIN: 1, VIEWER: 2, TRABAJADOR: 3 };

/* ─── Listar paquetes para Bolivia ───
   - admin: todo (incluye precio_envio_bolivia, costo y datos internos)
   - trabajador: gestión completa salvo precios de producto (ya excluidos: el
     paquete no expone precios de producto, solo el envío que él mismo arma)
   - viewer: solo SUS paquetes, datos mínimos (sin precios ni notas internas) */
const listar = async (req, res) => {
  try {
    const rol = req.user.rol_id;

    if (rol === ROL.VIEWER) {
      const [rows] = await pool.execute(
        `SELECT pk.id, pk.estado, pk.fecha_estimada, pk.fecha_entrega, pk.numero_seguimiento,
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
      return res.json({ paquetes: rows });
    }

    // admin y trabajador: gestión. El trabajador no necesita precios de producto,
    // y este listado no los expone (solo descripción + envío a Bolivia).
    const incluirCosto = rol === ROL.ADMIN ? ', pk.costo_envio_real' : '';
    const [rows] = await pool.execute(`
      SELECT pk.id, pk.cliente_id, pk.locutorio_id, pk.estado,
             pk.numero_seguimiento, pk.fecha_estimada, pk.fecha_entrega,
             pk.precio_envio_bolivia, pk.notas_internas, pk.created_at${incluirCosto},
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
    res.json({ paquetes: rows });
  } catch (err) {
    console.error('Error listando paquetes:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

/* Pedidos de un cliente que aún no están en ningún paquete.
   El trabajador no ve precios; el admin sí. */
const pedidosDisponibles = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const esTrabajador = req.user.rol_id === ROL.TRABAJADOR;
    const campos = esTrabajador
      ? 'p.id, p.descripcion, p.tienda_origen, p.estado'
      : 'p.*';
    const [rows] = await pool.execute(
      `SELECT ${campos} FROM pedidos p
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

    const {
      cliente_id, locutorio_id, pedido_ids, numero_seguimiento,
      estado, fecha_estimada, notas_internas, precio_envio_bolivia,
    } = req.body;

    if (!pedido_ids || pedido_ids.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'El paquete debe contener al menos un pedido' });
    }
    if (!locutorio_id) {
      await conn.rollback();
      return res.status(400).json({ error: 'Selecciona un locutorio' });
    }

    const [result] = await conn.execute(
      `INSERT INTO paquetes
         (cliente_id, locutorio_id, registrado_por, numero_seguimiento, estado,
          fecha_estimada, notas_internas, precio_envio_bolivia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id, locutorio_id, req.user.id, numero_seguimiento || null,
        estado || 'armando', fecha_estimada || null, notas_internas || null,
        precio_envio_bolivia || null,
      ]
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
    const ESTADOS = ['armando', 'enviado', 'entregado'];
    if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    const fechaEntrega = estado === 'entregado' ? new Date() : null;

    await pool.execute(
      `UPDATE paquetes
       SET estado = ?,
           fecha_entrega = ?,
           numero_seguimiento = COALESCE(?, numero_seguimiento)
       WHERE id = ?`,
      [estado, fechaEntrega, numero_seguimiento || null, id]
    );

    res.json({ mensaje: 'Estado actualizado', estado });
  } catch (err) {
    console.error('Error actualizando estado paquete:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

/* Actualizar datos de envío (admin): costo real, precio cobrado, seguimiento */
const actualizarEnvio = async (req, res) => {
  try {
    const { id } = req.params;
    const { precio_envio_bolivia, costo_envio_real, numero_seguimiento, fecha_estimada } = req.body;
    await pool.execute(
      `UPDATE paquetes SET
         precio_envio_bolivia = ?,
         costo_envio_real = ?,
         numero_seguimiento = COALESCE(?, numero_seguimiento),
         fecha_estimada = COALESCE(?, fecha_estimada)
       WHERE id = ?`,
      [precio_envio_bolivia || null, costo_envio_real || null, numero_seguimiento || null, fecha_estimada || null, id]
    );
    res.json({ mensaje: 'Envío actualizado' });
  } catch (err) {
    console.error('Error actualizando envío:', err);
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

module.exports = { listar, pedidosDisponibles, crear, actualizarEstado, actualizarEnvio, eliminar };

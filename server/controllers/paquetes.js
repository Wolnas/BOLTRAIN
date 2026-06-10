const pool = require('../config/db');

const ROL = { ADMIN: 1, VIEWER: 2, TRABAJADOR: 3 };

/* ════════════════════════════════════════════════════════════
 *  FLUJO 1 — PAQUETES DE TIENDA
 *  Un pedido viajando de la tienda al locutorio en España.
 *  Estados: en_transito → en_locutorio → recogido.
 * ════════════════════════════════════════════════════════════ */

const ESTADOS_TIENDA = ['en_transito', 'en_locutorio', 'recogido'];

/* Listar paquetes de tienda (admin + trabajador) con datos del pedido,
   cliente y locutorio. No expone precios de producto. */
const listarTienda = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT pt.id, pt.pedido_id, pt.locutorio_id, pt.numero_seguimiento,
             pt.estado, pt.fecha_estimada_locutorio, pt.fecha_recogida,
             pt.notas_internas, pt.precio_envio_bolivia, pt.created_at,
             p.descripcion, p.tienda_origen, p.cliente_id, p.fecha_compra,
             uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido,
             l.nombre AS locutorio_nombre, l.ciudad AS locutorio_ciudad
      FROM paquetes_tienda pt
      JOIN pedidos p   ON pt.pedido_id = p.id
      JOIN usuarios uc ON p.cliente_id = uc.id
      JOIN locutorios l ON pt.locutorio_id = l.id
      ORDER BY pt.created_at DESC
    `);
    res.json({ paquetes: rows });
  } catch (err) {
    console.error('Error listando paquetes de tienda:', err);
    res.status(500).json({ error: 'Error interno al listar paquetes de tienda' });
  }
};

/* Pedidos que aún no tienen un paquete_tienda asignado (para el selector
   del modal de creación). El trabajador no ve precios. */
const pedidosSinTienda = async (req, res) => {
  try {
    const esTrabajador = req.user.rol_id === ROL.TRABAJADOR;
    const campos = esTrabajador
      ? 'p.id, p.descripcion, p.tienda_origen, p.estado, p.fecha_compra, p.cliente_id'
      : 'p.*';
    const [rows] = await pool.execute(`
      SELECT ${campos},
             uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido
      FROM pedidos p
      JOIN usuarios uc ON p.cliente_id = uc.id
      WHERE p.id NOT IN (SELECT pedido_id FROM paquetes_tienda)
      ORDER BY p.fecha_compra DESC
    `);
    res.json({ pedidos: rows });
  } catch (err) {
    console.error('Error obteniendo pedidos sin paquete de tienda:', err);
    res.status(500).json({ error: 'Error interno al obtener pedidos disponibles' });
  }
};

const crearTienda = async (req, res) => {
  try {
    const {
      pedido_id, locutorio_id, numero_seguimiento, estado,
      fecha_estimada_locutorio, notas_internas, precio_envio_bolivia,
    } = req.body;

    if (!pedido_id) return res.status(400).json({ error: 'Selecciona un pedido' });
    if (!locutorio_id) return res.status(400).json({ error: 'Selecciona un locutorio' });

    const estadoFinal = ESTADOS_TIENDA.includes(estado) ? estado : 'en_transito';

    const [result] = await pool.execute(
      `INSERT INTO paquetes_tienda
         (pedido_id, locutorio_id, registrado_por, numero_seguimiento, estado,
          fecha_estimada_locutorio, notas_internas, precio_envio_bolivia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pedido_id, locutorio_id, req.user.id, numero_seguimiento || null,
        estadoFinal, fecha_estimada_locutorio || null, notas_internas || null,
        precio_envio_bolivia || null,
      ]
    );
    res.status(201).json({ paquete: { id: result.insertId } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese pedido ya tiene un paquete de tienda' });
    }
    console.error('Error creando paquete de tienda:', err);
    res.status(500).json({ error: 'Error interno al crear el paquete de tienda' });
  }
};

/* Actualizar estado del paquete de tienda. Al marcar "recogido"
   se sella la fecha de recogida automáticamente. */
const actualizarEstadoTienda = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, numero_seguimiento, fecha_estimada_locutorio } = req.body;
    if (estado && !ESTADOS_TIENDA.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const fechaRecogida = estado === 'recogido' ? new Date() : null;

    const [result] = await pool.execute(
      `UPDATE paquetes_tienda SET
         estado = COALESCE(?, estado),
         numero_seguimiento = COALESCE(?, numero_seguimiento),
         fecha_estimada_locutorio = COALESCE(?, fecha_estimada_locutorio),
         fecha_recogida = CASE WHEN ? = 'recogido' THEN ? ELSE fecha_recogida END
       WHERE id = ?`,
      [
        estado || null, numero_seguimiento || null, fecha_estimada_locutorio || null,
        estado || null, fechaRecogida, id,
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Paquete no encontrado' });
    res.json({ mensaje: 'Paquete de tienda actualizado', estado });
  } catch (err) {
    console.error('Error actualizando paquete de tienda:', err);
    res.status(500).json({ error: 'Error interno al actualizar el paquete de tienda' });
  }
};

const eliminarTienda = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM paquetes_tienda WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Paquete no encontrado' });
    res.json({ mensaje: 'Paquete de tienda eliminado' });
  } catch (err) {
    console.error('Error eliminando paquete de tienda:', err);
    res.status(500).json({ error: 'Error interno al eliminar el paquete de tienda' });
  }
};

/* ════════════════════════════════════════════════════════════
 *  FLUJO 2 — PAQUETES DE CLIENTE
 *  Caja armada para Bolivia con varios pedidos dentro.
 *  Estados: armando → enviado → entregado.
 * ════════════════════════════════════════════════════════════ */

const ESTADOS_CLIENTE = ['armando', 'enviado', 'entregado'];

/* Listar paquetes de cliente (admin + trabajador). Incluye datos internos
   y el contenido (descripciones de los pedidos). */
const listarCliente = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT pc.id, pc.cliente_id, pc.estado, pc.numero_seguimiento,
             pc.fecha_estimada, pc.fecha_entrega, pc.precio_envio_bolivia,
             pc.notas_internas, pc.created_at,
             uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido,
             GROUP_CONCAT(p.descripcion ORDER BY p.id SEPARATOR '|||') AS pedidos_desc,
             COUNT(pcp.pedido_id) AS total_pedidos
      FROM paquetes_cliente pc
      JOIN usuarios uc ON pc.cliente_id = uc.id
      LEFT JOIN paquete_cliente_pedidos pcp ON pc.id = pcp.paquete_cliente_id
      LEFT JOIN pedidos p ON pcp.pedido_id = p.id
      GROUP BY pc.id
      ORDER BY pc.created_at DESC
    `);
    res.json({ paquetes: rows });
  } catch (err) {
    console.error('Error listando paquetes de cliente:', err);
    res.status(500).json({ error: 'Error interno al listar paquetes de cliente' });
  }
};

/* Solo los paquetes del viewer logueado. Datos mínimos: sin precios ni
   notas internas. Para la vista "Mis Paquetes". */
const misPaquetesCliente = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT pc.id, pc.estado, pc.fecha_estimada, pc.fecha_entrega, pc.numero_seguimiento,
              GROUP_CONCAT(p.descripcion ORDER BY p.id SEPARATOR '|||') AS pedidos_desc,
              COUNT(pcp.pedido_id) AS total_pedidos
       FROM paquetes_cliente pc
       LEFT JOIN paquete_cliente_pedidos pcp ON pc.id = pcp.paquete_cliente_id
       LEFT JOIN pedidos p ON pcp.pedido_id = p.id
       WHERE pc.cliente_id = ?
       GROUP BY pc.id
       ORDER BY pc.created_at DESC`,
      [req.user.id]
    );
    res.json({ paquetes: rows });
  } catch (err) {
    console.error('Error listando mis paquetes:', err);
    res.status(500).json({ error: 'Error interno al listar tus paquetes' });
  }
};

/* Pedidos de un cliente que aún no están en ningún paquete_cliente. */
const pedidosDisponiblesCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const esTrabajador = req.user.rol_id === ROL.TRABAJADOR;
    const campos = esTrabajador
      ? 'p.id, p.descripcion, p.tienda_origen, p.estado'
      : 'p.*';
    const [rows] = await pool.execute(
      `SELECT ${campos} FROM pedidos p
       WHERE p.cliente_id = ?
         AND p.id NOT IN (SELECT pedido_id FROM paquete_cliente_pedidos)
       ORDER BY p.fecha_compra DESC`,
      [clienteId]
    );
    res.json({ pedidos: rows });
  } catch (err) {
    console.error('Error obteniendo pedidos disponibles del cliente:', err);
    res.status(500).json({ error: 'Error interno al obtener pedidos disponibles' });
  }
};

const crearCliente = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const {
      cliente_id, pedido_ids, numero_seguimiento, estado,
      fecha_estimada, notas_internas, precio_envio_bolivia,
    } = req.body;

    if (!cliente_id) {
      await conn.rollback();
      return res.status(400).json({ error: 'Selecciona un cliente' });
    }
    if (!pedido_ids || pedido_ids.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'El paquete debe contener al menos un pedido' });
    }

    const estadoFinal = ESTADOS_CLIENTE.includes(estado) ? estado : 'armando';

    const [result] = await conn.execute(
      `INSERT INTO paquetes_cliente
         (cliente_id, registrado_por, numero_seguimiento, precio_envio_bolivia,
          estado, fecha_estimada, notas_internas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id, req.user.id, numero_seguimiento || null, precio_envio_bolivia || null,
        estadoFinal, fecha_estimada || null, notas_internas || null,
      ]
    );

    const paqueteId = result.insertId;
    for (const pedidoId of pedido_ids) {
      await conn.execute(
        'INSERT INTO paquete_cliente_pedidos (paquete_cliente_id, pedido_id) VALUES (?, ?)',
        [paqueteId, pedidoId]
      );
    }

    await conn.commit();
    res.status(201).json({ paquete: { id: paqueteId } });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Uno de los pedidos ya está en otro paquete' });
    }
    console.error('Error creando paquete de cliente:', err);
    res.status(500).json({ error: 'Error interno al crear el paquete de cliente' });
  } finally {
    conn.release();
  }
};

/* Actualizar estado del paquete de cliente. Al marcar "entregado"
   se sella la fecha de entrega. También permite editar datos de envío. */
const actualizarEstadoCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, numero_seguimiento, fecha_estimada, precio_envio_bolivia } = req.body;
    if (estado && !ESTADOS_CLIENTE.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const fechaEntrega = estado === 'entregado' ? new Date() : null;

    const [result] = await pool.execute(
      `UPDATE paquetes_cliente SET
         estado = COALESCE(?, estado),
         numero_seguimiento = COALESCE(?, numero_seguimiento),
         fecha_estimada = COALESCE(?, fecha_estimada),
         precio_envio_bolivia = COALESCE(?, precio_envio_bolivia),
         fecha_entrega = CASE WHEN ? = 'entregado' THEN ? ELSE fecha_entrega END
       WHERE id = ?`,
      [
        estado || null, numero_seguimiento || null, fecha_estimada || null,
        precio_envio_bolivia ?? null, estado || null, fechaEntrega, id,
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Paquete no encontrado' });
    res.json({ mensaje: 'Paquete de cliente actualizado', estado });
  } catch (err) {
    console.error('Error actualizando paquete de cliente:', err);
    res.status(500).json({ error: 'Error interno al actualizar el paquete de cliente' });
  }
};

const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    // paquete_cliente_pedidos se borra en cascada (ON DELETE CASCADE)
    const [result] = await pool.execute('DELETE FROM paquetes_cliente WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Paquete no encontrado' });
    res.json({ mensaje: 'Paquete de cliente eliminado' });
  } catch (err) {
    console.error('Error eliminando paquete de cliente:', err);
    res.status(500).json({ error: 'Error interno al eliminar el paquete de cliente' });
  }
};

module.exports = {
  // tienda
  listarTienda, pedidosSinTienda, crearTienda, actualizarEstadoTienda, eliminarTienda,
  // cliente
  listarCliente, misPaquetesCliente, pedidosDisponiblesCliente,
  crearCliente, actualizarEstadoCliente, eliminarCliente,
};

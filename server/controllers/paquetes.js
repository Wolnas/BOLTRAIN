const pool = require('../config/db');

const ROL = { ADMIN: 1, VIEWER: 2, TRABAJADOR: 3 };

/* ════════════════════════════════════════════════════════════
 *  PAQUETES DE TIENDA
 *  Agrupa VARIOS pedidos de UN cliente que llegan al warehouse España.
 *  Pedidos vía pivote paquete_tienda_pedidos.
 *  Estados: en_camino → en_warehouse → enviado_bolivia → entregado.
 * ════════════════════════════════════════════════════════════ */

const ESTADOS_TIENDA = ['en_camino', 'en_warehouse', 'enviado_bolivia', 'entregado'];

/* Listar paquetes de tienda con cliente, locutorio y contenido (sus pedidos). */
const listarTienda = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT pt.id, pt.cliente_id, pt.locutorio_id, pt.numero_seguimiento,
             pt.estado, pt.fecha_estimada_llegada, pt.fecha_llegada,
             pt.notas_internas, pt.created_at,
             uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido,
             l.nombre AS locutorio_nombre, l.ciudad AS locutorio_ciudad,
             COUNT(ptp.pedido_id) AS total_pedidos,
             GROUP_CONCAT(p.tienda_origen ORDER BY p.id SEPARATOR '|||') AS tiendas,
             GROUP_CONCAT(p.descripcion  ORDER BY p.id SEPARATOR '|||') AS descripciones
      FROM paquetes_tienda pt
      JOIN usuarios uc  ON pt.cliente_id = uc.id
      JOIN locutorios l ON pt.locutorio_id = l.id
      LEFT JOIN paquete_tienda_pedidos ptp ON pt.id = ptp.paquete_tienda_id
      LEFT JOIN pedidos p ON ptp.pedido_id = p.id
      GROUP BY pt.id
      ORDER BY pt.created_at DESC
    `);
    res.json({ paquetes: rows });
  } catch (err) {
    console.error('Error listando paquetes de tienda:', err);
    res.status(500).json({ error: 'Error interno al listar paquetes de tienda' });
  }
};

/* Pedidos de un cliente que aún no están en ningún paquete de tienda
   (para el multi-select del modal). Requiere ?clienteId. */
const pedidosSinTienda = async (req, res) => {
  try {
    const { clienteId } = req.query;
    const esTrabajador = req.user.rol_id === ROL.TRABAJADOR;
    const campos = esTrabajador
      ? 'p.id, p.descripcion, p.tienda_origen, p.estado, p.fecha_compra, p.cliente_id'
      : 'p.*';
    const params = [];
    let filtroCliente = '';
    if (clienteId) { filtroCliente = 'AND p.cliente_id = ?'; params.push(clienteId); }
    const [rows] = await pool.execute(`
      SELECT ${campos},
             uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido
      FROM pedidos p
      JOIN usuarios uc ON p.cliente_id = uc.id
      WHERE p.id NOT IN (SELECT pedido_id FROM paquete_tienda_pedidos WHERE pedido_id IS NOT NULL)
        ${filtroCliente}
      ORDER BY p.fecha_compra DESC
    `, params);
    res.json({ pedidos: rows });
  } catch (err) {
    console.error('Error obteniendo pedidos sin paquete de tienda:', err);
    res.status(500).json({ error: 'Error interno al obtener pedidos disponibles' });
  }
};

/* Crear un paquete de tienda con varios pedidos (transacción). */
const crearTienda = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const {
      cliente_id, pedidos, locutorio_id, numero_seguimiento,
      estado, fecha_estimada_llegada, notas_internas,
    } = req.body;

    if (!cliente_id) { await conn.rollback(); return res.status(400).json({ error: 'Selecciona un cliente' }); }
    if (!pedidos || pedidos.length === 0) { await conn.rollback(); return res.status(400).json({ error: 'Selecciona al menos un pedido' }); }
    if (!locutorio_id) { await conn.rollback(); return res.status(400).json({ error: 'Selecciona un locutorio' }); }

    const estadoFinal = ESTADOS_TIENDA.includes(estado) ? estado : 'en_camino';
    const fechaLlegada = estadoFinal === 'en_warehouse' ? new Date() : null;

    const [result] = await conn.execute(
      `INSERT INTO paquetes_tienda
         (cliente_id, locutorio_id, registrado_por, numero_seguimiento,
          estado, fecha_estimada_llegada, fecha_llegada, notas_internas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id, locutorio_id, req.user.id, numero_seguimiento || null,
        estadoFinal, fecha_estimada_llegada || null, fechaLlegada, notas_internas || null,
      ]
    );

    const paqueteId = result.insertId;
    for (const pedidoId of pedidos) {
      await conn.execute(
        'INSERT INTO paquete_tienda_pedidos (paquete_tienda_id, pedido_id) VALUES (?, ?)',
        [paqueteId, pedidoId]
      );
    }

    await conn.commit();
    res.status(201).json({ paquete: { id: paqueteId } });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Uno de los pedidos ya está en otro paquete de tienda' });
    }
    console.error('Error creando paquete de tienda:', err);
    res.status(500).json({ error: 'Error interno al crear el paquete de tienda' });
  } finally {
    conn.release();
  }
};

/* Actualizar estado del paquete de tienda. Al llegar a warehouse sella
   fecha_llegada automáticamente. */
const actualizarEstadoTienda = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, numero_seguimiento, fecha_estimada_llegada } = req.body;
    if (estado && !ESTADOS_TIENDA.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const fechaLlegada = estado === 'en_warehouse' ? new Date() : null;

    const [result] = await pool.execute(
      `UPDATE paquetes_tienda SET
         estado = COALESCE(?, estado),
         numero_seguimiento = COALESCE(?, numero_seguimiento),
         fecha_estimada_llegada = COALESCE(?, fecha_estimada_llegada),
         fecha_llegada = CASE WHEN ? = 'en_warehouse' AND fecha_llegada IS NULL THEN ? ELSE fecha_llegada END
       WHERE id = ?`,
      [
        estado || null, numero_seguimiento || null, fecha_estimada_llegada || null,
        estado || null, fechaLlegada, id,
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
    // paquete_tienda_pedidos se borra en cascada (ON DELETE CASCADE)
    const [result] = await pool.execute('DELETE FROM paquetes_tienda WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Paquete no encontrado' });
    res.json({ mensaje: 'Paquete de tienda eliminado' });
  } catch (err) {
    console.error('Error eliminando paquete de tienda:', err);
    res.status(500).json({ error: 'Error interno al eliminar el paquete de tienda' });
  }
};

/* ════════════════════════════════════════════════════════════
 *  PAQUETES PARA BOLIVIA
 *  Caja que arma el trabajador; puede mezclar pedidos de varios clientes.
 *  Estados: armando → enviado → entregado.
 * ════════════════════════════════════════════════════════════ */

const ESTADOS_BOLIVIA = ['armando', 'enviado', 'entregado'];

const listarBolivia = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT pb.id, pb.numero_seguimiento, pb.precio_envio_total, pb.estado,
             pb.fecha_estimada, pb.fecha_entrega, pb.notas_internas, pb.created_at,
             COUNT(pbp.pedido_id) AS total_pedidos,
             COUNT(DISTINCT p.cliente_id) AS total_clientes,
             GROUP_CONCAT(CONCAT(uc.nombre, ' · ', p.descripcion) ORDER BY p.id SEPARATOR '|||') AS contenido
      FROM paquetes_bolivia pb
      LEFT JOIN paquete_bolivia_pedidos pbp ON pb.id = pbp.paquete_bolivia_id
      LEFT JOIN pedidos p   ON pbp.pedido_id = p.id
      LEFT JOIN usuarios uc ON p.cliente_id = uc.id
      GROUP BY pb.id
      ORDER BY pb.created_at DESC
    `);
    res.json({ paquetes: rows });
  } catch (err) {
    console.error('Error listando cajas para Bolivia:', err);
    res.status(500).json({ error: 'Error interno al listar las cajas para Bolivia' });
  }
};

/* Pedidos disponibles para una caja: están en un paquete de tienda
   (en_camino o en_warehouse) y no están en ninguna caja. De cualquier cliente. */
const pedidosSinCaja = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.id, p.descripcion, p.tienda_origen, p.cliente_id,
             p.precio_total, p.moneda,
             uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido,
             pt.estado AS estado_tienda
      FROM pedidos p
      JOIN usuarios uc ON p.cliente_id = uc.id
      JOIN paquete_tienda_pedidos ptp ON ptp.pedido_id = p.id
      JOIN paquetes_tienda pt ON pt.id = ptp.paquete_tienda_id
      WHERE pt.estado IN ('en_camino', 'en_warehouse')
        AND p.id NOT IN (SELECT pedido_id FROM paquete_bolivia_pedidos WHERE pedido_id IS NOT NULL)
      ORDER BY uc.nombre ASC, p.fecha_compra DESC
    `);
    res.json({ pedidos: rows });
  } catch (err) {
    console.error('Error obteniendo pedidos sin caja:', err);
    res.status(500).json({ error: 'Error interno al obtener pedidos disponibles' });
  }
};

const crearBolivia = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { pedidos, numero_seguimiento, precio_envio_total, fecha_estimada, notas_internas } = req.body;

    if (!pedidos || pedidos.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'La caja debe contener al menos un pedido' });
    }

    const [result] = await conn.execute(
      `INSERT INTO paquetes_bolivia
         (registrado_por, numero_seguimiento, precio_envio_total, estado, fecha_estimada, notas_internas)
       VALUES (?, ?, ?, 'armando', ?, ?)`,
      [
        req.user.id, numero_seguimiento || null, precio_envio_total || null,
        fecha_estimada || null, notas_internas || null,
      ]
    );

    const cajaId = result.insertId;
    for (const pedidoId of pedidos) {
      await conn.execute(
        'INSERT INTO paquete_bolivia_pedidos (paquete_bolivia_id, pedido_id) VALUES (?, ?)',
        [cajaId, pedidoId]
      );
    }

    await conn.commit();
    res.status(201).json({ paquete: { id: cajaId } });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Uno de los pedidos ya está en otra caja' });
    }
    console.error('Error creando caja para Bolivia:', err);
    res.status(500).json({ error: 'Error interno al crear la caja para Bolivia' });
  } finally {
    conn.release();
  }
};

/* Actualizar estado de la caja. El estado del viaje que ve el cliente se
   deriva en consulta (ver misPedidos), así que aquí no mutamos paquetes_tienda. */
const actualizarEstadoBolivia = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, numero_seguimiento, fecha_estimada, precio_envio_total } = req.body;
    if (estado && !ESTADOS_BOLIVIA.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const fechaEntrega = estado === 'entregado' ? new Date() : null;

    const [result] = await pool.execute(
      `UPDATE paquetes_bolivia SET
         estado = COALESCE(?, estado),
         numero_seguimiento = COALESCE(?, numero_seguimiento),
         fecha_estimada = COALESCE(?, fecha_estimada),
         precio_envio_total = COALESCE(?, precio_envio_total),
         fecha_entrega = CASE WHEN ? = 'entregado' THEN ? ELSE fecha_entrega END
       WHERE id = ?`,
      [
        estado || null, numero_seguimiento || null, fecha_estimada || null,
        precio_envio_total ?? null, estado || null, fechaEntrega, id,
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Caja no encontrada' });
    res.json({ mensaje: 'Caja actualizada', estado });
  } catch (err) {
    console.error('Error actualizando caja para Bolivia:', err);
    res.status(500).json({ error: 'Error interno al actualizar la caja' });
  }
};

const eliminarBolivia = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM paquetes_bolivia WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Caja no encontrada' });
    res.json({ mensaje: 'Caja eliminada' });
  } catch (err) {
    console.error('Error eliminando caja para Bolivia:', err);
    res.status(500).json({ error: 'Error interno al eliminar la caja' });
  }
};

/* ════════════════════════════════════════════════════════════
 *  VISTA CLIENTE — Mis Pedidos
 *  El estado por pedido se deriva: el mayor avance entre el estado del
 *  paquete de tienda y el de la caja Bolivia que lo contiene.
 *  Sin locutorio, precios, notas ni otros clientes.
 * ════════════════════════════════════════════════════════════ */
const misPedidos = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.tienda_origen, p.descripcion,
              CASE GREATEST(
                     FIELD(pt.estado, 'en_camino', 'en_warehouse', 'enviado_bolivia', 'entregado'),
                     CASE WHEN pb.estado = 'entregado' THEN 4
                          WHEN pb.estado = 'enviado'   THEN 3
                          ELSE 0 END)
                WHEN 1 THEN 'en_camino'
                WHEN 2 THEN 'en_warehouse'
                WHEN 3 THEN 'enviado_bolivia'
                WHEN 4 THEN 'entregado'
                ELSE 'en_camino' END AS estado,
              COALESCE(pb.fecha_estimada, pt.fecha_estimada_llegada) AS fecha_estimada,
              pt.numero_seguimiento
       FROM pedidos p
       JOIN paquete_tienda_pedidos ptp ON ptp.pedido_id = p.id
       JOIN paquetes_tienda pt ON pt.id = ptp.paquete_tienda_id
       LEFT JOIN paquete_bolivia_pedidos pbp ON pbp.pedido_id = p.id
       LEFT JOIN paquetes_bolivia pb ON pb.id = pbp.paquete_bolivia_id
       WHERE p.cliente_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ pedidos: rows });
  } catch (err) {
    console.error('Error obteniendo mis pedidos:', err);
    res.status(500).json({ error: 'Error interno al obtener tus pedidos' });
  }
};

module.exports = {
  // tienda
  listarTienda, pedidosSinTienda, crearTienda, actualizarEstadoTienda, eliminarTienda,
  // bolivia
  listarBolivia, pedidosSinCaja, crearBolivia, actualizarEstadoBolivia, eliminarBolivia,
  // viewer
  misPedidos,
};

const pool = require('../config/db');

const ROL = { ADMIN: 1, VIEWER: 2, TRABAJADOR: 3 };

/* Log detallado y homogéneo de errores SQL. */
const logErr = (ctx, err) =>
  console.error(`${ctx}:`, { message: err.message, code: err.code, sql: err.sql });

/* ════════════════════════════════════════════════════════════
 *  PAQUETES (de tienda → warehouse España)
 *  Tabla: paquetes  ·  pivote: paquete_pedidos (paquete_id, pedido_id)
 *  Agrupa VARIOS pedidos de UN cliente.
 *  Estados: en_camino → en_warehouse → enviado_bolivia → entregado.
 * ════════════════════════════════════════════════════════════ */

const ESTADOS_TIENDA = ['en_camino', 'en_warehouse', 'enviado_bolivia', 'entregado'];

/* GET /api/paquetes — lista todos los paquetes con cliente, locutorio y contenido. */
const listar = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        p.id, p.estado, p.fecha_estimada_locutorio,
        p.numero_seguimiento, p.notas_internas, p.created_at,
        p.cliente_id, p.locutorio_id,
        l.nombre AS locutorio_nombre,
        l.ciudad AS locutorio_ciudad,
        u.nombre AS cliente_nombre,
        u.apellido AS cliente_apellido,
        COUNT(pp.pedido_id) AS total_pedidos,
        GROUP_CONCAT(ped.tienda_origen ORDER BY ped.id SEPARATOR '|||') AS tiendas,
        GROUP_CONCAT(ped.descripcion  ORDER BY ped.id SEPARATOR '|||') AS descripciones
      FROM paquetes p
      LEFT JOIN locutorios l ON p.locutorio_id = l.id
      LEFT JOIN usuarios u   ON p.cliente_id = u.id
      LEFT JOIN paquete_pedidos pp ON p.id = pp.paquete_id
      LEFT JOIN pedidos ped ON pp.pedido_id = ped.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json({ paquetes: rows });
  } catch (err) {
    logErr('Error listando paquetes', err);
    res.status(500).json({ error: 'Error interno al listar paquetes' });
  }
};

/* GET /api/paquetes/disponibles-tienda?clienteId — pedidos de un cliente
   que aún no están en ningún paquete (para el multi-select del modal). */
const pedidosSinPaquete = async (req, res) => {
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
             u.nombre AS cliente_nombre, u.apellido AS cliente_apellido
      FROM pedidos p
      JOIN usuarios u ON p.cliente_id = u.id
      WHERE p.id NOT IN (SELECT pedido_id FROM paquete_pedidos WHERE pedido_id IS NOT NULL)
        ${filtroCliente}
      ORDER BY p.fecha_compra DESC
    `, params);
    res.json({ pedidos: rows });
  } catch (err) {
    logErr('Error obteniendo pedidos sin paquete', err);
    res.status(500).json({ error: 'Error interno al obtener pedidos disponibles' });
  }
};

/* POST /api/paquetes — crea un paquete con varios pedidos (transacción). */
const crear = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const {
      cliente_id, pedidos, locutorio_id, numero_seguimiento,
      estado, fecha_estimada_locutorio, notas_internas,
    } = req.body;

    if (!cliente_id) { await conn.rollback(); return res.status(400).json({ error: 'Selecciona un cliente' }); }
    if (!pedidos || pedidos.length === 0) { await conn.rollback(); return res.status(400).json({ error: 'Selecciona al menos un pedido' }); }
    if (!locutorio_id) { await conn.rollback(); return res.status(400).json({ error: 'Selecciona un locutorio' }); }

    const estadoFinal = ESTADOS_TIENDA.includes(estado) ? estado : 'en_camino';
    const fechaRecogida = estadoFinal === 'en_warehouse' ? new Date() : null;

    const [result] = await conn.execute(
      `INSERT INTO paquetes
         (cliente_id, locutorio_id, registrado_por, numero_seguimiento,
          estado, fecha_estimada_locutorio, fecha_recogida, notas_internas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id, locutorio_id, req.user.id, numero_seguimiento || null,
        estadoFinal, fecha_estimada_locutorio || null, fechaRecogida, notas_internas || null,
      ]
    );

    const paqueteId = result.insertId;
    for (const pedidoId of pedidos) {
      await conn.execute(
        'INSERT INTO paquete_pedidos (paquete_id, pedido_id) VALUES (?, ?)',
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
    logErr('Error creando paquete', err);
    res.status(500).json({ error: 'Error interno al crear el paquete' });
  } finally {
    conn.release();
  }
};

/* PUT /api/paquetes/:id — actualizar estado y datos editables del paquete
   (cliente, locutorio destino, fecha, seguimiento, notas). Al llegar a
   warehouse sella fecha_recogida automáticamente. */
const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estado, numero_seguimiento, fecha_estimada_locutorio,
      cliente_id, locutorio_id, notas_internas,
    } = req.body;
    if (estado && !ESTADOS_TIENDA.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const fechaRecogida = estado === 'en_warehouse' ? new Date() : null;

    const [result] = await pool.execute(
      `UPDATE paquetes SET
         estado = COALESCE(?, estado),
         numero_seguimiento = COALESCE(?, numero_seguimiento),
         fecha_estimada_locutorio = COALESCE(?, fecha_estimada_locutorio),
         cliente_id = COALESCE(?, cliente_id),
         locutorio_id = COALESCE(?, locutorio_id),
         notas_internas = COALESCE(?, notas_internas),
         fecha_recogida = CASE WHEN ? = 'en_warehouse' AND fecha_recogida IS NULL THEN ? ELSE fecha_recogida END
       WHERE id = ?`,
      [
        estado || null, numero_seguimiento || null, fecha_estimada_locutorio || null,
        cliente_id || null, locutorio_id || null, notas_internas ?? null,
        estado || null, fechaRecogida, id,
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Paquete no encontrado' });
    res.json({ mensaje: 'Paquete actualizado', estado });
  } catch (err) {
    logErr('Error actualizando paquete', err);
    res.status(500).json({ error: 'Error interno al actualizar el paquete' });
  }
};

/* DELETE /api/paquetes/:id — paquete_pedidos cae en cascada. */
const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM paquetes WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Paquete no encontrado' });
    res.json({ mensaje: 'Paquete eliminado' });
  } catch (err) {
    logErr('Error eliminando paquete', err);
    res.status(500).json({ error: 'Error interno al eliminar el paquete' });
  }
};

/* ════════════════════════════════════════════════════════════
 *  PAQUETES PARA BOLIVIA
 *  Tabla: paquetes_bolivia · pivote: paquete_bolivia_pedidos
 *  Caja que mezcla pedidos de varios clientes.
 *  Estados: armando → enviado → entregado.
 * ════════════════════════════════════════════════════════════ */

const ESTADOS_BOLIVIA = ['armando', 'enviado', 'entregado'];

/* GET /api/paquetes/bolivia */
const listarBolivia = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        pb.id, pb.estado, pb.fecha_estimada, pb.fecha_entrega,
        pb.numero_seguimiento, pb.precio_envio_total,
        pb.notas_internas, pb.created_at,
        COUNT(pbp.pedido_id) AS total_pedidos,
        COUNT(DISTINCT ped.cliente_id) AS total_clientes,
        u.nombre AS registrado_nombre,
        GROUP_CONCAT(CONCAT(uc.nombre, ' · ', ped.descripcion) ORDER BY ped.id SEPARATOR '|||') AS contenido
      FROM paquetes_bolivia pb
      LEFT JOIN usuarios u ON pb.registrado_por = u.id
      LEFT JOIN paquete_bolivia_pedidos pbp ON pb.id = pbp.paquete_bolivia_id
      LEFT JOIN pedidos ped ON pbp.pedido_id = ped.id
      LEFT JOIN usuarios uc ON ped.cliente_id = uc.id
      GROUP BY pb.id
      ORDER BY pb.created_at DESC
    `);
    res.json({ paquetes: rows });
  } catch (err) {
    logErr('Error listando cajas para Bolivia', err);
    res.status(500).json({ error: 'Error interno al listar las cajas para Bolivia' });
  }
};

/* GET /api/paquetes/disponibles — pedidos sin caja Bolivia (cualquier cliente).
   Añade estado_tienda (estado del paquete que lo contiene) para la UI. */
const pedidosDisponibles = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.id, p.descripcion, p.tienda_origen, p.cliente_id,
             p.precio_total, p.moneda,
             u.nombre AS cliente_nombre, u.apellido AS cliente_apellido,
             pak.estado AS estado_tienda
      FROM pedidos p
      JOIN usuarios u ON p.cliente_id = u.id
      LEFT JOIN paquete_pedidos pp ON pp.pedido_id = p.id
      LEFT JOIN paquetes pak ON pak.id = pp.paquete_id
      WHERE p.id NOT IN (SELECT pedido_id FROM paquete_bolivia_pedidos WHERE pedido_id IS NOT NULL)
      ORDER BY u.nombre ASC, p.created_at DESC
    `);
    res.json({ pedidos: rows });
  } catch (err) {
    logErr('Error obteniendo pedidos disponibles', err);
    res.status(500).json({ error: 'Error interno al obtener pedidos disponibles' });
  }
};

/* POST /api/paquetes/bolivia — crea una caja con varios pedidos (transacción). */
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
    logErr('Error creando caja para Bolivia', err);
    res.status(500).json({ error: 'Error interno al crear la caja para Bolivia' });
  } finally {
    conn.release();
  }
};

/* PUT /api/paquetes/bolivia/:id — actualizar estado de la caja. */
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
    logErr('Error actualizando caja para Bolivia', err);
    res.status(500).json({ error: 'Error interno al actualizar la caja' });
  }
};

/* DELETE /api/paquetes/bolivia/:id */
const eliminarBolivia = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM paquetes_bolivia WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Caja no encontrada' });
    res.json({ mensaje: 'Caja eliminada' });
  } catch (err) {
    logErr('Error eliminando caja para Bolivia', err);
    res.status(500).json({ error: 'Error interno al eliminar la caja' });
  }
};

/* ════════════════════════════════════════════════════════════
 *  VISTA CLIENTE — GET /api/paquetes/mispedidos
 *  Sus pedidos y el estado de su paquete. Sin locutorio, precios ni notas.
 *  El estado mostrado deriva al mayor avance entre el paquete (warehouse)
 *  y la caja Bolivia que contiene el pedido.
 * ════════════════════════════════════════════════════════════ */
const misPedidos = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.tienda_origen, p.descripcion, p.created_at,
              CASE GREATEST(
                     COALESCE(FIELD(pak.estado, 'en_camino', 'en_warehouse', 'enviado_bolivia', 'entregado'), 1),
                     CASE WHEN pb.estado = 'entregado' THEN 4
                          WHEN pb.estado = 'enviado'   THEN 3
                          ELSE 0 END)
                WHEN 1 THEN 'en_camino'
                WHEN 2 THEN 'en_warehouse'
                WHEN 3 THEN 'enviado_bolivia'
                WHEN 4 THEN 'entregado'
                ELSE 'en_camino' END AS estado,
              pak.estado AS estado_paquete,
              COALESCE(pb.fecha_estimada, pak.fecha_estimada_locutorio) AS fecha_estimada,
              pak.numero_seguimiento
       FROM pedidos p
       LEFT JOIN paquete_pedidos pp ON p.id = pp.pedido_id
       LEFT JOIN paquetes pak ON pp.paquete_id = pak.id
       LEFT JOIN paquete_bolivia_pedidos pbp ON pbp.pedido_id = p.id
       LEFT JOIN paquetes_bolivia pb ON pb.id = pbp.paquete_bolivia_id
       WHERE p.cliente_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ pedidos: rows });
  } catch (err) {
    logErr('Error obteniendo mis pedidos', err);
    res.status(500).json({ error: 'Error interno al obtener tus pedidos' });
  }
};

module.exports = {
  // paquetes (tienda)
  listar, pedidosSinPaquete, crear, actualizarEstado, eliminar,
  // bolivia
  listarBolivia, pedidosDisponibles, crearBolivia, actualizarEstadoBolivia, eliminarBolivia,
  // viewer
  misPedidos,
};

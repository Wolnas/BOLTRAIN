const pool = require('../config/db');

/* Log detallado y homogéneo de errores SQL. */
const logErr = (ctx, err) =>
  console.error(`${ctx}:`, { message: err.message, code: err.code, sql: err.sql });

/* Mes/año actuales por defecto */
function periodo(req) {
  const hoy = new Date();
  const mes = parseInt(req.query.mes, 10) || (hoy.getMonth() + 1);
  const anio = parseInt(req.query.anio, 10) || hoy.getFullYear();
  return { mes, anio };
}

/* ─── Resumen financiero del mes ─── */
const resumen = async (req, res) => {
  try {
    const { mes, anio } = periodo(req);

    // Pedidos del mes (por fecha de compra)
    const [pedidos] = await pool.execute(
      `SELECT p.id, p.descripcion, p.tienda_origen, p.moneda,
              p.precio_producto, p.precio_envio, p.precio_total,
              p.precio_venta, p.ganancia, p.precio_cotizado_bob,
              p.tipo_cambio_aplicado, p.fecha_compra,
              uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido
       FROM pedidos p
       JOIN usuarios uc ON p.cliente_id = uc.id
       WHERE MONTH(p.fecha_compra) = ? AND YEAR(p.fecha_compra) = ?
       ORDER BY p.fecha_compra ASC`,
      [mes, anio]
    );

    // Paquetes para Bolivia (envíos) del mes (por fecha de creación / armado)
    const [paquetes] = await pool.execute(
      `SELECT pk.id, pk.estado, pk.precio_envio_total,
              pk.created_at, pk.fecha_entrega,
              COUNT(DISTINCT p.cliente_id) AS total_clientes
       FROM paquetes_bolivia pk
       LEFT JOIN paquete_bolivia_pedidos pbp ON pk.id = pbp.paquete_bolivia_id
       LEFT JOIN pedidos p ON pbp.pedido_id = p.id
       WHERE MONTH(pk.created_at) = ? AND YEAR(pk.created_at) = ?
       GROUP BY pk.id
       ORDER BY pk.created_at ASC`,
      [mes, anio]
    );

    const num = (v) => parseFloat(v || 0);

    const totalInvertido = pedidos.reduce((s, p) => s + num(p.precio_total), 0);
    const totalCobrado   = pedidos.reduce((s, p) => s + num(p.precio_venta), 0);
    const gananciaProductos = pedidos.reduce((s, p) => s + num(p.ganancia), 0);

    // La tabla paquetes_bolivia no registra costo de envío: el resultado de envíos
    // es lo cobrado por el envío a Bolivia (precio total de cada caja).
    const enviosCobrado = paquetes.reduce((s, p) => s + num(p.precio_envio_total), 0);
    const resultadoEnvios = enviosCobrado;

    const balance = gananciaProductos + resultadoEnvios;

    res.json({
      periodo: { mes, anio },
      resumen: {
        totalInvertido, totalCobrado, gananciaProductos,
        enviosCobrado, resultadoEnvios, balance,
      },
      pedidos,
      paquetes,
    });
  } catch (err) {
    logErr('Error en resumen financiero', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

/* ─── Balance de los últimos 6 meses (para gráfico) ─── */
const balanceMensual = async (req, res) => {
  try {
    const meses = [];
    const base = new Date();
    base.setDate(1);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const mes = d.getMonth() + 1;
      const anio = d.getFullYear();

      const [[prod]] = await pool.execute(
        `SELECT COALESCE(SUM(ganancia),0) AS ganancia
         FROM pedidos WHERE MONTH(fecha_compra)=? AND YEAR(fecha_compra)=?`,
        [mes, anio]
      );
      const [[env]] = await pool.execute(
        `SELECT COALESCE(SUM(precio_envio_total),0) AS resultado
         FROM paquetes_bolivia WHERE MONTH(created_at)=? AND YEAR(created_at)=?`,
        [mes, anio]
      );

      const ganancia = parseFloat(prod.ganancia) + parseFloat(env.resultado);
      meses.push({
        mes, anio,
        label: d.toLocaleDateString('es-ES', { month: 'short' }),
        balance: ganancia,
      });
    }

    res.json({ meses });
  } catch (err) {
    logErr('Error en balance mensual', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

/* ─── Compras de dólares ─── */
const listarCompras = async (req, res) => {
  try {
    const { mes, anio } = periodo(req);
    const [rows] = await pool.execute(
      `SELECT * FROM compras_dolares
       WHERE MONTH(fecha)=? AND YEAR(fecha)=?
       ORDER BY fecha DESC`,
      [mes, anio]
    );
    const total = rows.reduce((s, c) => s + parseFloat(c.dolares || 0), 0);
    res.json({ compras: rows, totalDolares: total });
  } catch (err) {
    logErr('Error listando compras de dólares', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const crearCompra = async (req, res) => {
  try {
    const { fecha, bolivianos, tipo_cambio, dolares, notas } = req.body;
    if (!fecha || !bolivianos || !tipo_cambio || !dolares) {
      return res.status(400).json({ error: 'Completa fecha, bolivianos, tipo de cambio y dólares' });
    }
    const [result] = await pool.execute(
      `INSERT INTO compras_dolares (fecha, bolivianos, tipo_cambio, dolares, notas, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fecha, bolivianos, tipo_cambio, dolares, notas || null, req.user.id]
    );
    const [rows] = await pool.execute('SELECT * FROM compras_dolares WHERE id = ?', [result.insertId]);
    res.status(201).json({ compra: rows[0] });
  } catch (err) {
    logErr('Error creando compra de dólares', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const eliminarCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM compras_dolares WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Compra no encontrada' });
    res.json({ mensaje: 'Compra eliminada' });
  } catch (err) {
    logErr('Error eliminando compra', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = { resumen, balanceMensual, listarCompras, crearCompra, eliminarCompra };

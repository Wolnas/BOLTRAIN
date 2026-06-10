-- ════════════════════════════════════════════════════════════
--  BOLTRAIN — Rediseño Paquetes v2 (flujo warehouse + cajas Bolivia)
--
--  paquetes_tienda  → un pedido de UN cliente que llega al warehouse.
--                     Estados: en_camino → en_warehouse → enviado_bolivia → entregado
--  paquetes_bolivia → caja que arma el trabajador; puede mezclar pedidos
--                     de VARIOS clientes. Estados: armando → enviado → entregado
--  paquete_bolivia_pedidos → pivote caja ↔ pedidos.
--
--  Idempotente: usa guards de information_schema, seguro de re-ejecutar.
-- ════════════════════════════════════════════════════════════

-- ── 1. Renombrar paquetes_cliente → paquetes_bolivia ─────────
SET @do := (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = 'paquetes_cliente')
         * (1 - (SELECT COUNT(*) FROM information_schema.tables
                 WHERE table_schema = DATABASE() AND table_name = 'paquetes_bolivia'));
SET @sql := IF(@do = 1, 'RENAME TABLE paquetes_cliente TO paquetes_bolivia', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── 2. Renombrar paquete_cliente_pedidos → paquete_bolivia_pedidos ──
SET @do := (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = 'paquete_cliente_pedidos')
         * (1 - (SELECT COUNT(*) FROM information_schema.tables
                 WHERE table_schema = DATABASE() AND table_name = 'paquete_bolivia_pedidos'));
SET @sql := IF(@do = 1, 'RENAME TABLE paquete_cliente_pedidos TO paquete_bolivia_pedidos', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── 3. paquetes_bolivia: quitar cliente_id (una caja mezcla clientes) ──
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes_bolivia' AND column_name = 'cliente_id');
SET @sql := IF(@c = 1, 'ALTER TABLE paquetes_bolivia DROP FOREIGN KEY fk_pc_cliente, DROP COLUMN cliente_id', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── 4. paquetes_bolivia: precio_envio_bolivia → precio_envio_total ──
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes_bolivia' AND column_name = 'precio_envio_bolivia');
SET @sql := IF(@c = 1, 'ALTER TABLE paquetes_bolivia CHANGE COLUMN precio_envio_bolivia precio_envio_total DECIMAL(10,2) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── 5. paquete_bolivia_pedidos: paquete_cliente_id → paquete_bolivia_id ──
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquete_bolivia_pedidos' AND column_name = 'paquete_cliente_id');
SET @sql := IF(@c = 1, 'ALTER TABLE paquete_bolivia_pedidos CHANGE COLUMN paquete_cliente_id paquete_bolivia_id INT UNSIGNED NOT NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── 6. paquetes_tienda: añadir cliente_id ────────────────────
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes_tienda' AND column_name = 'cliente_id');
SET @sql := IF(@c = 0,
  'ALTER TABLE paquetes_tienda
     ADD COLUMN cliente_id INT UNSIGNED NULL AFTER pedido_id,
     ADD CONSTRAINT fk_pt_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios (id)',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── 7. paquetes_tienda: renombrar fechas a la nueva semántica ──
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes_tienda' AND column_name = 'fecha_estimada_locutorio');
SET @sql := IF(@c = 1, 'ALTER TABLE paquetes_tienda CHANGE COLUMN fecha_estimada_locutorio fecha_estimada_llegada DATE NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes_tienda' AND column_name = 'fecha_recogida');
SET @sql := IF(@c = 1, 'ALTER TABLE paquetes_tienda CHANGE COLUMN fecha_recogida fecha_llegada DATE NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── 8. paquetes_tienda: quitar precio_envio_bolivia (no aplica aquí) ──
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes_tienda' AND column_name = 'precio_envio_bolivia');
SET @sql := IF(@c = 1, 'ALTER TABLE paquetes_tienda DROP COLUMN precio_envio_bolivia', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── 9. paquetes_tienda: nuevos estados (mapea los antiguos si los hubiera) ──
ALTER TABLE paquetes_tienda
  MODIFY estado ENUM('en_transito','en_locutorio','recogido',
                     'en_camino','en_warehouse','enviado_bolivia','entregado')
         NOT NULL DEFAULT 'en_camino';
UPDATE paquetes_tienda SET estado = 'en_camino'      WHERE estado = 'en_transito';
UPDATE paquetes_tienda SET estado = 'en_warehouse'   WHERE estado = 'en_locutorio';
UPDATE paquetes_tienda SET estado = 'enviado_bolivia' WHERE estado = 'recogido';
ALTER TABLE paquetes_tienda
  MODIFY estado ENUM('en_camino','en_warehouse','enviado_bolivia','entregado')
         NOT NULL DEFAULT 'en_camino';

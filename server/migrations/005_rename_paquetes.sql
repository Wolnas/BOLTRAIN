-- ════════════════════════════════════════════════════════════
--  BOLTRAIN — Renombrar tablas de paquetes a los nombres definitivos
--
--  paquetes_tienda        → paquetes
--  paquete_tienda_pedidos → paquete_pedidos  (col paquete_tienda_id → paquete_id)
--  paquetes: fecha_llegada → fecha_recogida; + pedido_id, + precio_envio_bolivia
--  (paquetes_bolivia y paquete_bolivia_pedidos no cambian)
--  Idempotente.
-- ════════════════════════════════════════════════════════════

-- 1. paquetes_tienda → paquetes
SET @do := (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = 'paquetes_tienda')
         * (1 - (SELECT COUNT(*) FROM information_schema.tables
                 WHERE table_schema = DATABASE() AND table_name = 'paquetes'));
SET @sql := IF(@do = 1, 'RENAME TABLE paquetes_tienda TO paquetes', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 2. paquete_tienda_pedidos → paquete_pedidos
SET @do := (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = 'paquete_tienda_pedidos')
         * (1 - (SELECT COUNT(*) FROM information_schema.tables
                 WHERE table_schema = DATABASE() AND table_name = 'paquete_pedidos'));
SET @sql := IF(@do = 1, 'RENAME TABLE paquete_tienda_pedidos TO paquete_pedidos', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 3. paquete_pedidos: columna paquete_tienda_id → paquete_id
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquete_pedidos' AND column_name = 'paquete_tienda_id');
SET @sql := IF(@c = 1, 'ALTER TABLE paquete_pedidos CHANGE COLUMN paquete_tienda_id paquete_id INT UNSIGNED NOT NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 4. paquetes: fecha_llegada → fecha_recogida
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes' AND column_name = 'fecha_llegada');
SET @sql := IF(@c = 1, 'ALTER TABLE paquetes CHANGE COLUMN fecha_llegada fecha_recogida DATE NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 5. paquetes: añadir pedido_id (compat con esquema declarado)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes' AND column_name = 'pedido_id');
SET @sql := IF(@c = 0, 'ALTER TABLE paquetes ADD COLUMN pedido_id INT UNSIGNED NULL AFTER id', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 6. paquetes: añadir precio_envio_bolivia
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes' AND column_name = 'precio_envio_bolivia');
SET @sql := IF(@c = 0, 'ALTER TABLE paquetes ADD COLUMN precio_envio_bolivia DECIMAL(10,2) NULL AFTER notas_internas', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

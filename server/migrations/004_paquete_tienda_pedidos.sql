-- ════════════════════════════════════════════════════════════
--  BOLTRAIN — paquetes_tienda pasa a ser multi-pedido
--
--  Antes: paquetes_tienda tenía pedido_id (1 pedido por paquete).
--  Ahora: un paquete de tienda agrupa VARIOS pedidos de un mismo cliente
--         mediante el pivote paquete_tienda_pedidos.
--  Idempotente.
-- ════════════════════════════════════════════════════════════

-- 1. Pivote paquete_tienda ↔ pedidos
CREATE TABLE IF NOT EXISTS paquete_tienda_pedidos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paquete_tienda_id INT UNSIGNED NOT NULL,
  pedido_id INT UNSIGNED NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ptp_paquete FOREIGN KEY (paquete_tienda_id) REFERENCES paquetes_tienda (id) ON DELETE CASCADE,
  CONSTRAINT fk_ptp_pedido  FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Migrar el pedido_id existente de cada paquete_tienda al pivote
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'paquetes_tienda' AND column_name = 'pedido_id');
SET @sql := IF(@col = 1,
  'INSERT INTO paquete_tienda_pedidos (paquete_tienda_id, pedido_id)
   SELECT id, pedido_id FROM paquetes_tienda WHERE pedido_id IS NOT NULL',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 3. Eliminar la FK y la columna pedido_id de paquetes_tienda
SET @sql := IF(@col = 1,
  'ALTER TABLE paquetes_tienda DROP FOREIGN KEY fk_pt_pedido, DROP COLUMN pedido_id',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

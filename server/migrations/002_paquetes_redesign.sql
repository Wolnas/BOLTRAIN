-- ════════════════════════════════════════════════════════════
--  BOLTRAIN — Rediseño del módulo Paquetes
--  Separa el antiguo `paquetes` en DOS flujos distintos:
--    1) paquetes_tienda  → un pedido viajando de la tienda al locutorio (España)
--    2) paquetes_cliente → una caja armada con varios pedidos rumbo a Bolivia
--  Idempotente: se puede ejecutar varias veces sin romper nada.
-- ════════════════════════════════════════════════════════════

-- ── 1. FLUJO 1: Paquete de Tienda ────────────────────────────
--    Cada paquete_tienda envuelve UN pedido y rastrea su llegada
--    al locutorio en España. Estados: en_transito → en_locutorio → recogido.
CREATE TABLE IF NOT EXISTS paquetes_tienda (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT UNSIGNED NOT NULL,
  locutorio_id INT UNSIGNED NOT NULL,
  registrado_por INT UNSIGNED NULL,
  numero_seguimiento VARCHAR(100) NULL,
  estado ENUM('en_transito','en_locutorio','recogido') NOT NULL DEFAULT 'en_transito',
  fecha_estimada_locutorio DATE NULL,
  fecha_recogida DATE NULL,
  notas_internas TEXT NULL,
  precio_envio_bolivia DECIMAL(10,2) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pt_pedido (pedido_id),
  KEY idx_pt_estado (estado),
  KEY idx_pt_locutorio (locutorio_id),
  KEY idx_pt_registrado (registrado_por),
  CONSTRAINT fk_pt_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
  CONSTRAINT fk_pt_locutorio FOREIGN KEY (locutorio_id) REFERENCES locutorios (id),
  CONSTRAINT fk_pt_registrado FOREIGN KEY (registrado_por) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── 2. FLUJO 2: Paquete de Cliente ───────────────────────────
--    Caja armada para Bolivia, contiene varios pedidos.
--    Estados: armando → enviado → entregado. (Sin locutorio: eso es del paquete_tienda.)
CREATE TABLE IF NOT EXISTS paquetes_cliente (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  registrado_por INT UNSIGNED NULL,
  numero_seguimiento VARCHAR(100) NULL,
  precio_envio_bolivia DECIMAL(10,2) NULL,
  estado ENUM('armando','enviado','entregado') NOT NULL DEFAULT 'armando',
  fecha_estimada DATE NULL,
  fecha_entrega DATE NULL,
  notas_internas TEXT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_pc_cliente (cliente_id),
  KEY idx_pc_estado (estado),
  KEY idx_pc_registrado (registrado_por),
  CONSTRAINT fk_pc_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios (id),
  CONSTRAINT fk_pc_registrado FOREIGN KEY (registrado_por) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── 3. Pivote paquete_cliente ↔ pedidos ──────────────────────
--    Un pedido sólo puede pertenecer a un paquete_cliente (UNIQUE).
CREATE TABLE IF NOT EXISTS paquete_cliente_pedidos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paquete_cliente_id INT UNSIGNED NOT NULL,
  pedido_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pcp_pedido (pedido_id),
  KEY idx_pcp_paquete (paquete_cliente_id),
  CONSTRAINT fk_pcp_paquete FOREIGN KEY (paquete_cliente_id) REFERENCES paquetes_cliente (id) ON DELETE CASCADE,
  CONSTRAINT fk_pcp_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ── 4. Migrar datos del antiguo `paquetes` → `paquetes_cliente` ──
--    El significado de la tabla `paquetes` era exactamente "caja para Bolivia".
--    Sólo migramos si la tabla antigua todavía existe (idempotente).
SET @old := (SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = 'paquetes');

SET @sql := IF(@old = 1,
  'INSERT INTO paquetes_cliente
     (id, cliente_id, registrado_por, numero_seguimiento, precio_envio_bolivia,
      estado, fecha_estimada, fecha_entrega, notas_internas, created_at, updated_at)
   SELECT id, cliente_id, registrado_por, numero_seguimiento, precio_envio_bolivia,
          estado, fecha_estimada, fecha_entrega, notas_internas, created_at, updated_at
   FROM paquetes',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @oldpp := (SELECT COUNT(*) FROM information_schema.tables
               WHERE table_schema = DATABASE() AND table_name = 'paquete_pedidos');

SET @sql := IF(@oldpp = 1,
  'INSERT INTO paquete_cliente_pedidos (id, paquete_cliente_id, pedido_id, created_at)
   SELECT id, paquete_id, pedido_id, created_at FROM paquete_pedidos',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── 5. Eliminar tablas antiguas (primero el pivote por la FK) ──
DROP TABLE IF EXISTS paquete_pedidos;
DROP TABLE IF EXISTS paquetes;

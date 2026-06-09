-- ════════════════════════════════════════════════════════════
--  BOLTRAIN v2 — Migración: rol trabajador, finanzas, locutorios
-- ════════════════════════════════════════════════════════════

-- 1. Nuevo rol: trabajador (id = 3)
INSERT INTO roles (id, nombre, descripcion)
VALUES (3, 'trabajador', 'Gestión de paquetes en España')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion);

-- 2. PEDIDOS — estado en_transito + cotización en BOB + locutorio de recogida
ALTER TABLE pedidos
  MODIFY estado ENUM('pendiente','en_transito','en_locutorio','recogido','en_camino','entregado')
         NOT NULL DEFAULT 'pendiente';

SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'precio_cotizado_bob');
SET @sql := IF(@col = 0,
  'ALTER TABLE pedidos ADD COLUMN precio_cotizado_bob DECIMAL(10,2) NULL AFTER precio_venta',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'tipo_cambio_aplicado');
SET @sql := IF(@col = 0,
  'ALTER TABLE pedidos ADD COLUMN tipo_cambio_aplicado DECIMAL(10,4) NULL AFTER precio_cotizado_bob',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 3. PAQUETES — nuevos estados (armando/enviado/entregado) + precios de envío a Bolivia
--    Migramos los valores antiguos preservando el significado.
ALTER TABLE paquetes
  MODIFY estado ENUM('pendiente','en_transito','entregado','armando','enviado')
         NOT NULL DEFAULT 'armando';
UPDATE paquetes SET estado = 'armando' WHERE estado = 'pendiente';
UPDATE paquetes SET estado = 'enviado' WHERE estado = 'en_transito';
ALTER TABLE paquetes
  MODIFY estado ENUM('armando','enviado','entregado') NOT NULL DEFAULT 'armando';

SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'paquetes' AND column_name = 'precio_envio_bolivia');
SET @sql := IF(@col = 0,
  'ALTER TABLE paquetes ADD COLUMN precio_envio_bolivia DECIMAL(10,2) NULL AFTER notas_internas',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 4. COMPRAS DE DÓLARES — registro de compras de divisa (módulo Finanzas)
CREATE TABLE IF NOT EXISTS compras_dolares (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  bolivianos DECIMAL(12,2) NOT NULL,
  tipo_cambio DECIMAL(10,4) NOT NULL,
  dolares DECIMAL(12,2) NOT NULL,
  notas TEXT NULL,
  registrado_por INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_compras_fecha (fecha)
);

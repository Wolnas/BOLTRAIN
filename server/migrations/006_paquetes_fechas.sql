-- ════════════════════════════════════════════════════════════
--  BOLTRAIN — Ajuste de columnas de fecha en `paquetes`
--    fecha_estimada_llegada → fecha_estimada_locutorio
--    + fecha_estimada, fecha_entrega (para coincidir con el esquema)
--  Idempotente.
-- ════════════════════════════════════════════════════════════

-- 1. fecha_estimada_llegada → fecha_estimada_locutorio
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes' AND column_name = 'fecha_estimada_llegada');
SET @sql := IF(@c = 1, 'ALTER TABLE paquetes CHANGE COLUMN fecha_estimada_llegada fecha_estimada_locutorio DATE NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 2. + fecha_estimada
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes' AND column_name = 'fecha_estimada');
SET @sql := IF(@c = 0, 'ALTER TABLE paquetes ADD COLUMN fecha_estimada DATE NULL AFTER estado', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 3. + fecha_entrega
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'paquetes' AND column_name = 'fecha_entrega');
SET @sql := IF(@c = 0, 'ALTER TABLE paquetes ADD COLUMN fecha_entrega DATE NULL AFTER fecha_estimada', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

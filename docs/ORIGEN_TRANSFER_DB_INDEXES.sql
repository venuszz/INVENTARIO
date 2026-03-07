-- ============================================================================
-- ÍNDICES PARA TRANSFERENCIA DE ORIGEN
-- ============================================================================
-- Propósito: Optimizar las consultas de validación y búsqueda durante
-- la transferencia de registros entre tablas inea, itea y no-listado
-- Fecha: 2026-03-05
-- ============================================================================

-- Verificar índices existentes en id_inventario
-- Estos índices son críticos para:
-- 1. Verificar duplicados en tabla destino
-- 2. Buscar registros por id_inventario
-- 3. Validar resguardos activos

-- Índice en tabla INEA
CREATE INDEX IF NOT EXISTS idx_inea_id_inventario 
ON inea(id_inventario);

-- Índice en tabla ITEA
CREATE INDEX IF NOT EXISTS idx_itea_id_inventario 
ON itea(id_inventario);

-- Índice en tabla NO-LISTADO
CREATE INDEX IF NOT EXISTS idx_no_listado_id_inventario 
ON "no-listado"(id_inventario);

-- Índice en tabla RESGUARDOS para verificación de resguardos activos
-- Optimiza la búsqueda de resguardos sin fecha_baja
CREATE INDEX IF NOT EXISTS idx_resguardos_id_inventario_fecha_baja 
ON resguardos(id_inventario, fecha_baja);

-- Índice en tabla CAMBIOS_INVENTARIO para auditoría
-- Optimiza la búsqueda de historial de cambios por id_inventario
CREATE INDEX IF NOT EXISTS idx_cambios_inventario_id_inventario 
ON cambios_inventario(id_inventario);

-- Índice compuesto para búsqueda de cambios de origen específicos
CREATE INDEX IF NOT EXISTS idx_cambios_inventario_campo_timestamp 
ON cambios_inventario(campo, timestamp DESC) 
WHERE campo = 'origen';

-- ============================================================================
-- VERIFICACIÓN DE ÍNDICES
-- ============================================================================
-- Para verificar que los índices se crearon correctamente, ejecutar:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('inea', 'itea', 'no-listado', 'resguardos', 'cambios_inventario')
-- ORDER BY tablename, indexname;
-- ============================================================================

-- ============================================================================
-- NOTAS DE PERFORMANCE
-- ============================================================================
-- 1. Los índices en id_inventario mejoran las búsquedas de O(n) a O(log n)
-- 2. El índice compuesto en resguardos optimiza la validación de resguardos activos
-- 3. El índice parcial en cambios_inventario reduce el tamaño del índice
-- 4. Estos índices deben mantenerse actualizados automáticamente por PostgreSQL
-- ============================================================================

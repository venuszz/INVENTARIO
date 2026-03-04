-- ============================================================================
-- Tabla: cambios_inventario
-- Descripción: Almacena el historial de cambios de todos los módulos de inventario
-- Fecha: 3 de marzo de 2026
-- ============================================================================

-- Crear la tabla
CREATE TABLE cambios_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_mueble UUID NOT NULL,
  tabla_origen TEXT NOT NULL CHECK (tabla_origen IN ('muebles', 'mueblesitea', 'mueblestlaxcala')),
  campo_modificado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  fecha_cambio TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_cambios_id_mueble ON cambios_inventario(id_mueble);
CREATE INDEX idx_cambios_tabla_origen ON cambios_inventario(tabla_origen);
CREATE INDEX idx_cambios_fecha ON cambios_inventario(fecha_cambio DESC);
CREATE INDEX idx_cambios_usuario ON cambios_inventario(usuario_id);
CREATE INDEX idx_cambios_mueble_tabla ON cambios_inventario(id_mueble, tabla_origen);

-- Habilitar Row Level Security
ALTER TABLE cambios_inventario ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios autenticados pueden ver el historial
CREATE POLICY "Los usuarios autenticados pueden ver el historial"
  ON cambios_inventario FOR SELECT
  TO authenticated
  USING (true);

-- Política: Los usuarios autenticados pueden insertar cambios
CREATE POLICY "Los usuarios autenticados pueden insertar cambios"
  ON cambios_inventario FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

-- ============================================================================
-- Comentarios en las columnas
-- ============================================================================

COMMENT ON TABLE cambios_inventario IS 'Historial de cambios para todos los módulos de inventario';
COMMENT ON COLUMN cambios_inventario.id IS 'Identificador único del registro de cambio';
COMMENT ON COLUMN cambios_inventario.id_mueble IS 'UUID del bien de inventario modificado (puede hacer JOIN con muebles, mueblesitea o mueblestlaxcala)';
COMMENT ON COLUMN cambios_inventario.tabla_origen IS 'Tabla de origen: muebles (INEA), mueblesitea (ITEA), mueblestlaxcala (No Listado)';
COMMENT ON COLUMN cambios_inventario.campo_modificado IS 'Nombre técnico del campo modificado';
COMMENT ON COLUMN cambios_inventario.valor_anterior IS 'Valor antes del cambio';
COMMENT ON COLUMN cambios_inventario.valor_nuevo IS 'Valor después del cambio';
COMMENT ON COLUMN cambios_inventario.usuario_id IS 'UUID del usuario que realizó el cambio (referencia a auth.users)';
COMMENT ON COLUMN cambios_inventario.fecha_cambio IS 'Timestamp del cambio';
COMMENT ON COLUMN cambios_inventario.metadata IS 'Información adicional en formato JSON (campo_display, tipo_cambio, razon_cambio, etc.)';

-- ============================================================================
-- Ejemplo de consultas útiles
-- ============================================================================

-- Ver historial de un bien específico (usando UUID)
-- SELECT * FROM cambios_inventario WHERE id_mueble = 'uuid-del-bien' ORDER BY fecha_cambio DESC;

-- Ver historial con JOIN a la tabla de origen (INEA)
-- SELECT c.*, m.id_inv, m.descripcion 
-- FROM cambios_inventario c
-- JOIN muebles m ON c.id_mueble = m.id
-- WHERE c.tabla_origen = 'muebles'
-- ORDER BY c.fecha_cambio DESC;

-- Ver historial con JOIN a la tabla de origen (ITEA)
-- SELECT c.*, m.id_inv, m.descripcion 
-- FROM cambios_inventario c
-- JOIN mueblesitea m ON c.id_mueble = m.id
-- WHERE c.tabla_origen = 'mueblesitea'
-- ORDER BY c.fecha_cambio DESC;

-- Ver historial con JOIN a la tabla de origen (No Listado)
-- SELECT c.*, m.id_inv, m.descripcion 
-- FROM cambios_inventario c
-- JOIN mueblestlaxcala m ON c.id_mueble = m.id
-- WHERE c.tabla_origen = 'mueblestlaxcala'
-- ORDER BY c.fecha_cambio DESC;

-- Ver cambios recientes de todos los módulos
-- SELECT * FROM cambios_inventario ORDER BY fecha_cambio DESC LIMIT 50;

-- Ver cambios por usuario (con JOIN a auth.users para obtener email)
-- SELECT c.*, u.email 
-- FROM cambios_inventario c
-- LEFT JOIN auth.users u ON c.usuario_id = u.id
-- WHERE u.email = 'usuario@ejemplo.com' 
-- ORDER BY c.fecha_cambio DESC;

-- Ver cambios de un módulo específico
-- SELECT * FROM cambios_inventario WHERE tabla_origen = 'muebles' ORDER BY fecha_cambio DESC;

-- Estadísticas de cambios por módulo
-- SELECT tabla_origen, COUNT(*) as total_cambios FROM cambios_inventario GROUP BY tabla_origen;

-- Ver cambios con el motivo del cambio y email del usuario
-- SELECT 
--   c.id_mueble,
--   c.campo_modificado,
--   c.valor_anterior,
--   c.valor_nuevo,
--   c.metadata->>'razon_cambio' as motivo,
--   u.email as usuario_email,
--   c.fecha_cambio
-- FROM cambios_inventario c
-- LEFT JOIN auth.users u ON c.usuario_id = u.id
-- WHERE c.metadata->>'razon_cambio' IS NOT NULL
-- ORDER BY c.fecha_cambio DESC;

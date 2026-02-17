-- =====================================================
-- MIGRACIÓN: Eliminar columna puesto_resguardo
-- =====================================================
-- El puesto ahora se obtiene directamente de la tabla directorio
-- mediante la relación id_directorio

-- 1. Eliminar el índice asociado a puesto_resguardo
DROP INDEX IF EXISTS idx_resguardos_puesto;

-- 2. Eliminar la columna puesto_resguardo
ALTER TABLE public.resguardos 
DROP COLUMN IF EXISTS puesto_resguardo;

-- 3. Verificar la estructura final de la tabla
-- La tabla ahora debe tener:
-- - id (serial, PK)
-- - folio (text, not null)
-- - f_resguardo (date, not null)
-- - id_directorio (integer, not null, FK a directorio)
-- - id_mueble (uuid, not null)
-- - origen (text, not null, check constraint)
-- - resguardante (text, not null)
-- - created_by (uuid, not null, FK a auth.users)
-- - created_at (timestamp with time zone)
-- - id_area (integer, not null, FK a area)

-- Para obtener el puesto, usar:
-- SELECT r.*, d.puesto 
-- FROM resguardos r
-- JOIN directorio d ON r.id_directorio = d.id_directorio;

# Sistema de Historial de Cambios - Listo para Probar

## Fecha
3 de marzo de 2026

## ⚠️ ACTUALIZACIÓN IMPORTANTE: API Segura Implementada

**Fecha**: 3 de marzo de 2026

El sistema ahora usa una API de servidor segura (`/api/cambios-inventario`) con service role key para evitar errores de RLS.

**Ver**: 
- `docs/CAMBIOS_INVENTARIO_QUICK_START.md` - Configuración rápida (5 minutos)
- `docs/CAMBIOS_INVENTARIO_SECURE_API.md` - Documentación completa de la API
- `docs/CAMBIOS_INVENTARIO_API_IMPLEMENTATION_SUMMARY.md` - Resumen de implementación

## ✅ Cambios Completados

### 1. Campo `usuario_email` Eliminado
- ✅ Removido de la tabla SQL
- ✅ Removido de todos los tipos TypeScript
- ✅ Removido de las funciones de utilidad
- ✅ Actualizado para usar solo `usuario_id` (UUID)
- ✅ Ejemplos SQL actualizados para hacer JOIN con `auth.users` cuando se necesite el email

### 2. Estructura Final de la Tabla

```sql
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
```

### 3. Campos de la Tabla

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único del registro de cambio |
| `id_mueble` | UUID | UUID del bien (permite JOIN con 3 tablas) |
| `tabla_origen` | TEXT | `muebles`, `mueblesitea` o `mueblestlaxcala` |
| `campo_modificado` | TEXT | Nombre técnico del campo modificado |
| `valor_anterior` | TEXT | Valor antes del cambio |
| `valor_nuevo` | TEXT | Valor después del cambio |
| `usuario_id` | UUID | UUID del usuario (FK a auth.users) |
| `fecha_cambio` | TIMESTAMPTZ | Timestamp automático |
| `metadata` | JSONB | Info adicional (campo_display, razon_cambio, etc.) |

### 4. Archivos Actualizados

#### Tipos
- ✅ `src/types/changeHistory.ts` - Sin `usuario_email`
- ✅ `src/types/indexation.ts` - Tipos de Mueble con `usuario_id` en historial

#### Utilidades
- ✅ `src/lib/changeHistory.ts` - Funciones sin `usuario_email`
- ✅ `src/components/consultas/inea/hooks/useItemEdit.ts` - Registro sin email

#### SQL
- ✅ `docs/CAMBIOS_INVENTARIO_TABLE.sql` - Script final sin `usuario_email`

## 🚀 Pasos para Probar

### Paso 1: Ejecutar el SQL en Supabase

1. Abrir Supabase SQL Editor
2. Copiar y ejecutar el contenido de `docs/CAMBIOS_INVENTARIO_TABLE.sql`
3. Verificar que la tabla se creó correctamente:
   ```sql
   SELECT * FROM cambios_inventario LIMIT 1;
   ```

### Paso 2: Hacer un Cambio en INEA

1. Ir a Consultas INEA
2. Seleccionar un bien
3. Hacer clic en "Editar"
4. Cambiar algún campo (ej: descripción, valor, área, etc.)
5. Hacer clic en "Guardar"
6. En el modal de confirmación, ingresar un motivo del cambio
7. Confirmar

### Paso 3: Verificar el Registro

```sql
-- Ver el cambio registrado
SELECT 
  c.*,
  u.email as usuario_email
FROM cambios_inventario c
LEFT JOIN auth.users u ON c.usuario_id = u.id
ORDER BY c.fecha_cambio DESC
LIMIT 5;
```

Deberías ver:
- ✅ El UUID del bien en `id_mueble`
- ✅ `tabla_origen` = 'muebles'
- ✅ El campo modificado
- ✅ Valores anterior y nuevo
- ✅ Tu UUID de usuario en `usuario_id`
- ✅ El motivo en `metadata->>'razon_cambio'`

### Paso 4: Verificar el JOIN

```sql
-- Ver el cambio con información del bien
SELECT 
  c.campo_modificado,
  c.valor_anterior,
  c.valor_nuevo,
  c.metadata->>'razon_cambio' as motivo,
  m.id_inv,
  m.descripcion,
  u.email as usuario_email,
  c.fecha_cambio
FROM cambios_inventario c
JOIN muebles m ON c.id_mueble = m.id
LEFT JOIN auth.users u ON c.usuario_id = u.id
WHERE c.tabla_origen = 'muebles'
ORDER BY c.fecha_cambio DESC
LIMIT 5;
```

## 📊 Consultas Útiles

### Ver historial de un bien específico
```sql
SELECT 
  c.campo_modificado,
  c.valor_anterior,
  c.valor_nuevo,
  c.metadata->>'campo_display' as campo_legible,
  c.metadata->>'razon_cambio' as motivo,
  u.email as usuario,
  c.fecha_cambio
FROM cambios_inventario c
LEFT JOIN auth.users u ON c.usuario_id = u.id
WHERE c.id_mueble = 'UUID-DEL-BIEN'
ORDER BY c.fecha_cambio DESC;
```

### Ver cambios recientes de todos los módulos
```sql
SELECT 
  c.tabla_origen,
  c.campo_modificado,
  c.valor_anterior,
  c.valor_nuevo,
  u.email as usuario,
  c.fecha_cambio
FROM cambios_inventario c
LEFT JOIN auth.users u ON c.usuario_id = u.id
ORDER BY c.fecha_cambio DESC
LIMIT 20;
```

### Estadísticas por módulo
```sql
SELECT 
  tabla_origen,
  COUNT(*) as total_cambios,
  COUNT(DISTINCT usuario_id) as usuarios_unicos,
  MIN(fecha_cambio) as primer_cambio,
  MAX(fecha_cambio) as ultimo_cambio
FROM cambios_inventario
GROUP BY tabla_origen;
```

## 🔍 Qué Verificar

### ✅ Checklist de Pruebas

1. **Registro de Cambios**
   - [ ] Se registra el cambio en la tabla
   - [ ] El UUID del bien es correcto
   - [ ] La tabla_origen es correcta ('muebles')
   - [ ] Los valores anterior y nuevo son correctos
   - [ ] El usuario_id es tu UUID
   - [ ] El motivo está en metadata

2. **JOINs Funcionan**
   - [ ] JOIN con muebles funciona
   - [ ] JOIN con auth.users funciona
   - [ ] Se puede obtener el email del usuario

3. **Validaciones**
   - [ ] No se puede insertar con tabla_origen inválida
   - [ ] El CHECK constraint funciona
   - [ ] Las políticas RLS permiten ver/insertar

4. **Performance**
   - [ ] Los índices están creados
   - [ ] Las consultas son rápidas
   - [ ] No hay lag en la UI

## 🎯 Próximos Pasos (Después de Probar)

1. **Actualizar Hooks de Indexación** (según guía en `CAMBIOS_INVENTARIO_INTEGRATION_GUIDE.md`)
   - `src/hooks/indexation/useIneaIndexation.ts`
   - `src/hooks/indexation/useIteaIndexation.ts`
   - `src/hooks/indexation/useNoListadoIndexation.ts`

2. **Crear Componente UI** (opcional)
   - Mostrar historial en el DetailPanel
   - Timeline de cambios
   - Filtros por usuario/fecha

3. **Replicar en ITEA y No Listado**
   - Actualizar hooks de useItemEdit
   - Cambiar `tabla_origen` a 'mueblesitea' y 'mueblestlaxcala'
   - Probar registro de cambios

## 📝 Notas Importantes

- **Email del Usuario**: Se obtiene haciendo JOIN con `auth.users` cuando se necesita
- **UUID del Bien**: Permite hacer JOIN con cualquiera de las 3 tablas
- **Tabla Origen**: Validada con CHECK constraint
- **No Bloqueante**: Si falla el registro de historial, no afecta la operación principal
- **Opcional**: El campo `cambios_inventario` en los tipos es opcional

## 🐛 Troubleshooting

### Error: "relation cambios_inventario does not exist"
- Ejecutar el SQL en Supabase

### Error: "new row violates check constraint"
- Verificar que `tabla_origen` sea 'muebles', 'mueblesitea' o 'mueblestlaxcala'

### No se registran cambios
- Verificar que el usuario esté autenticado
- Verificar que haya cambios detectados
- Verificar que se proporcione un motivo del cambio
- Revisar la consola del navegador para errores

### Los JOINs no funcionan
- Verificar que los índices estén creados
- Verificar que el UUID del bien sea correcto
- Verificar que la tabla_origen coincida con la tabla real

## ✨ Conclusión

El sistema está listo para probar. Una vez que ejecutes el SQL y hagas un cambio en INEA, deberías ver el registro en la tabla `cambios_inventario`. Si todo funciona correctamente, puedes proceder a actualizar los hooks de indexación para que el historial se cargue automáticamente con cada bien.

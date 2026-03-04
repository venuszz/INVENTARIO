# Implementación del Esquema de Historial de Cambios - INEA

## Fecha
3 de marzo de 2026

## Resumen
Se ha implementado el sistema de historial de cambios para el módulo INEA siguiendo el esquema recomendado. Este sistema permite rastrear todos los cambios realizados en los registros de inventario con información completa de auditoría.

## Archivos Creados

### 1. `src/types/changeHistory.ts`
Define los tipos TypeScript para el sistema de historial:
- `TablaOrigen`: Tipo para identificar la tabla de origen
- `TipoCambio`: Tipo de cambio (edición, creación, eliminación)
- `CambioInventario`: Estructura completa de un registro de cambio
- `ChangeHistoryEntry`: Entrada individual de cambio
- `RegistrarCambiosParams`: Parámetros para registrar cambios

### 2. `src/lib/changeHistory.ts`
Utilidades centralizadas para gestionar el historial:
- `registrarCambios()`: Registra cambios en la base de datos
- `obtenerHistorialCambios()`: Recupera el historial de un item
- `obtenerResumenCambios()`: Obtiene un resumen de cambios
- `formatearCambio()`: Formatea un cambio para visualización

### 3. `docs/CAMBIOS_INVENTARIO_TABLE.sql`
Script SQL completo para crear la tabla en Supabase con:
- Definición de tabla con todos los campos
- Índices optimizados
- Políticas RLS
- Comentarios en columnas
- Ejemplos de consultas útiles

## Archivos Modificados

### `src/components/consultas/inea/hooks/useItemEdit.ts`
Se integró el nuevo sistema de historial:
- Importación de las nuevas utilidades
- Reemplazo del sistema temporal por el sistema definitivo
- Registro automático de cambios al confirmar ediciones
- Manejo de errores sin bloquear la operación principal

## Esquema de Base de Datos Requerido

```sql
-- Tabla para almacenar el historial de cambios
CREATE TABLE cambios_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_inventario TEXT NOT NULL,
  tabla_origen TEXT NOT NULL,
  campo_modificado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  usuario_email TEXT,
  fecha_cambio TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_cambios_id_inventario ON cambios_inventario(id_inventario);
CREATE INDEX idx_cambios_tabla_origen ON cambios_inventario(tabla_origen);
CREATE INDEX idx_cambios_fecha ON cambios_inventario(fecha_cambio DESC);
CREATE INDEX idx_cambios_usuario ON cambios_inventario(usuario_id);

-- RLS policies
ALTER TABLE cambios_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios autenticados pueden ver el historial"
  ON cambios_inventario FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Los usuarios autenticados pueden insertar cambios"
  ON cambios_inventario FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);
```

## Flujo de Funcionamiento

### 1. Detección de Cambios
Cuando el usuario edita un registro y hace clic en "Guardar":
1. Se detectan los cambios usando `detectChanges()` (sistema existente)
2. Se muestra el modal de confirmación con los cambios detectados
3. El usuario debe proporcionar un motivo del cambio

### 2. Confirmación y Guardado
Al confirmar en el `ChangeConfirmationModal`:
1. Se valida que exista un motivo del cambio
2. Se guardan los cambios en la tabla principal (`muebles`)
3. Se registran los cambios en `cambios_inventario` usando `registrarCambios()`
4. Se incluye el motivo del cambio en el campo `metadata.razon_cambio`

### 3. Estructura de Datos Guardados
Cada cambio se guarda con:
- `id_inventario`: ID del bien modificado
- `tabla_origen`: 'inea' (identificador del módulo)
- `campo_modificado`: Nombre técnico del campo
- `valor_anterior`: Valor antes del cambio
- `valor_nuevo`: Valor después del cambio
- `usuario_id`: UUID del usuario que hizo el cambio
- `usuario_email`: Email del usuario
- `fecha_cambio`: Timestamp automático
- `metadata`: JSON con información adicional:
  - `campo_display`: Nombre legible del campo
  - `tipo_cambio`: 'edicion'
  - `razon_cambio`: Motivo proporcionado por el usuario

## Ventajas del Esquema

1. **Centralizado**: Una sola tabla para todos los módulos
2. **Auditable**: Registro completo de quién, cuándo y por qué
3. **Flexible**: Campo metadata permite extensiones futuras
4. **Eficiente**: Índices optimizados para consultas comunes
5. **Escalable**: Puede manejar millones de registros
6. **No bloqueante**: Si falla el registro de historial, no bloquea la operación principal

## Próximos Pasos

### Implementación en Otros Módulos
Este mismo esquema se puede aplicar a:
- ITEA General (`tabla_origen: 'itea'`)
- ITEA Obsoletos (`tabla_origen: 'itea_obsoletos'`)
- INEA Obsoletos (`tabla_origen: 'inea_obsoletos'`)
- No Listado (`tabla_origen: 'no_listado'`)
- Levantamiento (`tabla_origen: 'levantamiento'`)

### Funcionalidades Adicionales
1. **Visualización de Historial**: Crear un componente para mostrar el historial de cambios de un item
2. **Filtros de Auditoría**: Permitir filtrar cambios por usuario, fecha, campo, etc.
3. **Exportación**: Generar reportes de auditoría en Excel/PDF
4. **Notificaciones**: Alertar sobre cambios críticos
5. **Reversión**: Permitir revertir cambios (con precaución)

## Ejemplo de Uso

```typescript
// Registrar cambios manualmente
await registrarCambios({
  idInventario: 'INEA-001',
  tablaOrigen: 'inea',
  cambios: [
    {
      campo: 'valor',
      valorAnterior: '1000',
      valorNuevo: '1500',
      campoDisplay: 'Valor'
    }
  ],
  usuarioEmail: 'usuario@ejemplo.com',
  razonCambio: 'Actualización de valuación'
});

// Obtener historial
const historial = await obtenerHistorialCambios('INEA-001', 'inea');

// Obtener resumen
const resumen = await obtenerResumenCambios('INEA-001');
console.log(`Total de cambios: ${resumen.totalCambios}`);
console.log(`Último cambio: ${resumen.ultimoCambio?.fecha_cambio}`);
```

## Notas Técnicas

- El sistema usa el cliente de Supabase para autenticación automática
- Los errores en el registro de historial se logean pero no bloquean la operación
- El campo `metadata` es JSONB para máxima flexibilidad
- Las políticas RLS aseguran que solo usuarios autenticados puedan acceder

## Testing Requerido

Antes de usar en producción, verificar:
1. ⏳ Ejecutar el script `docs/CAMBIOS_INVENTARIO_TABLE.sql` en Supabase
2. ⏳ Verificar que la tabla se creó correctamente
3. ⏳ Verificar que las políticas RLS funcionan
4. ⏳ Verificar que los índices se crearon
5. ⏳ Pruebas de registro de cambios
6. ⏳ Pruebas de consulta de historial
7. ⏳ Pruebas de rendimiento con volumen alto
8. ⏳ Validación de permisos RLS

## Errores Corregidos

### Error 1: Import de Supabase
**Error**: `Module '"@/app/lib/supabase/client"' has no exported member 'supabase'`
**Solución**: Cambiar de `import { supabase }` a `import supabase` (default export)

### Error 2: Propiedad fieldDisplay
**Error**: `Property 'fieldDisplay' does not exist on type 'Change'`
**Solución**: El tipo `Change` usa `label` en lugar de `fieldDisplay`. Se corrigió el mapeo en useItemEdit.ts

### Error 3: Sintaxis SQL de índices
**Error**: `syntax error at or near "DESC" LINE 17: INDEX idx_cambios_fecha (fecha_cambio DESC)`
**Solución**: En PostgreSQL, los índices se crean con `CREATE INDEX` separado, no dentro de la definición de tabla. Se creó el archivo SQL correcto en `docs/CAMBIOS_INVENTARIO_TABLE.sql`

## Conclusión

El sistema de historial de cambios está implementado y listo para usar en el módulo INEA. Una vez creada la tabla en la base de datos, el sistema comenzará a registrar automáticamente todos los cambios realizados a través del `ChangeConfirmationModal`.

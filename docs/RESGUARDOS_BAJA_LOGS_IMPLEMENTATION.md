# Resguardos Baja - Implementación de Logs Exhaustivos

## Resumen

Se agregaron logs exhaustivos a todo el proceso de baja de resguardos para facilitar el debugging y seguimiento del flujo completo. Los logs siguen el mismo patrón utilizado en el proceso de creación de resguardos.

## Archivos Modificados

### 1. `src/components/resguardos/consultar/hooks/useResguardoDelete.ts`

Se agregaron logs detallados en todas las funciones:

#### `moveToResguardosBajas`
- Log de inicio con parámetros completos
- Log de preparación de cada artículo
- Log de inserción batch en `resguardos_bajas`
- Log de éxito con cantidad de registros insertados
- Logs de error con detalles completos

#### `deleteArticulo` (Eliminar un artículo)
- 🚀 Log de inicio con todos los parámetros
- 🔢 Log de generación de folio de baja
- 📝 Log de obtención de firmas
- 📦 Log de movimiento a resguardos_bajas
- 📄 Log de preparación de PDF data
- 🗑️ Log de eliminación del registro de resguardos
- 🧹 Log de limpieza de campos en tabla de muebles
- ✅ Log de éxito
- ❌ Logs de error con stack trace completo

#### `deleteSelected` (Eliminar artículos seleccionados)
- Misma estructura de logs que `deleteArticulo`
- Logs adicionales para cada artículo en el loop de eliminación
- Log de progreso: "Eliminando artículo X de Y"

#### `deleteAll` (Eliminar resguardo completo)
- Misma estructura de logs que `deleteSelected`
- Log específico para eliminación por folio (no por ID individual)

### 2. `src/components/resguardos/consultar/utils.ts`

#### `limpiarDatosArticulo`
- 🧹 Log de inicio con parámetros (id_inv, origen)
- 📊 Log de tabla determinada según origen
- 🔄 Log de actualización con id_inv
- ✅ Log de éxito con datos actualizados
- ❌ Logs de error con detalles completos de Supabase (code, message, details, hint)

### 3. `src/app/api/folios/generate/route.ts`

#### `POST /api/folios/generate`
- 🚀 Log de inicio de request
- 🔐 Log de verificación de autenticación
- 📋 Log de tipo de folio solicitado
- 🔢 Log de llamada a función PostgreSQL
- ✅ Log de folio generado exitosamente
- ❌ Logs de error con detalles completos

## Formato de Logs

Los logs utilizan emojis para facilitar la identificación visual:

- 🚀 Inicio de proceso
- 📋 Parámetros/datos de entrada
- 🔢 Generación de folio
- 📝 Obtención de firmas
- 📦 Movimiento de datos
- 📄 Preparación de PDF
- 🗑️ Eliminación de registros
- 🧹 Limpieza de campos
- ✅ Operación exitosa
- ❌ Error
- 📊 Detalles adicionales
- 🔐 Autenticación
- 🔄 Actualización
- 🏁 Finalización

## Estructura de Logs de Error

Todos los errores incluyen:
```typescript
console.error('❌ [CONTEXTO] ERROR CRÍTICO:', err);
console.error('📊 [CONTEXTO] Detalles del error:', {
  message: err instanceof Error ? err.message : 'Error desconocido',
  stack: err instanceof Error ? err.stack : undefined,
  error: err
});
```

Para errores de Supabase:
```typescript
console.error('📊 [CONTEXTO] Detalles del error:', {
  code: error.code,
  message: error.message,
  details: error.details,
  hint: error.hint
});
```

## Flujo Completo de Logs

### Ejemplo: Eliminar un artículo

```
🚀 [BAJA] Iniciando deleteArticulo
📋 [BAJA] Parámetros: { articulo: {...}, folio, fecha, ... }
🔢 [BAJA] Generando folio de baja...
🚀 [API FOLIOS] Iniciando POST /api/folios/generate
🔐 [API FOLIOS] Verificando autenticación: { hasToken: true }
📋 [API FOLIOS] Tipo de folio solicitado: BAJA
🔢 [API FOLIOS] Llamando a generar_folio con tipo: BAJA
✅ [API FOLIOS] Folio generado exitosamente: BAJA-0001
✅ [BAJA] Folio generado: BAJA-0001
📝 [BAJA] Obteniendo firmas...
✅ [BAJA] Firmas obtenidas: 3
📦 [BAJA] Moviendo registro a resguardos_bajas...
📦 [BAJA] Iniciando moveToResguardosBajas
📋 [BAJA] Parámetros: { articulosCount: 1, folioResguardo, folioBaja, ... }
📦 [BAJA] Preparando artículo 1/1: { num_inventario, descripcion, origen }
➕ [BAJA] Insertando 1 registros en resguardos_bajas...
✅ [BAJA] Registros insertados exitosamente: 1
✅ [BAJA] Registro movido exitosamente
📄 [BAJA] Preparando datos para PDF...
✅ [BAJA] PDF data preparado: { folioBaja, folioOriginal, ... }
🗑️ [BAJA] Eliminando registro de resguardos (id: 123)...
✅ [BAJA] Registro eliminado de resguardos
🧹 [BAJA] Limpiando id_area e id_directorio en tabla de muebles...
🧹 [LIMPIAR] Iniciando limpiarDatosArticulo
📋 [LIMPIAR] Parámetros: { id_inv: 'INV-001', origen: 'INEA' }
📊 [LIMPIAR] Tabla determinada: inea
🔄 [LIMPIAR] Actualizando registro con id_inv: INV-001
✅ [LIMPIAR] Registro actualizado exitosamente
📦 [LIMPIAR] Datos actualizados: [...]
✅ [BAJA] Campos limpiados exitosamente
✅ [BAJA] Proceso completado exitosamente
🏁 [BAJA] deleteArticulo finalizado
```

## Beneficios

1. **Debugging facilitado**: Cada paso del proceso está documentado
2. **Identificación rápida de errores**: Los logs muestran exactamente dónde falla el proceso
3. **Trazabilidad completa**: Se puede seguir el flujo completo de una operación
4. **Consistencia**: Mismo patrón de logs que el proceso de creación de resguardos
5. **Información detallada**: Todos los parámetros y resultados están logueados

## Próximos Pasos

Con estos logs implementados, ahora es posible:

1. Abrir la consola del navegador
2. Ejecutar una operación de baja
3. Ver el flujo completo paso a paso
4. Identificar exactamente dónde está fallando el proceso
5. Ver los datos exactos que se están enviando/recibiendo

## Notas Importantes

- Los logs están en español para mantener consistencia con el resto del código
- Se usa el prefijo `[BAJA]`, `[LIMPIAR]`, `[API FOLIOS]` para identificar el contexto
- Los logs de error incluyen stack traces completos para debugging
- Los logs de Supabase incluyen todos los campos de error disponibles

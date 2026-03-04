# INEA Field History - API Fix

## Problema Identificado

El historial de cambios no se estaba recuperando correctamente porque la función `obtenerHistorialCambios` usaba el cliente de Supabase directamente, lo cual estaba siendo bloqueado por las políticas RLS (Row Level Security) de la tabla `cambios_inventario`.

### Evidencia del Problema

```
✅ [obtenerHistorialCambios] Success: {recordCount: 0, data: Array(0)}
```

A pesar de que existen registros en la base de datos para el bien con UUID `54884809-7142-471b-bebf-6b402a559c64`, la consulta devolvía 0 resultados.

## Solución Implementada

### 1. Nueva API Endpoint

Creado: `src/app/api/cambios-inventario/[id]/route.ts`

Esta API:
- Usa el `SUPABASE_SERVICE_ROLE_KEY` para bypass RLS
- Acepta el ID del mueble como parámetro de ruta
- Acepta parámetros de query opcionales:
  - `tabla_origen`: Filtrar por tabla de origen (ej: 'muebles')
  - `limit`: Límite de resultados (default: 50)

**Ejemplo de uso:**
```
GET /api/cambios-inventario/54884809-7142-471b-bebf-6b402a559c64?tabla_origen=muebles&limit=50
```

**Respuesta:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "id_mueble": "54884809-7142-471b-bebf-6b402a559c64",
      "tabla_origen": "muebles",
      "campo_modificado": "valor",
      "valor_anterior": "1000.00",
      "valor_nuevo": "1500.00",
      "motivo_cambio": "Actualización de precio",
      "usuario_id": "...",
      "fecha_cambio": "2026-03-03T10:30:00Z",
      "metadata": {}
    },
    ...
  ]
}
```

### 2. Actualización de `obtenerHistorialCambios`

Modificado: `src/lib/changeHistory.ts`

La función ahora:
- Usa la nueva API endpoint en lugar del cliente directo de Supabase
- Mantiene la misma interfaz pública (no breaking changes)
- Maneja errores de forma robusta
- Incluye logs de debug mejorados

**Antes:**
```typescript
let query = supabase
  .from('cambios_inventario')
  .select('*')
  .eq('id_mueble', idMueble)
  // ... (bloqueado por RLS)
```

**Después:**
```typescript
const response = await fetch(`/api/cambios-inventario/${idMueble}?...`, {
  method: 'GET',
  credentials: 'include',
});
// ... (usa service role key, bypass RLS)
```

## Cómo Funciona

### Flujo de Registro de Cambios (Ya existente)

1. Usuario edita un bien en INEA
2. `useItemEdit.ts` detecta cambios con `detectChanges()`
3. Usuario proporciona motivo del cambio
4. `registrarCambios()` llama a `POST /api/cambios-inventario`
5. API usa service role key para insertar en `cambios_inventario`
6. Cambios se guardan exitosamente

### Flujo de Recuperación de Historial (NUEVO)

1. Usuario selecciona un bien en INEA
2. `useFieldHistory` hook se ejecuta
3. Llama a `obtenerHistorialCambios(idMueble, 'muebles')`
4. Función hace fetch a `GET /api/cambios-inventario/[id]`
5. API usa service role key para consultar `cambios_inventario`
6. Datos se devuelven y se agrupan por campo
7. Íconos de historial aparecen en campos con cambios

## Ventajas de Esta Solución

1. **Consistencia**: Tanto escritura como lectura usan APIs con service role key
2. **Seguridad**: No expone el service role key al cliente
3. **Escalabilidad**: Fácil agregar filtros, paginación, etc.
4. **Debugging**: Logs centralizados en el servidor
5. **Mantenibilidad**: Lógica de acceso a datos en un solo lugar

## Testing

Para verificar que funciona:

1. **Verificar que existen registros:**
   ```sql
   SELECT * FROM cambios_inventario 
   WHERE id_mueble = '54884809-7142-471b-bebf-6b402a559c64';
   ```

2. **Probar la API directamente:**
   ```bash
   curl http://localhost:3000/api/cambios-inventario/54884809-7142-471b-bebf-6b402a559c64?tabla_origen=muebles
   ```

3. **Verificar en la UI:**
   - Abrir INEA General Inventory
   - Seleccionar el bien con UUID `54884809-7142-471b-bebf-6b402a559c64`
   - Verificar que aparecen íconos de historial (🕐)
   - Hover sobre los íconos para ver el popover con cambios

## Logs Esperados

Después del fix, deberías ver:

```
🔍 [obtenerHistorialCambios] Starting API query: {idMueble: '...', tablaOrigen: 'muebles', limit: 50}
✅ [API] Retrieved 5 change records for item ...
✅ [obtenerHistorialCambios] Success: {recordCount: 5, data: Array(5)}
✅ [useFieldHistory] Received history: {idMueble: '...', totalRecords: 5, records: Array(5)}
📊 [useFieldHistory] Grouped by field: {fields: Array(3), counts: {valor: 2, descripcion: 2, estado: 1}}
```

## Archivos Modificados

1. **Nuevo:** `src/app/api/cambios-inventario/[id]/route.ts`
   - API endpoint para obtener historial
   - Usa service role key

2. **Modificado:** `src/lib/changeHistory.ts`
   - `obtenerHistorialCambios()` ahora usa la API
   - Removida importación de supabase client

## Variables de Entorno Requeridas

Asegúrate de tener en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Próximos Pasos

1. ✅ API endpoint creada
2. ✅ Función actualizada para usar API
3. ⏳ Probar con datos reales
4. ⏳ Verificar que los íconos aparecen
5. ⏳ Verificar que los popovers muestran datos correctos
6. ⏳ Remover logs de debug (opcional)

---

**Fecha de Implementación:** March 3, 2026
**Estado:** ✅ LISTO PARA PROBAR

# Guía de Integración del Historial de Cambios en Hooks de Indexación

## Fecha
3 de marzo de 2026

## ⚠️ ACTUALIZACIÓN IMPORTANTE: API Segura Implementada

**Fecha**: 3 de marzo de 2026

El sistema ahora usa una API de servidor segura (`/api/cambios-inventario`) con service role key para evitar errores de RLS. Ver `docs/CAMBIOS_INVENTARIO_SECURE_API.md` para detalles.

**Cambios**:
- ✅ API route creada: `src/app/api/cambios-inventario/route.ts`
- ✅ `registrarCambios()` actualizado para usar la API
- ✅ Bypass de RLS de forma segura
- ✅ Validación centralizada en el servidor

## Resumen de Cambios Realizados

### 1. Tipos Actualizados
- ✅ `src/types/changeHistory.ts` - Cambiado de `id_inventario` a `id_mueble` (UUID)
- ✅ `src/types/changeHistory.ts` - Tablas de origen: `muebles`, `mueblesitea`, `mueblestlaxcala`
- ✅ `src/types/indexation.ts` - Agregado campo `cambios_inventario` a `MuebleINEA`, `MuebleITEA`, `MuebleNoListado`
- ✅ `src/lib/changeHistory.ts` - Actualizado para usar `id_mueble` y nuevas tablas
- ✅ `src/components/consultas/inea/hooks/useItemEdit.ts` - Actualizado para usar `tabla_origen: 'muebles'`
- ✅ `docs/CAMBIOS_INVENTARIO_TABLE.sql` - SQL actualizado con UUID y CHECK constraint

### 2. Cambios Pendientes en Hooks de Indexación

Los siguientes hooks necesitan ser actualizados para incluir el historial de cambios en el SELECT:

#### A. `src/hooks/indexation/useIneaIndexation.ts`

**Ubicaciones a modificar:**

1. **Función `indexData` - Fetch inicial (línea ~570)**
   ```typescript
   // ANTES:
   const { data, error } = await supabase
     .from(TABLE)
     .select(`
       *,
       area:id_area(id_area, nombre),
       directorio:id_directorio(id_directorio, nombre, puesto),
       config_estatus:config!id_estatus(id, concepto)
     `)
   
   // DESPUÉS:
   const { data, error } = await supabase
     .from(TABLE)
     .select(`
       *,
       area:id_area(id_area, nombre),
       directorio:id_directorio(id_directorio, nombre, puesto),
       config_estatus:config!id_estatus(id, concepto),
       cambios_inventario!id_mueble(
         id,
         campo_modificado,
         valor_anterior,
         valor_nuevo,
         usuario_email,
         fecha_cambio,
         metadata
       )
     `)
     .eq('cambios_inventario.tabla_origen', 'muebles')
     .order('fecha_cambio', { foreignTable: 'cambios_inventario', ascending: false })
     .limit(10, { foreignTable: 'cambios_inventario' })
   ```

2. **Función `processBatchUpdates` - Actualización por lotes (línea ~110)**
   - Mismo cambio en el SELECT

3. **Función `setupRealtimeSubscription` - INSERT event (línea ~260)**
   - Mismo cambio en el SELECT

4. **Función `setupRealtimeSubscription` - UPDATE event (línea ~300)**
   - Mismo cambio en el SELECT

5. **Función `setupRealtimeSubscription` - Resguardos change (línea ~470)**
   - Mismo cambio en el SELECT

#### B. `src/hooks/indexation/useIteaIndexation.ts`

**Ubicaciones a modificar:**

1. **Función `indexData` - Fetch inicial**
   ```typescript
   // DESPUÉS:
   const { data, error } = await supabase
     .from(TABLE)
     .select(`
       *,
       area:id_area(id_area, nombre),
       directorio:id_directorio(id_directorio, nombre, puesto),
       config_estatus:config!id_estatus(id, concepto),
       cambios_inventario!id_mueble(
         id,
         campo_modificado,
         valor_anterior,
         valor_nuevo,
         usuario_email,
         fecha_cambio,
         metadata
       )
     `)
     .eq('cambios_inventario.tabla_origen', 'mueblesitea')
     .order('fecha_cambio', { foreignTable: 'cambios_inventario', ascending: false })
     .limit(10, { foreignTable: 'cambios_inventario' })
   ```

2. **Función `processBatchUpdates`** - Mismo cambio
3. **Función `setupRealtimeSubscription` - INSERT** - Mismo cambio
4. **Función `setupRealtimeSubscription` - UPDATE** - Mismo cambio
5. **Función `setupRealtimeSubscription` - Resguardos change** - Mismo cambio

#### C. `src/hooks/indexation/useNoListadoIndexation.ts`

**Ubicaciones a modificar:**

1. **Función `indexData` - Fetch inicial**
   ```typescript
   // DESPUÉS:
   const { data, error } = await supabase
     .from(TABLE)
     .select(`
       *,
       area:id_area(id_area, nombre),
       directorio:id_directorio(id_directorio, nombre, puesto),
       config_estatus:config!id_estatus(id, concepto),
       cambios_inventario!id_mueble(
         id,
         campo_modificado,
         valor_anterior,
         valor_nuevo,
         usuario_email,
         fecha_cambio,
         metadata
       )
     `)
     .eq('cambios_inventario.tabla_origen', 'mueblestlaxcala')
     .order('fecha_cambio', { foreignTable: 'cambios_inventario', ascending: false })
     .limit(10, { foreignTable: 'cambios_inventario' })
   ```

2. **Función `processBatchUpdates`** - Mismo cambio
3. **Función `setupRealtimeSubscription` - INSERT** - Mismo cambio
4. **Función `setupRealtimeSubscription` - UPDATE** - Mismo cambio

### 3. Explicación del SELECT con JOIN

El nuevo SELECT hace lo siguiente:

1. **Trae todos los campos del mueble** (`*`)
2. **Hace JOIN con tablas relacionales** (area, directorio, config_estatus)
3. **Hace JOIN con cambios_inventario** usando el UUID del mueble
4. **Filtra por tabla_origen** para traer solo los cambios de esa tabla específica
5. **Ordena por fecha** descendente (más recientes primero)
6. **Limita a 10 registros** para no sobrecargar (ajustable según necesidad)

### 4. Ventajas de este Enfoque

1. **Una sola consulta**: No necesitas hacer fetch adicional del historial
2. **Datos siempre actualizados**: El historial viene con cada fetch
3. **Eficiente**: Supabase optimiza el JOIN automáticamente
4. **Consistente**: Mismo patrón que colores en ITEA
5. **Escalable**: El límite de 10 registros mantiene el payload pequeño

### 5. Consideraciones

- **Límite de registros**: Actualmente 10, ajustar según necesidad
- **Performance**: El JOIN es eficiente gracias a los índices en `cambios_inventario`
- **Opcional**: El campo `cambios_inventario` es opcional (`?`) en los tipos
- **Realtime**: Los cambios en `cambios_inventario` NO disparan eventos realtime en los muebles (esto es intencional)

### 6. Uso en Componentes

Una vez implementado, puedes acceder al historial así:

```typescript
// En cualquier componente que use el store
const mueble = useIneaStore(state => 
  state.muebles.find(m => m.id === selectedId)
);

// Acceder al historial
const historial = mueble?.cambios_inventario || [];

// Mostrar en UI
{historial.map(cambio => (
  <div key={cambio.id}>
    <p>{cambio.campo_modificado}: {cambio.valor_anterior} → {cambio.valor_nuevo}</p>
    <small>{cambio.usuario_email} - {new Date(cambio.fecha_cambio).toLocaleString()}</small>
  </div>
))}
```

### 7. Testing

Después de implementar los cambios:

1. ✅ Verificar que la tabla `cambios_inventario` existe
2. ⏳ Hacer un cambio en un mueble INEA
3. ⏳ Verificar que se registra en `cambios_inventario`
4. ⏳ Recargar la página y verificar que el historial aparece en el mueble
5. ⏳ Repetir para ITEA y No Listado

### 8. Próximos Pasos

1. Ejecutar el SQL en Supabase (`docs/CAMBIOS_INVENTARIO_TABLE.sql`)
2. Actualizar los 3 hooks de indexación con los cambios del SELECT
3. Probar que el historial se carga correctamente
4. Crear componente UI para mostrar el historial (opcional)
5. Replicar en ITEA y No Listado

## Notas Finales

- El sistema está diseñado para ser no bloqueante: si falla el registro de historial, no afecta la operación principal
- Los cambios son retrocompatibles: si no hay historial, el campo será `null` o array vacío
- El patrón es consistente con cómo ITEA maneja los colores

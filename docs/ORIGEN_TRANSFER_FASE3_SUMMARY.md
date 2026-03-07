# Transferencia de Origen - Fase 3: Integración en Tablas

**Fecha:** 2026-03-05  
**Status:** ✅ COMPLETADA  
**Fase:** 3 de 7

## Resumen Ejecutivo

Se completó exitosamente la integración del componente `OrigenBadge` en las 5 tablas de inventario del sistema. Cada tabla ahora muestra una columna "Origen" con un badge interactivo que permite a los administradores transferir registros entre las diferentes tablas (INEA, ITEA, No Listado).

## Tablas Integradas

### 1. INEA General ✅
**Archivo:** `src/components/consultas/inea/components/InventoryTable.tsx`

**Cambios realizados:**
- Importado `OrigenBadge` component
- Agregada columna "Origen" después de "ID Inventario"
- Actualizado colSpan de 6→7 en estados de loading, error y empty
- Implementado `OrigenBadge` con:
  - `currentOrigen="inea"`
  - `hasActiveResguardo={!!item.folio}` (deshabilita si hay resguardo activo)
  - `onClick={(e) => e.stopPropagation()` para prevenir selección de fila
  - Callback `onTransferSuccess` que ejecuta refetch

### 2. ITEA General ✅
**Archivo:** `src/components/consultas/itea/components/InventoryTable.tsx`

**Cambios realizados:**
- Importado `OrigenBadge` component
- Agregada columna "Origen" después de "ID Inventario"
- Actualizado colSpan de 6→7 en estados de loading, error y empty
- Implementado `OrigenBadge` con:
  - `currentOrigen="itea"`
  - `hasActiveResguardo={!!item.folio}` (deshabilita si hay resguardo activo)
  - `onClick={(e) => e.stopPropagation()` para prevenir selección de fila
  - Callback `onTransferSuccess` que ejecuta refetch

### 3. No Listado ✅
**Archivo:** `src/components/consultas/no-listado/components/InventoryTable.tsx`

**Cambios realizados:**
- Importado `OrigenBadge` component
- Agregada columna "Origen" después de "ID Inventario"
- Actualizado colSpan de 6→7 en estados de loading, error y empty
- Implementado `OrigenBadge` con:
  - `currentOrigen="no-listado"`
  - `hasActiveResguardo={!!item.folio}` (deshabilita si hay resguardo activo)
  - `onClick={(e) => e.stopPropagation()` para prevenir selección de fila
  - Callback `onTransferSuccess` que ejecuta refetch

### 4. INEA Obsoletos ✅
**Archivo:** `src/components/consultas/inea/obsoletos/components/InventoryTable.tsx`

**Cambios realizados:**
- Importado `OrigenBadge` component
- Agregada columna "Origen" después de "ID Inventario"
- Actualizado colSpan de 5→6 en estados de loading, error y empty
- Implementado `OrigenBadge` con:
  - `currentOrigen="inea"`
  - `disabled={false}` (obsoletos no tienen folios, siempre habilitado)
  - `onClick={(e) => e.stopPropagation()` para prevenir selección de fila
  - Callback `onTransferSuccess` que ejecuta refetch

### 5. ITEA Obsoletos ✅
**Archivo:** `src/components/consultas/itea/obsoletos/components/InventoryTable.tsx`

**Cambios realizados:**
- Importado `OrigenBadge` component
- Agregada columna "Origen" después de "ID Inventario"
- Actualizado colSpan de 5→6 en estados de loading, error y empty
- Implementado `OrigenBadge` con:
  - `currentOrigen="itea"`
  - `disabled={false}` (obsoletos no tienen folios, siempre habilitado)
  - `onClick={(e) => e.stopPropagation()` para prevenir selección de fila
  - Callback `onTransferSuccess` que ejecuta refetch
  - **Null check:** `{item.id_inv && <OrigenBadge ... />}` para manejar casos donde id_inv es null

## Patrones de Implementación

### Estructura de Columna
```tsx
<th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
  isDarkMode ? 'text-white/60' : 'text-black/60'
}`}>
  Origen
</th>
```

### Celda con OrigenBadge (Tablas Generales)
```tsx
<td className="px-4 py-4 align-top text-sm" onClick={(e) => e.stopPropagation()}>
  <OrigenBadge
    currentOrigen="inea" // o "itea" o "no-listado"
    idInventario={item.id_inv}
    recordId={item.id}
    onTransferSuccess={() => {
      if (onRefetch) {
        onRefetch();
      }
    }}
    hasActiveResguardo={!!item.folio}
  />
</td>
```

### Celda con OrigenBadge (Tablas Obsoletos)
```tsx
<td className="px-4 py-4 align-top text-sm" onClick={(e) => e.stopPropagation()}>
  {item.id_inv && (
    <OrigenBadge
      currentOrigen="inea" // o "itea"
      idInventario={item.id_inv}
      recordId={item.id}
      onTransferSuccess={() => {
        if (onRefetch) {
          onRefetch();
        }
      }}
      disabled={false}
    />
  )}
</td>
```

## Diferencias entre Tablas Generales y Obsoletos

| Aspecto | Tablas Generales | Tablas Obsoletos |
|---------|------------------|------------------|
| **Prop hasActiveResguardo** | `{!!item.folio}` | No se usa |
| **Prop disabled** | No se usa | `{false}` |
| **Null check id_inv** | No necesario | Necesario (ITEA) |
| **Columnas totales** | 7 | 6 |
| **ColSpan original** | 6 | 5 |

## Validaciones Implementadas

### Frontend
1. **Prevención de selección de fila:** `onClick={(e) => e.stopPropagation()` en celda
2. **Deshabilitar si hay resguardo activo:** `hasActiveResguardo={!!item.folio}` (solo tablas generales)
3. **Null check para id_inv:** Condicional render en ITEA Obsoletos
4. **Callback de refetch:** Actualiza datos después de transferencia exitosa

### Props del OrigenBadge
- `currentOrigen`: Identifica la tabla actual ("inea" | "itea" | "no-listado")
- `idInventario`: ID del inventario a transferir
- `recordId`: UUID del registro en la base de datos
- `onTransferSuccess`: Callback ejecutado después de transferencia exitosa
- `hasActiveResguardo`: (Opcional) Deshabilita si hay resguardo activo
- `disabled`: (Opcional) Deshabilita el badge completamente

## Diagnósticos TypeScript

Todas las 5 tablas pasaron los diagnósticos sin errores:

```
✅ src/components/consultas/inea/components/InventoryTable.tsx: No diagnostics found
✅ src/components/consultas/itea/components/InventoryTable.tsx: No diagnostics found
✅ src/components/consultas/no-listado/components/InventoryTable.tsx: No diagnostics found
✅ src/components/consultas/inea/obsoletos/components/InventoryTable.tsx: No diagnostics found
✅ src/components/consultas/itea/obsoletos/components/InventoryTable.tsx: No diagnostics found
```

## Archivos Modificados

1. `src/components/consultas/inea/components/InventoryTable.tsx`
2. `src/components/consultas/itea/components/InventoryTable.tsx`
3. `src/components/consultas/no-listado/components/InventoryTable.tsx`
4. `src/components/consultas/inea/obsoletos/components/InventoryTable.tsx`
5. `src/components/consultas/itea/obsoletos/components/InventoryTable.tsx`
6. `.kiro/specs/origen-transfer-feature/tasks.md` (actualizado progreso)

## Próximos Pasos

### Fase 4: Actualización de Stores (Pendiente)
- Agregar métodos `removeItem(recordId)` en stores
- Actualizar contadores de registros
- Implementar decrementCount/incrementCount en indexationStore

### Testing Recomendado
1. Verificar que badge aparece en todas las tablas
2. Probar transferencia desde cada tabla
3. Verificar que refetch actualiza la vista
4. Confirmar que resguardos activos deshabilitan el badge
5. Probar con registros que tienen id_inv null

## Notas Técnicas

### Manejo de Null en id_inv
En ITEA Obsoletos, algunos registros pueden tener `id_inv: null`. Se implementó un null check condicional para evitar errores de TypeScript:

```tsx
{item.id_inv && (
  <OrigenBadge ... />
)}
```

### Prevención de Selección de Fila
El badge tiene su propia interacción (dropdown), por lo que se previene la propagación del evento click para evitar que se seleccione la fila:

```tsx
<td onClick={(e) => e.stopPropagation()}>
```

### Callback de Refetch
Cada tabla pasa su función de refetch al badge para que se ejecute después de una transferencia exitosa:

```tsx
onTransferSuccess={() => {
  if (onRefetch) {
    onRefetch();
  }
}}
```

## Conclusión

La Fase 3 se completó exitosamente. Las 5 tablas de inventario ahora tienen la funcionalidad de transferencia de origen integrada de manera consistente y sin errores. La implementación sigue los patrones establecidos en el proyecto y mantiene la coherencia visual y funcional en todas las tablas.

**Estado:** ✅ COMPLETADA  
**Errores TypeScript:** 0  
**Tablas integradas:** 5/5  
**Tiempo estimado:** 5 horas  
**Tiempo real:** ~2 horas

# Eliminación de Columna Resguardante de Tablas de Muebles

## Resumen

Se eliminó la columna `resguardante` de las tablas de muebles (mueblestlaxcala, mueblesinea, mueblesitea) para normalizar la base de datos. El campo `resguardante` ahora reside únicamente en la tabla `resguardos`, donde corresponde arquitectónicamente.

## Cambios Realizados

### 1. Tipos de Datos (src/types/indexation.ts)

Se eliminó el campo `resguardante` de las interfaces:
- `MuebleNoListado`
- `MuebleINEA`
- `MuebleITEA`

La interfaz `Resguardo` mantiene el campo `resguardante: string;` sin cambios.

### 2. Tipos Locales

Se eliminó `resguardante` de:
- `src/components/consultas/inea/obsoletos/types.ts` - interfaz `Mueble`
- `src/components/consultas/itea/obsoletos/types.ts` - interfaz `MuebleITEA`

### 3. Vistas Actualizadas

#### NO LISTADO
- **DetailPanel EditMode**: Eliminado campo de edición "Usuario Final"
- **DetailPanel ViewMode**: Muestra resguardante desde `detalleResguardo.usufinal` solo cuando existe resguardo
- **useItemEdit**: Excluye `resguardante` del PATCH, eliminado del switch de handleEditFormChange

#### INEA General
- **DetailPanel EditMode**: Eliminado campo de edición "Usuario Final"
- **DetailPanel ViewMode**: Muestra resguardante desde `detalleResguardo.usufinal` solo cuando existe resguardo
- **useItemEdit**: Excluye `resguardante` del PATCH, eliminado del switch de handleEditFormChange

#### INEA Obsoletos
- **DetailPanel EditMode**: Eliminado campo de edición "Resguardante"
- **DetailPanel ViewMode**: Eliminada visualización de resguardante (no tiene resguardoDetalles)
- **useItemEdit**: Excluye `resguardante` del objeto de actualización

#### ITEA General
- **DetailPanel EditMode**: Eliminado campo de edición "Usuario Final"
- **DetailPanel ViewMode**: Muestra resguardante desde `detalleResguardo.usufinal` solo cuando existe resguardo
- **useItemEdit**: Excluye `resguardante` del PATCH, eliminado del switch de handleEditFormChange

#### ITEA Obsoletos
- **DetailPanel EditMode**: Eliminado campo de edición "Resguardante"
- **DetailPanel ViewMode**: Eliminada visualización de resguardante
- **useItemEdit**: Excluye `resguardante` del objeto de actualización

### 4. Hooks de Indexación Verificados

Todos los hooks de indexación ya tienen implementado correctamente el JOIN con la tabla `resguardos`:
- `useNoListadoIndexation`
- `useIneaIndexation`
- `useIneaObsoletosIndexation`
- `useIteaIndexation`
- `useIteaObsoletosIndexation`

## Nueva Arquitectura de Datos

### Antes
```
mueblestlaxcala
├── id
├── id_inv
├── descripcion
├── resguardante  ❌ (redundante)
└── ...

resguardos
├── folio
├── id_mueble
├── resguardante  ✓ (fuente de verdad)
└── ...
```

### Después
```
mueblestlaxcala
├── id
├── id_inv
├── descripcion
└── ...

resguardos
├── folio
├── id_mueble
├── resguardante  ✓ (única fuente de verdad)
└── ...
```

## Lógica de Visualización

### ViewMode - Vistas con ResguardoDetalles

```typescript
// Muestra resguardante solo cuando existe resguardo activo
{detalleResguardo?.usufinal && (
  <DetailCard
    label="Resguardante"
    value={detalleResguardo.usufinal}
    isDarkMode={isDarkMode}
  />
)}

// Muestra "Sin Resguardante" cuando hay resguardo pero sin usufinal
{!detalleResguardo?.usufinal && folio && (
  <DetailCard
    label="Resguardante"
    value="Sin Resguardante"
    isDarkMode={isDarkMode}
  />
)}
```

### EditMode

El campo de edición de resguardante fue completamente eliminado. Los usuarios NO pueden editar manualmente el resguardante. Este valor se obtiene automáticamente de la tabla `resguardos` mediante JOIN.

### Operaciones de Guardado

```typescript
// Excluir resguardante del PATCH
const { area, directorio, resguardante, ...dbFields } = editFormData as any;

// Solo se envían campos de la tabla muebles
const response = await fetch(url, {
  method: 'PATCH',
  body: JSON.stringify({ ...dbFields, image_path: imagePath })
});
```

## Búsqueda

La búsqueda por resguardante sigue funcionando correctamente porque los hooks de indexación obtienen el valor mediante JOIN:

```typescript
const { data: resguardos } = await supabase
  .from('resguardos')
  .select('id_mueble, resguardante, f_resguardo')
  .in('id_mueble', muebleIds)
  .eq('origen', 'NO_LISTADO')
  .order('f_resguardo', { ascending: false });

// Mapear resguardante más reciente a cada mueble
const resguardoMap = new Map<string, string | null>();
if (resguardos) {
  resguardos.forEach(r => {
    if (!resguardoMap.has(r.id_mueble)) {
      resguardoMap.set(r.id_mueble, r.resguardante || null);
    }
  });
}
```

## Casos de Uso

### Caso 1: Mueble con Resguardo Activo
- **Visualización**: Muestra el nombre del resguardante desde `detalleResguardo.usufinal`
- **Edición**: Campo NO disponible para edición
- **Búsqueda**: Encuentra el mueble al buscar por nombre del resguardante

### Caso 2: Mueble sin Resguardo
- **Visualización**: NO muestra el campo resguardante
- **Edición**: Campo NO disponible
- **Búsqueda**: No aparece en búsquedas por resguardante

### Caso 3: Resguardo sin Usufinal
- **Visualización**: Muestra "Sin Resguardante"
- **Edición**: Campo NO disponible
- **Búsqueda**: No aparece en búsquedas por resguardante

## Beneficios

1. **Normalización**: Eliminación de redundancia de datos
2. **Consistencia**: Una única fuente de verdad para resguardante
3. **Integridad**: No hay posibilidad de desincronización entre tablas
4. **Mantenibilidad**: Cambios en resguardos se reflejan automáticamente
5. **Seguridad**: Usuarios no pueden modificar manualmente el resguardante

## Archivos Modificados

### Tipos
- `src/types/indexation.ts`
- `src/components/consultas/inea/obsoletos/types.ts`
- `src/components/consultas/itea/obsoletos/types.ts`

### Componentes DetailPanel
- `src/components/consultas/no-listado/components/DetailPanel.tsx`
- `src/components/consultas/inea/components/DetailPanel.tsx`
- `src/components/consultas/inea/obsoletos/components/DetailPanel.tsx`
- `src/components/consultas/itea/components/DetailPanel.tsx`
- `src/components/consultas/itea/obsoletos/components/DetailPanel.tsx`

### Hooks useItemEdit
- `src/components/consultas/no-listado/hooks/useItemEdit.ts`
- `src/components/consultas/inea/hooks/useItemEdit.ts`
- `src/components/consultas/inea/obsoletos/hooks/useItemEdit.ts`
- `src/components/consultas/itea/hooks/useItemEdit.ts`
- `src/components/consultas/itea/obsoletos/hooks/useItemEdit.ts`

### Hooks de Indexación (Verificados, sin cambios)
- `src/hooks/indexation/useNoListadoIndexation.ts`
- `src/hooks/indexation/useIneaIndexation.ts`
- `src/hooks/indexation/useIneaObsoletosIndexation.ts`
- `src/hooks/indexation/useIteaIndexation.ts`
- `src/hooks/indexation/useIteaObsoletosIndexation.ts`

## Notas Importantes

- La tabla `resguardos` NO fue modificada
- Los hooks de indexación ya tenían el JOIN implementado correctamente
- La funcionalidad de búsqueda por resguardante se mantiene intacta
- NO se requieren cambios en la base de datos (la columna ya fue eliminada previamente)
- Todos los cambios son retrocompatibles con la estructura actual de la base de datos

## Fecha de Implementación

Febrero 2026

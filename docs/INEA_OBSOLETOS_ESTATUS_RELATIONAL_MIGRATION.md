# INEA Obsoletos - Estatus Relational Migration

## Overview
This document describes the migration of the `estatus` field in the INEA Obsoletos module from plain text to a relational model using the `config` table, including realtime sync with skeleton indicators.

## Implementation Date
February 25, 2026

## Changes Made

### 1. Type Definitions (`src/components/consultas/inea/obsoletos/types.ts`)
Added relational fields to the `Mueble` interface:
```typescript
export interface Mueble {
  // ... existing fields
  estatus: string | null;
  id_estatus: number | null;  // NEW: FK to config table
  config_estatus: { id: number; concepto: string } | null;  // NEW: Relational data
  // ... rest of fields
}
```

### 2. Indexation Hook (`src/hooks/indexation/useIneaObsoletosIndexation.ts`)

#### Updated Query Projections
All SELECT queries now include the `config_estatus` JOIN:
```typescript
.select(`
  *,
  area:id_area(id_area, nombre),
  directorio:id_directorio(id_directorio, nombre, puesto),
  config_estatus:config!id_estatus(id, concepto)  // NEW
`)
```

This applies to:
- Initial data fetch (with batching)
- INSERT event handler
- UPDATE event handler
- Resguardo changes handler
- Batch updates for area/directorio/estatus changes

#### Added Config Table Listener
New realtime listener for `config` table changes:
```typescript
.on('postgres_changes', { 
  event: 'UPDATE', 
  schema: 'public', 
  table: 'config',
  filter: 'tipo=eq.estatus'
},
  async (payload: any) => {
    const { new: updatedConfig } = payload;
    updateLastEventReceived(MODULE_KEY);
    
    try {
      if (updatedConfig.tipo === 'estatus') {
        processBatchUpdates([], 'estatus', updatedConfig.id);
      }
    } catch (error) {
      console.error('Error handling config estatus update:', error);
    }
  }
)
```

#### Updated Batch Processing
Enhanced `processBatchUpdates` to handle estatus updates:
```typescript
const processBatchUpdates = useCallback(async (
  _ids: string[],
  type: 'area' | 'directorio' | 'estatus',  // Added 'estatus'
  refId: number
) => {
  // ...
  const filterField = type === 'area' ? 'id_area' 
    : type === 'directorio' ? 'id_directorio' 
    : 'id_estatus';  // NEW
  // ...
}, [/* deps */]);
```

Updated type definitions:
```typescript
const syncQueueRef = useRef<{ 
  ids: string[]; 
  type: 'area' | 'directorio' | 'estatus';  // Added 'estatus'
  refId: number 
} | null>(null);
```

### 3. Inventory Table (`src/components/consultas/inea/obsoletos/components/InventoryTable.tsx`)

#### Added Skeleton to Fecha de Baja Column
The last column now shows skeleton during sync:
```typescript
<td className={`px-4 py-4 align-top text-sm font-light ${
  isDarkMode ? 'text-white/80' : 'text-black/80'
}`}>
  {isSyncing ? <CellSkeleton /> : (formatDate(item.fechabaja) || 'No especificada')}
</td>
```

Note: The estatus field is not displayed in the INEA Obsoletos table (only shows ID, Description, Area, Director, and Fecha de Baja), so no estatus column skeleton was needed.

### 4. Detail Panel (`src/components/consultas/inea/obsoletos/components/DetailPanel.tsx`)

#### Updated Estatus Display
The estatus field now uses the relational data with fallback:
```typescript
<DetailCard 
  label="Estatus" 
  value={isSyncing ? null : (selectedItem.config_estatus?.concepto || selectedItem.estatus || 'No especificado')} 
  isDarkMode={isDarkMode} 
  isSyncing={isSyncing} 
/>
```

The `DetailCard` component already supports skeleton display via the `isSyncing` prop.

## Database Schema

### Existing Tables
- `mueblesinea` table has `id_estatus` column (FK to `config.id`)
- `config` table stores estatus values with `tipo='estatus'`
- Index exists on `mueblesinea.id_estatus`

### Relational Structure
```
mueblesinea.id_estatus → config.id (where tipo='estatus')
```

## Realtime Sync Behavior

### Config Table Updates
When an estatus value is updated in the `config` table:
1. Realtime listener detects the change
2. `processBatchUpdates` is called with `type='estatus'` and the config ID
3. All affected records are fetched in batches of 1000
4. Skeleton indicators appear in the Estatus field of DetailPanel and Fecha de Baja column
5. Store is updated in UI batches of 50 records
6. Skeleton indicators are removed progressively
7. Minimum skeleton display time: 800ms

### Area/Directorio Updates
Same batch sync pattern applies for area and directorio changes (already implemented).

## Backward Compatibility

The implementation maintains full backward compatibility:
- Legacy `estatus` text field is preserved
- Display logic uses `config_estatus?.concepto || estatus` pattern
- Fallback ensures data is always displayed even if relational data is missing

## Display-Only Implementation

This is a display-only implementation:
- No editing infrastructure for estatus field
- INEA Obsoletos module is read-only for items with `estatus='BAJA'`
- Users cannot change estatus values from this module
- Estatus changes happen through other modules (INEA general, admin tools)

## Testing Checklist

- [x] Type definitions include relational fields
- [x] All SELECT queries include `config_estatus` JOIN
- [x] Config table listener triggers batch sync
- [x] Batch processing handles 'estatus' type
- [x] Skeleton appears in DetailPanel estatus field during sync
- [x] Skeleton appears in Fecha de Baja column during sync
- [x] DetailPanel displays from `config_estatus?.concepto` with fallback
- [x] No TypeScript diagnostics errors
- [x] Backward compatibility maintained

## Related Modules

This implementation follows the same pattern as:
- INEA General (`docs/INEA_ESTATUS_RELATIONAL_MIGRATION.md`)
- ITEA General (`docs/ITEA_ESTATUS_RELATIONAL_MIGRATION.md`)
- ITEA Obsoletos (`docs/ITEA_OBSOLETOS_ESTATUS_RELATIONAL_MIGRATION.md`)
- No Listado (`docs/NO_LISTADO_ESTATUS_RELATIONAL_MIGRATION.md`)

## Notes

- INEA Obsoletos only displays items with `estatus='BAJA'`
- The module is simpler than INEA General as it doesn't need editing infrastructure
- Skeleton indicators provide visual feedback during config updates
- The implementation is minimal and focused on display consistency

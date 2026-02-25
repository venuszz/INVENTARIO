# INEA - Estatus Relational Migration

## Overview
This document describes the migration of the INEA module's `estatus` field from plain text to a relational model using the `config` table, following the same pattern implemented in the ITEA and No Listado modules.

## Context
The INEA module is the main inventory management module for INEA items. This migration enables:
- Centralized estatus management through the `config` table
- Consistent estatus values across the system
- Easy updates to estatus labels without data migration
- Backward compatibility with legacy text field

## Changes Made

### 1. Type Definitions (`src/types/indexation.ts`)
Added relational fields to the `MuebleINEA` interface:
```typescript
export interface MuebleINEA {
  // ... existing fields
  
  // Relational fields (NEW)
  id_area: number | null;
  id_directorio: number | null;
  id_estatus: number | null;
  
  // Nested objects from JOINs (NEW)
  area: { id_area: number; nombre: string } | null;
  directorio: { id_directorio: number; nombre: string; puesto: string } | null;
  config_estatus: { id: number; concepto: string } | null;
}
```

### 2. Search and Filters Hook (`src/components/consultas/inea/hooks/useSearchAndFilters.ts`)
Updated to use nested `config_estatus` object with fallback to legacy field:

**Searchable Data:**
```typescript
estatus: muebles.map(m => m.config_estatus?.concepto || m.estatus || '').filter(Boolean)
```

**Filter Logic:**
```typescript
case 'estatus': 
  return ((item.config_estatus?.concepto || item.estatus)?.toLowerCase() || '').includes(filterTerm);
```

**Search Logic:**
```typescript
((item.config_estatus?.concepto || item.estatus)?.toLowerCase() || '').includes(term)
```

### 3. Indexation Hook (`src/hooks/indexation/useIneaIndexation.ts`)
Updated all SELECT queries to include `config_estatus` JOIN:

**Initial Data Fetch:**
```typescript
const { data, error } = await supabase
  .from(TABLE)
  .select(`
    *,
    area:id_area(id_area, nombre),
    directorio:id_directorio(id_directorio, nombre, puesto),
    config_estatus:config!id_estatus(id, concepto)
  `)
  .neq('estatus', 'BAJA')
  .range(offset, offset + BATCH_SIZE - 1);
```

**Realtime INSERT Handler:**
```typescript
const { data: insertedData, error } = await supabase
  .from(TABLE)
  .select(`
    *,
    area:id_area(id_area, nombre),
    directorio:id_directorio(id_directorio, nombre, puesto),
    config_estatus:config!id_estatus(id, concepto)
  `)
  .eq('id', newRecord.id)
  .single();
```

**Realtime UPDATE Handler:**
```typescript
const { data: updatedData, error } = await supabase
  .from(TABLE)
  .select(`
    *,
    area:id_area(id_area, nombre),
    directorio:id_directorio(id_directorio, nombre, puesto),
    config_estatus:config!id_estatus(id, concepto)
  `)
  .eq('id', newRecord.id)
  .single();
```

**Batch Updates (Area/Director Changes):**
```typescript
const { data: affectedMuebles, error } = await supabase
  .from(TABLE)
  .select(`
    *,
    area:id_area(id_area, nombre),
    directorio:id_directorio(id_directorio, nombre, puesto),
    config_estatus:config!id_estatus(id, concepto)
  `)
  .eq(filterField, refId)
  .neq('estatus', 'BAJA')
  .range(offset, offset + BATCH_SIZE - 1);
```

**Resguardo Change Handler:**
```typescript
const { data: updatedMueble, error } = await supabase
  .from(TABLE)
  .select(`
    *,
    area:id_area(id_area, nombre),
    directorio:id_directorio(id_directorio, nombre, puesto),
    config_estatus:config!id_estatus(id, concepto)
  `)
  .eq('id', affectedMuebleId)
  .single();
```

## Database Schema
The migration relies on the existing database schema:
- `muebles.id_estatus` → Foreign key to `config.id`
- `config` table with `tipo='estatus'` filter
- Index on `muebles.id_estatus` for performance

## Backward Compatibility
All display logic includes fallback to legacy `estatus` field:
```typescript
config_estatus?.concepto || estatus
```

This ensures the module continues to work even if:
- Some records haven't been migrated yet
- The `id_estatus` field is null
- The JOIN fails for any reason

## Features NOT Implemented (Yet)
Unlike the ITEA module, the following features were NOT implemented in this phase:

1. **Estatus Editing with ID Lookup**: The `useItemEdit` hook still saves estatus as text, not ID
2. **EstatusMap**: No ID lookup map for efficient estatus selection
3. **Realtime Config Sync**: No listener for config table changes to trigger batch updates
4. **Batch Sync with Skeleton Indicators**: Not needed since estatus editing isn't implemented yet

These features can be added in a future phase when estatus editing is required.

## Display-Only Implementation
This migration is currently **display-only**:
- Estatus is fetched and displayed using the relational field
- Search and filters work with the nested object
- Editing still uses the legacy text field
- No realtime sync for config table changes

This approach provides immediate benefits (consistent display, centralized data) while deferring the complexity of editing infrastructure until it's needed.

## Testing Checklist
- [x] TypeScript diagnostics pass
- [ ] Estatus displays correctly in table view
- [ ] Estatus displays correctly in detail panel
- [ ] Search by estatus works correctly
- [ ] Filter by estatus works correctly
- [ ] Suggestions include estatus values
- [ ] Backward compatibility with legacy field works
- [ ] Realtime updates include estatus data

## Files Modified
1. `src/types/indexation.ts`
2. `src/components/consultas/inea/hooks/useSearchAndFilters.ts`
3. `src/hooks/indexation/useIneaIndexation.ts`

## Related Documentation
- [ITEA Estatus Relational Migration](./ITEA_ESTATUS_RELATIONAL_MIGRATION.md) - Full implementation with editing
- [ITEA Obsoletos Estatus Migration](./ITEA_OBSOLETOS_ESTATUS_RELATIONAL_MIGRATION.md) - Display-only implementation
- [No Listado Estatus Relational Migration](./NO_LISTADO_ESTATUS_RELATIONAL_MIGRATION.md) - Full implementation
- [Campos Relacionales Migration](./MIGRACION_CAMPOS_RELACIONALES.md) - Overall strategy

## Future Enhancements
When estatus editing is required, implement:
1. EstatusMap in `useDirectorManagement` hook
2. ID-based saving in `useItemEdit` hook
3. Realtime config table listener
4. Batch sync with skeleton indicators
5. Estatus dropdown with ID selection

## Implementation Date
February 25, 2026

## Status
✅ Complete (Display-Only) - All TypeScript diagnostics passing

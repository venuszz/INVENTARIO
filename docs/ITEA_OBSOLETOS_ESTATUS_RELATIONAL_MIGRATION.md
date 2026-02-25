# ITEA Obsoletos - Estatus Relational Migration

## Overview
This document describes the migration of the ITEA Obsoletos module's `estatus` field from plain text to a relational model using the `config` table, following the same pattern implemented in the main ITEA module.

## Context
The ITEA Obsoletos module displays items with `estatus='BAJA'` only. Unlike the main ITEA module, it doesn't need full relational migration infrastructure (like estatus editing, realtime sync for config changes, etc.) because:
- Items are read-only in terms of estatus (they're already BAJA)
- The module only displays estatus information, doesn't edit it
- No need for estatusMap or ID lookup functionality

## Changes Made

### 1. Type Definitions (`src/components/consultas/itea/obsoletos/types.ts`)
Added relational fields to the `MuebleITEA` interface:
```typescript
export interface MuebleITEA {
  // ... existing fields
  
  /** Status ID (foreign key to config table) */
  id_estatus: number | null;
  
  /** Status information from config table (relational) */
  config_estatus: { id: number; concepto: string } | null;
}
```

### 2. Search and Filters Hook (`src/components/consultas/itea/obsoletos/hooks/useSearchAndFilters.ts`)
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

### 3. Detail Panel (`src/components/consultas/itea/obsoletos/components/DetailPanel.tsx`)
Updated ViewMode to display estatus from nested object:
```typescript
<DetailCard 
  label="Estatus" 
  value={selectedItem.config_estatus?.concepto || selectedItem.estatus || 'No especificado'} 
  isDarkMode={isDarkMode} 
/>
```

### 4. Indexation Hook (`src/hooks/indexation/useIteaObsoletosIndexation.ts`)
Updated all SELECT queries to include `config_estatus` JOIN:

**Initial Data Fetch:**
```typescript
const { data, error } = await supabase
  .from(TABLE)
  .select(`
    *,
    area:area(id_area, nombre),
    directorio:directorio(id_directorio, nombre, puesto),
    config_estatus:config!id_estatus(id, concepto)
  `)
  .eq('estatus', 'BAJA')
  .range(offset, offset + BATCH_SIZE - 1);
```

**Realtime INSERT Handler:**
```typescript
const { data, error } = await supabase
  .from(TABLE)
  .select(`
    *,
    area:area(id_area, nombre),
    directorio:directorio(id_directorio, nombre, puesto),
    config_estatus:config!id_estatus(id, concepto)
  `)
  .eq('id', newRecord.id)
  .single();
```

**Realtime UPDATE Handler:**
```typescript
const { data, error } = await supabase
  .from(TABLE)
  .select(`
    *,
    area:area(id_area, nombre),
    directorio:directorio(id_directorio, nombre, puesto),
    config_estatus:config!id_estatus(id, concepto)
  `)
  .eq('id', newRecord.id)
  .single();
```

**Resguardo Change Handler:**
```typescript
const { data: updatedMueble, error } = await supabase
  .from(TABLE)
  .select(`
    *,
    area:area(id_area, nombre),
    directorio:directorio(id_directorio, nombre, puesto),
    config_estatus:config!id_estatus(id, concepto)
  `)
  .eq('id', affectedMuebleId)
  .single();
```

## Database Schema
The migration relies on the existing database schema:
- `mueblesitea.id_estatus` → Foreign key to `config.id`
- `config` table with `tipo='estatus'` filter
- Index on `mueblesitea.id_estatus` for performance

## Backward Compatibility
All display logic includes fallback to legacy `estatus` field:
```typescript
config_estatus?.concepto || estatus
```

This ensures the module continues to work even if:
- Some records haven't been migrated yet
- The `id_estatus` field is null
- The JOIN fails for any reason

## Features NOT Implemented
Unlike the main ITEA module, the following features were NOT implemented because they're not needed for a read-only obsolete items view:

1. **Estatus Editing**: Items are already BAJA, no need to change estatus
2. **EstatusMap**: No ID lookup needed since we don't save estatus changes
3. **Realtime Config Sync**: No need to listen to config table changes since estatus isn't editable
4. **Batch Sync with Skeleton Indicators**: Not needed for read-only display

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
1. `src/components/consultas/itea/obsoletos/types.ts`
2. `src/components/consultas/itea/obsoletos/hooks/useSearchAndFilters.ts`
3. `src/components/consultas/itea/obsoletos/components/DetailPanel.tsx`
4. `src/hooks/indexation/useIteaObsoletosIndexation.ts`

## Related Documentation
- [ITEA Estatus Relational Migration](./ITEA_ESTATUS_RELATIONAL_MIGRATION.md) - Main ITEA module implementation
- [No Listado Estatus Relational Migration](./NO_LISTADO_ESTATUS_RELATIONAL_MIGRATION.md) - Similar pattern
- [Campos Relacionales Migration](./MIGRACION_CAMPOS_RELACIONALES.md) - Overall strategy

## Implementation Date
February 25, 2026

## Status
✅ Complete - All TypeScript diagnostics passing

# Resguardos Crear - Estatus Relational Migration

## Overview
Migrated the Resguardos Crear component to use relational `config_estatus` field for search and filtering instead of plain text `estatus` field. This component doesn't save estatus data (it only reads from inventory), so the migration focuses on display and filtering logic.

## Changes Made

### 1. Type Definitions (`types.ts`)
Added `config_estatus` field to `Mueble` interface:

**Before:**
```typescript
export interface Mueble {
  // ... other fields
  estatus: string | null;          // Status (ACTIVO/INACTIVO)
  // ... other fields
}
```

**After:**
```typescript
export interface Mueble {
  // ... other fields
  estatus: string | null;          // Status (ACTIVO/INACTIVO) - legacy field
  // Relational fields
  config_estatus: { id: number; concepto: string } | null;  // Estatus (relational)
  // ... other fields
}
```

### 2. Search and Filters Hook (`useSearchAndFilters.ts`)
Updated to use `config_estatus` for search suggestions and filtering:

**Before:**
```typescript
return {
  // ... other fields
  estatus: muebles.map((m: Mueble) => m.estatus || '').filter(Boolean),
  // ... other fields
};
```

**After:**
```typescript
// Helper to get estatus value from relational field
const getEstatusValue = (mueble: Mueble): string => {
  // Try relational field first, fallback to legacy
  if (mueble.config_estatus && typeof mueble.config_estatus === 'object') {
    return mueble.config_estatus.concepto || '';
  }
  return mueble.estatus || '';
};

return {
  // ... other fields
  estatus: muebles.map((m: Mueble) => getEstatusValue(m)).filter(Boolean),
  // ... other fields
};
```

### 3. Main Component (`index.tsx`)
Updated filtering logic to use `config_estatus`:

**Before:**
```typescript
switch (filter.type) {
  // ... other cases
  case 'estatus': return (item.estatus?.toLowerCase() || '').includes(filterTerm);
  // ... other cases
}

// In search term logic
(item.estatus?.toLowerCase() || '').includes(term)
```

**After:**
```typescript
// Helper to get estatus value from relational field
const getEstatusValue = (): string => {
  // Try relational field first, fallback to legacy
  if (item.config_estatus && typeof item.config_estatus === 'object') {
    return item.config_estatus.concepto?.toLowerCase() || '';
  }
  return (item.estatus?.toLowerCase() || '');
};

switch (filter.type) {
  // ... other cases
  case 'estatus': return getEstatusValue().includes(filterTerm);
  // ... other cases
}

// In search term logic
getEstatusValue().includes(term)
```

## Data Flow

### Source Data
The component receives data from three indexation hooks:
- `useIneaIndexation()` - INEA inventory with `config_estatus` JOIN
- `useIteaIndexation()` - ITEA inventory with `config_estatus` JOIN
- `useNoListadoIndexation()` - No Listado inventory with `config_estatus` JOIN

All three hooks already include the `config_estatus` JOIN from their respective indexation implementations.

### Search and Filter Flow
1. User types in search box
2. `useSearchAndFilters` generates suggestions using `getEstatusValue()` helper
3. Suggestions prioritize `config_estatus.concepto` over legacy `estatus`
4. User selects suggestion or adds filter
5. `filteredMuebles` applies filter using `getEstatusValue()` helper
6. Results display items matching the estatus filter

### Display Flow
The component doesn't display estatus directly in the main view. Estatus is only used for:
- Search suggestions
- Active filter chips
- Filtering results

## Backward Compatibility
- Legacy `estatus` text field is maintained as fallback
- Helper function `getEstatusValue()` checks relational field first
- If `config_estatus` is null or undefined, falls back to `estatus`
- No breaking changes to existing functionality

## Benefits

### Data Consistency
1. **Single source of truth**: Estatus values come from `config` table via indexation hooks
2. **Accurate filtering**: Uses relational data for precise filtering
3. **Consistent with other modules**: Follows same pattern as INEA, ITEA, No Listado modules

### Performance
1. **No additional queries**: Data already includes `config_estatus` from indexation hooks
2. **Efficient filtering**: Helper function is memoized in useMemo
3. **No impact on load time**: Same data structure, just different field access

### Maintainability
1. **Centralized logic**: Helper functions encapsulate field access
2. **Easy to update**: Changes to estatus structure only affect helper functions
3. **Type-safe**: TypeScript ensures correct field access

## User Experience
- No visible changes to the UI
- Same search and filter functionality
- Consistent estatus values across all inventory sources
- Improved accuracy when filtering by estatus

## Testing Checklist
- [x] TypeScript diagnostics pass
- [ ] Search suggestions include estatus from config table
- [ ] Filtering by estatus works correctly
- [ ] Active filter chips display correct estatus values
- [ ] Fallback to legacy estatus works when config_estatus is null
- [ ] No errors when searching/filtering by estatus
- [ ] Performance is not impacted

## Related Files
- `src/components/resguardos/crear/index.tsx`
- `src/components/resguardos/crear/hooks/useSearchAndFilters.ts`
- `src/components/resguardos/crear/types.ts`

## Related Documentation
- `docs/INVENTARIO_REGISTRO_ESTATUS_RELATIONAL_MIGRATION.md`
- `docs/REPORTES_ESTATUS_RELATIONAL_MIGRATION.md`
- `docs/ITEA_ESTATUS_RELATIONAL_MIGRATION.md`
- `docs/INEA_ESTATUS_RELATIONAL_MIGRATION.md`
- `docs/NO_LISTADO_ESTATUS_RELATIONAL_MIGRATION.md`

## Notes
- This component only reads estatus data, it doesn't save it
- The actual estatus data comes from the indexation hooks which already have the relational JOIN
- No changes needed to the indexation hooks themselves
- The migration is purely about how the component accesses and filters the data

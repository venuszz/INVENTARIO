# Resguardos Consultar - Search Enhancement

## Overview
Added search functionality for área and inventory IDs (num_inventario) in the Consultar Resguardos module, matching the functionality already present in Consultar Bajas.

## Changes Made

### 1. Updated Types (`src/components/resguardos/consultar/types.ts`)

#### SearchMatchType
Added two new search types:
- `'area'` - Search by área name
- `'numInventario'` - Search by inventory ID

```typescript
export type SearchMatchType = 'folio' | 'director' | 'resguardante' | 'fecha' | 'area' | 'numInventario' | null;
```

#### Resguardo Interface
Added `numInventarios` field to store comma-separated inventory IDs:
```typescript
export interface Resguardo {
  folio: string;
  fecha: string;
  director: string;
  area: string;
  resguardantes: string; // Comma-separated resguardantes
  numInventarios: string; // Comma-separated num_inventarios (NEW)
  articulosCount: number;
}
```

### 2. Updated Data Hook (`src/components/resguardos/consultar/hooks/useResguardosData.ts`)

#### Data Aggregation
Modified the `processResguardos` function to:
- Collect all `id_inv` values from muebles (INEA, ITEA, NO_LISTADO) for each folio
- Store them in a Set to avoid duplicates
- Join them as comma-separated string in the final data

```typescript
// Added numInventarios Set to foliosMap
numInventarios: Set<string>;

// Lookup id_inv from appropriate muebles store based on origen
if (record.origen === 'INEA') {
  const mueble = ineaMuebles.find(m => m.id === record.id_mueble);
  numInventario = mueble?.id_inv ?? null;
}
// ... similar for ITEA and NO_LISTADO
```

#### Filter Logic
Added filter cases for the new search types:
```typescript
case 'area':
  return resguardo.area.toLowerCase().includes(term);
case 'numInventario':
  return resguardo.numInventarios.toLowerCase().includes(term);
```

Also updated the default case (when type is null) to search across all fields including area and numInventarios.

### 3. Updated Search Hook (`src/components/resguardos/consultar/hooks/useSearchAndFilters.ts`)

#### Change Detection
Updated the change detection logic to include area and numInventarios:
```typescript
return r.folio !== prev.folio || 
       r.director !== prev.director || 
       r.resguardantes !== prev.resguardantes || 
       r.area !== prev.area || 
       r.numInventarios !== prev.numInventarios;
```

#### Searchable Data
Added area and numInventario to the searchable data vectors:
```typescript
area: resguardos.map((r: Resguardo) => r.area || '').filter(Boolean),
numInventario: resguardos.flatMap((r: Resguardo) => 
  (r.numInventarios || '').split(',').map(n => n.trim()).filter(Boolean)
),
```

Note: `numInventario` uses `flatMap` to split comma-separated values into individual searchable items.

#### Search Priority
Updated the search match type detection with new priorities:
1. Folio (highest - 9/8)
2. Num Inventario (8/7)
3. Director (7/6)
4. Area (6/5)
5. Resguardante (5/4)
6. Fecha (lowest - 4/3)

#### Suggestions
Added area and numInventario to the suggestions fields array:
```typescript
const fields = [
  { type: 'folio' as SearchMatchType, data: searchableData.folio },
  { type: 'numInventario' as SearchMatchType, data: searchableData.numInventario },
  { type: 'director' as SearchMatchType, data: searchableData.director },
  { type: 'area' as SearchMatchType, data: searchableData.area },
  { type: 'resguardante' as SearchMatchType, data: searchableData.resguardante },
  { type: 'fecha' as SearchMatchType, data: searchableData.fecha },
];
```

## How It Works

### Area Search
1. When processing resguardos, the system looks up the `id_area` from the mueble (based on origen)
2. It then looks up the area name from the `areas` store
3. The area name is stored in the aggregated resguardo data
4. Users can search by typing the area name, and it will filter folios that contain items in that area

### Inventory ID Search
1. When processing resguardos, the system collects all `id_inv` values from muebles within each folio
2. Multiple inventory IDs are stored as comma-separated values
3. When searching, the system splits these values and searches across all of them
4. Users can search by typing any inventory ID, and it will show folios containing that item

## Search Behavior

### Autocomplete Suggestions
- As users type, suggestions appear showing matching values
- Suggestions are grouped by type (folio, numInventario, director, area, resguardante, fecha)
- Suggestions prioritize exact matches and prefix matches

### Active Filters
- Users can add multiple filters by selecting suggestions or pressing Enter
- Each filter is displayed as a chip with its type
- Filters work together (AND logic) - all filters must match
- Users can remove individual filters by clicking the X on the chip

### Match Detection
- The system automatically detects what type of data the user is searching for
- It shows a badge indicating the detected type (e.g., "Área", "No. Inventario")
- This helps users understand what field they're searching in

## Testing

Build completed successfully with no errors:
```
✓ Compiled successfully
✓ Finished TypeScript
```

## Compatibility

This implementation matches the search functionality in Consultar Bajas, providing a consistent user experience across both modules.

## Files Modified

1. `src/components/resguardos/consultar/types.ts`
2. `src/components/resguardos/consultar/hooks/useResguardosData.ts`
3. `src/components/resguardos/consultar/hooks/useSearchAndFilters.ts`

## Future Enhancements

Potential improvements:
- Add visual indicators in the table to highlight matched inventory IDs
- Add area column to the resguardos table for better visibility
- Consider adding a dedicated filter dropdown for areas
- Add search history for frequently searched inventory IDs

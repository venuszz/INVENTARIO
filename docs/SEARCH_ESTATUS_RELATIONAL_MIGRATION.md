# Search Bar Estatus Relational Migration

## Overview
Migrated the UniversalSearchBar component to use the relational `config_estatus` field instead of the legacy text `estatus` field. This ensures search results display and filter using the normalized estatus values from the `config` table.

## Changes Made

### 1. Type Definitions (`src/components/search/types.ts`)
- Added `config_estatus?: { id: number; concepto: string } | null` to `SearchResult` interface
- Maintains backward compatibility with legacy `estatus` field

### 2. Search Result Mapping (`src/components/search/UniversalSearchBar.tsx`)
Updated all inventory data mappings to include relational estatus:

```typescript
// Pattern applied to all inventory sources
estatus: item.config_estatus?.concepto || item.estatus,
config_estatus: item.config_estatus,
```

Applied to:
- INEA general
- ITEA general
- TLAXCALA (No Listado)
- INEA Obsoletos
- ITEA Obsoletos

### 3. Search Priority (`src/components/search/UniversalSearchBar.tsx`)
Implemented priority system for search results:
1. **Highest Priority**: Items matching by estatus
2. **Normal Priority**: Items matching by other fields (id_inv, descripcion, rubro, etc.)

This ensures that when users search for an estatus value (e.g., "Activo", "Baja"), those results appear first.

### 4. Search Display (`src/components/search/SearchResultItem.tsx`)
- Estatus badges now display from `result.estatus` which contains the relational value
- No changes needed as the mapping already provides the correct value

### 5. URL Parameter Support (`src/components/search/UniversalSearchBar.tsx`)
Enhanced `handleResultClick` to include estatus as URL parameter:

```typescript
const estatusParam = result.estatus ? `&estatus=${encodeURIComponent(result.estatus)}` : '';
```

This allows components to pre-filter by estatus when navigating from search results.

## Features

### Estatus Search with Priority
- Users can search by estatus value (e.g., "Activo", "Baja", "Inactivo")
- Search matches against `config_estatus?.concepto` field
- **Estatus matches appear first** in search results
- Results show the normalized estatus from the config table

### URL Parameter Integration
When clicking a search result, the URL includes the estatus parameter:
- `/consultas/inea/general?id=123&estatus=Activo`
- `/consultas/itea/general?id=456&estatus=Baja`
- `/consultas/no-listado?id=789&estatus=Inactivo`

This allows the target component to:
1. Highlight the selected item
2. Pre-apply estatus filter
3. Provide better user context

## Backward Compatibility
- Maintains fallback to legacy `estatus` field: `config_estatus?.concepto || estatus`
- Works with both old and new data structures
- No breaking changes to existing functionality

## Data Flow
1. Indexation hooks fetch data with `config_estatus` JOIN
2. Store contains items with both `estatus` and `config_estatus` fields
3. Search bar maps to prioritize `config_estatus?.concepto`
4. Search results display normalized estatus values with priority
5. URL parameters pass estatus for filtering

## Testing Checklist
- [x] Search by estatus value returns correct results
- [x] Estatus matches appear first in search results
- [x] Search results display estatus from relational field
- [x] Clicking result navigates with estatus URL parameter
- [x] Backward compatibility with legacy estatus field
- [x] All inventory sources (INEA, ITEA, TLAXCALA, Obsoletos) work correctly
- [x] TypeScript diagnostics pass
- [x] Build completes successfully

## Related Files
- `src/components/search/UniversalSearchBar.tsx` - Main search component
- `src/components/search/SearchResultItem.tsx` - Result display component
- `src/components/search/types.ts` - Type definitions
- `src/hooks/indexation/useIneaIndexation.ts` - INEA data with config_estatus
- `src/hooks/indexation/useIteaIndexation.ts` - ITEA data with config_estatus
- `src/hooks/indexation/useNoListadoIndexation.ts` - TLAXCALA data with config_estatus
- `src/hooks/indexation/useIneaObsoletosIndexation.ts` - INEA Obsoletos data
- `src/hooks/indexation/useIteaObsoletosIndexation.ts` - ITEA Obsoletos data

## Next Steps
Components receiving URL parameters should:
1. Read `estatus` from URL query params
2. Apply filter to display matching items
3. Highlight the selected item if `id` is also present

Example implementation:
```typescript
const searchParams = useSearchParams();
const estatusParam = searchParams.get('estatus');

useEffect(() => {
  if (estatusParam) {
    setSelectedEstatus(estatusParam);
  }
}, [estatusParam]);
```

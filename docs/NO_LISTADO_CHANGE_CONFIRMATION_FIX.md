# No Listado - Change Confirmation Modal Fix

## Problem
The `ChangeConfirmationModal` was displaying IDs (primary keys) instead of human-readable values for relational fields (estatus, area, director) in the "new value" column. This happened because the `detectChanges` function wasn't receiving the filter options needed to resolve IDs to their display names.

## Root Cause
When editing a mueble, the `editFormData` only contains the updated ID values for relational fields (e.g., `id_estatus`, `id_area`, `id_directorio`). The nested objects (`config_estatus`, `area`, `directorio`) still contain the old data until the item is refetched from the database after saving.

The `detectChanges` function was trying to use these nested objects to format the new values, but they were stale. It needed access to the `filterOptions` to look up the correct display names for the new IDs.

## Solution

### 1. Updated `FilterOptions` Type
Changed the type definition to include full object structures with IDs:

```typescript
export interface FilterOptions {
    estados: string[];
    estatus: { id: number; concepto: string }[];
    areas: { id_area: number; nombre: string }[];  // Changed from string[]
    rubros: string[] | null;
    formadq: string[] | null;
    directores: { id_directorio: number; nombre: string }[];  // Changed from { nombre: string }[]
}
```

### 2. Updated `useDirectorManagement` Hook
Modified the data fetching to return complete objects:

**`fetchDirectorio`:**
- Now returns `{ id_directorio, nombre }` instead of just `{ nombre }`

**`fetchFilterOptions`:**
- Now fetches `id_area, nombre` from the `area` table
- Returns `{ id_area, nombre }` objects instead of just strings

### 3. Updated `useItemEdit` Hook
- Added `filterOptions` parameter to the hook
- Passed `filterOptions` to `detectChanges` function when detecting changes

### 4. Updated Main Component
- Passed `filterOptions` to `useItemEdit(filterOptions)` hook

## Files Modified

1. `src/components/consultas/no-listado/types.ts`
   - Updated `FilterOptions` interface

2. `src/components/consultas/no-listado/hooks/useDirectorManagement.ts`
   - Updated `fetchDirectorio` to return full director objects
   - Updated `fetchFilterOptions` to return full area objects

3. `src/components/consultas/no-listado/hooks/useItemEdit.ts`
   - Added `filterOptions` parameter
   - Passed `filterOptions` to `detectChanges` function

4. `src/components/consultas/no-listado/index.tsx`
   - Passed `filterOptions` to `useItemEdit` hook

## How It Works Now

1. When user edits a field and clicks "Guardar"
2. `saveChanges` is called, which calls `detectChanges(selectedItem, editFormData, filterOptions)`
3. For relational fields, `detectChanges` checks:
   - First: Does the nested object in `editFormData` match the new ID? (Usually no, because it's stale)
   - Second: Can we find the ID in `filterOptions`? (Yes! This is the fix)
   - Third: Fall back to showing the ID as a string
4. The modal now displays the correct human-readable values

## Example

**Before:**
- Old Value: "ACTIVO"
- New Value: "3" ❌

**After:**
- Old Value: "ACTIVO"
- New Value: "INACTIVO" ✅

## Testing Recommendations

1. Edit a mueble's estatus field
2. Edit a mueble's area field
3. Edit a mueble's director field
4. Verify the change confirmation modal shows proper names, not IDs
5. Verify changes are saved correctly to the database

## Notes

- This fix ensures the change confirmation modal always shows human-readable values
- The same pattern should be applied to other modules (INEA, ITEA, etc.) if they have similar issues
- The `changeDetection.ts` utility already had the logic to handle this, it just needed the data

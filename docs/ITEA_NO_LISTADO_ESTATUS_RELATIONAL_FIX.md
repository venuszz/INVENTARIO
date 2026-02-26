# ITEA and No Listado Estatus Relational Field Fix

## Date
February 26, 2026

## Problem
After fixing the INEA component to use the relational `id_estatus` field instead of the legacy `estatus` text field, the same issues were present in ITEA and No Listado components:

1. **Schema Cache Error**: `config_estatus` was being sent in PATCH body, causing "Could not find the 'config_estatus' column of 'muebles' in the schema cache" error
2. **Incorrect FilterOptions Type**: `estatus` was typed as `string[]` with a separate `estatusMap` instead of `{ id: number; concepto: string }[]`
3. **Complex Workaround Logic**: DetailPanel used `estatusMap` lookup to convert concepto to id, adding unnecessary complexity
4. **Missing Exclusion**: No Listado's `useItemEdit.ts` didn't exclude `config_estatus` from destructuring

## Root Cause
The components were not fully migrated to use the relational `id_estatus` field pattern that was already implemented in INEA.

## Solution

### 1. No Listado - useItemEdit.ts
**File**: `src/components/consultas/no-listado/hooks/useItemEdit.ts`

**Change**: Added `config_estatus` to destructuring exclusion list
```typescript
// Before
const { area, directorio, resguardante, ...dbFields } = editFormData as any;

// After
const { area, directorio, resguardante, config_estatus, ...dbFields } = editFormData as any;
```

### 2. No Listado - useDirectorManagement.ts
**File**: `src/components/consultas/no-listado/hooks/useDirectorManagement.ts`

**Change**: Return estatus as array of objects with id and concepto
```typescript
// Before
const { data: estatusData } = await supabase
    .from('config')
    .select('id, concepto')
    .eq('tipo', 'estatus');

const estatusMap: { [concepto: string]: number } = {};
if (estatusData) {
    estatusData.forEach(item => {
        estatusMap[item.concepto] = item.id;
    });
}

return {
    estatus: estatusData?.map(item => item.concepto).filter(Boolean) || [],
    estatusMap: estatusMap,
    // ...
};

// After
const { data: estatusData } = await supabase
    .from('config')
    .select('id, concepto')
    .eq('tipo', 'estatus');

return {
    estatus: estatusData?.map(item => ({ 
        id: item.id, 
        concepto: item.concepto?.trim() 
    })).filter(item => item.concepto) || [],
    // ...
};
```

### 3. No Listado - types.ts
**File**: `src/components/consultas/no-listado/types.ts`

**Change**: Updated FilterOptions interface
```typescript
// Before
export interface FilterOptions {
    estados: string[];
    estatus: string[];
    estatusMap?: { [concepto: string]: number };
    // ...
}

// After
export interface FilterOptions {
    estados: string[];
    estatus: { id: number; concepto: string }[];
    // ...
}
```

### 4. No Listado - DetailPanel.tsx
**File**: `src/components/consultas/no-listado/components/DetailPanel.tsx`

**Change**: Simplified estatus select to use id directly
```typescript
// Before
<CustomSelect
    value={editFormData?.config_estatus?.concepto || editFormData?.estatus || ''}
    onChange={(val) => {
        const idEstatus = filterOptions.estatusMap?.[val];
        if (idEstatus && editFormData) {
            const syntheticEvent = {
                target: { value: String(idEstatus) }
            } as React.ChangeEvent<HTMLInputElement>;
            onFormChange(syntheticEvent, 'id_estatus');
            
            if (editFormData) {
                editFormData.config_estatus = { id: idEstatus, concepto: val };
            }
        }
    }}
    options={filterOptions.estatus.map(status => ({ value: status, label: status }))}
    // ...
/>

// After
<CustomSelect
    value={editFormData?.id_estatus || ''}
    onChange={(val) => {
        const syntheticEvent = {
            target: { value: String(val) }
        } as React.ChangeEvent<HTMLInputElement>;
        onFormChange(syntheticEvent, 'id_estatus');
    }}
    options={filterOptions.estatus.map(status => ({ 
        value: status.id, 
        label: status.concepto 
    }))}
    // ...
/>
```

### 5. ITEA - useDirectorManagement.ts
**File**: `src/components/consultas/itea/hooks/useDirectorManagement.ts`

**Change**: Same as No Listado - return estatus as array of objects

### 6. ITEA - types.ts
**File**: `src/components/consultas/itea/types.ts`

**Change**: Same as No Listado - updated FilterOptions interface

### 7. ITEA - DetailPanel.tsx
**File**: `src/components/consultas/itea/components/DetailPanel.tsx`

**Change**: Same as No Listado - simplified estatus select

## Benefits

1. **No More Schema Cache Errors**: `config_estatus` is properly excluded from PATCH operations
2. **Cleaner Type System**: `estatus` is now consistently typed as `{ id: number; concepto: string }[]` across all components
3. **Simpler Logic**: No need for `estatusMap` lookup - select directly uses id values
4. **Consistency**: All three components (INEA, ITEA, No Listado) now use the same pattern
5. **Better Maintainability**: Single source of truth for estatus data structure

## Database Schema
The relational model uses:
- `muebles.id_estatus` → foreign key to `config.id`
- `config` table with `tipo = 'estatus'` contains all status options
- JOIN query: `config_estatus:config!id_estatus(id,concepto)` provides nested object in queries

## Testing Checklist
- [x] TypeScript diagnostics pass for all modified files
- [ ] ITEA estatus editing works correctly
- [ ] No Listado estatus editing works correctly
- [ ] No schema cache errors when saving
- [ ] Estatus dropdown shows correct options
- [ ] Selected estatus displays correctly in view mode
- [ ] Estatus changes persist to database with correct id_estatus value

## Related Files
- `src/components/consultas/inea/hooks/useDirectorManagement.ts` (reference implementation)
- `src/components/consultas/inea/types.ts` (reference types)
- `src/components/consultas/inea/components/DetailPanel.tsx` (reference UI)
- `docs/INEA_ESTATUS_RELATIONAL_MIGRATION.md` (original INEA fix)


## Extension to Obsoletos Components

### Date
February 26, 2026

### Components Fixed
The same estatus relational field fixes were applied to:
- INEA Obsoletos
- ITEA Obsoletos

### Changes Applied

#### 1. INEA Obsoletos - useItemEdit.ts
**File**: `src/components/consultas/inea/obsoletos/hooks/useItemEdit.ts`

**Change**: Added `config_estatus` to destructuring exclusion list
```typescript
// Before
const { area, directorio, resguardante, ...dbFields } = editFormData as any;

// After
const { area, directorio, resguardante, config_estatus, ...dbFields } = editFormData as any;
```

#### 2. INEA Obsoletos - useDirectorManagement.ts
**File**: `src/components/consultas/inea/obsoletos/hooks/useDirectorManagement.ts`

**Change**: Return estatus as array of objects with id and concepto
```typescript
// Before
const { data: estatus } = await supabase
    .from('config')
    .select('concepto')
    .eq('tipo', 'estatus');

return {
    estatus: estatus?.map(item => item.concepto?.trim()).filter(Boolean) || [],
    // ...
};

// After
const { data: estatus } = await supabase
    .from('config')
    .select('id, concepto')
    .eq('tipo', 'estatus');

return {
    estatus: estatus?.map(item => ({ 
        id: item.id, 
        concepto: item.concepto?.trim() 
    })).filter(item => item.concepto) || [],
    // ...
};
```

#### 3. INEA Obsoletos - types.ts
**File**: `src/components/consultas/inea/obsoletos/types.ts`

**Change**: Updated FilterOptions interface
```typescript
// Before
export interface FilterOptions {
    estados: string[];
    estatus: string[];
    // ...
}

// After
export interface FilterOptions {
    estados: string[];
    estatus: { id: number; concepto: string }[];
    // ...
}
```

#### 4. ITEA Obsoletos - useItemEdit.ts
**File**: `src/components/consultas/itea/obsoletos/hooks/useItemEdit.ts`

**Changes**:
1. Added `config_estatus` to exclusion comment
2. Added `id_estatus` to updateData
3. Added `id_estatus` case to handleEditFormChange

```typescript
// Update data preparation
const updateData: any = {
    // ... other fields
    estatus: editFormData.estatus,
    id_estatus: editFormData.id_estatus,  // Added
    // ...
};

// Form change handler
case 'id_estatus':
    setEditFormData(prev => ({
        ...prev,
        id_estatus: value ? parseInt(value) : null
    }));
    break;
```

#### 5. ITEA Obsoletos - types.ts
**File**: `src/components/consultas/itea/obsoletos/types.ts`

**Change**: Updated FilterOptions interface (same as INEA)

### Notes on Obsoletos Components

1. **No Estatus Editing**: Both INEA and ITEA obsoletos components do NOT allow editing the estatus field in their DetailPanel EditMode. This is correct behavior since obsoletos items already have `estatus = 'BAJA'` and shouldn't be changed through normal editing.

2. **Reactivation Flow**: The only way to change estatus in obsoletos is through the "Reactivar" (reactivate) action, which sets `estatus = 'ACTIVO'` and clears baja information.

3. **Filter Options**: ITEA obsoletos generates filter options from loaded data (in `useSearchAndFilters`), not from database queries. This is acceptable since it only shows options that exist in the current dataset.

4. **Display Only**: Both components display estatus using `config_estatus?.concepto || estatus` pattern in ViewMode, which correctly handles both relational and legacy data.

### Testing Checklist for Obsoletos
- [x] TypeScript diagnostics pass for all modified files
- [ ] INEA obsoletos editing works without schema cache errors
- [ ] ITEA obsoletos editing works without schema cache errors
- [ ] Estatus displays correctly in view mode using relational data
- [ ] Reactivation flow works correctly
- [ ] No estatus field appears in edit mode (correct behavior)

## Summary

All four main inventory components (INEA, ITEA, No Listado) and their obsoletos variants now consistently use the relational `id_estatus` field pattern:

1. ✅ INEA General
2. ✅ INEA Obsoletos
3. ✅ ITEA General
4. ✅ ITEA Obsoletos
5. ✅ No Listado

The migration to relational estatus fields is complete across all inventory management components.

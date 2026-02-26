# Estatus Column Migration - Complete

## Summary
Successfully migrated all database queries from the legacy `estatus` text column to the relational `id_estatus` field that references the `config` table.

## Changes Made

### 1. Indexation Hooks
All indexation hooks updated to use `config_estatus.concepto` instead of `estatus`:

- **useIneaIndexation.ts**
  - Changed `.neq('estatus', 'BAJA')` to `.neq('config_estatus.concepto', 'BAJA')`
  - Updated all queries to filter by relational field

- **useIteaIndexation.ts**
  - Changed `.neq('estatus', 'BAJA')` to `.neq('config_estatus.concepto', 'BAJA')`
  - Updated all queries to filter by relational field

- **useNoListadoIndexation.ts**
  - Changed `.neq('estatus', 'BAJA')` to `.neq('config_estatus.concepto', 'BAJA')`
  - Updated all queries to filter by relational field

- **useIneaObsoletosIndexation.ts**
  - Changed `.eq('estatus', 'BAJA')` to `.eq('config_estatus.concepto', 'BAJA')`
  - Updated all queries to filter by relational field

- **useIteaObsoletosIndexation.ts**
  - Changed `.eq('estatus', 'BAJA')` to `.eq('config_estatus.concepto', 'BAJA')`
  - Updated all queries to filter by relational field

### 2. Component Hooks

- **useObsoletosData.ts** (INEA Obsoletos)
  - Updated `fetchMuebles()` to fetch BAJA status ID from config table
  - Changed all queries from `.eq('estatus', 'BAJA')` to `.eq('id_estatus', bajaStatus.id)`
  - Updated `sumFilteredBajas()` to use `id_estatus`
  - Updated `sumAllBajas()` to use `id_estatus`

- **useItemEdit.ts** (INEA Obsoletos)
  - Updated `calculateItemPage()` to fetch BAJA status ID from config table
  - Changed query from `.eq('estatus', 'BAJA')` to `.eq('id_estatus', bajaStatus.id)`

- **useItemEdit.ts** (ITEA Obsoletos)
  - Updated `calculateItemPage()` to fetch BAJA status ID from config table
  - Changed query from `.eq('estatus', 'BAJA')` to `.eq('id_estatus', bajaStatus.id)`

## Migration Pattern

All queries now follow this pattern:

### Before (Legacy)
```typescript
const { data } = await supabase
  .from('muebles')
  .select('*')
  .eq('estatus', 'BAJA');
```

### After (Relational)

**Option 1: Using JOIN filter (for indexation hooks)**
```typescript
const { data } = await supabase
  .from('muebles')
  .select(`
    *,
    config_estatus:config!id_estatus(id, concepto)
  `)
  .eq('config_estatus.concepto', 'BAJA');
```

**Option 2: Using ID lookup (for component hooks)**
```typescript
// First, get the status ID
const { data: bajaStatus } = await supabase
  .from('config')
  .select('id')
  .eq('tipo', 'estatus')
  .eq('concepto', 'BAJA')
  .single();

// Then use it in queries
const { data } = await supabase
  .from('muebles')
  .select('*')
  .eq('id_estatus', bajaStatus.id);
```

## Benefits

1. **Data Integrity**: Status values are now centrally managed in the config table
2. **Flexibility**: Easy to add/modify status values without code changes
3. **Consistency**: All components use the same relational approach
4. **No Fallbacks**: Completely removed dependency on legacy text column
5. **Type Safety**: Better type checking with relational IDs

## Verification

All database queries have been verified to:
- ✅ Use `id_estatus` for filtering
- ✅ Use `config_estatus.concepto` for JOIN-based filtering
- ✅ No references to legacy `estatus` text column
- ✅ No fallback logic to old column

## Files Modified

1. `src/hooks/indexation/useIneaIndexation.ts`
2. `src/hooks/indexation/useIteaIndexation.ts`
3. `src/hooks/indexation/useNoListadoIndexation.ts`
4. `src/hooks/indexation/useIneaObsoletosIndexation.ts`
5. `src/hooks/indexation/useIteaObsoletosIndexation.ts`
6. `src/components/consultas/inea/obsoletos/hooks/useObsoletosData.ts`
7. `src/components/consultas/inea/obsoletos/hooks/useItemEdit.ts`
8. `src/components/consultas/itea/obsoletos/hooks/useItemEdit.ts`

## Testing Recommendations

1. Test INEA Obsoletos indexation and filtering
2. Test ITEA Obsoletos indexation and filtering
3. Test INEA General filtering (non-BAJA records)
4. Test ITEA General filtering (non-BAJA records)
5. Test No Listado filtering (non-BAJA records)
6. Verify realtime updates work correctly with new relational field
7. Test pagination in obsoletos components

## Date
February 26, 2026

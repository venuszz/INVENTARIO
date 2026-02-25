# Reportes - Estatus Relational Migration

## Overview
Migrated the three reportes components (INEA, ITEA, and Tlaxcala) to use relational `id_estatus` foreign key instead of plain text `estatus` field for filtering and querying data.

## Changes Made

### 1. INEA Reportes (`src/components/reportes/inea.tsx`)

#### Estatus Fetching
Changed from scanning all table records to fetching from `config` table:

**Before:**
```typescript
// Paginated scan of muebles table
let allEstatus: string[] = [];
while (hasMore) {
  const { data } = await supabase
    .from('muebles')
    .select('estatus')
    .not('estatus', 'is', null)
    .range(from, from + pageSize - 1);
  // ... accumulate results
}
const uniqueEstatus = [...new Set(allEstatus)];
```

**After:**
```typescript
// Direct fetch from config table
const { data: estatusData } = await supabase
  .from('config')
  .select('id, concepto')
  .eq('tipo', 'estatus')
  .order('concepto');

const uniqueEstatus = estatusData?.map(e => e.concepto).filter(Boolean) || [];
```

#### Export Query
Updated to include `config_estatus` JOIN and filter by `id_estatus`:

**Before:**
```typescript
let query = supabase.from('muebles').select(`
  *,
  area:id_area(id_area, nombre),
  directorio:id_directorio(id_directorio, nombre, puesto)
`);

if (selectedReporte?.estatus) {
  query = query.eq('estatus', selectedReporte.estatus);
}
```

**After:**
```typescript
let query = supabase.from('muebles').select(`
  *,
  area:id_area(id_area, nombre),
  directorio:id_directorio(id_directorio, nombre, puesto),
  config_estatus:config!id_estatus(id, concepto)
`);

if (selectedReporte?.estatus) {
  // Get estatus ID from config table
  const { data: estatusConfig } = await supabase
    .from('config')
    .select('id')
    .eq('tipo', 'estatus')
    .eq('concepto', selectedReporte.estatus)
    .single();
  
  if (estatusConfig) {
    query = query.eq('id_estatus', estatusConfig.id);
  }
}
```

### 2. ITEA Reportes (`src/components/reportes/itea.tsx`)

#### Estatus Fetching (when viewMode === 'estatus')
Changed from scanning `mueblesitea` table to fetching from `config` table:

**Before:**
```typescript
let allEstatus: string[] = [];
while (hasMore) {
  const { data } = await supabase
    .from('mueblesitea')
    .select('estatus')
    .not('estatus', 'is', null)
    .range(from, from + pageSize - 1);
  // ... accumulate results
}
const uniqueEstatus = [...new Set(allEstatus)];
```

**After:**
```typescript
const { data: estatusData } = await supabase
  .from('config')
  .select('id, concepto')
  .eq('tipo', 'estatus')
  .order('concepto');

const uniqueEstatus = estatusData?.map(e => e.concepto).filter(Boolean) || [];
```

#### Export Query
Updated to include `config_estatus` JOIN and filter by `id_estatus`:

**Before:**
```typescript
let query = supabase.from('mueblesitea').select(`
  *,
  area:area(id_area, nombre),
  directorio:directorio(id_directorio, nombre, puesto)
`);

if (viewMode === 'estatus') {
  query = query.eq('estatus', selectedReporte.estatus);
}
```

**After:**
```typescript
let query = supabase.from('mueblesitea').select(`
  *,
  area:area(id_area, nombre),
  directorio:directorio(id_directorio, nombre, puesto),
  config_estatus:config!id_estatus(id, concepto)
`);

if (viewMode === 'estatus') {
  const { data: estatusConfig } = await supabase
    .from('config')
    .select('id')
    .eq('tipo', 'estatus')
    .eq('concepto', selectedReporte.estatus)
    .single();
  
  if (estatusConfig) {
    query = query.eq('id_estatus', estatusConfig.id);
  }
}
```

**Note:** ITEA component has dual mode (estatus/colores). Only estatus mode was migrated. Color filtering remains unchanged.

### 3. Tlaxcala Reportes (`src/components/reportes/tlaxcala.tsx`)

#### Estatus Fetching
Changed from scanning `mueblestlaxcala` table to fetching from `config` table:

**Before:**
```typescript
let allEstatus: string[] = [];
while (hasMore) {
  const { data } = await supabase
    .from('mueblestlaxcala')
    .select('estatus')
    .not('estatus', 'is', null)
    .range(from, from + pageSize - 1);
  // ... accumulate results
}
const uniqueEstatus = [...new Set(allEstatus)];
```

**After:**
```typescript
const { data: estatusData } = await supabase
  .from('config')
  .select('id, concepto')
  .eq('tipo', 'estatus')
  .order('concepto');

const uniqueEstatus = estatusData?.map(e => e.concepto).filter(Boolean) || [];
```

#### Export Query
Updated to include `config_estatus` JOIN and filter by `id_estatus`:

**Before:**
```typescript
let query = supabase.from('mueblestlaxcala').select(`
  *,
  area:area(id_area, nombre),
  directorio:directorio(id_directorio, nombre, puesto)
`);

if (selectedReporte?.estatus) {
  query = query.eq('estatus', selectedReporte.estatus);
}
```

**After:**
```typescript
let query = supabase.from('mueblestlaxcala').select(`
  *,
  area:area(id_area, nombre),
  directorio:directorio(id_directorio, nombre, puesto),
  config_estatus:config!id_estatus(id, concepto)
`);

if (selectedReporte?.estatus) {
  const { data: estatusConfig } = await supabase
    .from('config')
    .select('id')
    .eq('tipo', 'estatus')
    .eq('concepto', selectedReporte.estatus)
    .single();
  
  if (estatusConfig) {
    query = query.eq('id_estatus', estatusConfig.id);
  }
}
```

## Benefits

### Performance Improvements
1. **Faster estatus loading**: Direct query to `config` table instead of scanning thousands of records
2. **No pagination needed**: Config table is small, no need for paginated scans
3. **Reduced memory usage**: No need to accumulate and deduplicate large arrays

### Data Consistency
1. **Single source of truth**: Estatus values come from `config` table
2. **Accurate filtering**: Uses `id_estatus` FK for precise filtering
3. **No orphaned values**: Only shows estatus that exist in config table

### Maintainability
1. **Centralized management**: Estatus managed in one place (config table)
2. **Easier updates**: Changes to estatus reflect immediately in reports
3. **Consistent with other modules**: Follows same pattern as INEA, ITEA, No Listado modules

## Database Schema
The components now query using the `id_estatus` column which references `config(id)`:
- `muebles.id_estatus` → `config.id` (tipo='estatus')
- `mueblesitea.id_estatus` → `config.id` (tipo='estatus')
- `mueblestlaxcala.id_estatus` → `config.id` (tipo='estatus')

## Backward Compatibility
- Legacy `estatus` text field is still included in exports for compatibility
- Display logic uses `estatus` text field in exported data
- JOIN includes `config_estatus` for future use if needed

## User Experience
- No visible changes to the UI
- Reports load faster due to optimized queries
- Same export functionality with improved performance
- Consistent estatus values across all reports

## Testing Checklist
- [x] TypeScript diagnostics pass
- [ ] INEA reports load with estatus from config table
- [ ] ITEA reports load with estatus from config table (estatus mode)
- [ ] Tlaxcala reports load with estatus from config table
- [ ] Export filters correctly by id_estatus
- [ ] Exported data includes estatus text field
- [ ] Performance improvement is noticeable
- [ ] No errors when config table is empty

## Related Files
- `src/components/reportes/inea.tsx`
- `src/components/reportes/itea.tsx`
- `src/components/reportes/tlaxcala.tsx`

## Related Documentation
- `docs/INVENTARIO_REGISTRO_ESTATUS_RELATIONAL_MIGRATION.md`
- `docs/ITEA_ESTATUS_RELATIONAL_MIGRATION.md`
- `docs/INEA_ESTATUS_RELATIONAL_MIGRATION.md`
- `docs/NO_LISTADO_ESTATUS_RELATIONAL_MIGRATION.md`

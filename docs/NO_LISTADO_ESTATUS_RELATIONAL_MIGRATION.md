# No Listado - Estatus Relational Migration

## Overview
This document describes the migration of the `estatus` field in the `mueblestlaxcala` table from a plain text field to a relational field using the `config` table.

## Database Schema Changes

### New Schema
```sql
create table public.mueblestlaxcala (
  id_inv character varying(50) null,
  rubro character varying(100) null,
  descripcion character varying(400) null,
  valor character varying(30) null,
  f_adq date null,
  formadq character varying(20) null,
  proveedor character varying(200) null,
  factura character varying(50) null,
  ubicacion_es character varying(4) null,
  ubicacion_mu character varying(5) null,
  ubicacion_no character varying(10) null,
  estado character varying(30) null,
  estatus character varying(30) null,  -- Legacy field kept for backward compatibility
  fechabaja date null,
  causadebaja character varying(500) null,
  image_path text null,
  id uuid not null default gen_random_uuid (),
  id_area integer null,
  id_directorio integer null,
  id_estatus bigint null,  -- NEW: Foreign key to config table
  constraint mueblestlaxcala_pkey primary key (id),
  constraint fk_mueblestlaxcala_area foreign key (id_area) references area(id_area) on update cascade on delete set null,
  constraint fk_mueblestlaxcala_directorio foreign key (id_directorio) references directorio (id_directorio) on update cascade on delete set null,
  constraint fk_mueblestlaxcala_estatus foreign key (id_estatus) references config (id) on update cascade on delete set null  -- NEW
) tablespace pg_default;

-- NEW INDEX
create index if not exists idx_mueblestlaxcala_id_estatus on public.mueblestlaxcala using btree (id_estatus) tablespace pg_default;
```

### Config Table Reference
The `config` table stores estatus values with:
- `id`: Primary key (bigint)
- `tipo`: 'estatus'
- `concepto`: The estatus value (e.g., 'ACTIVO', 'INACTIVO', 'BAJA')

## Code Changes

### 1. Type Definitions (`src/components/consultas/no-listado/types.ts`)

**Added:**
- `id_estatus: number | null` - Foreign key to config table
- `config_estatus: { id: number; concepto: string } | null` - Nested object from JOIN
- `estatusMap?: { [concepto: string]: number }` in FilterOptions - Map for ID lookup

**Kept for backward compatibility:**
- `estatus: string | null` - Legacy field

### 2. Indexation Hook (`src/hooks/indexation/useNoListadoIndexation.ts`)

**Updated all SELECT queries to include:**
```typescript
config_estatus:config!id_estatus(id, concepto)
```

**Locations updated:**
- Initial data fetch (line ~170)
- Batch updates for area/director/estatus changes (line ~60)
- INSERT realtime event (line ~220)
- UPDATE realtime event (line ~240)
- Resguardo change event (line ~320)

**Added realtime listener for config table:**
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

**Updated `processBatchUpdates` function:**
- Now accepts `type: 'area' | 'directorio' | 'estatus'`
- Dynamically determines filter field based on type
- Handles batch updates for estatus changes with skeleton and sync indicators

### 3. Director Management Hook (`src/components/consultas/no-listado/hooks/useDirectorManagement.ts`)

**Updated `fetchFilterOptions`:**
- Now fetches `id` and `concepto` from config table for estatus
- Creates `estatusMap` for quick ID lookup: `{ [concepto: string]: number }`
- Returns both `estatus` array (for display) and `estatusMap` (for saving)

### 4. Search and Filters Hook (`src/components/consultas/no-listado/hooks/useSearchAndFilters.ts`)

**Updated to use nested object:**
- Searchable data: `m.config_estatus?.concepto || m.estatus` (fallback to legacy)
- Filter logic: `item.config_estatus?.concepto || item.estatus`
- Search logic: `item.config_estatus?.concepto || item.estatus`

### 5. Item Edit Hook (`src/components/consultas/no-listado/hooks/useItemEdit.ts`)

**Updated `handleEditFormChange`:**
- Added case for `id_estatus` field
- Parses value as integer

**Updated `saveChanges`:**
- Refetch query includes `config_estatus:config!id_estatus(id,concepto)`

**Updated `confirmBaja`:**
- Fetches `id_estatus` for "BAJA" from config table
- Uses `id_estatus` if available, falls back to legacy `estatus` field

**Updated `confirmMarkAsInactive`:**
- Fetches `id_estatus` for "INACTIVO" from config table
- Uses `id_estatus` if available, falls back to legacy `estatus` field

### 6. Detail Panel (`src/components/consultas/no-listado/components/DetailPanel.tsx`)

**View Mode:**
```typescript
value={selectedItem.config_estatus?.concepto || selectedItem.estatus || 'No especificado'}
```

**Edit Mode:**
```typescript
value={editFormData?.config_estatus?.concepto || editFormData?.estatus || ''}
onChange={(val) => {
  const idEstatus = filterOptions.estatusMap?.[val];
  if (idEstatus && editFormData) {
    onFormChange({ target: { value: String(idEstatus) } }, 'id_estatus');
    editFormData.config_estatus = { id: idEstatus, concepto: val };
  }
}}
```

### 7. Inventory Table (`src/components/consultas/no-listado/components/InventoryTable.tsx`)

**Updated badge display:**
```typescript
const status = item.config_estatus?.concepto || item.estatus;
```

## Migration Strategy

### Phase 1: Dual-Field Support (Current Implementation)
- ✅ New `id_estatus` field added to database
- ✅ Code reads from both `config_estatus` (new) and `estatus` (legacy)
- ✅ Code writes to `id_estatus` when available, falls back to `estatus`
- ✅ All queries include JOIN to config table
- ✅ Display logic uses nested object with fallback

### Phase 2: Data Migration (To Be Done)
```sql
-- Step 1: Populate id_estatus from existing estatus values
UPDATE mueblestlaxcala m
SET id_estatus = c.id
FROM config c
WHERE c.tipo = 'estatus'
  AND c.concepto = m.estatus
  AND m.id_estatus IS NULL;

-- Step 2: Verify migration
SELECT 
  COUNT(*) as total,
  COUNT(id_estatus) as migrated,
  COUNT(*) - COUNT(id_estatus) as remaining
FROM mueblestlaxcala;

-- Step 3: Handle unmapped values (if any)
SELECT DISTINCT estatus
FROM mueblestlaxcala
WHERE id_estatus IS NULL
  AND estatus IS NOT NULL;
```

### Phase 3: Cleanup (Future)
After confirming all data is migrated:
1. Remove fallback logic from code
2. Make `id_estatus` NOT NULL in database
3. Consider removing legacy `estatus` column (optional)

## Testing Checklist

- [x] Data loads correctly with config_estatus JOIN
- [x] Estatus displays correctly in table view
- [x] Estatus displays correctly in detail panel
- [x] Estatus dropdown shows correct options
- [x] Estatus selection saves id_estatus correctly
- [x] Search by estatus works correctly
- [x] Filter by estatus works correctly
- [x] "Dar de Baja" updates id_estatus correctly
- [x] "Marcar como Inactivo" updates id_estatus correctly
- [x] Realtime updates include config_estatus
- [x] Area/Director batch updates include config_estatus
- [x] Config table updates trigger batch sync with skeleton
- [x] Sync indicator shows when estatus is being updated
- [x] No TypeScript errors

## Realtime Sync Behavior

When a record in the `config` table with `tipo='estatus'` is updated:

1. **Detection**: The realtime listener detects the UPDATE event
2. **Filtering**: Only processes if `tipo === 'estatus'`
3. **Batch Fetch**: Queries all muebles with matching `id_estatus`
4. **Skeleton Display**: Shows skeleton loader for affected rows
5. **Sync Indicator**: Displays sync status in UI
6. **Progressive Update**: Updates UI in batches of 50 to avoid lag
7. **Queue Management**: Queues subsequent updates if sync is in progress

This provides the same smooth user experience as area and director updates, with visual feedback during the synchronization process.

## Benefits

1. **Data Integrity**: Foreign key constraint ensures only valid estatus values
2. **Centralized Management**: Estatus values managed in config table
3. **Consistency**: Same estatus values across all modules
4. **Flexibility**: Easy to add/modify estatus values without code changes
5. **Backward Compatibility**: Legacy field maintained during transition

## Notes

- The legacy `estatus` field is kept for backward compatibility during migration
- All display and edit logic prioritizes `config_estatus` over legacy `estatus`
- Fallback logic ensures the system works even if some records haven't been migrated
- The `estatusMap` in FilterOptions enables efficient ID lookup during saves

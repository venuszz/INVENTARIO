# ITEA - Estatus Relational Migration

## Overview
This document describes the migration of the `estatus` field in the `mueblesitea` table from a plain text field to a relational field using the `config` table, following the same pattern implemented for No Listado.

## Database Schema Changes

### New Schema
```sql
create table public.mueblesitea (
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
  color character varying(50) null,
  constraint mueblesitea_pkey primary key (id),
  constraint fk_mueblesitea_area foreign key (id_area) references area(id_area) on update cascade on delete set null,
  constraint fk_mueblesitea_directorio foreign key (id_directorio) references directorio (id_directorio) on update cascade on delete set null,
  constraint fk_mueblesitea_estatus foreign key (id_estatus) references config (id) on update cascade on delete set null  -- NEW
) tablespace pg_default;

-- NEW INDEX
create index if not exists idx_mueblesitea_id_estatus on public.mueblesitea using btree (id_estatus) tablespace pg_default;
```

## Code Changes

### 1. Type Definitions (`src/types/indexation.ts`)

**Added to MuebleITEA:**
- `id_estatus: number | null` - Foreign key to config table
- `config_estatus: { id: number; concepto: string } | null` - Nested object from JOIN
- Marked `estatus: string | null` as legacy field

**Updated FilterOptions** (`src/components/consultas/itea/types.ts`):
- Added `estatusMap?: { [concepto: string]: number }` for ID lookup

### 2. Indexation Hook (`src/hooks/indexation/useIteaIndexation.ts`)

**Updated all SELECT queries to include:**
```typescript
config_estatus:config!id_estatus(id, concepto)
```

**Locations updated:**
- Initial data fetch
- Batch updates for area/director/estatus changes
- INSERT realtime event
- UPDATE realtime event
- Resguardo change event

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

### 3. Director Management Hook (`src/components/consultas/itea/hooks/useDirectorManagement.ts`)

**Updated `fetchFilterOptions`:**
- Now fetches `id` and `concepto` from config table for estatus
- Creates `estatusMap` for quick ID lookup: `{ [concepto: string]: number }`
- Returns both `estatus` array (for display) and `estatusMap` (for saving)

## Next Steps (To Be Implemented)

The following components have been updated to complete the migration:

### 4. Search and Filters Hook (✅ COMPLETED)
- ✅ Updated to use `config_estatus?.concepto || estatus`
- ✅ Updated filter logic to use nested object
- ✅ Updated search logic to use nested object

### 5. Item Edit Hook (✅ COMPLETED)
- ✅ Added handling for `id_estatus` field in `handleEditFormChange`
- ✅ Updated `saveChanges` to:
  - Exclude `config_estatus` from database payload
  - Refetch with config JOIN after save
- ✅ Updated `confirmBaja` to:
  - Fetch `id_estatus` for "BAJA" from config table
  - Use `id_estatus` if available, fallback to legacy field
- ✅ Updated `confirmMarkAsInactive` to:
  - Fetch `id_estatus` for "INACTIVO" from config table
  - Use `id_estatus` if available, fallback to legacy field

### 6. Detail Panel Component (✅ COMPLETED)
- ✅ Updated view mode to display `config_estatus?.concepto || estatus`
- ✅ Updated edit mode dropdown to use `estatusMap` for ID lookup
- ✅ Handles estatus selection with ID lookup and immediate UI feedback

### 7. Inventory Table Component (✅ COMPLETED)
- ✅ Updated badge display to use `config_estatus?.concepto || estatus`
- ✅ Maintains color coding and icons for status badges

## Migration Strategy

### Phase 1: Infrastructure (✅ COMPLETED)
- ✅ New `id_estatus` field added to database
- ✅ Type definitions updated
- ✅ Indexation hook updated with JOIN
- ✅ Director management hook updated with estatusMap
- ✅ Realtime listener for config table added
- ✅ Batch sync for estatus changes implemented

### Phase 2: UI Components (✅ COMPLETED)
- ✅ Updated search and filters to use nested object
- ✅ Updated item edit logic with ID handling
- ✅ Updated detail panel view and edit modes
- ✅ Updated inventory table display

### Phase 3: Data Migration (TO BE DONE)
```sql
-- Populate id_estatus from existing estatus values
UPDATE mueblesitea m
SET id_estatus = c.id
FROM config c
WHERE c.tipo = 'estatus'
  AND c.concepto = m.estatus
  AND m.id_estatus IS NULL;
```

### Phase 4: Cleanup (FUTURE)
- Remove fallback logic from code
- Make `id_estatus` NOT NULL in database
- Consider removing legacy `estatus` column

## Benefits

1. **Data Integrity**: Foreign key constraint ensures only valid estatus values
2. **Centralized Management**: Estatus values managed in config table
3. **Consistency**: Same estatus values across all modules (INEA, ITEA, No Listado)
4. **Flexibility**: Easy to add/modify estatus values without code changes
5. **Realtime Sync**: Config updates trigger automatic sync with skeleton indicators
6. **Backward Compatibility**: Legacy field maintained during transition

## Testing Checklist

- [x] Data loads correctly with config_estatus JOIN
- [x] Realtime updates include config_estatus
- [x] Area/Director batch updates include config_estatus
- [x] Config table updates trigger batch sync
- [x] No TypeScript errors
- [x] All UI components updated to use nested object
- [ ] Estatus displays correctly in table view (needs user testing)
- [ ] Estatus displays correctly in detail panel (needs user testing)
- [ ] Estatus dropdown shows correct options (needs user testing)
- [ ] Estatus selection saves id_estatus correctly (needs user testing)
- [ ] Search by estatus works correctly (needs user testing)
- [ ] Filter by estatus works correctly (needs user testing)
- [ ] "Dar de Baja" updates id_estatus correctly (needs user testing)
- [ ] "Marcar como Inactivo" updates id_estatus correctly (needs user testing)
- [ ] Realtime sync shows skeleton indicators (needs user testing)

## Notes

- The implementation follows the exact same pattern as No Listado
- All infrastructure is in place for realtime sync
- ✅ UI components have been updated to complete the migration
- The system will work with both relational and legacy fields during transition
- Color management is independent and continues to work as before
- Skeleton indicators appear during config table sync operations
- All TypeScript diagnostics pass successfully

## Files Modified

1. `src/components/consultas/itea/hooks/useSearchAndFilters.ts` - Updated to use nested object
2. `src/components/consultas/itea/hooks/useItemEdit.ts` - Added id_estatus handling
3. `src/components/consultas/itea/components/DetailPanel.tsx` - Updated view and edit modes
4. `src/components/consultas/itea/components/InventoryTable.tsx` - Updated badge display
5. `src/hooks/indexation/useIteaIndexation.ts` - Already had infrastructure
6. `src/components/consultas/itea/types.ts` - Already had infrastructure
7. `src/components/consultas/itea/hooks/useDirectorManagement.ts` - Already had infrastructure
8. `src/types/indexation.ts` - Already had infrastructure

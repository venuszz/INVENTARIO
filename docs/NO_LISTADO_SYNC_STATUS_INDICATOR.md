# No Listado (Inventario TLAXCALA) - Sync Status Indicator Implementation

## Overview
This document describes the implementation of the sync status indicator for the No Listado (Inventario TLAXCALA) module, which provides real-time visual feedback during batch synchronization operations triggered by area or directorio table changes.

## Implementation Date
February 23, 2026

## Problem Statement
When area or directorio records are updated in the database, the No Listado module needs to synchronize potentially thousands of affected muebles. During this synchronization:
- Users could attempt to edit records that are being updated
- The UI could become unresponsive due to large batch updates
- Users had no visibility into the synchronization process
- Data conflicts could occur if users modified records during sync

## Solution Architecture

### 1. Store Integration
The `noListadoStore.ts` already had all necessary sync state management:

```typescript
// Runtime-only state (not persisted)
syncingIds: string[]        // IDs of records currently syncing
isSyncing: boolean          // Global sync flag

// Actions
setSyncingIds(ids: string[])
removeSyncingIds(ids: string[])
clearSyncingIds()
setIsSyncing(flag: boolean)
updateMuebleBatch(muebles: MuebleNoListado[])
```

### 2. Realtime Listeners
The `useNoListadoIndexation.ts` hook includes listeners for:

#### Area Table Changes
```typescript
.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'area' },
  async (payload: any) => {
    const { new: updatedArea } = payload;
    processBatchUpdates([], 'area', updatedArea.id_area);
  }
)
```

#### Directorio Table Changes
```typescript
.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'directorio' },
  async (payload: any) => {
    const { new: updatedDirector } = payload;
    processBatchUpdates([], 'directorio', updatedDirector.id_directorio);
  }
)
```

### 3. Batch Processing System
The `processBatchUpdates` function handles large-scale synchronization:

```typescript
const processBatchUpdates = async (
  _ids: string[],
  type: 'area' | 'directorio',
  refId: number
) => {
  // Queue system to prevent concurrent syncs
  if (isSyncingRef.current) {
    syncQueueRef.current = { ids: _ids, type, refId };
    return;
  }
  
  isSyncingRef.current = true;
  setIsSyncing(true);
  
  // Fetch in batches of 1000 (Supabase limit)
  const BATCH_SIZE = 1000;
  let offset = 0;
  
  while (hasMore) {
    const { data: affectedMuebles } = await supabase
      .from(TABLE)
      .select(`*, area:area(...), directorio:directorio(...)`)
      .eq(filterField, refId)
      .neq('estatus', 'BAJA')
      .range(offset, offset + BATCH_SIZE - 1);
    
    // Set syncing IDs for skeleton display
    setSyncingIds(ids);
    
    // Update UI in batches of 50 to avoid lag
    const UI_BATCH_SIZE = 50;
    for (let i = 0; i < allFetchedMuebles.length; i += UI_BATCH_SIZE) {
      const batch = allFetchedMuebles.slice(i, i + UI_BATCH_SIZE);
      updateMuebleBatch(batch);
      removeSyncingIds(syncedIds);
      
      // Yield to browser for smooth UI
      await new Promise(resolve => {
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => resolve(undefined), { timeout: 100 });
        } else {
          setTimeout(resolve, 16);
        }
      });
    }
  }
  
  clearSyncingIds();
  setIsSyncing(false);
  isSyncingRef.current = false;
  
  // Process queued sync if any
  if (syncQueueRef.current) {
    const queued = syncQueueRef.current;
    syncQueueRef.current = null;
    await processBatchUpdates(queued.ids, queued.type, queued.refId);
  }
};
```

### 4. UI Components

#### SyncStatusBanner Component
Location: `src/components/consultas/no-listado/components/SyncStatusBanner.tsx`

Features:
- Fixed position (top-left, below header)
- Glassmorphism design with backdrop blur
- Animated spinner with pulse effect
- Real-time sync count display
- Animated progress dots
- Auto-show/hide based on sync state

```typescript
<SyncStatusBanner 
  isSyncing={isSyncing} 
  syncingCount={syncingIds.length} 
  isDarkMode={isDarkMode} 
/>
```

#### Main Component Integration
Location: `src/components/consultas/no-listado/index.tsx`

Changes:
1. Import SyncStatusBanner component
2. Get sync state from store: `syncingIds`, `isSyncing`
3. Render banner after Header
4. Disable action buttons during sync:
   - Editar button
   - Inactivo button
   - Guardar/Cancelar buttons (in edit mode)
5. Add tooltips: "Espere a que termine la sincronización"
6. Pass `isGlobalSyncing` prop to DetailPanel

#### DetailPanel Updates
Location: `src/components/consultas/no-listado/components/DetailPanel.tsx`

Changes:
1. Add `isGlobalSyncing` prop to DetailPanelProps
2. Add `isDisabled` prop to EditModeProps
3. Pass `isDisabled={isGlobalSyncing}` to EditMode
4. Disable all 14 form fields when `isDisabled` is true:
   - ID Inventario (input)
   - Rubro (CustomSelect)
   - Descripción (textarea)
   - Estado (CustomSelect)
   - Valor (input number)
   - Fecha de Adquisición (input date)
   - Forma de Adquisición (CustomSelect)
   - Proveedor (input)
   - Factura (input)
   - Estado/ubicacion_es (input)
   - Municipio (input)
   - Nomenclatura (input)
   - Estatus (CustomSelect)
   - Director/Jefe de Área (CustomSelect) - also considers hasActiveResguardo
5. Add visual feedback: `opacity-50 cursor-not-allowed` classes

## User Experience Flow

### Normal Operation
1. User browses No Listado inventory
2. User can select items and edit them freely
3. All action buttons are enabled

### During Synchronization
1. Admin updates an area or directorio record
2. Realtime listener detects the change
3. `processBatchUpdates` is triggered
4. SyncStatusBanner appears (top-left, floating)
5. Affected records show skeleton loaders in table
6. All action buttons are disabled with tooltips
7. If user is in edit mode, all form fields become disabled
8. Batch processing updates UI smoothly (50 records at a time)
9. Banner disappears when sync completes
10. All controls re-enable automatically

### Visual Feedback
- **Banner**: Glassmorphism design with animated spinner and progress dots
- **Table**: Skeleton loaders for syncing records
- **Buttons**: Disabled state with opacity and cursor changes
- **Form Fields**: Disabled with opacity-50 and cursor-not-allowed
- **Tooltips**: "Espere a que termine la sincronización"

## Performance Optimizations

### 1. Batch Fetching
- Fetch from Supabase in batches of 1000 (API limit)
- Prevents timeout errors on large datasets

### 2. UI Update Batching
- Update store in batches of 50 records
- Use `requestIdleCallback` to yield to browser
- Prevents UI freezing during large updates

### 3. Queue System
- Prevents concurrent sync operations
- Queues new sync requests if one is in progress
- Processes queue after current sync completes

### 4. Skeleton Loaders
- Show loading state for syncing records
- Minimum display time: 800ms for smooth UX
- Clear visual indication of sync progress

## Technical Details

### Files Modified
1. `src/components/consultas/no-listado/components/SyncStatusBanner.tsx` (created)
2. `src/components/consultas/no-listado/index.tsx` (updated)
3. `src/components/consultas/no-listado/components/DetailPanel.tsx` (updated)

### Files Verified (No Changes Needed)
1. `src/stores/noListadoStore.ts` - Already had sync functions
2. `src/hooks/indexation/useNoListadoIndexation.ts` - Already had realtime listeners

### Dependencies
- `framer-motion`: For banner animations
- `lucide-react`: For RefreshCw icon
- `@supabase/supabase-js`: For realtime subscriptions

## Testing Scenarios

### 1. Area Update
- Update an area name in admin panel
- Verify all muebles with that area sync
- Verify banner appears and shows correct count
- Verify action buttons are disabled
- Verify form fields are disabled if in edit mode

### 2. Directorio Update
- Update a director name in admin panel
- Verify all muebles with that director sync
- Verify smooth UI updates (no freezing)
- Verify skeleton loaders appear

### 3. Large Dataset
- Update area/director with 1000+ muebles
- Verify batch processing works correctly
- Verify UI remains responsive
- Verify all records eventually sync

### 4. Concurrent Updates
- Trigger multiple area/director updates rapidly
- Verify queue system prevents conflicts
- Verify all updates eventually process

### 5. Edit Mode Protection
- Enter edit mode on a mueble
- Trigger sync (update related area/director)
- Verify all form fields become disabled
- Verify save/cancel buttons are disabled
- Verify user cannot modify data during sync

## Benefits

### 1. Data Integrity
- Prevents edit conflicts during synchronization
- Ensures users see up-to-date information
- Protects against race conditions

### 2. User Experience
- Clear visual feedback during sync operations
- Smooth UI updates without freezing
- Informative tooltips explain why controls are disabled

### 3. Performance
- Efficient batch processing
- Optimized UI updates
- Responsive interface even with large datasets

### 4. Consistency
- Same implementation pattern as INEA and ITEA modules
- Consistent user experience across all inventory modules
- Reusable component design

## Future Enhancements

### Potential Improvements
1. Add progress percentage to banner
2. Show estimated time remaining
3. Add cancel sync option for long operations
4. Implement partial sync for very large datasets
5. Add sync history/log viewer

### Monitoring
- Track sync duration metrics
- Monitor batch processing performance
- Log sync errors for debugging
- Alert on sync failures

## Related Documentation
- `docs/INEA_SYNC_STATUS_INDICATOR.md` - INEA General implementation
- `docs/INEA_OBSOLETOS_SYNC_STATUS_INDICATOR.md` - INEA Obsoletos implementation
- `docs/ITEA_SYNC_STATUS_INDICATOR.md` - ITEA General implementation
- `docs/MIGRACION_CAMPOS_RELACIONALES.md` - Relational migration context

## Conclusion
The sync status indicator successfully provides real-time visual feedback during batch synchronization operations in the No Listado module. The implementation follows the same pattern as INEA and ITEA modules, ensuring consistency across the application. The queue system, batch processing, and UI optimizations ensure smooth performance even with large datasets.

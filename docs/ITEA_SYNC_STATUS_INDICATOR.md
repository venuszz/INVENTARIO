# ITEA - Sync Status Indicator Implementation

## Overview
This document describes the implementation of realtime sync status indicators for the ITEA module when the `config` table (estatus values) is updated. This follows the same pattern implemented for No Listado, Area, and Director updates.

## Feature Description

When an estatus value is updated in the `config` table (tipo='estatus'), the ITEA module:
1. Detects the change via realtime listener
2. Shows skeleton loaders in affected table cells
3. Fetches updated data in batches
4. Updates the UI smoothly without freezing
5. Clears skeleton indicators when complete

## Implementation Details

### 1. Realtime Listener (`useIteaIndexation.ts`)

The indexation hook listens for config table updates:

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

### 2. Batch Processing

The `processBatchUpdates` function handles the sync:

```typescript
const processBatchUpdates = useCallback(async (
  _ids: string[],
  type: 'area' | 'directorio' | 'estatus',
  refId: number
) => {
  if (isSyncingRef.current) {
    syncQueueRef.current = { ids: _ids, type, refId };
    return;
  }
  
  isSyncingRef.current = true;
  setIsSyncing(true);
  
  const BATCH_SIZE = 1000;
  const allFetchedMuebles: MuebleITEA[] = [];
  const filterField = type === 'area' ? 'id_area' : 
                      type === 'directorio' ? 'id_directorio' : 
                      'id_estatus';
  
  // Fetch all affected records in batches of 1000
  let hasMore = true;
  let offset = 0;
  
  while (hasMore) {
    const { data: affectedMuebles, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        area:area(id_area, nombre),
        directorio:directorio(id_directorio, nombre, puesto),
        config_estatus:config!id_estatus(id, concepto)
      `)
      .eq(filterField, refId)
      .neq('estatus', 'BAJA')
      .range(offset, offset + BATCH_SIZE - 1);
    
    if (affectedMuebles && affectedMuebles.length > 0) {
      // Set syncing IDs for skeleton display
      const ids = affectedMuebles.map(m => m.id);
      setSyncingIds(ids);
      
      allFetchedMuebles.push(...affectedMuebles);
      hasMore = affectedMuebles.length === BATCH_SIZE;
      offset += BATCH_SIZE;
    } else {
      hasMore = false;
    }
  }
  
  // Update store in batches of 50 to avoid UI lag
  const UI_BATCH_SIZE = 50;
  for (let i = 0; i < allFetchedMuebles.length; i += UI_BATCH_SIZE) {
    const batch = allFetchedMuebles.slice(i, i + UI_BATCH_SIZE);
    updateMuebleBatch(batch);
    
    const syncedIds = batch.map(m => m.id);
    removeSyncingIds(syncedIds);
    
    await new Promise(resolve => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => resolve(undefined), { timeout: 100 });
      } else {
        setTimeout(resolve, 16);
      }
    });
  }
  
  clearSyncingIds();
  setIsSyncing(false);
  isSyncingRef.current = false;
}, [updateMuebleBatch, setSyncingIds, removeSyncingIds, clearSyncingIds, setIsSyncing]);
```

### 3. Store Management (`iteaStore.ts`)

The store tracks syncing state:

```typescript
interface IteaStore {
  muebles: MuebleITEA[];
  syncingIds: string[];
  isSyncing: boolean;
  setSyncingIds: (ids: string[]) => void;
  removeSyncingIds: (ids: string[]) => void;
  clearSyncingIds: () => void;
  setIsSyncing: (syncing: boolean) => void;
  // ... other methods
}
```

### 4. UI Components

#### InventoryTable.tsx

Shows skeleton loaders for syncing cells:

```typescript
function CellSkeleton() {
  return (
    <div className={`h-4 rounded animate-pulse ${
      isDarkMode ? 'bg-white/10' : 'bg-black/10'
    }`} style={{ width: '80%' }} />
  );
}

// In table row
const isSyncing = syncingIdsArray.includes(item.id);

<td>
  {isSyncing ? <CellSkeleton /> : (item.area?.nombre ?? null)}
</td>
```

#### DetailPanel.tsx

Shows skeleton in detail view:

```typescript
<DetailCard
  label="Área"
  value={isSyncing ? null : (selectedItem.area?.nombre || 'No especificado')}
  isDarkMode={isDarkMode}
  isSyncing={isSyncing}
/>
```

## User Experience

### Before Update
- User sees current estatus values in table and detail panel
- All data displays normally

### During Update
1. Admin updates an estatus value in config table
2. Realtime listener detects the change
3. Skeleton loaders appear in affected cells
4. Data fetches in background (batched for performance)
5. UI updates smoothly as batches complete
6. Skeleton loaders disappear

### After Update
- All affected records show new estatus value
- No page refresh required
- No data loss or inconsistency

## Performance Optimizations

1. **Batch Fetching**: Fetches 1000 records at a time from Supabase
2. **UI Batching**: Updates UI in batches of 50 to prevent freezing
3. **Idle Callbacks**: Uses `requestIdleCallback` for smooth updates
4. **Queue Management**: Queues concurrent updates to prevent conflicts
5. **Skeleton Indicators**: Shows loading state without blocking UI

## Benefits

1. **Real-time Updates**: Changes appear immediately without refresh
2. **Visual Feedback**: Skeleton loaders show sync progress
3. **Performance**: Batched updates prevent UI lag
4. **Consistency**: All affected records update together
5. **User Experience**: Smooth, non-blocking updates

## Testing Scenarios

### Scenario 1: Single Estatus Update
1. Admin updates "ACTIVO" to "ACTIVO (VERIFICADO)" in config table
2. All ITEA records with that estatus show skeleton loaders
3. Records update with new value
4. Skeleton loaders disappear

### Scenario 2: Multiple Records
1. Admin updates estatus used by 500+ records
2. Batch fetching handles large dataset
3. UI updates in chunks of 50
4. No performance degradation

### Scenario 3: Concurrent Updates
1. Admin updates estatus while area is also updating
2. Queue system prevents conflicts
3. Both updates complete successfully
4. UI reflects all changes

## Comparison with Other Modules

| Feature | No Listado | ITEA | INEA |
|---------|-----------|------|------|
| Estatus Sync | ✅ | ✅ | ⏳ |
| Area Sync | ✅ | ✅ | ✅ |
| Director Sync | ✅ | ✅ | ✅ |
| Skeleton Indicators | ✅ | ✅ | ✅ |
| Batch Processing | ✅ | ✅ | ✅ |

## Files Modified

1. `src/hooks/indexation/useIteaIndexation.ts` - Added config listener and batch processing
2. `src/stores/iteaStore.ts` - Added syncing state management
3. `src/components/consultas/itea/components/InventoryTable.tsx` - Added skeleton loaders
4. `src/components/consultas/itea/components/DetailPanel.tsx` - Added skeleton support
5. `src/components/consultas/itea/index.tsx` - Passes syncing props

## Related Documentation

- [ITEA Estatus Relational Migration](./ITEA_ESTATUS_RELATIONAL_MIGRATION.md)
- [No Listado Sync Status Indicator](./NO_LISTADO_SYNC_STATUS_INDICATOR.md)
- [INEA Sync Status Indicator](./INEA_SYNC_STATUS_INDICATOR.md)
- [Levantamiento Sync Status Indicator](./LEVANTAMIENTO_SYNC_STATUS_INDICATOR.md)

## Future Enhancements

1. Add progress percentage indicator
2. Add estimated time remaining
3. Add cancel/pause functionality
4. Add retry logic for failed batches
5. Add notification when sync completes

# No Listado - Estatus Realtime Sync Implementation

## Overview
This document describes the implementation of realtime synchronization for estatus updates in the No Listado module, providing the same user experience as area and director updates.

## Feature Description

When an administrator updates an estatus value in the `config` table (e.g., changing "ACTIVO" to "EN USO"), all inventory items (`mueblestlaxcala`) that reference that estatus are automatically updated in real-time across all connected clients.

## User Experience

1. **Immediate Detection**: System detects config table update via Supabase realtime
2. **Visual Feedback**: Affected rows show skeleton loader
3. **Sync Indicator**: Banner displays "Sincronizando X registros..."
4. **Progressive Update**: UI updates in batches to maintain responsiveness
5. **Completion**: Skeleton disappears, updated values displayed

## Technical Implementation

### 1. Realtime Listener

Added to `src/hooks/indexation/useNoListadoIndexation.ts`:

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

### 2. Batch Update Function

Updated `processBatchUpdates` to handle three types:

```typescript
const processBatchUpdates = useCallback(async (
  _ids: string[],
  type: 'area' | 'directorio' | 'estatus',
  refId: number
) => {
  // Determine filter field based on type
  const filterField = type === 'area' ? 'id_area' 
    : type === 'directorio' ? 'id_directorio' 
    : 'id_estatus';
  
  // Fetch affected records in batches of 1000
  // Update UI in batches of 50 for smooth performance
  // Show skeleton and sync indicators during process
});
```

### 3. Type Updates

Updated type definitions:

```typescript
// syncQueueRef type
const syncQueueRef = useRef<{ 
  ids: string[]; 
  type: 'area' | 'directorio' | 'estatus'; 
  refId: number 
} | null>(null);
```

## Sync Process Flow

```
Config Table Update (tipo='estatus')
         ↓
Realtime Event Detected
         ↓
Extract config.id (estatus ID)
         ↓
Query mueblestlaxcala WHERE id_estatus = config.id
         ↓
Fetch in batches of 1000 records
         ↓
For each batch:
  - Fetch resguardos
  - Transform data
  - Set syncingIds (triggers skeleton)
  - Update store in batches of 50
  - Remove from syncingIds
  - Wait for idle callback
         ↓
Clear all syncingIds
         ↓
Set isSyncing = false
```

## Performance Considerations

1. **Batch Fetching**: Queries in batches of 1000 to respect Supabase limits
2. **Progressive UI Updates**: Updates in batches of 50 to avoid UI lag
3. **Idle Callbacks**: Uses `requestIdleCallback` for smooth rendering
4. **Queue Management**: Queues subsequent updates if sync is in progress
5. **Skeleton Display**: Only shows skeleton for affected rows

## Store Integration

Uses `noListadoStore` methods:
- `setSyncingIds(ids)` - Marks rows as syncing (shows skeleton)
- `removeSyncingIds(ids)` - Removes rows from syncing state
- `clearSyncingIds()` - Clears all syncing states
- `setIsSyncing(boolean)` - Controls global sync banner
- `updateMuebleBatch(muebles)` - Updates multiple records efficiently

## UI Components Affected

1. **InventoryTable**: Shows skeleton for syncing rows
2. **SyncStatusBanner**: Displays sync progress
3. **DetailPanel**: Disabled during sync if item is affected

## Example Scenario

**Admin Action**: Updates "ACTIVO" to "EN USO" in config table

**System Response**:
1. Realtime listener fires
2. Queries all muebles with id_estatus matching "ACTIVO" record
3. Finds 500 affected records
4. Shows "Sincronizando 500 registros..." banner
5. Displays skeleton on affected table rows
6. Fetches records in batches (500 records = 1 batch)
7. Updates UI in 10 batches of 50 records each
8. Each batch update waits for idle callback
9. Skeleton disappears as each batch completes
10. Banner disappears when all complete

## Benefits

1. **Consistency**: All clients see updated estatus immediately
2. **User Feedback**: Clear visual indication of sync process
3. **Performance**: Batched updates prevent UI freezing
4. **Reliability**: Queue system prevents race conditions
5. **Unified Experience**: Same behavior as area/director updates

## Testing

To test the feature:

1. Open No Listado module in two browser windows
2. In one window, go to admin panel and update a config estatus value
3. In the other window, observe:
   - Sync banner appears
   - Affected rows show skeleton
   - Values update progressively
   - Skeleton disappears
   - Banner disappears

## Notes

- Only UPDATE events on config table trigger sync (not INSERT/DELETE)
- Filter ensures only `tipo='estatus'` records are processed
- Sync respects existing queue system for area/director updates
- All affected records are refetched with complete JOINs
- Resguardo data is also refetched for each affected mueble

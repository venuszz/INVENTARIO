# Levantamiento Unificado - Aggregated Sync Status Indicator Implementation

## Overview
This document describes the implementation of the aggregated sync status indicator for the Levantamiento Unificado module, which provides real-time visual feedback when any of the three underlying data sources (INEA, ITEA, TLAXCALA) are performing batch synchronization operations.

## Implementation Date
February 23, 2026

## Problem Statement
The Levantamiento Unificado module is a read-only aggregated view that combines data from three separate inventory sources:
- INEA (Instituto Nacional para la Educación de los Adultos)
- ITEA (Instituto Tlaxcalteca para la Educación de los Adultos)
- TLAXCALA (No Listado)

When area or directorio records are updated in the database, each source module independently synchronizes its affected records. Users viewing the unified Levantamiento view had no visibility into these background synchronization operations, which could cause:
- Confusion when data appears to be updating
- Uncertainty about data freshness
- Questions about system responsiveness

## Solution Architecture

### 1. Aggregated Sync State
Unlike the individual modules (INEA, ITEA, TLAXCALA) which have their own stores and sync management, Levantamiento aggregates sync state from all three sources:

```typescript
// Get sync state from all three stores
const ineaSyncingIds = useIneaStore(state => state.syncingIds) || [];
const ineaIsSyncing = useIneaStore(state => state.isSyncing);
const iteaSyncingIds = useIteaStore(state => state.syncingIds) || [];
const iteaIsSyncing = useIteaStore(state => state.isSyncing);
const tlaxcalaSyncingIds = useNoListadoStore(state => state.syncingIds) || [];
const tlaxcalaIsSyncing = useNoListadoStore(state => state.isSyncing);

// Aggregate with OR logic
const isSyncing = ineaIsSyncing || iteaIsSyncing || tlaxcalaIsSyncing;
const syncingCount = ineaSyncingIds.length + iteaSyncingIds.length + tlaxcalaSyncingIds.length;
```

### 2. Enhanced useUnifiedInventory Hook
Location: `src/components/consultas/levantamiento/hooks/useUnifiedInventory.ts`

Added three new return values:
- `isSyncing`: boolean - True if ANY source is syncing
- `syncingCount`: number - Total records being synced across all sources
- `syncingSources`: string[] - Array of source names currently syncing (e.g., ['INEA', 'TLAXCALA'])

```typescript
export interface UseUnifiedInventoryReturn {
  muebles: LevMueble[];
  loading: boolean;
  error: string | null;
  realtimeConnected: boolean;
  reindex: () => Promise<void>;
  isSyncing: boolean;           // NEW
  syncingCount: number;          // NEW
  syncingSources: string[];      // NEW
}
```

### 3. SyncStatusBanner Component
Location: `src/components/consultas/levantamiento/components/SyncStatusBanner.tsx`

Features:
- Fixed position (top-left, below header)
- Glassmorphism design with backdrop blur
- Animated spinner with pulse effect
- Real-time sync count display
- Shows which sources are syncing (INEA, ITEA, TLAXCALA)
- Animated progress dots
- Auto-show/hide based on aggregated sync state

```typescript
<SyncStatusBanner 
  isSyncing={isSyncing} 
  syncingCount={syncingCount} 
  syncingSources={syncingSources}
  isDarkMode={isDarkMode} 
/>
```

### 4. InventoryTable Skeleton Loaders
Location: `src/components/consultas/levantamiento/components/InventoryTable.tsx`

Features:
- Receives `syncingIds` array from useUnifiedInventory
- Shows skeleton loaders in Área and Director columns for syncing records
- Smooth animated pulse effect
- Maintains table layout during sync

```typescript
{isMuebleSyncing(item.id) ? (
  <SkeletonLoader />
) : (
  <div className="line-clamp-3" title={item.area?.nombre || ''}>
    {item.area?.nombre || '-'}
  </div>
)}
```

### 5. Main Component Integration
Location: `src/components/consultas/levantamiento/index.tsx`

Changes:
1. Import SyncStatusBanner component
2. Get aggregated sync state from useUnifiedInventory hook
3. Render banner after Header
4. No action buttons to disable (read-only view)

## Key Differences from Individual Modules

### Individual Modules (INEA, ITEA, TLAXCALA)
- Have their own stores with sync state
- Have edit capabilities that need to be disabled during sync
- Have action buttons that need to be disabled during sync
- Have form fields that need to be disabled during sync
- Users can trigger syncs indirectly by editing area/directorio

### Levantamiento Unificado
- No dedicated store (aggregates from three sources)
- Read-only view (no editing capabilities)
- No action buttons to disable
- No form fields to disable
- Users cannot trigger syncs from this view
- Only shows informational banner about background sync operations

## User Experience Flow

### Normal Operation
1. User browses unified inventory from all three sources
2. User can search, filter, and export data
3. No sync indicator visible

### During Synchronization (Any Source)
1. Admin updates an area or directorio record (in any module)
2. Affected source(s) begin synchronization
3. SyncStatusBanner appears in Levantamiento view
4. Banner shows:
   - Total count of syncing records across all sources
   - Which sources are syncing (e.g., "INEA, TLAXCALA")
5. Skeleton loaders appear in Área and Director columns for affected records
6. Banner and skeletons disappear when all sources complete sync

### Visual Feedback
- **Banner**: Glassmorphism design with animated spinner and progress dots
- **Source Names**: Shows which sources are syncing (INEA, ITEA, TLAXCALA)
- **Count**: Total records being synced across all sources
- **No UI Blocking**: View remains fully functional (read-only operations)

## Technical Details

### Files Modified
1. `src/components/consultas/levantamiento/components/SyncStatusBanner.tsx` (created)
2. `src/components/consultas/levantamiento/hooks/useUnifiedInventory.ts` (updated)
3. `src/components/consultas/levantamiento/index.tsx` (updated)
4. `src/components/consultas/levantamiento/components/InventoryTable.tsx` (updated)

### Files Referenced (No Changes)
1. `src/stores/ineaStore.ts` - Source of INEA sync state
2. `src/stores/iteaStore.ts` - Source of ITEA sync state
3. `src/stores/noListadoStore.ts` - Source of TLAXCALA sync state

### Dependencies
- `framer-motion`: For banner animations
- `lucide-react`: For RefreshCw icon
- `zustand`: For accessing store state

## Sync State Aggregation Logic

### OR Logic for isSyncing
```typescript
const isSyncing = ineaIsSyncing || iteaIsSyncing || tlaxcalaIsSyncing;
```
If ANY source is syncing, show the banner.

### SUM Logic for syncingCount
```typescript
const syncingCount = ineaSyncingIds.length + iteaSyncingIds.length + tlaxcalaSyncingIds.length;
```
Total count of records being synced across all sources.

### Array Logic for syncingSources
```typescript
const syncingSources = useMemo(() => {
  const sources: string[] = [];
  if (ineaIsSyncing) sources.push('INEA');
  if (iteaIsSyncing) sources.push('ITEA');
  if (tlaxcalaIsSyncing) sources.push('TLAXCALA');
  return sources;
}, [ineaIsSyncing, iteaIsSyncing, tlaxcalaIsSyncing]);
```
Shows which specific sources are currently syncing.

## Example Scenarios

### Scenario 1: Single Source Sync
- Admin updates an INEA area
- Banner shows: "Sincronizando 150 registros (INEA)"
- ITEA and TLAXCALA data remain stable

### Scenario 2: Multiple Source Sync
- Admin updates a directorio that exists in all three sources
- Banner shows: "Sincronizando 450 registros (INEA, ITEA, TLAXCALA)"
- All three sources sync simultaneously

### Scenario 3: Sequential Syncs
- Admin updates INEA area, then immediately updates ITEA area
- Banner shows: "Sincronizando 200 registros (INEA, ITEA)"
- Count updates as syncs complete

## Benefits

### 1. Transparency
- Users understand when background operations are occurring
- Clear indication of which sources are affected
- Real-time count of records being synchronized

### 2. User Experience
- Non-intrusive informational banner
- Doesn't block any functionality (read-only view)
- Smooth animations and visual feedback

### 3. Consistency
- Same visual design as individual module indicators
- Consistent user experience across all inventory views
- Reusable component pattern

### 4. Performance
- Efficient state aggregation using Zustand selectors
- Minimal re-renders with useMemo
- No impact on read-only operations

## Limitations and Considerations

### Read-Only Nature
- Levantamiento is a read-only view
- No editing capabilities to protect
- No action buttons to disable
- Banner is purely informational

### No Direct Sync Control
- Users cannot trigger syncs from Levantamiento
- Syncs are triggered from individual modules or admin panel
- Banner only reflects background operations

### Aggregated State
- Shows combined state from three independent sources
- Each source manages its own sync operations
- No coordination between sources (by design)

## Testing Scenarios

### 1. Single Source Sync
- Update an area in INEA module
- Verify banner appears in Levantamiento
- Verify shows "INEA" as syncing source
- Verify count matches INEA syncing records

### 2. Multiple Source Sync
- Update a directorio that exists in all sources
- Verify banner shows all three sources
- Verify count is sum of all syncing records

### 3. Sequential Syncs
- Trigger INEA sync, then ITEA sync
- Verify banner updates to show both sources
- Verify count updates correctly

### 4. Banner Appearance/Disappearance
- Verify banner appears when sync starts
- Verify banner disappears when all syncs complete
- Verify smooth animations

### 5. Read-Only Operations
- Verify search works during sync
- Verify filtering works during sync
- Verify export works during sync
- Verify pagination works during sync

## Future Enhancements

### Potential Improvements
1. Add progress percentage per source
2. Show estimated time remaining
3. Add detailed sync breakdown by source
4. Implement sync history viewer
5. Add notification when large syncs complete

### Monitoring
- Track sync frequency by source
- Monitor aggregated sync duration
- Log sync patterns across sources
- Alert on sync failures

## Related Documentation
- `docs/INEA_SYNC_STATUS_INDICATOR.md` - INEA General implementation
- `docs/INEA_OBSOLETOS_SYNC_STATUS_INDICATOR.md` - INEA Obsoletos implementation
- `docs/ITEA_SYNC_STATUS_INDICATOR.md` - ITEA General implementation
- `docs/NO_LISTADO_SYNC_STATUS_INDICATOR.md` - No Listado implementation
- `docs/MIGRACION_CAMPOS_RELACIONALES.md` - Relational migration context

## Conclusion
The aggregated sync status indicator successfully provides real-time visual feedback about background synchronization operations across all three inventory sources in the Levantamiento Unificado module. The implementation respects the read-only nature of the view while providing transparency about data freshness and system activity. The aggregation logic efficiently combines state from three independent sources without introducing coupling or coordination overhead.

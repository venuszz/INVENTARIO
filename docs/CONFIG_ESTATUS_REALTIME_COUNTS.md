# Estatus Counts - Simplified Implementation

## Overview
This document describes the simplified implementation for displaying estatus counts in the admin areas component. The counts update automatically when store data changes, without requiring explicit real-time listeners or loading states.

## Problem History

### Initial Requirement
When an estatus name is edited in the config table, the badges showing the count of bienes with that estatus need to update in real-time.

### Failed Approaches

1. **Real-time listeners on config table with loading states for all badges**
   - Problem: Showed skeleton loading for ALL badges when ANY estatus changed
   - User feedback: Only the affected estatus should show loading

2. **Real-time listeners with per-estatus loading states**
   - Problem: Caused infinite loops and glitches
   - Events fired multiple times
   - Store updates triggered by indexation hooks caused cascading recalculations
   - Badges would disappear or get stuck in skeleton state

## Current Solution

### Simplified Approach
Remove all real-time listeners from the counts hook. Let the existing indexation infrastructure handle updates naturally.

**Key Insight:** The indexation hooks (useIneaIndexation, useIteaIndexation, etc.) already listen to config table changes and refetch affected muebles. We just need to recalculate counts when those stores update.

## Implementation

### Hook: `useEstatusCountsRealtime`
Location: `src/hooks/useEstatusCountsRealtime.ts`

The hook uses `useMemo` to calculate counts from all inventory stores:
- INEA (general + obsoletos)
- ITEA (general + obsoletos)  
- No Listado (Tlaxcala)

**Key Features:**
- Automatic recalculation when any store data changes
- Memoized to prevent unnecessary recalculations
- No Supabase real-time subscriptions
- No explicit loading states
- Simple and reliable

**Returns:**
```typescript
{
  estatusCounts: {
    [configId: number]: {
      inea: number;
      itea: number;
      noListado: number;
      total: number;
    }
  }
}
```

### Component: `areas.tsx`
Location: `src/components/admin/areas.tsx`

The component displays badges for each estatus showing counts per origin (INEA, ITEA, TLAXCALA).

**Badge Display Rules:**
- Only show badges when count > 0
- Badges appear immediately when counts change
- No skeleton loading states

## How It Works

1. **Config Update**: User edits an estatus name in the config table
2. **Indexation Hooks Detect Change**: The indexation hooks (useIneaIndexation, etc.) have real-time listeners on the config table
3. **Batch Refetch**: The indexation hooks refetch all affected muebles with the updated estatus name
4. **Store Updates**: The indexation hooks update their respective stores with the new data
5. **Automatic Recalculation**: The `useMemo` in useEstatusCountsRealtime detects store changes and recalculates counts
6. **UI Update**: React re-renders the component with updated counts

## Why This Approach Works

### Benefits
- **Simple**: No complex state management or timeouts
- **Reliable**: No race conditions or infinite loops
- **Efficient**: Leverages existing indexation infrastructure
- **Maintainable**: Easy to understand and modify
- **Performant**: useMemo prevents unnecessary recalculations

### Why Previous Approaches Failed
- Adding real-time listeners to the counts hook created a circular dependency:
  - Config update → Hook detects change → Triggers recalculation
  - Meanwhile: Config update → Indexation hook detects change → Updates stores
  - Store update → Hook detects change → Triggers another recalculation
  - Result: Infinite loop

- The indexation hooks already handle the real-time updates correctly with debouncing and batch processing
- We just need to react to their store updates, not duplicate their work

## Performance Considerations

- `useMemo` prevents recalculation unless dependencies change
- Only recalculates when activeTab is 'estatus'
- Efficient counting algorithm (single pass through each store)
- No additional Supabase channels or subscriptions

## Data Flow

```
Config Table UPDATE (estatus name changed)
    ↓
Indexation Hooks Detect Change (via their real-time listeners)
    ↓
Indexation Hooks Refetch Affected Muebles
    ↓
Indexation Hooks Update Stores
    ↓
useEstatusCountsRealtime Detects Store Change (via useMemo dependencies)
    ↓
useMemo Recalculates Counts
    ↓
Component Re-renders with Updated Counts
```

## Files Modified

1. `src/hooks/useEstatusCountsRealtime.ts` - Simplified hook implementation
2. `src/components/admin/areas.tsx` - Removed loading state references
3. `docs/CONFIG_ESTATUS_REALTIME_COUNTS.md` - Updated documentation

## Testing

To verify the implementation:
1. Navigate to Admin > Áreas > Estatus tab
2. Edit an estatus name
3. Observe that badges update automatically without glitches
4. Verify no skeleton loading states appear
5. Confirm counts are accurate across all origins
6. Edit multiple estatus in quick succession - no infinite loops
7. Verify badges never disappear or get stuck

## Related Files

- `src/hooks/useEstatusCountsRealtime.ts` - Main hook implementation
- `src/components/admin/areas.tsx` - Component using the hook
- `src/hooks/indexation/useIneaIndexation.ts` - Handles INEA real-time updates
- `src/hooks/indexation/useIteaIndexation.ts` - Handles ITEA real-time updates
- `src/hooks/indexation/useNoListadoIndexation.ts` - Handles NoListado real-time updates

## Date
February 27, 2026

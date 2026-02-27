# Config Estatus Real-time Counts Implementation

## Overview
This document describes the implementation of real-time updates for estatus counts in the admin areas component. When an estatus is edited in the config table, the count badges now show a skeleton loading state while recalculating the new counts.

## Problem
Previously, when an estatus was edited in the config table, the count badges would update but without any visual feedback to the user that a recalculation was happening. This could be confusing, especially when dealing with large datasets where the recalculation might take a moment.

## Solution
Created a custom hook `useEstatusCountsRealtime` that:
1. Listens to real-time changes in the `config` table (specifically for `tipo='estatus'`)
2. Shows a skeleton loading state immediately when a change is detected
3. Debounces the recalculation to handle multiple rapid updates efficiently
4. Recalculates counts from all inventory sources (INEA, ITEA, TLAXCALA, and their obsoletos variants)

## Implementation Details

### New Hook: `useEstatusCountsRealtime`
**Location:** `src/hooks/useEstatusCountsRealtime.ts`

**Features:**
- Real-time listener for config table changes
- Debounced recalculation (1 second after last update)
- Skeleton loading state during recalculation
- Automatic cleanup of Supabase channels
- Only active when on the "estatus" tab

**States:**
- `estatusCounts`: Object containing counts per estatus ID
- `isLoadingCounts`: Initial loading state
- `isRecalculating`: Real-time update loading state

**How it works:**
1. Subscribes to `postgres_changes` on the `config` table with filter `tipo=eq.estatus`
2. When an UPDATE event is received:
   - Sets `isRecalculating` to `true` immediately
   - Adds the config ID to a pending updates set
   - Clears any existing debounce timeout
   - Sets a new timeout to recalculate after 1 second
3. After the timeout, recalculates all counts from the store data
4. Updates the `estatusCounts` state with new values
5. Sets `isRecalculating` to `false`

### Updated Component: `areas.tsx`
**Location:** `src/components/admin/areas.tsx`

**Changes:**
1. Removed direct store subscriptions for counting
2. Removed manual useEffect for count calculation
3. Integrated `useEstatusCountsRealtime` hook
4. Updated badge rendering to show skeleton states

**Skeleton Loading State:**
When `isLoadingCounts` or `isRecalculating` is true, shows 3 animated skeleton badges:
```tsx
<div className="flex items-center gap-1">
    {[1, 2, 3].map((i) => (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs animate-pulse">
            <div className="h-3 w-12 rounded bg-white/20" />
            <div className="h-3 w-6 rounded bg-white/20" />
        </div>
    ))}
</div>
```

## User Experience

### Before
- Estatus edited → Counts update silently
- No visual feedback during recalculation
- User might not notice the change

### After
- Estatus edited → Skeleton badges appear immediately
- Clear visual feedback that recalculation is happening
- Smooth transition to new counts after 1 second
- Multiple rapid edits are debounced efficiently

## Technical Benefits

1. **Performance**: Debouncing prevents excessive recalculations during bulk edits
2. **User Feedback**: Clear loading states improve UX
3. **Separation of Concerns**: Counting logic isolated in dedicated hook
4. **Maintainability**: Easier to test and modify counting behavior
5. **Real-time**: Automatic updates without page refresh

## Data Flow

```
Config Table UPDATE
    ↓
Supabase Realtime Event
    ↓
useEstatusCountsRealtime Hook
    ↓
Set isRecalculating = true
    ↓
Debounce (1 second)
    ↓
Recalculate counts from stores
    ↓
Update estatusCounts state
    ↓
Set isRecalculating = false
    ↓
UI shows new counts
```

## Dependencies

- `@supabase/supabase-js`: Real-time subscriptions
- Zustand stores: `ineaStore`, `iteaStore`, `noListadoStore`, `ineaObsoletosStore`, `iteaObsoletosStore`
- React hooks: `useState`, `useEffect`, `useCallback`, `useRef`

## Future Enhancements

1. Add error handling for failed recalculations
2. Show specific loading state per badge (instead of all 3)
3. Add animation when counts change
4. Cache counts to reduce recalculation frequency
5. Add manual refresh button for counts

## Testing Recommendations

1. Edit an estatus name and verify skeleton appears
2. Edit multiple estatus rapidly and verify debouncing works
3. Switch tabs and verify channel cleanup
4. Check that counts are accurate after recalculation
5. Test with large datasets to verify performance

## Related Files

- `src/hooks/useEstatusCountsRealtime.ts` - Main hook implementation
- `src/components/admin/areas.tsx` - Component using the hook
- `src/hooks/indexation/useIneaIndexation.ts` - Example of similar real-time pattern
- `src/hooks/indexation/useIteaIndexation.ts` - Example of similar real-time pattern
- `src/hooks/indexation/useNoListadoIndexation.ts` - Example of similar real-time pattern

## Date
February 27, 2026

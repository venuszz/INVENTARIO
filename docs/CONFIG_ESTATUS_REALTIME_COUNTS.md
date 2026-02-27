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
- `recalculatingIds`: Set of estatus IDs currently being recalculated

**How it works:**
1. Subscribes to `postgres_changes` on the `config` table with filter `tipo=eq.estatus`
2. When an UPDATE event is received:
   - Adds the specific config ID to `recalculatingIds` Set immediately
   - Clears any existing debounce timeout for that specific estatus ID
   - Sets a new timeout (800ms) to recalculate only that estatus
3. After the timeout:
   - Recalculates counts only for the affected estatus ID
   - Updates only that estatus in the `estatusCounts` state
   - Removes the ID from `recalculatingIds` Set
4. Each estatus has its own independent timeout, preventing interference between updates

### Updated Component: `areas.tsx`
**Location:** `src/components/admin/areas.tsx`

**Changes:**
1. Removed direct store subscriptions for counting
2. Removed manual useEffect for count calculation
3. Integrated `useEstatusCountsRealtime` hook
4. Updated badge rendering to show skeleton states

**Skeleton Loading State:**
When `isLoadingCounts` is true (initial load) or when a specific estatus ID is in `recalculatingIds`, shows 3 animated skeleton badges only for that estatus:
```tsx
{isLoadingCounts || recalculatingIds.has(item.id) ? (
    <div className="flex items-center gap-1">
        {[1, 2, 3].map((i) => (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs animate-pulse">
                <div className="h-3 w-12 rounded bg-white/20" />
                <div className="h-3 w-6 rounded bg-white/20" />
            </div>
        ))}
    </div>
) : (
    // Show actual badges
)}
```

## User Experience

### Before
- Estatus edited → Counts update silently
- No visual feedback during recalculation
- User might not notice the change

### After
- Estatus edited → Skeleton badges appear immediately for that specific estatus only
- Clear visual feedback that recalculation is happening for the affected estatus
- Other estatus badges remain visible and unchanged
- Smooth transition to new counts after 800ms
- Multiple rapid edits to the same estatus are debounced efficiently
- Multiple different estatus can be edited simultaneously without interference

## Technical Benefits

1. **Performance**: 
   - Only recalculates the specific estatus that changed
   - Independent debouncing per estatus prevents interference
   - No unnecessary recalculation of unchanged estatus
2. **User Feedback**: Clear loading states improve UX
3. **Separation of Concerns**: Counting logic isolated in dedicated hook
4. **Maintainability**: Easier to test and modify counting behavior
5. **Real-time**: Automatic updates without page refresh
6. **Scalability**: Can handle multiple simultaneous estatus edits

## Data Flow

```
Config Table UPDATE (estatus ID: 5)
    ↓
Supabase Realtime Event
    ↓
useEstatusCountsRealtime Hook
    ↓
Add ID 5 to recalculatingIds Set
    ↓
Debounce (800ms) - Independent per estatus
    ↓
Recalculate counts ONLY for estatus ID 5
    ↓
Update estatusCounts[5] in state
    ↓
Remove ID 5 from recalculatingIds Set
    ↓
UI shows new counts for estatus ID 5 only
```

## Dependencies

- `@supabase/supabase-js`: Real-time subscriptions
- Zustand stores: `ineaStore`, `iteaStore`, `noListadoStore`, `ineaObsoletosStore`, `iteaObsoletosStore`
- React hooks: `useState`, `useEffect`, `useCallback`, `useRef`

## Future Enhancements

1. Add error handling for failed recalculations
2. Add animation when counts change (fade in/out)
3. Cache counts to reduce recalculation frequency
4. Add manual refresh button for counts
5. Show a subtle pulse animation on the updated badge after recalculation

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

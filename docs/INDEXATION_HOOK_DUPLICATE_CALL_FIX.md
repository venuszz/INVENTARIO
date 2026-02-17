# Fix: Duplicate Indexation Hook Call in ConsultarResguardos

## Problem

When rendering the `ConsultarResguardos` component, the `IndexationPopover` was showing the resguardos module as if it was being reindexed every time, even though the data was already indexed. This created a confusing user experience with the indexation indicator appearing unnecessarily.

## Root Cause

The `useResguardosIndexation()` hook was being called in multiple places:

1. **IndexationPopover** - ✅ Correct (to display indexation status)
2. **UniversalSearchBar** - ✅ Correct (to access indexed data)
3. **ConsultarResguardos index.tsx** - ❌ UNNECESSARY (caused the problem)
4. **Header component** - ✅ Correct (to show realtime connection status)

The problem was in `ConsultarResguardos` where the hook was being called unnecessarily. This hook is designed to be called only once globally (typically in the `IndexationPopover` or at the app level) to initialize and manage the indexation process.

### Why This Caused Issues

When `useResguardosIndexation()` is called multiple times:
- Each call can trigger state updates in the indexation store
- The `IndexationPopover` detects these state changes
- It interprets them as a new indexation process starting
- The popover shows the "indexing" state even though data is already indexed

## Solution

Removed the unnecessary call to `useResguardosIndexation()` from the `ConsultarResguardos` component.

### Changes Made

**File: `src/components/resguardos/consultar/index.tsx`**

#### Before:
```typescript
import { useResguardosIndexation } from '@/hooks/indexation/useResguardosIndexation';

// ... other imports

export default function ConsultarResguardos({ folioParam }: ConsultarResguardosProps) {
  // ... other code
  
  // External hooks
  useResguardosIndexation(); // ❌ UNNECESSARY
  
  // ... rest of component
}
```

#### After:
```typescript
// Removed the import
// import { useResguardosIndexation } from '@/hooks/indexation/useResguardosIndexation';

// ... other imports

export default function ConsultarResguardos({ folioParam }: ConsultarResguardosProps) {
  // ... other code
  
  // Removed the hook call
  // useResguardosIndexation(); // ❌ REMOVED
  
  // ... rest of component
}
```

## Why This Works

The `ConsultarResguardos` component doesn't need to initialize indexation because:

1. **Data Access**: The component uses `useResguardosData()` hook which internally accesses the `useResguardosStore` directly to read indexed data
2. **Global Initialization**: The indexation is already initialized globally by:
   - `IndexationPopover` (which calls all indexation hooks to display status)
   - `UniversalSearchBar` (which needs access to the indexed data)
3. **Realtime Status**: The `Header` component within `ConsultarResguardos` calls `useResguardosIndexation()` only to read the `realtimeConnected` status, which is fine because it's just reading state, not initializing

## Best Practices for Indexation Hooks

### ✅ DO Call Indexation Hooks:
- In global components like `IndexationPopover` that need to display status for all modules
- In components that need to read the indexation state (like connection status)
- In search components that need direct access to indexed data

### ❌ DON'T Call Indexation Hooks:
- In page-level components that only need to display data
- Multiple times in the same component tree
- When you only need to read data from the store (use the store directly instead)

### Correct Pattern:
```typescript
// If you only need data, use the store directly
import { useResguardosStore } from '@/stores/resguardosStore';

const resguardos = useResguardosStore(state => state.resguardos);

// If you need indexation status, call the hook
import { useResguardosIndexation } from '@/hooks/indexation/useResguardosIndexation';

const { isIndexing, isIndexed, realtimeConnected } = useResguardosIndexation();
```

## Testing

Build completed successfully with no errors:
```
✓ Compiled successfully
✓ Finished TypeScript
```

## Impact

After this fix:
- The `IndexationPopover` no longer shows false "indexing" states when navigating to ConsultarResguardos
- The indexation process runs only once globally
- Component renders are cleaner and more efficient
- User experience is improved with accurate indexation status

## Related Files

- `src/components/resguardos/consultar/index.tsx` - Removed unnecessary hook call
- `src/components/IndexationPopover.tsx` - Correctly displays indexation status
- `src/hooks/indexation/useResguardosIndexation.ts` - The indexation hook itself
- `src/stores/resguardosStore.ts` - The data store used by components

## Similar Issues to Watch For

Check other page-level components to ensure they're not unnecessarily calling indexation hooks:
- `src/components/resguardos/consultarBajas/index.tsx` - ✅ Correctly calls `useResguardosBajasIndexation()` only once
- `src/components/consultas/inea/index.tsx` - Should be checked
- `src/components/consultas/itea/index.tsx` - Should be checked
- Other consultation pages

The general rule: **Indexation hooks should be called at the app level or in global components, not in individual page components.**

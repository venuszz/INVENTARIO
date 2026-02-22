# Directorio Search Bar Lag Fix

## Problem
The search bar in the `/admin/personal` (directorio) page had noticeable lag when typing. Users experienced delayed input response, making the search feel sluggish and unresponsive.

## Root Cause
The component was performing expensive filtering operations synchronously on every keystroke without debouncing or deferring the computation. This caused the heavy filtering logic to block the input field, resulting in lag.

The original implementation:
```typescript
// Direct filtering without deferring
const filteredDirectorio = directorioFromStore.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    // ... expensive filtering logic
});
```

## Solution
Implemented the same optimization pattern used in the INEA component by using React's `useDeferredValue` hook to defer the expensive filtering operation while keeping the input responsive.

### Changes Made

1. **Added React hooks imports**:
   - `useDeferredValue` - to defer the search term value
   - `useCallback` - to memoize the area matching function

2. **Deferred search term**:
   ```typescript
   const deferredSearchTerm = useDeferredValue(searchTerm);
   ```
   This allows React to prioritize updating the input field immediately while deferring the expensive filtering operation.

3. **Memoized director areas map**:
   ```typescript
   const directorAreasMap = useMemo(() => 
       directorioAreasFromStore.reduce((acc, rel) => {
           if (!acc[rel.id_directorio]) acc[rel.id_directorio] = [];
           acc[rel.id_directorio].push(rel.id_area);
           return acc;
       }, {} as { [id_directorio: number]: number[] }), 
       [directorioAreasFromStore]
   );
   ```

4. **Memoized filtered results**:
   ```typescript
   const filteredDirectorio = useMemo(() => {
       if (!deferredSearchTerm.trim()) {
           return directorioFromStore;
       }
       // ... filtering logic using deferredSearchTerm
   }, [directorioFromStore, deferredSearchTerm, directorAreasMap, areasFromStore]);
   ```

5. **Memoized area matching function**:
   ```typescript
   const areaMatchesSearch = useCallback((areaName: string) => {
       if (!deferredSearchTerm) return false;
       return areaName.toLowerCase().includes(deferredSearchTerm.toLowerCase());
   }, [deferredSearchTerm]);
   ```

## How It Works

1. **User types in search bar**: The `searchTerm` state updates immediately, keeping the input responsive
2. **React defers the expensive work**: `deferredSearchTerm` updates after a short delay, allowing the UI to remain responsive
3. **Filtering happens asynchronously**: The `useMemo` hook recalculates filtered results using the deferred value
4. **No blocking**: The input field never blocks because the heavy computation is deferred

## Benefits

- **No input lag**: Users can type freely without delays
- **Smooth UX**: Search feels instant and responsive
- **Efficient filtering**: Expensive operations only run when necessary
- **Consistent pattern**: Matches the INEA component implementation

## Files Modified

- `src/components/admin/directorio/index.tsx`

## Testing

Build completed successfully with no TypeScript errors:
```bash
npm run build
✓ Compiled successfully
```

## Reference Implementation

This fix follows the same pattern used in:
- `src/components/consultas/inea/hooks/useSearchAndFilters.ts`

The INEA implementation has been working smoothly without lag, confirming this approach is effective.

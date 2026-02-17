# Fix: IndexationPopover Realtime Notifications for Resguardos Bajas

## Problem
The `IndexationPopover` component was not detecting or displaying realtime change notifications for the `resguardos-bajas` module, even though the module was properly indexed and receiving realtime events.

## Root Causes

### 1. Missing `addRealtimeChange` Calls
The `useResguardosBajasIndexation` hook was not calling `addRealtimeChange()` when receiving realtime events (INSERT, UPDATE, DELETE). This meant that changes were being applied to the store but not being registered in the `indexationStore.realtimeChanges` array that the `IndexationPopover` reads.

### 2. Module Key Mismatch
There was an inconsistency in the module key naming:
- Hook used: `'resguardos-bajas'` (with hyphen)
- Config used: `'resguardosBajas'` (camelCase)
- IndexationPopover expected: `'resguardosBajas'` (camelCase)

This mismatch prevented the `IndexationPopover` from finding the correct module state.

## Solution

### Changes Made

#### 1. Added `addRealtimeChange` to `useResguardosBajasIndexation.ts`
- Imported `addRealtimeChange` from `useIndexationStore`
- Added calls to `addRealtimeChange()` in all three event handlers (INSERT, UPDATE, DELETE)
- Added `addRealtimeChange` to the dependency array of `setupRealtimeSubscription`

```typescript
// After INSERT
addRealtimeChange({
  moduleKey: MODULE_KEY,
  moduleName: 'Resguardos Bajas',
  table: TABLE,
  eventType: 'INSERT',
  recordId: data.id,
});

// After UPDATE
addRealtimeChange({
  moduleKey: MODULE_KEY,
  moduleName: 'Resguardos Bajas',
  table: TABLE,
  eventType: 'UPDATE',
  recordId: data.id,
});

// After DELETE
addRealtimeChange({
  moduleKey: MODULE_KEY,
  moduleName: 'Resguardos Bajas',
  table: TABLE,
  eventType: 'DELETE',
  recordId: oldRecord.id,
});
```

#### 2. Fixed Module Key Consistency
Changed all instances of `'resguardos-bajas'` to `'resguardosBajas'`:
- `src/hooks/indexation/useResguardosBajasIndexation.ts`: MODULE_KEY constant
- `src/hooks/indexation/useResguardosBajasIndexation.ts`: hydration store key
- `src/stores/resguardosBajasStore.ts`: storage name and hydration key
- `src/lib/clearIndexationData.ts`: database name in cleanup list

#### 3. Bonus Fix: Added Same Changes to `useResguardosIndexation.ts`
The regular resguardos module had the same issue, so the same fix was applied:
- Added `addRealtimeChange` import and calls
- Module key was already correct (`'resguardos'`)

## How It Works Now

1. When a realtime event occurs in the `resguardos_bajas` table:
   - The Supabase realtime subscription receives the event
   - The hook updates the local store (add/update/remove)
   - The hook calls `addRealtimeChange()` to register the event
   
2. The `IndexationPopover` component:
   - Reads `realtimeChanges` from `indexationStore`
   - Displays a notification badge for each change
   - Shows the event type (INSERT/UPDATE/DELETE) with appropriate icon and color
   - Auto-dismisses after 5 seconds

3. Module key consistency ensures:
   - The hook registers changes under the correct module key
   - The popover can find and display the module state
   - Hydration works correctly across page reloads

## Testing

Build completed successfully with no errors:
```
✓ Compiled successfully
✓ Finished TypeScript
✅ [Hydration] resguardosBajas hydrated
```

## Files Modified

1. `src/hooks/indexation/useResguardosBajasIndexation.ts`
2. `src/hooks/indexation/useResguardosIndexation.ts`
3. `src/stores/resguardosBajasStore.ts`
4. `src/lib/clearIndexationData.ts`

## Pattern for Future Modules

When creating new indexation hooks, always:
1. Import `addRealtimeChange` from `useIndexationStore`
2. Call it after each store update in realtime event handlers
3. Use consistent camelCase module keys across all files
4. Match the key in `MODULE_CONFIGS` from `src/config/modules.ts`
5. Add the key to dependency arrays where needed

## Related Files

- `src/components/IndexationPopover.tsx` - Displays the notifications
- `src/stores/indexationStore.ts` - Manages realtime change events
- `src/config/modules.ts` - Module configuration with keys

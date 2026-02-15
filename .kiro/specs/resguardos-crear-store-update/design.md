# Resguardos Crear - Store Update Design

## Architecture Overview

### Current Flow
```
User clicks "Guardar"
  → useResguardoSubmit.handleSubmit()
  → API POST /api/resguardos/create
  → Database INSERT
  → API returns created resguardos
  → Success message shown
  → onSuccess() callback (clears form)
  
[Separately, after ~1-3 seconds]
  → Realtime detects INSERT
  → useResguardosIndexation handles event
  → Store updated via addResguardo()
```

### New Flow (Optimistic Update)
```
User clicks "Guardar"
  → useResguardoSubmit.handleSubmit()
  → API POST /api/resguardos/create
  → Database INSERT
  → API returns created resguardos
  → **IMMEDIATELY update store with returned data**
  → Success message shown
  → onSuccess() callback (clears form)
  
[Separately, realtime still works]
  → Realtime detects INSERT
  → useResguardosIndexation handles event
  → Store checks if resguardo already exists (idempotent)
  → Skip if already exists, add if new
```

## Component Design

### 1. Store Updates (`resguardosStore.ts`)

#### New Function: `addResguardoBatch`
```typescript
addResguardoBatch: (resguardos: Resguardo[]) => void
```

**Purpose:** Add multiple resguardos efficiently in a single operation

**Implementation:**
```typescript
addResguardoBatch: (resguardos) => set((state) => {
  // Filter out duplicates
  const existingIds = new Set(state.resguardos.map(r => r.id));
  const newResguardos = resguardos.filter(r => !existingIds.has(r.id));
  
  return {
    resguardos: [...state.resguardos, ...newResguardos],
    lastFetchedAt: new Date().toISOString(),
  };
}),
```

#### Updated Function: `addResguardo` (Make Idempotent)
```typescript
addResguardo: (resguardo) => set((state) => {
  // Check if already exists
  const exists = state.resguardos.some(r => r.id === resguardo.id);
  if (exists) {
    console.log('[ResguardosStore] Resguardo already exists, skipping:', resguardo.id);
    return state; // No change
  }
  
  return {
    resguardos: [...state.resguardos, resguardo],
    lastFetchedAt: new Date().toISOString(),
  };
}),
```

### 2. Hook Updates (`useResguardoSubmit.ts`)

#### Import Store
```typescript
import { useResguardosStore } from '@/stores/resguardosStore';
```

#### Use Store in Hook
```typescript
export function useResguardoSubmit(...) {
  // ... existing code ...
  const addResguardoBatch = useResguardosStore(state => state.addResguardoBatch);
  
  const handleSubmit = useCallback(async () => {
    // ... existing code up to API call ...
    
    const result = await response.json();
    console.log('✅ [RESGUARDO] Todos los artículos guardados exitosamente:', result);
    
    // NEW: Update store immediately with returned data
    if (result.data && Array.isArray(result.data)) {
      console.log('📦 [RESGUARDO] Actualizando store con', result.data.length, 'resguardos');
      addResguardoBatch(result.data);
    }
    
    // ... rest of existing code ...
  }, [...]);
}
```

### 3. Type Definitions

The `Resguardo` type already exists in `src/types/indexation.ts`. We need to ensure the API response matches this type.

**Expected Resguardo Type:**
```typescript
interface Resguardo {
  id: string;                    // UUID (serial in DB, but returned as string)
  folio: string;
  f_resguardo: string;           // ISO date string
  id_directorio: number;
  id_mueble: string;             // UUID
  origen: string;                // INEA | ITEA | NO_LISTADO
  puesto_resguardo: string;
  resguardante: string;
  created_by: string;            // UUID
  created_at?: string;           // ISO date string (optional)
}
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Action: Create Resguardo            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              useResguardoSubmit.handleSubmit()              │
│  1. Validate data                                           │
│  2. Generate folio                                          │
│  3. Prepare resguardos data                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              POST /api/resguardos/create                    │
│  - Uses service role key                                    │
│  - Inserts into database                                    │
│  - Returns created resguardos with IDs                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Response Handling                              │
│  1. Check response.ok                                       │
│  2. Parse JSON                                              │
│  3. **NEW: addResguardoBatch(result.data)**                 │
│  4. Show success message                                    │
│  5. Call onSuccess()                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Store Updated (Optimistic)                     │
│  - Resguardos immediately available in store                │
│  - User can navigate to "Consultar" and see them           │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼ (parallel, async)
┌─────────────────────────────────────────────────────────────┐
│              Realtime Event (1-3 seconds later)             │
│  1. Supabase detects INSERT                                 │
│  2. useResguardosIndexation receives event                  │
│  3. Calls addResguardo() (idempotent)                       │
│  4. Store checks if ID exists                               │
│  5. Skips if already added (no duplicate)                   │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Strategy

### Phase 1: Make Store Idempotent
1. Update `addResguardo` to check for existing IDs
2. Add console.log for debugging
3. Test with manual duplicate calls

### Phase 2: Add Batch Function
1. Implement `addResguardoBatch` in store
2. Filter duplicates before adding
3. Update timestamp once for entire batch

### Phase 3: Integrate with Hook
1. Import store in `useResguardoSubmit`
2. Call `addResguardoBatch` after successful API response
3. Add logging for debugging

### Phase 4: Testing
1. Create resguardo and verify immediate appearance
2. Check for duplicates when realtime fires
3. Test with multiple resguardos
4. Verify realtime still works for other users' changes

## Error Handling

### Store Update Fails
```typescript
try {
  if (result.data && Array.isArray(result.data)) {
    addResguardoBatch(result.data);
  }
} catch (storeError) {
  // Log but don't fail the operation
  console.error('⚠️ [RESGUARDO] Error updating store:', storeError);
  // Realtime will eventually sync the data
}
```

### API Returns Unexpected Data
```typescript
if (!result.data || !Array.isArray(result.data)) {
  console.warn('⚠️ [RESGUARDO] API did not return expected data format');
  // Don't update store, let realtime handle it
}
```

## Testing Strategy

### Unit Tests
- Test `addResguardo` idempotency
- Test `addResguardoBatch` with duplicates
- Test `addResguardoBatch` with empty array

### Integration Tests
- Create resguardo and verify store update
- Create multiple resguardos and verify batch update
- Verify no duplicates when realtime fires

### Manual Tests
1. Create single resguardo → Check store immediately
2. Create multiple resguardos → Check store immediately
3. Wait for realtime → Verify no duplicates
4. Open two browser tabs → Create in one, verify other sees it via realtime

## Performance Considerations

### Batch vs Individual Inserts
- **Individual:** O(n) operations, n timestamp updates
- **Batch:** O(n) filtering + O(1) insert, 1 timestamp update
- **Winner:** Batch is more efficient

### Memory Impact
- Adding resguardos to store increases memory usage
- Typical resguardo: ~500 bytes
- 100 resguardos: ~50KB
- **Impact:** Negligible

### Realtime Overhead
- Idempotency check adds minimal overhead
- Set lookup is O(1)
- **Impact:** <1ms per event

## Rollback Plan

If issues arise:
1. Remove store update from `useResguardoSubmit`
2. Revert `addResguardo` to non-idempotent version
3. Remove `addResguardoBatch` function
4. System falls back to realtime-only updates

## Future Enhancements

### Optimistic Updates for Other Operations
- Apply same pattern to edit operations
- Apply to delete operations
- Apply to other modules (INEA, ITEA, etc.)

### Conflict Resolution
- Handle conflicts between optimistic and realtime updates
- Implement last-write-wins strategy
- Add version numbers for conflict detection

### Offline Support
- Queue operations when offline
- Sync when connection restored
- Show pending operations to user

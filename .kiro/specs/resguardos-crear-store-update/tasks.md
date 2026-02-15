# Resguardos Crear - Store Update Tasks

## Task List

- [x] 1. Update resguardosStore with idempotent functions
  - [x] 1.1 Make `addResguardo` idempotent (check for existing ID)
  - [x] 1.2 Add `addResguardoBatch` function for batch inserts
  - [x] 1.3 Add console logging for debugging
  - [x] 1.4 Update TypeScript types if needed

- [x] 2. Update useResguardoSubmit hook
  - [x] 2.1 Import `useResguardosStore`
  - [x] 2.2 Get `addResguardoBatch` from store
  - [x] 2.3 Call `addResguardoBatch` after successful API response
  - [x] 2.4 Add error handling for store updates
  - [x] 2.5 Add console logging for debugging

- [x] 3. Verify API response format
  - [x] 3.1 Check that API returns `data` array with created resguardos
  - [x] 3.2 Verify all required fields are present in response
  - [x] 3.3 Ensure IDs are included in response

- [ ] 4. Testing
  - [ ] 4.1 Test creating single resguardo
  - [ ] 4.2 Test creating multiple resguardos
  - [ ] 4.3 Verify immediate appearance in store
  - [ ] 4.4 Verify no duplicates when realtime fires
  - [ ] 4.5 Test navigation to "Consultar Resguardos"
  - [ ] 4.6 Verify realtime still works for other users

- [ ] 5. Documentation
  - [ ] 5.1 Update code comments
  - [ ] 5.2 Document the optimistic update pattern
  - [ ] 5.3 Add troubleshooting guide

## Task Details

### Task 1: Update resguardosStore

**File:** `src/stores/resguardosStore.ts`

**Changes:**
1. Update `addResguardo` to check if ID already exists
2. Add `addResguardoBatch` function
3. Add logging

**Implementation:**
```typescript
addResguardo: (resguardo) => set((state) => {
  const exists = state.resguardos.some(r => r.id === resguardo.id);
  if (exists) {
    console.log('[ResguardosStore] Resguardo already exists, skipping:', resguardo.id);
    return state;
  }
  
  console.log('[ResguardosStore] Adding resguardo:', resguardo.id);
  return {
    resguardos: [...state.resguardos, resguardo],
    lastFetchedAt: new Date().toISOString(),
  };
}),

addResguardoBatch: (resguardos) => set((state) => {
  const existingIds = new Set(state.resguardos.map(r => r.id));
  const newResguardos = resguardos.filter(r => !existingIds.has(r.id));
  
  if (newResguardos.length === 0) {
    console.log('[ResguardosStore] All resguardos already exist, skipping batch');
    return state;
  }
  
  console.log('[ResguardosStore] Adding batch:', newResguardos.length, 'new resguardos');
  return {
    resguardos: [...state.resguardos, ...newResguardos],
    lastFetchedAt: new Date().toISOString(),
  };
}),
```

**Type Update:**
```typescript
interface ResguardosStore {
  // ... existing properties ...
  addResguardoBatch: (resguardos: Resguardo[]) => void;
}
```

### Task 2: Update useResguardoSubmit

**File:** `src/components/resguardos/crear/hooks/useResguardoSubmit.ts`

**Changes:**
1. Import store
2. Get batch function
3. Call after API success

**Implementation:**
```typescript
// Add import
import { useResguardosStore } from '@/stores/resguardosStore';

// In hook body
const addResguardoBatch = useResguardosStore(state => state.addResguardoBatch);

// After successful API response
const result = await response.json();
console.log('✅ [RESGUARDO] Todos los artículos guardados exitosamente:', result);

// NEW: Update store immediately
try {
  if (result.data && Array.isArray(result.data)) {
    console.log('📦 [RESGUARDO] Actualizando store con', result.data.length, 'resguardos');
    addResguardoBatch(result.data);
  } else {
    console.warn('⚠️ [RESGUARDO] API did not return expected data format');
  }
} catch (storeError) {
  console.error('⚠️ [RESGUARDO] Error updating store:', storeError);
  // Don't fail the operation, realtime will sync
}
```

### Task 3: Verify API Response

**File:** `src/app/api/resguardos/create/route.ts`

**Verification:**
- Check that response includes `data` array
- Verify all fields are present
- Ensure IDs are included

**Current Response:**
```typescript
return NextResponse.json({ 
  success: true, 
  data,  // ✅ Already returns data
  count: data?.length || 0
});
```

**Expected Data Format:**
```typescript
{
  success: true,
  data: [
    {
      id: "123",  // Serial ID as string
      folio: "RES-2024-001",
      f_resguardo: "2024-02-14T00:00:00.000Z",
      id_directorio: 1,
      id_mueble: "uuid-here",
      origen: "INEA",
      puesto_resguardo: "DIRECTOR",
      resguardante: "NOMBRE",
      created_by: "user-uuid",
      created_at: "2024-02-14T12:00:00.000Z"
    },
    // ... more resguardos
  ],
  count: 2
}
```

### Task 4: Testing

**Test Cases:**

1. **Single Resguardo Creation**
   - Create one resguardo
   - Check store immediately
   - Verify it appears in store
   - Wait 3 seconds
   - Verify no duplicate

2. **Multiple Resguardos Creation**
   - Create 5 resguardos
   - Check store immediately
   - Verify all 5 appear
   - Wait 3 seconds
   - Verify no duplicates

3. **Navigation Test**
   - Create resguardo
   - Navigate to "Consultar Resguardos"
   - Verify resguardo appears immediately

4. **Realtime Test**
   - Open two browser tabs
   - Create resguardo in tab 1
   - Verify tab 2 receives realtime update
   - Verify no duplicate in tab 1

5. **Error Handling Test**
   - Mock store error
   - Verify operation still succeeds
   - Verify realtime eventually syncs

### Task 5: Documentation

**Updates Needed:**

1. **Code Comments**
   - Document idempotency in store
   - Document optimistic update pattern
   - Explain why we check for duplicates

2. **README/Docs**
   - Add section on optimistic updates
   - Explain the flow
   - Document troubleshooting

3. **Troubleshooting Guide**
   - What to do if duplicates appear
   - How to verify store state
   - How to force re-index

## Acceptance Criteria Checklist

- [ ] Store functions are idempotent
- [ ] Batch function works correctly
- [ ] Hook updates store after API success
- [ ] No duplicates when realtime fires
- [ ] Resguardos appear immediately in consultar
- [ ] Realtime still works for other users
- [ ] Error handling doesn't break operation
- [ ] All tests pass
- [ ] Code is documented
- [ ] No performance degradation

## Definition of Done

- [ ] All tasks completed
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No regressions in existing functionality
- [ ] Performance is acceptable
- [ ] User can see resguardos immediately after creation

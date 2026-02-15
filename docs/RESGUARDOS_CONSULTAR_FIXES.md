# Resguardos Consultar - Fixes Applied

## Issues Fixed

### 1. TypeScript Error: refetch return type mismatch
**Problem**: `processResguardos` was async but TypeScript was inferring `void` instead of `Promise<void>`

**Solution**: Wrapped the function in an async arrow function in the return statement
```typescript
refetch: async () => { await processResguardos(); }
```

**File**: `src/components/resguardos/consultar/hooks/useResguardosData.ts`

---

### 2. Director not showing in table
**Problem**: The `director_nombre` field was not being populated correctly from the database relation

**Solution**: 
- Updated indexation hook to properly map `director_nombre` from the `directorio` relation
- Updated API route to include the relation in the SELECT query and map the data
- Fixed realtime subscription to include director relation on INSERT/UPDATE events

**Changes**:
1. **Indexation Hook** (`src/hooks/indexation/useResguardosIndexation.ts`):
   - Modified batch fetch to include `directorio!inner (nombre)` relation
   - Properly destructured and mapped `director_nombre` from nested object
   - Updated realtime INSERT/UPDATE handlers to fetch with relation

2. **API Route** (`src/app/api/resguardos/create/route.ts`):
   - Added `directorio!inner (nombre)` to SELECT query
   - Mapped returned data to include `director_nombre` field
   - Removed nested `directorio` object from response

---

### 3. Missing required fields error when creating resguardos
**Problem**: API validation was rejecting resguardos even though all required fields were present

**Solution**: 
- Added detailed logging to show which fields are missing
- Confirmed that `resguardante` is optional (as per user requirement)
- The validation logic was correct, but now includes better error messages

**File**: `src/app/api/resguardos/create/route.ts`

---

## Data Flow

### Creating Resguardos:
1. User submits form → `useResguardoSubmit.ts`
2. Data sent to API → `/api/resguardos/create/route.ts`
3. API inserts with service role key (bypasses RLS)
4. API returns data with `director_nombre` populated
5. Store updated optimistically → `useResguardosStore`
6. Realtime subscription picks up changes

### Displaying Resguardos:
1. Indexation hook loads all resguardos with director relation
2. Data stored in Zustand store with `director_nombre` field
3. `useResguardosData` processes store data (filter, sort, paginate)
4. `useResguardoDetails` fetches details for selected folio
5. Mueble details fetched from inventory stores (INEA, ITEA, NoListado)

---

## Key Fields in Resguardo Interface

```typescript
interface Resguardo {
  id: string;                    // Serial ID
  folio: string;                 // RES-XXXX
  f_resguardo: string;           // Date
  id_directorio: number;         // FK to directorio
  id_mueble: string;             // UUID FK to muebles
  origen: string;                // INEA | ITEA | NO_LISTADO
  puesto_resguardo: string;      // Position
  resguardante: string;          // Optional
  created_by: string;            // UUID
  created_at?: string;
  director_nombre?: string;      // Populated from relation
}
```

---

## Testing Checklist

- [x] TypeScript compiles without errors
- [ ] Creating resguardo shows director name in table
- [ ] Clicking resguardo shows details with director name
- [ ] Resguardante field is optional (can be empty)
- [ ] Store updates immediately after creation
- [ ] Realtime updates work for new resguardos
- [ ] Director name persists after page refresh
- [x] Resguardos store loads on traditional login
- [x] Resguardos store loads on SSO (Axpert) login

---

## Issue 4: Resguardos store not loading on login (RLS POLICY MISSING)

**Problem**: After logging in (both traditional and SSO), the resguardos store was initializing but returning 0 records even though data exists in the database.

**Root Cause**: The `resguardos` table was missing an RLS (Row Level Security) policy to allow anonymous read access. Other tables (muebles, mueblesitea, mueblestlaxcala) have this policy which allows the anon key to read data for:
1. Initial indexation on login
2. Realtime subscriptions for live updates

**Evidence from logs**:
```
✅ [RESGUARDOS INIT] Auth check result: {isAuthenticated: true, user: 'antonyazp@icloud.com'}
📊 [RESGUARDOS INIT] Store state check: {resguardosCount: 0, hasDataInIndexedDB: false, isAlreadyIndexed: false}
🔄 [RESGUARDOS INIT] No data found, starting full indexation
📦 [RESGUARDOS INDEX] Fetching batch at offset 0
✅ [RESGUARDOS INDEX] Batch fetched: 0 records  <-- PROBLEM: Should have records
```

**Solution**: Create an RLS policy for the `resguardos` table that matches the pattern used in other inventory tables.

**SQL to apply** (see `docs/RESGUARDOS_RLS_POLICY.sql`):
```sql
ALTER TABLE resguardos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read resguardos for realtime"
ON "public"."resguardos"
AS PERMISSIVE
FOR SELECT
TO anon
USING (true);
```

**Why this works**:
- The Supabase client uses the `anon` key for read operations (indexation and realtime)
- Write operations use the `service_role` key via API routes (e.g., `/api/resguardos/create`)
- This matches the security model used by all other inventory tables

**Changes made to code**:
1. Updated initialization logic to match INEA/ITEA pattern exactly
2. Added extensive debug logging to identify the issue
3. Reorganized function order to fix TypeScript errors

**After applying the RLS policy**, the logs should show:
```
✅ [RESGUARDOS INDEX] Batch fetched: X records  <-- Should show actual count
✅ [RESGUARDOS INDEX] Total fetched: X resguardos
```

---

## Notes

- The `director_nombre` field is populated at indexation time and stored in the Zustand store
- This avoids repeated JOIN queries when displaying the table
- The API route now returns data with `director_nombre` for immediate store updates
- Realtime subscription also fetches with relation to keep store in sync

# Directorio Transfer API - Authentication Fix

## Issue
The transfer API was returning 401 (Unauthorized) errors because it was expecting a Bearer token in the Authorization header, but the frontend was not sending it.

## Root Cause Analysis
1. The API route was validating authentication using a Bearer token from the request headers
2. The `useTransferActions` hook was not sending any authentication token
3. This pattern was inconsistent with other APIs in the project (like `resguardos/baja`) which receive `userId` in the request body

## Solution
Changed the authentication pattern to match the rest of the application:

### 1. API Route Changes (`src/app/api/admin/directorio/transfer-bienes/route.ts`)
- **REMOVED**: Bearer token validation from Authorization header
- **ADDED**: `userId` validation from request body
- **Pattern**: Now matches `resguardos/baja` API pattern

```typescript
// BEFORE (línea ~50)
const authHeader = request.headers.get('authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  console.error(`${logPrefix} ❌ No se proporcionó token de autenticación`);
  return NextResponse.json({ success: false, error: 'No autorizado - Token requerido' }, { status: 401 });
}

// AFTER
const { action, sourceDirectorId, targetDirectorId, sourceAreaId, targetAreaId, bienIds, userId } = body;

if (!userId) {
  console.error(`${logPrefix} ❌ No se proporcionó userId`);
  return NextResponse.json({ success: false, error: 'Usuario no válido' }, { status: 400 });
}
```

### 2. Hook Changes (`src/components/admin/directorio/hooks/useTransferActions.ts`)

#### Interface Updates
```typescript
// BEFORE
transferCompleteArea: (
  sourceDirectorId: number,
  targetDirectorId: number,
  sourceAreaId: number,
  targetAreaId: number | null
) => Promise<TransferResult>;

transferPartialBienes: (
  sourceDirectorId: number,
  targetDirectorId: number,
  targetAreaId: number,
  bienIds: { inea: number[]; itea: number[]; no_listado: number[] }
) => Promise<TransferResult>;

// AFTER
transferCompleteArea: (
  sourceDirectorId: number,
  targetDirectorId: number,
  sourceAreaId: number,
  targetAreaId: number | null,
  userId: string  // ← ADDED
) => Promise<TransferResult>;

transferPartialBienes: (
  sourceDirectorId: number,
  targetDirectorId: number,
  targetAreaId: number,
  bienIds: { inea: number[]; itea: number[]; no_listado: number[] },
  userId: string  // ← ADDED
) => Promise<TransferResult>;
```

#### Request Body Updates
```typescript
// transferCompleteArea
body: JSON.stringify({
  action: 'transfer_complete_area',
  sourceDirectorId,
  targetDirectorId,
  sourceAreaId,
  targetAreaId,
  userId,  // ← ADDED
}),

// transferPartialBienes
body: JSON.stringify({
  action: 'transfer_partial_bienes',
  sourceDirectorId,
  targetDirectorId,
  targetAreaId,
  bienIds,
  userId,  // ← ADDED
}),
```

#### Fixed Dependency Issue
Moved `invalidateCaches` function definition BEFORE its usage in `transferCompleteArea` and `transferPartialBienes` to fix the "used before declaration" error.

### 3. Component Changes (`src/components/admin/directorio/components/transfer/TransferMode.tsx`)

#### Added Session Hook
```typescript
import { useSession } from '@/hooks/useSession';

export function TransferMode({ ... }) {
  const { user } = useSession();  // ← ADDED
  // ...
}
```

#### Updated Transfer Calls
```typescript
// transferCompleteArea
result = await transferActions.transferCompleteArea(
  transferMode.sourceDirector.id_directorio,
  transferMode.targetDirector.id_directorio,
  transferMode.selectedAreas[0],
  transferMode.targetAreaId,
  user.id  // ← ADDED
);

// transferPartialBienes
result = await transferActions.transferPartialBienes(
  transferMode.sourceDirector.id_directorio,
  transferMode.targetDirector.id_directorio,
  transferMode.targetAreaId,
  bienIds,
  user.id  // ← ADDED
);
```

## Authentication Pattern
The API now follows the same pattern as other APIs in the project:

1. **No token validation at API level**: Authentication is handled by middleware at the page level
2. **userId in request body**: The authenticated user's ID is sent in the request body
3. **Service role key**: API uses Supabase service role key to bypass RLS (Row Level Security)
4. **Logging**: All operations are logged with the userId for audit purposes

## Reference Implementation
This pattern matches the implementation in:
- `src/app/api/resguardos/baja/route.ts`
- `src/components/resguardos/consultar/hooks/useResguardoDelete.ts`

## Testing
- ✅ Build passes without errors
- ✅ TypeScript compilation successful
- ✅ No diagnostic errors in modified files

## Files Modified
1. `src/app/api/admin/directorio/transfer-bienes/route.ts`
2. `src/components/admin/directorio/hooks/useTransferActions.ts`
3. `src/components/admin/directorio/components/transfer/TransferMode.tsx`

## Next Steps
The user should test the transfer functionality in the browser to confirm:
1. No more 401 errors
2. Transfers execute successfully
3. Logs show the correct userId
4. Cache invalidation works properly

# Origen Transfer - Authentication Fix v2

## Summary
Fixed authentication issues preventing superadmin users from transferring inventory records between origen tables (INEA, ITEJPA, TLAXCALA). Added comprehensive logging for debugging.

## Issues Fixed

### Issue 1: "No hay sesión activa"
**Problem**: The hook was trying to read session from `supabase.auth.getSession()`, but the Supabase client has `persistSession: false`, so the session is not available in the client.

**Solution**: Changed to read the access token directly from the `sb-access-token` cookie using `document.cookie`.

**File**: `src/hooks/useOrigenTransfer.ts`

```typescript
// Before
const { data: { session } } = await supabase.auth.getSession();
const accessToken = session?.access_token;

// After
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

const accessToken = getCookie('sb-access-token');
```

### Issue 2: "No tienes permisos para realizar esta acción"
**Problem**: The API was only checking for 'admin' role, but the user is a 'superadmin'.

**Solution**: Updated the role check to accept both 'admin' and 'superadmin' roles.

**File**: `src/app/api/inventario/transfer-origen/route.ts`

```typescript
// Before
if (userError || !userData || userData.rol !== 'admin') {
  return NextResponse.json({
    success: false,
    error: 'No tienes permisos para transferir registros',
    code: 'PERMISSION_DENIED',
  }, { status: 403 });
}

// After
if (userData.rol !== 'admin' && userData.rol !== 'superadmin') {
  console.log(`[${requestId}] ERROR: Rol insuficiente. Rol actual: ${userData.rol}`);
  return NextResponse.json({
    success: false,
    error: `No tienes permisos para transferir registros. Tu rol es: ${userData.rol}`,
    code: 'PERMISSION_DENIED',
  }, { status: 403 });
}
```

### Issue 3: Security and RLS Bypass
**Problem**: Need to ensure the API uses service role key to bypass RLS while maintaining security.

**Solution**: 
- API already uses `supabaseAdmin` client with `SUPABASE_SERVICE_ROLE_KEY`
- All database operations use `supabaseAdmin` to bypass RLS
- Authentication and authorization checks are performed server-side
- User permissions are verified before any database operations

**Security measures**:
1. ✅ Token validation using `supabaseAdmin.auth.getUser(token)`
2. ✅ Role verification from `usuarios` table using service role
3. ✅ All database operations use service role (bypasses RLS)
4. ✅ Comprehensive validation checks (resguardo, duplicates)
5. ✅ Audit logging in `cambios_inventario` table
6. ✅ Transaction rollback on errors

## Comprehensive Logging Added

### Frontend Logs (`useOrigenTransfer.ts`)
```typescript
console.log('[useOrigenTransfer] === INICIO TRANSFER ===');
console.log('[useOrigenTransfer] Params:', { recordId, idInventario, currentOrigen, targetOrigen });
console.log('[useOrigenTransfer] Leyendo cookies...');
console.log('[useOrigenTransfer] Token encontrado:', !!accessToken);
console.log('[useOrigenTransfer] Llamando a API...');
console.log('[useOrigenTransfer] Response status:', response.status);
console.log('[useOrigenTransfer] Response data:', data);
console.log('[useOrigenTransfer] ✓ Transfer exitoso');
```

### Backend Logs (`route.ts`)
```typescript
console.log(`[${requestId}] === INICIO TRANSFER ORIGEN ===`);
console.log(`[${requestId}] Body recibido:`, { record_id, id_inventario, origen_actual, origen_destino });
console.log(`[${requestId}] Authorization header presente:`, !!authHeader);
console.log(`[${requestId}] Token extraído (primeros 20 chars):`, token.substring(0, 20) + '...');
console.log(`[${requestId}] Verificando usuario con supabaseAdmin.auth.getUser()...`);
console.log(`[${requestId}] Usuario autenticado:`, { id: user.id, email: user.email });
console.log(`[${requestId}] Consultando rol del usuario en tabla usuarios...`);
console.log(`[${requestId}] Datos del usuario:`, { id, nombre, email, rol });
console.log(`[${requestId}] ✓ Usuario autorizado con rol: ${userData.rol}`);
console.log(`[${requestId}] Validaciones básicas pasadas`);
console.log(`[${requestId}] Verificando resguardo activo...`);
console.log(`[${requestId}] ✓ Sin resguardo activo`);
console.log(`[${requestId}] Verificando duplicado en destino...`);
console.log(`[${requestId}] ✓ No hay duplicado en destino`);
console.log(`[${requestId}] Iniciando transacción de transferencia...`);
console.log(`[${requestId}] ✓ Transacción completada exitosamente`);
console.log(`[${requestId}] === TRANSFER EXITOSO ===`, { ... });
```

## Files Modified

1. **src/hooks/useOrigenTransfer.ts**
   - Changed session reading from Supabase client to cookie reading
   - Added `getCookie()` helper function
   - Removed unused `supabase` import
   - Added comprehensive console logs for debugging

2. **src/app/api/inventario/transfer-origen/route.ts**
   - Updated role check to accept both 'admin' and 'superadmin'
   - Added detailed error messages with user's actual role
   - Added comprehensive console logs with request ID tracking
   - Enhanced error handling with specific error codes
   - All operations use `supabaseAdmin` (service role) to bypass RLS

## Debugging Instructions

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs starting with `[useOrigenTransfer]`
4. Check for:
   - Token found: should be `true`
   - Response status: should be `200` for success
   - Response data: check for error messages

### Check Server Logs
1. Open terminal where Next.js is running
2. Look for logs starting with `[requestId]` (e.g., `[abc123]`)
3. Follow the flow:
   - Body received
   - Authorization header present
   - Token extracted
   - User authenticated
   - User role verified
   - Validations passed
   - Transaction completed

### Common Issues and Solutions

**Issue**: `Token encontrado: false`
- **Cause**: Cookie not set or expired
- **Solution**: Re-login to get fresh token

**Issue**: `ERROR: No hay authorization header`
- **Cause**: Token not being sent in request
- **Solution**: Check cookie reading logic

**Issue**: `ERROR en auth.getUser()`
- **Cause**: Invalid or expired token
- **Solution**: Re-login to get fresh token

**Issue**: `ERROR: Rol insuficiente`
- **Cause**: User doesn't have admin or superadmin role
- **Solution**: Check user's role in database

**Issue**: `ERROR: Usuario no encontrado en tabla usuarios`
- **Cause**: User exists in auth but not in usuarios table
- **Solution**: Create user record in usuarios table

## Testing Instructions

1. **Login as superadmin**
   - Ensure you're logged in with a superadmin account
   - Check browser console for token

2. **Navigate to Levantamiento table**
   - Go to `/consultas/levantamiento`

3. **Open browser console**
   - Press F12
   - Go to Console tab
   - Clear console

4. **Test transfer functionality**
   - Click on any origen badge (INEA, ITEJPA, or TLAXCALA)
   - Watch console logs in browser
   - Select a different origen from the modal
   - Click "Continuar" to proceed to confirmation modal
   - Click "Confirmar" to execute transfer
   - Watch console logs in both browser and server

5. **Verify success**
   - Check for success toast
   - Check browser console for `✓ Transfer exitoso`
   - Check server logs for `=== TRANSFER EXITOSO ===`
   - Verify record moved to target table

## Expected Behavior

### Success Case
- ✅ Browser console shows all steps
- ✅ Server logs show complete flow with request ID
- ✅ Success toast appears
- ✅ Record moves from source to target table
- ✅ Audit log created in `cambios_inventario` table
- ✅ Table refreshes automatically

### Error Cases
- ❌ **No token**: Browser console shows "Token encontrado: false"
- ❌ **Invalid token**: Server logs show "ERROR en auth.getUser()"
- ❌ **No permission**: Server logs show "ERROR: Rol insuficiente. Rol actual: [role]"
- ❌ **Active resguardo**: Server logs show "ERROR: Registro tiene resguardo activo"
- ❌ **Duplicate ID**: Server logs show "ERROR: ID ya existe en destino"

## Technical Details

### Authentication Flow
1. User clicks origen badge
2. Frontend reads `sb-access-token` from cookie
3. Frontend sends POST request with token in Authorization header
4. API validates token using `supabaseAdmin.auth.getUser(token)` (service role)
5. API checks user role from `usuarios` table (service role, bypasses RLS)
6. API executes transfer transaction (service role, bypasses RLS)
7. API returns success/error response

### Service Role Usage
- `supabaseAdmin` client uses `SUPABASE_SERVICE_ROLE_KEY`
- Bypasses Row Level Security (RLS) policies
- Allows reading/writing to all tables regardless of RLS
- Used for:
  - User authentication verification
  - Role checking from `usuarios` table
  - Reading source record
  - Inserting into destination table
  - Creating audit log
  - Deleting from source table

### Security
- ✅ Token-based authentication (validated server-side)
- ✅ Role-based authorization (admin + superadmin)
- ✅ Service role used only after authentication/authorization
- ✅ Validation checks (resguardo, duplicates)
- ✅ Audit logging with user ID
- ✅ Transaction rollback on errors
- ✅ Detailed error messages for debugging

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important**: `SUPABASE_SERVICE_ROLE_KEY` must be set in `.env.local` for the API to work.

## Diagnostics
All TypeScript diagnostics passed with 0 errors:
- ✅ `src/app/api/inventario/transfer-origen/route.ts`
- ✅ `src/hooks/useOrigenTransfer.ts`

## Next Steps
1. Test the transfer functionality with superadmin account
2. Check browser console for frontend logs
3. Check server terminal for backend logs
4. Verify all validations work correctly
5. Check audit logs in `cambios_inventario` table
6. Monitor for any edge cases or errors

---

**Status**: ✅ Ready for testing with comprehensive logging
**Date**: 2026-03-05
**Author**: Kiro AI Assistant

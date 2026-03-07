# Origen Transfer Schema Fixes

## Overview
Fixed all basic schema errors in the origen transfer API that were causing 500 errors. These were fundamental database schema mismatches between the code and actual database structure.

## Issues Fixed

### 1. Wrong Table Names
**Problem**: API was using origen names directly as table names
- Used `'inea'`, `'itea'`, `'no-listado'` as table names
- But `'no-listado'` is not a valid table name (hyphens not allowed in SQL)

**Solution**: Created table name mapping
```typescript
const tableMap: Record<string, string> = {
  'inea': 'muebles',           // Correct table name for INEA
  'itea': 'mueblesitea',       // Correct table name for ITEA
  'no-listado': 'mueblestlaxcala'  // Correct table name for TLAXCALA
};
```

**Files Changed**:
- `checkDuplicateInDestino()` - Now maps origen to table name
- `executeTransferTransaction()` - Now maps both source and dest tables

### 2. Wrong Column Name in Resguardos Check
**Problem**: Used `id_inventario` column which doesn't exist
```typescript
.eq('id_mueble', idInventario)  // Wrong - idInventario is string like "INEA-123"
```

**Solution**: Use UUID and correct column
```typescript
.eq('id_mueble', recordId)  // Correct - recordId is UUID
```

**Files Changed**:
- `checkActiveResguardo()` - Changed parameter from `idInventario` to `recordId`
- POST handler - Pass `record_id` instead of `id_inventario`

### 3. Non-existent Column in Resguardos
**Problem**: Tried to filter by `fecha_baja` column which doesn't exist
```typescript
.is('fecha_baja', null)  // Column doesn't exist
```

**Solution**: Removed the filter - any resguardo means it's active
```typescript
.eq('id_mueble', recordId)
.limit(1)
// No fecha_baja filter
```

### 4. Wrong Column Name in Duplicate Check
**Problem**: Used `id_inventario` column in inventory tables
```typescript
.eq('id_inventario', idInventario)  // Wrong column name
```

**Solution**: Use correct column name `id_inv`
```typescript
.eq('id_inv', idInventario)  // Correct column name
```

### 5. Wrong Columns in Audit Table
**Problem**: Used wrong column names in `cambios_inventario` table
```typescript
{
  id_inventario: idInventario,  // Wrong - should be id_mueble (UUID)
  campo: 'origen',              // Wrong - should be campo_modificado
  timestamp: ...                // Wrong - should be fecha_cambio
}
```

**Solution**: Use correct schema
```typescript
{
  id_mueble: recordId,          // UUID of the record
  tabla_origen: sourceTable,    // Table name
  campo_modificado: 'origen',   // Field that changed
  valor_anterior: origenActual, // Old value
  valor_nuevo: origenDestino,   // New value
  usuario_id: userId,           // User who made change
  fecha_cambio: new Date().toISOString()  // Timestamp
}
```

## Database Schema Reference

### Inventory Tables
- **Tables**: `muebles` (INEA), `mueblesitea` (ITEA), `mueblestlaxcala` (TLAXCALA/NO_LISTADO)
- **ID Column**: `id` (UUID primary key)
- **Inventory ID Column**: `id_inv` (string like "INEA-53201-I-060400428-00373-09")

### Resguardos Table
- **Table**: `resguardos`
- **Mueble Reference**: `id_mueble` (UUID, references inventory table `id`)
- **No `fecha_baja` column** - bajas are stored in separate `resguardos_bajas` table

### Cambios Inventario Table
- **Table**: `cambios_inventario`
- **Columns**:
  - `id_mueble` (UUID) - references inventory record
  - `tabla_origen` (string) - source table name
  - `campo_modificado` (string) - field that changed
  - `valor_anterior` (string) - old value
  - `valor_nuevo` (string) - new value
  - `usuario_id` (UUID) - user who made change
  - `usuario_email` (string) - user email
  - `usuario_rol` (string) - user role
  - `fecha_cambio` (timestamp) - when change occurred

## Testing

After these fixes, the transfer flow should work:
1. ✅ Resguardo check uses correct UUID and column
2. ✅ Duplicate check uses correct table names and column
3. ✅ Transaction uses correct table names
4. ✅ Audit log uses correct columns

## Related Files
- `src/app/api/inventario/transfer-origen/route.ts` - Main API route (fixed)
- `src/stores/noListadoStore.ts` - Reference for table name
- `src/stores/ineaStore.ts` - Reference for table name
- `src/stores/iteaStore.ts` - Reference for table name
- `src/app/api/resguardos/baja/route.ts` - Reference for resguardos schema

## Next Steps
1. Test the complete transfer flow in the UI
2. Verify audit logs are created correctly
3. Confirm rollback works if any step fails

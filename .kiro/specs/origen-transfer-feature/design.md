---
status: draft
created: 2026-03-05
---

# Diseño Técnico: Transferencia de Origen

## Arquitectura General

```
┌─────────────────┐
│  InventoryTable │
│   (UI Layer)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OrigenBadge    │◄─── Click evento
│   + Dropdown    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ TransferModal   │◄─── Confirmación
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│useOrigenTransfer│◄─── Custom Hook
│     (Logic)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /api/     │
│inventario/      │
│transfer-origen  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │
│  Transaction    │
└─────────────────┘
```

## Componentes Frontend

### 1. OrigenBadge Component

**Ubicación:** `src/components/consultas/shared/OrigenBadge.tsx`

```typescript
interface OrigenBadgeProps {
  currentOrigen: 'inea' | 'itea' | 'no-listado';
  idInventario: string;
  recordId: string;
  onTransferSuccess: () => void;
  disabled?: boolean;
}

// Features:
// - Badge visual con color según origen
// - Dropdown con opciones de destino
// - Solo visible para admin
// - Disabled si hay resguardo activo
```

**Estilos:**
- INEA: bg-blue-100 text-blue-800
- ITEA: bg-green-100 text-green-800
- No Listado: bg-gray-100 text-gray-800

### 2. TransferOrigenModal Component

**Ubicación:** `src/components/consultas/shared/modals/TransferOrigenModal.tsx`

```typescript
interface TransferOrigenModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: InventoryRecord;
  currentOrigen: 'inea' | 'itea' | 'no-listado';
  targetOrigen: 'inea' | 'itea' | 'no-listado';
  onConfirm: () => Promise<void>;
}

// Secciones del modal:
// 1. Header con título "Transferir Origen"
// 2. Preview visual: [INEA] → [ITEA]
// 3. Información del registro (id_inventario, descripción)
// 4. Advertencias si aplican
// 5. Botones: Cancelar / Confirmar
```

### 3. useOrigenTransfer Hook

**Ubicación:** `src/hooks/useOrigenTransfer.ts`

```typescript
interface UseOrigenTransferParams {
  currentOrigen: 'inea' | 'itea' | 'no-listado';
  onSuccess?: () => void;
}

interface UseOrigenTransferReturn {
  transferOrigen: (recordId: string, targetOrigen: string) => Promise<void>;
  isTransferring: boolean;
  error: string | null;
  canTransfer: (recordId: string) => Promise<boolean>;
}

// Responsabilidades:
// - Llamar API de transferencia
// - Manejar estados de loading/error
// - Validar pre-transferencia
// - Actualizar stores locales
// - Invalidar queries
// - Mostrar toasts
```

## API Endpoint

### POST /api/inventario/transfer-origen

**Ubicación:** `src/app/api/inventario/transfer-origen/route.ts`

**Request Body:**
```typescript
{
  record_id: string;          // UUID del registro en tabla origen
  id_inventario: string;      // ID de inventario (para validación)
  origen_actual: 'inea' | 'itea' | 'no-listado';
  origen_destino: 'inea' | 'itea' | 'no-listado';
}
```

**Response Success (200):**
```typescript
{
  success: true;
  message: "Registro transferido exitosamente";
  new_record_id: string;      // UUID del nuevo registro en tabla destino
  cambio_id: string;          // ID del registro en cambios_inventario
}
```

**Response Error (400/403/500):**
```typescript
{
  success: false;
  error: string;
  code: 'VALIDATION_ERROR' | 'PERMISSION_DENIED' | 'RESGUARDO_ACTIVE' | 'DUPLICATE_ID' | 'TRANSACTION_FAILED';
}
```

### Validaciones en API

```typescript
// 1. Autenticación y autorización
const session = await getSession();
if (!session || session.user.rol !== 'admin') {
  return error(403, 'PERMISSION_DENIED');
}

// 2. Validar parámetros
if (origen_actual === origen_destino) {
  return error(400, 'VALIDATION_ERROR', 'Origen y destino son iguales');
}

// 3. Verificar resguardo activo
const hasActiveResguardo = await checkActiveResguardo(id_inventario);
if (hasActiveResguardo) {
  return error(400, 'RESGUARDO_ACTIVE');
}

// 4. Verificar duplicado en destino
const existsInDestino = await checkDuplicateInDestino(id_inventario, origen_destino);
if (existsInDestino) {
  return error(400, 'DUPLICATE_ID');
}
```

### Transacción SQL

```sql
BEGIN;

-- 1. Leer registro origen
SELECT * FROM {origen_actual} WHERE id = $1 FOR UPDATE;

-- 2. Insertar en destino (nuevo UUID)
INSERT INTO {origen_destino} (
  id_inventario,
  descripcion,
  marca,
  modelo,
  serie,
  id_area,
  id_director,
  id_estatus,
  -- ... todos los campos
  created_at,
  updated_at
) VALUES (
  -- valores del registro origen
) RETURNING id;

-- 3. Registrar en cambios_inventario
INSERT INTO cambios_inventario (
  id_inventario,
  campo,
  valor_anterior,
  valor_nuevo,
  usuario_id,
  timestamp
) VALUES (
  $id_inventario,
  'origen',
  $origen_actual,
  $origen_destino,
  $usuario_id,
  NOW()
) RETURNING id;

-- 4. Eliminar de origen
DELETE FROM {origen_actual} WHERE id = $1;

COMMIT;
```

## Integración en Tablas Existentes

### Modificaciones en InventoryTable

**Archivos a modificar:**
- `src/components/consultas/inea/components/InventoryTable.tsx`
- `src/components/consultas/itea/components/InventoryTable.tsx`
- `src/components/consultas/no-listado/components/InventoryTable.tsx`
- `src/components/consultas/inea/obsoletos/components/InventoryTable.tsx`
- `src/components/consultas/itea/obsoletos/components/InventoryTable.tsx`

**Cambios:**
1. Agregar columna "Origen" después de "ID Inventario"
2. Renderizar `<OrigenBadge>` en la columna
3. Pasar callback `onTransferSuccess` para refetch

```typescript
// Ejemplo de integración
<td className="px-4 py-3">
  <OrigenBadge
    currentOrigen="inea"
    idInventario={item.id_inventario}
    recordId={item.id}
    onTransferSuccess={() => {
      refetch();
      toast.success('Registro transferido exitosamente');
    }}
    disabled={item.has_active_resguardo}
  />
</td>
```

## Actualización de Stores

### Zustand Store Updates

Después de transferencia exitosa, actualizar stores:

```typescript
// En useOrigenTransfer hook
const updateStores = (recordId: string, targetOrigen: string) => {
  // Remover de store origen
  if (currentOrigen === 'inea') {
    useIneaStore.getState().removeItem(recordId);
  } else if (currentOrigen === 'itea') {
    useIteaStore.getState().removeItem(recordId);
  } else {
    useNoListadoStore.getState().removeItem(recordId);
  }
  
  // No agregamos a store destino porque el usuario
  // está en la vista del origen, el registro debe desaparecer
  
  // Actualizar contadores
  useIndexationStore.getState().decrementCount(currentOrigen);
  useIndexationStore.getState().incrementCount(targetOrigen);
};
```

### React Query Invalidation

```typescript
// Invalidar queries relacionadas
queryClient.invalidateQueries({ queryKey: ['inventory', currentOrigen] });
queryClient.invalidateQueries({ queryKey: ['inventory', targetOrigen] });
queryClient.invalidateQueries({ queryKey: ['cambios-inventario', idInventario] });
```

## Flujo de Usuario

```
1. Usuario admin ve tabla de inventario
   ↓
2. Observa badge "INEA" en columna Origen
   ↓
3. Click en badge → Dropdown aparece
   ↓
4. Opciones: [ITEA] [No Listado]
   ↓
5. Selecciona "ITEA"
   ↓
6. Modal de confirmación aparece
   - Muestra: INEA → ITEA
   - Info del registro
   - Botón "Confirmar Transferencia"
   ↓
7. Click en Confirmar
   ↓
8. Loading spinner en modal
   ↓
9. API ejecuta transacción
   ↓
10. Success:
    - Modal se cierra
    - Toast: "Registro transferido a ITEA"
    - Registro desaparece de tabla
    - Contador actualizado
    ↓
11. Error:
    - Modal muestra error
    - Toast de error con detalles
    - Usuario puede reintentar
```

## Manejo de Errores

### Errores Comunes

| Error | Causa | Mensaje Usuario | Acción |
|-------|-------|-----------------|--------|
| PERMISSION_DENIED | Usuario no es admin | "No tienes permisos para transferir registros" | Ocultar opción |
| RESGUARDO_ACTIVE | Registro tiene resguardo | "No se puede transferir: tiene resguardo activo" | Deshabilitar badge |
| DUPLICATE_ID | id_inventario existe en destino | "El ID ya existe en la tabla destino" | Mostrar error |
| TRANSACTION_FAILED | Error en DB | "Error al transferir. Intenta nuevamente" | Permitir reintentar |
| NETWORK_ERROR | Sin conexión | "Error de conexión. Verifica tu internet" | Permitir reintentar |

### Rollback Automático

Si cualquier paso de la transacción falla:
1. PostgreSQL hace rollback automático
2. No se pierde ningún dato
3. Registro permanece en tabla origen
4. Error se reporta al usuario

## Consideraciones de Performance

### Optimizaciones

1. **Índices de DB:**
```sql
-- Asegurar índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_inea_id_inventario ON inea(id_inventario);
CREATE INDEX IF NOT EXISTS idx_itea_id_inventario ON itea(id_inventario);
CREATE INDEX IF NOT EXISTS idx_no_listado_id_inventario ON no_listado(id_inventario);
```

2. **Validación en Paralelo:**
```typescript
// Ejecutar validaciones en paralelo
const [hasResguardo, existsInDestino] = await Promise.all([
  checkActiveResguardo(id_inventario),
  checkDuplicateInDestino(id_inventario, origen_destino)
]);
```

3. **Debounce en Dropdown:**
```typescript
// Evitar clicks múltiples accidentales
const debouncedTransfer = useMemo(
  () => debounce(transferOrigen, 300),
  [transferOrigen]
);
```

## Testing

### Unit Tests

```typescript
// useOrigenTransfer.test.ts
describe('useOrigenTransfer', () => {
  it('should transfer record successfully', async () => {});
  it('should handle permission denied', async () => {});
  it('should handle active resguardo', async () => {});
  it('should update stores after transfer', async () => {});
});
```

### Integration Tests

```typescript
// transfer-origen.test.ts
describe('POST /api/inventario/transfer-origen', () => {
  it('should transfer from inea to itea', async () => {});
  it('should rollback on error', async () => {});
  it('should create audit record', async () => {});
  it('should prevent duplicate id_inventario', async () => {});
});
```

## Seguridad

### Validaciones de Seguridad

1. **Autenticación:** Verificar sesión válida
2. **Autorización:** Solo rol `admin`
3. **Input Sanitization:** Validar todos los parámetros
4. **SQL Injection:** Usar prepared statements
5. **Rate Limiting:** Máximo 10 transferencias/minuto por usuario

### RLS Policies

```sql
-- Asegurar que RLS permite la operación
-- Las políticas existentes deben permitir:
-- - SELECT en tabla origen (para admin)
-- - INSERT en tabla destino (para admin)
-- - DELETE en tabla origen (para admin)
```

## Monitoreo y Logs

### Logs de Auditoría

```typescript
// Registrar en logs del servidor
console.log({
  action: 'ORIGEN_TRANSFER',
  user_id: session.user.id,
  id_inventario,
  origen_actual,
  origen_destino,
  timestamp: new Date().toISOString(),
  success: true
});
```

### Métricas

- Número de transferencias por día
- Tasa de éxito/error
- Tiempo promedio de transferencia
- Errores más comunes

## Documentación

### Comentarios en Código

```typescript
/**
 * Transfiere un registro de inventario entre tablas (inea, itea, no-listado)
 * 
 * @param recordId - UUID del registro en tabla origen
 * @param targetOrigen - Tabla destino
 * @returns Promise con resultado de la transferencia
 * 
 * @throws {Error} Si usuario no es admin
 * @throws {Error} Si registro tiene resguardo activo
 * @throws {Error} Si id_inventario existe en destino
 * 
 * @example
 * await transferOrigen('uuid-123', 'itea');
 */
```

### README

Crear `docs/ORIGEN_TRANSFER_FEATURE.md` con:
- Descripción de la funcionalidad
- Casos de uso
- Guía de usuario
- Troubleshooting

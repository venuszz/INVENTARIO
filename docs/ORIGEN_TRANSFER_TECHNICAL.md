# Documentación Técnica: Transferencia de Origen

**Versión:** 1.0  
**Fecha:** 2026-03-05  
**Audiencia:** Desarrolladores y Arquitectos

## Arquitectura General

### Visión General

La funcionalidad de Transferencia de Origen implementa un sistema de migración de registros entre tablas de inventario con las siguientes características:

- **Transaccional:** Operaciones atómicas con rollback automático
- **Auditada:** Registro completo en `cambios_inventario`
- **Segura:** Validaciones en backend y frontend
- **Performante:** Índices optimizados y queries eficientes

### Stack Tecnológico

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Estado:** React Query, Zustand
- **Backend:** Next.js API Routes
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth

## Arquitectura de Componentes

### Diagrama de Flujo

```
┌─────────────────┐
│  OrigenBadge    │ ← Usuario hace clic
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ TransferOrigenModal     │ ← Usuario confirma
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  useOrigenTransfer      │ ← Hook ejecuta API call
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ /api/inventario/        │ ← API valida y ejecuta
│ transfer-origen         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Supabase Transaction   │ ← Transacción SQL
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  React Query            │ ← Invalidación y refetch
│  Invalidation           │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  UI Update              │ ← Actualización automática
└─────────────────────────┘
```

## Componentes Frontend

### 1. OrigenBadge

**Ubicación:** `src/components/consultas/shared/OrigenBadge.tsx`

**Responsabilidades:**
- Mostrar badge visual del origen actual
- Renderizar dropdown con opciones de destino
- Manejar estado de disabled
- Abrir modal de confirmación

**Props:**
```typescript
interface OrigenBadgeProps {
  currentOrigen: 'inea' | 'itea' | 'no-listado';
  idInventario: string;
  recordId: string;
  onTransferSuccess: () => void;
  disabled?: boolean;
  hasActiveResguardo?: boolean;
}
```

**Estados:**
- `isOpen`: Controla visibilidad del dropdown
- `selectedTarget`: Origen destino seleccionado
- `showModal`: Controla visibilidad del modal

**Configuración de Colores:**
```typescript
const ORIGEN_CONFIG = {
  inea: {
    label: 'INEA',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    hoverBg: 'hover:bg-blue-200',
  },
  itea: {
    label: 'ITEA',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    hoverBg: 'hover:bg-green-200',
  },
  'no-listado': {
    label: 'No Listado',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    hoverBg: 'hover:bg-purple-200',
  },
};
```

### 2. TransferOrigenModal

**Ubicación:** `src/components/consultas/shared/modals/TransferOrigenModal.tsx`

**Responsabilidades:**
- Mostrar información del registro
- Visualizar transferencia (origen → destino)
- Mostrar advertencias
- Ejecutar transferencia
- Manejar estados de loading y error

**Props:**
```typescript
interface TransferOrigenModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrigen: OrigenType;
  targetOrigen: OrigenType;
  idInventario: string;
  recordId: string;
  onSuccess: () => void;
}
```

**Estados:**
- `isTransferring`: Loading durante transferencia
- `error`: Mensaje de error si falla

**Flujo de Ejecución:**
1. Usuario hace clic en "Confirmar Transferencia"
2. Se llama a `transferOrigen()` del hook
3. Se muestra loading state
4. Si éxito: cierra modal y ejecuta callback
5. Si error: muestra mensaje de error

### 3. useOrigenTransfer Hook

**Ubicación:** `src/hooks/useOrigenTransfer.ts`

**Responsabilidades:**
- Ejecutar llamada a API
- Manejar autenticación (Bearer token)
- Invalidar queries de React Query
- Mostrar toasts de éxito/error
- Manejar errores específicos

**Interface:**
```typescript
interface UseOrigenTransferReturn {
  transferOrigen: (
    recordId: string,
    idInventario: string,
    targetOrigen: OrigenType
  ) => Promise<void>;
  isTransferring: boolean;
  error: string | null;
  canTransfer: (recordId: string) => Promise<boolean>;
}
```

**Invalidación de Queries:**
```typescript
const invalidateQueries = (targetOrigen: OrigenType) => {
  queryClient.invalidateQueries({ queryKey: ['inventory', currentOrigen] });
  queryClient.invalidateQueries({ queryKey: ['inventory', targetOrigen] });
  queryClient.invalidateQueries({ queryKey: ['obsoletos', currentOrigen] });
  queryClient.invalidateQueries({ queryKey: ['obsoletos', targetOrigen] });
  queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
};
```

**Manejo de Errores:**
```typescript
switch (data.code) {
  case 'PERMISSION_DENIED':
    errorMessage = 'No tienes permisos para realizar esta acción';
    break;
  case 'RESGUARDO_ACTIVE':
    errorMessage = 'No se puede transferir: el registro tiene un resguardo activo';
    break;
  case 'DUPLICATE_ID':
    errorMessage = 'El ID de inventario ya existe en la tabla destino';
    break;
  case 'VALIDATION_ERROR':
    errorMessage = data.error || 'Error de validación';
    break;
  case 'TRANSACTION_FAILED':
    errorMessage = 'Error al procesar la transferencia. Intenta nuevamente';
    break;
}
```

## Backend API

### Endpoint: POST /api/inventario/transfer-origen

**Ubicación:** `src/app/api/inventario/transfer-origen/route.ts`

**Autenticación:**
- Bearer token en header `Authorization`
- Verificación de sesión activa
- Validación de rol admin

**Request Body:**
```typescript
{
  record_id: string;        // UUID del registro
  id_inventario: string;    // ID de inventario
  origen_actual: string;    // 'inea' | 'itea' | 'no-listado'
  origen_destino: string;   // 'inea' | 'itea' | 'no-listado'
}
```

**Response (Success):**
```typescript
{
  success: true;
  message: string;
  data: {
    new_record_id: string;  // UUID del nuevo registro
    cambio_id: number;      // ID del registro de auditoría
  }
}
```

**Response (Error):**
```typescript
{
  success: false;
  error: string;
  code: 'PERMISSION_DENIED' | 'RESGUARDO_ACTIVE' | 'DUPLICATE_ID' | 
        'VALIDATION_ERROR' | 'TRANSACTION_FAILED';
}
```

### Validaciones Backend

#### 1. checkActiveResguardo()

**Propósito:** Verificar si el registro tiene un resguardo activo

**Query:**
```sql
SELECT COUNT(*) as count
FROM resguardos
WHERE id_mueble = $1
  AND estatus = 'ACTIVO'
```

**Retorna:** `true` si hay resguardo activo, `false` si no

#### 2. checkDuplicateInDestino()

**Propósito:** Verificar si el ID de inventario ya existe en destino

**Query:**
```sql
SELECT COUNT(*) as count
FROM {tabla_destino}
WHERE id_inv = $1
```

**Retorna:** `true` si existe duplicado, `false` si no

### Transacción SQL

#### executeTransferTransaction()

**Propósito:** Ejecutar la transferencia completa en una transacción

**Pasos:**

1. **SELECT del registro origen:**
```sql
SELECT * FROM {tabla_origen}
WHERE id = $1
```

2. **INSERT en tabla destino:**
```sql
INSERT INTO {tabla_destino} (
  id,              -- Nuevo UUID
  id_inv,
  rubro,
  descripcion,
  -- ... todos los campos
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  $id_inv,
  $rubro,
  $descripcion,
  -- ... valores del registro origen
  NOW(),
  NOW()
) RETURNING id
```

3. **INSERT en cambios_inventario:**
```sql
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
) RETURNING id
```

4. **DELETE de tabla origen:**
```sql
DELETE FROM {tabla_origen}
WHERE id = $1
```

**Rollback Manual:**

Si cualquier paso falla, se ejecuta rollback manual:

```typescript
// Rollback: eliminar de destino si se insertó
if (newRecordId) {
  await supabaseAdmin
    .from(targetTable)
    .delete()
    .eq('id', newRecordId);
}

// Rollback: eliminar registro de auditoría si se creó
if (cambioId) {
  await supabaseAdmin
    .from('cambios_inventario')
    .delete()
    .eq('id', cambioId);
}
```

## Base de Datos

### Tablas Involucradas

#### 1. mueblesinea (INEA)
- Tabla origen/destino para registros INEA
- Campos: id (UUID), id_inv, descripcion, area, directorio, etc.

#### 2. mueblesitea (ITEA)
- Tabla origen/destino para registros ITEA
- Campos: id (UUID), id_inv, descripcion, area, directorio, etc.

#### 3. mueblestlaxcala (No Listado)
- Tabla origen/destino para registros No Listado
- Campos: id (UUID), id_inv, descripcion, area, directorio, etc.

#### 4. cambios_inventario (Auditoría)
- Registra todos los cambios de origen
- Campos: id, id_inventario, campo, valor_anterior, valor_nuevo, usuario_id, timestamp

#### 5. resguardos (Validación)
- Usada para verificar resguardos activos
- Campos: id, id_mueble, estatus, etc.

### Índices Recomendados

**Archivo:** `docs/ORIGEN_TRANSFER_DB_INDEXES.sql`

```sql
-- Índice en id_inv para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_mueblesinea_id_inv 
ON mueblesinea(id_inv);

CREATE INDEX IF NOT EXISTS idx_mueblesitea_id_inv 
ON mueblesitea(id_inv);

CREATE INDEX IF NOT EXISTS idx_mueblestlaxcala_id_inv 
ON mueblestlaxcala(id_inv);

-- Índice en resguardos para validación
CREATE INDEX IF NOT EXISTS idx_resguardos_id_mueble_estatus 
ON resguardos(id_mueble, estatus);

-- Índice en cambios_inventario para auditoría
CREATE INDEX IF NOT EXISTS idx_cambios_inventario_id_inventario 
ON cambios_inventario(id_inventario);
```

**Propósito de cada índice:**
- `id_inv`: Acelera búsqueda de duplicados
- `id_mueble + estatus`: Acelera validación de resguardos
- `id_inventario`: Acelera consultas de historial

## Gestión de Estado

### React Query

**Queries Invalidadas:**
```typescript
['inventory', currentOrigen]  // Tabla origen
['inventory', targetOrigen]   // Tabla destino
['obsoletos', currentOrigen]  // Obsoletos origen
['obsoletos', targetOrigen]   // Obsoletos destino
['inventory-counts']          // Contadores globales
```

**Comportamiento:**
- Invalidación marca queries como stale
- React Query ejecuta refetch automático
- UI se actualiza con nuevos datos
- Stores Zustand se sincronizan

### Zustand Stores

**Stores Afectados:**
- `ineaStore`: Caché de registros INEA
- `iteaStore`: Caché de registros ITEA
- `noListadoStore`: Caché de registros No Listado

**Métodos Relevantes:**
```typescript
removeMueble(id: string): void  // Elimina registro del caché
```

**Sincronización:**
- Stores se actualizan cuando React Query refetch
- Persistencia automática en IndexedDB
- No requiere actualización manual

## Seguridad

### Autenticación

**Verificación de Sesión:**
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  throw new Error('No hay sesión activa');
}
```

**Bearer Token:**
```typescript
headers: {
  'Authorization': `Bearer ${session.access_token}`,
}
```

### Autorización

**Verificación de Rol Admin:**
```typescript
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();

if (profile?.role !== 'admin') {
  return NextResponse.json({
    success: false,
    error: 'No tienes permisos para realizar esta acción',
    code: 'PERMISSION_DENIED',
  }, { status: 403 });
}
```

### Validaciones

**Frontend:**
- Verificación de sesión activa
- Validación de rol admin (UI disabled)
- Verificación de resguardo activo (UI disabled)

**Backend:**
- Verificación de sesión activa
- Validación de rol admin
- Verificación de resguardo activo
- Verificación de duplicados
- Validación de parámetros

## Performance

### Optimizaciones Implementadas

1. **Índices de Base de Datos:**
   - Búsquedas de duplicados: O(log n)
   - Validación de resguardos: O(log n)
   - Consultas de historial: O(log n)

2. **React Query Cache:**
   - Datos en memoria para acceso rápido
   - Invalidación selectiva (solo queries afectadas)
   - Refetch automático en background

3. **Zustand + IndexedDB:**
   - Caché persistente para offline
   - Acceso rápido sin llamadas al servidor
   - Sincronización automática

4. **Transacciones SQL:**
   - Operaciones atómicas
   - Rollback automático en errores
   - Consistencia garantizada

### Métricas Esperadas

- **Tiempo de transferencia:** < 2 segundos
- **Tiempo de validación:** < 500ms
- **Tiempo de refetch:** < 1 segundo
- **Tamaño de payload:** < 10KB

## Testing

### Testing Manual Recomendado

**Casos Felices:**
1. Transferir de INEA a ITEA
2. Transferir de ITEA a No Listado
3. Transferir de No Listado a INEA
4. Verificar registro en destino
5. Verificar auditoría en cambios_inventario

**Casos de Error:**
1. Intentar sin ser admin
2. Intentar con resguardo activo
3. Intentar con ID duplicado
4. Simular error de red
5. Simular timeout

**Testing de Performance:**
1. Medir tiempo de transferencia
2. Verificar que UI no se bloquea
3. Probar con múltiples usuarios
4. Verificar índices con EXPLAIN
5. Probar con tablas grandes

**Testing de Integridad:**
1. Verificar que todos los campos se copian
2. Verificar que UUIDs son únicos
3. Verificar que timestamps son correctos
4. Verificar que auditoría es completa
5. Verificar rollback en errores

### Testing Automatizado (Futuro)

**Unit Tests:**
```typescript
describe('useOrigenTransfer', () => {
  it('should transfer record successfully', async () => {
    // Test implementation
  });
  
  it('should handle RESGUARDO_ACTIVE error', async () => {
    // Test implementation
  });
  
  it('should invalidate correct queries', async () => {
    // Test implementation
  });
});
```

**Integration Tests:**
```typescript
describe('Transfer Origen API', () => {
  it('should execute transaction successfully', async () => {
    // Test implementation
  });
  
  it('should rollback on error', async () => {
    // Test implementation
  });
  
  it('should create audit record', async () => {
    // Test implementation
  });
});
```

## Monitoreo y Logging

### Logs Recomendados

**Frontend:**
```typescript
console.log('[Transfer] Starting transfer:', {
  recordId,
  idInventario,
  currentOrigen,
  targetOrigen,
});

console.log('[Transfer] Transfer successful:', {
  newRecordId,
  cambioId,
});

console.error('[Transfer] Transfer failed:', {
  error,
  code,
});
```

**Backend:**
```typescript
console.log('[API] Transfer request received:', {
  userId: session.user.id,
  recordId: body.record_id,
  origen: body.origen_actual,
  destino: body.origen_destino,
});

console.log('[API] Validation passed');

console.log('[API] Transaction executed:', {
  newRecordId,
  cambioId,
  duration: Date.now() - startTime,
});

console.error('[API] Transaction failed:', {
  error: error.message,
  stack: error.stack,
});
```

### Métricas a Monitorear

1. **Tasa de éxito:** % de transferencias exitosas
2. **Tiempo promedio:** Duración de transferencias
3. **Errores por tipo:** Distribución de códigos de error
4. **Uso por usuario:** Transferencias por administrador
5. **Tablas más usadas:** Origen/destino más comunes

## Mantenimiento

### Tareas Periódicas

1. **Revisar índices:**
   - Verificar uso con EXPLAIN ANALYZE
   - Reconstruir si es necesario
   - Agregar nuevos si se identifican cuellos de botella

2. **Limpiar auditoría:**
   - Archivar registros antiguos (> 1 año)
   - Mantener solo últimos 12 meses en tabla activa

3. **Monitorear performance:**
   - Revisar logs de errores
   - Analizar tiempos de respuesta
   - Identificar patrones de uso

4. **Actualizar documentación:**
   - Mantener guías actualizadas
   - Documentar nuevos casos de uso
   - Actualizar FAQs

### Troubleshooting

**Problema: Transferencias lentas**

Posibles causas:
- Índices faltantes o desactualizados
- Tablas muy grandes sin particionamiento
- Queries no optimizadas

Soluciones:
- Verificar índices con EXPLAIN
- Considerar particionamiento de tablas
- Optimizar queries SQL

**Problema: Errores de transacción**

Posibles causas:
- Timeout de conexión
- Locks de base de datos
- Errores de validación

Soluciones:
- Aumentar timeout de conexión
- Revisar locks activos
- Mejorar validaciones

## Extensiones Futuras

### Fase 7: Mejoras Opcionales

1. **Transferencia Masiva:**
   - Selección múltiple de registros
   - Batch processing en backend
   - Progress bar en UI

2. **Rollback/Deshacer:**
   - Snapshot temporal (30 segundos)
   - Botón "Deshacer" en toast
   - API de rollback

3. **Notificaciones Realtime:**
   - Supabase realtime subscriptions
   - Notificar a otros usuarios
   - Actualización automática de UI

4. **Historial Visual:**
   - Timeline de transferencias
   - Filtros por usuario/fecha
   - Exportar a CSV/PDF

## Referencias

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**Última actualización:** 2026-03-05  
**Versión del documento:** 1.0  
**Autor:** Equipo de Desarrollo

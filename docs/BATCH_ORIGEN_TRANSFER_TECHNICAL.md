# Documentación Técnica: Transferencia en Lote de Origen

## Arquitectura General

### Visión General

La funcionalidad de Transferencia en Lote de Origen extiende el módulo de Levantamiento Unificado para soportar operaciones de transferencia masiva entre instituciones (INEA, ITEJPA, TLAXCALA). La implementación reutiliza la infraestructura existente de transferencia individual y sigue patrones establecidos del feature de transferencia de bienes del directorio.

### Principios de Diseño

1. **Reutilización:** Usa el hook `useOrigenTransfer` existente para cada transferencia individual
2. **Procesamiento Secuencial:** Procesa items uno por uno en el cliente para mantener simplicidad
3. **Sin Cambios Backend:** No requiere modificaciones en endpoints existentes
4. **Actualización Incremental:** El sistema de realtime actualiza el store automáticamente
5. **Auditoría Automática:** Cada transferencia crea registros en `cambios_inventario`

## Estructura de Componentes

```
src/
├── components/
│   └── consultas/
│       └── levantamiento/
│           ├── index.tsx                          # Componente principal (orquestador)
│           ├── components/
│           │   ├── ExportButtons.tsx              # Botón de transferencia
│           │   ├── InventoryTable.tsx             # Tabla con checkboxes
│           │   └── TransferFAB.tsx                # Botón flotante de confirmación
│           ├── modals/
│           │   ├── BatchTransferConfirmationModal.tsx  # Modal de confirmación
│           │   └── BatchTransferProgressModal.tsx      # Modal de progreso
│           └── utils/
│               └── reportGenerator.ts             # Generación de reportes
├── hooks/
│   ├── useBatchOrigenTransfer.ts                  # Hook principal de transferencia
│   └── useOrigenTransfer.ts                       # Hook de transferencia individual (existente)
└── types/
    └── batchOrigenTransfer.ts                     # Definiciones de tipos
```

## Tipos y Interfaces

### Tipos Principales

```typescript
// Tipo de origen
export type OrigenType = 'INEA' | 'ITEJPA' | 'TLAXCALA';

// Razones de bloqueo
export type BlockReason =
  | 'resguardo_activo'
  | 'estatus_baja'
  | 'insufficient_permissions'
  | 'validation_error';

// Estado de transferencia de un item
export type TransferItemStatus = 
  | 'pending' 
  | 'processing' 
  | 'success' 
  | 'failed' 
  | 'skipped';
```

### Interfaces de Estado

```typescript
// Estado del modo de transferencia
interface TransferModeState {
  active: boolean;
  selectedItems: Set<string>;
  blockedItems: Map<string, BlockReason>;
  targetOrigen: OrigenType | null;
}

// Item durante transferencia
interface TransferItem {
  id: string;
  idInventario: string;
  descripcion: string;
  currentOrigen: OrigenType;
  status: TransferItemStatus;
  error?: string;
  reason?: string;
}

// Resultado de validación
interface ValidationResult {
  validItems: LevMueble[];
  blockedItems: Map<string, BlockReason>;
}

// Resultado de transferencia en lote
interface BatchTransferResult {
  successful: TransferItem[];
  failed: TransferItem[];
  skipped: TransferItem[];
  totalProcessed: number;
}
```

## Hook: useBatchOrigenTransfer

### Propósito

Gestiona el ciclo de vida completo de transferencias en lote, incluyendo validación, procesamiento secuencial, seguimiento de progreso y manejo de errores.

### API

```typescript
interface UseBatchOrigenTransferParams {
  onSuccess?: () => void;
  onProgress?: (current: number, total: number) => void;
}

interface UseBatchOrigenTransferReturn {
  transferBatch: (items: LevMueble[], targetOrigen: OrigenType) => Promise<BatchTransferResult>;
  validateItems: (items: LevMueble[]) => Promise<ValidationResult>;
  isTransferring: boolean;
  progress: TransferProgress;
  cancelTransfer: () => void;
}
```

### Lógica de Validación

```typescript
const validateItems = async (items: LevMueble[]): Promise<ValidationResult> => {
  // 1. Verificar permisos de usuario (admin/superadmin)
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single();
  
  const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin';
  
  // 2. Para cada item, verificar:
  for (const item of items) {
    // a. Resguardo activo
    const { data: resguardos } = await supabase
      .from('resguardos')
      .select('id')
      .eq('id_mueble', item.id)
      .limit(1);
    
    if (resguardos?.length > 0) {
      blockedItems.set(item.id, 'resguardo_activo');
      continue;
    }
    
    // b. Estatus BAJA
    const estatusValue = item.config_estatus?.concepto || item.estatus || '';
    if (estatusValue.toUpperCase() === 'BAJA') {
      blockedItems.set(item.id, 'estatus_baja');
      continue;
    }
    
    // Item válido
    validItems.push(item);
  }
  
  return { validItems, blockedItems };
};
```

### Procesamiento Secuencial

```typescript
const transferBatch = async (
  items: LevMueble[],
  targetOrigen: OrigenType
): Promise<BatchTransferResult> => {
  // 1. Validar items
  const { validItems, blockedItems } = await validateItems(items);
  
  // 2. Procesar cada item válido secuencialmente
  for (let i = 0; i < validItems.length; i++) {
    const item = validItems[i];
    
    // Actualizar progreso
    setProgress({ current: i + 1, total: validItems.length, currentItem: item });
    onProgress?.(i + 1, validItems.length);
    
    try {
      // Usar hook de transferencia individual
      await transferOrigen(item.id, item.id_inv, targetOrigen);
      result.successful.push({ ...item, status: 'success' });
    } catch (error) {
      result.failed.push({ ...item, status: 'failed', error: error.message });
    }
    
    // Delay para evitar sobrecarga del API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return result;
};
```

## Integración con API

### Endpoint Reutilizado

La funcionalidad usa el endpoint existente sin modificaciones:

```
POST /api/inventario/transfer-origen
```

**Request Body:**
```json
{
  "record_id": "uuid",
  "id_inventario": "string",
  "origen_actual": "inea" | "itea" | "no-listado",
  "origen_destino": "inea" | "itea" | "no-listado"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registro transferido exitosamente"
}
```

### Mapeo de Tipos

```typescript
const ORIGEN_TO_HOOK_FORMAT: Record<OrigenType, 'inea' | 'itea' | 'no-listado'> = {
  'INEA': 'inea',
  'ITEJPA': 'itea',
  'TLAXCALA': 'no-listado',
};
```

## Auditoría y Trazabilidad

### Registros de Auditoría

Cada transferencia exitosa crea un registro en la tabla `cambios_inventario`:

```sql
CREATE TABLE cambios_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_mueble UUID NOT NULL,
  tabla_origen TEXT NOT NULL,
  campo_modificado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  usuario_id UUID NOT NULL,
  fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

**Ejemplo de registro:**
```json
{
  "id_mueble": "uuid-del-item",
  "tabla_origen": "muebles",
  "campo_modificado": "origen",
  "valor_anterior": "ITEJPA",
  "valor_nuevo": "INEA",
  "usuario_id": "uuid-del-usuario",
  "fecha_cambio": "2024-01-15T10:30:00Z"
}
```

### Identificación de Operaciones en Lote

Las operaciones en lote se identifican por:
- Mismo `usuario_id`
- Timestamps similares (dentro de un rango de minutos)
- Mismo `campo_modificado` ("origen")
- Múltiples registros consecutivos

## Actualización del Store

### Flujo de Actualización

1. **Durante Transferencia:**
   - El hook `useOrigenTransfer` ejecuta la transferencia individual
   - El endpoint realiza DELETE en tabla origen e INSERT en tabla destino
   - El sistema de realtime detecta los cambios

2. **Actualización Incremental:**
   - DELETE detectado → `removeMueble(id)` en store origen
   - INSERT detectado → `addMueble(item)` en store destino
   - UI se actualiza automáticamente vía subscripciones

3. **Post-Transferencia:**
   - Se llama `reindex()` para sincronización completa
   - Garantiza consistencia total del estado

```typescript
// En el componente principal
const { reindex } = useUnifiedInventory();

// Después de completar el batch
await transferBatch(items, targetOrigen);
await reindex(); // Sincronización completa
```

## Generación de Reportes

### Formato CSV

```csv
REPORTE DE TRANSFERENCIA EN LOTE

Fecha y Hora:,2024-01-15 10:30:00
Usuario:,Juan Pérez (uuid)
Origen Destino:,INEA

RESUMEN
Total de Items:,50
Exitosos:,45
Fallidos:,3
Omitidos:,2

TRANSFERENCIAS EXITOSAS
ID Inventario,Descripción,Origen Anterior,Origen Nuevo
INV-001,Escritorio ejecutivo,ITEJPA,INEA
INV-002,Silla ergonómica,ITEJPA,INEA

TRANSFERENCIAS FALLIDAS
ID Inventario,Descripción,Origen Anterior,Error
INV-003,Computadora portátil,ITEJPA,Error de conexión

ITEMS OMITIDOS
ID Inventario,Descripción,Origen Anterior,Razón
INV-004,Impresora láser,ITEJPA,Tiene resguardo activo
```

### Función de Generación

```typescript
export function generateTransferReport(
  result: BatchTransferResult,
  targetOrigen: OrigenType,
  userId: string,
  userName: string
): TransferReport {
  return {
    timestamp: new Date().toISOString(),
    userId,
    userName,
    targetOrigen,
    summary: {
      total: result.successful.length + result.failed.length + result.skipped.length,
      successful: result.successful.length,
      failed: result.failed.length,
      skipped: result.skipped.length,
    },
    items: {
      successful: result.successful.map(item => ({
        idInventario: item.idInventario,
        descripcion: item.descripcion,
        origenAnterior: item.currentOrigen,
        origenNuevo: targetOrigen,
      })),
      failed: result.failed.map(item => ({
        idInventario: item.idInventario,
        descripcion: item.descripcion,
        origenAnterior: item.currentOrigen,
        error: item.error,
      })),
      skipped: result.skipped.map(item => ({
        idInventario: item.idInventario,
        descripcion: item.descripcion,
        origenAnterior: item.currentOrigen,
        reason: item.reason,
      })),
    },
  };
}
```

## Animaciones y UX

### Transiciones de Modo de Transferencia

```typescript
// Checkbox column: slide-in desde la izquierda (200ms)
// Button label: fade transition (150ms)
// FAB: slide-up con spring physics (300ms)

const fabVariants = {
  initial: { opacity: 0, y: 100, scale: 0.8 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
  },
  exit: { opacity: 0, y: 100, scale: 0.8 },
  transition: { 
    type: 'spring', 
    stiffness: 300, 
    damping: 25 
  }
};
```

### Animaciones de Progreso

```typescript
// Status icons: fade-in (150ms)
const iconVariants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.15 }
};

// Progress bar: smooth width transition (300ms)
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
/>

// Current item: pulse animation
animate={{
  backgroundColor: isDarkMode 
    ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']
    : ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.1)']
}}
transition={{
  duration: 1.5,
  repeat: Infinity,
  ease: 'easeInOut'
}}
```

## Accesibilidad

### ARIA Attributes

```typescript
// Transfer button
aria-label="Transferir origen de items seleccionados"
aria-pressed={transferMode}

// Checkboxes
aria-label={`Seleccionar item ${idInventario}`}
aria-checked={isSelected}

// FAB
aria-label={`Confirmar transferencia de ${count} items`}

// Modals
role="dialog"
aria-modal="true"
aria-labelledby="modal-title"
aria-busy={processing}
```

### Navegación por Teclado

- **Tab:** Navegar entre elementos focusables
- **Space:** Toggle checkboxes
- **Enter:** Confirmar acciones
- **Escape:** Cerrar modales (cuando no está procesando)

## Manejo de Errores

### Tipos de Errores

1. **Errores de Red:**
```typescript
if (error.message?.includes('network') || error.message?.includes('fetch')) {
  setMessage({ 
    type: 'error', 
    text: 'Error de conexión. Verifica tu conexión a internet.' 
  });
}
```

2. **Errores de Sesión:**
```typescript
if (error.message?.includes('session')) {
  setMessage({ 
    type: 'error', 
    text: 'Sesión expirada. Por favor, inicia sesión nuevamente.' 
  });
}
```

3. **Errores de Validación:**
```typescript
// Manejados durante la validación pre-transferencia
blockedItems.set(item.id, 'validation_error');
```

### Estrategia de Recuperación

- **Continuar en caso de error:** Los items restantes se procesan incluso si uno falla
- **Registro detallado:** Todos los errores se registran en el resultado
- **Reporte completo:** El usuario puede ver qué falló y por qué

## Consideraciones de Rendimiento

### Optimizaciones

1. **Debouncing de selección:** Previene re-renders excesivos
2. **Virtualización de listas:** Para listas grandes en modales (si es necesario)
3. **Memoización:** Cálculos costosos se memorizan con `useMemo`
4. **Delay entre transferencias:** 100ms para evitar sobrecarga del API

### Límites Recomendados

- **Items por lote:** Máximo 100 items recomendado
- **Timeout por item:** 30 segundos
- **Reintentos:** No se implementan reintentos automáticos

## Seguridad

### Validaciones

1. **Nivel UI:** Ocultar botón para no-admins
2. **Nivel Hook:** Validar permisos antes de transferir
3. **Nivel API:** RLS policies en Supabase (existentes)

### Auditoría

- Todos los cambios se registran con `usuario_id`
- Timestamps precisos para trazabilidad
- Valores anteriores y nuevos almacenados

## Testing

### Pruebas Unitarias

```typescript
// Hook de validación
describe('useBatchOrigenTransfer - validateItems', () => {
  it('should block items with active resguardo', async () => {
    const result = await validateItems(itemsWithResguardo);
    expect(result.blockedItems.get(item.id)).toBe('resguardo_activo');
  });
  
  it('should block items with BAJA status', async () => {
    const result = await validateItems(itemsWithBaja);
    expect(result.blockedItems.get(item.id)).toBe('estatus_baja');
  });
});
```

### Pruebas de Integración

```typescript
// Flujo completo
describe('Batch Transfer Flow', () => {
  it('should complete full transfer workflow', async () => {
    // 1. Activar modo de transferencia
    // 2. Seleccionar items
    // 3. Confirmar transferencia
    // 4. Verificar resultados
    // 5. Descargar reporte
  });
});
```

## Deployment

### Checklist

- [ ] Verificar que todos los tipos estén exportados correctamente
- [ ] Confirmar que las animaciones funcionan en todos los navegadores
- [ ] Probar con diferentes tamaños de lote (1, 10, 50, 100 items)
- [ ] Verificar accesibilidad con lectores de pantalla
- [ ] Probar en modo oscuro y claro
- [ ] Validar reportes CSV en Excel y Google Sheets
- [ ] Confirmar que los registros de auditoría se crean correctamente

### Rollback Plan

Si surgen problemas críticos:
1. Ocultar botón de transferencia vía feature flag
2. Deshabilitar modo de transferencia
3. La transferencia individual sigue funcionando
4. No hay riesgo de corrupción de datos (usa endpoint validado)

## Mantenimiento

### Monitoreo

Métricas a monitorear:
- Número de transferencias en lote por día
- Tasa de éxito/fallo
- Tiempo promedio de procesamiento
- Errores más comunes

### Logs

```typescript
console.log('[BatchTransfer] Starting batch transfer', {
  itemCount: items.length,
  targetOrigen,
  userId
});

console.log('[BatchTransfer] Transfer completed', {
  successful: result.successful.length,
  failed: result.failed.length,
  skipped: result.skipped.length,
  duration: endTime - startTime
});
```

## Referencias

- [Directorio Bienes Transfer Feature](./DIRECTORIO_TRANSFER_COMPLETE_LOGIC.md)
- [Origen Transfer Implementation](./ORIGEN_TRANSFER_IMPLEMENTATION_COMPLETE.md)
- [Change History Integration](./CAMBIOS_INVENTARIO_INTEGRATION_GUIDE.md)
- [User Guide](./BATCH_ORIGEN_TRANSFER_USER_GUIDE.md)

## Contacto

Para preguntas técnicas o reportar bugs, contacta al equipo de desarrollo.

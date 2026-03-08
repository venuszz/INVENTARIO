# Problemas de Rendimiento - Batch Transfer

## Problemas Identificados

### 1. ❌ CRÍTICO: Validación Ineficiente de Resguardos
**Problema**: El hook `useBatchOrigenTransfer` hace una consulta individual a la base de datos por cada item para verificar si tiene resguardo activo.

**Código actual**:
```typescript
for (let i = 0; i < items.length; i++) {
  const { data: resguardos } = await supabase
    .from('resguardos')
    .select('id')
    .eq('id_mueble', item.id)
    .limit(1);
}
```

**Impacto**: Con 3676 items, esto genera 3676 consultas a la base de datos.

**Solución**: Usar el store de resguardos que ya está indexado en memoria:
```typescript
// Obtener todos los resguardos del store
const resguardosStore = useResguardosStore.getState();
const resguardosMap = new Map(
  resguardosStore.resguardos.map(r => [r.id_mueble, r])
);

// Validar en memoria
items.forEach(item => {
  if (resguardosMap.has(item.id)) {
    blockedItems.set(item.id, 'resguardo_activo');
  }
});
```

---

### 2. ❌ CRÍTICO: Carga Innecesaria de Componentes
**Problema**: Todos los componentes y hooks de transferencia se cargan al montar el componente principal, incluso cuando el usuario nunca usa la función.

**Componentes cargados innecesariamente**:
- `useBatchOrigenTransfer` hook
- `BatchTransferConfirmationModal`
- `BatchTransferProgressModal`
- `TransferFAB`
- Estados de transferencia (selectedItems, blockedItems, etc.)

**Solución**: Lazy loading condicional:
```typescript
// Solo cargar cuando transferMode = true
const BatchTransferComponents = lazy(() => 
  import('./components/BatchTransferComponents')
);

{transferMode && (
  <Suspense fallback={null}>
    <BatchTransferComponents {...props} />
  </Suspense>
)}
```

---

### 3. ❌ Efecto de Adaptación Innecesario
**Problema**: El `useEffect` que adapta la selección cuando cambian los filtros se ejecuta en cada cambio, incluso cuando `transferMode` es `false`.

**Código actual**:
```typescript
useEffect(() => {
  if (!transferMode) return;
  // Lógica de adaptación...
}, [filteredMuebles, transferMode]);
```

**Impacto**: Se ejecuta en cada cambio de filtros aunque no esté en modo transferencia.

**Solución**: Mover esta lógica dentro del componente lazy-loaded.

---

### 4. ❌ Cálculo Redundante de `allSelected`
**Problema**: Se calcula en cada render aunque no esté en modo transferencia.

**Código actual**:
```typescript
const allSelected = filteredMuebles.length > 0 && 
  filteredMuebles.every(item => selectedItems.has(item.id) || blockedItems.has(item.id));
```

**Solución**: Usar `useMemo` y solo calcular cuando `transferMode = true`:
```typescript
const allSelected = useMemo(() => {
  if (!transferMode) return false;
  return filteredMuebles.length > 0 && 
    filteredMuebles.every(item => 
      selectedItems.has(item.id) || blockedItems.has(item.id)
    );
}, [transferMode, filteredMuebles, selectedItems, blockedItems]);
```

---

### 5. ❌ Imports Innecesarios
**Problema**: Se importan todos los componentes y tipos de transferencia aunque no se usen.

**Imports actuales**:
```typescript
import { TransferFAB } from './components/TransferFAB';
import { BatchTransferConfirmationModal } from './modals/BatchTransferConfirmationModal';
import { BatchTransferProgressModal } from './modals/BatchTransferProgressModal';
import useBatchOrigenTransfer from '@/hooks/useBatchOrigenTransfer';
import { OrigenType, BlockReason, BatchTransferResult } from '@/types/batchOrigenTransfer';
```

**Solución**: Dynamic imports solo cuando se necesiten.

---

### 6. ❌ Estado Global Innecesario
**Problema**: Los estados de transferencia se mantienen en el componente principal aunque solo se usen en modo transferencia.

**Estados actuales**:
```typescript
const [transferMode, setTransferMode] = useState(false);
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
const [blockedItems, setBlockedItems] = useState<Map<string, BlockReason>>(new Map());
const [showConfirmationModal, setShowConfirmationModal] = useState(false);
const [showProgressModal, setShowProgressModal] = useState(false);
const [isValidating, setIsValidating] = useState(false);
const [transferResult, setTransferResult] = useState<BatchTransferResult | null>(null);
const [transferTargetOrigen, setTransferTargetOrigen] = useState<OrigenType | null>(null);
```

**Solución**: Mover todos estos estados al componente lazy-loaded.

---

### 7. ❌ Funciones Handler Innecesarias
**Problema**: Se definen múltiples handlers de transferencia aunque no estén en modo transferencia.

**Handlers actuales**:
- `toggleTransferMode`
- `handleItemSelect`
- `handleSelectAll`
- `handleFABClick`
- `handleTransferConfirm`
- `handleTransferCancel`
- `handleProgressClose`
- `handleReportDownload`

**Solución**: Mover al componente lazy-loaded.

---

## Arquitectura Propuesta

### Estructura de Archivos
```
src/components/consultas/levantamiento/
├── index.tsx (componente principal - SIN lógica de transferencia)
├── components/
│   └── BatchTransfer/ (nuevo - lazy loaded)
│       ├── index.tsx (orquestador de transferencia)
│       ├── TransferFAB.tsx
│       ├── TransferConfirmationModal.tsx
│       ├── TransferProgressModal.tsx
│       └── hooks/
│           └── useBatchTransferLogic.ts
```

### Flujo Optimizado

1. **Carga Inicial**: Solo componentes básicos (tabla, búsqueda, paginación)
2. **Click en "Transferir Origen"**: 
   - Lazy load del módulo de transferencia
   - Inicializar estados de transferencia
   - Cargar datos de resguardos del store
3. **Salir del Modo**: 
   - Limpiar estados
   - Desmontar componentes de transferencia

---

## Métricas Esperadas

### Antes
- Bundle inicial: ~500KB
- Tiempo de carga: ~2s
- Consultas DB en validación: 3676
- Memoria usada: ~150MB

### Después
- Bundle inicial: ~350KB (-30%)
- Tiempo de carga: ~1s (-50%)
- Consultas DB en validación: 0 (usa store)
- Memoria usada: ~100MB (-33%)

---

## Prioridad de Implementación

1. **ALTA**: Optimizar validación de resguardos (usar store)
2. **ALTA**: Lazy loading de componentes de transferencia
3. **MEDIA**: Mover estados al componente lazy-loaded
4. **MEDIA**: Optimizar cálculos con useMemo
5. **BAJA**: Limpiar imports innecesarios

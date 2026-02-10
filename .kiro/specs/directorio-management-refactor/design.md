# Directorio Management Refactor - Design Document

## 1. Architecture Overview

### 1.1 Component Structure

```
src/components/admin/directorio/
├── index.tsx                          # Main orchestrator component
├── types.ts                           # TypeScript interfaces and types
├── components/
│   ├── DirectorioCard.tsx            # Individual employee card (view mode)
│   ├── DirectorioEditCard.tsx        # Employee card in edit mode
│   ├── DirectorioAddForm.tsx         # Inline form for adding new employee
│   ├── SearchBar.tsx                 # Search input with filtering
│   ├── EmptyState.tsx                # Empty state when no employees
│   ├── LoadingState.tsx              # Loading skeleton
│   └── AreaChip.tsx                  # Area tag/chip component
├── modals/
│   ├── AddEditModal.tsx              # Create/Edit employee modal
│   ├── DeleteModal.tsx               # Delete confirmation modal
│   ├── ResguardosActiveModal.tsx     # Shows active resguardos (blocking edit/delete)
│   ├── BienesACargoModal.tsx         # Goods reassignment workflow
│   ├── ReassignmentConfirmModal.tsx  # Final confirmation for reassignment
│   └── FutureFeatureModal.tsx        # Generic modal for future features
└── hooks/
    ├── useDirectorioStats.ts         # Statistics calculation hook
    ├── useDirectorioActions.ts       # CRUD operations hook
    ├── useDirectorioSearch.ts        # Search and filtering logic
    └── useAreaManagement.ts          # Area creation and management
```

### 1.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DirectorioManager                        │
│                   (Main Orchestrator)                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─→ useAdminIndexation() ──→ adminStore (Zustand)
             │                              ├─ directorio[]
             │                              ├─ areas[]
             │                              └─ directorioAreas[]
             │
             ├─→ useDirectorioStats() ────→ Calculate statistics
             │                              ├─ Query resguardos table
             │                              ├─ Query goods table
             │                              └─ Return Map<id, stats>
             │
             ├─→ useDirectorioActions() ──→ CRUD operations
             │                              ├─ addEmployee()
             │                              ├─ updateEmployee()
             │                              ├─ deleteEmployee()
             │                              └─ reassignGoods()
             │
             └─→ useDirectorioSearch() ───→ Search & filter logic
                                            ├─ Filter by name/position/area
                                            └─ Highlight matches
```

### 1.3 State Management Strategy

**Global State (Zustand - adminStore)**
- `directorio[]`: All employees
- `areas[]`: All areas
- `directorioAreas[]`: N:M relationships
- Managed by `useAdminIndexation` hook
- Realtime updates via Supabase subscriptions

**Local Component State**
- Modal visibility flags
- Form data (add/edit)
- Search term
- Selected employee for operations
- Loading states
- Error messages

**Derived State (useMemo)**
- Filtered employees list
- Statistics per employee
- Area mappings
- Search highlights


## 2. Type Definitions

### 2.1 Core Types (types.ts)

```typescript
import type { Directorio, Area, DirectorioArea } from '@/types/admin';

/**
 * Statistics for a resguardante (custodian)
 */
export interface ResguardanteStats {
  resguardos: number;      // Count of active custody documents
  bienesACargo: number;    // Count of goods assigned via key_resguardante
}

/**
 * Extended employee data with computed fields
 */
export interface DirectorioWithStats extends Directorio {
  areas: Area[];           // Resolved areas from N:M relationship
  stats: ResguardanteStats;
}

/**
 * Form data for add/edit operations
 */
export interface DirectorioFormData {
  nombre: string;
  puesto: string;
  selectedAreas: number[]; // Array of area IDs
}

/**
 * Resguardo summary for display in modal
 */
export interface ResguardoSummary {
  id: number;
  folio: string;
  fecha: string;
  bienesCount: number;
  bienes: GoodSummary[];
}

/**
 * Good summary for display in modal
 */
export interface GoodSummary {
  id: string;
  numero_inventario: string | null;
  descripcion: string | null;
  estado_fisico: string | null;
  rubro: string | null;
}

/**
 * Reassignment operation data
 */
export interface ReassignmentData {
  fromResguardanteId: number;
  toResguardanteId: number;
  goodIds: string[];
}

/**
 * Modal state management
 */
export type ModalType = 
  | 'none'
  | 'add'
  | 'edit'
  | 'delete'
  | 'resguardos-active'
  | 'bienes-a-cargo'
  | 'reassignment-confirm'
  | 'future-feature';

export interface ModalState {
  type: ModalType;
  data?: any;
}
```


## 3. Hook Specifications

### 3.1 useDirectorioStats Hook

**Purpose**: Calculate and cache statistics for each resguardante

**Interface**:
```typescript
interface UseDirectorioStatsReturn {
  stats: Map<number, ResguardanteStats>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useDirectorioStats(
  directorioIds: number[]
): UseDirectorioStatsReturn;
```

**Implementation Strategy**:
```typescript
export function useDirectorioStats(directorioIds: number[]) {
  const [stats, setStats] = useState<Map<number, ResguardanteStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Query 1: Count resguardos per director
      const { data: resguardosData, error: resguardosError } = await supabase
        .from('resguardos')
        .select('id_directorio, folio')
        .in('id_directorio', directorioIds)
        .not('folio', 'is', null);
      
      if (resguardosError) throw resguardosError;
      
      // Count unique folios per director
      const resguardosMap = new Map<number, number>();
      resguardosData?.forEach(r => {
        const count = resguardosMap.get(r.id_directorio) || 0;
        resguardosMap.set(r.id_directorio, count + 1);
      });
      
      // Query 2: Count goods per resguardante
      const { data: goodsData, error: goodsError } = await supabase
        .from('goods')
        .select('key_resguardante')
        .in('key_resguardante', directorioIds)
        .not('key_resguardante', 'is', null);
      
      if (goodsError) throw goodsError;
      
      // Count goods per resguardante
      const goodsMap = new Map<number, number>();
      goodsData?.forEach(g => {
        if (g.key_resguardante) {
          const count = goodsMap.get(g.key_resguardante) || 0;
          goodsMap.set(g.key_resguardante, count + 1);
        }
      });
      
      // Combine results
      const statsMap = new Map<number, ResguardanteStats>();
      directorioIds.forEach(id => {
        statsMap.set(id, {
          resguardos: resguardosMap.get(id) || 0,
          bienesACargo: goodsMap.get(id) || 0,
        });
      });
      
      setStats(statsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading statistics');
    } finally {
      setLoading(false);
    }
  }, [directorioIds]);

  useEffect(() => {
    if (directorioIds.length > 0) {
      fetchStats();
    }
  }, [fetchStats, directorioIds]);

  return { stats, loading, error, refetch: fetchStats };
}
```

**Optimization Notes**:
- Use `useMemo` to memoize directorioIds array
- Consider implementing cache with TTL (5 minutes)
- Batch queries for better performance
- Subscribe to realtime changes on resguardos and goods tables


### 3.2 useDirectorioActions Hook

**Purpose**: Encapsulate all CRUD operations for directorio management

**Interface**:
```typescript
interface UseDirectorioActionsReturn {
  addEmployee: (data: DirectorioFormData) => Promise<void>;
  updateEmployee: (id: number, data: DirectorioFormData) => Promise<void>;
  deleteEmployee: (id: number) => Promise<void>;
  reassignGoods: (data: ReassignmentData) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

function useDirectorioActions(): UseDirectorioActionsReturn;
```

**Key Operations**:

1. **addEmployee**: 
   - Insert into `directorio` table
   - Insert relationships into `directorio_areas` table
   - Create areas if they don't exist

2. **updateEmployee**:
   - Update `directorio` table (nombre, puesto)
   - Delete old `directorio_areas` relationships
   - Insert new `directorio_areas` relationships

3. **deleteEmployee**:
   - Validate no active resguardos
   - Validate no assigned goods
   - Delete from `directorio` (CASCADE deletes directorio_areas)

4. **reassignGoods**:
   - Batch UPDATE goods table
   - Verify all goods updated correctly
   - Return success boolean

### 3.3 useDirectorioSearch Hook

**Purpose**: Handle search and filtering logic

**Interface**:
```typescript
interface UseDirectorioSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredDirectorio: DirectorioWithStats[];
  highlightedAreas: Set<number>;
}

function useDirectorioSearch(
  directorio: DirectorioWithStats[]
): UseDirectorioSearchReturn;
```

**Search Logic**:
- Case-insensitive matching
- Search fields: nombre, puesto, id_directorio, area names
- Debounced search (300ms)
- Highlight matching areas in results

### 3.4 useAreaManagement Hook

**Purpose**: Handle area creation and management

**Interface**:
```typescript
interface UseAreaManagementReturn {
  createAreaIfNeeded: (areaName: string) => Promise<number>;
  getAreasForDirector: (directorId: number) => Area[];
}

function useAreaManagement(): UseAreaManagementReturn;
```


## 4. Component Specifications

### 4.1 Main Orchestrator (index.tsx)

**Responsibilities**:
- Coordinate all sub-components
- Manage modal state
- Handle validation logic
- Orchestrate data flow

**State Management**:
```typescript
const [modalState, setModalState] = useState<ModalState>({ type: 'none' });
const [selectedEmployee, setSelectedEmployee] = useState<Directorio | null>(null);
const [searchTerm, setSearchTerm] = useState('');

// Data from hooks
const { directorio, areas, directorioAreas, realtimeConnected } = useAdminIndexation();
const { stats, loading: statsLoading } = useDirectorioStats(directorio.map(d => d.id_directorio));
const { addEmployee, updateEmployee, deleteEmployee, reassignGoods } = useDirectorioActions();
const { filteredDirectorio, highlightedAreas } = useDirectorioSearch(directorioWithStats);
```

**Validation Flow**:
```typescript
const handleEdit = (employee: Directorio) => {
  const employeeStats = stats.get(employee.id_directorio);
  
  if (employeeStats && employeeStats.resguardos > 0) {
    // PRIORITY 1: Block edit, show resguardos
    setModalState({ type: 'resguardos-active', data: employee });
  } else {
    // Allow edit
    setModalState({ type: 'edit', data: employee });
  }
};

const handleDelete = (employee: Directorio) => {
  const employeeStats = stats.get(employee.id_directorio);
  
  if (employeeStats && employeeStats.resguardos > 0) {
    // PRIORITY 1: Block delete, show resguardos
    setModalState({ type: 'resguardos-active', data: employee });
  } else if (employeeStats && employeeStats.bienesACargo > 0) {
    // PRIORITY 2: Block delete, show reassignment flow
    setModalState({ type: 'bienes-a-cargo', data: employee });
  } else {
    // PRIORITY 3: Allow delete
    setModalState({ type: 'delete', data: employee });
  }
};
```

### 4.2 DirectorioCard Component

**Props**:
```typescript
interface DirectorioCardProps {
  employee: DirectorioWithStats;
  highlightedAreas: Set<number>;
  onEdit: (employee: Directorio) => void;
  onDelete: (employee: Directorio) => void;
}
```

**Features**:
- Display employee name, position
- Show area chips (highlighted if matching search)
- Edit and delete buttons
- Hover effects with framer-motion
- Responsive layout

### 4.3 DirectorioAddForm Component

**Props**:
```typescript
interface DirectorioAddFormProps {
  onSubmit: (data: DirectorioFormData) => Promise<void>;
  onCancel: () => void;
  availableAreas: Area[];
}
```

**Features**:
- Inline form (appears when "Agregar empleado" clicked)
- Auto-uppercase inputs
- Area selection with chips
- Create new areas on-the-fly (Enter key)
- Validation (nombre required, min 1 area)
- Animated appearance/disappearance

### 4.4 SearchBar Component

**Props**:
```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount: number;
  totalCount: number;
}
```

**Features**:
- Search icon
- Clear button (X)
- Result count display
- Debounced input (300ms)


## 5. Modal Specifications

### 5.1 AddEditModal

**Props**:
```typescript
interface AddEditModalProps {
  show: boolean;
  mode: 'add' | 'edit';
  employee?: Directorio;
  initialAreas?: number[];
  onSave: (data: DirectorioFormData) => Promise<void>;
  onClose: () => void;
  availableAreas: Area[];
}
```

**States**:
- Initial: Form with current/empty data
- Saving: Loading spinner on save button
- Success: Brief success message before close

**Validation**:
- Nombre: Required, min 2 characters
- Puesto: Optional
- Areas: Minimum 1 required

### 5.2 DeleteModal

**Props**:
```typescript
interface DeleteModalProps {
  show: boolean;
  employee: Directorio;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}
```

**States**:
1. **Confirmation**: Show warning, employee data, confirm/cancel buttons
2. **Deleting**: Loading spinner, "Eliminando..." text
3. **Success**: Green checkmark, "¡Eliminado!" message (1.5s), then auto-close

**UI Elements**:
- Warning icon (AlertTriangle)
- Employee name and position
- "Esta acción no se puede deshacer" message
- Confirm button (red, destructive)
- Cancel button (neutral)

### 5.3 ResguardosActiveModal

**Props**:
```typescript
interface ResguardosActiveModalProps {
  show: boolean;
  employee: Directorio;
  onClose: () => void;
  onNavigateToManage: () => void; // Future feature
}
```

**Layout**: Split view (40% | 60%)

**Left Panel (40%)**:
- Title: "Resguardos Activos"
- Employee name
- List of resguardos:
  - Folio
  - Date
  - Goods count badge
  - Click to show details →

**Right Panel (60%)**:
- Title: "Bienes del Resguardo"
- Selected resguardo info
- Table of goods:
  - Número de inventario
  - Descripción
  - Estado físico
  - Rubro
- Empty state if no resguardo selected

**Footer**:
- "Cerrar" button
- "Gestionar Bajas" button → Opens FutureFeatureModal

**Data Loading**:
```typescript
// Load resguardos for employee
const { data: resguardos } = await supabase
  .from('resguardos')
  .select('id, folio, fecha, id_directorio')
  .eq('id_directorio', employee.id_directorio);

// Load goods for selected resguardo
const { data: goods } = await supabase
  .from('goods')
  .select('id, numero_inventario, descripcion, estado_fisico, rubro')
  .eq('folio', selectedResguardo.folio);
```


### 5.4 BienesACargoModal

**Props**:
```typescript
interface BienesACargoModalProps {
  show: boolean;
  employee: Directorio;
  onClose: () => void;
  onReassignmentComplete: () => void;
}
```

**View States**:
1. **Info View**: Initial information
2. **Reassignment View**: Goods selection and destination

**View 1: Info**
```typescript
<div className="p-6">
  <AlertTriangle className="text-yellow-500" />
  <h3>{stats.bienesACargo} bienes a cargo</h3>
  <p>Empleado: {employee.nombre}</p>
  <p>Puesto: {employee.puesto}</p>
  <p>Áreas: {areas.join(', ')}</p>
  
  <div className="mt-6 flex gap-3">
    <button onClick={onClose}>Cerrar</button>
    <button onClick={() => setView('reassignment')}>
      Reasignar Bienes
    </button>
  </div>
</div>
```

**View 2: Reassignment**

Layout: Split view (33% | 67%)

**Left Panel (33%) - SelectedBienesPanel**:
```typescript
<div className="border-r p-4">
  <h4>Bienes Seleccionados</h4>
  <p className="text-sm">{selectedGoods.size} de {goods.length}</p>
  
  <button onClick={() => setSelectedGoods(new Set())}>
    Limpiar selección
  </button>
  
  <div className="space-y-2 mt-4">
    {goods.map(good => (
      <label key={good.id} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedGoods.has(good.id)}
          onChange={() => toggleGoodSelection(good.id)}
        />
        <span className="text-xs">
          {good.numero_inventario} - {good.descripcion}
        </span>
      </label>
    ))}
  </div>
</div>
```

**Right Panel (67%) - Resguardante Selector**:
```typescript
<div className="p-4">
  <h4>Seleccionar Nuevo Resguardante</h4>
  
  {/* Search bar */}
  <input
    type="text"
    placeholder="Buscar por nombre, puesto o área..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  
  {/* Selected resguardante */}
  {selectedResguardante && (
    <div className="bg-blue-50 p-3 rounded">
      <p className="font-medium">{selectedResguardante.nombre}</p>
      <p className="text-sm">{selectedResguardante.puesto}</p>
    </div>
  )}
  
  {/* Available resguardantes list */}
  <div className="space-y-2 mt-4">
    {filteredResguardantes.map(r => (
      <button
        key={r.id_directorio}
        onClick={() => setSelectedResguardante(r)}
        className={cn(
          "w-full text-left p-3 rounded border",
          selectedResguardante?.id_directorio === r.id_directorio && "border-blue-500"
        )}
      >
        <p className="font-medium">{r.nombre}</p>
        <p className="text-sm text-gray-600">{r.puesto}</p>
        <p className="text-xs text-gray-500">{r.areas.join(', ')}</p>
      </button>
    ))}
  </div>
</div>
```

**Footer**:
```typescript
<div className="border-t p-4 flex justify-between items-center">
  <p className="text-sm">{selectedGoods.size} bienes seleccionados</p>
  <div className="flex gap-3">
    <button onClick={onClose}>Cancelar</button>
    <button
      onClick={handleConfirmReassignment}
      disabled={selectedGoods.size === 0 || !selectedResguardante}
    >
      Confirmar Reasignación
    </button>
  </div>
</div>
```

**Data Loading**:
```typescript
// Load goods for employee
const { data: goods } = await supabase
  .from('goods')
  .select('id, numero_inventario, descripcion, estado_fisico, rubro')
  .eq('key_resguardante', employee.id_directorio);

// Pre-select all goods
setSelectedGoods(new Set(goods.map(g => g.id)));

// Load available resguardantes (excluding current)
const { data: resguardantes } = await supabase
  .from('directorio')
  .select('*')
  .neq('id_directorio', employee.id_directorio);
```


### 5.5 ReassignmentConfirmModal

**Props**:
```typescript
interface ReassignmentConfirmModalProps {
  show: boolean;
  fromEmployee: Directorio;
  toEmployee: Directorio;
  goodsCount: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}
```

**Layout**:
```typescript
<div className="p-6">
  <h3 className="text-lg font-medium mb-4">
    Confirmar Reasignación
  </h3>
  
  <div className="space-y-4">
    <div>
      <p className="text-sm text-gray-500">De:</p>
      <p className="font-medium">{fromEmployee.nombre}</p>
      <p className="text-sm">{fromEmployee.puesto}</p>
    </div>
    
    <div className="flex justify-center">
      <ArrowRight className="text-gray-400" />
    </div>
    
    <div>
      <p className="text-sm text-gray-500">Para:</p>
      <p className="font-medium">{toEmployee.nombre}</p>
      <p className="text-sm">{toEmployee.puesto}</p>
    </div>
    
    <div className="bg-blue-50 p-3 rounded">
      <p className="text-sm">
        Se reasignarán <strong>{goodsCount}</strong> bienes
      </p>
    </div>
  </div>
  
  <div className="mt-6 flex gap-3 justify-end">
    <button onClick={onCancel}>Cancelar</button>
    <button onClick={onConfirm} className="bg-blue-600 text-white">
      Confirmar
    </button>
  </div>
</div>
```

**Confirmation Flow**:
```typescript
const handleConfirm = async () => {
  setLoading(true);
  
  try {
    // 1. Validate destination resguardante exists
    const { data: destExists } = await supabase
      .from('directorio')
      .select('id_directorio')
      .eq('id_directorio', toEmployee.id_directorio)
      .single();
    
    if (!destExists) throw new Error('Resguardante destino no existe');
    
    // 2. Validate goods exist
    const { data: goodsExist } = await supabase
      .from('goods')
      .select('id')
      .in('id', Array.from(selectedGoodIds));
    
    if (goodsExist.length !== selectedGoodIds.size) {
      throw new Error('Algunos bienes no existen');
    }
    
    // 3. Execute batch update
    const { error: updateError } = await supabase
      .from('goods')
      .update({ key_resguardante: toEmployee.id_directorio })
      .in('id', Array.from(selectedGoodIds));
    
    if (updateError) throw updateError;
    
    // 4. Verify all goods updated
    const { data: verifiedGoods } = await supabase
      .from('goods')
      .select('id, key_resguardante')
      .in('id', Array.from(selectedGoodIds));
    
    const allUpdated = verifiedGoods.every(
      g => g.key_resguardante === toEmployee.id_directorio
    );
    
    if (!allUpdated) {
      throw new Error('No todos los bienes se actualizaron correctamente');
    }
    
    // 5. Success - refresh stats
    await refetchStats();
    
    // 6. Check if all goods were reassigned
    const remainingGoods = await supabase
      .from('goods')
      .select('id')
      .eq('key_resguardante', fromEmployee.id_directorio);
    
    if (remainingGoods.data?.length === 0) {
      // All goods reassigned - show delete modal
      setModalState({ type: 'delete', data: fromEmployee });
    } else {
      // Some goods remain - close modal
      onClose();
    }
    
  } catch (error) {
    console.error('Reassignment error:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```


### 5.6 FutureFeatureModal (NEW)

**Purpose**: Generic modal to inform users about features not yet implemented

**Props**:
```typescript
interface FutureFeatureModalProps {
  show: boolean;
  featureName: string;
  description?: string;
  onClose: () => void;
}
```

**Layout**:
```typescript
<div className="p-6 text-center">
  <div className="mb-4 flex justify-center">
    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
      <Rocket className="w-8 h-8 text-blue-600" />
    </div>
  </div>
  
  <h3 className="text-lg font-medium mb-2">
    Funcionalidad Próximamente
  </h3>
  
  <p className="text-gray-600 mb-1">
    {featureName}
  </p>
  
  {description && (
    <p className="text-sm text-gray-500 mb-6">
      {description}
    </p>
  )}
  
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <p className="text-sm text-blue-800">
      Esta funcionalidad está en desarrollo y estará disponible en una próxima actualización.
    </p>
  </div>
  
  <button
    onClick={onClose}
    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  >
    Entendido
  </button>
</div>
```

**Usage Examples**:
```typescript
// When "Gestionar Bajas" button is clicked in ResguardosActiveModal
<FutureFeatureModal
  show={showFutureFeature}
  featureName="Gestión de Bajas de Resguardos"
  description="Podrás gestionar y dar de baja resguardos activos directamente desde esta pantalla."
  onClose={() => setShowFutureFeature(false)}
/>

// When "Ver Historial" button is clicked
<FutureFeatureModal
  show={showFutureFeature}
  featureName="Historial de Cambios"
  description="Consulta el historial completo de modificaciones del empleado."
  onClose={() => setShowFutureFeature(false)}
/>
```

**Animation**:
- Fade in/out with framer-motion
- Scale animation (0.95 → 1.0)
- Backdrop blur effect


## 6. User Flows

### 6.1 Add Employee Flow

```
User clicks "Agregar empleado"
  ↓
DirectorioAddForm appears (animated)
  ↓
User enters:
  - Nombre (auto-uppercase)
  - Puesto (auto-uppercase, optional)
  - Áreas (type + Enter to add)
  ↓
User clicks "Guardar"
  ↓
Validation:
  - Nombre not empty? ✓
  - At least 1 area? ✓
  ↓
useDirectorioActions.addEmployee()
  ↓
  1. Insert into directorio table
  2. For each area:
     - Check if exists (case-insensitive)
     - Create if needed
     - Insert into directorio_areas
  ↓
Success:
  - Form closes (animated)
  - List refreshes (realtime)
  - New employee appears
```

### 6.2 Edit Employee Flow (No Resguardos)

```
User clicks Edit button on employee card
  ↓
Check stats.get(employee.id).resguardos
  ↓
resguardos === 0? YES
  ↓
Show inline edit form OR AddEditModal
  ↓
User modifies:
  - Nombre
  - Puesto
  - Áreas (add/remove)
  ↓
User clicks "Guardar"
  ↓
useDirectorioActions.updateEmployee()
  ↓
  1. Update directorio table
  2. Delete old directorio_areas
  3. Insert new directorio_areas
  ↓
Success:
  - Form closes
  - Card updates (realtime)
```

### 6.3 Edit Employee Flow (With Resguardos)

```
User clicks Edit button on employee card
  ↓
Check stats.get(employee.id).resguardos
  ↓
resguardos > 0? YES
  ↓
Show ResguardosActiveModal
  ↓
Load resguardos for employee
  ↓
Display split view:
  - Left: List of resguardos
  - Right: Goods details (when selected)
  ↓
User options:
  1. Click "Cerrar" → Close modal, cancel operation
  2. Click "Gestionar Bajas" → Show FutureFeatureModal
     ↓
     FutureFeatureModal displays:
     - "Gestión de Bajas de Resguardos"
     - Description
     - "Entendido" button
     ↓
     User clicks "Entendido" → Close modal
```


### 6.4 Delete Employee Flow (No Restrictions)

```
User clicks Delete button on employee card
  ↓
Check stats.get(employee.id)
  ↓
resguardos === 0 AND bienesACargo === 0? YES
  ↓
Show DeleteModal
  ↓
Display:
  - Warning icon
  - Employee data
  - "Esta acción no se puede deshacer"
  ↓
User clicks "Confirmar"
  ↓
Modal state: Deleting (loading spinner)
  ↓
useDirectorioActions.deleteEmployee()
  ↓
DELETE from directorio WHERE id = X
  (CASCADE deletes directorio_areas)
  ↓
Success:
  - Modal state: Success (checkmark, 1.5s)
  - Modal closes automatically
  - Card disappears from list (animated)
```

### 6.5 Delete Employee Flow (With Resguardos)

```
User clicks Delete button on employee card
  ↓
Check stats.get(employee.id).resguardos
  ↓
resguardos > 0? YES
  ↓
Show ResguardosActiveModal
  (Same as Edit flow with resguardos)
  ↓
User must manage resguardos first
  (Future feature)
```

### 6.6 Delete Employee Flow (With Goods, No Resguardos)

```
User clicks Delete button on employee card
  ↓
Check stats.get(employee.id)
  ↓
resguardos === 0 AND bienesACargo > 0? YES
  ↓
Show BienesACargoModal (Info View)
  ↓
Display:
  - Alert: "X bienes a cargo"
  - Employee data
  ↓
User options:
  1. Click "Cerrar" → Cancel operation
  2. Click "Reasignar Bienes" → Continue
     ↓
     Switch to Reassignment View
     ↓
     Load goods for employee
     Pre-select ALL goods
     Load available resguardantes
     ↓
     Display split view:
       - Left: SelectedBienesPanel (33%)
         - Checkboxes for each good
         - "Limpiar selección" button
       - Right: Resguardante Selector (67%)
         - Search bar
         - Selected resguardante display
         - List of available resguardantes
     ↓
     User:
       1. Selects/deselects goods (optional)
       2. Searches for resguardante
       3. Clicks on destination resguardante
     ↓
     User clicks "Confirmar Reasignación"
     ↓
     Validation:
       - At least 1 good selected? ✓
       - Destination resguardante selected? ✓
     ↓
     Show ReassignmentConfirmModal
     ↓
     Display:
       - From: Employee A
       - To: Employee B
       - Count: X bienes
     ↓
     User clicks "Confirmar"
     ↓
     Execute reassignment:
       1. Validate destination exists
       2. Validate goods exist
       3. Batch UPDATE goods
       4. Verify all updated
       5. Refresh stats
     ↓
     Check remaining goods:
       - If bienesACargo === 0:
         → Automatically show DeleteModal
         → User can complete deletion
       - If bienesACargo > 0:
         → Close modal
         → User must repeat for remaining goods
```


### 6.7 Search and Filter Flow

```
User types in search bar
  ↓
Debounce 300ms
  ↓
useDirectorioSearch filters by:
  - nombre (case-insensitive)
  - puesto (case-insensitive)
  - id_directorio (exact match)
  - area names (case-insensitive)
  ↓
Update filteredDirectorio
Update highlightedAreas (Set of matching area IDs)
  ↓
Re-render DirectorioCard components
  ↓
Matching areas show with highlighted style:
  - Brighter background
  - Border emphasis
  - Scale animation (1.0 → 1.05 → 1.0)
  ↓
Display result count:
  "X de Y empleados"
```

## 7. Styling and Animations

### 7.1 Theme Integration

**Dark Mode Support**:
```typescript
const { isDarkMode } = useTheme();

// Background colors
const bgPrimary = isDarkMode ? 'bg-black' : 'bg-white';
const bgSecondary = isDarkMode ? 'bg-white/[0.02]' : 'bg-black/[0.02]';

// Text colors
const textPrimary = isDarkMode ? 'text-white' : 'text-black';
const textSecondary = isDarkMode ? 'text-white/60' : 'text-black/60';

// Border colors
const borderPrimary = isDarkMode ? 'border-white/10' : 'border-black/10';
const borderHover = isDarkMode ? 'border-white/20' : 'border-black/20';
```

### 7.2 Framer Motion Animations

**Card Animations**:
```typescript
<motion.div
  layout
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ 
    layout: { type: 'spring', stiffness: 350, damping: 30 },
    opacity: { duration: 0.2 }
  }}
  whileHover={{ scale: 1.005 }}
  className="employee-card"
>
  {/* Card content */}
</motion.div>
```

**Modal Animations**:
```typescript
<AnimatePresence>
  {show && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="modal-content"
      >
        {/* Modal content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Area Chip Highlight Animation**:
```typescript
<motion.span
  animate={isHighlighted ? { scale: [1, 1.05, 1] } : {}}
  transition={{ duration: 0.3 }}
  className={cn(
    "area-chip",
    isHighlighted && "highlighted"
  )}
>
  {area.nombre}
</motion.span>
```

### 7.3 Loading States

**Skeleton Loader**:
```typescript
<div className="space-y-4">
  {[1, 2, 3].map(i => (
    <div key={i} className="animate-pulse">
      <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>
  ))}
</div>
```

**Button Loading State**:
```typescript
<button disabled={loading}>
  {loading ? (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  ) : (
    'Guardar'
  )}
</button>
```


## 8. Error Handling

### 8.1 Error Types

**Validation Errors**:
```typescript
interface ValidationError {
  field: string;
  message: string;
}

const validateForm = (data: DirectorioFormData): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!data.nombre || data.nombre.trim().length < 2) {
    errors.push({ field: 'nombre', message: 'El nombre debe tener al menos 2 caracteres' });
  }
  
  if (data.selectedAreas.length === 0) {
    errors.push({ field: 'areas', message: 'Debe asignar al menos un área' });
  }
  
  return errors;
};
```

**Database Errors**:
```typescript
try {
  await supabase.from('directorio').insert(data);
} catch (error) {
  if (error.code === '23505') {
    // Unique constraint violation
    setError('Ya existe un empleado con ese nombre');
  } else if (error.code === '23503') {
    // Foreign key violation
    setError('Error de integridad referencial');
  } else {
    setError('Error al guardar: ' + error.message);
  }
}
```

**Network Errors**:
```typescript
try {
  const response = await fetch('/api/supabase-proxy', { ... });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    setError('Error de conexión. Verifica tu internet.');
  } else {
    setError(error.message);
  }
}
```

### 8.2 Error Display

**Inline Field Errors**:
```typescript
<div className="space-y-1">
  <input
    className={cn(
      "input",
      errors.nombre && "border-red-500"
    )}
  />
  {errors.nombre && (
    <p className="text-xs text-red-500">{errors.nombre}</p>
  )}
</div>
```

**Toast Notifications** (NO notification system per requirements):
```typescript
// Instead, use inline error messages in modals
<div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
  <p className="text-sm text-red-800">{error}</p>
</div>
```

**Error Recovery**:
```typescript
const handleError = (error: Error) => {
  console.error('Operation failed:', error);
  setError(error.message);
  
  // Offer retry option
  setShowRetry(true);
};

// In UI
{showRetry && (
  <button onClick={retryOperation}>
    Reintentar
  </button>
)}
```


## 9. Performance Optimizations

### 9.1 Memoization Strategy

**Component Memoization**:
```typescript
// Memoize expensive computations
const directorioWithStats = useMemo(() => {
  return directorio.map(employee => ({
    ...employee,
    areas: getAreasForDirector(employee.id_directorio),
    stats: stats.get(employee.id_directorio) || { resguardos: 0, bienesACargo: 0 }
  }));
}, [directorio, stats, directorioAreas, areas]);

// Memoize filtered results
const filteredDirectorio = useMemo(() => {
  return directorioWithStats.filter(employee => {
    // Filter logic
  });
}, [directorioWithStats, searchTerm]);

// Memoize area mappings
const directorAreasMap = useMemo(() => {
  return directorioAreas.reduce((acc, rel) => {
    if (!acc[rel.id_directorio]) acc[rel.id_directorio] = [];
    acc[rel.id_directorio].push(rel.id_area);
    return acc;
  }, {} as Record<number, number[]>);
}, [directorioAreas]);
```

**Callback Memoization**:
```typescript
const handleEdit = useCallback((employee: Directorio) => {
  // Handler logic
}, [stats, setModalState]);

const handleDelete = useCallback((employee: Directorio) => {
  // Handler logic
}, [stats, setModalState]);
```

### 9.2 Query Optimization

**Batch Statistics Query**:
```typescript
// Instead of querying per employee, batch query all at once
const fetchAllStats = async (employeeIds: number[]) => {
  // Single query for all resguardos
  const resguardosPromise = supabase
    .from('resguardos')
    .select('id_directorio, folio')
    .in('id_directorio', employeeIds);
  
  // Single query for all goods
  const goodsPromise = supabase
    .from('goods')
    .select('key_resguardante')
    .in('key_resguardante', employeeIds);
  
  // Execute in parallel
  const [resguardosResult, goodsResult] = await Promise.all([
    resguardosPromise,
    goodsPromise
  ]);
  
  // Process results
  return processStats(resguardosResult.data, goodsResult.data);
};
```

**Indexed Queries**:
```sql
-- Ensure these indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_resguardos_id_directorio 
  ON resguardos(id_directorio);

CREATE INDEX IF NOT EXISTS idx_goods_key_resguardante 
  ON goods(key_resguardante);

CREATE INDEX IF NOT EXISTS idx_directorio_areas_id_directorio 
  ON directorio_areas(id_directorio);

CREATE INDEX IF NOT EXISTS idx_directorio_areas_id_area 
  ON directorio_areas(id_area);
```

### 9.3 Debouncing and Throttling

**Search Debounce**:
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDeferredValue(searchTerm);

// Or with custom hook
const debouncedSearch = useDebounce(searchTerm, 300);
```

**Scroll Throttling** (if implementing virtual scrolling):
```typescript
const handleScroll = useThrottle((event) => {
  // Scroll logic
}, 100);
```

### 9.4 Lazy Loading

**Modal Content**:
```typescript
// Only load modal content when opened
const ResguardosActiveModal = lazy(() => 
  import('./modals/ResguardosActiveModal')
);

// In component
<Suspense fallback={<LoadingSpinner />}>
  {showModal && <ResguardosActiveModal {...props} />}
</Suspense>
```

**Data Pagination** (if list grows large):
```typescript
const ITEMS_PER_PAGE = 50;

const paginatedDirectorio = useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  return filteredDirectorio.slice(start, end);
}, [filteredDirectorio, currentPage]);
```


## 10. Testing Strategy

### 10.1 Unit Tests

**Hook Tests** (useDirectorioStats):
```typescript
describe('useDirectorioStats', () => {
  it('should calculate statistics correctly', async () => {
    const { result } = renderHook(() => useDirectorioStats([1, 2, 3]));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.stats.get(1)).toEqual({
      resguardos: 2,
      bienesACargo: 5
    });
  });
  
  it('should handle empty employee list', () => {
    const { result } = renderHook(() => useDirectorioStats([]));
    expect(result.current.stats.size).toBe(0);
  });
  
  it('should refetch on demand', async () => {
    const { result } = renderHook(() => useDirectorioStats([1]));
    await result.current.refetch();
    expect(result.current.loading).toBe(false);
  });
});
```

**Component Tests** (DirectorioCard):
```typescript
describe('DirectorioCard', () => {
  const mockEmployee = {
    id_directorio: 1,
    nombre: 'JUAN PEREZ',
    puesto: 'DIRECTOR',
    areas: [{ id_area: 1, nombre: 'SISTEMAS' }],
    stats: { resguardos: 0, bienesACargo: 0 }
  };
  
  it('should render employee information', () => {
    render(<DirectorioCard employee={mockEmployee} />);
    expect(screen.getByText('JUAN PEREZ')).toBeInTheDocument();
    expect(screen.getByText('DIRECTOR')).toBeInTheDocument();
  });
  
  it('should highlight matching areas', () => {
    const highlightedAreas = new Set([1]);
    render(
      <DirectorioCard 
        employee={mockEmployee} 
        highlightedAreas={highlightedAreas}
      />
    );
    const areaChip = screen.getByText('SISTEMAS');
    expect(areaChip).toHaveClass('highlighted');
  });
  
  it('should call onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    render(<DirectorioCard employee={mockEmployee} onEdit={onEdit} />);
    fireEvent.click(screen.getByTitle('Editar'));
    expect(onEdit).toHaveBeenCalledWith(mockEmployee);
  });
});
```

### 10.2 Integration Tests

**Add Employee Flow**:
```typescript
describe('Add Employee Integration', () => {
  it('should add employee with areas', async () => {
    render(<DirectorioManager />);
    
    // Click add button
    fireEvent.click(screen.getByText('Agregar empleado'));
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Nombre completo...'), {
      target: { value: 'MARIA LOPEZ' }
    });
    fireEvent.change(screen.getByPlaceholderText('Puesto...'), {
      target: { value: 'COORDINADORA' }
    });
    
    // Add area
    const areaInput = screen.getByPlaceholderText('Agregar área...');
    fireEvent.change(areaInput, { target: { value: 'RECURSOS HUMANOS' } });
    fireEvent.keyDown(areaInput, { key: 'Enter' });
    
    // Submit
    fireEvent.click(screen.getByText('Agregar'));
    
    // Verify
    await waitFor(() => {
      expect(screen.getByText('MARIA LOPEZ')).toBeInTheDocument();
    });
  });
});
```

**Delete with Reassignment Flow**:
```typescript
describe('Delete with Reassignment Integration', () => {
  it('should reassign goods before deletion', async () => {
    // Setup: Employee with goods but no resguardos
    const employee = { id_directorio: 1, bienesACargo: 3, resguardos: 0 };
    
    render(<DirectorioManager />);
    
    // Click delete
    fireEvent.click(screen.getByTitle('Eliminar'));
    
    // Should show BienesACargoModal
    expect(screen.getByText('3 bienes a cargo')).toBeInTheDocument();
    
    // Click reassign
    fireEvent.click(screen.getByText('Reasignar Bienes'));
    
    // Select destination
    fireEvent.click(screen.getByText('PEDRO GOMEZ'));
    
    // Confirm reassignment
    fireEvent.click(screen.getByText('Confirmar Reasignación'));
    
    // Should show confirmation modal
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Confirmar'));
    
    // Should automatically show delete modal
    await waitFor(() => {
      expect(screen.getByText('¿Eliminar a')).toBeInTheDocument();
    });
  });
});
```

### 10.3 E2E Tests (Playwright/Cypress)

```typescript
test('complete employee lifecycle', async ({ page }) => {
  await page.goto('/admin/personal');
  
  // Add employee
  await page.click('text=Agregar empleado');
  await page.fill('input[placeholder="Nombre completo..."]', 'TEST USER');
  await page.fill('input[placeholder="Puesto..."]', 'TESTER');
  await page.fill('input[placeholder="Agregar área..."]', 'QA');
  await page.keyboard.press('Enter');
  await page.click('text=Agregar');
  
  // Verify added
  await expect(page.locator('text=TEST USER')).toBeVisible();
  
  // Edit employee
  await page.click('[title="Editar"]');
  await page.fill('input[value="TEST USER"]', 'TEST USER UPDATED');
  await page.click('text=Guardar');
  
  // Verify updated
  await expect(page.locator('text=TEST USER UPDATED')).toBeVisible();
  
  // Delete employee
  await page.click('[title="Eliminar"]');
  await page.click('text=Confirmar');
  
  // Verify deleted
  await expect(page.locator('text=TEST USER UPDATED')).not.toBeVisible();
});
```


## 11. Accessibility

### 11.1 Keyboard Navigation

**Tab Order**:
```
1. Search input
2. Add employee button
3. Employee cards (each card is focusable)
   - Edit button
   - Delete button
4. Modal elements (when open)
   - Form inputs
   - Buttons
   - Close button
```

**Keyboard Shortcuts**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Escape to close modal
    if (e.key === 'Escape' && modalState.type !== 'none') {
      setModalState({ type: 'none' });
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [modalState]);
```

### 11.2 ARIA Attributes

**Modal**:
```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Agregar Empleado</h2>
  <p id="modal-description">Complete el formulario...</p>
</div>
```

**Buttons**:
```typescript
<button
  aria-label="Editar empleado"
  aria-describedby={`employee-${id}`}
>
  <Edit size={14} />
</button>

<button
  aria-label="Eliminar empleado"
  aria-describedby={`employee-${id}`}
>
  <Trash2 size={14} />
</button>
```

**Form Fields**:
```typescript
<label htmlFor="employee-name">
  Nombre
  <span aria-label="requerido">*</span>
</label>
<input
  id="employee-name"
  aria-required="true"
  aria-invalid={!!errors.nombre}
  aria-describedby={errors.nombre ? "name-error" : undefined}
/>
{errors.nombre && (
  <span id="name-error" role="alert">
    {errors.nombre}
  </span>
)}
```

**Search**:
```typescript
<div role="search">
  <label htmlFor="employee-search" className="sr-only">
    Buscar empleados
  </label>
  <input
    id="employee-search"
    type="search"
    aria-label="Buscar por nombre, puesto o área"
    aria-controls="employee-list"
  />
</div>

<div id="employee-list" role="list" aria-live="polite">
  {filteredDirectorio.map(employee => (
    <div key={employee.id_directorio} role="listitem">
      {/* Employee card */}
    </div>
  ))}
</div>
```

### 11.3 Focus Management

**Modal Focus Trap**:
```typescript
const useFocusTrap = (isOpen: boolean) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const modal = modalRef.current;
    if (!modal) return;
    
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    modal.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);
  
  return modalRef;
};
```

**Return Focus**:
```typescript
const [previousFocus, setPreviousFocus] = useState<HTMLElement | null>(null);

const openModal = () => {
  setPreviousFocus(document.activeElement as HTMLElement);
  setModalState({ type: 'add' });
};

const closeModal = () => {
  setModalState({ type: 'none' });
  previousFocus?.focus();
};
```

### 11.4 Screen Reader Support

**Live Regions**:
```typescript
// Announce search results
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {filteredDirectorio.length} resultados encontrados
</div>

// Announce loading state
<div aria-live="polite" aria-busy={loading} className="sr-only">
  {loading ? 'Cargando empleados...' : 'Empleados cargados'}
</div>

// Announce errors
<div role="alert" aria-live="assertive">
  {error}
</div>
```

**Descriptive Labels**:
```typescript
<button aria-label={`Editar ${employee.nombre}, ${employee.puesto}`}>
  <Edit size={14} />
</button>

<span aria-label={`${employee.areas.length} áreas asignadas`}>
  {employee.areas.map(area => (
    <span key={area.id_area}>{area.nombre}</span>
  ))}
</span>
```


## 12. Migration Strategy

### 12.1 Backward Compatibility

**Preserve Existing Data**:
- Keep `directorio.area` field (deprecated but not removed)
- Maintain existing `directorio_areas` relationships
- No breaking changes to database schema

**Gradual Migration**:
```typescript
// Support both old and new patterns
const getEmployeeAreas = (employee: Directorio): Area[] => {
  // New pattern: Use N:M relationship
  const relatedAreas = directorioAreas
    .filter(rel => rel.id_directorio === employee.id_directorio)
    .map(rel => areas.find(a => a.id_area === rel.id_area))
    .filter(Boolean);
  
  if (relatedAreas.length > 0) {
    return relatedAreas;
  }
  
  // Fallback: Use deprecated area field
  if (employee.area) {
    const legacyArea = areas.find(a => 
      a.nombre.toLowerCase() === employee.area?.toLowerCase()
    );
    return legacyArea ? [legacyArea] : [];
  }
  
  return [];
};
```

### 12.2 Component Migration Path

**Phase 1: Refactor Structure**
- Extract components from monolithic file
- Create hooks for logic separation
- Maintain existing functionality
- No UI changes

**Phase 2: Add Statistics**
- Implement `useDirectorioStats` hook
- Display stats in UI (non-blocking)
- Test with real data

**Phase 3: Add Validation**
- Implement hierarchical validation
- Add blocking modals
- Test all edge cases

**Phase 4: Add Reassignment**
- Implement `BienesACargoModal`
- Implement `ReassignmentConfirmModal`
- Test reassignment flow

**Phase 5: Polish**
- Add animations
- Improve accessibility
- Performance optimization
- User testing

### 12.3 Rollback Plan

**Feature Flags**:
```typescript
const FEATURE_FLAGS = {
  USE_NEW_DIRECTORIO: process.env.NEXT_PUBLIC_USE_NEW_DIRECTORIO === 'true',
  ENABLE_REASSIGNMENT: process.env.NEXT_PUBLIC_ENABLE_REASSIGNMENT === 'true',
};

// In component
if (FEATURE_FLAGS.USE_NEW_DIRECTORIO) {
  return <NewDirectorioManager />;
} else {
  return <LegacyDirectorioComponent />;
}
```

**Data Integrity Checks**:
```typescript
// Before migration, verify data integrity
const verifyDataIntegrity = async () => {
  // Check for orphaned directorio_areas
  const { data: orphaned } = await supabase
    .from('directorio_areas')
    .select('*')
    .not('id_directorio', 'in', 
      supabase.from('directorio').select('id_directorio')
    );
  
  if (orphaned && orphaned.length > 0) {
    console.warn('Found orphaned directorio_areas:', orphaned);
  }
  
  // Check for employees without areas
  const { data: noAreas } = await supabase
    .from('directorio')
    .select('id_directorio, nombre')
    .not('id_directorio', 'in',
      supabase.from('directorio_areas').select('id_directorio')
    );
  
  if (noAreas && noAreas.length > 0) {
    console.warn('Found employees without areas:', noAreas);
  }
};
```


## 13. Security Considerations

### 13.1 Input Validation

**Client-Side Validation**:
```typescript
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 255);   // Limit length
};

const validateEmployeeData = (data: DirectorioFormData): boolean => {
  // Validate nombre
  if (!data.nombre || data.nombre.length < 2 || data.nombre.length > 255) {
    return false;
  }
  
  // Validate puesto
  if (data.puesto && data.puesto.length > 255) {
    return false;
  }
  
  // Validate areas
  if (!Array.isArray(data.selectedAreas) || data.selectedAreas.length === 0) {
    return false;
  }
  
  // Validate area IDs are numbers
  if (!data.selectedAreas.every(id => typeof id === 'number' && id > 0)) {
    return false;
  }
  
  return true;
};
```

**Server-Side Validation** (via Supabase RLS):
```sql
-- Ensure only authenticated users can modify directorio
CREATE POLICY "Authenticated users can insert directorio"
  ON directorio FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update directorio"
  ON directorio FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete directorio"
  ON directorio FOR DELETE
  TO authenticated
  USING (true);
```

### 13.2 Authorization

**Role-Based Access**:
```typescript
const { role } = useUserRole();

const canModifyDirectorio = role === 'admin' || role === 'superadmin';

// In component
<button
  onClick={handleEdit}
  disabled={!canModifyDirectorio}
  aria-disabled={!canModifyDirectorio}
>
  Editar
</button>
```

**Operation Permissions**:
```typescript
const PERMISSIONS = {
  admin: {
    canAdd: true,
    canEdit: true,
    canDelete: true,
    canReassign: true,
  },
  usuario: {
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canReassign: false,
  },
};

const hasPermission = (operation: keyof typeof PERMISSIONS.admin): boolean => {
  return PERMISSIONS[role]?.[operation] ?? false;
};
```

### 13.3 Data Protection

**Prevent SQL Injection**:
```typescript
// Always use parameterized queries via Supabase client
// GOOD:
await supabase
  .from('directorio')
  .select('*')
  .eq('id_directorio', employeeId);

// BAD (never do this):
// await supabase.rpc('raw_query', { 
//   query: `SELECT * FROM directorio WHERE id = ${employeeId}` 
// });
```

**Prevent XSS**:
```typescript
// React automatically escapes content, but be careful with:
// - dangerouslySetInnerHTML (never use with user input)
// - Direct DOM manipulation
// - URL parameters

// GOOD:
<p>{employee.nombre}</p>

// BAD:
// <p dangerouslySetInnerHTML={{ __html: employee.nombre }} />
```

**Rate Limiting**:
```typescript
// Implement debouncing for operations
const debouncedSave = useMemo(
  () => debounce(async (data: DirectorioFormData) => {
    await saveEmployee(data);
  }, 1000),
  []
);

// Prevent rapid-fire deletions
const [lastDeleteTime, setLastDeleteTime] = useState(0);

const handleDelete = async (id: number) => {
  const now = Date.now();
  if (now - lastDeleteTime < 2000) {
    setError('Por favor espera antes de eliminar otro empleado');
    return;
  }
  
  setLastDeleteTime(now);
  await deleteEmployee(id);
};
```

### 13.4 Audit Trail

**Log Critical Operations**:
```typescript
const logOperation = async (
  operation: 'add' | 'update' | 'delete' | 'reassign',
  employeeId: number,
  details: any
) => {
  try {
    await supabase.from('audit_log').insert({
      table_name: 'directorio',
      operation,
      record_id: employeeId,
      user_id: user?.id,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log operation:', error);
    // Don't fail the operation if logging fails
  }
};

// Usage
await deleteEmployee(id);
await logOperation('delete', id, { nombre: employee.nombre });
```


## 14. Future Enhancements

### 14.1 Planned Features (Out of Scope for Initial Release)

**Navigation to Resguardos Management**:
- Implement actual navigation from ResguardosActiveModal
- Pass resguardante filter to /resguardos/consultar
- Currently shows FutureFeatureModal

**SelectedBienesPanel Component**:
- Reusable component for goods selection
- Used in BienesACargoModal
- Can be extracted for use in other modules

**Advanced Filtering**:
- Filter by area
- Filter by position
- Filter by statistics (has resguardos, has goods)
- Multiple filter combinations

**Bulk Operations**:
- Select multiple employees
- Bulk area assignment
- Bulk export

**Employee Profiles**:
- Detailed view with history
- Photo/avatar upload
- Contact information
- Assignment history

**Import/Export**:
- CSV import for bulk employee creation
- Excel export with statistics
- Template download

### 14.2 Technical Debt to Address

**Performance**:
- Implement virtual scrolling for large lists (>100 employees)
- Add pagination if needed
- Optimize statistics queries with database views

**Testing**:
- Increase test coverage to >80%
- Add more integration tests
- Implement E2E test suite

**Documentation**:
- Add JSDoc comments to all functions
- Create Storybook stories for components
- Write user guide

**Monitoring**:
- Add error tracking (Sentry)
- Add analytics for feature usage
- Performance monitoring

### 14.3 Known Limitations

**Current Limitations**:
1. Statistics refresh on every component mount (could be optimized with cache)
2. No offline support (requires internet connection)
3. No undo/redo functionality
4. No bulk operations
5. Limited to 1000 employees (performance not tested beyond this)

**Workarounds**:
1. Implement cache with TTL for statistics
2. Add service worker for offline support (future)
3. Implement command pattern for undo/redo (future)
4. Add bulk operations UI (future)
5. Implement pagination/virtualization (future)


## 15. Implementation Checklist

### 15.1 Phase 1: Foundation (Week 1)

- [ ] Create directory structure
- [ ] Define TypeScript types (types.ts)
- [ ] Implement useDirectorioStats hook
- [ ] Implement useDirectorioActions hook
- [ ] Implement useDirectorioSearch hook
- [ ] Implement useAreaManagement hook
- [ ] Write unit tests for hooks

### 15.2 Phase 2: Core Components (Week 2)

- [ ] Create DirectorioCard component
- [ ] Create DirectorioEditCard component
- [ ] Create DirectorioAddForm component
- [ ] Create SearchBar component
- [ ] Create AreaChip component
- [ ] Create EmptyState component
- [ ] Create LoadingState component
- [ ] Write unit tests for components

### 15.3 Phase 3: Modals (Week 3)

- [ ] Create AddEditModal
- [ ] Create DeleteModal with 3 states
- [ ] Create ResguardosActiveModal with split view
- [ ] Create BienesACargoModal with 2 views
- [ ] Create ReassignmentConfirmModal
- [ ] Create FutureFeatureModal
- [ ] Write integration tests for modal flows

### 15.4 Phase 4: Main Orchestrator (Week 4)

- [ ] Create main index.tsx orchestrator
- [ ] Implement validation logic
- [ ] Implement modal state management
- [ ] Integrate all components and hooks
- [ ] Add animations with framer-motion
- [ ] Implement error handling
- [ ] Write integration tests

### 15.5 Phase 5: Polish & Testing (Week 5)

- [ ] Add accessibility features
- [ ] Implement keyboard navigation
- [ ] Add ARIA attributes
- [ ] Optimize performance
- [ ] Add loading states
- [ ] Implement error recovery
- [ ] Write E2E tests
- [ ] User acceptance testing

### 15.6 Phase 6: Documentation & Deployment (Week 6)

- [ ] Write JSDoc comments
- [ ] Create Storybook stories
- [ ] Write user guide
- [ ] Code review
- [ ] Performance testing
- [ ] Security audit
- [ ] Deploy to staging
- [ ] Deploy to production

## 16. Success Criteria

### 16.1 Functional Requirements

- ✅ All CRUD operations work correctly
- ✅ Hierarchical validation prevents data integrity issues
- ✅ Reassignment flow completes successfully
- ✅ Search and filtering work as expected
- ✅ All modals display correct information
- ✅ Realtime updates work correctly

### 16.2 Non-Functional Requirements

- ✅ Component complexity reduced by 60%
- ✅ Test coverage > 80%
- ✅ Statistics load < 500ms
- ✅ Search results < 200ms
- ✅ Modal transitions smooth (60fps)
- ✅ No memory leaks
- ✅ Accessible (WCAG 2.1 AA compliant)
- ✅ Responsive (mobile + desktop)

### 16.3 User Acceptance

- ✅ Users can complete tasks faster
- ✅ Zero data integrity issues reported
- ✅ Positive feedback on reassignment workflow
- ✅ Reduced support tickets
- ✅ High user satisfaction scores

## 17. Conclusion

This design document provides a comprehensive blueprint for refactoring the Directorio management component. The modular architecture, clear separation of concerns, and robust validation logic will result in a maintainable, scalable, and user-friendly solution.

Key benefits of this design:
- **Maintainability**: Clear component structure and separation of concerns
- **Scalability**: Hooks and components can be reused and extended
- **Data Integrity**: Hierarchical validation prevents orphaned data
- **User Experience**: Smooth animations, clear feedback, and intuitive workflows
- **Accessibility**: Full keyboard navigation and screen reader support
- **Performance**: Optimized queries and memoization strategies
- **Future-Proof**: FutureFeatureModal allows graceful handling of incomplete features

The implementation will follow a phased approach, allowing for iterative development, testing, and user feedback at each stage.

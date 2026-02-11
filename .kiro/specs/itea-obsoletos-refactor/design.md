# ITEA Obsoletos Component Refactoring - Design Document

## Architecture Overview

This design follows the proven architecture from the INEA obsoletos refactoring, adapted for ITEA-specific requirements.

### Component Hierarchy

```
ConsultasIteaObsoletos (index.tsx)
├── Header
├── ValueStatsPanel
│   └── AnimatedCounter (x2)
├── SearchBar (reused from inea/components)
├── FilterChips (reused from inea/components)
├── SuggestionDropdown (reused from inea/components)
├── InventoryTable
│   └── ImagePreview (inline)
├── DetailPanel
│   ├── ImagePreview
│   └── Form fields
├── Pagination
└── Modals
    ├── ReactivarModal
    ├── DirectorModal
    └── AreaSelectionModal
```

### Data Flow

```
useIteaObsoletosIndexation (global store)
    ↓
Main Component (index.tsx)
    ↓
useSearchAndFilters → Filtered Data
    ↓
useMemo (sorting) → Sorted Data
    ↓
Pagination → Paginated Data
    ↓
InventoryTable (display)
    ↓
useItemEdit (selection/editing)
    ↓
DetailPanel (display/edit)
```

## Type Definitions

### Core Types (`types.ts`)

```typescript
/**
 * Represents a furniture item in the ITEA obsolete inventory
 */
export interface MuebleITEA {
  // Primary key
  id: string; // UUID
  
  // Basic information
  id_inv: string | null;
  rubro: string | null;
  descripcion: string | null;
  valor: number | null;
  
  // Acquisition details
  f_adq: string | null;
  formadq: string | null;
  proveedor: string | null;
  factura: string | null;
  
  // Location
  ubicacion_es: string | null;
  ubicacion_mu: string | null;
  ubicacion_no: string | null;
  
  // Status
  estado: string | null;
  estatus: string | null;
  
  // Relational fields (NEW)
  area: { id_area: number; nombre: string } | null;
  directorio: { id_directorio: number; nombre: string; puesto: string } | null;
  id_area: number | null;
  id_directorio: number | null;
  
  // Legacy field (kept for compatibility)
  usufinal: string | null;
  
  // Deprecation details
  fechabaja: string | null;
  causadebaja: string | null;
  resguardante: string | null;
  
  // Media
  image_path: string | null;
}

export interface FilterOptions {
  estados: string[];
  estatus: string[];
  areas: string[];
  rubros: string[];
  formadq: string[];
  directores: { nombre: string; areas: string[] }[];
}

export interface FilterState {
  estado: string;
  area: string;
  rubro: string;
}

export interface Directorio {
  id_directorio: number;
  nombre: string;
  areas: string[];
}

export interface Area {
  id_area: number;
  nombre: string;
}

export interface Message {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

export interface AnimatedCounterProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  isInteger?: boolean;
}

export interface BajaInfo {
  created_by: string;
  created_at: string;
  motive: string;
}

export interface ImagePreviewProps {
  imagePath: string | null;
}
```

## Custom Hooks Design

### 1. `useItemEdit.ts`

**Purpose**: Manage item selection, editing state, and save operations

**State:**
```typescript
- selectedItem: MuebleITEA | null
- isEditing: boolean
- editFormData: MuebleITEA | null
- imageFile: File | null
- imagePreview: string | null
- uploading: boolean
- showReactivarModal: boolean
- reactivating: boolean
```

**Methods:**
```typescript
- handleSelectItem(item: MuebleITEA): void
- handleStartEdit(): void
- cancelEdit(): void
- closeDetail(): void
- handleImageChange(e: ChangeEvent<HTMLInputElement>): void
- saveChanges(): Promise<void>
- handleEditFormChange(e: ChangeEvent, field: keyof MuebleITEA): void
- reactivarArticulo(): Promise<void>
```

**Dependencies:**
- `useNotifications` for success/error messages
- Supabase client for data operations
- Router for URL parameter management

### 2. `useDirectorManagement.ts`

**Purpose**: Handle director CRUD operations and area assignments

**State:**
```typescript
- directorio: Directorio[]
- showDirectorModal: boolean
- incompleteDirector: Directorio | null
- directorFormData: { area: string }
- savingDirector: boolean
- showAreaSelectModal: boolean
- areaOptionsForDirector: string[]
```

**Methods:**
```typescript
- fetchDirectorio(): Promise<void>
- handleSelectDirector(nombre: string, selectedItem, editFormData, setEditFormData, setSelectedItem): void
- saveDirectorInfo(): Promise<void>
- handleAreaSelection(area: string, editFormData, selectedItem, setEditFormData, setSelectedItem): void
```

**Logic:**
1. Fetch all directors with their areas from `directorio` and `directorio_areas` tables
2. When director is selected:
   - If no areas: Show `DirectorModal` to assign area
   - If multiple areas: Show `AreaSelectionModal` to choose
   - If one area: Auto-assign
3. Update both `id_directorio` and `id_area` foreign keys

### 3. `useAreaManagement.ts`

**Purpose**: Fetch and manage area data

**State:**
```typescript
- areas: Area[]
- directorAreasMap: Record<number, number[]>
```

**Methods:**
```typescript
- fetchAreas(): Promise<void>
```

**Logic:**
1. Fetch all areas from `area` table
2. Fetch director-area relationships from `directorio_areas` table
3. Build map of director ID to area IDs

### 4. `useBajaInfo.ts`

**Purpose**: Fetch deprecation audit information

**State:**
```typescript
- bajaInfo: BajaInfo | null
- loading: boolean
- error: string | null
```

**Logic:**
1. Only fetch when item is selected and not editing
2. Query `deprecated` table for matching record
3. Display creator, timestamp, and motive

## Component Designs

### 1. Header Component

**File**: `components/Header.tsx`

**Props:**
```typescript
interface HeaderProps {
  isDarkMode: boolean;
  realtimeConnected: boolean;
}
```

**Render:**
- Title: "Inventario ITEA - Bajas"
- Subtitle: "Consulta de bienes dados de baja del ITEA"
- `SectionRealtimeToggle` with section name "ITEA Obsoletos"

### 2. ValueStatsPanel Component

**File**: `components/ValueStatsPanel.tsx`

**Props:**
```typescript
interface ValueStatsPanelProps {
  filteredCount: number;
  totalValue: number;
  loading: boolean;
  isDarkMode: boolean;
}
```

**Features:**
- Two-column layout (desktop) / stacked (mobile)
- Left: Total value with `AnimatedCounter`
- Right: Item count with `AnimatedCounter`
- Animated background effects on hover
- Loading state with random number animation

### 3. InventoryTable Component

**File**: `components/InventoryTable.tsx`

**Props:**
```typescript
interface InventoryTableProps {
  muebles: MuebleITEA[];
  paginatedMuebles: MuebleITEA[];
  loading: boolean;
  error: string | null;
  selectedItem: MuebleITEA | null;
  sortField: keyof MuebleITEA;
  sortDirection: 'asc' | 'desc';
  isDarkMode: boolean;
  onSort: (field: keyof MuebleITEA) => void;
  onSelectItem: (item: MuebleITEA) => void;
  onRetry: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  syncingIds: string[];
}
```

**Columns:**
1. ID Inventario (sortable)
2. Descripción (sortable)
3. Área (sortable) - Display `item.area?.nombre`
4. Director/Jefe de Área (sortable) - Display `item.directorio?.nombre`
5. Fecha de Baja (sortable)

**States:**
- Loading: Skeleton with spinner
- Error: Error message with retry button
- Empty: No results message with clear filters option
- Data: Rendered table rows

### 4. DetailPanel Component

**File**: `components/DetailPanel.tsx`

**Props:**
```typescript
interface DetailPanelProps {
  selectedItem: MuebleITEA;
  detailRef: RefObject<HTMLDivElement>;
  isEditing: boolean;
  editFormData: MuebleITEA | null;
  imagePreview: string | null;
  uploading: boolean;
  filterOptions: FilterOptions;
  directorio: Directorio[];
  bajaInfo: BajaInfo | null;
  bajaInfoLoading: boolean;
  onClose: () => void;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFormChange: (e: ChangeEvent, field: keyof MuebleITEA) => void;
  onSelectDirector: (nombre: string) => void;
  onStartEdit: () => void;
  onSaveChanges: () => void;
  onCancelEdit: () => void;
  onReactivate: () => void;
  isDarkMode: boolean;
  isSyncing: boolean;
  saving: boolean;
}
```

**Sections:**
1. Header with close button
2. Image section (view/edit modes)
3. Form fields (all fields from MuebleITEA)
4. Baja information panel (view mode only)
5. Action buttons (Edit/Reactivate or Save/Cancel)

**Field Handling:**
- In edit mode: Use `editFormData`
- In view mode: Use `selectedItem`
- For area: Display `selectedItem.area?.nombre` or `editFormData.area?.nombre`
- For director: Display `selectedItem.directorio?.nombre` or `editFormData.directorio?.nombre`

### 5. Pagination Component

**File**: `components/Pagination.tsx`

**Props:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  isDarkMode: boolean;
}
```

**Features:**
- Page info display
- First/Previous/Next/Last buttons
- Page number buttons with ellipsis
- Rows per page selector (10, 25, 50, 100)

## Modal Designs

### 1. ReactivarModal

**File**: `modals/ReactivarModal.tsx`

**Props:**
```typescript
interface ReactivarModalProps {
  show: boolean;
  selectedItem: MuebleITEA | null;
  reactivating: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isDarkMode: boolean;
}
```

**Content:**
- Warning message
- Item details (ID, description)
- Confirm/Cancel buttons

### 2. DirectorModal

**File**: `modals/DirectorModal.tsx`

**Props:**
```typescript
interface DirectorModalProps {
  show: boolean;
  incompleteDirector: Directorio | null;
  directorFormData: { area: string };
  savingDirector: boolean;
  onAreaChange: (area: string) => void;
  onSave: () => void;
  onClose: () => void;
  isDarkMode: boolean;
}
```

**Purpose**: Assign area to director with no areas

### 3. AreaSelectionModal

**File**: `modals/AreaSelectionModal.tsx`

**Props:**
```typescript
interface AreaSelectionModalProps {
  show: boolean;
  areaOptions: string[];
  incompleteDirector: Directorio | null;
  isDarkMode: boolean;
  onSelectArea: (area: string) => void;
  onClose: () => void;
}
```

**Purpose**: Select area for director with multiple areas

## Utility Functions

### `utils.ts`

```typescript
/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDate(dateStr: string | null): string

/**
 * Truncate text to specified length
 */
export function truncateText(text: string | null, length: number): string

/**
 * Animated counter component
 */
export function AnimatedCounter(props: AnimatedCounterProps): JSX.Element

/**
 * Image preview component
 */
export function ImagePreview(props: ImagePreviewProps): JSX.Element
```

## Data Fetching Strategy

### Relational Query Pattern

```typescript
const { data, error } = await supabase
  .from('mueblesitea')
  .select(`
    *,
    area:id_area(id_area, nombre),
    directorio:id_directorio(id_directorio, nombre, puesto)
  `)
  .eq('estatus', 'BAJA')
  .order(sortField, { ascending: sortDirection === 'asc' })
  .range(start, end);
```

### Director Fetching Pattern

```typescript
// 1. Fetch directors
const { data: directoresData } = await supabase
  .from('directorio')
  .select('id_directorio, nombre');

// 2. Fetch areas
const { data: areasData } = await supabase
  .from('area')
  .select('id_area, nombre');

// 3. Fetch relationships
const { data: relacionesData } = await supabase
  .from('directorio_areas')
  .select('id_directorio, id_area');

// 4. Build director objects with areas
const directorio = directoresData.map(director => ({
  ...director,
  areas: areasData
    .filter(area => 
      relacionesData.some(rel => 
        rel.id_directorio === director.id_directorio && 
        rel.id_area === area.id_area
      )
    )
    .map(area => area.nombre)
}));
```

### Update Pattern (with Relational Fields)

```typescript
// When saving changes
const { error } = await supabase
  .from('mueblesitea')
  .update({
    ...editFormData,
    id_area: editFormData.id_area,  // Foreign key
    id_directorio: editFormData.id_directorio,  // Foreign key
    image_path: imagePath
  })
  .eq('id', editFormData.id);
```

## State Management

### Main Component State

```typescript
// Pagination
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);

// Sorting
const [sortField, setSortField] = useState<keyof MuebleITEA>('id_inv');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

// Messages
const [message, setMessage] = useState<Message | null>(null);
const [loading, setLoading] = useState(false);

// Filter options
const [filterOptions, setFilterOptions] = useState<FilterOptions>({
  estados: [],
  estatus: [],
  areas: [],
  rubros: [],
  formadq: [],
  directores: []
});
```

### Hook State (Extracted)

- `useItemEdit`: Selection, editing, image handling
- `useDirectorManagement`: Director CRUD, modals
- `useAreaManagement`: Area data
- `useBajaInfo`: Deprecation info
- `useSearchAndFilters`: Search term, filters, suggestions

## Styling Approach

### Theme Integration

```typescript
const { isDarkMode } = useTheme();

// Dark mode classes
const containerClass = isDarkMode 
  ? 'bg-black text-white' 
  : 'bg-white text-black';

const borderClass = isDarkMode 
  ? 'border-white/10' 
  : 'border-black/10';
```

### Animation Patterns

```typescript
// Framer Motion variants
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
```

### Responsive Design

- Mobile-first approach
- Grid layout for desktop (table + detail panel)
- Stacked layout for mobile
- Responsive padding and spacing

## Error Handling

### Patterns

1. **Data Fetching Errors**
   - Display error message in table
   - Provide retry button
   - Log to console

2. **Save Errors**
   - Show error message banner
   - Keep edit mode active
   - Create error notification

3. **Image Upload Errors**
   - Validate file size (max 5MB)
   - Validate file type (JPG, PNG, GIF, WebP)
   - Show error message

4. **Director Assignment Errors**
   - Show error message in modal
   - Keep modal open
   - Log to console

## Performance Optimizations

1. **useMemo for Sorting**
   ```typescript
   const sortedMuebles = useMemo(() => {
     // Sorting logic
   }, [filteredMueblesOmni, sortField, sortDirection]);
   ```

2. **useCallback for Event Handlers**
   ```typescript
   const handleSort = useCallback((field: keyof MuebleITEA) => {
     // Sort logic
   }, [sortField, sortDirection]);
   ```

3. **Pagination**
   - Only render current page items
   - Calculate total pages dynamically

4. **Image Loading**
   - Lazy load images
   - Show loading state
   - Cache signed URLs

## Testing Considerations

### Unit Tests (Future)
- Test utility functions (formatDate, truncateText)
- Test AnimatedCounter component
- Test custom hooks in isolation

### Integration Tests (Future)
- Test full component rendering
- Test data fetching and display
- Test edit and save flow
- Test director assignment flow

### Manual Testing Checklist
- [ ] Component renders without errors
- [ ] Data loads correctly with relational fields
- [ ] Search and filters work
- [ ] Pagination works
- [ ] Sorting works
- [ ] Item selection works
- [ ] Edit mode works
- [ ] Save changes works
- [ ] Image upload works
- [ ] Director selection works (all 3 scenarios)
- [ ] Reactivation works
- [ ] Baja info displays correctly
- [ ] Realtime updates work
- [ ] Dark mode works
- [ ] Responsive design works

## Migration Checklist

### Pre-Migration
- [ ] Review INEA obsoletos implementation
- [ ] Understand current ITEA obsoletos functionality
- [ ] Identify all dependencies
- [ ] Plan file structure

### During Migration
- [ ] Create directory structure
- [ ] Create types.ts
- [ ] Create utils.ts
- [ ] Create all hooks
- [ ] Create all components
- [ ] Create all modals
- [ ] Create main component
- [ ] Update page component import

### Post-Migration
- [ ] Test all functionality
- [ ] Verify no regressions
- [ ] Update documentation
- [ ] Remove old file
- [ ] Clean up unused imports

## Success Metrics

1. **Code Quality**
   - No TypeScript errors
   - No console errors
   - Consistent code style
   - Proper type safety

2. **Functionality**
   - All features work as before
   - New relational features work
   - No data loss
   - Proper error handling

3. **Performance**
   - Fast initial load
   - Smooth animations
   - Responsive interactions
   - Efficient re-renders

4. **Maintainability**
   - Clear component structure
   - Reusable hooks
   - Well-documented code
   - Easy to extend

## Notes

- Use `muebles.itea` storage bucket (not `muebles.inea`)
- Query `mueblesitea` table (not `mueblesinea`)
- Section name: "ITEA Obsoletos"
- All text should reference "ITEA"
- Maintain backward compatibility with `usufinal` field
- Ensure proper cleanup of old file after migration

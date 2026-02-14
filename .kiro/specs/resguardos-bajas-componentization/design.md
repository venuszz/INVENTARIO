# Resguardos Bajas - Componentization Design

## Architecture Overview

```
src/components/resguardos/consultarBajas/
├── index.tsx                    # Main orchestrator component
├── types.ts                     # TypeScript type definitions
├── utils.ts                     # Utility functions (if needed)
├── hooks/
│   ├── useBajasData.ts         # Data fetching, pagination, sorting
│   ├── useBajaDetails.ts       # Details of specific baja
│   ├── useSearchAndFilters.ts  # Search and filter logic
│   ├── useBajaDelete.ts        # Delete operations
│   ├── usePDFGeneration.ts     # PDF generation logic
│   └── useItemSelection.ts     # Item selection management
├── components/
│   ├── Header.tsx              # Page header with stats
│   ├── SearchAndFilters.tsx    # Search bar and advanced filters
│   ├── BajasTable.tsx          # Table of bajas (folios)
│   ├── Pagination.tsx          # Pagination controls
│   ├── BajaDetailsPanel.tsx    # Details panel (right side)
│   └── ArticulosListPanel.tsx  # List of articles grouped by folio_baja
└── modals/
    ├── DeleteFolioModal.tsx    # Confirm delete entire folio
    ├── DeleteSelectedModal.tsx # Confirm delete selected items
    ├── DeleteItemModal.tsx     # Confirm delete single item
    ├── PDFDownloadModal.tsx    # PDF download modal
    └── ErrorAlert.tsx          # Error alert component
```

## Type Definitions (types.ts)

```typescript
/**
 * Base interface for a resguardo baja item in the table
 */
export interface ResguardoBaja {
  id: number;
  folio_resguardo: string;
  folio_baja: string;
  f_resguardo: string;
  area_resguardo: string | null;
  dir_area: string;
  num_inventario: string;
  descripcion: string;
  rubro: string;
  condicion: string;
  usufinal: string | null;
  puesto: string;
  origen: string;
  selected?: boolean;
}

/**
 * Extended interface with articles for detail view
 */
export interface ResguardoBajaDetalle extends ResguardoBaja {
  articulos: Array<ResguardoBajaArticulo>;
}

/**
 * Individual article in a baja
 */
export interface ResguardoBajaArticulo {
  id: number;
  num_inventario: string;
  descripcion: string;
  rubro: string;
  condicion: string;
  origen: string;
  folio_baja: string;
  usufinal?: string | null;
  area_resguardo?: string | null;
}

/**
 * PDF data structure for baja reports
 */
export interface PdfDataBaja {
  folio_resguardo: string;
  folio_baja: string;
  fecha: string;
  director: string;
  area: string;
  puesto: string;
  resguardante: string;
  articulos: Array<{
    id_inv: string;
    descripcion: string;
    rubro: string;
    estado: string;
    origen?: string | null;
    folio_baja: string;
    resguardante: string;
  }>;
  firmas?: Array<{
    cargo: string;
    nombre: string;
    firma?: string;
    concepto: string;
    puesto: string;
  }>;
}

/**
 * Sort field options
 */
export type SortField = 'id' | 'folio_resguardo' | 'f_resguardo' | 'dir_area';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Delete operation type
 */
export type DeleteType = 'folio' | 'selected' | 'single';

/**
 * Item to delete data structure
 */
export interface ItemToDelete {
  folioResguardo?: string;
  folioBaja?: string;
  articulos?: ResguardoBajaArticulo[];
  singleArticulo?: ResguardoBajaArticulo;
}
```

## Custom Hooks

### 1. useBajasData.ts

**Purpose:** Manage bajas data fetching, pagination, and sorting

**State:**
```typescript
{
  bajas: ResguardoBaja[]
  allBajas: ResguardoBaja[]
  loading: boolean
  error: string | null
  currentPage: number
  rowsPerPage: number
  totalCount: number
  sortField: SortField
  sortDirection: SortDirection
}
```

**Methods:**
```typescript
{
  fetchBajas: () => Promise<void>
  setCurrentPage: (page: number) => void
  setRowsPerPage: (rows: number) => void
  setSort: (field: SortField) => void
  refetch: () => Promise<void>
}
```

**Computed:**
```typescript
{
  totalPages: number
  foliosUnicos: ResguardoBaja[]
}
```

**Implementation Notes:**
- Handles pagination logic with unique folios
- Manages sorting by multiple fields
- Applies filters from search hook
- Fetches all bajas for count calculations

---

### 2. useBajaDetails.ts

**Purpose:** Manage details of a specific baja (folio_resguardo)

**State:**
```typescript
{
  selectedBaja: ResguardoBajaDetalle | null
  groupedItems: { [folio_baja: string]: ResguardoBajaArticulo[] }
  loading: boolean
  error: string | null
}
```

**Methods:**
```typescript
{
  fetchBajaDetails: (folioResguardo: string) => Promise<void>
  clearSelection: () => void
  getArticuloCount: (folioResguardo: string) => number
}
```

**Implementation Notes:**
- Groups articles by folio_baja
- Handles URL parameter loading (?folio=XXX)
- Auto-scrolls to detail panel on mobile

---

### 3. useSearchAndFilters.ts

**Purpose:** Manage search term and advanced filters

**State:**
```typescript
{
  searchTerm: string
  filterDate: string
  filterDirector: string
  filterResguardante: string
}
```

**Methods:**
```typescript
{
  setSearchTerm: (term: string) => void
  setFilterDate: (date: string) => void
  setFilterDirector: (director: string) => void
  setFilterResguardante: (resguardante: string) => void
  resetSearch: () => void
  clearFilters: () => void
}
```

**Implementation Notes:**
- Debounced search (100ms)
- Combines search with filters
- Triggers data refetch on change

---

### 4. useBajaDelete.ts

**Purpose:** Handle all delete operations (folio, selected, single)

**State:**
```typescript
{
  deleting: boolean
  error: string | null
  pdfBajaData: PdfDataBaja | null
}
```

**Methods:**
```typescript
{
  deleteFolio: (folioResguardo: string) => Promise<void>
  deleteSelected: (articulos: ResguardoBajaArticulo[]) => Promise<void>
  deleteSingle: (articulo: ResguardoBajaArticulo) => Promise<void>
  clearPdfBajaData: () => void
}
```

**Implementation Notes:**
- Generates PDF data after deletion
- Handles notification creation (removed in current code)
- Triggers data refetch after successful deletion
- Clears selection after deletion

---

### 5. usePDFGeneration.ts

**Purpose:** Generate PDF reports for bajas

**State:**
```typescript
{
  pdfBajaData: PdfDataBaja | null
  generating: boolean
  error: string | null
}
```

**Methods:**
```typescript
{
  preparePDFData: (
    selectedBaja: ResguardoBajaDetalle,
    selectedItems: { [key: string]: boolean }
  ) => Promise<void>
  generatePDF: () => Promise<void>
  clearPDFData: () => void
}
```

**Implementation Notes:**
- Fetches firmas from database
- Handles selected items or full baja
- Integrates with generateBajaPDF utility

---

### 6. useItemSelection.ts

**Purpose:** Manage article selection (individual and group)

**State:**
```typescript
{
  selectedItems: { [articleId: string]: boolean }
}
```

**Methods:**
```typescript
{
  handleItemSelection: (articleId: number) => void
  handleGroupSelection: (folioBaja: string) => void
  clearSelections: () => void
  getSelectedItemsGroupedByFolio: () => Array<{
    folio_baja: string
    articulos: ResguardoBajaArticulo[]
  }>
}
```

**Computed:**
```typescript
{
  selectedCount: number
  hasSelection: boolean
}
```

**Implementation Notes:**
- Tracks selection by article ID
- Supports group selection by folio_baja
- Returns grouped selection for PDF generation

---

## UI Components

### 1. Header.tsx

**Props:**
```typescript
interface HeaderProps {
  totalCount: number
  realtimeConnected: boolean
}
```

**Responsibilities:**
- Display page title with "BAJ" badge
- Show total count of bajas
- Display realtime connection toggle

**Design Notes:**
- Red theme (bg-red-800, text-red-500)
- Responsive text sizes (text-xl sm:text-2xl md:text-3xl)
- Uses ListChecks icon for count

---

### 2. SearchAndFilters.tsx

**Props:**
```typescript
interface SearchAndFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  filterDate: string
  onFilterDateChange: (date: string) => void
  filterDirector: string
  onFilterDirectorChange: (director: string) => void
  filterResguardante: string
  onFilterResguardanteChange: (resguardante: string) => void
  onResetSearch: () => void
  onClearFilters: () => void
  onRefresh: () => void
  loading: boolean
}
```

**Responsibilities:**
- Search input with icon
- Advanced filters (date, director, resguardante)
- Clear and refresh buttons
- Responsive layout (grid-cols-1 md:grid-cols-3)

**Design Notes:**
- Gradient background (from-gray-900/50 to-red-900/10)
- Date input with max today
- Text inputs with uppercase transformation

---

### 3. BajasTable.tsx

**Props:**
```typescript
interface BajasTableProps {
  bajas: ResguardoBaja[]
  allBajas: ResguardoBaja[]
  selectedFolio: string | null
  onFolioClick: (folio: string) => void
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  loading: boolean
  error: string | null
  onRetry: () => void
  filterResguardante: string
}
```

**Responsibilities:**
- Display table of unique folios
- Sortable columns (folio_resguardo, f_resguardo, dir_area)
- Show article count per folio
- Highlight selected folio
- Show resguardantes tooltip on hover
- Loading and error states

**Design Notes:**
- Sticky header (sticky top-0 z-10)
- Color-coded article count badges
- Hover effects with transitions
- Responsive min-width (min-w-[800px])

---

### 4. Pagination.tsx

**Props:**
```typescript
interface PaginationProps {
  currentPage: number
  totalPages: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rows: number) => void
}
```

**Responsibilities:**
- Page navigation (prev/next)
- Rows per page selector (10, 25, 50, 100)
- Display current page info

**Design Notes:**
- Disabled state styling
- Rounded buttons with borders
- Responsive spacing

---

### 5. BajaDetailsPanel.tsx

**Props:**
```typescript
interface BajaDetailsPanelProps {
  selectedBaja: ResguardoBajaDetalle | null
  onGeneratePDF: () => void
  onDeleteFolio: () => void
  userRole: string | null
  selectedItemsCount: number
}
```

**Responsibilities:**
- Display folio details (folio, fecha, director, area, puesto)
- Show resguardantes with colored badges
- PDF generation button
- Delete folio button (admin only)
- Empty state when no selection

**Design Notes:**
- Gradient badges for resguardantes
- Icon-based labels (FileDigit, Calendar, Building2, User)
- Shadow and border effects
- Responsive layout

---

### 6. ArticulosListPanel.tsx

**Props:**
```typescript
interface ArticulosListPanelProps {
  selectedBaja: ResguardoBajaDetalle | null
  groupedItems: { [folio_baja: string]: ResguardoBajaArticulo[] }
  selectedItems: { [key: string]: boolean }
  onItemSelection: (articleId: number) => void
  onGroupSelection: (folioBaja: string) => void
  onClearSelections: () => void
  onDeleteSelected: () => void
  onDeleteSingle: (articulo: ResguardoBajaArticulo) => void
  userRole: string | null
}
```

**Responsibilities:**
- Display articles grouped by folio_baja
- Individual and group selection
- Clear selection button
- Delete selected button (admin only)
- Delete single item button (admin only)
- Sticky header with selection count
- Empty state

**Design Notes:**
- Grouped by folio_baja with headers
- Selected items have gradient background
- Origin badges (INEA/ITEA)
- Scrollable with max-height
- Backdrop blur for sticky header

---

## Modals

### 1. DeleteFolioModal.tsx

**Props:**
```typescript
interface DeleteFolioModalProps {
  show: boolean
  folioResguardo: string
  articulosCount: number
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}
```

**Design:**
- Red theme with warning icon
- Shows folio and article count
- Confirm/Cancel buttons
- Loading state during deletion

---

### 2. DeleteSelectedModal.tsx

**Props:**
```typescript
interface DeleteSelectedModalProps {
  show: boolean
  selectedCount: number
  articulos: ResguardoBajaArticulo[]
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}
```

**Design:**
- Shows count of selected items
- Lists selected article numbers
- Confirm/Cancel buttons

---

### 3. DeleteItemModal.tsx

**Props:**
```typescript
interface DeleteItemModalProps {
  show: boolean
  articulo: ResguardoBajaArticulo
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}
```

**Design:**
- Shows article details (num_inventario, descripcion)
- Confirm/Cancel buttons

---

### 4. PDFDownloadModal.tsx

**Props:**
```typescript
interface PDFDownloadModalProps {
  show: boolean
  pdfBajaData: PdfDataBaja | null
  onDownload: () => void
  onClose: () => void
  isGenerating: boolean
}
```

**Design:**
- Shows folio_baja
- Download button
- Close button
- Loading state during generation

---

### 5. ErrorAlert.tsx

**Props:**
```typescript
interface ErrorAlertProps {
  show: boolean
  message: string | null
  onClose: () => void
}
```

**Design:**
- Fixed bottom-right position
- Red theme with AlertCircle icon
- Auto-dismiss or manual close
- Backdrop blur effect

---

## Main Orchestrator (index.tsx)

**Structure:**
```typescript
export default function ConsultarBajasResguardos() {
  // External hooks
  const { isDarkMode } = useTheme()
  const userRole = useUserRole()
  const { realtimeConnected } = useResguardosBajasIndexation()
  const searchParams = useSearchParams()
  
  // Refs
  const detailRef = useRef<HTMLDivElement>(null)
  
  // Custom hooks
  const bajasData = useBajasData()
  const bajaDetails = useBajaDetails()
  const searchAndFilters = useSearchAndFilters()
  const bajaDelete = useBajaDelete()
  const pdfGeneration = usePDFGeneration()
  const itemSelection = useItemSelection()
  
  // Local UI state
  const [showDeleteFolioModal, setShowDeleteFolioModal] = useState(false)
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false)
  const [showDeleteItemModal, setShowDeleteItemModal] = useState<{
    articulo: ResguardoBajaArticulo
  } | null>(null)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [folioParamLoading, setFolioParamLoading] = useState(false)
  
  // Effects
  useEffect(() => {
    // Load folio from URL parameter
  }, [searchParams])
  
  useEffect(() => {
    // Fetch bajas on filter change
  }, [searchAndFilters])
  
  // Event handlers
  const handleFolioClick = useCallback((folio: string) => {
    bajaDetails.fetchBajaDetails(folio)
  }, [bajaDetails])
  
  const handleDeleteFolio = useCallback(async () => {
    await bajaDelete.deleteFolio(bajaDetails.selectedBaja!.folio_resguardo)
    setShowDeleteFolioModal(false)
    bajaDetails.clearSelection()
  }, [bajaDelete, bajaDetails])
  
  // ... more handlers
  
  return (
    <div>
      {/* Loading overlay for URL parameter */}
      {/* Header */}
      {/* Main container with grid layout */}
      {/* Left panel: Search, Filters, Table, Pagination */}
      {/* Right panel: Details, Articles List */}
      {/* Modals */}
      {/* Error Alert */}
    </div>
  )
}
```

**Responsibilities:**
- Coordinate all hooks
- Manage modal visibility
- Handle URL parameters
- Orchestrate event handlers
- Render layout and components

---

## Utility Functions (utils.ts)

```typescript
/**
 * Get background color class for article count badge
 */
export function getItemCountBgColor(count: number): string {
  switch (count) {
    case 0: return 'bg-gray-900/40 text-gray-400 border border-gray-800'
    case 1: return 'bg-red-900/20 text-red-300 border border-red-900'
    case 2:
    case 3:
    case 4: return 'bg-red-800/40 text-red-300 border border-red-800'
    case 5:
    case 6:
    case 7:
    case 8:
    case 9: return 'bg-red-800/60 text-red-200 border border-red-700'
    default: return 'bg-red-700/60 text-red-100 border border-red-600'
  }
}

/**
 * Format date from ISO to DD/MM/YYYY
 */
export function formatDate(isoDate: string): string {
  return isoDate.slice(0, 10).split('-').reverse().join('/')
}
```

---

## Integration Points

### External Dependencies
- `@/app/lib/supabase/client` - Database client
- `@/hooks/useUserRole` - User role management
- `@/hooks/useResguardosBajasIndexation` - Realtime indexation
- `@/context/ThemeContext` - Theme management
- `@/components/roleGuard` - Role-based rendering
- `@/components/SectionRealtimeToggle` - Realtime toggle
- `./BajaPDFReport` - PDF generation utility

### Supabase Queries
- `resguardos_bajas` table for all operations
- `firmas` table for PDF generation

### URL Parameters
- `?folio=XXX` - Auto-load specific baja details

---

## Design Patterns

### 1. Orchestrator Pattern
- Main component coordinates all hooks
- Minimal logic in orchestrator
- Delegates to specialized hooks

### 2. Custom Hooks Pattern
- Each hook has single responsibility
- Hooks return state and methods
- Hooks are composable and reusable

### 3. Presentational Components
- Components receive props only
- No business logic in components
- Focus on rendering and styling

### 4. Modal Management
- Boolean flags for modal visibility
- Data passed via props
- Callbacks for actions

---

## Styling Approach

### Theme Support
- All components support dark/light mode
- Use `isDarkMode` from ThemeContext
- Conditional classes based on theme

### Color Palette
- Primary: Red (red-500, red-600, red-800, red-900)
- Neutral: Gray (gray-50 to gray-900)
- Accent: Blue, Purple for badges

### Responsive Design
- Mobile-first approach
- Grid layout (lg:grid-cols-5)
- Responsive text sizes
- Scrollable panels with max-height

### Animations
- Transitions on hover
- Fade-in for modals
- Pulse for loading states
- Smooth scrolling

---

## Performance Considerations

### Memoization
- Use `useCallback` for event handlers
- Use `useMemo` for computed values
- Prevent unnecessary re-renders

### Debouncing
- Search input debounced (100ms)
- Filter changes debounced

### Pagination
- Limit data fetched per page
- Unique folios calculation optimized

### Lazy Loading
- Details loaded on demand
- PDF data prepared on request

---

## Error Handling

### Data Fetching Errors
- Display error in table
- Retry button available
- Error alert for critical errors

### Delete Operation Errors
- Show error alert
- Don't close modal on error
- Allow retry

### PDF Generation Errors
- Show error alert
- Keep modal open
- Allow retry

---

## Accessibility

### Keyboard Navigation
- Tab through interactive elements
- Enter to confirm actions
- Escape to close modals

### ARIA Labels
- Buttons have title attributes
- Icons have descriptive labels
- Modals have proper roles

### Screen Reader Support
- Semantic HTML elements
- Proper heading hierarchy
- Status messages announced

---

## Testing Strategy (Future)

### Unit Tests
- Test each hook independently
- Mock Supabase client
- Test utility functions

### Integration Tests
- Test hook interactions
- Test component rendering
- Test user flows

### E2E Tests
- Test complete workflows
- Test URL parameter loading
- Test PDF generation

---

## Migration Strategy

### Phase 1: Setup
1. Create folder structure
2. Create types.ts
3. Create utils.ts (if needed)

### Phase 2: Hooks
1. Extract useBajasData
2. Extract useBajaDetails
3. Extract useSearchAndFilters
4. Extract useBajaDelete
5. Extract usePDFGeneration
6. Extract useItemSelection

### Phase 3: Components
1. Extract Header
2. Extract SearchAndFilters
3. Extract BajasTable
4. Extract Pagination
5. Extract BajaDetailsPanel
6. Extract ArticulosListPanel

### Phase 4: Modals
1. Extract DeleteFolioModal
2. Extract DeleteSelectedModal
3. Extract DeleteItemModal
4. Extract PDFDownloadModal
5. Extract ErrorAlert

### Phase 5: Orchestrator
1. Create index.tsx
2. Integrate all hooks
3. Integrate all components
4. Integrate all modals
5. Test functionality

### Phase 6: Cleanup
1. Remove old consultarBajas.tsx
2. Update imports in page.tsx
3. Verify all functionality
4. Test in production

---

## Success Criteria

✅ All hooks extracted and working
✅ All components extracted and working
✅ All modals extracted and working
✅ Orchestrator integrates everything
✅ 100% functionality preserved
✅ 100% design preserved
✅ No TypeScript errors
✅ No runtime errors
✅ Code is more maintainable
✅ Code is more scalable

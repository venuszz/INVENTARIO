# INEA Obsoletos Componentization - Design

## 1. Architecture Overview

The refactored component will follow a modular architecture with clear separation of concerns:

```
src/components/consultas/inea/obsoletos/
├── components/
│   ├── Header.tsx
│   ├── ValueStatsPanel.tsx
│   ├── SearchBar.tsx
│   ├── FilterChips.tsx
│   ├── InventoryTable.tsx
│   ├── DetailPanel.tsx
│   ├── Pagination.tsx
│   ├── AnimatedCounter.tsx
│   └── TableSkeleton.tsx (optional)
├── modals/
│   ├── ReactivarModal.tsx
│   ├── DirectorModal.tsx
│   └── AreaSelectionModal.tsx
├── hooks/
│   ├── useObsoletosData.ts
│   ├── useItemEdit.ts
│   ├── useDirectorManagement.ts
│   ├── useAreaManagement.ts
│   └── useBajaInfo.ts
├── types.ts
├── utils.ts (if needed)
└── index.tsx (main component)
```

## 2. Component Specifications

### 2.1 Main Component (`index.tsx`)

**Purpose**: Orchestrate all sub-components and hooks

**State Management**:
- Pagination state (currentPage, rowsPerPage)
- Sorting state (sortField, sortDirection)
- Filter options state
- Modal visibility states
- Message state

**Hooks Used**:
- `useIneaObsoletosIndexation()` - Data and real-time updates
- `useObsoletosData()` - Data fetching logic
- `useItemEdit()` - Edit functionality
- `useDirectorManagement()` - Director operations
- `useAreaManagement()` - Area operations
- `useBajaInfo()` - Baja information fetching

**Responsibilities**:
- Render layout structure
- Coordinate data flow between components
- Handle modal state
- Manage URL parameters for direct item access

### 2.2 Header Component

**Props**:
```typescript
interface HeaderProps {
  isDarkMode: boolean;
  realtimeConnected: boolean;
  onReindex: () => Promise<void>;
}
```

**Features**:
- Display page title with INEA badge
- Show subtitle describing the view
- Include SectionRealtimeToggle component
- Responsive design

### 2.3 ValueStatsPanel Component

**Props**:
```typescript
interface ValueStatsPanelProps {
  totalValue: number;
  filteredCount: number;
  loading: boolean;
  isDarkMode: boolean;
}
```

**Features**:
- Display total value of obsolete items with AnimatedCounter
- Display count of obsolete items with AnimatedCounter
- Show loading state with random number animation
- Responsive grid layout
- Hover effects and transitions

### 2.4 AnimatedCounter Component

**Props**:
```typescript
interface AnimatedCounterProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  isInteger?: boolean;
}
```

**Features**:
- Smooth counting animation to target value
- Random number animation during loading
- Support for currency and integer formatting
- Configurable prefix/suffix

### 2.5 SearchBar Component

**Props**:
```typescript
interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isDarkMode: boolean;
}
```

**Features**:
- Text input with search icon
- Clear button when text is present
- Responsive width
- Focus states and transitions

### 2.6 FilterChips Component

**Props**:
```typescript
interface FilterChipsProps {
  filters: {
    estado: string;
    area: string;
    rubro: string;
  };
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
  isDarkMode: boolean;
}
```

**Features**:
- Display active filters as chips
- Remove individual filters
- Clear all filters button
- Animated appearance/disappearance

### 2.7 InventoryTable Component

**Props**:
```typescript
interface InventoryTableProps {
  muebles: Mueble[];
  paginatedMuebles: Mueble[];
  loading: boolean;
  error: string | null;
  selectedItem: Mueble | null;
  sortField: keyof Mueble;
  sortDirection: 'asc' | 'desc';
  isDarkMode: boolean;
  onSort: (field: keyof Mueble) => void;
  onSelectItem: (item: Mueble) => void;
  syncingIds: string[];
}
```

**Features**:
- Sortable columns
- Row selection with highlight
- Loading skeleton
- Error state
- Empty state
- Syncing indicator per row
- Responsive table with horizontal scroll

### 2.8 DetailPanel Component

**Props**:
```typescript
interface DetailPanelProps {
  selectedItem: Mueble;
  detailRef: React.RefObject<HTMLDivElement>;
  isEditing: boolean;
  editFormData: Mueble | null;
  imagePreview: string | null;
  uploading: boolean;
  filterOptions: FilterOptions;
  directorio: Directorio[];
  bajaInfo: BajaInfo | null;
  bajaInfoLoading: boolean;
  onClose: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, field: keyof Mueble) => void;
  onSelectDirector: (nombre: string) => void;
  isDarkMode: boolean;
  isSyncing: boolean;
}
```

**Features**:
- View mode with all item details
- Edit mode with form inputs
- Image preview and upload
- Baja information display (who, when, why)
- Director selection
- Sticky header with close button
- Scrollable content area
- Action buttons (Edit, Reactivar)

### 2.9 Pagination Component

**Props**:
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

**Features**:
- Page number buttons with ellipsis
- First/last page buttons
- Previous/next buttons
- Rows per page selector
- Record count display
- Disabled states

### 2.10 ReactivarModal Component

**Props**:
```typescript
interface ReactivarModalProps {
  show: boolean;
  selectedItem: Mueble | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDarkMode: boolean;
}
```

**Features**:
- Confirmation dialog for reactivation
- Display item details
- Warning message
- Confirm/cancel buttons
- Loading state during reactivation

### 2.11 DirectorModal Component

**Props**:
```typescript
interface DirectorModalProps {
  show: boolean;
  incompleteDirector: Directorio | null;
  directorFormData: { area: string };
  savingDirector: boolean;
  onAreaChange: (area: string) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
  isDarkMode: boolean;
}
```

**Features**:
- Form to add area to director
- Area input field
- Save/cancel buttons
- Loading state

### 2.12 AreaSelectionModal Component

**Props**:
```typescript
interface AreaSelectionModalProps {
  show: boolean;
  areaOptions: Area[];
  incompleteDirector: Directorio | null;
  isDarkMode: boolean;
  onSelectArea: (area: Area) => void;
  onClose: () => void;
}
```

**Features**:
- List of areas for selection
- Clickable area cards
- Close button

## 3. Custom Hooks Design

### 3.1 useObsoletosData

**Purpose**: Manage data fetching and filtering

**Returns**:
```typescript
{
  muebles: Mueble[];
  loading: boolean;
  error: string | null;
  filteredCount: number;
  totalValue: number;
  fetchMuebles: () => Promise<void>;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}
```

**Responsibilities**:
- Fetch obsolete items from indexation
- Apply filters and search
- Calculate total value
- Handle loading and error states

### 3.2 useItemEdit

**Purpose**: Handle item editing and reactivation

**Returns**:
```typescript
{
  selectedItem: Mueble | null;
  isEditing: boolean;
  editFormData: Mueble | null;
  imagePreview: string | null;
  uploading: boolean;
  showReactivarModal: boolean;
  handleSelectItem: (item: Mueble) => void;
  handleStartEdit: () => void;
  cancelEdit: () => void;
  closeDetail: () => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveChanges: () => Promise<void>;
  handleEditFormChange: (e: ChangeEvent, field: keyof Mueble) => void;
  markForReactivation: () => void;
  confirmReactivation: () => Promise<void>;
  setShowReactivarModal: (show: boolean) => void;
}
```

**Responsibilities**:
- Manage selected item state
- Handle edit mode toggle
- Process form changes
- Upload images
- Save changes to database
- Reactivate items

### 3.3 useDirectorManagement

**Purpose**: Manage director data and operations

**Returns**:
```typescript
{
  directorio: Directorio[];
  fetchDirectorio: () => Promise<void>;
  handleSelectDirector: (nombre: string) => void;
  saveDirectorInfo: (director: Directorio, area: string) => Promise<void>;
}
```

**Responsibilities**:
- Fetch director list
- Handle director selection
- Save director-area relationships

### 3.4 useAreaManagement

**Purpose**: Manage area data

**Returns**:
```typescript
{
  areas: Area[];
  directorAreasMap: Record<number, number[]>;
  fetchAreas: () => Promise<void>;
}
```

**Responsibilities**:
- Fetch area list
- Maintain director-area mapping

### 3.5 useBajaInfo

**Purpose**: Fetch deprecation information for selected item

**Returns**:
```typescript
{
  bajaInfo: BajaInfo | null;
  loading: boolean;
  error: string | null;
}
```

**Responsibilities**:
- Fetch baja record (who created, when, motive)
- Handle loading and error states
- Reset when item changes

## 4. Data Flow

```
useIneaObsoletosIndexation (store)
    ↓
useObsoletosData (filtering, search)
    ↓
Main Component (orchestration)
    ↓
├── Header
├── ValueStatsPanel
├── SearchBar
├── FilterChips
├── InventoryTable
│   └── TableSkeleton (loading)
├── DetailPanel
│   ├── ImagePreview
│   └── useBajaInfo
└── Pagination

Modals (triggered by user actions):
├── ReactivarModal
├── DirectorModal
└── AreaSelectionModal
```

## 5. Styling Approach

### 5.1 Design Tokens
- Use consistent spacing (p-4, p-6, gap-4, gap-6)
- Border radius: rounded-lg, rounded-xl
- Borders: border-white/10 (dark), border-black/10 (light)
- Backgrounds: bg-white/5 (dark), bg-black/5 (light)
- Transitions: transition-all duration-300

### 5.2 Animations
- Use framer-motion for:
  - Page entrance (opacity + y offset)
  - Component mounting/unmounting
  - Button interactions (whileHover, whileTap)
  - Modal overlays
- Use CSS transitions for:
  - Hover states
  - Color changes
  - Border changes

### 5.3 Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Stack layouts on mobile
- Side-by-side on desktop

## 6. Performance Optimizations

- Use React.memo for expensive components
- Use useMemo for filtered/sorted data
- Use useCallback for event handlers passed to children
- Virtualize table rows if dataset is very large (future enhancement)
- Lazy load images in table
- Debounce search input

## 7. Error Handling

- Display user-friendly error messages
- Provide retry mechanisms
- Log errors to console for debugging
- Show loading states during async operations
- Handle network failures gracefully

## 8. Testing Strategy

- Unit tests for custom hooks
- Component tests for UI components
- Integration tests for main component
- E2E tests for critical user flows

## 9. Migration Path

1. Create new folder structure
2. Extract types to types.ts
3. Create utility functions in utils.ts
4. Build custom hooks one by one
5. Build UI components one by one
6. Build modals one by one
7. Refactor main component to use new structure
8. Update page component to use new main component
9. Test thoroughly
10. Remove old component file

## 10. Rollback Plan

- Keep old component file as backup
- Use feature flag to toggle between old and new
- Monitor for errors in production
- Quick rollback if issues arise

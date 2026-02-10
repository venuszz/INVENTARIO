# No Listado Componentization - Design

## Architecture Overview

The refactoring will follow the established pattern used in `resguardos/crear` and `levantamiento` components, creating a modular structure with clear separation of concerns.

### Directory Structure

```
src/components/consultas/no-listado/
├── index.tsx                          # Main orchestrator component
├── types.ts                           # TypeScript interfaces and types
├── utils.ts                           # Utility functions
├── components/
│   ├── Header.tsx                     # Page header with title and realtime toggle
│   ├── ValueStatsPanel.tsx            # Total value and count display
│   ├── SearchBar.tsx                  # Omnibox search with suggestions
│   ├── FilterChips.tsx                # Active filter chips display
│   ├── ActionButtons.tsx              # Refresh and other action buttons
│   ├── InventoryTable.tsx             # Main data table
│   ├── TableSkeleton.tsx              # Loading skeleton for table
│   ├── Pagination.tsx                 # Pagination controls
│   ├── DetailPanel.tsx                # Item detail view/edit panel
│   ├── ImagePreview.tsx               # Image preview component
│   └── SuggestionDropdown.tsx         # Search suggestions dropdown
├── modals/
│   ├── DirectorModal.tsx              # Director info completion modal
│   ├── AreaSelectionModal.tsx         # Area selection for directors
│   ├── BajaModal.tsx                  # Baja confirmation modal
│   └── InactiveModal.tsx              # Inactive confirmation modal
└── hooks/
    ├── useSearchAndFilters.ts         # Search and filter logic
    ├── useDirectorManagement.ts       # Director CRUD operations
    ├── useItemEdit.ts                 # Item editing logic
    ├── useAreaManagement.ts           # Area management logic
    └── useResguardoData.ts            # Resguardo data fetching
```

## Component Specifications

### 1. Main Component (`index.tsx`)

**Purpose:** Orchestrate child components and manage high-level state

**Responsibilities:**
- Import and compose all child components
- Manage global state (selectedItem, isEditing, modals visibility)
- Handle URL parameter detection
- Provide context to child components via props

**State:**
- `selectedItem: Mueble | null`
- `isEditing: boolean`
- `editFormData: Mueble | null`
- `showDirectorModal: boolean`
- `showAreaSelectModal: boolean`
- `showBajaModal: boolean`
- `showInactiveModal: boolean`
- `message: Message | null`

**Props:** None (root component)

**Estimated Lines:** ~250

---

### 2. Types File (`types.ts`)

**Purpose:** Centralize all TypeScript interfaces

**Exports:**
```typescript
export interface Mueble { ... }
export interface FilterOptions { ... }
export interface Area { ... }
export interface Directorio { ... }
export interface DirectorioArea { ... }
export interface Message { ... }
export interface ActiveFilter { ... }
export interface ResguardoDetalle { ... }
```

---

### 3. Utils File (`utils.ts`)

**Purpose:** Centralize utility functions

**Functions:**
```typescript
export function stringToHslColor(str: string, s?: number, l?: number): string
export function getStatusBadgeColors(status: string | null | undefined): BadgeColors
export function formatDate(dateStr: string | null): string
export function truncateText(text: string | null, length?: number): string
export function getTypeIcon(type: ActiveFilter['type']): JSX.Element | null
export function getTypeLabel(type: ActiveFilter['type']): string
```

---

### 4. Components

#### 4.1 Header Component

**File:** `components/Header.tsx`

**Purpose:** Display page header with title, description, and realtime toggle

**Props:**
```typescript
interface HeaderProps {
  isDarkMode: boolean;
  realtimeConnected: boolean;
}
```

**Features:**
- Archive icon
- Title and description
- SectionRealtimeToggle integration

---

#### 4.2 ValueStatsPanel Component

**File:** `components/ValueStatsPanel.tsx`

**Purpose:** Display total value and item count

**Props:**
```typescript
interface ValueStatsPanelProps {
  filteredValue: number;
  allValue: number;
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  isDarkMode: boolean;
}
```

**Features:**
- Animated value display
- Conditional messaging based on filters
- Hover effects

---

#### 4.3 SearchBar Component

**File:** `components/SearchBar.tsx`

**Purpose:** Omnibox search input with type detection

**Props:**
```typescript
interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchMatchType: ActiveFilter['type'];
  showSuggestions: boolean;
  suggestions: { value: string; type: ActiveFilter['type'] }[];
  highlightedIndex: number;
  onSuggestionClick: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  onSaveFilter: () => void;
  isDarkMode: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}
```

---

#### 4.4 FilterChips Component

**File:** `components/FilterChips.tsx`

**Purpose:** Display active filter chips with remove functionality

**Props:**
```typescript
interface FilterChipsProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (index: number) => void;
  onClearAll: () => void;
  isDarkMode: boolean;
}
```

---

#### 4.5 ActionButtons Component

**File:** `components/ActionButtons.tsx`

**Purpose:** Action buttons (refresh, etc.)

**Props:**
```typescript
interface ActionButtonsProps {
  onRefresh: () => void;
  isDarkMode: boolean;
}
```

---

#### 4.6 InventoryTable Component

**File:** `components/InventoryTable.tsx`

**Purpose:** Display paginated inventory data table

**Props:**
```typescript
interface InventoryTableProps {
  items: Mueble[];
  loading: boolean;
  error: string | null;
  selectedItemId: string | null;
  sortField: keyof Mueble;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Mueble) => void;
  onSelectItem: (item: Mueble) => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  hasFilters: boolean;
  foliosResguardo: { [id_inv: string]: string | null };
  isDarkMode: boolean;
}
```

---

#### 4.7 TableSkeleton Component

**File:** `components/TableSkeleton.tsx`

**Purpose:** Loading skeleton for table

**Props:**
```typescript
interface TableSkeletonProps {
  isDarkMode: boolean;
}
```

---

#### 4.8 Pagination Component

**File:** `components/Pagination.tsx`

**Purpose:** Pagination controls

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

---

#### 4.9 DetailPanel Component

**File:** `components/DetailPanel.tsx`

**Purpose:** Display and edit item details

**Props:**
```typescript
interface DetailPanelProps {
  item: Mueble | null;
  isEditing: boolean;
  editFormData: Mueble | null;
  imageFile: File | null;
  imagePreview: string | null;
  uploading: boolean;
  userRole: string | null;
  directorio: Directorio[];
  filterOptions: FilterOptions;
  foliosResguardo: { [id_inv: string]: string | null };
  resguardoDetalles: { [folio: string]: ResguardoDetalle };
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveChanges: () => void;
  onClose: () => void;
  onMarkAsBaja: () => void;
  onMarkAsInactive: () => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, field: keyof Mueble) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectDirector: (idDirectorio: number) => void;
  isDarkMode: boolean;
  detailRef: React.RefObject<HTMLDivElement>;
}
```

---

#### 4.10 ImagePreview Component

**File:** `components/ImagePreview.tsx`

**Purpose:** Display image with loading states

**Props:**
```typescript
interface ImagePreviewProps {
  imagePath: string | null;
}
```

---

#### 4.11 SuggestionDropdown Component

**File:** `components/SuggestionDropdown.tsx`

**Purpose:** Display search suggestions dropdown

**Props:**
```typescript
interface SuggestionDropdownProps {
  show: boolean;
  suggestions: { value: string; type: ActiveFilter['type'] }[];
  highlightedIndex: number;
  onSelect: (index: number) => void;
  isDarkMode: boolean;
}
```

---

### 5. Modals

#### 5.1 DirectorModal

**File:** `modals/DirectorModal.tsx`

**Purpose:** Complete missing director information

**Props:**
```typescript
interface DirectorModalProps {
  show: boolean;
  director: Directorio | null;
  formData: { area: string };
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (field: string, value: string) => void;
  isDarkMode: boolean;
}
```

---

#### 5.2 AreaSelectionModal

**File:** `modals/AreaSelectionModal.tsx`

**Purpose:** Select area when director has multiple areas

**Props:**
```typescript
interface AreaSelectionModalProps {
  show: boolean;
  areas: Area[];
  selectedArea: Area | null;
  onSelect: (area: Area) => void;
  onClose: () => void;
  isDarkMode: boolean;
}
```

---

#### 5.3 BajaModal

**File:** `modals/BajaModal.tsx`

**Purpose:** Confirm baja with cause input

**Props:**
```typescript
interface BajaModalProps {
  show: boolean;
  cause: string;
  onCauseChange: (cause: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}
```

---

#### 5.4 InactiveModal

**File:** `modals/InactiveModal.tsx`

**Purpose:** Confirm marking as inactive

**Props:**
```typescript
interface InactiveModalProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}
```

---

### 6. Custom Hooks

#### 6.1 useSearchAndFilters

**File:** `hooks/useSearchAndFilters.ts`

**Purpose:** Manage search, filters, and suggestions

**Returns:**
```typescript
{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchMatchType: ActiveFilter['type'];
  activeFilters: ActiveFilter[];
  suggestions: { value: string; type: ActiveFilter['type'] }[];
  highlightedIndex: number;
  showSuggestions: boolean;
  saveCurrentFilter: () => void;
  removeFilter: (index: number) => void;
  clearAllFilters: () => void;
  handleInputKeyDown: (e: React.KeyboardEvent) => void;
  handleInputBlur: () => void;
  handleSuggestionClick: (index: number) => void;
  filteredMuebles: Mueble[];
}
```

---

#### 6.2 useDirectorManagement

**File:** `hooks/useDirectorManagement.ts`

**Purpose:** Manage director operations

**Returns:**
```typescript
{
  directorio: Directorio[];
  showDirectorModal: boolean;
  incompleteDirector: Directorio | null;
  directorFormData: { area: string };
  savingDirector: boolean;
  handleSelectDirector: (idDirectorio: number) => void;
  saveDirectorInfo: () => Promise<void>;
  setShowDirectorModal: (show: boolean) => void;
  setDirectorFormData: (data: { area: string }) => void;
}
```

---

#### 6.3 useItemEdit

**File:** `hooks/useItemEdit.ts`

**Purpose:** Manage item editing operations

**Returns:**
```typescript
{
  isEditing: boolean;
  editFormData: Mueble | null;
  imageFile: File | null;
  imagePreview: string | null;
  uploading: boolean;
  handleStartEdit: () => void;
  cancelEdit: () => void;
  saveChanges: () => Promise<void>;
  handleEditFormChange: (e: ChangeEvent, field: keyof Mueble) => void;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  markAsBaja: () => void;
  markAsInactive: () => void;
}
```

---

#### 6.4 useAreaManagement

**File:** `hooks/useAreaManagement.ts`

**Purpose:** Manage area operations

**Returns:**
```typescript
{
  areas: Area[];
  directorAreasMap: { [id_directorio: number]: number[] };
  showAreaSelectModal: boolean;
  areaOptionsForDirector: Area[];
  selectedAreaForDirector: Area | null;
  setShowAreaSelectModal: (show: boolean) => void;
  setSelectedAreaForDirector: (area: Area | null) => void;
  validateDirectorAreaRelation: (idDirectorio: number, idArea: number) => Promise<boolean>;
}
```

---

#### 6.5 useResguardoData

**File:** `hooks/useResguardoData.ts`

**Purpose:** Fetch and manage resguardo data

**Returns:**
```typescript
{
  foliosResguardo: { [id_inv: string]: string | null };
  resguardoDetalles: { [folio: string]: ResguardoDetalle };
}
```

---

## Data Flow

```
index.tsx (Main Orchestrator)
    ├── useNoListadoIndexation() → muebles data
    ├── useSearchAndFilters() → filtered data
    ├── useDirectorManagement() → director operations
    ├── useItemEdit() → edit operations
    ├── useAreaManagement() → area operations
    └── useResguardoData() → resguardo data
    
    ↓ Props Flow
    
    ├── Header
    ├── ValueStatsPanel
    ├── SearchBar + FilterChips + ActionButtons
    ├── InventoryTable
    │   └── TableSkeleton (conditional)
    ├── Pagination
    ├── DetailPanel (conditional)
    │   └── ImagePreview
    └── Modals (conditional)
        ├── DirectorModal
        ├── AreaSelectionModal
        ├── BajaModal
        └── InactiveModal
```

## Migration Strategy

### Phase 1: Setup
1. Create directory structure
2. Create `types.ts` with all interfaces
3. Create `utils.ts` with utility functions

### Phase 2: Extract Components (UI)
1. Extract `ImagePreview` (standalone, no dependencies)
2. Extract `TableSkeleton` (simple, minimal props)
3. Extract `Header` (simple, minimal props)
4. Extract `ValueStatsPanel`
5. Extract `FilterChips`
6. Extract `ActionButtons`
7. Extract `SuggestionDropdown`
8. Extract `SearchBar`
9. Extract `Pagination`
10. Extract `InventoryTable`
11. Extract `DetailPanel` (complex, many props)

### Phase 3: Extract Modals
1. Extract `InactiveModal` (simplest)
2. Extract `BajaModal`
3. Extract `AreaSelectionModal`
4. Extract `DirectorModal`

### Phase 4: Extract Hooks
1. Extract `useResguardoData` (standalone)
2. Extract `useAreaManagement`
3. Extract `useDirectorManagement`
4. Extract `useSearchAndFilters`
5. Extract `useItemEdit`

### Phase 5: Refactor Main Component
1. Import all components and hooks
2. Replace inline JSX with component calls
3. Remove extracted code
4. Test functionality

### Phase 6: Testing & Validation
1. Verify all functionality works
2. Check dark mode
3. Check responsive behavior
4. Verify URL parameters
5. Verify realtime updates
6. Verify notifications

## Correctness Properties

### Property 1: Component Isolation
**Description:** Each component should be independently testable and reusable
**Validation:** Each component file can be imported and rendered in isolation without errors

### Property 2: Type Safety
**Description:** All components maintain strict TypeScript typing
**Validation:** `npm run build` completes without TypeScript errors

### Property 3: Functional Equivalence
**Description:** Refactored code produces identical output to original
**Validation:** All user interactions produce the same results as before refactoring

### Property 4: State Consistency
**Description:** State updates propagate correctly through component tree
**Validation:** Editing an item updates both the table and detail panel correctly

### Property 5: No Prop Drilling Beyond 2 Levels
**Description:** Props should not be passed through more than 2 component levels
**Validation:** Manual code review of prop passing patterns

## Risk Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation:** 
- Incremental refactoring with testing after each phase
- Keep original file as backup until completion
- Manual testing of all features after each component extraction

### Risk 2: Type Errors
**Mitigation:**
- Define all types in `types.ts` first
- Use TypeScript strict mode
- Run `tsc --noEmit` frequently

### Risk 3: State Management Issues
**Mitigation:**
- Carefully track state dependencies
- Use React DevTools to verify state updates
- Test all state-changing operations

### Risk 4: Performance Regression
**Mitigation:**
- Maintain existing memoization patterns
- Use React.memo for pure components
- Profile before and after refactoring

## Success Criteria

1. ✅ Main component under 300 lines
2. ✅ At least 15 component files created
3. ✅ At least 5 custom hooks created
4. ✅ Zero TypeScript errors
5. ✅ All existing functionality works identically
6. ✅ All styling preserved
7. ✅ Dark mode works correctly
8. ✅ Responsive behavior maintained
9. ✅ URL parameters work correctly
10. ✅ Realtime updates work correctly

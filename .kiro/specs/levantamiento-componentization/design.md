# Design Document: Levantamiento Component Refactoring

## Overview

This design document outlines the refactoring of the monolithic `levantamiento.tsx` component (~1,735 lines) into a well-organized, maintainable component structure. The refactoring follows the established pattern in the codebase (similar to `src/components/inventario/registro/`) and maintains all existing functionality while improving code organization, reusability, and testability.

The refactored structure will separate concerns into:
- **Custom hooks** for data management and business logic
- **Presentational components** for UI rendering
- **Modal components** for dialog interactions
- **Type definitions** for type safety

## Architecture

### Directory Structure

```
src/components/consultas/levantamiento/
├── index.tsx                          # Main orchestrator component
├── types.ts                           # TypeScript interfaces and types
├── hooks/
│   ├── useUnifiedInventory.ts        # Data aggregation from 3 sources
│   ├── useSearchAndFilters.ts        # Search, filters, suggestions logic
│   └── useDirectorManagement.ts      # Director data CRUD operations
├── components/
│   ├── SearchBar.tsx                 # Omnibox search with autocomplete
│   ├── FilterChips.tsx               # Active filters display
│   ├── InventoryTable.tsx            # Data table with sorting
│   ├── Pagination.tsx                # Pagination controls
│   ├── ExportButtons.tsx             # Excel/PDF export buttons
│   └── LoadingStates.tsx             # Loading, error, empty states
└── modals/
    ├── ExportModal.tsx               # Export confirmation modal
    ├── CustomPDFModal.tsx            # Area/Director PDF modal
    └── DirectorDataModal.tsx         # Director info completion modal
```

### Component Hierarchy

```
LevantamientoUnificado (index.tsx)
├── SectionRealtimeToggle (existing)
├── SearchBar
│   └── SuggestionDropdown (internal)
├── FilterChips
├── ExportButtons
├── LoadingStates
├── InventoryTable
├── Pagination
├── ExportModal
├── CustomPDFModal
└── DirectorDataModal
```

### Data Flow

1. **Indexation Contexts** → `useUnifiedInventory` → Unified data array
2. **User Input** → `useSearchAndFilters` → Filtered & sorted data
3. **Filtered Data** → `InventoryTable` → Paginated display
4. **User Actions** → Event handlers → State updates → Re-render

## Components and Interfaces

### Main Orchestrator Component (index.tsx)

**Purpose:** Coordinates all sub-components and manages top-level state.

**Responsibilities:**
- Initialize all custom hooks
- Manage modal visibility states
- Handle export operations
- Coordinate data flow between components
- Provide theme context to children

**Props:** None (top-level component)

**State:**
- `showExportModal: boolean`
- `showAreaPDFModal: boolean`
- `showDirectorDataModal: boolean`
- `exportType: 'excel' | 'pdf' | null`
- `message: Message | null`

### Custom Hooks

#### useUnifiedInventory

**Purpose:** Aggregate and manage data from three indexation sources.

**Parameters:** None

**Returns:**
```typescript
{
  muebles: LevMueble[];           // Combined data from all sources
  loading: boolean;                // True if any source is loading
  error: string | null;            // Error from any source
  realtimeConnected: boolean;      // True if any source is connected
  reindex: () => Promise<void>;    // Reindex all sources
}
```

**Implementation Details:**
- Uses `useIneaIndexation()`, `useIteaIndexation()`, `useNoListadoIndexation()`
- Combines data with `useMemo` to prevent unnecessary recalculations
- Maps each item to include `origen: 'INEA' | 'ITEA' | 'TLAXCALA'`
- Aggregates loading states with OR logic
- Aggregates connection states with OR logic

#### useSearchAndFilters

**Purpose:** Manage search term, active filters, suggestions, and data filtering.

**Parameters:**
```typescript
{
  muebles: LevMueble[];
  sortField: keyof LevMueble;
  sortDirection: 'asc' | 'desc';
}
```

**Returns:**
```typescript
{
  searchTerm: string;
  deferredSearchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilters: ActiveFilter[];
  setActiveFilters: Dispatch<SetStateAction<ActiveFilter[]>>;
  removeFilter: (index: number) => void;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  filteredMuebles: LevMueble[];
  searchMatchType: SearchMatchType | null;
  isCustomPDFEnabled: boolean;
}
```

**Implementation Details:**
- Uses `useDeferredValue` for search term to prevent UI blocking
- Pre-calculates searchable vectors with `useMemo`
- Generates suggestions based on partial matches across all fields
- Filters data based on active filters and search term
- Sorts filtered data based on sort field and direction
- Determines if custom PDF export is enabled based on active filters

#### useDirectorManagement

**Purpose:** Handle director data fetching, validation, and updates.

**Parameters:**
```typescript
{
  isAdmin: boolean;
}
```

**Returns:**
```typescript
{
  directorOptions: DirectorioOption[];
  fetchDirectorFromDirectorio: (area: string) => Promise<void>;
  saveDirectorData: (director: DirectorioOption) => Promise<void>;
  loading: boolean;
  error: string | null;
}
```

**Implementation Details:**
- Fetches directors from `directorio` table
- Validates director completeness (nombre, puesto, area)
- Updates director records in Supabase
- Provides fuzzy matching for director names

### Presentational Components

#### SearchBar

**Purpose:** Render the omnibox search input with autocomplete dropdown.

**Props:**
```typescript
{
  searchTerm: string;
  onSearchChange: (term: string) => void;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  highlightedIndex: number;
  onSuggestionSelect: (suggestion: Suggestion) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  isDarkMode: boolean;
}
```

**Features:**
- Floating dropdown positioned relative to input
- Keyboard navigation (Arrow keys, Enter, Escape)
- Visual highlighting of selected suggestion
- Type indicators for each suggestion
- Responsive design

#### FilterChips

**Purpose:** Display active filters as removable chips/tags.

**Props:**
```typescript
{
  activeFilters: ActiveFilter[];
  onRemoveFilter: (index: number) => void;
  isDarkMode: boolean;
}
```

**Features:**
- Color-coded by filter type
- Hover effects
- Remove button with X icon
- Responsive wrapping

#### InventoryTable

**Purpose:** Render the data table with sortable columns.

**Props:**
```typescript
{
  muebles: LevMueble[];
  sortField: keyof LevMueble;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof LevMueble) => void;
  foliosResguardo: Record<string, string>;
  onFolioClick: (folio: string) => void;
  isDarkMode: boolean;
}
```

**Features:**
- Sortable column headers with icons
- Origin badges (INEA, ITEA, TLAXCALA)
- Resguardo badges with click handlers
- Status badges with color coding
- Truncated text with tooltips
- Sticky header

#### Pagination

**Purpose:** Handle page navigation and rows-per-page selection.

**Props:**
```typescript
{
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
- First/Previous/Next/Last buttons
- Numbered page buttons with ellipsis
- Rows-per-page selector
- Record count display
- Disabled state for boundary pages

#### ExportButtons

**Purpose:** Render Excel and PDF export buttons.

**Props:**
```typescript
{
  onExcelClick: () => void;
  onPDFClick: () => void;
  onRefreshClick: () => void;
  isCustomPDFEnabled: boolean;
  loading: boolean;
  isDarkMode: boolean;
}
```

**Features:**
- Animated icons on hover
- Loading state with spinner
- Custom PDF indicator badge
- Refresh button with rotation animation

#### LoadingStates

**Purpose:** Render loading, error, and empty state UI.

**Props:**
```typescript
{
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  onRetry: () => void;
  isDarkMode: boolean;
}
```

**Features:**
- Animated spinner for loading
- Error message with retry button
- Empty state with search icon
- Consistent styling across states

### Modal Components

#### ExportModal

**Purpose:** Confirm standard Excel/PDF export.

**Props:**
```typescript
{
  show: boolean;
  exportType: 'excel' | 'pdf' | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  isDarkMode: boolean;
}
```

**Features:**
- File preview with icon
- Estimated filename display
- Confirm/Cancel buttons
- Loading state during export

#### CustomPDFModal

**Purpose:** Configure and export PDF by area and director.

**Props:**
```typescript
{
  show: boolean;
  area: string;
  director: string;
  directorOptions: DirectorioOption[];
  onConfirm: (directorData: { nombre: string; puesto: string }) => void;
  onCancel: () => void;
  onDirectorSelect: (director: DirectorioOption) => void;
  loading: boolean;
  error: string | null;
  recordCount: number;
  isDarkMode: boolean;
}
```

**Features:**
- Pre-populated area field (read-only)
- Searchable director list
- Suggested director highlighting
- Record count badge
- Validation before export

#### DirectorDataModal

**Purpose:** Complete missing director information (admin only).

**Props:**
```typescript
{
  show: boolean;
  director: DirectorioOption | null;
  onSave: (director: DirectorioOption) => void;
  onCancel: () => void;
  loading: boolean;
  isDarkMode: boolean;
}
```

**Features:**
- Nombre input (uppercase)
- Puesto input (uppercase)
- Validation (both fields required)
- Save/Cancel buttons
- Admin-only access

## Data Models

### Core Types

```typescript
interface LevMueble {
  id: number;
  id_inv: string;
  rubro: string | null;
  descripcion: string | null;
  valor: number | string | null;
  f_adq: string | null;
  formadq: string | null;
  proveedor: string | null;
  factura: string | null;
  ubicacion_es: string | null;
  ubicacion_mu: string | null;
  ubicacion_no: string | null;
  estado: string | null;
  estatus: string | null;
  area: string | null;
  usufinal: string | null;
  fechabaja: string | null;
  causadebaja: string | null;
  resguardante: string | null;
  image_path: string | null;
  origen: 'INEA' | 'ITEA' | 'TLAXCALA';
}

interface ActiveFilter {
  term: string;
  type: 'id' | 'descripcion' | 'area' | 'usufinal' | 'resguardante' | 'rubro' | 'estado' | 'estatus' | null;
}

interface Suggestion {
  value: string;
  type: ActiveFilter['type'];
}

type SearchMatchType = 'id' | 'descripcion' | 'usufinal' | 'area' | 'resguardante' | 'rubro' | 'estado' | 'estatus' | null;

interface DirectorioOption {
  id_directorio: number;
  nombre: string;
  puesto: string;
  area: string;
}

interface Message {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}
```

### Utility Functions

```typescript
// Clean text for comparison (remove accents, lowercase, trim)
function clean(str: string): string;

// Get color classes for origen badges
function getOrigenColors(isDarkMode: boolean): Record<string, string>;

// Get color classes for estatus badges
function getEstatusColors(isDarkMode: boolean): Record<string, string>;

// Truncate text with ellipsis
function truncateText(text: string | null, length: number): string;

// Get type label for filter
function getTypeLabel(type: ActiveFilter['type']): string;

// Get type icon for filter
function getTypeIcon(type: ActiveFilter['type']): JSX.Element;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following testable properties. I performed reflection to eliminate redundancy:

**Redundancy Analysis:**
- Properties 3.2 (suggestion count <= 7) and 2.4 (suggestions match search term) are complementary, not redundant
- Properties 4.2 (sorting by column) and 4.3 (toggle sort direction) test different aspects of sorting
- Properties 4.5 (reset to page 1) and 4.6 (correct data slice) test different pagination behaviors
- Properties 5.3 (Excel export) and 5.6 (PDF export) test different export formats
- No properties were found to be logically redundant or subsumable

### Properties

**Property 1: Data Aggregation Preserves All Records**
*For any* set of INEA, ITEA, and TLAXCALA data arrays, the unified inventory should contain all items from all three sources with correct origin labels, and the total count should equal the sum of individual counts.
**Validates: Requirements 2.2**

**Property 2: Search Suggestions Match Input**
*For any* search term with 2 or more characters, all generated suggestions should contain the search term as a substring (case-insensitive), and the number of suggestions should not exceed 7.
**Validates: Requirements 2.4, 3.2**

**Property 3: Filter Addition Preserves Existing Filters**
*For any* active filter list and any new suggestion, adding the suggestion as a filter should result in a filter list containing all previous filters plus the new one.
**Validates: Requirements 3.3**

**Property 4: Filter Removal Preserves Other Filters**
*For any* active filter list with N filters, removing the filter at index I should result in a list with N-1 filters, where all filters except the one at index I are preserved in their original order.
**Validates: Requirements 3.5**

**Property 5: Column Sorting Orders Data Correctly**
*For any* dataset and any sortable column, sorting by that column in ascending order should result in data where each item's value for that column is less than or equal to the next item's value (with null values at the end).
**Validates: Requirements 4.2**

**Property 6: Sort Direction Toggle Reverses Order**
*For any* sorted dataset, toggling the sort direction should result in the exact reverse order of the data array.
**Validates: Requirements 4.3**

**Property 7: Rows-Per-Page Change Resets Pagination**
*For any* pagination state, changing the rows-per-page value should set the current page to 1.
**Validates: Requirements 4.5**

**Property 8: Pagination Slices Data Correctly**
*For any* dataset, page number P, and rows-per-page value R, the displayed data should be exactly the slice from index (P-1)*R to P*R (or end of array).
**Validates: Requirements 4.6**

**Property 9: Excel Export Contains All Filtered Records**
*For any* filtered dataset, the generated Excel file should contain exactly the same number of records as the filtered dataset, with all field values matching.
**Validates: Requirements 5.3**

**Property 10: PDF Export Contains All Filtered Records**
*For any* filtered dataset and signature data, the generated PDF should contain all records from the filtered dataset.
**Validates: Requirements 5.6**

**Property 11: Custom PDF Modal Pre-populates From Filters**
*For any* set of active filters containing an area filter and a usufinal filter, opening the custom PDF modal should pre-populate the area and director fields with the exact values from those filters.
**Validates: Requirements 6.4**

**Property 12: Empty Results Show Empty State**
*For any* filter combination that results in zero matching records, the loading states component should render the empty state UI (not loading or error state).
**Validates: Requirements 7.4**

**Property 13: Data Updates Preserve Filter State**
*For any* active filter list and search term, when the underlying data is updated (reindexed), the filter list and search term should remain unchanged.
**Validates: Requirements 9.5**

**Property 14: Pagination Limits Rendered Items**
*For any* dataset with N items and rows-per-page value R, the number of items rendered in the table should be min(R, N - (currentPage-1)*R).
**Validates: Requirements 11.5**

**Property 15: Arrow Key Navigation Updates Highlighted Index**
*For any* suggestion list with N items and current highlighted index I, pressing the down arrow key should set the highlighted index to (I+1) mod N, and pressing the up arrow key should set it to (I-1+N) mod N.
**Validates: Requirements 12.2**

## Error Handling

### Data Fetching Errors

**Strategy:** Graceful degradation with user feedback and retry capability.

**Implementation:**
- Each indexation hook provides an `error` state
- The `useUnifiedInventory` hook aggregates errors from all sources
- The `LoadingStates` component displays error messages with a retry button
- Errors do not crash the application; partial data is shown if available

**Error Types:**
- Network errors (connection timeout, no internet)
- Supabase errors (authentication, permission denied)
- Data validation errors (malformed records)

### Export Errors

**Strategy:** User notification with specific error messages.

**Implementation:**
- Try-catch blocks around export operations
- Display error messages in the message banner
- Log errors to console for debugging
- Provide actionable error messages (e.g., "No data to export")

**Error Types:**
- Empty dataset (no records to export)
- File generation errors (PDF/Excel library errors)
- Missing required data (signatures, director info)

### Director Management Errors

**Strategy:** Validation before save with clear error messages.

**Implementation:**
- Validate director data completeness before allowing save
- Display validation errors inline in the modal
- Prevent save button click if validation fails
- Show success/error messages after save attempts

**Error Types:**
- Missing required fields (nombre, puesto)
- Database update errors
- Duplicate director names

### Search and Filter Errors

**Strategy:** Defensive programming with fallbacks.

**Implementation:**
- Handle null/undefined values in data gracefully
- Provide empty arrays as fallbacks for missing data
- Sanitize user input to prevent injection
- Use try-catch for text normalization operations

**Error Types:**
- Invalid search characters
- Malformed filter data
- Text encoding issues

## Testing Strategy

### Dual Testing Approach

This feature requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties across all inputs
- Together, they provide comprehensive coverage (unit tests catch concrete bugs, property tests verify general correctness)

### Unit Testing

**Focus Areas:**
- Component rendering with specific props
- Event handler invocations
- Modal open/close behavior
- Export button click handlers
- Keyboard event handling
- Edge cases (empty data, single item, boundary conditions)

**Tools:**
- React Testing Library for component tests
- Jest for test runner and assertions
- Mock Supabase client for database operations
- Mock indexation hooks for data

**Example Unit Tests:**
```typescript
// SearchBar component
- Renders with placeholder text
- Calls onSearchChange when user types
- Shows suggestions when showSuggestions is true
- Hides suggestions when showSuggestions is false
- Calls onSuggestionSelect when suggestion is clicked

// FilterChips component
- Renders all active filters
- Calls onRemoveFilter with correct index when X is clicked
- Applies correct color classes based on filter type

// Pagination component
- Disables previous button on first page
- Disables next button on last page
- Calls onPageChange with correct page number
- Updates rows-per-page when selector changes
```

### Property-Based Testing

**Configuration:**
- Minimum 100 iterations per property test
- Use fast-check library for TypeScript
- Tag each test with feature name and property number

**Tag Format:**
```typescript
// Feature: levantamiento-componentization, Property 1: Data Aggregation Preserves All Records
```

**Property Test Examples:**

```typescript
// Property 1: Data Aggregation
fc.assert(
  fc.property(
    fc.array(fc.record({ /* INEA schema */ })),
    fc.array(fc.record({ /* ITEA schema */ })),
    fc.array(fc.record({ /* TLAXCALA schema */ })),
    (ineaData, iteaData, tlaxcalaData) => {
      const unified = aggregateData(ineaData, iteaData, tlaxcalaData);
      return unified.length === ineaData.length + iteaData.length + tlaxcalaData.length &&
             unified.filter(item => item.origen === 'INEA').length === ineaData.length &&
             unified.filter(item => item.origen === 'ITEA').length === iteaData.length &&
             unified.filter(item => item.origen === 'TLAXCALA').length === tlaxcalaData.length;
    }
  ),
  { numRuns: 100 }
);

// Property 5: Column Sorting
fc.assert(
  fc.property(
    fc.array(fc.record({ /* LevMueble schema */ })),
    fc.constantFrom('id_inv', 'descripcion', 'area', 'usufinal'),
    (data, column) => {
      const sorted = sortData(data, column, 'asc');
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i][column];
        const next = sorted[i + 1][column];
        if (current !== null && next !== null) {
          expect(current <= next).toBe(true);
        }
      }
    }
  ),
  { numRuns: 100 }
);

// Property 8: Pagination Slicing
fc.assert(
  fc.property(
    fc.array(fc.record({ /* LevMueble schema */ })),
    fc.integer({ min: 1, max: 10 }),
    fc.integer({ min: 10, max: 100 }),
    (data, page, rowsPerPage) => {
      const maxPage = Math.ceil(data.length / rowsPerPage);
      if (page > maxPage) return true; // Skip invalid pages
      
      const slice = paginateData(data, page, rowsPerPage);
      const expectedStart = (page - 1) * rowsPerPage;
      const expectedEnd = Math.min(page * rowsPerPage, data.length);
      
      return slice.length === expectedEnd - expectedStart &&
             slice.every((item, i) => item === data[expectedStart + i]);
    }
  ),
  { numRuns: 100 }
);
```

### Integration Testing

**Focus Areas:**
- Data flow from hooks to components
- Modal interactions with parent component
- Export operations end-to-end
- Filter and search interaction

**Approach:**
- Mount the full component tree
- Simulate user interactions
- Verify state updates and UI changes
- Test with realistic data volumes

### Manual Testing Checklist

- [ ] Dark mode toggle works in all components
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Keyboard navigation works in search bar
- [ ] Export generates valid Excel and PDF files
- [ ] Real-time updates reflect in the table
- [ ] Performance is acceptable with 1000+ records
- [ ] All modals open and close correctly
- [ ] Error states display appropriate messages
- [ ] Loading states show during async operations
- [ ] Accessibility features work (screen readers, keyboard-only)

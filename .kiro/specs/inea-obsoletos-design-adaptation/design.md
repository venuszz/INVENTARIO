# Design Document: INEA Obsoletos Design Adaptation

## Overview

This design document outlines the refactoring of the INEA Obsoletos component to adopt the modern search and filter patterns from the INEA General component. The adaptation will replace the basic search with dropdown filters with an intelligent omni-search system featuring dynamic filter chips, match type detection, and search suggestions.

The key architectural change is replacing the `useObsoletosData` hook's search logic with the `useSearchAndFilters` hook from INEA General, while maintaining all obsolete-specific functionality like the "Reactivar" action and baja information display.

## Architecture

### Current Architecture (Before)

```
ConsultasIneaObsoletos
├── useObsoletosData (handles search, filters, data fetching)
├── useItemEdit
├── useDirectorManagement
├── useAreaManagement
├── useBajaInfo
└── Components
    ├── Header
    ├── ValueStatsPanel
    ├── SearchBar (basic text input)
    ├── FilterChips (static filter display)
    ├── InventoryTable
    ├── DetailPanel
    └── Pagination
```

### Target Architecture (After)

```
ConsultasIneaObsoletos
├── useIneaObsoletosIndexation (data fetching via indexation)
├── useSearchAndFilters (omni-search with match detection)
├── useItemEdit
├── useDirectorManagement
├── useAreaManagement
├── useBajaInfo
└── Components
    ├── Header
    ├── ValueStatsPanel
    ├── SearchBar (with match type indicator and suggestions)
    ├── FilterChips (dynamic add/remove)
    ├── InventoryTable
    ├── DetailPanel
    └── Pagination
```


## Components and Interfaces

### 1. Main Component Refactoring

**File:** `src/components/consultas/inea/obsoletos/index.tsx`

**Changes:**
- Replace `useObsoletosData` with `useIneaObsoletosIndexation` for data fetching
- Add `useSearchAndFilters` hook for search and filter logic
- Update SearchBar to use INEA General's SearchBar component
- Update FilterChips to use INEA General's FilterChips component
- Add Plus button next to search bar for adding filters
- Maintain all existing obsolete-specific functionality

**Key State Variables:**
```typescript
// From useIneaObsoletosIndexation
const { muebles, isIndexing, realtimeConnected, reindex } = useIneaObsoletosIndexation();

// From useSearchAndFilters
const {
  searchTerm,
  setSearchTerm,
  searchMatchType,
  activeFilters,
  filteredMueblesOmni,
  saveCurrentFilter,
  removeFilter,
  clearAllFilters,
  handleInputKeyDown,
  handleInputBlur
} = useSearchAndFilters(muebles);

// Pagination (local state)
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);

// Sorting (local state)
const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
```

### 2. SearchBar Component Integration

**Source:** `src/components/consultas/inea/components/SearchBar.tsx`

**Usage in Obsoletos:**
```typescript
<SearchBar
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  searchMatchType={searchMatchType}
  handleInputKeyDown={handleInputKeyDown}
  handleInputBlur={handleInputBlur}
  isDarkMode={isDarkMode}
/>
```

**Features:**
- Displays search icon on the left
- Shows match type badge when detected (ID, Área, Director, etc.)
- Shows clear button (X) when search term exists
- Handles keyboard navigation for suggestions
- Styled consistently with INEA General

### 3. FilterChips Component Integration

**Source:** `src/components/consultas/inea/components/FilterChips.tsx`

**Usage in Obsoletos:**
```typescript
{activeFilters.length > 0 && (
  <FilterChips
    activeFilters={activeFilters}
    removeFilter={removeFilter}
    clearAllFilters={clearAllFilters}
    isDarkMode={isDarkMode}
  />
)}
```

**Features:**
- Displays each active filter as a chip with type label and term
- Shows X button on each chip for removal
- Shows "Limpiar todo" button when multiple filters exist
- Animated entry/exit with framer-motion
- Styled consistently with INEA General

### 4. Plus Button Component

**New Addition:**
```typescript
<motion.button
  onClick={saveCurrentFilter}
  disabled={!searchTerm || !searchMatchType}
  className={/* styling */}
  title="Agregar filtro actual a la lista de filtros activos"
  whileHover={searchTerm && searchMatchType ? { scale: 1.02 } : {}}
  whileTap={searchTerm && searchMatchType ? { scale: 0.98 } : {}}
>
  <Plus className="h-4 w-4" />
</motion.button>
```

**Behavior:**
- Enabled only when searchTerm and searchMatchType are both present
- Calls `saveCurrentFilter()` from useSearchAndFilters hook
- Positioned to the right of the search bar
- Shows tooltip explaining its function


## Data Models

### ActiveFilter Type

```typescript
type ActiveFilter = {
  term: string;
  type: 'id' | 'area' | 'usufinal' | 'resguardante' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | null;
};
```

**Purpose:** Represents a saved search filter with its detected type.

### Mueble Type (Obsoletos)

```typescript
interface Mueble {
  id: string;
  id_inv: string;
  rubro: string;
  descripcion: string;
  valor: number;
  f_adq: string;
  formadq: string;
  proveedor: string;
  factura: string;
  ubicacion_es: string;
  ubicacion_mu: string;
  ubicacion_no: string;
  estado: string;
  estatus: string; // Always 'BAJA' for obsoletos
  area: { id_area: number; nombre: string } | null;
  directorio: { id_directorio: number; nombre: string; puesto: string } | null;
  fechabaja: string;
  causadebaja: string;
  resguardante: string;
  image_path: string;
}
```

**Note:** The obsoletos muebles always have `estatus: 'BAJA'`.

### SearchableData Structure

```typescript
interface SearchableData {
  id: string[];
  area: string[];
  usufinal: string[];
  resguardante: string[];
  descripcion: string[];
  rubro: string[];
  estado: string[];
  estatus: string[];
}
```

**Purpose:** Pre-calculated vectors of searchable values for performance optimization.

## Hook Integration Details

### useSearchAndFilters Hook Adaptation

**Source:** `src/components/consultas/inea/hooks/useSearchAndFilters.ts`

**Key Functions:**

1. **Match Type Detection**
   - Iterates through muebles to find best match for search term
   - Priority order: usufinal (10), area (8), id (6), descripcion (4)
   - Uses exact match scoring for higher priority
   - Short-circuits when exact high-priority match found

2. **Suggestion Generation**
   - Generates suggestions from all searchable fields
   - Limits to 7 suggestions maximum
   - Prioritizes suggestions that start with the search term
   - Uses Set to avoid duplicate suggestions

3. **Filtering Logic**
   - Applies active filters with AND logic
   - Applies general search term across all fields
   - Uses deferred values to avoid blocking input
   - Returns filtered muebles array

4. **Filter Management**
   - `saveCurrentFilter()`: Adds current search as active filter
   - `removeFilter(index)`: Removes specific filter by index
   - `clearAllFilters()`: Removes all filters and clears search

**Adaptation for Obsoletos:**
- No changes needed to the hook itself
- Hook receives `muebles` from `useIneaObsoletosIndexation`
- Hook works with relational fields (area.nombre, directorio.nombre)
- All obsoletos muebles have estatus='BAJA' by default


### Data Flow Changes

**Before (useObsoletosData):**
```
User Input → useObsoletosData → Supabase Query with filters → Server-side filtering → Results
```

**After (useSearchAndFilters):**
```
Initial Load → useIneaObsoletosIndexation → IndexedDB → All obsoletos muebles
User Input → useSearchAndFilters → Client-side filtering → Filtered results
```

**Benefits:**
- Faster search response (no network latency)
- Real-time suggestions as user types
- Intelligent match type detection
- Ability to combine multiple filters
- Consistent with INEA General UX

### Sorting and Pagination Integration

**Sorting:**
```typescript
const sortedMuebles = useMemo(() => {
  const sorted = [...filteredMueblesOmni];
  sorted.sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}, [filteredMueblesOmni, sortField, sortDirection]);
```

**Pagination:**
```typescript
const totalFilteredCount = sortedMuebles.length;
const totalPages = Math.ceil(totalFilteredCount / rowsPerPage);
const paginatedMuebles = sortedMuebles.slice(
  (currentPage - 1) * rowsPerPage,
  currentPage * rowsPerPage
);
```

**Value Calculation:**
```typescript
const filteredValue = sortedMuebles.reduce((sum, m) => 
  sum + (typeof m.valor === 'number' ? m.valor : parseFloat(m.valor || '0') || 0), 0
);
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 1.3 and 5.1 both test match type badge display (consolidated into Property 1)
- Properties 2.4 and 6.3 both test filter removal (consolidated into Property 2)
- Properties 2.6 and 6.2 both test chip content display (consolidated into Property 3)
- Properties 2.1 and 10.2 both test Plus button click (consolidated into Property 4)
- Properties 2.7 and 10.1 are inverses testing button enabled/disabled state (consolidated into Property 5)

The following properties provide unique validation value and will be implemented:

### Property 1: Match Type Detection Accuracy
*For any* search term that matches a field in the muebles data, the detected match type should correspond to the highest priority matching field (usufinal > area > id > descripcion).
**Validates: Requirements 1.1, 1.2, 1.3, 5.1**

### Property 2: Filter Removal Correctness
*For any* active filter at index i, calling removeFilter(i) should result in an activeFilters array that no longer contains that filter and has length reduced by 1.
**Validates: Requirements 2.4, 6.3**

### Property 3: Filter Chip Display Completeness
*For any* active filter, the rendered chip should contain both the type label (ID, Área, Director, etc.) and the filter term.
**Validates: Requirements 2.6, 6.2**

### Property 4: Plus Button Filter Addition
*For any* valid search term with a detected match type, clicking the Plus button should add that term to activeFilters and clear the search input.
**Validates: Requirements 2.1, 2.2, 10.2**

### Property 5: Plus Button State Consistency
*For any* component state, the Plus button should be enabled if and only if both searchTerm is non-empty AND searchMatchType is non-null.
**Validates: Requirements 2.7, 10.1**

### Property 6: Suggestion Generation Limit
*For any* search term that would generate suggestions, the suggestions array length should never exceed 7.
**Validates: Requirements 1.5**

### Property 7: Keyboard Navigation Bounds
*For any* sequence of arrow key presses, the highlightedIndex should always remain within the bounds [0, suggestions.length - 1].
**Validates: Requirements 1.6**

### Property 8: Enter Key Filter Addition
*For any* highlighted suggestion at index i, pressing Enter should add suggestions[i] to activeFilters.
**Validates: Requirements 1.7**

### Property 9: Escape Key Closes Suggestions
*For any* state where showSuggestions is true, pressing Escape should set showSuggestions to false.
**Validates: Requirements 1.8**

### Property 10: AND Logic Filter Application
*For any* set of active filters, the filtered results should only include items that match ALL filter criteria.
**Validates: Requirements 2.3**

### Property 11: Clear All Filters
*For any* state with active filters, calling clearAllFilters should result in empty activeFilters array and empty searchTerm.
**Validates: Requirements 2.5**

### Property 12: Backward Compatible Field Filtering
*For any* filter on estado, area, or rubro fields, the filtered results should match items where that field contains the filter term.
**Validates: Requirements 3.3**

### Property 13: Suggestion Click Adds Filter
*For any* suggestion at index i, clicking it should add that suggestion to activeFilters with the correct type.
**Validates: Requirements 5.4**

### Property 14: Conditional Chip Display
*For any* component state, the FilterChips component should render if and only if activeFilters.length > 0.
**Validates: Requirements 6.1, 6.5**

### Property 15: Clear All Button Visibility
*For any* component state, the "Clear All" button should be visible if and only if activeFilters.length > 1.
**Validates: Requirements 6.4**

### Property 16: Filtered Count Accuracy
*For any* set of active filters and search term, the displayed filtered count should equal the length of filteredMueblesOmni.
**Validates: Requirements 7.4**

### Property 17: Total Value Calculation
*For any* set of filtered muebles, the total value should equal the sum of all valor fields in the filtered results.
**Validates: Requirements 7.5**

### Property 18: Minimum Suggestion Length
*For any* search term with length < 2, the suggestions array should be empty.
**Validates: Requirements 1.4**

### Property 19: Suggestion Dropdown Visibility
*For any* component state, the suggestions dropdown should be visible if and only if showSuggestions is true AND suggestions.length > 0.
**Validates: Requirements 5.2**


## Error Handling

### Search and Filter Errors

1. **Empty Muebles Array**
   - If `muebles` is null, undefined, or empty array
   - Hook should return empty filteredMueblesOmni
   - No suggestions should be generated
   - Match type should be null

2. **Invalid Filter State**
   - If activeFilters contains invalid filter objects
   - System should skip invalid filters
   - Log warning to console
   - Continue processing valid filters

3. **Null/Undefined Field Values**
   - When filtering, treat null/undefined as empty string
   - Null values should not match any search term
   - Sort null values to the end of sorted results

4. **Invalid Sort Field**
   - If sortField doesn't exist on Mueble type
   - Fall back to 'id_inv' as default sort field
   - Log warning to console

### Component Errors

1. **Missing Required Props**
   - SearchBar, FilterChips should validate required props
   - Display error message if critical props missing
   - Prevent component crash with defensive checks

2. **Hook Initialization Errors**
   - If useIneaObsoletosIndexation fails to load data
   - Display error message to user
   - Provide retry button
   - Log error details to console

3. **State Update Errors**
   - Wrap state updates in try-catch blocks
   - If state update fails, revert to previous state
   - Display error message to user
   - Log error details for debugging

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of match type detection
- Edge cases (empty arrays, null values, boundary conditions)
- Component rendering with specific props
- Integration between components
- Error conditions and error handling

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Filter logic correctness across random data
- Suggestion generation across random search terms
- Keyboard navigation across random key sequences
- State consistency across random user actions

### Property-Based Testing Configuration

**Library:** fast-check (for TypeScript/React)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: inea-obsoletos-design-adaptation, Property {number}: {property_text}`
- Use custom arbitraries for generating valid Mueble objects
- Use custom arbitraries for generating valid search terms

**Example Test Structure:**
```typescript
import fc from 'fast-check';

// Feature: inea-obsoletos-design-adaptation, Property 1: Match Type Detection Accuracy
test('match type detection prioritizes fields correctly', () => {
  fc.assert(
    fc.property(
      fc.array(muebleArbitrary),
      fc.string({ minLength: 1, maxLength: 50 }),
      (muebles, searchTerm) => {
        const matchType = detectMatchType(searchTerm, muebles);
        // Verify priority order is respected
        // ...
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Examples

1. **Match Type Detection**
   - Test with search term matching usufinal field
   - Test with search term matching area field
   - Test with search term matching id field
   - Test with search term matching multiple fields (verify priority)
   - Test with search term matching no fields (verify null)

2. **Filter Addition/Removal**
   - Test adding first filter
   - Test adding multiple filters
   - Test removing middle filter from list
   - Test removing last filter
   - Test clear all with multiple filters

3. **Component Rendering**
   - Test SearchBar renders with match type badge
   - Test FilterChips renders correct number of chips
   - Test Plus button disabled state
   - Test Plus button enabled state
   - Test suggestions dropdown visibility

4. **Edge Cases**
   - Test with empty muebles array
   - Test with null field values
   - Test with very long search terms
   - Test with special characters in search
   - Test with Unicode characters

### Integration Testing

1. **Full Search Flow**
   - Type search term → verify match type detected
   - Click Plus button → verify filter added
   - Verify results filtered correctly
   - Remove filter → verify results updated

2. **Keyboard Navigation Flow**
   - Type search term → verify suggestions appear
   - Press arrow down → verify highlight moves
   - Press Enter → verify filter added
   - Press Escape → verify suggestions close

3. **Multiple Filter Flow**
   - Add first filter → verify results filtered
   - Add second filter → verify AND logic applied
   - Remove first filter → verify results updated
   - Clear all → verify all filters removed

### Performance Testing

1. **Large Dataset Performance**
   - Test with 10,000+ muebles
   - Verify search response time < 100ms
   - Verify suggestion generation < 50ms
   - Verify filtering completes < 200ms

2. **Rapid Input Performance**
   - Simulate rapid typing (10+ chars/second)
   - Verify UI remains responsive
   - Verify deferred values prevent blocking
   - Verify no dropped keystrokes


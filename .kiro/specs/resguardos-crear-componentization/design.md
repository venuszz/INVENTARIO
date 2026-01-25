# Design Document: Resguardos Crear Component Componentization

## Overview

This design document outlines the refactoring of the monolithic `src/components/resguardos/crear.tsx` component (~2700 lines) into a modular, maintainable architecture. The refactoring follows established patterns from the `levantamiento` and `registro` components, organizing code into logical units while preserving all existing functionality, UI/UX, and behavior.

### Goals

1. **Modularity**: Break down the monolithic component into focused, single-responsibility components
2. **Maintainability**: Create a clear structure that's easy to navigate and modify
3. **Reusability**: Extract common patterns into reusable components and hooks
4. **Testability**: Separate business logic from UI for easier testing
5. **Consistency**: Follow existing patterns in the codebase
6. **Zero Regression**: Preserve all existing functionality and behavior

### Non-Goals

1. Changing any existing functionality or business logic
2. Modifying the UI/UX or visual design
3. Introducing new features or capabilities
4. Changing external dependencies or APIs
5. Modifying parent components or routing

## Architecture

### High-Level Structure

```
src/components/resguardos/crear/
├── index.tsx                          # Main orchestrator component
├── types.ts                           # All TypeScript interfaces
├── utils.ts                           # Utility functions
├── constants.ts                       # Color palettes, constants
├── components/                        # UI components
│   ├── Header.tsx
│   ├── FolioInfoPanel.tsx
│   ├── SearchAndFilters.tsx
│   ├── FilterChips.tsx
│   ├── InventoryTable.tsx
│   ├── TableSkeleton.tsx
│   ├── Pagination.tsx
│   ├── DetailsPanel.tsx
│   ├── DirectorSelection.tsx
│   ├── AreaPuestoInputs.tsx
│   ├── ResguardanteInput.tsx
│   ├── SelectedItemsList.tsx
│   ├── ActionButtons.tsx
│   └── SuggestionDropdown.tsx
├── modals/                            # Modal dialogs
│   ├── DirectorModal.tsx
│   ├── UsufinalConflictModal.tsx
│   ├── AreaConflictModal.tsx
│   ├── PDFDownloadModal.tsx
│   ├── WarningModal.tsx
│   ├── SelectAllErrorModal.tsx
│   └── MissingDirectorDataAlert.tsx
└── hooks/                             # Custom hooks
    ├── useResguardoForm.ts
    ├── useInventoryData.ts
    ├── useItemSelection.ts
    ├── useDirectorAutocomplete.ts
    ├── useSearchAndFilters.ts
    ├── usePagination.ts
    ├── useFolioGeneration.ts
    └── useResguardoSubmit.ts
```

### Component Hierarchy

```
CrearResguardos (index.tsx)
├── Header
│   └── SectionRealtimeToggle
├── FolioInfoPanel
├── SearchAndFilters
│   └── SuggestionDropdown
├── FilterChips
├── InventoryTable
│   ├── TableSkeleton (conditional)
│   └── Pagination
└── DetailsPanel
    ├── DirectorSelection
    │   └── SuggestionDropdown
    ├── AreaPuestoInputs
    ├── ResguardanteInput
    ├── SelectedItemsList
    └── ActionButtons

Modals (conditional rendering)
├── DirectorModal
├── UsufinalConflictModal
├── AreaConflictModal
├── PDFDownloadModal
├── WarningModal
├── SelectAllErrorModal
└── MissingDirectorDataAlert
```

### Data Flow

1. **Initialization**: Main component initializes all hooks
2. **Data Loading**: `useInventoryData` fetches and combines data from multiple sources
3. **User Interaction**: User interacts with UI components
4. **State Updates**: Components call hook functions to update state
5. **Validation**: Hooks validate state changes and trigger modals if needed
6. **Submission**: `useResguardoSubmit` handles final submission and PDF generation

## Components and Interfaces

### Core Components

#### 1. Header Component

**Purpose**: Display page title, realtime connection status, and selected items counter

**Props**:
```typescript
interface HeaderProps {
  selectedCount: number;
  ineaConnected: boolean;
  iteaConnected: boolean;
  noListadoConnected: boolean;
}
```

**Responsibilities**:
- Render page title with icon
- Display realtime toggle component
- Show selected items counter with animation

#### 2. FolioInfoPanel Component

**Purpose**: Display folio information, director name, and current date

**Props**:
```typescript
interface FolioInfoPanelProps {
  folio: string;
  directorName: string;
  onResetFolio: () => void;
}
```

**Responsibilities**:
- Display folio with refresh button
- Show director name
- Display current date

#### 3. SearchAndFilters Component

**Purpose**: Provide omnibox search with intelligent suggestions

**Props**:
```typescript
interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  suggestions: Array<{ value: string; type: SearchMatchType }>;
  showSuggestions: boolean;
  highlightedIndex: number;
  onSuggestionClick: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  onSaveFilter: () => void;
  searchMatchType: SearchMatchType | null;
}
```

**Responsibilities**:
- Render search input with icon
- Display search match type indicator
- Show suggestion dropdown
- Handle keyboard navigation

#### 4. FilterChips Component

**Purpose**: Display active filters as removable chips

**Props**:
```typescript
interface FilterChipsProps {
  filters: ActiveFilter[];
  onRemoveFilter: (index: number) => void;
}
```

**Responsibilities**:
- Render filter chips with icons
- Handle filter removal
- Show filter type labels

#### 5. InventoryTable Component

**Purpose**: Display paginated inventory items with selection

**Props**:
```typescript
interface InventoryTableProps {
  items: Mueble[];
  selectedItems: Mueble[];
  onToggleSelection: (item: Mueble) => void;
  onSelectAllPage: () => void;
  areAllPageSelected: boolean;
  isSomePageSelected: boolean;
  canSelectAllPage: boolean;
  sortField: keyof Mueble;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Mueble) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}
```

**Responsibilities**:
- Render table header with sortable columns
- Render table rows with selection checkboxes
- Handle select-all functionality
- Show loading skeleton or error states
- Apply hover and selection styling

#### 6. TableSkeleton Component

**Purpose**: Display loading skeleton for table

**Props**: None (uses theme context)

**Responsibilities**:
- Render animated skeleton rows
- Match table structure

#### 7. Pagination Component

**Purpose**: Provide pagination controls

**Props**:
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}
```

**Responsibilities**:
- Display current page and total pages
- Provide previous/next buttons
- Provide rows per page selector

#### 8. DetailsPanel Component

**Purpose**: Container for right panel with form inputs

**Props**:
```typescript
interface DetailsPanelProps {
  children: React.ReactNode;
}
```

**Responsibilities**:
- Provide styled container
- Handle responsive layout

#### 9. DirectorSelection Component

**Purpose**: Autocomplete input for director selection

**Props**:
```typescript
interface DirectorSelectionProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  suggestions: Directorio[];
  showSuggestions: boolean;
  highlightedIndex: number;
  onSuggestionClick: (director: Directorio) => void;
  suggestedDirector: Directorio | null;
  showAllDirectors: boolean;
  onShowAllDirectors: () => void;
}
```

**Responsibilities**:
- Render autocomplete input
- Display suggestion dropdown
- Show suggested director chip
- Handle keyboard navigation

#### 10. AreaPuestoInputs Component

**Purpose**: Display area and puesto input fields

**Props**:
```typescript
interface AreaPuestoInputsProps {
  puesto: string;
  area: string;
  onPuestoChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  disabled: boolean;
  availableAreas: Array<{ id_area: number; nombre: string }>;
  hasAreaMismatch: boolean;
  areaSuggestion: string | null;
  onAcceptAreaSuggestion: () => void;
}
```

**Responsibilities**:
- Render puesto input field
- Render area select dropdown
- Show area mismatch warning
- Display area suggestion chip

#### 11. ResguardanteInput Component

**Purpose**: Input field for resguardante name

**Props**:
```typescript
interface ResguardanteInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}
```

**Responsibilities**:
- Render input field
- Handle value changes

#### 12. SelectedItemsList Component

**Purpose**: Display list of selected items with individual resguardante override

**Props**:
```typescript
interface SelectedItemsListProps {
  items: Mueble[];
  onRemoveItem: (item: Mueble) => void;
  onUpdateItemResguardante: (itemId: string, resguardante: string) => void;
  onClearAll: () => void;
}
```

**Responsibilities**:
- Render list of selected items
- Show item details (id, description, rubro, estado, origen)
- Provide individual resguardante input
- Handle item removal
- Show clear all button

#### 13. ActionButtons Component

**Purpose**: Provide clear and save action buttons

**Props**:
```typescript
interface ActionButtonsProps {
  onClear: () => void;
  onSave: () => void;
  canClear: boolean;
  canSave: boolean;
  isSaving: boolean;
  selectedCount: number;
}
```

**Responsibilities**:
- Render clear selection button
- Render save resguardo button
- Show loading state during save
- Disable buttons based on state

#### 14. SuggestionDropdown Component

**Purpose**: Reusable dropdown for suggestions (used by search and director selection)

**Props**:
```typescript
interface SuggestionDropdownProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isHighlighted: boolean) => React.ReactNode;
  onItemClick: (item: T, index: number) => void;
  highlightedIndex: number;
  onHighlightChange: (index: number) => void;
  show: boolean;
}
```

**Responsibilities**:
- Render dropdown container
- Render items using render prop
- Handle mouse hover highlighting
- Handle click events

### Modal Components

#### 1. DirectorModal

**Purpose**: Complete missing director data (area and puesto)

**Props**:
```typescript
interface DirectorModalProps {
  show: boolean;
  director: Directorio | null;
  area: string;
  puesto: string;
  onAreaChange: (value: string) => void;
  onPuestoChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
  isUsuario: boolean;
}
```

#### 2. UsufinalConflictModal

**Purpose**: Warn when selecting items with different responsables

**Props**:
```typescript
interface UsufinalConflictModalProps {
  show: boolean;
  conflictUsufinal: string;
  onClose: () => void;
}
```

#### 3. AreaConflictModal

**Purpose**: Warn when selecting items from different areas

**Props**:
```typescript
interface AreaConflictModalProps {
  show: boolean;
  conflictArea: string;
  onClose: () => void;
}
```

#### 4. PDFDownloadModal

**Purpose**: Prompt to download PDF after saving

**Props**:
```typescript
interface PDFDownloadModalProps {
  show: boolean;
  pdfData: PdfData | null;
  onDownload: () => void;
  onClose: () => void;
  isGenerating: boolean;
}
```

#### 5. WarningModal

**Purpose**: Generic warning modal for closing without downloading

**Props**:
```typescript
interface WarningModalProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

#### 6. SelectAllErrorModal

**Purpose**: Show error when select-all fails validation

**Props**:
```typescript
interface SelectAllErrorModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
}
```

#### 7. MissingDirectorDataAlert

**Purpose**: Alert for incomplete director data

**Props**:
```typescript
interface MissingDirectorDataAlertProps {
  show: boolean;
  onComplete: () => void;
}
```

### Custom Hooks

#### 1. useResguardoForm

**Purpose**: Manage resguardo form state

**Interface**:
```typescript
interface UseResguardoFormReturn {
  formData: ResguardoForm;
  setFormData: React.Dispatch<React.SetStateAction<ResguardoForm>>;
  updateField: (field: keyof ResguardoForm, value: string) => void;
  resetForm: () => void;
  isFormValid: boolean;
}

function useResguardoForm(initialFolio: string): UseResguardoFormReturn
```

**Responsibilities**:
- Manage form state (folio, directorId, area, puesto, resguardante)
- Provide field update functions
- Validate form completeness
- Reset form to initial state

#### 2. useInventoryData

**Purpose**: Fetch and manage inventory data from multiple sources

**Interface**:
```typescript
interface UseInventoryDataReturn {
  allMuebles: Mueble[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useInventoryData(
  sortField: keyof Mueble,
  sortDirection: 'asc' | 'desc'
): UseInventoryDataReturn
```

**Responsibilities**:
- Fetch data from INEA, ITEA, and TLAXCALA sources
- Filter out already resguarded items
- Combine and sort data
- Handle loading and error states
- Provide refetch function

#### 3. useItemSelection

**Purpose**: Handle item selection logic with validation

**Interface**:
```typescript
interface UseItemSelectionReturn {
  selectedMuebles: Mueble[];
  toggleSelection: (mueble: Mueble) => void;
  removeItem: (mueble: Mueble) => void;
  clearSelection: () => void;
  updateItemResguardante: (itemId: string, resguardante: string) => void;
  selectAllPage: (items: Mueble[]) => void;
  areAllPageSelected: (items: Mueble[]) => boolean;
  isSomePageSelected: (items: Mueble[]) => boolean;
  canSelectAllPage: (items: Mueble[]) => boolean;
  // Conflict detection
  usufinalConflict: string | null;
  areaConflict: string | null;
  clearConflicts: () => void;
}

function useItemSelection(): UseItemSelectionReturn
```

**Responsibilities**:
- Manage selected items state
- Validate usufinal consistency
- Validate area consistency
- Handle select-all logic
- Detect and report conflicts
- Update individual item resguardante

#### 4. useDirectorAutocomplete

**Purpose**: Handle director search and suggestions

**Interface**:
```typescript
interface UseDirectorAutocompleteReturn {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  filteredDirectors: Directorio[];
  suggestedDirector: Directorio | null;
  forceShowAll: boolean;
  setForceShowAll: (show: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleBlur: () => void;
}

function useDirectorAutocomplete(
  directorio: Directorio[],
  initialSuggestion: string
): UseDirectorAutocompleteReturn
```

**Responsibilities**:
- Manage search term state
- Filter directors based on search
- Suggest best match director
- Handle keyboard navigation
- Manage suggestion visibility

#### 5. useSearchAndFilters

**Purpose**: Manage omnibox search with suggestions and active filters

**Interface**:
```typescript
interface UseSearchAndFiltersReturn {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  deferredSearchTerm: string;
  searchMatchType: SearchMatchType | null;
  activeFilters: ActiveFilter[];
  addFilter: (filter: ActiveFilter) => void;
  removeFilter: (index: number) => void;
  suggestions: Array<{ value: string; type: SearchMatchType }>;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleBlur: () => void;
  saveCurrentFilter: () => void;
}

function useSearchAndFilters(
  allMuebles: Mueble[]
): UseSearchAndFiltersReturn
```

**Responsibilities**:
- Manage search term with deferred value
- Detect search match type
- Generate suggestions from data
- Manage active filters
- Handle keyboard navigation
- Filter data based on active filters and search

#### 6. usePagination

**Purpose**: Manage pagination state and controls

**Interface**:
```typescript
interface UsePaginationReturn {
  currentPage: number;
  rowsPerPage: number;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  totalPages: number;
  paginatedItems: Mueble[];
}

function usePagination(
  items: Mueble[],
  initialRowsPerPage: number = 10
): UsePaginationReturn
```

**Responsibilities**:
- Manage current page state
- Manage rows per page state
- Calculate total pages
- Slice items for current page
- Reset page when filters change

#### 7. useFolioGeneration

**Purpose**: Generate unique folios

**Interface**:
```typescript
interface UseFolioGenerationReturn {
  folio: string;
  generateFolio: () => Promise<string | null>;
  resetFolio: () => void;
}

function useFolioGeneration(): UseFolioGenerationReturn
```

**Responsibilities**:
- Generate folio with date and sequential number
- Query existing folios for the day
- Ensure uniqueness
- Provide reset function

#### 8. useResguardoSubmit

**Purpose**: Handle resguardo creation and PDF generation

**Interface**:
```typescript
interface UseResguardoSubmitReturn {
  handleSubmit: () => Promise<void>;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  pdfData: PdfData | null;
  showPDFButton: boolean;
  setShowPDFButton: (show: boolean) => void;
  generatePDF: () => Promise<void>;
  generatingPDF: boolean;
}

function useResguardoSubmit(
  formData: ResguardoForm,
  selectedMuebles: Mueble[],
  directorio: Directorio[],
  onSuccess: () => void
): UseResguardoSubmitReturn
```

**Responsibilities**:
- Validate form data
- Update muebles in database
- Insert resguardo records
- Generate PDF data
- Create notifications
- Handle errors
- Manage loading states

## Data Models

### Mueble (Inventory Item)

```typescript
interface Mueble {
  id: string;                      // UUID primary key
  id_inv: string | null;           // Inventory number
  descripcion: string | null;      // Item description
  estado: string | null;           // Condition (B/R/M/N)
  estatus: string | null;          // Status (ACTIVO/INACTIVO)
  resguardante: string | null;     // Current custodian
  rubro: string | null;            // Category
  usufinal: string | null;         // Final user/responsible
  area: string | null;             // Area
  origen?: string;                 // Source (INEA/ITEA/TLAXCALA)
  resguardanteAsignado?: string;   // Individual override for resguardante
}
```

### Directorio (Director)

```typescript
interface Directorio {
  id_directorio: number;           // Primary key
  nombre: string;                  // Director name
  area: string | null;             // Area (deprecated, now N:M)
  puesto: string | null;           // Position/title
}
```

### ResguardoForm (Form State)

```typescript
interface ResguardoForm {
  folio: string;                   // Unique folio identifier
  directorId: string;              // Selected director ID
  area: string;                    // Selected area
  puesto: string;                  // Director position
  resguardante: string;            // Default resguardante for all items
}
```

### PdfData (PDF Generation Data)

```typescript
interface PdfData {
  folio: string;
  fecha: string;
  director: string | undefined;
  area: string;
  puesto: string;
  resguardante: string;
  articulos: Array<{
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    estado: string | null;
    origen?: string | null;
    resguardante: string;
  }>;
  firmas?: PdfFirma[];
}
```

### PdfFirma (Signature Data)

```typescript
interface PdfFirma {
  concepto: string;
  nombre: string;
  puesto: string;
  cargo: string;
  firma?: string;
}
```

### ActiveFilter (Search Filter)

```typescript
interface ActiveFilter {
  term: string;
  type: 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | null;
}
```

### SearchMatchType

```typescript
type SearchMatchType = 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | null;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Search and Filter Equivalence

*For any* search term and any combination of active filters, the refactored system SHALL return the exact same filtered inventory items as the original system, in the same order.

**Validates: Requirements 10.1**

**Testing Approach**: Generate random search terms and filter combinations, compare filtered results between original and refactored implementations.

### Property 2: Selection Validation Equivalence

*For any* sequence of item selection operations, the refactored system SHALL produce the same validation results (usufinal conflicts, area conflicts, selection state) as the original system.

**Validates: Requirements 10.2**

**Testing Approach**: Generate random sequences of item selections and deselections, verify that validation errors and warnings match between implementations.

### Property 3: Director Autocomplete Equivalence

*For any* director search term, the refactored system SHALL return the same director suggestions in the same order as the original system.

**Validates: Requirements 10.3**

**Testing Approach**: Generate random search terms, compare suggestion lists between implementations.

### Property 4: Form State Management Equivalence

*For any* sequence of form field updates (director, area, puesto, resguardante), the refactored system SHALL maintain the same form state and validation status as the original system.

**Validates: Requirements 10.4**

**Testing Approach**: Generate random sequences of form updates, verify form state matches between implementations.

### Property 5: Resguardo Creation Equivalence

*For any* valid form submission with selected items, the refactored system SHALL create identical database records and generate identical PDF data as the original system.

**Validates: Requirements 10.5**

**Testing Approach**: Generate random valid form submissions, compare database records and PDF data between implementations.

### Property 6: Modal Flow Equivalence

*For any* user action that triggers a modal (conflicts, missing data, PDF download), the refactored system SHALL display the same modal with the same content as the original system.

**Validates: Requirements 10.6**

**Testing Approach**: Generate scenarios that trigger each modal type, verify modal visibility and content match between implementations.

### Property 7: Error Handling Equivalence

*For any* invalid input or error condition, the refactored system SHALL display the same error messages and maintain the same error state as the original system.

**Validates: Requirements 10.7**

**Testing Approach**: Generate invalid inputs and error scenarios, verify error messages and states match between implementations.

### Property 8: Component Rendering Consistency

*For any* component in the refactored system, when rendered with the same props and context, it SHALL produce the same DOM structure and styling as the corresponding section in the original system.

**Validates: Requirements 10.9, 11.1, 11.2, 11.3, 11.4**

**Testing Approach**: Snapshot testing for each component with various prop combinations, compare rendered output.

## Error Handling

### Error Categories

1. **Data Loading Errors**
   - Network failures when fetching inventory data
   - Database query errors
   - Missing or malformed data

2. **Validation Errors**
   - Empty required fields
   - Usufinal conflicts between selected items
   - Area conflicts between selected items
   - Missing director data (area or puesto)

3. **Submission Errors**
   - Database write failures
   - PDF generation failures
   - Notification creation failures

4. **User Input Errors**
   - Invalid search terms
   - Invalid form field values

### Error Handling Strategy

#### Data Loading Errors

**Detection**: Try-catch blocks in `useInventoryData` hook

**Response**:
- Set error state with descriptive message
- Display error alert with retry button
- Log error to console for debugging
- Maintain previous data if available

**Recovery**:
- Provide retry button to refetch data
- Clear error state on successful retry

#### Validation Errors

**Detection**: Validation logic in `useItemSelection` and `useResguardoForm` hooks

**Response**:
- Show appropriate modal dialog (UsufinalConflictModal, AreaConflictModal, MissingDirectorDataAlert)
- Prevent invalid state changes
- Provide clear explanation of the issue
- Suggest corrective actions

**Recovery**:
- User dismisses modal and adjusts selection
- User completes missing data
- Validation re-runs automatically

#### Submission Errors

**Detection**: Try-catch blocks in `useResguardoSubmit` hook

**Response**:
- Set error state with descriptive message
- Display error alert
- Log detailed error to console
- Rollback any partial changes if possible

**Recovery**:
- User can retry submission
- Form state is preserved for retry

#### User Input Errors

**Detection**: Input validation in form components

**Response**:
- Disable submit button when form is invalid
- Show inline validation messages
- Provide visual feedback (red borders, warning icons)

**Recovery**:
- User corrects input
- Validation re-runs on change

### Error State Management

All error states are managed in custom hooks and passed to components via props. This ensures:
- Centralized error handling logic
- Consistent error display across components
- Easy testing of error scenarios
- Clear separation of concerns

### Error Messages

All error messages are preserved from the original implementation to maintain consistency:
- "Error al cargar los datos"
- "Complete todos los campos obligatorios"
- "Error al generar el folio"
- "Error al guardar el resguardo"
- "Error al actualizar la información del director"
- "Error al generar el PDF"

## Testing Strategy

### Overview

The testing strategy for this refactoring focuses on ensuring behavioral equivalence between the original monolithic component and the refactored modular structure. Since this is a refactoring (not new feature development), the primary goal is to verify that all existing functionality is preserved.

### Testing Approach

#### 1. Unit Testing

**Purpose**: Verify individual components and hooks work correctly in isolation

**Scope**:
- Utility functions (getColorClass, getTypeIcon, getTypeLabel, validation functions)
- Custom hooks (useResguardoForm, useItemSelection, usePagination, etc.)
- Individual components (Header, FilterChips, ActionButtons, etc.)

**Focus Areas**:
- Utility functions with various inputs
- Hook state management and side effects
- Component rendering with different props
- Edge cases (empty data, null values, etc.)

**Example Unit Tests**:
```typescript
// Utility function test
describe('getColorClass', () => {
  it('should return correct color class for dark mode', () => {
    const result = getColorClass('Test Value', true);
    expect(result).toContain('bg-');
    expect(result).toContain('text-');
  });
  
  it('should handle null values', () => {
    const result = getColorClass(null, false);
    expect(result).toContain('bg-gray-100');
  });
});

// Hook test
describe('useResguardoForm', () => {
  it('should initialize with provided folio', () => {
    const { result } = renderHook(() => useResguardoForm('RES-20240101-001'));
    expect(result.current.formData.folio).toBe('RES-20240101-001');
  });
  
  it('should update field correctly', () => {
    const { result } = renderHook(() => useResguardoForm(''));
    act(() => {
      result.current.updateField('area', 'Test Area');
    });
    expect(result.current.formData.area).toBe('Test Area');
  });
});
```

#### 2. Property-Based Testing

**Purpose**: Verify behavioral equivalence across many generated inputs

**Scope**:
- Search and filtering logic
- Item selection validation
- Form state management
- Data transformations

**Configuration**:
- Minimum 100 iterations per property test
- Use fast-check library for TypeScript
- Tag each test with feature name and property number

**Property Tests**:

Each correctness property from the design document should be implemented as a property-based test:

```typescript
// Property 1: Search and Filter Equivalence
describe('Feature: resguardos-crear-componentization, Property 1: Search and Filter Equivalence', () => {
  it('should return same filtered results as original', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.array(fc.record({
          term: fc.string(),
          type: fc.constantFrom('id', 'descripcion', 'rubro', 'estado', 'area', 'usufinal')
        })),
        (searchTerm, filters) => {
          const originalResults = originalFilterLogic(searchTerm, filters);
          const refactoredResults = refactoredFilterLogic(searchTerm, filters);
          expect(refactoredResults).toEqual(originalResults);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 2: Selection Validation Equivalence
describe('Feature: resguardos-crear-componentization, Property 2: Selection Validation Equivalence', () => {
  it('should produce same validation results as original', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          usufinal: fc.string(),
          area: fc.string()
        })),
        (items) => {
          const originalValidation = originalSelectionValidation(items);
          const refactoredValidation = refactoredSelectionValidation(items);
          expect(refactoredValidation).toEqual(originalValidation);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### 3. Integration Testing

**Purpose**: Verify components work together correctly

**Scope**:
- Component composition in main orchestrator
- Hook interactions
- Data flow between components
- Modal triggering and display

**Focus Areas**:
- User workflows (search → select → submit)
- Error scenarios (conflicts, missing data)
- State synchronization between components

**Example Integration Tests**:
```typescript
describe('Resguardo Creation Flow', () => {
  it('should complete full workflow from search to submission', async () => {
    render(<CrearResguardos />);
    
    // Search for items
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Select items
    const checkboxes = await screen.findAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    
    // Fill form
    const directorInput = screen.getByLabelText(/director/i);
    fireEvent.change(directorInput, { target: { value: 'Test Director' } });
    
    // Submit
    const submitButton = screen.getByText(/guardar resguardo/i);
    fireEvent.click(submitButton);
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/resguardo.*creado/i)).toBeInTheDocument();
    });
  });
});
```

#### 4. Visual Regression Testing

**Purpose**: Ensure UI looks identical after refactoring

**Scope**:
- All components in light and dark mode
- All modal dialogs
- Responsive layouts
- Hover and focus states

**Tools**: Storybook with Chromatic or Percy

**Approach**:
- Create stories for each component with various states
- Capture screenshots before and after refactoring
- Compare screenshots pixel-by-pixel
- Flag any visual differences for review

#### 5. Manual Testing

**Purpose**: Verify user experience and edge cases

**Test Cases**:
1. Search and filter various inventory items
2. Select items with same/different usufinal
3. Select items with same/different area
4. Complete director data when missing
5. Create resguardo and download PDF
6. Test keyboard navigation
7. Test screen reader compatibility
8. Test responsive behavior on mobile
9. Test dark mode toggle
10. Test realtime data updates

### Testing Priorities

**High Priority** (Must test before deployment):
1. Property-based tests for behavioral equivalence
2. Integration tests for critical workflows
3. Manual testing of PDF generation
4. Manual testing of database operations

**Medium Priority** (Should test):
1. Unit tests for all hooks
2. Unit tests for utility functions
3. Visual regression tests
4. Accessibility testing

**Low Priority** (Nice to have):
1. Unit tests for simple components
2. Performance benchmarks
3. Load testing

### Test Data

**Approach**: Use a combination of:
1. **Real data**: Copy of production database (anonymized)
2. **Generated data**: Property-based test generators
3. **Edge cases**: Manually crafted scenarios (empty strings, null values, special characters)

### Continuous Integration

**Strategy**:
1. Run unit tests on every commit
2. Run integration tests on every pull request
3. Run property-based tests (with reduced iterations) on every pull request
4. Run full property-based tests (100+ iterations) nightly
5. Run visual regression tests on every pull request
6. Require all tests to pass before merging

### Success Criteria

The refactoring is considered successful when:
1. All property-based tests pass (100% behavioral equivalence)
2. All unit tests pass
3. All integration tests pass
4. Visual regression tests show no unintended differences
5. Manual testing confirms all features work correctly
6. Performance is maintained or improved
7. No new bugs are introduced

### Test Maintenance

After refactoring:
1. Keep property-based tests as regression tests
2. Add new tests for any bug fixes
3. Update tests when requirements change
4. Review and refactor tests periodically
5. Maintain test documentation

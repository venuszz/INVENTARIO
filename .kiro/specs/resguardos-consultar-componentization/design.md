# Design Document: Resguardos Consultar Component Componentization

## Overview

This design document outlines the refactoring of the monolithic `src/components/resguardos/consultar.tsx` component (~1954 lines) into a modular, maintainable architecture. The refactoring follows the established pattern from `src/components/resguardos/crear/`, organizing code into logical units while preserving all existing functionality, UI/UX, and behavior.

### Goals

1. **Modularity**: Break down the monolithic component into focused, single-responsibility components
2. **Maintainability**: Create a clear structure that's easy to navigate and modify
3. **Reusability**: Extract common patterns into reusable components and hooks
4. **Testability**: Separate business logic from UI for easier testing
5. **Consistency**: Follow the pattern established in `crear/` component
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
src/components/resguardos/consultar/
├── index.tsx                          # Main orchestrator component
├── types.ts                           # All TypeScript interfaces
├── utils.ts                           # Utility functions
├── components/                        # UI components
│   ├── Header.tsx
│   ├── SearchBar.tsx
│   ├── AdvancedFilters.tsx
│   ├── ResguardosTable.tsx
│   ├── Pagination.tsx
│   ├── ResguardoDetailsPanel.tsx
│   ├── ArticulosListPanel.tsx
│   └── LoadingOverlay.tsx
├── modals/                            # Modal dialogs
│   ├── PDFDownloadModal.tsx
│   ├── PDFBajaModal.tsx
│   ├── DeleteAllModal.tsx
│   ├── DeleteItemModal.tsx
│   ├── DeleteSelectedModal.tsx
│   ├── ErrorAlert.tsx
│   └── SuccessAlert.tsx
└── hooks/                             # Custom hooks
    ├── useResguardosData.ts
    ├── useResguardoDetails.ts
    ├── useResguardoDelete.ts
    ├── useResguardantesEdit.ts
    ├── usePDFGeneration.ts
    └── useArticuloSelection.ts
```

### Component Hierarchy

```
ConsultarResguardos (index.tsx)
├── LoadingOverlay (conditional - for folioParam loading)
├── Header
├── SearchBar
├── AdvancedFilters
├── ResguardosTable
│   └── Pagination
└── ResguardoDetailsPanel (conditional - when folio selected)
    └── ArticulosListPanel

Modals (conditional rendering)
├── PDFDownloadModal
├── PDFBajaModal
├── DeleteAllModal
├── DeleteItemModal
├── DeleteSelectedModal
├── ErrorAlert
└── SuccessAlert
```

### Data Flow

1. **Initialization**: Main component initializes all hooks
2. **Data Loading**: `useResguardosData` fetches resguardos with filters and pagination
3. **Folio Parameter**: If folioParam exists, automatically load that resguardo's details
4. **User Interaction**: User searches, filters, or clicks on a folio
5. **Details Loading**: `useResguardoDetails` fetches articles for selected folio
6. **State Updates**: Components call hook functions to update state
7. **Edit/Delete**: User edits resguardantes or deletes articles
8. **PDF Generation**: `usePDFGeneration` creates PDF data for download


## Components and Interfaces

### Core Components

#### 1. Header Component

**Purpose**: Display page title and resguardos counter

**Props**:
```typescript
interface HeaderProps {
  totalResguardos: number;
}
```

**Responsibilities**:
- Render page title with icon
- Display total resguardos count with animation

#### 2. SearchBar Component

**Purpose**: Provide search input for folio search

**Props**:
```typescript
interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}
```

**Responsibilities**:
- Render search input with icon
- Handle debounced search (100ms)
- Clear search functionality

#### 3. AdvancedFilters Component

**Purpose**: Provide advanced filtering options (date range, director, resguardante)

**Props**:
```typescript
interface AdvancedFiltersProps {
  startDate: string;
  endDate: string;
  selectedDirector: string;
  selectedResguardante: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onDirectorChange: (value: string) => void;
  onResguardanteChange: (value: string) => void;
  onClearFilters: () => void;
  directores: string[];
  resguardantes: string[];
}
```

**Responsibilities**:
- Render date range inputs
- Render director select dropdown
- Render resguardante select dropdown
- Show clear filters button
- Handle filter changes

#### 4. ResguardosTable Component

**Purpose**: Display paginated resguardos with sorting

**Props**:
```typescript
interface ResguardosTableProps {
  resguardos: Resguardo[];
  selectedFolio: string | null;
  onFolioClick: (folio: string) => void;
  sortField: keyof Resguardo;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Resguardo) => void;
  loading: boolean;
}
```

**Responsibilities**:
- Render table header with sortable columns
- Render table rows with folio, fecha, director, resguardantes
- Show resguardantes tooltip on hover
- Highlight selected folio row
- Handle row click to load details
- Show loading skeleton when loading

#### 5. Pagination Component

**Purpose**: Provide pagination controls

**Props**:
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}
```

**Responsibilities**:
- Display current page and total pages
- Provide previous/next buttons
- Provide rows per page selector (10, 25, 50, 100)
- Show total items count

#### 6. ResguardoDetailsPanel Component

**Purpose**: Display resguardo details and header information

**Props**:
```typescript
interface ResguardoDetailsPanelProps {
  folio: string;
  fecha: string;
  director: string;
  onClose: () => void;
  onGeneratePDF: () => void;
  onDeleteAll: () => void;
  children: React.ReactNode;
}
```

**Responsibilities**:
- Display folio, fecha, director
- Provide close button
- Provide "Generar PDF" button
- Provide "Borrar Resguardo Completo" button
- Render children (ArticulosListPanel)
- Auto-scroll to panel on mobile

#### 7. ArticulosListPanel Component

**Purpose**: Display and manage articles grouped by resguardante

**Props**:
```typescript
interface ArticulosListPanelProps {
  articulos: ResguardoArticulo[];
  editingResguardante: { [key: string]: boolean };
  editedResguardantes: { [key: string]: string };
  selectedArticulos: string[];
  onToggleEdit: (articuloId: string) => void;
  onResguardanteChange: (articuloId: string, value: string) => void;
  onSaveResguardante: (articuloId: string) => void;
  onCancelEdit: (articuloId: string) => void;
  onToggleSelection: (articuloId: string) => void;
  onDeleteSelected: () => void;
  onDeleteSingle: (articuloId: string) => void;
  onGeneratePDFByResguardante: (resguardante: string) => void;
}
```

**Responsibilities**:
- Group articles by resguardante
- Display resguardante headers with article count
- Show "Generar PDF" button per resguardante
- Render article cards with details
- Show edit mode for resguardante field
- Show selection checkboxes
- Show delete buttons (individual and selected)
- Display selected count when items are selected

#### 8. LoadingOverlay Component

**Purpose**: Display loading overlay when loading folio from parameter

**Props**:
```typescript
interface LoadingOverlayProps {
  show: boolean;
}
```

**Responsibilities**:
- Render full-screen overlay with spinner
- Show loading message
- Prevent interaction while loading

### Modal Components

#### 1. PDFDownloadModal

**Purpose**: Prompt to download PDF of resguardo

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

**Responsibilities**:
- Display modal with PDF preview info
- Show "Descargar PDF" button
- Show "Cerrar" button
- Handle PDF generation and download

#### 2. PDFBajaModal

**Purpose**: Prompt to download PDF of baja after deletion

**Props**:
```typescript
interface PDFBajaModalProps {
  show: boolean;
  pdfData: PdfDataBaja | null;
  onDownload: () => void;
  onClose: () => void;
  isGenerating: boolean;
}
```

**Responsibilities**:
- Display modal with baja PDF info
- Show folio de baja
- Show "Descargar PDF" button
- Show "Cerrar" button
- Handle baja PDF generation and download

#### 3. DeleteAllModal

**Purpose**: Confirm deletion of entire resguardo

**Props**:
```typescript
interface DeleteAllModalProps {
  show: boolean;
  folio: string;
  articulosCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}
```

**Responsibilities**:
- Display warning message
- Show folio and articles count
- Show "Confirmar" button
- Show "Cancelar" button
- Disable buttons while deleting

#### 4. DeleteItemModal

**Purpose**: Confirm deletion of single article

**Props**:
```typescript
interface DeleteItemModalProps {
  show: boolean;
  articulo: ResguardoArticulo | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}
```

**Responsibilities**:
- Display warning message
- Show article details (id_inv, descripcion)
- Show "Confirmar" button
- Show "Cancelar" button
- Disable buttons while deleting

#### 5. DeleteSelectedModal

**Purpose**: Confirm deletion of multiple selected articles

**Props**:
```typescript
interface DeleteSelectedModalProps {
  show: boolean;
  selectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}
```

**Responsibilities**:
- Display warning message
- Show selected count
- Show "Confirmar" button
- Show "Cancelar" button
- Disable buttons while deleting

#### 6. ErrorAlert

**Purpose**: Display error messages

**Props**:
```typescript
interface ErrorAlertProps {
  show: boolean;
  message: string;
  onClose: () => void;
}
```

**Responsibilities**:
- Display error icon and message
- Auto-dismiss after 5 seconds
- Provide close button

#### 7. SuccessAlert

**Purpose**: Display success messages

**Props**:
```typescript
interface SuccessAlertProps {
  show: boolean;
  message: string;
  onClose: () => void;
}
```

**Responsibilities**:
- Display success icon and message
- Auto-dismiss after 3 seconds
- Provide close button

### Custom Hooks

#### 1. useResguardosData

**Purpose**: Fetch and manage resguardos list with filters and pagination

**Interface**:
```typescript
interface UseResguardosDataReturn {
  resguardos: Resguardo[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  // Filters
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  selectedDirector: string;
  setSelectedDirector: (value: string) => void;
  selectedResguardante: string;
  setSelectedResguardante: (value: string) => void;
  clearFilters: () => void;
  // Sorting
  sortField: keyof Resguardo;
  sortDirection: 'asc' | 'desc';
  setSort: (field: keyof Resguardo) => void;
  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  totalPages: number;
  // Unique values for filters
  directores: string[];
  resguardantes: string[];
  // Refetch
  refetch: () => Promise<void>;
}

function useResguardosData(): UseResguardosDataReturn
```

**Responsibilities**:
- Fetch resguardos from database with filters
- Group by folio único (distinct folios)
- Aggregate resguardantes per folio
- Apply search filter (debounced 100ms)
- Apply date range filter
- Apply director filter
- Apply resguardante filter
- Apply sorting
- Apply pagination
- Calculate total pages
- Extract unique directores and resguardantes for filter dropdowns
- Handle loading and error states
- Provide refetch function

**Implementation Details**:
- Use `useDeferredValue` for search debouncing
- Query `resguardos` table with joins to get director names
- Use `GROUP BY folio` to get unique folios
- Use `STRING_AGG` or similar to concatenate resguardantes
- Count total matching records for pagination
- Reset to page 1 when filters change

#### 2. useResguardoDetails

**Purpose**: Fetch and manage details of a specific resguardo

**Interface**:
```typescript
interface UseResguardoDetailsReturn {
  selectedFolio: string | null;
  resguardoDetails: ResguardoDetalle | null;
  articulos: ResguardoArticulo[];
  loading: boolean;
  error: string | null;
  selectFolio: (folio: string) => Promise<void>;
  clearSelection: () => void;
  refetch: () => Promise<void>;
}

function useResguardoDetails(): UseResguardoDetailsReturn
```

**Responsibilities**:
- Fetch resguardo details by folio
- Fetch all articles for the folio
- Join with muebles/mueblesitea to get full article data
- Handle loading and error states
- Provide selection and clear functions
- Auto-scroll to details panel on mobile
- Provide refetch function

**Implementation Details**:
- Query `resguardos` table by folio
- Get first record for header info (folio, fecha, director)
- Query all records for articles list
- Join with appropriate muebles table based on origen
- Use `useEffect` to scroll to details panel after loading

#### 3. useResguardoDelete

**Purpose**: Handle deletion of resguardos (individual, multiple, complete)

**Interface**:
```typescript
interface UseResguardoDeleteReturn {
  deleteArticulo: (articuloId: string) => Promise<void>;
  deleteSelected: (articuloIds: string[]) => Promise<void>;
  deleteAll: (folio: string) => Promise<void>;
  deleting: boolean;
  error: string | null;
  success: string | null;
  pdfBajaData: PdfDataBaja | null;
  clearMessages: () => void;
}

function useResguardoDelete(
  onSuccess: () => void
): UseResguardoDeleteReturn
```

**Responsibilities**:
- Generate folio de baja
- Move records to `resguardos_bajas` table
- Delete records from `resguardos` table
- Clear area, usufinal, resguardante in muebles/mueblesitea
- Generate PDF baja data
- Handle loading and error states
- Show success message
- Call onSuccess callback to refetch data

**Implementation Details**:
- Use `useFolioGenerator` to generate baja folio
- Transaction: insert into resguardos_bajas, delete from resguardos, update muebles
- Set fields to empty string (not null) in muebles tables
- Create PdfDataBaja with deleted articles
- Handle errors and rollback if needed

#### 4. useResguardantesEdit

**Purpose**: Handle editing of resguardante field for articles

**Interface**:
```typescript
interface UseResguardantesEditReturn {
  editingResguardante: { [key: string]: boolean };
  editedResguardantes: { [key: string]: string };
  toggleEdit: (articuloId: string, currentValue: string) => void;
  updateResguardante: (articuloId: string, value: string) => void;
  saveResguardante: (articuloId: string, origen: string) => Promise<void>;
  cancelEdit: (articuloId: string) => void;
  saving: boolean;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

function useResguardantesEdit(
  onSuccess: () => void
): UseResguardantesEditReturn
```

**Responsibilities**:
- Track editing state per article
- Track edited values per article
- Toggle edit mode
- Update edited value
- Save to database (resguardos table AND muebles table)
- Cancel edit and revert value
- Handle loading and error states
- Show success message
- Call onSuccess callback to refetch data

**Implementation Details**:
- Maintain two state objects: editingResguardante and editedResguardantes
- On save: update both `resguardos` table and appropriate `muebles` table
- Use transaction to ensure consistency
- Clear editing state after successful save

#### 5. usePDFGeneration

**Purpose**: Generate PDF data for resguardos and bajas

**Interface**:
```typescript
interface UsePDFGenerationReturn {
  generateResguardoPDF: (folio: string, resguardante?: string) => Promise<PdfData | null>;
  generateBajaPDF: (folioBaja: string, articulos: ResguardoArticulo[]) => Promise<PdfDataBaja | null>;
  generating: boolean;
  error: string | null;
}

function usePDFGeneration(): UsePDFGenerationReturn
```

**Responsibilities**:
- Fetch resguardo data by folio
- Filter by resguardante if specified
- Fetch firmas from database
- Create PdfData structure
- Create PdfDataBaja structure
- Handle loading and error states

**Implementation Details**:
- Query resguardos with joins to get all data
- Query firmas table for signatures
- Format data according to PdfData/PdfDataBaja interfaces
- Return null on error

#### 6. useArticuloSelection

**Purpose**: Handle multiple article selection for batch operations

**Interface**:
```typescript
interface UseArticuloSelectionReturn {
  selectedArticulos: string[];
  toggleSelection: (articuloId: string) => void;
  clearSelection: () => void;
  selectAll: (articuloIds: string[]) => void;
  isSelected: (articuloId: string) => boolean;
  selectedCount: number;
}

function useArticuloSelection(): UseArticuloSelectionReturn
```

**Responsibilities**:
- Manage selected articles state
- Toggle individual selection
- Clear all selections
- Select all articles
- Check if article is selected
- Provide selected count

**Implementation Details**:
- Use Set for efficient lookups
- Convert to array for rendering


## Data Models

### Resguardo (Grouped Resguardo)

```typescript
interface Resguardo {
  folio: string;                       // Unique folio identifier
  fecha: string;                       // Date of resguardo
  director: string;                    // Director name
  resguardantes: string;               // Comma-separated resguardantes
}
```

### ResguardoDetalle (Resguardo Details)

```typescript
interface ResguardoDetalle {
  folio: string;                       // Unique folio identifier
  fecha: string;                       // Date of resguardo
  director: string;                    // Director name
}
```

### ResguardoArticulo (Resguardo Article)

```typescript
interface ResguardoArticulo {
  id: string;                          // UUID from resguardos table
  folio: string;                       // Folio identifier
  id_inv: string | null;               // Inventory number
  descripcion: string | null;          // Item description
  rubro: string | null;                // Category
  estado: string | null;               // Condition (B/R/M/N)
  resguardante: string;                // Custodian name
  origen: string;                      // Source (INEA/ITEA/TLAXCALA)
  id_directorio: number;               // Director ID
  area: string | null;                 // Area
  puesto: string | null;               // Position
}
```

### PdfData (PDF Generation Data for Resguardo)

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

### PdfDataBaja (PDF Generation Data for Baja)

```typescript
interface PdfDataBaja {
  folioBaja: string;
  folioOriginal: string;
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

## Utility Functions

### getExactArticulo

**Purpose**: Get exact article data from muebles table by ID

**Signature**:
```typescript
async function getExactArticulo(
  id_inv: string,
  origen: string
): Promise<any | null>
```

**Responsibilities**:
- Query appropriate muebles table based on origen
- Return full article data
- Return null if not found

### limpiarDatosArticulo

**Purpose**: Clear resguardo-related fields in muebles table

**Signature**:
```typescript
async function limpiarDatosArticulo(
  id_inv: string,
  origen: string
): Promise<void>
```

**Responsibilities**:
- Update muebles table to clear area, usufinal, resguardante
- Set fields to empty string (not null)
- Handle errors

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Search and Filter Equivalence

*For any* search term and any combination of filters (date range, director, resguardante), the refactored system SHALL return the exact same filtered resguardos as the original system, in the same order.

**Validates: Requirements 5.1.1**

**Testing Approach**: Generate random search terms and filter combinations, compare filtered results between original and refactored implementations.

### Property 2: Resguardo Details Equivalence

*For any* folio selection, the refactored system SHALL return the exact same resguardo details and articles list as the original system, grouped by resguardante in the same order.

**Validates: Requirements 5.1.3**

**Testing Approach**: Generate random folio selections, compare details and articles between implementations.

### Property 3: Resguardante Edit Equivalence

*For any* resguardante edit operation, the refactored system SHALL update the same database records (resguardos table and muebles table) with the same values as the original system.

**Validates: Requirements 5.1.4**

**Testing Approach**: Generate random edit operations, verify database state matches between implementations.

### Property 4: Article Deletion Equivalence

*For any* article deletion operation (single, multiple, or complete resguardo), the refactored system SHALL:
- Generate the same folio de baja
- Move the same records to resguardos_bajas
- Delete the same records from resguardos
- Clear the same fields in muebles tables
- Generate the same PDF baja data

as the original system.

**Validates: Requirements 5.1.5**

**Testing Approach**: Generate random deletion scenarios, compare database state and PDF data between implementations.

### Property 5: PDF Generation Equivalence

*For any* PDF generation request (resguardo or baja, with or without resguardante filter), the refactored system SHALL generate identical PDF data as the original system.

**Validates: Requirements 5.1.6**

**Testing Approach**: Generate random PDF requests, compare PDF data structures between implementations.

### Property 6: Folio Parameter Loading Equivalence

*For any* folio parameter provided in the URL, the refactored system SHALL:
- Load the same resguardo details
- Scroll to the same position
- Display the same loading overlay

as the original system.

**Validates: Requirements 5.1.7**

**Testing Approach**: Generate random folio parameters, verify loading behavior and final state match between implementations.

### Property 7: Article Selection Equivalence

*For any* sequence of article selection operations, the refactored system SHALL maintain the same selection state as the original system.

**Validates: Requirements 5.1.8**

**Testing Approach**: Generate random selection sequences, verify selection state matches between implementations.

### Property 8: Pagination and Sorting Equivalence

*For any* pagination or sorting operation, the refactored system SHALL display the same resguardos in the same order as the original system.

**Validates: Requirements 5.1.2**

**Testing Approach**: Generate random pagination and sorting operations, compare displayed data between implementations.

### Property 9: Component Rendering Consistency

*For any* component in the refactored system, when rendered with the same props and context, it SHALL produce the same DOM structure and styling as the corresponding section in the original system.

**Validates: Requirements 6.2, 7.2**

**Testing Approach**: Snapshot testing for each component with various prop combinations, compare rendered output.

## Error Handling

### Error Categories

1. **Data Loading Errors**
   - Network failures when fetching resguardos
   - Database query errors
   - Missing or malformed data

2. **Validation Errors**
   - Invalid folio parameter
   - Missing required fields for edit
   - Invalid resguardante value

3. **Deletion Errors**
   - Database write failures during deletion
   - Folio generation failures for baja
   - Transaction rollback failures

4. **Edit Errors**
   - Database update failures
   - Concurrent modification conflicts

5. **PDF Generation Errors**
   - Missing data for PDF
   - Firmas fetch failures

### Error Handling Strategy

#### Data Loading Errors

**Detection**: Try-catch blocks in `useResguardosData` and `useResguardoDetails` hooks

**Response**:
- Set error state with descriptive message
- Display error alert
- Log error to console for debugging
- Maintain previous data if available

**Recovery**:
- Provide retry button to refetch data
- Clear error state on successful retry

#### Validation Errors

**Detection**: Validation logic in hooks before operations

**Response**:
- Prevent invalid operations
- Display error alert with explanation
- Log validation failure

**Recovery**:
- User corrects input
- Validation re-runs automatically

#### Deletion Errors

**Detection**: Try-catch blocks in `useResguardoDelete` hook

**Response**:
- Set error state with descriptive message
- Display error alert
- Log detailed error to console
- Rollback transaction if possible

**Recovery**:
- User can retry deletion
- State is preserved for retry

#### Edit Errors

**Detection**: Try-catch blocks in `useResguardantesEdit` hook

**Response**:
- Set error state with descriptive message
- Display error alert
- Revert to original value
- Log error to console

**Recovery**:
- User can retry edit
- Original value is preserved

#### PDF Generation Errors

**Detection**: Try-catch blocks in `usePDFGeneration` hook

**Response**:
- Set error state with descriptive message
- Display error alert
- Log error to console
- Return null PDF data

**Recovery**:
- User can retry PDF generation
- Modal remains open for retry

### Error State Management

All error states are managed in custom hooks and passed to components via props. This ensures:
- Centralized error handling logic
- Consistent error display across components
- Easy testing of error scenarios
- Clear separation of concerns

### Error Messages

All error messages are preserved from the original implementation to maintain consistency:
- "Error al cargar los resguardos"
- "Error al cargar los detalles del resguardo"
- "Error al eliminar el artículo"
- "Error al eliminar los artículos seleccionados"
- "Error al eliminar el resguardo completo"
- "Error al actualizar el resguardante"
- "Error al generar el PDF"
- "Error al generar el folio de baja"

### Success Messages

All success messages are preserved from the original implementation:
- "Artículo eliminado correctamente"
- "Artículos eliminados correctamente"
- "Resguardo eliminado correctamente"
- "Resguardante actualizado correctamente"

## Testing Strategy

### Overview

The testing strategy for this refactoring focuses on ensuring behavioral equivalence between the original monolithic component and the refactored modular structure. Since this is a refactoring (not new feature development), the primary goal is to verify that all existing functionality is preserved.

### Testing Approach

#### 1. Unit Testing

**Purpose**: Verify individual components and hooks work correctly in isolation

**Scope**:
- Utility functions (getExactArticulo, limpiarDatosArticulo)
- Custom hooks (useResguardosData, useResguardoDetails, useResguardoDelete, etc.)
- Individual components (Header, SearchBar, ResguardosTable, etc.)

**Focus Areas**:
- Utility functions with various inputs
- Hook state management and side effects
- Component rendering with different props
- Edge cases (empty data, null values, etc.)

**Example Unit Tests**:
```typescript
// Utility function test
describe('getExactArticulo', () => {
  it('should fetch article from correct table based on origen', async () => {
    const result = await getExactArticulo('INV-001', 'INEA');
    expect(result).toBeDefined();
    expect(result.id_inv).toBe('INV-001');
  });
  
  it('should return null for non-existent article', async () => {
    const result = await getExactArticulo('INVALID', 'INEA');
    expect(result).toBeNull();
  });
});

// Hook test
describe('useResguardosData', () => {
  it('should initialize with empty filters', () => {
    const { result } = renderHook(() => useResguardosData());
    expect(result.current.searchTerm).toBe('');
    expect(result.current.selectedDirector).toBe('');
    expect(result.current.selectedResguardante).toBe('');
  });
  
  it('should apply search filter correctly', async () => {
    const { result } = renderHook(() => useResguardosData());
    act(() => {
      result.current.setSearchTerm('RES-2024');
    });
    await waitFor(() => {
      expect(result.current.resguardos.every(r => 
        r.folio.includes('RES-2024')
      )).toBe(true);
    });
  });
});
```

#### 2. Property-Based Testing

**Purpose**: Verify behavioral equivalence across many generated inputs

**Scope**:
- Search and filtering logic
- Resguardo details loading
- Article deletion logic
- Resguardante editing logic
- PDF generation logic

**Configuration**:
- Minimum 100 iterations per property test
- Use fast-check library for TypeScript
- Tag each test with feature name and property number

**Property Tests**:

Each correctness property from the design document should be implemented as a property-based test:

```typescript
// Property 1: Search and Filter Equivalence
describe('Feature: resguardos-consultar-componentization, Property 1: Search and Filter Equivalence', () => {
  it('should return same filtered results as original', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.date(),
        fc.date(),
        fc.string(),
        fc.string(),
        (searchTerm, startDate, endDate, director, resguardante) => {
          const originalResults = originalFilterLogic(searchTerm, startDate, endDate, director, resguardante);
          const refactoredResults = refactoredFilterLogic(searchTerm, startDate, endDate, director, resguardante);
          expect(refactoredResults).toEqual(originalResults);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 3: Resguardante Edit Equivalence
describe('Feature: resguardos-consultar-componentization, Property 3: Resguardante Edit Equivalence', () => {
  it('should update same database records as original', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string(),
        fc.constantFrom('INEA', 'ITEA', 'TLAXCALA'),
        async (articuloId, newResguardante, origen) => {
          const originalState = await originalEditLogic(articuloId, newResguardante, origen);
          const refactoredState = await refactoredEditLogic(articuloId, newResguardante, origen);
          expect(refactoredState).toEqual(originalState);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 4: Article Deletion Equivalence
describe('Feature: resguardos-consultar-componentization, Property 4: Article Deletion Equivalence', () => {
  it('should produce same database state after deletion as original', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid()),
        async (articuloIds) => {
          const originalState = await originalDeleteLogic(articuloIds);
          const refactoredState = await refactoredDeleteLogic(articuloIds);
          expect(refactoredState).toEqual(originalState);
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
- User workflows (search → select folio → view details → edit/delete)
- Error scenarios (deletion failures, edit conflicts)
- State synchronization between components

**Example Integration Tests**:
```typescript
describe('Consultar Resguardos Flow', () => {
  it('should complete full workflow from search to details view', async () => {
    render(<ConsultarResguardos />);
    
    // Search for resguardo
    const searchInput = screen.getByPlaceholderText(/buscar por folio/i);
    fireEvent.change(searchInput, { target: { value: 'RES-2024' } });
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/RES-2024/)).toBeInTheDocument();
    });
    
    // Click on folio
    const folioRow = screen.getByText(/RES-2024/);
    fireEvent.click(folioRow);
    
    // Verify details panel appears
    await waitFor(() => {
      expect(screen.getByText(/Detalles del Resguardo/i)).toBeInTheDocument();
    });
  });
  
  it('should edit resguardante successfully', async () => {
    render(<ConsultarResguardos />);
    
    // ... load details ...
    
    // Click edit button
    const editButton = screen.getByLabelText(/editar resguardante/i);
    fireEvent.click(editButton);
    
    // Change value
    const input = screen.getByDisplayValue(/current resguardante/i);
    fireEvent.change(input, { target: { value: 'New Resguardante' } });
    
    // Save
    const saveButton = screen.getByLabelText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/actualizado correctamente/i)).toBeInTheDocument();
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
- Loading states

**Tools**: Storybook with Chromatic or Percy

**Approach**:
- Create stories for each component with various states
- Capture screenshots before and after refactoring
- Compare screenshots pixel-by-pixel
- Flag any visual differences for review

#### 5. Manual Testing

**Purpose**: Verify user experience and edge cases

**Test Cases**:
1. Search resguardos by folio
2. Filter by date range
3. Filter by director
4. Filter by resguardante
5. Sort by different columns
6. Change pagination settings
7. Click on folio to view details
8. Edit resguardante and save
9. Delete single article
10. Select multiple articles and delete
11. Delete entire resguardo
12. Generate PDF for resguardo
13. Generate PDF for specific resguardante
14. Download PDF de baja after deletion
15. Load resguardo from URL parameter
16. Test keyboard navigation
17. Test screen reader compatibility
18. Test responsive behavior on mobile
19. Test dark mode toggle

### Testing Priorities

**High Priority** (Must test before deployment):
1. Property-based tests for behavioral equivalence
2. Integration tests for critical workflows
3. Manual testing of deletion operations
4. Manual testing of PDF generation
5. Manual testing of database operations

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

## Implementation Plan

### Phase 1: Setup and Preparation

1. Create folder structure
2. Create `types.ts` with all interfaces
3. Create `utils.ts` with utility functions
4. Set up test infrastructure

### Phase 2: Extract Hooks

1. Implement `useResguardosData` hook
2. Implement `useResguardoDetails` hook
3. Implement `useResguardoDelete` hook
4. Implement `useResguardantesEdit` hook
5. Implement `usePDFGeneration` hook
6. Implement `useArticuloSelection` hook
7. Write unit tests for each hook

### Phase 3: Create UI Components

1. Implement `Header` component
2. Implement `SearchBar` component
3. Implement `AdvancedFilters` component
4. Implement `ResguardosTable` component
5. Implement `Pagination` component
6. Implement `ResguardoDetailsPanel` component
7. Implement `ArticulosListPanel` component
8. Implement `LoadingOverlay` component
9. Write unit tests for each component

### Phase 4: Create Modal Components

1. Implement `PDFDownloadModal` component
2. Implement `PDFBajaModal` component
3. Implement `DeleteAllModal` component
4. Implement `DeleteItemModal` component
5. Implement `DeleteSelectedModal` component
6. Implement `ErrorAlert` component
7. Implement `SuccessAlert` component
8. Write unit tests for each modal

### Phase 5: Create Main Orchestrator

1. Implement `index.tsx` main component
2. Wire up all hooks
3. Wire up all components
4. Wire up all modals
5. Handle folio parameter loading
6. Write integration tests

### Phase 6: Testing and Validation

1. Run all unit tests
2. Run all integration tests
3. Run property-based tests
4. Run visual regression tests
5. Perform manual testing
6. Fix any issues found

### Phase 7: Migration

1. Update imports in parent components
2. Verify no breaking changes
3. Deploy to staging
4. Perform final testing
5. Deploy to production
6. Monitor for issues

## Migration Notes

### Import Changes

**Before**:
```typescript
import ConsultarResguardos from '@/components/resguardos/consultar';
```

**After**:
```typescript
import ConsultarResguardos from '@/components/resguardos/consultar';
// No change needed - index.tsx exports the component
```

### Component Usage

No changes needed in parent components. The component interface remains the same:

```typescript
<ConsultarResguardos folioParam={folioParam} />
```

### Database Schema

No database schema changes required. All database operations remain the same.

### Dependencies

No new dependencies required. All existing dependencies are maintained.

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Use `useMemo` for expensive computations (filtering, sorting)
2. **Debouncing**: Use `useDeferredValue` for search input (100ms delay)
3. **Pagination**: Limit database queries to current page only
4. **Lazy Loading**: Load resguardo details only when folio is selected
5. **Virtual Scrolling**: Consider for large article lists (if needed)

### Performance Metrics

Track and maintain:
- Initial load time
- Search response time
- Details load time
- Edit save time
- Delete operation time
- PDF generation time

### Performance Testing

Compare performance metrics between original and refactored implementations:
- Measure render times
- Measure database query times
- Measure user interaction response times
- Ensure no regression in performance

## Accessibility Considerations

### WCAG Compliance

Maintain existing accessibility features:
- Keyboard navigation for all interactive elements
- ARIA labels for buttons and inputs
- Focus management for modals
- Screen reader announcements for state changes
- Color contrast ratios
- Focus indicators

### Keyboard Navigation

Ensure all functionality is accessible via keyboard:
- Tab through interactive elements
- Enter to activate buttons
- Escape to close modals
- Arrow keys for table navigation (if implemented)

### Screen Reader Support

Provide appropriate ARIA attributes:
- `aria-label` for icon buttons
- `aria-describedby` for form fields
- `role="alert"` for error/success messages
- `aria-live` for dynamic content updates

## Security Considerations

### Data Validation

Maintain existing validation:
- Sanitize user inputs
- Validate folio format
- Validate resguardante values
- Prevent SQL injection (use parameterized queries)

### Authorization

Maintain existing authorization:
- Check user roles before operations
- Verify user has permission to edit/delete
- Protect sensitive data

### Error Messages

Avoid exposing sensitive information in error messages:
- Don't reveal database structure
- Don't expose internal IDs
- Provide user-friendly messages

## Conclusion

This design document provides a comprehensive plan for refactoring the ConsultarResguardos component from a monolithic structure to a modular architecture. The refactoring follows the established pattern from the CrearResguardos component, ensuring consistency across the codebase.

The key principles guiding this refactoring are:
1. **Zero Regression**: All existing functionality must be preserved
2. **Modularity**: Code is organized into focused, single-responsibility units
3. **Testability**: Business logic is separated from UI for easier testing
4. **Consistency**: Follows established patterns in the codebase
5. **Maintainability**: Clear structure that's easy to navigate and modify

By following this design, we ensure that the refactored component is more maintainable, testable, and consistent with the rest of the codebase, while preserving all existing functionality and behavior.

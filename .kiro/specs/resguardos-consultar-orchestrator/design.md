# Design: Resguardos Consultar Orchestrator Implementation

## 1. Architecture Overview

### 1.1 Component Structure
```
ConsultarResguardos (Orchestrator)
├── State Management Layer
│   ├── Hook Initialization
│   ├── Local UI State
│   └── State Coordination
├── Event Handlers Layer
│   ├── Selection Handlers
│   ├── Delete Handlers
│   ├── PDF Handlers
│   └── Navigation Handlers
└── Presentation Layer
    ├── Layout Container
    ├── Left Panel (List)
    │   ├── Header
    │   ├── SearchBar
    │   ├── AdvancedFilters
    │   ├── ResguardosTable
    │   └── Pagination
    ├── Right Panel (Details)
    │   ├── ResguardoDetailsPanel
    │   └── ArticulosListPanel
    └── Modals Layer
        ├── DeleteAllModal
        ├── DeleteItemModal
        ├── DeleteSelectedModal
        ├── PDFDownloadModal
        ├── PDFBajaModal
        └── ErrorAlert
```

### 1.2 Data Flow
```
User Action
    ↓
Event Handler
    ↓
Hook Method Call
    ↓
State Update
    ↓
Component Re-render
    ↓
UI Update
```

## 2. Hook Integration Design

### 2.1 useResguardosData Hook
**Purpose**: Manage resguardos list with search, filter, sort, pagination

**Integration**:
```typescript
const {
  // Data
  resguardos,
  foliosUnicos,
  allResguardos,
  loading,
  error,
  totalCount,
  
  // Search & Filters
  searchTerm,
  setSearchTerm,
  filterDate,
  setFilterDate,
  filterDirector,
  setFilterDirector,
  filterResguardante,
  setFilterResguardante,
  clearFilters,
  resetSearch,
  
  // Sorting
  sortField,
  sortDirection,
  handleSort,
  
  // Pagination
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  totalPages,
  
  // Actions
  refetch,
  clearError
} = useResguardosData();
```

**State Coordination**:
- Automatically refetches when filters change
- Resets to page 1 when filters change
- Debounces search input (100ms)

### 2.2 useResguardoDetails Hook
**Purpose**: Manage selected resguardo details

**Integration**:
```typescript
const {
  // Data
  selectedResguardo,
  loading,
  error,
  
  // Actions
  selectFolio,
  clearSelection,
  refetch,
  clearError
} = useResguardoDetails({
  onSuccess: () => {
    // Auto-scroll on mobile
    if (window.innerWidth < 768 && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
});
```

**State Coordination**:
- Clears selection when switching resguardos
- Triggers success callback after load
- Handles loading overlay for URL parameter

### 2.3 useResguardantesEdit Hook
**Purpose**: Manage resguardante editing

**Integration**:
```typescript
const {
  // State
  editMode,
  editedResguardantes,
  saving,
  error,
  
  // Actions
  toggleEditMode,
  updateResguardante,
  saveResguardantes,
  cancelEdit,
  clearError
} = useResguardantesEdit({
  selectedResguardo: resguardoDetails.selectedResguardo,
  onSuccess: () => {
    // Refetch details after save
    if (resguardoDetails.selectedResguardo) {
      resguardoDetails.refetch();
    }
  }
});
```

**State Coordination**:
- Syncs with selectedResguardo changes
- Resets edit mode on resguardo change
- Triggers refetch after successful save

### 2.4 useResguardoDelete Hook
**Purpose**: Manage deletion operations

**Integration**:
```typescript
const {
  // State
  deleting,
  error,
  pdfBajaData,
  
  // Actions
  deleteAll,
  deleteSingle,
  deleteSelected,
  clearError
} = useResguardoDelete({
  selectedResguardo: resguardoDetails.selectedResguardo,
  generateFolio,
  onSuccess: () => {
    // Refetch list and details
    resguardosData.refetch();
    if (resguardoDetails.selectedResguardo) {
      resguardoDetails.refetch();
    }
  },
  onBajaGenerated: (pdfData) => {
    // Show PDF baja modal
    setShowPDFBajaButton(true);
  }
});
```

**State Coordination**:
- Generates folio de baja
- Moves records to resguardos_bajas
- Clears muebles fields
- Triggers refetch after deletion

### 2.5 usePDFGeneration Hook
**Purpose**: Manage PDF generation

**Integration**:
```typescript
const {
  // Data
  pdfData,
  generating,
  error,
  
  // Actions
  preparePDFData,
  generatePDF,
  generateBajaPDF,
  clearError
} = usePDFGeneration({
  selectedResguardo: resguardoDetails.selectedResguardo
});
```

**State Coordination**:
- Prepares PDF data from resguardo
- Fetches firmas from database
- Handles PDF download

## 3. Component Integration Design

### 3.1 Header Component
**Props**:
```typescript
interface HeaderProps {
  totalResguardos: number;
  realtimeConnected: boolean;
}
```

**Integration**:
```tsx
<Header 
  totalResguardos={resguardosData.totalCount}
  realtimeConnected={realtimeConnected}
/>
```

### 3.2 SearchBar Component
**Props**:
```typescript
interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  onRefresh: () => void;
  loading: boolean;
}
```

**Integration**:
```tsx
<SearchBar
  searchTerm={resguardosData.searchTerm}
  onSearchChange={resguardosData.setSearchTerm}
  onReset={resguardosData.resetSearch}
  onRefresh={() => {
    resguardoDetails.clearSelection();
    resguardosData.refetch();
  }}
  loading={resguardosData.loading}
/>
```

### 3.3 AdvancedFilters Component
**Props**:
```typescript
interface AdvancedFiltersProps {
  filterDate: string;
  filterDirector: string;
  filterResguardante: string;
  onDateChange: (value: string) => void;
  onDirectorChange: (value: string) => void;
  onResguardanteChange: (value: string) => void;
  onClearFilters: () => void;
}
```

**Integration**:
```tsx
<AdvancedFilters
  filterDate={resguardosData.filterDate}
  filterDirector={resguardosData.filterDirector}
  filterResguardante={resguardosData.filterResguardante}
  onDateChange={resguardosData.setFilterDate}
  onDirectorChange={resguardosData.setFilterDirector}
  onResguardanteChange={resguardosData.setFilterResguardante}
  onClearFilters={resguardosData.clearFilters}
/>
```

### 3.4 ResguardosTable Component
**Props**:
```typescript
interface ResguardosTableProps {
  resguardos: Resguardo[];
  allResguardos: Resguardo[];
  selectedFolio: string | undefined;
  loading: boolean;
  error: string | null;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  filterResguardante: string;
  onSort: (field: string) => void;
  onFolioClick: (folio: string) => void;
  onRetry: () => void;
  onResetSearch: () => void;
}
```

**Integration**:
```tsx
<ResguardosTable
  resguardos={resguardosData.foliosUnicos}
  allResguardos={resguardosData.allResguardos}
  selectedFolio={resguardoDetails.selectedResguardo?.folio}
  loading={resguardosData.loading}
  error={resguardosData.error}
  sortField={resguardosData.sortField}
  sortDirection={resguardosData.sortDirection}
  filterResguardante={resguardosData.filterResguardante}
  onSort={resguardosData.handleSort}
  onFolioClick={resguardoDetails.selectFolio}
  onRetry={resguardosData.refetch}
  onResetSearch={resguardosData.resetSearch}
/>
```

### 3.5 Pagination Component
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

**Integration**:
```tsx
<Pagination
  currentPage={resguardosData.currentPage}
  totalPages={resguardosData.totalPages}
  rowsPerPage={resguardosData.rowsPerPage}
  onPageChange={resguardosData.setCurrentPage}
  onRowsPerPageChange={resguardosData.setRowsPerPage}
/>
```

### 3.6 ResguardoDetailsPanel Component
**Props**:
```typescript
interface ResguardoDetailsPanelProps {
  folio: string;
  fecha: string;
  director: string;
  area: string;
  articulosCount: number;
  resguardantes: string[];
  onClose: () => void;
  onGeneratePDF: () => void;
  onDeleteAll: () => void;
  userRole: string | null;
  children: React.ReactNode;
}
```

**Integration**:
```tsx
<ResguardoDetailsPanel
  folio={resguardoDetails.selectedResguardo.folio}
  fecha={resguardoDetails.selectedResguardo.f_resguardo}
  director={resguardoDetails.selectedResguardo.dir_area}
  area={resguardoDetails.selectedResguardo.area_resguardo || ''}
  articulosCount={resguardoDetails.selectedResguardo.articulos.length}
  resguardantes={Array.from(new Set(
    resguardoDetails.selectedResguardo.articulos.map(a => a.resguardante || 'Sin asignar')
  ))}
  onClose={resguardoDetails.clearSelection}
  onGeneratePDF={() => {
    pdfGeneration.preparePDFData(
      resguardoDetails.selectedResguardo.usufinal || '',
      resguardoDetails.selectedResguardo.articulos
    );
    setShowPDFButton(true);
  }}
  onDeleteAll={() => setShowDeleteAllModal(true)}
  userRole={userRole}
>
  {/* ArticulosListPanel */}
</ResguardoDetailsPanel>
```

### 3.7 ArticulosListPanel Component
**Props**:
```typescript
interface ArticulosListPanelProps {
  articulos: ResguardoArticulo[];
  editResguardanteMode: boolean;
  editedResguardantes: { [id: number]: string };
  selectedArticulos: string[];
  onToggleEditMode: () => void;
  onResguardanteChange: (id: number, value: string) => void;
  onSaveResguardantes: () => void;
  onCancelEdit: () => void;
  onToggleSelection: (numInventario: string) => void;
  onDeleteSelected: () => void;
  onDeleteSingle: (articulo: ResguardoArticulo) => void;
  onGeneratePDFByResguardante: (resguardante: string, articulos: ResguardoArticulo[]) => void;
  onClearSelection: () => void;
  savingResguardantes: boolean;
  userRole: string | null;
}
```

**Integration**:
```tsx
<ArticulosListPanel
  articulos={resguardoDetails.selectedResguardo.articulos}
  editResguardanteMode={resguardantesEdit.editMode}
  editedResguardantes={resguardantesEdit.editedResguardantes}
  selectedArticulos={selectedArticulos}
  onToggleEditMode={resguardantesEdit.toggleEditMode}
  onResguardanteChange={resguardantesEdit.updateResguardante}
  onSaveResguardantes={resguardantesEdit.saveResguardantes}
  onCancelEdit={resguardantesEdit.cancelEdit}
  onToggleSelection={toggleArticuloSelection}
  onDeleteSelected={() => setShowDeleteSelectedModal(true)}
  onDeleteSingle={(articulo) => setShowDeleteItemModal({ index: 0, articulo })}
  onGeneratePDFByResguardante={handleGeneratePDFByResguardante}
  onClearSelection={clearSelection}
  savingResguardantes={resguardantesEdit.saving}
  userRole={userRole}
/>
```

## 4. Modal Integration Design

### 4.1 DeleteAllModal
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

### 4.2 DeleteItemModal
**Props**:
```typescript
interface DeleteItemModalProps {
  show: boolean;
  folio: string;
  articulo: ResguardoArticulo;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}
```

### 4.3 DeleteSelectedModal
**Props**:
```typescript
interface DeleteSelectedModalProps {
  show: boolean;
  folio: string;
  selectedCount: number;
  articulos: ResguardoArticulo[];
  selectedArticulos: string[];
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}
```

### 4.4 ErrorAlert
**Props**:
```typescript
interface ErrorAlertProps {
  show: boolean;
  message: string;
  onClose: () => void;
}
```

## 5. Event Handler Design

### 5.1 Selection Handlers
```typescript
// Toggle single article selection
const toggleArticuloSelection = (num_inventario: string) => {
  setSelectedArticulos(prev =>
    prev.includes(num_inventario)
      ? prev.filter(n => n !== num_inventario)
      : [...prev, num_inventario]
  );
};

// Clear all selections
const clearSelection = () => {
  setSelectedArticulos([]);
};
```

### 5.2 Delete Handlers
```typescript
// Delete entire resguardo
const handleDeleteAll = async () => {
  if (!resguardoDetails.selectedResguardo) return;
  await resguardoDelete.deleteAll(resguardoDetails.selectedResguardo.folio);
  setShowDeleteAllModal(false);
  resguardoDetails.clearSelection();
};

// Delete single article
const handleDeleteItem = async (articulo: ResguardoArticulo) => {
  if (!resguardoDetails.selectedResguardo) return;
  await resguardoDelete.deleteSingle(
    resguardoDetails.selectedResguardo.folio,
    articulo
  );
  setShowDeleteItemModal(null);
};

// Delete selected articles
const handleDeleteSelected = async () => {
  if (!resguardoDetails.selectedResguardo || selectedArticulos.length === 0) return;
  
  const articulosToDelete = resguardoDetails.selectedResguardo.articulos.filter(
    art => selectedArticulos.includes(art.num_inventario)
  );
  
  await resguardoDelete.deleteSelected(
    resguardoDetails.selectedResguardo.folio,
    articulosToDelete
  );
  
  setShowDeleteSelectedModal(false);
  clearSelection();
};
```

### 5.3 PDF Handlers
```typescript
// Generate PDF for entire resguardo or specific resguardante
const handleGeneratePDF = async () => {
  if (!pdfGeneration.pdfData) return;
  setGeneratingPDF(true);
  try {
    await pdfGeneration.generatePDF();
  } finally {
    setGeneratingPDF(false);
    setShowPDFButton(false);
  }
};

// Generate PDF for specific resguardante
const handleGeneratePDFByResguardante = (
  resguardante: string,
  articulos: ResguardoArticulo[]
) => {
  if (!resguardoDetails.selectedResguardo) return;
  pdfGeneration.preparePDFData(resguardante, articulos);
  setShowPDFButton(true);
};

// Generate PDF de baja
const handleGenerateBajaPDF = async () => {
  if (!resguardoDelete.pdfBajaData) return;
  await pdfGeneration.generateBajaPDF(resguardoDelete.pdfBajaData);
  setShowPDFBajaButton(false);
};
```

## 6. State Coordination Design

### 6.1 State Dependencies
```
resguardosData
  ↓ (provides list)
resguardoDetails
  ↓ (provides selected resguardo)
resguardantesEdit
  ↓ (edits resguardantes)
resguardoDelete
  ↓ (deletes articles/resguardo)
pdfGeneration
  ↓ (generates PDFs)
```

### 6.2 State Synchronization
- When resguardo is selected → sync resguardantesEdit
- When resguardante is saved → refetch resguardoDetails
- When article is deleted → refetch both resguardosData and resguardoDetails
- When resguardo is deleted → clear resguardoDetails and refetch resguardosData

### 6.3 Error Handling
- Collect errors from all hooks
- Display in single ErrorAlert
- Clear all errors when alert is dismissed

## 7. Performance Considerations

### 7.1 Optimization Strategies
- Use React.memo for expensive components
- Debounce search input (100ms)
- Lazy load modals
- Virtualize long lists if needed

### 7.2 Re-render Prevention
- Memoize event handlers with useCallback
- Memoize computed values with useMemo
- Avoid inline object/array creation in JSX

## 8. Accessibility Design

### 8.1 Keyboard Navigation
- Tab through interactive elements
- Enter to select resguardo
- Escape to close modals
- Arrow keys for pagination

### 8.2 Screen Reader Support
- ARIA labels on buttons
- ARIA live regions for status updates
- Semantic HTML structure
- Focus management in modals

## 9. Responsive Design

### 9.1 Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### 9.2 Layout Adaptations
- Mobile: Stack panels vertically
- Tablet: Side-by-side with scroll
- Desktop: Full side-by-side layout

### 9.3 Mobile-Specific Features
- Auto-scroll to details after selection
- Larger touch targets
- Simplified navigation

## 10. Error Recovery Design

### 10.1 Error Scenarios
- Network failure → Show error, provide retry
- Invalid data → Show error, clear selection
- Permission denied → Show error, disable action
- Timeout → Show error, provide retry

### 10.2 Recovery Actions
- Retry button for network errors
- Clear button for invalid state
- Refresh button for stale data
- Cancel button for long operations

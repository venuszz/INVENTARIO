# Resguardos Bajas - Componentization Tasks

## Phase 1: Setup and Structure

### 1.1 Create folder structure
- [x] Create `src/components/resguardos/consultarBajas/` directory
- [x] Create `src/components/resguardos/consultarBajas/hooks/` directory
- [x] Create `src/components/resguardos/consultarBajas/components/` directory
- [x] Create `src/components/resguardos/consultarBajas/modals/` directory

### 1.2 Create type definitions
- [x] Create `src/components/resguardos/consultarBajas/types.ts`
- [x] Define `ResguardoBaja` interface
- [x] Define `ResguardoBajaDetalle` interface
- [x] Define `ResguardoBajaArticulo` interface
- [x] Define `PdfDataBaja` interface
- [x] Define `SortField` type
- [x] Define `SortDirection` type
- [x] Define `DeleteType` type
- [x] Define `ItemToDelete` interface
- [x] Export all types

### 1.3 Create utility functions (if needed)
- [x] Create `src/components/resguardos/consultarBajas/utils.ts`
- [x] Implement `getItemCountBgColor` function
- [x] Implement `formatDate` function
- [x] Export all utilities

---

## Phase 2: Extract Custom Hooks

### 2.1 Create useBajasData hook
- [x] Create `src/components/resguardos/consultarBajas/hooks/useBajasData.ts`
- [x] Define state: bajas, allBajas, loading, error, currentPage, rowsPerPage, totalCount, sortField, sortDirection
- [x] Implement `fetchBajas` function with pagination and sorting logic
- [x] Implement `setCurrentPage` function
- [x] Implement `setRowsPerPage` function
- [x] Implement `setSort` function
- [x] Implement `refetch` function
- [x] Compute `totalPages` value
- [x] Compute `foliosUnicos` value
- [x] Export hook with all state and methods

### 2.2 Create useBajaDetails hook
- [x] Create `src/components/resguardos/consultarBajas/hooks/useBajaDetails.ts`
- [x] Define state: selectedBaja, groupedItems, loading, error
- [x] Implement `fetchBajaDetails` function
- [x] Implement grouping logic by folio_baja
- [x] Implement `clearSelection` function
- [x] Implement `getArticuloCount` function
- [x] Export hook with all state and methods

### 2.3 Create useSearchAndFilters hook
- [x] Create `src/components/resguardos/consultarBajas/hooks/useSearchAndFilters.ts`
- [x] Define state: searchTerm, filterDate, filterDirector, filterResguardante
- [x] Implement `setSearchTerm` function
- [x] Implement `setFilterDate` function
- [x] Implement `setFilterDirector` function
- [x] Implement `setFilterResguardante` function
- [x] Implement `resetSearch` function
- [x] Implement `clearFilters` function
- [x] Add debouncing logic (100ms)
- [x] Export hook with all state and methods

### 2.4 Create useBajaDelete hook
- [x] Create `src/components/resguardos/consultarBajas/hooks/useBajaDelete.ts`
- [x] Define state: deleting, error, pdfBajaData
- [x] Implement `deleteFolio` function
- [x] Implement `deleteSelected` function
- [x] Implement `deleteSingle` function
- [x] Implement PDF data generation after deletion
- [x] Implement `clearPdfBajaData` function
- [x] Export hook with all state and methods

### 2.5 Create usePDFGeneration hook
- [x] Create `src/components/resguardos/consultarBajas/hooks/usePDFGeneration.ts`
- [x] Define state: pdfBajaData, generating, error
- [x] Implement `preparePDFData` function
- [x] Implement firmas fetching logic
- [x] Implement selected items handling
- [x] Implement `generatePDF` function
- [x] Implement `clearPDFData` function
- [x] Export hook with all state and methods

### 2.6 Create useItemSelection hook
- [x] Create `src/components/resguardos/consultarBajas/hooks/useItemSelection.ts`
- [x] Define state: selectedItems
- [x] Implement `handleItemSelection` function
- [x] Implement `handleGroupSelection` function
- [x] Implement `clearSelections` function
- [x] Implement `getSelectedItemsGroupedByFolio` function
- [x] Compute `selectedCount` value
- [x] Compute `hasSelection` value
- [x] Export hook with all state and methods

---

## Phase 3: Extract UI Components

### 3.1 Create Header component
- [x] Create `src/components/resguardos/consultarBajas/components/Header.tsx`
- [x] Define `HeaderProps` interface
- [x] Implement component with title and "BAJ" badge
- [x] Add total count display with ListChecks icon
- [x] Add SectionRealtimeToggle integration
- [x] Apply responsive styling
- [x] Export component

### 3.2 Create SearchAndFilters component
- [x] Create `src/components/resguardos/consultarBajas/components/SearchAndFilters.tsx`
- [x] Define `SearchAndFiltersProps` interface
- [x] Implement search input with Search icon
- [x] Implement date filter input
- [x] Implement director filter input
- [x] Implement resguardante filter input
- [x] Add clear search button
- [x] Add clear filters button
- [x] Add refresh button
- [x] Apply gradient background styling
- [x] Apply responsive grid layout
- [x] Export component

### 3.3 Create BajasTable component
- [x] Create `src/components/resguardos/consultarBajas/components/BajasTable.tsx`
- [x] Define `BajasTableProps` interface
- [x] Implement table structure with sticky header
- [x] Add sortable columns (folio_resguardo, f_resguardo, dir_area)
- [x] Add article count column with color-coded badges
- [x] Implement row click handler
- [x] Add selected row highlighting
- [x] Add resguardantes tooltip on hover
- [x] Implement loading state
- [x] Implement error state
- [x] Implement empty state
- [x] Apply responsive styling
- [x] Export component

### 3.4 Create Pagination component
- [x] Create `src/components/resguardos/consultarBajas/components/Pagination.tsx`
- [x] Define `PaginationProps` interface
- [x] Implement page info display
- [x] Add rows per page selector (10, 25, 50, 100)
- [x] Add previous button with disabled state
- [x] Add next button with disabled state
- [x] Apply styling with borders and rounded corners
- [x] Export component

### 3.5 Create BajaDetailsPanel component
- [x] Create `src/components/resguardos/consultarBajas/components/BajaDetailsPanel.tsx`
- [x] Define `BajaDetailsPanelProps` interface
- [x] Implement folio display with FileDigit icon
- [x] Implement fecha display with Calendar icon
- [x] Implement director display with Building2 icon
- [x] Implement area display
- [x] Implement puesto display with User icon
- [x] Implement resguardantes display with colored badges
- [x] Add PDF generation button
- [x] Add delete folio button (with RoleGuard)
- [x] Implement empty state with Info icon
- [x] Apply shadow and border styling
- [x] Export component

### 3.6 Create ArticulosListPanel component
- [x] Create `src/components/resguardos/consultarBajas/components/ArticulosListPanel.tsx`
- [x] Define `ArticulosListPanelProps` interface
- [x] Implement sticky header with title and selection count
- [x] Add clear selection button
- [x] Add delete selected button (with RoleGuard)
- [x] Implement articles grouping by folio_baja
- [x] Add group selection button
- [x] Implement article cards with selection state
- [x] Add origin badges (INEA/ITEA)
- [x] Add delete single button (with RoleGuard)
- [x] Implement empty state with ListChecks icon
- [x] Apply scrollable styling with max-height
- [x] Apply backdrop blur for sticky header
- [x] Export component

---

## Phase 4: Extract Modals

### 4.1 Create DeleteFolioModal
- [x] Create `src/components/resguardos/consultarBajas/modals/DeleteFolioModal.tsx`
- [x] Define `DeleteFolioModalProps` interface
- [x] Implement modal structure with backdrop
- [x] Add warning icon with pulse animation
- [x] Display folio information
- [x] Display article count
- [x] Add confirm button
- [x] Add cancel button
- [x] Implement loading state
- [x] Apply red theme styling
- [x] Export component

### 4.2 Create DeleteSelectedModal
- [x] Create `src/components/resguardos/consultarBajas/modals/DeleteSelectedModal.tsx`
- [x] Define `DeleteSelectedModalProps` interface
- [x] Implement modal structure with backdrop
- [x] Add warning icon
- [x] Display selected count
- [x] Display list of selected articles
- [x] Add confirm button
- [x] Add cancel button
- [x] Implement loading state
- [x] Apply red theme styling
- [x] Export component

### 4.3 Create DeleteItemModal
- [x] Create `src/components/resguardos/consultarBajas/modals/DeleteItemModal.tsx`
- [x] Define `DeleteItemModalProps` interface
- [x] Implement modal structure with backdrop
- [x] Add warning icon
- [x] Display article num_inventario
- [x] Display article descripcion
- [x] Add confirm button
- [x] Add cancel button
- [x] Implement loading state
- [x] Apply red theme styling
- [x] Export component

### 4.4 Create PDFDownloadModal
- [x] Create `src/components/resguardos/consultarBajas/modals/PDFDownloadModal.tsx`
- [x] Define `PDFDownloadModalProps` interface
- [x] Implement modal structure with backdrop
- [x] Add FileDigit icon with pulse animation
- [x] Display folio_baja information
- [x] Add download button
- [x] Add close button
- [x] Implement generating state
- [x] Apply red theme styling
- [x] Export component

### 4.5 Create ErrorAlert component
- [x] Create `src/components/resguardos/consultarBajas/modals/ErrorAlert.tsx`
- [x] Define `ErrorAlertProps` interface
- [x] Implement fixed bottom-right positioning
- [x] Add AlertCircle icon with pulse animation
- [x] Display error message
- [x] Add close button
- [x] Apply red theme styling
- [x] Apply backdrop blur effect
- [x] Add fade-in animation
- [x] Export component

---

## Phase 5: Create Main Orchestrator

### 5.1 Create index.tsx structure
- [x] Create `src/components/resguardos/consultarBajas/index.tsx`
- [x] Add "use client" directive
- [x] Import all necessary dependencies
- [x] Import all custom hooks
- [x] Import all UI components
- [x] Import all modals
- [x] Import types

### 5.2 Initialize hooks and state
- [x] Initialize theme hook (useTheme)
- [x] Initialize user role hook (useUserRole)
- [x] Initialize realtime hook (useResguardosBajasIndexation)
- [x] Initialize search params hook (useSearchParams)
- [x] Initialize refs (detailRef)
- [x] Initialize useBajasData hook
- [x] Initialize useBajaDetails hook
- [x] Initialize useSearchAndFilters hook
- [x] Initialize useBajaDelete hook
- [x] Initialize usePDFGeneration hook
- [x] Initialize useItemSelection hook
- [x] Initialize modal visibility states
- [x] Initialize folioParamLoading state

### 5.3 Implement effects
- [x] Add effect for URL parameter loading (?folio=XXX)
- [x] Add effect for auto-scroll to details on mobile
- [x] Add effect for fetching bajas on filter change
- [x] Add effect for fetching all bajas

### 5.4 Implement event handlers
- [x] Implement `handleFolioClick` handler
- [x] Implement `handleDeleteFolio` handler
- [x] Implement `handleDeleteSelected` handler
- [x] Implement `handleDeleteSingle` handler
- [x] Implement `handleGeneratePDF` handler
- [x] Implement `handleSort` handler
- [x] Implement `handleRefresh` handler
- [x] Wrap handlers with useCallback

### 5.5 Implement render structure
- [x] Add loading overlay for URL parameter
- [x] Render Header component
- [x] Create main grid container (lg:grid-cols-5)
- [x] Render left panel (lg:col-span-3)
  - [x] Render SearchAndFilters
  - [x] Render BajasTable
  - [x] Render Pagination
- [x] Render right panel (lg:col-span-2)
  - [x] Render BajaDetailsPanel
  - [x] Render ArticulosListPanel
- [x] Render all modals
- [x] Render ErrorAlert
- [x] Add scrollbar styles

### 5.6 Export component
- [x] Export ConsultarBajasResguardos as default

---

## Phase 6: Integration and Testing

### 6.1 Update page component
- [x] Update `src/app/resguardos/consultar/bajas/page.tsx` (if exists)
- [x] Or create new page if needed
- [x] Import new ConsultarBajasResguardos from consultarBajas/index
- [x] Test page loads correctly

### 6.2 Test functionality
- [x] Test data loading and display
- [x] Test search functionality
- [x] Test date filter
- [x] Test director filter
- [x] Test resguardante filter
- [x] Test sorting by columns
- [x] Test pagination
- [x] Test folio selection
- [x] Test details display
- [x] Test article selection (individual)
- [x] Test article selection (group)
- [x] Test delete folio (admin only)
- [x] Test delete selected (admin only)
- [x] Test delete single (admin only)
- [x] Test PDF generation
- [x] Test URL parameter (?folio=XXX)
- [x] Test realtime connection
- [x] Test theme switching (dark/light)
- [x] Test responsive layout
- [x] Test error states
- [x] Test loading states
- [x] Test empty states

### 6.3 Verify design preservation
- [x] Compare visual design with original
- [x] Verify all colors match
- [x] Verify all spacing matches
- [x] Verify all animations match
- [x] Verify all hover effects match
- [x] Verify all transitions match
- [x] Verify responsive behavior matches
- [x] Verify icons match
- [x] Verify badges match
- [x] Verify modals match

### 6.4 Check TypeScript
- [x] Run TypeScript compiler
- [x] Fix any type errors
- [x] Verify all types are correct
- [x] Verify all imports are correct

### 6.5 Test in different scenarios
- [x] Test with no data
- [x] Test with large dataset
- [x] Test with filters applied
- [x] Test with multiple selections
- [x] Test with different user roles
- [x] Test on mobile devices
- [x] Test on tablet devices
- [x] Test on desktop

---

## Phase 7: Cleanup and Documentation

### 7.1 Remove old file
- [x] Backup `src/components/resguardos/consultarBajas.tsx`
- [x] Delete `src/components/resguardos/consultarBajas.tsx`
- [x] Verify no imports reference old file
- [x] Update any documentation

### 7.2 Add JSDoc comments (optional)
- [x] Add JSDoc to all hooks
- [x] Add JSDoc to all components
- [x] Add JSDoc to all modals
- [x] Add JSDoc to utility functions

### 7.3 Final verification
- [x] Run full test suite (if exists)
- [x] Test in development environment
- [x] Test in production build
- [x] Verify no console errors
- [x] Verify no console warnings
- [x] Verify performance is acceptable

### 7.4 Update spec documentation
- [x] Mark all tasks as complete
- [x] Update requirements.md if needed
- [x] Update design.md if needed
- [x] Add any lessons learned

---

## Notes

- Each task should be completed in order within its phase
- Test after completing each phase before moving to the next
- If issues arise, document them and adjust the design if needed
- Maintain 100% functionality and design preservation throughout
- Use git commits after each phase for easy rollback if needed

## Success Criteria

✅ All tasks completed
✅ All tests passing
✅ No TypeScript errors
✅ No runtime errors
✅ Design 100% preserved
✅ Functionality 100% preserved
✅ Code is more maintainable
✅ Code is more scalable

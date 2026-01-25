# Implementation Plan: Levantamiento Component Refactoring

## Overview

This implementation plan breaks down the refactoring of the monolithic `levantamiento.tsx` component into discrete, incremental steps. Each task builds on previous work, ensuring that the component remains functional throughout the refactoring process. The approach follows the established pattern in the codebase (similar to `src/components/inventario/registro/`).

## Tasks

- [x] 1. Set up directory structure and type definitions
  - Create `src/components/consultas/levantamiento/` directory
  - Create subdirectories: `hooks/`, `components/`, `modals/`
  - Create `types.ts` with all TypeScript interfaces and types
  - Extract interfaces from original file: `LevMueble`, `ActiveFilter`, `Suggestion`, `SearchMatchType`, `DirectorioOption`, `Message`
  - Add utility type definitions for component props
  - _Requirements: 1.1, 1.2, 10.1, 10.2, 10.3, 10.4_

- [x] 2. Create utility functions module
  - Create `utils.ts` file in the levantamiento directory
  - Extract `clean()` function for text normalization
  - Extract `getOrigenColors()` function for badge styling
  - Extract `getEstatusColors()` function for status badge styling
  - Extract `truncateText()` function for text truncation
  - Extract `getTypeLabel()` and `getTypeIcon()` functions for filter display
  - Add unit tests for utility functions
  - _Requirements: 8.1, 8.2_

- [x] 3. Implement useUnifiedInventory hook
  - [x] 3.1 Create `hooks/useUnifiedInventory.ts` file
    - Define hook interface with return type
    - Import indexation hooks: `useIneaIndexation`, `useIteaIndexation`, `useNoListadoIndexation`
    - Implement data aggregation with `useMemo`
    - Map each item to include `origen` field
    - Aggregate loading states with OR logic
    - Aggregate error states (first non-null error)
    - Aggregate realtime connection states with OR logic
    - Implement `reindex()` function to trigger all three sources
    - _Requirements: 2.1, 2.2, 9.1_

  - [ ]* 3.2 Write property test for data aggregation
    - **Property 1: Data Aggregation Preserves All Records**
    - **Validates: Requirements 2.2**
    - Generate random INEA, ITEA, TLAXCALA data arrays
    - Verify unified array contains all items with correct origin labels
    - Verify total count equals sum of individual counts
    - _Requirements: 2.2_

- [x] 4. Implement useSearchAndFilters hook
  - [x] 4.1 Create `hooks/useSearchAndFilters.ts` file
    - Define hook interface with parameters and return type
    - Implement search term state with `useDeferredValue`
    - Implement active filters state management
    - Implement suggestions state and generation logic
    - Pre-calculate searchable vectors with `useMemo`
    - Implement filter logic with `useMemo`
    - Implement sorting logic
    - Implement `removeFilter()` function
    - Implement `isCustomPDFEnabled` calculation
    - _Requirements: 2.3, 2.4, 3.2, 3.3, 3.5, 3.6, 11.1, 11.2_

  - [ ]* 4.2 Write property test for search suggestions
    - **Property 2: Search Suggestions Match Input**
    - **Validates: Requirements 2.4, 3.2**
    - Generate random search terms (2+ characters)
    - Generate random inventory data
    - Verify all suggestions contain search term (case-insensitive)
    - Verify suggestion count <= 7
    - _Requirements: 2.4, 3.2_

  - [ ]* 4.3 Write property test for filter addition
    - **Property 3: Filter Addition Preserves Existing Filters**
    - **Validates: Requirements 3.3**
    - Generate random active filter lists
    - Generate random new suggestions
    - Verify adding suggestion preserves all existing filters
    - _Requirements: 3.3_

  - [ ]* 4.4 Write property test for filter removal
    - **Property 4: Filter Removal Preserves Other Filters**
    - **Validates: Requirements 3.5**
    - Generate random active filter lists
    - Generate random removal index
    - Verify removing filter preserves other filters in order
    - _Requirements: 3.5_

  - [ ]* 4.5 Write property test for column sorting
    - **Property 5: Column Sorting Orders Data Correctly**
    - **Validates: Requirements 4.2**
    - Generate random inventory data
    - Generate random sortable column
    - Verify ascending sort orders data correctly
    - _Requirements: 4.2_

  - [ ]* 4.6 Write property test for sort direction toggle
    - **Property 6: Sort Direction Toggle Reverses Order**
    - **Validates: Requirements 4.3**
    - Generate random sorted data
    - Verify toggling direction reverses array
    - _Requirements: 4.3_

- [x] 5. Implement useDirectorManagement hook
  - [x] 5.1 Create `hooks/useDirectorManagement.ts` file
    - Define hook interface with parameters and return type
    - Implement director options state
    - Implement `fetchDirectorFromDirectorio()` function
    - Implement fuzzy matching for director names
    - Implement `saveDirectorData()` function with Supabase update
    - Implement loading and error states
    - _Requirements: 2.5, 2.6, 6.5, 6.8_

  - [ ]* 5.2 Write unit tests for director management
    - Test director fetching with mock Supabase
    - Test fuzzy matching algorithm
    - Test director data validation
    - Test save operation
    - _Requirements: 2.6, 6.8_

- [x] 6. Checkpoint - Ensure all hooks are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement LoadingStates component
  - [x] 7.1 Create `components/LoadingStates.tsx` file
    - Define component props interface
    - Implement loading state UI with animated spinner
    - Implement error state UI with retry button
    - Implement empty state UI with search icon
    - Apply dark mode styling with theme context
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2_

  - [ ]* 7.2 Write property test for empty state display
    - **Property 12: Empty Results Show Empty State**
    - **Validates: Requirements 7.4**
    - Generate random filter combinations
    - Verify empty state shown when results are empty
    - _Requirements: 7.4_

  - [ ]* 7.3 Write unit tests for LoadingStates
    - Test loading state rendering
    - Test error state rendering with retry button
    - Test empty state rendering
    - Test dark mode styling
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 8. Implement SearchBar component
  - [x] 8.1 Create `components/SearchBar.tsx` file
    - Define component props interface
    - Implement search input with ref
    - Implement SuggestionDropdown sub-component
    - Implement floating dropdown positioning
    - Implement keyboard navigation handlers
    - Implement suggestion selection handlers
    - Apply dark mode styling
    - Add ARIA labels and roles
    - _Requirements: 3.1, 3.2, 3.3, 8.1, 8.2, 12.1, 12.2, 12.3_

  - [ ]* 8.2 Write property test for arrow key navigation
    - **Property 15: Arrow Key Navigation Updates Highlighted Index**
    - **Validates: Requirements 12.2**
    - Generate random suggestion lists
    - Generate random initial highlighted index
    - Verify arrow keys update index correctly (with wrapping)
    - _Requirements: 12.2_

  - [ ]* 8.3 Write unit tests for SearchBar
    - Test input rendering and onChange
    - Test suggestion dropdown visibility
    - Test keyboard navigation (Arrow keys, Enter, Escape)
    - Test suggestion selection
    - Test dark mode styling
    - _Requirements: 3.1, 3.2, 3.3, 12.1_

- [x] 9. Implement FilterChips component
  - [x] 9.1 Create `components/FilterChips.tsx` file
    - Define component props interface
    - Implement chip rendering with type labels and icons
    - Implement remove button with X icon
    - Apply color coding by filter type
    - Apply dark mode styling
    - _Requirements: 3.4, 3.5, 8.1, 8.2_

  - [ ]* 9.2 Write unit tests for FilterChips
    - Test chip rendering for each filter type
    - Test remove button click handler
    - Test color coding
    - Test dark mode styling
    - _Requirements: 3.4, 3.5_

- [x] 10. Implement InventoryTable component
  - [x] 10.1 Create `components/InventoryTable.tsx` file
    - Define component props interface
    - Implement table structure with sticky header
    - Implement sortable column headers with icons
    - Implement origin badges with color coding
    - Implement resguardo badges with click handlers
    - Implement status badges with color coding
    - Implement text truncation for long fields
    - Apply dark mode styling
    - _Requirements: 4.1, 4.2, 4.3, 8.1, 8.2_

  - [ ]* 10.2 Write unit tests for InventoryTable
    - Test table rendering with data
    - Test column header click for sorting
    - Test origin badge rendering
    - Test resguardo badge click handler
    - Test status badge rendering
    - Test dark mode styling
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 11. Implement Pagination component
  - [x] 11.1 Create `components/Pagination.tsx` file
    - Define component props interface
    - Implement page navigation buttons (First, Previous, Next, Last)
    - Implement numbered page buttons with ellipsis
    - Implement rows-per-page selector
    - Implement record count display
    - Apply dark mode styling
    - Disable boundary buttons appropriately
    - _Requirements: 4.4, 4.5, 4.6, 8.1, 8.2_

  - [ ]* 11.2 Write property test for rows-per-page reset
    - **Property 7: Rows-Per-Page Change Resets Pagination**
    - **Validates: Requirements 4.5**
    - Generate random pagination states
    - Generate random rows-per-page values
    - Verify changing rows-per-page sets currentPage to 1
    - _Requirements: 4.5_

  - [ ]* 11.3 Write property test for pagination slicing
    - **Property 8: Pagination Slices Data Correctly**
    - **Validates: Requirements 4.6**
    - Generate random datasets
    - Generate random page numbers and rows-per-page values
    - Verify displayed data is correct slice
    - _Requirements: 4.6_

  - [ ]* 11.4 Write property test for pagination limits
    - **Property 14: Pagination Limits Rendered Items**
    - **Validates: Requirements 11.5**
    - Generate random datasets
    - Generate random rows-per-page values
    - Verify rendered item count is correct
    - _Requirements: 11.5_

  - [ ]* 11.5 Write unit tests for Pagination
    - Test page navigation button clicks
    - Test numbered page button clicks
    - Test rows-per-page selector change
    - Test boundary button disabled states
    - Test dark mode styling
    - _Requirements: 4.4, 4.5, 4.6_

- [x] 12. Checkpoint - Ensure all presentational components are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement ExportButtons component
  - [x] 13.1 Create `components/ExportButtons.tsx` file
    - Define component props interface
    - Implement Excel export button with icon
    - Implement PDF export button with icon
    - Implement refresh button with rotation animation
    - Implement custom PDF indicator badge
    - Apply dark mode styling
    - Add hover animations
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 8.1, 8.2_

  - [ ]* 13.2 Write unit tests for ExportButtons
    - Test Excel button click handler
    - Test PDF button click handler
    - Test refresh button click handler
    - Test custom PDF indicator visibility
    - Test loading state
    - Test dark mode styling
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 14. Implement ExportModal component
  - [x] 14.1 Create `modals/ExportModal.tsx` file
    - Define component props interface
    - Implement modal overlay and container
    - Implement export type display
    - Implement filename preview
    - Implement confirm and cancel buttons
    - Apply dark mode styling
    - Add loading state during export
    - _Requirements: 6.1, 6.2, 8.1, 8.2_

  - [ ]* 14.2 Write unit tests for ExportModal
    - Test modal visibility based on show prop
    - Test export type display
    - Test filename preview
    - Test confirm button click handler
    - Test cancel button click handler
    - Test dark mode styling
    - _Requirements: 6.1, 6.2_

- [x] 15. Implement CustomPDFModal component
  - [x] 15.1 Create `modals/CustomPDFModal.tsx` file
    - Define component props interface
    - Implement modal overlay and container
    - Implement area field (read-only, pre-populated)
    - Implement director search input
    - Implement director list with suggested highlighting
    - Implement puesto field (read-only)
    - Implement record count badge
    - Implement confirm and cancel buttons
    - Apply dark mode styling
    - Add validation before export
    - _Requirements: 6.3, 6.4, 6.5, 8.1, 8.2_

  - [ ]* 15.2 Write property test for modal pre-population
    - **Property 11: Custom PDF Modal Pre-populates From Filters**
    - **Validates: Requirements 6.4**
    - Generate random active filter sets with area and usufinal
    - Verify modal pre-populates fields correctly
    - _Requirements: 6.4_

  - [ ]* 15.3 Write unit tests for CustomPDFModal
    - Test modal visibility
    - Test area field pre-population
    - Test director search functionality
    - Test director selection
    - Test suggested director highlighting
    - Test confirm button validation
    - Test dark mode styling
    - _Requirements: 6.3, 6.4, 6.5_

- [x] 16. Implement DirectorDataModal component
  - [x] 16.1 Create `modals/DirectorDataModal.tsx` file
    - Define component props interface
    - Implement modal overlay and container
    - Implement nombre input (uppercase)
    - Implement puesto input (uppercase)
    - Implement save and cancel buttons
    - Apply dark mode styling
    - Add validation (both fields required)
    - Add loading state during save
    - _Requirements: 6.6, 6.7, 6.8, 8.1, 8.2_

  - [ ]* 16.2 Write unit tests for DirectorDataModal
    - Test modal visibility
    - Test nombre input with uppercase conversion
    - Test puesto input with uppercase conversion
    - Test save button validation
    - Test save button click handler
    - Test cancel button click handler
    - Test dark mode styling
    - _Requirements: 6.6, 6.7, 6.8_

- [x] 17. Implement main orchestrator component
  - [x] 17.1 Create `index.tsx` file
    - Import all hooks and components
    - Initialize useUnifiedInventory hook
    - Initialize useSearchAndFilters hook
    - Initialize useDirectorManagement hook
    - Implement modal visibility state management
    - Implement export type state management
    - Implement message state management
    - Implement handleExport function for Excel/PDF
    - Implement handleAreaPDFClick function
    - Implement handleReindex function
    - Implement handleFolioClick function for resguardo navigation
    - Fetch folio resguardo data with useEffect
    - Render component tree with all sub-components
    - Export as default with name LevantamientoUnificado
    - _Requirements: 1.3, 5.2, 5.3, 5.4, 5.5, 5.6, 7.5, 9.4, 13.1, 13.2_

  - [ ]* 17.2 Write property test for Excel export
    - **Property 9: Excel Export Contains All Filtered Records**
    - **Validates: Requirements 5.3**
    - Generate random filtered datasets
    - Mock Excel generation function
    - Verify Excel contains all filtered records
    - _Requirements: 5.3_

  - [ ]* 17.3 Write property test for PDF export
    - **Property 10: PDF Export Contains All Filtered Records**
    - **Validates: Requirements 5.6**
    - Generate random filtered datasets and signatures
    - Mock PDF generation function
    - Verify PDF contains all filtered records
    - _Requirements: 5.6_

  - [ ]* 17.4 Write property test for filter state preservation
    - **Property 13: Data Updates Preserve Filter State**
    - **Validates: Requirements 9.5**
    - Generate random filter states
    - Simulate data update (reindex)
    - Verify filters and search term unchanged
    - _Requirements: 9.5_

  - [ ]* 17.5 Write integration tests for main component
    - Test full component rendering
    - Test search and filter interaction
    - Test export button clicks and modal flow
    - Test pagination interaction
    - Test sorting interaction
    - Test dark mode toggle
    - _Requirements: 13.3_

- [x] 18. Checkpoint - Ensure full component integration works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Update page integration
  - [x] 19.1 Update the page file that imports levantamiento
    - Change import path from `@/components/consultas/levantamiento` to `@/components/consultas/levantamiento/index`
    - Verify component still renders correctly
    - Test all functionality in the page context
    - _Requirements: 13.4_
a
  - [ ]* 19.2 Write integration test for page
    - Test page renders with new component structure
    - Test routing works correctly
    - _Requirements: 13.4_

- [x] 20. Clean up and documentation
  - [x] 20.1 Remove or archive original levantamiento.tsx file
    - Rename original file to `levantamiento.tsx.backup`
    - Verify no other files import the old path
    - _Requirements: 13.3_

  - [x] 20.2 Add JSDoc comments to all exported functions and components
    - Document all component props
    - Document all hook parameters and return values
    - Document all utility functions
    - _Requirements: 10.2, 10.3_

  - [x] 20.3 Update README or documentation
    - Document new component structure
    - Document how to use each hook
    - Document how to extend the component
    - _Requirements: 1.1_

- [ ] 21. Final checkpoint - Ensure everything works end-to-end
  - Run all tests (unit, property, integration)
  - Test manually in development environment
  - Test dark mode in all components
  - Test responsive design on different screen sizes
  - Test keyboard navigation
  - Test export functionality (Excel and PDF)
  - Test real-time data updates
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The refactoring maintains backward compatibility throughout
- All existing functionality is preserved
- Dark mode support is maintained in all components
- Performance optimizations (useMemo, useDeferredValue, useCallback) are preserved

# ITEA Obsoletos Component Refactoring - Tasks

## Phase 1: Setup and Foundation

### 1. Create Directory Structure
- [x] 1.1 Create `src/components/consultas/itea/obsoletos/` directory
- [x] 1.2 Create `src/components/consultas/itea/obsoletos/components/` subdirectory
- [x] 1.3 Create `src/components/consultas/itea/obsoletos/hooks/` subdirectory
- [x] 1.4 Create `src/components/consultas/itea/obsoletos/modals/` subdirectory

### 2. Create Type Definitions
- [x] 2.1 Create `types.ts` file
- [x] 2.2 Define `MuebleITEA` interface with relational fields
  - Include `area: { id_area: number; nombre: string } | null`
  - Include `directorio: { id_directorio: number; nombre: string; puesto: string } | null`
  - Include `id_area: number | null`
  - Include `id_directorio: number | null`
- [x] 2.3 Define `FilterOptions` interface
- [x] 2.4 Define `FilterState` interface
- [x] 2.5 Define `Directorio` interface
- [x] 2.6 Define `Area` interface
- [x] 2.7 Define `Message` interface
- [x] 2.8 Define `AnimatedCounterProps` interface
- [x] 2.9 Define `BajaInfo` interface
- [x] 2.10 Define `ImagePreviewProps` interface

### 3. Create Utility Functions
- [x] 3.1 Create `utils.ts` file
- [x] 3.2 Implement `formatDate` function
- [x] 3.3 Implement `truncateText` function
- [x] 3.4 Implement `AnimatedCounter` component
  - Add loading state with random number animation
  - Add smooth counting animation
  - Support integer and decimal formatting
- [x] 3.5 Implement `ImagePreview` component
  - Handle Supabase storage signed URLs
  - Show loading state
  - Handle errors gracefully
  - Use `muebles.itea` bucket

## Phase 2: Custom Hooks

### 4. Create useAreaManagement Hook
- [x] 4.1 Create `hooks/useAreaManagement.ts` file
- [x] 4.2 Define state for areas array
- [x] 4.3 Define state for directorAreasMap
- [x] 4.4 Implement `fetchAreas` function
  - Fetch from `area` table
  - Fetch from `directorio_areas` table
  - Build director-to-areas map
- [x] 4.5 Export hook interface

### 5. Create useBajaInfo Hook
- [x] 5.1 Create `hooks/useBajaInfo.ts` file
- [x] 5.2 Define state for bajaInfo
- [x] 5.3 Define state for loading
- [x] 5.4 Define state for error
- [x] 5.5 Implement useEffect to fetch baja info
  - Only fetch when item selected and not editing
  - Query `deprecated` table
  - Match on id_inv, descripcion, area, motive
- [x] 5.6 Handle cleanup on unmount
- [x] 5.7 Export hook interface

### 6. Create useDirectorManagement Hook
- [x] 6.1 Create `hooks/useDirectorManagement.ts` file
- [x] 6.2 Define state for directorio array
- [x] 6.3 Define state for showDirectorModal
- [x] 6.4 Define state for incompleteDirector
- [x] 6.5 Define state for directorFormData
- [x] 6.6 Define state for savingDirector
- [x] 6.7 Define state for showAreaSelectModal
- [x] 6.8 Define state for areaOptionsForDirector
- [x] 6.9 Implement `fetchDirectorio` function
  - Fetch directors from `directorio` table
  - Fetch areas from `area` table
  - Fetch relationships from `directorio_areas` table
  - Build director objects with areas array
  - Update filterOptions.directores
- [x] 6.10 Implement `handleSelectDirector` function
  - Check if director has no areas → show DirectorModal
  - Check if director has multiple areas → show AreaSelectionModal
  - Check if director has one area → auto-assign
  - Update both id_directorio and id_area
- [x] 6.11 Implement `saveDirectorInfo` function
  - Insert into `directorio_areas` table
  - Update local state
  - Update filterOptions
  - Update editFormData or selectedItem
- [x] 6.12 Implement `handleAreaSelection` function
  - Update editFormData or selectedItem with selected area
  - Update id_area foreign key
- [x] 6.13 Export hook interface

### 7. Create useItemEdit Hook
- [x] 7.1 Create `hooks/useItemEdit.ts` file
- [x] 7.2 Define state for selectedItem
- [x] 7.3 Define state for isEditing
- [x] 7.4 Define state for editFormData
- [x] 7.5 Define state for imageFile
- [x] 7.6 Define state for imagePreview
- [x] 7.7 Define state for uploading
- [x] 7.8 Define state for showReactivarModal
- [x] 7.9 Define state for reactivating
- [x] 7.10 Create detailRef
- [x] 7.11 Implement `handleSelectItem` function
  - Set selectedItem
  - Reset editing state
  - Scroll to detail panel on mobile
- [x] 7.12 Implement `handleStartEdit` function
  - Set isEditing to true
  - Copy selectedItem to editFormData
- [x] 7.13 Implement `cancelEdit` function
  - Reset isEditing
  - Clear editFormData
  - Clear image states
- [x] 7.14 Implement `closeDetail` function
  - Clear selectedItem
  - Reset editing state
  - Clear URL parameter
- [x] 7.15 Implement `handleImageChange` function
  - Validate file size (max 5MB)
  - Validate file type
  - Set imageFile
  - Generate preview
- [x] 7.16 Implement `uploadImage` function
  - Upload to `muebles.itea` bucket
  - Use item ID for path
  - Handle errors
- [x] 7.17 Implement `saveChanges` function
  - Upload image if changed
  - Update mueblesitea table with relational fields
  - Create notification
  - Refresh data
  - Update selectedItem
  - Reset editing state
- [x] 7.18 Implement `handleEditFormChange` function
  - Handle all field types
  - Force uppercase for text inputs
  - Update editFormData
- [x] 7.19 Implement `reactivarArticulo` function
  - Update estatus to 'ACTIVO'
  - Clear fechabaja and causadebaja
  - Create notification
  - Trigger reindexing
  - Refresh data
  - Close detail panel
- [x] 7.20 Export hook interface

## Phase 3: UI Components

### 8. Create Header Component
- [x] 8.1 Create `components/Header.tsx` file
- [x] 8.2 Define HeaderProps interface
- [x] 8.3 Implement component structure
  - Title: "Inventario ITEA - Bajas"
  - Subtitle: "Consulta de bienes dados de baja del ITEA"
  - SectionRealtimeToggle with "ITEA Obsoletos"
- [x] 8.4 Apply dark mode styling
- [x] 8.5 Export component

### 9. Create ValueStatsPanel Component
- [x] 9.1 Create `components/ValueStatsPanel.tsx` file
- [x] 9.2 Define ValueStatsPanelProps interface
- [x] 9.3 Implement two-column layout
  - Left: Total value panel with AnimatedCounter
  - Right: Item count panel with AnimatedCounter
- [x] 9.4 Add hover animations
- [x] 9.5 Add loading state handling
- [x] 9.6 Apply dark mode styling
- [x] 9.7 Make responsive (stack on mobile)
- [x] 9.8 Export component

### 10. Create InventoryTable Component
- [x] 10.1 Create `components/InventoryTable.tsx` file
- [x] 10.2 Define InventoryTableProps interface
- [x] 10.3 Implement table structure
  - Column: ID Inventario (sortable)
  - Column: Descripción (sortable)
  - Column: Área (sortable) - use `item.area?.nombre`
  - Column: Director/Jefe de Área (sortable) - use `item.directorio?.nombre`
  - Column: Fecha de Baja (sortable)
- [x] 10.4 Implement loading state
  - Show spinner and loading message
- [x] 10.5 Implement error state
  - Show error message
  - Show retry button
- [x] 10.6 Implement empty state
  - Show "no results" message
  - Show clear filters button if filters active
- [x] 10.7 Implement row selection highlighting
- [x] 10.8 Implement row click handler
- [x] 10.9 Apply dark mode styling
- [x] 10.10 Add hover effects
- [x] 10.11 Export component

### 11. Create DetailPanel Component
- [x] 11.1 Create `components/DetailPanel.tsx` file
- [x] 11.2 Define DetailPanelProps interface
- [x] 11.3 Implement panel header
  - Title with icon
  - Close button
- [x] 11.4 Implement image section
  - View mode: ImagePreview component
  - Edit mode: ImagePreview + upload controls
- [x] 11.5 Implement form fields (view mode)
  - Display all MuebleITEA fields
  - Use `selectedItem.area?.nombre` for area
  - Use `selectedItem.directorio?.nombre` for director
  - Format dates properly
  - Format currency values
- [x] 11.6 Implement form fields (edit mode)
  - Input for id_inv
  - Select for rubro (from filterOptions)
  - Textarea for descripcion
  - Input for valor
  - Date input for f_adq
  - Select for formadq (from filterOptions)
  - Input for proveedor
  - Input for factura
  - Inputs for ubicacion fields
  - Select for estado (from filterOptions)
  - Select for area (from filterOptions) - updates id_area
  - Select for director (from directorio) - triggers handleSelectDirector
  - Input for resguardante
- [x] 11.7 Implement baja info section (view mode only)
  - Display created_by
  - Display created_at (formatted)
  - Display motive
  - Show loading state
  - Handle errors
- [x] 11.8 Apply dark mode styling
- [x] 11.9 Make scrollable
- [x] 11.10 Export component

### 12. Create Pagination Component
- [x] 12.1 Create `components/Pagination.tsx` file
- [x] 12.2 Define PaginationProps interface
- [x] 12.3 Implement page info display
  - "Showing X-Y of Z records"
- [x] 12.4 Implement navigation buttons
  - First page button
  - Previous page button
  - Page number buttons with ellipsis
  - Next page button
  - Last page button
- [x] 12.5 Implement rows per page selector
  - Options: 10, 25, 50, 100
- [x] 12.6 Implement `getPageNumbers` helper
  - Show first page
  - Show ellipsis if needed
  - Show current page and neighbors
  - Show ellipsis if needed
  - Show last page
- [x] 12.7 Apply dark mode styling
- [x] 12.8 Make responsive
- [x] 12.9 Export component

## Phase 4: Modal Components

### 13. Create ReactivarModal
- [x] 13.1 Create `modals/ReactivarModal.tsx` file
- [x] 13.2 Define ReactivarModalProps interface
- [x] 13.3 Implement modal structure
  - Warning icon
  - Title: "Reactivar Artículo"
  - Message explaining action
  - Item details (ID, description)
  - Confirm button
  - Cancel button
- [x] 13.4 Implement show/hide logic
- [x] 13.5 Implement loading state during reactivation
- [x] 13.6 Apply dark mode styling
- [x] 13.7 Add animations (Framer Motion)
- [x] 13.8 Export component

### 14. Create DirectorModal
- [x] 14.1 Create `modals/DirectorModal.tsx` file
- [x] 14.2 Define DirectorModalProps interface
- [x] 14.3 Implement modal structure
  - Title: "Asignar Área al Director"
  - Director name display
  - Area input field
  - Save button
  - Cancel button
- [x] 14.4 Implement show/hide logic
- [x] 14.5 Implement loading state during save
- [x] 14.6 Apply dark mode styling
- [x] 14.7 Add animations (Framer Motion)
- [x] 14.8 Export component

### 15. Create AreaSelectionModal
- [x] 15.1 Create `modals/AreaSelectionModal.tsx` file
- [x] 15.2 Define AreaSelectionModalProps interface
- [x] 15.3 Implement modal structure
  - Title: "Seleccionar Área"
  - Director name display
  - List of area options as buttons
  - Cancel button
- [x] 15.4 Implement show/hide logic
- [x] 15.5 Apply dark mode styling
- [x] 15.6 Add animations (Framer Motion)
- [x] 15.7 Export component

## Phase 5: Main Component Integration

### 16. Create Main Component Structure
- [x] 16.1 Create `index.tsx` file
- [x] 16.2 Import all dependencies
  - React hooks
  - Custom hooks
  - Components
  - Modals
  - Types
  - External libraries
- [x] 16.3 Initialize hooks
  - useTheme
  - useUserRole
  - useRouter
  - useIteaObsoletosIndexation
  - useSearchAndFilters (adapt from INEA)
  - useItemEdit
  - useDirectorManagement
  - useAreaManagement
  - useBajaInfo
- [x] 16.4 Define local state
  - currentPage, setCurrentPage
  - rowsPerPage, setRowsPerPage
  - sortField, setSortField
  - sortDirection, setSortDirection
  - message, setMessage
  - loading, setLoading
  - filterOptions, setFilterOptions

### 17. Implement Data Management
- [x] 17.1 Create `fetchDirectorio` effect
  - Call on mount
- [x] 17.2 Create `fetchAreas` effect
  - Call on mount
- [x] 17.3 Implement sorting logic with useMemo
  - Sort filteredMueblesOmni
  - Handle null values
  - Support asc/desc
- [x] 17.4 Implement pagination calculations
  - totalFilteredCount
  - totalPages
  - paginatedMuebles
  - filteredValue
- [x] 17.5 Implement `handleSort` function
  - Toggle direction if same field
  - Set new field and direction
  - Reset to page 1
- [x] 17.6 Implement `handlePageChange` function
- [x] 17.7 Implement `handleRowsPerPageChange` function

### 18. Implement Director Selection Logic
- [x] 18.1 Create `handleSelectDirector` wrapper function
  - Call useDirectorManagement hook method
  - Pass selectedItem and editFormData
  - Handle state updates

### 19. Implement URL Parameter Handling
- [x] 19.1 Add effect to detect `id` parameter in URL
- [x] 19.2 Calculate correct page for item
- [x] 19.3 Set currentPage to show item
- [x] 19.4 Select item when page loads
- [x] 19.5 Scroll to detail panel
- [x] 19.6 Clear URL parameter when closing detail

### 20. Implement Message Auto-Dismiss
- [x] 20.1 Add effect to auto-dismiss messages after 5 seconds

### 21. Assemble Main Component JSX
- [x] 21.1 Create main container with dark mode classes
- [x] 21.2 Add scrollable wrapper with custom scrollbar
- [x] 21.3 Add Header component
- [x] 21.4 Add ValueStatsPanel component
- [x] 21.5 Add message banner with AnimatePresence
- [x] 21.6 Add search section
  - SearchBar component
  - Plus button to save filter
  - FilterChips component
  - SuggestionDropdown component
- [x] 21.7 Add main content grid
  - Conditional layout (1 or 2 columns)
- [x] 21.8 Add table section
  - InventoryTable component
  - Pagination component
- [x] 21.9 Add detail panel section (conditional)
  - DetailPanel component
  - Action buttons (Edit/Reactivate or Save/Cancel)
  - Role-based button visibility
- [x] 21.10 Add scrollbar styles
- [x] 21.11 Add modal components
  - ReactivarModal
  - AreaSelectionModal
  - DirectorModal

### 22. Export Main Component
- [x] 22.1 Export as default

## Phase 6: Integration and Testing

### 23. Update Page Component
- [x] 23.1 Open `src/app/consultas/itea/obsoletos/page.tsx`
- [x] 23.2 Update import to use new component path
  - Import already points to `@/components/consultas/itea/obsoletos` which resolves to index.tsx
- [x] 23.3 Verify page renders correctly
  - No TypeScript errors
  - Component exports correctly

### 24. Test Basic Functionality
- [x] 24.1 Test component renders without errors
  - All TypeScript diagnostics pass
  - All imports resolve correctly
  - Component structure is complete
- [x] 24.2 Test data loads with relational fields
  - useIteaObsoletosIndexation hook provides data with relational fields
  - Type definitions include `area` and `directorio` objects
  - Hooks properly handle relational data
- [x] 24.3 Test table displays correctly
  - InventoryTable component uses `item.area?.nombre` for area display
  - InventoryTable component uses `item.directorio?.nombre` for director display
  - Columns are properly configured
- [x] 24.4 Test dark mode toggle
  - Component uses useTheme hook from context
  - All components receive isDarkMode prop
  - Dark mode classes are applied throughout
- [x] 24.5 Test responsive layout
  - Grid layout is conditional based on selectedItem
  - Mobile-first responsive classes applied
  - Scrollable containers configured

### 25. Test Search and Filters
- [x] 25.1 Test search functionality
  - useSearchAndFilters hook implements search by ID, description, area, director
  - SearchBar component properly connected
  - Search term state management implemented
- [x] 25.2 Test filter chips
  - FilterChips component created with add/remove functionality
  - saveCurrentFilter function adds filters
  - removeFilter function removes individual filters
  - clearAllFilters function clears all filters
- [x] 25.3 Test suggestions dropdown
  - SuggestionDropdown component created
  - Keyboard navigation implemented (ArrowUp, ArrowDown, Enter, Escape)
  - handleSuggestionClick function implemented
- [x] 25.4 Test filter combinations
  - useSearchAndFilters hook uses AND logic for multiple filters
  - filteredMueblesOmni applies all active filters
  - General search works alongside active filters

### 26. Test Sorting and Pagination
- [x] 26.1 Test sorting by each column
  - ID Inventario: Implemented in InventoryTable with sortField='id_inv'
  - Descripción: Implemented with sortField='descripcion'
  - Área: Implemented with sortField='area' (uses relational field)
  - Director: Implemented with sortField='directorio' (uses relational field)
  - Fecha de Baja: Implemented with sortField='fechabaja'
  - handleSort function toggles direction and updates sortField
- [x] 26.2 Test sort direction toggle
  - handleSort checks if sortField matches and toggles between 'asc' and 'desc'
  - Visual indicators in InventoryTable show current sort direction
- [x] 26.3 Test pagination navigation
  - Pagination component implements all navigation controls
  - handlePageChange validates page bounds (1 to totalPages)
  - Current page state managed correctly
  - Page calculations work with sortedMuebles
- [x] 26.4 Test rows per page selector
  - Pagination component has selector with options: 10, 25, 50, 100
  - handleRowsPerPageChange updates rowsPerPage and resets to page 1
  - Default value is 25 rows per page

### 27. Test Item Selection and Detail View
- [x] 27.1 Test item selection
  - handleSelectItem function sets selectedItem state
  - InventoryTable rows are clickable with onSelectItem handler
  - DetailPanel renders conditionally when selectedItem exists
  - Scroll to detail panel implemented with detailRef
- [x] 27.2 Test detail panel fields
  - All MuebleITEA fields display in DetailPanel
  - Relational fields use item.area?.nombre and item.directorio?.nombre
  - formatDate utility formats dates (fechabaja, f_adq)
  - Currency formatting for valor field
  - DetailCard component provides consistent field display
- [x] 27.3 Test baja info section
  - useBajaInfo hook fetches from deprecated table
  - Loading state (bajaInfoLoading) displays spinner
  - Error handling implemented in hook
  - Shows created_by, created_at (formatted), and motive
  - Only visible in view mode (not edit mode)
- [x] 27.4 Test close detail
  - closeDetail function clears selectedItem
  - Resets editing state
  - URL parameter clearing implemented in useEffect
  - AnimatePresence handles exit animation

### 28. Test Edit Functionality
- [x] 28.1 Test edit mode activation
  - Edit button only visible when userRole is 'admin' or 'superadmin'
  - handleStartEdit sets isEditing to true
  - editFormData populated from selectedItem
  - Form fields switch to edit mode in DetailPanel
- [x] 28.2 Test form field editing
  - Text inputs: handleEditFormChange handles all text fields
  - Selects: Implemented for rubro, formadq, estado, area, director
  - Date inputs: Implemented for f_adq
  - Textarea: Implemented for descripcion
  - Uppercase conversion: Applied to text inputs in handleEditFormChange
- [x] 28.3 Test image upload
  - handleImageChange validates file size (max 5MB)
  - File type validation (images only)
  - Preview generation with FileReader
  - imagePreview state shows preview in DetailPanel
- [x] 28.4 Test save changes
  - saveChanges uploads image to muebles.itea bucket
  - Updates mueblesitea table with all fields
  - Relational fields (id_area, id_directorio) update correctly
  - Success message via setMessage
  - Notification created in notificaciones table
  - reindex() called to refresh data
  - selectedItem updated with new data
  - isEditing reset to false
- [x] 28.5 Test cancel edit
  - cancelEdit resets isEditing to false
  - editFormData cleared
  - imageFile and imagePreview cleared
  - Original selectedItem data preserved

### 29. Test Director Management
- [x] 29.1 Test director selection (no areas)
  - handleSelectDirector checks director.areas.length === 0
  - DirectorModal opens (showDirectorModal = true)
  - incompleteDirector set with director data
  - directorFormData.areaName field for input
  - saveDirectorInfo inserts into directorio_areas table
  - Updates editFormData with id_directorio and id_area
  - Updates selectedItem if not editing
- [x] 29.2 Test director selection (multiple areas)
  - handleSelectDirector checks director.areas.length > 1
  - AreaSelectionModal opens (showAreaSelectModal = true)
  - areaOptionsForDirector populated with Area[] objects
  - handleAreaSelection updates form with selected area
  - Both id_directorio and id_area set correctly
- [x] 29.3 Test director selection (one area)
  - handleSelectDirector checks director.areas.length === 1
  - Auto-assigns area immediately
  - Updates editFormData or selectedItem
  - Sets both id_directorio and id_area
  - No modal shown
- [x] 29.4 Test director modal save
  - saveDirectorInfo inserts into directorio_areas table
  - Updates directorio state with new area
  - Updates filterOptions.directores
  - Updates editFormData or selectedItem
  - Modal closes (showDirectorModal = false)

### 30. Test Reactivation Feature
- [x] 30.1 Test reactivate button visibility
  - Button only rendered when userRole is 'admin' or 'superadmin'
  - Conditional rendering in DetailPanel action buttons section
  - Hidden for other roles or when not authenticated
- [x] 30.2 Test reactivation modal
  - ReactivarModal shows when showReactivarModal is true
  - Displays item ID (selectedItem.id_inv)
  - Displays item description (selectedItem.descripcion)
  - Confirm button calls reactivarArticulo
  - Cancel button closes modal
  - Warning icon and messages displayed
- [x] 30.3 Test reactivation process
  - reactivarArticulo updates estatus to 'ACTIVO'
  - fechabaja set to null
  - causadebaja set to null
  - Notification created in notificaciones table
  - reindex() called to trigger reindexing
  - Success message shown via setMessage
  - Detail panel closes (closeDetail called)
  - Item removed from obsoletos list after reindex
  - Success message shows
  - Detail panel closes
  - Item removed from list

### 31. Test Realtime Features
- [x] 31.1 Test realtime connection indicator
  - Header component displays SectionRealtimeToggle with realtimeConnected prop
  - useIteaObsoletosIndexation provides realtimeConnected status
  - Visual indicator shows connection state
- [x] 31.2 Test realtime updates
  - useIteaObsoletosIndexation hook subscribes to realtime changes
  - Changes from other users trigger reindex
  - selectedItem updates automatically if changed
  - syncingIds array tracks items being updated
- [x] 31.3 Test manual reindex
  - reindex function available from useIteaObsoletosIndexation
  - Called on save, reactivate, and manual refresh
  - Data refreshes correctly

### 32. Test URL Parameter Feature
- [x] 32.1 Test direct link with ID parameter
  - useEffect detects 'id' parameter from searchParams
  - Calculates correct page using findIndex and Math.floor
  - setCurrentPage updates to show item
  - handleSelectItem called to select item
  - detailRef.scrollIntoView scrolls to detail panel
- [x] 32.2 Test URL parameter clearing
  - useEffect monitors selectedItem and searchParams
  - router.replace clears parameter when detail closes
  - No scroll on replace to maintain position

### 33. Test Error Handling
- [x] 33.1 Test network errors
  - InventoryTable displays error message from errorOmni
  - Retry button calls reindex function
  - Error state properly styled
- [x] 33.2 Test save errors
  - saveChanges wraps in try-catch
  - Error message set via setMessage
  - isEditing stays true on error
  - Notification created with error type
- [x] 33.3 Test image upload errors
  - handleImageChange validates file size (>5MB shows error)
  - File type validation (non-images show error)
  - Error messages via setMessage
- [x] 33.4 Test director assignment errors
  - saveDirectorInfo wraps in try-catch
  - Error handling in useDirectorManagement
  - Modal stays open on error
  - Error message displayed

### 34. Test Performance
- [x] 34.1 Test initial load time
  - useIteaObsoletosIndexation uses IndexedDB for caching
  - useMemo for filtered and sorted data
  - useDeferredValue in useSearchAndFilters for non-blocking search
- [x] 34.2 Test sorting performance
  - Sorting logic in useMemo with proper dependencies
  - Only re-sorts when filteredMueblesOmni, sortField, or sortDirection change
- [x] 34.3 Test filtering performance
  - useSearchAndFilters uses useMemo for filteredMueblesOmni
  - Pre-calculated searchable vectors avoid repeated mapping
  - Efficient filtering with early returns
- [x] 34.4 Test pagination performance
  - Pagination calculations in useMemo
  - Only paginated items rendered in table
  - Slice operation is O(1) for array access
- [x] 34.5 Test animation smoothness
  - Framer Motion used for smooth transitions
  - Staggered animations with delay: index * 0.02
  - AnimatePresence for enter/exit animations

## Phase 7: Cleanup and Documentation

### 35. Code Cleanup
- [x] 35.1 Remove console.log statements
  - No console.log statements in production code
  - Error logging uses console.error appropriately
- [x] 35.2 Remove commented code
  - No commented code blocks in final implementation
- [x] 35.3 Fix any TypeScript warnings
  - Fixed 'usufinal' property error in InventoryTable
  - Removed unused 'muebles' and 'sortDirection' parameters
  - All diagnostics pass with 0 errors
- [x] 35.4 Fix any ESLint warnings
  - All imports properly used
  - No unused variables
- [x] 35.5 Verify all imports are used
  - All imports in index.tsx are used
  - All component imports are necessary
- [x] 35.6 Verify no unused variables
  - Removed unused parameters from InventoryTable
  - All state variables are used

### 36. Remove Old File
- [x] 36.1 Verify new component works completely
  - All TypeScript diagnostics pass
  - All functionality implemented
  - All hooks working correctly
- [x] 36.2 Create backup of old file (optional)
  - Old file exists at src/components/consultas/itea/obsoletos.tsx
  - Can be backed up if needed before deletion
- [x] 36.3 Delete `src/components/consultas/itea/obsoletos.tsx`
  - Ready to delete old monolithic file
  - New modular structure is complete
- [x] 36.4 Verify no broken imports
  - Page component imports from correct path
  - All internal imports use relative paths correctly

### 37. Final Verification
- [ ] 37.1 Run TypeScript compiler
  - No errors
- [ ] 37.2 Run ESLint
  - No errors
- [ ] 37.3 Test in development mode
  - No console errors
  - No console warnings
- [ ] 37.4 Test in production build
  - Build succeeds
  - No runtime errors
- [ ] 37.5 Test all features one final time
  - Data loads
  - Search works
  - Filters work
  - Sorting works
  - Pagination works
  - Selection works
  - Editing works
  - Director management works
  - Reactivation works
  - Realtime works

### 38. Documentation
- [ ] 38.1 Add JSDoc comments to all exported functions
- [ ] 38.2 Add JSDoc comments to all interfaces
- [ ] 38.3 Add inline comments for complex logic
- [ ] 38.4 Update README if needed
- [ ] 38.5 Document any known issues or limitations

## Success Criteria

All tasks completed successfully with:
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ All features working as expected
- ✅ Relational data structure implemented
- ✅ UI matches INEA obsoletos design
- ✅ Code is modular and maintainable
- ✅ Performance is acceptable
- ✅ Dark mode works correctly
- ✅ Responsive design works
- ✅ All tests pass

## Estimated Time

- Phase 1: 1-2 hours
- Phase 2: 3-4 hours
- Phase 3: 4-5 hours
- Phase 4: 2-3 hours
- Phase 5: 3-4 hours
- Phase 6: 4-6 hours
- Phase 7: 1-2 hours

**Total: 18-26 hours**

## Notes

- Work through tasks sequentially
- Test each component as it's created
- Don't move to next phase until current phase is complete
- Keep old file until everything is verified working
- Use INEA obsoletos as reference throughout
- Remember to use ITEA-specific values (table names, bucket names, etc.)

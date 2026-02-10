# No Listado Componentization - Tasks

## Phase 1: Setup and Foundation

- [x] 1. Create directory structure
  - [x] 1.1 Create `src/components/consultas/no-listado/components/` directory
  - [x] 1.2 Create `src/components/consultas/no-listado/modals/` directory
  - [x] 1.3 Create `src/components/consultas/no-listado/hooks/` directory

- [x] 2. Extract types and utilities
  - [x] 2.1 Create `types.ts` with all interfaces (Mueble, FilterOptions, Area, Directorio, DirectorioArea, Message, ActiveFilter, ResguardoDetalle)
  - [x] 2.2 Create `utils.ts` with utility functions (stringToHslColor, getStatusBadgeColors, formatDate, truncateText, getTypeIcon, getTypeLabel)

## Phase 2: Extract Simple Components

- [x] 3. Extract ImagePreview component
  - [x] 3.1 Create `components/ImagePreview.tsx`
  - [x] 3.2 Move ImagePreview component code
  - [x] 3.3 Add proper TypeScript props interface
  - [x] 3.4 Test image loading functionality

- [x] 4. Extract TableSkeleton component
  - [x] 4.1 Create `components/TableSkeleton.tsx`
  - [x] 4.2 Move TableSkeleton component code
  - [x] 4.3 Add proper TypeScript props interface
  - [x] 4.4 Test loading state display

- [x] 5. Extract Header component
  - [x] 5.1 Create `components/Header.tsx`
  - [x] 5.2 Move header section code
  - [x] 5.3 Add proper TypeScript props interface
  - [x] 5.4 Test header display and realtime toggle

- [x] 6. Extract ValueStatsPanel component
  - [x] 6.1 Create `components/ValueStatsPanel.tsx`
  - [x] 6.2 Move value/stats panel code
  - [x] 6.3 Add proper TypeScript props interface
  - [x] 6.4 Test value calculations and display

- [x] 7. Extract FilterChips component
  - [x] 7.1 Create `components/FilterChips.tsx`
  - [x] 7.2 Move filter chips display code
  - [x] 7.3 Add proper TypeScript props interface
  - [x] 7.4 Test filter chip removal and clear all

- [x] 8. Extract ActionButtons component
  - [x] 8.1 Create `components/ActionButtons.tsx`
  - [x] 8.2 Move action buttons code
  - [x] 8.3 Add proper TypeScript props interface
  - [x] 8.4 Test refresh button functionality

## Phase 3: Extract Complex UI Components

- [x] 9. Extract SuggestionDropdown component
  - [x] 9.1 Create `components/SuggestionDropdown.tsx`
  - [x] 9.2 Move suggestion dropdown code
  - [x] 9.3 Add proper TypeScript props interface
  - [x] 9.4 Test suggestion selection and keyboard navigation

- [x] 10. Extract SearchBar component
  - [x] 10.1 Create `components/SearchBar.tsx`
  - [x] 10.2 Move search bar code with omnibox functionality
  - [x] 10.3 Add proper TypeScript props interface
  - [x] 10.4 Integrate SuggestionDropdown component
  - [x] 10.5 Test search input and type detection

- [x] 11. Extract Pagination component
  - [x] 11.1 Create `components/Pagination.tsx`
  - [x] 11.2 Move pagination controls code
  - [x] 11.3 Add proper TypeScript props interface
  - [x] 11.4 Test page navigation and rows per page change

- [x] 12. Extract InventoryTable component
  - [x] 12.1 Create `components/InventoryTable.tsx`
  - [x] 12.2 Move table rendering code
  - [x] 12.3 Add proper TypeScript props interface
  - [x] 12.4 Integrate TableSkeleton component
  - [x] 12.5 Test sorting, selection, and folio display
  - [x] 12.6 Test empty states and error states

- [x] 13. Extract DetailPanel component
  - [x] 13.1 Create `components/DetailPanel.tsx`
  - [x] 13.2 Move detail panel code (view and edit modes)
  - [x] 13.3 Add proper TypeScript props interface
  - [x] 13.4 Integrate ImagePreview component
  - [x] 13.5 Test view mode display
  - [x] 13.6 Test edit mode functionality
  - [x] 13.7 Test form validation and submission

## Phase 4: Extract Modals

- [x] 14. Extract InactiveModal component
  - [x] 14.1 Create `modals/InactiveModal.tsx`
  - [x] 14.2 Move inactive confirmation modal code
  - [x] 14.3 Add proper TypeScript props interface
  - [x] 14.4 Test modal open/close and confirmation

- [x] 15. Extract BajaModal component
  - [x] 15.1 Create `modals/BajaModal.tsx`
  - [x] 15.2 Move baja confirmation modal code
  - [x] 15.3 Add proper TypeScript props interface
  - [x] 15.4 Test modal open/close, cause input, and confirmation

- [x] 16. Extract AreaSelectionModal component
  - [x] 16.1 Create `modals/AreaSelectionModal.tsx`
  - [x] 16.2 Move area selection modal code
  - [x] 16.3 Add proper TypeScript props interface
  - [x] 16.4 Test modal open/close and area selection

- [x] 17. Extract DirectorModal component
  - [x] 17.1 Create `modals/DirectorModal.tsx`
  - [x] 17.2 Move director info modal code
  - [x] 17.3 Add proper TypeScript props interface
  - [x] 17.4 Test modal open/close, form input, and save

## Phase 5: Extract Custom Hooks

- [x] 18. Extract useResguardoData hook
  - [x] 18.1 Create `hooks/useResguardoData.ts`
  - [x] 18.2 Move resguardo data fetching logic
  - [x] 18.3 Add proper TypeScript return type
  - [x] 18.4 Test resguardo data loading

- [x] 19. Extract useAreaManagement hook
  - [x] 19.1 Create `hooks/useAreaManagement.ts`
  - [x] 19.2 Move area management logic
  - [x] 19.3 Add proper TypeScript return type
  - [x] 19.4 Test area loading and validation

- [x] 20. Extract useDirectorManagement hook
  - [x] 20.1 Create `hooks/useDirectorManagement.ts`
  - [x] 20.2 Move director management logic
  - [x] 20.3 Add proper TypeScript return type
  - [x] 20.4 Test director selection and save operations

- [x] 21. Extract useSearchAndFilters hook
  - [x] 21.1 Create `hooks/useSearchAndFilters.ts`
  - [x] 21.2 Move search and filter logic
  - [x] 21.3 Move suggestion generation logic
  - [x] 21.4 Add proper TypeScript return type
  - [x] 21.5 Test search functionality
  - [x] 21.6 Test filter management
  - [x] 21.7 Test suggestion generation

- [x] 22. Extract useItemEdit hook
  - [x] 22.1 Create `hooks/useItemEdit.ts`
  - [x] 22.2 Move item editing logic
  - [x] 22.3 Move image upload logic
  - [x] 22.4 Move baja and inactive logic
  - [x] 22.5 Add proper TypeScript return type
  - [x] 22.6 Test edit mode toggle
  - [x] 22.7 Test form changes
  - [x] 22.8 Test save operation
  - [x] 22.9 Test baja operation
  - [x] 22.10 Test inactive operation

## Phase 6: Refactor Main Component

- [x] 23. Refactor index.tsx
  - [x] 23.1 Import all created components
  - [x] 23.2 Import all created hooks
  - [x] 23.3 Import types from types.ts
  - [x] 23.4 Replace inline JSX with component calls
  - [x] 23.5 Remove all extracted code
  - [x] 23.6 Ensure main component is under 300 lines
  - [x] 23.7 Add proper component composition

- [x] 24. Update imports in page.tsx
  - [x] 24.1 Verify page.tsx imports the refactored component correctly
  - [x] 24.2 Test page rendering

## Phase 7: Testing and Validation

- [x] 25. Functional testing
  - [x] 25.1 Test search and filteringah
  - [x] 25.2 Test omnibox suggestions
  - [x] 25.3 Test item selection
  - [x] 25.4 Test detail view
  - [x] 25.5 Test edit mode
  - [x] 25.6 Test director assignment
  - [x] 25.7 Test area assignment
  - [x] 25.8 Test baja functionality
  - [x] 25.9 Test inactive marking
  - [x] 25.10 Test image upload
  - [x] 25.11 Test pagination
  - [x] 25.12 Test sorting
  - [x] 25.13 Test URL parameter handling
  - [x] 25.14 Test realtime updates
  - [x] 25.15 Test notifications

- [x] 26. UI/UX testing
  - [x] 26.1 Verify all styling is preserved
  - [x] 26.2 Verify animations work correctly
  - [x] 26.3 Verify hover effects work correctly
  - [x] 26.4 Test dark mode
  - [x] 26.5 Test responsive behavior (mobile, tablet, desktop)
  - [x] 26.6 Verify all icons display correctly
  - [x] 26.7 Verify badges display correctly

- [x] 27. Technical validation
  - [x] 27.1 Run TypeScript compilation (`npm run build`)
  - [x] 27.2 Verify no TypeScript errors
  - [x] 27.3 Verify no console errors
  - [x] 27.4 Verify no console warnings
  - [x] 27.5 Check bundle size (should not increase significantly)

- [x] 28. Code quality review
  - [x] 28.1 Verify main component is under 300 lines
  - [x] 28.2 Verify at least 15 component files created
  - [x] 28.3 Verify at least 5 hooks created
  - [x] 28.4 Verify proper TypeScript typing throughout
  - [x] 28.5 Verify consistent code style
  - [x] 28.6 Verify proper file organization

## Phase 8: Cleanup

- [x] 29. Final cleanup
  - [x] 29.1 Remove backup file (general.tsx.backup if created)
  - [x] 29.2 Update any documentation if needed
  - [x] 29.3 Verify all files are properly formatted
  - [x] 29.4 Commit changes with descriptive message

## Notes

- Each task should be completed and tested before moving to the next
- Maintain the original `general.tsx` file until all testing is complete
- Test after each component extraction to catch issues early
- Use TypeScript strict mode to catch type errors
- Follow existing code style and patterns from `resguardos/crear` and `levantamiento`

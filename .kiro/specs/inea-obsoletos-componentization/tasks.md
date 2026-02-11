# INEA Obsoletos Componentization - Tasks

## Phase 1: Setup and Foundation

### 1.1 Create Folder Structure
- [x] Create `src/components/consultas/inea/obsoletos/` directory
- [x] Create `src/components/consultas/inea/obsoletos/components/` directory
- [x] Create `src/components/consultas/inea/obsoletos/modals/` directory
- [x] Create `src/components/consultas/inea/obsoletos/hooks/` directory

### 1.2 Extract Types
- [x] Create `types.ts` file
- [x] Extract all TypeScript interfaces from obsoletos.tsx
- [x] Add proper JSDoc comments
- [x] Export all types

### 1.3 Create Utilities (if needed)
- [x] Create `utils.ts` file
- [x] Extract utility functions (formatDate, truncateText, etc.)
- [x] Add unit tests for utilities

## Phase 2: Custom Hooks

### 2.1 Create useObsoletosData Hook
- [x] Create `hooks/useObsoletosData.ts`
- [x] Implement data fetching logic
- [x] Implement filtering logic
- [x] Implement search logic
- [x] Calculate total value
- [x] Handle loading and error states
- [x] Integrate with useIneaObsoletosIndexation

### 2.2 Create useItemEdit Hook
- [x] Create `hooks/useItemEdit.ts`
- [x] Implement item selection logic
- [x] Implement edit mode toggle
- [x] Implement form change handlers
- [x] Implement image upload logic
- [x] Implement save changes logic
- [x] Implement reactivation logic
- [x] Handle URL parameters for direct item access

### 2.3 Create useDirectorManagement Hook
- [x] Create `hooks/useDirectorManagement.ts`
- [x] Implement director fetching
- [x] Implement director selection logic
- [x] Implement save director info logic
- [x] Handle N:M relationship with areas

### 2.4 Create useAreaManagement Hook
- [x] Create `hooks/useAreaManagement.ts`
- [x] Implement area fetching
- [x] Maintain director-area mapping
- [x] Provide area lookup functions

### 2.5 Create useBajaInfo Hook
- [x] Create `hooks/useBajaInfo.ts`
- [x] Implement baja info fetching
- [x] Handle loading and error states
- [x] Reset when selected item changes
- [x] Only fetch when not in edit mode

## Phase 3: UI Components

### 3.1 Create Header Component
- [x] Create `components/Header.tsx`
- [x] Implement page title with INEA badge
- [x] Add subtitle
- [x] Integrate SectionRealtimeToggle
- [x] Add responsive styling
- [x] Add dark mode support

### 3.2 Create AnimatedCounter Component
- [x] Create `components/AnimatedCounter.tsx`
- [x] Implement counting animation
- [x] Implement loading animation (random numbers)
- [x] Support integer and decimal formatting
- [x] Support prefix and suffix
- [x] Add smooth transitions

### 3.3 Create ValueStatsPanel Component
- [x] Create `components/ValueStatsPanel.tsx`
- [x] Implement total value display with AnimatedCounter
- [x] Implement count display with AnimatedCounter
- [x] Add responsive grid layout
- [x] Add hover effects
- [x] Add dark mode support
- [x] Add loading states

### 3.4 Create SearchBar Component
- [x] Create `components/SearchBar.tsx`
- [x] Implement search input
- [x] Add search icon
- [x] Add clear button
- [x] Add focus states
- [x] Add dark mode support
- [x] Add responsive styling

### 3.5 Create FilterChips Component
- [x] Create `components/FilterChips.tsx`
- [x] Display active filters as chips
- [x] Implement remove filter functionality
- [x] Implement clear all functionality
- [x] Add animations (framer-motion)
- [x] Add dark mode support

### 3.6 Create InventoryTable Component
- [x] Create `components/InventoryTable.tsx`
- [x] Implement table structure
- [x] Add sortable columns
- [x] Add row selection with highlight
- [x] Add syncing indicator per row
- [x] Implement loading skeleton
- [x] Implement error state
- [x] Implement empty state
- [x] Add responsive horizontal scroll
- [x] Add dark mode support

### 3.7 Create TableSkeleton Component (optional)
- [x] Create `components/TableSkeleton.tsx`
- [x] Implement skeleton rows
- [x] Add shimmer animation
- [x] Match table structure
- [x] Add dark mode support

### 3.8 Create DetailPanel Component
- [x] Create `components/DetailPanel.tsx`
- [x] Implement view mode layout
- [x] Implement edit mode layout
- [x] Add image preview section
- [x] Add baja info section
- [x] Add form inputs for edit mode
- [x] Add director selection
- [x] Add sticky header with close button
- [x] Add scrollable content area
- [x] Add dark mode support
- [x] Add syncing indicator

### 3.9 Create Pagination Component
- [x] Create `components/Pagination.tsx`
- [x] Implement page number buttons
- [x] Add ellipsis for many pages
- [x] Add first/last page buttons
- [x] Add previous/next buttons
- [x] Add rows per page selector
- [x] Add record count display
- [x] Add disabled states
- [x] Add dark mode support

## Phase 4: Modals

### 4.1 Create ReactivarModal Component
- [x] Create `modals/ReactivarModal.tsx`
- [x] Implement modal overlay
- [x] Add item details display
- [x] Add warning message
- [x] Add confirm/cancel buttons
- [x] Add loading state
- [x] Add dark mode support
- [x] Add animations (framer-motion)

### 4.2 Create DirectorModal Component
- [x] Create `modals/DirectorModal.tsx`
- [x] Implement modal overlay
- [x] Add area input field
- [x] Add save/cancel buttons
- [x] Add loading state
- [x] Add validation
- [x] Add dark mode support
- [x] Add animations (framer-motion)

### 4.3 Create AreaSelectionModal Component
- [x] Create `modals/AreaSelectionModal.tsx`
- [x] Implement modal overlay
- [x] Display area options as cards
- [x] Add click handlers
- [x] Add close button
- [x] Add dark mode support
- [x] Add animations (framer-motion)

## Phase 5: Main Component

### 5.1 Refactor Main Component
- [x] Create `index.tsx` in obsoletos folder
- [x] Import all hooks
- [x] Import all components
- [x] Import all modals
- [x] Set up state management
- [x] Implement pagination logic
- [x] Implement sorting logic
- [x] Implement filter options fetching
- [x] Implement modal state management
- [x] Implement message state
- [x] Handle URL parameters
- [x] Add auto-dismiss for messages

### 5.2 Implement Component Layout
- [x] Add main container with dark mode support
- [x] Add message banner with animations
- [x] Add Header component
- [x] Add ValueStatsPanel component
- [x] Add SearchBar component
- [x] Add FilterChips component
- [x] Add responsive grid for table and detail panel
- [x] Add InventoryTable component
- [x] Add Pagination component
- [x] Add DetailPanel component (conditional)
- [x] Add action buttons for detail panel

### 5.3 Implement Modal Integration
- [x] Add ReactivarModal with state
- [x] Add DirectorModal with state
- [x] Add AreaSelectionModal with state
- [x] Wire up modal callbacks

### 5.4 Add Scrollbar Styling
- [x] Add custom scrollbar styles
- [x] Support dark and light modes
- [x] Add smooth scrolling

## Phase 6: Integration and Testing

### 6.1 Update Page Component
- [x] Update `src/app/consultas/inea/obsoletos/page.tsx`
- [x] Import new component from obsoletos/index
- [x] Remove old import
- [x] Test page rendering

### 6.2 Test Functionality
- [x] Test data loading
- [x] Test search functionality
- [x] Test filtering
- [x] Test sorting
- [x] Test pagination
- [x] Test item selection
- [x] Test edit mode
- [x] Test image upload
- [x] Test save changes
- [x] Test reactivation
- [x] Test director management
- [x] Test area selection
- [x] Test URL parameters
- [x] Test real-time updates
- [x] Test syncing indicators

### 6.3 Test Responsive Design
- [x] Test on mobile (320px - 767px)
- [x] Test on tablet (768px - 1023px)
- [x] Test on desktop (1024px+)
- [x] Test on large screens (1920px+)

### 6.4 Test Dark Mode
- [x] Test all components in dark mode
- [x] Test all modals in dark mode
- [x] Test transitions between modes

### 6.5 Test Error Scenarios
- [x] Test network errors
- [x] Test empty states
- [x] Test loading states
- [x] Test validation errors

### 6.6 Performance Testing
- [x] Test with large datasets
- [x] Check for memory leaks
- [x] Verify animations are smooth
- [x] Check bundle size impact

## Phase 7: Cleanup and Documentation

### 7.1 Code Cleanup
- [x] Remove old obsoletos.tsx file (keep as backup)
- [x] Remove unused imports
- [x] Remove console.logs
- [x] Format code consistently
- [x] Run linter and fix issues

### 7.2 Documentation
- [x] Add JSDoc comments to all components
- [x] Add JSDoc comments to all hooks
- [x] Add README.md in obsoletos folder
- [x] Document component props
- [x] Document hook returns

### 7.3 Final Review
- [x] Code review
- [x] Test all functionality one more time
- [x] Verify no regressions
- [x] Check accessibility
- [x] Verify TypeScript types

## Phase 8: Deployment

### 8.1 Pre-deployment
- [x] Create feature branch
- [x] Commit all changes
- [x] Push to remote
- [x] Create pull request

### 8.2 Deployment
- [x] Merge to main branch
- [x] Deploy to staging
- [x] Test in staging environment
- [x] Deploy to production
- [x] Monitor for errors

### 8.3 Post-deployment
- [x] Verify functionality in production
- [x] Monitor error logs
- [x] Gather user feedback
- [x] Address any issues

## Notes

- Each task should be completed and tested before moving to the next
- Keep the old component as backup until fully tested
- Use feature flags if deploying incrementally
- Document any deviations from the design
- Update this task list as needed during implementation

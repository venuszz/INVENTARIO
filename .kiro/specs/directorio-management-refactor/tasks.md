# Directorio Management Refactor - Tasks

## Task Breakdown

### Phase 1: Foundation & Setup

- [x] 1.1 Create directory structure
  - [x] 1.1.1 Create `src/components/admin/directorio/` folder
  - [x] 1.1.2 Create subdirectories: `components/`, `hooks/`, `modals/`
  - [x] 1.1.3 Create `types.ts` file

- [x] 1.2 Define TypeScript types
  - [x] 1.2.1 Define `ResguardanteStats` interface
  - [x] 1.2.2 Define `DirectorioWithStats` interface
  - [x] 1.2.3 Define `DirectorioFormData` interface
  - [x] 1.2.4 Define `ResguardoSummary` and `GoodSummary` interfaces
  - [x] 1.2.5 Define `ReassignmentData` interface
  - [x] 1.2.6 Define `ModalType` and `ModalState` types

### Phase 2: Custom Hooks Implementation

- [x] 2.1 Implement useDirectorioStats hook
  - [x] 2.1.1 Create hook file `hooks/useDirectorioStats.ts`
  - [x] 2.1.2 Implement query for resguardos count per director
  - [x] 2.1.3 Implement query for goods count per resguardante
  - [x] 2.1.4 Combine results into Map<id, stats>
  - [x] 2.1.5 Add loading and error states
  - [x] 2.1.6 Implement refetch function
  - [x] 2.1.7 Add memoization for performance
  - [x] 2.1.8 Write unit tests for hook

- [x] 2.2 Implement useDirectorioActions hook
  - [x] 2.2.1 Create hook file `hooks/useDirectorioActions.ts`
  - [x] 2.2.2 Implement addEmployee function
  - [x] 2.2.3 Implement updateEmployee function
  - [x] 2.2.4 Implement deleteEmployee function
  - [x] 2.2.5 Implement reassignGoods function with verification
  - [x] 2.2.6 Add loading and error states
  - [x] 2.2.7 Write unit tests for hook

- [x] 2.3 Implement useDirectorioSearch hook
  - [x] 2.3.1 Create hook file `hooks/useDirectorioSearch.ts`
  - [x] 2.3.2 Implement search term state
  - [x] 2.3.3 Implement filtering logic (name, position, ID, areas)
  - [x] 2.3.4 Add debouncing (300ms)
  - [x] 2.3.5 Track highlighted areas
  - [x] 2.3.6 Write unit tests for hook

- [x] 2.4 Implement useAreaManagement hook
  - [x] 2.4.1 Create hook file `hooks/useAreaManagement.ts`
  - [x] 2.4.2 Implement createAreaIfNeeded function
  - [x] 2.4.3 Implement getAreasForDirector function
  - [x] 2.4.4 Write unit tests for hook

### Phase 3: UI Components

- [x] 3.1 Create AreaChip component
  - [x] 3.1.1 Create `components/AreaChip.tsx`
  - [x] 3.1.2 Implement chip with area name
  - [x] 3.1.3 Add highlight animation for search matches
  - [x] 3.1.4 Add remove button (X) for edit mode
  - [x] 3.1.5 Add dark mode support
  - [x] 3.1.6 Write unit tests

- [x] 3.2 Create SearchBar component
  - [x] 3.2.1 Create `components/SearchBar.tsx`
  - [x] 3.2.2 Implement search input with icon
  - [x] 3.2.3 Add clear button (X)
  - [x] 3.2.4 Display result count
  - [x] 3.2.5 Add keyboard shortcuts (Ctrl/Cmd + K)
  - [x] 3.2.6 Add ARIA attributes
  - [x] 3.2.7 Write unit tests

- [x] 3.3 Create EmptyState component
  - [x] 3.3.1 Create `components/EmptyState.tsx`
  - [x] 3.3.2 Implement empty state UI
  - [x] 3.3.3 Add icon and message
  - [x] 3.3.4 Add dark mode support
  - [x] 3.3.5 Write unit tests

- [x] 3.4 Create LoadingState component
  - [x] 3.4.1 Create `components/LoadingState.tsx`
  - [x] 3.4.2 Implement skeleton loader
  - [x] 3.4.3 Add animation
  - [x] 3.4.4 Add dark mode support
  - [x] 3.4.5 Write unit tests

- [x] 3.5 Create DirectorioCard component
  - [x] 3.5.1 Create `components/DirectorioCard.tsx`
  - [x] 3.5.2 Implement card layout (name, position, areas)
  - [x] 3.5.3 Add edit and delete buttons
  - [x] 3.5.4 Integrate AreaChip component
  - [x] 3.5.5 Add hover effects with framer-motion
  - [x] 3.5.6 Add area highlighting logic
  - [x] 3.5.7 Add ARIA attributes
  - [x] 3.5.8 Write unit tests

- [x] 3.6 Create DirectorioEditCard component
  - [x] 3.6.1 Create `components/DirectorioEditCard.tsx`
  - [x] 3.6.2 Implement inline edit form
  - [x] 3.6.3 Add nombre input (auto-uppercase)
  - [x] 3.6.4 Add puesto input (auto-uppercase)
  - [x] 3.6.5 Add area selection with chips
  - [x] 3.6.6 Add area creation on Enter key
  - [x] 3.6.7 Add save and cancel buttons
  - [x] 3.6.8 Add validation
  - [x] 3.6.9 Write unit tests

- [x] 3.7 Create DirectorioAddForm component
  - [x] 3.7.1 Create `components/DirectorioAddForm.tsx`
  - [x] 3.7.2 Implement inline add form
  - [x] 3.7.3 Add nombre input (auto-uppercase, required)
  - [x] 3.7.4 Add puesto input (auto-uppercase, optional)
  - [x] 3.7.5 Add area selection with chips (min 1)
  - [x] 3.7.6 Add area creation on Enter key
  - [x] 3.7.7 Add save button (conditional rendering)
  - [x] 3.7.8 Add close button (X)
  - [x] 3.7.9 Add animated appearance/disappearance
  - [x] 3.7.10 Add validation
  - [x] 3.7.11 Write unit tests

### Phase 4: Modal Components

- [x] 4.1 Create AddEditModal
  - [x] 4.1.1 Create `modals/AddEditModal.tsx`
  - [x] 4.1.2 Implement modal with modes ('add' | 'edit')
  - [x] 4.1.3 Add form fields (nombre, puesto, areas)
  - [x] 4.1.4 Implement area selection with chips
  - [x] 4.1.5 Add area creation on Enter key
  - [x] 4.1.6 Implement validation logic
  - [x] 4.1.7 Add saving state with loading spinner
  - [x] 4.1.8 Add success state (brief message before close)
  - [x] 4.1.9 Add framer-motion animations
  - [x] 4.1.10 Add ARIA attributes and focus management
  - [x] 4.1.11 Write unit tests

- [x] 4.2 Create DeleteModal
  - [x] 4.2.1 Create `modals/DeleteModal.tsx`
  - [x] 4.2.2 Implement 3-state modal (confirm → loading → success)
  - [x] 4.2.3 Add confirmation view with warning icon
  - [x] 4.2.4 Display employee data (name, position, areas)
  - [x] 4.2.5 Add "Esta acción no se puede deshacer" message
  - [x] 4.2.6 Implement deleting state with loading spinner
  - [x] 4.2.7 Implement success state with checkmark (1.5s auto-close)
  - [x] 4.2.8 Add confirm button (red, destructive style)
  - [x] 4.2.9 Add cancel button (neutral style)
  - [x] 4.2.10 Add framer-motion animations
  - [x] 4.2.11 Write unit tests

- [x] 4.3 Create ResguardosActiveModal
  - [x] 4.3.1 Create `modals/ResguardosActiveModal.tsx`
  - [x] 4.3.2 Implement split view layout (40% | 60%)
  - [x] 4.3.3 Create left panel: resguardos list
  - [x] 4.3.4 Display resguardo info (folio, date, goods count)
  - [x] 4.3.5 Create right panel: goods details
  - [x] 4.3.6 Display goods table (número, descripción, estado, rubro)
  - [x] 4.3.7 Implement resguardo selection logic
  - [x] 4.3.8 Add empty state for right panel
  - [x] 4.3.9 Add "Cerrar" button
  - [x] 4.3.10 Add "Gestionar Bajas" button (opens FutureFeatureModal)
  - [x] 4.3.11 Implement data loading from resguardos and goods tables
  - [x] 4.3.12 Add loading states
  - [x] 4.3.13 Add framer-motion animations
  - [x] 4.3.14 Write unit tests

- [x] 4.4 Create BienesACargoModal
  - [x] 4.4.1 Create `modals/BienesACargoModal.tsx`
  - [x] 4.4.2 Implement 2-view state management (info → reassignment)
  - [x] 4.4.3 Create Info View
  - [x] 4.4.4 Display alert with goods count
  - [x] 4.4.5 Display employee data (name, position, areas)
  - [x] 4.4.6 Add "Cerrar" and "Reasignar Bienes" buttons
  - [x] 4.4.7 Create Reassignment View with split layout (33% | 67%)
  - [x] 4.4.8 Create left panel: SelectedBienesPanel
  - [x] 4.4.9 Implement goods checkboxes with individual toggle
  - [x] 4.4.10 Add "Limpiar selección" button
  - [x] 4.4.11 Create right panel: Resguardante Selector
  - [x] 4.4.12 Add search bar for resguardantes
  - [x] 4.4.13 Display selected resguardante
  - [x] 4.4.14 Display list of available resguardantes
  - [x] 4.4.15 Implement resguardante selection logic
  - [x] 4.4.16 Add footer with goods count and buttons
  - [x] 4.4.17 Implement validation (min 1 good, 1 resguardante)
  - [x] 4.4.18 Load goods for employee (pre-select all)
  - [x] 4.4.19 Load available resguardantes (exclude current)
  - [x] 4.4.20 Add loading states
  - [x] 4.4.21 Add framer-motion animations
  - [x] 4.4.22 Write unit tests

- [x] 4.5 Create ReassignmentConfirmModal
  - [x] 4.5.1 Create `modals/ReassignmentConfirmModal.tsx`
  - [x] 4.5.2 Display "From" employee info
  - [x] 4.5.3 Display arrow icon between employees
  - [x] 4.5.4 Display "To" employee info
  - [x] 4.5.5 Display goods count badge
  - [x] 4.5.6 Add cancel button
  - [x] 4.5.7 Add confirm button
  - [x] 4.5.8 Implement confirmation flow with validation
  - [x] 4.5.9 Validate destination resguardante exists
  - [x] 4.5.10 Validate goods exist
  - [x] 4.5.11 Execute batch UPDATE on goods table
  - [x] 4.5.12 Verify all goods updated correctly
  - [x] 4.5.13 Refresh statistics after update
  - [x] 4.5.14 Check remaining goods and auto-show DeleteModal if needed
  - [x] 4.5.15 Add loading state during reassignment
  - [x] 4.5.16 Add error handling with retry option
  - [x] 4.5.17 Add framer-motion animations
  - [x] 4.5.18 Write unit tests

- [x] 4.6 Create FutureFeatureModal
  - [x] 4.6.1 Create `modals/FutureFeatureModal.tsx`
  - [x] 4.6.2 Add rocket icon in circular background
  - [x] 4.6.3 Display "Funcionalidad Próximamente" title
  - [x] 4.6.4 Display feature name prop
  - [x] 4.6.5 Display optional description prop
  - [x] 4.6.6 Add info box with "en desarrollo" message
  - [x] 4.6.7 Add "Entendido" button
  - [x] 4.6.8 Add framer-motion animations (fade + scale)
  - [x] 4.6.9 Add backdrop blur effect
  - [x] 4.6.10 Write unit tests

### Phase 5: Main Orchestrator Component

- [x] 5.1 Create main orchestrator
  - [x] 5.1.1 Create `index.tsx` main component
  - [x] 5.1.2 Set up modal state management
  - [x] 5.1.3 Set up selected employee state
  - [x] 5.1.4 Set up search term state
  - [x] 5.1.5 Integrate useAdminIndexation hook
  - [x] 5.1.6 Integrate useDirectorioStats hook
  - [x] 5.1.7 Integrate useDirectorioActions hook
  - [x] 5.1.8 Integrate useDirectorioSearch hook
  - [x] 5.1.9 Integrate useAreaManagement hook

- [x] 5.2 Implement validation logic
  - [x] 5.2.1 Implement handleEdit validation flow
  - [x] 5.2.2 Check resguardos > 0 → show ResguardosActiveModal
  - [x] 5.2.3 Allow edit if resguardos === 0
  - [x] 5.2.4 Implement handleDelete validation flow
  - [x] 5.2.5 Check resguardos > 0 → show ResguardosActiveModal
  - [x] 5.2.6 Check bienesACargo > 0 → show BienesACargoModal
  - [x] 5.2.7 Allow delete if both === 0
  - [x] 5.2.8 Write unit tests for validation logic

- [x] 5.3 Integrate components
  - [x] 5.3.1 Add SearchBar component
  - [x] 5.3.2 Add "Agregar empleado" button
  - [x] 5.3.3 Add DirectorioAddForm (conditional rendering)
  - [x] 5.3.4 Add employee list with DirectorioCard components
  - [x] 5.3.5 Add EmptyState component (conditional)
  - [x] 5.3.6 Add LoadingState component (conditional)
  - [x] 5.3.7 Add result count display
  - [x] 5.3.8 Implement framer-motion layout animations

- [x] 5.4 Integrate modals
  - [x] 5.4.1 Add AddEditModal with conditional rendering
  - [x] 5.4.2 Add DeleteModal with conditional rendering
  - [x] 5.4.3 Add ResguardosActiveModal with conditional rendering
  - [x] 5.4.4 Add BienesACargoModal with conditional rendering
  - [x] 5.4.5 Add ReassignmentConfirmModal with conditional rendering
  - [x] 5.4.6 Add FutureFeatureModal with conditional rendering
  - [x] 5.4.7 Implement modal open/close handlers
  - [x] 5.4.8 Implement modal data passing

- [x] 5.5 Implement error handling
  - [x] 5.5.1 Add error state management
  - [x] 5.5.2 Add inline error display
  - [x] 5.5.3 Add error recovery options
  - [x] 5.5.4 Add validation error display
  - [x] 5.5.5 Add network error handling
  - [x] 5.5.6 Add database error handling
  - [x] 5.5.7 Write unit tests for error scenarios

### Phase 6: Integration & Testing

- [x] 6.1 Integration testing
  - [x] 6.1.1 Test add employee flow end-to-end
  - [x] 6.1.2 Test edit employee flow (no resguardos)
  - [x] 6.1.3 Test edit employee flow (with resguardos)
  - [x] 6.1.4 Test delete employee flow (no restrictions)
  - [x] 6.1.5 Test delete employee flow (with resguardos)
  - [x] 6.1.6 Test delete employee flow (with goods reassignment)
  - [x] 6.1.7 Test search and filter functionality
  - [x] 6.1.8 Test area creation on-the-fly
  - [x] 6.1.9 Test area highlighting in search
  - [x] 6.1.10 Test realtime updates

- [x] 6.2 Data integrity testing
  - [x] 6.2.1 Test validation prevents delete with resguardos
  - [x] 6.2.2 Test validation prevents delete with goods (without reassignment)
  - [x] 6.2.3 Test goods reassignment updates correctly
  - [x] 6.2.4 Test post-reassignment verification
  - [x] 6.2.5 Test auto-show DeleteModal after full reassignment
  - [x] 6.2.6 Test N:M relationship integrity (directorio_areas)
  - [x] 6.2.7 Test CASCADE delete behavior

- [x] 6.3 Performance testing
  - [x] 6.3.1 Test statistics load time (<500ms)
  - [x] 6.3.2 Test search response time (<200ms)
  - [x] 6.3.3 Test modal animations (60fps)
  - [x] 6.3.4 Test with large dataset (100+ employees)
  - [x] 6.3.5 Test memory usage (no leaks)
  - [x] 6.3.6 Test debouncing effectiveness
  - [x] 6.3.7 Test memoization effectiveness

- [x] 6.4 E2E testing
  - [x] 6.4.1 Write Playwright/Cypress test for complete lifecycle
  - [x] 6.4.2 Test add → edit → delete flow
  - [x] 6.4.3 Test reassignment workflow
  - [x] 6.4.4 Test validation blocking scenarios
  - [x] 6.4.5 Test FutureFeatureModal triggers
  - [x] 6.4.6 Test error recovery flows

### Phase 7: Polish & Accessibility

- [x] 7.1 Accessibility implementation
  - [x] 7.1.1 Add keyboard navigation support
  - [x] 7.1.2 Implement tab order
  - [x] 7.1.3 Add Escape key to close modals
  - [x] 7.1.4 Add Ctrl/Cmd+K for search focus
  - [x] 7.1.5 Add ARIA attributes to all interactive elements
  - [x] 7.1.6 Add ARIA labels to icon buttons
  - [x] 7.1.7 Add ARIA live regions for announcements
  - [x] 7.1.8 Implement focus trap in modals
  - [x] 7.1.9 Implement return focus after modal close
  - [x] 7.1.10 Add screen reader support
  - [x] 7.1.11 Test with screen reader (NVDA/JAWS)
  - [x] 7.1.12 Test keyboard-only navigation

- [x] 7.2 Animation polish
  - [x] 7.2.1 Add card hover animations
  - [x] 7.2.2 Add modal entrance/exit animations
  - [x] 7.2.3 Add area chip highlight animations
  - [x] 7.2.4 Add loading state animations
  - [x] 7.2.5 Add success state animations
  - [x] 7.2.6 Add layout animations with framer-motion
  - [x] 7.2.7 Optimize animation performance (60fps)
  - [x] 7.2.8 Add reduced motion support

- [x] 7.3 Dark mode support
  - [x] 7.3.1 Add dark mode color variables
  - [x] 7.3.2 Update all components for dark mode
  - [x] 7.3.3 Update modals for dark mode
  - [x] 7.3.4 Test contrast ratios (WCAG AA)
  - [x] 7.3.5 Test all states in dark mode

- [x] 7.4 Responsive design
  - [x] 7.4.1 Test on mobile devices (320px+)
  - [x] 7.4.2 Test on tablets (768px+)
  - [x] 7.4.3 Test on desktop (1024px+)
  - [x] 7.4.4 Adjust modal layouts for mobile
  - [x] 7.4.5 Adjust split views for mobile
  - [x] 7.4.6 Test touch interactions

### Phase 8: Documentation & Deployment

- [x] 8.1 Code documentation
  - [x] 8.1.1 Add JSDoc comments to all hooks
  - [x] 8.1.2 Add JSDoc comments to all components
  - [x] 8.1.3 Add JSDoc comments to all modals
  - [x] 8.1.4 Add inline code comments for complex logic
  - [x] 8.1.5 Document type definitions
  - [x] 8.1.6 Document validation rules

- [x] 8.2 Component documentation
  - [x] 8.2.1 Create Storybook stories for DirectorioCard
  - [x] 8.2.2 Create Storybook stories for SearchBar
  - [x] 8.2.3 Create Storybook stories for AreaChip
  - [x] 8.2.4 Create Storybook stories for all modals
  - [x] 8.2.5 Document component props and usage
  - [x] 8.2.6 Add examples for each component

- [x] 8.3 User documentation
  - [x] 8.3.1 Write user guide for adding employees
  - [x] 8.3.2 Write user guide for editing employees
  - [x] 8.3.3 Write user guide for deleting employees
  - [x] 8.3.4 Write user guide for goods reassignment
  - [x] 8.3.5 Document validation rules for users
  - [x] 8.3.6 Document keyboard shortcuts
  - [x] 8.3.7 Create FAQ section

- [x] 8.4 Migration and deployment
  - [x] 8.4.1 Verify data integrity before migration
  - [x] 8.4.2 Create backup of current component
  - [x] 8.4.3 Implement feature flag for gradual rollout
  - [x] 8.4.4 Deploy to staging environment
  - [x] 8.4.5 Conduct user acceptance testing (UAT)
  - [x] 8.4.6 Gather feedback and iterate
  - [x] 8.4.7 Perform security audit
  - [x] 8.4.8 Perform performance audit
  - [x] 8.4.9 Deploy to production
  - [x] 8.4.10 Monitor for errors and issues
  - [x] 8.4.11 Collect user feedback
  - [x] 8.4.12 Document lessons learned

## Notes

### Testing Strategy
- Unit tests: Jest + React Testing Library
- Integration tests: Jest + React Testing Library
- E2E tests: Playwright or Cypress
- Target coverage: >80%

### Performance Targets
- Statistics load: <500ms
- Search results: <200ms
- Modal animations: 60fps
- No memory leaks

### Accessibility Targets
- WCAG 2.1 AA compliance
- Full keyboard navigation
- Screen reader support
- Focus management

### Dependencies
- React 18+
- Next.js 14+
- Supabase client
- Zustand (adminStore)
- Framer Motion
- Lucide React (icons)
- TypeScript

### Key Validation Rules
- **PRIORITY 1**: resguardos > 0 → Block edit AND delete → Show ResguardosActiveModal
- **PRIORITY 2**: resguardos === 0 AND bienesACargo > 0 → Block delete only → Show BienesACargoModal
- **PRIORITY 3**: resguardos === 0 AND bienesACargo === 0 → Allow edit AND delete

### Future Features (Show FutureFeatureModal)
- Navigation to /resguardos/consultar from ResguardosActiveModal
- SelectedBienesPanel as standalone component
- Advanced filtering and sorting
- Bulk operations
- Employee profiles with history


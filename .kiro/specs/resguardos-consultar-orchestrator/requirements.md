# Requirements: Resguardos Consultar Orchestrator Implementation

## 1. Overview

Implement the main orchestrator component (`index.tsx`) that integrates all modular pieces (hooks, components, modals) created in the previous componentization spec. The orchestrator must replicate 100% of the functionality from the original monolithic component while using the modular architecture.

## 2. Functional Requirements

### 2.1 Core Functionality
- **FR-1**: Display paginated list of resguardos grouped by folio
- **FR-2**: Search resguardos by folio with debounced input
- **FR-3**: Filter resguardos by date, director, and resguardante
- **FR-4**: Sort resguardos by folio, fecha, director, or resguardantes
- **FR-5**: View detailed information for selected resguardo
- **FR-6**: Display articles grouped by resguardante within a resguardo
- **FR-7**: Edit resguardante names for individual articles
- **FR-8**: Delete individual articles from a resguardo
- **FR-9**: Delete multiple selected articles from a resguardo
- **FR-10**: Delete entire resguardo (all articles)
- **FR-11**: Generate PDF for entire resguardo
- **FR-12**: Generate PDF for specific resguardante within resguardo
- **FR-13**: Generate PDF de baja after deletion operations
- **FR-14**: Load resguardo automatically from URL parameter (?folio=XXX)
- **FR-15**: Real-time data synchronization with indexation system

### 2.2 State Management
- **FR-16**: Coordinate state across 6 custom hooks
- **FR-17**: Manage UI state (modals, loading, errors)
- **FR-18**: Handle article selection for bulk operations
- **FR-19**: Synchronize edited resguardantes with selected resguardo
- **FR-20**: Clear selections when resguardo changes

### 2.3 User Interface
- **FR-21**: Responsive layout (mobile, tablet, desktop)
- **FR-22**: Dark mode support throughout
- **FR-23**: Loading states for all async operations
- **FR-24**: Error messages with auto-dismiss
- **FR-25**: Success confirmations for operations
- **FR-26**: Smooth animations and transitions
- **FR-27**: Auto-scroll to details on mobile

### 2.4 Data Operations
- **FR-28**: Fetch resguardos with pagination
- **FR-29**: Fetch resguardo details by folio
- **FR-30**: Update resguardante names in database
- **FR-31**: Move deleted articles to resguardos_bajas table
- **FR-32**: Clear area, usufinal, resguardante in muebles tables
- **FR-33**: Generate folio de baja for deletion operations
- **FR-34**: Fetch firmas for PDF generation

## 3. Technical Requirements

### 3.1 Hook Integration
- **TR-1**: Use `useResguardosData` for list management
- **TR-2**: Use `useResguardoDetails` for detail view
- **TR-3**: Use `useResguardantesEdit` for editing functionality
- **TR-4**: Use `useResguardoDelete` for deletion operations
- **TR-5**: Use `usePDFGeneration` for PDF creation
- **TR-6**: Use `useArticuloSelection` for multi-select (if created)

### 3.2 Component Integration
- **TR-7**: Use `Header` component for title and stats
- **TR-8**: Use `SearchBar` component for search functionality
- **TR-9**: Use `AdvancedFilters` component for filtering
- **TR-10**: Use `ResguardosTable` component for list display
- **TR-11**: Use `Pagination` component for page navigation
- **TR-12**: Use `ResguardoDetailsPanel` component for details
- **TR-13**: Use `ArticulosListPanel` component for articles

### 3.3 Modal Integration
- **TR-14**: Use `ErrorAlert` for error messages
- **TR-15**: Use `SuccessAlert` for success messages (if created)
- **TR-16**: Use `DeleteAllModal` for resguardo deletion
- **TR-17**: Use `DeleteItemModal` for single article deletion
- **TR-18**: Use `DeleteSelectedModal` for bulk deletion
- **TR-19**: Use PDF modals for download functionality

### 3.4 Type Safety
- **TR-20**: All props must be properly typed
- **TR-21**: No `any` types allowed
- **TR-22**: Strict TypeScript compilation
- **TR-23**: Proper error handling with typed errors

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-1**: Initial load time < 2 seconds
- **NFR-2**: Search debounce of 100ms
- **NFR-3**: Smooth scrolling and animations
- **NFR-4**: Efficient re-renders (React.memo where needed)

### 4.2 Maintainability
- **NFR-5**: Clear separation of concerns
- **NFR-6**: Comprehensive JSDoc comments
- **NFR-7**: Consistent code style
- **NFR-8**: Easy to understand control flow

### 4.3 Reliability
- **NFR-9**: Zero regressions from original component
- **NFR-10**: Graceful error handling
- **NFR-11**: Data consistency in all operations
- **NFR-12**: Transaction safety for deletions

### 4.4 Accessibility
- **NFR-13**: Keyboard navigation support
- **NFR-14**: Screen reader friendly
- **NFR-15**: ARIA labels where appropriate
- **NFR-16**: Focus management in modals

## 5. Constraints

### 5.1 Technical Constraints
- **C-1**: Must use existing hooks without modification
- **C-2**: Must use existing components without modification
- **C-3**: Must maintain backward compatibility
- **C-4**: Must work with existing database schema
- **C-5**: Must integrate with existing indexation system

### 5.2 Business Constraints
- **C-6**: Cannot break existing functionality
- **C-7**: Must preserve all user workflows
- **C-8**: Must maintain data integrity
- **C-9**: Must support role-based access control

## 6. Success Criteria

### 6.1 Functional Success
- **SC-1**: All 34 functional requirements met
- **SC-2**: All user workflows work identically to original
- **SC-3**: All edge cases handled correctly
- **SC-4**: All error scenarios handled gracefully

### 6.2 Technical Success
- **SC-5**: TypeScript compiles with 0 errors
- **SC-6**: All hooks integrated correctly
- **SC-7**: All components render properly
- **SC-8**: All modals function correctly

### 6.3 Quality Success
- **SC-9**: Code review passes
- **SC-10**: Manual testing passes
- **SC-11**: No console errors in production
- **SC-12**: Performance metrics met

## 7. Out of Scope

- **OOS-1**: Modifying existing hooks
- **OOS-2**: Modifying existing components
- **OOS-3**: Changing database schema
- **OOS-4**: Adding new features not in original
- **OOS-5**: Automated testing (manual testing only)

## 8. Dependencies

### 8.1 Internal Dependencies
- All hooks in `./hooks/` directory
- All components in `./components/` directory
- All modals in `./modals/` directory
- Types in `./types.ts`
- Utils in `./utils.ts`

### 8.2 External Dependencies
- `@/app/lib/supabase/client`
- `@/hooks/useUserRole`
- `@/hooks/useFolioGenerator`
- `@/hooks/indexation/useResguardosIndexation`
- `@/context/ThemeContext`
- `next/navigation`
- `react`
- `lucide-react`

## 9. Acceptance Criteria

### 9.1 Must Have
- ✅ Component renders without errors
- ✅ All hooks are properly initialized
- ✅ All components receive correct props
- ✅ All modals open and close correctly
- ✅ Search and filters work as expected
- ✅ Pagination functions correctly
- ✅ Details panel displays correctly
- ✅ Edit functionality works
- ✅ Delete operations work
- ✅ PDF generation works
- ✅ URL parameter loading works
- ✅ Dark mode works throughout

### 9.2 Should Have
- ✅ Smooth animations
- ✅ Loading states
- ✅ Error messages
- ✅ Success confirmations
- ✅ Auto-scroll on mobile

### 9.3 Nice to Have
- ⭕ Performance optimizations
- ⭕ Additional animations
- ⭕ Enhanced error messages
- ⭕ Keyboard shortcuts

## 10. Risks and Mitigation

### 10.1 Risks
- **R-1**: Hook interfaces may not match exactly
  - *Mitigation*: Create adapter layer if needed
- **R-2**: Component props may be incompatible
  - *Mitigation*: Adjust props or create wrapper components
- **R-3**: State coordination may be complex
  - *Mitigation*: Use clear state flow diagram
- **R-4**: Edge cases may be missed
  - *Mitigation*: Thorough manual testing

### 10.2 Assumptions
- **A-1**: All hooks work correctly in isolation
- **A-2**: All components work correctly in isolation
- **A-3**: Database schema is stable
- **A-4**: Original component behavior is well understood

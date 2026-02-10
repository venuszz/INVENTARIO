# No Listado Componentization - Requirements

## Overview
Refactor the monolithic `src/components/consultas/no-listado/general.tsx` component into smaller, reusable, and maintainable components following the established patterns in the codebase (similar to `resguardos/crear` and `levantamiento` componentization).

## Goals
- Improve code maintainability and scalability
- Follow existing architectural patterns in the codebase
- Maintain 100% of existing functionality and design
- Enable easier testing and debugging
- Facilitate future feature additions

## User Stories

### 1. As a developer, I want the component structure to follow established patterns
**Acceptance Criteria:**
- 1.1 Component structure matches the pattern used in `resguardos/crear` and `levantamiento`
- 1.2 Files are organized into `components/`, `modals/`, `hooks/`, and utility files
- 1.3 All components use TypeScript with proper type definitions
- 1.4 Component naming follows kebab-case for files and PascalCase for component names

### 2. As a developer, I want UI components separated by responsibility
**Acceptance Criteria:**
- 2.1 Header section is extracted into a separate component
- 2.2 Value/stats panel is extracted into a separate component
- 2.3 Search and filters (omnibox) are extracted into separate components
- 2.4 Inventory table is extracted into a separate component
- 2.5 Detail panel (view/edit) is extracted into a separate component
- 2.6 Pagination is extracted into a separate component
- 2.7 Loading states are extracted into separate components

### 3. As a developer, I want modals separated into individual components
**Acceptance Criteria:**
- 3.1 Director modal is extracted into `modals/DirectorModal.tsx`
- 3.2 Area selection modal is extracted into `modals/AreaSelectionModal.tsx`
- 3.3 Baja confirmation modal is extracted into `modals/BajaModal.tsx`
- 3.4 Inactive confirmation modal is extracted into `modals/InactiveModal.tsx`
- 3.5 All modals receive props for state management and callbacks

### 4. As a developer, I want business logic separated into custom hooks
**Acceptance Criteria:**
- 4.1 Search and filter logic is extracted into `hooks/useSearchAndFilters.ts`
- 4.2 Director management logic is extracted into `hooks/useDirectorManagement.ts`
- 4.3 Item editing logic is extracted into `hooks/useItemEdit.ts`
- 4.4 Area management logic is extracted into `hooks/useAreaManagement.ts`
- 4.5 Resguardo data fetching is extracted into `hooks/useResguardoData.ts`

### 5. As a developer, I want shared types and utilities organized
**Acceptance Criteria:**
- 5.1 All TypeScript interfaces are moved to `types.ts`
- 5.2 Utility functions are moved to `utils.ts`
- 5.3 Constants are moved to `constants.ts` (if applicable)
- 5.4 Types are exported and reused across components

### 6. As a developer, I want the main component to be a clean orchestrator
**Acceptance Criteria:**
- 6.1 Main `index.tsx` file is under 300 lines
- 6.2 Main component only handles composition and high-level state
- 6.3 All business logic is delegated to hooks
- 6.4 All UI rendering is delegated to child components
- 6.5 Props drilling is minimized through proper state management

### 7. As a user, I want all existing functionality to work identically
**Acceptance Criteria:**
- 7.1 Search and filtering works exactly as before
- 7.2 Omnibox suggestions work exactly as before
- 7.3 Item selection and detail view works exactly as before
- 7.4 Edit mode works exactly as before
- 7.5 Director assignment works exactly as before
- 7.6 Area assignment works exactly as before
- 7.7 Baja functionality works exactly as before
- 7.8 Inactive marking works exactly as before
- 7.9 Image upload works exactly as before
- 7.10 Pagination works exactly as before
- 7.11 Sorting works exactly as before
- 7.12 URL parameter handling (id) works exactly as before
- 7.13 Realtime updates work exactly as before
- 7.14 Notifications work exactly as before

### 8. As a user, I want the UI to look and behave identically
**Acceptance Criteria:**
- 8.1 All styling remains unchanged
- 8.2 All animations remain unchanged
- 8.3 All hover effects remain unchanged
- 8.4 Dark mode works exactly as before
- 8.5 Responsive behavior remains unchanged
- 8.6 All icons and badges display correctly

## Technical Constraints
- Must use existing hooks: `useNoListadoIndexation`, `useSession`, `useUserRole`, `useNotifications`, `useTheme`
- Must maintain integration with Supabase
- Must maintain integration with notification system
- Must maintain URL parameter handling with Next.js router
- Must maintain all existing TypeScript types
- No changes to API calls or data fetching logic
- No changes to business logic or validation rules

## Out of Scope
- Adding new features
- Changing existing functionality
- Performance optimizations beyond code organization
- Changing styling or design
- Adding tests (separate task)
- Refactoring other components

## Success Metrics
- Main component file reduced from ~2000+ lines to under 300 lines
- At least 15 separate component files created
- At least 5 custom hooks created
- Zero regression bugs
- All existing functionality preserved
- Code passes TypeScript compilation without errors

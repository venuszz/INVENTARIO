# INEA Obsoletos Componentization - Requirements

## 1. Overview
Refactor the INEA Obsoletos (bajas/obsolete items) component from a monolithic structure to a modular, componentized architecture following the same patterns established in the INEA General component.

## 2. User Stories

### 2.1 As a developer
I want the INEA Obsoletos component to follow the same structure as INEA General so that the codebase is consistent and maintainable.

### 2.2 As a developer
I want the obsoletos component to use the new design system (framer-motion animations, refined styling) so that it matches the visual language of the refactored components.

### 2.3 As a developer
I want shared logic extracted into custom hooks so that code is reusable and testable.

### 2.4 As a user
I want the same smooth, modern UI experience in the obsoletos view as in the general inventory view.

## 3. Acceptance Criteria

### 3.1 Component Structure
- Component must be organized in the same folder structure as `src/components/consultas/inea/`:
  - `components/` - UI components
  - `hooks/` - Custom hooks
  - `modals/` - Modal dialogs
  - `types.ts` - TypeScript interfaces
  - `utils.ts` - Utility functions (if needed)
  - `obsoletos.tsx` - Main component file

### 3.2 Extracted Components
The following components must be created:
- `Header.tsx` - Page header with title and realtime toggle
- `ValueStatsPanel.tsx` - Total value and count statistics
- `SearchBar.tsx` - Search input with match type selector
- `FilterChips.tsx` - Active filters display
- `InventoryTable.tsx` - Main data table
- `DetailPanel.tsx` - Item detail view
- `Pagination.tsx` - Pagination controls
- `ImagePreview.tsx` - Image preview component (reuse existing)
- `AnimatedCounter.tsx` - Animated number counter
- `TableSkeleton.tsx` - Loading skeleton (if needed)

### 3.3 Extracted Modals
The following modals must be created:
- `ReactivarModal.tsx` - Confirm reactivation of obsolete item
- `DirectorModal.tsx` - Director area assignment
- `AreaSelectionModal.tsx` - Area selection for directors

### 3.4 Custom Hooks
The following hooks must be created:
- `useObsoletosData.ts` - Data fetching and management
- `useItemEdit.ts` - Item editing logic
- `useDirectorManagement.ts` - Director/area management
- `useAreaManagement.ts` - Area data management
- `useBajaInfo.ts` - Fetch baja (deprecation) information

### 3.5 Design System
- Must use framer-motion for animations
- Must follow the minimal, clean design with subtle borders
- Must use the same color scheme (white/5 backgrounds in dark mode, black/5 in light mode)
- Must have smooth transitions and hover effects
- Must be fully responsive

### 3.6 Functionality Preservation
- All existing functionality must be preserved:
  - View obsolete/baja items
  - Edit obsolete items
  - Reactivate items back to active inventory
  - Image upload/preview
  - Director and area management
  - Filtering and searching
  - Pagination
  - Real-time updates via indexation
  - URL parameter support for direct item access

### 3.7 Integration
- Must integrate with `useIneaObsoletosIndexation` hook
- Must use `ineaObsoletosStore` for state management
- Must support real-time updates
- Must show syncing indicators for items being updated

## 4. Technical Requirements

### 4.1 TypeScript
- All components must be fully typed
- Shared types must be in `types.ts`
- No `any` types allowed

### 4.2 Performance
- Must use React.memo for expensive components
- Must use useMemo/useCallback appropriately
- Must handle large datasets efficiently

### 4.3 Accessibility
- All interactive elements must be keyboard accessible
- Must have proper ARIA labels
- Must support screen readers

### 4.4 Code Quality
- Must follow existing code style
- Must have consistent naming conventions
- Must have clear component responsibilities
- Must avoid code duplication

## 5. Out of Scope
- Changes to business logic
- Changes to API endpoints
- Changes to database schema
- New features not present in original component

## 6. Dependencies
- Existing INEA General component structure
- `useIneaObsoletosIndexation` hook
- `ineaObsoletosStore` Zustand store
- Supabase client
- Framer Motion library
- Lucide React icons

## 7. Success Metrics
- Component renders without errors
- All existing functionality works as before
- Code is organized and maintainable
- UI matches the new design system
- Performance is equal or better than original

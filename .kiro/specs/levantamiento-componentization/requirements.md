# Requirements Document

## Introduction

This specification defines the requirements for refactoring the monolithic `levantamiento.tsx` component into a well-organized, maintainable component structure. The current file is approximately 1,735 lines and handles unified inventory viewing, advanced search, filtering, data export, and director management. The refactoring will follow the established pattern in the codebase (similar to `src/components/inventario/registro/`) while maintaining all existing functionality and user experience.

## Glossary

- **Levantamiento**: The unified inventory view that combines data from three sources (INEA, ITEA, TLAXCALA)
- **Omnibox**: The advanced search interface with autocomplete suggestions
- **Filter_Chip**: A visual tag representing an active filter that can be removed
- **Indexation_Context**: The data synchronization system that provides real-time updates from Supabase
- **Director**: A person in charge of an area (usuario final or jefe de área)
- **Resguardo**: A custody document linking inventory items to responsible persons
- **Custom_PDF**: A specialized PDF export filtered by area and director
- **Dark_Mode**: The theme system supporting light and dark color schemes
- **Property_Test**: A test that validates universal properties across generated inputs

## Requirements

### Requirement 1: Component Structure Organization

**User Story:** As a developer, I want the levantamiento component organized into logical sub-components, so that the codebase is maintainable and follows established patterns.

#### Acceptance Criteria

1. THE System SHALL create a directory structure at `src/components/consultas/levantamiento/` with subdirectories for hooks, components, modals, and types
2. THE System SHALL extract all TypeScript interfaces and types into a dedicated `types.ts` file
3. THE System SHALL create an `index.tsx` file that serves as the main orchestrator component
4. THE System SHALL organize custom hooks into a `hooks/` subdirectory
5. THE System SHALL organize reusable UI components into a `components/` subdirectory
6. THE System SHALL organize modal components into a `modals/` subdirectory

### Requirement 2: Data Management Hooks

**User Story:** As a developer, I want data fetching and state management logic extracted into custom hooks, so that business logic is separated from presentation.

#### Acceptance Criteria

1. THE System SHALL create a `useUnifiedInventory` hook that aggregates data from INEA, ITEA, and TLAXCALA indexation contexts
2. WHEN the hook initializes, THE System SHALL combine data from three sources with origin labels
3. THE System SHALL create a `useSearchAndFilters` hook that manages search term, active filters, suggestions, and filtered results
4. WHEN a user types in the search field, THE System SHALL generate autocomplete suggestions from all searchable fields
5. THE System SHALL create a `useDirectorManagement` hook that handles director data CRUD operations
6. WHEN a director is selected for PDF export, THE System SHALL fetch and validate director information from the directorio table

### Requirement 3: Search and Filter Components

**User Story:** As a user, I want the search and filter interface to remain functional and responsive, so that I can quickly find inventory items.

#### Acceptance Criteria

1. THE System SHALL create a `SearchBar` component that renders the omnibox search input with autocomplete
2. WHEN a user types at least 2 characters, THE System SHALL display up to 7 relevant suggestions
3. WHEN a user presses Enter or clicks a suggestion, THE System SHALL add it as an active filter
4. THE System SHALL create a `FilterChips` component that displays active filters as removable tags
5. WHEN a user clicks the X button on a filter chip, THE System SHALL remove that filter and update results
6. WHEN both area and usufinal filters are active and exact, THE System SHALL enable the custom PDF export button

### Requirement 4: Data Table and Pagination

**User Story:** As a user, I want to view inventory data in a sortable, paginated table, so that I can browse large datasets efficiently.

#### Acceptance Criteria

1. THE System SHALL create an `InventoryTable` component that renders the data table with sortable columns
2. WHEN a user clicks a column header, THE System SHALL sort the data by that column
3. WHEN a user clicks the same column header again, THE System SHALL toggle between ascending and descending order
4. THE System SHALL create a `Pagination` component that handles page navigation and rows-per-page selection
5. WHEN a user changes the rows-per-page value, THE System SHALL reset to page 1 and update the display
6. WHEN a user navigates to a different page, THE System SHALL display the corresponding data slice

### Requirement 5: Export Functionality

**User Story:** As a user, I want to export inventory data to Excel and PDF formats, so that I can share and analyze data offline.

#### Acceptance Criteria

1. THE System SHALL create an `ExportButtons` component that renders Excel and PDF export buttons
2. WHEN a user clicks the Excel button, THE System SHALL open the export confirmation modal
3. WHEN a user confirms Excel export, THE System SHALL generate an .xlsx file with filtered data
4. WHEN a user clicks the PDF button with no custom filters, THE System SHALL open the standard PDF export modal
5. WHEN a user clicks the PDF button with area and director filters active, THE System SHALL open the custom PDF modal
6. WHEN a user confirms PDF export, THE System SHALL generate a PDF with appropriate signatures

### Requirement 6: Modal Components

**User Story:** As a user, I want modal dialogs for export confirmation and director data management, so that I can complete multi-step operations.

#### Acceptance Criteria

1. THE System SHALL create an `ExportModal` component for standard Excel/PDF export confirmation
2. WHEN the modal opens, THE System SHALL display the export type and estimated file name
3. THE System SHALL create a `CustomPDFModal` component for area/director-specific PDF export
4. WHEN the custom PDF modal opens, THE System SHALL pre-populate area and director fields from active filters
5. WHEN a director is incomplete, THE System SHALL display a searchable list of directors from the directorio table
6. THE System SHALL create a `DirectorDataModal` component for completing missing director information
7. WHEN an admin selects an incomplete director, THE System SHALL open the modal to complete nombre and puesto fields
8. WHEN an admin saves director data, THE System SHALL update the directorio table and refresh the director list

### Requirement 7: Loading and Error States

**User Story:** As a user, I want clear visual feedback during loading and error states, so that I understand the system status.

#### Acceptance Criteria

1. THE System SHALL create a `LoadingStates` component that renders loading, error, and empty state UI
2. WHEN data is loading from any indexation context, THE System SHALL display an animated spinner with loading message
3. WHEN an error occurs during data fetching, THE System SHALL display an error message with a retry button
4. WHEN no results match the current filters, THE System SHALL display an empty state message
5. WHEN the user clicks the retry button, THE System SHALL trigger reindexation of all three data sources

### Requirement 8: Dark Mode Support

**User Story:** As a user, I want all components to support dark mode, so that I can use the application comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN dark mode is enabled, THE System SHALL apply dark color schemes to all components
2. WHEN dark mode is disabled, THE System SHALL apply light color schemes to all components
3. THE System SHALL use the `useTheme` context to determine the current theme
4. THE System SHALL apply theme-specific classes to all interactive elements (buttons, inputs, modals)
5. THE System SHALL maintain visual contrast and readability in both themes

### Requirement 9: Real-time Data Synchronization

**User Story:** As a user, I want inventory data to update in real-time, so that I always see the latest information.

#### Acceptance Criteria

1. THE System SHALL use the `useIneaIndexation`, `useIteaIndexation`, and `useNoListadoIndexation` hooks for data access
2. WHEN any indexation context receives a real-time update, THE System SHALL reflect changes in the unified view
3. THE System SHALL display a real-time connection indicator showing online/offline status
4. WHEN the user clicks the refresh button, THE System SHALL trigger reindexation of all three sources
5. THE System SHALL preserve user filters and search state during data updates

### Requirement 10: Type Safety and Validation

**User Story:** As a developer, I want comprehensive TypeScript types and interfaces, so that the code is type-safe and self-documenting.

#### Acceptance Criteria

1. THE System SHALL define a `LevMueble` interface that includes all inventory item fields plus an `origen` discriminator
2. THE System SHALL define interfaces for all component props
3. THE System SHALL define types for all hook return values
4. THE System SHALL define types for filter states, search states, and modal states
5. THE System SHALL use strict TypeScript checking with no implicit any types

### Requirement 11: Performance Optimization

**User Story:** As a user, I want the application to remain responsive with large datasets, so that I can work efficiently.

#### Acceptance Criteria

1. THE System SHALL use `useMemo` to memoize expensive computations (filtered data, searchable vectors)
2. THE System SHALL use `useDeferredValue` for search term to prevent blocking UI updates
3. THE System SHALL use `useCallback` to memoize event handlers and prevent unnecessary re-renders
4. WHEN filtering or searching, THE System SHALL process data efficiently without blocking the UI
5. THE System SHALL paginate results to limit DOM nodes rendered at once

### Requirement 12: Accessibility and User Experience

**User Story:** As a user, I want the interface to be accessible and intuitive, so that I can use it effectively.

#### Acceptance Criteria

1. THE System SHALL provide keyboard navigation for the omnibox search (Arrow keys, Enter, Escape)
2. WHEN a user navigates suggestions with arrow keys, THE System SHALL highlight the current selection
3. THE System SHALL provide appropriate ARIA labels and roles for interactive elements
4. THE System SHALL display loading indicators during asynchronous operations
5. THE System SHALL show success/error messages after export operations

### Requirement 13: Backward Compatibility

**User Story:** As a developer, I want the refactored component to maintain the same API and behavior, so that existing integrations continue to work.

#### Acceptance Criteria

1. THE System SHALL export the main component as the default export from `index.tsx`
2. THE System SHALL maintain the same component name `LevantamientoUnificado`
3. THE System SHALL preserve all existing functionality without breaking changes
4. THE System SHALL maintain the same URL routing and page integration
5. THE System SHALL preserve all existing CSS classes and styling

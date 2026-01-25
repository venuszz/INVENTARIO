# Requirements Document: Resguardos Crear Component Componentization

## Introduction

This specification defines the requirements for refactoring the monolithic `src/components/resguardos/crear.tsx` component (~2700 lines) into a modular, maintainable structure. The refactoring will follow established patterns from existing componentized features (levantamiento and registro) while preserving all existing functionality, UI/UX, and behavior.

## Glossary

- **Resguardo**: A custody document that tracks the assignment of inventory items to responsible parties
- **Mueble**: An inventory item (furniture or equipment) that can be assigned in a resguardo
- **Director**: A director or manager responsible for an area
- **Usufinal**: The final user or responsible party for an inventory item
- **Resguardante**: The person who takes custody of items in a resguardo
- **Folio**: A unique identifier for each resguardo document
- **Omnibox**: An intelligent search input that suggests filters based on search context
- **Component**: A reusable UI element with a single responsibility
- **Hook**: A custom React hook that encapsulates business logic
- **Modal**: A dialog component that overlays the main interface

## Requirements

### Requirement 1: Component File Structure

**User Story:** As a developer, I want the crear component organized into a clear folder structure, so that I can easily locate and maintain specific functionality.

#### Acceptance Criteria

1. THE System SHALL create a directory structure at `src/components/resguardos/crear/`
2. THE System SHALL include subdirectories for `components/`, `modals/`, and `hooks/`
3. THE System SHALL include files for `index.tsx`, `types.ts`, `utils.ts`, and `constants.ts` at the root level
4. THE System SHALL organize all UI components under the `components/` subdirectory
5. THE System SHALL organize all modal dialogs under the `modals/` subdirectory
6. THE System SHALL organize all custom hooks under the `hooks/` subdirectory

### Requirement 2: Component Size Constraints

**User Story:** As a developer, I want each component file to be under 200 lines, so that files are manageable and easy to understand.

#### Acceptance Criteria

1. WHEN a component file is created, THE System SHALL ensure it contains fewer than 200 lines of code
2. WHEN the main index.tsx orchestrator is created, THE System SHALL ensure it contains fewer than 300 lines of code
3. THE System SHALL split large sections into multiple smaller components when necessary
4. THE System SHALL extract complex logic into custom hooks to reduce component size

### Requirement 3: UI Component Extraction

**User Story:** As a developer, I want each major UI section in its own component file, so that I can work on specific features independently.

#### Acceptance Criteria

1. THE System SHALL create a Header component for the title, realtime toggle, and selected items counter
2. THE System SHALL create a FolioInfoPanel component for folio display, director info, and date
3. THE System SHALL create a SearchAndFilters component for the omnibox search with suggestions
4. THE System SHALL create a FilterChips component for displaying active filters
5. THE System SHALL create an InventoryTable component for the paginated table with select-all functionality
6. THE System SHALL create a TableSkeleton component for loading states
7. THE System SHALL create a Pagination component for page navigation controls
8. THE System SHALL create a DetailsPanel component as a container for the right panel
9. THE System SHALL create a DirectorSelection component for the director autocomplete input
10. THE System SHALL create an AreaPuestoInputs component for area and puesto fields
11. THE System SHALL create a ResguardanteInput component for the resguardante field
12. THE System SHALL create a SelectedItemsList component for the list of selected items
13. THE System SHALL create an ActionButtons component for clear and save buttons
14. THE System SHALL create a SuggestionDropdown component for reusable dropdown suggestions

### Requirement 4: Modal Component Extraction

**User Story:** As a developer, I want all modals in separate files, so that I can manage dialog flows independently.

#### Acceptance Criteria

1. THE System SHALL create a DirectorModal component for completing missing director data
2. THE System SHALL create a UsufinalConflictModal component for responsable conflict warnings
3. THE System SHALL create an AreaConflictModal component for area conflict warnings
4. THE System SHALL create a PDFDownloadModal component for PDF download prompts
5. THE System SHALL create a WarningModal component for generic warning dialogs
6. THE System SHALL create a SelectAllErrorModal component for select-all validation errors
7. THE System SHALL create a MissingDirectorDataAlert component for incomplete director data alerts
8. WHEN a modal is created, THE System SHALL accept props for visibility state and callback functions
9. WHEN a modal is created, THE System SHALL be keyboard-navigable and accessible

### Requirement 5: Custom Hook Extraction

**User Story:** As a developer, I want business logic extracted into custom hooks, so that I can reuse and test logic separately from UI.

#### Acceptance Criteria

1. THE System SHALL create a useResguardoForm hook for managing form state (folio, director, area, puesto, resguardante)
2. THE System SHALL create a useInventoryData hook for fetching and managing inventory data from multiple sources
3. THE System SHALL create a useItemSelection hook for handling item selection logic with validation
4. THE System SHALL create a useDirectorAutocomplete hook for director search and suggestions
5. THE System SHALL create a useSearchAndFilters hook for omnibox search with suggestions and active filters
6. THE System SHALL create a usePagination hook for pagination state and controls
7. THE System SHALL create a useFolioGeneration hook for generating unique folios
8. THE System SHALL create a useResguardoSubmit hook for handling resguardo creation and PDF generation
9. WHEN a hook is created, THE System SHALL return typed values and functions
10. WHEN a hook is created, THE System SHALL encapsulate all related state and side effects

### Requirement 6: Type Definitions Consolidation

**User Story:** As a developer, I want all TypeScript interfaces in a dedicated types file, so that I can avoid duplication and maintain consistency.

#### Acceptance Criteria

1. THE System SHALL create a types.ts file containing all interface definitions
2. THE System SHALL include the Mueble interface with all properties (id, id_inv, descripcion, estado, estatus, resguardante, rubro, usufinal, area, origen, resguardanteAsignado)
3. THE System SHALL include the Directorio interface with all properties (id_directorio, nombre, area, puesto)
4. THE System SHALL include the ResguardoForm interface with all properties (folio, directorId, area, puesto, resguardante)
5. THE System SHALL include the PdfFirma interface with all properties (concepto, nombre, puesto, cargo, firma)
6. THE System SHALL include the PdfData interface with all properties (folio, fecha, director, area, puesto, resguardante, articulos, firmas)
7. THE System SHALL include the ActiveFilter interface with all properties (term, type)
8. THE System SHALL include a SearchMatchType type for search field types
9. THE System SHALL export all types for use across components and hooks

### Requirement 7: Utility Functions Extraction

**User Story:** As a developer, I want shared utility functions in a dedicated file, so that I can reuse common logic without duplication.

#### Acceptance Criteria

1. THE System SHALL create a utils.ts file containing utility functions
2. THE System SHALL include a getColorClass function for generating color classes based on values and theme
3. THE System SHALL include a getTypeIcon function for returning icons based on filter types
4. THE System SHALL include a getTypeLabel function for returning labels based on filter types
5. THE System SHALL include validation functions for selection constraints (same area, same responsable)
6. THE System SHALL export all utility functions for use across components

### Requirement 8: Constants Extraction

**User Story:** As a developer, I want color palettes and constants in a dedicated file, so that I can maintain consistent styling and configuration.

#### Acceptance Criteria

1. THE System SHALL create a constants.ts file containing constant values
2. THE System SHALL include colorPaletteDark array with all dark mode color classes
3. THE System SHALL include colorPaletteLight array with all light mode color classes
4. THE System SHALL export all constants for use across components

### Requirement 9: Main Orchestrator Component

**User Story:** As a developer, I want the main index.tsx to be a clean orchestrator, so that I can understand the component structure at a glance.

#### Acceptance Criteria

1. THE System SHALL create an index.tsx file as the main orchestrator component
2. WHEN the orchestrator is created, THE System SHALL ensure it only handles composition and state coordination
3. WHEN the orchestrator is created, THE System SHALL ensure it contains no business logic
4. WHEN the orchestrator is created, THE System SHALL ensure it has a clear component hierarchy
5. THE System SHALL use custom hooks for all business logic in the orchestrator
6. THE System SHALL pass props to child components for rendering and callbacks

### Requirement 10: Functionality Preservation

**User Story:** As a user, I want all existing features to work identically after refactoring, so that my workflow is not disrupted.

#### Acceptance Criteria

1. WHEN the refactoring is complete, THE System SHALL preserve all inventory search and filtering functionality
2. WHEN the refactoring is complete, THE System SHALL preserve all item selection logic with validation
3. WHEN the refactoring is complete, THE System SHALL preserve all director autocomplete functionality
4. WHEN the refactoring is complete, THE System SHALL preserve all area and puesto management
5. WHEN the refactoring is complete, THE System SHALL preserve all resguardo creation and PDF generation
6. WHEN the refactoring is complete, THE System SHALL preserve all modal dialog flows
7. WHEN the refactoring is complete, THE System SHALL preserve all error handling and validation
8. WHEN the refactoring is complete, THE System SHALL preserve all realtime data synchronization
9. WHEN the refactoring is complete, THE System SHALL preserve all dark mode support
10. WHEN the refactoring is complete, THE System SHALL preserve all accessibility features

### Requirement 11: UI/UX Preservation

**User Story:** As a user, I want the interface to look and behave exactly the same after refactoring, so that I don't need to relearn the interface.

#### Acceptance Criteria

1. WHEN the refactoring is complete, THE System SHALL maintain identical visual styling
2. WHEN the refactoring is complete, THE System SHALL maintain identical layout and spacing
3. WHEN the refactoring is complete, THE System SHALL maintain identical animations and transitions
4. WHEN the refactoring is complete, THE System SHALL maintain identical hover states and interactions
5. WHEN the refactoring is complete, THE System SHALL maintain identical responsive behavior
6. WHEN the refactoring is complete, THE System SHALL maintain identical keyboard navigation

### Requirement 12: Pattern Consistency

**User Story:** As a developer, I want the refactored structure to follow existing patterns, so that the codebase is uniform and predictable.

#### Acceptance Criteria

1. THE System SHALL follow the folder structure pattern from levantamiento (components/, hooks/, modals/, types.ts, utils.tsx, index.tsx)
2. THE System SHALL follow the hook naming convention pattern (useFeatureName)
3. THE System SHALL follow the component props pattern (typed interfaces for all props)
4. THE System SHALL follow the file organization pattern (one component per file)
5. THE System SHALL follow the import/export pattern from existing componentized features

### Requirement 13: State Management

**User Story:** As a developer, I want state management to be clear and centralized, so that I can track data flow easily.

#### Acceptance Criteria

1. WHEN custom hooks manage state, THE System SHALL use React useState for local state
2. WHEN custom hooks manage side effects, THE System SHALL use React useEffect appropriately
3. WHEN state needs to be shared, THE System SHALL pass it through props or context
4. WHEN state updates occur, THE System SHALL ensure proper re-rendering of dependent components
5. THE System SHALL avoid prop drilling by using composition and custom hooks

### Requirement 14: Performance Preservation

**User Story:** As a user, I want the refactored component to perform as well or better than the original, so that my experience is not degraded.

#### Acceptance Criteria

1. WHEN the refactoring is complete, THE System SHALL maintain or improve rendering performance
2. WHEN the refactoring is complete, THE System SHALL maintain or improve search performance
3. WHEN the refactoring is complete, THE System SHALL maintain or improve pagination performance
4. THE System SHALL use React.memo for components that receive stable props
5. THE System SHALL use useMemo and useCallback for expensive computations and callbacks
6. THE System SHALL use useDeferredValue for search input to avoid blocking

### Requirement 15: Error Handling Preservation

**User Story:** As a user, I want all error messages and validation to work the same way after refactoring, so that I receive consistent feedback.

#### Acceptance Criteria

1. WHEN validation fails, THE System SHALL display the same error messages as the original
2. WHEN conflicts occur (usufinal, area), THE System SHALL show the same modal warnings
3. WHEN data loading fails, THE System SHALL display the same error states
4. WHEN form submission fails, THE System SHALL display the same error alerts
5. THE System SHALL preserve all console logging for debugging purposes

### Requirement 16: Dependency Management

**User Story:** As a developer, I want all external dependencies to remain the same, so that I don't introduce new risks or compatibility issues.

#### Acceptance Criteria

1. THE System SHALL continue using the same Supabase client for data operations
2. THE System SHALL continue using the same indexation hooks (useIneaIndexation, useIteaIndexation, useNoListadoIndexation)
3. THE System SHALL continue using the same session and authentication hooks
4. THE System SHALL continue using the same theme context for dark mode
5. THE System SHALL continue using the same notification system
6. THE System SHALL not introduce any new external dependencies

### Requirement 17: Testing Readiness

**User Story:** As a developer, I want the refactored components to be easily testable, so that I can add tests in the future.

#### Acceptance Criteria

1. WHEN components are created, THE System SHALL ensure they have clear input/output boundaries
2. WHEN hooks are created, THE System SHALL ensure they can be tested independently
3. WHEN utility functions are created, THE System SHALL ensure they are pure functions where possible
4. THE System SHALL avoid tight coupling between components
5. THE System SHALL use dependency injection patterns where appropriate

### Requirement 18: Documentation and Comments

**User Story:** As a developer, I want clear comments and documentation, so that I can understand the purpose of each component and hook.

#### Acceptance Criteria

1. WHEN a component is created, THE System SHALL include a JSDoc comment describing its purpose
2. WHEN a hook is created, THE System SHALL include a JSDoc comment describing its purpose and return values
3. WHEN a utility function is created, THE System SHALL include a JSDoc comment describing its parameters and return value
4. THE System SHALL preserve all existing console.log statements for debugging
5. THE System SHALL add comments for complex logic or non-obvious implementations

### Requirement 19: Backward Compatibility

**User Story:** As a developer, I want the refactored component to be a drop-in replacement, so that I don't need to update any parent components or routes.

#### Acceptance Criteria

1. THE System SHALL export the main component as the default export from index.tsx
2. THE System SHALL maintain the same component name (CrearResguardos)
3. THE System SHALL maintain the same props interface (none in this case)
4. THE System SHALL maintain the same import path for parent components
5. THE System SHALL not require any changes to routing or parent components

### Requirement 20: Code Quality

**User Story:** As a developer, I want the refactored code to follow best practices, so that it's maintainable and professional.

#### Acceptance Criteria

1. THE System SHALL use TypeScript strict mode for all files
2. THE System SHALL use proper TypeScript types (no 'any' types unless absolutely necessary)
3. THE System SHALL follow React best practices (proper hook usage, component composition)
4. THE System SHALL follow naming conventions (PascalCase for components, camelCase for functions)
5. THE System SHALL use consistent formatting and indentation
6. THE System SHALL remove unused imports and variables
7. THE System SHALL use meaningful variable and function names

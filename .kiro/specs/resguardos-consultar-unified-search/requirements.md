# Requirements Document

## Introduction

This document specifies the requirements for refactoring the search functionality in Consultar Resguardos to adopt the unified search pattern currently implemented in Crear Resguardos. The refactoring will replace the separate SearchBar and AdvancedFilters components with a single intelligent search interface that provides smart suggestions, filter chips, and field-type detection.

## Glossary

- **Unified_Search**: A single search input that intelligently detects field types (folio, fecha, resguardante, director) and provides contextual suggestions
- **Filter_Chip**: A visual tag representing an active filter that can be removed individually
- **Suggestion_Dropdown**: An autocomplete dropdown that appears below the search input showing matching values from the dataset
- **Field_Detection**: The system's ability to identify what type of data the user is searching for (folio, director, resguardante, etc.)
- **SearchAndFilters_Component**: The unified search component from Crear Resguardos that combines search input, suggestions, and filter chips
- **useSearchAndFilters_Hook**: The custom React hook that manages search state, suggestions, and active filters
- **Consultar_Resguardos**: The resguardos consultation module being refactored
- **Crear_Resguardos**: The resguardos creation module that contains the reference implementation

## Requirements

### Requirement 1: Unified Search Interface

**User Story:** As a user, I want a single search bar that intelligently understands what I'm searching for, so that I can quickly find resguardos without navigating multiple filter inputs.

#### Acceptance Criteria

1. WHEN a user types in the search bar, THE Unified_Search SHALL detect the field type being searched (folio, director, resguardante, fecha)
2. WHEN the search term matches multiple field types, THE Unified_Search SHALL prioritize exact matches over partial matches
3. WHEN a field type is detected, THE Unified_Search SHALL display a visual indicator showing the detected field type
4. THE Unified_Search SHALL replace both the existing SearchBar and AdvancedFilters components
5. WHEN the user types at least 2 characters, THE Unified_Search SHALL display the Suggestion_Dropdown

### Requirement 2: Smart Suggestions System

**User Story:** As a user, I want to see relevant suggestions as I type, so that I can quickly select values without typing complete terms.

#### Acceptance Criteria

1. WHEN a user types in the search bar, THE Suggestion_Dropdown SHALL display up to 7 matching suggestions from the dataset
2. WHEN displaying suggestions, THE Suggestion_Dropdown SHALL show the value and its field type (folio, director, resguardante, etc.)
3. WHEN a user hovers over a suggestion, THE Suggestion_Dropdown SHALL highlight that suggestion
4. WHEN a user clicks a suggestion, THE System SHALL add it as an active filter and clear the search input
5. WHEN suggestions are displayed, THE Suggestion_Dropdown SHALL prioritize suggestions that start with the search term over those that contain it
6. WHEN no matches are found, THE Suggestion_Dropdown SHALL not be displayed

### Requirement 3: Keyboard Navigation

**User Story:** As a user, I want to navigate suggestions using my keyboard, so that I can work efficiently without using the mouse.

#### Acceptance Criteria

1. WHEN the Suggestion_Dropdown is visible and the user presses ArrowDown, THE System SHALL move the highlight to the next suggestion
2. WHEN the Suggestion_Dropdown is visible and the user presses ArrowUp, THE System SHALL move the highlight to the previous suggestion
3. WHEN a suggestion is highlighted and the user presses Enter, THE System SHALL select that suggestion and add it as a filter
4. WHEN the Suggestion_Dropdown is visible and the user presses Escape, THE System SHALL close the dropdown
5. WHEN the user navigates past the last suggestion with ArrowDown, THE System SHALL wrap to the first suggestion
6. WHEN the user navigates before the first suggestion with ArrowUp, THE System SHALL wrap to the last suggestion

### Requirement 4: Filter Chips Display

**User Story:** As a user, I want to see my active filters as removable chips, so that I can understand what filters are applied and remove them individually.

#### Acceptance Criteria

1. WHEN a filter is added, THE System SHALL display a Filter_Chip below the search bar
2. WHEN displaying a Filter_Chip, THE System SHALL show the filter type label and the filter value
3. WHEN a user clicks the remove button on a Filter_Chip, THE System SHALL remove that specific filter
4. WHEN multiple filters are active, THE System SHALL display all Filter_Chips with smooth animations
5. WHEN a Filter_Chip is removed, THE System SHALL animate its removal smoothly
6. WHEN filters are active, THE Filter_Chips SHALL be displayed in the order they were added

### Requirement 5: Data Filtering Logic

**User Story:** As a user, I want my search filters to accurately narrow down the resguardos list, so that I can find specific records quickly.

#### Acceptance Criteria

1. WHEN filters are active, THE System SHALL apply all filters simultaneously using AND logic
2. WHEN a folio filter is active, THE System SHALL match resguardos where the folio contains the filter value
3. WHEN a director filter is active, THE System SHALL match resguardos where the director name contains the filter value
4. WHEN a resguardante filter is active, THE System SHALL match resguardos where any resguardante contains the filter value
5. WHEN a fecha filter is active, THE System SHALL match resguardos where the fecha equals the filter value
6. WHEN all filters are removed, THE System SHALL display all resguardos

### Requirement 6: Component Migration

**User Story:** As a developer, I want to migrate from the old search components to the new unified search, so that the codebase is consistent and maintainable.

#### Acceptance Criteria

1. THE System SHALL remove the AdvancedFilters component from the Consultar_Resguardos module
2. THE System SHALL replace the SearchBar component with the SearchAndFilters_Component
3. THE System SHALL implement the useSearchAndFilters_Hook adapted for resguardos data structure
4. THE System SHALL maintain the existing date filter functionality if it's not covered by the unified search
5. THE System SHALL update the index.tsx to use the new unified search components
6. THE System SHALL preserve all existing functionality (sorting, pagination, details view)

### Requirement 7: Suggestion Data Source

**User Story:** As a user, I want suggestions to be based on actual data in the system, so that I only see relevant and existing values.

#### Acceptance Criteria

1. WHEN generating suggestions, THE System SHALL extract unique values from the loaded resguardos dataset
2. WHEN a user searches, THE System SHALL generate suggestions for folio, director, resguardante, and fecha fields
3. WHEN the dataset changes, THE System SHALL update the available suggestions accordingly
4. THE System SHALL deduplicate suggestion values to avoid showing the same value multiple times
5. WHEN extracting director values, THE System SHALL handle both relational objects and string values correctly

### Requirement 8: Visual Consistency

**User Story:** As a user, I want the search interface to match the visual style of the application, so that the experience feels cohesive.

#### Acceptance Criteria

1. THE SearchAndFilters_Component SHALL use the same theme context (dark/light mode) as other components
2. THE SearchAndFilters_Component SHALL use consistent border styles, colors, and spacing with the rest of the application
3. THE Filter_Chips SHALL use the same visual style as in Crear_Resguardos
4. THE Suggestion_Dropdown SHALL use the same visual style as in Crear_Resguardos
5. THE SearchAndFilters_Component SHALL include smooth animations for showing/hiding suggestions and filter chips

### Requirement 9: Performance Optimization

**User Story:** As a user, I want the search to respond quickly even with large datasets, so that the interface remains responsive.

#### Acceptance Criteria

1. WHEN a user types in the search bar, THE System SHALL use deferred values to debounce search term updates
2. WHEN generating suggestions, THE System SHALL limit results to a maximum of 7 suggestions
3. WHEN filtering data, THE System SHALL use memoization to avoid unnecessary recalculations
4. THE System SHALL only recalculate suggestions when the search term or dataset actually changes
5. WHEN the user types rapidly, THE System SHALL not trigger multiple simultaneous filter operations

### Requirement 10: Backward Compatibility

**User Story:** As a user, I want my existing workflows to continue working after the refactoring, so that I don't need to relearn the interface.

#### Acceptance Criteria

1. WHEN the refactoring is complete, THE System SHALL maintain all existing search capabilities
2. THE System SHALL preserve the ability to search by folio (existing SearchBar functionality)
3. THE System SHALL preserve the ability to filter by director (existing AdvancedFilters functionality)
4. THE System SHALL preserve the ability to filter by resguardante (existing AdvancedFilters functionality)
5. THE System SHALL preserve the ability to filter by fecha (existing AdvancedFilters functionality)
6. THE System SHALL maintain the existing refresh and clear functionality

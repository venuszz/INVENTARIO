# Requirements Document

## Introduction

This document specifies the requirements for adapting the INEA Obsoletos component to match the modern design patterns and user experience of the INEA General component. The INEA General component features an advanced omni-search system with dynamic filter chips, better visual hierarchy, and improved component organization. The goal is to refactor INEA Obsoletos to use these same design patterns while maintaining its specific functionality for managing obsolete inventory items.

## Glossary

- **INEA_Obsoletos**: The component that displays and manages inventory items marked as "BAJA" (obsolete/decommissioned)
- **INEA_General**: The reference component with modern search and filter design patterns
- **Omni_Search**: A search system that automatically detects the type of search term (ID, area, director, description, etc.) and provides intelligent suggestions
- **Filter_Chip**: A visual tag representing an active filter that can be added or removed dynamically
- **Match_Type**: The detected category of a search term (id, area, usufinal, descripcion, rubro, estado, estatus)
- **Active_Filter**: A saved search term with its associated match type that filters the data
- **useSearchAndFilters_Hook**: The custom React hook that implements omni-search functionality
- **Reactivar**: The action to restore an obsolete item back to active status (opposite of "Dar de Baja")

## Requirements

### Requirement 1: Omni-Search Implementation

**User Story:** As a user, I want to search for obsolete items using intelligent search that detects what I'm looking for, so that I can quickly find items without selecting filter types manually.

#### Acceptance Criteria

1. WHEN a user types in the search field, THE System SHALL detect the match type based on the search term content
2. WHEN a search term matches multiple field types, THE System SHALL prioritize matches in the order: usufinal, area, id, descripcion
3. WHEN a search term is detected, THE System SHALL display the match type indicator in the search bar
4. WHEN a user types at least 2 characters, THE System SHALL generate and display search suggestions from all searchable fields
5. WHEN suggestions are displayed, THE System SHALL limit the display to a maximum of 7 suggestions
6. WHEN a user navigates suggestions with arrow keys, THE System SHALL highlight the selected suggestion
7. WHEN a user presses Enter on a highlighted suggestion, THE System SHALL add that suggestion as an active filter
8. WHEN a user presses Escape, THE System SHALL close the suggestions dropdown

### Requirement 2: Dynamic Filter Chips

**User Story:** As a user, I want to add multiple search terms as filter chips, so that I can combine multiple criteria to narrow down results.

#### Acceptance Criteria

1. WHEN a user clicks the Plus button with a valid search term, THE System SHALL add the current search term as a filter chip
2. WHEN a filter chip is added, THE System SHALL clear the search input field
3. WHEN multiple filter chips are active, THE System SHALL apply all filters using AND logic
4. WHEN a user clicks the X button on a filter chip, THE System SHALL remove that specific filter
5. WHEN a user clicks "Clear All", THE System SHALL remove all active filter chips
6. WHEN filter chips are displayed, THE System SHALL show each chip with its match type and term
7. WHEN no search term or match type is detected, THE System SHALL disable the Plus button

### Requirement 3: Search Hook Integration

**User Story:** As a developer, I want to use the useSearchAndFilters hook from INEA General, so that the search functionality is consistent and maintainable.

#### Acceptance Criteria

1. THE System SHALL replace the useObsoletosData search logic with the useSearchAndFilters hook
2. THE System SHALL adapt the useSearchAndFilters hook to work with obsolete items data
3. THE System SHALL maintain backward compatibility with existing filter options (estado, area, rubro)
4. THE System SHALL use deferred values for search terms to avoid blocking user input
5. THE System SHALL pre-calculate searchable data vectors for performance optimization

### Requirement 4: Component Structure Alignment

**User Story:** As a developer, I want the INEA Obsoletos component structure to match INEA General, so that the codebase is consistent and easier to maintain.

#### Acceptance Criteria

1. THE System SHALL use the same component hierarchy as INEA General (Header, ValueStatsPanel, SearchBar, FilterChips, InventoryTable, DetailPanel, Pagination)
2. THE System SHALL use the SearchBar component from INEA General with match type indicator
3. THE System SHALL use the FilterChips component from INEA General for displaying active filters
4. THE System SHALL maintain the same spacing and layout structure as INEA General
5. THE System SHALL use the same motion animations and transitions as INEA General

### Requirement 5: Search Bar Component Adaptation

**User Story:** As a user, I want the search bar to show what type of search I'm performing, so that I understand how my search is being interpreted.

#### Acceptance Criteria

1. WHEN a match type is detected, THE System SHALL display a badge showing the match type (ID, Área, Director, Descripción, etc.)
2. WHEN suggestions are available, THE System SHALL display a dropdown below the search input
3. WHEN a user hovers over a suggestion, THE System SHALL highlight that suggestion
4. WHEN a user clicks a suggestion, THE System SHALL add it as an active filter
5. THE System SHALL display the search bar with the same visual styling as INEA General

### Requirement 6: Filter Chips Component Integration

**User Story:** As a user, I want to see my active filters as removable chips, so that I can easily manage multiple search criteria.

#### Acceptance Criteria

1. WHEN active filters exist, THE System SHALL display them as chips below the search bar
2. WHEN a filter chip is displayed, THE System SHALL show the match type label and the filter term
3. WHEN a user clicks the X icon on a chip, THE System SHALL remove that filter and update results
4. WHEN multiple chips are displayed, THE System SHALL show a "Clear All" button
5. WHEN all filters are removed, THE System SHALL hide the filter chips section

### Requirement 7: Data Fetching Optimization

**User Story:** As a developer, I want to optimize data fetching to work with client-side filtering, so that the search is fast and responsive.

#### Acceptance Criteria

1. THE System SHALL fetch all obsolete items on initial load using the indexation hook
2. THE System SHALL perform filtering on the client side using the useSearchAndFilters hook
3. THE System SHALL maintain server-side pagination for the initial data fetch
4. THE System SHALL update the filtered count based on client-side filtering results
5. THE System SHALL recalculate the total value based on filtered results

### Requirement 8: Maintain Obsoletos-Specific Functionality

**User Story:** As a user, I want to retain all obsolete-specific features while using the new search design, so that I don't lose any functionality.

#### Acceptance Criteria

1. THE System SHALL maintain the "Reactivar" action button for obsolete items
2. THE System SHALL maintain the ReactivarModal for confirming reactivation
3. THE System SHALL maintain the display of baja information (fechabaja, causadebaja)
4. THE System SHALL maintain the useBajaInfo hook for fetching baja details
5. THE System SHALL maintain all existing edit and save functionality

### Requirement 9: Visual Consistency

**User Story:** As a user, I want the INEA Obsoletos interface to look and feel like INEA General, so that I have a consistent experience across the application.

#### Acceptance Criteria

1. THE System SHALL use the same button styles and spacing as INEA General
2. THE System SHALL use the same border styles and colors as INEA General
3. THE System SHALL use the same animation timings and easing functions as INEA General
4. THE System SHALL use the same responsive grid layout as INEA General
5. THE System SHALL use the same scrollbar styling as INEA General

### Requirement 10: Plus Button Functionality

**User Story:** As a user, I want to click a Plus button to add my current search as a filter, so that I can quickly build complex filter combinations.

#### Acceptance Criteria

1. WHEN the search input has a valid term and detected match type, THE System SHALL enable the Plus button
2. WHEN the Plus button is clicked, THE System SHALL call the saveCurrentFilter function
3. WHEN the Plus button is disabled, THE System SHALL display a disabled visual state
4. THE System SHALL position the Plus button to the right of the search bar
5. THE System SHALL display a tooltip on the Plus button explaining its function

# Implementation Plan: Unified Search for Consultar Resguardos

## Overview

This implementation plan refactors the search functionality in Consultar Resguardos to adopt the unified search pattern from Crear Resguardos. The refactoring consolidates SearchBar and AdvancedFilters into a single intelligent search interface with smart suggestions, filter chips, and field-type detection.

## Tasks

- [x] 1. Update types and create new type definitions
  - Add ActiveFilter and SearchMatchType types to consultar types.ts
  - Ensure compatibility with existing Resguardo types
  - _Requirements: 1.1, 2.1, 4.1_

- [x] 2. Implement useSearchAndFilters hook
  - [x] 2.1 Create useSearchAndFilters.ts hook file
    - Implement search term state management with deferred values
    - Implement field detection algorithm with scoring
    - Implement suggestion generation with deduplication
    - Implement active filters array management
    - Implement keyboard navigation handlers
    - _Requirements: 1.1, 1.2, 2.1, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.1, 7.2, 9.1_

  - [ ]* 2.2 Write property test for field detection accuracy
    - **Property 1: Field Detection Accuracy**
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 2.3 Write property test for suggestion limit and deduplication
    - **Property 4: Suggestion Limit and Deduplication**
    - **Validates: Requirements 2.1, 7.1, 7.4, 9.2**

  - [ ]* 2.4 Write property test for suggestion sorting priority
    - **Property 8: Suggestion Sorting Priority**
    - **Validates: Requirements 2.5**

  - [ ]* 2.5 Write property test for keyboard navigation
    - **Property 10: Keyboard Navigation**
    - **Validates: Requirements 3.1, 3.2, 3.5, 3.6**

  - [ ]* 2.6 Write property test for search term debouncing
    - **Property 23: Search Term Debouncing**
    - **Validates: Requirements 9.1**

- [x] 3. Create SearchAndFilters component
  - [x] 3.1 Create SearchAndFilters.tsx component
    - Implement search input with icon
    - Implement field type badge display
    - Integrate SuggestionDropdown component
    - Integrate FilterChips component
    - Handle focus/blur events
    - _Requirements: 1.3, 1.4, 1.5, 4.1, 8.1_

  - [ ]* 3.2 Write property test for field type indicator display
    - **Property 2: Field Type Indicator Display**
    - **Validates: Requirements 1.3**

  - [ ]* 3.3 Write property test for suggestion minimum length
    - **Property 3: Suggestion Minimum Length**
    - **Validates: Requirements 1.5**

  - [ ]* 3.4 Write property test for theme context integration
    - **Property 22: Theme Context Integration**
    - **Validates: Requirements 8.1**

- [x] 4. Create FilterChips component
  - [x] 4.1 Create FilterChips.tsx component
    - Implement chip rendering with type label and value
    - Implement remove button for each chip
    - Add Framer Motion animations for add/remove
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [ ]* 4.2 Write property test for filter chip display
    - **Property 13: Filter Chip Display**
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 4.3 Write property test for filter chip removal
    - **Property 14: Filter Chip Removal**
    - **Validates: Requirements 4.3**

  - [ ]* 4.4 Write property test for filter chip ordering
    - **Property 15: Filter Chip Ordering**
    - **Validates: Requirements 4.6**

- [x] 5. Create SuggestionDropdown component
  - [x] 5.1 Create SuggestionDropdown.tsx component
    - Implement suggestion list rendering
    - Add icons based on field type
    - Implement hover highlighting
    - Implement click handlers
    - Add Framer Motion animations
    - _Requirements: 2.2, 2.3, 2.4, 2.6_

  - [ ]* 5.2 Write property test for suggestion structure completeness
    - **Property 5: Suggestion Structure Completeness**
    - **Validates: Requirements 2.2**

  - [ ]* 5.3 Write property test for suggestion hover highlighting
    - **Property 6: Suggestion Hover Highlighting**
    - **Validates: Requirements 2.3**

  - [ ]* 5.4 Write property test for suggestion selection behavior
    - **Property 7: Suggestion Selection Behavior**
    - **Validates: Requirements 2.4**

  - [ ]* 5.5 Write property test for empty suggestions visibility
    - **Property 9: Empty Suggestions Visibility**
    - **Validates: Requirements 2.6**

- [x] 6. Checkpoint - Ensure all new components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update useResguardosData hook
  - [x] 7.1 Refactor useResguardosData to accept activeFilters
    - Replace individual filter states with activeFilters array
    - Update query building logic to iterate over activeFilters
    - Implement filter type matching (folio, director, resguardante, fecha)
    - Preserve existing sorting and pagination logic
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.4, 6.6_

  - [ ]* 7.2 Write property test for multi-filter AND logic
    - **Property 16: Multi-Filter AND Logic**
    - **Validates: Requirements 5.1**

  - [ ]* 7.3 Write property test for filter type matching
    - **Property 17: Filter Type Matching**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 10.2, 10.3, 10.4, 10.5**

  - [ ]* 7.4 Write property test for empty filter identity
    - **Property 18: Empty Filter Identity**
    - **Validates: Requirements 5.6**

  - [ ]* 7.5 Write property test for suggestion field coverage
    - **Property 19: Suggestion Field Coverage**
    - **Validates: Requirements 7.2**

  - [ ]* 7.6 Write property test for suggestion reactivity
    - **Property 20: Suggestion Reactivity**
    - **Validates: Requirements 7.3**

  - [ ]* 7.7 Write property test for director value type handling
    - **Property 21: Director Value Type Handling**
    - **Validates: Requirements 7.5**

- [x] 8. Update index.tsx to integrate unified search
  - [x] 8.1 Replace SearchBar and AdvancedFilters with SearchAndFilters
    - Import new SearchAndFilters component
    - Remove SearchBar and AdvancedFilters imports and usage
    - Wire up useSearchAndFilters hook
    - Pass activeFilters to useResguardosData
    - Update clear/refresh handlers
    - _Requirements: 1.4, 6.1, 6.2, 6.5, 10.6_

  - [ ]* 8.2 Write integration test for complete search flow
    - Test user input → suggestion selection → filtered results
    - _Requirements: 1.1, 2.4, 5.1_

  - [ ]* 8.3 Write property test for backward compatibility preservation
    - **Property 26: Backward Compatibility Preservation**
    - **Validates: Requirements 6.4, 6.6, 10.6**

- [x] 9. Remove deprecated components
  - [x] 9.1 Delete SearchBar.tsx component
    - Remove file from components directory
    - _Requirements: 6.1_

  - [x] 9.2 Delete AdvancedFilters.tsx component
    - Remove file from components directory
    - _Requirements: 6.1_

- [x] 10. Checkpoint - Ensure all tests pass and functionality is preserved
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Add error handling and edge cases
  - [x] 11.1 Add input validation and error handling
    - Handle empty search terms gracefully
    - Handle invalid filter types
    - Handle malformed data in suggestion generation
    - Add error recovery for query failures
    - _Requirements: 5.6, 9.5_

  - [ ]* 11.2 Write unit tests for edge cases
    - Test no matches scenario
    - Test single suggestion scenario
    - Test rapid filter changes
    - Test dataset loading state
    - _Requirements: 2.6, 9.5_

- [x] 12. Final checkpoint - Complete end-to-end testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The refactoring preserves all existing functionality while improving UX
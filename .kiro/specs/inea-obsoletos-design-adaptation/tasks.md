# Implementation Plan: INEA Obsoletos Design Adaptation

## Overview

This implementation plan refactors the INEA Obsoletos component to adopt the modern omni-search and filter chip design from INEA General. The work involves replacing the basic search with intelligent match detection, integrating reusable components, and maintaining all obsolete-specific functionality.

## Tasks

- [x] 1. Import and integrate useSearchAndFilters hook
  - Import useSearchAndFilters from INEA General hooks
  - Replace useObsoletosData search/filter logic with useSearchAndFilters
  - Pass muebles from useIneaObsoletosIndexation to useSearchAndFilters
  - Extract all necessary values from the hook (searchTerm, searchMatchType, activeFilters, etc.)
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 2. Implement SearchBar component integration
  - [x] 2.1 Import SearchBar component from INEA General
    - Import SearchBar from '../inea/components/SearchBar'
    - Replace existing SearchBar with imported component
    - Pass all required props (searchTerm, setSearchTerm, searchMatchType, etc.)
    - _Requirements: 1.3, 4.2, 5.1, 5.5_

  - [ ]* 2.2 Write property test for match type detection
    - **Property 1: Match Type Detection Accuracy**
    - **Validates: Requirements 1.1, 1.2, 1.3, 5.1**

  - [ ]* 2.3 Write unit tests for SearchBar rendering
    - Test badge display when match type detected
    - Test clear button functionality
    - Test placeholder text display
    - _Requirements: 1.3, 5.1_

- [x] 3. Implement Plus button for filter addition
  - [x] 3.1 Add Plus button next to SearchBar
    - Create motion.button with Plus icon
    - Position button to the right of search bar using flex layout
    - Implement disabled state based on searchTerm and searchMatchType
    - Add onClick handler calling saveCurrentFilter
    - Add tooltip with title attribute
    - _Requirements: 2.1, 2.2, 10.1, 10.2, 10.5_

  - [ ]* 3.2 Write property test for Plus button filter addition
    - **Property 4: Plus Button Filter Addition**
    - **Validates: Requirements 2.1, 2.2, 10.2**

  - [ ]* 3.3 Write property test for Plus button state
    - **Property 5: Plus Button State Consistency**
    - **Validates: Requirements 2.7, 10.1**

- [x] 4. Integrate FilterChips component
  - [x] 4.1 Import and render FilterChips component
    - Import FilterChips from '../inea/components/FilterChips'
    - Add conditional rendering based on activeFilters.length
    - Pass activeFilters, removeFilter, clearAllFilters, isDarkMode props
    - Position below search bar with proper spacing
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 4.3, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 4.2 Write property test for filter removal
    - **Property 2: Filter Removal Correctness**
    - **Validates: Requirements 2.4, 6.3**

  - [ ]* 4.3 Write property test for chip display
    - **Property 3: Filter Chip Display Completeness**
    - **Validates: Requirements 2.6, 6.2**

  - [ ]* 4.4 Write property test for AND logic filtering
    - **Property 10: AND Logic Filter Application**
    - **Validates: Requirements 2.3**

- [x] 5. Checkpoint - Verify search and filter UI
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement client-side filtering and sorting
  - [x] 6.1 Add sorting logic for filtered muebles
    - Create sortedMuebles useMemo that sorts filteredMueblesOmni
    - Handle null/undefined values in sorting
    - Support both string and number comparisons
    - Respect sortDirection (asc/desc)
    - _Requirements: 7.2_

  - [x] 6.2 Add pagination logic for sorted muebles
    - Calculate totalFilteredCount from sortedMuebles.length
    - Calculate totalPages based on rowsPerPage
    - Slice sortedMuebles for current page
    - _Requirements: 7.4_

  - [x] 6.3 Add value calculation for filtered muebles
    - Calculate filteredValue from sortedMuebles
    - Sum all valor fields with proper type handling
    - Pass to ValueStatsPanel component
    - _Requirements: 7.5_

  - [ ]* 6.4 Write property test for filtered count accuracy
    - **Property 16: Filtered Count Accuracy**
    - **Validates: Requirements 7.4**

  - [ ]* 6.5 Write property test for total value calculation
    - **Property 17: Total Value Calculation**
    - **Validates: Requirements 7.5**

- [x] 7. Implement suggestion system
  - [x] 7.1 Add SuggestionDropdown component integration
    - Import or create SuggestionDropdown component
    - Position dropdown below SearchBar
    - Pass suggestions, highlightedIndex, handleSuggestionClick props
    - Add conditional rendering based on showSuggestions
    - _Requirements: 1.4, 1.5, 5.2_

  - [x] 7.2 Implement keyboard navigation handlers
    - Verify handleInputKeyDown handles ArrowDown, ArrowUp, Enter, Escape
    - Ensure highlightedIndex stays within bounds
    - Ensure Enter adds highlighted suggestion to filters
    - Ensure Escape closes suggestions
    - _Requirements: 1.6, 1.7, 1.8_

  - [ ]* 7.3 Write property test for suggestion limit
    - **Property 6: Suggestion Generation Limit**
    - **Validates: Requirements 1.5**

  - [ ]* 7.4 Write property test for keyboard navigation bounds
    - **Property 7: Keyboard Navigation Bounds**
    - **Validates: Requirements 1.6**

  - [ ]* 7.5 Write property test for Enter key filter addition
    - **Property 8: Enter Key Filter Addition**
    - **Validates: Requirements 1.7**

  - [ ]* 7.6 Write property test for Escape key behavior
    - **Property 9: Escape Key Closes Suggestions**
    - **Validates: Requirements 1.8**

- [x] 8. Update InventoryTable integration
  - [x] 8.1 Update InventoryTable props
    - Pass paginatedMuebles instead of muebles
    - Update loading state from isIndexing
    - Maintain all existing props (selectedItem, sortField, etc.)
    - _Requirements: 4.1_

  - [x] 8.2 Update Pagination component
    - Pass totalFilteredCount instead of filteredCount
    - Calculate totalPages from sortedMuebles
    - Maintain all existing pagination functionality
    - _Requirements: 4.1_

- [x] 9. Maintain obsolete-specific functionality
  - [x] 9.1 Verify Reactivar button and modal
    - Ensure Reactivar button still renders in action buttons
    - Ensure ReactivarModal still functions correctly
    - Verify reactivarArticulo function still works
    - _Requirements: 8.1, 8.2_

  - [x] 9.2 Verify baja information display
    - Ensure DetailPanel still displays fechabaja
    - Ensure DetailPanel still displays causadebaja
    - Ensure useBajaInfo hook still fetches data correctly
    - _Requirements: 8.3, 8.4_

  - [x] 9.3 Verify edit and save functionality
    - Ensure edit mode still works
    - Ensure save changes still works
    - Ensure all form fields still editable
    - _Requirements: 8.5_

- [x] 10. Apply visual consistency updates
  - [x] 10.1 Update layout and spacing
    - Match grid layout structure from INEA General
    - Match spacing between components (mb-6, gap-6, etc.)
    - Match padding and margins throughout
    - _Requirements: 4.4, 9.1, 9.4_

  - [x] 10.2 Update button styles
    - Match button border styles from INEA General
    - Match button hover states and transitions
    - Match button sizing and padding
    - _Requirements: 9.1, 9.2_

  - [x] 10.3 Update animation timings
    - Match motion animation durations from INEA General
    - Match transition delays and easing functions
    - Ensure AnimatePresence mode matches
    - _Requirements: 4.5, 9.3_

- [x] 11. Checkpoint - Verify complete integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Write additional property tests
  - [ ]* 12.1 Write property test for clear all filters
    - **Property 11: Clear All Filters**
    - **Validates: Requirements 2.5**

  - [ ]* 12.2 Write property test for backward compatible filtering
    - **Property 12: Backward Compatible Field Filtering**
    - **Validates: Requirements 3.3**

  - [ ]* 12.3 Write property test for suggestion click
    - **Property 13: Suggestion Click Adds Filter**
    - **Validates: Requirements 5.4**

  - [ ]* 12.4 Write property test for conditional chip display
    - **Property 14: Conditional Chip Display**
    - **Validates: Requirements 6.1, 6.5**

  - [ ]* 12.5 Write property test for clear all button visibility
    - **Property 15: Clear All Button Visibility**
    - **Validates: Requirements 6.4**

  - [ ]* 12.6 Write property test for minimum suggestion length
    - **Property 18: Minimum Suggestion Length**
    - **Validates: Requirements 1.4**

  - [ ]* 12.7 Write property test for suggestion dropdown visibility
    - **Property 19: Suggestion Dropdown Visibility**
    - **Validates: Requirements 5.2**

- [ ] 13. Final integration testing
  - [ ]* 13.1 Write integration tests for full search flow
    - Test complete user journey: type → detect → add filter → results update
    - Test multiple filter addition and removal
    - Test clear all functionality
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 2.4, 2.5_

  - [ ]* 13.2 Write integration tests for keyboard navigation
    - Test arrow key navigation through suggestions
    - Test Enter key to add filter
    - Test Escape key to close suggestions
    - _Requirements: 1.6, 1.7, 1.8_

  - [ ]* 13.3 Write edge case tests
    - Test with empty muebles array
    - Test with null field values
    - Test with very long search terms
    - Test with special characters

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The refactoring maintains all existing obsolete-specific functionality while adopting modern search patterns

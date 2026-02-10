# Implementation Plan: No Listado Relational Migration

## Overview

This implementation plan breaks down the migration of the No Listado component from text-based fields to relational database fields into discrete, manageable tasks. The approach follows a phased strategy: first update TypeScript interfaces and data fetching, then implement director selection logic with modals, update the edit form, and finally add validation and testing.

## Tasks

- [x] 1. Update TypeScript interfaces and types
  - Update the `Mueble` interface to include `id_area`, `id_directorio`, and nested `area` and `directorio` objects
  - Remove legacy `area` and `usufinal` string fields from the interface
  - Add `Area`, `Directorio`, and `DirectorioArea` interfaces if not already present
  - Update all type annotations throughout the component to use the new structure
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 2. Update data fetching with JOINs
  - [x] 2.1 Modify the Supabase query to include JOINs for area and directorio tables
    - Update the query to use `.select()` with nested object syntax
    - Ensure the query returns `area:area(id_area, nombre)` and `directorio:directorio(id_directorio, nombre, puesto)`
    - Test that the query returns the correct nested structure
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Load areas, directors, and director-area relationships
    - Fetch all areas from the `area` table and store in state
    - Fetch all directors from the `directorio` table and store in state
    - Fetch all director-area relationships from `directorio_areas` table
    - Build the `directorAreasMap` object mapping director IDs to arrays of area IDs
    - _Requirements: 1.5, 1.6, 1.7_

  - [ ]* 2.3 Write property test for nested area object structure
    - **Property 1: Nested Area Object Structure**
    - **Validates: Requirements 1.2**

  - [ ]* 2.4 Write property test for nested directorio object structure
    - **Property 2: Nested Directorio Object Structure**
    - **Validates: Requirements 1.3**

  - [ ]* 2.5 Write unit tests for NULL value handling
    - Test that muebles with NULL `id_area` return null for the nested `area` object
    - Test that muebles with NULL `id_directorio` return null for the nested `directorio` object
    - Test that the component doesn't crash when displaying NULL values
    - _Requirements: 1.4_

- [x] 3. Checkpoint - Ensure data fetching works correctly
  - Verify that muebles are fetched with nested objects
  - Verify that areas, directors, and relationships are loaded
  - Ensure all tests pass, ask the user if questions arise

- [x] 4. Implement director selection logic
  - [x] 4.1 Create `handleSelectDirector` function
    - Implement logic to check how many areas the director has
    - Handle scenario 1: No areas → show Director Information Modal
    - Handle scenario 2: One area → auto-assign area
    - Handle scenario 3: Multiple areas → show Area Selection Modal
    - Update form state with `id_directorio`, `id_area`, and nested objects
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.2 Write property test for director selection form state update
    - **Property 3: Director Selection Form State Update**
    - **Validates: Requirements 2.4, 2.5**

  - [ ]* 4.3 Write unit tests for director selection scenarios
    - Test director with 0 areas shows Director Information Modal
    - Test director with 1 area auto-assigns area
    - Test director with 2+ areas shows Area Selection Modal
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Create Director Information Modal component
  - [x] 5.1 Build the modal UI
    - Create modal component with director name display
    - Add input field for area information
    - Add Save and Cancel buttons
    - Style the modal to match the application theme
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 5.2 Implement `saveDirectorInfo` function
    - Update the `directorio` table with the new area (legacy field)
    - Find or create the area in the `area` table
    - Create a relationship in the `directorio_areas` table
    - Update the form state with the new area assignment
    - Close the modal and show success message
    - _Requirements: 7.4, 7.5, 7.7_

  - [x] 5.3 Implement cancel functionality
    - Close the modal without saving
    - Keep the director selection but leave area empty
    - _Requirements: 7.6_

  - [ ]* 5.4 Write unit tests for Director Information Modal
    - Test that modal displays director information correctly
    - Test that saving creates directorio_areas entry
    - Test that cancel keeps director but clears area
    - Test that area is auto-assigned after saving
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 6. Create Area Selection Modal component
  - [x] 6.1 Build the modal UI
    - Create modal component with list of areas
    - Display area names from the `area` table
    - Add radio buttons or select for area selection
    - Add Confirm and Cancel buttons
    - Style the modal to match the application theme
    - _Requirements: 8.1, 8.2, 8.3, 8.6_

  - [x] 6.2 Implement area selection confirmation
    - Update form state with selected `id_area` and `id_directorio`
    - Update nested `area` and `directorio` objects
    - Close the modal
    - _Requirements: 8.4_

  - [x] 6.3 Implement cancel functionality
    - Close the modal without selecting
    - Keep the director selection but leave area empty
    - _Requirements: 8.5_

  - [ ]* 6.4 Write unit tests for Area Selection Modal
    - Test that modal displays all areas for the director
    - Test that confirming selection updates form correctly
    - Test that cancel keeps director but clears area
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 7. Checkpoint - Ensure director selection and modals work correctly
  - Test all three director selection scenarios manually
  - Verify modals display and function correctly
  - Ensure all tests pass, ask the user if questions arise

- [x] 8. Update edit form to use relational fields
  - [x] 8.1 Replace director text input with select dropdown
    - Create select dropdown populated with directors from `directorio` table
    - Set value to `editFormData?.id_directorio`
    - Call `handleSelectDirector` on change
    - _Requirements: 4.1, 4.3_

  - [x] 8.2 Make area input read-only and auto-populated
    - Change area input to read-only
    - Display `editFormData?.area?.nombre`
    - Add visual indication that it's auto-populated
    - _Requirements: 4.2_

  - [x] 8.3 Update `handleEditFormChange` to handle relational fields
    - Add cases for `id_area` and `id_directorio` to parse as integers
    - Remove cases for legacy `area` and `usufinal` text fields
    - _Requirements: 9.3_

  - [x] 8.4 Update form display to show current values
    - Display current director name if `id_directorio` is set
    - Display current area name if `id_area` is set
    - Handle NULL values gracefully with placeholders
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ]* 8.5 Write unit tests for edit form
    - Test that director dropdown is populated correctly
    - Test that area input is read-only
    - Test that selecting a director triggers selection logic
    - Test that form displays current values correctly
    - Test that NULL values are handled gracefully
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 9. Update display components to use nested objects
  - [x] 9.1 Update table display
    - Change area column to display `item.area?.nombre ?? 'No Data'`
    - Change director column to display `item.directorio?.nombre ?? 'No Data'`
    - _Requirements: 5.1, 5.2, 5.5, 5.6_

  - [x] 9.2 Update detail panel display
    - Change area display to use `selectedItem.area?.nombre ?? 'No Data'`
    - Change director display to use `selectedItem.directorio?.nombre ?? 'No Data'`
    - Add puesto display using `selectedItem.directorio?.puesto ?? 'No Data'`
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

  - [ ]* 9.3 Write property tests for display
    - **Property 5: Area Name Display**
    - **Property 6: Director Name Display**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ]* 9.4 Write unit tests for NULL value display
    - Test that NULL `id_area` displays "No Data"
    - Test that NULL `id_directorio` displays "No Data"
    - _Requirements: 5.5, 5.6_

- [x] 10. Update sorting logic to use nested objects
  - [x] 10.1 Modify sort function to handle nested fields
    - Add special cases for `sortField === 'area'` to use `area?.nombre`
    - Add special cases for `sortField === 'directorio'` to use `directorio?.nombre`
    - Treat NULL values as empty strings in sorting
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ]* 10.2 Write property tests for sorting
    - **Property 7: Sorting by Area**
    - **Property 8: Sorting by Director**
    - **Validates: Requirements 6.1, 6.2, 6.5**

- [x] 11. Update filtering logic to use nested objects
  - [x] 11.1 Modify omnibox filter to match against nested fields
    - Update `case 'area'` to match against `item.area?.nombre`
    - Update `case 'usufinal'` to match against `item.directorio?.nombre`
    - Update general search to include `item.area?.nombre` and `item.directorio?.nombre`
    - _Requirements: 6.3, 6.4_

  - [ ]* 11.2 Write property tests for filtering
    - **Property 9: Filtering by Area**
    - **Property 10: Filtering by Director**
    - **Validates: Requirements 6.3, 6.4**

- [x] 12. Checkpoint - Ensure display, sorting, and filtering work correctly
  - Test sorting by area and director in both directions
  - Test filtering by area and director names
  - Verify NULL values are handled correctly
  - Ensure all tests pass, ask the user if questions arise

- [x] 13. Implement validation logic
  - [x] 13.1 Create `validateDirectorAreaRelation` function
    - Query `directorio_areas` table for the director-area combination
    - Return true if the relationship exists, false otherwise
    - _Requirements: 3.1, 3.4_

  - [x] 13.2 Add validation to save operation
    - Call validation function before saving if both `id_directorio` and `id_area` are set
    - Display error message and prevent save if validation fails
    - Skip validation if either field is NULL
    - _Requirements: 3.1, 3.2, 3.5, 2.6_

  - [ ]* 13.3 Write property test for director-area validation
    - **Property 4: Director-Area Validation**
    - **Validates: Requirements 3.1**

  - [ ]* 13.4 Write unit tests for validation
    - Test that validation fails for invalid director-area combinations
    - Test that validation succeeds for valid combinations
    - Test that validation is skipped when either field is NULL
    - Test that error message is displayed on validation failure
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 14. Update save operation to use relational fields
  - [x] 14.1 Modify save function to save IDs instead of text
    - Ensure `id_area` and `id_directorio` are saved as integers
    - Remove any code that saves legacy `area` or `usufinal` fields
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 14.2 Add error handling for foreign key constraints
    - Catch database errors with code '23503' (foreign key violation)
    - Display user-friendly error message
    - Keep form in edit mode with current values
    - _Requirements: 10.4_

  - [x] 14.3 Refetch mueble with JOINs after save
    - After successful save, refetch the mueble with nested objects
    - Update `selectedItem` with the refetched data
    - _Requirements: 10.5_

  - [ ]* 14.4 Write property test for saving relational IDs
    - **Property 11: Saving Relational IDs**
    - **Validates: Requirements 10.1, 10.2**

  - [ ]* 14.5 Write unit tests for save operation
    - Test that IDs are saved as integers
    - Test that legacy fields are not saved
    - Test that foreign key constraint errors are handled
    - Test that refetch includes JOINs
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15. Remove all references to legacy fields
  - [x] 15.1 Search and remove legacy field references
    - Search codebase for references to `area` as a string field
    - Search codebase for references to `usufinal` as a string field
    - Remove or update all found references
    - _Requirements: 9.1, 9.2_

  - [x] 15.2 Verify no legacy field usage remains
    - Run TypeScript compiler to check for type errors
    - Run all tests to ensure nothing is broken
    - Manually review the component code
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 16. Final checkpoint - Comprehensive testing
  - Run all unit tests and property tests
  - Perform manual testing of all scenarios
  - Test with real data in development environment
  - Verify no console errors or warnings
  - Ensure all tests pass, ask the user if questions arise

- [ ] 17. Integration testing and cleanup
  - [ ] 17.1 Test end-to-end flows
    - Test: Select director → choose area → save → verify in database
    - Test: Select director with no areas → add area → save → verify
    - Test: Edit item with NULL values → save → verify
    - Test: Try to save invalid director-area combination → verify error

  - [ ] 17.2 Code cleanup and optimization
    - Remove commented-out code
    - Add JSDoc comments to new functions
    - Optimize imports
    - Format code consistently

  - [ ] 17.3 Update component documentation
    - Document the new director selection flow
    - Document the validation logic
    - Add examples of using the new structure

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a logical progression: types → data → logic → UI → validation → testing

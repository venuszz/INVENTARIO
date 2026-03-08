# Implementation Plan: Batch Origen Transfer for Levantamiento Module

## Overview

This implementation adds batch origen transfer functionality to the Levantamiento Unificado module, enabling users to select and transfer multiple inventory items between institutions (INEA, ITEA, TLAXCALA) in a single operation. The implementation reuses existing single-item transfer infrastructure and follows patterns from the directorio bienes transfer feature.

## Tasks

- [x] 1. Set up transfer mode state management and types
  - Create TypeScript interfaces for transfer mode state, blocked items, and transfer results
  - Define BlockReason type and BLOCK_REASON_MESSAGES constant
  - Create TransferModeState interface with active flag, selectedItems Set, blockedItems Map, and targetOrigen
  - _Requirements: 1.3, 1.4, 4.1, 4.2_

- [x] 2. Implement transfer mode UI controls
  - [x] 2.1 Add transfer mode button to ExportButtons component
    - Display button only when at least one origen filter is active
    - Toggle button label between "Transferir Origen" and "Cancelar Transferencia"
    - Handle mode activation and cancellation
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 3.1, 3.4_

  - [x] 2.2 Extend InventoryTable with checkbox column
    - Add transferMode, selectedItems, onItemSelect, onSelectAll, allSelected, and blockedItems props
    - Render checkbox column as leftmost column when transferMode is true
    - Add header checkbox for select-all functionality
    - Disable origen badge click handlers in transfer mode
    - Apply visual styling to blocked items (grayed out with tooltip)
    - _Requirements: 1.4, 1.6, 2.1, 2.2, 3.2, 3.5_

  - [x] 2.3 Create TransferFAB component
    - Implement floating action button with fixed bottom-right positioning
    - Display "Confirmar Transferencia (X)" with selected count
    - Add slide-up entrance animation and pulse effect
    - Show only when selectedCount > 0
    - Handle responsive behavior (show only count on mobile)
    - _Requirements: 2.6, 2.7, 3.6_

- [x] 3. Implement selection logic in main component
  - [x] 3.1 Add transfer mode state to LevantamientoUnificado component
    - Initialize transferMode state (active, selectedItems, blockedItems, targetOrigen)
    - Implement toggleTransferMode function
    - Implement handleItemSelect function
    - Implement handleSelectAll function
    - Clear selection when exiting transfer mode
    - _Requirements: 1.3, 2.3, 2.4, 2.5, 3.3_

  - [ ]* 3.2 Write property test for selection state consistency
    - **Property 3: Selection State Consistency**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7**
    - Test that selection operations (individual select, select all, deselect all) maintain accurate selection set and FAB count

  - [ ]* 3.3 Write property test for mode exit state restoration
    - **Property 4: Mode Exit State Restoration**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
    - Test that exiting transfer mode restores all UI elements to pre-transfer state

- [x] 4. Create useBatchOrigenTransfer custom hook
  - [x] 4.1 Implement validation logic
    - Create validateItems function to check for active resguardos
    - Check for estatus BAJA items
    - Check user permissions (admin/superadmin role)
    - Return validItems and blockedItems Map with reasons
    - _Requirements: 4.1, 4.2, 4.5, 11.1, 11.2, 11.5_

  - [ ]* 4.2 Write property test for blocked item identification
    - **Property 5: Blocked Item Identification**
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.5, 11.5**
    - Test that validation correctly identifies all items that cannot be transferred with appropriate reasons

  - [x] 4.3 Implement sequential transfer processing
    - Create transferBatch function that processes items one by one
    - Use existing useOrigenTransfer hook for each item
    - Track progress with current index and total count
    - Add 100ms delay between transfers to prevent API overload
    - Skip blocked items and mark as skipped
    - Categorize results as successful, failed, or skipped
    - _Requirements: 6.3, 6.4, 6.8, 10.1, 10.2, 10.3, 10.4_

  - [ ]* 4.4 Write property test for sequential processing order
    - **Property 8: Sequential Processing Order**
    - **Validates: Requirements 6.3, 6.4, 10.4**
    - Test that system processes each non-blocked item exactly once in sequential order

  - [ ]* 4.5 Write property test for transfer result categorization
    - **Property 9: Transfer Result Categorization**
    - **Validates: Requirements 6.5, 6.6, 6.8**
    - Test that each item is categorized exactly once as successful, failed, or skipped

  - [x] 4.6 Implement error handling and recovery
    - Handle network errors with appropriate error messages
    - Handle validation errors from API
    - Handle permission errors
    - Continue processing remaining items after errors
    - Log all errors for debugging
    - _Requirements: 12.1, 12.2, 12.3, 12.6_

- [x] 5. Checkpoint - Ensure core logic works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create BatchTransferConfirmationModal component
  - [x] 6.1 Implement modal structure and layout
    - Create modal with header "Confirmar Transferencia en Lote"
    - Display summary stats (total items, breakdown by origen, blocked count)
    - Add target origen dropdown selector
    - Create scrollable items list with id_inventario, descripción, current origen
    - Add warnings section for blocked items
    - Add acknowledgment checkbox "Confirmo que entiendo las advertencias"
    - Add Cancel and Confirm buttons
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 6.2 Write property test for mixed origen selection
    - **Property 6: Mixed Origen Selection**
    - **Validates: Requirements 4.3, 5.2**
    - Test that system allows selection of items with different origen values and groups them correctly

  - [ ]* 6.3 Write property test for confirmation modal completeness
    - **Property 7: Confirmation Modal Completeness**
    - **Validates: Requirements 5.4, 5.5**
    - Test that modal displays all selected items with key identifiers and shows warnings for blocked items

  - [x] 6.4 Implement modal interactions
    - Handle target origen selection
    - Handle warning acknowledgment checkbox
    - Disable confirm button when warnings not acknowledged
    - Handle cancel action
    - Handle confirm action and trigger transfer
    - _Requirements: 5.6, 5.7, 5.8_

- [x] 7. Create BatchTransferProgressModal component
  - [x] 7.1 Implement progress display
    - Create modal with header "Procesando Transferencias"
    - Add progress bar with visual indicator
    - Display "Procesando X de Y" status text
    - Create scrollable items list with status icons (pending, processing, success, failed, skipped)
    - Disable close button during processing
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.2 Implement real-time progress updates
    - Update progress bar as items are processed
    - Update status icons for each item (⏳ pending, 🔄 processing, ✓ success, ✗ failed, ⊘ skipped)
    - Display error messages for failed items
    - Display skip reasons for blocked items
    - Scroll to current item being processed
    - _Requirements: 6.4, 6.5, 6.6, 6.8_

  - [x] 7.3 Implement completion summary
    - Display summary counts (successful, failed, skipped)
    - Enable close button after completion
    - Add "Descargar Reporte" button
    - Handle background processing if modal closed early
    - _Requirements: 6.7, 8.3, 8.4, 8.5, 9.1, 12.4, 12.5_

- [x] 8. Implement audit trail and store updates
  - [x] 8.1 Create audit records for successful transfers
    - Record authenticated user identifier
    - Record timestamp
    - Record previous and new origen values
    - Record item identifier and details
    - Record operation type as "batch_origen_transfer"
    - Use existing cambios_inventario table structure
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 8.2 Write property test for audit record completeness
    - **Property 10: Audit Record Completeness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**
    - Test that successful transfers create audit records with all required fields

  - [x] 8.3 Update local store after transfers
    - Update store with new origen values for successful transfers only
    - Trigger reindexation to refresh inventory table
    - Display updated origen badges
    - _Requirements: 8.1, 8.2_

  - [ ]* 8.4 Write property test for store update accuracy
    - **Property 11: Store Update Accuracy**
    - **Validates: Requirements 8.1**
    - Test that local store is updated with new origen values for exactly the set of successfully transferred items

  - [ ]* 8.5 Write property test for summary accuracy
    - **Property 12: Summary Accuracy**
    - **Validates: Requirements 8.3, 8.4, 8.5**
    - Test that displayed summary counts match actual transfer results

- [x] 9. Implement transfer report generation
  - [x] 9.1 Create report generation function
    - Include operation timestamp
    - Include user information (ID and name)
    - List all successfully transferred items with old and new origen
    - List all failed transfers with error messages
    - List all skipped items with reasons
    - Format as downloadable text or CSV file
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 9.2 Write property test for report completeness
    - **Property 13: Report Completeness**
    - **Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7**
    - Test that generated report contains timestamp, user info, and complete lists of all transfer results

  - [x] 9.3 Integrate report download with progress modal
    - Add download button to progress modal after completion
    - Trigger report generation and download on click
    - Handle report generation errors gracefully
    - _Requirements: 9.1, 9.2_

- [x] 10. Checkpoint - Ensure all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Add animations and polish
  - [x] 11.1 Implement transfer mode transitions
    - Add slide-in animation for checkbox column (200ms)
    - Add fade transition for button label (150ms)
    - Add slide-up animation for FAB (300ms, spring)
    - _Requirements: UI/UX specifications_

  - [x] 11.2 Implement progress animations
    - Add fade-in for status icons (150ms)
    - Add smooth width transition for progress bar (300ms)
    - Add pulse animation for current item highlight
    - _Requirements: UI/UX specifications_

- [x] 12. Implement accessibility features
  - [x] 12.1 Add keyboard navigation support
    - Make transfer button tab-accessible with Enter/Space activation
    - Make checkboxes tab-accessible with Space toggle
    - Make FAB tab-accessible with Enter activation
    - Implement focus trap in modals with Escape to close
    - Add arrow key navigation for lists
    - _Requirements: Accessibility specifications_

  - [x] 12.2 Add screen reader support
    - Add aria-label for transfer button with mode state
    - Add aria-label for checkboxes with selection state
    - Add aria-label for FAB with selected count
    - Add aria-live for progress updates
    - Add aria-busy during processing
    - Provide text alternatives for status icons
    - _Requirements: Accessibility specifications_

- [x] 13. Integration and wiring
  - [x] 13.1 Wire all components together in LevantamientoUnificado
    - Connect transfer mode button to state management
    - Connect checkbox column to selection handlers
    - Connect FAB to confirmation modal trigger
    - Connect confirmation modal to transfer execution
    - Connect progress modal to transfer hook
    - Handle mode exit after transfer completion
    - _Requirements: All integration requirements_

  - [ ]* 13.2 Write property test for transfer button visibility
    - **Property 1: Transfer Button Visibility**
    - **Validates: Requirements 1.1, 1.2**
    - Test that transfer button is visible if and only if at least one origen filter is active

  - [ ]* 13.3 Write property test for checkbox column presence
    - **Property 2: Checkbox Column Presence**
    - **Validates: Requirements 1.4, 2.1, 3.2**
    - Test that checkboxes are present if and only if transfer mode is active

  - [x] 13.3 Add error handling for edge cases
    - Handle empty selection attempts
    - Handle network failures during validation
    - Handle concurrent transfer attempts
    - Handle session expiration during transfer
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 14. Create user and technical documentation
  - Create BATCH_ORIGEN_TRANSFER_USER_GUIDE.md with step-by-step usage guide
  - Create BATCH_ORIGEN_TRANSFER_TECHNICAL.md with architecture and API documentation
  - Add inline code comments for complex logic
  - Document all TypeScript interfaces and types
  - _Requirements: Documentation specifications_

- [x] 15. Final checkpoint - Complete testing and verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation reuses existing `useOrigenTransfer` hook and `/api/inventario/transfer-origen` endpoint
- Sequential processing is implemented client-side to maintain simplicity and reuse existing infrastructure
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all scenarios

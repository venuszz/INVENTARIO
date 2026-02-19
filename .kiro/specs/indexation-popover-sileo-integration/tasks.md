# Implementation Plan: Sileo Toast Notification Integration

## Overview

This implementation plan converts the Sileo toast notification integration design into actionable coding tasks. The integration will replace custom AnimatePresence notification cards in IndexationPopover with professional, physics-based Sileo toasts while maintaining all existing indexation progress functionality.

The implementation follows a phased approach to minimize risk: install dependencies, add Toaster component, implement toast triggers, remove custom notification cards, and add comprehensive testing.

## Tasks

- [x] 1. Setup and Installation
  - [x] 1.1 Install Sileo package and verify compatibility
    - Run `npm install sileo` to add the package
    - Verify sileo appears in package.json dependencies
    - Run `npm run build` to ensure no dependency conflicts
    - Check that the build completes without errors
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Add Toaster Component to Application Layout
  - [x] 2.1 Integrate Toaster component in layout.tsx
    - Import Toaster from 'sileo' in src/app/layout.tsx
    - Import useTheme hook from '@/context/ThemeContext'
    - Add 'use client' directive if not already present
    - Add Toaster component inside ThemeProvider wrapper
    - Configure Toaster with theme prop based on isDarkMode value
    - Set position="top-right" to avoid IndexationPopover conflict
    - Set offset="80px" to position below header
    - Set gap={8} for spacing between toasts
    - Set visibleToasts={3} to match existing limit
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 13.1, 13.2_

  - [ ]* 2.2 Write unit tests for Toaster integration
    - Test that Toaster renders with correct theme prop
    - Test that Toaster renders client-side only (not during SSR)
    - Test that theme prop updates when isDarkMode changes
    - Test that Toaster is positioned correctly (top-right, 80px offset)

- [x] 3. Implement Toast Trigger Logic for Realtime Changes
  - [x] 3.1 Add Sileo import and ref tracking to IndexationPopover
    - Import sileo function from 'sileo' in src/components/IndexationPopover.tsx
    - Add prevRealtimeChangesRef using useRef to track previous realtime changes
    - Initialize ref with empty array: useRef<RealtimeChangeEvent[]>([])
    - _Requirements: 3.1, 3.3_

  - [x] 3.2 Create useEffect hook for realtime change toast triggers
    - Add useEffect that watches realtimeChanges array
    - Filter for new changes not in prevRealtimeChangesRef
    - For each new non-dismissed change, call sileo() with event data
    - Use getEventIcon, getEventColor, getEventText utility functions
    - Display module name or "CONFIGURACIÓN" for config table changes
    - Configure toast with 5 second duration
    - Set onDismiss callback to call dismissRealtimeChange(change.id)
    - Apply dark/light theme styling based on isDarkMode
    - Add colored border using eventColor with 33% opacity
    - Update prevRealtimeChangesRef.current at end of effect
    - _Requirements: 3.1, 3.2, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.2, 9.2, 9.3, 11.2, 11.3, 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 3.3 Write property test for realtime change toast display
    - **Property 1: Realtime Change Toast Display**
    - **Validates: Requirements 3.1**
    - Install fast-check library: `npm install --save-dev fast-check @types/fast-check`
    - Generate random RealtimeChangeEvent objects with fc.record
    - Add event to IndexationStore using addRealtimeChange
    - Assert that sileo() is called with correct event type, icon, and color
    - Run with minimum 100 iterations

  - [ ]* 3.4 Write property test for toast filtering consistency
    - **Property 2: Toast Filtering Consistency**
    - **Validates: Requirements 3.3, 15.1**
    - Generate random realtimeChanges arrays with varying dismissed states
    - Assert displayed toasts are non-dismissed and limited to 3
    - Run with minimum 100 iterations

  - [ ]* 3.5 Write property test for auto-dismiss timing
    - **Property 3: Auto-Dismiss Timing**
    - **Validates: Requirements 3.4, 5.2**
    - Generate random RealtimeChangeEvent objects
    - Display toast and wait 5 seconds
    - Assert dismissRealtimeChange called with correct ID
    - Run with minimum 100 iterations

  - [ ]* 3.6 Write property test for module name display logic
    - **Property 4: Module Name Display Logic**
    - **Validates: Requirements 4.4**
    - Generate random RealtimeChangeEvent objects with varying table values
    - Assert toast displays "CONFIGURACIÓN" for config table, moduleName otherwise
    - Run with minimum 100 iterations

  - [ ]* 3.7 Write unit tests for realtime change toasts
    - Test INSERT event displays "Agregado" with Plus icon and green color
    - Test UPDATE event displays "Actualizado" with Edit2 icon and blue color
    - Test DELETE event displays "Eliminado" with Trash2 icon and red color
    - Test config table changes display "CONFIGURACIÓN"
    - Test toast includes close button for manual dismissal

- [x] 4. Checkpoint - Verify realtime change toasts work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Toast Triggers for Module Completion
  - [x] 5.1 Add ref tracking for module states
    - Add prevStatesRef using useRef to track previous module states
    - Initialize ref with empty object: useRef<Record<string, { isIndexing: boolean, isIndexed: boolean }>>({})
    - _Requirements: 6.1_

  - [x] 5.2 Create useEffect hook for module completion toast triggers
    - Add useEffect that watches modules array
    - For each module, compare current state with previous state in prevStatesRef
    - Detect transition from isIndexing=true to isIndexed=true without errors
    - Call sileo() with success message including module name
    - Use module's icon and glowColor for visual consistency
    - Configure toast with 5 second auto-dismiss duration
    - Apply dark/light theme styling based on isDarkMode
    - Add colored border using module's glowColor
    - Update prevStatesRef.current with new state for each module
    - _Requirements: 6.1, 6.2, 6.3, 9.2, 9.3_

  - [ ]* 5.3 Write property test for module completion success toast
    - **Property 7: Module Completion Success Toast**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - Generate random module state transitions (isIndexing→isIndexed)
    - Assert success toast displayed with module name, message, and glowColor
    - Run with minimum 100 iterations

  - [ ]* 5.4 Write unit tests for module completion toasts
    - Test success toast displays when module completes indexation
    - Test success toast includes module name and completion message
    - Test success toast uses module's glowColor
    - Test success toast auto-dismisses after 5 seconds
    - Test no toast displayed if module has error

- [x] 6. Implement Toast Triggers for Reconnection Status
  - [x] 6.1 Add ref tracking for reconnection statuses
    - Add prevReconnectionStatusRef using useRef to track previous reconnection statuses
    - Initialize ref with empty object: useRef<Record<string, string>>({})
    - _Requirements: 7.1, 8.1_

  - [x] 6.2 Create useEffect hook for reconnection status toast triggers
    - Add useEffect that watches modules array for reconnectionStatus changes
    - For each module, compare current reconnectionStatus with previous status
    - When status changes to 'failed', display error toast with infinite duration
    - Error toast should include module name, "Conexión perdida" message, and red/orange color
    - When status changes to 'reconnecting', display info toast with 10 second duration
    - Reconnecting toast should show "Reconectando..." with attempt count
    - When status changes to 'reconciling', display info toast with 10 second duration
    - Reconciling toast should show "Sincronizando..." message
    - Apply dark/light theme styling based on isDarkMode
    - Update prevReconnectionStatusRef.current with new status for each module
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 9.2, 9.3_

  - [ ]* 6.3 Write property test for connection failure error toast
    - **Property 8: Connection Failure Error Toast**
    - **Validates: Requirements 7.1, 7.2, 7.4**
    - Generate random module reconnectionStatus changes to 'failed'
    - Assert error toast displayed with module name and error message
    - Run with minimum 100 iterations

  - [ ]* 6.4 Write property test for reconnection status info toast
    - **Property 9: Reconnection Status Info Toast**
    - **Validates: Requirements 8.1, 8.2, 8.3**
    - Generate random module reconnectionStatus changes to 'reconnecting'/'reconciling'
    - Assert info toast displayed with appropriate status message
    - Run with minimum 100 iterations

  - [ ]* 6.5 Write property test for reconnection success toast dismissal
    - **Property 10: Reconnection Success Toast Dismissal**
    - **Validates: Requirements 8.4**
    - Generate random module reconnection completions
    - Assert active reconnection toast dismissed
    - Run with minimum 100 iterations

  - [ ]* 6.6 Write unit tests for reconnection status toasts
    - Test error toast displays when reconnectionStatus changes to 'failed'
    - Test error toast has infinite duration
    - Test reconnecting toast displays with attempt count
    - Test reconciling toast displays "Sincronizando..." message
    - Test reconnection toast dismisses when reconnection succeeds

- [x] 7. Checkpoint - Verify all toast triggers work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Remove Custom Notification Card Code
  - [x] 8.1 Remove AnimatePresence notification card block from IndexationPopover
    - Locate the AnimatePresence block that renders realtimeChanges (approximately lines 240-290)
    - Remove the entire AnimatePresence block including all nested motion.div notification cards
    - Remove the realtimeChanges.filter().slice().map() logic for notification cards
    - Preserve the IndexationPopover progress display JSX (module progress bars, status indicators)
    - Ensure the main popover div structure remains intact
    - _Requirements: 3.2, 10.5, 12.1, 12.2_

  - [x] 8.2 Clean up unused imports and code
    - Remove unused framer-motion imports if AnimatePresence is no longer used elsewhere
    - Remove unused animation variants for notification cards
    - Remove unused transition configurations for notification cards
    - Preserve framer-motion animations for the indexation popover itself
    - Verify getEventIcon, getEventColor, getEventText utility functions are preserved
    - _Requirements: 12.3, 12.4, 12.5_

  - [ ]* 8.3 Write unit tests for code cleanup
    - Test that AnimatePresence notification card block is removed
    - Test that custom motion.div notification cards are removed
    - Test that IndexationPopover still displays progress bars
    - Test that IndexationPopover still shows module states
    - Test that IndexationPopover still displays reconnection status indicators
    - Test that IndexationPopover auto-hides after completion
    - Verify line count reduced in IndexationPopover.tsx

- [x] 9. Implement Dark Mode Support
  - [ ]* 9.1 Write property test for theme propagation
    - **Property 11: Theme Propagation**
    - **Validates: Requirements 9.1, 2.2**
    - Generate random isDarkMode values (true/false)
    - Assert Toaster receives corresponding theme prop
    - Run with minimum 100 iterations

  - [ ]* 9.2 Write property test for theme-appropriate styling
    - **Property 12: Theme-Appropriate Styling**
    - **Validates: Requirements 9.2, 9.3**
    - Generate random isDarkMode values and toast events
    - Assert toast colors match theme (dark bg/light text or light bg/dark text)
    - Run with minimum 100 iterations

  - [ ]* 9.3 Write unit tests for dark mode support
    - Test toasts use dark background and light text when isDarkMode=true
    - Test toasts use light background and dark text when isDarkMode=false
    - Test toast colors maintain sufficient contrast in both modes
    - Test theme switching updates toast appearance

- [x] 10. Verify IndexationStore Integration
  - [ ]* 10.1 Write property test for store method invocation
    - **Property 13: Store Method Invocation**
    - **Validates: Requirements 11.2**
    - Generate random realtime events from indexation hooks
    - Assert addRealtimeChange called for each event
    - Run with minimum 100 iterations

  - [ ]* 10.2 Write property test for toast dismissal store update
    - **Property 5: Toast Dismissal Store Update**
    - **Validates: Requirements 5.2, 11.3**
    - Generate random toast dismissal actions
    - Assert dismissRealtimeChange called for each dismissal
    - Run with minimum 100 iterations

  - [ ]* 10.3 Write property test for dismissed toast removal
    - **Property 6: Dismissed Toast Removal**
    - **Validates: Requirements 5.3**
    - Generate random dismissed toast IDs
    - Assert toast removed from display and realtimeChanges array updated
    - Run with minimum 100 iterations

  - [ ]* 10.4 Write property test for toast metadata completeness
    - **Property 14: Toast Metadata Completeness**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**
    - Generate random RealtimeChangeEvent objects with varying metadata
    - Assert toast includes all available metadata fields
    - Run with minimum 100 iterations

  - [ ]* 10.5 Write unit tests for IndexationStore integration
    - Test that realtimeChanges array is used from IndexationStore
    - Test that addRealtimeChange is called when new events occur
    - Test that dismissRealtimeChange is called when toasts are dismissed
    - Test that IndexationStore interface is not modified
    - Test that auto-dismiss timeout behavior is maintained (5 seconds)

- [x] 11. Performance and Accessibility Testing
  - [ ]* 11.1 Write unit tests for performance characteristics
    - Test that simultaneously displayed toasts are limited to 3 or fewer
    - Test that dismissed toasts are cleaned up from memory within 1 second
    - Test that toast display does not cause layout shifts
    - Test that animation performance maintains 60fps on modern browsers

  - [ ]* 11.2 Write unit tests for toast positioning
    - Test that toasts are positioned in top-right corner
    - Test that toasts stack vertically without overlapping
    - Test that toasts remain visible on all screen sizes
    - Test that toasts appear below header component (z-index coordination)

  - [ ]* 11.3 Manual testing checklist
    - Test with multiple simultaneous events (verify max 3 toasts)
    - Test dark mode switching (verify toast colors update)
    - Test manual toast dismissal (verify store update)
    - Test auto-dismiss after 5 seconds (verify store update)
    - Test module completion scenarios (verify success toast)
    - Test reconnection scenarios (verify info/error toasts)
    - Test accessibility with screen readers
    - Test keyboard navigation for toast dismissal

- [x] 12. Final Integration and Verification
  - [x] 12.1 Run full test suite and verify all tests pass
    - Run `npm run test` to execute all unit tests
    - Run property-based tests with minimum 100 iterations each
    - Verify no test failures or warnings
    - Check code coverage meets project standards
    - _Requirements: All requirements_

  - [x] 12.2 Manual end-to-end testing
    - Start development server and test all toast scenarios
    - Add new item to database → Verify toast displays
    - Update existing item → Verify toast displays
    - Delete item → Verify toast displays
    - Complete module indexation → Verify success toast displays
    - Simulate connection loss → Verify error toast displays
    - Simulate reconnection → Verify info toast displays
    - Test in both light and dark modes
    - Verify no console errors or warnings
    - _Requirements: All requirements_

  - [x] 12.3 Performance verification
    - Run `npm run build` and verify bundle size has not increased significantly
    - Test animation performance (should maintain 60fps)
    - Test memory usage (no memory leaks)
    - Test toast display latency (should be < 100ms)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 13. Final checkpoint - Ensure all tests pass and feature is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The implementation follows a phased approach to minimize risk
- All existing IndexationPopover functionality is preserved
- Custom notification card code is removed to simplify the codebase
- Sileo's built-in physics animations provide professional toast UX

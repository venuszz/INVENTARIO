# Implementation Plan: Eliminación de Errores Finales de React Doctor

## Overview

This implementation plan addresses the final 2 critical errors detected by react-doctor through targeted refactoring of EditableAreaChip and login_form.tsx. The approach maintains all existing functionality while adhering to React best practices.

## Tasks

- [x] 1. Refactor EditableAreaChip to eliminate state initialization from props
  - [x] 1.1 Update state initialization in EditableAreaChip
    - Change `useState(areaName)` to `useState('')` on line 39
    - Modify `handleStartEdit` to set `editValue` before setting `isEditing`
    - _Requirements: 1.1, 1.3_
  
  - [ ]* 1.2 Write property test for EditableAreaChip edit mode
    - **Property 1: Edit mode displays current area name**
    - **Validates: Requirements 1.1, 1.3**
  
  - [ ]* 1.3 Write property test for EditableAreaChip cancel behavior
    - **Property 2: Cancel resets edit state**
    - **Validates: Requirements 1.2**
  
  - [ ]* 1.4 Write unit tests for EditableAreaChip edge cases
    - Test edit mode activation with specific area name
    - Test cancel resets to original value
    - Test save with empty/whitespace input
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create custom hook for user approval monitoring
  - [x] 2.1 Create useUserApprovalMonitoring hook
    - Create new file `src/hooks/useUserApprovalMonitoring.ts`
    - Implement ApprovalStatus interface
    - Extract polling logic from login_form.tsx (lines 36-80)
    - Extract Supabase realtime subscription logic
    - Implement proper cleanup on unmount
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 2.2 Write property test for null userId handling
    - **Property 3: Null userId returns inactive status**
    - **Validates: Requirements 2.1**
  
  - [ ]* 2.3 Write property test for polling interval consistency
    - **Property 4: Polling interval consistency**
    - **Validates: Requirements 2.2**
  
  - [ ]* 2.4 Write property test for approval detection
    - **Property 5: Approval detection**
    - **Validates: Requirements 2.3**
  
  - [ ]* 2.5 Write property test for cleanup on unmount
    - **Property 6: Cleanup on unmount**
    - **Validates: Requirements 2.4**
  
  - [ ]* 2.6 Write property test for realtime approval detection
    - **Property 7: Realtime approval detection**
    - **Validates: Requirements 2.5**
  
  - [ ]* 2.7 Write unit tests for useUserApprovalMonitoring
    - Test with null userId
    - Test with valid userId
    - Test approval detection with mocked API
    - Test realtime event handling
    - Test cleanup on unmount
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Update login_form.tsx to use custom hook
  - [x] 3.1 Integrate useUserApprovalMonitoring in login_form
    - Import useUserApprovalMonitoring hook
    - Replace monitoring useEffect (lines 36-80) with hook usage
    - Add sync useEffect to update local state from hook values
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 3.2 Write integration tests for login form
    - Test login form renders with hook
    - Test transition from pending to approved state
    - Test localStorage interaction
    - Test URL params handling
    - _Requirements: 2.1, 2.3, 2.5_

- [x] 4. Checkpoint - Validate changes and run tests
  - Run TypeScript compiler to verify no type errors ✅
  - Run unit tests to verify functionality (skipped - optional)
  - Run property tests to verify correctness properties (skipped - optional)
  - Build completed successfully with no errors

- [ ] 5. Validate with react-doctor
  - [ ] 5.1 Run react-doctor analysis
    - Run `npx react-doctor` on EditableAreaChip.tsx
    - Verify no "state reset in useEffect" error
    - Run `npx react-doctor` on login_form.tsx
    - Verify no "fetch() inside useEffect" error
    - Verify overall score improved from 81 to ~85
    - Verify 0 critical errors
    - _Requirements: Success Criteria 1, 2_
  
  - [ ] 5.2 Run build validation
    - Run `npm run build` or equivalent
    - Verify no TypeScript compilation errors
    - Verify no new warnings introduced
    - _Requirements: Success Criteria 3_

- [ ] 6. Manual testing and validation
  - [ ] 6.1 Test EditableAreaChip functionality
    - Click edit button, verify input shows current area name
    - Edit area name and save, verify update succeeds
    - Edit area name and cancel, verify original name restored
    - Try to edit area with resguardos, verify edit button disabled
    - Change area name prop (via parent), verify display updates
    - _Requirements: 1.1, 1.2, 1.3, Success Criteria 4_
  
  - [ ] 6.2 Test login form approval monitoring
    - Register new user, verify redirect to login with awaiting_approval=true
    - Verify "Esperando Aprobación" screen displays
    - Approve user in admin panel
    - Verify automatic transition to "¡Cuenta Aprobada!" screen (within 3 seconds)
    - Click "Iniciar sesión" button, verify returns to login form
    - Verify localStorage cleared after approval
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, Success Criteria 4_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- The design uses TypeScript, so all implementation should be in TypeScript
- No database migrations or API changes required
- Changes are isolated to 3 files: EditableAreaChip.tsx, login_form.tsx, and new useUserApprovalMonitoring.ts
- All existing functionality must be preserved - this is purely a refactoring for code quality

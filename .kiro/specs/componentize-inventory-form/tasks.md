# Implementation Plan: Componentize Inventory Form

## Overview

This implementation plan breaks down the componentization of the monolithic inventory registration form into discrete, incremental steps. The approach follows a bottom-up strategy: first creating shared types and utilities, then building custom hooks, followed by individual components, and finally integrating everything together. Each task builds on previous work, ensuring no orphaned code and maintaining functionality throughout the refactoring process.

## Tasks

- [x] 1. Create folder structure and shared types
  - Create the directory structure: `src/components/inventario/registro/` with subfolders `steps/`, `modals/`, and `hooks/`
  - Create `types.ts` with all shared TypeScript interfaces: `FormData`, `FilterOptions`, `Directorio`, `Message`, and all component prop interfaces
  - Create `index.tsx` that will serve as the main export point (initially empty, will be populated later)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Implement custom hooks
  - [x] 2.1 Create useFormData hook
    - Implement `useFormData.ts` in the `hooks/` folder
    - Manage form data state with all fields from FormData interface
    - Implement `handleChange` function with uppercase conversion for text inputs
    - Implement `handleCurrencyChange` function for valor field
    - Implement `handleBlur` function with touched state management and currency formatting
    - Implement `isFieldValid` function for validation
    - Implement `isStepComplete` function to check all required fields for a step
    - Implement `resetForm` function to restore initial state
    - Implement `formatCurrency` helper function
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [ ]* 2.2 Write property test for useFormData hook
    - **Property 3: Uppercase Text Transformation**
    - **Validates: Requirements 11.4**

  - [ ]* 2.3 Write property test for currency formatting
    - **Property 4: Currency Formatting**
    - **Validates: Requirements 11.5**

  - [ ]* 2.4 Write property test for form field validation
    - **Property 5: Required Field Validation**
    - **Validates: Requirements 11.7**

  - [x] 2.5 Create useFilterOptions hook
    - Implement `useFilterOptions.ts` in the `hooks/` folder
    - Fetch estados from muebles and mueblesitea tables (unique values)
    - Fetch estatus from config table or fallback to table values
    - Fetch rubros from config table or fallback to table values
    - Fetch formasAdquisicion from config table or use defaults
    - Use predefined causasBaja values
    - Fetch usuarios from directorio table
    - Manage loading and error states
    - Provide refetch function
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [ ]* 2.6 Write property test for filter options data binding
    - **Property 18: Filter Options Data Binding**
    - **Validates: Requirements 6.5, 6.6, 7.6, 7.7, 7.8, 7.9**

  - [x] 2.7 Create useDirectorManagement hook
    - Implement `useDirectorManagement.ts` in the `hooks/` folder
    - Fetch directorio from Supabase on mount
    - Fetch areas from area table on mount
    - Fetch director-area relationships from directorio_areas table
    - Build directorAreasMap mapping director IDs to area IDs
    - Implement `handleSelectDirector` function with logic for 0, 1, or multiple areas
    - Implement `saveDirectorInfo` function to update director in Supabase
    - Manage modal visibility states (showDirectorModal, showAreaSelectModal)
    - Provide refetch function
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

  - [ ]* 2.8 Write property tests for director selection logic
    - **Property 6: Director Selection with No Areas**
    - **Property 7: Director Selection with Multiple Areas**
    - **Property 8: Director Selection with Single Area**
    - **Validates: Requirements 7.3, 7.4, 7.5, 13.5, 13.6, 13.7**

- [x] 3. Checkpoint - Verify hooks work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement presentational components
  - [x] 4.1 Create FormHeader component
    - Implement `FormHeader.tsx` with FormHeaderProps interface
    - Render title "Registro de Bienes" with icon
    - Render three progress indicator dots
    - Apply theme-aware styling based on isDarkMode prop
    - Apply responsive sizing classes
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.2 Write unit tests for FormHeader
    - Test title renders correctly
    - Test three progress indicators are displayed
    - Test active step highlighting

  - [x] 4.3 Create FormStepIndicator component
    - Implement `FormStepIndicator.tsx` with FormStepIndicatorProps interface
    - Render three step buttons with labels: "Información Básica", "Ubicación y Estado", "Detalles Adicionales"
    - Implement click handlers that call onStepClick prop
    - Apply active step highlighting based on currentStep prop
    - Disable steps based on isStepComplete prop
    - Apply theme-aware styling
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.4 Write property test for step navigation validation
    - **Property 1: Step Navigation Validation**
    - **Validates: Requirements 2.4, 4.4, 5.4**

  - [x] 4.5 Create FormNavigation component
    - Implement `FormNavigation.tsx` with FormNavigationProps interface
    - Conditionally render "Previous" button (hidden on step 1)
    - Conditionally render "Next" button (steps 1-2) or "Save" button (step 3)
    - Disable buttons based on isStepComplete and isSubmitting props
    - Show loading spinner during submission
    - Apply theme-aware styling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 4.6 Write unit tests for FormNavigation
    - Test button visibility for each step
    - Test button disabled states
    - Test loading state during submission

- [x] 5. Implement form step components
  - [x] 5.1 Create Step1BasicInfo component
    - Implement `steps/Step1BasicInfo.tsx` with Step1Props interface
    - Render input fields: id_inv, rubro, valor, formadq, f_adq, proveedor, factura
    - Apply validation error styling for invalid touched fields
    - Use getInputClasses and getLabelClasses helper functions for consistent styling
    - Bind onChange, onBlur, onCurrencyChange handlers from props
    - Load rubro and formadq options from filterOptions prop
    - Apply theme-aware styling
    - Apply responsive grid layout
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 5.2 Write unit tests for Step1BasicInfo
    - Test all fields render correctly
    - Test validation errors display for required fields
    - Test currency formatting on blur

  - [x] 5.3 Create Step2LocationStatus component
    - Implement `steps/Step2LocationStatus.tsx` with Step2Props interface
    - Render location fields: ubicacion_es, ubicacion_mu, ubicacion_no (max 2 chars)
    - Render status fields: estado, estatus
    - Render assignment fields: area (read-only), usufinal, resguardante
    - Conditionally render BAJA fields (fechabaja, causadebaja) when estatus === 'BAJA'
    - Load estado, estatus, causasBaja, usuarios options from filterOptions prop
    - Call onDirectorSelect when usufinal changes
    - Apply theme-aware styling
    - Apply responsive grid layout
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

  - [ ]* 5.4 Write property test for conditional BAJA fields
    - **Property 9: Conditional BAJA Fields Display**
    - **Validates: Requirements 7.2**

  - [x] 5.5 Create Step3AdditionalDetails component
    - Implement `steps/Step3AdditionalDetails.tsx` with Step3Props interface
    - Render descripcion textarea
    - Render institucion select dropdown (INEA/ITEA)
    - Render image upload area with drag-and-drop support
    - Conditionally render image preview when imagePreview prop is not null
    - Render remove button when preview is displayed
    - Set file input accept attribute to "image/*"
    - Apply theme-aware styling
    - Apply responsive grid layout
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 5.6 Write property test for image preview generation
    - **Property 10: Image Preview Generation**
    - **Validates: Requirements 14.1, 14.2**

- [x] 6. Implement modal components
  - [x] 6.1 Create DirectorInfoModal component
    - Implement `modals/DirectorInfoModal.tsx` with DirectorInfoModalProps interface
    - Render modal overlay and dialog (only when isOpen is true)
    - Display director name from director prop
    - Render input field for area with value from areaValue prop
    - Disable save button when areaValue is empty or isSaving is true
    - Show loading spinner on save button when isSaving is true
    - Call onSave when save button clicked
    - Call onCancel when cancel button clicked
    - Apply theme-aware styling
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ]* 6.2 Write property test for director modal save workflow
    - **Property 20: Director Modal Save Workflow**
    - **Validates: Requirements 9.5, 9.6**

  - [x] 6.3 Create AreaSelectionModal component
    - Implement `modals/AreaSelectionModal.tsx` with AreaSelectionModalProps interface
    - Render modal overlay and dialog (only when isOpen is true)
    - Display director name from director prop
    - Render clickable button for each area in areas prop
    - Call onSelect with area name when area button clicked
    - Call onCancel when close button clicked
    - Apply theme-aware styling
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 6.4 Write property test for area selection modal workflow
    - **Property 21: Area Selection Modal Workflow**
    - **Validates: Requirements 10.3, 10.4**

  - [ ]* 6.5 Write property test for modal cancel behavior
    - **Property 19: Modal State Management**
    - **Validates: Requirements 9.7, 10.5**

- [x] 7. Checkpoint - Verify all components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement main orchestrator component
  - [x] 8.1 Create RegistroBienesForm component
    - Implement `RegistroBienesForm.tsx` as the main orchestrator
    - Use useFormData hook for form state management
    - Use useFilterOptions hook for dropdown options
    - Use useDirectorManagement hook for director logic
    - Use useTheme hook for dark/light mode
    - Use useNotifications hook for system notifications
    - Manage currentStep state (1, 2, or 3)
    - Manage institucion state ('INEA' or 'ITEA')
    - Manage isSubmitting state
    - Manage message state for user feedback
    - Manage imagePreview and imageFileRef state
    - Implement handleSubmit function with validation, data cleaning, Supabase insert, image upload, notifications
    - Implement uploadImage function for Supabase storage
    - Implement handleImageChange function for file selection and preview generation
    - Implement nextStep and prevStep functions
    - Implement handleCloseMessage function
    - Render FormHeader with currentStep and isDarkMode
    - Render FormStepIndicator with currentStep, isStepComplete, and onStepClick
    - Render message notification conditionally
    - Conditionally render Step1BasicInfo, Step2LocationStatus, or Step3AdditionalDetails based on currentStep
    - Render FormNavigation with all necessary props
    - Conditionally render DirectorInfoModal when showDirectorModal is true
    - Conditionally render AreaSelectionModal when showAreaSelectModal is true
    - Apply theme-aware styling to container
    - Apply responsive layout classes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10, 15.11, 16.1, 16.2, 16.3, 16.4, 16.5, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

  - [ ]* 8.2 Write property test for form state management
    - **Property 2: Form State Management**
    - **Validates: Requirements 2.2, 11.2**

  - [ ]* 8.3 Write property test for institution-based bucket selection
    - **Property 11: Institution-Based Storage Bucket Selection**
    - **Validates: Requirements 14.4, 14.5**

  - [ ]* 8.4 Write property test for image path formatting
    - **Property 12: Image Path Formatting**
    - **Validates: Requirements 14.7**

  - [ ]* 8.5 Write property test for institution-based table selection
    - **Property 13: Institution-Based Table Selection**
    - **Validates: Requirements 15.4, 15.5**

  - [ ]* 8.6 Write property test for submission data cleaning
    - **Property 14: Submission Data Cleaning**
    - **Validates: Requirements 15.2, 15.3**

  - [ ]* 8.7 Write property test for successful submission workflow
    - **Property 15: Successful Submission Workflow**
    - **Validates: Requirements 15.7, 15.8, 15.11**

  - [ ]* 8.8 Write property test for failed submission workflow
    - **Property 16: Failed Submission Workflow**
    - **Validates: Requirements 15.9, 15.10**

  - [ ]* 8.9 Write property test for theme-aware styling
    - **Property 17: Theme-Aware Styling**
    - **Validates: Requirements 3.4, 4.5, 5.6, 6.7, 7.10, 8.8, 9.8, 10.6, 16.2, 16.3, 16.4**

  - [ ]* 8.10 Write property test for responsive grid layout
    - **Property 24: Responsive Grid Layout**
    - **Validates: Requirements 17.1, 17.4, 17.5**

- [x] 9. Update index.tsx and ensure backward compatibility
  - Update `src/components/inventario/registro/index.tsx` to export RegistroBienesForm as default
  - Verify the component name is "RegistroBienesForm"
  - Verify the component maintains the same external API (no props required)
  - _Requirements: 18.1, 18.2, 18.3_

- [x] 10. Replace old monolithic component with new modular version
  - Update any imports in the application that reference the old `src/components/inventario/registro.tsx` to use the new `src/components/inventario/registro/index.tsx`
  - Delete or rename the old monolithic file `src/components/inventario/registro.tsx` (consider keeping as backup initially)
  - Verify the application still works correctly with the new component structure
  - _Requirements: 18.4, 18.5, 18.6, 18.7_

- [ ] 11. Final checkpoint - Integration testing
  - Manually test complete form submission with all fields
  - Manually test form submission with only required fields
  - Test director selection with no area (modal opens)
  - Test director selection with multiple areas (modal opens)
  - Test director selection with single area (auto-populates)
  - Test image upload and preview
  - Test form submission with and without image
  - Toggle between INEA and ITEA institutions
  - Set estatus to BAJA and verify additional fields appear
  - Toggle between dark and light themes
  - Test responsive layout on different screen sizes
  - Verify form reset after successful submission
  - Verify form persists after failed submission
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: types → hooks → components → integration
- All existing functionality is preserved throughout the refactoring
- Theme support and responsive design are maintained in all components

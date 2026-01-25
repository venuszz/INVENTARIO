# Requirements Document

## Introduction

This document specifies the requirements for componentizing the monolithic inventory registration form (`src/components/inventario/registro.tsx`) into smaller, maintainable, and testable sub-components. The current implementation is a ~1400-line single-file component that handles multiple responsibilities including multi-step form navigation, data management, image uploads, director/area selection with modals, Supabase integration, theme management, and notifications. The goal is to break this down into a well-organized folder structure with focused, single-responsibility components while maintaining all existing functionality.

## Glossary

- **Inventory_Form**: The main orchestrator component that manages the overall form state and coordinates sub-components
- **Form_Step**: A discrete section of the multi-step form (Step 1: Basic Info, Step 2: Location/Status, Step 3: Additional Details)
- **Director**: A person from the directory table who can be assigned as the responsible party for inventory items
- **Area**: A department or organizational unit where inventory items are located
- **Supabase**: The backend database and storage service used for data persistence
- **Theme_Context**: The application-wide dark/light mode theming system
- **Filter_Options**: Dynamic dropdown options loaded from the database (estados, estatus, areas, rubros, etc.)
- **Image_Upload**: The process of uploading inventory item photos to Supabase storage
- **Notification_System**: The application's notification service for user feedback
- **Form_Validation**: The process of ensuring required fields are completed before allowing navigation or submission
- **Director_Modal**: A modal dialog for completing missing director information
- **Area_Selection_Modal**: A modal dialog for selecting an area when a director has multiple areas assigned

## Requirements

### Requirement 1: Component Structure Organization

**User Story:** As a developer, I want the inventory form organized into a clear folder structure, so that I can easily locate and maintain specific functionality.

#### Acceptance Criteria

1. THE System SHALL create a folder structure at `src/components/inventario/registro/` containing all sub-components
2. THE System SHALL provide an `index.tsx` file that exports the main form component
3. THE System SHALL organize step components in a `steps/` subfolder
4. THE System SHALL organize modal components in a `modals/` subfolder
5. THE System SHALL organize custom hooks in a `hooks/` subfolder
6. THE System SHALL provide a `types.ts` file containing all shared TypeScript interfaces and types

### Requirement 2: Main Form Orchestration

**User Story:** As a developer, I want a main orchestrator component that manages overall form state, so that sub-components remain focused on their specific responsibilities.

#### Acceptance Criteria

1. THE Inventory_Form SHALL manage the current step state (1, 2, or 3)
2. THE Inventory_Form SHALL manage the form data state for all fields
3. THE Inventory_Form SHALL manage the submission state and loading indicators
4. THE Inventory_Form SHALL coordinate navigation between form steps
5. THE Inventory_Form SHALL handle form submission to Supabase
6. THE Inventory_Form SHALL manage success and error message display
7. THE Inventory_Form SHALL integrate with the Notification_System for user feedback
8. THE Inventory_Form SHALL manage the institution selection (INEA or ITEA)

### Requirement 3: Form Header Component

**User Story:** As a user, I want a consistent header displaying the form title and progress, so that I understand what form I'm using and my current progress.

#### Acceptance Criteria

1. WHEN the form is displayed, THE Form_Header SHALL show the title "Registro de Bienes"
2. WHEN the form is displayed, THE Form_Header SHALL show visual progress indicators for all three steps
3. WHEN a step is active, THE Form_Header SHALL highlight the corresponding progress indicator
4. THE Form_Header SHALL adapt styling based on the Theme_Context (dark/light mode)

### Requirement 4: Step Indicator Component

**User Story:** As a user, I want to see which step I'm on and navigate between completed steps, so that I can review and edit previous information.

#### Acceptance Criteria

1. THE Step_Indicator SHALL display all three form steps with labels
2. WHEN a step is active, THE Step_Indicator SHALL highlight that step
3. WHEN a step is complete, THE Step_Indicator SHALL allow clicking to navigate to that step
4. WHEN a step is incomplete, THE Step_Indicator SHALL prevent navigation to subsequent steps
5. THE Step_Indicator SHALL adapt styling based on the Theme_Context

### Requirement 5: Form Navigation Component

**User Story:** As a user, I want clear navigation buttons to move between form steps, so that I can progress through the form efficiently.

#### Acceptance Criteria

1. WHEN on step 1, THE Form_Navigation SHALL display only a "Next" button
2. WHEN on steps 2-3, THE Form_Navigation SHALL display both "Previous" and "Next" buttons
3. WHEN on step 3, THE Form_Navigation SHALL display a "Save" button instead of "Next"
4. WHEN required fields are incomplete, THE Form_Navigation SHALL disable the "Next" button
5. WHEN the form is submitting, THE Form_Navigation SHALL disable the "Save" button and show a loading indicator
6. THE Form_Navigation SHALL adapt styling based on the Theme_Context

### Requirement 6: Step 1 - Basic Information Component

**User Story:** As a user, I want to enter basic inventory information in the first step, so that I can provide essential item details.

#### Acceptance Criteria

1. THE Step1_Component SHALL display input fields for: id_inv, rubro, valor, formadq, f_adq, proveedor, factura
2. WHEN a required field is empty and touched, THE Step1_Component SHALL display a validation error
3. WHEN the valor field is edited, THE Step1_Component SHALL format the value as currency
4. THE Step1_Component SHALL convert all text inputs to uppercase
5. THE Step1_Component SHALL load rubro options from Filter_Options
6. THE Step1_Component SHALL load formadq options from Filter_Options
7. THE Step1_Component SHALL adapt styling based on the Theme_Context

### Requirement 7: Step 2 - Location and Status Component

**User Story:** As a user, I want to specify location and status information in the second step, so that I can track where items are and their current condition.

#### Acceptance Criteria

1. THE Step2_Component SHALL display input fields for: ubicacion_es, ubicacion_mu, ubicacion_no, estado, estatus, area, usufinal, resguardante
2. WHEN estatus is set to "BAJA", THE Step2_Component SHALL display additional fields for fechabaja and causadebaja
3. WHEN a director is selected in usufinal, THE Step2_Component SHALL automatically populate the area field
4. WHEN a director with no area is selected, THE Step2_Component SHALL trigger the Director_Modal
5. WHEN a director with multiple areas is selected, THE Step2_Component SHALL trigger the Area_Selection_Modal
6. THE Step2_Component SHALL load estado options from Filter_Options
7. THE Step2_Component SHALL load estatus options from Filter_Options
8. THE Step2_Component SHALL load causasBaja options from Filter_Options
9. THE Step2_Component SHALL load usuarios (directors) from Filter_Options
10. THE Step2_Component SHALL adapt styling based on the Theme_Context

### Requirement 8: Step 3 - Additional Details Component

**User Story:** As a user, I want to provide additional details and upload an image in the third step, so that I can complete the inventory record with full information.

#### Acceptance Criteria

1. THE Step3_Component SHALL display a textarea for descripcion
2. THE Step3_Component SHALL display a dropdown for institucion selection (INEA/ITEA)
3. THE Step3_Component SHALL display an image upload area with drag-and-drop support
4. WHEN an image is selected, THE Step3_Component SHALL display a preview
5. WHEN an image preview is displayed, THE Step3_Component SHALL provide a button to remove the image
6. THE Step3_Component SHALL accept image files in JPG, PNG, or GIF format
7. THE Step3_Component SHALL convert descripcion text to uppercase
8. THE Step3_Component SHALL adapt styling based on the Theme_Context

### Requirement 9: Director Information Modal Component

**User Story:** As a user, I want to complete missing director information when needed, so that I can proceed with form submission without incomplete data.

#### Acceptance Criteria

1. WHEN a director with no area is selected, THE Director_Modal SHALL display
2. THE Director_Modal SHALL show the selected director's name
3. THE Director_Modal SHALL provide an input field for the area
4. WHEN the area field is empty, THE Director_Modal SHALL disable the save button
5. WHEN the save button is clicked, THE Director_Modal SHALL update the director record in Supabase
6. WHEN the save is successful, THE Director_Modal SHALL close and populate the form's area field
7. WHEN the cancel button is clicked, THE Director_Modal SHALL close without saving
8. THE Director_Modal SHALL adapt styling based on the Theme_Context

### Requirement 10: Area Selection Modal Component

**User Story:** As a user, I want to select the appropriate area when a director has multiple areas, so that I can accurately assign inventory items.

#### Acceptance Criteria

1. WHEN a director with multiple areas is selected, THE Area_Selection_Modal SHALL display
2. THE Area_Selection_Modal SHALL show all areas assigned to the selected director
3. WHEN an area is clicked, THE Area_Selection_Modal SHALL populate the form's area field with the selected area
4. WHEN an area is selected, THE Area_Selection_Modal SHALL close automatically
5. WHEN the close button is clicked, THE Area_Selection_Modal SHALL close without selecting an area
6. THE Area_Selection_Modal SHALL adapt styling based on the Theme_Context

### Requirement 11: Form Data Management Hook

**User Story:** As a developer, I want a custom hook to manage form data state, so that form state logic is reusable and testable.

#### Acceptance Criteria

1. THE useFormData_Hook SHALL provide the current form data state
2. THE useFormData_Hook SHALL provide a function to update individual form fields
3. THE useFormData_Hook SHALL provide a function to reset the form to initial state
4. THE useFormData_Hook SHALL convert text inputs to uppercase automatically
5. THE useFormData_Hook SHALL format currency values automatically
6. THE useFormData_Hook SHALL manage field validation state (touched fields)
7. THE useFormData_Hook SHALL provide validation functions for required fields

### Requirement 12: Filter Options Management Hook

**User Story:** As a developer, I want a custom hook to load and manage filter options from the database, so that dropdown options are dynamically populated.

#### Acceptance Criteria

1. THE useFilterOptions_Hook SHALL fetch estados from the database
2. THE useFilterOptions_Hook SHALL fetch estatus from the database or config table
3. THE useFilterOptions_Hook SHALL fetch rubros from the database or config table
4. THE useFilterOptions_Hook SHALL fetch formasAdquisicion from the database or config table
5. THE useFilterOptions_Hook SHALL fetch causasBaja from predefined values
6. THE useFilterOptions_Hook SHALL fetch usuarios (directors) from the directorio table
7. THE useFilterOptions_Hook SHALL return all filter options as a single object
8. THE useFilterOptions_Hook SHALL handle loading and error states

### Requirement 13: Director Management Hook

**User Story:** As a developer, I want a custom hook to manage director selection and area assignment, so that director-related logic is centralized and testable.

#### Acceptance Criteria

1. THE useDirectorManagement_Hook SHALL fetch the directorio from Supabase
2. THE useDirectorManagement_Hook SHALL fetch areas from Supabase
3. THE useDirectorManagement_Hook SHALL fetch director-area relationships from the directorio_areas table
4. THE useDirectorManagement_Hook SHALL provide a function to handle director selection
5. WHEN a director with no areas is selected, THE useDirectorManagement_Hook SHALL trigger the Director_Modal
6. WHEN a director with multiple areas is selected, THE useDirectorManagement_Hook SHALL trigger the Area_Selection_Modal
7. WHEN a director with exactly one area is selected, THE useDirectorManagement_Hook SHALL automatically populate the area field
8. THE useDirectorManagement_Hook SHALL provide a function to save updated director information

### Requirement 14: Image Upload Handling

**User Story:** As a user, I want to upload images for inventory items, so that I can visually document the items.

#### Acceptance Criteria

1. WHEN an image file is selected, THE System SHALL store the file reference
2. WHEN an image file is selected, THE System SHALL generate a preview
3. WHEN the form is submitted with an image, THE System SHALL upload the image to Supabase storage
4. THE System SHALL upload images to the "muebles.inea" bucket for INEA institution
5. THE System SHALL upload images to the "muebles.itea" bucket for ITEA institution
6. WHEN the image upload is successful, THE System SHALL update the mueble record with the image_path
7. THE System SHALL name uploaded images using the format "{muebleId}/image.{extension}"

### Requirement 15: Form Submission and Data Persistence

**User Story:** As a user, I want to save inventory records to the database, so that the information is permanently stored.

#### Acceptance Criteria

1. WHEN the form is submitted, THE System SHALL validate all required fields are complete
2. WHEN validation passes, THE System SHALL convert all text fields to uppercase
3. WHEN validation passes, THE System SHALL clean the valor field to contain only numbers and decimal points
4. THE System SHALL insert the record into the "muebles" table for INEA institution
5. THE System SHALL insert the record into the "mueblesitea" table for ITEA institution
6. WHEN the insert is successful and an image exists, THE System SHALL upload the image
7. WHEN the insert is successful, THE System SHALL display a success message
8. WHEN the insert is successful, THE System SHALL create a success notification
9. WHEN the insert fails, THE System SHALL display an error message
10. WHEN the insert fails, THE System SHALL create an error notification
11. WHEN the insert is successful, THE System SHALL reset the form to initial state

### Requirement 16: Theme Support

**User Story:** As a user, I want the form to respect my theme preference, so that the interface is comfortable to use in different lighting conditions.

#### Acceptance Criteria

1. THE System SHALL integrate with the Theme_Context to detect dark/light mode
2. WHEN dark mode is active, THE System SHALL apply dark color schemes to all components
3. WHEN light mode is active, THE System SHALL apply light color schemes to all components
4. THE System SHALL apply theme-aware styling to: backgrounds, borders, text colors, input fields, buttons, and modals
5. THE System SHALL provide smooth transitions when the theme changes

### Requirement 17: Responsive Design

**User Story:** As a user, I want the form to work well on different screen sizes, so that I can use it on desktop, tablet, or mobile devices.

#### Acceptance Criteria

1. THE System SHALL use responsive grid layouts that adapt to screen size
2. THE System SHALL adjust font sizes for different screen sizes (sm, md, lg breakpoints)
3. THE System SHALL adjust padding and spacing for different screen sizes
4. THE System SHALL stack form fields vertically on small screens
5. THE System SHALL display form fields in multi-column grids on larger screens
6. THE System SHALL ensure touch targets are appropriately sized for mobile devices

### Requirement 18: Backward Compatibility

**User Story:** As a developer, I want the componentized form to maintain the same external API, so that existing code using the form continues to work without changes.

#### Acceptance Criteria

1. THE System SHALL export the main component as the default export from `src/components/inventario/registro/index.tsx`
2. THE System SHALL maintain the same component name "RegistroBienesForm"
3. THE System SHALL maintain the same props interface (if any)
4. THE System SHALL maintain the same behavior for all user interactions
5. THE System SHALL maintain the same data flow with Supabase
6. THE System SHALL maintain the same integration with the Notification_System
7. THE System SHALL maintain the same integration with the Theme_Context

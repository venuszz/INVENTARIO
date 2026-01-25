# Design Document: Componentize Inventory Form

## Overview

This design document outlines the technical approach for refactoring the monolithic inventory registration form into a modular, maintainable component architecture. The refactoring will extract distinct responsibilities into focused components, custom hooks, and shared utilities while preserving all existing functionality including multi-step navigation, form validation, Supabase integration, theme support, and notification handling.

The design follows React best practices including:
- Single Responsibility Principle: Each component handles one specific concern
- Custom Hooks: Extract stateful logic for reusability and testability
- Composition: Build complex UIs from simple, focused components
- Type Safety: Comprehensive TypeScript interfaces for all data structures

## Architecture

### Component Hierarchy

```
RegistroBienesForm (Main Orchestrator)
├── FormHeader
│   └── Progress Indicators
├── FormStepIndicator
│   └── Step Navigation Buttons
├── Message Notification (conditional)
├── Form Steps (conditional rendering based on currentStep)
│   ├── Step1BasicInfo
│   ├── Step2LocationStatus
│   └── Step3AdditionalDetails
├── FormNavigation
│   └── Previous/Next/Submit Buttons
└── Modals (conditional rendering)
    ├── DirectorInfoModal
    └── AreaSelectionModal
```

### Data Flow

```
User Input → Component Event Handlers → Custom Hooks → State Updates → Re-render
                                      ↓
                                  Supabase API
                                      ↓
                              Database/Storage
```

### Folder Structure

```
src/components/inventario/registro/
├── index.tsx                    # Main export
├── RegistroBienesForm.tsx       # Main orchestrator component
├── FormHeader.tsx               # Header with title and progress dots
├── FormStepIndicator.tsx        # Step navigation with labels
├── FormNavigation.tsx           # Previous/Next/Submit buttons
├── steps/
│   ├── Step1BasicInfo.tsx       # Basic information fields
│   ├── Step2LocationStatus.tsx  # Location and status fields
│   └── Step3AdditionalDetails.tsx # Description and image upload
├── modals/
│   ├── DirectorInfoModal.tsx    # Complete missing director info
│   └── AreaSelectionModal.tsx   # Select area for multi-area directors
├── types.ts                     # Shared TypeScript interfaces
└── hooks/
    ├── useFormData.ts           # Form state management
    ├── useFilterOptions.ts      # Load dropdown options from DB
    └── useDirectorManagement.ts # Director selection and area logic
```

## Components and Interfaces

### 1. Main Orchestrator: RegistroBienesForm

**Responsibility:** Coordinate all sub-components, manage overall form state, handle submission

**State:**
- `currentStep: number` - Current form step (1, 2, or 3)
- `institucion: 'INEA' | 'ITEA'` - Selected institution
- `isSubmitting: boolean` - Submission in progress flag
- `message: { type: 'success' | 'error' | '', text: string }` - User feedback message
- `imagePreview: string | null` - Preview URL for uploaded image
- `imageFileRef: File | null` - Reference to selected image file

**Props:** None (standalone component)

**Key Methods:**
- `handleSubmit(e: FormEvent)` - Validate and submit form data to Supabase
- `uploadImage(muebleId: number): Promise<string | null>` - Upload image to storage
- `resetForm()` - Clear all form data and return to step 1
- `handleCloseMessage()` - Dismiss notification message

**Integration Points:**
- Uses `useFormData` hook for form state
- Uses `useFilterOptions` hook for dropdown data
- Uses `useDirectorManagement` hook for director logic
- Uses `useTheme` context for dark/light mode
- Uses `useNotifications` hook for system notifications
- Calls Supabase client for data persistence

### 2. FormHeader Component

**Responsibility:** Display form title and visual progress indicators

**Props:**
```typescript
interface FormHeaderProps {
  currentStep: number;
  isDarkMode: boolean;
}
```

**Rendering:**
- Title: "Registro de Bienes" with icon
- Three circular progress dots (filled for completed/current steps)
- Responsive sizing for mobile/desktop

### 3. FormStepIndicator Component

**Responsibility:** Display step labels and allow navigation to completed steps

**Props:**
```typescript
interface FormStepIndicatorProps {
  currentStep: number;
  isStepComplete: (step: number) => boolean;
  onStepClick: (step: number) => void;
  isDarkMode: boolean;
}
```

**Rendering:**
- Three step buttons with labels:
  - Step 1: "Información Básica"
  - Step 2: "Ubicación y Estado"
  - Step 3: "Detalles Adicionales"
- Visual highlighting for active step
- Disabled state for incomplete prerequisite steps

### 4. FormNavigation Component

**Responsibility:** Provide navigation buttons between steps and form submission

**Props:**
```typescript
interface FormNavigationProps {
  currentStep: number;
  isStepComplete: (step: number) => boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: (e: FormEvent) => void;
  isDarkMode: boolean;
}
```

**Rendering:**
- "Previous" button (hidden on step 1)
- "Next" button (steps 1-2, disabled if current step incomplete)
- "Save" button (step 3, disabled if incomplete or submitting)
- Loading spinner during submission

### 5. Step1BasicInfo Component

**Responsibility:** Collect basic inventory information

**Props:**
```typescript
interface Step1Props {
  formData: FormData;
  filterOptions: FilterOptions;
  touched: Record<string, boolean>;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCurrencyChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isFieldValid: (fieldName: string) => boolean;
  isDarkMode: boolean;
}
```

**Fields:**
- `id_inv` (text, required) - Inventory ID
- `rubro` (select, required) - Category
- `valor` (currency, required) - Value
- `formadq` (select, required) - Acquisition method
- `f_adq` (date, required) - Acquisition date
- `proveedor` (text, optional) - Supplier
- `factura` (text, optional) - Invoice number

**Validation:**
- Required fields must be non-empty
- Currency field formatted on blur
- All text converted to uppercase

### 6. Step2LocationStatus Component

**Responsibility:** Collect location, status, and assignment information

**Props:**
```typescript
interface Step2Props {
  formData: FormData;
  filterOptions: FilterOptions;
  touched: Record<string, boolean>;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDirectorSelect: (nombre: string) => void;
  isFieldValid: (fieldName: string) => boolean;
  isDarkMode: boolean;
}
```

**Fields:**
- Location: `ubicacion_es`, `ubicacion_mu`, `ubicacion_no` (text, optional, max 2 chars)
- Status: `estado` (select, required), `estatus` (select, required)
- Assignment: `area` (text, required, read-only), `usufinal` (select, required), `resguardante` (text, optional)
- Conditional (when estatus === 'BAJA'): `fechabaja` (date), `causadebaja` (select)

**Special Behavior:**
- When `usufinal` changes, trigger director selection logic
- `area` field auto-populated based on selected director

### 7. Step3AdditionalDetails Component

**Responsibility:** Collect description and image

**Props:**
```typescript
interface Step3Props {
  formData: FormData;
  institucion: 'INEA' | 'ITEA';
  imagePreview: string | null;
  touched: Record<string, boolean>;
  onChange: (e: ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (e: FocusEvent<HTMLTextAreaElement>) => void;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  onInstitucionChange: (value: 'INEA' | 'ITEA') => void;
  isFieldValid: (fieldName: string) => boolean;
  isDarkMode: boolean;
}
```

**Fields:**
- `descripcion` (textarea, required) - Detailed description
- `institucion` (select) - INEA or ITEA
- Image upload (file input, optional) - JPG, PNG, GIF

**Features:**
- Drag-and-drop image upload
- Image preview with remove button
- File name display

### 8. DirectorInfoModal Component

**Responsibility:** Collect missing area information for a director

**Props:**
```typescript
interface DirectorInfoModalProps {
  isOpen: boolean;
  director: Directorio | null;
  areaValue: string;
  isSaving: boolean;
  onAreaChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}
```

**Rendering:**
- Modal overlay with centered dialog
- Display selected director name
- Input field for area
- Save button (disabled if area empty or saving)
- Cancel button

### 9. AreaSelectionModal Component

**Responsibility:** Allow selection from multiple areas assigned to a director

**Props:**
```typescript
interface AreaSelectionModalProps {
  isOpen: boolean;
  director: Directorio | null;
  areas: { id_area: number; nombre: string }[];
  onSelect: (areaName: string) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}
```

**Rendering:**
- Modal overlay with centered dialog
- Display selected director name
- List of clickable area buttons
- Close button

## Data Models

### FormData Interface

```typescript
interface FormData {
  id_inv: string;
  rubro: string;
  descripcion: string;
  valor: string;
  f_adq: string;
  formadq: string;
  proveedor: string;
  factura: string;
  ubicacion_es: string;
  ubicacion_mu: string;
  ubicacion_no: string;
  estado: string;
  estatus: string;
  area: string;
  usufinal: string;
  fechabaja: string;
  causadebaja: string;
  resguardante: string;
  image_path: string;
}
```

### FilterOptions Interface

```typescript
interface FilterOptions {
  estados: string[];
  estatus: string[];
  areas: string[];
  rubros: string[];
  formasAdquisicion: string[];
  causasBaja: string[];
  usuarios: { nombre: string; area: string }[];
}
```

### Directorio Interface

```typescript
interface Directorio {
  id_directorio: number;
  nombre: string;
  area: string | null;
  puesto: string | null;
}
```

### Message Interface

```typescript
interface Message {
  type: 'success' | 'error' | '';
  text: string;
}
```

## Custom Hooks

### useFormData Hook

**Purpose:** Manage form data state, validation, and transformations

**Returns:**
```typescript
interface UseFormDataReturn {
  formData: FormData;
  touched: Record<string, boolean>;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleCurrencyChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setFormData: Dispatch<SetStateAction<FormData>>;
  setTouched: Dispatch<SetStateAction<Record<string, boolean>>>;
  resetForm: (defaultEstado: string, defaultEstatus: string) => void;
  isFieldValid: (fieldName: string) => boolean;
  isStepComplete: (step: number) => boolean;
  formatCurrency: (value: string) => string;
}
```

**Implementation Details:**
- Maintains `formData` state with all form fields
- Maintains `touched` state to track user interaction
- `handleChange`: Updates field value, converts to uppercase for text inputs
- `handleCurrencyChange`: Strips non-numeric characters except decimal point
- `handleBlur`: Marks field as touched, formats currency if applicable
- `isFieldValid`: Checks if required field is non-empty (only for touched fields)
- `isStepComplete`: Validates all required fields for a given step
- `formatCurrency`: Formats number as Mexican Peso currency

### useFilterOptions Hook

**Purpose:** Load and manage dropdown options from Supabase

**Returns:**
```typescript
interface UseFilterOptionsReturn {
  filterOptions: FilterOptions;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

**Implementation Details:**
- Fetches estados from `muebles` and `mueblesitea` tables (unique values)
- Fetches estatus from `config` table (tipo='estatus') or falls back to table values
- Fetches rubros from `config` table (tipo='rubro') or falls back to table values
- Fetches formasAdquisicion from `config` table (tipo='formadq') or uses defaults
- Uses predefined causasBaja values
- Fetches usuarios from `directorio` table
- Runs on component mount
- Provides refetch function for manual refresh

### useDirectorManagement Hook

**Purpose:** Handle director selection, area assignment, and modal logic

**Parameters:**
```typescript
interface UseDirectorManagementParams {
  onAreaAssigned: (directorName: string, areaName: string) => void;
}
```

**Returns:**
```typescript
interface UseDirectorManagementReturn {
  directorio: Directorio[];
  areas: { id_area: number; nombre: string }[];
  directorAreasMap: { [id_directorio: number]: number[] };
  showDirectorModal: boolean;
  showAreaSelectModal: boolean;
  incompleteDirector: Directorio | null;
  directorFormData: { area: string };
  areaOptionsForDirector: { id_area: number; nombre: string }[];
  savingDirector: boolean;
  handleSelectDirector: (nombre: string) => void;
  saveDirectorInfo: () => Promise<void>;
  setShowDirectorModal: (show: boolean) => void;
  setShowAreaSelectModal: (show: boolean) => void;
  setDirectorFormData: Dispatch<SetStateAction<{ area: string }>>;
  refetchDirectorio: () => Promise<void>;
}
```

**Implementation Details:**
- Fetches `directorio` from Supabase on mount
- Fetches `areas` from `area` table on mount
- Fetches director-area relationships from `directorio_areas` table
- Builds `directorAreasMap` mapping director IDs to area IDs
- `handleSelectDirector`: 
  - Finds director by name
  - Gets assigned areas from map
  - If no areas: Opens DirectorInfoModal
  - If multiple areas: Opens AreaSelectionModal
  - If one area: Calls `onAreaAssigned` callback immediately
- `saveDirectorInfo`: Updates director record in Supabase, refreshes data, calls callback
- Provides modal visibility state and setters

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified the following areas where properties can be consolidated:

**Theme Integration**: Multiple requirements (3.4, 4.5, 5.6, 6.7, 7.10, 8.8, 9.8, 10.6, 16.2-16.5) all test theme-aware styling. These can be consolidated into comprehensive theme properties.

**Filter Options Loading**: Requirements 6.5, 6.6, 7.6-7.9, 12.1-12.4, 12.6 all test that dropdown options are loaded from FilterOptions. These can be consolidated into properties about data binding.

**Director Selection Logic**: Requirements 7.4, 7.5, 13.5-13.7 all test director selection behavior based on area count. These can be consolidated into a single comprehensive property.

**Form Validation**: Requirements 6.2, 11.7, 15.1 all test validation logic. These can be consolidated into properties about validation behavior.

**Data Transformation**: Requirements 6.3, 6.4, 8.7, 11.4, 11.5, 15.2, 15.3 all test input transformations. These can be consolidated into properties about data transformation.

### Core Properties

Property 1: Step Navigation Validation
*For any* form step and any form state, navigation to the next step should only be enabled when all required fields for the current step are complete and valid.
**Validates: Requirements 2.4, 4.4, 5.4**

Property 2: Form State Management
*For any* form field update, the form data state should reflect the new value immediately and trigger re-rendering of dependent components.
**Validates: Requirements 2.2, 11.2**

Property 3: Uppercase Text Transformation
*For any* text input field (excluding select dropdowns and date inputs), the entered value should be automatically converted to uppercase before being stored in form state.
**Validates: Requirements 6.4, 8.7, 11.4**

Property 4: Currency Formatting
*For any* numeric value entered in the valor field, the value should be formatted as Mexican Peso currency (with $ symbol, thousands separators, and two decimal places) when the field loses focus.
**Validates: Requirements 6.3, 11.5**

Property 5: Required Field Validation
*For any* required field that has been touched by the user, if the field value is empty or contains only whitespace, a validation error should be displayed.
**Validates: Requirements 6.2, 11.7**

Property 6: Director Selection with No Areas
*For any* director in the directorio who has zero areas assigned in the directorio_areas table, selecting that director should trigger the Director_Modal to open and should not populate the area field until the modal is saved.
**Validates: Requirements 7.4, 13.5**

Property 7: Director Selection with Multiple Areas
*For any* director in the directorio who has more than one area assigned in the directorio_areas table, selecting that director should trigger the Area_Selection_Modal to open with all assigned areas displayed as options.
**Validates: Requirements 7.5, 13.6**

Property 8: Director Selection with Single Area
*For any* director in the directorio who has exactly one area assigned in the directorio_areas table, selecting that director should immediately populate both the usufinal field with the director's name and the area field with the assigned area name, without opening any modal.
**Validates: Requirements 7.3, 13.7**

Property 9: Conditional BAJA Fields Display
*For any* form state where the estatus field value equals "BAJA", the Step2LocationStatus component should render the additional fields fechabaja and causadebaja; for any other estatus value, these fields should not be rendered.
**Validates: Requirements 7.2**

Property 10: Image Preview Generation
*For any* valid image file (JPG, PNG, or GIF) selected through the file input, the system should generate a data URL preview and store the file reference, making both available to the Step3AdditionalDetails component.
**Validates: Requirements 14.1, 14.2**

Property 11: Institution-Based Storage Bucket Selection
*For any* form submission with an image, if the institution is "INEA", the image should be uploaded to the "muebles.inea" bucket; if the institution is "ITEA", the image should be uploaded to the "muebles.itea" bucket.
**Validates: Requirements 14.4, 14.5**

Property 12: Image Path Formatting
*For any* mueble ID and image file extension, the uploaded image path should follow the format "{muebleId}/image.{extension}".
**Validates: Requirements 14.7**

Property 13: Institution-Based Table Selection
*For any* form submission, if the institution is "INEA", the record should be inserted into the "muebles" table; if the institution is "ITEA", the record should be inserted into the "mueblesitea" table.
**Validates: Requirements 15.4, 15.5**

Property 14: Submission Data Cleaning
*For any* form submission, the valor field should be cleaned to contain only numeric digits and decimal points (removing currency symbols and separators), and all text fields should be converted to uppercase before being sent to the database.
**Validates: Requirements 15.2, 15.3**

Property 15: Successful Submission Workflow
*For any* successful form submission, the system should: (1) display a success message, (2) create a success notification via the notification system, and (3) reset the form to its initial state.
**Validates: Requirements 15.7, 15.8, 15.11**

Property 16: Failed Submission Workflow
*For any* failed form submission (database error), the system should: (1) display an error message and (2) create an error notification via the notification system, without resetting the form.
**Validates: Requirements 15.9, 15.10**

Property 17: Theme-Aware Styling
*For any* component in the form, when the Theme_Context provides isDarkMode=true, dark mode CSS classes should be applied; when isDarkMode=false, light mode CSS classes should be applied.
**Validates: Requirements 3.4, 4.5, 5.6, 6.7, 7.10, 8.8, 9.8, 10.6, 16.2, 16.3, 16.4**

Property 18: Filter Options Data Binding
*For any* select dropdown that uses filter options (rubro, formadq, estado, estatus, causadebaja, usufinal), the rendered options should exactly match the corresponding array from the FilterOptions object provided by useFilterOptions hook.
**Validates: Requirements 6.5, 6.6, 7.6, 7.7, 7.8, 7.9**

Property 19: Modal State Management
*For any* modal (DirectorInfoModal or AreaSelectionModal), when the cancel/close button is clicked, the modal should close without making any API calls or updating form fields.
**Validates: Requirements 9.7, 10.5**

Property 20: Director Modal Save Workflow
*For any* director with missing area information, when the area is entered in the Director_Modal and save is clicked, the system should: (1) update the director record in Supabase, (2) close the modal, (3) populate the form's usufinal and area fields with the director name and entered area.
**Validates: Requirements 9.5, 9.6**

Property 21: Area Selection Modal Workflow
*For any* area clicked in the Area_Selection_Modal, the system should: (1) populate the form's area field with the selected area name, (2) close the modal automatically.
**Validates: Requirements 10.3, 10.4**

Property 22: Form Reset Behavior
*For any* form state, calling the reset function should restore all form fields to their initial values, clear the image preview, reset the current step to 1, and clear all touched field states.
**Validates: Requirements 11.3**

Property 23: Step Completion Validation
*For any* form step (1, 2, or 3), the step should be considered complete if and only if all required fields for that step contain non-empty, non-whitespace values.
**Validates: Requirements 11.7**

Property 24: Responsive Grid Layout
*For any* screen size, form fields should be arranged in a grid that adapts: single column on small screens (< 640px), 2 columns on medium screens (640px-1024px), and 3 columns on large screens (≥ 1024px).
**Validates: Requirements 17.1, 17.4, 17.5**


## Error Handling

### Database Errors

**Scenario:** Supabase query or insert fails
**Handling:**
- Catch error in try-catch block
- Log error to console for debugging
- Display user-friendly error message via message state
- Create error notification via notification system
- Keep form data intact (don't reset) so user can retry
- Set isSubmitting to false to re-enable submit button

**Example:**
```typescript
try {
  const { data, error } = await supabase.from(tableName).insert([dataToSave]);
  if (error) throw error;
  // Success handling...
} catch (error) {
  console.error('Error al guardar:', error);
  setMessage({ type: 'error', text: 'Error al guardar el registro. Intente nuevamente.' });
  await createNotification({
    title: 'Error al registrar bien',
    description: 'Ocurrió un error al guardar el registro de un bien.',
    type: 'danger',
    category: 'inventario',
    device: 'web',
    importance: 'high'
  });
} finally {
  setIsSubmitting(false);
}
```

### Image Upload Errors

**Scenario:** Image upload to Supabase storage fails
**Handling:**
- Catch error in uploadImage function
- Log error to console
- Return null from uploadImage function
- Continue with form submission (image is optional)
- Don't update image_path field in database

**Example:**
```typescript
const uploadImage = async (muebleId: number): Promise<string | null> => {
  if (!imageFileRef.current) return null;
  try {
    const { error } = await supabase.storage.from(bucketName).upload(fileName, imageFileRef.current);
    if (error) throw error;
    return fileName;
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    return null;
  }
};
```

### Validation Errors

**Scenario:** User attempts to navigate or submit with incomplete required fields
**Handling:**
- Disable navigation/submit buttons when validation fails
- Display inline validation errors for touched fields
- Prevent form submission at the form level (required attributes)
- Provide clear visual feedback (red borders, error messages)

**Example:**
```typescript
const isStepComplete = (step: number): boolean => {
  return requiredFields[step].every(field => 
    formData[field]?.trim() !== ''
  );
};

// In render:
<button disabled={!isStepComplete(currentStep)}>Next</button>
```

### Director Data Inconsistency

**Scenario:** Director selected has no area assigned
**Handling:**
- Open DirectorInfoModal to collect missing information
- Prevent form progression until area is provided
- Update director record in database when saved
- Refresh local director data after update

**Scenario:** Director selected has multiple areas
**Handling:**
- Open AreaSelectionModal to disambiguate
- Display all assigned areas as options
- Populate form with selected area
- Allow user to cancel and select different director

### Network Errors

**Scenario:** Network connection lost during data fetch or submission
**Handling:**
- Supabase client will throw error
- Caught by try-catch blocks
- Display generic error message to user
- Provide retry mechanism (user can resubmit)
- Consider implementing retry logic with exponential backoff for critical operations

### File Type Validation

**Scenario:** User attempts to upload non-image file
**Handling:**
- File input accept attribute restricts to "image/*"
- Browser will filter file picker to show only images
- Additional validation can check file extension if needed
- Display error message if invalid file somehow selected

## Testing Strategy

### Dual Testing Approach

This project will use both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests:** Focus on specific examples, edge cases, and integration points
- Test specific component rendering scenarios
- Test error conditions and edge cases
- Test integration between components
- Test mocked API interactions

**Property-Based Tests:** Verify universal properties across all inputs
- Test form validation logic with random inputs
- Test data transformations with various input formats
- Test state management with random action sequences
- Test conditional rendering with random state combinations

### Testing Framework

**Framework:** Jest + React Testing Library
**Property-Based Testing Library:** fast-check (for TypeScript/JavaScript)
**Mocking:** Mock Supabase client, Theme context, Notifications hook

### Property Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with: `Feature: componentize-inventory-form, Property {number}: {property_text}`
- Use fast-check generators for:
  - Random form data
  - Random director configurations
  - Random filter options
  - Random theme states

### Unit Test Coverage

**Components to Unit Test:**
1. **RegistroBienesForm**
   - Renders without crashing
   - Handles form submission success
   - Handles form submission failure
   - Manages step navigation
   - Integrates with all sub-components

2. **FormHeader**
   - Renders title correctly
   - Displays correct number of progress indicators
   - Highlights active step indicator

3. **FormStepIndicator**
   - Renders all step labels
   - Allows navigation to completed steps
   - Prevents navigation to incomplete steps
   - Highlights active step

4. **FormNavigation**
   - Shows correct buttons for each step
   - Disables buttons when validation fails
   - Shows loading state during submission

5. **Step1BasicInfo**
   - Renders all required fields
   - Displays validation errors
   - Formats currency on blur
   - Converts text to uppercase

6. **Step2LocationStatus**
   - Renders all required fields
   - Shows BAJA fields conditionally
   - Triggers director selection logic
   - Populates area from director

7. **Step3AdditionalDetails**
   - Renders description textarea
   - Renders institution selector
   - Handles image upload
   - Displays image preview
   - Removes image on button click

8. **DirectorInfoModal**
   - Opens when triggered
   - Displays director name
   - Disables save when area empty
   - Calls save function with correct data
   - Closes on cancel without saving

9. **AreaSelectionModal**
   - Opens when triggered
   - Displays all director areas
   - Calls select function with chosen area
   - Closes on area selection
   - Closes on cancel without selecting

**Hooks to Unit Test:**
1. **useFormData**
   - Returns initial form data
   - Updates field on change
   - Marks field as touched on blur
   - Resets to initial state
   - Validates required fields correctly

2. **useFilterOptions**
   - Fetches data on mount
   - Returns loading state during fetch
   - Returns error state on failure
   - Returns filter options on success
   - Provides refetch function

3. **useDirectorManagement**
   - Fetches director data on mount
   - Handles director with no areas
   - Handles director with multiple areas
   - Handles director with single area
   - Saves director info correctly

### Property Test Coverage

Each correctness property (1-24) should have a corresponding property-based test:

**Example Property Test:**
```typescript
// Feature: componentize-inventory-form, Property 3: Uppercase Text Transformation
describe('Property 3: Uppercase Text Transformation', () => {
  it('should convert any text input to uppercase', () => {
    fc.assert(
      fc.property(
        fc.string(), // Random string input
        (inputText) => {
          const { result } = renderHook(() => useFormData());
          act(() => {
            result.current.handleChange({
              target: { name: 'descripcion', value: inputText }
            } as any);
          });
          expect(result.current.formData.descripcion).toBe(inputText.toUpperCase());
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Key Integration Points:**
1. Form submission flow (form → Supabase → notifications)
2. Director selection flow (form → hook → modal → form)
3. Image upload flow (form → file → storage → database)
4. Theme integration (context → all components)
5. Filter options flow (hook → database → components)

### Manual Testing Checklist

- [ ] Complete form submission with all fields
- [ ] Complete form submission with only required fields
- [ ] Navigate between steps using step indicator
- [ ] Navigate between steps using navigation buttons
- [ ] Select director with no area (modal opens)
- [ ] Select director with multiple areas (modal opens)
- [ ] Select director with single area (auto-populates)
- [ ] Upload image and verify preview
- [ ] Remove uploaded image
- [ ] Submit form with image
- [ ] Submit form without image
- [ ] Toggle between INEA and ITEA institutions
- [ ] Set estatus to BAJA and verify additional fields
- [ ] Toggle between dark and light themes
- [ ] Test on mobile device (responsive layout)
- [ ] Test on tablet device
- [ ] Test on desktop device
- [ ] Verify form reset after successful submission
- [ ] Verify form persists after failed submission
- [ ] Test with network disconnected (error handling)

### Performance Testing

**Metrics to Monitor:**
- Initial render time
- Step navigation response time
- Form submission time
- Image upload time
- Theme toggle response time

**Targets:**
- Initial render: < 100ms
- Step navigation: < 50ms
- Form submission (without image): < 500ms
- Image upload: < 2s for 5MB image
- Theme toggle: < 50ms

### Accessibility Testing

**Requirements:**
- All form inputs have associated labels
- All buttons have descriptive text or aria-labels
- Keyboard navigation works for all interactive elements
- Focus indicators visible for all focusable elements
- Error messages associated with form fields via aria-describedby
- Modals trap focus and return focus on close
- Color contrast meets WCAG AA standards for both themes

# Requirements Document

## Introduction

This specification defines the requirements for migrating the "No Listado" (Non-Listed Inventory) component from using plain text fields (`area`, `usufinal`) to relational fields with foreign keys (`id_area`, `id_directorio`) in the `mueblestlaxcala` table. The migration ensures data integrity, implements N:M relationship validation between directors and areas, and maintains backward compatibility during the transition.

## Glossary

- **No_Listado_Component**: The React component at `src/components/consultas/no-listado/general.tsx` that displays and manages non-listed inventory items
- **Mueblestlaxcala_Table**: The database table storing furniture/asset inventory records
- **Area_Table**: The database table storing area/department names with unique IDs
- **Directorio_Table**: The database table storing director/manager information with unique IDs
- **Directorio_Areas_Table**: The junction table implementing the N:M relationship between directors and areas
- **Foreign_Key**: A database constraint that ensures referential integrity between tables
- **N:M_Relationship**: A many-to-many relationship where one director can have multiple areas and one area can have multiple directors
- **Relational_Field**: A database field that stores an ID reference to another table instead of plain text
- **Legacy_Field**: The old text-based fields (`area`, `usufinal`) that are being replaced
- **Director_Area_Validation**: The process of verifying that an assigned area belongs to the selected director's authorized areas

## Requirements

### Requirement 1: Data Fetching with Relational Structure

**User Story:** As a developer, I want to fetch muebles data with proper JOINs to relational tables, so that area and director information is retrieved efficiently and consistently.

#### Acceptance Criteria

1. WHEN fetching muebles from the database, THE System SHALL use JOINs to include nested `area` and `directorio` objects
2. WHEN a mueble has an `id_area`, THE System SHALL return the area object with `id_area` and `nombre` fields
3. WHEN a mueble has an `id_directorio`, THE System SHALL return the directorio object with `id_directorio`, `nombre`, and `puesto` fields
4. WHEN a mueble has NULL `id_area` or `id_directorio`, THE System SHALL handle these gracefully without errors
5. THE System SHALL load all areas from the `area` table for selection dropdowns
6. THE System SHALL load all directors from the `directorio` table for selection dropdowns
7. THE System SHALL load director-area relationships from the `directorio_areas` table to build the N:M mapping

### Requirement 2: Director Selection with Area Validation

**User Story:** As a user editing inventory, I want the system to automatically handle area assignment when I select a director, so that I don't assign invalid area-director combinations.

#### Acceptance Criteria

1. WHEN a user selects a director with NO assigned areas, THE System SHALL display a modal prompting to add area information
2. WHEN a user selects a director with EXACTLY ONE assigned area, THE System SHALL automatically assign that area to the item
3. WHEN a user selects a director with MULTIPLE assigned areas, THE System SHALL display a modal to select which specific area to assign
4. WHEN a director is selected, THE System SHALL update both `id_directorio` and `id_area` fields in the form data
5. WHEN a director is selected, THE System SHALL update the nested `directorio` and `area` objects in the form data
6. THE System SHALL prevent saving if `id_directorio` is set but `id_area` is NULL or invalid for that director

### Requirement 3: Area-Director Relationship Validation

**User Story:** As a system administrator, I want to ensure that only valid area-director combinations are saved, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN saving a mueble with both `id_area` and `id_directorio`, THE System SHALL validate that the area exists in the director's assigned areas
2. WHEN validation fails, THE System SHALL display an error message and prevent saving
3. WHEN validation succeeds, THE System SHALL proceed with the save operation
4. THE System SHALL use the `directorio_areas` table to perform validation checks
5. IF either `id_area` or `id_directorio` is NULL, THE System SHALL skip validation and allow the save

### Requirement 4: Edit Form Updates

**User Story:** As a user editing inventory items, I want to use dropdown selects for area and director instead of text inputs, so that I can only select valid values.

#### Acceptance Criteria

1. THE Edit_Form SHALL display a select dropdown for `id_directorio` populated with all directors from the `directorio` table
2. THE Edit_Form SHALL display a read-only text input for area that auto-populates based on director selection
3. WHEN a director is selected in edit mode, THE System SHALL trigger the director selection logic (Requirement 2)
4. THE Edit_Form SHALL display the current director name if `id_directorio` is set
5. THE Edit_Form SHALL display the current area name if `id_area` is set
6. THE Edit_Form SHALL handle NULL values for `id_area` and `id_directorio` gracefully

### Requirement 5: Display with Relational Data

**User Story:** As a user viewing inventory, I want to see area and director names from the relational tables, so that I always see current, accurate information.

#### Acceptance Criteria

1. WHEN displaying a mueble in the table, THE System SHALL show the area name from the joined `area` table
2. WHEN displaying a mueble in the table, THE System SHALL show the director name from the joined `directorio` table
3. WHEN displaying a mueble in the detail panel, THE System SHALL show the area name from the nested `area` object
4. WHEN displaying a mueble in the detail panel, THE System SHALL show the director name from the nested `directorio` object
5. WHEN `id_area` is NULL, THE System SHALL display "No Data" or equivalent placeholder
6. WHEN `id_directorio` is NULL, THE System SHALL display "No Data" or equivalent placeholder

### Requirement 6: Sorting and Filtering with Relational Fields

**User Story:** As a user browsing inventory, I want to sort and filter by area and director, so that I can find items efficiently.

#### Acceptance Criteria

1. WHEN sorting by area, THE System SHALL sort using the `area.nombre` field from the nested object
2. WHEN sorting by director, THE System SHALL sort using the `directorio.nombre` field from the nested object
3. WHEN filtering by area in the omnibox, THE System SHALL match against `area.nombre` from the nested object
4. WHEN filtering by director in the omnibox, THE System SHALL match against `directorio.nombre` from the nested object
5. THE System SHALL handle NULL values in sorting by treating them as empty strings

### Requirement 7: Director Information Modal

**User Story:** As a user, when I select a director without area information, I want to be prompted to add it, so that the director's profile is complete.

#### Acceptance Criteria

1. WHEN a director with no assigned areas is selected, THE System SHALL display the Director Information Modal
2. THE Director_Information_Modal SHALL display the director's name and current information
3. THE Director_Information_Modal SHALL provide an input field to add area information
4. WHEN the user saves director information, THE System SHALL update the `directorio` table with the new area
5. WHEN the user saves director information, THE System SHALL create a relationship in `directorio_areas` table
6. WHEN the user cancels the modal, THE System SHALL keep the director selection but leave area empty
7. AFTER saving director information, THE System SHALL automatically assign the area to the current item

### Requirement 8: Area Selection Modal

**User Story:** As a user, when I select a director with multiple areas, I want to choose which specific area to assign, so that the item is correctly categorized.

#### Acceptance Criteria

1. WHEN a director with multiple assigned areas is selected, THE System SHALL display the Area Selection Modal
2. THE Area_Selection_Modal SHALL display a list of all areas assigned to the selected director
3. THE Area_Selection_Modal SHALL allow the user to select exactly one area
4. WHEN the user confirms area selection, THE System SHALL update both `id_area` and `id_directorio` in the form
5. WHEN the user cancels the modal, THE System SHALL keep the director selection but leave area empty
6. THE Area_Selection_Modal SHALL display area names from the `area` table

### Requirement 9: Legacy Field Removal

**User Story:** As a developer, I want to remove all references to legacy text fields, so that the codebase only uses the new relational structure.

#### Acceptance Criteria

1. THE System SHALL NOT reference the `area` text field from `mueblestlaxcala` table
2. THE System SHALL NOT reference the `usufinal` text field from `mueblestlaxcala` table
3. THE System SHALL use `id_area` and `id_directorio` for all database operations
4. THE System SHALL use nested `area` and `directorio` objects for all display operations
5. THE TypeScript interfaces SHALL reflect the new relational structure with nested objects

### Requirement 10: Save Operations with Relational Fields

**User Story:** As a user saving inventory changes, I want the system to save relational IDs instead of text, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN saving a mueble, THE System SHALL save `id_area` as an integer foreign key
2. WHEN saving a mueble, THE System SHALL save `id_directorio` as an integer foreign key
3. WHEN saving a mueble, THE System SHALL NOT save `area` or `usufinal` text fields
4. WHEN saving fails due to foreign key constraint, THE System SHALL display a user-friendly error message
5. AFTER a successful save, THE System SHALL refetch the mueble with JOINs to update the display

### Requirement 11: Type Safety and Interfaces

**User Story:** As a developer, I want TypeScript interfaces to accurately reflect the relational structure, so that type checking catches errors at compile time.

#### Acceptance Criteria

1. THE `Mueble` interface SHALL include `id_area: number | null` field
2. THE `Mueble` interface SHALL include `id_directorio: number | null` field
3. THE `Mueble` interface SHALL include `area: { id_area: number; nombre: string } | null` nested object
4. THE `Mueble` interface SHALL include `directorio: { id_directorio: number; nombre: string; puesto: string } | null` nested object
5. THE `Mueble` interface SHALL NOT include `area: string` or `usufinal: string` fields
6. THE `Area` interface SHALL define `id_area: number` and `nombre: string` fields
7. THE `Directorio` interface SHALL define `id_directorio: number`, `nombre: string`, and `puesto: string` fields

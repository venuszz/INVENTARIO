# Requirements Document: Asset Transfer Feature

## Introduction

The Asset Transfer feature (Transferencia de Bienes) enables administrators to transfer areas and their associated assets from one director to another through an interactive panel interface. This feature addresses the operational need to reassign responsibility for assets when organizational changes occur, while maintaining data integrity and preventing transfers that would violate custody constraints.

The system manages assets across three separate tables (INEA, ITEA, and No Listado sources) and must ensure that all related records are updated atomically. The feature integrates with the existing directorio management system and follows similar UX patterns to the inconsistency resolver.

## Glossary

- **Transfer_System**: The Asset Transfer feature component that manages the transfer workflow
- **Source_Director**: The director currently responsible for the area and assets being transferred
- **Target_Director**: The director who will receive responsibility for the area and assets
- **Area**: A logical grouping of assets assigned to a director through the directorio_areas relationship
- **Bien**: An individual asset record stored in one of three tables (muebles, mueblesitea, mueblestlaxcala)
- **Resguardo**: A custody record that links a bien to a director, indicating active responsibility
- **Complete_Area_Transfer**: Transfer operation that moves an entire area with all its bienes to the target director
- **Partial_Bienes_Transfer**: Transfer operation that moves selected bienes from a source area to an existing target director area
- **Transfer_Preview**: Real-time display showing what will be transferred before confirmation
- **Directorio_Areas_Relationship**: Many-to-many relationship table linking directors to areas
- **Admin_User**: User with admin or superadmin role authorized to perform transfers
- **Transfer_Mode**: UI state where the directorio page transforms into the transfer interface
- **Inconsistency_Resolver**: Existing feature that resolves data inconsistencies, used as UX reference

## Requirements

### Requirement 1: Transfer Mode Activation

**User Story:** As an admin user, I want to activate transfer mode from the directorio page, so that I can initiate asset transfer operations.

#### Acceptance Criteria

1. THE Transfer_System SHALL display a transfer activation button in the directorio page header
2. WHEN an admin user clicks the transfer activation button, THE Transfer_System SHALL transform the page into Transfer_Mode
3. THE Transfer_System SHALL restrict transfer mode activation to users with admin or superadmin roles
4. WHEN Transfer_Mode is activated, THE Transfer_System SHALL display a two-panel interface for source and preview
5. WHEN Transfer_Mode is exited, THE Transfer_System SHALL restore the standard directorio page view

### Requirement 2: Source Selection Interface

**User Story:** As an admin user, I want to select a source director and their areas, so that I can specify what to transfer.

#### Acceptance Criteria

1. WHEN Transfer_Mode is active, THE Transfer_System SHALL display a left panel for source selection
2. THE Transfer_System SHALL display a list of all directors in the source selection panel
3. WHEN a Source_Director is selected, THE Transfer_System SHALL display all areas assigned to that director
4. THE Transfer_System SHALL allow selection of one or more complete areas for transfer
5. WHEN an area has active resguardos, THE Transfer_System SHALL display a visual warning indicator on that area
6. THE Transfer_System SHALL allow selection of partial bienes from a single area
7. THE Transfer_System SHALL prevent selection of partial bienes from multiple areas simultaneously

### Requirement 3: Resguardo Validation

**User Story:** As an admin user, I want the system to prevent transfers when active resguardos exist, so that custody integrity is maintained.

#### Acceptance Criteria

1. WHEN an area is selected for transfer, THE Transfer_System SHALL check for active resguardos in that area
2. IF active resguardos exist in the selected area, THEN THE Transfer_System SHALL block the transfer operation
3. WHEN active resguardos block a transfer, THE Transfer_System SHALL display a clear error message indicating the resguardo count
4. THE Transfer_System SHALL display the number of active resguardos for each area in the source selection panel
5. WHEN all resguardos are resolved, THE Transfer_System SHALL automatically enable the transfer operation

### Requirement 4: Target Director Selection

**User Story:** As an admin user, I want to select a target director for the transfer, so that I can specify who will receive the assets.

#### Acceptance Criteria

1. THE Transfer_System SHALL display a target director selection control
2. THE Transfer_System SHALL list all directors except the Source_Director as target options
3. WHEN a Target_Director is selected, THE Transfer_System SHALL update the Transfer_Preview in real-time
4. WHEN performing Complete_Area_Transfer, THE Transfer_System SHALL verify the Target_Director does not already have the area assigned
5. IF the Target_Director already has the area assigned, THEN THE Transfer_System SHALL display an error message directing the user to the Inconsistency_Resolver

### Requirement 5: Transfer Preview Display

**User Story:** As an admin user, I want to see a real-time preview of what will be transferred, so that I can verify the operation before confirming.

#### Acceptance Criteria

1. WHEN a source and target are selected, THE Transfer_System SHALL display a Transfer_Preview in the right panel
2. THE Transfer_Preview SHALL display the complete list of bienes being transferred
3. THE Transfer_Preview SHALL display the total count of bienes to be transferred
4. THE Transfer_Preview SHALL display the total monetary value of bienes to be transferred
5. THE Transfer_Preview SHALL display the count of resguardos affected
6. THE Transfer_Preview SHALL display Source_Director details including name and current area assignment
7. THE Transfer_Preview SHALL display Target_Director details including name and existing areas
8. WHEN selection changes, THE Transfer_System SHALL update the Transfer_Preview within 500 milliseconds

### Requirement 6: Target Area Selection for Partial Transfer

**User Story:** As an admin user, I want to select which target area will receive partial bienes, so that I can organize assets appropriately.

#### Acceptance Criteria

1. WHEN performing Partial_Bienes_Transfer, THE Transfer_System SHALL display existing areas of the Target_Director
2. THE Transfer_System SHALL require selection of one target area before allowing transfer confirmation
3. THE Transfer_System SHALL display area names and bien counts for each target area option
4. WHEN a target area is selected, THE Transfer_Preview SHALL update to show the target area details

### Requirement 7: Transfer Confirmation Flow

**User Story:** As an admin user, I want to review and confirm transfer details before execution, so that I can prevent accidental transfers.

#### Acceptance Criteria

1. WHEN all required selections are complete, THE Transfer_System SHALL enable a confirmation button
2. WHEN the confirmation button is clicked, THE Transfer_System SHALL display a final confirmation modal
3. THE confirmation modal SHALL display all Transfer_Preview information
4. THE confirmation modal SHALL require explicit user confirmation before proceeding
5. WHEN the user confirms, THE Transfer_System SHALL execute the transfer operation
6. WHEN the user cancels, THE Transfer_System SHALL return to the preview state without changes

### Requirement 8: Complete Area Transfer Execution

**User Story:** As an admin user, I want the system to transfer complete areas atomically, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN executing Complete_Area_Transfer, THE Transfer_System SHALL delete the directorio_areas relationship for the Source_Director
2. THE Transfer_System SHALL create a new directorio_areas relationship for the Target_Director
3. THE Transfer_System SHALL update the id_directorio field for all bienes in the muebles table
4. THE Transfer_System SHALL update the id_directorio field for all bienes in the mueblesitea table
5. THE Transfer_System SHALL update the id_directorio field for all bienes in the mueblestlaxcala table
6. THE Transfer_System SHALL update the id_area field for all bienes in all three tables
7. IF any database operation fails, THEN THE Transfer_System SHALL rollback all changes
8. WHEN the transfer completes successfully, THE Transfer_System SHALL invalidate relevant cache entries

### Requirement 9: Partial Bienes Transfer Execution

**User Story:** As an admin user, I want the system to transfer selected bienes to an existing target area, so that I can reorganize assets without moving entire areas.

#### Acceptance Criteria

1. WHEN executing Partial_Bienes_Transfer, THE Transfer_System SHALL update the id_directorio field for selected bienes only
2. THE Transfer_System SHALL update the id_area field to match the selected target area
3. THE Transfer_System SHALL maintain the directorio_areas relationship for the Source_Director
4. THE Transfer_System SHALL update bienes across all three tables based on their source
5. IF any database operation fails, THEN THE Transfer_System SHALL rollback all changes
6. WHEN the transfer completes successfully, THE Transfer_System SHALL invalidate relevant cache entries

### Requirement 10: Transfer Operation Feedback

**User Story:** As an admin user, I want to receive clear feedback during transfer operations, so that I understand the operation status.

#### Acceptance Criteria

1. WHEN a transfer operation starts, THE Transfer_System SHALL display a processing indicator
2. THE Transfer_System SHALL disable all interactive controls during processing
3. WHEN the transfer completes successfully, THE Transfer_System SHALL display a success message with transfer summary
4. IF the transfer fails, THEN THE Transfer_System SHALL display an error message with failure details
5. WHEN the operation completes, THE Transfer_System SHALL automatically exit Transfer_Mode after 3 seconds
6. THE Transfer_System SHALL log all transfer operations with timestamp, user, source, target, and bien count

### Requirement 11: Store Integration and Cache Management

**User Story:** As a developer, I want the transfer system to integrate with existing stores, so that the UI reflects updated data immediately.

#### Acceptance Criteria

1. WHEN a transfer completes, THE Transfer_System SHALL trigger reindexation of the INEA store
2. WHEN a transfer completes, THE Transfer_System SHALL trigger reindexation of the ITEA store
3. WHEN a transfer completes, THE Transfer_System SHALL trigger reindexation of the No Listado store
4. WHEN a transfer completes, THE Transfer_System SHALL trigger refresh of directorio statistics
5. THE Transfer_System SHALL use the useAdminIndexation hook for cache invalidation
6. THE Transfer_System SHALL use the useDirectorioStats hook for statistics updates

### Requirement 12: API Endpoint Security

**User Story:** As a system administrator, I want transfer operations to be secure and auditable, so that unauthorized transfers are prevented.

#### Acceptance Criteria

1. THE Transfer_System SHALL use the service role key to bypass Row Level Security for transfer operations
2. THE Transfer_System SHALL validate user authorization before executing any transfer
3. THE Transfer_System SHALL reject transfer requests from users without admin or superadmin roles
4. THE Transfer_System SHALL log all transfer attempts including user identity and timestamp
5. THE Transfer_System SHALL validate all input parameters before executing database operations

### Requirement 13: UI Animation and Transitions

**User Story:** As an admin user, I want smooth visual transitions during transfer operations, so that the interface feels responsive and professional.

#### Acceptance Criteria

1. WHEN Transfer_Mode is activated, THE Transfer_System SHALL animate the panel transition using Framer Motion
2. WHEN the Transfer_Preview updates, THE Transfer_System SHALL animate content changes
3. THE Transfer_System SHALL use consistent animation timing with the Inconsistency_Resolver
4. THE Transfer_System SHALL support dark mode theming using the useTheme hook
5. WHEN processing operations, THE Transfer_System SHALL display animated loading indicators

### Requirement 14: Transfer Validation Rules

**User Story:** As an admin user, I want the system to validate transfer operations, so that invalid transfers are prevented.

#### Acceptance Criteria

1. THE Transfer_System SHALL prevent transfer when the Source_Director equals the Target_Director
2. THE Transfer_System SHALL prevent transfer when no bienes are selected
3. THE Transfer_System SHALL prevent transfer when active resguardos exist in selected areas
4. WHEN performing Complete_Area_Transfer, THE Transfer_System SHALL prevent transfer if the Target_Director already has the area
5. WHEN performing Partial_Bienes_Transfer, THE Transfer_System SHALL prevent transfer if no target area is selected
6. WHEN validation fails, THE Transfer_System SHALL display specific error messages for each validation rule

### Requirement 15: Transfer Operation Limits

**User Story:** As an admin user, I want to transfer any number of bienes in a single operation, so that large transfers are supported.

#### Acceptance Criteria

1. THE Transfer_System SHALL support transfer operations with unlimited bien count
2. WHEN transferring more than 100 bienes, THE Transfer_System SHALL display a progress indicator
3. THE Transfer_System SHALL process transfers in batches of 50 bienes for performance
4. WHEN batch processing, THE Transfer_System SHALL update progress after each batch
5. THE Transfer_System SHALL complete all batches before displaying success confirmation

### Requirement 16: Error Recovery and Rollback

**User Story:** As an admin user, I want failed transfers to rollback completely, so that partial transfers do not corrupt data.

#### Acceptance Criteria

1. WHEN any database operation fails during transfer, THE Transfer_System SHALL rollback all changes
2. THE Transfer_System SHALL use database transactions to ensure atomicity
3. IF rollback fails, THEN THE Transfer_System SHALL log the error and display a critical error message
4. WHEN a transfer is rolled back, THE Transfer_System SHALL restore the UI to the pre-transfer state
5. THE Transfer_System SHALL log all rollback operations with failure details

### Requirement 17: Integration with Existing Components

**User Story:** As a developer, I want the transfer system to reuse existing components, so that development is efficient and UI is consistent.

#### Acceptance Criteria

1. THE Transfer_System SHALL use the same modal patterns as the Inconsistency_Resolver
2. THE Transfer_System SHALL use existing director and area selection components where applicable
3. THE Transfer_System SHALL follow the same state machine pattern as the Inconsistency_Resolver
4. THE Transfer_System SHALL use consistent styling with the directorio management page
5. THE Transfer_System SHALL integrate with the existing notification system for operation feedback

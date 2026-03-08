# Requirements Document

## Introduction

This document specifies the requirements for implementing batch origen transfer functionality in the Levantamiento Unificado module. Currently, users can only transfer the origen (source institution) of inventory items individually by clicking on origen badges. This feature enables users to transfer multiple items simultaneously, improving efficiency when managing large sets of inventory items that need to be reassigned between institutions (INEA, ITEA, TLAXCALA).

## Glossary

- **Levantamiento_Module**: The unified inventory consultation module that displays items from all institutions
- **Origen**: The source institution that owns an inventory item (INEA, ITEA, or TLAXCALA)
- **Transfer_Mode**: A special UI state where users can select multiple items for batch origen transfer
- **Batch_Transfer**: The operation of changing the origen of multiple inventory items simultaneously
- **Resguardo**: An active custody assignment of an inventory item to a person
- **Estatus_Baja**: The status value "BAJA" indicating an item has been decommissioned
- **Filter_Context**: The set of active filters applied to the inventory table
- **Selection_Set**: The collection of inventory items selected for batch transfer
- **Transfer_Button**: The UI button that initiates or cancels Transfer_Mode
- **Confirmation_Modal**: The dialog that displays transfer details and requires user confirmation
- **Progress_Modal**: The dialog that displays real-time transfer progress
- **Audit_Record**: An entry in the cambios_inventario table documenting a transfer operation
- **Blocked_Item**: An inventory item that cannot be transferred due to validation rules

## Requirements

### Requirement 1: Transfer Mode Activation

**User Story:** As an inventory manager, I want to enter a batch transfer mode when origen filters are active, so that I can efficiently transfer multiple items at once.

#### Acceptance Criteria

1. WHEN at least one origen filter is active in Filter_Context, THE Levantamiento_Module SHALL display Transfer_Button next to the export buttons
2. WHEN no origen filters are active in Filter_Context, THE Levantamiento_Module SHALL hide Transfer_Button
3. WHEN Transfer_Button is clicked while not in Transfer_Mode, THE Levantamiento_Module SHALL enter Transfer_Mode
4. WHEN Transfer_Mode is entered, THE Levantamiento_Module SHALL display a checkbox column as the leftmost column in the inventory table
5. WHEN Transfer_Mode is entered, THE Levantamiento_Module SHALL change Transfer_Button label to "Cancelar Transferencia"
6. WHEN Transfer_Mode is entered, THE Levantamiento_Module SHALL disable individual origen badge click handlers

### Requirement 2: Item Selection Interface

**User Story:** As an inventory manager, I want to select multiple items using checkboxes, so that I can choose which items to transfer.

#### Acceptance Criteria

1. WHILE in Transfer_Mode, THE Levantamiento_Module SHALL display a checkbox for each inventory item row
2. WHILE in Transfer_Mode, THE Levantamiento_Module SHALL display a header checkbox for selecting all filtered items
3. WHEN a user clicks an item checkbox, THE Levantamiento_Module SHALL toggle that item's selection state in Selection_Set
4. WHEN a user clicks the header checkbox while no items are selected, THE Levantamiento_Module SHALL add all filtered items to Selection_Set
5. WHEN a user clicks the header checkbox while all items are selected, THE Levantamiento_Module SHALL remove all items from Selection_Set
6. WHEN Selection_Set contains at least one item, THE Levantamiento_Module SHALL display a floating action button showing "Confirmar Transferencia (X)" where X is the count of selected items
7. WHEN Selection_Set is empty, THE Levantamiento_Module SHALL hide the floating action button

### Requirement 3: Transfer Mode Cancellation

**User Story:** As an inventory manager, I want to exit transfer mode without performing a transfer, so that I can return to normal viewing mode.

#### Acceptance Criteria

1. WHEN Transfer_Button is clicked while in Transfer_Mode, THE Levantamiento_Module SHALL exit Transfer_Mode
2. WHEN Transfer_Mode is exited, THE Levantamiento_Module SHALL remove the checkbox column from the inventory table
3. WHEN Transfer_Mode is exited, THE Levantamiento_Module SHALL clear Selection_Set
4. WHEN Transfer_Mode is exited, THE Levantamiento_Module SHALL restore Transfer_Button label to "Transferir Origen"
5. WHEN Transfer_Mode is exited, THE Levantamiento_Module SHALL re-enable individual origen badge click handlers
6. WHEN Transfer_Mode is exited, THE Levantamiento_Module SHALL hide the floating action button

### Requirement 4: Transfer Validation Rules

**User Story:** As a system administrator, I want the system to enforce business rules during batch transfers, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN validating an item for transfer, IF the item has an active resguardo, THEN THE Levantamiento_Module SHALL mark the item as Blocked_Item with reason "resguardo_activo"
2. WHEN validating an item for transfer, IF the item has Estatus_Baja, THEN THE Levantamiento_Module SHALL mark the item as Blocked_Item with reason "estatus_baja"
3. WHEN validating Selection_Set, THE Levantamiento_Module SHALL allow items with different current origen values to be selected together
4. WHEN validating Selection_Set, THE Levantamiento_Module SHALL identify all Blocked_Item instances in the selection
5. THE Levantamiento_Module SHALL validate all items in Selection_Set before displaying Confirmation_Modal

### Requirement 5: Transfer Confirmation Interface

**User Story:** As an inventory manager, I want to review all transfer details before confirming, so that I can verify the operation is correct.

#### Acceptance Criteria

1. WHEN the floating action button is clicked, THE Levantamiento_Module SHALL display Confirmation_Modal
2. WHEN Confirmation_Modal is displayed, THE Levantamiento_Module SHALL show a breakdown of items grouped by current origen
3. WHEN Confirmation_Modal is displayed, THE Levantamiento_Module SHALL display a dropdown selector for choosing the new origen value
4. WHEN Confirmation_Modal is displayed, THE Levantamiento_Module SHALL list all items in Selection_Set with their key identifiers
5. WHEN Confirmation_Modal is displayed, IF Selection_Set contains any Blocked_Item instances, THEN THE Levantamiento_Module SHALL display warning messages for each blocked item
6. WHEN Confirmation_Modal is displayed, IF Selection_Set contains any Blocked_Item instances, THEN THE Levantamiento_Module SHALL display a checkbox labeled "Confirmo que entiendo las advertencias"
7. WHEN Confirmation_Modal is displayed, IF the warning acknowledgment checkbox is not checked, THEN THE Levantamiento_Module SHALL disable the confirm transfer button
8. WHEN Confirmation_Modal is displayed, THE Levantamiento_Module SHALL provide a cancel button to close the modal without transferring

### Requirement 6: Sequential Transfer Processing

**User Story:** As an inventory manager, I want to see real-time progress as items are transferred, so that I understand the operation status.

#### Acceptance Criteria

1. WHEN transfer is confirmed in Confirmation_Modal, THE Levantamiento_Module SHALL close Confirmation_Modal and display Progress_Modal
2. WHEN Progress_Modal is displayed, THE Levantamiento_Module SHALL disable the close button during processing
3. WHEN Progress_Modal is displayed, THE Levantamiento_Module SHALL process each non-blocked item in Selection_Set sequentially
4. WHILE processing each item, THE Levantamiento_Module SHALL display "Procesando X de Y" where X is the current item number and Y is the total count
5. WHEN an item transfer succeeds, THE Levantamiento_Module SHALL display a success indicator for that item in Progress_Modal
6. WHEN an item transfer fails, THE Levantamiento_Module SHALL display a failure indicator with error message for that item in Progress_Modal
7. WHEN all items have been processed, THE Levantamiento_Module SHALL enable the close button in Progress_Modal
8. THE Levantamiento_Module SHALL NOT transfer any Blocked_Item instances and SHALL mark them as skipped in Progress_Modal

### Requirement 7: Audit Trail Recording

**User Story:** As a system administrator, I want all origen transfers to be logged, so that I can track changes and maintain accountability.

#### Acceptance Criteria

1. WHEN an item origen transfer succeeds, THE Levantamiento_Module SHALL create an Audit_Record in the cambios_inventario table
2. WHEN creating an Audit_Record, THE Levantamiento_Module SHALL record the authenticated user identifier
3. WHEN creating an Audit_Record, THE Levantamiento_Module SHALL record the current timestamp
4. WHEN creating an Audit_Record, THE Levantamiento_Module SHALL record the previous origen value
5. WHEN creating an Audit_Record, THE Levantamiento_Module SHALL record the new origen value
6. WHEN creating an Audit_Record, THE Levantamiento_Module SHALL record the item identifier and relevant item details
7. WHEN creating an Audit_Record, THE Levantamiento_Module SHALL record the operation type as "batch_origen_transfer"

### Requirement 8: Post-Transfer State Management

**User Story:** As an inventory manager, I want the UI to reflect the new origen values immediately after transfer, so that I see accurate data without refreshing.

#### Acceptance Criteria

1. WHEN all transfers are complete, THE Levantamiento_Module SHALL update the local store with new origen values for all successfully transferred items
2. WHEN all transfers are complete, THE Levantamiento_Module SHALL refresh the inventory table to display updated origen badges
3. WHEN all transfers are complete, THE Levantamiento_Module SHALL display a summary showing the count of successful transfers
4. WHEN all transfers are complete, THE Levantamiento_Module SHALL display a summary showing the count of failed transfers
5. WHEN all transfers are complete, THE Levantamiento_Module SHALL display a summary showing the count of skipped Blocked_Item instances
6. WHEN Progress_Modal is closed after completion, THE Levantamiento_Module SHALL exit Transfer_Mode
7. WHEN Progress_Modal is closed after completion, THE Levantamiento_Module SHALL clear Selection_Set

### Requirement 9: Transfer Operation Report

**User Story:** As an inventory manager, I want to download a report of the batch transfer operation, so that I can keep records of what was changed.

#### Acceptance Criteria

1. WHEN all transfers are complete, THE Levantamiento_Module SHALL display a "Descargar Reporte" button in Progress_Modal
2. WHEN the download report button is clicked, THE Levantamiento_Module SHALL generate a report containing all transfer results
3. WHEN generating the report, THE Levantamiento_Module SHALL include the timestamp of the operation
4. WHEN generating the report, THE Levantamiento_Module SHALL include the user who performed the operation
5. WHEN generating the report, THE Levantamiento_Module SHALL list all successfully transferred items with old and new origen values
6. WHEN generating the report, THE Levantamiento_Module SHALL list all failed transfers with error messages
7. WHEN generating the report, THE Levantamiento_Module SHALL list all skipped Blocked_Item instances with reasons

### Requirement 10: API Endpoint Extension

**User Story:** As a developer, I want to extend the existing origen transfer API to support batch operations, so that the backend can process multiple transfers efficiently.

#### Acceptance Criteria

1. THE Levantamiento_Module SHALL use the existing /api/inventario/transfer-origen endpoint for batch operations
2. WHEN calling the transfer API for batch operations, THE Levantamiento_Module SHALL send an array of item identifiers
3. WHEN calling the transfer API for batch operations, THE Levantamiento_Module SHALL send the new origen value
4. WHEN the transfer API receives a batch request, THE Levantamiento_Module SHALL process each item sequentially
5. WHEN the transfer API processes an item, THE Levantamiento_Module SHALL validate the item against business rules
6. WHEN the transfer API completes processing, THE Levantamiento_Module SHALL return an array of results indicating success or failure for each item
7. THE Levantamiento_Module SHALL enforce Row Level Security policies during all transfer operations

### Requirement 11: Permission and Security

**User Story:** As a system administrator, I want batch transfers to respect user permissions, so that only authorized users can transfer items.

#### Acceptance Criteria

1. WHEN a user attempts to enter Transfer_Mode, THE Levantamiento_Module SHALL verify the user has origen transfer permissions
2. WHEN a user attempts to confirm a batch transfer, THE Levantamiento_Module SHALL verify the user has origen transfer permissions
3. WHEN the transfer API processes a request, THE Levantamiento_Module SHALL enforce Row Level Security policies for each item
4. IF a user lacks transfer permissions, THEN THE Levantamiento_Module SHALL hide Transfer_Button
5. IF a user lacks transfer permissions for specific items, THEN THE Levantamiento_Module SHALL mark those items as Blocked_Item with reason "insufficient_permissions"

### Requirement 12: Error Handling and Recovery

**User Story:** As an inventory manager, I want clear error messages when transfers fail, so that I can understand and resolve issues.

#### Acceptance Criteria

1. WHEN a transfer API call fails due to network error, THE Levantamiento_Module SHALL display an error message in Progress_Modal
2. WHEN a transfer API call fails due to validation error, THE Levantamiento_Module SHALL display the validation error message in Progress_Modal
3. WHEN a transfer API call fails due to permission error, THE Levantamiento_Module SHALL display a permission denied message in Progress_Modal
4. IF Progress_Modal is closed during processing, THEN THE Levantamiento_Module SHALL continue processing in the background
5. WHEN background processing completes, THE Levantamiento_Module SHALL display a notification with the final summary
6. WHEN any error occurs, THE Levantamiento_Module SHALL log the error details for debugging purposes

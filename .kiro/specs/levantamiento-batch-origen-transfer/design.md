# Design Document: Batch Origen Transfer for Levantamiento Module

## Overview

This feature extends the Levantamiento Unificado module to support batch origen transfer operations. Currently, users can only transfer individual items by clicking origen badges. This enhancement enables administrators to select multiple inventory items and transfer them between institutions (INEA, ITEA, TLAXCALA) in a single operation, significantly improving efficiency for bulk reassignments.

The design reuses the existing single-item origen transfer infrastructure (`useOrigenTransfer` hook and `/api/inventario/transfer-origen` endpoint) and follows established patterns from the directorio bienes transfer feature for batch operations and progress tracking.

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                  LevantamientoUnificado                     │
│                    (Main Component)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────────┐ ┌──────────────┐ ┌──────────────────┐
│  SearchBar &   │ │ InventoryTable│ │ ExportButtons +  │
│  FilterChips   │ │  (Extended)   │ │ Transfer Button  │
└────────────────┘ └───────┬───────┘ └──────────────────┘
                           │
                           │ (Transfer Mode Active)
                           ▼
                  ┌────────────────────┐
                  │  Checkbox Column   │
                  │  + Selection State │
                  └────────┬───────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │ Floating Action    │
                  │ Button (FAB)       │
                  └────────┬───────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌────────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Confirmation   │ │   Progress   │ │  useBatchOrigen  │
│    Modal       │ │    Modal     │ │  Transfer Hook   │
└────────────────┘ └──────────────┘ └────────┬─────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │ useOrigenTransfer│
                                    │  (Sequential)    │
                                    └────────┬─────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │  POST /api/      │
                                    │  inventario/     │
                                    │  transfer-origen │
                                    └──────────────────┘
```

### State Management Flow

```
Normal Mode
    │
    ├─ Origen filter active? → Show "Transferir Origen" button
    │
    └─ Click button → Enter Transfer Mode
                          │
                          ├─ Show checkbox column
                          ├─ Disable origen badges
                          ├─ Change button to "Cancelar Transferencia"
                          │
                          └─ User selects items
                                  │
                                  ├─ Selection > 0 → Show FAB with count
                                  │
                                  └─ Click FAB → Validate & Show Confirmation Modal
                                                      │
                                                      ├─ User reviews items
                                                      ├─ Selects target origen
                                                      ├─ Acknowledges warnings (if any)
                                                      │
                                                      └─ Click Confirm → Show Progress Modal
                                                                              │
                                                                              ├─ Process items sequentially
                                                                              ├─ Update progress in real-time
                                                                              ├─ Create audit records
                                                                              │
                                                                              └─ Complete → Show summary
                                                                                           │
                                                                                           ├─ Download report option
                                                                                           │
                                                                                           └─ Close → Exit Transfer Mode
```

## Components and Interfaces

### 1. Extended InventoryTable Component

**Location:** `src/components/consultas/levantamiento/components/InventoryTable.tsx`

**New Props:**
```typescript
interface InventoryTableProps {
  // ... existing props
  transferMode?: boolean;
  selectedItems?: Set<string>; // Set of item IDs
  onItemSelect?: (itemId: string) => void;
  onSelectAll?: () => void;
  allSelected?: boolean;
  blockedItems?: Map<string, string>; // itemId -> reason
}
```

**Changes:**
- Add conditional checkbox column as leftmost column when `transferMode` is true
- Add header checkbox for select-all functionality
- Disable origen badge click handlers when in transfer mode
- Apply visual styling to blocked items (grayed out with tooltip)

### 2. Transfer Mode Button

**Location:** Integrated into `ExportButtons` component

**Behavior:**
- Visible only when at least one origen filter is active
- Label changes based on mode: "Transferir Origen" / "Cancelar Transferencia"
- Icon changes based on mode: transfer icon / cancel icon
- Triggers mode toggle on click

### 3. Floating Action Button (FAB)

**Location:** New component `src/components/consultas/levantamiento/components/TransferFAB.tsx`

```typescript
interface TransferFABProps {
  selectedCount: number;
  onClick: () => void;
  isDarkMode: boolean;
}
```

**Behavior:**
- Fixed position at bottom-right of viewport
- Displays "Confirmar Transferencia (X)" where X is selected count
- Animated entrance/exit using Framer Motion
- Pulse animation to draw attention
- Only visible when selectedCount > 0

### 4. Confirmation Modal

**Location:** `src/components/consultas/levantamiento/modals/BatchTransferConfirmationModal.tsx`

```typescript
interface BatchTransferConfirmationModalProps {
  show: boolean;
  selectedItems: LevMueble[];
  blockedItems: Map<string, string>;
  onConfirm: (targetOrigen: OrigenType) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}
```

**Sections:**
1. **Header:** "Confirmar Transferencia en Lote"
2. **Summary Stats:**
   - Total items selected
   - Breakdown by current origen (INEA: X, ITEA: Y, TLAXCALA: Z)
   - Blocked items count (if any)
3. **Target Origen Selector:** Dropdown to choose destination
4. **Items List:** Scrollable list showing id_inventario, descripción, current origen
5. **Warnings Section:** (if blocked items exist)
   - List of blocked items with reasons
   - Checkbox: "Confirmo que entiendo las advertencias"
6. **Actions:**
   - Cancel button
   - Confirm button (disabled if warnings not acknowledged)

### 5. Progress Modal

**Location:** `src/components/consultas/levantamiento/modals/BatchTransferProgressModal.tsx`

```typescript
interface BatchTransferProgressModalProps {
  show: boolean;
  items: TransferItem[];
  currentIndex: number;
  onClose: () => void;
  onDownloadReport: () => void;
  processing: boolean;
  isDarkMode: boolean;
}

interface TransferItem {
  id: string;
  idInventario: string;
  descripcion: string;
  currentOrigen: OrigenType;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'skipped';
  error?: string;
}
```

**Sections:**
1. **Header:** "Procesando Transferencias"
2. **Progress Bar:** Visual progress indicator
3. **Status Text:** "Procesando X de Y"
4. **Items List:** Scrollable list with status icons
   - ⏳ Pending (gray)
   - 🔄 Processing (blue, animated)
   - ✓ Success (green)
   - ✗ Failed (red, with error message)
   - ⊘ Skipped (orange, with reason)
5. **Summary** (after completion):
   - Successful: X
   - Failed: Y
   - Skipped: Z
6. **Actions:**
   - Close button (disabled during processing)
   - "Descargar Reporte" button (visible after completion)

### 6. Custom Hook: useBatchOrigenTransfer

**Location:** `src/hooks/useBatchOrigenTransfer.ts`

```typescript
interface UseBatchOrigenTransferParams {
  onSuccess?: () => void;
  onProgress?: (current: number, total: number) => void;
}

interface UseBatchOrigenTransferReturn {
  transferBatch: (
    items: LevMueble[],
    targetOrigen: OrigenType
  ) => Promise<BatchTransferResult>;
  validateItems: (items: LevMueble[]) => Promise<ValidationResult>;
  isTransferring: boolean;
  progress: TransferProgress;
  cancelTransfer: () => void;
}

interface ValidationResult {
  validItems: LevMueble[];
  blockedItems: Map<string, string>; // itemId -> reason
}

interface BatchTransferResult {
  successful: TransferItem[];
  failed: TransferItem[];
  skipped: TransferItem[];
  totalProcessed: number;
}

interface TransferProgress {
  current: number;
  total: number;
  currentItem: LevMueble | null;
}
```

**Responsibilities:**
- Validate items before transfer (check resguardos, estatus BAJA, permissions)
- Execute transfers sequentially using `useOrigenTransfer` hook
- Track progress and update state in real-time
- Handle errors gracefully and continue processing
- Support cancellation (stop processing remaining items)
- Generate transfer report data

**Implementation Strategy:**
```typescript
const transferBatch = async (items: LevMueble[], targetOrigen: OrigenType) => {
  const result: BatchTransferResult = {
    successful: [],
    failed: [],
    skipped: [],
    totalProcessed: 0
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Update progress
    onProgress?.(i + 1, items.length);
    
    // Skip blocked items
    if (blockedItems.has(item.id)) {
      result.skipped.push({
        ...item,
        status: 'skipped',
        error: blockedItems.get(item.id)
      });
      continue;
    }

    try {
      // Use existing single-item transfer
      await transferOrigen(item.id, item.id_inv, targetOrigen);
      result.successful.push({ ...item, status: 'success' });
    } catch (error) {
      result.failed.push({
        ...item,
        status: 'failed',
        error: error.message
      });
    }
    
    result.totalProcessed++;
    
    // Small delay to prevent overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return result;
};
```

## Data Models

### Transfer Mode State

```typescript
interface TransferModeState {
  active: boolean;
  selectedItems: Set<string>; // Set of item IDs
  blockedItems: Map<string, string>; // itemId -> block reason
  targetOrigen: OrigenType | null;
}
```

### Blocked Item Reasons

```typescript
type BlockReason =
  | 'resguardo_activo'
  | 'estatus_baja'
  | 'insufficient_permissions'
  | 'validation_error';

const BLOCK_REASON_MESSAGES: Record<BlockReason, string> = {
  resguardo_activo: 'Tiene resguardo activo',
  estatus_baja: 'Estatus BAJA',
  insufficient_permissions: 'Sin permisos',
  validation_error: 'Error de validación'
};
```

### Transfer Report Data

```typescript
interface TransferReport {
  timestamp: string;
  userId: string;
  userName: string;
  targetOrigen: OrigenType;
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  items: {
    successful: ReportItem[];
    failed: ReportItem[];
    skipped: ReportItem[];
  };
}

interface ReportItem {
  idInventario: string;
  descripcion: string;
  origenAnterior: OrigenType;
  origenNuevo?: OrigenType;
  error?: string;
  reason?: string;
}
```

## API Integration

### Endpoint Reuse Strategy

The feature reuses the existing `/api/inventario/transfer-origen` endpoint without modifications. The batch operation is implemented client-side by calling the endpoint sequentially for each item.

**Rationale:**
- Simpler implementation (no backend changes required)
- Reuses existing validation and audit logic
- Easier to handle partial failures
- Better progress tracking granularity
- Existing endpoint already handles all business rules

**Sequential Processing:**
```typescript
// Client-side batch processing
for (const item of items) {
  await fetch('/api/inventario/transfer-origen', {
    method: 'POST',
    body: JSON.stringify({
      record_id: item.id,
      id_inventario: item.id_inv,
      origen_actual: item.origen,
      origen_destino: targetOrigen
    })
  });
}
```

### Audit Trail

Each successful transfer creates an individual audit record in `cambios_inventario` table with:
- `campo_modificado`: 'origen'
- `valor_anterior`: current origen
- `valor_nuevo`: target origen
- `usuario_id`: authenticated user ID
- `fecha_cambio`: timestamp
- `id_mueble`: item UUID
- `tabla_origen`: source table name

The batch operation is identified by grouping records with similar timestamps from the same user.

## Error Handling

### Validation Errors

**Pre-Transfer Validation:**
1. Check for active resguardos (query `resguardos` table)
2. Check for estatus BAJA (check `config_estatus.concepto`)
3. Check user permissions (admin/superadmin role)
4. Verify items exist in current origen table

**Blocked Items Handling:**
- Display warnings in confirmation modal
- Require user acknowledgment before proceeding
- Skip blocked items during processing
- Include in skipped count in summary

### Transfer Errors

**Error Types:**
1. **Network Errors:** Display "Error de conexión" in progress modal
2. **Validation Errors:** Display specific validation message
3. **Permission Errors:** Display "Sin permisos para transferir"
4. **Database Errors:** Display "Error al transferir registro"

**Error Recovery:**
- Continue processing remaining items after error
- Track failed items separately
- Display all errors in progress modal
- Include failed items in report

### Background Processing

If user closes progress modal during processing:
1. Continue processing in background
2. Store results in component state
3. Display toast notification when complete
4. Show summary: "Transferencia completada: X exitosas, Y fallidas"

## Testing Strategy

### Unit Tests

**Component Tests:**
- Transfer button visibility based on filters
- Checkbox column rendering in transfer mode
- FAB visibility and count display
- Modal rendering and interactions
- Blocked items display and warnings

**Hook Tests:**
- Item validation logic
- Sequential transfer execution
- Progress tracking
- Error handling
- Cancellation behavior

**Integration Tests:**
- Full transfer flow from selection to completion
- Store updates after successful transfers
- Audit record creation
- Report generation

### Property-Based Tests

See Correctness Properties section below for detailed property specifications.

### Manual Testing Checklist

1. **Transfer Mode Activation:**
   - [ ] Button appears when origen filter active
   - [ ] Button hidden when no origen filter
   - [ ] Mode toggles correctly
   - [ ] Checkboxes appear/disappear
   - [ ] Origen badges disabled/enabled

2. **Item Selection:**
   - [ ] Individual checkbox selection works
   - [ ] Select all works correctly
   - [ ] Deselect all works correctly
   - [ ] FAB shows correct count
   - [ ] FAB hides when selection empty

3. **Validation:**
   - [ ] Items with resguardo blocked
   - [ ] Items with BAJA blocked
   - [ ] Warnings displayed correctly
   - [ ] Acknowledgment checkbox required

4. **Transfer Processing:**
   - [ ] Progress updates in real-time
   - [ ] Success/failure indicators correct
   - [ ] Skipped items marked correctly
   - [ ] Close button disabled during processing
   - [ ] Background processing works

5. **Post-Transfer:**
   - [ ] Store updated correctly
   - [ ] UI reflects new origen values
   - [ ] Summary counts correct
   - [ ] Report downloads correctly
   - [ ] Audit records created

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

1. **Button visibility properties (1.1, 1.2):** These are inverse conditions that can be combined into one property about button visibility based on filter state.

2. **Selection state properties (2.3, 2.6, 2.7):** The FAB visibility is a direct consequence of selection state, so we can combine these into properties about selection state management.

3. **Mode exit cleanup (3.2, 3.3, 3.4, 3.5, 3.6):** All these test different aspects of cleanup when exiting transfer mode. We can combine into one comprehensive property about state restoration.

4. **Validation properties (4.1, 4.2, 4.4):** These all test blocked item identification. We can combine into one property about validation identifying all blocked items correctly.

5. **Audit record properties (7.1-7.7):** All these test different fields in audit records. We can combine into one comprehensive property about audit record completeness.

6. **Summary display properties (8.3, 8.4, 8.5):** These all test summary counts. We can combine into one property about summary accuracy.

7. **Report content properties (9.3-9.7):** These all test report content. We can combine into one property about report completeness.

After reflection, the following properties provide unique validation value:

### Property 1: Transfer Button Visibility

*For any* filter state, the transfer button should be visible if and only if at least one origen filter is active.

**Validates: Requirements 1.1, 1.2**

### Property 2: Checkbox Column Presence

*For any* transfer mode state, checkboxes should be present in the table if and only if transfer mode is active.

**Validates: Requirements 1.4, 2.1, 3.2**

### Property 3: Selection State Consistency

*For any* sequence of selection operations (individual select, select all, deselect all), the selection set should accurately reflect the user's actions and the FAB should display the correct count.

**Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7**

### Property 4: Mode Exit State Restoration

*For any* transfer mode session, exiting transfer mode should restore all UI elements to their pre-transfer state (button label, origen badge handlers, checkbox column, FAB, selection set).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 5: Blocked Item Identification

*For any* set of inventory items, validation should correctly identify all items that cannot be transferred (active resguardo, estatus BAJA, insufficient permissions) with appropriate reasons.

**Validates: Requirements 4.1, 4.2, 4.4, 4.5, 11.5**

### Property 6: Mixed Origen Selection

*For any* selection of items with different origen values, the system should allow the selection and correctly group them by origen in the confirmation modal.

**Validates: Requirements 4.3, 5.2**

### Property 7: Confirmation Modal Completeness

*For any* selection set, the confirmation modal should display all selected items with their key identifiers and show warnings for all blocked items.

**Validates: Requirements 5.4, 5.5**

### Property 8: Sequential Processing Order

*For any* batch of items, the system should process each non-blocked item exactly once in sequential order, updating progress after each item.

**Validates: Requirements 6.3, 6.4, 10.4**

### Property 9: Transfer Result Categorization

*For any* batch transfer operation, each item should be categorized exactly once as either successful, failed, or skipped, with appropriate status indicators displayed.

**Validates: Requirements 6.5, 6.6, 6.8**

### Property 10: Audit Record Completeness

*For any* successful item transfer, an audit record should be created containing all required fields: user ID, timestamp, previous origen, new origen, item identifier, and operation type "batch_origen_transfer".

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**

### Property 11: Store Update Accuracy

*For any* batch transfer completion, the local store should be updated with new origen values for exactly the set of successfully transferred items.

**Validates: Requirements 8.1**

### Property 12: Summary Accuracy

*For any* batch transfer completion, the displayed summary counts (successful, failed, skipped) should exactly match the actual transfer results.

**Validates: Requirements 8.3, 8.4, 8.5**

### Property 13: Report Completeness

*For any* batch transfer operation, the generated report should contain the timestamp, user information, and complete lists of successful, failed, and skipped items with all relevant details.

**Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7**

### Property 14: API Response Consistency

*For any* batch transfer operation, the API should return results for exactly the number of items processed, with each result indicating success or failure.

**Validates: Requirements 10.6**

### Property 15: Validation Enforcement

*For any* item in a batch transfer, the API should validate the item against all business rules (resguardo, estatus, permissions) before attempting transfer.

**Validates: Requirements 10.5**

### Property 16: Error Message Display

*For any* transfer error (network, validation, permission), the system should display an appropriate error message in the progress modal.

**Validates: Requirements 12.1, 12.2, 12.3, 12.6**

## Performance Considerations

### Optimization Strategies

1. **Debounced Selection Updates:** Debounce selection state updates to prevent excessive re-renders
2. **Virtualized Lists:** Use virtual scrolling for large item lists in modals
3. **Batch State Updates:** Group multiple state updates into single render cycle
4. **Memoized Computations:** Memoize expensive calculations (validation, grouping)
5. **Progressive Loading:** Load and validate items in chunks for very large selections

### Rate Limiting

- Add 100ms delay between sequential API calls to prevent overwhelming the server
- Maximum 10 concurrent validations during pre-transfer check
- Implement exponential backoff for failed requests

### Memory Management

- Clear selection set after transfer completion
- Dispose of modal state when closed
- Limit progress modal item list to last 100 items for very large batches

## Security

### Permission Checks

1. **UI Level:** Hide transfer button for non-admin users
2. **Hook Level:** Validate permissions before starting transfer
3. **API Level:** Enforce permissions via RLS policies (existing)

### Input Validation

- Validate all item IDs before transfer
- Verify target origen is valid value
- Sanitize all user inputs in report generation
- Prevent SQL injection via parameterized queries (existing)

### Audit Trail

- Log all transfer attempts (successful and failed)
- Include user identity in all audit records
- Timestamp all operations
- Store operation type for batch identification

## Integration Points

### Existing Filter System

**Integration:** Detect active origen filters from `useSearchAndFilters` hook

```typescript
const hasOrigenFilter = activeFilters.some(f => f.type === 'origen');
```

### Existing Store

**Integration:** Update store after successful transfers using existing reindex mechanism

```typescript
// Trigger reindex after batch completion
await reindex();
```

### Existing Audit System

**Integration:** Use existing `cambios_inventario` table structure (no changes needed)

### Existing Origen Transfer

**Integration:** Reuse `useOrigenTransfer` hook for individual transfers

```typescript
const { transferOrigen } = useOrigenTransfer({
  currentOrigen: item.origen,
  onSuccess: () => {
    // Track success
  }
});
```

## UI/UX Specifications

### Visual Design

**Transfer Button:**
- Position: Next to export buttons in header
- Style: Outlined button with transfer icon
- States: Normal, hover, active (transfer mode)
- Colors: Follow theme (dark/light mode)

**Checkbox Column:**
- Width: 48px (fixed)
- Position: Leftmost column
- Header: Checkbox for select-all
- Cells: Individual checkboxes

**Floating Action Button:**
- Position: Fixed bottom-right, 24px from edges
- Size: 56px height, auto width
- Style: Filled button with elevation shadow
- Animation: Slide up on appear, pulse on idle
- Text: "Confirmar Transferencia (X)"

**Blocked Items:**
- Visual: Grayed out with 50% opacity
- Indicator: Warning icon next to checkbox
- Tooltip: Show block reason on hover
- Checkbox: Disabled state

### Animations

**Transfer Mode Transition:**
- Checkbox column: Slide in from left (200ms)
- Button label: Fade transition (150ms)
- FAB: Slide up from bottom (300ms, spring)

**Progress Updates:**
- Status icons: Fade in (150ms)
- Progress bar: Smooth width transition (300ms)
- Current item: Highlight with pulse animation

### Responsive Behavior

**Mobile (<768px):**
- FAB text: Show only count "(X)"
- Modal: Full screen
- Table: Horizontal scroll with fixed checkbox column

**Tablet (768px-1024px):**
- FAB: Smaller size (48px)
- Modal: 90% width
- Table: Normal layout

**Desktop (>1024px):**
- FAB: Full size
- Modal: Max 800px width
- Table: Full layout with all columns

## Accessibility

### Keyboard Navigation

- Transfer button: Tab-accessible, Enter/Space to activate
- Checkboxes: Tab-accessible, Space to toggle
- FAB: Tab-accessible, Enter to confirm
- Modals: Trap focus, Escape to close
- Lists: Arrow keys to navigate

### Screen Reader Support

- Transfer button: Announce mode state
- Checkboxes: Announce selection state and count
- FAB: Announce selected count
- Progress: Announce progress updates
- Status icons: Provide text alternatives

### ARIA Attributes

```typescript
// Transfer button
aria-label="Transferir origen de items seleccionados"
aria-pressed={transferMode}

// Checkbox
aria-label={`Seleccionar item ${idInventario}`}
aria-checked={isSelected}

// FAB
aria-label={`Confirmar transferencia de ${count} items`}

// Progress modal
aria-live="polite"
aria-busy={processing}
```

## Migration and Rollout

### Phase 1: Core Implementation
- Implement transfer mode state management
- Add checkbox column to table
- Create transfer button and FAB

### Phase 2: Validation and Modals
- Implement validation logic
- Create confirmation modal
- Create progress modal

### Phase 3: Transfer Logic
- Implement `useBatchOrigenTransfer` hook
- Integrate with existing `useOrigenTransfer`
- Add error handling

### Phase 4: Polish and Testing
- Add animations and transitions
- Implement report generation
- Comprehensive testing
- Documentation

### Rollout Strategy

1. **Internal Testing:** Test with small batches (<10 items)
2. **Beta Testing:** Enable for admin users only
3. **Gradual Rollout:** Monitor performance and errors
4. **Full Release:** Enable for all authorized users

### Rollback Plan

If critical issues arise:
1. Hide transfer button via feature flag
2. Disable transfer mode activation
3. Existing single-item transfer remains functional
4. No data corruption risk (uses existing validated endpoint)

## Documentation

### User Documentation

Create `docs/BATCH_ORIGEN_TRANSFER_USER_GUIDE.md` with:
- Feature overview
- Step-by-step usage guide
- Screenshots of each step
- Common scenarios and best practices
- Troubleshooting guide

### Developer Documentation

Create `docs/BATCH_ORIGEN_TRANSFER_TECHNICAL.md` with:
- Architecture overview
- Component API documentation
- Hook usage examples
- Integration guide
- Testing guide

### Code Comments

```typescript
/**
 * Custom hook for batch origen transfer operations
 * 
 * Manages the complete lifecycle of batch transfers including:
 * - Pre-transfer validation
 * - Sequential processing
 * - Progress tracking
 * - Error handling
 * - Audit trail creation
 * 
 * @param onSuccess - Callback invoked after successful batch completion
 * @param onProgress - Callback invoked after each item processed
 * 
 * @returns Hook interface with transfer functions and state
 * 
 * @example
 * const { transferBatch, validateItems } = useBatchOrigenTransfer({
 *   onSuccess: () => console.log('Batch complete'),
 *   onProgress: (current, total) => console.log(`${current}/${total}`)
 * });
 * 
 * // Validate items first
 * const { validItems, blockedItems } = await validateItems(selectedItems);
 * 
 * // Execute transfer
 * const result = await transferBatch(validItems, 'itea');
 */
```

## Future Enhancements

### Potential Improvements

1. **Parallel Processing:** Process multiple items concurrently (with rate limiting)
2. **Undo Functionality:** Allow reverting recent batch transfers
3. **Scheduled Transfers:** Schedule batch transfers for off-peak hours
4. **Transfer Templates:** Save common transfer configurations
5. **Advanced Filtering:** Filter items within transfer mode
6. **Bulk Validation:** Pre-validate all items before entering transfer mode
7. **Transfer History:** View history of all batch transfers
8. **Email Notifications:** Send email with transfer summary
9. **CSV Import:** Import list of items to transfer from CSV
10. **Dry Run Mode:** Preview transfer results without executing

### Technical Debt

- Consider moving to server-side batch processing for very large batches (>1000 items)
- Implement WebSocket for real-time progress updates
- Add comprehensive error recovery mechanisms
- Optimize validation queries for large datasets

# ITEA General - Sync Status Indicator Implementation

## Overview
This document describes the implementation of the sync status indicator for the ITEA General module, which prevents user interactions during batch synchronization operations when area or director changes affect multiple records simultaneously.

## Problem Statement
When changing area or director assignments that affect multiple records in ITEA General, the system performs batch updates with skeleton loading states. However, users could still attempt to edit records or trigger new operations during this sync process, potentially causing:
- Data inconsistencies
- Race conditions
- Confusing UX with overlapping operations
- Failed updates due to concurrent modifications

## Solution
Implemented a comprehensive sync status system with:
1. **Global sync state management** in the store
2. **Floating visual indicator** showing sync progress
3. **Disabled UI controls** during sync operations
4. **Form field protection** in edit mode

## Implementation Details

### 1. Store Updates (`src/stores/iteaStore.ts`)

The ITEA store already had sync state management:

```typescript
interface IteaStore {
  // ... existing state
  syncingIds: string[];
  isSyncing: boolean;
  
  // Sync actions
  updateMuebleBatch: (muebles: MuebleITEA[]) => void;
  setSyncingIds: (ids: string[]) => void;
  removeSyncingIds: (ids: string[]) => void;
  clearSyncingIds: () => void;
  setIsSyncing: (syncing: boolean) => void;
}
```

**Key Features:**
- `syncingIds`: Array of record IDs currently being synchronized
- `isSyncing`: Global flag indicating if any sync operation is in progress
- `updateMuebleBatch`: Efficiently updates multiple records at once
- Sync control actions for managing the sync lifecycle

### 2. Sync Status Banner Component

Created `src/components/consultas/itea/components/SyncStatusBanner.tsx`:

```typescript
interface SyncStatusBannerProps {
  isSyncing: boolean;
  syncingCount: number;
  isDarkMode: boolean;
}
```

**Visual Design:**
- **Position**: Fixed top-left (top-[5.5rem] left-6)
- **Style**: Glassmorphism with backdrop blur
- **Animation**: Smooth fade-in/out with spring physics
- **Content**:
  - Animated spinner icon with pulse effect
  - "Sincronizando" text
  - Record counter (e.g., "5 registros")
  - Three animated progress dots

**Responsive Behavior:**
- Only visible when `isSyncing` is true
- Automatically shows/hides with smooth transitions
- Updates counter in real-time as records sync

### 3. Main Component Integration

Updated `src/components/consultas/itea/index.tsx`:

```typescript
// Get sync state from store
const syncingIds = useIteaStore(state => state.syncingIds) || [];
const isSyncing = useIteaStore(state => state.isSyncing);

// Render banner
<SyncStatusBanner
  isSyncing={isSyncing}
  syncingCount={syncingIds.length}
  isDarkMode={isDarkMode}
/>

// Disable action buttons
<button
  onClick={handleStartEdit}
  disabled={isSyncing}
  title={isSyncing ? "Espere a que termine la sincronización" : "Editar bien"}
>
  Editar
</button>

// All action buttons (Color, Editar, Inactivo, Dar de Baja) are disabled during sync
// Save and Cancel buttons in edit mode are also disabled during sync
```

### 4. Detail Panel Form Protection

Updated `src/components/consultas/itea/components/DetailPanel.tsx`:

**Interface Updates:**
```typescript
interface DetailPanelProps {
  // ... existing props
  isGlobalSyncing?: boolean;
}

interface EditModeProps {
  // ... existing props
  isDisabled?: boolean;
}
```

**Disabled State Logic:**
```typescript
// In DetailPanel component
const isDisabled = isGlobalSyncing;

// Pass to EditMode
<EditMode
  {...props}
  isDisabled={isDisabled}
/>
```

**Form Field Protection:**
All input fields, textareas, and CustomSelect components receive:
```typescript
disabled={isDisabled}
className={`... ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
```

**Protected Fields:**
- ID Inventario (text input)
- Rubro (CustomSelect)
- Descripción (textarea)
- Estado (CustomSelect)
- Valor (text input)
- Fecha de Adquisición (date input)
- Forma de Adquisición (CustomSelect)
- Proveedor (text input)
- Factura (text input)
- Estado (text input)
- Municipio (text input)
- Nomenclatura (text input)
- Estatus (CustomSelect)
- Director/Jefe de Área (CustomSelect - also disabled if has active resguardo)

## User Experience Flow

### Normal Operation
1. User views ITEA General inventory
2. All controls are enabled
3. User can edit, assign colors, mark as inactive, or dar de baja freely

### During Sync
1. Admin changes area/director affecting multiple records
2. Sync status banner appears (top-left, floating)
3. Banner shows: "Sincronizando - X registros"
4. All action buttons disabled with tooltips
5. If user is in edit mode, all form fields become disabled
6. Skeleton loaders appear in table cells for syncing records
7. Banner updates counter as records complete
8. When sync completes, banner fades out
9. All controls re-enable automatically

## Technical Specifications

### Animation Details
- **Banner Entry**: Spring animation (stiffness: 500, damping: 30)
- **Banner Exit**: Smooth fade with scale down
- **Spinner**: Continuous rotation with pulse effect
- **Progress Dots**: Staggered scale/opacity animation (1.5s cycle)

### Timing
- Minimum skeleton display: 800ms per record
- Batch processing: 50 records per batch
- Inter-batch delay: 100ms
- Banner transition: ~300ms

### Z-Index Hierarchy
- Banner: z-50 (ensures visibility above content)
- Modals: z-40
- Table content: z-10

### Accessibility
- Disabled buttons include `title` attributes with explanatory text
- Visual feedback through opacity changes
- Clear status messaging in banner
- Maintains keyboard navigation flow

## Benefits

1. **Data Integrity**: Prevents concurrent modifications during batch updates
2. **Clear Feedback**: Users understand when system is processing
3. **Error Prevention**: Disabled controls prevent invalid operations
4. **Professional UX**: Smooth animations and clear status indicators
5. **Consistency**: Matches INEA implementation pattern

## Related Files

- `src/stores/iteaStore.ts` - State management
- `src/hooks/indexation/useIteaIndexation.ts` - Sync trigger logic and realtime listeners
- `src/components/consultas/itea/index.tsx` - Main component
- `src/components/consultas/itea/components/SyncStatusBanner.tsx` - Banner component
- `src/components/consultas/itea/components/DetailPanel.tsx` - Form protection

## Key Implementation Details

### Realtime Listeners
The hook `useIteaIndexation.ts` includes listeners for:
1. **muebles.itea table** - INSERT, UPDATE, DELETE events
2. **area table** - UPDATE events that trigger batch sync for affected records
3. **directorio table** - UPDATE events that trigger batch sync for affected records
4. **resguardos table** - All events (filtered by `origen = 'ITEA'`) to update resguardante field
5. **colores table** - All events to update color assignments

### Batch Processing
When area or director changes occur:
1. `processBatchUpdates` is called with the affected area/director ID
2. Fetches all records in batches of 1000 (Supabase limit)
3. Sets `syncingIds` to trigger skeleton loaders
4. Updates store in UI batches of 50 records
5. Clears sync state when complete
6. Queues additional sync requests if they arrive during processing

## Testing Checklist

- [ ] Banner appears when sync starts
- [ ] Banner shows correct record count
- [ ] Banner disappears when sync completes
- [ ] Color button disabled during sync
- [ ] Edit button disabled during sync
- [ ] Inactivo button disabled during sync
- [ ] Dar de Baja button disabled during sync
- [ ] Save/Cancel buttons disabled during sync in edit mode
- [ ] Form fields disabled in edit mode during sync
- [ ] Tooltips show on disabled buttons
- [ ] Skeleton loaders appear for syncing records
- [ ] No console errors during sync
- [ ] Smooth animations throughout
- [ ] Works in both light and dark modes

## Implementation Date
February 23, 2026

## Author
Kiro AI Assistant

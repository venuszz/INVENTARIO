# INEA Field History UI Implementation

## Overview
This document describes the implementation of the field history visualization feature in the INEA inventory detail panel. The feature displays a history icon next to fields that have been modified, with a popover showing the complete change history when hovering over the icon.

## Implementation Date
March 3, 2026

## Components Created

### 1. FieldHistoryIcon Component
**Location:** `src/components/consultas/inea/components/FieldHistoryIcon.tsx`

A reusable component that displays a history icon with an interactive popover showing the change history for a specific field.

**Features:**
- History icon (from lucide-react) that appears next to field labels
- Hover-triggered popover with smooth animations (framer-motion)
- Displays chronological list of changes with:
  - Timestamp of change
  - Previous value (in red)
  - New value (in green)
  - Change reason (if available)
- Click-outside detection to close popover
- Responsive design with scrollable content for long histories
- Dark/light mode support

**Props:**
```typescript
interface FieldHistoryIconProps {
  fieldHistory: CambioInventario[];
  isDarkMode: boolean;
}
```

### 2. useFieldHistory Hook
**Location:** `src/components/consultas/inea/hooks/useFieldHistory.ts`

A custom hook that fetches and manages field history data for an inventory item.

**Features:**
- Fetches change history from the database using `obtenerHistorialCambios`
- Groups history by field name for easy lookup
- Tracks which fields have history available
- Handles loading states
- Automatically refetches when item changes

**Returns:**
```typescript
{
  fieldHistory: Record<string, CambioInventario[]>;  // History grouped by field
  fieldsWithHistory: Record<string, boolean>;        // Quick lookup for fields with history
  loading: boolean;                                   // Loading state
}
```

## Integration with DetailPanel

### Modified Components

#### DetailPanel.tsx
**Location:** `src/components/consultas/inea/components/DetailPanel.tsx`

**Changes:**
1. Added imports for new components and hooks
2. Modified `ViewMode` component to use `useFieldHistory` hook
3. Updated `DetailCard` component to support history display
4. Added history props to all relevant DetailCard instances

**DetailCard Interface Updates:**
```typescript
interface DetailCardProps {
  label: string;
  value: string | null | undefined;
  isDarkMode: boolean;
  colSpan2?: boolean;
  isSyncing?: boolean;
  idMueble?: string;        // NEW: UUID of the item
  fieldName?: string;       // NEW: Database field name
  hasHistory?: boolean;     // NEW: Whether field has history
}
```

**Fields with History Tracking:**
- `id_inv` - ID Inventario
- `rubro` - Rubro
- `descripcion` - Descripción
- `valor` - Valor
- `f_adq` - Fecha de Adquisición
- `formadq` - Forma de Adquisición
- `proveedor` - Proveedor
- `factura` - Factura
- `estado` - Estado
- `ubicacion_es` - Estado (Ubicación)
- `ubicacion_mu` - Municipio
- `ubicacion_no` - Nomenclatura
- `id_estatus` - Estatus
- `id_area` - Área
- `id_directorio` - Director/Jefe de Área

## User Experience

### Visual Indicators
- History icon appears in the top-right corner of field labels
- Icon is subtle (40% opacity) and increases to 60% on hover
- Only appears for fields that have recorded changes

### Popover Behavior
- Triggers on hover over the history icon
- Positioned to the right and below the icon
- Maximum height of 96 (24rem) with scrolling for long histories
- Smooth fade-in/fade-out animations
- Stays open while hovering over the popover itself
- Closes when clicking outside or moving mouse away

### Change Display Format
Each change entry shows:
```
[Date and Time]
Anterior: [old value or "vacío"]
Nuevo: [new value or "vacío"]
Motivo: [change reason if available]
```

## Technical Details

### Data Flow
1. `ViewMode` component calls `useFieldHistory(selectedItem.id, 'muebles')`
2. Hook fetches history from `cambios_inventario` table
3. History is grouped by field name
4. `DetailCard` receives field-specific history
5. `FieldHistoryIcon` displays the history in a popover

### Performance Considerations
- History is fetched once per item selection
- Grouped data structure allows O(1) lookup by field name
- Popover content is only rendered when visible
- Smooth animations don't block UI

### Accessibility
- Hover interaction for desktop users
- Clear visual hierarchy in popover
- Color-coded old/new values (red/green)
- Readable timestamps in local format

## Database Schema
Uses the existing `cambios_inventario` table structure:
- `id_mueble`: UUID of the inventory item
- `tabla_origen`: Source table ('muebles' for INEA)
- `campo_modificado`: Field name that was changed
- `valor_anterior`: Previous value
- `valor_nuevo`: New value
- `fecha_cambio`: Timestamp of change
- `metadata`: Additional context including change reason

## Future Enhancements
1. Add filtering by date range in popover
2. Add user information display (who made the change)
3. Export history to PDF/Excel
4. Add comparison view for complex changes
5. Implement similar feature for ITEA and other modules

## Testing Recommendations
1. Test with fields that have no history (icon should not appear)
2. Test with fields that have extensive history (scrolling)
3. Test hover behavior and popover positioning
4. Test in both dark and light modes
5. Test with different screen sizes
6. Verify change reason display when available
7. Test click-outside behavior

## Related Files
- `src/lib/changeHistory.ts` - Change history utilities
- `src/types/changeHistory.ts` - TypeScript types
- `src/app/api/cambios-inventario/route.ts` - API endpoint
- `docs/INEA_CHANGE_HISTORY_IMPLEMENTATION.md` - Original implementation docs

## Notes
- The feature is currently implemented only for INEA general inventory
- Similar implementation can be replicated for ITEA, obsoletos, and other modules
- The popover uses framer-motion for animations, consistent with the rest of the UI
- The implementation follows the existing design system and patterns

# INEA Field History - Visual Guide

## Feature Overview

The field history feature adds a small history icon next to fields that have been modified. When you hover over the icon, a popover appears showing all the changes made to that field.

## Visual Elements

### 1. History Icon
```
┌─────────────────────────────┐
│ RUBRO              [🕐]     │  ← History icon appears here
│ MUEBLES Y ENSERES           │
└─────────────────────────────┘
```

**Appearance:**
- Small clock/history icon (from lucide-react)
- Located in the top-right corner of the field label
- Subtle opacity (40%) that increases on hover (60%)
- Only visible for fields with recorded changes

### 2. Popover Layout
```
┌────────────────────────────────────┐
│ HISTORIAL DE CAMBIOS              │  ← Header
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │ 3 mar 2026, 14:30             │ │  ← Timestamp
│ │                                │ │
│ │ Anterior: MUEBLES              │ │  ← Old value (red)
│ │ Nuevo: MUEBLES Y ENSERES       │ │  ← New value (green)
│ │                                │ │
│ │ Motivo: Corrección de catálogo │ │  ← Change reason
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 1 mar 2026, 10:15             │ │  ← Older change
│ │                                │ │
│ │ Anterior: vacío                │ │
│ │ Nuevo: MUEBLES                 │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

**Popover Features:**
- Width: 320px (80 in Tailwind units)
- Max height: 384px (96 in Tailwind units)
- Scrollable if content exceeds max height
- Positioned to the right and below the icon
- Smooth fade-in/fade-out animation
- Border and shadow for depth

### 3. Change Entry Format

Each change entry in the popover shows:

```
┌────────────────────────────────┐
│ [Date and Time]                │  ← When the change was made
│                                │
│ Anterior: [old value]          │  ← Previous value (red text)
│ Nuevo: [new value]             │  ← New value (green text)
│                                │
│ Motivo: [reason]               │  ← Why it was changed (if provided)
└────────────────────────────────┘
```

## Color Scheme

### Light Mode
- Background: White with subtle black overlay
- Border: Black with 10% opacity
- Old value: Red-600
- New value: Green-600
- Text: Black with varying opacity

### Dark Mode
- Background: Black with subtle white overlay
- Border: White with 10% opacity
- Old value: Red-400
- New value: Green-400
- Text: White with varying opacity

## Interaction Flow

### Step 1: View Detail Panel
```
User selects an item → Detail panel opens → History icons appear
```

### Step 2: Hover Over Icon
```
Mouse enters icon → Popover fades in → History is displayed
```

### Step 3: View History
```
User reads changes → Can scroll if needed → Sees all modifications
```

### Step 4: Close Popover
```
Mouse leaves icon/popover → Popover fades out → Returns to normal view
```

## Example Scenarios

### Scenario 1: Field with Single Change
```
VALOR                    [🕐]
$1,500.00

[Hover over icon]
┌────────────────────────────────┐
│ HISTORIAL DE CAMBIOS          │
├────────────────────────────────┤
│ 3 mar 2026, 14:30             │
│ Anterior: $1,000.00            │
│ Nuevo: $1,500.00               │
│ Motivo: Actualización de valor │
└────────────────────────────────┘
```

### Scenario 2: Field with Multiple Changes
```
ÁREA                     [🕐]
DIRECCIÓN GENERAL

[Hover over icon]
┌────────────────────────────────┐
│ HISTORIAL DE CAMBIOS          │
├────────────────────────────────┤
│ 3 mar 2026, 14:30             │
│ Anterior: ADMINISTRACIÓN       │
│ Nuevo: DIRECCIÓN GENERAL       │
│ Motivo: Reorganización         │
│                                │
│ 1 mar 2026, 10:15             │
│ Anterior: RECURSOS HUMANOS     │
│ Nuevo: ADMINISTRACIÓN          │
│ Motivo: Transferencia          │
│                                │
│ 28 feb 2026, 09:00            │
│ Anterior: vacío                │
│ Nuevo: RECURSOS HUMANOS        │
│ Motivo: Registro inicial       │
└────────────────────────────────┘
```

### Scenario 3: Field with No History
```
PROVEEDOR
OFFICE DEPOT

[No icon appears - field has never been modified]
```

## Responsive Behavior

### Desktop (>1024px)
- Popover appears to the right of the icon
- Full width (320px)
- Smooth animations

### Tablet (768px - 1024px)
- Popover may adjust position to stay on screen
- Same width and functionality

### Mobile (<768px)
- Feature works the same way
- Popover may appear above icon if space is limited
- Touch interaction: tap icon to show, tap outside to close

## Accessibility Notes

1. **Visual Hierarchy**
   - Clear separation between entries
   - Color coding for old/new values
   - Readable font sizes

2. **Interaction**
   - Hover for desktop
   - Tap for mobile
   - Click outside to close

3. **Content**
   - Timestamps in local format
   - Clear labels (Anterior/Nuevo/Motivo)
   - Empty values shown as "vacío"

## Performance

- History is fetched once per item selection
- Popover content only renders when visible
- Smooth 150ms animations
- No impact on page load time

## Browser Compatibility

- Works in all modern browsers
- Requires JavaScript enabled
- Uses CSS Grid and Flexbox
- Framer Motion for animations

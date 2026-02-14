# Resguardos Consultar - Design Redesign Design Document

## Overview
This document outlines the design approach for redesigning the Consultar Resguardos UI to match the Crear Resguardos design while preserving all existing functionality.

## Design Principles

### 1. Zero Logic Changes
All business logic, hooks, state management, and data flow remain completely unchanged. Only JSX structure and styling will be modified.

### 2. Style Pattern Extraction
Extract and apply the following patterns from Crear Resguardos:
- Container backgrounds and gradients
- Border styles and shadows
- Color palette (dark/light mode)
- Typography scale
- Spacing system
- Component composition patterns

### 3. Component-by-Component Approach
Redesign each component individually while maintaining its interface and behavior.

## Design Patterns from Crear Resguardos

### Container Pattern
```tsx
// Main container
<div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${
  isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
}`}>
  <div className={`h-full overflow-y-auto p-4 md:p-8 ${
    isDarkMode 
      ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
      : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
  }`}>
    {/* Content */}
  </div>
</div>
```

### Panel/Card Pattern
```tsx
<div className={`rounded-lg border p-4 ${
  isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/10'
}`}>
  {/* Panel content */}
</div>
```

### Button Pattern
```tsx
// Primary button
<button className={`px-4 py-2 rounded-lg transition-colors ${
  isDarkMode 
    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
    : 'bg-blue-600 hover:bg-blue-700 text-white'
} disabled:opacity-50 disabled:cursor-not-allowed`}>
  {/* Button content */}
</button>

// Secondary button
<button className={`px-4 py-2 rounded-lg border transition-colors ${
  isDarkMode 
    ? 'border-white/10 hover:bg-white/5 text-white' 
    : 'border-black/10 hover:bg-black/5 text-black'
}`}>
  {/* Button content */}
</button>
```

### Input Pattern
```tsx
<input className={`w-full px-3 py-2 rounded-lg border transition-colors ${
  isDarkMode 
    ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-white/30' 
    : 'bg-black/5 border-black/10 text-black placeholder-black/40 focus:border-black/30'
} focus:outline-none focus:ring-2 focus:ring-blue-500/20`} />
```

### Table Pattern
```tsx
<table className="w-full">
  <thead className={`sticky top-0 z-10 ${
    isDarkMode ? 'bg-black/95' : 'bg-white/95'
  }`}>
    <tr className={`border-b ${
      isDarkMode ? 'border-white/10' : 'border-black/10'
    }`}>
      {/* Headers */}
    </tr>
  </thead>
  <tbody>
    {/* Rows */}
  </tbody>
</table>
```

### Modal Pattern
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
  <div className={`max-w-md w-full mx-4 rounded-lg shadow-xl ${
    isDarkMode ? 'bg-gray-900' : 'bg-white'
  }`}>
    {/* Modal content */}
  </div>
</div>
```

## Component Redesign Specifications

### 1. Main Orchestrator (index.tsx)
**Changes:**
- Replace outer container with Crear's full-height pattern
- Add custom scrollbar styles
- Update grid layout to match Crear proportions
- Apply consistent spacing

**Preserve:**
- All hooks initialization
- All event handlers
- All state management
- All effects

### 2. Header Component
**Changes:**
- Match Crear's header typography
- Use consistent color scheme
- Apply same spacing and alignment

**Preserve:**
- Props interface
- Display logic

### 3. SearchBar Component
**Changes:**
- Match Crear's search input styling
- Use consistent icon styling
- Apply same button styles
- Match placeholder and focus states

**Preserve:**
- Search functionality
- Event handlers
- Props interface

### 4. AdvancedFilters Component
**Changes:**
- Match Crear's filter layout
- Use consistent input styling
- Apply same button patterns
- Match dropdown styling

**Preserve:**
- Filter logic
- Event handlers
- Props interface

### 5. ResguardosTable Component
**Changes:**
- Match Crear's table styling
- Use consistent row hover effects
- Apply same header styling
- Match selection states
- Use consistent loading states

**Preserve:**
- Sorting logic
- Selection logic
- Event handlers
- Props interface

### 6. Pagination Component
**Changes:**
- Match Crear's pagination layout
- Use consistent button styling
- Apply same spacing

**Preserve:**
- Pagination logic
- Event handlers
- Props interface

### 7. ResguardoDetailsPanel Component
**Changes:**
- Match Crear's panel card styling
- Use consistent section layouts
- Apply same button styles
- Match information display patterns

**Preserve:**
- Props interface
- Display logic
- Event handlers

### 8. ArticulosListPanel Component
**Changes:**
- Match Crear's list item styling
- Use consistent action button styles
- Apply same grouping patterns
- Match edit mode styling

**Preserve:**
- List logic
- Edit functionality
- Event handlers
- Props interface

### 9. Modal Components
**Changes:**
- Match Crear's modal backdrop
- Use consistent modal container styling
- Apply same button layouts
- Match animation patterns

**Preserve:**
- Modal logic
- Event handlers
- Props interfaces

### 10. ErrorAlert Component
**Changes:**
- Match Crear's alert positioning
- Use consistent alert styling
- Apply same animation

**Preserve:**
- Alert logic
- Props interface

## Color Palette

### Dark Mode
- Background: `bg-black`
- Text: `text-white`
- Borders: `border-white/10`
- Panels: `bg-white/[0.02]`
- Hover: `hover:bg-white/5`
- Input bg: `bg-white/5`
- Placeholder: `placeholder-white/40`

### Light Mode
- Background: `bg-white`
- Text: `text-black`
- Borders: `border-black/10`
- Panels: `bg-black/[0.02]`
- Hover: `hover:bg-black/5`
- Input bg: `bg-black/5`
- Placeholder: `placeholder-black/40`

### Accent Colors
- Primary: `bg-blue-600`, `hover:bg-blue-500` (dark), `hover:bg-blue-700` (light)
- Success: `bg-green-600`
- Error: `bg-red-600`
- Warning: `bg-yellow-600`

## Typography Scale
- Headers: `text-2xl font-bold`
- Subheaders: `text-lg font-semibold`
- Body: `text-sm`
- Labels: `text-xs font-medium`
- Muted: `text-white/60` (dark), `text-black/60` (light)

## Spacing System
- Container padding: `p-4 md:p-8`
- Panel padding: `p-4` or `p-6`
- Section gaps: `space-y-4` or `space-y-6`
- Grid gaps: `gap-6`
- Button padding: `px-4 py-2`

## Responsive Breakpoints
- Mobile: default
- Tablet: `md:` (768px)
- Desktop: `lg:` (1024px)

## Animation Patterns
- Transitions: `transition-colors duration-300`
- Hover: `transition-colors`
- Modal fade: `animate-fade-in`
- Loading: `animate-spin`

## Implementation Strategy

### Phase 1: Main Container
1. Update index.tsx outer container
2. Add scrollbar styles
3. Update grid layout

### Phase 2: List Panel Components
1. Redesign Header
2. Redesign SearchBar
3. Redesign AdvancedFilters
4. Redesign ResguardosTable
5. Redesign Pagination

### Phase 3: Details Panel Components
1. Redesign ResguardoDetailsPanel
2. Redesign ArticulosListPanel

### Phase 4: Modals
1. Redesign DeleteAllModal
2. Redesign DeleteItemModal
3. Redesign DeleteSelectedModal
4. Redesign ErrorAlert

### Phase 5: Polish
1. Verify all responsive behaviors
2. Test dark/light mode transitions
3. Verify all interactive states
4. Test all functionality

## Testing Checklist
- [ ] All existing functionality works
- [ ] Dark mode matches Crear
- [ ] Light mode matches Crear
- [ ] Responsive behavior works
- [ ] All modals display correctly
- [ ] All buttons work
- [ ] All inputs work
- [ ] All hover states work
- [ ] All focus states work
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Success states display correctly

## Correctness Properties

### Property 1: Visual Consistency
**Description:** All UI components in Consultar Resguardos must visually match the corresponding patterns in Crear Resguardos

**Validation:**
- Side-by-side visual comparison
- CSS class inspection
- Color value verification

### Property 2: Functional Preservation
**Description:** All existing functionality must work exactly as before the redesign

**Validation:**
- All user interactions produce same results
- All data displays correctly
- All state changes work as expected

### Property 3: Responsive Behavior
**Description:** Responsive behavior must match Crear Resguardos patterns

**Validation:**
- Test at mobile breakpoint (< 768px)
- Test at tablet breakpoint (768px - 1024px)
- Test at desktop breakpoint (> 1024px)

### Property 4: Theme Consistency
**Description:** Dark and light mode styling must match Crear Resguardos exactly

**Validation:**
- Compare dark mode colors
- Compare light mode colors
- Test theme transitions

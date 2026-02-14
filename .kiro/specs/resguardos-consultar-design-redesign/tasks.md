# Resguardos Consultar - Design Redesign Tasks

## Task List

- [x] 1. Update Main Orchestrator Container
  - [x] 1.1 Replace outer container with Crear's full-height pattern
  - [x] 1.2 Add custom scrollbar styles (inline style tag)
  - [x] 1.3 Update grid layout structure to match Crear
  - [x] 1.4 Update empty state styling in right panel

- [x] 2. Redesign Header Component
  - [x] 2.1 Update typography to match Crear
  - [x] 2.2 Apply consistent color scheme
  - [x] 2.3 Update spacing and alignment
  - [x] 2.4 Match icon styling if present

- [x] 3. Redesign SearchBar Component
  - [x] 3.1 Update input field styling to match Crear
  - [x] 3.2 Update button styles (search, clear, refresh)
  - [x] 3.3 Apply consistent icon styling
  - [x] 3.4 Match placeholder and focus states
  - [x] 3.5 Update container spacing

- [x] 4. Redesign AdvancedFilters Component
  - [x] 4.1 Update filter container styling
  - [x] 4.2 Update input field styles to match Crear
  - [x] 4.3 Update button styles
  - [x] 4.4 Apply consistent spacing
  - [x] 4.5 Match label styling

- [x] 5. Redesign ResguardosTable Component
  - [x] 5.1 Update table container styling
  - [x] 5.2 Update thead styling (sticky header)
  - [x] 5.3 Update row styling and hover effects
  - [x] 5.4 Update selected row styling
  - [x] 5.5 Update sort indicator styling
  - [x] 5.6 Update loading state to match Crear
  - [x] 5.7 Update error state styling
  - [x] 5.8 Update empty state styling

- [x] 6. Redesign Pagination Component
  - [x] 6.1 Update pagination container styling
  - [x] 6.2 Update button styles to match Crear
  - [x] 6.3 Update page number display
  - [x] 6.4 Update rows per page selector
  - [x] 6.5 Apply consistent spacing

- [x] 7. Redesign ResguardoDetailsPanel Component
  - [x] 7.1 Update panel card styling to match Crear
  - [x] 7.2 Update header section styling
  - [x] 7.3 Update information sections layout
  - [x] 7.4 Update action button styles
  - [x] 7.5 Apply consistent spacing
  - [x] 7.6 Update badge/chip styling for resguardantes

- [x] 8. Redesign ArticulosListPanel Component
  - [x] 8.1 Update list container styling
  - [x] 8.2 Update list item styling
  - [x] 8.3 Update action button styles
  - [x] 8.4 Update edit mode styling
  - [x] 8.5 Update selection checkbox styling
  - [x] 8.6 Update group headers (by resguardante)
  - [x] 8.7 Apply consistent spacing

- [x] 9. Redesign DeleteAllModal Component
  - [x] 9.1 Update modal backdrop to match Crear
  - [x] 9.2 Update modal container styling
  - [x] 9.3 Update modal header styling
  - [x] 9.4 Update button layout and styles
  - [x] 9.5 Update text styling

- [x] 10. Redesign DeleteItemModal Component
  - [x] 10.1 Update modal backdrop to match Crear
  - [x] 10.2 Update modal container styling
  - [x] 10.3 Update modal header styling
  - [x] 10.4 Update button layout and styles
  - [x] 10.5 Update text styling

- [x] 11. Redesign DeleteSelectedModal Component
  - [x] 11.1 Update modal backdrop to match Crear
  - [x] 11.2 Update modal container styling
  - [x] 11.3 Update modal header styling
  - [x] 11.4 Update button layout and styles
  - [x] 11.5 Update text styling
  - [x] 11.6 Update selected items list styling

- [x] 12. Redesign ErrorAlert Component
  - [x] 12.1 Update alert positioning to match Crear
  - [x] 12.2 Update alert container styling
  - [x] 12.3 Update icon styling
  - [x] 12.4 Update close button styling
  - [x] 12.5 Update animation

- [x] 13. Update PDF Baja Modal (inline in index.tsx)
  - [x] 13.1 Update modal backdrop to match Crear
  - [x] 13.2 Update modal container styling
  - [x] 13.3 Update button styles
  - [x] 13.4 Update text styling

- [x] 14. Final Polish and Testing
  - [x] 14.1 Verify all components in dark mode
  - [x] 14.2 Verify all components in light mode
  - [x] 14.3 Test responsive behavior at all breakpoints
  - [x] 14.4 Verify all hover states
  - [x] 14.5 Verify all focus states
  - [x] 14.6 Test all functionality (no regressions)
  - [x] 14.7 Verify loading states
  - [x] 14.8 Verify error states
  - [x] 14.9 Test modal interactions
  - [x] 14.10 Verify scrollbar styling

## Implementation Notes

### General Guidelines
- Do NOT modify any hooks or business logic
- Do NOT change any props interfaces
- Do NOT alter any event handlers
- Only update JSX structure and className attributes
- Preserve all existing functionality

### Style Reference
Use `src/components/resguardos/crear/index.tsx` and its components as the style reference for all redesign work.

### Testing Strategy
After each component redesign:
1. Verify visual match with Crear
2. Test all interactions
3. Verify dark/light mode
4. Test responsive behavior

### Common Patterns to Apply

#### Container Pattern
```tsx
<div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${
  isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
}`}>
```

#### Panel Pattern
```tsx
<div className={`rounded-lg border p-4 ${
  isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/10'
}`}>
```

#### Button Pattern (Primary)
```tsx
<button className={`px-4 py-2 rounded-lg transition-colors ${
  isDarkMode 
    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
    : 'bg-blue-600 hover:bg-blue-700 text-white'
} disabled:opacity-50`}>
```

#### Button Pattern (Secondary)
```tsx
<button className={`px-4 py-2 rounded-lg border transition-colors ${
  isDarkMode 
    ? 'border-white/10 hover:bg-white/5 text-white' 
    : 'border-black/10 hover:bg-black/5 text-black'
}`}>
```

#### Input Pattern
```tsx
<input className={`w-full px-3 py-2 rounded-lg border transition-colors ${
  isDarkMode 
    ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-white/30' 
    : 'bg-black/5 border-black/10 text-black placeholder-black/40 focus:border-black/30'
} focus:outline-none focus:ring-2 focus:ring-blue-500/20`} />
```

#### Modal Pattern
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
  <div className={`max-w-md w-full mx-4 rounded-lg shadow-xl ${
    isDarkMode ? 'bg-gray-900' : 'bg-white'
  }`}>
```

## Success Criteria
- All components visually match Crear Resguardos design
- All existing functionality works without regression
- Dark and light modes work correctly
- Responsive behavior matches Crear patterns
- No console errors or warnings
- All interactive states (hover, focus, disabled) work correctly

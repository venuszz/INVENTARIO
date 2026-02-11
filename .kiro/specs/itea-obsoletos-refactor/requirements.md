# ITEA Obsoletos Component Refactoring - Requirements

## Overview
Refactor the ITEA obsoletos (bajas) component to match the architecture, design patterns, and relational data structure of the recently refactored INEA obsoletos component. This includes componentization, custom hooks, relational field handling (area and directorio), and modern UI design.

## Current State Analysis

### Existing Structure
- **File**: `src/components/consultas/itea/obsoletos.tsx`
- **Architecture**: Monolithic component (~1500+ lines)
- **Data Model**: Flat structure with string fields for `area` and `usufinal`
- **Indexation**: Uses `useIteaObsoletosIndexation` hook
- **UI**: Older design pattern with different styling

### Target Structure (Based on INEA Obsoletos)
- **Main Component**: `src/components/consultas/itea/obsoletos/index.tsx`
- **Architecture**: Modular with separated concerns
- **Data Model**: Relational structure with foreign keys and joins
- **Components**: Separated into logical units
- **Hooks**: Custom hooks for data management
- **UI**: Modern design matching INEA obsoletos

## User Stories

### US-1: Component Architecture
**As a** developer  
**I want** the ITEA obsoletos component to follow the same modular architecture as INEA obsoletos  
**So that** the codebase is consistent, maintainable, and easier to understand

**Acceptance Criteria:**
1.1. Main component is located at `src/components/consultas/itea/obsoletos/index.tsx`
1.2. Component is split into logical sub-components in `components/` directory
1.3. Business logic is extracted into custom hooks in `hooks/` directory
1.4. Modals are separated into `modals/` directory
1.5. Shared utilities are in `utils.ts`
1.6. TypeScript types are defined in `types.ts`

### US-2: Relational Data Structure
**As a** developer  
**I want** the ITEA obsoletos component to use relational fields for area and directorio  
**So that** data integrity is maintained and the component matches the database schema

**Acceptance Criteria:**
2.1. `MuebleITEA` interface includes relational fields:
   - `area: { id_area: number; nombre: string } | null`
   - `directorio: { id_directorio: number; nombre: string; puesto: string } | null`
   - `id_area: number | null` (foreign key)
   - `id_directorio: number | null` (foreign key)
2.2. Data fetching uses Supabase joins to populate relational fields
2.3. Display logic uses relational data (e.g., `item.area?.nombre` instead of `item.area`)
2.4. Edit logic updates foreign keys (`id_area`, `id_directorio`)

### US-3: Custom Hooks Extraction
**As a** developer  
**I want** business logic extracted into reusable custom hooks  
**So that** the main component is cleaner and logic is testable

**Acceptance Criteria:**
3.1. `useItemEdit` hook manages item selection, editing, and saving
3.2. `useDirectorManagement` hook handles director CRUD and area assignments
3.3. `useAreaManagement` hook fetches areas and director-area relationships
3.4. `useBajaInfo` hook fetches deprecation information
3.5. `useSearchAndFilters` hook is reused from shared ITEA components

### US-4: Component Separation
**As a** developer  
**I want** UI components separated into logical units  
**So that** each component has a single responsibility

**Acceptance Criteria:**
4.1. `Header` component displays title and realtime toggle
4.2. `ValueStatsPanel` component shows total value and count statistics
4.3. `InventoryTable` component renders the data table
4.4. `DetailPanel` component shows item details (view/edit modes)
4.5. `Pagination` component handles page navigation
4.6. `AnimatedCounter` component (in utils) animates number changes

### US-5: Modal Components
**As a** developer  
**I want** modals separated into individual components  
**So that** modal logic is isolated and reusable

**Acceptance Criteria:**
5.1. `ReactivarModal` confirms item reactivation
5.2. `DirectorModal` handles director area assignment
5.3. `AreaSelectionModal` allows area selection for multi-area directors

### US-6: Modern UI Design
**As a** developer  
**I want** the UI to match the INEA obsoletos design  
**So that** the application has a consistent look and feel

**Acceptance Criteria:**
6.1. Uses Framer Motion for animations
6.2. Implements the same color scheme and spacing
6.3. Uses the same button styles and hover effects
6.4. Implements the same layout structure (grid with detail panel)
6.5. Uses the same loading states and error handling UI

### US-7: Director Management with N:M Relationships
**As a** developer  
**I want** director-area relationships to support N:M (many-to-many)  
**So that** directors can be assigned to multiple areas

**Acceptance Criteria:**
7.1. Fetches directors with their associated areas from `directorio_areas` table
7.2. When selecting a director with no areas, shows modal to assign area
7.3. When selecting a director with multiple areas, shows area selection modal
7.4. When selecting a director with one area, auto-assigns that area
7.5. Updates both `id_directorio` and `id_area` foreign keys

### US-8: Image Handling
**As a** developer  
**I want** image upload and preview to work correctly  
**So that** users can manage item images

**Acceptance Criteria:**
8.1. `ImagePreview` component displays images from Supabase storage
8.2. Image upload supports drag-and-drop and file selection
8.3. Image preview shows before saving
8.4. Images are stored in `muebles.itea` bucket (not `muebles.inea`)
8.5. Image paths are correctly saved to database

### US-9: Reactivation Feature
**As a** developer  
**I want** users to be able to reactivate deprecated items  
**So that** items can be returned to active inventory

**Acceptance Criteria:**
9.1. Reactivate button is visible for admin/superadmin users
9.2. Reactivation modal confirms the action
9.3. Reactivation updates `estatus` to 'ACTIVO'
9.4. Reactivation clears `fechabaja` and `causadebaja`
9.5. Reactivation triggers notification
9.6. Reactivation triggers reindexing

### US-10: Search and Filter Integration
**As a** developer  
**I want** to reuse the existing ITEA search and filter components  
**So that** the search experience is consistent

**Acceptance Criteria:**
10.1. Uses `SearchBar` component from `src/components/consultas/inea/components/`
10.2. Uses `FilterChips` component for active filters
10.3. Uses `SuggestionDropdown` for search suggestions
10.4. Implements omni-search with field matching
10.5. Supports multiple active filters

### US-11: Data Fetching and Indexation
**As a** developer  
**I want** data fetching to use the existing indexation system  
**So that** performance is optimized

**Acceptance Criteria:**
11.1. Uses `useIteaObsoletosIndexation` hook for data
11.2. Displays realtime connection status
11.3. Supports manual reindexing
11.4. Filters work on indexed data
11.5. Pagination works correctly with filtered data

### US-12: Baja Information Display
**As a** developer  
**I want** to display who created the baja record and when  
**So that** users have audit trail information

**Acceptance Criteria:**
12.1. Fetches baja info from `deprecated` table
12.2. Displays creator, timestamp, and motive
12.3. Shows loading state while fetching
12.4. Handles errors gracefully
12.5. Only fetches when item is selected and not editing

## Technical Requirements

### File Structure
```
src/components/consultas/itea/obsoletos/
├── index.tsx                 # Main component
├── types.ts                  # TypeScript interfaces
├── utils.ts                  # Utility functions (formatDate, AnimatedCounter, etc.)
├── components/
│   ├── Header.tsx           # Page header with title
│   ├── ValueStatsPanel.tsx  # Statistics panel
│   ├── InventoryTable.tsx   # Data table
│   ├── DetailPanel.tsx      # Item details panel
│   └── Pagination.tsx       # Pagination controls
├── hooks/
│   ├── useItemEdit.ts       # Item editing logic
│   ├── useDirectorManagement.ts  # Director CRUD
│   ├── useAreaManagement.ts # Area fetching
│   └── useBajaInfo.ts       # Baja info fetching
└── modals/
    ├── ReactivarModal.tsx   # Reactivation confirmation
    ├── DirectorModal.tsx    # Director area assignment
    └── AreaSelectionModal.tsx  # Area selection for directors
```

### Data Model Changes

#### Before (Flat Structure)
```typescript
interface MuebleITEA {
  id: string;
  area: string | null;
  usufinal: string;
  // ... other fields
}
```

#### After (Relational Structure)
```typescript
interface MuebleITEA {
  id: string;
  area: { id_area: number; nombre: string } | null;
  directorio: { id_directorio: number; nombre: string; puesto: string } | null;
  id_area: number | null;
  id_directorio: number | null;
  usufinal: string | null;  // Kept for backward compatibility
  // ... other fields
}
```

### Supabase Query Changes

#### Before
```typescript
const { data } = await supabase
  .from('mueblesitea')
  .select('*')
  .eq('estatus', 'BAJA');
```

#### After
```typescript
const { data } = await supabase
  .from('mueblesitea')
  .select(`
    *,
    area:id_area(id_area, nombre),
    directorio:id_directorio(id_directorio, nombre, puesto)
  `)
  .eq('estatus', 'BAJA');
```

## Dependencies

### Existing Components to Reuse
- `SearchBar` from `src/components/consultas/inea/components/SearchBar.tsx`
- `FilterChips` from `src/components/consultas/inea/components/FilterChips.tsx`
- `SuggestionDropdown` from `src/components/consultas/inea/components/SuggestionDropdown.tsx`
- `SectionRealtimeToggle` from `src/components/SectionRealtimeToggle.tsx`

### Existing Hooks to Reuse
- `useIteaObsoletosIndexation` from `src/hooks/indexation/useIteaObsoletosIndexation.ts`
- `useSearchAndFilters` from `src/components/consultas/inea/hooks/useSearchAndFilters.ts` (adapt for ITEA)
- `useTheme` from `@/context/ThemeContext`
- `useUserRole` from `@/hooks/useUserRole`
- `useNotifications` from `@/hooks/useNotifications`

### External Libraries
- `framer-motion` for animations
- `lucide-react` for icons
- `@supabase/supabase-js` for data fetching

## Migration Strategy

### Phase 1: Setup and Types
1. Create directory structure
2. Define TypeScript types
3. Create utility functions

### Phase 2: Custom Hooks
1. Extract `useItemEdit` hook
2. Extract `useDirectorManagement` hook
3. Extract `useAreaManagement` hook
4. Extract `useBajaInfo` hook

### Phase 3: Components
1. Create `Header` component
2. Create `ValueStatsPanel` component
3. Create `InventoryTable` component
4. Create `DetailPanel` component
5. Create `Pagination` component

### Phase 4: Modals
1. Create `ReactivarModal`
2. Create `DirectorModal`
3. Create `AreaSelectionModal`

### Phase 5: Main Component
1. Refactor main component to use new hooks and components
2. Implement relational data handling
3. Update data fetching queries
4. Integrate all sub-components

### Phase 6: Testing and Cleanup
1. Test all functionality
2. Remove old file
3. Update imports in page component
4. Verify realtime updates work

## Success Criteria

1. ✅ Component follows same architecture as INEA obsoletos
2. ✅ Uses relational data structure for area and directorio
3. ✅ All business logic is in custom hooks
4. ✅ UI matches INEA obsoletos design
5. ✅ Search and filters work correctly
6. ✅ Pagination works correctly
7. ✅ Item editing and saving works
8. ✅ Director management with N:M relationships works
9. ✅ Image upload and preview works
10. ✅ Reactivation feature works
11. ✅ Baja information displays correctly
12. ✅ Realtime updates work
13. ✅ No TypeScript errors
14. ✅ No console errors
15. ✅ All existing functionality is preserved

## Notes

- The ITEA obsoletos component should use the `muebles.itea` storage bucket for images, not `muebles.inea`
- The component should query the `mueblesitea` table, not `mueblesinea`
- The component should use "ITEA Obsoletos" as the section name for realtime toggle
- All text and labels should reference "ITEA" not "INEA"
- The color scheme should match INEA obsoletos but can use ITEA-specific accent colors if needed

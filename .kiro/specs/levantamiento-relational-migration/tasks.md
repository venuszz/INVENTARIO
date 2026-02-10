# Levantamiento Relational Migration - Implementation Tasks

## Task Overview

This task list follows the migration strategy outlined in the design document. Tasks are organized by phase and should be completed in order to ensure a smooth migration from text-based fields to relational database structure.

---

## Phase 1: Type System Updates

### 1. Update Type Definitions
**Priority:** Critical  
**Estimated Time:** 30 minutes

Update all type definitions to support relational structure.

**Subtasks:**
- [x] 1.1 Update LevMueble interface in `types.ts`
  - Add `id_area: number | null`
  - Add `id_directorio: number | null`
  - Add `area: { id_area: number; nombre: string } | null`
  - Add `directorio: { id_directorio: number; nombre: string; puesto: string } | null`
  - Remove `area: string | null`
  - Remove `usufinal: string | null`

- [x] 1.2 Add Area interface in `types.ts`
  - Add `id_area: number`
  - Add `nombre: string`

- [x] 1.3 Update DirectorioOption interface in `types.ts`
  - Ensure `id_directorio: number` exists
  - Ensure `nombre: string` exists
  - Ensure `puesto: string` exists
  - Keep `area: string` for display

- [x] 1.4 Update SearchableData interface in `types.ts`
  - Update comments to reflect area comes from area.nombre
  - Update comments to reflect usufinal comes from directorio.nombre

**Acceptance Criteria:**
- All type definitions match design document
- TypeScript compiler shows errors in affected files (expected)
- No syntax errors in types.ts

---

## Phase 2: Hook Updates

### 2. Update useUnifiedInventory Hook
**Priority:** Critical  
**Estimated Time:** 45 minutes

Update data mapping to preserve relational fields instead of flattening to text.

**Subtasks:**
- [x] 2.1 Update INEA data mapping
  - Preserve `id_area` from source
  - Preserve `id_directorio` from source
  - Preserve `area` nested object from source
  - Preserve `directorio` nested object from source
  - Remove text field mapping

- [x] 2.2 Update ITEA data mapping
  - Preserve `id_area` from source
  - Preserve `id_directorio` from source
  - Preserve `area` nested object from source
  - Preserve `directorio` nested object from source
  - Remove text field mapping

- [x] 2.3 Update TLAXCALA data mapping
  - Preserve `id_area` from source
  - Preserve `id_directorio` from source
  - Preserve `area` nested object from source
  - Preserve `directorio` nested object from source
  - Remove text field mapping

**Acceptance Criteria:**
- No text-based area/usufinal mapping remains
- Relational fields preserved from all three sources
- Type errors resolved in this file
- useMemo dependencies correct

**Files:**
- `src/components/consultas/levantamiento/hooks/useUnifiedInventory.ts`

---

### 3. Create useAreaManagement Hook
**Priority:** High  
**Estimated Time:** 30 minutes

Create new hook to manage area relationships and director-area mappings.

**Subtasks:**
- [x] 3.1 Create hook file
  - Copy implementation from `src/components/consultas/inea/hooks/useAreaManagement.ts`
  - Update imports for levantamiento types

- [x] 3.2 Implement area fetching
  - Fetch all areas from `area` table
  - Order by nombre
  - Store in state

- [x] 3.3 Implement relationship mapping
  - Fetch all records from `directorio_areas` table
  - Build map: `{ [id_directorio: number]: number[] }`
  - Store in state

- [x] 3.4 Return hook interface
  - Return `areas` array
  - Return `directorAreasMap` object

**Acceptance Criteria:**
- Hook matches INEA implementation pattern
- Fetches areas on mount
- Fetches relationships on mount
- Returns correct data structure
- No TypeScript errors

**Files:**
- `src/components/consultas/levantamiento/hooks/useAreaManagement.ts` (NEW)

---

### 4. Update useDirectorManagement Hook
**Priority:** High  
**Estimated Time:** 30 minutes

Update to work with id_directorio instead of text-based matching.

**Subtasks:**
- [x] 4.1 Update fetchDirectorFromDirectorio function
  - Ensure returns objects with `id_directorio`
  - Ensure returns `nombre`, `puesto`, `area`
  - Remove any text-based matching logic

- [x] 4.2 Update saveDirectorData function
  - Accept `id_directorio: number` parameter
  - Accept `nombre: string` parameter
  - Accept `puesto: string` parameter
  - Update directorio table by `id_directorio`
  - Remove text-based update logic

**Acceptance Criteria:**
- All operations use id_directorio
- No text-based matching remains
- Returns full Directorio objects
- Type errors resolved

**Files:**
- `src/components/consultas/levantamiento/hooks/useDirectorManagement.ts`

---

### 5. Update useSearchAndFilters Hook
**Priority:** High  
**Estimated Time:** 45 minutes

Update search and filter logic to use relational fields.

**Subtasks:**
- [x] 5.1 Update searchableData building
  - Extract area from `item.area?.nombre`
  - Extract usufinal from `item.directorio?.nombre`
  - Handle null values with `|| ''`

- [x] 5.2 Update extractSuggestions function
  - Extract area suggestions from `item.area?.nombre`
  - Extract director suggestions from `item.directorio?.nombre`
  - Check for null before adding

- [x] 5.3 Update isCustomPDFEnabled check
  - Check for `item.area?.nombre`
  - Check for `item.directorio?.nombre`
  - Both must exist for PDF to be enabled

**Acceptance Criteria:**
- Search works with relational fields
- Suggestions populate from relational fields
- PDF check uses relational fields
- Null values handled gracefully
- Type errors resolved

**Files:**
- `src/components/consultas/levantamiento/hooks/useSearchAndFilters.ts`

---

## Phase 3: Component Updates

### 6. Update InventoryTable Component
**Priority:** High  
**Estimated Time:** 20 minutes

Update table to display relational data.

**Subtasks:**
- [x] 6.1 Update area column
  - Change `item.area` to `item.area?.nombre`
  - Add fallback: `|| '-'`

- [x] 6.2 Update director column
  - Change `item.usufinal` to `item.directorio?.nombre`
  - Add fallback: `|| '-'`

**Acceptance Criteria:**
- Area displays from area.nombre
- Director displays from directorio.nombre
- Null values show as '-'
- Type errors resolved

**Files:**
- `src/components/consultas/levantamiento/components/InventoryTable.tsx`

---

### 7. Update Main Component (index.tsx)
**Priority:** Critical  
**Estimated Time:** 90 minutes

Add area management logic and director selection flow.

**Subtasks:**
- [x] 7.1 Add useAreaManagement hook
  - Import hook
  - Call hook to get areas and directorAreasMap
  - Store in component

- [x] 7.2 Add area selection state
  - Add `showAreaSelectionModal` state
  - Add `showDirectorModal` state
  - Add `incompleteDirector` state
  - Add `areaOptions` state
  - Add `directorFormData` state
  - Add `savingDirector` state

- [x] 7.3 Update handleAreaPDFClick
  - Filter by `item.area?.nombre` and `item.directorio?.nombre`
  - Extract unique directors with id_directorio
  - Build DirectorioOption objects with relational data

- [x] 7.4 Implement handleDirectorSelect
  - Get director areas from directorAreasMap
  - If 0 areas: show DirectorModal
  - If 1 area: generate PDF directly
  - If multiple areas: show AreaSelectionModal

- [x] 7.5 Implement handleAreaSelect
  - Accept Area parameter
  - Call generatePDFForDirectorAndArea
  - Close modal and reset state

- [x] 7.6 Implement handleSaveDirectorArea
  - Validate area input
  - Find or create area in database
  - Create directorio_areas relationship
  - Generate PDF
  - Close modal and reset state

- [x] 7.7 Implement generatePDFForDirectorAndArea
  - Filter data by area.nombre and directorio.nombre
  - Build metadata object with relational data
  - Call PDF generator with metadata

- [x] 7.8 Add modals to JSX
  - Add AreaSelectionModal component
  - Add DirectorModal component
  - Pass correct props

**Acceptance Criteria:**
- useAreaManagement integrated
- Director selection flow works for 0, 1, multiple areas
- Area creation works
- PDF generation uses relational data
- All modals render correctly
- Type errors resolved

**Files:**
- `src/components/consultas/levantamiento/index.tsx`

---

## Phase 4: Modal Updates

### 8. Update CustomPDFModal
**Priority:** High  
**Estimated Time:** 30 minutes

Update to work with id_directorio.

**Subtasks:**
- [x] 8.1 Update props interface
  - Ensure directorOptions includes id_directorio
  - Update onSelectDirector to pass full DirectorioOption

- [x] 8.2 Update director list rendering
  - Use `director.id_directorio` as key
  - Display `director.nombre`, `director.puesto`, `director.area`
  - Pass full director object to callback

**Acceptance Criteria:**
- Uses id_directorio as key
- Passes full DirectorioOption to callback
- Displays relational data
- Type errors resolved

**Files:**
- `src/components/consultas/levantamiento/modals/CustomPDFModal.tsx`

---

### 9. Update DirectorDataModal
**Priority:** High  
**Estimated Time:** 30 minutes

Update to save by id_directorio.

**Subtasks:**
- [x] 9.1 Update props interface
  - Accept director with id_directorio
  - Update onSave to accept id_directorio parameter

- [x] 9.2 Update save handler
  - Pass id_directorio to save callback
  - Pass nombre and puesto
  - Remove text-based matching

**Acceptance Criteria:**
- Accepts director with id_directorio
- Saves by id_directorio
- Type errors resolved

**Files:**
- `src/components/consultas/levantamiento/modals/DirectorDataModal.tsx`

---

### 10. Create AreaSelectionModal
**Priority:** High  
**Estimated Time:** 45 minutes

Create modal for selecting area when director has multiple areas.

**Subtasks:**
- [x] 10.1 Create modal file
  - Copy from `src/components/consultas/inea/modals/AreaSelectionModal.tsx`
  - Update imports for levantamiento types

- [x] 10.2 Update props interface
  - Accept `show: boolean`
  - Accept `areaOptions: Area[]`
  - Accept `incompleteDirector: DirectorioOption | null`
  - Accept `isDarkMode: boolean`
  - Accept `onClose: () => void`
  - Accept `onSelectArea: (area: Area) => void`

- [x] 10.3 Implement modal UI
  - Display director info (nombre, puesto)
  - List all available areas
  - Make areas clickable
  - Handle area selection

**Acceptance Criteria:**
- Modal matches INEA styling
- Shows director information
- Lists all areas
- Calls onSelectArea with selected area
- Closes on selection
- Type errors resolved

**Files:**
- `src/components/consultas/levantamiento/modals/AreaSelectionModal.tsx` (NEW)

---

### 11. Create DirectorModal
**Priority:** High  
**Estimated Time:** 45 minutes

Create modal for entering area when director has no areas.

**Subtasks:**
- [x] 11.1 Create modal file
  - Copy from `src/components/consultas/inea/modals/DirectorModal.tsx`
  - Update imports for levantamiento types

- [x] 11.2 Update props interface
  - Accept `show: boolean`
  - Accept `incompleteDirector: DirectorioOption | null`
  - Accept `directorFormData: { area: string }`
  - Accept `savingDirector: boolean`
  - Accept `isDarkMode: boolean`
  - Accept `onClose: () => void`
  - Accept `onSave: () => void`
  - Accept `onAreaChange: (area: string) => void`

- [x] 11.3 Implement modal UI
  - Display director info (nombre, puesto)
  - Input field for area name
  - Validation (area required)
  - Save button (disabled if no area)
  - Loading state during save

**Acceptance Criteria:**
- Modal matches INEA styling
- Shows director information
- Area input works
- Validation works
- Save button disabled when invalid
- Loading state shows during save
- Type errors resolved

**Files:**
- `src/components/consultas/levantamiento/modals/DirectorModal.tsx` (NEW)

---

## Phase 5: Export Updates

### 12. Update Excel Export
**Priority:** High  
**Estimated Time:** 30 minutes

Update Excel generation to use relational fields.

**Subtasks:**
- [x] 12.1 Update area column
  - Change to `item.area?.nombre || ''`

- [x] 12.2 Update director column
  - Change to `item.directorio?.nombre || ''`

**Acceptance Criteria:**
- Excel includes area.nombre
- Excel includes directorio.nombre
- Null values handled with empty string
- Export works correctly

**Files:**
- `src/components/consultas/levantamiento/utils.tsx` (or inline in index.tsx)

---

### 13. Update General PDF Export
**Priority:** High  
**Estimated Time:** 30 minutes

Update general PDF export to use relational fields.

**Subtasks:**
- [x] 13.1 Update table data mapping
  - Change area to `item.area?.nombre || ''`
  - Change director to `item.directorio?.nombre || ''`

**Acceptance Criteria:**
- PDF includes area.nombre
- PDF includes directorio.nombre
- Null values handled
- Export works correctly

**Files:**
- `src/components/consultas/levantamiento/utils.tsx`

---

### 14. Update Per-Area PDF Export
**Priority:** Critical  
**Estimated Time:** 45 minutes

Update custom PDF per area to use relational data.

**Subtasks:**
- [x] 14.1 Update function signature
  - Accept metadata object with directorNombre, directorPuesto, areaNombre

- [x] 14.2 Update PDF header
  - Use metadata.areaNombre for title
  - Use metadata.directorNombre for director
  - Use metadata.directorPuesto for puesto

- [x] 14.3 Update table data
  - Data already filtered by parent
  - Just map to table rows

**Acceptance Criteria:**
- Accepts metadata with relational data
- PDF header shows director nombre and puesto
- PDF header shows area nombre
- Export works correctly

**Files:**
- `src/components/consultas/levantamiento/utils.tsx` or `src/components/consultas/PDFLevantamientoPerArea.tsx`

---

## Phase 6: Testing and Validation

### 15. Test Data Display
**Priority:** Critical  
**Estimated Time:** 30 minutes

Verify all data displays correctly with relational fields.

**Subtasks:**
- [x] 15.1 Test INEA data display
  - Verify area names display
  - Verify director names display
  - Check null handling

- [x] 15.2 Test ITEA data display
  - Verify area names display
  - Verify director names display
  - Check null handling

- [x] 15.3 Test TLAXCALA data display
  - Verify area names display
  - Verify director names display
  - Check null handling

**Acceptance Criteria:**
- All three sources display correctly
- Area names from area.nombre
- Director names from directorio.nombre
- Null values show as '-'

---

### 16. Test Search and Filters
**Priority:** High  
**Estimated Time:** 30 minutes

Verify search and filter functionality with relational data.

**Subtasks:**
- [x] 16.1 Test area search
  - Search for area name
  - Verify results match area.nombre
  - Check suggestions

- [x] 16.2 Test director search
  - Search for director name
  - Verify results match directorio.nombre
  - Check suggestions

- [x] 16.3 Test filter combinations
  - Apply multiple filters
  - Verify results correct

**Acceptance Criteria:**
- Search works with relational fields
- Suggestions populate correctly
- Filters work correctly
- Performance acceptable

---

### 17. Test Director Selection Flow
**Priority:** Critical  
**Estimated Time:** 45 minutes

Verify director selection flow for all scenarios.

**Subtasks:**
- [x] 17.1 Test director with 0 areas
  - Select director with no areas
  - Verify DirectorModal shows
  - Enter area name
  - Verify area created
  - Verify relationship created
  - Verify PDF generates

- [x] 17.2 Test director with 1 area
  - Select director with one area
  - Verify PDF generates directly
  - No modal shown

- [x] 17.3 Test director with multiple areas
  - Select director with multiple areas
  - Verify AreaSelectionModal shows
  - Select an area
  - Verify PDF generates

**Acceptance Criteria:**
- All three scenarios work correctly
- Modals show at correct times
- Area creation works
- PDF generation works
- No errors in console

---

### 18. Test Exports
**Priority:** High  
**Estimated Time:** 30 minutes

Verify all export functionality works with relational data.

**Subtasks:**
- [x] 18.1 Test Excel export
  - Export data
  - Open Excel file
  - Verify area column has area.nombre
  - Verify director column has directorio.nombre
  - Check null handling

- [x] 18.2 Test general PDF export
  - Export data
  - Open PDF file
  - Verify area column has area.nombre
  - Verify director column has directorio.nombre
  - Check null handling

- [x] 18.3 Test per-area PDF export
  - Select director and area
  - Generate PDF
  - Verify header has director nombre and puesto
  - Verify header has area nombre
  - Verify data filtered correctly

**Acceptance Criteria:**
- Excel export works
- General PDF export works
- Per-area PDF export works
- All exports include relational data
- Null values handled

---

### 19. Test Edge Cases
**Priority:** Medium  
**Estimated Time:** 30 minutes

Test edge cases and error scenarios.

**Subtasks:**
- [x] 19.1 Test with null areas
  - Load data with null area
  - Verify display shows '-'
  - Verify search works
  - Verify export works

- [x] 19.2 Test with null directors
  - Load data with null directorio
  - Verify display shows '-'
  - Verify search works
  - Verify export works

- [x] 19.3 Test with empty data
  - Clear all data
  - Verify no errors
  - Verify empty state shows

**Acceptance Criteria:**
- Null areas handled gracefully
- Null directors handled gracefully
- Empty data handled gracefully
- No console errors

---

### 20. Final Validation
**Priority:** Critical  
**Estimated Time:** 30 minutes

Final checks before marking migration complete.

**Subtasks:**
- [x] 20.1 TypeScript validation
  - Run TypeScript compiler
  - Verify zero errors
  - Verify no `any` types used

- [x] 20.2 Code review
  - Review all changed files
  - Verify follows INEA/ITEA/no-listado patterns
  - Check for code duplication

- [x] 20.3 Performance check
  - Load large dataset
  - Verify loading time acceptable
  - Verify search responsive
  - Verify exports fast

**Acceptance Criteria:**
- Zero TypeScript errors
- Code follows established patterns
- Performance acceptable
- All features working

---

## Summary

**Total Tasks:** 20  
**Total Subtasks:** 79  
**Estimated Total Time:** 13-15 hours

**Critical Path:**
1. Phase 1: Type Updates (30 min)
2. Phase 2: Hook Updates (2.5 hours)
3. Phase 3: Component Updates (2 hours)
4. Phase 4: Modal Updates (2.5 hours)
5. Phase 5: Export Updates (1.5 hours)
6. Phase 6: Testing (3 hours)

**Dependencies:**
- Phase 2 depends on Phase 1 (types must be updated first)
- Phase 3 depends on Phase 2 (hooks must work before components)
- Phase 4 can be done in parallel with Phase 3
- Phase 5 depends on Phase 1 (types)
- Phase 6 depends on all previous phases


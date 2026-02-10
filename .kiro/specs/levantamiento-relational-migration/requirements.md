# Levantamiento Relational Migration - Requirements

## 1. Overview

### 1.1 Purpose
Migrate the Levantamiento Unificado component from text-based director/area fields to relational database structure using foreign keys (id_directorio, id_area) with JOIN operations, matching the implementation already used in INEA, ITEA, and no-listado modules.

### 1.2 Background
- INEA, ITEA, and no-listado modules already use relational fields with JOINs
- Levantamiento currently uses text fields (area: string, usufinal: string)
- Data comes pre-joined from indexation hooks (useIneaIndexation, useIteaIndexation, useNoListadoIndexation)
- Need to eliminate legacy text fields and use only relational structure

### 1.3 Goals
- Eliminate text-based fields (area, usufinal) from LevMueble type
- Use relational fields (id_area, id_directorio) with nested objects from JOINs
- Adapt all components, hooks, modals to work with relational data
- Update PDF/Excel generators to use relational data
- Maintain consistency with INEA/ITEA/no-listado implementations

---

## 2. User Stories

### 2.1 As a developer
**I want** the Levantamiento component to use the same relational structure as INEA/ITEA/no-listado  
**So that** the codebase is consistent and maintainable

**Acceptance Criteria:**
- LevMueble type matches MuebleINEA/MuebleITEA/MuebleNoListado structure
- No text-based area/usufinal fields remain
- All relational fields (id_area, id_directorio, area object, directorio object) are present

### 2.2 As a user viewing unified inventory
**I want** to see director and area information correctly displayed  
**So that** I can identify who is responsible for each item

**Acceptance Criteria:**
- Director name displays from directorio.nombre (not usufinal text)
- Area name displays from area.nombre (not area text)
- All existing functionality continues to work

### 2.3 As a user filtering inventory
**I want** to filter by area and director using the relational data  
**So that** I can find items by organizational structure

**Acceptance Criteria:**
- Search by area uses area.nombre from JOIN
- Search by director uses directorio.nombre from JOIN
- Filters work correctly with relational data
- Suggestions populate from relational data

### 2.4 As a user exporting data
**I want** PDF and Excel exports to include correct director/area information  
**So that** reports are accurate and complete

**Acceptance Criteria:**
- Excel exports show director name from directorio.nombre
- Excel exports show area name from area.nombre
- PDF exports show director name and puesto from directorio object
- PDF exports show area name from area object
- Custom PDF per area works with relational data

### 2.5 As an admin managing directors
**I want** to update director information using the relational structure  
**So that** changes propagate correctly across the system

**Acceptance Criteria:**
- DirectorDataModal works with id_directorio
- CustomPDFModal selects directors by id_directorio
- Director updates use directorio table
- Area selection uses area table and directorio_areas relationships

---

## 3. Functional Requirements

### 3.1 Type System Migration

#### 3.1.1 LevMueble Type Update
**Priority:** Critical  
**Description:** Update LevMueble interface to match relational structure

**Requirements:**
- Remove: `area: string | null`
- Remove: `usufinal: string | null`
- Add: `id_area: number | null`
- Add: `id_directorio: number | null`
- Add: `area: { id_area: number; nombre: string } | null`
- Add: `directorio: { id_directorio: number; nombre: string; puesto: string } | null`
- Keep: `origen: 'INEA' | 'ITEA' | 'TLAXCALA'`

#### 3.1.2 DirectorioOption Type Update
**Priority:** High  
**Description:** Ensure DirectorioOption matches INEA/ITEA/no-listado structure

**Requirements:**
- Must have: `id_directorio: number`
- Must have: `nombre: string`
- Must have: `puesto: string`
- Must have: `area: string` (for display/filtering purposes)

#### 3.1.3 Area Type Addition
**Priority:** High  
**Description:** Add Area interface if not present

**Requirements:**
- Must have: `id_area: number`
- Must have: `nombre: string`

### 3.2 Hook Updates

#### 3.2.1 useUnifiedInventory Hook
**Priority:** Critical  
**Description:** Update data mapping to preserve relational fields

**Requirements:**
- Map INEA data preserving: id_area, id_directorio, area object, directorio object
- Map ITEA data preserving: id_area, id_directorio, area object, directorio object
- Map TLAXCALA data preserving: id_area, id_directorio, area object, directorio object
- Remove any text-based area/usufinal mapping
- Ensure type compatibility with new LevMueble interface

#### 3.2.2 useDirectorManagement Hook
**Priority:** High  
**Description:** Update to work with relational director data

**Requirements:**
- fetchDirectorFromDirectorio returns full Directorio objects with id_directorio
- Fuzzy matching works on directorio.nombre (not usufinal text)
- Area matching works on area.nombre (not area text)
- saveDirectorData updates directorio table by id_directorio

#### 3.2.3 useSearchAndFilters Hook
**Priority:** High  
**Description:** Update search/filter logic for relational data

**Requirements:**
- Search by area uses `item.area?.nombre` instead of `item.area`
- Search by director uses `item.directorio?.nombre` instead of `item.usufinal`
- Suggestions extract from `area.nombre` and `directorio.nombre`
- Filter matching uses relational field values
- isCustomPDFEnabled checks for `area.nombre` and `directorio.nombre`

#### 3.2.4 useAreaManagement Hook (NEW)
**Priority:** High  
**Description:** Add hook to manage area relationships (like INEA/ITEA/no-listado)

**Requirements:**
- Fetch all areas from area table
- Fetch directorio_areas relationships
- Build directorAreasMap: `{ [id_directorio: number]: number[] }`
- Return areas array and directorAreasMap

### 3.3 Component Updates

#### 3.3.1 InventoryTable Component
**Priority:** High  
**Description:** Display relational data in table

**Requirements:**
- Display `item.area?.nombre` in area column (not `item.area`)
- Display `item.directorio?.nombre` in director column (not `item.usufinal`)
- Handle null values gracefully
- Maintain sorting functionality with relational fields

#### 3.3.2 SearchBar Component
**Priority:** Medium  
**Description:** Update search to work with relational data

**Requirements:**
- Search suggestions use `area.nombre` and `directorio.nombre`
- Search matching uses relational field values
- Maintain existing UX

#### 3.3.3 FilterChips Component
**Priority:** Low  
**Description:** Display filter chips with relational data

**Requirements:**
- Show area name from relational data
- Show director name from relational data
- Maintain existing styling

### 3.4 Modal Updates

#### 3.4.1 CustomPDFModal
**Priority:** Critical  
**Description:** Adapt to use relational director selection

**Requirements:**
- Accept `directorOptions: DirectorioOption[]` (with id_directorio)
- Display director selection by id_directorio
- Handle director selection with id_directorio
- Pass director data with id_directorio to parent
- Show area name from area.nombre
- Show director name from directorio.nombre

#### 3.4.2 DirectorDataModal
**Priority:** High  
**Description:** Update to work with id_directorio

**Requirements:**
- Accept director with id_directorio
- Update director by id_directorio in directorio table
- Validate nombre and puesto fields
- Return updated director with id_directorio

#### 3.4.3 AreaSelectionModal (NEW)
**Priority:** High  
**Description:** Add modal for selecting area when director has multiple areas

**Requirements:**
- Display list of areas for selected director
- Allow user to select one area
- Return selected area with id_area
- Match INEA/ITEA/no-listado implementation

#### 3.4.4 DirectorModal (NEW)
**Priority:** High  
**Description:** Add modal for entering area when director has no areas

**Requirements:**
- Allow user to enter area name
- Create area in area table if doesn't exist
- Create directorio_areas relationship
- Return area with id_area
- Match INEA/ITEA/no-listado implementation

### 3.5 Main Component Updates

#### 3.5.1 index.tsx Orchestrator
**Priority:** Critical  
**Description:** Update main component to use relational data flow

**Requirements:**
- Initialize useAreaManagement hook
- Handle director selection by id_directorio
- Check directorAreasMap for area relationships
- Show AreaSelectionModal when director has multiple areas
- Show DirectorModal when director has no areas
- Pass relational data to all child components
- Update handleAreaPDFClick to use relational data

### 3.6 Export Functionality

#### 3.6.1 Excel Export
**Priority:** High  
**Description:** Update Excel generation to use relational data

**Requirements:**
- Extract area name from `item.area?.nombre`
- Extract director name from `item.directorio?.nombre`
- Handle null values with empty strings
- Maintain existing column structure

#### 3.6.2 PDF Export (General)
**Priority:** High  
**Description:** Update general PDF export to use relational data

**Requirements:**
- Extract area name from `item.area?.nombre`
- Extract director name from `item.directorio?.nombre`
- Handle null values gracefully
- Maintain existing layout

#### 3.6.3 PDF Export (Per Area)
**Priority:** Critical  
**Description:** Update custom PDF per area to use relational data

**Requirements:**
- Filter by `item.area?.nombre` (not text field)
- Filter by `item.directorio?.nombre` (not text field)
- Extract director nombre and puesto from directorio object
- Pass relational data to generatePDFPerArea
- Validate data has required relational fields

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Data mapping in useUnifiedInventory must not cause performance degradation
- Search/filter operations must remain fast with relational data
- PDF/Excel generation time must not increase significantly

### 4.2 Compatibility
- Must work with existing database schema (already has relational fields)
- Must work with existing indexation hooks (already provide JOINed data)
- Must maintain backward compatibility during migration

### 4.3 Code Quality
- Follow existing patterns from INEA/ITEA/no-listado implementations
- Maintain TypeScript type safety throughout
- Keep code DRY - reuse patterns from other modules
- Add appropriate error handling for null relational data

### 4.4 Testing
- Verify all search/filter operations work with relational data
- Test PDF/Excel exports with various data scenarios
- Test director selection flow with 0, 1, and multiple areas
- Verify null handling for missing relational data

---

## 5. Constraints

### 5.1 Technical Constraints
- Must use existing database schema (no schema changes)
- Must work with data from useIneaIndexation, useIteaIndexation, useNoListadoIndexation
- Must maintain existing component structure
- Cannot break existing INEA/ITEA/no-listado functionality

### 5.2 Business Constraints
- No downtime during migration
- Must maintain all existing features
- User experience must remain consistent

---

## 6. Dependencies

### 6.1 Internal Dependencies
- useIneaIndexation hook (provides JOINed data)
- useIteaIndexation hook (provides JOINed data)
- useNoListadoIndexation hook (provides JOINed data)
- MuebleINEA, MuebleITEA, MuebleNoListado types
- INEA/ITEA/no-listado modal implementations (reference)

### 6.2 External Dependencies
- Supabase client (for director/area queries)
- jsPDF (for PDF generation)
- ExcelJS (for Excel generation)

---

## 7. Success Criteria

### 7.1 Migration Complete When:
- [ ] All text-based fields removed from LevMueble type
- [ ] All components use relational data
- [ ] All modals work with id_directorio and id_area
- [ ] All exports use relational data
- [ ] Search and filters work with relational data
- [ ] No TypeScript errors
- [ ] All existing functionality works

### 7.2 Quality Metrics:
- Zero regression in existing features
- Type safety maintained (no `any` types)
- Code follows existing patterns from INEA/ITEA/no-listado
- Performance remains acceptable

---

## 8. Out of Scope

### 8.1 Not Included:
- Database schema changes (already correct)
- Changes to indexation hooks (already provide JOINed data)
- Changes to INEA/ITEA/no-listado modules
- New features beyond relational migration
- UI/UX redesign

---

## 9. Risks and Mitigation

### 9.1 Risk: Data Loss During Migration
**Mitigation:** Data already exists in relational format; no data migration needed

### 9.2 Risk: Breaking Existing Functionality
**Mitigation:** Follow proven patterns from INEA/ITEA/no-listado; thorough testing

### 9.3 Risk: Performance Degradation
**Mitigation:** Data already JOINed by indexation hooks; no additional queries needed

### 9.4 Risk: Type Errors
**Mitigation:** Update types first; use TypeScript compiler to find all affected code

---

## 10. Acceptance Testing

### 10.1 Test Scenarios

#### Scenario 1: View Unified Inventory
- **Given:** User opens Levantamiento page
- **When:** Data loads
- **Then:** Director names display from directorio.nombre
- **And:** Area names display from area.nombre

#### Scenario 2: Search by Director
- **Given:** User is on Levantamiento page
- **When:** User searches for a director name
- **Then:** Results show items where directorio.nombre matches
- **And:** Suggestions populate from directorio.nombre

#### Scenario 3: Filter by Area
- **Given:** User is on Levantamiento page
- **When:** User filters by area
- **Then:** Results show items where area.nombre matches
- **And:** Filter chips display area.nombre

#### Scenario 4: Export to Excel
- **Given:** User has filtered inventory data
- **When:** User clicks Excel export
- **Then:** Excel file contains director names from directorio.nombre
- **And:** Excel file contains area names from area.nombre

#### Scenario 5: Export to PDF (General)
- **Given:** User has filtered inventory data
- **When:** User clicks PDF export
- **Then:** PDF contains director names from directorio.nombre
- **And:** PDF contains area names from area.nombre

#### Scenario 6: Export to PDF (Per Area)
- **Given:** User has filtered by area and director
- **When:** User clicks PDF export
- **Then:** CustomPDFModal shows director options with id_directorio
- **And:** User can select director
- **And:** PDF generates with correct director nombre and puesto

#### Scenario 7: Director with Multiple Areas
- **Given:** User selects a director with multiple areas
- **When:** Generating custom PDF
- **Then:** AreaSelectionModal appears
- **And:** User can select one area
- **And:** PDF generates for selected area

#### Scenario 8: Director with No Areas
- **Given:** User selects a director with no areas
- **When:** Generating custom PDF
- **Then:** DirectorModal appears
- **And:** User can enter area name
- **And:** Area is created/linked
- **And:** PDF generates successfully

---

## 11. Glossary

- **Relational Fields:** Database foreign keys (id_area, id_directorio) that reference other tables
- **JOINed Data:** Data fetched with SQL JOIN operations, returning nested objects
- **Legacy Fields:** Old text-based fields (area: string, usufinal: string) to be removed
- **DirectorioOption:** Interface representing a director with id, name, position, and area
- **LevMueble:** Unified inventory item type combining INEA, ITEA, and TLAXCALA data

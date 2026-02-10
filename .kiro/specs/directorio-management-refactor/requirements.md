# Directorio Management Refactor - Requirements

## 1. Overview

### 1.1 Feature Summary
Refactor and enhance the Directorio (Personnel Directory) management component to be more scalable, maintainable, and debugable. Add advanced functionality for managing resguardantes (custodians) with hierarchical validation, goods reassignment workflows, and active custody document management.

### 1.2 Business Context
The Directorio module manages personnel who can be assigned as directors or custodians (resguardantes) of inventory items. The system must ensure data integrity by preventing deletion or modification of personnel who have active custody documents (resguardos) or assigned goods, while providing workflows to properly reassign goods before removal.

### 1.3 User Personas
- **Admin Users**: Can perform all CRUD operations on personnel, manage goods reassignment, and handle custody documents
- **Regular Users (Usuario)**: Limited access, cannot modify certain critical data

## 2. User Stories

### 2.1 Core Refactoring

**US-2.1.1: As a developer, I want the directorio component properly componentized**
- **Given** the current monolithic directorio.tsx component
- **When** I refactor the code
- **Then** the component should be split into logical sub-components, hooks, and modals
- **And** follow the established project structure pattern (components/, hooks/, modals/, types.ts)
- **And** improve code maintainability and debugability

**US-2.1.2: As a developer, I want a dedicated hook for resguardante statistics**
- **Given** the need to track resguardos and goods per resguardante
- **When** I create useDirectorioStats hook
- **Then** it should calculate:
  - `resguardos`: Number of active custody documents (unique folios with assigned goods)
  - `bienesACargo`: Number of goods assigned to the resguardante (via key_resguardante)
- **And** provide real-time updates when data changes
- **And** cache results for performance

### 2.2 Personnel Management

**US-2.2.1: As an admin, I want to add new personnel to the directory**
- **Given** I am on the directorio management page
- **When** I click "Agregar empleado"
- **Then** I should see an inline form to enter:
  - Nombre (required, auto-uppercase)
  - Puesto (optional, auto-uppercase)
  - Áreas (minimum 1 required, supports multiple)
- **And** I can create new areas on-the-fly by typing and pressing Enter
- **And** the form validates that at least one area is assigned
- **And** upon save, the employee is added to the database
- **And** the form closes automatically

**US-2.2.2: As an admin, I want to search and filter personnel**
- **Given** I am viewing the personnel list
- **When** I type in the search bar
- **Then** results should filter by:
  - Employee name
  - Position (puesto)
  - ID
  - Assigned areas
- **And** matching areas should be visually highlighted
- **And** the search should be case-insensitive
- **And** show count of filtered vs total employees

### 2.3 Edit Personnel with Validation

**US-2.3.1: As an admin, I want to edit personnel without active resguardos**
- **Given** an employee with NO active custody documents (resguardos === 0)
- **When** I click the edit button
- **Then** I should see an inline edit form with current data pre-filled
- **And** I can modify nombre, puesto, and áreas
- **And** I can add/remove areas
- **And** changes are saved to the database
- **And** the form closes automatically after save

**US-2.3.2: As an admin, I want to be blocked from editing personnel with active resguardos**
- **Given** an employee with active custody documents (resguardos > 0)
- **When** I click the edit button
- **Then** I should see the ResguardosActiveModal
- **And** the modal should display:
  - List of active resguardos (folio, date, goods count)
  - Split view with resguardo details on left
  - Goods details on right (when a resguardo is selected)
  - For each good: inventory number, description, physical state, category
- **And** I should see options to:
  - Close the modal (cancel operation)
  - Navigate to "Gestionar Bajas" (/resguardos/consultar)
- **And** the edit operation should be blocked

### 2.4 Delete Personnel with Hierarchical Validation

**US-2.4.1: As an admin, I want to delete personnel without restrictions**
- **Given** an employee with NO active resguardos (resguardos === 0)
- **And** NO assigned goods (bienesACargo === 0)
- **When** I click the delete button
- **Then** I should see the DeleteModal with:
  - Warning icon
  - Employee data (name, position, areas)
  - "Esta acción no se puede deshacer" message
- **When** I confirm deletion
- **Then** the employee should be deleted from the database
- **And** show success state with checkmark for 1.5 seconds
- **And** the modal closes automatically
- **And** the list refreshes

**US-2.4.2: As an admin, I want to be blocked from deleting personnel with active resguardos**
- **Given** an employee with active custody documents (resguardos > 0)
- **When** I click the delete button
- **Then** I should see the ResguardosActiveModal (same as US-2.3.2)
- **And** the delete operation should be blocked
- **And** I must navigate to manage custody documents first

**US-2.4.3: As an admin, I want to reassign goods before deleting personnel**
- **Given** an employee with NO active resguardos (resguardos === 0)
- **But** WITH assigned goods (bienesACargo > 0)
- **When** I click the delete button
- **Then** I should see the BienesACargoModal with two sequential views

**View 1: Information**
- Show alert: "X bienes a cargo"
- Display employee data (name, position, areas)
- Options:
  - "Cerrar" → Cancel operation
  - "Reasignar Bienes" → Start reassignment flow

**View 2: Reassignment Interface**
- **Given** I clicked "Reasignar Bienes"
- **Then** the system should:
  - Load all goods assigned to this employee
  - Pre-select ALL goods by default
  - Load available resguardantes (excluding current employee)
- **And** display a split interface:
  - Left panel (1/3 width): SelectedBienesPanel
    - List of goods with checkboxes
    - Individual toggle selection
    - "Limpiar selección" button
  - Right panel (2/3 width): Resguardante Selector
    - Search bar (filter by name, position, area)
    - Selected resguardante display
    - List of available resguardantes
- **And** footer showing: "X bienes seleccionados"
- **And** buttons: [Cancelar] [Confirmar Reasignación]
- **And** validation requires:
  - At least 1 good selected
  - 1 resguardante destination selected

**US-2.4.4: As an admin, I want to confirm goods reassignment**
- **Given** I have selected goods and a destination resguardante
- **When** I click "Confirmar Reasignación"
- **Then** I should see the ReassignmentConfirmModal showing:
  - Origin resguardante
  - Destination resguardante
  - Quantity of goods
- **When** I confirm
- **Then** the system should:
  1. Validate destination resguardante exists
  2. Validate goods exist
  3. Execute batch UPDATE: `goods SET key_resguardante = newId WHERE id IN (...)`
  4. Verify post-update that all goods were updated correctly
  5. Show success notification
  6. Refresh statistics
- **And** check if all goods were reassigned:
  - If YES (bienesACargo === 0): Automatically show DeleteModal to complete deletion
  - If NO (remaining goods): Close modal, user must repeat for remaining goods

### 2.5 Area Management Integration

**US-2.5.1: As an admin, I want to create areas on-the-fly**
- **Given** I am adding or editing an employee
- **When** I type a new area name and press Enter
- **Then** the system should:
  - Check if area already exists (case-insensitive)
  - If exists: Add to employee's area selection
  - If new: Create area in database, then add to selection
- **And** the area should be available for other employees immediately

**US-2.5.2: As an admin, I want to manage multiple areas per employee**
- **Given** I am editing an employee
- **When** I view their areas
- **Then** I should see all assigned areas as chips/tags
- **And** I can remove areas by clicking X on the chip
- **And** I can add new areas via the input field
- **And** the system maintains the N:M relationship via directorio_areas table

## 3. Acceptance Criteria

### 3.1 Component Structure
- [ ] Component follows established pattern: `src/components/admin/directorio/`
- [ ] Subdirectories: `components/`, `hooks/`, `modals/`, `types.ts`
- [ ] Main orchestrator: `index.tsx`
- [ ] All sub-components are properly typed
- [ ] No prop drilling beyond 2 levels

### 3.2 Statistics Hook
- [ ] `useDirectorioStats` hook created
- [ ] Returns `Map<id_directorio, { resguardos: number, bienesACargo: number }>`
- [ ] Queries `resguardos` table for active folios count
- [ ] Queries `goods` table for goods count via `key_resguardante`
- [ ] Updates automatically with realtime changes
- [ ] Implements caching/memoization

### 3.3 Validation Hierarchy
- [ ] PRIORITY 1: resguardos > 0 → Block edit AND delete → Show ResguardosActiveModal
- [ ] PRIORITY 2: resguardos === 0 AND bienesACargo > 0 → Block delete only → Show BienesACargoModal
- [ ] PRIORITY 3: resguardos === 0 AND bienesACargo === 0 → Allow edit AND delete

### 3.4 Modals Implementation
- [ ] AddEditModal: Create/edit with modes ('add' | 'edit')
- [ ] DeleteModal: Confirmation with 3 states (confirm → loading → success)
- [ ] ResguardosActiveModal: Split view (resguardos list | goods details)
- [ ] BienesACargoModal: Two views (info → reassignment)
- [ ] ReassignmentConfirmModal: Final confirmation before batch update

### 3.5 Data Integrity
- [ ] Cannot delete employee with active resguardos
- [ ] Cannot delete employee with assigned goods (without reassignment)
- [ ] Can edit employee with goods but no resguardos
- [ ] Batch reassignment validates all goods updated correctly
- [ ] Referential integrity maintained across all operations

### 3.6 User Experience
- [ ] Search filters by name, position, ID, and areas
- [ ] Matching areas highlighted in search results
- [ ] Inline forms for add/edit (no separate page)
- [ ] Smooth animations with framer-motion
- [ ] Loading states for all async operations
- [ ] Success/error notifications (NO notification system integration per requirement)
- [ ] Responsive design (mobile + desktop)

### 3.7 Performance
- [ ] Statistics calculated efficiently (single query per table)
- [ ] Results memoized/cached
- [ ] Realtime updates don't cause full re-renders
- [ ] Large lists virtualized if needed
- [ ] Debounced search input

### 3.8 Accessibility
- [ ] All buttons have proper labels
- [ ] Modals have proper ARIA attributes
- [ ] Keyboard navigation works throughout
- [ ] Focus management in modals
- [ ] Screen reader friendly

## 4. Technical Requirements

### 4.1 Dependencies
- React 18+
- Next.js 14+
- Supabase client
- Zustand (adminStore)
- Framer Motion
- Lucide React (icons)
- TypeScript

### 4.2 Database Schema
```sql
-- Existing tables (no changes)
directorio (
  id_directorio SERIAL PRIMARY KEY,
  nombre TEXT,
  area TEXT,  -- Deprecated, kept for backward compatibility
  puesto TEXT
)

area (
  id_area SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE
)

directorio_areas (
  id SERIAL PRIMARY KEY,
  id_directorio INTEGER REFERENCES directorio(id_directorio) ON DELETE CASCADE,
  id_area INTEGER REFERENCES area(id_area) ON DELETE CASCADE,
  UNIQUE(id_directorio, id_area)
)

goods (
  id UUID PRIMARY KEY,
  key_resguardante INTEGER REFERENCES directorio(id_directorio),
  -- other fields...
)

resguardos (
  id SERIAL PRIMARY KEY,
  folio TEXT UNIQUE,
  id_directorio INTEGER REFERENCES directorio(id_directorio),
  -- other fields...
)
```

### 4.3 API Endpoints
- All operations use `/api/supabase-proxy` with appropriate targets
- No new endpoints required
- Existing Supabase RLS policies apply

### 4.4 State Management
- Use existing `adminStore` from Zustand
- Use existing `useAdminIndexation` hook for realtime data
- New `useDirectorioStats` hook for statistics
- Local component state for UI (modals, forms, etc.)

## 5. Out of Scope

### 5.1 Explicitly Excluded
- ❌ Notification system integration (removed per requirement #7)
- ❌ Navigation to /resguardos/consultar (future feature per requirement #3)
  - **Instead**: Show FutureFeatureModal when "Gestionar Bajas" button is clicked
- ❌ SelectedBienesPanel component (future feature per requirement #4)
- ❌ Bulk operations (select multiple employees)
- ❌ Import/export functionality
- ❌ Audit log/history
- ❌ Permission system changes
- ❌ Database schema modifications

### 5.2 Future Feature Modal
- ✅ Generic FutureFeatureModal component to inform users about incomplete features
- ✅ Shows when buttons for future features are clicked
- ✅ Displays feature name, description, and "coming soon" message
- ✅ Provides clear user feedback without breaking the flow

### 5.2 Future Enhancements
- Advanced filtering (by area, position, status)
- Sorting options
- Pagination for large datasets
- Employee profiles with detailed information
- Integration with HR systems
- Photo/avatar support

## 6. Risks and Mitigations

### 6.1 Data Integrity Risks
**Risk**: Goods reassignment fails partially (some goods updated, others not)
**Mitigation**: 
- Use transaction-like verification
- Query all goods after update to verify
- Rollback UI state if verification fails
- Show clear error messages

### 6.2 Performance Risks
**Risk**: Statistics calculation slow with large datasets
**Mitigation**:
- Use indexed queries (key_resguardante, id_directorio)
- Implement caching with TTL
- Consider database views for complex queries
- Lazy load statistics (only when needed)

### 6.3 UX Risks
**Risk**: Complex reassignment flow confuses users
**Mitigation**:
- Clear step-by-step UI
- Helpful tooltips and labels
- Confirmation modals before destructive actions
- Ability to cancel at any step

## 7. Success Metrics

### 7.1 Code Quality
- Component complexity reduced by 60%
- Test coverage > 80%
- No prop drilling beyond 2 levels
- All TypeScript strict mode compliant

### 7.2 Performance
- Statistics load < 500ms
- Search results < 200ms
- Modal transitions smooth (60fps)
- No memory leaks

### 7.3 User Satisfaction
- Zero data integrity issues
- Reduced support tickets for personnel management
- Positive feedback on reassignment workflow
- Faster task completion times

## 8. Dependencies and Assumptions

### 8.1 Dependencies
- Existing adminStore and useAdminIndexation working correctly
- Supabase realtime subscriptions active
- User authentication and authorization in place
- Existing modal patterns established in project

### 8.2 Assumptions
- Users have stable internet connection for realtime updates
- Database has proper indexes on foreign keys
- Supabase RLS policies allow required operations
- Users understand the concept of resguardos and goods assignment

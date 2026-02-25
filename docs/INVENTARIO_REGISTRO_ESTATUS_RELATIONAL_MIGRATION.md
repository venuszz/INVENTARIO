# Inventario Registro - Estatus Relational Migration

## Overview
Migrated the Inventario Registro component to use relational `id_estatus` foreign key instead of plain text `estatus` field, following the same pattern implemented in INEA, ITEA, and No Listado modules.

## Changes Made

### 1. Type Definitions (`types.ts`)
- Added `id_estatus: number | null` to `FormData` interface
- Added `estatusWithIds: { id: number; concepto: string }[]` to `FilterOptions` interface
- Kept legacy `estatus: string` field for backward compatibility and display

### 2. Filter Options Hook (`useFilterOptions.ts`)
- Updated to fetch estatus from `config` table with IDs:
  ```typescript
  const { data: estatusData } = await supabase
    .from('config')
    .select('id, concepto')
    .eq('tipo', 'estatus')
    .order('concepto');
  ```
- Stores both `estatus` (text array) and `estatusWithIds` (with IDs)
- Maintains fallback to legacy text values if config table is empty

### 3. Form Data Hook (`useFormData.ts`)
- Added `id_estatus: null` to `initialFormData`
- Updated `handleChange` to convert `id_estatus` string to number:
  ```typescript
  if (name === 'id_estatus') {
    newValue = value ? parseInt(value, 10) : null;
  }
  ```

### 4. Step2LocationStatus Component
- Enhanced `CustomSelect` component to support `optionsWithIds`:
  - Added `optionsWithIds?: Array<{ id: number; concepto: string }>` prop
  - Added `onSelectWithId?: (id: number, value: string) => void` callback
  - Updated filtering logic to handle estatus with IDs
  - Updated rendering to display estatus options from `optionsWithIds`

- Created `handleEstatusChange` function:
  ```typescript
  const handleEstatusChange = (id: number, concepto: string) => {
    // Update display value
    onChange({ target: { name: 'estatus', value: concepto } });
    // Update ID
    onChange({ target: { name: 'id_estatus', value: id.toString() } });
  };
  ```

- Updated estatus select to use both callbacks:
  ```typescript
  <CustomSelect
    value={formData.estatus}
    options={filterOptions.estatus}
    optionsWithIds={filterOptions.estatusWithIds}
    onChange={(value) => handleSelectChange('estatus', value)}
    onSelectWithId={handleEstatusChange}
    placeholder="Seleccionar estatus..."
  />
  ```

### 5. Form Submission (`RegistroBienesForm.tsx`)
- Added validation for `id_estatus`:
  ```typescript
  if (formData.estatus && !formData.id_estatus) {
    throw new Error('Error al procesar el estatus seleccionado');
  }
  ```

- Updated `dataToSave` to include both fields:
  ```typescript
  const dataToSave = {
    // ... other fields
    estatus: formData.estatus.toUpperCase(), // Legacy field
    id_estatus: formData.id_estatus, // Relational ID
    // ... other fields
  };
  ```

## Database Schema
The component now saves to the `id_estatus` column which references `config(id)`:
- `muebles.id_estatus` → `config.id` (tipo='estatus')
- `mueblesitea.id_estatus` → `config.id` (tipo='estatus')
- `mueblestlaxcala.id_estatus` → `config.id` (tipo='estatus')

## Backward Compatibility
- Legacy `estatus` text field is still saved for backward compatibility
- Display logic uses `estatus` text field
- Form validation works with both fields
- Fallback to legacy text values if config table is empty

## User Experience
- Users select estatus from dropdown as before
- Behind the scenes, both text and ID are saved
- No visible changes to the UI
- Validation ensures ID is saved when estatus is selected

## Testing Checklist
- [x] TypeScript diagnostics pass
- [ ] Form loads with estatus options from config table
- [ ] Selecting estatus updates both `estatus` and `id_estatus` fields
- [ ] Form submission saves `id_estatus` to database
- [ ] Legacy `estatus` field is still saved
- [ ] Validation prevents submission without estatus ID
- [ ] Works for all three institutions (INEA, ITEA, TLAXCALA)
- [ ] Fallback to legacy values works if config table is empty

## Next Steps
After completing Inventario Registro, need to migrate:
1. Resguardos Crear component
2. Reportes INEA component
3. Reportes ITEA component
4. Reportes Tlaxcala component

## Related Files
- `src/components/inventario/registro/RegistroBienesForm.tsx`
- `src/components/inventario/registro/steps/Step2LocationStatus.tsx`
- `src/components/inventario/registro/hooks/useFilterOptions.ts`
- `src/components/inventario/registro/hooks/useFormData.ts`
- `src/components/inventario/registro/types.ts`

# Levantamiento Relational Migration - Design Document

## 1. Architecture Overview

### 1.1 Migration Strategy
This migration transforms the Levantamiento component from text-based fields to relational database structure, following the proven patterns already implemented in INEA, ITEA, and no-listado modules.

**Key Principle:** Data already comes pre-joined from indexation hooks, so the migration focuses on:
- Updating type definitions to match relational structure
- Adapting components to use nested objects (area, directorio)
- Removing legacy text field references
- Implementing area management logic

### 1.2 Data Flow
```
useIneaIndexation     → JOINed data with area/directorio objects
useIteaIndexation     → JOINed data with area/directorio objects  
useNoListadoIndexation → JOINed data with area/directorio objects
         ↓
useUnifiedInventory   → Preserves relational structure
         ↓
LevMueble[]          → Unified data with relational fields
         ↓
Components           → Display area.nombre, directorio.nombre
```

### 1.3 Component Architecture
```
index.tsx (Main Orchestrator)
├── useUnifiedInventory (data aggregation)
├── useAreaManagement (NEW - area/director relationships)
├── useDirectorManagement (director operations)
├── useSearchAndFilters (search/filter logic)
├── InventoryTable (display)
├── SearchBar (search UI)
├── ExportButtons (Excel/PDF)
└── Modals
    ├── CustomPDFModal (PDF per area)
    ├── DirectorDataModal (edit director)
    ├── AreaSelectionModal (NEW - select from multiple areas)
    └── DirectorModal (NEW - enter area for director)
```


## 2. Type System Design

### 2.1 LevMueble Interface (Updated)

**Location:** `src/components/consultas/levantamiento/types.ts`

```typescript
export interface LevMueble {
  id: string; // UUID
  id_inv: string;
  rubro: string | null;
  descripcion: string | null;
  valor: number | string | null;
  f_adq: string | null;
  formadq: string | null;
  proveedor: string | null;
  factura: string | null;
  ubicacion_es: string | null;
  ubicacion_mu: string | null;
  ubicacion_no: string | null;
  estado: string | null;
  estatus: string | null;
  
  // RELATIONAL FIELDS (NEW)
  id_area: number | null;
  id_directorio: number | null;
  area: { id_area: number; nombre: string } | null;
  directorio: { id_directorio: number; nombre: string; puesto: string } | null;
  
  // REMOVE: area: string | null
  // REMOVE: usufinal: string | null
  
  fechabaja: string | null;
  causadebaja: string | null;
  resguardante: string | null;
  image_path: string | null;
  origen: 'INEA' | 'ITEA' | 'TLAXCALA';
}
```

**Changes:**
- Add `id_area: number | null`
- Add `id_directorio: number | null`
- Add `area: { id_area: number; nombre: string } | null`
- Add `directorio: { id_directorio: number; nombre: string; puesto: string } | null`
- Remove `area: string | null`
- Remove `usufinal: string | null`

### 2.2 Area Interface (NEW)

```typescript
export interface Area {
  id_area: number;
  nombre: string;
}
```

### 2.3 DirectorioOption Interface (Updated)

```typescript
export interface DirectorioOption {
  id_directorio: number;
  nombre: string;
  puesto: string;
  area: string; // For display purposes
}
```

### 2.4 SearchableData Interface (Updated)

```typescript
export interface SearchableData {
  id: string[];
  area: string[];        // Now from area.nombre
  usufinal: string[];    // Now from directorio.nombre
  resguardante: string[];
  descripcion: string[];
  rubro: string[];
  estado: string[];
  estatus: string[];
}
```


## 3. Hook Designs

### 3.1 useUnifiedInventory Hook

**Location:** `src/components/consultas/levantamiento/hooks/useUnifiedInventory.ts`

**Purpose:** Aggregate data from three sources (INEA, ITEA, TLAXCALA) and preserve relational structure

**Current Implementation Issues:**
- Maps to text fields: `area: item.area?.nombre || null`
- Maps to text fields: `usufinal: item.directorio?.nombre || null`

**Updated Implementation:**
```typescript
export function useUnifiedInventory() {
  const ineaData = useIneaStore(state => state.data);
  const iteaData = useIteaStore(state => state.data);
  const noListadoData = useNoListadoStore(state => state.data);

  const unifiedData = useMemo(() => {
    const combined: LevMueble[] = [];

    // Map INEA data - PRESERVE relational fields
    ineaData.forEach(item => {
      combined.push({
        ...item,
        origen: 'INEA',
        // Preserve relational fields
        id_area: item.id_area,
        id_directorio: item.id_directorio,
        area: item.area,           // Keep nested object
        directorio: item.directorio // Keep nested object
      });
    });

    // Map ITEA data - PRESERVE relational fields
    iteaData.forEach(item => {
      combined.push({
        ...item,
        origen: 'ITEA',
        valor: typeof item.valor === 'string' ? parseFloat(item.valor) : item.valor,
        // Preserve relational fields
        id_area: item.id_area,
        id_directorio: item.id_directorio,
        area: item.area,           // Keep nested object
        directorio: item.directorio // Keep nested object
      });
    });

    // Map TLAXCALA data - PRESERVE relational fields
    noListadoData.forEach(item => {
      combined.push({
        ...item,
        origen: 'TLAXCALA',
        valor: typeof item.valor === 'string' ? parseFloat(item.valor) : item.valor,
        // Preserve relational fields
        id_area: item.id_area,
        id_directorio: item.id_directorio,
        area: item.area,           // Keep nested object
        directorio: item.directorio // Keep nested object
      });
    });

    return combined;
  }, [ineaData, iteaData, noListadoData]);

  return unifiedData;
}
```

**Key Changes:**
- Remove text field mapping
- Preserve `id_area`, `id_directorio` from source
- Preserve `area` and `directorio` nested objects
- No flattening to text

### 3.2 useAreaManagement Hook (NEW)

**Location:** `src/components/consultas/levantamiento/hooks/useAreaManagement.ts`

**Purpose:** Manage area relationships and director-area mappings

**Implementation Pattern:** Follow INEA implementation exactly

```typescript
import { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { Area } from '../types';

export function useAreaManagement() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [directorAreasMap, setDirectorAreasMap] = useState<{ [id_directorio: number]: number[] }>({});

  useEffect(() => {
    async function fetchAreasAndRelations() {
      // Fetch all areas
      const { data: areasData } = await supabase
        .from('area')
        .select('*')
        .order('nombre');

      setAreas(areasData || []);

      // Fetch directorio_areas relationships
      const { data: rels } = await supabase
        .from('directorio_areas')
        .select('*');

      if (rels) {
        const map: { [id_directorio: number]: number[] } = {};
        rels.forEach((rel: { id_directorio: number; id_area: number }) => {
          if (!map[rel.id_directorio]) map[rel.id_directorio] = [];
          map[rel.id_directorio].push(rel.id_area);
        });
        setDirectorAreasMap(map);
      }
    }

    fetchAreasAndRelations();
  }, []);

  return { areas, directorAreasMap };
}
```

**Returns:**
- `areas`: Array of all areas from database
- `directorAreasMap`: Map of director IDs to their area IDs


### 3.3 useDirectorManagement Hook

**Location:** `src/components/consultas/levantamiento/hooks/useDirectorManagement.ts`

**Current Issues:**
- Uses text-based matching
- Doesn't work with id_directorio

**Updated Implementation:**
```typescript
export function useDirectorManagement() {
  const fetchDirectorFromDirectorio = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('directorio')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      if (data) {
        // Return full Directorio objects with id_directorio
        return data.map(item => ({
          id_directorio: item.id_directorio,
          nombre: item.nombre?.trim().toUpperCase() || '',
          area: item.area?.trim().toUpperCase() || '',
          puesto: item.puesto?.trim().toUpperCase() || ''
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching directores:', error);
      return [];
    }
  }, []);

  const saveDirectorData = useCallback(async (
    id_directorio: number,
    nombre: string,
    puesto: string
  ) => {
    try {
      const { error } = await supabase
        .from('directorio')
        .update({
          nombre: nombre.trim().toUpperCase(),
          puesto: puesto.trim().toUpperCase()
        })
        .eq('id_directorio', id_directorio);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving director:', error);
      return false;
    }
  }, []);

  return { fetchDirectorFromDirectorio, saveDirectorData };
}
```

**Key Changes:**
- Return objects with `id_directorio`
- Update by `id_directorio` instead of text matching
- Remove fuzzy text matching logic

### 3.4 useSearchAndFilters Hook

**Location:** `src/components/consultas/levantamiento/hooks/useSearchAndFilters.ts`

**Current Issues:**
- Searches `item.area` (text field)
- Searches `item.usufinal` (text field)

**Updated Implementation:**

```typescript
// Build searchable data from relational fields
const searchableData = useMemo<SearchableData>(() => {
  return {
    id: data.map(item => item.id_inv?.toLowerCase() || ''),
    area: data.map(item => item.area?.nombre?.toLowerCase() || ''),        // FROM area.nombre
    usufinal: data.map(item => item.directorio?.nombre?.toLowerCase() || ''), // FROM directorio.nombre
    resguardante: data.map(item => item.resguardante?.toLowerCase() || ''),
    descripcion: data.map(item => item.descripcion?.toLowerCase() || ''),
    rubro: data.map(item => item.rubro?.toLowerCase() || ''),
    estado: data.map(item => item.estado?.toLowerCase() || ''),
    estatus: data.map(item => item.estatus?.toLowerCase() || '')
  };
}, [data]);

// Extract suggestions from relational fields
const extractSuggestions = useCallback((items: LevMueble[]): Suggestion[] => {
  const suggestions: Suggestion[] = [];
  const seen = new Set<string>();

  items.forEach(item => {
    // Area suggestions from area.nombre
    if (item.area?.nombre && !seen.has(item.area.nombre.toLowerCase())) {
      suggestions.push({ value: item.area.nombre, type: 'area' });
      seen.add(item.area.nombre.toLowerCase());
    }

    // Director suggestions from directorio.nombre
    if (item.directorio?.nombre && !seen.has(item.directorio.nombre.toLowerCase())) {
      suggestions.push({ value: item.directorio.nombre, type: 'usufinal' });
      seen.add(item.directorio.nombre.toLowerCase());
    }

    // ... other fields
  });

  return suggestions;
}, []);

// Check if custom PDF is enabled (has area and director)
const isCustomPDFEnabled = useMemo(() => {
  return filteredData.some(item => 
    item.area?.nombre && item.directorio?.nombre
  );
}, [filteredData]);
```

**Key Changes:**
- Extract from `item.area?.nombre` instead of `item.area`
- Extract from `item.directorio?.nombre` instead of `item.usufinal`
- Update PDF check to use relational fields


## 4. Component Designs

### 4.1 Main Component (index.tsx)

**Location:** `src/components/consultas/levantamiento/index.tsx`

**Key Updates:**

```typescript
export default function LevantamientoUnificado() {
  // ... existing state ...
  
  // ADD: Area management hook
  const { areas, directorAreasMap } = useAreaManagement();
  
  // State for area selection flow
  const [showAreaSelectionModal, setShowAreaSelectionModal] = useState(false);
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [incompleteDirector, setIncompleteDirector] = useState<DirectorioOption | null>(null);
  const [areaOptions, setAreaOptions] = useState<Area[]>([]);
  const [directorFormData, setDirectorFormData] = useState({ area: '' });

  // Handle area PDF click with relational logic
  const handleAreaPDFClick = useCallback(() => {
    // Filter by area.nombre and directorio.nombre
    const itemsWithAreaAndDirector = filteredData.filter(
      item => item.area?.nombre && item.directorio?.nombre
    );

    if (itemsWithAreaAndDirector.length === 0) {
      setMessage({ type: 'warning', text: 'No hay datos con área y director asignados' });
      return;
    }

    // Extract unique directors with id_directorio
    const uniqueDirectors = Array.from(
      new Map(
        itemsWithAreaAndDirector
          .filter(item => item.directorio)
          .map(item => [
            item.id_directorio,
            {
              id_directorio: item.id_directorio!,
              nombre: item.directorio!.nombre,
              puesto: item.directorio!.puesto,
              area: item.area!.nombre
            }
          ])
      ).values()
    );

    setDirectorOptions(uniqueDirectors);
    setShowCustomPDFModal(true);
  }, [filteredData]);

  // Handle director selection for PDF
  const handleDirectorSelect = useCallback((director: DirectorioOption) => {
    const directorAreas = directorAreasMap[director.id_directorio] || [];

    if (directorAreas.length === 0) {
      // No areas - show DirectorModal
      setIncompleteDirector(director);
      setShowDirectorModal(true);
    } else if (directorAreas.length === 1) {
      // One area - use it directly
      const selectedArea = areas.find(a => a.id_area === directorAreas[0]);
      if (selectedArea) {
        generatePDFForDirectorAndArea(director, selectedArea);
      }
    } else {
      // Multiple areas - show AreaSelectionModal
      const availableAreas = areas.filter(a => directorAreas.includes(a.id_area));
      setAreaOptions(availableAreas);
      setIncompleteDirector(director);
      setShowAreaSelectionModal(true);
    }
  }, [directorAreasMap, areas]);

  // Handle area selection from modal
  const handleAreaSelect = useCallback((area: Area) => {
    if (incompleteDirector) {
      generatePDFForDirectorAndArea(incompleteDirector, area);
      setShowAreaSelectionModal(false);
      setIncompleteDirector(null);
    }
  }, [incompleteDirector]);

  // Save director area from DirectorModal
  const handleSaveDirectorArea = useCallback(async () => {
    if (!incompleteDirector || !directorFormData.area) return;

    setSavingDirector(true);
    try {
      // Find or create area
      let areaId: number;
      const existingArea = areas.find(
        a => a.nombre.toLowerCase() === directorFormData.area.toLowerCase()
      );

      if (existingArea) {
        areaId = existingArea.id_area;
      } else {
        // Create new area
        const { data: newArea, error: areaError } = await supabase
          .from('area')
          .insert({ nombre: directorFormData.area.toUpperCase() })
          .select()
          .single();

        if (areaError) throw areaError;
        areaId = newArea.id_area;
      }

      // Create directorio_areas relationship
      const { error: relError } = await supabase
        .from('directorio_areas')
        .insert({
          id_directorio: incompleteDirector.id_directorio,
          id_area: areaId
        });

      if (relError) throw relError;

      // Generate PDF
      const selectedArea = { id_area: areaId, nombre: directorFormData.area.toUpperCase() };
      generatePDFForDirectorAndArea(incompleteDirector, selectedArea);

      setShowDirectorModal(false);
      setIncompleteDirector(null);
      setDirectorFormData({ area: '' });
    } catch (error) {
      console.error('Error saving director area:', error);
      setMessage({ type: 'error', text: 'Error al guardar el área del director' });
    } finally {
      setSavingDirector(false);
    }
  }, [incompleteDirector, directorFormData, areas]);

  // Generate PDF for director and area
  const generatePDFForDirectorAndArea = useCallback((
    director: DirectorioOption,
    area: Area
  ) => {
    // Filter by area.nombre and directorio.nombre
    const itemsForPDF = filteredData.filter(
      item => 
        item.area?.nombre === area.nombre &&
        item.directorio?.nombre === director.nombre
    );

    if (itemsForPDF.length === 0) {
      setMessage({ type: 'warning', text: 'No hay datos para este director y área' });
      return;
    }

    // Pass relational data to PDF generator
    generatePDFPerArea(itemsForPDF, {
      directorNombre: director.nombre,
      directorPuesto: director.puesto,
      areaNombre: area.nombre
    });

    setShowCustomPDFModal(false);
  }, [filteredData]);

  return (
    <>
      {/* ... existing JSX ... */}
      
      {/* NEW: Area Selection Modal */}
      <AreaSelectionModal
        show={showAreaSelectionModal}
        areaOptions={areaOptions}
        incompleteDirector={incompleteDirector}
        isDarkMode={isDarkMode}
        onClose={() => {
          setShowAreaSelectionModal(false);
          setIncompleteDirector(null);
        }}
        onSelectArea={handleAreaSelect}
      />

      {/* NEW: Director Modal */}
      <DirectorModal
        show={showDirectorModal}
        incompleteDirector={incompleteDirector}
        directorFormData={directorFormData}
        savingDirector={savingDirector}
        isDarkMode={isDarkMode}
        onClose={() => {
          setShowDirectorModal(false);
          setIncompleteDirector(null);
          setDirectorFormData({ area: '' });
        }}
        onSave={handleSaveDirectorArea}
        onAreaChange={(area) => setDirectorFormData({ area })}
      />
    </>
  );
}
```

**Key Changes:**
- Add `useAreaManagement` hook
- Add area selection flow state
- Update `handleAreaPDFClick` to use relational fields
- Add `handleDirectorSelect` with area logic
- Add `handleAreaSelect` callback
- Add `handleSaveDirectorArea` callback
- Add new modals to JSX


### 4.2 InventoryTable Component

**Location:** `src/components/consultas/levantamiento/components/InventoryTable.tsx`

**Current Issues:**
- Displays `item.area` (text field)
- Displays `item.usufinal` (text field)

**Updated Implementation:**

```typescript
// Area column
<td className="...">
  {item.area?.nombre || '-'}  {/* FROM area.nombre */}
</td>

// Director column
<td className="...">
  {item.directorio?.nombre || '-'}  {/* FROM directorio.nombre */}
</td>
```

**Key Changes:**
- Change `item.area` to `item.area?.nombre`
- Change `item.usufinal` to `item.directorio?.nombre`
- Add null safety with optional chaining

### 4.3 SearchBar Component

**Location:** `src/components/consultas/levantamiento/components/SearchBar.tsx`

**No structural changes needed** - component receives suggestions from parent, which are now built from relational fields in `useSearchAndFilters`

### 4.4 ExportButtons Component

**Location:** `src/components/consultas/levantamiento/components/ExportButtons.tsx`

**No changes needed** - component just triggers export callbacks


## 5. Modal Designs

### 5.1 CustomPDFModal

**Location:** `src/components/consultas/levantamiento/modals/CustomPDFModal.tsx`

**Current Issues:**
- Works with text-based director data
- No id_directorio handling

**Updated Props:**
```typescript
interface CustomPDFModalProps {
  show: boolean;
  directorOptions: DirectorioOption[];  // Now includes id_directorio
  isDarkMode: boolean;
  onClose: () => void;
  onSelectDirector: (director: DirectorioOption) => void;  // Pass full object
}
```

**Updated Implementation:**
```typescript
// Display directors with id_directorio
{directorOptions.map((director) => (
  <button
    key={director.id_directorio}  // Use id_directorio as key
    onClick={() => onSelectDirector(director)}
    className="..."
  >
    <div>
      <span>{director.nombre}</span>
      <span>{director.puesto}</span>
    </div>
    <span>{director.area}</span>
  </button>
))}
```

**Key Changes:**
- Use `id_directorio` as key
- Pass full `DirectorioOption` object to callback
- Display relational data

### 5.2 DirectorDataModal

**Location:** `src/components/consultas/levantamiento/modals/DirectorDataModal.tsx`

**Current Issues:**
- Updates by text matching
- No id_directorio handling

**Updated Props:**
```typescript
interface DirectorDataModalProps {
  show: boolean;
  director: DirectorioOption | null;  // Includes id_directorio
  isDarkMode: boolean;
  onClose: () => void;
  onSave: (id_directorio: number, nombre: string, puesto: string) => void;
}
```

**Updated Implementation:**
```typescript
const handleSave = () => {
  if (!director || !formData.nombre || !formData.puesto) return;
  
  // Save by id_directorio
  onSave(director.id_directorio, formData.nombre, formData.puesto);
};
```

**Key Changes:**
- Accept director with `id_directorio`
- Pass `id_directorio` to save callback
- Remove text-based matching

### 5.3 AreaSelectionModal (NEW)

**Location:** `src/components/consultas/levantamiento/modals/AreaSelectionModal.tsx`

**Purpose:** Allow user to select one area when director has multiple areas

**Implementation:** Copy from INEA implementation

```typescript
interface AreaSelectionModalProps {
  show: boolean;
  areaOptions: Area[];
  incompleteDirector: DirectorioOption | null;
  isDarkMode: boolean;
  onClose: () => void;
  onSelectArea: (area: Area) => void;
}

export default function AreaSelectionModal({
  show,
  areaOptions,
  incompleteDirector,
  isDarkMode,
  onClose,
  onSelectArea
}: AreaSelectionModalProps) {
  // Display director info
  // List available areas
  // Handle area selection
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="...">
          {/* Header with director info */}
          {/* List of areas to select */}
          {/* Each area is clickable button */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Key Features:**
- Shows director name and puesto
- Lists all available areas for that director
- Calls `onSelectArea` with selected Area object
- Matches INEA styling and UX

### 5.4 DirectorModal (NEW)

**Location:** `src/components/consultas/levantamiento/modals/DirectorModal.tsx`

**Purpose:** Allow user to enter area name when director has no areas

**Implementation:** Copy from INEA implementation

```typescript
interface DirectorModalProps {
  show: boolean;
  incompleteDirector: DirectorioOption | null;
  directorFormData: { area: string };
  savingDirector: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onSave: () => void;
  onAreaChange: (area: string) => void;
}

export default function DirectorModal({
  show,
  incompleteDirector,
  directorFormData,
  savingDirector,
  isDarkMode,
  onClose,
  onSave,
  onAreaChange
}: DirectorModalProps) {
  // Display director info
  // Input for area name
  // Save button (disabled if no area)
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="...">
          {/* Header */}
          {/* Director info display */}
          {/* Area input field */}
          {/* Save/Cancel buttons */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Key Features:**
- Shows director name and puesto
- Text input for area name
- Validation (area required)
- Loading state during save
- Matches INEA styling and UX


## 6. Export Functionality Design

### 6.1 Excel Export

**Location:** `src/components/consultas/levantamiento/utils.tsx` (or inline in index.tsx)

**Current Issues:**
- Exports `item.area` (text field)
- Exports `item.usufinal` (text field)

**Updated Implementation:**

```typescript
export const generateExcel = async (data: LevMueble[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Levantamiento');

  // ... headers ...

  data.forEach(item => {
    worksheet.addRow([
      item.id_inv,
      item.descripcion || '',
      item.rubro || '',
      item.valor || '',
      item.f_adq || '',
      item.formadq || '',
      item.proveedor || '',
      item.factura || '',
      item.ubicacion_es || '',
      item.ubicacion_mu || '',
      item.ubicacion_no || '',
      item.estado || '',
      item.estatus || '',
      item.area?.nombre || '',           // FROM area.nombre
      item.directorio?.nombre || '',     // FROM directorio.nombre
      item.resguardante || '',
      item.fechabaja || '',
      item.causadebaja || '',
      item.origen
    ]);
  });

  // ... styling and download ...
};
```

**Key Changes:**
- Change `item.area` to `item.area?.nombre`
- Change `item.usufinal` to `item.directorio?.nombre`
- Handle null with `|| ''`

### 6.2 PDF Export (General)

**Location:** `src/components/consultas/levantamiento/utils.tsx`

**Current Issues:**
- Uses `item.area` (text field)
- Uses `item.usufinal` (text field)

**Updated Implementation:**

```typescript
export const generatePDF = (data: LevMueble[]) => {
  const doc = new jsPDF('landscape');
  
  // ... setup ...

  const tableData = data.map(item => [
    item.id_inv,
    item.descripcion || '',
    item.rubro || '',
    item.area?.nombre || '',           // FROM area.nombre
    item.directorio?.nombre || '',     // FROM directorio.nombre
    item.estado || '',
    item.estatus || '',
    item.origen
  ]);

  autoTable(doc, {
    head: [['ID', 'Descripción', 'Rubro', 'Área', 'Director', 'Estado', 'Estatus', 'Origen']],
    body: tableData,
    // ... styling ...
  });

  doc.save('levantamiento.pdf');
};
```

**Key Changes:**
- Change `item.area` to `item.area?.nombre`
- Change `item.usufinal` to `item.directorio?.nombre`

### 6.3 PDF Export (Per Area)

**Location:** `src/components/consultas/levantamiento/utils.tsx` or `src/components/consultas/PDFLevantamientoPerArea.tsx`

**Current Issues:**
- Receives text-based director data
- Filters by text fields

**Updated Implementation:**

```typescript
export const generatePDFPerArea = (
  data: LevMueble[],
  metadata: {
    directorNombre: string;
    directorPuesto: string;
    areaNombre: string;
  }
) => {
  const doc = new jsPDF('landscape');

  // Header with relational data
  doc.setFontSize(16);
  doc.text(`Levantamiento - ${metadata.areaNombre}`, 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Director: ${metadata.directorNombre}`, 14, 30);
  doc.text(`Puesto: ${metadata.directorPuesto}`, 14, 37);

  // Table data from relational fields
  const tableData = data.map(item => [
    item.id_inv,
    item.descripcion || '',
    item.rubro || '',
    item.valor || '',
    item.estado || '',
    item.estatus || '',
    item.origen
  ]);

  autoTable(doc, {
    head: [['ID', 'Descripción', 'Rubro', 'Valor', 'Estado', 'Estatus', 'Origen']],
    body: tableData,
    startY: 45,
    // ... styling ...
  });

  doc.save(`levantamiento_${metadata.areaNombre}_${metadata.directorNombre}.pdf`);
};
```

**Key Changes:**
- Accept metadata object with relational data
- Use `directorNombre`, `directorPuesto`, `areaNombre` from metadata
- Data already filtered by relational fields in parent


## 7. Database Schema (Reference)

### 7.1 Existing Tables

**No schema changes needed** - database already has relational structure

#### muebles (INEA)
```sql
- id: uuid (PK)
- id_inv: text
- id_area: integer (FK → area.id_area)
- id_directorio: integer (FK → directorio.id_directorio)
- ... other fields ...
```

#### mueblesitea (ITEA)
```sql
- id: uuid (PK)
- id_inv: text
- id_area: integer (FK → area.id_area)
- id_directorio: integer (FK → directorio.id_directorio)
- ... other fields ...
```

#### mueblestlaxcala (No Listado)
```sql
- id: uuid (PK)
- id_inv: text
- id_area: integer (FK → area.id_area)
- id_directorio: integer (FK → directorio.id_directorio)
- ... other fields ...
```

#### area
```sql
- id_area: integer (PK)
- nombre: text
```

#### directorio
```sql
- id_directorio: integer (PK)
- nombre: text
- puesto: text
- area: text (legacy field, not used)
```

#### directorio_areas (N:M relationship)
```sql
- id_directorio: integer (FK → directorio.id_directorio)
- id_area: integer (FK → area.id_area)
- PRIMARY KEY (id_directorio, id_area)
```

### 7.2 JOIN Queries (Already Implemented in Indexation Hooks)

**useIneaIndexation:**
```sql
SELECT 
  muebles.*,
  area.id_area,
  area.nombre as area_nombre,
  directorio.id_directorio,
  directorio.nombre as directorio_nombre,
  directorio.puesto as directorio_puesto
FROM muebles
LEFT JOIN area ON muebles.id_area = area.id_area
LEFT JOIN directorio ON muebles.id_directorio = directorio.id_directorio
```

**useIteaIndexation:** (same pattern for mueblesitea)

**useNoListadoIndexation:** (same pattern for mueblestlaxcala)

**Result Structure:**
```typescript
{
  id: "uuid",
  id_inv: "string",
  id_area: 1,
  id_directorio: 2,
  area: { id_area: 1, nombre: "ADMINISTRACIÓN" },
  directorio: { id_directorio: 2, nombre: "JUAN PÉREZ", puesto: "DIRECTOR" },
  // ... other fields
}
```


## 8. Migration Strategy

### 8.1 Migration Steps

**Phase 1: Type Updates**
1. Update `LevMueble` interface in `types.ts`
2. Add `Area` interface
3. Update `DirectorioOption` interface
4. Update `SearchableData` interface

**Phase 2: Hook Updates**
1. Update `useUnifiedInventory` to preserve relational fields
2. Create `useAreaManagement` hook (copy from INEA)
3. Update `useDirectorManagement` to work with id_directorio
4. Update `useSearchAndFilters` to use relational fields

**Phase 3: Component Updates**
1. Update `InventoryTable` to display relational data
2. Update main `index.tsx` with area management logic
3. Add area selection flow handlers

**Phase 4: Modal Updates**
1. Update `CustomPDFModal` props and implementation
2. Update `DirectorDataModal` props and implementation
3. Create `AreaSelectionModal` (copy from INEA)
4. Create `DirectorModal` (copy from INEA)

**Phase 5: Export Updates**
1. Update Excel export to use relational fields
2. Update general PDF export to use relational fields
3. Update per-area PDF export to use relational data

**Phase 6: Testing**
1. Test data loading and display
2. Test search and filters
3. Test director selection flow (0, 1, multiple areas)
4. Test Excel export
5. Test PDF exports (general and per-area)
6. Test director data editing

### 8.2 Rollback Strategy

**If migration fails:**
1. Revert type changes
2. Restore text field mapping in `useUnifiedInventory`
3. Restore text-based search in `useSearchAndFilters`
4. Remove new modals
5. Restore old export logic

**Data safety:**
- No database changes needed
- No data migration needed
- All changes are code-only
- Can revert via git

### 8.3 Testing Checklist

**Data Display:**
- [ ] Area names display correctly from `area.nombre`
- [ ] Director names display correctly from `directorio.nombre`
- [ ] Null values handled gracefully
- [ ] All three sources (INEA, ITEA, TLAXCALA) work

**Search and Filters:**
- [ ] Search by area works with relational data
- [ ] Search by director works with relational data
- [ ] Suggestions populate from relational data
- [ ] Filter chips display relational data

**Director Selection Flow:**
- [ ] Director with 0 areas shows DirectorModal
- [ ] Director with 1 area generates PDF directly
- [ ] Director with multiple areas shows AreaSelectionModal
- [ ] Area creation works in DirectorModal
- [ ] Area selection works in AreaSelectionModal

**Exports:**
- [ ] Excel export includes area.nombre
- [ ] Excel export includes directorio.nombre
- [ ] General PDF includes relational data
- [ ] Per-area PDF includes director nombre and puesto
- [ ] Per-area PDF filters correctly by relational fields

**Edge Cases:**
- [ ] Items with null area handled
- [ ] Items with null directorio handled
- [ ] Empty data sets handled
- [ ] Director with no name handled
- [ ] Area with no name handled


## 9. Correctness Properties

### 9.1 Data Integrity Properties

**Property 1.1: Relational Field Preservation**
```
∀ item ∈ unifiedData:
  item.id_area = sourceItem.id_area ∧
  item.id_directorio = sourceItem.id_directorio ∧
  item.area = sourceItem.area ∧
  item.directorio = sourceItem.directorio
```
**Validates:** Requirements 3.1.1, 3.2.1

**Property 1.2: No Text Field Leakage**
```
∀ item ∈ LevMueble:
  ¬∃ item.area: string ∧
  ¬∃ item.usufinal: string
```
**Validates:** Requirements 2.1, 3.1.1

**Property 1.3: Nested Object Structure**
```
∀ item ∈ unifiedData where item.area ≠ null:
  item.area.id_area: number ∧
  item.area.nombre: string

∀ item ∈ unifiedData where item.directorio ≠ null:
  item.directorio.id_directorio: number ∧
  item.directorio.nombre: string ∧
  item.directorio.puesto: string
```
**Validates:** Requirements 3.1.1

### 9.2 Display Properties

**Property 2.1: Area Display Correctness**
```
∀ item ∈ displayedData:
  displayedArea(item) = item.area?.nombre ?? '-'
```
**Validates:** Requirements 2.2, 3.3.1

**Property 2.2: Director Display Correctness**
```
∀ item ∈ displayedData:
  displayedDirector(item) = item.directorio?.nombre ?? '-'
```
**Validates:** Requirements 2.2, 3.3.1

### 9.3 Search and Filter Properties

**Property 3.1: Area Search Correctness**
```
∀ query ∈ searchQueries, item ∈ searchResults:
  matches(query, item) ⟹ 
    query.toLowerCase() ⊆ item.area?.nombre.toLowerCase()
```
**Validates:** Requirements 2.3, 3.2.3

**Property 3.2: Director Search Correctness**
```
∀ query ∈ searchQueries, item ∈ searchResults:
  matches(query, item) ⟹ 
    query.toLowerCase() ⊆ item.directorio?.nombre.toLowerCase()
```
**Validates:** Requirements 2.3, 3.2.3

**Property 3.3: Suggestion Extraction**
```
∀ suggestion ∈ suggestions where suggestion.type = 'area':
  ∃ item ∈ data: suggestion.value = item.area?.nombre

∀ suggestion ∈ suggestions where suggestion.type = 'usufinal':
  ∃ item ∈ data: suggestion.value = item.directorio?.nombre
```
**Validates:** Requirements 2.3, 3.2.3

### 9.4 Export Properties

**Property 4.1: Excel Export Completeness**
```
∀ item ∈ exportedData:
  excelRow.area = item.area?.nombre ?? '' ∧
  excelRow.director = item.directorio?.nombre ?? ''
```
**Validates:** Requirements 2.4, 3.6.1

**Property 4.2: PDF Export Completeness**
```
∀ item ∈ pdfData:
  pdfRow.area = item.area?.nombre ?? '' ∧
  pdfRow.director = item.directorio?.nombre ?? ''
```
**Validates:** Requirements 2.4, 3.6.2

**Property 4.3: Per-Area PDF Metadata**
```
∀ pdfPerArea ∈ generatedPDFs:
  pdfPerArea.metadata.directorNombre = director.nombre ∧
  pdfPerArea.metadata.directorPuesto = director.puesto ∧
  pdfPerArea.metadata.areaNombre = area.nombre
```
**Validates:** Requirements 2.4, 3.6.3

### 9.5 Director Selection Properties

**Property 5.1: Area Count Logic**
```
∀ director ∈ selectedDirectors:
  let areaCount = |directorAreasMap[director.id_directorio]|
  
  areaCount = 0 ⟹ showDirectorModal = true
  areaCount = 1 ⟹ generatePDF(director, areas[directorAreasMap[director.id_directorio][0]])
  areaCount > 1 ⟹ showAreaSelectionModal = true
```
**Validates:** Requirements 2.5, 3.4.3, 3.4.4, 3.5.1

**Property 5.2: Director ID Consistency**
```
∀ operation ∈ directorOperations:
  operation uses director.id_directorio ∧
  ¬operation uses text-based matching
```
**Validates:** Requirements 2.5, 3.4.1, 3.4.2

### 9.6 Type Safety Properties

**Property 6.1: No Any Types**
```
∀ variable ∈ codebase:
  type(variable) ≠ any
```
**Validates:** Requirements 4.3

**Property 6.2: Null Safety**
```
∀ access ∈ relationalFieldAccesses:
  access uses optional chaining (?.) ∨
  access has explicit null check
```
**Validates:** Requirements 4.3


## 10. File Change Summary

### 10.1 Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/components/consultas/levantamiento/types.ts` | Update LevMueble, add Area, update DirectorioOption | Critical |
| `src/components/consultas/levantamiento/hooks/useUnifiedInventory.ts` | Preserve relational fields, remove text mapping | Critical |
| `src/components/consultas/levantamiento/hooks/useDirectorManagement.ts` | Use id_directorio, remove text matching | High |
| `src/components/consultas/levantamiento/hooks/useSearchAndFilters.ts` | Use area.nombre, directorio.nombre | High |
| `src/components/consultas/levantamiento/index.tsx` | Add area management, selection flow | Critical |
| `src/components/consultas/levantamiento/components/InventoryTable.tsx` | Display area.nombre, directorio.nombre | High |
| `src/components/consultas/levantamiento/modals/CustomPDFModal.tsx` | Use id_directorio | High |
| `src/components/consultas/levantamiento/modals/DirectorDataModal.tsx` | Update by id_directorio | High |
| `src/components/consultas/levantamiento/utils.tsx` | Update exports to use relational fields | High |

### 10.2 Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| `src/components/consultas/levantamiento/hooks/useAreaManagement.ts` | Manage area relationships | High |
| `src/components/consultas/levantamiento/modals/AreaSelectionModal.tsx` | Select area from multiple | High |
| `src/components/consultas/levantamiento/modals/DirectorModal.tsx` | Enter area for director | High |

### 10.3 Files Not Changed

- `src/components/consultas/levantamiento/components/SearchBar.tsx` - receives data from parent
- `src/components/consultas/levantamiento/components/ExportButtons.tsx` - just triggers callbacks
- `src/components/consultas/levantamiento/components/Pagination.tsx` - no relational data
- `src/components/consultas/levantamiento/components/LoadingStates.tsx` - no relational data
- `src/components/consultas/levantamiento/modals/ExportModal.tsx` - just UI wrapper
- All indexation hooks - already provide JOINed data
- Database schema - already correct

## 11. Dependencies

### 11.1 Internal Dependencies

**Required Hooks:**
- `useIneaIndexation` - provides JOINed INEA data
- `useIteaIndexation` - provides JOINed ITEA data
- `useNoListadoIndexation` - provides JOINed TLAXCALA data

**Required Types:**
- `MuebleINEA` from `@/types/indexation`
- `MuebleITEA` from `@/types/indexation`
- `MuebleNoListado` from `@/types/indexation`

**Reference Implementations:**
- `src/components/consultas/inea/hooks/useAreaManagement.ts`
- `src/components/consultas/inea/modals/AreaSelectionModal.tsx`
- `src/components/consultas/inea/modals/DirectorModal.tsx`

### 11.2 External Dependencies

**Already Installed:**
- `@supabase/supabase-js` - database queries
- `exceljs` - Excel generation
- `jspdf` - PDF generation
- `jspdf-autotable` - PDF tables
- `framer-motion` - modal animations
- `lucide-react` - icons

**No new dependencies needed**

## 12. Risk Mitigation

### 12.1 Type Safety Risks

**Risk:** Type errors during migration  
**Mitigation:**
- Update types first
- Use TypeScript compiler to find all affected code
- Fix all type errors before testing

### 12.2 Data Display Risks

**Risk:** Null values causing display issues  
**Mitigation:**
- Use optional chaining (`?.`) everywhere
- Provide fallback values (`|| '-'`)
- Test with data that has null relational fields

### 12.3 Search Performance Risks

**Risk:** Search slower with relational fields  
**Mitigation:**
- Data already JOINed by indexation hooks
- No additional queries needed
- Searchable data built once in useMemo

### 12.4 Export Risks

**Risk:** Exports missing data  
**Mitigation:**
- Test exports with various data scenarios
- Handle null values explicitly
- Verify column mapping

### 12.5 Director Selection Risks

**Risk:** Area selection flow confusing  
**Mitigation:**
- Copy proven UX from INEA/ITEA/no-listado
- Clear modal messaging
- Test all three scenarios (0, 1, multiple areas)

## 13. Success Metrics

### 13.1 Code Quality Metrics

- [ ] Zero TypeScript errors
- [ ] Zero `any` types used
- [ ] All relational fields properly typed
- [ ] Consistent with INEA/ITEA/no-listado patterns

### 13.2 Functional Metrics

- [ ] All data displays correctly
- [ ] Search works with relational fields
- [ ] Filters work with relational fields
- [ ] Excel exports include relational data
- [ ] PDF exports include relational data
- [ ] Director selection flow works for all scenarios

### 13.3 Performance Metrics

- [ ] Data loading time unchanged
- [ ] Search response time unchanged
- [ ] Export generation time unchanged

## 14. Future Enhancements

### 14.1 Potential Improvements

**Not in scope for this migration:**
- Add area filtering UI
- Add director filtering UI
- Bulk director assignment
- Area hierarchy support
- Director history tracking

### 14.2 Technical Debt

**Items to address later:**
- Remove legacy `area` field from directorio table (not used)
- Standardize director/area management across all modules
- Create shared modal components for area/director selection


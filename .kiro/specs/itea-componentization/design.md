# Componentización de ITEA General - Diseño

## 1. Arquitectura General

### 1.1 Visión de Alto Nivel
La refactorización seguirá el patrón establecido en `no-listado`, dividiendo el componente monolítico en:
- **Componente Orquestador** (index.tsx): Coordina todos los sub-componentes
- **Hooks Personalizados**: Encapsulan lógica de negocio
- **Componentes Visuales**: Componentes de presentación reutilizables
- **Modales**: Componentes de diálogo independientes
- **Utilidades**: Funciones helper y tipos compartidos

### 1.2 Flujo de Datos
```
useIteaIndexation (datos) 
    ↓
index.tsx (orquestador)
    ↓
Hooks (lógica de negocio)
    ↓
Componentes (presentación)
    ↓
Usuario
```

### 1.3 Principios de Diseño
- **Separación de Responsabilidades**: Cada componente/hook tiene una función específica
- **Composición sobre Herencia**: Componentes pequeños que se combinan
- **Props Explícitas**: Todas las dependencias se pasan como props
- **Inmutabilidad**: Estado manejado de forma inmutable
- **Reutilización**: Componentes y hooks diseñados para ser reutilizables

## 2. Estructura de Archivos Detallada


```
src/components/consultas/itea/
├── index.tsx                    # 250 líneas - Orquestador principal
├── types.ts                     # 80 líneas - Definiciones TypeScript
├── utils.tsx                    # 100 líneas - Funciones utilitarias
├── components/
│   ├── Header.tsx              # 40 líneas
│   ├── ValueStatsPanel.tsx     # 80 líneas
│   ├── SearchBar.tsx           # 60 líneas
│   ├── FilterChips.tsx         # 70 líneas
│   ├── InventoryTable.tsx      # 200 líneas
│   ├── DetailPanel.tsx         # 250 líneas
│   ├── Pagination.tsx          # 120 líneas
│   ├── ImagePreview.tsx        # 80 líneas
│   ├── SuggestionDropdown.tsx  # 60 líneas
│   ├── TableSkeleton.tsx       # 40 líneas
│   ├── CustomSelect.tsx        # 80 líneas
│   └── ActionButtons.tsx       # 100 líneas
├── hooks/
│   ├── useSearchAndFilters.ts  # 200 líneas
│   ├── useItemEdit.ts          # 250 líneas
│   ├── useDirectorManagement.ts # 100 líneas
│   ├── useAreaManagement.ts    # 80 líneas
│   └── useResguardoData.ts     # 80 líneas
└── modals/
    ├── BajaModal.tsx           # 100 líneas
    ├── InactiveModal.tsx       # 80 líneas
    ├── DirectorModal.tsx       # 120 líneas
    └── AreaSelectionModal.tsx  # 100 líneas
```

## 3. Diseño de Componentes

### 3.1 index.tsx (Orquestador Principal)

**Responsabilidad:** Coordinar todos los componentes y hooks

**Imports:**
```typescript
// React y hooks
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks del sistema
import { useTheme } from '@/context/ThemeContext';
import { useSession } from '@/hooks/useSession';
import { useUserRole } from '@/hooks/useUserRole';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';

// Hooks locales
import { useResguardoData } from './hooks/useResguardoData';
import { useAreaManagement } from './hooks/useAreaManagement';
import { useDirectorManagement } from './hooks/useDirectorManagement';
import { useSearchAndFilters } from './hooks/useSearchAndFilters';
import { useItemEdit } from './hooks/useItemEdit';

// Componentes
import Header from './components/Header';
import ValueStatsPanel from './components/ValueStatsPanel';
import SearchBar from './components/SearchBar';
import FilterChips from './components/FilterChips';
import InventoryTable from './components/InventoryTable';
import DetailPanel from './components/DetailPanel';
import Pagination from './components/Pagination';

// Modales
import InactiveModal from './modals/InactiveModal';
import BajaModal from './modals/BajaModal';
import AreaSelectionModal from './modals/AreaSelectionModal';
import DirectorModal from './modals/DirectorModal';

// Tipos
import { Mueble, Message, FilterOptions, Directorio, Area } from './types';
```


**Estado Local:**
```typescript
// Paginación
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);

// Ordenamiento
const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

// Opciones de filtro
const [filterOptions, setFilterOptions] = useState<FilterOptions>({...});

// Modales de director
const [showDirectorModal, setShowDirectorModal] = useState(false);
const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
const [directorFormData, setDirectorFormData] = useState({ area: '' });
const [savingDirector, setSavingDirector] = useState(false);

// Modal de selección de área
const [showAreaSelectModal, setShowAreaSelectModal] = useState(false);
const [areaOptionsForDirector, setAreaOptionsForDirector] = useState<Area[]>([]);

// Mensajes
const [message, setMessage] = useState<Message | null>(null);

// Refs
const inputRef = useRef<HTMLInputElement | null>(null);
const detailRef = useRef<HTMLDivElement | null>(null);
```

**Estructura del Render:**
```typescript
return (
  <>
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      <motion.div className="h-full overflow-y-auto p-4 md:p-8">
        <div className="w-full max-w-7xl mx-auto pb-8">
          {/* Header */}
          <Header isDarkMode={isDarkMode} realtimeConnected={realtimeConnected} />

          {/* Value Stats Panel */}
          <ValueStatsPanel {...statsProps} />

          {/* Message Banner */}
          <AnimatePresence>
            {message && <MessageBanner />}
          </AnimatePresence>

          {/* Search Bar */}
          <SearchBar {...searchProps} />

          {/* Filter Chips */}
          {activeFilters.length > 0 && <FilterChips {...filterProps} />}

          {/* Main Content */}
          <div className={selectedItem ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "w-full"}>
            {/* Table Section */}
            <div>
              <InventoryTable {...tableProps} />
              <Pagination {...paginationProps} />
            </div>

            {/* Detail Panel */}
            {selectedItem && (
              <AnimatePresence mode="wait">
                <DetailPanel {...detailProps} />
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </div>

    {/* Modals */}
    <InactiveModal {...inactiveModalProps} />
    <BajaModal {...bajaModalProps} />
    <AreaSelectionModal {...areaModalProps} />
    <DirectorModal {...directorModalProps} />
  </>
);
```



### 3.2 types.ts

**Contenido:**
```typescript
// Tipo principal de mueble ITEA (importado desde @/types/indexation)
export type { MuebleITEA as Mueble } from '@/types/indexation';

// Tipo de mensaje
export interface Message {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

// Opciones de filtro
export interface FilterOptions {
  estados: string[];
  estatus: string[];
  areas: string[];
  rubros: string[];
  formadq: string[];
  directores: { nombre: string; area: string }[];
}

// Área
export interface Area {
  id_area: number;
  nombre: string;
}

// Directorio
export interface Directorio {
  id_directorio: number;
  nombre: string | null;
  area: string | null;
  puesto: string | null;
}

// Detalle de resguardo
export interface ResguardoDetalle {
  folio: string;
  f_resguardo: string;
  area_resguardo: string | null;
  dir_area: string;
  puesto: string;
  origen: string;
  usufinal: string | null;
  descripcion: string;
  rubro: string;
  condicion: string;
  created_by: string;
}

// Filtro activo
export interface ActiveFilter {
  term: string;
  type: 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | null;
}
```

### 3.3 utils.tsx

**Funciones:**
```typescript
// Formatear fecha a DD/MM/YYYY
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Truncar texto
export function truncateText(text: string | null, length: number = 50): string {
  if (!text) return "No Data";
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

// Obtener icono de tipo de filtro
export function getTypeIcon(type: ActiveFilter['type'], isDarkMode: boolean) {
  const iconClass = isDarkMode ? 'h-4 w-4 text-white/80 font-medium' : 'h-4 w-4 text-gray-600/80 font-medium';
  switch (type) {
    case 'id': return <span className={iconClass}>#</span>;
    case 'area': return <span className={iconClass}>A</span>;
    case 'usufinal': return <span className={iconClass}>D</span>;
    case 'resguardante': return <span className={iconClass}>R</span>;
    case 'descripcion': return <span className={iconClass}>Desc</span>;
    case 'rubro': return <span className={iconClass}>Ru</span>;
    case 'estado': return <span className={iconClass}>Edo</span>;
    case 'estatus': return <span className={iconClass}>Est</span>;
    default: return null;
  }
}

// Obtener etiqueta de tipo de filtro
export function getTypeLabel(type: ActiveFilter['type']): string {
  switch (type) {
    case 'id': return 'ID';
    case 'area': return 'ÁREA';
    case 'usufinal': return 'DIRECTOR';
    case 'resguardante': return 'RESGUARDANTE';
    case 'descripcion': return 'DESCRIPCIÓN';
    case 'rubro': return 'RUBRO';
    case 'estado': return 'ESTADO';
    case 'estatus': return 'ESTATUS';
    default: return '';
  }
}
```

## 4. Diseño de Hooks

### 4.1 useResguardoData

**Archivo:** `hooks/useResguardoData.ts`

**Propósito:** Cargar y gestionar datos de resguardos asociados a los muebles

**Parámetros:**
- `muebles: Mueble[]` - Lista de muebles

**Retorna:**
```typescript
{
  foliosResguardo: { [id_inv: string]: string | null };
  resguardoDetalles: { [folio: string]: ResguardoDetalle };
}
```

**Lógica:**
1. useEffect que se ejecuta cuando cambia `muebles`
2. Consulta tabla `resguardos` para obtener todos los registros
3. Construye mapa de `id_inv` a `folio`
4. Construye mapa de `folio` a detalles completos
5. Actualiza estados



### 4.2 useAreaManagement

**Archivo:** `hooks/useAreaManagement.ts`

**Propósito:** Gestionar áreas y sus relaciones N:M con directores

**Parámetros:** Ninguno

**Retorna:**
```typescript
{
  areas: Area[];
  directorAreasMap: { [id_directorio: number]: number[] };
}
```

**Lógica:**
1. useEffect al montar el componente
2. Consulta tabla `area` ordenada por nombre
3. Consulta tabla `directorio_areas` para relaciones
4. Construye mapa de `id_directorio` a array de `id_area`
5. Actualiza estados

### 4.3 useDirectorManagement

**Archivo:** `hooks/useDirectorManagement.ts`

**Propósito:** Gestionar directores y opciones de filtro

**Parámetros:** Ninguno

**Retorna:**
```typescript
{
  directorio: Directorio[];
  fetchDirectorio: () => Promise<{ nombre: string; area: string }[]>;
  fetchFilterOptions: () => Promise<Partial<FilterOptions>>;
}
```

**Funciones:**

**fetchDirectorio:**
1. Consulta tabla `directorio` ordenada por nombre
2. Actualiza estado `directorio`
3. Retorna array de `{ nombre, area }` para filterOptions

**fetchFilterOptions:**
1. Consulta `mueblesitea` para estados únicos
2. Consulta `config` para rubros (tipo='rubro')
3. Consulta `config` para estatus (tipo='estatus')
4. Consulta `config` para formas de adquisición (tipo='formadq')
5. Retorna objeto con todas las opciones

### 4.4 useSearchAndFilters

**Archivo:** `hooks/useSearchAndFilters.ts`

**Propósito:** Manejar toda la lógica de búsqueda, filtrado y sugerencias

**Parámetros:**
- `muebles: Mueble[]` - Lista completa de muebles

**Retorna:**
```typescript
{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchMatchType: ActiveFilter['type'];
  activeFilters: ActiveFilter[];
  suggestions: Array<{ value: string; type: ActiveFilter['type'] }>;
  highlightedIndex: number;
  showSuggestions: boolean;
  filteredMueblesOmni: Mueble[];
  saveCurrentFilter: () => void;
  removeFilter: (index: number) => void;
  clearAllFilters: () => void;
  handleSuggestionClick: (index: number) => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;
}
```

**Estados Internos:**
- `searchTerm` - Término de búsqueda actual
- `searchMatchType` - Tipo detectado automáticamente
- `activeFilters` - Array de filtros guardados
- `suggestions` - Sugerencias generadas
- `highlightedIndex` - Índice de sugerencia resaltada
- `showSuggestions` - Mostrar/ocultar dropdown

**Lógica de Detección de Tipo:**
1. useDeferredValue para `searchTerm`
2. useEffect que analiza el término
3. Itera sobre muebles buscando coincidencias
4. Prioriza coincidencias exactas
5. Asigna tipo según mejor match:
   - usufinal/resguardante: score 10 (exacto) / 9 (parcial)
   - área: score 8 / 7
   - id: score 6 / 5
   - descripción: score 4 / 3

**Lógica de Sugerencias:**
1. useEffect que genera sugerencias
2. Pre-calcula vectores de búsqueda con useMemo
3. Busca en todos los campos
4. Limita a 7 sugerencias
5. Prioriza coincidencias que empiezan con el término

**Lógica de Filtrado:**
1. useMemo para `filteredMueblesOmni`
2. Aplica filtros activos (AND)
3. Aplica búsqueda general si no hay tipo específico
4. Retorna array filtrado



### 4.5 useItemEdit

**Archivo:** `hooks/useItemEdit.ts`

**Propósito:** Manejar toda la lógica de edición, guardado y acciones sobre items

**Parámetros:** Ninguno (usa hooks del sistema internamente)

**Retorna:**
```typescript
{
  selectedItem: Mueble | null;
  isEditing: boolean;
  editFormData: Mueble | null;
  setEditFormData: (data: Mueble | null) => void;
  imageFile: File | null;
  imagePreview: string | null;
  uploading: boolean;
  showBajaModal: boolean;
  setShowBajaModal: (show: boolean) => void;
  bajaCause: string;
  setBajaCause: (cause: string) => void;
  showInactiveModal: boolean;
  setShowInactiveModal: (show: boolean) => void;
  handleSelectItem: (item: Mueble) => void;
  handleStartEdit: () => void;
  cancelEdit: () => void;
  closeDetail: () => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveChanges: () => Promise<void>;
  handleEditFormChange: (e: React.ChangeEvent, field: keyof Mueble) => void;
  markAsBaja: () => void;
  confirmBaja: () => Promise<void>;
  markAsInactive: () => void;
  confirmMarkAsInactive: () => Promise<void>;
}
```

**Funciones Principales:**

**handleSelectItem:**
1. Establece `selectedItem`
2. Resetea modo edición
3. Limpia imagen preview
4. Scroll al detalle en móvil

**handleStartEdit:**
1. Copia `selectedItem` a `editFormData`
2. Normaliza rubro a valor exacto de opciones
3. Activa modo edición

**saveChanges:**
1. Valida `editFormData`
2. Sube imagen si hay `imageFile`
3. Actualiza registro en Supabase
4. Crea notificación de edición
5. Actualiza `selectedItem`
6. Sale de modo edición

**handleImageChange:**
1. Valida tamaño (máx 5MB)
2. Valida tipo (JPG, PNG, GIF, WebP)
3. Crea preview con FileReader
4. Establece `imageFile`

**confirmBaja:**
1. Valida causa de baja
2. Actualiza estatus a 'BAJA'
3. Establece `causadebaja` y `fechabaja`
4. Inserta registro en tabla `deprecated`
5. Crea notificación
6. Cierra modal y detalle

**confirmMarkAsInactive:**
1. Actualiza estatus a 'INACTIVO'
2. Crea notificación
3. Cierra modal y detalle

## 5. Diseño de Componentes Visuales

### 5.1 Header

**Archivo:** `components/Header.tsx`

**Props:**
```typescript
interface HeaderProps {
  isDarkMode: boolean;
  realtimeConnected: boolean;
}
```

**Estructura:**
```tsx
<div className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 ${isDarkMode ? 'bg-black border-b border-gray-800' : 'bg-white border-b border-gray-200'}`}>
  <div>
    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
      <span className={`mr-2 sm:mr-3 p-1 sm:p-2 rounded-lg text-sm sm:text-base ${isDarkMode ? 'bg-gray-900 text-white border border-gray-700' : 'bg-gray-100 text-gray-900 border border-gray-300'}`}>INV</span>
      Consulta de Inventario ITEA
    </h1>
    <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      Vista general de todos los bienes registrados en el sistema.
    </p>
  </div>
  <SectionRealtimeToggle sectionName="ITEA" isConnected={realtimeConnected} />
</div>
```

### 5.2 ValueStatsPanel

**Archivo:** `components/ValueStatsPanel.tsx`

**Props:**
```typescript
interface ValueStatsPanelProps {
  filteredValue: number;
  allValue: number;
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  isDarkMode: boolean;
}
```

**Estructura:**
- Panel de valor total con icono de DollarSign
- Animación de hover con scale
- Valor formateado con separadores de miles
- Texto descriptivo según si hay filtros activos
- Panel de conteo de artículos
- Diseño responsive (flex-col en móvil, flex-row en desktop)


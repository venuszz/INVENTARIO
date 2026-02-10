# Componentización de ITEA General - Requisitos

## 1. Visión General

### 1.1 Propósito
Refactorizar y componentizar el componente monolítico `src/components/consultas/itea/general.tsx` siguiendo la arquitectura modular establecida en `src/components/consultas/no-listado/`, mejorando la mantenibilidad, reutilización y organización del código.

### 1.2 Contexto
El componente actual de ITEA General es un archivo monolítico de más de 1000 líneas que maneja toda la lógica de consulta, edición, búsqueda, filtrado y gestión de inventario ITEA. Este patrón dificulta el mantenimiento y la escalabilidad. El componente no-listado ya fue exitosamente refactorizado con una arquitectura modular que queremos replicar.

### 1.3 Objetivos
- Dividir el componente monolítico en componentes más pequeños y enfocados
- Extraer la lógica de negocio a custom hooks reutilizables
- Separar modales en archivos independientes
- Crear archivos de tipos y utilidades compartidas
- Mantener toda la funcionalidad existente sin regresiones
- Mejorar la legibilidad y mantenibilidad del código

## 2. Historias de Usuario

### 2.1 Como Desarrollador
**Quiero** una estructura de carpetas organizada y modular  
**Para** poder encontrar y modificar componentes específicos fácilmente  
**Criterios de Aceptación:**
- La estructura de carpetas sigue el patrón de no-listado
- Cada componente tiene una responsabilidad única y clara
- Los archivos no exceden las 300 líneas de código
- La navegación por el código es intuitiva

### 2.2 Como Desarrollador
**Quiero** hooks personalizados que encapsulen lógica de negocio  
**Para** reutilizar funcionalidad y mantener componentes limpios  
**Criterios de Aceptación:**
- Hooks para búsqueda y filtros
- Hooks para edición de items
- Hooks para gestión de directores
- Hooks para gestión de áreas
- Hooks para datos de resguardo
- Cada hook tiene una responsabilidad específica

### 2.3 Como Usuario Final
**Quiero** que todas las funcionalidades existentes sigan funcionando  
**Para** continuar usando el sistema sin interrupciones  
**Criterios de Aceptación:**
- Búsqueda y filtrado funcionan igual que antes
- Edición de artículos funciona correctamente
- Modales de baja e inactivo funcionan
- Selección de directores y áreas funciona
- Paginación funciona correctamente
- Visualización de imágenes funciona
- Integración con resguardos funciona

### 2.4 Como Desarrollador
**Quiero** componentes visuales separados y reutilizables  
**Para** mantener consistencia visual y facilitar cambios de UI  
**Criterios de Aceptación:**
- Header como componente independiente
- SearchBar como componente independiente
- FilterChips como componente independiente
- InventoryTable como componente independiente
- DetailPanel como componente independiente
- Pagination como componente independiente
- ValueStatsPanel como componente independiente
- Todos los componentes aceptan props de tema (isDarkMode)

### 2.5 Como Desarrollador
**Quiero** modales separados en archivos independientes  
**Para** mantener el código organizado y facilitar su mantenimiento  
**Criterios de Aceptación:**
- BajaModal en archivo separado
- InactiveModal en archivo separado
- DirectorModal en archivo separado
- AreaSelectionModal en archivo separado
- Cada modal maneja su propia lógica de visualización

## 3. Requisitos Funcionales

### 3.1 Estructura de Carpetas
```
src/components/consultas/itea/
├── index.tsx                    # Componente principal orquestador
├── types.ts                     # Definiciones de tipos TypeScript
├── utils.tsx                    # Funciones utilitarias
├── components/
│   ├── Header.tsx              # Encabezado con título y toggle realtime
│   ├── ValueStatsPanel.tsx     # Panel de estadísticas de valor
│   ├── SearchBar.tsx           # Barra de búsqueda con sugerencias
│   ├── FilterChips.tsx         # Chips de filtros activos
│   ├── InventoryTable.tsx      # Tabla de inventario
│   ├── DetailPanel.tsx         # Panel de detalles del item
│   ├── Pagination.tsx          # Controles de paginación
│   ├── ImagePreview.tsx        # Componente de preview de imagen
│   ├── SuggestionDropdown.tsx  # Dropdown de sugerencias
│   ├── TableSkeleton.tsx       # Skeleton loader para tabla
│   ├── CustomSelect.tsx        # Select personalizado
│   └── ActionButtons.tsx       # Botones de acción (editar, baja, etc)
├── hooks/
│   ├── useSearchAndFilters.ts  # Lógica de búsqueda y filtrado
│   ├── useItemEdit.ts          # Lógica de edición de items
│   ├── useDirectorManagement.ts # Lógica de gestión de directores
│   ├── useAreaManagement.ts    # Lógica de gestión de áreas
│   └── useResguardoData.ts     # Lógica de datos de resguardo
└── modals/
    ├── BajaModal.tsx           # Modal de dar de baja
    ├── InactiveModal.tsx       # Modal de marcar inactivo
    ├── DirectorModal.tsx       # Modal de información de director
    └── AreaSelectionModal.tsx  # Modal de selección de área
```

### 3.2 Componentes Principales

#### 3.2.1 index.tsx (Orquestador)
- Importa y usa todos los hooks
- Renderiza componentes en el orden correcto
- Maneja el estado global del componente
- Coordina la comunicación entre componentes
- Usa useIteaIndexation para datos
- Integra con framer-motion para animaciones

#### 3.2.2 types.ts
- Define tipo `Mueble` (MuebleITEA)
- Define tipo `Message`
- Define tipo `FilterOptions`
- Define tipo `Directorio`
- Define tipo `Area`
- Define tipo `ResguardoDetalle`
- Define tipo `ActiveFilter`

#### 3.2.3 utils.tsx
- Función `formatDate` para formatear fechas
- Función `truncateText` para truncar texto
- Función `getTypeIcon` para iconos de tipo de filtro
- Función `getTypeLabel` para etiquetas de tipo de filtro
- Otras funciones utilitarias necesarias

### 3.3 Hooks Personalizados

#### 3.3.1 useSearchAndFilters
**Responsabilidad:** Manejar toda la lógica de búsqueda y filtrado
**Retorna:**
- `searchTerm`, `setSearchTerm`
- `searchMatchType`
- `activeFilters`
- `suggestions`
- `highlightedIndex`
- `showSuggestions`
- `filteredMueblesOmni`
- `saveCurrentFilter`
- `removeFilter`
- `clearAllFilters`
- `handleSuggestionClick`
- `handleInputKeyDown`
- `handleInputBlur`

#### 3.3.2 useItemEdit
**Responsabilidad:** Manejar edición, guardado y acciones sobre items
**Retorna:**
- `selectedItem`, `setSelectedItem`
- `isEditing`, `setIsEditing`
- `editFormData`, `setEditFormData`
- `imagePreview`
- `uploading`
- `showBajaModal`, `setShowBajaModal`
- `bajaCause`, `setBajaCause`
- `showInactiveModal`, `setShowInactiveModal`
- `handleSelectItem`
- `handleStartEdit`
- `cancelEdit`
- `closeDetail`
- `handleImageChange`
- `saveChanges`
- `handleEditFormChange`
- `markAsBaja`
- `confirmBaja`
- `markAsInactive`
- `confirmMarkAsInactive`

#### 3.3.3 useDirectorManagement
**Responsabilidad:** Gestionar directores y sus datos
**Retorna:**
- `directorio`
- `fetchDirectorio`
- `fetchFilterOptions`

#### 3.3.4 useAreaManagement
**Responsabilidad:** Gestionar áreas y relaciones N:M con directores
**Retorna:**
- `areas`
- `directorAreasMap`

#### 3.3.5 useResguardoData
**Responsabilidad:** Obtener y gestionar datos de resguardos
**Retorna:**
- `foliosResguardo`
- `resguardoDetalles`

### 3.4 Componentes Visuales

#### 3.4.1 Header
**Props:**
- `isDarkMode: boolean`
- `realtimeConnected: boolean`

**Renderiza:**
- Título "Consulta de Inventario ITEA"
- Descripción
- SectionRealtimeToggle

#### 3.4.2 ValueStatsPanel
**Props:**
- `filteredValue: number`
- `allValue: number`
- `filteredCount: number`
- `totalCount: number`
- `hasActiveFilters: boolean`
- `isDarkMode: boolean`

**Renderiza:**
- Panel de valor total con animaciones
- Panel de conteo de artículos

#### 3.4.3 SearchBar
**Props:**
- `searchTerm: string`
- `setSearchTerm: (term: string) => void`
- `searchMatchType: ActiveFilter['type']`
- `showSuggestions: boolean`
- `suggestions: Array<{value: string, type: ActiveFilter['type']}>`
- `highlightedIndex: number`
- `onSuggestionClick: (index: number) => void`
- `onKeyDown: (e: React.KeyboardEvent) => void`
- `onBlur: () => void`
- `isDarkMode: boolean`
- `inputRef: React.RefObject<HTMLInputElement>`

**Renderiza:**
- Input de búsqueda
- SuggestionDropdown (cuando hay sugerencias)

#### 3.4.4 FilterChips
**Props:**
- `activeFilters: ActiveFilter[]`
- `onRemoveFilter: (index: number) => void`
- `onClearAll: () => void`
- `isDarkMode: boolean`

**Renderiza:**
- Chips de filtros activos
- Botón de limpiar todos

#### 3.4.5 InventoryTable
**Props:**
- `muebles: Mueble[]`
- `paginatedMuebles: Mueble[]`
- `loading: boolean`
- `error: string | null`
- `selectedItem: Mueble | null`
- `foliosResguardo: Record<string, string>`
- `sortField: keyof Mueble`
- `sortDirection: 'asc' | 'desc'`
- `isDarkMode: boolean`
- `onSort: (field: keyof Mueble) => void`
- `onSelectItem: (item: Mueble) => void`

**Renderiza:**
- Tabla con headers ordenables
- Filas de datos
- Estados de carga (TableSkeleton)
- Estados de error
- Estados vacíos

#### 3.4.6 DetailPanel
**Props:**
- `selectedItem: Mueble`
- `detailRef: React.RefObject<HTMLDivElement>`
- `isEditing: boolean`
- `editFormData: Mueble | null`
- `imagePreview: string | null`
- `uploading: boolean`
- `filterOptions: FilterOptions`
- `directorio: Directorio[]`
- `foliosResguardo: Record<string, string>`
- `resguardoDetalles: Record<string, ResguardoDetalle>`
- `onClose: () => void`
- `onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void`
- `onFormChange: (e: React.ChangeEvent, field: keyof Mueble) => void`
- `onSelectDirector: (nombre: string) => void`

**Renderiza:**
- Header con botón de cerrar
- Modo vista: información del item
- Modo edición: formulario de edición
- ImagePreview
- Información de resguardo si existe

#### 3.4.7 Pagination
**Props:**
- `currentPage: number`
- `totalPages: number`
- `rowsPerPage: number`
- `totalCount: number`
- `onPageChange: (page: number) => void`
- `onRowsPerPageChange: (rows: number) => void`
- `isDarkMode: boolean`

**Renderiza:**
- Contador de registros
- Selector de filas por página
- Indicador de página actual
- Botones de navegación

#### 3.4.8 ImagePreview
**Props:**
- `imagePath: string | null`

**Renderiza:**
- Imagen cargada desde Supabase Storage
- Estados de carga
- Estados de error

#### 3.4.9 SuggestionDropdown
**Props:**
- `suggestions: Array<{value: string, type: ActiveFilter['type']}>`
- `highlightedIndex: number`
- `onSuggestionClick: (index: number) => void`
- `isDarkMode: boolean`

**Renderiza:**
- Lista de sugerencias
- Highlight del item seleccionado

#### 3.4.10 TableSkeleton
**Props:**
- `isDarkMode: boolean`

**Renderiza:**
- Skeleton loader animado para la tabla

#### 3.4.11 CustomSelect
**Props:**
- `value: string`
- `onChange: (value: string) => void`
- `options: string[]`
- `placeholder?: string`
- `isDarkMode: boolean`

**Renderiza:**
- Select personalizado con estilos consistentes

#### 3.4.12 ActionButtons
**Props:**
- `isEditing: boolean`
- `userRole: string | null`
- `onEdit: () => void`
- `onSave: () => void`
- `onCancel: () => void`
- `onMarkInactive: () => void`
- `onMarkBaja: () => void`
- `isDarkMode: boolean`

**Renderiza:**
- Botones de acción según el modo y rol

### 3.5 Modales

#### 3.5.1 BajaModal
**Props:**
- `show: boolean`
- `selectedItem: Mueble | null`
- `bajaCause: string`
- `onCauseChange: (cause: string) => void`
- `onConfirm: () => void`
- `onClose: () => void`
- `isDarkMode: boolean`

#### 3.5.2 InactiveModal
**Props:**
- `show: boolean`
- `selectedItem: Mueble | null`
- `onConfirm: () => void`
- `onClose: () => void`
- `isDarkMode: boolean`

#### 3.5.3 DirectorModal
**Props:**
- `show: boolean`
- `incompleteDirector: Directorio | null`
- `directorFormData: {area: string}`
- `savingDirector: boolean`
- `onAreaChange: (area: string) => void`
- `onSave: () => void`
- `onClose: () => void`
- `isDarkMode: boolean`

#### 3.5.4 AreaSelectionModal
**Props:**
- `show: boolean`
- `areaOptions: Area[]`
- `incompleteDirector: Directorio | null`
- `editFormData: Mueble | null`
- `selectedItem: Mueble | null`
- `onSelectArea: (area: Area) => void`
- `onClose: () => void`

## 4. Requisitos No Funcionales

### 4.1 Rendimiento
- Los componentes deben usar `useMemo` y `useCallback` donde sea apropiado
- La búsqueda debe usar `useDeferredValue` para evitar bloqueos
- Las sugerencias deben limitarse a 10 resultados máximo
- La paginación debe ser eficiente incluso con miles de registros

### 4.2 Mantenibilidad
- Cada archivo debe tener menos de 300 líneas
- Los componentes deben tener una sola responsabilidad
- Los hooks deben ser reutilizables
- El código debe estar bien comentado

### 4.3 Accesibilidad
- Todos los botones deben tener `title` o `aria-label`
- Los inputs deben tener labels apropiados
- Los modales deben manejar el foco correctamente
- La navegación por teclado debe funcionar

### 4.4 Compatibilidad
- Debe funcionar con el sistema de indexación existente (useIteaIndexation)
- Debe integrarse con el sistema de notificaciones
- Debe respetar el tema oscuro/claro
- Debe funcionar con framer-motion para animaciones

## 5. Restricciones y Dependencias

### 5.1 Dependencias Técnicas
- React 18+
- TypeScript
- Framer Motion
- Lucide React (iconos)
- useIteaIndexation hook
- useSession hook
- useUserRole hook
- useNotifications hook
- useTheme hook
- Supabase client

### 5.2 Restricciones
- No cambiar la funcionalidad existente
- Mantener compatibilidad con el sistema de rutas actual
- No modificar la estructura de la base de datos
- Respetar los permisos de rol existentes

## 6. Criterios de Aceptación Global

### 6.1 Estructura
- ✅ La estructura de carpetas coincide con el patrón de no-listado
- ✅ Todos los componentes están en la carpeta `components/`
- ✅ Todos los hooks están en la carpeta `hooks/`
- ✅ Todos los modales están en la carpeta `modals/`
- ✅ Existe archivo `types.ts` con todas las definiciones
- ✅ Existe archivo `utils.tsx` con funciones utilitarias

### 6.2 Funcionalidad
- ✅ La búsqueda y filtrado funcionan correctamente
- ✅ La edición de items funciona
- ✅ Los modales de baja e inactivo funcionan
- ✅ La selección de directores funciona
- ✅ La gestión de áreas N:M funciona
- ✅ La paginación funciona
- ✅ Las imágenes se cargan correctamente
- ✅ La integración con resguardos funciona
- ✅ Las notificaciones se crean correctamente

### 6.3 Calidad de Código
- ✅ No hay errores de TypeScript
- ✅ No hay warnings de ESLint
- ✅ Los componentes son reutilizables
- ✅ Los hooks encapsulan lógica correctamente
- ✅ El código está bien organizado y es legible

### 6.4 UI/UX
- ✅ El tema oscuro/claro funciona correctamente
- ✅ Las animaciones de framer-motion funcionan
- ✅ Los estados de carga se muestran apropiadamente
- ✅ Los mensajes de error son claros
- ✅ La navegación es intuitiva

## 7. Fuera de Alcance

- Cambios en la lógica de negocio
- Modificaciones a la base de datos
- Nuevas funcionalidades
- Cambios en el diseño visual
- Optimizaciones de rendimiento más allá de las básicas
- Testing automatizado (se hará en una fase posterior)

## 8. Riesgos y Mitigaciones

### 8.1 Riesgo: Regresiones en funcionalidad
**Mitigación:** Probar exhaustivamente cada funcionalidad después de la refactorización

### 8.2 Riesgo: Pérdida de contexto en la división
**Mitigación:** Documentar bien las props y responsabilidades de cada componente

### 8.3 Riesgo: Problemas de rendimiento
**Mitigación:** Usar memoización apropiada y probar con datasets grandes

### 8.4 Riesgo: Inconsistencias con no-listado
**Mitigación:** Seguir exactamente el mismo patrón y estructura

## 9. Plan de Migración

### 9.1 Fase 1: Preparación
1. Crear estructura de carpetas
2. Crear archivos types.ts y utils.tsx
3. Backup del componente original

### 9.2 Fase 2: Extracción de Hooks
1. Crear useSearchAndFilters
2. Crear useItemEdit
3. Crear useDirectorManagement
4. Crear useAreaManagement
5. Crear useResguardoData

### 9.3 Fase 3: Componentes Visuales
1. Crear componentes básicos (Header, ValueStatsPanel, etc)
2. Crear componentes de tabla
3. Crear componentes de detalle
4. Crear componentes auxiliares

### 9.4 Fase 4: Modales
1. Crear BajaModal
2. Crear InactiveModal
3. Crear DirectorModal
4. Crear AreaSelectionModal

### 9.5 Fase 5: Integración
1. Crear index.tsx orquestador
2. Integrar todos los componentes
3. Probar funcionalidad completa

### 9.6 Fase 6: Limpieza
1. Eliminar código no utilizado
2. Optimizar imports
3. Verificar tipos TypeScript
4. Documentar cambios

## 10. Notas Adicionales

- El componente debe mantener la misma URL y ruta de acceso
- La integración con useIteaIndexation debe mantenerse
- El sistema de notificaciones debe seguir funcionando
- Los permisos de rol deben respetarse
- El componente debe ser responsive
- Las animaciones deben ser sutiles y no intrusivas

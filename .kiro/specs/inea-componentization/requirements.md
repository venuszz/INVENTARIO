# Refactorización y Componentización de INEA General

## 1. Visión General

Refactorizar el componente monolítico `src/components/consultas/inea/general.tsx` siguiendo la arquitectura modular implementada en ITEA, migrando de campos de texto plano a relaciones con IDs (directores, áreas, puestos) y aplicando el nuevo sistema de diseño con skeletons de sincronización.

## 2. Objetivos

1. **Componentización**: Dividir el componente monolítico en componentes reutilizables y hooks personalizados
2. **Migración Relacional**: Cambiar de campos de texto plano (`usufinal`, `area`) a relaciones con IDs (`id_directorio`, `id_area`)
3. **Diseño Consistente**: Aplicar el mismo sistema de diseño minimalista de ITEA
4. **Sincronización Visual**: Implementar skeletons para mostrar el estado de sincronización de campos
5. **Arquitectura Limpia**: Separar lógica de negocio, presentación y estado

## 3. Historias de Usuario

### 3.1 Como desarrollador
**Quiero** que el componente INEA tenga la misma estructura modular que ITEA  
**Para** facilitar el mantenimiento y la escalabilidad del código

**Criterios de Aceptación:**
- El componente principal (`index.tsx`) debe tener menos de 300 líneas
- Los hooks personalizados deben estar en carpeta `hooks/`
- Los componentes de UI deben estar en carpeta `components/`
- Los modales deben estar en carpeta `modals/`
- Los tipos deben estar en `types.ts`

### 3.2 Como usuario del sistema
**Quiero** que los directores y áreas se gestionen con relaciones de base de datos  
**Para** mantener consistencia y evitar duplicados

**Criterios de Aceptación:**
- Al seleccionar un director, se debe usar `id_directorio` en lugar de texto
- Al seleccionar un área, se debe usar `id_area` en lugar de texto
- Los datos deben mostrarse mediante JOINs con las tablas relacionadas
- La migración debe ser transparente para el usuario final

### 3.3 Como usuario del sistema
**Quiero** ver indicadores visuales cuando los datos se están sincronizando  
**Para** saber que mis cambios se están guardando

**Criterios de Aceptación:**
- Los campos en edición deben mostrar un skeleton mientras se sincronizan
- El skeleton debe aparecer en las celdas de la tabla afectadas
- El skeleton debe desaparecer cuando la sincronización termine
- El diseño debe ser consistente con ITEA

### 3.4 Como usuario del sistema
**Quiero** que la interfaz tenga el mismo diseño minimalista que ITEA  
**Para** tener una experiencia consistente en todo el sistema

**Criterios de Aceptación:**
- Los botones deben usar el estilo minimalista con bordes sutiles
- Los colores deben seguir el esquema de ITEA (white/5, white/10, etc.)
- Las animaciones deben usar Framer Motion
- Los espaciados y tipografía deben ser consistentes

## 4. Requisitos Funcionales

### 4.1 Estructura de Carpetas
```
src/components/consultas/inea/
├── index.tsx                    # Componente principal (orquestador)
├── types.ts                     # Definiciones de tipos TypeScript
├── components/
│   ├── Header.tsx              # Encabezado con título y toggle realtime
│   ├── ValueStatsPanel.tsx     # Panel de estadísticas de valor
│   ├── SearchBar.tsx           # Barra de búsqueda con sugerencias
│   ├── FilterChips.tsx         # Chips de filtros activos
│   ├── InventoryTable.tsx      # Tabla de inventario
│   ├── DetailPanel.tsx         # Panel de detalles del item
│   ├── Pagination.tsx          # Controles de paginación
│   ├── SuggestionDropdown.tsx  # Dropdown de sugerencias
│   ├── TableSkeleton.tsx       # Skeleton para tabla
│   ├── CustomSelect.tsx        # Select personalizado
│   └── ActionButtons.tsx       # Botones de acción (editar, baja, etc.)
├── hooks/
│   ├── useDirectorManagement.ts    # Gestión de directores
│   ├── useAreaManagement.ts        # Gestión de áreas
│   ├── useResguardoData.ts         # Datos de resguardos
│   ├── useSearchAndFilters.ts      # Búsqueda y filtros
│   └── useItemEdit.ts              # Edición de items
└── modals/
    ├── DirectorModal.tsx           # Modal para completar info de director
    ├── AreaSelectionModal.tsx      # Modal para seleccionar área
    ├── BajaModal.tsx               # Modal para dar de baja
    └── InactiveModal.tsx           # Modal para marcar inactivo
```

### 4.2 Migración de Campos Relacionales

#### Campos Actuales (Texto Plano)
```typescript
interface MuebleINEA_OLD {
  usufinal: string | null;      // Nombre del director (texto)
  area: string | null;          // Nombre del área (texto)
  resguardante: string | null;  // Nombre del resguardante (texto)
}
```

#### Campos Nuevos (Relacional)
```typescript
interface MuebleINEA_NEW {
  id_directorio: number | null;
  id_area: number | null;
  directorio: {
    id_directorio: number;
    nombre: string;
    puesto: string;
  } | null;
  area: {
    id_area: number;
    nombre: string;
  } | null;
  resguardante: string | null;  // Se mantiene como texto
}
```

### 4.3 Hooks Personalizados

#### useDirectorManagement
- **Propósito**: Gestionar la carga y actualización de directores
- **Funciones**:
  - `fetchDirectorio()`: Obtener lista de directores
  - `fetchFilterOptions()`: Obtener opciones de filtro (rubros, estatus, etc.)
- **Retorna**: `{ fetchDirectorio, fetchFilterOptions }`

#### useAreaManagement
- **Propósito**: Gestionar áreas y relaciones N:M con directores
- **Funciones**:
  - Cargar áreas desde tabla `area`
  - Cargar relaciones desde tabla `directorio_areas`
- **Retorna**: `{ areas, directorAreasMap }`

#### useResguardoData
- **Propósito**: Cargar datos de resguardos asociados a muebles
- **Parámetros**: `muebles: Mueble[]`
- **Retorna**: `{ foliosResguardo, resguardoDetalles }`

#### useSearchAndFilters
- **Propósito**: Gestionar búsqueda, filtros y sugerencias
- **Funciones**:
  - Búsqueda omnibox con detección de tipo
  - Gestión de filtros activos
  - Sugerencias con autocompletado
- **Retorna**: `{ searchTerm, setSearchTerm, activeFilters, suggestions, ... }`

#### useItemEdit
- **Propósito**: Gestionar edición, guardado y acciones sobre items
- **Funciones**:
  - `handleSelectItem()`: Seleccionar item
  - `handleStartEdit()`: Iniciar edición
  - `saveChanges()`: Guardar cambios
  - `markAsBaja()`: Dar de baja
  - `markAsInactive()`: Marcar inactivo
- **Retorna**: `{ selectedItem, isEditing, editFormData, ... }`

### 4.4 Componentes de UI

#### Header
- Título "Consulta de Inventario INEA"
- Descripción
- Toggle de realtime con `SectionRealtimeToggle`

#### ValueStatsPanel
- Contador de bienes (filtrados vs totales)
- Valor total (filtrado vs total)
- Animaciones con Framer Motion

#### SearchBar
- Input de búsqueda con icono
- Badge de tipo de búsqueda detectado
- Integración con sugerencias

#### FilterChips
- Chips de filtros activos
- Botón para eliminar filtro individual
- Botón para limpiar todos los filtros

#### InventoryTable
- Tabla con columnas: ID, Descripción, Área, Director, Estado, Folio Resguardo
- Ordenamiento por columnas
- Skeleton en celdas durante sincronización
- Highlight del item seleccionado

#### DetailPanel
- Vista de detalles del item seleccionado
- Modo edición con formulario
- Preview de imagen
- Información de resguardo

#### Pagination
- Controles de página (anterior, siguiente, primera, última)
- Selector de filas por página
- Contador de registros

### 4.5 Modales

#### DirectorModal
- Completar información faltante de director (área)
- Crear área si no existe
- Crear relación en `directorio_areas`

#### AreaSelectionModal
- Seleccionar área cuando director tiene múltiples áreas
- Lista de áreas disponibles

#### BajaModal
- Confirmar baja de artículo
- Input para motivo de baja
- Crear registro en tabla `deprecated`

#### InactiveModal
- Confirmar cambio de estatus a INACTIVO

### 4.6 Sistema de Sincronización Visual

#### Skeleton en Tabla
```typescript
// Mostrar skeleton en celda durante sync
{syncingIds.includes(item.id) ? (
  <div className="animate-pulse">
    <div className="h-4 bg-white/10 rounded" />
  </div>
) : (
  <span>{item.directorio?.nombre}</span>
)}
```

#### Store de Sincronización
```typescript
// src/stores/ineaStore.ts
interface IneaStore {
  syncingIds: string[];
  isSyncing: boolean;
  addSyncingId: (id: string) => void;
  removeSyncingId: (id: string) => void;
}
```

## 5. Requisitos No Funcionales

### 5.1 Rendimiento
- El componente principal debe renderizar en menos de 100ms
- La búsqueda debe ser instantánea (< 50ms)
- Las animaciones deben ser fluidas (60fps)

### 5.2 Mantenibilidad
- Cada archivo debe tener menos de 300 líneas
- Los hooks deben ser reutilizables
- Los componentes deben ser independientes

### 5.3 Accesibilidad
- Todos los botones deben tener `aria-label`
- Los inputs deben tener labels asociados
- El contraste de colores debe cumplir WCAG AA

### 5.4 Compatibilidad
- Debe funcionar en Chrome, Firefox, Safari, Edge
- Debe ser responsive (mobile, tablet, desktop)
- Debe soportar modo oscuro y claro

## 6. Dependencias

### 6.1 Paquetes Externos
- `framer-motion`: Animaciones
- `lucide-react`: Iconos
- `@supabase/supabase-js`: Cliente de base de datos

### 6.2 Hooks Internos
- `useIneaIndexation`: Indexación y realtime
- `useSession`: Sesión del usuario
- `useUserRole`: Rol del usuario
- `useTheme`: Tema (dark/light)
- `useNotifications`: Sistema de notificaciones

### 6.3 Stores
- `ineaStore`: Estado de sincronización INEA
- `indexationStore`: Estado global de indexación

## 7. Migración de Datos

### 7.1 Estrategia
1. **Fase 1**: Crear nuevos campos relacionales sin eliminar los antiguos
2. **Fase 2**: Migrar datos existentes a campos relacionales
3. **Fase 3**: Actualizar componente para usar campos relacionales
4. **Fase 4**: Deprecar campos antiguos (mantener por compatibilidad)

### 7.2 Script de Migración
```sql
-- Agregar nuevos campos relacionales
ALTER TABLE muebles 
ADD COLUMN id_directorio INTEGER REFERENCES directorio(id_directorio),
ADD COLUMN id_area INTEGER REFERENCES area(id_area);

-- Migrar datos existentes
UPDATE muebles m
SET id_directorio = d.id_directorio
FROM directorio d
WHERE UPPER(TRIM(m.usufinal)) = UPPER(TRIM(d.nombre));

UPDATE muebles m
SET id_area = a.id_area
FROM area a
WHERE UPPER(TRIM(m.area)) = UPPER(TRIM(a.nombre));
```

## 8. Plan de Pruebas

### 8.1 Pruebas Unitarias
- Hooks personalizados
- Funciones de utilidad
- Componentes aislados

### 8.2 Pruebas de Integración
- Flujo completo de edición
- Flujo de selección de director
- Flujo de dar de baja

### 8.3 Pruebas E2E
- Búsqueda y filtrado
- Edición y guardado
- Sincronización realtime

## 9. Criterios de Éxito

1. ✅ El componente tiene la misma estructura que ITEA
2. ✅ Los campos relacionales funcionan correctamente
3. ✅ Los skeletons de sincronización se muestran apropiadamente
4. ✅ El diseño es consistente con ITEA
5. ✅ No hay regresiones en funcionalidad existente
6. ✅ El código es más mantenible y escalable
7. ✅ La experiencia de usuario es fluida y consistente

## 10. Riesgos y Mitigaciones

### Riesgo 1: Pérdida de datos durante migración
**Mitigación**: Mantener campos antiguos como backup, migración gradual

### Riesgo 2: Inconsistencias en datos relacionales
**Mitigación**: Validación estricta, manejo de casos edge

### Riesgo 3: Regresiones en funcionalidad
**Mitigación**: Suite completa de pruebas, revisión exhaustiva

### Riesgo 4: Problemas de rendimiento
**Mitigación**: Optimización de queries, memoización, lazy loading

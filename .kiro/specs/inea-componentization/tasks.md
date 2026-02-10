# Plan de Tareas - Refactorización INEA

## FASE 1: Preparación y Estructura Base

- [x] 1.1 Crear estructura de carpetas
  - [x] 1.1.1 Crear carpeta `src/components/consultas/inea/components/`
  - [x] 1.1.2 Crear carpeta `src/components/consultas/inea/hooks/`
  - [x] 1.1.3 Crear carpeta `src/components/consultas/inea/modals/`

- [x] 1.2 Crear store de sincronización
  - [x] 1.2.1 Crear archivo `src/stores/ineaStore.ts`
  - [x] 1.2.2 Implementar estado de sincronización con Zustand
  - [x] 1.2.3 Agregar funciones `addSyncingId`, `removeSyncingId`, `setSyncing`

## FASE 2: Tipos y Definiciones

- [x] 2.1 Crear archivo de tipos
  - [x] 2.1.1 Crear `src/components/consultas/inea/types.ts`
  - [x] 2.1.2 Definir interfaces: `Message`, `FilterOptions`, `Area`, `Directorio`
  - [x] 2.1.3 Definir interfaces: `ResguardoDetalle`, `ActiveFilter`
  - [x] 2.1.4 Exportar tipo `Mueble` desde `@/types/indexation`

- [x] 2.2 Actualizar tipos de indexación
  - [x] 2.2.1 Agregar `MuebleINEA` a `src/types/indexation.ts`
  - [x] 2.2.2 Incluir campos relacionales: `id_area`, `id_directorio`
  - [x] 2.2.3 Incluir objetos JOIN: `area`, `directorio`

## FASE 3: Hooks Personalizados

- [x] 3.1 Crear useDirectorManagement
  - [x] 3.1.1 Crear archivo `src/components/consultas/inea/hooks/useDirectorManagement.ts`
  - [x] 3.1.2 Implementar función `fetchDirectorio()`
  - [x] 3.1.3 Implementar función `fetchFilterOptions()`
  - [x] 3.1.4 Agregar manejo de errores y loading states

- [x] 3.2 Crear useAreaManagement
  - [x] 3.2.1 Crear archivo `src/components/consultas/inea/hooks/useAreaManagement.ts`
  - [x] 3.2.2 Implementar carga de áreas desde tabla `area`
  - [x] 3.2.3 Implementar carga de relaciones desde `directorio_areas`
  - [x] 3.2.4 Retornar `areas` y `directorAreasMap`

- [x] 3.3 Crear useResguardoData
  - [x] 3.3.1 Crear archivo `src/components/consultas/inea/hooks/useResguardoData.ts`
  - [x] 3.3.2 Implementar carga de resguardos
  - [x] 3.3.3 Crear mapas de folios y detalles
  - [x] 3.3.4 Actualizar cuando cambie la lista de muebles

- [x] 3.4 Crear useSearchAndFilters
  - [x] 3.4.1 Crear archivo `src/components/consultas/inea/hooks/useSearchAndFilters.ts`
  - [x] 3.4.2 Implementar búsqueda omnibox con detección de tipo
  - [x] 3.4.3 Implementar gestión de filtros activos
  - [x] 3.4.4 Implementar sistema de sugerencias con autocompletado
  - [x] 3.4.5 Implementar filtrado de muebles

- [x] 3.5 Crear useItemEdit
  - [x] 3.5.1 Crear archivo `src/components/consultas/inea/hooks/useItemEdit.ts`
  - [x] 3.5.2 Implementar selección de items
  - [x] 3.5.3 Implementar modo edición
  - [x] 3.5.4 Implementar guardado de cambios con sincronización
  - [x] 3.5.5 Implementar subida de imágenes
  - [x] 3.5.6 Implementar acciones: dar de baja, marcar inactivo

## FASE 4: Componentes de UI Básicos

- [x] 4.1 Crear Header
  - [x] 4.1.1 Crear archivo `src/components/consultas/inea/components/Header.tsx`
  - [x] 4.1.2 Implementar título y descripción
  - [x] 4.1.3 Integrar `SectionRealtimeToggle`

- [x] 4.2 Crear ValueStatsPanel
  - [x] 4.2.1 Crear archivo `src/components/consultas/inea/components/ValueStatsPanel.tsx`
  - [x] 4.2.2 Implementar contador de bienes
  - [x] 4.2.3 Implementar valor total
  - [x] 4.2.4 Agregar animaciones con Framer Motion

- [x] 4.3 Crear SearchBar
  - [x] 4.3.1 Crear archivo `src/components/consultas/inea/components/SearchBar.tsx`
  - [x] 4.3.2 Implementar input con icono de búsqueda
  - [x] 4.3.3 Implementar badge de tipo detectado
  - [x] 4.3.4 Integrar con sistema de sugerencias

- [x] 4.4 Crear FilterChips
  - [x] 4.4.1 Crear archivo `src/components/consultas/inea/components/FilterChips.tsx`
  - [x] 4.4.2 Implementar chips de filtros activos
  - [x] 4.4.3 Implementar botón para eliminar filtro individual
  - [x] 4.4.4 Implementar botón para limpiar todos
  - [x] 4.4.5 Agregar animaciones de entrada/salida

- [x] 4.5 Crear SuggestionDropdown
  - [x] 4.5.1 Crear archivo `src/components/consultas/inea/components/SuggestionDropdown.tsx`
  - [x] 4.5.2 Implementar lista de sugerencias
  - [x] 4.5.3 Implementar navegación con teclado
  - [x] 4.5.4 Implementar highlight de sugerencia seleccionada

- [x] 4.6 Crear TableSkeleton
  - [x] 4.6.1 Crear archivo `src/components/consultas/inea/components/TableSkeleton.tsx`
  - [x] 4.6.2 Implementar skeleton para filas de tabla
  - [x] 4.6.3 Agregar animación de pulso

- [x] 4.7 Crear CustomSelect
  - [x] 4.7.1 Crear archivo `src/components/consultas/inea/components/CustomSelect.tsx`
  - [x] 4.7.2 Implementar select personalizado con búsqueda
  - [x] 4.7.3 Implementar dropdown con opciones

## FASE 5: Componentes de UI Complejos

- [x] 5.1 Crear InventoryTable
  - [x] 5.1.1 Crear archivo `src/components/consultas/inea/components/InventoryTable.tsx`
  - [x] 5.1.2 Implementar tabla con columnas: ID, Descripción, Área, Director, Estado, Folio
  - [x] 5.1.3 Implementar ordenamiento por columnas
  - [x] 5.1.4 Implementar skeleton en celdas durante sincronización
  - [x] 5.1.5 Implementar highlight de item seleccionado
  - [x] 5.1.6 Implementar estados: loading, error, empty

- [x] 5.2 Crear DetailPanel
  - [x] 5.2.1 Crear archivo `src/components/consultas/inea/components/DetailPanel.tsx`
  - [x] 5.2.2 Implementar vista de detalles (modo lectura)
  - [x] 5.2.3 Implementar formulario de edición
  - [x] 5.2.4 Implementar preview de imagen
  - [x] 5.2.5 Implementar información de resguardo
  - [x] 5.2.6 Integrar CustomSelect para directores

- [x] 5.3 Crear Pagination
  - [x] 5.3.1 Crear archivo `src/components/consultas/inea/components/Pagination.tsx`
  - [x] 5.3.2 Implementar controles de navegación
  - [x] 5.3.3 Implementar selector de filas por página
  - [x] 5.3.4 Implementar contador de registros
  - [x] 5.3.5 Implementar botones numerados de página

- [x] 5.4 Crear ActionButtons
  - [x] 5.4.1 Crear archivo `src/components/consultas/inea/components/ActionButtons.tsx`
  - [x] 5.4.2 Implementar botones de edición
  - [x] 5.4.3 Implementar botones de guardado/cancelar
  - [x] 5.4.4 Implementar botones de acciones (baja, inactivo)

## FASE 6: Modales

- [x] 6.1 Crear DirectorModal
  - [x] 6.1.1 Crear archivo `src/components/consultas/inea/modals/DirectorModal.tsx`
  - [x] 6.1.2 Implementar formulario para completar info de director
  - [x] 6.1.3 Implementar lógica para crear área si no existe
  - [x] 6.1.4 Implementar lógica para crear relación en `directorio_areas`

- [x] 6.2 Crear AreaSelectionModal
  - [x] 6.2.1 Crear archivo `src/components/consultas/inea/modals/AreaSelectionModal.tsx`
  - [x] 6.2.2 Implementar lista de áreas disponibles
  - [x] 6.2.3 Implementar selección de área

- [x] 6.3 Crear BajaModal
  - [x] 6.3.1 Crear archivo `src/components/consultas/inea/modals/BajaModal.tsx`
  - [x] 6.3.2 Implementar confirmación de baja
  - [x] 6.3.3 Implementar input para motivo de baja
  - [x] 6.3.4 Implementar lógica para crear registro en `deprecated`

- [x] 6.4 Crear InactiveModal
  - [x] 6.4.1 Crear archivo `src/components/consultas/inea/modals/InactiveModal.tsx`
  - [x] 6.4.2 Implementar confirmación de cambio a INACTIVO

## FASE 7: Integración y Orquestación

- [x] 7.1 Crear componente principal
  - [x] 7.1.1 Renombrar `general.tsx` a `general.tsx.backup`
  - [x] 7.1.2 Crear nuevo `src/components/consultas/inea/index.tsx`
  - [x] 7.1.3 Importar y configurar todos los hooks
  - [x] 7.1.4 Importar y renderizar todos los componentes
  - [x] 7.1.5 Implementar gestión de modales
  - [x] 7.1.6 Implementar manejo de mensajes

- [x] 7.2 Actualizar página de consulta
  - [x] 7.2.1 Actualizar `src/app/consultas/inea/general/page.tsx`
  - [x] 7.2.2 Importar nuevo componente desde `index.tsx`

## FASE 8: Migración Relacional

- [x] 8.1 Actualizar hook de indexación
  - [x] 8.1.1 Modificar `src/hooks/indexation/useIneaIndexation.ts`
  - [x] 8.1.2 Agregar JOINs para `area` y `directorio`
  - [x] 8.1.3 Actualizar query de Supabase

- [x] 8.2 Actualizar lógica de selección de director
  - [x] 8.2.1 Modificar `handleSelectDirector` para usar `id_directorio`
  - [x] 8.2.2 Actualizar lógica de áreas múltiples
  - [x] 8.2.3 Actualizar guardado con campos relacionales

- [x] 8.3 Actualizar lógica de guardado
  - [x] 8.3.1 Modificar `saveChanges` en `useItemEdit`
  - [x] 8.3.2 Guardar `id_directorio` e `id_area` en lugar de texto
  - [x] 8.3.3 Mantener compatibilidad con campos legacy

## FASE 9: Sistema de Sincronización

- [x] 9.1 Integrar store de sincronización
  - [x] 9.1.1 Importar `useIneaStore` en `useItemEdit`
  - [x] 9.1.2 Agregar ID a `syncingIds` al iniciar guardado
  - [x] 9.1.3 Remover ID de `syncingIds` al completar guardado

- [x] 9.2 Implementar skeletons en tabla
  - [x] 9.2.1 Modificar `InventoryTable` para mostrar skeletons
  - [x] 9.2.2 Verificar si `item.id` está en `syncingIds`
  - [x] 9.2.3 Mostrar skeleton en celdas afectadas

- [x] 9.3 Implementar feedback visual
  - [x] 9.3.1 Agregar animaciones de sincronización
  - [x] 9.3.2 Agregar indicador de progreso en DetailPanel

## FASE 10: Refinamiento y Optimización

- [x] 10.1 Optimización de rendimiento
  - [x] 10.1.1 Agregar memoización con `useMemo` donde sea necesario
  - [x] 10.1.2 Agregar `useCallback` para funciones pasadas como props
  - [x] 10.1.3 Optimizar re-renders con `React.memo`

- [x] 10.2 Pruebas y validación
  - [x] 10.2.1 Probar flujo completo de búsqueda y filtrado
  - [x] 10.2.2 Probar flujo de edición y guardado
  - [x] 10.2.3 Probar flujo de selección de director
  - [x] 10.2.4 Probar flujo de dar de baja
  - [x] 10.2.5 Probar sincronización realtime

- [x] 10.3 Pulido de UI/UX
  - [x] 10.3.1 Verificar consistencia de diseño con ITEA
  - [x] 10.3.2 Ajustar espaciados y tipografía
  - [x] 10.3.3 Verificar animaciones y transiciones
  - [x] 10.3.4 Verificar modo oscuro y claro

- [x] 10.4 Documentación
  - [x] 10.4.1 Agregar comentarios JSDoc a hooks
  - [x] 10.4.2 Agregar comentarios JSDoc a componentes
  - [x] 10.4.3 Actualizar README si es necesario

- [x] 10.5 Limpieza
  - [x] 10.5.1 Eliminar archivo backup `general.tsx.backup`
  - [x] 10.5.2 Eliminar imports no utilizados
  - [x] 10.5.3 Verificar que no haya console.logs de debug

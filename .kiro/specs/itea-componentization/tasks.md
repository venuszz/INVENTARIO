# Componentización de ITEA General - Tareas

## Estado: 🔄 En Progreso

## Fase 1: Preparación y Estructura Base
- [x] 1.1 Crear estructura de carpetas completa
  - [x] 1.1.1 Crear carpeta `src/components/consultas/itea/components/`
  - [x] 1.1.2 Crear carpeta `src/components/consultas/itea/hooks/`
  - [x] 1.1.3 Crear carpeta `src/components/consultas/itea/modals/`
- [x] 1.2 Crear archivo `types.ts` con todas las definiciones de tipos
- [x] 1.3 Crear archivo `utils.tsx` con funciones utilitarias
- [x] 1.4 Hacer backup del componente original como `general.tsx.backup`

## Fase 2: Extracción de Hooks
- [x] 2.1 Crear `hooks/useResguardoData.ts`
  - Extraer lógica de carga de folios de resguardo
  - Extraer lógica de detalles de resguardo
  - Retornar `foliosResguardo` y `resguardoDetalles`
- [x] 2.2 Crear `hooks/useAreaManagement.ts`
  - Extraer lógica de carga de áreas
  - Extraer lógica de relaciones N:M directorio_areas
  - Retornar `areas` y `directorAreasMap`
- [x] 2.3 Crear `hooks/useDirectorManagement.ts`
  - Extraer `fetchDirectores`
  - Extraer `fetchFilterOptions`
  - Retornar `directorio`, `fetchDirectorio`, `fetchFilterOptions`
- [x] 2.4 Crear `hooks/useSearchAndFilters.ts`
  - Extraer toda la lógica de búsqueda omnibox
  - Extraer lógica de filtros activos
  - Extraer lógica de sugerencias
  - Extraer lógica de detección de tipo de búsqueda
  - Retornar todas las funciones y estados necesarios
- [x] 2.5 Crear `hooks/useItemEdit.ts`
  - Extraer lógica de selección de item
  - Extraer lógica de edición
  - Extraer lógica de guardado
  - Extraer lógica de carga de imágenes
  - Extraer lógica de baja e inactivo
  - Retornar todas las funciones y estados necesarios

## Fase 3: Componentes Básicos
- [x] 3.1 Crear `components/Header.tsx`
  - Título "Consulta de Inventario ITEA"
  - Descripción
  - SectionRealtimeToggle
- [x] 3.2 Crear `components/ValueStatsPanel.tsx`
  - Panel de valor total con animaciones
  - Panel de conteo de artículos
  - Soporte para tema oscuro/claro
- [x] 3.3 Crear `components/TableSkeleton.tsx`
  - Skeleton loader animado
  - 8 filas de placeholder
  - Soporte para tema oscuro/claro
- [x] 3.4 Crear `components/ImagePreview.tsx`
  - Carga de imagen desde Supabase Storage
  - Estados de carga
  - Estados de error
  - Manejo de signed URLs

## Fase 4: Componentes de Búsqueda y Filtrado
- [x] 4.1 Crear `components/SuggestionDropdown.tsx`
  - Lista de sugerencias con scroll
  - Highlight del item seleccionado
  - Iconos de tipo de filtro
  - Manejo de clicks
- [x] 4.2 Crear `components/SearchBar.tsx`
  - Input de búsqueda
  - Integración con SuggestionDropdown
  - Manejo de teclado (arrows, enter, escape)
  - Botón de agregar filtro
- [x] 4.3 Crear `components/FilterChips.tsx`
  - Chips de filtros activos
  - Botón de eliminar por filtro
  - Botón de limpiar todos
  - Animaciones de entrada/salida

## Fase 5: Componentes de Tabla
- [x] 5.1 Crear `components/InventoryTable.tsx`
  - Headers ordenables
  - Filas de datos con truncado de texto
  - Highlight de item seleccionado
  - Badges de estatus con colores
  - Badges de folio de resguardo
  - Estados de carga (usa TableSkeleton)
  - Estados de error
  - Estados vacíos
  - Soporte para tema oscuro/claro
- [x] 5.2 Crear `components/Pagination.tsx`
  - Contador de registros
  - Selector de filas por página
  - Indicador de página actual
  - Botones de navegación (primera, anterior, siguiente, última)
  - Botones numerados dinámicos
  - Soporte para tema oscuro/claro

## Fase 6: Componentes de Detalle
- [x] 6.1 Crear `components/CustomSelect.tsx`
  - Select personalizado con estilos consistentes
  - Soporte para tema oscuro/claro
  - Placeholder opcional
- [x] 6.2 Crear `components/DetailPanel.tsx`
  - Header con botón de cerrar
  - Modo vista: información del item
  - Modo edición: formulario completo
  - Integración con ImagePreview
  - Sección de información de resguardo
  - Manejo de cambios en formulario
  - Soporte para tema oscuro/claro
- [x] 6.3 Crear `components/ActionButtons.tsx`
  - Botones de editar, guardar, cancelar
  - Botones de marcar inactivo y dar de baja
  - Visibilidad según rol de usuario
  - Visibilidad según modo (edición/vista)
  - Soporte para tema oscuro/claro

## Fase 7: Modales
- [x] 7.1 Crear `modals/InactiveModal.tsx`
  - Modal de confirmación para marcar inactivo
  - Muestra información del item
  - Botones de confirmar y cancelar
  - Soporte para tema oscuro/claro
- [x] 7.2 Crear `modals/BajaModal.tsx`
  - Modal de confirmación para dar de baja
  - Input de causa de baja
  - Muestra información del item
  - Botones de confirmar y cancelar
  - Validación de causa requerida
  - Soporte para tema oscuro/claro
- [x] 7.3 Crear `modals/DirectorModal.tsx`
  - Modal para completar información de director
  - Input de área
  - Muestra nombre del director
  - Botones de guardar y cancelar
  - Estado de guardando
  - Soporte para tema oscuro/claro
- [x] 7.4 Crear `modals/AreaSelectionModal.tsx`
  - Modal para seleccionar área cuando director tiene múltiples
  - Lista de áreas disponibles
  - Botones de selección
  - Botón de cancelar
  - Soporte para tema oscuro/claro

## Fase 8: Integración del Orquestador
- [x] 8.1 Crear `index.tsx` con estructura básica
  - Imports de todos los hooks
  - Imports de todos los componentes
  - Imports de todos los modales
  - Estado local necesario
- [x] 8.2 Integrar hooks en index.tsx
  - useIteaIndexation para datos
  - useResguardoData
  - useAreaManagement
  - useDirectorManagement
  - useSearchAndFilters
  - useItemEdit
- [x] 8.3 Implementar lógica de carga de datos
  - useEffect para cargar filter options
  - useEffect para cargar directorio
  - useEffect para auto-dismiss de mensajes
- [x] 8.4 Implementar handlers de eventos
  - handleSelectDirector (con lógica N:M)
  - saveDirectorInfo
  - handleSort
  - handlePageChange
  - handleRowsPerPageChange
  - onItemSelect
- [x] 8.5 Implementar cálculos derivados
  - sortedMuebles con useMemo
  - totalFilteredCount
  - totalPages
  - paginatedMuebles
  - filteredValue y allValue
- [x] 8.6 Renderizar estructura completa
  - Layout principal con motion
  - Header
  - ValueStatsPanel
  - Message banner con AnimatePresence
  - SearchBar con botón de agregar filtro
  - FilterChips condicional
  - Grid condicional (1 o 2 columnas)
  - InventoryTable
  - Pagination
  - DetailPanel condicional con AnimatePresence
  - ActionButtons en DetailPanel
  - Todos los modales

## Fase 9: Pruebas y Ajustes
- [x] 9.1 Probar búsqueda y filtrado
  - Búsqueda por ID
  - Búsqueda por descripción
  - Búsqueda por área
  - Búsqueda por director
  - Búsqueda por resguardante
  - Filtros múltiples
  - Limpiar filtros
- [x] 9.2 Probar edición de items
  - Abrir modo edición
  - Modificar campos
  - Guardar cambios
  - Cancelar edición
  - Subir imagen
  - Cambiar imagen existente
- [x] 9.3 Probar selección de directores
  - Director sin área (debe abrir DirectorModal)
  - Director con una área (debe asignar directo)
  - Director con múltiples áreas (debe abrir AreaSelectionModal)
  - Guardar información de director
- [x] 9.4 Probar modales de baja e inactivo
  - Abrir modal de inactivo
  - Confirmar inactivo
  - Cancelar inactivo
  - Abrir modal de baja
  - Ingresar causa de baja
  - Confirmar baja
  - Cancelar baja
- [x] 9.5 Probar paginación
  - Cambiar página con botones
  - Cambiar filas por página
  - Verificar contador de registros
  - Primera página
  - Última página
  - Botones numerados
- [x] 9.6 Probar ordenamiento
  - Ordenar por ID
  - Ordenar por descripción
  - Ordenar por área
  - Ordenar por director
  - Ordenar por estatus
  - Cambiar dirección (asc/desc)
- [x] 9.7 Probar tema oscuro/claro
  - Verificar todos los componentes en tema oscuro
  - Verificar todos los componentes en tema claro
  - Verificar transiciones de tema
- [x] 9.8 Probar integración con resguardos
  - Verificar badges de folio
  - Verificar información de resguardo en detalle
  - Verificar links a resguardos
- [x] 9.9 Probar notificaciones
  - Notificación al editar
  - Notificación al marcar inactivo
  - Notificación al dar de baja
  - Notificación de errores
- [x] 9.10 Probar permisos de rol
  - Usuario admin puede editar
  - Usuario superadmin puede editar
  - Usuario normal no ve botones de edición

## Fase 10: Limpieza y Optimización
- [x] 10.1 Eliminar imports no utilizados
- [x] 10.2 Verificar que no hay errores de TypeScript
- [x] 10.3 Verificar que no hay warnings de ESLint
- [x] 10.4 Optimizar re-renders con React DevTools
- [x] 10.5 Verificar uso correcto de useMemo y useCallback
- [x] 10.6 Documentar funciones complejas
- [x] 10.7 Verificar accesibilidad (aria-labels, titles)
- [x] 10.8 Eliminar console.logs de desarrollo
- [x] 10.9 Verificar que el archivo original está respaldado
- [x] 10.10 Actualizar imports en `src/app/consultas/itea/general/page.tsx`

## Fase 11: Documentación
- [ ] 11.1 Documentar estructura de carpetas en README
- [ ] 11.2 Documentar props de cada componente
- [ ] 11.3 Documentar hooks y sus retornos
- [ ] 11.4 Documentar tipos en types.ts
- [ ] 11.5 Documentar funciones utilitarias

## Notas de Implementación

### Prioridades
1. **Crítico**: Fases 1-8 (estructura y funcionalidad básica)
2. **Alto**: Fase 9 (pruebas)
3. **Medio**: Fase 10 (limpieza)
4. **Bajo**: Fase 11 (documentación)

### Dependencias entre Tareas
- Fase 2 depende de Fase 1 (estructura)
- Fase 3-7 pueden hacerse en paralelo después de Fase 2
- Fase 8 depende de Fases 2-7
- Fase 9 depende de Fase 8
- Fase 10-11 dependen de Fase 9

### Estimación de Tiempo
- Fase 1: 30 minutos
- Fase 2: 2 horas
- Fase 3: 1 hora
- Fase 4: 1.5 horas
- Fase 5: 2 horas
- Fase 6: 2 horas
- Fase 7: 2 horas
- Fase 8: 3 horas
- Fase 9: 2 horas
- Fase 10: 1 hora
- Fase 11: 1 hora
**Total Estimado: 18 horas**

### Puntos de Verificación
- ✅ Después de Fase 1: Estructura de carpetas creada
- ✅ Después de Fase 2: Hooks funcionan independientemente
- ✅ Después de Fase 7: Todos los componentes y modales creados
- ✅ Después de Fase 8: Componente integrado funciona
- ✅ Después de Fase 9: Todas las funcionalidades probadas
- ✅ Después de Fase 10: Código limpio y optimizado
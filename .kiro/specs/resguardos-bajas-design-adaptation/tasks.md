# Resguardos Bajas - Tareas de Adaptación de Diseño

## Fase 1: Componente Principal y Layout

### 1.1 Actualizar index.tsx - Layout Principal
- [x] Cambiar contenedor principal de `min-h-screen` a `h-[calc(100vh-4rem)] overflow-hidden`
- [x] Agregar contenedor interno con `h-full overflow-y-auto` y clases de scrollbar
- [x] Agregar contenedor max-width: `w-full max-w-7xl mx-auto pb-8`
- [x] Actualizar grid layout: `grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8`
- [x] Agregar `space-y-6` a columnas del grid
- [x] Agregar estilos de scrollbar personalizado al final del componente

### 1.2 Actualizar Loading Overlay
- [x] Simplificar overlay: `bg-black/50 backdrop-blur-sm`
- [x] Actualizar contenedor interno con bordes sutiles
- [x] Simplificar spinner y texto

## Fase 2: Header Component

### 2.1 Actualizar Header.tsx
- [x] Simplificar contenedor: eliminar gradientes, usar `bg-white/[0.02] border-white/10`
- [x] Actualizar padding: `p-6`
- [x] Simplificar badge "BAJ": eliminar sombras pesadas
- [x] Actualizar contador con bordes sutiles
- [x] Mantener SectionRealtimeToggle sin cambios

## Fase 3: SearchAndFilters Component

### 3.1 Actualizar SearchAndFilters.tsx
- [x] Actualizar contenedor principal con bordes sutiles
- [x] Actualizar input de búsqueda con estilos modernos
- [x] Actualizar inputs de fecha con transiciones
- [x] Actualizar inputs de director y resguardante
- [x] Simplificar botones de acción (Limpiar, Refrescar)
- [x] Mantener toda la lógica de filtros intacta

## Fase 4: BajasTable Component

### 4.1 Actualizar BajasTable.tsx
- [x] Actualizar contenedor de tabla con bordes sutiles
- [x] Simplificar encabezados de tabla
- [x] Actualizar filas con hover sutil: `hover:bg-white/[0.02]`
- [x] Destacar fila seleccionada con `bg-blue-500/10`
- [x] Actualizar estados de carga con spinner simplificado
- [x] Actualizar estado de error
- [x] Actualizar estado vacío
- [x] Mantener toda la lógica de sorting y selección

## Fase 5: Pagination Component

### 5.1 Actualizar Pagination.tsx
- [x] Simplificar contenedor: eliminar `shadow-inner`
- [x] Actualizar selector de filas por página
- [x] Simplificar botones de navegación
- [x] Actualizar estados disabled
- [x] Mantener toda la lógica de paginación

## Fase 6: BajaDetailsPanel Component

### 6.1 Actualizar BajaDetailsPanel.tsx
- [x] Actualizar contenedor principal con bordes sutiles
- [x] Actualizar sección de información del folio
- [x] Simplificar botón "Generar PDF" con colores azules
- [x] Simplificar botón "Eliminar Folio" con colores rojos
- [x] Actualizar estado vacío con diseño simplificado
- [x] Mantener toda la lógica de acciones

## Fase 7: ArticulosListPanel Component

### 7.1 Actualizar ArticulosListPanel.tsx
- [x] Actualizar contenedor de grupos con bordes sutiles
- [x] Simplificar header de grupo
- [x] Actualizar items de artículos con hover sutil
- [x] Simplificar botones de acción en items
- [x] Actualizar controles de selección
- [x] Simplificar botón "Eliminar seleccionados"
- [x] Mantener toda la lógica de selección y agrupación

## Fase 8: Modales

### 8.1 Actualizar PDFDownloadModal.tsx
- [x] Agregar backdrop blur: `backdrop-blur-sm bg-black/80`
- [x] Actualizar contenedor del modal: `backdrop-blur-xl bg-black/95 border-white/10`
- [x] Simplificar contenido con bordes sutiles
- [x] Actualizar botones de acción
- [x] Mantener toda la lógica de descarga

### 8.2 Actualizar DeleteModal.tsx
- [x] Agregar backdrop blur
- [x] Actualizar contenedor del modal
- [x] Agregar icono de alerta con fondo rojo sutil
- [x] Simplificar mensaje de confirmación
- [x] Actualizar botones de acción
- [x] Mantener toda la lógica de eliminación

### 8.3 Actualizar ErrorAlert.tsx
- [x] Convertir a toast en esquina inferior derecha
- [x] Agregar backdrop blur sutil
- [x] Actualizar colores para modo claro/oscuro
- [x] Agregar animación fade-in
- [x] Simplificar botón de cerrar
- [x] Mantener toda la lógica de errores

## Fase 9: Verificación y Testing

### 9.1 Verificación Visual
- [x] Verificar modo oscuro en todos los componentes
- [x] Verificar modo claro en todos los componentes
- [x] Verificar transiciones suaves
- [x] Verificar scrollbars personalizados
- [x] Verificar responsive design en mobile
- [x] Verificar hover effects en todos los elementos interactivos
- [x] Verificar focus states en inputs
- [x] Verificar backdrop blur en modales

### 9.2 Verificación de TypeScript
- [x] Ejecutar `npm run type-check` o equivalente
- [x] Resolver cualquier error de tipos
- [x] Verificar que no hay warnings

### 9.3 Testing Funcional
- [x] Probar búsqueda de bajas
- [x] Probar filtros (fecha, director, resguardante)
- [x] Probar paginación (cambio de página, filas por página)
- [x] Probar selección de folio
- [x] Probar selección de items individuales
- [x] Probar selección de grupos
- [x] Probar generación de PDF
- [x] Probar eliminación de folio completo
- [x] Probar eliminación de items seleccionados
- [x] Probar eliminación de item individual
- [x] Verificar que modales se abren y cierran correctamente
- [x] Verificar que errores se muestran correctamente
- [x] Probar carga desde URL parameter (folio)

### 9.4 Testing de Integración
- [x] Verificar que realtime indexation funciona
- [x] Verificar que los datos se cargan correctamente
- [x] Verificar que las operaciones CRUD funcionan
- [x] Verificar que no hay errores en consola
- [x] Verificar que no hay warnings en consola

## Fase 10: Refinamiento

### 10.1 Ajustes Finales
- [x] Revisar consistencia de espaciado
- [x] Revisar consistencia de colores
- [x] Revisar consistencia de bordes
- [x] Revisar consistencia de transiciones
- [x] Optimizar clases de Tailwind (eliminar duplicados)

### 10.2 Documentación
- [x] Agregar comentarios si es necesario
- [x] Verificar que props están documentadas
- [x] Verificar que componentes tienen descripciones

## Notas Importantes

### ⚠️ Reglas Críticas
1. **NO modificar ningún hook**
2. **NO modificar tipos TypeScript**
3. **NO modificar lógica de negocio**
4. **NO modificar props de componentes**
5. **NO modificar event handlers**
6. **SOLO modificar clases de Tailwind CSS**
7. **SOLO modificar estructura JSX para layout**

### ✅ Cambios Permitidos
- Clases de Tailwind CSS
- Estructura JSX (solo para mejorar layout)
- Estilos inline (solo para scrollbars)
- Orden visual de elementos (sin afectar funcionalidad)

### 🎯 Objetivo
Lograr consistencia visual con `crear` y `consultar` sin romper ninguna funcionalidad existente.

## Checklist Final

Antes de considerar completa la tarea, verificar:

- [x] Todos los componentes tienen el nuevo diseño
- [x] Modo claro funciona perfectamente
- [x] Modo oscuro funciona perfectamente
- [x] No hay errores de TypeScript
- [x] No hay warnings en consola
- [x] Todas las funcionalidades existentes funcionan
- [x] El diseño es consistente con `crear` y `consultar`
- [x] Las transiciones son suaves
- [x] Los scrollbars personalizados funcionan
- [x] El responsive design funciona en mobile
- [x] Los modales tienen backdrop blur
- [x] Los hover effects funcionan
- [x] Los focus states funcionan

# Refactorización de Consultar Resguardos - Requirements

## 1. Visión General

Refactorizar el componente monolítico `src/components/resguardos/consultar.tsx` en una estructura modular y organizada siguiendo el patrón establecido en `src/components/resguardos/crear/`, sin cambiar absolutamente nada de la lógica ni el diseño existente.

## 2. Objetivos

### 2.1 Objetivo Principal
- Reorganizar el código en una estructura de carpetas modular manteniendo el 100% de la funcionalidad existente

### 2.2 Objetivos Secundarios
- Mejorar la mantenibilidad del código
- Facilitar la comprensión de la estructura del componente
- Seguir el patrón establecido en otros componentes del proyecto
- Mantener todos los estilos, animaciones y comportamientos exactamente iguales

## 3. User Stories

### 3.1 Como desarrollador
**Quiero** que el componente ConsultarResguardos esté organizado en carpetas modulares  
**Para** poder mantener y entender el código más fácilmente  
**Criterios de aceptación:**
- El componente principal está en `src/components/resguardos/consultar/index.tsx`
- Los hooks personalizados están en `src/components/resguardos/consultar/hooks/`
- Los componentes UI están en `src/components/resguardos/consultar/components/`
- Los modales están en `src/components/resguardos/consultar/modals/`
- Las interfaces y tipos están en `src/components/resguardos/consultar/types.ts`
- Las funciones auxiliares están en `src/components/resguardos/consultar/utils.ts`

### 3.2 Como usuario final
**Quiero** que la aplicación funcione exactamente igual después de la refactorización  
**Para** no experimentar ningún cambio en mi flujo de trabajo  
**Criterios de aceptación:**
- Todas las funcionalidades existentes funcionan idénticamente
- Todos los estilos visuales permanecen iguales
- Todas las animaciones y transiciones se mantienen
- El rendimiento es igual o mejor
- No hay regresiones en ninguna funcionalidad

## 4. Alcance

### 4.1 En Alcance

#### 4.1.1 Estructura de Carpetas
- Crear estructura de carpetas siguiendo el patrón de `crear/`
- Organizar archivos por responsabilidad

#### 4.1.2 Extracción de Tipos
- Mover todas las interfaces a `types.ts`:
  - `Resguardo`
  - `ResguardoDetalle`
  - `ResguardoArticulo`
  - `PdfFirma`
  - `PdfData`
  - `PdfDataBaja`

#### 4.1.3 Extracción de Utilidades
- Mover funciones auxiliares a `utils.ts`:
  - `getExactArticulo`
  - `limpiarDatosArticulo`

#### 4.1.4 Extracción de Hooks
Crear hooks personalizados para:
- `useResguardosData` - Manejo de datos de resguardos (fetch, filtros, paginación)
- `useResguardoDetails` - Manejo de detalles de un resguardo específico
- `useResguardoDelete` - Lógica de eliminación (individual, múltiple, completo)
- `useResguardantesEdit` - Lógica de edición de resguardantes
- `usePDFGeneration` - Generación de PDFs (resguardo y baja)
- `useArticuloSelection` - Selección múltiple de artículos

#### 4.1.5 Extracción de Componentes UI
Crear componentes para:
- `Header` - Encabezado con título y contador
- `SearchBar` - Barra de búsqueda principal
- `AdvancedFilters` - Filtros avanzados (fecha, director, resguardante)
- `ResguardosTable` - Tabla de resguardos
- `Pagination` - Controles de paginación
- `ResguardoDetailsPanel` - Panel de detalles del resguardo
- `ArticulosListPanel` - Panel de lista de artículos con edición
- `LoadingOverlay` - Overlay de carga para folio param

#### 4.1.6 Extracción de Modales
Crear modales para:
- `PDFDownloadModal` - Modal para descargar PDF de resguardo
- `PDFBajaModal` - Modal para descargar PDF de baja
- `DeleteAllModal` - Modal de confirmación para borrar resguardo completo
- `DeleteItemModal` - Modal de confirmación para borrar un artículo
- `DeleteSelectedModal` - Modal de confirmación para borrar artículos seleccionados
- `ErrorAlert` - Alerta de error
- `SuccessAlert` - Alerta de éxito

### 4.2 Fuera de Alcance
- Cambios en la lógica de negocio
- Cambios en los estilos o diseño visual
- Cambios en las animaciones o transiciones
- Optimizaciones de rendimiento (a menos que sean necesarias para mantener el comportamiento actual)
- Cambios en las dependencias externas
- Refactorización de componentes relacionados (ResguardoPDFReport, BajaPDFReport, etc.)

## 5. Requisitos Funcionales

### 5.1 Mantenimiento de Funcionalidad Existente

#### 5.1.1 Búsqueda y Filtrado
- **RF-1.1:** El sistema debe mantener la búsqueda por folio con debounce de 100ms
- **RF-1.2:** El sistema debe mantener los filtros por fecha, director y resguardante
- **RF-1.3:** El sistema debe mantener la lógica de agrupación por folio único

#### 5.1.2 Paginación y Ordenamiento
- **RF-2.1:** El sistema debe mantener la paginación con opciones de 10, 25, 50, 100 por página
- **RF-2.2:** El sistema debe mantener el ordenamiento por folio, fecha, director y resguardante
- **RF-2.3:** El sistema debe mantener la dirección de ordenamiento (asc/desc)

#### 5.1.3 Visualización de Detalles
- **RF-3.1:** El sistema debe mostrar los detalles del resguardo al hacer clic en un folio
- **RF-3.2:** El sistema debe agrupar artículos por resguardante
- **RF-3.3:** El sistema debe mostrar tooltips con resguardantes en la tabla
- **RF-3.4:** El sistema debe hacer scroll automático al panel de detalles en móvil

#### 5.1.4 Edición de Resguardantes
- **RF-4.1:** El sistema debe permitir editar resguardantes individualmente
- **RF-4.2:** El sistema debe guardar cambios en la tabla resguardos y en muebles/mueblesitea
- **RF-4.3:** El sistema debe mostrar modo de edición con inputs editables

#### 5.1.5 Eliminación de Artículos
- **RF-5.1:** El sistema debe permitir eliminar un artículo individual
- **RF-5.2:** El sistema debe permitir eliminar múltiples artículos seleccionados
- **RF-5.3:** El sistema debe permitir eliminar el resguardo completo
- **RF-5.4:** El sistema debe generar folio de baja automáticamente
- **RF-5.5:** El sistema debe mover registros a resguardos_bajas antes de eliminar
- **RF-5.6:** El sistema debe limpiar área, usufinal y resguardante en muebles/mueblesitea

#### 5.1.6 Generación de PDFs
- **RF-6.1:** El sistema debe generar PDF de resguardo completo
- **RF-6.2:** El sistema debe generar PDF de resguardo por resguardante específico
- **RF-6.3:** El sistema debe generar PDF de baja después de eliminar artículos
- **RF-6.4:** El sistema debe incluir firmas en los PDFs

#### 5.1.7 Carga por Parámetro
- **RF-7.1:** El sistema debe cargar automáticamente un resguardo si hay parámetro ?folio=XXX
- **RF-7.2:** El sistema debe mostrar overlay de carga mientras carga el folio
- **RF-7.3:** El sistema debe hacer scroll al detalle después de cargar

#### 5.1.8 Selección Múltiple
- **RF-8.1:** El sistema debe permitir seleccionar múltiples artículos con checkboxes
- **RF-8.2:** El sistema debe mostrar contador de artículos seleccionados
- **RF-8.3:** El sistema debe permitir limpiar selección

## 6. Requisitos No Funcionales

### 6.1 Mantenibilidad
- **RNF-1.1:** El código debe estar organizado en módulos cohesivos
- **RNF-1.2:** Cada hook debe tener una responsabilidad única y clara
- **RNF-1.3:** Los componentes UI deben ser reutilizables cuando sea posible

### 6.2 Compatibilidad
- **RNF-2.1:** El componente debe funcionar en todos los navegadores soportados actualmente
- **RNF-2.2:** El componente debe ser responsive en todos los tamaños de pantalla
- **RNF-2.3:** El componente debe mantener compatibilidad con el tema oscuro/claro

### 6.3 Rendimiento
- **RNF-3.1:** El tiempo de carga inicial no debe aumentar
- **RNF-3.2:** Las interacciones del usuario deben responder en el mismo tiempo
- **RNF-3.3:** El uso de memoria no debe aumentar significativamente

### 6.4 Calidad de Código
- **RNF-4.1:** El código debe seguir las convenciones de TypeScript
- **RNF-4.2:** Los tipos deben estar correctamente definidos
- **RNF-4.3:** No debe haber errores de TypeScript
- **RNF-4.4:** No debe haber warnings de ESLint

## 7. Restricciones

### 7.1 Restricciones Técnicas
- Debe usar React 18+ con hooks
- Debe usar TypeScript
- Debe mantener todas las dependencias actuales
- No debe introducir nuevas dependencias

### 7.2 Restricciones de Diseño
- Debe mantener exactamente los mismos estilos CSS/Tailwind
- Debe mantener las mismas clases de Tailwind
- Debe mantener las mismas animaciones y transiciones
- Debe mantener los mismos iconos de lucide-react

### 7.3 Restricciones de Comportamiento
- Debe mantener exactamente el mismo flujo de usuario
- Debe mantener los mismos mensajes de error y éxito
- Debe mantener las mismas validaciones
- Debe mantener los mismos efectos secundarios

## 8. Dependencias

### 8.1 Dependencias Internas
- `@/app/lib/supabase/client` - Cliente de Supabase
- `@/hooks/useUserRole` - Hook de rol de usuario
- `@/hooks/useResguardosIndexation` - Hook de indexación de resguardos
- `@/hooks/useFolioGenerator` - Hook de generación de folios
- `@/context/ThemeContext` - Contexto de tema
- `@/components/roleGuard` - Componente de guard de roles
- `@/components/SectionRealtimeToggle` - Toggle de realtime
- `./ResguardoPDFReport` - Generador de PDF de resguardo
- `./BajaPDFReport` - Generador de PDF de baja

### 8.2 Dependencias Externas
- `react` - Framework
- `next/navigation` - Navegación de Next.js
- `lucide-react` - Iconos
- `@supabase/supabase-js` - Cliente de Supabase

## 9. Criterios de Aceptación Globales

### 9.1 Funcionalidad
- ✅ Todas las funcionalidades existentes funcionan idénticamente
- ✅ No hay regresiones en ninguna funcionalidad
- ✅ Todos los casos de uso funcionan correctamente
- ✅ Todos los flujos de usuario funcionan correctamente

### 9.2 Diseño
- ✅ Todos los estilos visuales permanecen iguales
- ✅ Todas las animaciones y transiciones se mantienen
- ✅ El tema oscuro/claro funciona correctamente
- ✅ La responsividad se mantiene en todos los tamaños de pantalla

### 9.3 Código
- ✅ El código está organizado en la estructura de carpetas especificada
- ✅ No hay errores de TypeScript
- ✅ No hay warnings de ESLint
- ✅ Los tipos están correctamente definidos

### 9.4 Testing
- ✅ El componente se puede importar desde la nueva ubicación
- ✅ Todas las interacciones del usuario funcionan correctamente
- ✅ Los modales se abren y cierran correctamente
- ✅ Los PDFs se generan correctamente
- ✅ Las eliminaciones funcionan correctamente
- ✅ La edición de resguardantes funciona correctamente

## 10. Notas Adicionales

### 10.1 Patrón de Referencia
El componente `src/components/resguardos/crear/` debe usarse como referencia para:
- Estructura de carpetas
- Organización de hooks
- Organización de componentes
- Organización de modales
- Nomenclatura de archivos

### 10.2 Consideraciones Especiales
- El componente actual tiene ~1954 líneas, por lo que la refactorización será extensa
- Hay múltiples estados y efectos que deben mantenerse exactamente iguales
- La lógica de eliminación es compleja y debe preservarse completamente
- La generación de PDFs tiene múltiples variantes que deben mantenerse
- La edición de resguardantes tiene sincronización con múltiples tablas

### 10.3 Orden de Implementación Sugerido
1. Crear estructura de carpetas
2. Extraer tipos e interfaces
3. Extraer funciones auxiliares
4. Crear hooks personalizados
5. Crear componentes UI
6. Crear modales
7. Actualizar componente principal
8. Actualizar imports en archivos que usan el componente
9. Verificar funcionalidad completa

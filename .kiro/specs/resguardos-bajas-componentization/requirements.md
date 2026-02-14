# Resguardos Bajas - Componentization Requirements

## Overview
Refactorizar el componente monolítico `consultarBajas.tsx` en una arquitectura modular y escalable siguiendo los patrones establecidos en `resguardos/crear` y `resguardos/consultar`.

## User Stories

### 1. Como desarrollador, quiero una estructura de carpetas organizada
**Acceptance Criteria:**
- 1.1 El componente principal debe estar en `src/components/resguardos/consultarBajas/index.tsx`
- 1.2 Los hooks personalizados deben estar en `src/components/resguardos/consultarBajas/hooks/`
- 1.3 Los componentes de UI deben estar en `src/components/resguardos/consultarBajas/components/`
- 1.4 Los modales deben estar en `src/components/resguardos/consultarBajas/modals/`
- 1.5 Los tipos deben estar en `src/components/resguardos/consultarBajas/types.ts`
- 1.6 Las utilidades deben estar en `src/components/resguardos/consultarBajas/utils.ts` (si es necesario)

### 2. Como desarrollador, quiero hooks personalizados para lógica de negocio
**Acceptance Criteria:**
- 2.1 Debe existir un hook `useBajasData` para manejo de datos de bajas (fetch, paginación, ordenamiento)
- 2.2 Debe existir un hook `useBajaDetails` para manejo de detalles de una baja específica
- 2.3 Debe existir un hook `useSearchAndFilters` para búsqueda y filtros (fecha, director, resguardante)
- 2.4 Debe existir un hook `useBajaDelete` para operaciones de eliminación (folio completo, seleccionados, individual)
- 2.5 Debe existir un hook `usePDFGeneration` para generación de PDFs de baja
- 2.6 Debe existir un hook `useItemSelection` para manejo de selección de artículos

### 3. Como desarrollador, quiero componentes de UI reutilizables
**Acceptance Criteria:**
- 3.1 Debe existir un componente `Header` para el encabezado con título y estadísticas
- 3.2 Debe existir un componente `SearchAndFilters` para búsqueda y filtros avanzados
- 3.3 Debe existir un componente `BajasTable` para la tabla de folios de baja
- 3.4 Debe existir un componente `Pagination` para paginación
- 3.5 Debe existir un componente `BajaDetailsPanel` para panel de detalles del folio
- 3.6 Debe existir un componente `ArticulosListPanel` para lista de artículos agrupados por folio_baja

### 4. Como desarrollador, quiero modales organizados
**Acceptance Criteria:**
- 4.1 Debe existir un modal `DeleteFolioModal` para confirmar eliminación de folio completo
- 4.2 Debe existir un modal `DeleteSelectedModal` para confirmar eliminación de artículos seleccionados
- 4.3 Debe existir un modal `DeleteItemModal` para confirmar eliminación de artículo individual
- 4.4 Debe existir un modal `PDFDownloadModal` para descarga de PDF de baja
- 4.5 Debe existir un modal `ErrorAlert` para mostrar errores

### 5. Como desarrollador, quiero mantener toda la funcionalidad existente
**Acceptance Criteria:**
- 5.1 La búsqueda por folio de resguardo y folio de baja debe funcionar igual
- 5.2 Los filtros por fecha, director y resguardante deben funcionar igual
- 5.3 La paginación debe funcionar igual
- 5.4 El ordenamiento por columnas debe funcionar igual
- 5.5 La selección de artículos (individual y por grupo) debe funcionar igual
- 5.6 La eliminación (folio completo, seleccionados, individual) debe funcionar igual
- 5.7 La generación de PDF debe funcionar igual
- 5.8 El parámetro URL `?folio=XXX` debe funcionar igual
- 5.9 La integración con realtime (useResguardosBajasIndexation) debe funcionar igual
- 5.10 Los permisos por rol (admin/superadmin) deben funcionar igual

### 6. Como desarrollador, quiero mantener el diseño visual exacto
**Acceptance Criteria:**
- 6.1 Todos los estilos CSS deben mantenerse idénticos
- 6.2 El tema oscuro/claro debe funcionar igual
- 6.3 Las animaciones y transiciones deben mantenerse
- 6.4 Los colores y badges deben mantenerse
- 6.5 El layout responsive debe mantenerse
- 6.6 Los iconos y su posicionamiento deben mantenerse

### 7. Como desarrollador, quiero tipos TypeScript bien definidos
**Acceptance Criteria:**
- 7.1 Debe existir el tipo `ResguardoBaja` para items de la tabla
- 7.2 Debe existir el tipo `ResguardoBajaDetalle` para detalles con artículos
- 7.3 Debe existir el tipo `ResguardoBajaArticulo` para artículos individuales
- 7.4 Debe existir el tipo `PdfDataBaja` para datos del PDF
- 7.5 Todos los tipos deben estar exportados desde `types.ts`

## Technical Constraints

### Must Have
- Mantener 100% de la funcionalidad existente
- Mantener 100% del diseño visual existente
- No cambiar la lógica de negocio
- Mantener compatibilidad con el resto del sistema
- Mantener integración con Supabase
- Mantener integración con hooks de indexación

### Should Have
- Código más mantenible y escalable
- Separación clara de responsabilidades
- Hooks reutilizables
- Componentes pequeños y enfocados

### Could Have
- Documentación JSDoc en componentes y hooks
- Tests unitarios (futura implementación)

### Won't Have (en esta fase)
- Cambios en el diseño visual
- Cambios en la lógica de negocio
- Nuevas funcionalidades
- Optimizaciones de rendimiento (a menos que sean necesarias)

## Dependencies
- React 18+
- Next.js 14+
- TypeScript
- Supabase client
- Lucide React (iconos)
- Hooks existentes: `useTheme`, `useUserRole`, `useResguardosBajasIndexation`
- Utilidades existentes: `generateBajaPDF`

## Success Metrics
- ✅ Estructura de carpetas creada según patrón establecido
- ✅ Todos los hooks extraídos y funcionando
- ✅ Todos los componentes extraídos y funcionando
- ✅ Todos los modales extraídos y funcionando
- ✅ Tipos definidos y exportados
- ✅ Funcionalidad 100% preservada
- ✅ Diseño visual 100% preservado
- ✅ Sin errores de TypeScript
- ✅ Sin errores en runtime
- ✅ Código más mantenible y escalable

## Out of Scope
- Cambios en el diseño visual
- Cambios en la lógica de negocio
- Nuevas funcionalidades
- Refactorización de otros componentes
- Tests (se harán en una fase posterior)

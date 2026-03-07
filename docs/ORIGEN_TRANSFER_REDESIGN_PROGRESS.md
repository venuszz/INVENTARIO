# Progreso: Rediseño de Transferencia de Origen

**Fecha:** 2026-03-05  
**Objetivo:** Mover funcionalidad solo a Levantamiento

## Cambios Completados ✅

### Fase 1: Remoción de OrigenBadge de 5 Tablas

#### INEA General ✅
- ✅ Removido import de OrigenBadge
- ✅ Removida prop onRefetch
- ✅ Removido header "Origen"
- ✅ Removida celda con OrigenBadge
- ✅ Actualizado colSpan de 7→6 en todos los estados

#### ITEA General ✅
- ✅ Removido import de OrigenBadge
- ✅ Removida prop onRefetch
- ✅ Removido header "Origen"
- ✅ Removida celda con OrigenBadge
- ✅ Actualizado colSpan de 7→6 en todos los estados

#### No Listado ✅
- ✅ Removido import de OrigenBadge
- ✅ Removida prop onRefetch
- ✅ Removido header "Origen"
- ✅ Removida celda con OrigenBadge
- ✅ Actualizado colSpan de 7→6 en todos los estados

#### INEA Obsoletos ✅
- ✅ Removido import de OrigenBadge
- ✅ Removida prop onRefetch
- ✅ Removido header "Origen"
- ✅ Removida celda con OrigenBadge
- ✅ Actualizado colSpan de 6→5 en todos los estados

#### ITEA Obsoletos ✅
- ✅ Removido import de OrigenBadge
- ✅ Removida prop onRefetch
- ✅ Removido header "Origen"
- ✅ Removida celda con OrigenBadge
- ✅ Actualizado colSpan de 6→5 en todos los estados

### Fase 2: Adaptación de OrigenBadge para Levantamiento ✅

#### OrigenBadge Component ✅
- ✅ Agregado soporte para tipos INEA, ITEJPA, TLAXCALA (uppercase)
- ✅ Agregado prop `variant` ('default' | 'levantamiento')
- ✅ Agregado prop `isDarkMode` para soporte de tema oscuro
- ✅ Implementada configuración de colores para Levantamiento (getLevantamientoConfig)
- ✅ Implementada función normalizeOrigen para compatibilidad con API
- ✅ Implementada lógica getTargetOptions según variant
- ✅ Badge estático adaptado para variant levantamiento
- ✅ Badge interactivo adaptado para variant levantamiento con dark mode
- ✅ Dropdown adaptado con estilos dark mode

#### Integración en Levantamiento ✅
- ✅ Importado OrigenBadge en InventoryTable
- ✅ Agregada prop onRefetch a InventoryTable
- ✅ Reemplazado badge estático con OrigenBadge interactivo
- ✅ Mantenido indicador de color para ITEJPA
- ✅ Pasada prop onRefetch desde index.tsx (usando reindex)
- ✅ Configurado hasActiveResguardo basado en foliosResguardo
- ✅ Configurado variant="levantamiento"
- ✅ Configurado isDarkMode

### Fase 3: Rediseño del Modal ✅

#### Modal Improvements ✅
- ✅ Agregadas props `itemDescription`, `itemArea`, `itemDirector` a OrigenBadgeProps
- ✅ Agregados valores por defecto para las nuevas props
- ✅ Rediseñado modal body con sección de detalles del bien
- ✅ Mostrado ID, descripción, área y director en panel de detalles
- ✅ Cambiado layout de badges de vertical a horizontal
- ✅ Mejorado diseño visual con badges centrados
- ✅ Agregado ring effect cuando badge está seleccionado
- ✅ Movido checkmark a esquina superior derecha del badge
- ✅ Pasadas props desde InventoryTable (descripcion, area.nombre, directorio.nombre)

## Resumen Final

### Archivos Modificados
1. `src/components/consultas/inea/components/InventoryTable.tsx` - Removido OrigenBadge
2. `src/components/consultas/itea/components/InventoryTable.tsx` - Removido OrigenBadge
3. `src/components/consultas/no-listado/components/InventoryTable.tsx` - Removido OrigenBadge
4. `src/components/consultas/inea/obsoletos/components/InventoryTable.tsx` - Removido OrigenBadge
5. `src/components/consultas/itea/obsoletos/components/InventoryTable.tsx` - Removido OrigenBadge
6. `src/components/consultas/shared/OrigenBadge.tsx` - Adaptado para Levantamiento + Modal redesign
7. `src/components/consultas/levantamiento/components/InventoryTable.tsx` - Integrado OrigenBadge + Pasadas props de detalles
8. `src/components/consultas/levantamiento/index.tsx` - Pasada prop onRefetch

### Funcionalidad
- ✅ OrigenBadge removido de 5 tablas (INEA, ITEA, No Listado, INEA Obsoletos, ITEA Obsoletos)
- ✅ OrigenBadge adaptado para diseño de Levantamiento
- ✅ Soporte para INEA, ITEJPA, TLAXCALA
- ✅ Soporte para dark mode
- ✅ Indicador de color mantenido para ITEJPA
- ✅ Transferencia deshabilitada cuando hay resguardo activo
- ✅ Integración completa en Levantamiento
- ✅ Modal muestra ID correctamente
- ✅ Modal muestra detalles del bien (descripción, área, director)
- ✅ Badges en fila horizontal con diseño mejorado
- ✅ Diseño minimalista y limpio

### Diagnósticos
- ✅ Todos los archivos pasan diagnósticos sin errores

## Implementación Completa ✅

El rediseño de la transferencia de origen está completo. La funcionalidad ahora está disponible únicamente en la tabla de Levantamiento, con un diseño adaptado que coincide con el estilo existente y soporte completo para dark mode. El modal ahora muestra correctamente el ID y los detalles del bien, con los badges de selección en una fila horizontal para mejor usabilidad.

# Resguardos Crear - Store Update Requirements

## Overview
Actualizar el componente de creación de resguardos para que actualice el store local inmediatamente después de crear resguardos exitosamente, proporcionando feedback instantáneo sin esperar a que el realtime detecte los cambios.

## User Stories

### 1. Actualización Optimista del Store
**Como** usuario creando resguardos  
**Quiero** que los resguardos aparezcan inmediatamente en la lista de consulta  
**Para** no tener que esperar a que el realtime sincronice los datos

**Acceptance Criteria:**
- 1.1 Después de crear resguardos exitosamente, el store se actualiza inmediatamente
- 1.2 Los resguardos creados se agregan al store local usando `addResguardo`
- 1.3 Si navego a "Consultar Resguardos", los nuevos resguardos aparecen instantáneamente
- 1.4 El realtime sigue funcionando para detectar cambios de otros usuarios
- 1.5 No hay duplicados si el realtime también detecta el INSERT

### 2. Manejo de Batch Inserts
**Como** desarrollador  
**Quiero** agregar múltiples resguardos al store de manera eficiente  
**Para** mantener el rendimiento cuando se crean muchos resguardos a la vez

**Acceptance Criteria:**
- 2.1 Se agrega una función `addResguardoBatch` al store para insertar múltiples resguardos
- 2.2 La función actualiza el timestamp una sola vez para todo el batch
- 2.3 El hook `useResguardoSubmit` usa esta función después de crear resguardos

### 3. Sincronización con API Response
**Como** sistema  
**Quiero** usar los datos retornados por el API  
**Para** asegurar que el store tiene exactamente los mismos datos que la base de datos

**Acceptance Criteria:**
- 3.1 El API route retorna los resguardos creados con todos sus campos
- 3.2 El hook usa estos datos para actualizar el store
- 3.3 Los IDs generados por la base de datos se reflejan correctamente en el store

### 4. Prevención de Duplicados
**Como** sistema  
**Quiero** evitar duplicados cuando el realtime detecta los mismos INSERT  
**Para** mantener la integridad de los datos en el store

**Acceptance Criteria:**
- 4.1 El store verifica si un resguardo ya existe antes de agregarlo
- 4.2 La función `addResguardo` es idempotente (puede llamarse múltiples veces sin duplicar)
- 4.3 Se usa el ID del resguardo como clave única para la verificación

## Technical Requirements

### Store Updates
- Agregar función `addResguardoBatch` al `resguardosStore`
- Hacer `addResguardo` idempotente
- Mantener compatibilidad con realtime existente

### Hook Updates
- Actualizar `useResguardoSubmit` para usar el store
- Importar y usar `useResguardosStore`
- Agregar resguardos al store después de respuesta exitosa del API

### API Response
- El API ya retorna los datos creados
- Usar estos datos para actualizar el store

## Non-Functional Requirements

### Performance
- La actualización del store debe ser instantánea (<50ms)
- No debe afectar el tiempo de respuesta del API
- Batch insert debe ser más eficiente que múltiples inserts individuales

### Reliability
- Si falla la actualización del store, no debe afectar la creación del resguardo
- El realtime debe poder recuperar cualquier inconsistencia
- Los datos del store deben ser consistentes con la base de datos

### Maintainability
- El código debe seguir el patrón existente de otros stores
- Debe ser fácil de testear
- Debe estar bien documentado

## Out of Scope
- Modificar el comportamiento del realtime
- Cambiar la estructura del store
- Agregar validaciones adicionales
- Modificar el API route (ya funciona correctamente)

## Success Metrics
- Los resguardos aparecen instantáneamente en la lista de consulta
- No hay duplicados en el store
- El realtime sigue funcionando correctamente
- No hay regresiones en funcionalidad existente

## Dependencies
- Store de resguardos existente (`resguardosStore.ts`)
- Hook de indexación existente (`useResguardosIndexation.ts`)
- Hook de submit existente (`useResguardoSubmit.ts`)
- API route existente (`/api/resguardos/create`)

## Risks and Mitigations

### Risk: Duplicados por race condition entre optimistic update y realtime
**Mitigation:** Hacer `addResguardo` idempotente verificando si el ID ya existe

### Risk: Datos inconsistentes si el API retorna datos diferentes
**Mitigation:** Usar exactamente los datos retornados por el API

### Risk: Performance degradation con muchos resguardos
**Mitigation:** Usar batch insert en lugar de múltiples inserts individuales

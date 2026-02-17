# Eliminación de Columna Resguardante de Tablas de Muebles

## Contexto

La columna `resguardante` actualmente existe en las tablas de muebles (mueblestlaxcala, mueblesinea, mueblesitea) pero ya no debe ser editable desde estas tablas. El campo `resguardante` debe obtenerse exclusivamente desde la tabla `resguardos` mediante JOIN, ya que representa el usuario final asignado a un resguardo activo.

## Problema Actual

1. La columna `resguardante` existe en las interfaces de tipos de muebles
2. Los formularios de edición permiten modificar manualmente el campo `resguardante`
3. Al guardar cambios, se intenta actualizar la columna `resguardante` en la base de datos, causando error 400
4. Existe confusión sobre la fuente de verdad del campo `resguardante`

## Objetivos

1. Eliminar todas las referencias a `resguardante` como campo editable en las tablas de muebles
2. Mantener la visualización de `resguardante` obtenido desde la tabla `resguardos` mediante JOIN
3. Preservar la funcionalidad de búsqueda por `resguardante`
4. Asegurar que los hooks de indexación continúen obteniendo `resguardante` desde resguardos

## Alcance

### Vistas Afectadas

1. **NO LISTADO (Tlaxcala)**
   - Vista general: `src/components/consultas/no-listado/`
   
2. **INEA**
   - Vista general: `src/components/consultas/inea/`
   - Vista obsoletos: `src/components/consultas/inea/obsoletos/`
   
3. **ITEA**
   - Vista general: `src/components/consultas/itea/`
   - Vista obsoletos: `src/components/consultas/itea/obsoletos/`

### Componentes Afectados

- Archivos de tipos (types.ts)
- Componentes DetailPanel (EditMode y ViewMode)
- Hooks useItemEdit
- Hooks useSearchAndFilters (mantener búsqueda)
- Tipos de indexación (src/types/indexation.ts)

## Historias de Usuario

### 1. Como desarrollador, quiero que los tipos de muebles no incluyan resguardante como campo editable

**Criterios de Aceptación:**
- 1.1. La interfaz `MuebleNoListado` en `src/types/indexation.ts` no debe incluir `resguardante` como campo propio
- 1.2. La interfaz `MuebleINEA` en `src/types/indexation.ts` no debe incluir `resguardante` como campo propio
- 1.3. La interfaz `MuebleITEA` en `src/types/indexation.ts` no debe incluir `resguardante` como campo propio
- 1.4. La interfaz `Resguardo` en `src/types/indexation.ts` debe mantener el campo `resguardante`
- 1.5. Los tipos locales en vistas obsoletos deben eliminar `resguardante` de sus interfaces `Mueble`

### 2. Como usuario, no debo poder editar manualmente el campo resguardante en ninguna vista

**Criterios de Aceptación:**
- 2.1. El componente EditMode de DetailPanel en NO LISTADO no debe mostrar campo de edición para resguardante
- 2.2. El componente EditMode de DetailPanel en INEA general no debe mostrar campo de edición para resguardante
- 2.3. El componente EditMode de DetailPanel en INEA obsoletos no debe mostrar campo de edición para resguardante
- 2.4. El componente EditMode de DetailPanel en ITEA general no debe mostrar campo de edición para resguardante
- 2.5. El componente EditMode de DetailPanel en ITEA obsoletos no debe mostrar campo de edición para resguardante
- 2.6. Los hooks useItemEdit no deben incluir lógica para manejar cambios en el campo resguardante

### 3. Como usuario, quiero ver el resguardante solo cuando existe un resguardo activo

**Criterios de Aceptación:**
- 3.1. El componente ViewMode debe obtener resguardante desde `detalleResguardo.usufinal` (del JOIN con resguardos)
- 3.2. El campo resguardante solo debe mostrarse si existe un resguardo activo (`folio && detalleResguardo`)
- 3.3. Si no hay resguardo activo, debe mostrarse "Sin Resguardante"
- 3.4. El campo debe ser de solo lectura en todas las vistas
- 3.5. El campo debe usar el icono User de lucide-react para consistencia visual

### 4. Como usuario, quiero poder buscar muebles por resguardante

**Criterios de Aceptación:**
- 4.1. La búsqueda por resguardante debe funcionar en todas las vistas
- 4.2. La búsqueda debe realizarse sobre los datos obtenidos del JOIN con resguardos
- 4.3. El tipo `ActiveFilter` debe mantener 'resguardante' como opción válida
- 4.4. Los hooks useSearchAndFilters deben buscar en `detalleResguardo.usufinal` o en el campo `resguardante` obtenido del JOIN

### 5. Como sistema, debo obtener resguardante desde la tabla resguardos mediante JOIN

**Criterios de Aceptación:**
- 5.1. Los hooks de indexación deben mantener la lógica de JOIN con resguardos
- 5.2. `useNoListadoIndexation` debe continuar obteniendo resguardante desde resguardos
- 5.3. `useIneaIndexation` debe continuar obteniendo resguardante desde resguardos
- 5.4. `useIneaObsoletosIndexation` debe continuar obteniendo resguardante desde resguardos
- 5.5. `useIteaIndexation` debe continuar obteniendo resguardante desde resguardos
- 5.6. `useIteaObsoletosIndexation` debe continuar obteniendo resguardante desde resguardos

### 6. Como sistema, no debo intentar actualizar resguardante al guardar cambios en muebles

**Criterios de Aceptación:**
- 6.1. La función `saveChanges` en useItemEdit de NO LISTADO no debe incluir resguardante en el PATCH
- 6.2. La función `saveChanges` en useItemEdit de INEA general no debe incluir resguardante en el PATCH
- 6.3. La función `saveChanges` en useItemEdit de INEA obsoletos no debe incluir resguardante en el PATCH
- 6.4. La función `saveChanges` en useItemEdit de ITEA general no debe incluir resguardante en el PATCH
- 6.5. La función `saveChanges` en useItemEdit de ITEA obsoletos no debe incluir resguardante en el PATCH
- 6.6. La función `handleEditFormChange` no debe tener un case para 'resguardante'

## Restricciones

1. **NO modificar** la tabla `resguardos` en la base de datos - el campo `resguardante` debe permanecer ahí
2. **NO modificar** los hooks de indexación más allá de asegurar que continúan obteniendo resguardante correctamente
3. **Mantener** la funcionalidad de búsqueda por resguardante
4. **Preservar** la visualización del campo cuando existe un resguardo activo

## Dependencias

- Los hooks de indexación ya implementan correctamente el JOIN con resguardos
- La interfaz `ResguardoDetalle` ya incluye el campo `usufinal` que contiene el resguardante

## Notas Técnicas

### Fuente de Datos para Resguardante

El campo `resguardante` debe obtenerse de:
- En hooks de indexación: JOIN directo con tabla `resguardos` usando `id_mueble`
- En componentes de visualización: Desde `detalleResguardo.usufinal` (ya obtenido por el hook useResguardoData)

### Estructura de ResguardoDetalle

```typescript
export interface ResguardoDetalle {
  folio: string;
  f_resguardo: string;
  area_resguardo: string | null;
  dir_area: string;
  puesto: string;
  origen: string;
  usufinal: string | null;  // Este es el resguardante
  descripcion: string;
  rubro: string;
  condicion: string;
  created_by: string;
}
```

## Criterios de Éxito

1. No hay errores 400 al guardar cambios en muebles
2. El campo resguardante se muestra correctamente cuando existe un resguardo activo
3. El campo resguardante no se muestra cuando no hay resguardo activo
4. La búsqueda por resguardante funciona correctamente
5. No es posible editar manualmente el campo resguardante en ninguna vista
6. Los tipos TypeScript no muestran errores relacionados con resguardante

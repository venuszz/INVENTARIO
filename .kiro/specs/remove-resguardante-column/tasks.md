# Tasks: Eliminación de Columna Resguardante de Tablas de Muebles

## 1. Actualizar Tipos de Indexación

### 1.1 Eliminar resguardante de MuebleNoListado
- [x] Abrir `src/types/indexation.ts`
- [x] Localizar interfaz `MuebleNoListado`
- [x] Eliminar línea `resguardante?: string | null;`
- [x] Verificar que no haya errores de compilación

### 1.2 Eliminar resguardante de MuebleINEA
- [x] En `src/types/indexation.ts`
- [x] Localizar interfaz `MuebleINEA`
- [x] Eliminar línea `resguardante: string | null;`
- [x] Verificar que no haya errores de compilación

### 1.3 Eliminar resguardante de MuebleITEA
- [x] En `src/types/indexation.ts`
- [x] Localizar interfaz `MuebleITEA`
- [x] Eliminar línea `resguardante: string | null;`
- [x] Verificar que no haya errores de compilación

### 1.4 Verificar interfaz Resguardo
- [x] En `src/types/indexation.ts`
- [x] Confirmar que interfaz `Resguardo` mantiene `resguardante: string;`
- [x] No modificar esta interfaz

## 2. Actualizar Tipos Locales de Vistas Obsoletos

### 2.1 Actualizar tipos INEA obsoletos
- [x] Abrir `src/components/consultas/inea/obsoletos/types.ts`
- [x] Localizar interfaz `Mueble`
- [x] Eliminar línea `resguardante: string | null;`
- [x] Verificar que no haya errores de compilación

### 2.2 Actualizar tipos ITEA obsoletos
- [x] Abrir `src/components/consultas/itea/obsoletos/types.ts`
- [x] Localizar interfaz `MuebleITEA`
- [x] Eliminar línea `resguardante: string | null;`
- [x] Verificar que no haya errores de compilación

## 3. Actualizar Vista NO LISTADO

### 3.1 Actualizar DetailPanel - EditMode
- [x] Abrir `src/components/consultas/no-listado/components/DetailPanel.tsx`
- [x] Localizar función `EditMode`
- [x] Buscar el bloque del campo "Usuario Final" (aprox línea 600-620)
- [x] Eliminar completamente el `<div className="form-group">` que contiene el input de resguardante
- [x] Verificar que el grid de campos sigue funcionando correctamente

### 3.2 Actualizar DetailPanel - ViewMode
- [x] En el mismo archivo `DetailPanel.tsx`
- [x] Localizar función `ViewMode`
- [x] Buscar el `DetailCard` con label "Usuario Final" (aprox línea 900-910)
- [x] Reemplazar con lógica condicional:
  ```typescript
  {detalleResguardo?.usufinal && (
    <DetailCard
      label="Resguardante"
      value={detalleResguardo.usufinal}
      isDarkMode={isDarkMode}
    />
  )}
  {!detalleResguardo?.usufinal && folio && (
    <DetailCard
      label="Resguardante"
      value="Sin Resguardante"
      isDarkMode={isDarkMode}
    />
  )}
  ```

### 3.3 Actualizar useItemEdit - saveChanges
- [x] Abrir `src/components/consultas/no-listado/hooks/useItemEdit.ts`
- [x] Localizar función `saveChanges`
- [x] Buscar la línea `const { area, directorio, ...dbFields } = editFormData;`
- [x] Modificar a: `const { area, directorio, resguardante, ...dbFields } = editFormData as any;`
- [x] Verificar que resguardante no se incluye en el PATCH

### 3.4 Actualizar useItemEdit - handleEditFormChange
- [x] En el mismo archivo `useItemEdit.ts`
- [x] Localizar función `handleEditFormChange`
- [x] Buscar el switch statement
- [x] Eliminar el case `'resguardante':`
- [x] Verificar que no haya errores de compilación

### 3.5 Verificar useSearchAndFilters
- [x] Abrir `src/components/consultas/no-listado/hooks/useSearchAndFilters.ts`
- [x] Verificar que la búsqueda por 'resguardante' sigue funcionando
- [x] Confirmar que busca en `m.resguardante` (obtenido del JOIN)
- [x] No modificar si ya funciona correctamente

## 4. Actualizar Vista INEA General

### 4.1 Actualizar DetailPanel - EditMode
- [x] Abrir `src/components/consultas/inea/components/DetailPanel.tsx`
- [x] Localizar función `EditMode`
- [x] Buscar y eliminar el campo de edición "Usuario Final/Resguardante"
- [x] Verificar que el formulario sigue funcionando

### 4.2 Actualizar DetailPanel - ViewMode
- [x] En el mismo archivo
- [x] Localizar función `ViewMode`
- [x] Actualizar visualización de resguardante con lógica condicional
- [x] Usar `detalleResguardo.usufinal` como fuente

### 4.3 Actualizar useItemEdit
- [x] Abrir `src/components/consultas/inea/hooks/useItemEdit.ts`
- [x] Actualizar `saveChanges` para excluir resguardante
- [x] Eliminar case 'resguardante' de `handleEditFormChange`

### 4.4 Verificar useSearchAndFilters
- [x] Abrir `src/components/consultas/inea/hooks/useSearchAndFilters.ts`
- [x] Verificar búsqueda por resguardante
- [x] No modificar si funciona correctamente

## 5. Actualizar Vista INEA Obsoletos

### 5.1 Actualizar DetailPanel - EditMode
- [x] Abrir `src/components/consultas/inea/obsoletos/components/DetailPanel.tsx`
- [x] Localizar función `EditMode`
- [x] Eliminar campo de edición de resguardante si existe

### 5.2 Actualizar DetailPanel - ViewMode
- [x] En el mismo archivo
- [x] Actualizar visualización de resguardante con lógica condicional
- [x] Usar `detalleResguardo.usufinal` o campo obtenido del JOIN

### 5.3 Actualizar useItemEdit
- [x] Abrir `src/components/consultas/inea/obsoletos/hooks/useItemEdit.ts`
- [x] Actualizar `saveChanges` para excluir resguardante
- [x] Eliminar case 'resguardante' de `handleEditFormChange`

### 5.4 Verificar useSearchAndFilters
- [x] Verificar búsqueda por resguardante si existe

## 6. Actualizar Vista ITEA General

### 6.1 Actualizar DetailPanel - EditMode
- [x] Abrir `src/components/consultas/itea/components/DetailPanel.tsx`
- [x] Localizar función `EditMode`
- [x] Eliminar campo de edición de resguardante si existe

### 6.2 Actualizar DetailPanel - ViewMode
- [x] En el mismo archivo
- [x] Actualizar visualización de resguardante con lógica condicional
- [x] Usar `detalleResguardo.usufinal` como fuente

### 6.3 Actualizar useItemEdit
- [x] Abrir `src/components/consultas/itea/hooks/useItemEdit.ts`
- [x] Actualizar `saveChanges` para excluir resguardante
- [x] Eliminar case 'resguardante' de `handleEditFormChange`

### 6.4 Verificar useSearchAndFilters
- [x] Abrir `src/components/consultas/itea/hooks/useSearchAndFilters.ts`
- [x] Verificar búsqueda por resguardante
- [x] No modificar si funciona correctamente

## 7. Actualizar Vista ITEA Obsoletos

### 7.1 Actualizar DetailPanel - EditMode
- [x] Abrir `src/components/consultas/itea/obsoletos/components/DetailPanel.tsx`
- [x] Localizar función `EditMode`
- [x] Eliminar campo de edición de resguardante si existe

### 7.2 Actualizar DetailPanel - ViewMode
- [x] En el mismo archivo
- [x] Actualizar visualización de resguardante con lógica condicional
- [x] Usar campo obtenido del JOIN

### 7.3 Actualizar useItemEdit
- [x] Abrir `src/components/consultas/itea/obsoletos/hooks/useItemEdit.ts`
- [x] Actualizar `saveChanges` para excluir resguardante
- [x] Eliminar case 'resguardante' de `handleEditFormChange`

### 7.4 Verificar useSearchAndFilters
- [x] Verificar búsqueda por resguardante si existe

## 8. Verificar Hooks de Indexación

### 8.1 Verificar useNoListadoIndexation
- [x] Abrir `src/hooks/indexation/useNoListadoIndexation.ts`
- [x] Confirmar que el JOIN con resguardos sigue funcionando
- [x] Confirmar que mapea `resguardante` correctamente
- [x] NO modificar si funciona correctamente

### 8.2 Verificar useIneaIndexation
- [x] Abrir `src/hooks/indexation/useIneaIndexation.ts`
- [x] Confirmar que el JOIN con resguardos sigue funcionando
- [x] NO modificar si funciona correctamente

### 8.3 Verificar useIneaObsoletosIndexation
- [x] Abrir `src/hooks/indexation/useIneaObsoletosIndexation.ts`
- [x] Confirmar que el JOIN con resguardos sigue funcionando
- [x] NO modificar si funciona correctamente

### 8.4 Verificar useIteaIndexation
- [x] Abrir `src/hooks/indexation/useIteaIndexation.ts`
- [x] Confirmar que el JOIN con resguardos sigue funcionando
- [x] NO modificar si funciona correctamente

### 8.5 Verificar useIteaObsoletosIndexation
- [x] Abrir `src/hooks/indexation/useIteaObsoletosIndexation.ts`
- [x] Confirmar que el JOIN con resguardos sigue funcionando
- [x] NO modificar si funciona correctamente

## 9. Testing y Validación

### 9.1 Compilación TypeScript
- [x] Ejecutar `npm run build` o equivalente
- [x] Verificar que no hay errores de tipos relacionados con resguardante
- [x] Resolver cualquier error de compilación

### 9.2 Pruebas de Visualización
- [x] Abrir vista NO LISTADO
- [x] Seleccionar un mueble con resguardo activo
- [x] Verificar que muestra el resguardante correctamente
- [x] Seleccionar un mueble sin resguardo
- [x] Verificar que no muestra el campo resguardante
- [x] Repetir para todas las vistas (INEA, ITEA, obsoletos)

### 9.3 Pruebas de Edición
- [x] Abrir vista NO LISTADO
- [x] Hacer clic en "Editar" en un mueble
- [x] Verificar que NO aparece campo "Usuario Final/Resguardante"
- [x] Modificar otros campos
- [x] Guardar cambios
- [x] Verificar que NO hay error 400
- [x] Verificar que los cambios se guardaron correctamente
- [x] Repetir para todas las vistas

### 9.4 Pruebas de Búsqueda
- [x] En vista NO LISTADO, buscar por nombre de resguardante
- [x] Verificar que encuentra muebles correctamente
- [x] Repetir para todas las vistas que tienen búsqueda

### 9.5 Pruebas de Casos Edge
- [x] Mueble con resguardo pero sin usufinal → Debe mostrar "Sin Resguardante"
- [x] Mueble recién creado sin resguardo → No debe mostrar campo
- [x] Mueble con resguardo eliminado → No debe mostrar campo

## 10. Documentación

### 10.1 Actualizar comentarios en código
- [x] Agregar comentarios explicando que resguardante viene de resguardos
- [x] Documentar la lógica de visualización condicional
- [x] Agregar JSDoc a funciones relevantes

### 10.2 Crear documento de resumen
- [x] Crear archivo `docs/RESGUARDANTE_COLUMN_REMOVAL.md`
- [x] Documentar los cambios realizados
- [x] Explicar la nueva arquitectura de datos
- [x] Incluir ejemplos de uso

### 10.3 Actualizar README si es necesario
- [x] Verificar si hay referencias a edición de resguardante
- [x] Actualizar documentación de desarrollo

## 11. Limpieza Final

### 11.1 Revisar imports no utilizados
- [x] Buscar imports relacionados con resguardante que ya no se usan
- [x] Eliminar imports innecesarios

### 11.2 Revisar console.logs
- [x] Buscar console.logs relacionados con resguardante
- [x] Eliminar o actualizar según sea necesario

### 11.3 Verificar linting
- [x] Ejecutar linter en archivos modificados
- [x] Corregir warnings relacionados con los cambios

## 12. Revisión Final

### 12.1 Code Review
- [x] Revisar todos los cambios realizados
- [x] Verificar que se siguió el diseño
- [x] Confirmar que no hay código duplicado

### 12.2 Testing Completo
- [x] Ejecutar suite de tests si existe
- [x] Realizar pruebas manuales en todas las vistas
- [x] Verificar en diferentes navegadores si es necesario

### 12.3 Preparar para Deploy
- [x] Crear commit con mensaje descriptivo
- [x] Actualizar changelog si existe
- [x] Preparar notas de release

## Notas Importantes

- **NO modificar** la tabla `resguardos` en la base de datos
- **NO modificar** los hooks de indexación más allá de verificación
- **Mantener** la funcionalidad de búsqueda por resguardante
- **Preservar** la visualización cuando existe resguardo activo
- **Eliminar** completamente la capacidad de editar resguardante manualmente

## Orden de Ejecución Recomendado

1. Primero: Actualizar tipos (Tareas 1-2)
2. Segundo: Actualizar una vista completa como prueba (Tarea 3)
3. Tercero: Probar la vista actualizada (Tarea 9.2, 9.3, 9.4)
4. Cuarto: Si funciona, actualizar el resto de vistas (Tareas 4-7)
5. Quinto: Verificar hooks de indexación (Tarea 8)
6. Sexto: Testing completo (Tarea 9)
7. Séptimo: Documentación y limpieza (Tareas 10-11)
8. Octavo: Revisión final (Tarea 12)

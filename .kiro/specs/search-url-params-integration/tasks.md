# Plan de Implementación: Integración de Parámetros URL en Búsqueda Universal

## Resumen

Implementar lectura de parámetros URL (`id` o `folio`) en todos los componentes de consulta para abrir automáticamente el panel de detalles cuando un usuario hace clic en un resultado de la búsqueda universal. La implementación incluye un hook reutilizable y su integración en 7 componentes diferentes.

## Tareas

- [x] 1. Crear hook reutilizable useURLParamHandler
  - [x] 1.1 Implementar hook useURLParamHandler en src/hooks/useURLParamHandler.ts
    - Crear interfaz `UseURLParamHandlerOptions<T>` con propiedades: paramName, items, isLoading, getItemKey, onItemSelect
    - Crear interfaz `UseURLParamHandlerReturn` con propiedades: isProcessingParam, paramNotFound, clearParamNotFound
    - Implementar lógica de lectura de parámetro URL usando `useSearchParams()`
    - Implementar lógica de búsqueda de item en datos usando `getItemKey`
    - Implementar lógica de selección automática llamando a `onItemSelect`
    - Usar `useRef` para rastrear si el parámetro ya fue procesado (evitar procesamiento múltiple)
    - Manejar caso donde item no se encuentra (establecer `paramNotFound = true`)
    - Esperar a que `isLoading === false` antes de procesar
    - _Requisitos: 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 3.2, 3.3, 3.4, 4.2, 4.3, 4.4, 5.2, 5.3, 5.4, 6.2, 6.3, 6.4, 7.2, 7.3, 7.4_

  - [ ]* 1.2 Escribir test de propiedad para detección de parámetro URL
    - **Propiedad 1: Detección de Parámetro URL**
    - **Valida: Requisitos 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2**
    - Generar parámetros URL aleatorios
    - Verificar que el hook detecta correctamente el parámetro especificado
    - Usar fast-check con mínimo 100 iteraciones

  - [ ]* 1.3 Escribir test de propiedad para búsqueda de item
    - **Propiedad 2: Búsqueda de Item en Datos**
    - **Valida: Requisitos 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3**
    - Generar conjuntos de datos aleatorios con items
    - Generar parámetros que correspondan a items existentes
    - Verificar que el hook encuentra el item correcto
    - Usar fast-check con mínimo 100 iteraciones

  - [ ]* 1.4 Escribir test de propiedad para selección automática
    - **Propiedad 3: Selección Automática de Item Encontrado**
    - **Valida: Requisitos 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4**
    - Generar items aleatorios
    - Verificar que `onItemSelect` se llama con el item correcto
    - Usar fast-check con mínimo 100 iteraciones

  - [ ]* 1.5 Escribir test de propiedad para ejecución única
    - **Propiedad 4: Ejecución Única por Parámetro**
    - **Valida: Requisitos implícitos de estabilidad**
    - Verificar que el hook procesa cada parámetro exactamente una vez
    - Simular múltiples renders con el mismo parámetro
    - Usar fast-check con mínimo 100 iteraciones

  - [ ]* 1.6 Escribir tests unitarios para casos edge
    - Test: Parámetro presente pero datos vacíos
    - Test: Parámetro no encontrado en datos
    - Test: Parámetro vacío o null
    - Test: Datos aún cargando (isLoading = true)
    - _Requisitos: 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5_

- [x] 2. Integrar hook en componente No Listado (TLAXCALA)
  - [x] 2.1 Modificar src/components/consultas/no-listado/index.tsx
    - Importar `useURLParamHandler` desde `@/hooks/useURLParamHandler`
    - Agregar llamada al hook con parámetros: paramName='id', items=muebles, isLoading=isIndexing, getItemKey=(item)=>item.id, onItemSelect=handleSelectItem
    - Agregar `useEffect` para mostrar mensaje cuando `paramNotFound === true`
    - Limpiar mensaje usando `clearParamNotFound()`
    - Calcular página correcta donde está el item seleccionado
    - Actualizar `currentPage` para mostrar el item en la tabla
    - _Requisitos: 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Escribir test de integración para No Listado
    - Verificar que el hook se integra correctamente con useItemEdit
    - Verificar que el mensaje de error se muestra cuando item no se encuentra
    - Verificar que el panel de detalles se abre correctamente
    - Verificar que la tabla se desplaza a la página correcta

- [x] 3. Integrar hook en componente INEA General
  - [x] 3.1 Modificar src/components/consultas/inea/index.tsx
    - Importar `useURLParamHandler`
    - Agregar llamada al hook con parámetros apropiados
    - Agregar manejo de mensaje para `paramNotFound`
    - Calcular página correcta donde está el item seleccionado
    - Actualizar `currentPage` para mostrar el item en la tabla
    - _Requisitos: 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.2 Escribir test de integración para INEA General
    - Verificar integración correcta con hooks existentes
    - Verificar comportamiento de mensajes de error

- [x] 4. Integrar hook en componente ITEA General
  - [x] 4.1 Modificar src/components/consultas/itea/index.tsx
    - Importar `useURLParamHandler`
    - Agregar llamada al hook con parámetros apropiados
    - Agregar manejo de mensaje para `paramNotFound`
    - Calcular página correcta donde está el item seleccionado
    - Actualizar `currentPage` para mostrar el item en la tabla
    - _Requisitos: 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.2 Escribir test de integración para ITEA General
    - Verificar integración correcta con hooks existentes
    - Verificar comportamiento de mensajes de error

- [x] 5. Integrar hook en componente INEA Obsoletos
  - [x] 5.1 Modificar src/components/consultas/inea/obsoletos/index.tsx
    - Importar `useURLParamHandler`
    - Agregar llamada al hook con parámetros apropiados
    - Agregar manejo de mensaje para `paramNotFound`
    - _Requisitos: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.2 Escribir test de integración para INEA Obsoletos
    - Verificar integración correcta con hooks existentes
    - Verificar comportamiento de mensajes de error

- [x] 6. Integrar hook en componente ITEA Obsoletos
  - [x] 6.1 Modificar src/components/consultas/itea/obsoletos/index.tsx
    - Importar `useURLParamHandler`
    - Agregar llamada al hook con parámetros apropiados
    - Agregar manejo de mensaje para `paramNotFound`
    - _Requisitos: 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.2 Escribir test de integración para ITEA Obsoletos
    - Verificar integración correcta con hooks existentes
    - Verificar comportamiento de mensajes de error

- [ ] 7. Checkpoint - Verificar componentes de inventario
  - Asegurar que todos los tests pasan
  - Verificar manualmente que la búsqueda universal funciona correctamente con cada componente
  - Preguntar al usuario si hay problemas o ajustes necesarios

- [x] 8. Integrar hook en componente Consultar Resguardos
  - [x] 8.1 Modificar src/components/resguardos/consultar/index.tsx
    - Importar `useURLParamHandler`
    - Agregar llamada al hook con parámetros: paramName='folio', items=resguardos, isLoading=isLoading, getItemKey=(item)=>item.folio, onItemSelect=selectResguardo
    - Agregar manejo de mensaje para `paramNotFound`
    - _Requisitos: 6.2, 6.3, 6.4, 6.5_

  - [ ]* 8.2 Escribir test de integración para Consultar Resguardos
    - Verificar integración con useResguardoDetails
    - Verificar comportamiento con parámetro 'folio'
    - Verificar mensajes de error

- [x] 9. Integrar hook en componente Consultar Bajas
  - [x] 9.1 Modificar src/components/resguardos/consultarBajas/index.tsx
    - Importar `useURLParamHandler`
    - Agregar llamada al hook con parámetros apropiados para 'folio'
    - Agregar manejo de mensaje para `paramNotFound`
    - _Requisitos: 7.2, 7.3, 7.4, 7.5_

  - [ ]* 9.2 Escribir test de integración para Consultar Bajas
    - Verificar integración correcta con hooks existentes
    - Verificar comportamiento con parámetro 'folio'

- [ ] 10. Aplicar cambio de nombre: "No Listado" → "TLAXCALA"
  - [ ] 10.1 Modificar Header del componente No Listado
    - Cambiar título en src/components/consultas/no-listado/components/Header.tsx
    - Cambiar de "No Listado" a "TLAXCALA"

  - [ ] 10.2 Modificar etiquetas en Búsqueda Universal
    - Actualizar src/components/search/UniversalSearchBar.tsx
    - Cambiar etiqueta de resultados de "No Listado" a "TLAXCALA"
    - Verificar que no hay otras referencias a "No Listado" en el componente

  - [ ] 10.3 Verificar navegación y breadcrumbs
    - Buscar referencias a "No Listado" en archivos de navegación
    - Actualizar cualquier referencia encontrada a "TLAXCALA"

- [ ] 11. Checkpoint final - Verificar todo el sistema
  - Ejecutar todos los tests (unitarios y de propiedades)
  - Verificar manualmente cada componente con la búsqueda universal
  - Verificar que el cambio de nombre se aplicó correctamente
  - Preguntar al usuario si todo funciona como se espera

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea de integración sigue el mismo patrón para mantener consistencia
- Los tests de propiedad usan fast-check con mínimo 100 iteraciones
- El hook es genérico y reutilizable para todos los componentes
- El cambio de nombre es cosmético y no afecta funcionalidad

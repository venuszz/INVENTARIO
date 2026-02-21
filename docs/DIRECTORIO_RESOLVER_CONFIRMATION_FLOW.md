# Flujo de Confirmación para Resolución de Inconsistencias

## Resumen

Se ha implementado un flujo de confirmación de dos pasos para la resolución de inconsistencias en el módulo de Directorio. Cuando el usuario hace clic en el botón "Resolver" del panel principal, se muestra un panel de confirmación que ocupa todo el espacio disponible, reemplazando completamente la vista de selección.

## Cambios Implementados

### 1. Nuevos Componentes de Confirmación (Full Screen)

#### `DuplicateAreaConfirmation.tsx`
Componente que se muestra después de hacer clic en "Resolver" cuando se ha seleccionado un director para mantener el área duplicada.

**Características:**
- Ocupa todo el espacio disponible (full screen)
- Header con título y descripción contextual
- Muestra los directores desde los cuales se transferirán bienes
- Lista detallada de bienes a transferir con:
  - Descripción del bien
  - Número de inventario
  - Valor monetario
- Resumen de estadísticas:
  - Total de bienes a transferir
  - Total de resguardos afectados
  - Valor total de la transferencia
- Indicador de carga mientras se obtienen los bienes
- Botones de "Atrás" y "Confirmar transferencia" en footer fijo

**Flujo:**
1. Usuario selecciona director en el panel principal
2. Usuario hace clic en "Resolver"
3. Se muestra `DuplicateAreaConfirmation` (full screen)
4. Se cargan los bienes a transferir (actualmente mock, pendiente API)
5. Usuario revisa y confirma o regresa

#### `EmptyDirectorConfirmation.tsx`
Componente que se muestra después de hacer clic en "Resolver" para confirmar qué hacer con un director sin bienes.

**Características:**
- Ocupa todo el espacio disponible (full screen)
- Header con título y descripción contextual
- Muestra las áreas asignadas al director
- Tres opciones de resolución:
  1. **Eliminar director y liberar áreas** (Recomendado)
     - Las áreas quedan disponibles para asignarse a otros directores
  2. **Eliminar director y conservar áreas**
     - Las áreas permanecen sin director asignado
  3. **Reasignar áreas a otro director**
     - Permite seleccionar un director destino
     - Muestra lista de directores disponibles con su cantidad de áreas
- Validación: no permite confirmar si se selecciona "reasignar" sin elegir director
- Botones de "Atrás" y "Confirmar acción" en footer fijo

**Flujo:**
1. Usuario ve resumen del director sin bienes en el panel principal
2. Usuario hace clic en "Resolver"
3. Se muestra `EmptyDirectorConfirmation` (full screen)
4. Usuario selecciona una de las tres opciones
5. Si elige reasignar, selecciona director destino
6. Usuario confirma o regresa

### 2. Modificaciones al Componente Principal

#### `InconsistencyResolverMode.tsx`
- Agregado estado `showConfirmation` para controlar el flujo
- Modificado `handleResolve()` para mostrar confirmación en lugar de ejecutar inmediatamente
- Agregado `handleConfirmResolve()` que ejecuta la acción después de confirmar
- Agregado `handleBackFromConfirmation()` para regresar a la vista de selección
- Renderizado condicional: cuando `showConfirmation === true`, muestra el componente de confirmación en lugar del layout normal (lista + panel)
- Los componentes de confirmación se renderizan con el mismo header que el modo resolver

### 3. Estructura del Layout

**Vista Normal (Selección):**
```
<ResolverHeader />
<ResolverLayout>
  <InconsistencyList /> (izquierda)
  <ResolutionPanel>
    <DuplicateAreaResolver /> (derecha)
  </ResolutionPanel>
</ResolverLayout>
```

**Vista Confirmación (Full Screen):**
```
<ResolverHeader />
<DuplicateAreaConfirmation /> (ocupa todo el ancho)
```

## Diseño Visual

### Consistencia de Diseño
Ambos componentes de confirmación mantienen el mismo estilo visual que los resolvers originales:
- Paleta de colores neutral
- Bordes y espaciados consistentes
- Animaciones suaves con Framer Motion
- Soporte completo para modo oscuro/claro
- Iconografía coherente (Lucide React)
- Layout de card con header, content scrollable y footer fijo

### Elementos Comunes
- Header con icono, tipo de inconsistencia y título
- Descripción contextual en banner
- Secciones claramente delimitadas
- Botones de acción en footer fijo
- Estados de carga y deshabilitado
- Feedback visual en selecciones

## Pendientes / TODOs

### 1. Integración con API Real
**`DuplicateAreaConfirmation.tsx`** - Línea ~35
```typescript
// TODO: Fetch real de bienes a transferir
// const response = await fetch(`/api/directorio/bienes-to-transfer?...`);
// const data = await response.json();
```

Actualmente usa datos mock. Necesita endpoint que retorne:
```typescript
interface BienToTransfer {
  id: number;
  descripcion: string;
  no_inventario: string;
  valor: number;
}
```

### 2. Fetch de Directores Disponibles
**`EmptyDirectorConfirmation.tsx`** - Línea ~27
```typescript
const [availableDirectors] = useState([...]); // TODO: Fetch real directors
```

Necesita endpoint que retorne directores disponibles para reasignación:
```typescript
interface AvailableDirector {
  id: number;
  nombre: string;
  areasCount: number;
}
```

### 3. Manejo de Opciones en Backend
El método `handleConfirm` en `EmptyDirectorConfirmation` recibe tres posibles opciones:
- `'delete_all'`: Eliminar director y liberar áreas
- `'keep_areas'`: Eliminar director pero conservar áreas
- `'reassign_areas'`: Reasignar áreas a otro director (incluye `targetDirectorId`)

El backend debe implementar la lógica para cada caso.

### 4. Manejo de Errores
Agregar manejo de errores en:
- Carga de bienes a transferir
- Carga de directores disponibles
- Confirmación de acciones
- Mostrar mensajes de error al usuario

### 5. Optimizaciones
- Implementar paginación si hay muchos bienes
- Agregar búsqueda/filtrado en lista de directores disponibles
- Caché de datos ya cargados
- Cancelación de requests al regresar

## Flujo Completo de Usuario

### Caso 1: Área Duplicada
1. Usuario entra a modo resolver
2. Selecciona inconsistencia de "Área Duplicada" en la lista
3. Ve lista de directores con estadísticas en el panel derecho
4. Selecciona el director a mantener
5. **[NUEVO]** Clic en botón "Resolver" del panel principal
6. **[NUEVO]** Panel de confirmación reemplaza toda la vista
7. **[NUEVO]** Ve lista detallada de bienes a transferir con valores
8. **[NUEVO]** Revisa estadísticas y valor total
9. **[NUEVO]** Confirma o regresa con botón "Atrás"
10. Sistema ejecuta transferencia
11. Marca como resuelto y avanza a siguiente

### Caso 2: Director sin Bienes
1. Usuario entra a modo resolver
2. Selecciona inconsistencia de "Director sin Bienes" en la lista
3. Ve resumen del director y sus áreas en el panel derecho
4. **[NUEVO]** Clic en botón "Resolver" del panel principal
5. **[NUEVO]** Panel de confirmación reemplaza toda la vista
6. **[NUEVO]** Ve tres opciones de resolución
7. **[NUEVO]** Selecciona opción deseada
8. **[NUEVO]** Si elige reasignar, selecciona director destino
9. **[NUEVO]** Confirma o regresa con botón "Atrás"
10. Sistema ejecuta acción seleccionada
11. Marca como resuelto y avanza a siguiente

## Beneficios

1. **Mayor transparencia**: Usuario ve exactamente qué se va a modificar
2. **Prevención de errores**: Confirmación explícita antes de acciones destructivas
3. **Flexibilidad**: Múltiples opciones para resolver directores sin bienes
4. **Mejor UX**: Flujo claro y reversible (botón "Atrás")
5. **Información completa**: Detalles de bienes, valores y estadísticas
6. **Consistencia**: Diseño uniforme con el resto del sistema

## Notas Técnicas

- Los componentes usan `useState` local para manejar el flujo de pasos
- No se modificó el hook `useInconsistencyResolver` (no fue necesario)
- Los tipos existentes en `resolver.ts` son suficientes
- La integración es transparente para el componente padre
- Mantiene compatibilidad con el sistema de resolución existente

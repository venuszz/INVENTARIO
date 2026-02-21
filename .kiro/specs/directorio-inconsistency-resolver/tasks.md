# Tasks: Modo Resolución de Inconsistencias

## Fase 1: Fundamentos y Estructura (Base)

### Task 1.1: Crear tipos y estructura base
**Archivos**:
- `src/components/admin/directorio/types/resolver.ts`

**Contenido**:
- Definir todos los tipos TypeScript
- Interfaces para estado del resolver
- Tipos para acciones de resolución
- Tipos extendidos de inconsistencias con stats

**Criterios de aceptación**:
- [x] Todos los tipos están definidos
- [x] No hay errores de TypeScript
- [x] Tipos son exportados correctamente

---

### Task 1.2: Crear hook useInconsistencyResolver
**Archivos**:
- `src/components/admin/directorio/hooks/useInconsistencyResolver.ts`

**Funcionalidad**:
- Estado del modo (idle/active/completing)
- Índice de inconsistencia seleccionada
- Set de IDs resueltos
- Funciones para entrar/salir del modo
- Funciones para navegar entre inconsistencias
- Función para marcar como resuelto

**Criterios de aceptación**:
- [x] Hook maneja estado correctamente
- [x] Navegación funciona (next/prev/select)
- [x] Contador de pendientes/resueltos es correcto
- [x] Estado persiste durante el modo

---

### Task 1.3: Extender useDirectorioStats con datos de resguardos
**Archivos**:
- `src/components/admin/directorio/hooks/useDirectorioStats.ts`

**Modificaciones**:
- Añadir conteo de resguardos por director
- Añadir conteo de resguardos por área
- Optimizar queries para incluir ambos datos

**Criterios de aceptación**:
- [x] Stats incluyen resguardos
- [x] Stats incluyen bienes (ya existente)
- [x] Performance no se degrada
- [x] Datos son correctos

---

## Fase 2: Componentes de Layout

### Task 2.1: Crear ResolverHeader
**Archivos**:
- `src/components/admin/directorio/components/resolver/ResolverHeader.tsx`

**Contenido**:
- Botón "← Volver al directorio"
- Título "Resolver Inconsistencias"
- Contador "X pendientes"
- Animación de transformación del header

**Criterios de aceptación**:
- [x] Header se renderiza correctamente
- [x] Botón volver funciona
- [x] Contador se actualiza en tiempo real
- [x] Animación es suave

---

### Task 2.2: Crear ResolverLayout (split-screen)
**Archivos**:
- `src/components/admin/directorio/components/resolver/ResolverLayout.tsx`

**Contenido**:
- Contenedor con grid 40/60
- Línea divisoria vertical
- Responsive (stack en mobile)
- Animaciones de entrada/salida

**Criterios de aceptación**:
- [x] Layout split funciona en desktop
- [x] Stack vertical funciona en mobile
- [x] Línea divisoria es visible
- [x] Animaciones son fluidas

---

### Task 2.3: Crear InconsistencyList (panel izquierdo)
**Archivos**:
- `src/components/admin/directorio/components/resolver/InconsistencyList.tsx`

**Contenido**:
- Lista agrupada por tipo
- Headers colapsables por grupo
- Items clickeables
- Indicador de selección
- Indicador de resuelto
- Scroll independiente

**Criterios de aceptación**:
- [x] Lista se renderiza correctamente
- [x] Grupos son colapsables
- [x] Click selecciona item
- [x] Indicadores visuales funcionan
- [x] Scroll es independiente
- [x] Animación stagger en entrada

---

### Task 2.4: Crear ResolutionPanel (panel derecho)
**Archivos**:
- `src/components/admin/directorio/components/resolver/ResolutionPanel.tsx`

**Contenido**:
- Header con título y tipo
- Contenedor para resolver específico
- Botones de acción (Omitir/Resolver)
- Animaciones de transición

**Criterios de aceptación**:
- [x] Panel se renderiza correctamente
- [x] Transiciones entre inconsistencias son suaves
- [x] Botones están siempre visibles
- [x] Loading state durante resolución

---

## Fase 3: Resolvers Específicos

### Task 3.1: Crear DuplicateAreaResolver
**Archivos**:
- `src/components/admin/directorio/components/resolver/resolvers/DuplicateAreaResolver.tsx`

**Contenido**:
- Mostrar área duplicada
- Lista de directores con radio buttons
- Stats de cada director (bienes, resguardos)
- Botón "Ver detalles" por director
- Recomendación automática
- Opciones de resolución

**Criterios de aceptación**:
- [x] Muestra todos los directores
- [x] Stats son correctos
- [x] Radio buttons funcionan
- [x] Recomendación es lógica
- [x] Diseño es claro

---

### Task 3.2: Crear EmptyDirectorResolver
**Archivos**:
- `src/components/admin/directorio/components/resolver/resolvers/EmptyDirectorResolver.tsx`

**Contenido**:
- Mostrar director sin bienes
- Lista de áreas con checkboxes
- Opciones de resolución:
  - Eliminar director completo
  - Remover áreas seleccionadas
  - Mantener
- Recomendación automática

**Criterios de aceptación**:
- [x] Muestra todas las áreas
- [x] Checkboxes funcionan
- [x] Opciones son claras
- [x] Recomendación es lógica
- [x] Validación de selección

---

### Task 3.3: Crear EmptyAreaResolver
**Archivos**:
- `src/components/admin/directorio/components/resolver/resolvers/EmptyAreaResolver.tsx`

**Contenido**:
- Mostrar área sin bienes
- Lista de directores asignados
- Stats de directores en otras áreas
- Opciones de resolución:
  - Remover área del director
  - Eliminar área completa
  - Mantener
- Recomendación automática

**Criterios de aceptación**:
- [x] Muestra todos los directores
- [x] Stats de otras áreas son correctos
- [x] Opciones son claras
- [x] Recomendación es lógica
- [x] Diseño es consistente

---

## Fase 4: Acciones y Lógica de Resolución

### Task 4.1: Crear hook useInconsistencyActions
**Archivos**:
- `src/components/admin/directorio/hooks/useInconsistencyActions.ts`

**Funcionalidad**:
- `keepOneDirector`: Mantener un director, remover área de otros
- `removeAreaFromDirector`: Remover área específica de director
- `deleteDirector`: Eliminar director completo
- `deleteArea`: Eliminar área completa
- Manejo de errores
- Loading states

**Criterios de aceptación**:
- [x] Todas las acciones funcionan
- [x] Errores se manejan correctamente
- [x] Loading states son precisos
- [x] Cambios se reflejan en la BD
- [x] Optimistic updates funcionan

---

### Task 4.2: Integrar acciones con resolvers
**Archivos**:
- Todos los resolvers (Task 3.x)

**Modificaciones**:
- Conectar botón "Resolver" con acciones
- Mostrar loading durante ejecución
- Mostrar errores si ocurren
- Animación de éxito
- Pasar a siguiente automáticamente

**Criterios de aceptación**:
- [x] Botón Resolver ejecuta acción correcta
- [x] Loading se muestra
- [x] Errores se muestran
- [x] Éxito se anima
- [x] Navegación automática funciona

---

## Fase 5: Componente Principal y Animaciones

### Task 5.1: Crear InconsistencyResolverMode
**Archivos**:
- `src/components/admin/directorio/components/resolver/InconsistencyResolverMode.tsx`

**Contenido**:
- Componente orquestador principal
- Maneja estado global del modo
- Renderiza header, layout, y completion
- Controla animaciones de entrada/salida
- Maneja navegación por teclado

**Criterios de aceptación**:
- [x] Orquesta todos los subcomponentes
- [x] Animaciones de entrada funcionan
- [x] Animaciones de salida funcionan
- [x] Navegación por teclado funciona
- [x] Focus management es correcto

---

### Task 5.2: Crear CompletionScreen
**Archivos**:
- `src/components/admin/directorio/components/resolver/CompletionScreen.tsx`

**Contenido**:
- Mensaje de éxito
- Resumen de resoluciones
- Botón para volver
- Animación de celebración sutil

**Criterios de aceptación**:
- [x] Se muestra al resolver todas
- [x] Resumen es correcto
- [x] Botón volver funciona
- [x] Animación es agradable

---

### Task 5.3: Integrar con DirectorioManager
**Archivos**:
- `src/components/admin/directorio/index.tsx`

**Modificaciones**:
- Añadir estado para modo resolver
- Renderizar InconsistencyResolverMode cuando activo
- Ocultar contenido normal cuando activo
- Conectar badge con entrada al modo
- Animaciones de transición

**Criterios de aceptación**:
- [x] Click en badge entra al modo
- [x] Contenido normal se oculta
- [x] Modo resolver se muestra
- [x] Transición es suave
- [x] Salida restaura todo

---

## Fase 6: Pulido y Optimización

### Task 6.1: Responsive y Mobile
**Archivos**:
- Todos los componentes del resolver

**Modificaciones**:
- Ajustar layout para tablet
- Stack vertical en mobile
- Navegación con botones en mobile
- Touch gestures
- Tamaños de fuente adaptativos

**Criterios de aceptación**:
- [x] Funciona en tablet (768-1024px)
- [x] Funciona en mobile (<768px)
- [x] Touch gestures funcionan
- [x] Navegación es intuitiva
- [x] No hay overflow horizontal

---

### Task 6.2: Accesibilidad
**Archivos**:
- Todos los componentes del resolver

**Modificaciones**:
- Añadir ARIA labels
- Focus trap en modo
- Navegación por teclado completa
- Screen reader support
- Focus visible en todos los elementos

**Criterios de aceptación**:
- [x] Navegación por teclado completa
- [x] ARIA labels correctos
- [x] Focus trap funciona
- [x] Screen reader lee correctamente
- [x] Focus visible siempre

---

### Task 6.3: Testing y Refinamiento
**Archivos**:
- Todos los componentes

**Actividades**:
- Testing manual de todos los flujos
- Testing de edge cases
- Optimización de performance
- Refinamiento de animaciones
- Corrección de bugs

**Criterios de aceptación**:
- [x] Todos los flujos funcionan
- [x] Edge cases manejados
- [x] Performance es buena (60fps)
- [x] No hay bugs conocidos
- [x] Animaciones son fluidas

---

## Orden de Implementación Recomendado

1. **Fase 1** (Fundamentos) - Completar todas las tasks
2. **Fase 2** (Layout) - Completar todas las tasks
3. **Fase 3** (Resolvers) - Empezar con 3.1, luego 3.2, luego 3.3
4. **Fase 4** (Acciones) - Completar 4.1, luego 4.2
5. **Fase 5** (Principal) - Completar 5.1, luego 5.2, luego 5.3
6. **Fase 6** (Pulido) - Completar en orden

## Estimación de Tiempo

- Fase 1: 3-4 horas
- Fase 2: 4-5 horas
- Fase 3: 5-6 horas
- Fase 4: 3-4 horas
- Fase 5: 4-5 horas
- Fase 6: 3-4 horas

**Total estimado**: 22-28 horas de desarrollo

## Notas Importantes

- Cada task debe completarse y testearse antes de pasar a la siguiente
- Hacer commits frecuentes con mensajes descriptivos
- Mantener el diseño minimalista consistente
- Priorizar la experiencia de usuario
- Optimizar para performance desde el inicio

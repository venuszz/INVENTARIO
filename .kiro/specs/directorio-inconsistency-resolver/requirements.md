# Directorio - Modo Resolución de Inconsistencias

## Objetivo
Implementar un modo de enfoque (focus mode) para resolver inconsistencias en el directorio de personal, con un diseño split-screen que muestra una lista de inconsistencias a la izquierda y un panel de corrección a la derecha.

## Contexto
Actualmente existe un sistema de detección de inconsistencias que muestra un badge flotante. Este spec añade la funcionalidad para entrar en un modo especial donde el usuario puede resolver estas inconsistencias de manera guiada y eficiente.

## Tipos de Inconsistencias a Resolver

### 1. Áreas Duplicadas
- **Problema**: Una misma área está asignada a múltiples directores
- **Datos necesarios**: 
  - Nombre del área
  - Lista de directores con esa área
  - Cantidad de bienes por director
  - Cantidad de resguardos por director
- **Acciones posibles**:
  - Mantener solo un director (remover área de los demás)
  - Reasignar bienes y mantener ambos
  - Fusionar en nuevo responsable

### 2. Directores sin Bienes
- **Problema**: Un director tiene áreas asignadas pero sin bienes en ninguna
- **Datos necesarios**:
  - Nombre del director
  - Lista de áreas asignadas
  - Cantidad de bienes por área (todos en 0)
- **Acciones posibles**:
  - Eliminar director completo
  - Remover áreas seleccionadas
  - Mantener (puede recibir bienes después)

### 3. Áreas sin Bienes
- **Problema**: Un área tiene directores asignados pero sin bienes
- **Datos necesarios**:
  - Nombre del área
  - Lista de directores con esa área
  - Bienes del director en otras áreas
- **Acciones posibles**:
  - Remover área del director
  - Eliminar área completa
  - Mantener (puede recibir bienes después)

## Flujo de Usuario

### Entrada al Modo
1. Usuario hace click en el badge de inconsistencias
2. Página se transforma con animación suave (900ms)
3. Se muestra layout split-screen
4. Primera inconsistencia se selecciona automáticamente

### Navegación
1. Usuario puede hacer click en cualquier inconsistencia de la lista
2. Panel derecho se actualiza con los detalles
3. Botones "Omitir" y "Resolver" para avanzar

### Resolución
1. Usuario selecciona una opción (radio/checkbox según el caso)
2. Click en "Resolver"
3. Se ejecuta la acción en la base de datos
4. Animación de confirmación
5. Se pasa automáticamente a la siguiente inconsistencia
6. Contador se actualiza

### Salida del Modo
1. Usuario hace click en "← Volver al directorio"
2. O se resuelven todas las inconsistencias
3. Animación inversa de salida (900ms)
4. Se restaura la vista normal del directorio

## Requisitos Técnicos

### Estado Global
- Modo activo/inactivo (boolean)
- Inconsistencia seleccionada (index)
- Lista de inconsistencias pendientes
- Contador de resueltas

### Hooks Necesarios
- `useInconsistencyResolver`: Maneja el estado del modo
- `useInconsistencyActions`: Ejecuta las acciones de resolución
- Extender `useDirectorioStats`: Incluir datos de resguardos por área

### Componentes Nuevos
- `InconsistencyResolverMode`: Componente principal del modo
- `InconsistencyList`: Panel izquierdo con lista
- `InconsistencyResolutionPanel`: Panel derecho con acciones
- Subcomponentes por tipo de inconsistencia

### Animaciones
- Framer Motion para todas las transiciones
- Duración estándar: 300-400ms
- Easing: [0.16, 1, 0.3, 1]
- Stagger para listas: 50ms por item

## Restricciones
- No crear nueva ruta, todo in-place
- Mantener diseño minimalista consistente
- Responsive (mobile: stack vertical)
- Accesibilidad: navegación por teclado
- No bloquear la UI durante resoluciones

## Métricas de Éxito
- Tiempo promedio de resolución por inconsistencia < 30s
- Tasa de resolución completa > 80%
- Sin errores en la ejecución de acciones
- Animaciones fluidas (60fps)

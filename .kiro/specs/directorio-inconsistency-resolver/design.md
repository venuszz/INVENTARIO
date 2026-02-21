# Diseño: Modo Resolución de Inconsistencias

## Arquitectura de Componentes

```
DirectorioManager (index.tsx)
├── InconsistencyAlert (existing)
└── InconsistencyResolverMode (new)
    ├── ResolverHeader
    ├── ResolverLayout
    │   ├── InconsistencyList (40% width)
    │   │   ├── ListHeader
    │   │   ├── ListGroup (por tipo)
    │   │   │   └── ListItem[]
    │   │   └── ListFooter
    │   │
    │   └── ResolutionPanel (60% width)
    │       ├── PanelHeader
    │       ├── PanelContent
    │       │   ├── DuplicateAreaResolver
    │       │   ├── EmptyDirectorResolver
    │       │   └── EmptyAreaResolver
    │       └── PanelActions
    └── CompletionScreen
```

## Estructura de Archivos

```
src/components/admin/directorio/
├── index.tsx (modificar)
├── components/
│   ├── InconsistencyAlert.tsx (existing)
│   └── resolver/
│       ├── InconsistencyResolverMode.tsx
│       ├── ResolverHeader.tsx
│       ├── ResolverLayout.tsx
│       ├── InconsistencyList.tsx
│       ├── ResolutionPanel.tsx
│       ├── resolvers/
│       │   ├── DuplicateAreaResolver.tsx
│       │   ├── EmptyDirectorResolver.tsx
│       │   └── EmptyAreaResolver.tsx
│       └── CompletionScreen.tsx
├── hooks/
│   ├── useInconsistencyResolver.ts (new)
│   ├── useInconsistencyActions.ts (new)
│   └── useDirectorioStats.ts (modificar)
└── types/
    └── resolver.ts (new)
```

## Estados y Tipos

### Types (resolver.ts)
```typescript
export type ResolverMode = 'idle' | 'active' | 'completing';

export interface ResolverState {
  mode: ResolverMode;
  selectedIndex: number;
  resolvedIds: Set<string>;
  isResolving: boolean;
}

export interface ResolutionAction {
  type: 'keep_one' | 'remove_area' | 'delete_director' | 'delete_area' | 'skip';
  targetId: number;
  additionalData?: any;
}

export interface InconsistencyWithStats extends Inconsistency {
  stats?: {
    bienesCount: number;
    resguardosCount: number;
  };
}
```

### Hook: useInconsistencyResolver
```typescript
interface UseInconsistencyResolverReturn {
  // Estado
  mode: ResolverMode;
  selectedIndex: number;
  selectedInconsistency: InconsistencyWithStats | null;
  pendingCount: number;
  resolvedCount: number;
  
  // Acciones
  enterResolverMode: () => void;
  exitResolverMode: () => void;
  selectInconsistency: (index: number) => void;
  nextInconsistency: () => void;
  previousInconsistency: () => void;
  markAsResolved: (id: string) => void;
}
```

### Hook: useInconsistencyActions
```typescript
interface UseInconsistencyActionsReturn {
  // Acciones de resolución
  keepOneDirector: (areaId: number, directorId: number) => Promise<void>;
  removeAreaFromDirector: (areaId: number, directorId: number) => Promise<void>;
  deleteDirector: (directorId: number) => Promise<void>;
  deleteArea: (areaId: number) => Promise<void>;
  
  // Estado
  isExecuting: boolean;
  error: string | null;
}
```

## Animaciones Detalladas

### Entrada al Modo (900ms total)

#### Fase 1: Preparación (0-200ms)
```typescript
// Badge de inconsistencias
animate: {
  scale: [1, 1.2, 0],
  opacity: [1, 1, 0],
  y: [0, -20, -40]
}

// Registros del directorio
animate: {
  opacity: [1, 0],
  scale: [1, 0.98]
}

// Barra de búsqueda y botón añadir
animate: {
  opacity: [1, 0],
  height: ['auto', 0]
}
```

#### Fase 2: Transformación (200-600ms)
```typescript
// Header
animate: {
  height: ['auto', 'auto'], // Mantiene altura
}

// Título
animate: {
  opacity: [1, 0, 1],
  x: [0, -20, 0]
}

// Layout split
animate: {
  opacity: [0, 1],
  scale: [0.95, 1]
}

// Panel izquierdo
animate: {
  x: ['-100%', '0%'],
  opacity: [0, 1]
}

// Panel derecho
animate: {
  x: ['100%', '0%'],
  opacity: [0, 1]
}
```

#### Fase 3: Contenido (600-900ms)
```typescript
// Items de lista (stagger)
animate: {
  opacity: [0, 1],
  x: [-20, 0]
}
transition: {
  delay: index * 0.05
}

// Contenido panel derecho
animate: {
  opacity: [0, 1],
  y: [20, 0]
}
```

### Cambio de Inconsistencia (400ms)
```typescript
// Panel derecho sale
exit: {
  opacity: [1, 0],
  x: [0, 50],
  transition: { duration: 0.2 }
}

// Panel derecho entra
initial: {
  opacity: 0,
  x: -50
}
animate: {
  opacity: 1,
  x: 0,
  transition: { duration: 0.2, delay: 0.2 }
}
```

### Resolución Exitosa (600ms)
```typescript
// Check verde aparece
animate: {
  scale: [0, 1.2, 1],
  opacity: [0, 1, 1]
}

// Item en lista se marca
animate: {
  opacity: [1, 0.5],
  backgroundColor: ['transparent', 'green/10']
}

// Transición a siguiente
// (usa animación de cambio de inconsistencia)
```

### Salida del Modo (900ms)
```typescript
// Inverso de la entrada
// Panel derecho sale
animate: {
  x: ['0%', '100%'],
  opacity: [1, 0]
}

// Panel izquierdo sale
animate: {
  x: ['0%', '-100%'],
  opacity: [1, 0]
}

// Header se restaura
animate: {
  opacity: [1, 0, 1]
}

// Registros aparecen
animate: {
  opacity: [0, 1],
  scale: [0.98, 1]
}
transition: {
  staggerChildren: 0.05
}
```

## Layout Responsivo

### Desktop (>1024px)
- Split 40/60
- Ambos paneles visibles
- Scroll independiente

### Tablet (768-1024px)
- Split 45/55
- Fuentes ligeramente más pequeñas
- Padding reducido

### Mobile (<768px)
- Stack vertical
- Lista arriba (colapsable)
- Panel abajo (expandido)
- Navegación con botones prev/next

## Paleta de Colores

### Estados
- **Normal**: Colores del tema actual
- **Seleccionado**: 
  - Border: red-400/red-600
  - Background: red-500/5
- **Resuelto**: 
  - Opacity: 50%
  - Check: green-400/green-600
  - Strikethrough en texto
- **Hover**: 
  - Background: white/5 o black/5

### Indicadores
- **Alerta**: red-400 (dark) / red-600 (light)
- **Éxito**: green-400 (dark) / green-600 (light)
- **Info**: blue-400 (dark) / blue-600 (light)
- **Warning**: yellow-400 (dark) / yellow-600 (light)

## Accesibilidad

### Navegación por Teclado
- `Tab`: Navegar entre elementos
- `Enter`: Seleccionar/Confirmar
- `Escape`: Salir del modo
- `Arrow Up/Down`: Navegar lista
- `Arrow Left/Right`: Anterior/Siguiente

### ARIA Labels
- `role="dialog"` en el modo resolver
- `aria-label` en todos los botones
- `aria-selected` en item seleccionado
- `aria-live="polite"` en contador

### Focus Management
- Focus trap dentro del modo
- Focus visible en todos los elementos
- Restaurar focus al salir

## Performance

### Optimizaciones
- Virtualización de lista si >50 items
- Memoización de componentes pesados
- Debounce en acciones de resolución
- Lazy load de stats adicionales

### Métricas
- Time to Interactive < 100ms
- Animaciones a 60fps
- Resolución de acción < 500ms

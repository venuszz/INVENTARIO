# React Doctor Fixes - Design

## Implementation Strategy

### Phased Approach
Dividir el trabajo en 5 fases para minimizar riesgos y permitir validación incremental.

## Phase 1: Critical Errors (Priority 1)
**Objetivo**: Eliminar los 20 errores críticos
**Duración estimada**: Alta prioridad

### 1.1 Data Fetching Migration

#### Setup React Query
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

#### Provider Setup
```typescript
// src/app/layout.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

#### Migration Pattern
```typescript
// Antes: fetch en useEffect
useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/data')
      const data = await res.json()
      setData(data)
    } catch (error) {
      setError(error)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])

// Después: React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['data'],
  queryFn: async () => {
    const res = await fetch('/api/data')
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  }
})
```

#### Files to Migrate
- `src/hooks/indexation/*.ts` - Todos los hooks de indexación
- Componentes con fetch directo (identificar con grep)

### 1.2 Extract Nested Components

#### Pattern for SortableHeader
```typescript
// Antes: src/components/.../InventoryTable.tsx
export function InventoryTable() {
  const SortableHeader = ({ column }) => { /* ... */ }
  
  return <table>...</table>
}

// Después: src/components/.../InventoryTable.tsx
import { SortableHeader } from './SortableHeader'

export function InventoryTable() {
  return <table>...</table>
}

// Nuevo: src/components/.../SortableHeader.tsx
interface SortableHeaderProps {
  column: string
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  onSort: (column: string) => void
}

export function SortableHeader({ 
  column, 
  sortColumn, 
  sortDirection, 
  onSort 
}: SortableHeaderProps) {
  // Implementación
}
```

#### Files to Check
- `src/components/consultas/*/components/InventoryTable.tsx`
- `src/components/resguardos/*/components/*.tsx`
- Buscar pattern: `const [A-Z]\w+ = \(`

### 1.3 ARIA Props

#### Pattern
```typescript
// Antes
<div role="option" onClick={handleSelect}>
  {option.label}
</div>

// Después
<div 
  role="option" 
  aria-selected={selected === option.value}
  onClick={handleSelect}
>
  {option.label}
</div>
```

#### Files to Check
- `src/components/*/CustomSelect.tsx`
- `src/components/*/SuggestionDropdown.tsx`
- Componentes con role="option"

### 1.4 State Reset Pattern

#### Pattern
```typescript
// Antes
useEffect(() => {
  setLocalState(propValue)
}, [propValue])

// Después - Opción 1: Derivar estado
const derivedValue = computeValue(propValue)

// Después - Opción 2: Key prop
<Component key={propValue} />
```

## Phase 2: Framer Motion Optimization (Priority 2)
**Objetivo**: Reducir bundle size en ~4.2MB
**Impacto**: Alto (141 casos)

### 2.1 Setup LazyMotion

```typescript
// src/components/MotionProvider.tsx
'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import { ReactNode } from 'react'

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}
```

```typescript
// src/app/layout.tsx
import { MotionProvider } from '@/components/MotionProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MotionProvider>
          {children}
        </MotionProvider>
      </body>
    </html>
  )
}
```

### 2.2 Migration Pattern

```typescript
// Antes
import { motion } from 'framer-motion'

export function Component() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      Content
    </motion.div>
  )
}

// Después
import { m } from 'framer-motion'

export function Component() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      Content
    </m.div>
  )
}
```

### 2.3 Automated Migration
```bash
# Buscar todos los archivos con motion
grep -r "from 'framer-motion'" src/

# Reemplazar imports
# motion -> m
# Mantener otros imports (AnimatePresence, etc.)
```

## Phase 3: Accessibility & Forms (Priority 2)
**Objetivo**: Mejorar accesibilidad
**Impacto**: 155 labels + otros issues

### 3.1 Form Labels Pattern

```typescript
// Patrón 1: htmlFor
<label htmlFor="email-input" className="...">
  Email
</label>
<input id="email-input" type="email" />

// Patrón 2: Wrapper
<label className="...">
  Email
  <input type="email" />
</label>
```

### 3.2 Keyboard Accessibility

```typescript
// Antes
<div onClick={handleClick}>
  Click me
</div>

// Después - Opción 1: Button
<button onClick={handleClick}>
  Click me
</button>

// Después - Opción 2: Keyboard handler
<div 
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Click me
</div>
```

### 3.3 Files to Update
- Todos los componentes de formularios
- `src/components/*/steps/*.tsx`
- `src/components/*/modals/*.tsx`

## Phase 4: Component Architecture (Priority 2-3)
**Objetivo**: Mejorar mantenibilidad

### 4.1 Break Down Large Components

#### RealtimeIndicator (476 líneas)
```
src/components/RealtimeIndicator/
├── index.tsx (main component, ~100 líneas)
├── components/
│   ├── ConnectionStatus.tsx
│   ├── SyncIndicator.tsx
│   ├── ErrorDisplay.tsx
│   └── SettingsPanel.tsx
├── hooks/
│   ├── useRealtimeConnection.ts
│   └── useRealtimeSync.ts
└── types.ts
```

#### Pattern
- Componente principal < 150 líneas
- Extraer secciones lógicas a subcomponentes
- Extraer lógica compleja a custom hooks
- Mantener types en archivo separado

### 4.2 useState to useReducer

```typescript
// Antes: Múltiples useState
const [field1, setField1] = useState('')
const [field2, setField2] = useState('')
const [field3, setField3] = useState(false)
const [field4, setField4] = useState(null)
const [field5, setField5] = useState([])

// Después: useReducer
type State = {
  field1: string
  field2: string
  field3: boolean
  field4: string | null
  field5: any[]
}

type Action = 
  | { type: 'SET_FIELD1'; payload: string }
  | { type: 'SET_FIELD2'; payload: string }
  | { type: 'SET_FIELD3'; payload: boolean }
  | { type: 'RESET' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FIELD1':
      return { ...state, field1: action.payload }
    case 'SET_FIELD2':
      return { ...state, field2: action.payload }
    case 'SET_FIELD3':
      return { ...state, field3: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

const [state, dispatch] = useReducer(reducer, initialState)
```

## Phase 5: Performance & Best Practices (Priority 3)
**Objetivo**: Optimizaciones finales

### 5.1 Array Keys

```typescript
// Antes
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// Después
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}

// Si no hay ID, generar uno estable
const itemsWithIds = useMemo(() => 
  items.map((item, index) => ({
    ...item,
    _id: `${item.name}-${index}-${JSON.stringify(item)}`
  })),
  [items]
)
```

### 5.2 Next.js Image

```typescript
// Antes
<img src="/images/logo.png" alt="Logo" />

// Después
import Image from 'next/image'

<Image 
  src="/images/logo.png" 
  alt="Logo"
  width={200}
  height={50}
  priority // Para above-the-fold images
/>
```

### 5.3 useSearchParams with Suspense

```typescript
// src/components/SearchComponent.tsx
'use client'

import { useSearchParams } from 'next/navigation'

export function SearchComponent() {
  const searchParams = useSearchParams()
  // ...
}

// src/app/page.tsx
import { Suspense } from 'react'
import { SearchComponent } from '@/components/SearchComponent'
import { SearchSkeleton } from '@/components/SearchSkeleton'

export default function Page() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchComponent />
    </Suspense>
  )
}
```

### 5.4 Animation Improvements

```typescript
// Antes
<m.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ duration: 0.2 }}
>

// Después
<m.div
  initial={{ scale: 0.95, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.2 }}
>
```

### 5.5 Transition Properties

```typescript
// Antes
className="transition-all duration-200"

// Después
className="transition-[opacity,transform] duration-200"

// O específico
className="transition-opacity duration-200"
```

### 5.6 Module-level Constants

```typescript
// Antes
function Component({ items = [] }) {
  // Nueva referencia cada render
}

// Después
const EMPTY_ARRAY: Item[] = []

function Component({ items = EMPTY_ARRAY }) {
  // Referencia estable
}
```

### 5.7 Remove Unnecessary useMemo

```typescript
// Antes - Innecesario
const value = useMemo(() => prop.field, [prop.field])
const isActive = useMemo(() => status === 'active', [status])

// Después - Directo
const value = prop.field
const isActive = status === 'active'

// Mantener solo para cálculos costosos
const expensiveValue = useMemo(() => {
  return items.reduce((acc, item) => {
    // Cálculo complejo
  }, {})
}, [items])
```

## Validation Strategy

### After Each Phase
```bash
# Ejecutar react-doctor
npx react-doctor@latest

# Verificar score y errores
# Objetivo por fase:
# Fase 1: 85/100, 0 errores
# Fase 2: 90/100
# Fase 3: 93/100
# Fase 4: 95/100
# Fase 5: 96+/100
```

### Testing Checklist
- [ ] Compilación sin errores TypeScript
- [ ] No hay errores en consola del navegador
- [ ] Funcionalidad existente intacta
- [ ] Performance mejorada (bundle size, render time)
- [ ] Accesibilidad mejorada (screen reader testing)

## Tooling

### ESLint Rules
Agregar reglas para prevenir regresiones:

```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    }
  }
]
```

### Pre-commit Hook
```bash
# .husky/pre-commit
npm run lint
npm run type-check
```

## Migration Utilities

### Codemod Scripts
Crear scripts para automatizar cambios repetitivos:

```typescript
// scripts/migrate-framer-motion.ts
// Script para reemplazar motion -> m automáticamente

// scripts/add-aria-selected.ts
// Script para agregar aria-selected a elementos con role="option"

// scripts/extract-constants.ts
// Script para extraer arrays/objetos vacíos a constantes de módulo
```

## Documentation

### Component Guidelines
Crear guía de estilo para componentes:

```markdown
# Component Guidelines

## Size Limits
- Componentes < 200 líneas
- Hooks < 100 líneas
- Funciones < 50 líneas

## Patterns
- Usar React Query para data fetching
- Usar LazyMotion + m para animaciones
- Siempre asociar labels con inputs
- Keys estables en listas
- useReducer para 3+ estados relacionados

## Accessibility
- Todos los formularios accesibles
- Keyboard navigation en elementos interactivos
- ARIA props apropiados
```

## Risk Mitigation

### Backup Strategy
- Crear branch para cada fase
- Commits pequeños y atómicos
- Testing después de cada cambio significativo

### Rollback Plan
- Mantener branches de cada fase
- Documentar cambios en cada commit
- Testing manual de funcionalidad crítica

## Success Metrics

### Quantitative
- React Doctor score: 78 → 96+
- Errores: 20 → 0
- Warnings: 625 → < 50
- Bundle size: -4.2MB
- Componentes > 300 líneas: 46 → 0

### Qualitative
- Código más mantenible
- Mejor accesibilidad
- Mejor performance percibida
- Menos bugs relacionados con keys/state

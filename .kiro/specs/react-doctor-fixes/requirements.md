# React Doctor Fixes - Requirements

## Overview
Solucionar los 20 errores y 625 warnings detectados por react-doctor para mejorar la calidad del código, performance, accesibilidad y mantenibilidad del proyecto.

## Current State
- Score: 78/100
- 20 errores críticos
- 625 warnings
- 185 archivos afectados de 406 totales

## Goals
- Alcanzar score ~96/100
- Eliminar todos los errores críticos
- Reducir warnings significativamente
- Mejorar bundle size (~4.2MB de optimización potencial)
- Mejorar accesibilidad (WCAG compliance)
- Mejorar mantenibilidad del código

## Critical Issues (Errors - Priority 1)

### 1. fetch() en useEffect (3 casos)
**Problema**: Llamadas fetch directas en useEffect sin manejo adecuado de estado de carga/error.

**Ubicaciones esperadas**:
- Hooks de indexación
- Componentes de consultas
- Componentes de admin

**Solución requerida**:
- Migrar a React Query (@tanstack/react-query)
- O mover lógica a Server Components donde sea posible
- Implementar manejo consistente de loading/error states

### 2. Componentes definidos dentro de componentes (14 casos)
**Problema**: "SortableHeader" y otros componentes definidos dentro de componentes padres.

**Ubicaciones confirmadas**:
- InventoryTable components (múltiples)

**Solución requerida**:
- Extraer todos los componentes internos a archivos separados
- Mover a module scope cuando sea apropiado
- Mantener tipado TypeScript correcto

### 3. Props ARIA faltantes
**Problema**: Elementos con rol `option` sin `aria-selected`.

**Solución requerida**:
- Agregar `aria-selected` a todos los elementos con rol `option`
- Implementar manejo correcto de estado seleccionado

### 4. State reset en useEffect (2 casos)
**Problema**: Reseteo de estado en useEffect cuando debería usarse key prop.

**Solución requerida**:
- Identificar componentes que resetean estado en useEffect
- Refactorizar para usar key prop o derivar estado inline

## High Priority Issues (Warnings - Priority 2)

### 5. Framer Motion sin optimizar (141 casos)
**Problema**: Importando `motion` en lugar de `m` con LazyMotion.
**Impacto**: ~4.2MB de bundle size innecesario.

**Solución requerida**:
```typescript
// Antes
import { motion } from "framer-motion"

// Después
import { LazyMotion, m, domAnimation } from "framer-motion"

// En el componente raíz
<LazyMotion features={domAnimation}>
  <m.div>...</m.div>
</LazyMotion>
```

### 6. Array index como key (61 casos)
**Problema**: Uso de `index` como key en listas.

**Solución requerida**:
- Identificar todas las listas con index keys
- Usar identificadores únicos estables (id, uuid, slug)
- Generar IDs únicos si no existen

### 7. Labels sin asociar (155 casos)
**Problema**: Labels de formulario sin `htmlFor` o sin envolver el control.

**Solución requerida**:
- Agregar `htmlFor` a todos los labels
- O envolver el input dentro del label
- Asegurar IDs únicos para los inputs

### 8. Componentes muy grandes (46 casos)
**Problema**: "RealtimeIndicator" tiene 476 líneas.

**Componentes a refactorizar**:
- RealtimeIndicator (476 líneas)
- Otros componentes grandes identificados

**Solución requerida**:
- Dividir en componentes más pequeños y enfocados
- Extraer lógica a custom hooks
- Mantener single responsibility principle

### 9. useSearchParams sin Suspense (4 casos)
**Problema**: Uso de useSearchParams sin boundary de Suspense.

**Solución requerida**:
```typescript
<Suspense fallback={<Skeleton />}>
  <ComponentWithSearchParams />
</Suspense>
```

### 10. Múltiples useState (25 casos)
**Problema**: Componente "Inicio" tiene 5+ useState calls.

**Solución requerida**:
- Refactorizar a useReducer para estado relacionado
- Agrupar estado lógicamente relacionado

## Medium Priority Issues (Priority 3)

### 11. Imágenes sin optimizar (34 casos)
**Problema**: Uso de `<img>` en lugar de `next/image`.

**Solución requerida**:
- Reemplazar todos los `<img>` con `<Image>` de next/image
- Configurar dimensiones apropiadas
- Implementar lazy loading

### 12. Múltiples setState en useEffect (36 casos)
**Problema**: 6+ setState calls en un solo useEffect.

**Solución requerida**:
- Combinar en useReducer
- O derivar estado cuando sea posible

### 13. Unknown properties (29 casos)
**Problema**: Props desconocidas pasadas a elementos DOM.

**Solución requerida**:
- Identificar y remover props inválidas
- Usar destructuring para separar props de DOM

### 14. useEffect simulando event handlers (30 casos)
**Problema**: Lógica condicional en useEffect que debería estar en handlers.

**Solución requerida**:
- Mover lógica a onClick, onChange, onSubmit
- Eliminar useEffect innecesarios

### 15. autoFocus issues (6 casos)
**Problema**: Uso de autoFocus que causa problemas de accesibilidad.

**Solución requerida**:
- Remover autoFocus o justificar su uso
- Implementar focus management manual cuando sea necesario

### 16. Animaciones scale: 0 (27 casos)
**Problema**: Elementos aparecen de la nada con scale: 0.

**Solución requerida**:
```typescript
// Antes
initial={{ scale: 0 }}

// Después
initial={{ scale: 0.95, opacity: 0 }}
```

### 17. Default props con arrays vacíos (13 casos)
**Problema**: `defaultValue={[]}` crea nueva referencia cada render.

**Solución requerida**:
```typescript
const EMPTY_ARRAY: Item[] = []
// Usar EMPTY_ARRAY como default
```

### 18. useState desde props (2 casos)
**Problema**: useState inicializado desde prop "isConnected".

**Solución requerida**:
- Derivar valor inline si debe sincronizarse
- O usar useEffect con dependency array si es intencional

### 19. useMemo innecesario
**Problema**: useMemo envolviendo expresiones triviales.

**Solución requerida**:
- Remover useMemo de operaciones baratas
- Mantener solo para cálculos costosos

### 20. transition: "all" (casos múltiples)
**Problema**: Anima todas las propiedades incluyendo layout.

**Solución requerida**:
```typescript
// Antes
transition: "all 200ms"

// Después
transition: "opacity 200ms, transform 200ms"
```

### 21. next/link vs <a> (3 casos)
**Problema**: Uso de `<a>` para links internos.

**Solución requerida**:
- Reemplazar con `<Link>` de next/link
- Mantener `<a>` solo para links externos

### 22. Client-side redirects (3 casos)
**Problema**: Redirects en useEffect del lado del cliente.

**Solución requerida**:
- Usar `redirect()` en Server Components
- O manejar en middleware

### 23. Inline render functions (2 casos)
**Problema**: Funciones render inline como `renderItem()`.

**Solución requerida**:
- Extraer a componentes nombrados
- Permitir reconciliación apropiada

### 24. Elementos clickables sin keyboard handlers (2 casos)
**Problema**: Elementos no-interactivos con onClick sin teclado.

**Solución requerida**:
- Agregar onKeyDown/onKeyUp/onKeyPress
- O usar elementos semánticos (button)

### 25. Elementos estáticos sin role (2 casos)
**Problema**: Elementos HTML estáticos con event handlers sin role.

**Solución requerida**:
- Agregar role apropiado
- O usar elemento semántico

### 26. useEffect flash en mount (2 casos)
**Problema**: useEffect(setState, []) causa flash visual.

**Solución requerida**:
- Usar useSyncExternalStore
- O agregar suppressHydrationWarning

## Success Criteria
- [ ] Score de react-doctor >= 95/100
- [ ] 0 errores críticos
- [ ] < 50 warnings totales
- [ ] Bundle size reducido en ~4MB
- [ ] Todos los formularios accesibles (labels asociados)
- [ ] Todos los componentes < 300 líneas
- [ ] Framer Motion optimizado en todos los casos
- [ ] Keys estables en todas las listas
- [ ] useSearchParams con Suspense boundaries
- [ ] Imágenes optimizadas con next/image

## Out of Scope
- Refactorización completa de arquitectura
- Migración a nuevas librerías (excepto React Query)
- Cambios en lógica de negocio
- Cambios en diseño visual

## Dependencies
- @tanstack/react-query (para data fetching)
- Ninguna otra dependencia nueva requerida

## Risks
- Cambios en 185 archivos pueden introducir regresiones
- Refactorización de componentes grandes puede afectar funcionalidad
- Migración a React Query requiere testing extensivo
- Cambios en keys pueden afectar estado de componentes

## Testing Strategy
- Testing manual de cada módulo refactorizado
- Verificación de accesibilidad con screen readers
- Testing de performance (bundle size, render time)
- Validación con react-doctor después de cada fase

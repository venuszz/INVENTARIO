# Sistema de Alertas de Incoherencias en Directorio

## Descripción General

Se ha implementado un sistema de detección y visualización de incoherencias en el módulo de gestión de directorio. Este sistema muestra una alerta flotante persistente tipo popover (similar al IndexationPopover) que permanece visible mientras existan inconsistencias detectadas.

## Componentes Implementados

### 1. Hook: `useDirectorioInconsistencies`
**Ubicación:** `src/components/admin/directorio/hooks/useDirectorioInconsistencies.ts`

Hook personalizado que detecta incoherencias en los datos del directorio.

**Incoherencias detectadas:**
- **Áreas duplicadas**: Detecta cuando una misma área está asignada a múltiples directores

**Retorna:**
```typescript
{
  inconsistencies: Inconsistency[]
}
```

**Tipos de inconsistencias:**
```typescript
interface DuplicateAreaInconsistency {
    type: 'duplicate_area';
    id_area: number;
    areaName: string;
    directors: Array<{
        id_directorio: number;
        nombre: string;
    }>;
}
```

### 2. Componente: `InconsistencyAlert`
**Ubicación:** `src/components/admin/directorio/components/InconsistencyAlert.tsx`

Componente visual flotante que muestra las incoherencias detectadas en formato de popover persistente.

**Características:**
- Diseño tipo popover flotante (similar a IndexationPopover)
- Posicionado en la esquina superior derecha (top-20 right-4)
- No se puede cerrar manualmente
- Permanece visible mientras existan incoherencias
- Animaciones suaves de entrada/salida con Framer Motion
- Soporte para tema claro/oscuro
- Muestra solo el conteo de incoherencias, no los detalles
- Efecto de pulso y glow para llamar la atención

**Estilo visual:**
- Color ámbar para indicar advertencia
- Icono de triángulo de alerta con animación de pulso
- Contador animado de incoherencias
- Barra de pulso animada en la parte inferior
- Efecto de glow radial en el fondo
- Bordes y sombras sutiles

**Estructura del popover:**
```
┌─────────────────────────────────┐
│ ⚠️  Incoherencias detectadas    │
│     Requiere atención           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Áreas duplicadas        [3] │ │
│ └─────────────────────────────┘ │
│                                 │
│ Revisa y corrige las asignaciones│
│ ═══════════════════════════════ │ (barra animada)
└─────────────────────────────────┘
```

## Integración

El sistema se integra en el componente principal `DirectorioManager`:

```typescript
// 1. Importar el hook y componente
import { useDirectorioInconsistencies } from './hooks/useDirectorioInconsistencies';
import { InconsistencyAlert } from './components/InconsistencyAlert';

// 2. Usar el hook
const { inconsistencies } = useDirectorioInconsistencies(
    directorioFromStore,
    areasFromStore,
    directorioAreasFromStore
);

// 3. Renderizar el componente (fuera del contenido principal)
<InconsistencyAlert inconsistencies={inconsistencies} />
```

## Ubicación en la UI

La alerta se muestra:
- Posición fija en la esquina superior derecha
- Debajo del header principal (top-20)
- Con margen derecho de 1rem (right-4)
- z-index de 40 para estar sobre el contenido
- No interfiere con el scroll del contenido principal

## Comportamiento

1. **Detección automática**: El hook recalcula las incoherencias cada vez que cambian los datos del directorio, áreas o relaciones
2. **Visualización persistente**: La alerta permanece visible mientras existan incoherencias
3. **Desaparición automática**: La alerta desaparece automáticamente cuando se resuelven todas las incoherencias
4. **Animaciones continuas**: 
   - Pulso en el icono de alerta (2s loop)
   - Pulso en el contador (2s loop)
   - Barra de progreso animada en la parte inferior (2s loop)
5. **Sin interacción**: No tiene botón de cerrar, debe resolverse el problema

## Ejemplo de Uso

### Escenario: 3 áreas duplicadas

Si hay 3 áreas con múltiples directores asignados, el popover mostrará:

```
⚠️ Incoherencias detectadas
   Requiere atención

┌─────────────────────────┐
│ Áreas duplicadas    [3] │ ← Contador animado
└─────────────────────────┘

Revisa y corrige las asignaciones
═══════════════════════════ ← Barra pulsante
```

## Resolución de Incoherencias

Para resolver una incoherencia de área duplicada:

1. Identificar las áreas problemáticas en la lista de empleados
2. Editar uno de los directores afectados
3. Remover el área duplicada de su lista de áreas
4. Guardar los cambios
5. La alerta desaparecerá automáticamente cuando no queden incoherencias

## Diseño Visual

### Animaciones
- **Entrada**: Spring animation con stiffness 300, damping 25
- **Icono**: Pulso de opacidad (1 → 0.7 → 1) cada 2 segundos
- **Contador**: Escala (1 → 1.1 → 1) cada 2 segundos
- **Barra inferior**: Movimiento horizontal con fade de opacidad

### Colores
- **Tema oscuro**: 
  - Fondo: negro con borde ámbar/30
  - Texto: blanco con variaciones de opacidad
  - Acento: ámbar (#fbbf24)
- **Tema claro**:
  - Fondo: blanco con borde ámbar/50
  - Texto: negro con variaciones de opacidad
  - Acento: ámbar (#f59e0b)

## Extensibilidad

El sistema está diseñado para ser extensible. Para agregar nuevos tipos de incoherencias:

1. Agregar el nuevo tipo a la unión `Inconsistency` en el hook
2. Implementar la lógica de detección en `useDirectorioInconsistencies`
3. Agregar el contador correspondiente en `InconsistencyAlert`

### Posibles incoherencias futuras:
- Directores sin áreas asignadas
- Directores sin puesto definido
- Áreas sin directores asignados
- Nombres duplicados de directores
- Puestos inconsistentes

## Notas Técnicas

- Usa `useMemo` para optimizar el cálculo de incoherencias
- Implementa animaciones con Framer Motion
- Respeta el tema (claro/oscuro) del sistema
- No requiere estado local adicional
- Se actualiza reactivamente con los cambios en los datos
- Posición fija que no afecta el layout del contenido
- Compatible con el sistema de IndexationPopover (mismo z-index y posicionamiento)

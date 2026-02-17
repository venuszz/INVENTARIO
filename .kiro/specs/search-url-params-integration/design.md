# Diseño: Integración de Parámetros URL en Búsqueda Universal

## Resumen

Este diseño describe la implementación de lectura de parámetros URL (`id` o `folio`) en todos los componentes de consulta para abrir automáticamente el panel de detalles cuando un usuario hace clic en un resultado de la búsqueda universal. La solución utiliza `useSearchParams()` de Next.js y se integra con los hooks existentes de cada componente.

## Arquitectura

### Flujo General

```
Usuario busca → Búsqueda Universal → Redirige con parámetro URL
                                            ↓
                                    Componente lee parámetro
                                            ↓
                                    Busca item en datos indexados
                                            ↓
                                    Abre panel de detalles automáticamente
```

### Componentes Afectados

**Componentes de Inventario (usan parámetro `id`):**
1. `src/components/consultas/no-listado/index.tsx` - TLAXCALA
2. `src/components/consultas/inea/index.tsx` - INEA General
3. `src/components/consultas/itea/index.tsx` - ITEA General
4. `src/components/consultas/inea/obsoletos/index.tsx` - INEA Obsoletos
5. `src/components/consultas/itea/obsoletos/index.tsx` - ITEA Obsoletos

**Componentes de Resguardos (usan parámetro `folio`):**
6. `src/components/resguardos/consultar/index.tsx` - Consultar Resguardos
7. `src/components/resguardos/consultarBajas/index.tsx` - Consultar Bajas

## Componentes e Interfaces

### Hook Personalizado: useURLParamHandler

Crear un hook reutilizable para manejar la lógica de lectura de parámetros URL y búsqueda de items.

```typescript
interface UseURLParamHandlerOptions<T> {
  paramName: 'id' | 'folio';
  items: T[];
  isLoading: boolean;
  getItemKey: (item: T) => string | number;
  onItemSelect: (item: T) => void;
}

interface UseURLParamHandlerReturn {
  isProcessingParam: boolean;
  paramNotFound: boolean;
  clearParamNotFound: () => void;
}

function useURLParamHandler<T>(
  options: UseURLParamHandlerOptions<T>
): UseURLParamHandlerReturn
```

**Responsabilidades:**
- Leer el parámetro de URL especificado (`id` o `folio`)
- Esperar a que los datos estén cargados
- Buscar el item correspondiente en los datos indexados
- Llamar a `onItemSelect` si se encuentra el item
- Manejar el caso donde el item no existe
- Ejecutar solo una vez por parámetro

### Integración en Componentes de Inventario

**Patrón de implementación:**

```typescript
export default function ConsultaComponent() {
  const { muebles, isIndexing } = useIndexationHook();
  const { handleSelectItem } = useItemEdit();
  
  // Nuevo hook para manejar parámetro URL
  const { isProcessingParam, paramNotFound, clearParamNotFound } = useURLParamHandler({
    paramName: 'id',
    items: muebles,
    isLoading: isIndexing,
    getItemKey: (item) => item.id,
    onItemSelect: handleSelectItem
  });
  
  // Mostrar mensaje si el item no se encuentra
  useEffect(() => {
    if (paramNotFound) {
      setMessage({ 
        type: 'warning', 
        text: 'El bien buscado no se encontró en los datos actuales' 
      });
      clearParamNotFound();
    }
  }, [paramNotFound]);
  
  // ... resto del componente
}
```

### Integración en Componentes de Resguardos

**Patrón de implementación:**

```typescript
export default function ConsultarResguardos() {
  const { resguardos, isLoading } = useResguardosData();
  const { selectResguardo } = useResguardoDetails();
  
  // Nuevo hook para manejar parámetro URL
  const { isProcessingParam, paramNotFound, clearParamNotFound } = useURLParamHandler({
    paramName: 'folio',
    items: resguardos,
    isLoading: isLoading,
    getItemKey: (item) => item.folio,
    onItemSelect: selectResguardo
  });
  
  // Mostrar mensaje si el resguardo no se encuentra
  useEffect(() => {
    if (paramNotFound) {
      setMessage({ 
        type: 'warning', 
        text: 'El resguardo buscado no se encontró en los datos actuales' 
      });
      clearParamNotFound();
    }
  }, [paramNotFound]);
  
  // ... resto del componente
}
```

## Modelos de Datos

### Tipos TypeScript

```typescript
// Hook options
interface UseURLParamHandlerOptions<T> {
  paramName: 'id' | 'folio';
  items: T[];
  isLoading: boolean;
  getItemKey: (item: T) => string | number;
  onItemSelect: (item: T) => void;
}

// Hook return
interface UseURLParamHandlerReturn {
  isProcessingParam: boolean;
  paramNotFound: boolean;
  clearParamNotFound: () => void;
}
```

## Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de corrección verificables por máquina.*


### Propiedad 1: Detección de Parámetro URL

*Para cualquier* URL que contenga un parámetro válido (`id` o `folio`), el hook `useURLParamHandler` debe detectar y extraer correctamente el valor del parámetro especificado.

**Valida: Requisitos 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2**

### Propiedad 2: Búsqueda de Item en Datos

*Para cualquier* parámetro extraído de la URL y conjunto de datos cargados, el hook debe buscar el item cuya clave (obtenida mediante `getItemKey`) coincida exactamente con el valor del parámetro.

**Valida: Requisitos 1.3, 2.3, 3.3, 4.3, 5.3, 6.3, 7.3**

### Propiedad 3: Selección Automática de Item Encontrado

*Para cualquier* item encontrado en los datos que coincida con el parámetro URL, el hook debe llamar automáticamente a la función `onItemSelect` con ese item como argumento, resultando en la apertura del panel de detalles.

**Valida: Requisitos 1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4**

### Propiedad 4: Ejecución Única por Parámetro

*Para cualquier* valor de parámetro URL, el hook debe procesar ese parámetro exactamente una vez, evitando múltiples ejecuciones que podrían causar comportamiento inesperado o loops infinitos.

**Valida: Requisitos implícitos de estabilidad del sistema**

## Manejo de Errores

### Casos de Error

1. **Item no encontrado**: Cuando el parámetro URL no corresponde a ningún item en los datos
   - Establecer `paramNotFound = true`
   - El componente padre muestra mensaje informativo
   - No se abre ningún panel de detalles

2. **Datos aún cargando**: Cuando se detecta un parámetro pero los datos aún están indexando
   - Esperar a que `isLoading = false`
   - Luego proceder con la búsqueda
   - Mostrar indicador de carga mientras se espera

3. **Parámetro inválido**: Cuando el parámetro está vacío o es null
   - No realizar ninguna acción
   - No mostrar mensajes de error

### Estrategia de Recuperación

- **Item no encontrado**: Permitir al usuario buscar manualmente en la tabla
- **Timeout de carga**: Si los datos tardan más de 10 segundos, mostrar mensaje y permitir uso normal
- **Parámetro inválido**: Comportamiento normal del componente sin parámetro

## Estrategia de Testing

### Enfoque Dual de Testing

Este feature requiere tanto pruebas unitarias como pruebas basadas en propiedades para garantizar corrección completa:

**Pruebas Unitarias:**
- Casos específicos de parámetros URL conocidos
- Verificación de integración con componentes existentes
- Casos edge: parámetros vacíos, datos vacíos, múltiples parámetros
- Comportamiento de limpieza de estado

**Pruebas Basadas en Propiedades:**
- Generación aleatoria de parámetros y conjuntos de datos
- Verificación de propiedades universales (detección, búsqueda, selección)
- Cobertura exhaustiva de combinaciones de entrada
- Mínimo 100 iteraciones por propiedad

### Configuración de Property-Based Testing

**Librería**: `fast-check` (para TypeScript/JavaScript)

**Configuración de tests:**
```typescript
import fc from 'fast-check';

// Cada test debe ejecutarse con mínimo 100 iteraciones
fc.assert(
  fc.property(/* generadores */),
  { numRuns: 100 }
);
```

**Formato de tags en tests:**
```typescript
// Feature: search-url-params-integration, Property 1: Detección de Parámetro URL
test('should detect URL parameter correctly', () => {
  // test implementation
});
```

### Tests de Integración

**Componentes de Inventario:**
- Verificar que el hook se integra correctamente con `useItemEdit`
- Verificar que los mensajes de error se muestran apropiadamente
- Verificar que el panel de detalles se abre correctamente

**Componentes de Resguardos:**
- Verificar que el hook se integra correctamente con `useResguardoDetails`
- Verificar comportamiento con parámetro `folio`
- Verificar que la selección de resguardo funciona correctamente

### Casos Edge Importantes

1. **Parámetro presente pero datos vacíos**: Debe indicar que no se encontró
2. **Múltiples parámetros en URL**: Solo debe procesar el parámetro especificado
3. **Parámetro cambia mientras el componente está montado**: Debe procesar el nuevo parámetro
4. **Usuario cierra panel manualmente**: No debe volver a abrirse automáticamente

## Consideraciones de Implementación

### Timing y Sincronización

**Problema**: Los datos pueden no estar disponibles inmediatamente cuando el componente se monta.

**Solución**: 
- Usar `useEffect` con dependencias en `items` y `isLoading`
- Solo procesar el parámetro cuando `isLoading === false` y `items.length > 0`
- Usar una bandera `hasProcessed` para evitar procesamiento múltiple

### Limpieza de Estado

**Problema**: El parámetro URL puede persistir después de cerrar el panel.

**Solución**:
- La limpieza del parámetro ya está implementada en los métodos `closeDetail` existentes
- No modificar este comportamiento en esta implementación
- El hook solo se encarga de la apertura inicial

### Performance

**Consideraciones**:
- La búsqueda de item es O(n) en el peor caso
- Para conjuntos de datos grandes (>1000 items), considerar optimización
- Usar `useMemo` para cachear resultados de búsqueda si es necesario

**Optimización futura**:
- Crear un mapa de índices en los stores de Zustand
- Búsqueda O(1) usando `Map<id, item>`

### Compatibilidad

**Next.js**: Requiere Next.js 13+ para `useSearchParams()`
**React**: Compatible con React 18+
**Navegadores**: Todos los navegadores modernos soportan URLSearchParams

## Cambio Adicional: Renombrar "No Listado" a "TLAXCALA"

### Archivos a Modificar

1. **Componente principal**: `src/components/consultas/no-listado/components/Header.tsx`
   - Cambiar título de "No Listado" a "TLAXCALA"

2. **Búsqueda Universal**: `src/components/search/UniversalSearchBar.tsx`
   - Cambiar etiqueta de resultados de "No Listado" a "TLAXCALA"

3. **Navegación**: Verificar si hay breadcrumbs o menús que usen "No Listado"

### Impacto

- Cambio puramente cosmético
- No afecta funcionalidad
- No requiere cambios en base de datos
- No requiere migración de datos

## Notas de Implementación

### Orden de Implementación

1. Crear hook `useURLParamHandler` como utilidad reutilizable
2. Integrar en un componente de inventario (No Listado/TLAXCALA) como prueba
3. Verificar funcionamiento completo
4. Replicar en los demás componentes de inventario
5. Integrar en componentes de resguardos
6. Aplicar cambio de nombre "No Listado" → "TLAXCALA"
7. Testing completo de todos los componentes

### Ubicación del Hook

Crear en: `src/hooks/useURLParamHandler.ts`

Razón: Es una utilidad genérica que se usa en múltiples componentes, no es específica de ningún módulo.

### Dependencias

- `next/navigation` - para `useSearchParams()`
- `react` - para `useEffect`, `useState`, `useRef`

No requiere nuevas dependencias externas.

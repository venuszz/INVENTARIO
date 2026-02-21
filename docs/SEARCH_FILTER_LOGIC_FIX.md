# Fix: Lógica de Filtrado con Múltiples Filtros del Mismo Tipo

## Problema Identificado

### Descripción del Bug
La lógica de filtrado en los componentes de búsqueda usaba `.every()` para validar todos los filtros activos, lo que causaba que múltiples filtros del mismo tipo (ej: dos áreas diferentes) no mostraran resultados.

### Ejemplo del Problema
Si el usuario aplicaba:
1. Filtro de director: "Juan Pérez"
2. Filtro de área: "Dirección General"
3. Filtro de área: "Recursos Humanos"

El código buscaba items que cumplieran:
- `directorio.nombre` incluya "Juan Pérez" **Y**
- `area.nombre` incluya "Dirección General" **Y**
- `area.nombre` incluya "Recursos Humanos"

Esto es imposible porque un item no puede tener dos áreas diferentes simultáneamente.

### Componentes Afectados
- ✅ `src/components/consultas/levantamiento/hooks/useSearchAndFilters.ts`
- ✅ `src/components/consultas/inea/hooks/useSearchAndFilters.ts`
- ✅ `src/components/consultas/itea/hooks/useSearchAndFilters.ts`
- ✅ `src/components/consultas/no-listado/hooks/useSearchAndFilters.ts`

## Solución Implementada

### Nueva Lógica de Filtrado

Se implementó una lógica de filtrado que agrupa los filtros por tipo y aplica:
- **OR** dentro del mismo tipo de filtro
- **AND** entre diferentes tipos de filtros

```typescript
// Agrupar filtros por tipo
const filtersByType = activeFilters.reduce((acc, filter) => {
  const type = filter.type || 'unknown';
  if (!acc[type]) acc[type] = [];
  acc[type].push(filter);
  return acc;
}, {} as Record<string, ActiveFilter[]>);

// AND entre tipos, OR dentro del mismo tipo
const passesActiveFilters = Object.entries(filtersByType).every(([type, filters]) => {
  // Dentro del mismo tipo, basta con que cumpla UNO (OR logic)
  return filters.some(filter => {
    // ... lógica de matching
  });
});
```

### Comportamiento Correcto

Ahora con los mismos filtros del ejemplo:
- Filtro de director: "Juan Pérez"
- Filtro de área: "Dirección General" **O** "Recursos Humanos"

El sistema muestra items que:
- Tienen director "Juan Pérez" **Y**
- Pertenecen a "Dirección General" **O** "Recursos Humanos"

## Caso Especial: PDF Personalizado en Levantamiento

### Requisito Especial
El botón de PDF personalizado en el componente de Levantamiento solo debe activarse cuando hay:
- **EXACTAMENTE UN** filtro de área
- **EXACTAMENTE UN** filtro de director

### Implementación
```typescript
const isCustomPDFEnabled = useMemo(() => {
  const areaFilters = activeFilters.filter(f => f.type === 'area');
  const directorFilters = activeFilters.filter(f => f.type === 'usufinal');
  
  // Must have exactly one of each type
  if (areaFilters.length !== 1 || directorFilters.length !== 1) return false;
  
  // ... validación de valores
}, [activeFilters, muebles]);
```

## Beneficios

1. **Flexibilidad**: Los usuarios pueden filtrar por múltiples valores del mismo campo
2. **Intuitividad**: El comportamiento es más natural y esperado
3. **Consistencia**: Todos los componentes de búsqueda ahora usan la misma lógica
4. **Mantenibilidad**: El código es más claro y fácil de entender

## Ejemplos de Uso

### Caso 1: Múltiples Áreas
```
Filtros activos:
- Área: "Dirección General"
- Área: "Recursos Humanos"

Resultado: Muestra items de CUALQUIERA de las dos áreas
```

### Caso 2: Área + Director
```
Filtros activos:
- Área: "Dirección General"
- Director: "Juan Pérez"

Resultado: Muestra items de "Dirección General" que tengan a "Juan Pérez" como director
```

### Caso 3: Múltiples Áreas + Director
```
Filtros activos:
- Área: "Dirección General"
- Área: "Recursos Humanos"
- Director: "Juan Pérez"

Resultado: Muestra items de cualquiera de las dos áreas que tengan a "Juan Pérez" como director
```

## Testing

### Verificación Manual
1. Aplicar un filtro de director
2. Agregar un filtro de área
3. Agregar un segundo filtro de área diferente
4. Verificar que se muestren resultados de ambas áreas con el director especificado

### Build Exitoso
```bash
npm run build
✓ Compiled successfully
```

## Fecha de Implementación
21 de febrero de 2026

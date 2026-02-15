# Diseño Técnico: Migración del Campo Resguardante

## Arquitectura de la Solución

### 1. Query Pattern

Cada módulo debe hacer un LEFT JOIN con la tabla `resguardos` para obtener el campo `resguardante`:

```typescript
const { data, error } = await supabase
  .from(TABLE) // muebles, mueblesitea, o mueblestlaxcala
  .select(`
    *,
    area:id_area(id_area, nombre),
    directorio:id_directorio(id_directorio, nombre, puesto),
    resguardo:resguardos!id_mueble(resguardante)
  `)
  .eq('resguardos.origen', ORIGEN) // 'INEA', 'ITEA', o 'NO_LISTADO'
  .neq('estatus', 'BAJA')
  .range(offset, offset + BATCH_SIZE - 1);
```

**Importante**: 
- Usar LEFT JOIN para incluir muebles sin resguardo
- Filtrar por `origen` para obtener solo el resguardo correspondiente
- Si hay múltiples resguardos, Supabase devolverá un array

### 2. Manejo de Múltiples Resguardos

Si un mueble tiene múltiples resguardos activos, debemos tomar el más reciente:

```typescript
.select(`
  *,
  area:id_area(id_area, nombre),
  directorio:id_directorio(id_directorio, nombre, puesto),
  resguardo:resguardos!id_mueble(resguardante, f_resguardo)
`)
.eq('resguardos.origen', ORIGEN)
.order('resguardos.f_resguardo', { ascending: false })
.limit(1, { foreignTable: 'resguardos' })
```

### 3. Transformación de Datos

Después de obtener los datos, transformar el campo `resguardo`:

```typescript
const transformedData = data.map(item => ({
  ...item,
  resguardante: item.resguardo?.[0]?.resguardante || null
}));
```

O si Supabase devuelve un objeto único:

```typescript
const transformedData = data.map(item => ({
  ...item,
  resguardante: item.resguardo?.resguardante || null
}));
```

## Implementación por Módulo

### INEA General

**Archivo**: `src/hooks/indexation/useIneaIndexation.ts`

**Cambios**:

1. Modificar query en `indexData()`:
```typescript
const { data, error } = await supabase
  .from('muebles')
  .select(`
    *,
    area:id_area(id_area, nombre),
    directorio:id_directorio(id_directorio, nombre, puesto),
    resguardo:resguardos!id_mueble(resguardante, f_resguardo)
  `)
  .eq('resguardos.origen', 'INEA')
  .neq('estatus', 'BAJA')
  .order('resguardos.f_resguardo', { ascending: false, foreignTable: 'resguardos' })
  .range(offset, offset + BATCH_SIZE - 1);
```

2. Transformar datos:
```typescript
const transformedBatch = batch.map(item => ({
  ...item,
  resguardante: Array.isArray(item.resguardo) 
    ? item.resguardo[0]?.resguardante || null 
    : item.resguardo?.resguardante || null
}));
```

3. Actualizar realtime para escuchar cambios en `resguardos`:
```typescript
.on('postgres_changes', 
  { event: '*', schema: 'public', table: 'resguardos', filter: 'origen=eq.INEA' },
  async (payload) => {
    // Refetch el mueble afectado con su nuevo resguardante
    const { id_mueble } = payload.new || payload.old;
    // ... actualizar store
  }
)
```

### INEA Obsoletos

**Archivo**: `src/hooks/indexation/useIneaObsoletosIndexation.ts`

**Cambios**: Idénticos a INEA General, pero con filtro adicional:
```typescript
.eq('estatus', 'BAJA')
```

### ITEA General

**Archivo**: `src/hooks/indexation/useIteaIndexation.ts`

**Cambios**:

1. Modificar query:
```typescript
const { data, error } = await supabase
  .from('mueblesitea')
  .select(`
    *,
    area:area(id_area, nombre),
    directorio:directorio(id_directorio, nombre, puesto),
    resguardo:resguardos!id_mueble(resguardante, f_resguardo)
  `)
  .eq('resguardos.origen', 'ITEA')
  .neq('estatus', 'BAJA')
  .order('resguardos.f_resguardo', { ascending: false, foreignTable: 'resguardos' })
  .range(offset, offset + BATCH_SIZE - 1);
```

2. Transformar y agregar colores:
```typescript
const transformedBatch = batch.map(item => ({
  ...item,
  resguardante: Array.isArray(item.resguardo) 
    ? item.resguardo[0]?.resguardante || null 
    : item.resguardo?.resguardante || null,
  colores: item.color ? colorsMap[item.color] || null : null
}));
```

### ITEA Obsoletos

**Archivo**: `src/hooks/indexation/useIteaObsoletosIndexation.ts`

**Cambios**: Idénticos a ITEA General con filtro `.eq('estatus', 'BAJA')`

### NO-LISTADO

**Archivo**: `src/hooks/indexation/useNoListadoIndexation.ts`

**Cambios**:

1. Modificar query:
```typescript
const { data, error } = await supabase
  .from('mueblestlaxcala')
  .select(`
    *,
    area:area(id_area, nombre),
    directorio:directorio(id_directorio, nombre, puesto),
    resguardo:resguardos!id_mueble(resguardante, f_resguardo)
  `)
  .eq('resguardos.origen', 'NO_LISTADO')
  .neq('estatus', 'BAJA')
  .order('resguardos.f_resguardo', { ascending: false, foreignTable: 'resguardos' })
  .range(offset, offset + BATCH_SIZE - 1);
```

2. Transformar datos igual que los demás módulos

## Realtime Updates

### Escuchar Cambios en Resguardos

Cada módulo debe agregar un listener adicional para la tabla `resguardos`:

```typescript
.on('postgres_changes',
  { 
    event: '*', 
    schema: 'public', 
    table: 'resguardos',
    filter: `origen=eq.${ORIGEN}` // INEA, ITEA, o NO_LISTADO
  },
  async (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    updateLastEventReceived(MODULE_KEY);
    
    try {
      const affectedMuebleId = newRecord?.id_mueble || oldRecord?.id_mueble;
      
      if (!affectedMuebleId) return;
      
      // Refetch el mueble completo con su nuevo resguardante
      const { data: updatedMueble, error } = await supabase
        .from(TABLE)
        .select(`
          *,
          area:id_area(id_area, nombre),
          directorio:id_directorio(id_directorio, nombre, puesto),
          resguardo:resguardos!id_mueble(resguardante, f_resguardo)
        `)
        .eq('id', affectedMuebleId)
        .eq('resguardos.origen', ORIGEN)
        .order('resguardos.f_resguardo', { ascending: false, foreignTable: 'resguardos' })
        .single();
      
      if (!error && updatedMueble) {
        const transformed = {
          ...updatedMueble,
          resguardante: Array.isArray(updatedMueble.resguardo)
            ? updatedMueble.resguardo[0]?.resguardante || null
            : updatedMueble.resguardo?.resguardante || null
        };
        
        updateMueble(transformed.id, transformed);
      }
    } catch (error) {
      console.error('Error handling resguardo change:', error);
    }
  }
)
```

## Actualización de Tipos

No se requieren cambios en los tipos TypeScript. Los tipos actuales ya definen:

```typescript
interface MuebleINEA {
  // ... otros campos
  resguardante: string | null;
}

interface MuebleITEA {
  // ... otros campos
  resguardante: string | null;
}

interface MuebleNoListado {
  // ... otros campos
  resguardante?: string | null;
}
```

Estos tipos siguen siendo válidos, solo cambia la fuente de donde proviene el dato.

## Manejo de Batch Updates

Cuando se actualizan áreas o directores, también debemos considerar actualizar resguardantes:

```typescript
const processBatchUpdates = useCallback(async (
  _ids: string[],
  type: 'area' | 'directorio' | 'resguardo',
  refId: number | string
) => {
  // ... código existente
  
  if (type === 'resguardo') {
    // Manejar actualización de resguardo específico
    const { data: affectedMuebles, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        area:id_area(id_area, nombre),
        directorio:id_directorio(id_directorio, nombre, puesto),
        resguardo:resguardos!id_mueble(resguardante, f_resguardo)
      `)
      .eq('id', refId) // refId es el id_mueble
      .eq('resguardos.origen', ORIGEN)
      .order('resguardos.f_resguardo', { ascending: false, foreignTable: 'resguardos' });
    
    // ... transformar y actualizar
  }
}, [/* deps */]);
```

## Validación y Testing

### Casos de Prueba

1. **Mueble sin resguardo**
   - Verificar que `resguardante` es `null`
   - UI muestra "Sin resguardante"

2. **Mueble con resguardo vacío**
   - Registro existe pero `resguardante` es `""` o `NULL`
   - Verificar que se trata como `null`

3. **Mueble con resguardante**
   - Verificar que se muestra el nombre correcto

4. **Múltiples resguardos**
   - Verificar que se toma el más reciente

5. **Cambio de resguardo en tiempo real**
   - Crear nuevo resguardo → actualiza UI
   - Modificar resguardante → actualiza UI
   - Eliminar resguardo → muestra "Sin resguardante"

6. **Búsqueda y filtros**
   - Buscar por resguardante funciona
   - Filtrar por resguardante funciona
   - Sugerencias de resguardante funcionan

## Rollback Plan

Si hay problemas:

1. Los campos de texto plano en las tablas de muebles siguen existiendo
2. Revertir queries a la versión anterior
3. El sistema vuelve a usar campos de texto plano

## Performance Considerations

1. **JOIN Performance**: El LEFT JOIN con `resguardos` puede ser costoso
   - Mitigación: Índices ya existen en `id_mueble` y `origen`
   
2. **Múltiples Resguardos**: Si un mueble tiene muchos resguardos históricos
   - Mitigación: Usar `.limit(1)` en el foreign table
   
3. **Realtime Load**: Escuchar cambios en `resguardos` además de muebles
   - Mitigación: Filtrar por `origen` para reducir eventos

## Documentación

Actualizar documentación en:
- `docs/MIGRACION_CAMPOS_RELACIONALES.md`
- Comentarios en código de indexación
- README si es necesario

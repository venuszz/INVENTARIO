# Fix: Filtrado Correcto de Registros Obsoletos vs Normales

## Problema Identificado

Los componentes de "Obsoletos" (INEA y ITEA) estaban mostrando exactamente los mismos registros que los componentes normales. Esto se debía a que los filtros en los hooks de indexación estaban usando una sintaxis incorrecta de Supabase que no funciona para filtrar por campos de tablas relacionadas.

### Sintaxis Incorrecta (No Funciona)
```typescript
// ❌ INCORRECTO - No se puede filtrar directamente por campos de JOIN
.eq('config_estatus.concepto', 'BAJA')
.neq('config_estatus.concepto', 'BAJA')
```

Esta sintaxis NO funciona en Supabase porque `config_estatus` es una tabla relacionada (JOIN), y Supabase no permite filtrar directamente por campos de tablas relacionadas en la cláusula WHERE.

### Sintaxis Correcta (Funciona)
```typescript
// ✅ CORRECTO - Filtrar por el campo de clave foránea directamente
.eq('id_estatus', bajaStatusId)
.neq('id_estatus', bajaStatusId)
```

## Solución Implementada

### 1. Obtener el ID del Estatus BAJA

Antes de hacer cualquier consulta, primero obtenemos el ID del estatus BAJA desde la tabla config:

```typescript
// Get BAJA status ID from config table
const { data: bajaStatus, error: bajaError } = await supabase
  .from('config')
  .select('id')
  .eq('tipo', 'estatus')
  .eq('concepto', 'BAJA')
  .single();

if (bajaError || !bajaStatus) {
  throw new Error('No se pudo obtener el estatus BAJA');
}
```

### 2. Usar el ID en las Consultas

#### Para Componentes Obsoletos (INCLUIR solo BAJA)
```typescript
const { data, error } = await supabase
  .from('muebles')
  .select(`
    *,
    area:id_area(id_area, nombre),
    directorio:id_directorio(id_directorio, nombre, puesto),
    config_estatus:config!id_estatus(id, concepto)
  `)
  .eq('id_estatus', bajaStatus.id)  // ✅ Solo registros con estatus BAJA
  .range(offset, offset + BATCH_SIZE - 1);
```

#### Para Componentes Normales (EXCLUIR BAJA)
```typescript
const { data, error } = await supabase
  .from('muebles')
  .select(`
    *,
    area:id_area(id_area, nombre),
    directorio:id_directorio(id_directorio, nombre, puesto),
    config_estatus:config!id_estatus(id, concepto)
  `)
  .neq('id_estatus', bajaStatus.id)  // ✅ Excluir registros con estatus BAJA
  .range(offset, offset + BATCH_SIZE - 1);
```

## Archivos Modificados

### Hooks de Indexación de Obsoletos (INCLUIR BAJA)
1. `src/hooks/indexation/useIneaObsoletosIndexation.ts`
   - Función `indexData()`: Agregado lookup de bajaStatus.id
   - Cambiado `.eq('config_estatus.concepto', 'BAJA')` a `.eq('id_estatus', bajaStatus.id)`
   - Función `processBatchUpdates()`: Agregado lookup de bajaStatus.id
   - Cambiado filtro en batch updates

2. `src/hooks/indexation/useIteaObsoletosIndexation.ts`
   - Función `indexData()`: Agregado lookup de bajaStatus.id
   - Cambiado `.eq('config_estatus.concepto', 'BAJA')` a `.eq('id_estatus', bajaStatus.id)`

### Hooks de Indexación Normales (EXCLUIR BAJA)
3. `src/hooks/indexation/useIneaIndexation.ts`
   - Función `indexData()`: Agregado lookup de bajaStatus.id
   - Cambiado `.neq('config_estatus.concepto', 'BAJA')` a `.neq('id_estatus', bajaStatus.id)`
   - Función `processBatchUpdates()`: Agregado lookup de bajaStatus.id
   - Cambiado filtro en batch updates

4. `src/hooks/indexation/useIteaIndexation.ts`
   - Función `indexData()`: Agregado lookup de bajaStatus.id
   - Cambiado `.neq('config_estatus.concepto', 'BAJA')` a `.neq('id_estatus', bajaStatus.id)`
   - Función `processBatchUpdates()`: Agregado lookup de bajaStatus.id
   - Cambiado filtro en batch updates

5. `src/hooks/indexation/useNoListadoIndexation.ts`
   - Función `indexData()`: Agregado lookup de bajaStatus.id
   - Cambiado `.neq('config_estatus.concepto', 'BAJA')` a `.neq('id_estatus', bajaStatus.id)`
   - Función `processBatchUpdates()`: Agregado lookup de bajaStatus.id
   - Cambiado filtro en batch updates

## Resultado Esperado

Después de estos cambios:

1. **Componentes Obsoletos** (INEA y ITEA):
   - Solo mostrarán registros con `id_estatus` = ID del concepto "BAJA"
   - No mostrarán registros con otros estatus

2. **Componentes Normales** (INEA, ITEA, No Listado):
   - Mostrarán todos los registros EXCEPTO los que tienen estatus "BAJA"
   - Los registros obsoletos no aparecerán en estos componentes

3. **Sin Duplicados**:
   - Cada registro aparecerá solo en un componente (obsoletos O normal)
   - No habrá solapamiento entre componentes

## Verificación

Para verificar que funciona correctamente:

1. Abrir el componente "Inventario INEA - General"
   - Verificar que NO aparezcan registros con estatus "BAJA"

2. Abrir el componente "Inventario INEA - Bajas"
   - Verificar que SOLO aparezcan registros con estatus "BAJA"

3. Abrir el componente "Inventario ITEJPA - General"
   - Verificar que NO aparezcan registros con estatus "BAJA"

4. Abrir el componente "Inventario ITEJPA - Bajas"
   - Verificar que SOLO aparezcan registros con estatus "BAJA"

5. Verificar que los contadores de registros sean diferentes entre componentes normales y obsoletos

## Notas Técnicas

- El lookup del `bajaStatus.id` se hace una sola vez al inicio de la indexación
- El ID se reutiliza en todas las consultas batch subsecuentes
- Si no se puede obtener el ID del estatus BAJA, la indexación falla con un error claro
- El filtro por `id_estatus` es mucho más eficiente que intentar filtrar por campos de JOIN

## Fecha
Febrero 26, 2026

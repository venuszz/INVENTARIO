# Limpieza de Campo Estatus Legacy

## Overview
Eliminación completa de referencias al campo `estatus` de texto plano en favor del campo relacional `config_estatus` en todas las tablas (mueblesitea, mueblesinea, muebles_no_listado) y sus componentes relacionados.

## Cambios Realizados

### 1. Hooks de Indexación

Actualizados todos los hooks de indexación para usar `config_estatus?.concepto` en lugar de `estatus`:

#### INEA (`src/hooks/indexation/useIneaIndexation.ts`)
- ✅ Comparación INSERT: `insertedData.config_estatus?.concepto !== 'BAJA'`
- ✅ Comparación UPDATE: `updatedData.config_estatus?.concepto === 'BAJA'`
- ✅ Comparación realtime sync: `updatedMueble.config_estatus?.concepto !== 'BAJA'`

#### ITEA (`src/hooks/indexation/useIteaIndexation.ts`)
- ✅ Comparación INSERT: `data.config_estatus?.concepto !== 'BAJA'`
- ✅ Comparación UPDATE: `dataWithColorAndResguardante.config_estatus?.concepto === 'BAJA'`
- ✅ Comparación realtime sync: `updatedMueble.config_estatus?.concepto !== 'BAJA'`

#### No Listado / TLAXCALA (`src/hooks/indexation/useNoListadoIndexation.ts`)
- ✅ Comparación INSERT: `data.config_estatus?.concepto !== 'BAJA'`
- ✅ Comparación UPDATE: `transformed.config_estatus?.concepto === 'BAJA'`
- ✅ Comparación realtime sync: `updatedMueble.config_estatus?.concepto !== 'BAJA'`

#### INEA Obsoletos (`src/hooks/indexation/useIneaObsoletosIndexation.ts`)
- ✅ Comparación INSERT: `insertedData.config_estatus?.concepto === 'BAJA'`
- ✅ Comparación UPDATE: `transformed.config_estatus?.concepto === 'BAJA'`
- ✅ Comparación realtime sync: `updatedMueble.config_estatus?.concepto === 'BAJA'`

#### ITEA Obsoletos (`src/hooks/indexation/useIteaObsoletosIndexation.ts`)
- ✅ Comparación INSERT: `data.config_estatus?.concepto === 'BAJA'`
- ✅ Comparación UPDATE: `transformed.config_estatus?.concepto === 'BAJA'`
- ✅ Comparación realtime sync: `updatedMueble.config_estatus?.concepto === 'BAJA'`

### 2. Dashboard (`src/components/dashboard/dashboard.tsx`)

#### Actualización de Tipos
```typescript
// Antes
data: Array<{ estatus?: string | null; rubro?: string | null; valor?: string | number | null }>

// Después
data: Array<{ 
  estatus?: string | null; 
  rubro?: string | null; 
  valor?: string | number | null; 
  config_estatus?: { id: number; concepto: string } | null 
}>
```

#### Procesamiento de Categorías
- ✅ INEA categories: `item.config_estatus?.concepto || item.estatus`
- ✅ ITEA categories: `item.config_estatus?.concepto || item.estatus`

#### Filtrado de Datos
- ✅ Filtro por estatus: `estatusValue = item.config_estatus?.concepto || item.estatus`
- ✅ Filtro BAJA: `estatusValue === 'BAJA'`
- ✅ Filtro sin estatus: `!estatusValue || estatusValue === ''`
- ✅ Filtro rubros (excluir BAJA): `estatusValue !== 'BAJA'`

### 3. Levantamiento (`src/components/consultas/levantamiento/`)

#### Tipos (`types.ts`)
```typescript
export interface LevMueble {
  // ... otros campos
  estatus: string | null;
  id_estatus: number | null;
  config_estatus: { id: number; concepto: string } | null;
  // ... otros campos
}
```

#### Componente Principal (`index.tsx`)
- ✅ Filtro omitEmptyStatus: `config_estatus?.concepto || estatus`
- ✅ Contador sin estatus: `config_estatus?.concepto || estatus`

#### PDF Generator (`PDFLevantamientoPerArea.tsx`)
- ✅ Filtro omitEmptyStatus con type assertion para `Record<string, unknown>[]`

### 4. Búsqueda (`src/components/search/`)

Ya actualizado en migración anterior:
- ✅ UniversalSearchBar usa `config_estatus?.concepto || estatus`
- ✅ SearchResultItem muestra estatus relacional
- ✅ Prioridad de resultados por estatus

### 5. Otros Componentes

#### Resguardos Crear (`src/components/resguardos/crear/hooks/useInventoryData.ts`)
- ✅ Filtro ITEA ACTIVO: `config_estatus?.concepto || estatus === 'ACTIVO'`
- ✅ Contador ITEA ACTIVO: usa campo relacional

#### Inventario Registro (`src/components/inventario/registro/steps/Step1BasicInfo.tsx`)
- ✅ Validación de ID muestra estatus: `config_estatus?.concepto || estatus`
- ✅ Comparación ACTIVO: usa campo relacional
- ✅ Badge de estatus: muestra valor relacional

#### Levantamiento Tabla (`src/components/consultas/levantamiento/components/InventoryTable.tsx`)
- ✅ Badge de estatus: `config_estatus?.concepto || estatus`
- ✅ Comparaciones de color: usa campo relacional

Los siguientes componentes ya estaban usando el patrón correcto:
- ✅ `src/components/consultas/no-listado/` - Usa `config_estatus?.concepto || estatus`
- ✅ `src/components/consultas/itea/` - Usa `config_estatus?.concepto || estatus`
- ✅ `src/components/consultas/inea/` - Usa `config_estatus?.concepto || estatus`
- ✅ `src/components/consultas/itea/obsoletos/` - Usa `config_estatus?.concepto || estatus`
- ✅ `src/components/consultas/inea/obsoletos/` - Usa `config_estatus?.concepto || estatus`
- ✅ `src/components/resguardos/crear/` - Usa `config_estatus?.concepto || estatus`
- ✅ `src/components/reportes/` - Usa `id_estatus` para filtrado
- ✅ `src/components/inventario/registro/` - Usa `id_estatus` para guardar

## Patrón de Migración

### Para Display (Lectura)
```typescript
const estatusValue = item.config_estatus?.concepto || item.estatus;
```

### Para Comparaciones
```typescript
// Comparar con BAJA
if (item.config_estatus?.concepto === 'BAJA') { }

// Comparar diferente de BAJA
if (item.config_estatus?.concepto !== 'BAJA') { }

// Verificar vacío
const estatusValue = item.config_estatus?.concepto || item.estatus;
if (!estatusValue || estatusValue === '') { }
```

### Para Guardar (Escritura)
```typescript
// Usar id_estatus con lookup desde estatusMap
const estatusId = estatusMap[selectedEstatus];
await supabase.update({ id_estatus: estatusId });
```

## Backward Compatibility

Todos los cambios mantienen compatibilidad con el campo legacy `estatus`:
- Fallback pattern: `config_estatus?.concepto || estatus`
- Funciona con datos antiguos que solo tienen `estatus`
- Funciona con datos nuevos que tienen `config_estatus`
- No hay breaking changes

## Testing Checklist

- [x] Build completa exitosamente
- [x] TypeScript diagnostics pasan
- [x] Hooks de indexación usan campo relacional
- [x] Dashboard procesa estatus correctamente
- [x] Levantamiento filtra por estatus relacional
- [x] Búsqueda prioriza resultados por estatus
- [x] Comparaciones con 'BAJA' usan campo relacional
- [x] Filtros de estatus vacío funcionan correctamente

## Archivos Modificados

### Hooks de Indexación
- `src/hooks/indexation/useIneaIndexation.ts`
- `src/hooks/indexation/useIteaIndexation.ts`
- `src/hooks/indexation/useNoListadoIndexation.ts`
- `src/hooks/indexation/useIneaObsoletosIndexation.ts`
- `src/hooks/indexation/useIteaObsoletosIndexation.ts`

### Componentes
- `src/components/dashboard/dashboard.tsx`
- `src/components/consultas/levantamiento/index.tsx`
- `src/components/consultas/levantamiento/types.ts`
- `src/components/consultas/levantamiento/components/InventoryTable.tsx`
- `src/components/consultas/PDFLevantamientoPerArea.tsx`
- `src/components/resguardos/crear/hooks/useInventoryData.ts`
- `src/components/inventario/registro/steps/Step1BasicInfo.tsx`

### Búsqueda (ya migrado)
- `src/components/search/UniversalSearchBar.tsx`
- `src/components/search/SearchResultItem.tsx`
- `src/components/search/types.ts`

## Beneficios

1. **Consistencia**: Todos los componentes usan el mismo patrón para acceder a estatus
2. **Normalización**: Valores de estatus centralizados en tabla `config`
3. **Mantenibilidad**: Cambios en estatus se reflejan automáticamente en toda la app
4. **Performance**: Menos duplicación de datos, queries más eficientes
5. **Integridad**: Relaciones FK garantizan valores válidos
6. **Realtime Sync**: Cambios en config se propagan automáticamente

## Próximos Pasos

1. ✅ Migración completa del campo estatus
2. ✅ Todos los componentes actualizados
3. ✅ Build exitoso sin errores
4. 🔄 Monitorear en producción
5. 🔄 Considerar deprecar campo `estatus` legacy en futuro

## Notas Importantes

- El campo `estatus` de texto plano se mantiene por compatibilidad pero ya no se usa directamente
- Todos los accesos deben usar `config_estatus?.concepto || estatus` para display
- Todas las escrituras deben usar `id_estatus` con lookup desde `config` table
- Las comparaciones con valores específicos (como 'BAJA') deben usar el campo relacional

# Migración: Eliminación de columna puesto_resguardo

## Resumen
Se eliminó la columna `puesto_resguardo` de la tabla `resguardos` ya que el puesto se puede obtener directamente de la tabla `directorio` mediante la relación `id_directorio`.

## Cambios en Base de Datos

### SQL Migration Script
Ubicación: `docs/RESGUARDOS_REMOVE_PUESTO_COLUMN.sql`

```sql
-- 1. Eliminar el índice asociado
DROP INDEX IF EXISTS idx_resguardos_puesto;

-- 2. Eliminar la columna
ALTER TABLE public.resguardos 
DROP COLUMN IF EXISTS puesto_resguardo;
```

### Estructura Final de la Tabla
```sql
CREATE TABLE public.resguardos (
  id serial NOT NULL,
  folio text NOT NULL,
  f_resguardo date NOT NULL,
  id_directorio integer NOT NULL,
  id_mueble uuid NOT NULL,
  origen text NOT NULL,
  resguardante text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  id_area integer NOT NULL,
  CONSTRAINT resguardos_pkey PRIMARY KEY (id),
  CONSTRAINT fk_resguardos_area FOREIGN KEY (id_area) REFERENCES area(id_area) ON DELETE RESTRICT,
  CONSTRAINT resguardos_created_by_fk FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE RESTRICT,
  CONSTRAINT resguardos_directorio_fk FOREIGN KEY (id_directorio) REFERENCES directorio (id_directorio) ON DELETE RESTRICT,
  CONSTRAINT resguardos_origen_check CHECK ((origen = ANY (ARRAY['INEA'::text, 'ITEA'::text, 'NO_LISTADO'::text])))
);
```

## Cambios en el Código

### 1. Tipos TypeScript
**Archivo:** `src/types/indexation.ts`

```typescript
export interface Resguardo {
  id: string;
  folio: string;
  f_resguardo: string;
  id_directorio: number;
  id_mueble: string;
  origen: string;
  resguardante: string;
  created_by: string;
  created_at?: string;
  id_area: number;
  // Relational fields
  director_nombre?: string;
  director_puesto?: string; // NUEVO: Obtenido del JOIN con directorio
  area_nombre?: string;
  created_by_nombre?: string;
}
```

### 2. Hook de Guardado
**Archivo:** `src/components/resguardos/crear/hooks/useResguardoSubmit.ts`

**Cambio:** Eliminado el campo `puesto_resguardo` del payload de inserción.

```typescript
// ANTES
return {
  folio: actualFolio,
  f_resguardo: new Date(...).toISOString(),
  id_directorio: parseInt(formData.directorId),
  id_mueble: mueble.id,
  origen: origenMapped,
  puesto_resguardo: formData.puesto.trim().toUpperCase(), // ❌ ELIMINADO
  resguardante: resguardanteToUse,
  id_area: validation.id_area,
};

// DESPUÉS
return {
  folio: actualFolio,
  f_resguardo: new Date(...).toISOString(),
  id_directorio: parseInt(formData.directorId),
  id_mueble: mueble.id,
  origen: origenMapped,
  resguardante: resguardanteToUse,
  id_area: validation.id_area,
};
```

### 3. API Route
**Archivo:** `src/app/api/resguardos/create/route.ts`

**Cambios:**
1. Eliminada validación de `puesto_resguardo`
2. Agregado `puesto` en el SELECT del JOIN con directorio
3. Agregado `director_puesto` en el mapeo de datos

```typescript
// SELECT con puesto del directorio
.select(`
  *,
  directorio!inner (
    nombre,
    puesto  // ✅ AGREGADO
  ),
  area!inner (
    nombre
  )
`)

// Mapeo de datos
const mappedData = (data || []).map((record: any) => {
  const { directorio, area, ...rest } = record;
  return {
    ...rest,
    director_nombre: directorio?.nombre || '',
    director_puesto: directorio?.puesto || '', // ✅ AGREGADO
    area_nombre: area?.nombre || ''
  };
});
```

### 4. Hook de Generación de PDF
**Archivo:** `src/components/resguardos/consultar/hooks/usePDFGeneration.ts`

**Cambios:**
1. Eliminado `puesto_resguardo` del SELECT
2. Agregado `puesto` en el JOIN con directorio
3. Modificado para obtener el puesto del directorio

```typescript
// ANTES
puesto: firstItem.puesto_resguardo || (firstItem.directorio as any)?.puesto || '',

// DESPUÉS
puesto: (firstItem.directorio as any)?.puesto || '',
```

### 5. Hook de Indexación
**Archivo:** `src/hooks/indexation/useResguardosIndexation.ts`

**Cambios:**
1. Agregado `puesto` en todos los SELECT con JOIN a directorio
2. Agregado `director_puesto` en el mapeo de datos

```typescript
.select(`
  *,
  directorio:id_directorio (
    nombre,
    puesto  // ✅ AGREGADO
  ),
  area:id_area (
    nombre
  )
`)

// Mapeo
const resguardoWithRelations = {
  ...rest,
  director_nombre: directorio?.nombre || '',
  director_puesto: directorio?.puesto || '', // ✅ AGREGADO
  area_nombre: area?.nombre || '',
  created_by_nombre: ''
};
```

### 6. Hooks de Datos de Resguardo
**Archivos:**
- `src/components/consultas/inea/hooks/useResguardoData.ts`
- `src/components/consultas/itea/hooks/useResguardoData.ts`
- `src/components/consultas/no-listado/hooks/useResguardoData.ts`

**Cambio:** Obtener puesto del campo relacional `director_puesto`

```typescript
// ANTES
puesto: r.puesto_resguardo || '',

// DESPUÉS
puesto: r.director_puesto || '',
```

## Beneficios de la Migración

1. **Normalización de Datos:** El puesto se mantiene en una sola tabla (directorio)
2. **Consistencia:** Cambios en el puesto del director se reflejan automáticamente en todos los resguardos
3. **Reducción de Redundancia:** No se duplica información del puesto
4. **Mantenimiento Simplificado:** Un solo lugar para actualizar puestos

## Cómo Obtener el Puesto

### En Consultas SQL
```sql
SELECT 
  r.*,
  d.puesto as director_puesto
FROM resguardos r
JOIN directorio d ON r.id_directorio = d.id_directorio;
```

### En el Código
```typescript
// El puesto está disponible en el campo relacional
const puesto = resguardo.director_puesto;
```

## Notas Importantes

1. **Migración de Datos:** No se requiere migración de datos existentes ya que el puesto siempre se puede obtener del directorio
2. **Compatibilidad:** Todos los componentes que usaban `puesto_resguardo` ahora usan `director_puesto`
3. **PDF:** La generación de PDF obtiene el puesto directamente del directorio mediante el JOIN

## Testing

Después de ejecutar la migración SQL, verificar:

1. ✅ Crear un nuevo resguardo
2. ✅ Generar PDF de resguardo (debe mostrar el puesto correcto)
3. ✅ Consultar resguardos existentes
4. ✅ Verificar que el puesto se muestra correctamente en todas las vistas


## Cambios Adicionales en Consultar Resguardos

### 7. Hook de Detalles de Resguardo
**Archivo:** `src/components/resguardos/consultar/hooks/useResguardoDetails.ts`

**Cambio:** Agregado el campo `puesto` al objeto `ResguardoDetalle` obtenido del campo relacional `director_puesto`

```typescript
// Crear objeto de detalles con puesto del director
const details: ResguardoDetalle = {
  folio: firstItem.folio,
  fecha: firstItem.f_resguardo,
  director: firstItem.director_nombre || '',
  area_nombre: firstItem.area_nombre || '',
  puesto: firstItem.director_puesto || '' // ✅ AGREGADO
};
```

### 8. Tipos de Consultar Resguardos
**Archivo:** `src/components/resguardos/consultar/types.ts`

**Cambio:** Agregado campo opcional `puesto` al interface `ResguardoDetalle`

```typescript
export interface ResguardoDetalle {
  folio: string;
  fecha: string;
  director: string;
  area_nombre?: string;
  puesto?: string; // ✅ AGREGADO: Puesto from director (JOIN with directorio table)
}
```

### 9. Componente Principal de Consultar
**Archivo:** `src/components/resguardos/consultar/index.tsx`

**Cambios:** Modificadas las funciones de eliminación para usar el puesto del `resguardoDetails`

```typescript
// ANTES
await resguardoDelete.deleteAll(
  resguardoDetails.articulos,
  resguardoDetails.resguardoDetails.folio,
  resguardoDetails.resguardoDetails.fecha,
  resguardoDetails.resguardoDetails.director,
  resguardoDetails.resguardoDetails.area_nombre || '',
  '', // ❌ String vacío
  firstArticulo.resguardante || ''
);

// DESPUÉS
await resguardoDelete.deleteAll(
  resguardoDetails.articulos,
  resguardoDetails.resguardoDetails.folio,
  resguardoDetails.resguardoDetails.fecha,
  resguardoDetails.resguardoDetails.director,
  resguardoDetails.resguardoDetails.area_nombre || '',
  resguardoDetails.resguardoDetails.puesto || '', // ✅ Puesto del director
  firstArticulo.resguardante || ''
);
```

**Funciones modificadas:**
- `handleDeleteAll`
- `handleDeleteItem`
- `handleDeleteSelected`

## Flujo de Datos del Puesto

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Base de Datos (Supabase)                                │
│    - Tabla: directorio                                      │
│    - Campo: puesto                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Hook de Indexación (useResguardosIndexation)            │
│    - SELECT con JOIN a directorio                           │
│    - Mapeo: director_puesto = directorio.puesto            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Store (resguardosStore)                                  │
│    - Resguardo.director_puesto                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Hook de Detalles (useResguardoDetails)                  │
│    - ResguardoDetalle.puesto = firstItem.director_puesto   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Componente (ConsultarResguardos)                        │
│    - Usa resguardoDetails.puesto en operaciones             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Generación de PDF                                        │
│    - PdfData.puesto = resguardoDetails.puesto              │
└─────────────────────────────────────────────────────────────┘
```

## Verificación Post-Migración

Después de ejecutar la migración SQL y reiniciar la aplicación, verificar:

### En Crear Resguardo:
1. ✅ Crear un nuevo resguardo sin errores
2. ✅ Verificar que no se envía el campo `puesto_resguardo` en el payload
3. ✅ Generar PDF y verificar que muestra el puesto correcto

### En Consultar Resguardo:
1. ✅ Seleccionar un resguardo existente
2. ✅ Verificar que se muestra el puesto del director
3. ✅ Generar PDF del resguardo (debe mostrar el puesto)
4. ✅ Eliminar artículos y generar PDF de baja (debe mostrar el puesto)

### En Base de Datos:
1. ✅ Verificar que la columna `puesto_resguardo` fue eliminada
2. ✅ Verificar que el índice `idx_resguardos_puesto` fue eliminado
3. ✅ Consultar resguardos con JOIN a directorio para obtener el puesto

```sql
-- Query de verificación
SELECT 
  r.id,
  r.folio,
  r.f_resguardo,
  d.nombre as director_nombre,
  d.puesto as director_puesto,
  a.nombre as area_nombre
FROM resguardos r
JOIN directorio d ON r.id_directorio = d.id_directorio
JOIN area a ON r.id_area = a.id_area
LIMIT 10;
```

## Conclusión

La migración elimina la redundancia del campo `puesto_resguardo` y centraliza la información del puesto en la tabla `directorio`. Esto garantiza:

- ✅ Consistencia de datos
- ✅ Facilidad de mantenimiento
- ✅ Actualización automática cuando cambia el puesto de un director
- ✅ Normalización de la base de datos

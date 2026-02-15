# Resguardos - Agregar Campo id_area - Diseño Técnico

## Resumen

Este documento detalla el diseño técnico para agregar el campo `id_area` a la tabla `resguardos`, incluyendo validaciones, migraciones de base de datos, y actualizaciones en el código frontend.

## 1. Cambios en Base de Datos

### 1.1 Migración SQL

```sql
-- Agregar columna id_area a tabla resguardos
ALTER TABLE resguardos 
ADD COLUMN id_area INTEGER;

-- Agregar foreign key constraint
ALTER TABLE resguardos
ADD CONSTRAINT fk_resguardos_area
FOREIGN KEY (id_area) REFERENCES area(id_area)
ON DELETE RESTRICT;

-- Agregar índice para optimizar consultas
CREATE INDEX idx_resguardos_id_area ON resguardos(id_area);

-- Poblar datos existentes (obtener id_area del primer mueble de cada resguardo)
UPDATE resguardos r
SET id_area = (
  SELECT COALESCE(
    m_inea.id_area,
    m_itea.id_area,
    m_tlax.id_area
  )
  FROM (VALUES (1)) AS dummy(x)
  LEFT JOIN muebles m_inea ON r.id_mueble = m_inea.id AND r.origen = 'INEA'
  LEFT JOIN mueblesitea m_itea ON r.id_mueble = m_itea.id AND r.origen = 'ITEA'
  LEFT JOIN mueblestlaxcala m_tlax ON r.id_mueble = m_tlax.id AND r.origen = 'NO_LISTADO'
  LIMIT 1
)
WHERE r.id_area IS NULL;

-- Hacer la columna NOT NULL después de poblar datos
ALTER TABLE resguardos
ALTER COLUMN id_area SET NOT NULL;
```

### 1.2 Trigger de Validación (Opcional)

```sql
-- Trigger para validar que el id_area del mueble coincida con el del resguardo
CREATE OR REPLACE FUNCTION validate_resguardo_area()
RETURNS TRIGGER AS $$
DECLARE
  mueble_area INTEGER;
BEGIN
  -- Obtener id_area del mueble según origen
  IF NEW.origen = 'INEA' THEN
    SELECT id_area INTO mueble_area FROM muebles WHERE id = NEW.id_mueble;
  ELSIF NEW.origen = 'ITEA' THEN
    SELECT id_area INTO mueble_area FROM mueblesitea WHERE id = NEW.id_mueble;
  ELSIF NEW.origen = 'NO_LISTADO' THEN
    SELECT id_area INTO mueble_area FROM mueblestlaxcala WHERE id = NEW.id_mueble;
  END IF;
  
  -- Validar que coincidan
  IF mueble_area IS NULL OR mueble_area != NEW.id_area THEN
    RAISE EXCEPTION 'El id_area del mueble (%) no coincide con el del resguardo (%)', 
      mueble_area, NEW.id_area;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_resguardo_area
BEFORE INSERT OR UPDATE ON resguardos
FOR EACH ROW
EXECUTE FUNCTION validate_resguardo_area();
```

## 2. Cambios en TypeScript Types

### 2.1 Actualizar `src/types/indexation.ts`

```typescript
export interface Resguardo {
  id: string;
  folio: string;
  f_resguardo: string;
  id_directorio: number;
  id_mueble: string;
  origen: string;
  puesto_resguardo: string;
  resguardante: string;
  created_by: string;
  created_at?: string;
  id_area: number; // NUEVO CAMPO
  // Relational fields
  director_nombre?: string;
  area_nombre?: string; // Populated from JOIN
  created_by_nombre?: string;
  [key: string]: unknown;
}
```

### 2.2 Actualizar tipos en `src/components/resguardos/crear/types.ts`

Agregar `id_area` al payload de creación si existe un tipo específico para eso.

## 3. Validación Pre-Guardado (Frontend)

### 3.1 Crear función de validación en `src/components/resguardos/crear/utils.ts`

```typescript
/**
 * Valida que todos los muebles seleccionados tengan el mismo id_area e id_directorio
 * @param muebles - Array de muebles seleccionados
 * @returns { valid: boolean, error?: string, id_area?: number, id_directorio?: number }
 */
export function validateResguardoConsistency(muebles: Mueble[]): {
  valid: boolean;
  error?: string;
  id_area?: number;
  id_directorio?: number;
} {
  if (muebles.length === 0) {
    return { valid: false, error: 'No hay muebles seleccionados' };
  }

  // Obtener id_area e id_directorio del primer mueble
  const firstMueble = muebles[0];
  const firstArea = firstMueble.area;
  const firstDirectorio = firstMueble.directorio;

  if (!firstArea || typeof firstArea !== 'object' || !firstArea.id_area) {
    return { valid: false, error: 'El primer mueble no tiene área asignada' };
  }

  if (!firstDirectorio || typeof firstDirectorio !== 'object' || !firstDirectorio.id_directorio) {
    return { valid: false, error: 'El primer mueble no tiene director asignado' };
  }

  const expectedAreaId = firstArea.id_area;
  const expectedDirectorId = firstDirectorio.id_directorio;

  // Validar que todos los muebles tengan el mismo id_area e id_directorio
  for (let i = 1; i < muebles.length; i++) {
    const mueble = muebles[i];
    const area = mueble.area;
    const directorio = mueble.directorio;

    if (!area || typeof area !== 'object' || area.id_area !== expectedAreaId) {
      return {
        valid: false,
        error: `El mueble ${mueble.id_inv} tiene un área diferente. Todos los muebles deben pertenecer a la misma área.`
      };
    }

    if (!directorio || typeof directorio !== 'object' || directorio.id_directorio !== expectedDirectorId) {
      return {
        valid: false,
        error: `El mueble ${mueble.id_inv} tiene un director diferente. Todos los muebles deben pertenecer al mismo director.`
      };
    }
  }

  return {
    valid: true,
    id_area: expectedAreaId,
    id_directorio: expectedDirectorId
  };
}
```

### 3.2 Modificar `useResguardoSubmit` hook

En `src/components/resguardos/crear/hooks/useResguardoSubmit.ts`:

```typescript
// Antes de preparar resguardosData, validar consistencia
const validation = validateResguardoConsistency(selectedMuebles);

if (!validation.valid) {
  setError(validation.error || 'Error de validación');
  return;
}

// Usar validation.id_area en el payload
const resguardosData = selectedMuebles.map((mueble, index) => {
  // ... código existente ...
  
  return {
    folio: actualFolio,
    f_resguardo: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString(),
    id_directorio: parseInt(formData.directorId),
    id_mueble: mueble.id,
    origen: origenMapped,
    puesto_resguardo: formData.puesto.trim().toUpperCase(),
    resguardante: resguardanteToUse,
    id_area: validation.id_area, // NUEVO CAMPO
  };
});
```

## 4. Cambios en API Route

### 4.1 Actualizar `src/app/api/resguardos/create/route.ts`

```typescript
// Validar que el payload incluya id_area
const resguardosData = body.resguardos.map((r: any) => {
  if (!r.id_area) {
    throw new Error('id_area is required');
  }
  
  return {
    folio: r.folio,
    f_resguardo: r.f_resguardo,
    id_directorio: r.id_directorio,
    id_mueble: r.id_mueble,
    origen: r.origen,
    puesto_resguardo: r.puesto_resguardo,
    resguardante: r.resguardante,
    id_area: r.id_area, // NUEVO CAMPO
    created_by: userId
  };
});

// El INSERT incluirá automáticamente id_area
const { data, error } = await supabase
  .from('resguardos')
  .insert(resguardosData)
  .select();
```

## 5. Cambios en Indexación

### 5.1 Actualizar `src/hooks/indexation/useResguardosIndexation.ts`

```typescript
// Modificar el query para incluir JOIN con tabla area
const { data, error } = await supabase
  .from(TABLE)
  .select(`
    *,
    directorio:id_directorio (
      nombre
    ),
    area:id_area (
      nombre
    )
  `)
  .range(offset, offset + BATCH_SIZE - 1);

// Mapear los datos para incluir area_nombre
return (data || []).map((record: any) => {
  const { directorio, area, ...rest } = record;
  return {
    ...rest,
    director_nombre: directorio?.nombre || '',
    area_nombre: area?.nombre || '', // NUEVO CAMPO
    created_by_nombre: ''
  };
}) as Resguardo[];
```

### 5.2 Actualizar eventos de realtime

```typescript
// En los handlers de INSERT y UPDATE
case 'INSERT': {
  await new Promise(resolve => setTimeout(resolve, 300));
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      directorio:id_directorio (
        nombre
      ),
      area:id_area (
        nombre
      )
    `)
    .eq('id', newRecord.id)
    .single();
    
  if (!error && data) {
    const { directorio, area, ...rest } = data as any;
    const resguardoWithRelations = {
      ...rest,
      director_nombre: directorio?.nombre || '',
      area_nombre: area?.nombre || '', // NUEVO CAMPO
      created_by_nombre: ''
    };
    addResguardo(resguardoWithRelations);
    resguardosEmitter.emit({ type: 'INSERT', data: resguardoWithRelations, timestamp: new Date().toISOString() });
  }
  break;
}
```

## 6. Cambios en Consultar Resguardos

### 6.1 Actualizar `src/components/resguardos/consultar/hooks/useResguardosData.ts`

El hook ya debería recibir `area_nombre` del store gracias a la indexación actualizada. Solo verificar que se use correctamente en la UI.

### 6.2 Actualizar componentes de UI

En `src/components/resguardos/consultar/components/ResguardoInfoPanel.tsx`:

```typescript
// Mostrar el área desde area_nombre en lugar de calcularla
<div>
  <p className="text-xs">Área</p>
  <p className="text-sm font-medium">{area_nombre || 'Sin área'}</p>
</div>
```

## 7. Cambios en PDF Generation

### 7.1 Actualizar `src/components/resguardos/consultar/hooks/usePDFGeneration.ts`

```typescript
// Asegurarse de que el área se obtenga del resguardo, no del mueble
const pdfData = {
  folio: resguardo.folio,
  fecha: resguardo.f_resguardo,
  director: resguardo.director_nombre || '',
  area: resguardo.area_nombre || '', // Usar area_nombre del resguardo
  puesto: resguardo.puesto_resguardo || '',
  resguardante: resguardante || '',
  articulos: filteredArticulos.map(a => ({
    id_inv: a.num_inventario,
    descripcion: a.descripcion || '',
    rubro: a.rubro || '',
    estado: a.estado || '',
    origen: a.origen || '',
    resguardante: a.resguardante || ''
  })),
  firmas: firmas || []
};
```

## 8. Manejo de Errores

### 8.1 Errores de Validación Frontend

- Mostrar mensaje claro cuando muebles tienen áreas diferentes
- Mostrar mensaje claro cuando muebles tienen directores diferentes
- Prevenir envío del formulario si validación falla

### 8.2 Errores de Base de Datos

- Foreign key constraint: "El área especificada no existe"
- NOT NULL constraint: "El campo id_area es requerido"
- Trigger validation: "El área del mueble no coincide con el área del resguardo"

## 9. Testing Manual

### 9.1 Casos de Prueba

1. **Crear resguardo con área consistente**
   - Seleccionar múltiples muebles del mismo área
   - Verificar que se guarde correctamente con id_area
   - Verificar que el PDF muestre el área correcta

2. **Intentar crear resguardo con áreas inconsistentes**
   - Seleccionar muebles de diferentes áreas
   - Verificar que se muestre error de validación
   - Verificar que no se permita guardar

3. **Consultar resguardo existente**
   - Abrir consulta de resguardos
   - Verificar que el área se muestre correctamente
   - Generar PDF y verificar área

4. **Migración de datos existentes**
   - Verificar que resguardos existentes tengan id_area poblado
   - Verificar que el área sea correcta

## 10. Rollback Plan

Si algo sale mal:

1. Revertir cambios en API route
2. Revertir cambios en hooks de indexación
3. Revertir cambios en frontend
4. Ejecutar SQL para eliminar columna:
   ```sql
   ALTER TABLE resguardos DROP COLUMN id_area;
   ```

## 11. Consideraciones de Performance

- El índice en `id_area` optimizará consultas por área
- El JOIN con tabla `area` en indexación es eficiente (tabla pequeña)
- La validación frontend previene errores costosos en backend

## 12. Consideraciones de Seguridad

- RLS policies deben incluir `id_area` si se implementan filtros por área
- Validar que el usuario tenga permisos para el área especificada
- El trigger de validación previene inconsistencias de datos

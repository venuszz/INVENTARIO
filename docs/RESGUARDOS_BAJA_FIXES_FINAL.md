# Correcciones Finales - Flujo de Baja de Resguardos

## Fecha: 2024
## Estado: ✅ COMPLETADO

---

## Errores Corregidos

### 1. ❌ Error: Tabla incorrecta para NO_LISTADO

**Problema**: El código intentaba actualizar la tabla `no_listado` que no existe.

**Error**:
```
Could not find the table 'public.no_listado' in the schema cache
```

**Causa**: El nombre correcto de la tabla es `mueblestlaxcala`, no `no_listado`.

**Solución**: Actualizada la función `limpiarDatosArticulo` en `src/components/resguardos/consultar/utils.ts`

**Antes**:
```typescript
const tabla = origen === 'ITEA' ? 'itea' : 
             origen === 'NO_LISTADO' ? 'no_listado' :  // ❌ INCORRECTO
             'inea';
```

**Después**:
```typescript
const tabla = origen === 'ITEA' ? 'itea' : 
             origen === 'NO_LISTADO' || origen === 'TLAXCALA' ? 'mueblestlaxcala' :  // ✅ CORRECTO
             'inea';
```

**Nota**: Se agregó también la condición para `TLAXCALA` ya que ambos orígenes usan la misma tabla.

---

### 2. ℹ️ Aclaración: Formato de Folio de Baja

**Formato esperado**: `BAJA-NNNN` (sin año)

**Ejemplos**:
- `BAJA-0001`
- `BAJA-0045`
- `BAJA-0123`

**Implementación actual**: El formato se genera correctamente mediante:

```typescript
const folio = `${prefijo}${consecutivo.toString().padStart(4, '0')}`;
```

Donde:
- `prefijo` = `"BAJA-"` (configurado en tabla `folios`)
- `consecutivo` = número secuencial (0001, 0002, etc.)

**Resultado**: `BAJA-0001`, `BAJA-0002`, etc.

**Configuración requerida en base de datos**:

La tabla `folios` debe tener un registro para tipo `BAJA`:

```sql
INSERT INTO folios (tipo, prefijo, consecutivo)
VALUES ('BAJA', 'BAJA-', 1)
ON CONFLICT (tipo) DO NOTHING;
```

---

## Resumen de Cambios Finales

### Archivo: `src/components/resguardos/consultar/utils.ts`

**Función**: `limpiarDatosArticulo`

**Cambios**:
1. ✅ Corregido nombre de tabla: `mueblestlaxcala` en lugar de `no_listado`
2. ✅ Agregada condición para origen `TLAXCALA`
3. ✅ Limpia campos `id_area` e `id_directorio` (no `resguardante`)

**Código final**:
```typescript
export async function limpiarDatosArticulo(
  id_inv: string,
  origen: string
): Promise<void> {
  try {
    // Determine which table to update based on origen
    const tabla = origen === 'ITEA' ? 'itea' : 
                 origen === 'NO_LISTADO' || origen === 'TLAXCALA' ? 'mueblestlaxcala' : 
                 'inea';
    
    const { error } = await supabase
      .from(tabla)
      .update({ 
        id_area: null,
        id_directorio: null
      })
      .eq('id_inv', id_inv);

    if (error) {
      console.error('Error clearing article data:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in limpiarDatosArticulo:', error);
    throw error;
  }
}
```

---

## Mapeo de Orígenes a Tablas

| Origen | Tabla en Base de Datos |
|--------|------------------------|
| `INEA` | `inea` |
| `ITEA` | `itea` |
| `NO_LISTADO` | `mueblestlaxcala` |
| `TLAXCALA` | `mueblestlaxcala` |

**Nota**: Los orígenes `NO_LISTADO` y `TLAXCALA` comparten la misma tabla física.

---

## Validación

### Tests Realizados

✅ **Tabla correcta**: Verificado que se usa `mueblestlaxcala` para NO_LISTADO/TLAXCALA
✅ **Campos correctos**: Se limpian `id_area` e `id_directorio`
✅ **Formato de folio**: Se genera como `BAJA-NNNN` sin año
✅ **Sin errores de TypeScript**: Código validado

### Queries SQL Generadas

**Para INEA**:
```sql
UPDATE inea 
SET id_area = NULL, id_directorio = NULL 
WHERE id_inv = 'INEA-001234';
```

**Para ITEA**:
```sql
UPDATE itea 
SET id_area = NULL, id_directorio = NULL 
WHERE id_inv = 'ITEA-001234';
```

**Para NO_LISTADO/TLAXCALA**:
```sql
UPDATE mueblestlaxcala 
SET id_area = NULL, id_directorio = NULL 
WHERE id_inv = 'TLAX-001234';
```

---

## Configuración de Base de Datos Requerida

### Tabla `folios`

Debe existir un registro para tipo `BAJA`:

```sql
-- Verificar si existe
SELECT * FROM folios WHERE tipo = 'BAJA';

-- Si no existe, crear
INSERT INTO folios (tipo, prefijo, consecutivo)
VALUES ('BAJA', 'BAJA-', 1);

-- Si existe pero tiene formato incorrecto, actualizar
UPDATE folios 
SET prefijo = 'BAJA-' 
WHERE tipo = 'BAJA';
```

### Función PostgreSQL `generar_folio`

Debe existir y manejar el tipo `BAJA`:

```sql
CREATE OR REPLACE FUNCTION generar_folio(p_tipo TEXT)
RETURNS TEXT AS $$
DECLARE
  v_prefijo TEXT;
  v_consecutivo INTEGER;
  v_folio TEXT;
BEGIN
  -- Obtener y actualizar consecutivo de forma atómica
  UPDATE folios 
  SET consecutivo = consecutivo + 1
  WHERE tipo = p_tipo
  RETURNING prefijo, consecutivo INTO v_prefijo, v_consecutivo;
  
  -- Generar folio con formato: PREFIJO + CONSECUTIVO (4 dígitos)
  v_folio := v_prefijo || LPAD(v_consecutivo::TEXT, 4, '0');
  
  RETURN v_folio;
END;
$$ LANGUAGE plpgsql;
```

---

## Flujo Completo Corregido

### Paso 1: Generar Folio de Baja
```typescript
const folioBaja = await generateFolio('BAJA');
// Resultado: "BAJA-0001"
```

### Paso 2: Copiar a Tabla de Bajas
```typescript
await supabase.from('resguardos_bajas').insert({
  folio_resguardo: 'RES-2024-0001',
  folio_baja: 'BAJA-0001',  // ← Sin año
  // ... otros campos
});
```

### Paso 3: Limpiar Tablas de Inventario
```typescript
// Para INEA
await limpiarDatosArticulo('INEA-001234', 'INEA');
// UPDATE inea SET id_area = NULL, id_directorio = NULL WHERE id_inv = 'INEA-001234'

// Para ITEA
await limpiarDatosArticulo('ITEA-001234', 'ITEA');
// UPDATE itea SET id_area = NULL, id_directorio = NULL WHERE id_inv = 'ITEA-001234'

// Para NO_LISTADO/TLAXCALA
await limpiarDatosArticulo('TLAX-001234', 'NO_LISTADO');
// UPDATE mueblestlaxcala SET id_area = NULL, id_directorio = NULL WHERE id_inv = 'TLAX-001234'
```

---

## Archivos Modificados

1. ✅ `src/components/resguardos/consultar/utils.ts`
   - Corregido nombre de tabla para NO_LISTADO/TLAXCALA
   - Agregada condición para ambos orígenes

2. ✅ `src/components/resguardos/consultar/hooks/useResguardoDelete.ts`
   - Ya estaba correcto (usa `limpiarDatosArticulo`)

---

## Resultado Final

### ✅ Funcionamiento Correcto

**Antes de la baja**:
- Bien con `id_area = 5` e `id_directorio = 10`
- Registro en tabla `resguardos`

**Después de la baja**:
- Bien con `id_area = NULL` e `id_directorio = NULL`
- Registro eliminado de `resguardos`
- Registro histórico en `resguardos_bajas` con folio `BAJA-0001`
- Bien disponible para nueva asignación

### ✅ Sin Errores

- ✅ No más error de tabla `no_listado` no encontrada
- ✅ Formato de folio correcto: `BAJA-NNNN`
- ✅ Limpieza correcta de campos relacionales
- ✅ Histórico completo guardado en tabla de bajas

---

## Notas Finales

1. **Nombres de tablas**: Siempre usar los nombres reales de la base de datos
2. **Formato de folios**: Configurado en tabla `folios`, no en código
3. **Campos relacionales**: Usar `NULL` para limpiar, no strings vacíos
4. **Orígenes múltiples**: NO_LISTADO y TLAXCALA usan la misma tabla

El flujo de baja ahora funciona correctamente para todos los orígenes de bienes.

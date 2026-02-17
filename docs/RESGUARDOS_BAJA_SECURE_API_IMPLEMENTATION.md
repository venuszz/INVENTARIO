# Resguardos Baja - Implementación con Supabase Client Directo

## Resumen

El proceso de baja de resguardos ahora utiliza llamadas directas al cliente de Supabase, siguiendo el mismo patrón que la creación de resguardos. Esto elimina la necesidad de una ruta API intermedia y simplifica la arquitectura.

## Evolución de la Implementación

### Versión 1: Llamadas directas (Fallaba por RLS)
```typescript
// ❌ Error: "new row violates row-level security policy"
await supabase.from('resguardos_bajas').insert(bajasData);
```

### Versión 2: API con Service Role Key (Funcionaba pero complejo)
```typescript
// ✅ Funcionaba pero requería ruta API adicional
await fetch('/api/resguardos/baja', { ... });
```

### Versión 3: Llamadas directas con created_by (Actual - Simple y funcional)
```typescript
// ✅ Funciona correctamente con RLS
await supabase.from('resguardos_bajas').insert({
  ...bajasData,
  created_by: user.id  // Campo requerido por RLS
});
```

## Implementación Actual

### 1. Hook `useResguardoDelete.ts`

**Patrón utilizado**: Mismo que `useResguardoSubmit.ts` (crear resguardos)

#### Función Principal: `moveToResguardosBajas`

```typescript
const moveToResguardosBajas = useCallback(async (
  articulos: ResguardoArticulo[],
  folioResguardo: string,
  folioBaja: string,
  fecha: string,
  director: string,
  area: string,
  puesto: string,
  resguardante: string,
  deleteByFolio: boolean = false
) => {
  // 1. Validar sesión de usuario
  if (!user || !user.id) {
    throw new Error('No se pudo obtener el usuario actual');
  }

  // 2. Preparar datos para resguardos_bajas (incluye created_by: user.id)
  const bajasData = articulos.map(articulo => ({
    folio_resguardo: folioResguardo,
    folio_baja: folioBaja,
    f_resguardo: fecha,
    area_resguardo: area,
    dir_area: director,
    num_inventario: articulo.num_inventario,
    descripcion: articulo.descripcion,
    rubro: articulo.rubro,
    condicion: articulo.condicion,
    usufinal: resguardante,
    puesto: puesto,
    origen: articulo.origen,
    created_by: user.id  // ✅ Campo requerido por RLS
  }));

  // 3. Insertar en resguardos_bajas
  const { data: insertedBajas, error: insertError } = await supabase
    .from('resguardos_bajas')
    .insert(bajasData)
    .select();

  if (insertError) throw insertError;

  // 4. Eliminar de resguardos
  if (deleteByFolio) {
    await supabase.from('resguardos').delete().eq('folio', folioResguardo);
  } else {
    const resguardosIds = articulos.map(art => art.id);
    await supabase.from('resguardos').delete().in('id', resguardosIds);
  }

  // 5. Limpiar campos en tablas de muebles
  for (const articulo of articulos) {
    await limpiarDatosArticulo(articulo.num_inventario, articulo.origen);
  }

  return insertedBajas;
}, [user]);
```

### 2. Obtención del Usuario

**Patrón utilizado** (igual que en `useResguardoSubmit.ts`):

```typescript
import { useSession } from '@/hooks/useSession';

const { user } = useSession();

// Validación en cada operación
if (!user || !user.id) {
  throw new Error('No se pudo obtener el usuario actual');
}

// Uso del user.id
created_by: user.id
```

### 3. Funciones de Eliminación

Todas las funciones (`deleteArticulo`, `deleteSelected`, `deleteAll`) ahora llaman a `moveToResguardosBajas`:

```typescript
// deleteArticulo - Elimina un artículo
await moveToResguardosBajas(
  [articulo], 
  folio, 
  folioBaja, 
  fecha, 
  director, 
  area, 
  puesto, 
  resguardante, 
  false
);

// deleteSelected - Elimina artículos seleccionados
await moveToResguardosBajas(
  articulos, 
  folio, 
  folioBaja, 
  fecha, 
  director, 
  area, 
  puesto, 
  resguardante, 
  false
);

// deleteAll - Elimina todos los artículos del folio
await moveToResguardosBajas(
  articulos, 
  folio, 
  folioBaja, 
  fecha, 
  director, 
  area, 
  puesto, 
  resguardante, 
  true  // deleteByFolio
);
```

### 4. Limpieza de Campos en Muebles

La función `limpiarDatosArticulo` (en `utils.ts`) limpia los campos relacionales:

```typescript
export async function limpiarDatosArticulo(
  id_inv: string, 
  origen: string
): Promise<void> {
  const tabla = origen === 'ITEA' ? 'itea' : 
               origen === 'NO_LISTADO' || origen === 'TLAXCALA' ? 'mueblestlaxcala' : 
               'inea';
  
  await supabase
    .from(tabla)
    .update({ 
      id_area: null,
      id_directorio: null
    })
    .eq('id_inv', id_inv);
}
```

## Flujo Completo del Proceso de Baja

```
1. Usuario hace clic en "Dar de Baja"
   ↓
2. deleteArticulo/deleteSelected/deleteAll se ejecuta
   ↓
3. Generar folio de baja (BAJA-NNNN)
   ↓
4. Obtener firmas para PDF
   ↓
5. moveToResguardosBajas:
   a. Validar usuario (useSession)
   b. Preparar datos con created_by: user.id
   c. INSERT en resguardos_bajas (Supabase client)
   d. DELETE de resguardos (por ID o por folio)
   e. Limpiar campos en muebles (id_area, id_directorio → null)
   ↓
6. Preparar datos para PDF
   ↓
7. Mostrar mensaje de éxito
   ↓
8. Ejecutar callback onSuccess (recargar datos)
```

## Archivos Modificados

- ✅ `src/components/resguardos/consultar/hooks/useResguardoDelete.ts` - Actualizado para usar Supabase client
- ✅ `src/components/resguardos/consultar/utils.ts` - Ya tenía `limpiarDatosArticulo`
- ❌ `src/app/api/resguardos/baja/route.ts` - **ELIMINADO** (ya no se necesita)

## Ventajas de Este Enfoque

### Simplicidad
- ✅ No requiere ruta API intermedia
- ✅ Menos archivos para mantener
- ✅ Lógica más directa y clara

### Consistencia
- ✅ Mismo patrón que crear resguardos
- ✅ Usa `useSession()` de la misma forma
- ✅ Estructura de código similar

### RLS Compatible
- ✅ Las políticas RLS permiten INSERT con `created_by`
- ✅ No requiere service role key
- ✅ Seguridad manejada por Supabase

### Mantenibilidad
- ✅ Código más simple de entender
- ✅ Menos puntos de fallo
- ✅ Logs exhaustivos mantenidos

### Performance
- ✅ Una llamada menos (no hay round-trip a API)
- ✅ Inserciones en batch
- ✅ Operaciones directas a la base de datos

## Políticas RLS

Las políticas RLS en `resguardos_bajas` permiten:

```sql
-- Política de INSERT
CREATE POLICY "Users can insert bajas with created_by"
ON resguardos_bajas
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND created_by = auth.uid()
);

-- Política de SELECT
CREATE POLICY "Users can view all bajas"
ON resguardos_bajas
FOR SELECT
USING (auth.uid() IS NOT NULL);
```

## Comparación: API vs Cliente Directo

| Aspecto | Con API (v2) | Cliente Directo (v3) |
|---------|--------------|----------------------|
| Archivos | Hook + API route | Solo Hook |
| Service Role | ✅ Requerido | ❌ No necesario |
| Complejidad | Media | Baja |
| Llamadas HTTP | 2 (cliente → API → Supabase) | 1 (cliente → Supabase) |
| RLS | Bypassed | Respetado |
| Seguridad | API valida | RLS valida |
| Mantenimiento | Más archivos | Menos archivos |
| Patrón | Diferente a crear | Igual a crear |

## Flujo de Logs

### Cliente (Hook)
```
🚀 [BAJA] Iniciando deleteArticulo
📋 [BAJA] Parámetros: {...}
🔢 [BAJA] Generando folio de baja...
✅ [BAJA] Folio generado: BAJA-0001
📝 [BAJA] Obteniendo firmas...
✅ [BAJA] Firmas obtenidas: 3
📦 [BAJA] Procesando baja...
📦 [BAJA] Iniciando moveToResguardosBajas
✅ [BAJA] Usuario de sesión: { id: 'uuid', email: 'user@example.com' }
📦 [BAJA] Preparando artículo 1/1: {...}
➕ [BAJA] Insertando 1 registros en resguardos_bajas...
✅ [BAJA] Registros insertados en resguardos_bajas: 1
🗑️ [BAJA] Eliminando 1 resguardos específicos...
✅ [BAJA] Resguardos eliminados
🧹 [BAJA] Limpiando campos en tablas de muebles...
✅ [BAJA] Limpiado artículo: INV-001
✅ [BAJA] Proceso de baja completado exitosamente
✅ [BAJA] Baja procesada exitosamente
📄 [BAJA] Preparando datos para PDF...
✅ [BAJA] PDF data preparado
✅ [BAJA] Proceso completado exitosamente
🏁 [BAJA] deleteArticulo finalizado
```

## Testing

Para probar:

1. Iniciar sesión en la aplicación
2. Ir a "Consultar Resguardos"
3. Seleccionar un resguardo
4. Dar de baja un artículo, varios artículos, o el resguardo completo
5. Verificar en consola:
   - Logs de todo el proceso
   - No hay errores de RLS
   - Operaciones completadas exitosamente
6. Verificar en base de datos:
   - Registro insertado en `resguardos_bajas` con `created_by`
   - Registro eliminado de `resguardos`
   - Campos `id_area` e `id_directorio` en null en tabla de muebles
7. Verificar PDF:
   - PDF de baja generado correctamente
   - Contiene todos los datos esperados

## Notas Importantes

- El campo `created_by` es **NOT NULL** en `resguardos_bajas`
- El usuario se obtiene con `useSession()` en el cliente
- Las políticas RLS validan que el usuario esté autenticado
- Los logs exhaustivos se mantienen para debugging
- El patrón es idéntico al de crear resguardos
- No se requiere service role key
- La arquitectura es más simple y mantenible

## Conclusión

La implementación actual (v3) es la más simple y efectiva:
- ✅ Funciona correctamente sin errores de RLS
- ✅ Sigue el mismo patrón que crear resguardos
- ✅ No requiere API intermedia
- ✅ Código más simple y mantenible
- ✅ Logs exhaustivos para debugging
- ✅ Compatible con políticas RLS de Supabase

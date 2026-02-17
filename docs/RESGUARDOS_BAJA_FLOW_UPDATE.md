# Actualización del Flujo de Baja de Resguardos

## Fecha: 2024
## Estado: ✅ COMPLETADO

## Resumen de Cambios

Se ha actualizado el flujo de baja de resguardos para reflejar correctamente la estructura actual de la base de datos, donde el campo `resguardante` ya no existe en las tablas de muebles. En su lugar, se utilizan los campos relacionales `id_area` e `id_directorio`.

---

## Cambios Realizados

### 1. Actualización de `limpiarDatosArticulo` en `utils.ts`

**Archivo**: `src/components/resguardos/consultar/utils.ts`

**Cambio**: Modificada la función para limpiar los campos relacionales en lugar del campo `resguardante`.

**Antes**:
```typescript
const { error } = await supabase
  .from(tabla)
  .update({ 
    resguardante: '' 
  })
  .eq('id_inv', id_inv);
```

**Después**:
```typescript
const { error } = await supabase
  .from(tabla)
  .update({ 
    id_area: null,
    id_directorio: null
  })
  .eq('id_inv', id_inv);
```

**Razón**: El campo `resguardante` fue eliminado en una actualización previa. Ahora la asignación de bienes se maneja mediante relaciones con las tablas `area` y `directorio` usando los campos `id_area` e `id_directorio`.

**Impacto**: Al dar de baja un artículo, se eliminan las referencias relacionales, dejando el bien sin asignación de área ni director.

---

### 2. Actualización de `moveToResguardosBajas` en `useResguardoDelete.ts`

**Archivo**: `src/components/resguardos/consultar/hooks/useResguardoDelete.ts`

**Cambio**: Agregado el parámetro `resguardante` a la función para guardar correctamente el nombre del resguardante en la tabla de bajas.

**Antes**:
```typescript
const moveToResguardosBajas = useCallback(async (
  articulos: ResguardoArticulo[],
  folioResguardo: string,
  folioBaja: string,
  fecha: string,
  director: string,
  area: string,
  puesto: string
) => {
  // ...
  usufinal: articulo.resguardante || '',
  // ...
}, []);
```

**Después**:
```typescript
const moveToResguardosBajas = useCallback(async (
  articulos: ResguardoArticulo[],
  folioResguardo: string,
  folioBaja: string,
  fecha: string,
  director: string,
  area: string,
  puesto: string,
  resguardante: string  // ← NUEVO PARÁMETRO
) => {
  // ...
  usufinal: resguardante,  // ← USA EL PARÁMETRO
  // ...
}, []);
```

**Razón**: El campo `usufinal` en la tabla `resguardos_bajas` debe contener el nombre del resguardante que tenía el bien al momento de la baja. Este dato se obtiene del resguardo activo y se pasa como parámetro para garantizar consistencia.

---

### 3. Actualización de llamadas a `moveToResguardosBajas`

**Archivo**: `src/components/resguardos/consultar/hooks/useResguardoDelete.ts`

**Cambio**: Todas las llamadas a `moveToResguardosBajas` ahora incluyen el parámetro `resguardante`.

**Funciones actualizadas**:
- `deleteArticulo`: Baja de un solo artículo
- `deleteSelected`: Baja de artículos seleccionados
- `deleteAll`: Baja de resguardo completo

**Ejemplo**:
```typescript
await moveToResguardosBajas(
  articulos, 
  folio, 
  folioBaja, 
  fecha, 
  director, 
  area, 
  puesto, 
  resguardante  // ← PARÁMETRO AGREGADO
);
```

---

### 4. Actualización de comentarios en el código

**Archivo**: `src/components/resguardos/consultar/hooks/useResguardoDelete.ts`

**Cambio**: Actualizados los comentarios para reflejar que se limpian `id_area` e `id_directorio`.

**Antes**:
```typescript
// Clear resguardante in muebles table
await limpiarDatosArticulo(articulo.num_inventario || '', articulo.origen);
```

**Después**:
```typescript
// Clear id_area and id_directorio in muebles table
await limpiarDatosArticulo(articulo.num_inventario || '', articulo.origen);
```

---

## Flujo Completo de Baja Actualizado

### Paso 1: Generación de Folio de Baja
- Se genera un folio único con formato `BAJA-YYYY-NNNN`
- Usa el sistema centralizado de folios

### Paso 2: Obtención de Firmas
- Se obtienen las firmas de la tabla `firmas` para el PDF

### Paso 3: Copia a Tabla de Bajas
- Se copian los registros a `resguardos_bajas` con:
  - `folio_resguardo`: Folio del resguardo original
  - `folio_baja`: Folio de baja generado
  - `f_resguardo`: Fecha del resguardo original
  - `area_resguardo`: Área del resguardo
  - `dir_area`: Director del resguardo
  - `num_inventario`: Número de inventario del bien
  - `descripcion`: Descripción del bien
  - `rubro`: Rubro del bien
  - `condicion`: Condición del bien
  - `usufinal`: **Nombre del resguardante** (obtenido del resguardo activo)
  - `puesto`: Puesto del director
  - `origen`: Origen del bien (INEA/ITEA/NO_LISTADO)

### Paso 4: Preparación de Datos para PDF
- Se prepara el objeto `PdfDataBaja` con toda la información necesaria
- Incluye artículos, firmas, y datos del resguardo

### Paso 5: Eliminación de Registros Activos
- Se eliminan los registros de la tabla `resguardos`
- Por `id` para bajas individuales/seleccionadas
- Por `folio` para baja completa

### Paso 6: Limpieza de Tablas de Inventario
- Se ejecuta `limpiarDatosArticulo` para cada artículo
- **Limpia `id_area` e `id_directorio`** (establece a `null`)
- Esto desvincula el bien del área y director
- El bien queda disponible para nueva asignación

### Paso 7: Generación de PDF
- Se muestra modal con opción de descargar PDF de baja
- El PDF incluye todos los datos del resguardo y la baja

---

## Datos que se Obtienen y Guardan

### Datos del Resguardo (obtenidos de `useResguardoDetails`)

Los datos del resguardo se obtienen mediante el hook `useResguardoDetails`, que:

1. **Filtra resguardos del store** por folio
2. **Obtiene datos relacionales** mediante JOINs:
   - `director_nombre`: Del JOIN con tabla `directorio`
   - `director_puesto`: Del JOIN con tabla `directorio`
   - `area_nombre`: Del JOIN con tabla `area`
3. **Mapea artículos** obteniendo detalles de los stores de inventario:
   - INEA: `ineaMuebles`
   - ITEA: `iteaMuebles`
   - NO_LISTADO: `noListadoMuebles`

### Estructura de Datos en `resguardos_bajas`

```typescript
{
  folio_resguardo: string,    // Folio del resguardo original
  folio_baja: string,          // Folio de baja generado (BAJA-YYYY-NNNN)
  f_resguardo: string,         // Fecha del resguardo original
  area_resguardo: string,      // Nombre del área (de area_nombre)
  dir_area: string,            // Nombre del director (de director_nombre)
  num_inventario: string,      // Número de inventario del bien
  descripcion: string,         // Descripción del bien
  rubro: string,               // Rubro del bien
  condicion: string,           // Condición/estado del bien
  usufinal: string,            // Nombre del resguardante
  puesto: string,              // Puesto del director (de director_puesto)
  origen: string               // Origen: INEA, ITEA, o NO_LISTADO
}
```

### Estructura de Datos en PDF de Baja

```typescript
{
  folioBaja: string,           // Folio de baja
  folioOriginal: string,       // Folio del resguardo original
  fecha: string,               // Fecha de la baja (fecha actual)
  director: string,            // Nombre del director
  area: string,                // Nombre del área
  puesto: string,              // Puesto del director
  resguardante: string,        // Nombre del resguardante
  articulos: Array<{
    id_inv: string,
    descripcion: string,
    rubro: string,
    estado: string,
    origen: string,
    resguardante: string
  }>,
  firmas: Array<PdfFirma>      // Firmas para el PDF
}
```

---

## Origen de los Datos

### 1. Datos del Resguardo
**Fuente**: Hook `useResguardoDetails`
- Lee del store `resguardosStore` (indexado desde tabla `resguardos`)
- Los datos se obtienen con JOINs en la indexación:
  ```sql
  SELECT 
    *,
    directorio:id_directorio (nombre, puesto),
    area:id_area (nombre)
  FROM resguardos
  ```

### 2. Datos de los Artículos
**Fuente**: Stores de inventario
- `ineaMuebles`: Para artículos de INEA
- `iteaMuebles`: Para artículos de ITEA
- `noListadoMuebles`: Para artículos de NO_LISTADO

**Mapeo**:
```typescript
{
  id: item.id,                           // UUID del registro en resguardos
  num_inventario: mueble.id_inv,         // Del store de inventario
  descripcion: mueble.descripcion,       // Del store de inventario
  rubro: mueble.rubro,                   // Del store de inventario
  condicion: mueble.estado,              // Del store de inventario
  resguardante: item.resguardante,       // Del registro en resguardos
  origen: item.origen                    // Del registro en resguardos
}
```

### 3. Datos Relacionales
**Fuente**: Indexación con JOINs
- `director_nombre`: `directorio.nombre`
- `director_puesto`: `directorio.puesto`
- `area_nombre`: `area.nombre`

---

## Validación

✅ **Función `limpiarDatosArticulo`**: Actualizada para limpiar `id_area` e `id_directorio`
✅ **Función `moveToResguardosBajas`**: Recibe y usa correctamente el parámetro `resguardante`
✅ **Función `deleteArticulo`**: Pasa `resguardante` correctamente
✅ **Función `deleteSelected`**: Pasa `resguardante` correctamente
✅ **Función `deleteAll`**: Pasa `resguardante` correctamente
✅ **Comentarios**: Actualizados para reflejar los cambios
✅ **Sin errores de TypeScript**: Verificado con getDiagnostics

---

## Impacto en el Sistema

### Tablas Afectadas

1. **`resguardos`**: Se eliminan registros
2. **`resguardos_bajas`**: Se insertan registros históricos
3. **`inea`/`itea`/`no_listado`**: Se limpian `id_area` e `id_directorio`
4. **`folios`**: Se incrementa contador de folios de baja

### Comportamiento del Sistema

**Antes de la baja**:
- Bien tiene `id_area` y `id_directorio` asignados
- Registro existe en tabla `resguardos`
- Bien aparece en resguardos activos

**Después de la baja**:
- Bien tiene `id_area = null` y `id_directorio = null`
- Registro eliminado de tabla `resguardos`
- Registro histórico en tabla `resguardos_bajas`
- Bien disponible para nueva asignación
- PDF de baja generado con toda la información

---

## Archivos Modificados

1. `src/components/resguardos/consultar/utils.ts`
   - Función `limpiarDatosArticulo` actualizada

2. `src/components/resguardos/consultar/hooks/useResguardoDelete.ts`
   - Función `moveToResguardosBajas` actualizada
   - Funciones `deleteArticulo`, `deleteSelected`, `deleteAll` actualizadas
   - Comentarios actualizados

---

## Notas Técnicas

### Consistencia de Datos
- El campo `usufinal` en `resguardos_bajas` guarda el nombre del resguardante
- Este dato se obtiene del campo `resguardante` en la tabla `resguardos`
- Es un dato desnormalizado para mantener el histórico completo

### Campos Relacionales vs Texto
- **En tablas de inventario**: Se usan `id_area` e `id_directorio` (relacional)
- **En tabla de bajas**: Se guarda `usufinal` (texto) para histórico
- Esto permite mantener el registro histórico incluso si se eliminan áreas o directores

### Limpieza de Datos
- `id_area` e `id_directorio` se establecen a `null` (no a string vacío)
- Esto permite usar constraints de foreign key correctamente
- El bien queda "sin asignar" y disponible para nuevo resguardo

---

## Próximos Pasos

El flujo de baja está completamente actualizado y funcional. Los cambios garantizan:

1. ✅ Limpieza correcta de campos relacionales en tablas de inventario
2. ✅ Guardado completo de información histórica en tabla de bajas
3. ✅ Generación correcta de PDFs de baja con todos los datos
4. ✅ Consistencia entre el modelo de datos actual y el flujo de baja
5. ✅ Disponibilidad de bienes para nueva asignación después de baja

---

## Resumen Ejecutivo

**Problema**: El flujo de baja intentaba limpiar el campo `resguardante` que ya no existe en las tablas de muebles.

**Solución**: Actualizado el flujo para limpiar los campos relacionales `id_area` e `id_directorio`, que son los que realmente controlan la asignación de bienes.

**Resultado**: El flujo de baja ahora funciona correctamente con la estructura actual de la base de datos, limpiando las relaciones y guardando el histórico completo en la tabla de bajas.

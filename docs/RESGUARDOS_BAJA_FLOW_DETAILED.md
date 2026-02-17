# Flujo Detallado de Baja de Resguardos

## Índice
1. [Visión General](#visión-general)
2. [Tipos de Baja](#tipos-de-baja)
3. [Flujo Paso a Paso](#flujo-paso-a-paso)
4. [Tablas Involucradas](#tablas-involucradas)
5. [Generación de Folio de Baja](#generación-de-folio-de-baja)
6. [Movimiento de Datos](#movimiento-de-datos)
7. [Limpieza de Datos](#limpieza-de-datos)
8. [Generación de PDF](#generación-de-pdf)
9. [Estado Actual](#estado-actual)

---

## Visión General

El sistema de baja de resguardos permite eliminar artículos de un resguardo de tres formas:
1. **Baja Individual**: Eliminar un solo artículo
2. **Baja Seleccionada**: Eliminar múltiples artículos seleccionados
3. **Baja Total**: Eliminar todos los artículos de un resguardo

Cada operación de baja:
- ✅ Genera un folio único de baja (formato: `BAJA-YYYY-NNNN`)
- ✅ Mueve los registros a la tabla `resguardos_bajas` (histórico)
- ✅ Elimina los registros de la tabla `resguardos` (activos)
- ✅ Limpia el campo `resguardante` en las tablas de inventario
- ✅ Genera un PDF de baja con los artículos dados de baja

---

## Tipos de Baja

### 1. Baja Individual (`deleteArticulo`)
**Trigger:** Usuario hace clic en el botón de eliminar de un artículo específico

**Parámetros:**
```typescript
deleteArticulo(
  articulo: ResguardoArticulo,  // Artículo a eliminar
  folio: string,                 // Folio del resguardo original
  fecha: string,                 // Fecha del resguardo original
  director: string,              // Nombre del director
  area: string,                  // Nombre del área
  puesto: string,                // Puesto del director
  resguardante: string           // Nombre del resguardante
)
```

### 2. Baja Seleccionada (`deleteSelected`)
**Trigger:** Usuario selecciona múltiples artículos y hace clic en "Eliminar seleccionados"

**Parámetros:**
```typescript
deleteSelected(
  articulos: ResguardoArticulo[], // Array de artículos seleccionados
  folio: string,                   // Folio del resguardo original
  fecha: string,                   // Fecha del resguardo original
  director: string,                // Nombre del director
  area: string,                    // Nombre del área
  puesto: string,                  // Puesto del director
  resguardante: string             // Nombre del resguardante
)
```

### 3. Baja Total (`deleteAll`)
**Trigger:** Usuario hace clic en "Eliminar resguardo completo"

**Parámetros:**
```typescript
deleteAll(
  articulos: ResguardoArticulo[], // Todos los artículos del resguardo
  folio: string,                   // Folio del resguardo original
  fecha: string,                   // Fecha del resguardo original
  director: string,                // Nombre del director
  area: string,                    // Nombre del área
  puesto: string,                  // Puesto del director
  resguardante: string             // Nombre del resguardante
)
```

---

## Flujo Paso a Paso

### Paso 1: Inicio de la Operación
```typescript
setDeleting(true);
setError(null);
setSuccess(null);
```
- Se activa el estado de carga
- Se limpian mensajes previos

### Paso 2: Generación de Folio de Baja
```typescript
const folioBaja = await generateFolio('BAJA');
// Resultado: "BAJA-2024-0001"
```
- Se genera un folio único para la baja
- Formato: `BAJA-YYYY-NNNN`
- El contador se incrementa automáticamente

### Paso 3: Obtención de Firmas
```typescript
const firmas = await getFirmas();
```
- Se consultan las firmas de la tabla `firmas`
- Se ordenan por `id` ascendente
- Se usan para el PDF de baja

### Paso 4: Movimiento a Tabla de Bajas
```typescript
await moveToResguardosBajas(
  articulos,      // Artículos a dar de baja
  folio,          // Folio original del resguardo
  folioBaja,      // Folio de baja generado
  fecha,          // Fecha del resguardo original
  director,       // Director
  area,           // Área
  puesto          // Puesto
);
```

**Operación interna:**
```typescript
for (const articulo of articulos) {
  await supabase
    .from('resguardos_bajas')
    .insert({
      folio_resguardo: folioResguardo,  // Folio original
      folio_baja: folioBaja,            // Folio de baja
      f_resguardo: fecha,               // Fecha original
      area_resguardo: area,             // Área
      dir_area: director,               // Director
      num_inventario: articulo.num_inventario,
      descripcion: articulo.descripcion,
      rubro: articulo.rubro,
      condicion: articulo.condicion,
      usufinal: articulo.resguardante || '',
      puesto: puesto,
      origen: articulo.origen
    });
}
```

### Paso 5: Preparación de Datos para PDF
```typescript
setPdfBajaData({
  folioBaja: folioBaja,
  folioOriginal: folio,
  fecha: new Date().toLocaleDateString(),
  director: director,
  area: area,
  puesto: puesto,
  resguardante: resguardante,
  articulos: articulos.map(art => ({
    id_inv: art.num_inventario,
    descripcion: art.descripcion,
    rubro: art.rubro,
    estado: art.condicion,
    origen: art.origen,
    resguardante: art.resguardante || ''
  })),
  firmas: firmas
});
```

### Paso 6: Eliminación de Registros Activos

**Para baja individual o seleccionada:**
```typescript
for (const articulo of articulos) {
  await supabase
    .from('resguardos')
    .delete()
    .eq('id', articulo.id);  // Eliminar por ID específico
}
```

**Para baja total:**
```typescript
await supabase
  .from('resguardos')
  .delete()
  .eq('folio', folio);  // Eliminar todos los registros del folio
```

### Paso 7: Limpieza de Datos en Inventario
```typescript
for (const articulo of articulos) {
  await limpiarDatosArticulo(
    articulo.num_inventario || '', 
    articulo.origen
  );
}
```

**Operación interna:**
```typescript
// Determinar tabla según origen
const tabla = origen === 'ITEA' ? 'itea' : 
             origen === 'NO_LISTADO' ? 'no_listado' : 
             'inea';

// Limpiar campo resguardante
await supabase
  .from(tabla)
  .update({ resguardante: '' })
  .eq('id_inv', id_inv);
```

### Paso 8: Finalización
```typescript
setSuccess('Artículo(s) eliminado(s) correctamente');
onSuccess();  // Callback para refrescar datos
setDeleting(false);
```

### Paso 9: Generación de PDF (Manual)
El usuario ve un modal con el folio de baja y puede:
- Cerrar el modal (sin descargar PDF)
- Descargar el PDF de baja

```typescript
handleGenerateBajaPDF() {
  // Prepara columnas y datos
  // Llama a generateBajaPDF()
  // Descarga el archivo
}
```

---

## Tablas Involucradas

### 1. Tabla `resguardos` (Activos)
**Operación:** DELETE
```sql
-- Baja individual/seleccionada
DELETE FROM resguardos WHERE id = ?

-- Baja total
DELETE FROM resguardos WHERE folio = ?
```

### 2. Tabla `resguardos_bajas` (Histórico)
**Operación:** INSERT
```sql
INSERT INTO resguardos_bajas (
  folio_resguardo,
  folio_baja,
  f_resguardo,
  area_resguardo,
  dir_area,
  num_inventario,
  descripcion,
  rubro,
  condicion,
  usufinal,
  puesto,
  origen
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

**Estructura de la tabla:**
```sql
CREATE TABLE resguardos_bajas (
  id SERIAL PRIMARY KEY,
  folio_resguardo TEXT NOT NULL,      -- Folio original del resguardo
  folio_baja TEXT NOT NULL,           -- Folio de la baja (BAJA-YYYY-NNNN)
  f_resguardo DATE NOT NULL,          -- Fecha del resguardo original
  area_resguardo TEXT,                -- Área
  dir_area TEXT,                      -- Director
  num_inventario TEXT,                -- Número de inventario
  descripcion TEXT,                   -- Descripción del bien
  rubro TEXT,                         -- Rubro
  condicion TEXT,                     -- Condición
  usufinal TEXT,                      -- Resguardante (usufinal legacy)
  puesto TEXT,                        -- Puesto del director
  origen TEXT,                        -- INEA, ITEA, NO_LISTADO
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Tablas de Inventario (inea, itea, no_listado)
**Operación:** UPDATE
```sql
UPDATE inea SET resguardante = '' WHERE id_inv = ?
UPDATE itea SET resguardante = '' WHERE id_inv = ?
UPDATE no_listado SET resguardante = '' WHERE id_inv = ?
```

**Propósito:** Liberar el bien para que pueda ser asignado a otro resguardo

---

## Generación de Folio de Baja

### Hook: `useFolioGenerator`
```typescript
const { generateFolio } = useFolioGenerator();
const folioBaja = await generateFolio('BAJA');
```

### Formato del Folio
```
BAJA-YYYY-NNNN
```
- `BAJA`: Prefijo fijo
- `YYYY`: Año actual (4 dígitos)
- `NNNN`: Número secuencial (4 dígitos con padding)

### Ejemplos
```
BAJA-2024-0001
BAJA-2024-0002
BAJA-2024-0123
BAJA-2025-0001  (se reinicia cada año)
```

### Tabla de Contadores
```sql
CREATE TABLE folios (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,           -- 'RESGUARDO' o 'BAJA'
  anio INTEGER NOT NULL,        -- Año
  contador INTEGER NOT NULL,    -- Contador secuencial
  UNIQUE(tipo, anio)
);
```

---

## Movimiento de Datos

### Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario solicita baja                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Generar folio de baja (BAJA-YYYY-NNNN)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Copiar registros a resguardos_bajas                     │
│    - folio_resguardo: Folio original                        │
│    - folio_baja: Folio generado                             │
│    - Todos los datos del artículo                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Eliminar registros de resguardos                        │
│    - Por ID (individual/seleccionada)                       │
│    - Por folio (total)                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Limpiar campo resguardante en inventario                │
│    - inea.resguardante = ''                                 │
│    - itea.resguardante = ''                                 │
│    - no_listado.resguardante = ''                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Preparar datos para PDF de baja                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Mostrar modal con opción de descargar PDF               │
└─────────────────────────────────────────────────────────────┘
```

---

## Limpieza de Datos

### Función: `limpiarDatosArticulo`

**Propósito:** Liberar el bien para que pueda ser asignado a otro resguardo

**Operación:**
```typescript
async function limpiarDatosArticulo(id_inv: string, origen: string) {
  // Determinar tabla según origen
  const tabla = origen === 'ITEA' ? 'itea' : 
               origen === 'NO_LISTADO' ? 'no_listado' : 
               'inea';
  
  // Actualizar campo resguardante a string vacío
  await supabase
    .from(tabla)
    .update({ resguardante: '' })
    .eq('id_inv', id_inv);
}
```

**Importante:**
- ✅ Se establece `resguardante = ''` (string vacío)
- ❌ NO se establece `resguardante = null`
- ✅ El bien queda disponible para nuevo resguardo
- ✅ Se mantiene el historial en `resguardos_bajas`

---

## Generación de PDF

### Datos del PDF de Baja

```typescript
interface PdfDataBaja {
  folioBaja: string;           // BAJA-YYYY-NNNN
  folioOriginal: string;       // Folio del resguardo original
  fecha: string;               // Fecha de la baja (hoy)
  director: string;            // Nombre del director
  area: string;                // Nombre del área
  puesto: string;              // Puesto del director
  resguardante: string;        // Nombre del resguardante
  articulos: Array<{
    id_inv: string;
    descripcion: string;
    rubro: string;
    estado: string;
    origen: string;
    resguardante: string;
  }>;
  firmas?: PdfFirma[];
}
```

### Contenido del PDF

1. **Encabezado:**
   - Logos institucionales (INEA, ITEA)
   - Título: "BAJA DE RESGUARDO FOLIO {folioBaja}"
   - Folio original del resguardo
   - Fecha de la baja

2. **Información del Responsable:**
   - Director
   - Área
   - Puesto
   - Resguardante

3. **Tabla de Artículos:**
   - No. Inventario
   - Descripción
   - Rubro
   - Estado
   - Origen
   - Resguardante

4. **Firmas:**
   - Autoriza
   - Conocimiento
   - Responsable

---

## Estado Actual

### ✅ Funcionalidad Implementada

1. **Hook `useResguardoDelete`:**
   - ✅ `deleteArticulo` - Baja individual
   - ✅ `deleteSelected` - Baja seleccionada
   - ✅ `deleteAll` - Baja total
   - ✅ Generación de folio de baja
   - ✅ Movimiento a `resguardos_bajas`
   - ✅ Limpieza de datos en inventario
   - ✅ Preparación de datos para PDF

2. **Componente `ConsultarResguardos`:**
   - ✅ Handlers para cada tipo de baja
   - ✅ Modales de confirmación
   - ✅ Modal de PDF de baja
   - ✅ Integración con hooks

3. **Utilidades:**
   - ✅ `limpiarDatosArticulo` - Limpia resguardante
   - ✅ `generateBajaPDF` - Genera PDF de baja

### ⚠️ Estado de Botones de Eliminación

**Actualmente DESHABILITADOS:**
```typescript
<ResguardoInfoPanel
  // ...
  disableDelete={true}  // ⚠️ DESHABILITADO
/>

<ArticulosListPanel
  // ...
  disableDelete={true}  // ⚠️ DESHABILITADO
/>
```

### 🔧 Para Habilitar la Funcionalidad

**Cambiar a:**
```typescript
<ResguardoInfoPanel
  // ...
  disableDelete={false}  // ✅ HABILITADO
/>

<ArticulosListPanel
  // ...
  disableDelete={false}  // ✅ HABILITADO
/>
```

---

## Consideraciones Importantes

### 1. Transaccionalidad
⚠️ **Actualmente NO hay transacciones:**
- Si falla algún paso, los pasos anteriores ya se ejecutaron
- Puede quedar en estado inconsistente

**Recomendación:** Implementar transacciones o rollback manual

### 2. Permisos
- Solo usuarios con rol adecuado deben poder dar de baja
- Verificar permisos antes de ejecutar operaciones

### 3. Auditoría
✅ **Se mantiene historial completo:**
- Tabla `resguardos_bajas` guarda todos los datos
- Se puede consultar historial de bajas
- Se genera PDF como evidencia

### 4. Reversión
❌ **No hay función de reversión:**
- Una vez dada de baja, no se puede deshacer
- El bien queda libre para nuevo resguardo
- El historial permanece en `resguardos_bajas`

---

## Próximos Pasos

1. **Habilitar botones de eliminación:**
   - Cambiar `disableDelete={false}` en ambos paneles

2. **Probar flujo completo:**
   - Baja individual
   - Baja seleccionada
   - Baja total

3. **Verificar:**
   - Generación de folios de baja
   - Movimiento a tabla de bajas
   - Limpieza de datos en inventario
   - Generación de PDF

4. **Considerar mejoras:**
   - Implementar transacciones
   - Agregar confirmación adicional
   - Mejorar manejo de errores
   - Agregar logs de auditoría

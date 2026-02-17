# Diseño: Eliminación de Columna Resguardante de Tablas de Muebles

## Visión General

Este diseño detalla cómo eliminar la columna `resguardante` de las interfaces de tipos de muebles y de los formularios de edición, manteniendo la visualización del campo obtenido desde la tabla `resguardos` mediante JOIN.

## Arquitectura de Datos

### Flujo de Datos Actual (Correcto)

```
┌─────────────────┐
│  Tabla Muebles  │
│  (sin resguard.)│
└────────┬────────┘
         │
         │ id (UUID)
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ Hooks Indexación│─────▶│  Tabla Resguardos│
│  (JOIN)         │      │  (con resguardante)│
└────────┬────────┘      └──────────────────┘
         │
         │ Mueble + resguardante
         │
         ▼
┌─────────────────┐
│  Componentes UI │
│  (solo lectura) │
└─────────────────┘
```

### Estructura de Datos

**Mueble (sin resguardante):**
```typescript
interface MuebleNoListado {
  id: string;
  id_inv: string;
  // ... otros campos
  // NO incluye resguardante
}
```

**Resguardo (con resguardante):**
```typescript
interface Resguardo {
  id: string;
  folio: string;
  id_mueble: string;
  resguardante: string;  // ✓ Mantener aquí
  // ... otros campos
}
```

**ResguardoDetalle (para UI):**
```typescript
interface ResguardoDetalle {
  folio: string;
  usufinal: string | null;  // Este es el resguardante
  // ... otros campos
}
```

## Componentes Afectados

### 1. Tipos de Indexación (src/types/indexation.ts)

**Cambios:**
- Eliminar `resguardante?: string | null;` de `MuebleNoListado`
- Eliminar `resguardante: string | null;` de `MuebleINEA`
- Eliminar `resguardante: string | null;` de `MuebleITEA`
- Mantener `resguardante: string;` en `Resguardo`

**Impacto:** Todos los componentes que usan estos tipos necesitarán ajustes

### 2. Tipos Locales de Vistas Obsoletos

**Archivos:**
- `src/components/consultas/inea/obsoletos/types.ts`
- `src/components/consultas/itea/obsoletos/types.ts`

**Cambios:**
- Eliminar `resguardante: string | null;` de la interfaz `Mueble`/`MuebleITEA`

### 3. DetailPanel - EditMode

**Ubicaciones:**
- `src/components/consultas/no-listado/components/DetailPanel.tsx`
- `src/components/consultas/inea/components/DetailPanel.tsx`
- `src/components/consultas/inea/obsoletos/components/DetailPanel.tsx`
- `src/components/consultas/itea/components/DetailPanel.tsx`
- `src/components/consultas/itea/obsoletos/components/DetailPanel.tsx`

**Cambios:**
```typescript
// ELIMINAR este bloque completo:
{/* Usuario Final */}
<div className="form-group">
  <label>Usuario Final</label>
  <input
    type="text"
    value={editFormData?.resguardante || ''}
    onChange={(e) => onFormChange(e, 'resguardante')}
    disabled={hasActiveResguardo}
    // ...
  />
</div>
```

**Razón:** El campo no debe ser editable en ninguna circunstancia

### 4. DetailPanel - ViewMode

**Cambios:**
```typescript
// ANTES (incorrecto):
<DetailCard
  label="Usuario Final"
  value={selectedItem.resguardante || 'No especificado'}
  isDarkMode={isDarkMode}
/>

// DESPUÉS (correcto):
{detalleResguardo?.usufinal && (
  <DetailCard
    label="Resguardante"
    value={detalleResguardo.usufinal}
    isDarkMode={isDarkMode}
  />
)}
{!detalleResguardo?.usufinal && folio && (
  <DetailCard
    label="Resguardante"
    value="Sin Resguardante"
    isDarkMode={isDarkMode}
  />
)}
```

**Lógica de Visualización:**
1. Si existe `detalleResguardo.usufinal` → Mostrar el valor
2. Si existe `folio` pero no `usufinal` → Mostrar "Sin Resguardante"
3. Si no existe `folio` → No mostrar el campo

### 5. useItemEdit Hook

**Ubicaciones:**
- `src/components/consultas/no-listado/hooks/useItemEdit.ts`
- `src/components/consultas/inea/hooks/useItemEdit.ts`
- `src/components/consultas/inea/obsoletos/hooks/useItemEdit.ts`
- `src/components/consultas/itea/hooks/useItemEdit.ts`
- `src/components/consultas/itea/obsoletos/hooks/useItemEdit.ts`

**Cambios en `saveChanges`:**
```typescript
// ANTES:
const { area, directorio, ...dbFields } = editFormData;

// DESPUÉS:
const { area, directorio, resguardante, ...dbFields } = editFormData;
```

**Cambios en `handleEditFormChange`:**
```typescript
// ELIMINAR este case:
case 'resguardante':
  newData[field] = value || null;
  break;
```

### 6. useSearchAndFilters Hook

**Ubicaciones:**
- `src/components/consultas/no-listado/hooks/useSearchAndFilters.ts`
- `src/components/consultas/inea/hooks/useSearchAndFilters.ts`
- `src/components/consultas/inea/obsoletos/hooks/useSearchAndFilters.ts`
- `src/components/consultas/itea/hooks/useSearchAndFilters.ts`
- `src/components/consultas/itea/obsoletos/hooks/useSearchAndFilters.ts`

**Cambios:**
```typescript
// Mantener la búsqueda por resguardante
case 'resguardante':
  // Buscar en el campo resguardante obtenido del JOIN
  filtered = filtered.filter(m => 
    m.resguardante?.toLowerCase().includes(term.toLowerCase())
  );
  break;
```

**Nota:** Los hooks de indexación ya proporcionan el campo `resguardante` desde el JOIN, por lo que la búsqueda seguirá funcionando.

## Hooks de Indexación

### Comportamiento Actual (Mantener)

Todos los hooks de indexación ya implementan correctamente el JOIN con resguardos:

```typescript
// Ejemplo de useNoListadoIndexation.ts
const { data: resguardos } = await supabase
  .from('resguardos')
  .select('id_mueble, resguardante, f_resguardo')
  .in('id_mueble', muebleIds)
  .eq('origen', 'NO_LISTADO');

// Mapear resguardante a cada mueble
const transformed = muebles.map(item => ({
  ...item,
  resguardante: resguardoMap.get(item.id) || null
}));
```

**Acción:** NO modificar estos hooks, ya funcionan correctamente.

## Flujo de Edición

### Antes (Problemático)

```
Usuario edita mueble
  ↓
Incluye resguardante en PATCH
  ↓
Error 400: Columna no existe
```

### Después (Correcto)

```
Usuario edita mueble
  ↓
Excluye resguardante del PATCH
  ↓
Actualización exitosa
  ↓
Refetch con JOIN para obtener resguardante actualizado
```

## Casos de Uso

### Caso 1: Ver Mueble con Resguardo Activo

**Flujo:**
1. Usuario selecciona un mueble
2. Sistema obtiene `folio` desde `foliosResguardo[mueble.id_inv]`
3. Sistema obtiene `detalleResguardo` desde `resguardoDetalles[folio]`
4. UI muestra `detalleResguardo.usufinal` como "Resguardante"

**Resultado:** Campo visible con el nombre del resguardante

### Caso 2: Ver Mueble sin Resguardo

**Flujo:**
1. Usuario selecciona un mueble
2. Sistema no encuentra `folio` en `foliosResguardo`
3. UI no muestra el campo "Resguardante"

**Resultado:** Campo no visible

### Caso 3: Editar Mueble

**Flujo:**
1. Usuario hace clic en "Editar"
2. UI muestra formulario sin campo "Usuario Final/Resguardante"
3. Usuario modifica otros campos
4. Usuario guarda cambios
5. Sistema envía PATCH sin incluir `resguardante`
6. Actualización exitosa

**Resultado:** Mueble actualizado sin errores

### Caso 4: Buscar por Resguardante

**Flujo:**
1. Usuario escribe nombre en búsqueda
2. Sistema detecta tipo "resguardante"
3. Sistema filtra muebles donde `mueble.resguardante` (del JOIN) coincide
4. UI muestra resultados

**Resultado:** Búsqueda funcional

## Validaciones

### Validaciones a Eliminar

- ❌ Validación de formato de resguardante en formularios
- ❌ Validación de longitud de resguardante
- ❌ Validación de caracteres permitidos en resguardante

### Validaciones a Mantener

- ✓ Validación de relación director-área
- ✓ Validación de campos requeridos (excepto resguardante)
- ✓ Validación de formato de imagen

## Manejo de Errores

### Errores Eliminados

- Error 400 al intentar actualizar columna inexistente

### Errores a Manejar

- Error al obtener resguardos (mostrar "Sin Resguardante")
- Error al cargar detalles de resguardo (no mostrar campo)

## Consideraciones de UI/UX

### Etiquetas

- En ViewMode: "Resguardante" (no "Usuario Final")
- Consistencia en todas las vistas

### Iconos

- Usar `User` de lucide-react para el campo resguardante
- Mantener consistencia visual con otros campos

### Estados

1. **Con resguardo activo y resguardante:** Mostrar nombre
2. **Con resguardo activo sin resguardante:** Mostrar "Sin Resguardante"
3. **Sin resguardo activo:** No mostrar campo

## Impacto en Otras Funcionalidades

### Sin Impacto

- ✓ Creación de resguardos (usa tabla resguardos)
- ✓ Edición de resguardos (usa tabla resguardos)
- ✓ Reportes (obtienen datos de resguardos)
- ✓ Exportación (usa datos ya transformados)

### Con Impacto Mínimo

- Búsqueda: Continúa funcionando con datos del JOIN
- Filtros: Continúan funcionando con datos del JOIN

## Migración de Datos

**No se requiere migración de base de datos** porque:
1. La columna `resguardante` ya no existe en las tablas de muebles
2. Los datos están correctamente almacenados en la tabla `resguardos`
3. Los hooks de indexación ya obtienen los datos correctamente

## Testing

### Casos de Prueba

1. **Visualización:**
   - Ver mueble con resguardo activo → Debe mostrar resguardante
   - Ver mueble sin resguardo → No debe mostrar campo
   - Ver mueble con resguardo sin usufinal → Debe mostrar "Sin Resguardante"

2. **Edición:**
   - Editar mueble → No debe mostrar campo resguardante
   - Guardar cambios → No debe enviar resguardante en PATCH
   - Guardar cambios → No debe generar error 400

3. **Búsqueda:**
   - Buscar por resguardante → Debe encontrar muebles
   - Filtrar por resguardante → Debe funcionar correctamente

4. **Tipos:**
   - Compilar TypeScript → No debe mostrar errores
   - Autocompletado → No debe sugerir resguardante en muebles

## Rollback

Si es necesario revertir los cambios:

1. Restaurar campo `resguardante` en interfaces de tipos
2. Restaurar campo de edición en DetailPanel
3. Restaurar lógica en useItemEdit

**Nota:** No es necesario rollback de base de datos porque no se modificó.

## Documentación

### Actualizar

- Comentarios en código sobre fuente de resguardante
- Documentación de tipos TypeScript
- Guías de desarrollo sobre edición de muebles

### Crear

- Documento explicando por qué resguardante viene de resguardos
- Diagrama de flujo de datos actualizado

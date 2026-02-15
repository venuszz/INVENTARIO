# Migración del Formulario de Registro a Campos Relacionales

## Fecha
15 de febrero de 2026

## Cambios Realizados

### 1. Eliminación del Campo `resguardante`

El campo `resguardante` ha sido eliminado del formulario de registro de bienes, ya que este dato ahora se obtiene automáticamente de la tabla relacional `resguardos`.

**Archivos modificados:**
- `src/components/inventario/registro/types.ts` - Eliminado de interface `FormData`
- `src/components/inventario/registro/hooks/useFormData.ts` - Eliminado de `initialFormData`
- `src/components/inventario/registro/steps/Step2LocationStatus.tsx` - Eliminado campo de UI "Usuario Final"

**Razón:** El resguardante se determina automáticamente cuando se crea un resguardo en la tabla `resguardos`, no debe ser un campo editable durante el registro inicial del bien.

### 2. Migración a Campos Relacionales

El formulario ahora guarda correctamente usando los campos relacionales en lugar de los campos de texto plano legacy.

**Cambios en `RegistroBienesForm.tsx`:**

#### Antes (campos legacy):
```typescript
const dataToSave = {
  ...formData,
  area: formData.area.toUpperCase(),
  usufinal: formData.usufinal.toUpperCase(),
  resguardante: formData.resguardante.toUpperCase(),
  // ... otros campos
};
```

#### Después (campos relacionales):
```typescript
// Buscar id_area desde el nombre
let id_area: number | null = null;
if (formData.area) {
  const areaResponse = await fetch(
    `/api/supabase-proxy?target=${encodeURIComponent(`/rest/v1/areas?nombre=eq.${formData.area.toUpperCase()}&select=id_area`)}`,
    { credentials: 'include' }
  );
  if (areaResponse.ok) {
    const areas = await areaResponse.json();
    if (areas && areas.length > 0) {
      id_area = areas[0].id_area;
    }
  }
}

// Buscar id_directorio desde el nombre
let id_directorio: number | null = null;
if (formData.usufinal) {
  const directorResponse = await fetch(
    `/api/supabase-proxy?target=${encodeURIComponent(`/rest/v1/directorio?nombre=eq.${formData.usufinal.toUpperCase()}&select=id_directorio`)}`,
    { credentials: 'include' }
  );
  if (directorResponse.ok) {
    const directors = await directorResponse.json();
    if (directors && directors.length > 0) {
      id_directorio = directors[0].id_directorio;
    }
  }
}

const dataToSave = {
  // ... campos básicos
  id_area: id_area,
  id_directorio: id_directorio
  // NO incluye area, usufinal, ni resguardante como texto
};
```

## Campos Relacionales Utilizados

| Campo Legacy | Campo Relacional | Tabla de Referencia |
|-------------|------------------|---------------------|
| `area` (texto) | `id_area` (integer) | `areas` |
| `usufinal` (texto) | `id_directorio` (integer) | `directorio` |
| `resguardante` (texto) | ❌ Eliminado | Se obtiene de `resguardos` |

## Flujo de Guardado

1. Usuario completa el formulario seleccionando área y director desde los dropdowns
2. Al enviar el formulario:
   - Se busca el `id_area` correspondiente al nombre del área seleccionada
   - Se busca el `id_directorio` correspondiente al nombre del director seleccionado
   - Se guarda el registro con los IDs relacionales
3. El campo `resguardante` NO se guarda, ya que se determinará cuando se cree un resguardo

## Validación

✅ Build exitoso: `npm run build` completado sin errores
✅ TypeScript: Sin errores de tipo
✅ Campos relacionales: Correctamente implementados
✅ Campo resguardante: Eliminado completamente

## Notas Importantes

- Los campos `area` y `usufinal` aún existen en el `FormData` para mantener la UI funcionando, pero NO se guardan en la base de datos
- Solo se guardan `id_area` e `id_directorio` en las tablas de muebles
- El campo `resguardante` ya no existe en ninguna parte del formulario
- Esta migración es consistente con la migración realizada en los hooks de indexación

## Archivos Modificados

1. `src/components/inventario/registro/types.ts`
2. `src/components/inventario/registro/hooks/useFormData.ts`
3. `src/components/inventario/registro/steps/Step2LocationStatus.tsx`
4. `src/components/inventario/registro/RegistroBienesForm.tsx`

## Próximos Pasos

- Verificar que el formulario funciona correctamente en producción
- Confirmar que los registros se crean con los IDs relacionales correctos
- Validar que no hay errores al guardar en las tres tablas (muebles, mueblesitea, mueblestlaxcala)

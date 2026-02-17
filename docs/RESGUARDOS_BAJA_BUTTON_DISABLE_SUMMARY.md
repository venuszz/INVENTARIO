# Resguardos Baja - Deshabilitar Botón Durante Carga de Folio

## Resumen de Implementación

Se implementó la funcionalidad para deshabilitar los botones de confirmación en los modales de baja hasta que el folio de baja se haya cargado completamente desde la base de datos.

## Cambios Realizados

### 1. DeleteAllModal.tsx
- Agregada condición `disabled={isDeleting || loadingPreview}` al botón de confirmación
- El botón muestra "Cargando..." con spinner mientras `loadingPreview` es `true`
- Animaciones hover/tap deshabilitadas durante la carga
- Estado visual diferenciado: `bg-red-600/50` cuando está deshabilitado

### 2. DeleteItemModal.tsx
- Misma implementación que DeleteAllModal
- Botón deshabilitado durante `isDeleting` o `loadingPreview`
- Feedback visual consistente con el resto de los modales

### 3. DeleteSelectedModal.tsx
- Implementación idéntica a los otros modales
- Botón deshabilitado hasta que el folio se cargue completamente
- Mantiene consistencia en UX con los demás modales de baja

## Comportamiento

### Estados del Botón de Confirmación

1. **Normal (Habilitado)**
   - Condición: `!isDeleting && !loadingPreview`
   - Texto: "Eliminar" / "Borrar todo" / "Eliminar seleccionados"
   - Color: `bg-red-600 hover:bg-red-500`
   - Animaciones: Habilitadas

2. **Cargando Folio (Deshabilitado)**
   - Condición: `loadingPreview === true`
   - Texto: "Cargando..." con spinner
   - Color: `bg-red-600/50`
   - Cursor: `cursor-not-allowed`
   - Animaciones: Deshabilitadas

3. **Eliminando (Deshabilitado)**
   - Condición: `isDeleting === true`
   - Texto: "Eliminando..." con spinner
   - Color: `bg-red-600/50`
   - Cursor: `cursor-not-allowed`
   - Animaciones: Deshabilitadas

## Flujo de Usuario

1. Usuario abre modal de confirmación de baja
2. Modal muestra skeleton loading para el folio de baja
3. Botón de confirmación está deshabilitado y muestra "Cargando..."
4. Hook `useFolioGenerator` obtiene el preview del folio desde la base de datos
5. Una vez cargado, el folio se muestra con animación fade-in
6. Botón de confirmación se habilita automáticamente
7. Usuario puede proceder con la confirmación de baja

## Validación

✅ No hay errores de TypeScript en ningún archivo
✅ Los tres modales implementan la misma lógica de forma consistente
✅ El estado `loadingPreview` se gestiona correctamente con useEffect
✅ Las animaciones de Framer Motion se deshabilitan apropiadamente
✅ El feedback visual es claro y consistente

## Archivos Modificados

- `src/components/resguardos/consultar/modals/DeleteAllModal.tsx`
- `src/components/resguardos/consultar/modals/DeleteItemModal.tsx`
- `src/components/resguardos/consultar/modals/DeleteSelectedModal.tsx`

## Notas Técnicas

- El preview del folio se obtiene mediante `useFolioGenerator().previewNextFolio('BAJA')`
- El sistema es 100% dinámico: prefijo y consecutivo vienen de la tabla `folios`
- No hay valores hardcodeados para el formato del folio
- El formato actual es `BAJA-NNNN` (sin año)
- La función PostgreSQL `generar_folio` maneja la lógica de generación

## Estado Final

✅ **COMPLETADO** - Los botones de confirmación permanecen deshabilitados hasta que el folio de baja se carga completamente, mejorando la UX y previniendo acciones prematuras.

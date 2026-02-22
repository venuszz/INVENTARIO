# Directorio Transfer - Flow and Cache Fixes

## Issues Fixed

### 1. Modal se queda trabado en loader después de aprobar
**Problema**: El modal de confirmación manejaba su propio estado de éxito y no comunicaba correctamente con el componente padre.

**Solución**: Simplificamos el `handleConfirm` en `TransferConfirmationModal` para que solo ejecute la función `onConfirm` sin manejar estados de éxito/error internamente. El componente padre (`TransferMode`) ahora maneja completamente el flujo.

### 2. No hay estado de success visible
**Problema**: El modal mostraba un estado de éxito pero desaparecía inmediatamente.

**Solución**: Ahora el flujo es:
1. Modal de confirmación → Ejecuta transferencia
2. Si éxito → Cierra modal y muestra `CompletionScreen` con animación
3. `CompletionScreen` muestra resumen detallado con desglose por tabla (INEA, ITEA, No Listado)

### 3. No vuelve al paso 1 después del éxito
**Problema**: Después de completar la transferencia, salía del modo de transferencia completamente.

**Solución**: 
- Agregamos función `reset()` al hook `useTransferMode`
- `CompletionScreen` ahora tiene botón "Nueva Transferencia" que resetea el estado
- Auto-reset después de 3 segundos para permitir nuevas transferencias
- El usuario permanece en el modo de transferencia, listo para hacer otra

### 4. Indexación duplicada
**Problema**: La invalidación de caché se ejecutaba dos veces:
1. En `useTransferActions` después de cada transferencia
2. En `TransferMode` después de recibir el resultado

**Solución**:
- Removimos la invalidación automática de `useTransferActions`
- Exponemos `invalidateCaches` como función pública del hook
- `TransferMode` llama a `invalidateCaches` una sola vez después del éxito
- Esto da control total al componente padre sobre cuándo invalidar

## Cambios Implementados

### 1. `useTransferActions.ts`
```typescript
// ANTES: Invalidaba caché automáticamente
if (result.success) {
  await invalidateCaches();
}
return result;

// DESPUÉS: Solo retorna el resultado
return result;

// Y expone invalidateCaches públicamente
return {
  transferCompleteArea,
  transferPartialBienes,
  checkResguardos,
  invalidateCaches, // ← NUEVO
  isExecuting,
  error,
};
```

### 2. `TransferConfirmationModal.tsx`
```typescript
// ANTES: Manejaba su propio estado de éxito
const handleConfirm = async () => {
  try {
    await onConfirm();
    setState('success');
    setTimeout(() => onCancel(), 2000);
  } catch (err) {
    setState('error');
  }
};

// DESPUÉS: Solo ejecuta y deja que el padre maneje
const handleConfirm = async () => {
  await onConfirm();
};
```

### 3. `CompletionScreen.tsx`
```typescript
// ANTES: Salía del modo de transferencia
interface CompletionScreenProps {
  onExit: () => void; // Salía completamente
}

// DESPUÉS: Resetea para nueva transferencia
interface CompletionScreenProps {
  onReset: () => void; // Vuelve al paso 1
}

// Botón actualizado
<button onClick={onReset}>
  Nueva Transferencia
</button>

// Mensaje actualizado
"Volviendo al inicio en 3 segundos..."
```

### 4. `useTransferMode.ts`
```typescript
// NUEVO: Función reset agregada
const reset = useCallback(() => {
  setMode('selecting_source');
  setSourceDirector(null);
  setTargetDirector(null);
  setSelectedAreas([]);
  setSelectedBienes([]);
  setTransferType(null);
  setTargetAreaId(null);
  setValidationErrors([]);
}, []);

// Exportada en el return
return {
  // ... otros métodos
  reset, // ← NUEVO
};
```

### 5. `TransferMode.tsx`
```typescript
// ANTES: Múltiples hooks de indexación
const { reindex: reindexAdmin } = useAdminIndexation();
const { reindex: reindexInea } = useIneaIndexation();
const { reindex: reindexItea } = useIteaIndexation();
const { reindex: reindexNoListado } = useNoListadoIndexation();

// Invalidaba con Promise.all
await Promise.all([
  reindexAdmin(),
  reindexInea(),
  reindexItea(),
  reindexNoListado(),
]);

// DESPUÉS: Usa función del hook
await transferActions.invalidateCaches();

// CompletionScreen con reset
<CompletionScreen
  onReset={() => {
    setTransferResult(null);
    setShowPreview(false);
    transferMode.reset();
  }}
/>
```

## Flujo Completo Actualizado

1. **Selección de Origen** (Panel 1)
   - Usuario selecciona director origen
   - Usuario selecciona área
   - Usuario selecciona bienes (opcional)

2. **Selección de Bienes** (Panel 2)
   - Muestra bienes del área seleccionada
   - Usuario puede seleccionar/deseleccionar bienes
   - Botón "Continuar" para ir al preview

3. **Preview y Destino** (Panel 3)
   - Muestra resumen de la transferencia
   - Usuario selecciona director destino
   - Usuario selecciona área destino (o crea nueva)
   - Botón "Confirmar Transferencia"

4. **Modal de Confirmación**
   - Muestra detalles completos de la transferencia
   - Advertencia de operación irreversible
   - Botones "Cancelar" y "Confirmar"
   - Estado "Ejecutando..." durante la transferencia

5. **Pantalla de Éxito** (NUEVO)
   - Animación de éxito con ícono
   - Resumen: "X bienes transferidos exitosamente"
   - Desglose por tabla (INEA, ITEA, No Listado)
   - Botón "Nueva Transferencia"
   - Auto-reset en 3 segundos

6. **Vuelta al Paso 1** (NUEVO)
   - Estado limpio, listo para nueva transferencia
   - Datos actualizados (caché invalidado)
   - Usuario permanece en modo de transferencia

## Beneficios

1. **Flujo más claro**: El usuario ve claramente el resultado de su operación
2. **Mejor UX**: No hay estados confusos o loaders infinitos
3. **Eficiencia**: Permite hacer múltiples transferencias sin salir del modo
4. **Performance**: Invalidación de caché controlada (una sola vez)
5. **Feedback visual**: Pantalla de éxito con desglose detallado

## Testing

- ✅ Build pasa sin errores
- ✅ TypeScript sin errores
- ✅ Flujo completo implementado
- ✅ Invalidación de caché optimizada

## Archivos Modificados

1. `src/components/admin/directorio/hooks/useTransferActions.ts`
2. `src/components/admin/directorio/hooks/useTransferMode.ts`
3. `src/components/admin/directorio/components/transfer/TransferMode.tsx`
4. `src/components/admin/directorio/components/transfer/CompletionScreen.tsx`
5. `src/components/admin/directorio/modals/TransferConfirmationModal.tsx`

## Próximos Pasos

El usuario debe probar en el navegador para confirmar:
1. ✅ La transferencia se ejecuta correctamente
2. ✅ El modal no se queda trabado
3. ✅ La pantalla de éxito se muestra correctamente
4. ✅ El auto-reset funciona después de 3 segundos
5. ✅ Los datos se actualizan correctamente (una sola indexación)
6. ✅ Se puede hacer otra transferencia inmediatamente

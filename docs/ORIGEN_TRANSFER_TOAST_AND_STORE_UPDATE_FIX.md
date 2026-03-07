# Corrección de Toast y Manejo de Realtime en Transferencia de Origen

## Fecha
2026-03-06

## Problema

Al transferir un registro entre orígenes (INEA, ITEA, No Listado), se presentaban dos problemas:

1. **Toast con color verde**: El toast de éxito mostraba un fondo verde, diferente al diseño blanco y negro usado en otras operaciones de edición
2. **Actualización manual de stores causaba conflictos**: Se intentaba actualizar los stores manualmente, pero esto causaba conflictos con el realtime que también detectaba los cambios (DELETE e INSERT), resultando en:
   - Toasts duplicados (uno manual, dos del realtime)
   - Posible reindexación innecesaria
   - Inconsistencias temporales en los stores

## Solución Implementada

### 1. Toast Blanco y Negro

Se modificó el toast de éxito para usar el mismo diseño que las operaciones de edición:

**Antes:**
```typescript
sileo.show({
  title: 'Registro transferido exitosamente',
  description: `Transferido a ${ORIGEN_LABELS[targetOrigen]} - ID: ${idInventario}`,
  duration: 4000,
  fill: '#10b981', // Verde
  position: 'top-right',
  styles: {
    title: '!text-white',
    description: '!text-white/70',
  },
});
```

**Después:**
```typescript
sileo.show({
  title: 'Registro transferido',
  description: `Transferido a ${ORIGEN_LABELS[targetOrigen]} - ID: ${idInventario}`,
  duration: 4000,
  position: 'top-right',
  styles: {
    title: '!text-black dark:!text-white',
    description: '!text-black/60 dark:!text-white/60',
  },
});
```

### 2. Eliminación de Actualización Manual de Stores

Se eliminó completamente la actualización manual de stores, dejando que el realtime maneje todo automáticamente, igual que cuando se agrega un bien en el registro.

**Antes:**
```typescript
// Actualizar stores localmente (sin reindexar)
if (data.new_record_id) {
  await updateStores(recordId, targetOrigen, data.new_record_id);
}
```

**Después:**
```typescript
// No actualizar stores manualmente - dejar que el realtime lo maneje
// El realtime detectará el DELETE y el INSERT automáticamente
```

### 3. Simplificación del Hook

Se eliminaron:
- Importaciones de stores (useIneaStore, useIteaStore, useNoListadoStore)
- Función `updateStores` completa
- Lógica de actualización manual de stores

## Archivos Modificados

- `src/hooks/useOrigenTransfer.ts`
  - Eliminadas importaciones de stores
  - Eliminada función `updateStores`
  - Modificado toast de éxito a diseño blanco y negro
  - Simplificada lógica de transferencia para confiar completamente en el realtime

## Beneficios

1. **Consistencia visual**: El toast ahora tiene el mismo diseño que otras operaciones de edición
2. **Sin conflictos con realtime**: El realtime maneja todos los cambios automáticamente
3. **Comportamiento consistente**: Funciona exactamente igual que cuando se agrega un bien en el registro
4. **Código más simple**: Menos lógica de sincronización manual
5. **Sin toasts duplicados**: Solo aparece el toast de éxito de la transferencia

## Comportamiento Esperado

Después de transferir un registro:

1. Se muestra un toast blanco y negro con el mensaje de éxito
2. El realtime detecta el DELETE en la tabla origen
3. El realtime detecta el INSERT en la tabla destino
4. Los stores se actualizan automáticamente vía realtime
5. El registro desaparece de la vista origen
6. El registro aparece en la vista destino (si está abierta)
7. No se dispara reindexación manual

## Flujo de Datos

```
Usuario confirma transferencia
    ↓
Hook llama a API /api/inventario/transfer-origen
    ↓
API ejecuta transacción:
  1. INSERT en tabla destino
  2. Registra cambio en cambios_inventario
  3. DELETE en tabla origen
    ↓
API retorna éxito
    ↓
Hook muestra toast de éxito
    ↓
Realtime detecta cambios en DB
    ↓
Hooks de indexación actualizan stores automáticamente
    ↓
UI se actualiza reactivamente
```

## Comparación con Registro de Bienes

El comportamiento ahora es idéntico al registro de bienes:

**Registro de Bienes:**
1. Usuario guarda bien
2. API inserta en DB
3. Retorna éxito
4. Realtime detecta INSERT
5. Store se actualiza automáticamente

**Transferencia de Origen:**
1. Usuario confirma transferencia
2. API ejecuta DELETE + INSERT
3. Retorna éxito
4. Realtime detecta DELETE + INSERT
5. Stores se actualizan automáticamente

## Notas Técnicas

- El realtime está configurado para detectar cambios en todas las tablas de inventario
- Los hooks de indexación (useIneaIndexation, useIteaIndexation, useNoListadoIndexation) manejan los eventos de realtime
- No es necesario actualizar manualmente los stores - el realtime lo hace automáticamente
- Los toasts del realtime (si están configurados) mostrarán los cambios detectados

## Testing

Para probar la funcionalidad:

1. Abrir una consulta (INEA, ITEA o No Listado)
2. Seleccionar un registro y hacer clic en "Transferir Origen"
3. Seleccionar el origen destino
4. Confirmar la transferencia
5. Verificar que:
   - Aparece UN solo toast con diseño blanco y negro
   - El registro desaparece de la vista actual (vía realtime)
   - No se muestra el indicador de reindexación
   - El registro aparece en el origen destino (si se navega a esa vista)
   - No hay toasts duplicados

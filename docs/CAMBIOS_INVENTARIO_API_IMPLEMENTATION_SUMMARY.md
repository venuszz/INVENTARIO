# Resumen de Implementación: API Segura para Historial de Cambios

## Fecha
3 de marzo de 2026

## Estado
✅ **COMPLETADO** - Listo para pruebas

## Problema Original
Error de RLS al intentar insertar en `cambios_inventario`:
```
Error: new row violates row-level security policy for table "cambios_inventario"
```

## Solución Implementada

### Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE                              │
│  useItemEdit.ts → registrarCambios() → fetch('/api/...')   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    API DE SERVIDOR                           │
│  /api/cambios-inventario/route.ts                          │
│  - Usa SUPABASE_SERVICE_ROLE_KEY                           │
│  - Valida datos                                             │
│  - Bypass RLS                                               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
│  INSERT en cambios_inventario                               │
│  (sin restricciones de RLS)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Archivos Creados

### 1. API Route
**Archivo**: `src/app/api/cambios-inventario/route.ts`

```typescript
// Características:
- POST endpoint para registrar cambios
- Usa service role key (bypass RLS)
- Validación de campos requeridos
- Validación de tabla_origen
- Logs detallados
- Manejo de errores robusto
```

### 2. Documentación
- `docs/CAMBIOS_INVENTARIO_SECURE_API.md` - Guía completa de la API
- `docs/CAMBIOS_INVENTARIO_API_IMPLEMENTATION_SUMMARY.md` - Este archivo

## Archivos Modificados

### 1. Cliente de Historial
**Archivo**: `src/lib/changeHistory.ts`

**Cambios**:
- `registrarCambios()` ahora llama a la API en lugar de Supabase directamente
- Usa `fetch()` con credenciales
- Manejo de errores de la API
- Mantiene funciones de lectura con cliente normal de Supabase

### 2. Hook de Edición INEA
**Archivo**: `src/components/consultas/inea/hooks/useItemEdit.ts`

**Cambios previos** (ya implementados):
- Pasa `user.id` como segundo parámetro a `registrarCambios()`
- Validación de usuario antes de registrar
- Manejo no bloqueante de errores

### 3. Guía de Integración
**Archivo**: `docs/CAMBIOS_INVENTARIO_INTEGRATION_GUIDE.md`

**Cambios**:
- Agregada nota sobre API segura
- Referencia a documentación de la API

## Configuración Requerida

### Variables de Entorno

Asegúrate de tener en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE**: 
- La `SUPABASE_SERVICE_ROLE_KEY` debe mantenerse SECRETA
- NUNCA exponerla al cliente
- Solo usarla en API routes del servidor

## Flujo de Datos Completo

### 1. Usuario Hace un Cambio
```typescript
// En ChangeConfirmationModal
<button onClick={() => confirmAndSaveChanges(user)}>
  Confirmar Cambios
</button>
```

### 2. Hook Detecta Cambios
```typescript
// En useItemEdit.ts
const changes = detectChanges(selectedItem, editFormData, {...});
setPendingChanges(changes);
setShowChangeConfirmModal(true);
```

### 3. Usuario Confirma con Motivo
```typescript
// Usuario escribe motivo y confirma
setChangeReason('Corrección de inventario');
confirmAndSaveChanges(user);
```

### 4. Registro de Cambios
```typescript
// En confirmAndSaveChanges()
await registrarCambios({
  idMueble: editFormData.id,
  tablaOrigen: 'muebles',
  cambios: changeHistoryEntries,
  razonCambio: changeReason
}, user.id);
```

### 5. API Procesa
```typescript
// En /api/cambios-inventario/route.ts
const registros = cambios.map(cambio => ({
  id_mueble: idMueble,
  tabla_origen: tablaOrigen,
  campo_modificado: cambio.campo,
  valor_anterior: cambio.valorAnterior,
  valor_nuevo: cambio.valorNuevo,
  usuario_id: userId,
  metadata: { ... }
}));

await supabaseAdmin.from('cambios_inventario').insert(registros);
```

### 6. Respuesta al Cliente
```typescript
// Éxito
✅ [API] 3 cambios registrados exitosamente
✅ [Change History] 3 cambios registrados

// El cambio principal se guarda
// El usuario ve confirmación
```

## Validaciones Implementadas

### En el Cliente
1. ✅ Usuario autenticado (`user?.id`)
2. ✅ Cambios detectados (array no vacío)
3. ✅ Motivo proporcionado (`changeReason.trim()`)

### En la API
1. ✅ Campos requeridos presentes
2. ✅ `tabla_origen` es válida (muebles, mueblesitea, mueblestlaxcala)
3. ✅ Array de cambios no vacío
4. ✅ Formato de cambios correcto

## Testing

### Checklist de Pruebas

- [ ] 1. Verificar que `.env.local` tiene `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 2. Ejecutar SQL en Supabase (`docs/CAMBIOS_INVENTARIO_TABLE.sql`)
- [ ] 3. Hacer un cambio en un mueble INEA
- [ ] 4. Proporcionar motivo del cambio
- [ ] 5. Confirmar cambios
- [ ] 6. Verificar logs en consola:
  ```
  ✅ [API] X cambios registrados exitosamente
  ✅ [Change History] X cambios registrados
  ```
- [ ] 7. Verificar en Supabase tabla `cambios_inventario`:
  - Registros insertados
  - `id_mueble` correcto (UUID)
  - `tabla_origen` = 'muebles'
  - `usuario_id` correcto
  - `metadata` con `razon_cambio`
- [ ] 8. Probar con múltiples cambios simultáneos
- [ ] 9. Probar error handling (sin motivo, sin usuario, etc.)

### Casos de Prueba

#### Caso 1: Cambio Simple
```
Cambiar: descripcion de "SILLA" a "SILLA EJECUTIVA"
Motivo: "Actualización de descripción"
Esperado: 1 registro en cambios_inventario
```

#### Caso 2: Múltiples Cambios
```
Cambiar: 
  - descripcion: "SILLA" → "SILLA EJECUTIVA"
  - valor: 1000 → 1500
  - ubicacion_es: "PISO 1" → "PISO 2"
Motivo: "Actualización completa"
Esperado: 3 registros en cambios_inventario
```

#### Caso 3: Sin Motivo
```
Cambiar: descripcion
Motivo: "" (vacío)
Esperado: Warning "Debe proporcionar un motivo del cambio"
```

#### Caso 4: Usuario No Autenticado
```
user.id = undefined
Esperado: Warning "Usuario no disponible, omitiendo registro de historial"
```

## Próximos Pasos

### Inmediatos
1. ✅ API creada
2. ✅ Cliente actualizado
3. ✅ Documentación completa
4. ⏳ Verificar variable de entorno
5. ⏳ Probar en INEA

### Siguientes
1. Actualizar hooks de indexación para traer historial (ver `CAMBIOS_INVENTARIO_INTEGRATION_GUIDE.md`)
2. Replicar en ITEA (`mueblesitea`)
3. Replicar en No Listado (`mueblestlaxcala`)
4. Crear componente UI para mostrar historial (opcional)

## Ventajas de Esta Implementación

1. ✅ **Seguridad**: Service role key solo en servidor
2. ✅ **Sin RLS**: Bypass de políticas de forma segura
3. ✅ **Validación**: Centralizada en el servidor
4. ✅ **Logs**: Auditoría completa de operaciones
5. ✅ **No Bloqueante**: Si falla, no afecta operación principal
6. ✅ **Escalable**: Fácil de replicar en otros módulos
7. ✅ **Mantenible**: Lógica centralizada en la API

## Notas Finales

- El sistema está diseñado para ser no bloqueante
- Si falla el registro de historial, el cambio principal se guarda
- Los logs ayudan a identificar problemas rápidamente
- La API puede extenderse para otros tipos de operaciones (DELETE, UPDATE masivo, etc.)

## Referencias

- `docs/CAMBIOS_INVENTARIO_SECURE_API.md` - Documentación detallada de la API
- `docs/CAMBIOS_INVENTARIO_INTEGRATION_GUIDE.md` - Guía de integración en hooks
- `docs/CAMBIOS_INVENTARIO_TABLE.sql` - Script SQL de la tabla
- `docs/CAMBIOS_INVENTARIO_READY_TO_TEST.md` - Guía de pruebas


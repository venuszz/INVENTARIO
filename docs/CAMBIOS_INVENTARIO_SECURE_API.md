# API Segura para Historial de Cambios

## Fecha
3 de marzo de 2026

## Problema Resuelto
Error de RLS (Row Level Security) al intentar insertar registros en `cambios_inventario` desde el cliente:
```
Error: new row violates row-level security policy for table "cambios_inventario"
```

## Solución Implementada

### 1. API de Servidor con Service Role Key

**Archivo**: `src/app/api/cambios-inventario/route.ts`

- Usa `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS
- Valida todos los campos requeridos
- Valida que `tabla_origen` sea una de las 3 permitidas
- Inserta registros de forma segura
- Retorna confirmación con conteo de registros insertados

**Ventajas**:
- ✅ Bypass de RLS de forma segura
- ✅ Validación centralizada en el servidor
- ✅ Service role key nunca expuesta al cliente
- ✅ Logs detallados de operaciones
- ✅ Manejo de errores robusto

### 2. Cliente Actualizado

**Archivo**: `src/lib/changeHistory.ts`

La función `registrarCambios()` ahora:
- Llama a `/api/cambios-inventario` en lugar de Supabase directamente
- Pasa todos los parámetros necesarios en el body
- Maneja errores de la API
- No requiere importar el cliente de Supabase

### 3. Configuración Requerida

Asegúrate de tener en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**IMPORTANTE**: La `SUPABASE_SERVICE_ROLE_KEY` debe mantenerse secreta y NUNCA exponerse al cliente.

## Flujo de Datos

```
Cliente (useItemEdit.ts)
    ↓
registrarCambios() en changeHistory.ts
    ↓
POST /api/cambios-inventario
    ↓
Supabase Admin Client (con service role)
    ↓
INSERT en cambios_inventario (bypass RLS)
    ↓
Respuesta al cliente
```

## Validaciones en la API

1. **Campos requeridos**: `idMueble`, `tablaOrigen`, `cambios`, `userId`
2. **Tabla origen**: Debe ser `muebles`, `mueblesitea`, o `mueblestlaxcala`
3. **Array de cambios**: No puede estar vacío
4. **Formato de cambios**: Cada cambio debe tener `campo`, `valorAnterior`, `valorNuevo`

## Ejemplo de Uso

```typescript
// En useItemEdit.ts
await registrarCambios({
  idMueble: editFormData.id,
  tablaOrigen: 'muebles',
  cambios: [
    {
      campo: 'descripcion',
      valorAnterior: 'SILLA VIEJA',
      valorNuevo: 'SILLA NUEVA',
      campoDisplay: 'Descripción'
    }
  ],
  razonCambio: 'Corrección de datos'
}, user.id);
```

## Políticas de RLS (Opcional)

Aunque la API usa service role key, puedes configurar políticas de RLS para lectura:

```sql
-- Permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios pueden leer historial"
ON cambios_inventario
FOR SELECT
TO authenticated
USING (true);

-- La inserción se hace solo desde la API con service role
-- No se necesita política de INSERT para usuarios normales
```

## Testing

1. ✅ Crear la API route
2. ✅ Actualizar changeHistory.ts
3. ⏳ Verificar que `.env.local` tiene `SUPABASE_SERVICE_ROLE_KEY`
4. ⏳ Hacer un cambio en INEA
5. ⏳ Verificar que se registra sin errores de RLS
6. ⏳ Verificar en Supabase que los registros se insertaron correctamente

## Logs Esperados

**Éxito**:
```
✅ [API] 3 cambios registrados exitosamente
✅ [Change History] 3 cambios registrados
```

**Error**:
```
❌ [API] Error al registrar cambios: [mensaje de error]
❌ [Change History] Error al registrar cambios: [mensaje de error]
```

## Próximos Pasos

1. Verificar que la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` existe
2. Probar el registro de cambios en INEA
3. Si funciona, replicar en ITEA y No Listado
4. Actualizar hooks de indexación para traer el historial (según `CAMBIOS_INVENTARIO_INTEGRATION_GUIDE.md`)

## Notas de Seguridad

- ✅ Service role key solo en servidor (Next.js API routes)
- ✅ Validación de datos en el servidor
- ✅ No se expone la key al cliente
- ✅ Logs para auditoría
- ✅ Manejo de errores sin exponer detalles sensibles

## Archivos Modificados

1. `src/app/api/cambios-inventario/route.ts` - Nueva API route
2. `src/lib/changeHistory.ts` - Actualizado para usar API
3. `src/components/consultas/inea/hooks/useItemEdit.ts` - Ya configurado para pasar userId


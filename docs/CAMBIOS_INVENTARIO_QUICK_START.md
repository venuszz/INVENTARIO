# Quick Start: Historial de Cambios

## Configuración Rápida (5 minutos)

### 1. Verificar Variable de Entorno

Abre `.env.local` y verifica que existe:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**¿Dónde encontrarla?**
1. Ve a tu proyecto en Supabase Dashboard
2. Settings → API
3. Copia "service_role" key (NO la "anon" key)

### 2. Ejecutar SQL

Copia y ejecuta el contenido de `docs/CAMBIOS_INVENTARIO_TABLE.sql` en Supabase SQL Editor.

### 3. Reiniciar Servidor de Desarrollo

```bash
# Detén el servidor (Ctrl+C)
# Reinicia para cargar la nueva variable de entorno
npm run dev
```

### 4. Probar

1. Ve a Consultas INEA
2. Selecciona un mueble
3. Haz clic en "Editar"
4. Cambia algún campo (ej: descripción)
5. Haz clic en "Guardar Cambios"
6. En el modal, escribe un motivo (ej: "Prueba de historial")
7. Confirma

**Logs esperados en consola**:
```
✅ [API] 1 cambios registrados exitosamente
✅ [Change History] 1 cambios registrados
```

### 5. Verificar en Supabase

1. Ve a Table Editor → `cambios_inventario`
2. Deberías ver tu registro con:
   - `id_mueble`: UUID del mueble
   - `tabla_origen`: "muebles"
   - `campo_modificado`: nombre del campo
   - `valor_anterior` y `valor_nuevo`
   - `usuario_id`: tu UUID
   - `metadata`: con `razon_cambio`

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY is not defined"
- Verifica que la variable existe en `.env.local`
- Reinicia el servidor de desarrollo

### Error: "tabla cambios_inventario no existe"
- Ejecuta el SQL de `docs/CAMBIOS_INVENTARIO_TABLE.sql`

### Error: "Usuario no autenticado"
- Asegúrate de estar logueado
- Verifica que el hook recibe el objeto `user` correctamente

### No aparecen logs de éxito
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Verifica que el fetch a `/api/cambios-inventario` se completó

## Próximos Pasos

Una vez que funcione:
1. Actualizar hooks de indexación (ver `CAMBIOS_INVENTARIO_INTEGRATION_GUIDE.md`)
2. Replicar en ITEA y No Listado
3. Crear UI para mostrar historial (opcional)

## Archivos Clave

- `src/app/api/cambios-inventario/route.ts` - API de servidor
- `src/lib/changeHistory.ts` - Cliente
- `src/components/consultas/inea/hooks/useItemEdit.ts` - Integración
- `docs/CAMBIOS_INVENTARIO_TABLE.sql` - SQL de la tabla


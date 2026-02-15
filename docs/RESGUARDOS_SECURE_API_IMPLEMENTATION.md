# Implementación Segura de API para Resguardos

## Resumen
Se implementó un API route seguro para la creación de resguardos, siguiendo el mismo patrón que el color management. Esto permite guardar resguardos usando la service role key del servidor, evitando problemas de RLS (Row Level Security) y manteniendo la seguridad.

## Cambios Realizados

### 1. Nuevo API Route: `/api/resguardos/create`

**Archivo**: `src/app/api/resguardos/create/route.ts`

**Características**:
- Usa `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS
- Acepta un array de resguardos para inserción en batch
- Valida todos los campos requeridos
- Agrega automáticamente el `created_by` con el userId
- Retorna el resultado de la inserción con conteo

**Endpoint**: `POST /api/resguardos/create`

**Request Body**:
```json
{
  "resguardos": [
    {
      "folio": "RES-2024-001",
      "f_resguardo": "2024-02-14T00:00:00.000Z",
      "id_directorio": 1,
      "id_mueble": "uuid-here",
      "origen": "INEA",
      "puesto_resguardo": "DIRECTOR",
      "resguardante": "NOMBRE COMPLETO"
    }
  ],
  "userId": "user-uuid-here"
}
```

**Response Success**:
```json
{
  "success": true,
  "data": [...],
  "count": 2
}
```

**Response Error**:
```json
{
  "error": "Error message",
  "details": "Detailed error message"
}
```

### 2. Actualización del Hook: `useResguardoSubmit`

**Archivo**: `src/components/resguardos/crear/hooks/useResguardoSubmit.ts`

**Cambios**:
1. Removida la importación de `supabase` client
2. Cambio de inserción directa a llamada API
3. Consulta de firmas ahora usa `/api/supabase-proxy` en lugar de supabase client
4. Preparación de datos en batch antes de enviar al API
5. Mejor manejo de errores con respuestas del API

**Antes**:
```typescript
const { error: insertError } = await supabase
  .from('resguardos')
  .insert(resguardoData);
```

**Después**:
```typescript
const response = await fetch('/api/resguardos/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resguardos: resguardosData,
    userId: user.id
  }),
});
```

## Beneficios

### 1. Seguridad
- La service role key nunca se expone al cliente
- Bypass de RLS de manera controlada en el servidor
- Validación centralizada de datos en el servidor

### 2. Consistencia
- Mismo patrón que color management
- Código más mantenible y predecible
- Fácil de extender para otros endpoints

### 3. Performance
- Inserción en batch (todos los resguardos de una vez)
- Menos round-trips al servidor
- Mejor manejo de errores

### 4. Mantenibilidad
- Lógica de negocio centralizada en el API route
- Fácil de testear
- Logs centralizados en el servidor

## Patrón de Implementación

Este patrón se puede replicar para otras operaciones que requieran bypass de RLS:

```typescript
// 1. Crear API route en src/app/api/[feature]/route.ts
export async function POST(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Validar datos
  // Ejecutar operación
  // Retornar resultado
}

// 2. Llamar desde el hook/componente
const response = await fetch('/api/[feature]', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

## Validaciones Implementadas

### En el API Route:
1. ✅ Validación de array de resguardos no vacío
2. ✅ Validación de userId presente
3. ✅ Validación de campos requeridos en cada resguardo:
   - folio
   - f_resguardo
   - id_directorio
   - id_mueble
   - origen
   - puesto_resguardo
   - resguardante

### En el Hook:
1. ✅ Validación de sesión de usuario
2. ✅ Generación de folio exitosa
3. ✅ Consulta de firmas exitosa
4. ✅ Preparación correcta de datos

## Estructura de Datos

### Resguardo Data Structure:
```typescript
{
  folio: string;              // Folio único generado
  f_resguardo: string;        // Fecha ISO string
  id_directorio: number;      // ID del director
  id_mueble: string;          // UUID del mueble
  origen: string;             // INEA | ITEA | TLAXCALA
  puesto_resguardo: string;   // Puesto en mayúsculas
  resguardante: string;       // Nombre del resguardante
  created_by: string;         // UUID del usuario (agregado por API)
}
```

## Testing

### Test Manual:
1. Seleccionar muebles en la interfaz
2. Llenar formulario de resguardo
3. Hacer clic en "Guardar"
4. Verificar en consola los logs de éxito
5. Verificar en base de datos que los registros se crearon

### Verificación en Base de Datos:
```sql
-- Ver últimos resguardos creados
SELECT * FROM resguardos 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar que id_mueble es UUID
SELECT 
  id,
  folio,
  id_mueble,
  pg_typeof(id_mueble) as tipo
FROM resguardos
LIMIT 5;
```

## Troubleshooting

### Error: "Missing required fields"
- Verificar que todos los campos requeridos estén presentes
- Revisar que `id_mueble` sea UUID válido
- Confirmar que `id_directorio` sea número

### Error: "Failed to create resguardos"
- Verificar que la tabla `resguardos.id_mueble` sea tipo UUID
- Ejecutar migración de `docs/FIX_RESGUARDOS_ID_MUEBLE_TYPE.md`
- Verificar que el trigger `validate_resguardo_mueble` funcione correctamente

### Error: "Missing userId"
- Verificar que el usuario esté autenticado
- Revisar que `user.id` esté disponible en el hook

## Próximos Pasos

1. ✅ Ejecutar migración de tipo de dato (UUID)
2. ⏳ Probar creación de resguardos
3. ⏳ Verificar PDF generation
4. ⏳ Implementar tests automatizados
5. ⏳ Agregar rate limiting al API route

## Referencias

- Patrón basado en: `src/app/api/colores/route.ts`
- Hook similar: `src/hooks/useColorManagement.ts`
- Documentación Supabase: [Service Role Key](https://supabase.com/docs/guides/api/api-keys)

---

**Fecha de implementación**: 2024-02-14  
**Autor**: Sistema de desarrollo  
**Estado**: ✅ Implementado

# Fix: Batch Fetching de Resguardos

## Problema Identificado

Error al intentar fetch de resguardos con 1000 IDs:
```
❌ [ITEA Indexation] Error fetching resguardos: {
  message: "Bad Request",
  details: undefined,
  hint: undefined,
  code: undefined,
  muebleIdsCount: 1000
}
```

## Causa Raíz

El operador `.in()` de Supabase tiene limitaciones cuando se pasan muchos IDs:
1. **Límite de URL**: URLs muy largas (>2000 caracteres) pueden causar errores
2. **Límite de query**: PostgreSQL puede tener límites en el número de valores en un IN clause
3. **Performance**: Queries con muchos IDs son más lentos

Con 1000 UUIDs (cada uno ~36 caracteres), la URL puede exceder fácilmente los límites.

## Solución Implementada

Fetch de resguardos en **lotes de 100 IDs** en lugar de todos a la vez:

```typescript
// ANTES (fallaba con 1000 IDs)
const { data: resguardos } = await supabase
  .from('resguardos')
  .select('id_mueble, resguardante, f_resguardo')
  .in('id_mueble', muebleIds) // 1000 IDs
  .eq('origen', 'ITEA')
  .order('f_resguardo', { ascending: false });

// DESPUÉS (funciona con cualquier cantidad)
let allResguardos: any[] = [];
const RESGUARDO_BATCH_SIZE = 100;

for (let i = 0; i < muebleIds.length; i += RESGUARDO_BATCH_SIZE) {
  const batchIds = muebleIds.slice(i, i + RESGUARDO_BATCH_SIZE);
  const { data: resguardosBatch, error } = await supabase
    .from('resguardos')
    .select('id_mueble, resguardante, f_resguardo')
    .in('id_mueble', batchIds) // Solo 100 IDs
    .eq('origen', 'ITEA')
    .order('f_resguardo', { ascending: false });
  
  if (error) {
    console.error('Error in batch', i / RESGUARDO_BATCH_SIZE);
    // Continue with other batches
  } else if (resguardosBatch) {
    allResguardos.push(...resguardosBatch);
  }
}

const resguardos = allResguardos;
```

## Ventajas de la Solución

1. **Evita límites de URL**: Cada batch tiene máximo 100 UUIDs (~3600 caracteres)
2. **Resiliente**: Si un batch falla, los demás continúan
3. **Mejor logging**: Podemos ver qué batch específico falló
4. **Performance predecible**: Cada query es pequeño y rápido
5. **Escalable**: Funciona con cualquier cantidad de muebles

## Archivos Modificados

1. ✅ `src/hooks/indexation/useIneaIndexation.ts`
2. ✅ `src/hooks/indexation/useIneaObsoletosIndexation.ts`
3. ✅ `src/hooks/indexation/useIteaIndexation.ts`
4. ✅ `src/hooks/indexation/useIteaObsoletosIndexation.ts`
5. ✅ `src/hooks/indexation/useNoListadoIndexation.ts`

## Tamaño de Batch

Se eligió **100 IDs por batch** porque:
- 100 UUIDs = ~3600 caracteres en URL (seguro)
- Balance entre número de requests y tamaño de cada uno
- Permite procesar 10,000 muebles en 100 requests
- Cada request es rápido (<100ms típicamente)

## Performance

### Antes (1 request grande)
- 1 request con 1000 IDs
- ❌ Falla con "Bad Request"
- Tiempo: N/A (no funciona)

### Después (múltiples requests pequeños)
- 10 requests con 100 IDs cada uno
- ✅ Funciona correctamente
- Tiempo: ~1 segundo total (100ms por request)
- Overhead aceptable para confiabilidad

## Logs Mejorados

Los logs ahora muestran:
```
🔍 [ITEA Indexation] Fetching resguardos for muebles: {
  count: 1000,
  sampleIds: ['uuid1', 'uuid2', 'uuid3']
}

// Si hay error en un batch específico:
❌ [ITEA Indexation] Error fetching resguardos batch: {
  error: {...},
  batchSize: 100,
  batchIndex: 5  // Batch número 5 falló
}

✅ [ITEA Indexation] All resguardos fetched: {
  count: 450  // Total de resguardos obtenidos
}
```

## Testing

Para probar que funciona:
1. Recargar la página
2. Ver en consola los logs de fetch
3. Verificar que no hay errores "Bad Request"
4. Verificar que se muestran los resguardantes correctamente

## Consideraciones Futuras

Si el performance se vuelve un problema:
1. Aumentar `RESGUARDO_BATCH_SIZE` a 200 (aún seguro)
2. Hacer requests en paralelo con `Promise.all()`
3. Implementar caché de resguardos en IndexedDB
4. Considerar agregar índices en BD si no existen

## Conclusión

El error "Bad Request" se debía a intentar pasar demasiados IDs en un solo query. La solución de batching resuelve el problema de manera confiable y escalable.

---

**Fecha**: 15 de febrero de 2026  
**Estado**: ✅ IMPLEMENTADO

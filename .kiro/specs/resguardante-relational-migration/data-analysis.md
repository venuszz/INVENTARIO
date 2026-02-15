# Análisis de Datos Existentes - Campo Resguardante

## Fecha: 2026-02-15

## Objetivo
Analizar el estado actual de los datos para la migración del campo `resguardante` de texto plano a relacional.

## Queries de Análisis Recomendadas

### 1. Contar Muebles con Resguardo en Tabla `resguardos`

#### INEA
```sql
SELECT COUNT(DISTINCT r.id_mueble) as muebles_con_resguardo
FROM resguardos r
WHERE r.origen = 'INEA';
```

#### ITEA
```sql
SELECT COUNT(DISTINCT r.id_mueble) as muebles_con_resguardo
FROM resguardos r
WHERE r.origen = 'ITEA';
```

#### NO_LISTADO
```sql
SELECT COUNT(DISTINCT r.id_mueble) as muebles_con_resguardo
FROM resguardos r
WHERE r.origen = 'NO_LISTADO';
```

### 2. Contar Muebles Sin Resguardo

#### INEA
```sql
SELECT COUNT(*) as muebles_sin_resguardo
FROM muebles m
WHERE m.estatus != 'BAJA'
  AND m.id NOT IN (
    SELECT DISTINCT id_mueble 
    FROM resguardos 
    WHERE origen = 'INEA'
  );
```

#### ITEA
```sql
SELECT COUNT(*) as muebles_sin_resguardo
FROM mueblesitea m
WHERE m.estatus != 'BAJA'
  AND m.id NOT IN (
    SELECT DISTINCT id_mueble 
    FROM resguardos 
    WHERE origen = 'ITEA'
  );
```

#### NO_LISTADO
```sql
SELECT COUNT(*) as muebles_sin_resguardo
FROM mueblestlaxcala m
WHERE m.estatus != 'BAJA'
  AND m.id NOT IN (
    SELECT DISTINCT id_mueble 
    FROM resguardos 
    WHERE origen = 'NO_LISTADO'
  );
```

### 3. Identificar Muebles con Múltiples Resguardos

```sql
SELECT 
  id_mueble,
  origen,
  COUNT(*) as num_resguardos,
  STRING_AGG(folio, ', ' ORDER BY f_resguardo DESC) as folios,
  MAX(f_resguardo) as fecha_mas_reciente
FROM resguardos
GROUP BY id_mueble, origen
HAVING COUNT(*) > 1
ORDER BY num_resguardos DESC, origen;
```

### 4. Verificar Resguardos con Campo Vacío

```sql
SELECT 
  origen,
  COUNT(*) as resguardos_con_campo_vacio
FROM resguardos
WHERE resguardante IS NULL OR resguardante = ''
GROUP BY origen;
```

### 5. Comparar Consistencia entre Campos Legacy y Tabla Resguardos

#### INEA
```sql
SELECT 
  m.id,
  m.id_inv,
  m.resguardante as legacy_resguardante,
  r.resguardante as tabla_resguardante,
  r.folio,
  CASE 
    WHEN m.resguardante = r.resguardante THEN 'MATCH'
    WHEN m.resguardante IS NULL AND r.resguardante IS NOT NULL THEN 'LEGACY_NULL'
    WHEN m.resguardante IS NOT NULL AND r.resguardante IS NULL THEN 'TABLA_NULL'
    ELSE 'MISMATCH'
  END as estado_comparacion
FROM muebles m
LEFT JOIN resguardos r ON m.id = r.id_mueble AND r.origen = 'INEA'
WHERE m.estatus != 'BAJA'
  AND (m.resguardante IS NOT NULL OR r.resguardante IS NOT NULL)
LIMIT 100;
```

#### ITEA
```sql
SELECT 
  m.id,
  m.id_inv,
  m.resguardante as legacy_resguardante,
  r.resguardante as tabla_resguardante,
  r.folio,
  CASE 
    WHEN m.resguardante = r.resguardante THEN 'MATCH'
    WHEN m.resguardante IS NULL AND r.resguardante IS NOT NULL THEN 'LEGACY_NULL'
    WHEN m.resguardante IS NOT NULL AND r.resguardante IS NULL THEN 'TABLA_NULL'
    ELSE 'MISMATCH'
  END as estado_comparacion
FROM mueblesitea m
LEFT JOIN resguardos r ON m.id = r.id_mueble AND r.origen = 'ITEA'
WHERE m.estatus != 'BAJA'
  AND (m.resguardante IS NOT NULL OR r.resguardante IS NOT NULL)
LIMIT 100;
```

#### NO_LISTADO
```sql
SELECT 
  m.id,
  m.id_inv,
  m.resguardante as legacy_resguardante,
  r.resguardante as tabla_resguardante,
  r.folio,
  CASE 
    WHEN m.resguardante = r.resguardante THEN 'MATCH'
    WHEN m.resguardante IS NULL AND r.resguardante IS NOT NULL THEN 'LEGACY_NULL'
    WHEN m.resguardante IS NOT NULL AND r.resguardante IS NULL THEN 'TABLA_NULL'
    ELSE 'MISMATCH'
  END as estado_comparacion
FROM mueblestlaxcala m
LEFT JOIN resguardos r ON m.id = r.id_mueble AND r.origen = 'NO_LISTADO'
WHERE m.estatus != 'BAJA'
  AND (m.resguardante IS NOT NULL OR r.resguardante IS NOT NULL)
LIMIT 100;
```

### 6. Verificar Índices Existentes

```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'resguardos'
  AND (indexname LIKE '%mueble%' OR indexname LIKE '%origen%');
```

## Resultados Esperados

### Escenario Ideal
1. **Todos los muebles activos tienen resguardo**: Cada mueble en estado != 'BAJA' tiene un registro en `resguardos`
2. **Sin múltiples resguardos activos**: Cada mueble tiene máximo 1 resguardo activo (o el más reciente es claro)
3. **Consistencia perfecta**: Los campos legacy coinciden con la tabla `resguardos`
4. **Sin campos vacíos**: Todos los resguardos tienen el campo `resguardante` poblado

### Escenarios Problemáticos a Identificar

#### Problema 1: Muebles sin Resguardo
**Impacto**: Estos muebles mostrarán `resguardante: null` después de la migración
**Acción**: Documentar y decidir si es comportamiento esperado

#### Problema 2: Múltiples Resguardos Activos
**Impacto**: Necesitamos lógica para seleccionar el correcto (más reciente)
**Acción**: Implementar ORDER BY f_resguardo DESC + LIMIT 1

#### Problema 3: Inconsistencia Legacy vs Tabla
**Impacto**: Puede indicar datos desactualizados
**Acción**: Decidir cuál es la fuente de verdad (tabla `resguardos` debe ganar)

#### Problema 4: Resguardos con Campo Vacío
**Impacto**: Estos se tratarán como "sin resguardante"
**Acción**: Verificar si es comportamiento esperado

## Checklist de Verificación

- [ ] Ejecutar queries de análisis en base de datos
- [ ] Documentar resultados en este archivo
- [ ] Identificar problemas potenciales
- [ ] Crear plan de acción para problemas encontrados
- [ ] Validar que índices existen y son eficientes

## Notas de Implementación

### Prioridad de Datos
En caso de inconsistencia, la tabla `resguardos` es la fuente de verdad:
1. Si existe registro en `resguardos` → usar ese valor
2. Si no existe registro → `resguardante: null`
3. Ignorar campos legacy en tablas de muebles

### Manejo de Múltiples Resguardos
Si un mueble tiene múltiples resguardos:
1. Ordenar por `f_resguardo DESC`
2. Tomar el primero (más reciente)
3. Implementar en query con `.order()` y `.limit(1, { foreignTable: 'resguardos' })`

### Performance
- Verificar que índices `idx_resguardos_mueble` y `idx_resguardos_mueble_origen` existen
- Si no existen, crearlos antes de la migración
- Monitorear performance de queries con EXPLAIN ANALYZE

## Próximos Pasos

1. Ejecutar queries de análisis
2. Documentar resultados
3. Identificar y resolver problemas
4. Proceder con Task 2.1 (Actualizar useIneaIndexation)

# Migración del Campo Resguardante a Relacional

## Contexto

Actualmente, el campo `resguardante` se almacena como texto plano en las tablas de muebles (`muebles`, `mueblesitea`, `mueblestlaxcala`). Este campo debe migrar a obtenerse de la tabla `resguardos` mediante una relación basada en `id_mueble`.

## Objetivo

Modificar el sistema de indexación y consulta para que el campo `resguardante` se obtenga dinámicamente de la tabla `resguardos` en lugar de ser un campo estático en las tablas de muebles.

## Tabla de Resguardos

```sql
create table public.resguardos (
  id serial not null,
  folio text not null,
  f_resguardo date not null,
  id_directorio integer not null,
  id_mueble uuid not null,
  origen text not null,
  puesto_resguardo text not null,
  resguardante text not null,
  created_by uuid not null,
  created_at timestamp with time zone null default now(),
  id_area integer not null,
  constraint resguardos_pkey primary key (id),
  constraint fk_resguardos_area foreign key (id_area) references area(id_area) on delete RESTRICT,
  constraint resguardos_created_by_fk foreign key (created_by) references auth.users (id) on delete RESTRICT,
  constraint resguardos_directorio_fk foreign key (id_directorio) references directorio (id_directorio) on delete RESTRICT,
  constraint resguardos_origen_check check ((origen = any (array['INEA'::text, 'ITEA'::text, 'NO_LISTADO'::text])))
) TABLESPACE pg_default;
```

## Lógica de Negocio

Un mueble **NO tiene resguardante** en dos escenarios:

1. **No existe registro en `resguardos`**: El mueble no tiene ningún registro en la tabla `resguardos` con su `id_mueble`
2. **Campo vacío**: Existe un registro en `resguardos` pero el campo `resguardante` está vacío o es NULL

## Alcance del Cambio

### Módulos Afectados

1. **INEA General** (`src/hooks/indexation/useIneaIndexation.ts`)
2. **INEA Obsoletos** (`src/hooks/indexation/useIneaObsoletosIndexation.ts`)
3. **ITEA General** (`src/hooks/indexation/useIteaIndexation.ts`)
4. **ITEA Obsoletos** (`src/hooks/indexation/useIteaObsoletosIndexation.ts`)
5. **NO-LISTADO** (`src/hooks/indexation/useNoListadoIndexation.ts`)

### Componentes Afectados

Todos los componentes que muestran o filtran por el campo `resguardante`:

- Tablas de inventario
- Paneles de detalle
- Búsquedas y filtros
- Exportaciones y reportes

## Requisitos Técnicos

### 1. Modificar Queries de Indexación

Cada hook de indexación debe:

1. Hacer JOIN con la tabla `resguardos` usando `id_mueble`
2. Filtrar por el origen correspondiente (`INEA`, `ITEA`, `NO_LISTADO`)
3. Manejar casos donde no existe resguardo (LEFT JOIN)

### 2. Actualizar Tipos TypeScript

El tipo `MuebleINEA`, `MuebleITEA`, y `MuebleNoListado` deben reflejar que:

- `resguardante` puede ser `null` cuando no hay resguardo
- El campo proviene de una relación, no es un campo directo

### 3. Mantener Compatibilidad

Durante la transición:

- Los campos de texto plano `resguardante` en las tablas de muebles pueden seguir existiendo
- El sistema debe priorizar el valor de la tabla `resguardos`
- Si no hay registro en `resguardos`, mostrar "Sin resguardante" o similar

### 4. Actualizar Realtime

Los listeners de tiempo real deben:

- Escuchar cambios en la tabla `resguardos`
- Actualizar el campo `resguardante` de los muebles afectados cuando cambie un resguardo
- Manejar inserciones, actualizaciones y eliminaciones de resguardos

## Casos de Uso

### Caso 1: Mueble sin Resguardo

```
Mueble ID: abc-123
Registro en resguardos: NO EXISTE
Resultado: resguardante = null
UI: "Sin resguardante"
```

### Caso 2: Mueble con Resguardo Vacío

```
Mueble ID: abc-123
Registro en resguardos: SÍ EXISTE
resguardante: "" (vacío) o NULL
Resultado: resguardante = null
UI: "Sin resguardante"
```

### Caso 3: Mueble con Resguardante

```
Mueble ID: abc-123
Registro en resguardos: SÍ EXISTE
resguardante: "Juan Pérez"
Resultado: resguardante = "Juan Pérez"
UI: "Juan Pérez"
```

## Consideraciones de Rendimiento

1. **Índices**: La tabla `resguardos` ya tiene índice en `id_mueble` y `origen`
2. **Batch Loading**: Mantener el sistema de carga por lotes (1000 registros)
3. **Caché**: El campo `resguardante` se cachea en IndexedDB junto con los demás datos del mueble

## Impacto en Búsquedas y Filtros

Los hooks de búsqueda (`useSearchAndFilters`) ya están preparados para:

- Buscar por `resguardante`
- Filtrar por `resguardante`
- Generar sugerencias de `resguardante`

No requieren cambios, solo que el campo provenga de la nueva fuente.

## Validaciones

1. Verificar que el JOIN no cause duplicados si un mueble tiene múltiples resguardos
2. Asegurar que se toma el resguardo más reciente si hay múltiples
3. Validar que el filtro por origen funciona correctamente

## Migración de Datos

**Nota**: Este documento NO cubre la migración de datos existentes. Se asume que:

- Los datos en la tabla `resguardos` ya están correctos
- Los campos de texto plano en las tablas de muebles pueden quedar como legacy
- El sistema priorizará siempre la tabla `resguardos`

## Próximos Pasos

1. Crear documento de diseño técnico
2. Implementar cambios en hooks de indexación
3. Actualizar tipos TypeScript
4. Probar con datos reales
5. Validar búsquedas y filtros
6. Verificar realtime updates

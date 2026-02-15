# Resguardos - Agregar Campo id_area

## Problema Actual

La tabla `resguardos` no almacena el `id_area` de los muebles, lo que causa:
1. El área no se guarda correctamente en los resguardos
2. Los reportes no muestran el área correcta
3. Se pierde la integridad referencial con la tabla `area`

## Objetivo

Agregar el campo `id_area` a la tabla `resguardos` para:
1. Almacenar correctamente el área de cada resguardo
2. Mantener integridad referencial con la tabla `area`
3. Mostrar el área correcta en reportes y consultas
4. Validar que todos los muebles de un resguardo pertenezcan a la misma área y director

## Requisitos Funcionales

### 1. Cambios en Base de Datos
- Agregar columna `id_area` (integer, NOT NULL) a tabla `resguardos`
- Agregar foreign key constraint a tabla `area`
- Agregar índice para optimizar consultas por área
- Crear trigger de validación para verificar consistencia de área y director

### 2. Validación Pre-Guardado
Antes de guardar un resguardo, validar que:
- Todos los muebles seleccionados tengan el mismo `id_area`
- Todos los muebles seleccionados tengan el mismo `id_directorio`
- El `id_area` de los muebles coincida con el área del director seleccionado

### 3. Cambios en Crear Resguardos
- Obtener `id_area` del primer mueble seleccionado
- Validar consistencia de área antes de enviar al backend
- Incluir `id_area` en el payload de creación
- Mostrar error si hay inconsistencia de áreas

### 4. Cambios en Consultar Resguardos
- Actualizar queries para incluir JOIN con tabla `area`
- Mostrar nombre del área en lugar de usar campo de texto
- Actualizar tipos TypeScript para incluir relación con área

### 5. Cambios en Stores e Indexación
- Actualizar tipo `Resguardo` en stores
- Modificar hooks de indexación para incluir área
- Actualizar queries de Supabase con JOIN a tabla `area`

### 6. Cambios en Reportes PDF
- Usar el área de la tabla `resguardos` en lugar de calcularla
- Asegurar que el área se muestre correctamente en todos los PDFs

## Requisitos No Funcionales

1. **Compatibilidad**: Migración debe ser retrocompatible con datos existentes
2. **Performance**: Índices deben optimizar consultas por área
3. **Integridad**: Foreign keys deben prevenir datos huérfanos
4. **Validación**: Triggers deben prevenir inconsistencias

## Casos de Uso

### Caso 1: Crear Resguardo con Área Consistente
1. Usuario selecciona múltiples muebles del mismo área
2. Sistema valida que todos tengan el mismo `id_area` e `id_directorio`
3. Sistema guarda resguardo con `id_area` correcto
4. Resguardo se crea exitosamente

### Caso 2: Intentar Crear Resguardo con Áreas Inconsistentes
1. Usuario selecciona muebles de diferentes áreas
2. Sistema detecta inconsistencia en validación
3. Sistema muestra error explicativo
4. Usuario debe corregir selección

### Caso 3: Consultar Resguardo con Área
1. Usuario abre consulta de resguardos
2. Sistema carga resguardos con JOIN a tabla `area`
3. Área se muestra correctamente en la interfaz
4. PDF generado incluye área correcta

## Restricciones

1. No se pueden crear resguardos sin `id_area`
2. El `id_area` debe existir en la tabla `area`
3. Todos los muebles de un resguardo deben tener el mismo `id_area`
4. El `id_area` debe coincidir con el área del director

## Dependencias

- Tabla `area` debe existir y estar poblada
- Tablas `muebles_inea`, `muebles_itea`, `no_listado` deben tener `id_area`
- Tabla `directorio_areas` debe tener relaciones correctas

## Criterios de Aceptación

1. ✅ Campo `id_area` agregado a tabla `resguardos`
2. ✅ Foreign key constraint funciona correctamente
3. ✅ Validación pre-guardado previene inconsistencias
4. ✅ Crear resguardos guarda `id_area` correctamente
5. ✅ Consultar resguardos muestra área correcta
6. ✅ PDFs muestran área correcta
7. ✅ Stores e indexación actualizados
8. ✅ No hay errores de TypeScript
9. ✅ Tests manuales pasan

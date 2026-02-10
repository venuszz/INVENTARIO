# Actualización de Resguardos Crear - Datos Relacionales

## Resumen
Se actualizó el componente `src/components/resguardos/crear/index.tsx` para obtener los datos de directores, áreas y puestos utilizando el mismo enfoque relacional que los componentes de consultas (INEA, ITEA, No Listado).

## Cambios Realizados

### 1. Actualización de Tipos (`types.ts`)
- **Directorio.nombre**: Cambiado de `string` a `string | null` para reflejar la estructura real de la base de datos
- Mantiene compatibilidad con la relación N:M entre directores y áreas a través de `directorio_areas`

### 2. Obtención de Datos (`index.tsx`)
**Antes:**
- Usaba el proxy API (`/api/supabase-proxy`) para obtener datos
- Hacía múltiples llamadas fetch con manejo manual de respuestas

**Después:**
- Usa el cliente de Supabase directamente (igual que consultas)
- Obtiene datos de forma más eficiente y consistente:
  ```typescript
  const { data: directorioData, error: dirError } = await supabase
    .from('directorio')
    .select('*')
    .order('nombre', { ascending: true });
  ```
- Formatea los datos con normalización (trim + toUpperCase)

### 3. Actualización de Director (`saveDirectorInfo`)
**Antes:**
- Usaba fetch con el proxy API
- Manejo manual de headers y respuestas

**Después:**
- Usa el cliente de Supabase directamente
- Operaciones más limpias y con mejor manejo de errores:
  ```typescript
  // Buscar o crear área
  const { data: existingAreas } = await supabase
    .from('area')
    .select('id_area, nombre')
    .ilike('nombre', areaNombre);
  
  // Actualizar puesto
  await supabase
    .from('directorio')
    .update({ puesto: directorFormData.puesto.trim().toUpperCase() })
    .eq('id_directorio', incompleteDirector.id_directorio);
  ```

### 4. Manejo de Valores Nulos
Se actualizaron todos los componentes para manejar correctamente `nombre: string | null`:

#### `useDirectorAutocomplete.ts`
- Función `clean()` ahora acepta `string | null`
- Retorna string vacío si el valor es null

#### `DirectorSelection.tsx`
- `displayValue` maneja valores null con fallback a string vacío
- Muestra "Sin nombre" en itálico cuando el nombre es null
- Tooltips y sugerencias manejan nombres null

#### `index.tsx`
- `handleDirectorSuggestionClick`: Usa `director.nombre || ''`
- `handleToggleSelection`: Usa `dir.nombre?.toLowerCase()` con optional chaining
- Console.log muestra "Sin nombre" cuando el nombre es null

### 5. Consistencia con Otros Componentes
Ahora el componente de resguardos/crear sigue el mismo patrón que:
- `src/components/consultas/inea/index.tsx`
- `src/components/consultas/itea/index.tsx`
- `src/components/consultas/no-listado/index.tsx`

## Beneficios

1. **Consistencia**: Mismo enfoque en toda la aplicación
2. **Mantenibilidad**: Código más limpio y fácil de mantener
3. **Rendimiento**: Menos overhead del proxy API
4. **Tipo seguro**: Mejor manejo de tipos con TypeScript
5. **Robustez**: Mejor manejo de valores null/undefined

## Archivos Modificados

1. `src/components/resguardos/crear/types.ts`
2. `src/components/resguardos/crear/index.tsx`
3. `src/components/resguardos/crear/hooks/useDirectorAutocomplete.ts`
4. `src/components/resguardos/crear/components/DirectorSelection.tsx`

## Pruebas Recomendadas

1. ✅ Verificar que se cargan correctamente los directores
2. ✅ Verificar que se cargan correctamente las áreas
3. ✅ Verificar que la relación directorio_areas funciona
4. ✅ Probar selección de director con datos completos
5. ✅ Probar selección de director con datos incompletos (modal)
6. ✅ Probar creación de nueva área desde el modal
7. ✅ Verificar que se manejan correctamente los nombres null
8. ✅ Verificar que la autocompletación funciona correctamente

## Notas Técnicas

- Se mantiene la compatibilidad con la estructura relacional N:M
- Los datos se normalizan (trim + toUpperCase) al guardar
- El modal de director permite crear áreas nuevas si no existen
- La búsqueda de directores es case-insensitive y normaliza acentos

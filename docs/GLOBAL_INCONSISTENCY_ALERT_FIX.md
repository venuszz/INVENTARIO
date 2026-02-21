# Global Inconsistency Alert - Fix de Visualización

## Problema Identificado

El `GlobalInconsistencyAlert` no aparecía después de que terminara la indexación, a pesar de que había inconsistencias en el directorio.

## Causa Raíz

El componente solo verificaba si el módulo `admin` estaba indexado (`isIndexed`), pero el hook `useDirectorioStats` depende de datos de múltiples stores:
- `ineaStore` (módulo: `inea`)
- `iteaStore` (módulo: `itea`)
- `noListadoStore` (módulo: `noListado`)
- `resguardosStore` (módulo: `resguardos`)

Cuando el módulo `admin` terminaba de indexar, los otros módulos aún podían estar en proceso de indexación, lo que resultaba en:
- `directorioStats` vacío (Map con size 0)
- `areaStats` vacío (Map con size 0)
- `inconsistencies` vacío (array con length 0)
- El componente no se renderizaba porque `inconsistencies.length === 0`

## Solución Implementada

### 1. Verificación de Múltiples Módulos

Agregamos una verificación que espera a que TODOS los módulos necesarios estén indexados:

```typescript
// Verificar que todos los módulos necesarios estén indexados
const modules = useIndexationStore(state => state.modules);
const allModulesIndexed = useMemo(() => {
    const requiredModules = ['admin', 'inea', 'itea', 'noListado', 'resguardos'];
    return requiredModules.every(key => modules[key]?.isIndexed === true);
}, [modules]);
```

### 2. Condición de Renderizado Actualizada

Cambiamos la condición de renderizado de:
```typescript
if (!isIndexed) return null;
```

A:
```typescript
if (!allModulesIndexed) return null;
```

### 3. Condición de Renderizado Actualizada

Cambiamos la condición de renderizado de:
```typescript
if (!isIndexed) return null;
```

A:
```typescript
if (!allModulesIndexed) return null;
```

## Flujo de Renderizado Actualizado

1. **Verificación de autenticación**: Espera a que se verifique la sesión del usuario
2. **Verificación de ruta**: Solo muestra en rutas autenticadas (no login, register, pending-approval)
3. **Verificación de indexación completa**: Espera a que TODOS los módulos necesarios (`admin`, `inea`, `itea`, `noListado`, `resguardos`) estén indexados
4. **Cálculo de estadísticas**: `useDirectorioStats` calcula correctamente con datos completos
5. **Detección de inconsistencias**: `useDirectorioInconsistencies` detecta problemas con stats válidas
6. **Renderizado**: Muestra el alert si hay inconsistencias y no estamos en `/admin/personal`

## Archivos Modificados

- `src/components/GlobalInconsistencyAlert.tsx`

## Resultado

El componente ahora:
- ✅ NO aparece en páginas no autenticadas (login, register, pending-approval)
- ✅ Espera a que TODOS los módulos necesarios terminen de indexar
- ✅ Calcula correctamente las estadísticas con datos completos
- ✅ Detecta y muestra inconsistencias cuando existen

## Testing

Para verificar el fix:
1. Iniciar sesión en la aplicación
2. Esperar a que todos los módulos (`admin`, `inea`, `itea`, `noListado`, `resguardos`) terminen de indexar
3. El alert debe aparecer automáticamente si hay inconsistencias en el directorio
4. El alert NO debe aparecer en `/admin/personal` (se muestra el componente local)
5. El alert debe aparecer en cualquier otra página autenticada si hay inconsistencias

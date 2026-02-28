# Migración de fetch() en useEffect a React Query

## Contexto

React-doctor ha identificado 3 casos de `fetch()` dentro de `useEffect` que deben migrarse a una librería de data fetching como React Query. Este patrón es problemático porque:

1. **No hay caché automático** - Cada vez que el componente se monta, se hace una nueva petición
2. **No hay gestión de estados de carga/error** - Hay que manejar manualmente loading, error, y success
3. **No hay deduplicación** - Múltiples componentes pueden hacer la misma petición simultáneamente
4. **No hay revalidación automática** - Los datos pueden quedar obsoletos sin mecanismo de actualización
5. **Difícil de testear** - Los efectos con fetch son complicados de mockear y testear

## Casos Identificados

### Caso 1: Reportes ITEA - Fetch de Colores
**Archivo:** `src/components/reportes/itea.tsx`
**Línea:** ~76
**Código:**
```typescript
useEffect(() => {
    const fetchEstatus = async () => {
        try {
            setLoadingReportes(true);
            
            if (viewMode === 'colores') {
                const response = await fetch('/api/colores');
                if (!response.ok) throw new Error('Error al cargar colores');
                
                const { colors } = await response.json();
                // ... procesamiento de colores
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoadingReportes(false);
        }
    };
    
    fetchEstatus();
}, [viewMode]);
```

**Problema:** Fetch de colores cada vez que cambia viewMode, sin caché ni deduplicación.

### Caso 2: Reportes Tlaxcala - Fetch de Estatus
**Archivo:** `src/components/reportes/tlaxcala.tsx`
**Línea:** ~68
**Código:**
```typescript
useEffect(() => {
    const fetchEstatus = async () => {
        try {
            setLoadingReportes(true);
            
            // Fetch estatus from config table
            const { data: estatusData, error } = await supabase
                .from('config')
                .select('id, concepto')
                .eq('tipo', 'estatus')
                .order('concepto');
            
            if (error) throw error;
            // ... procesamiento de estatus
        } catch (error) {
            setError(error.message);
        } finally {
            setLoadingReportes(false);
        }
    };
    
    fetchEstatus();
}, []);
```

**Problema:** Fetch de estatus en cada mount, sin caché. Usa Supabase directamente en lugar de API consistente.

### Caso 3: GlobalInconsistencyAlert - Verificación de Autenticación
**Archivo:** `src/components/GlobalInconsistencyAlert.tsx`
**Línea:** ~53
**Código:**
```typescript
useEffect(() => {
    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });
            const data = await response.json();
            setIsAuthenticated(data.isAuthenticated === true);
        } catch (error) {
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };
    
    checkAuth();
}, [pathname]);
```

**Problema:** Verifica autenticación en cada cambio de ruta, sin caché. Puede causar múltiples peticiones innecesarias.

## Objetivos

1. **Migrar los 3 casos a React Query** usando `useQuery` hook
2. **Crear funciones API reutilizables** en `src/lib/api/` para cada endpoint
3. **Implementar caché apropiado** con staleTime y cacheTime configurados
4. **Mejorar UX** con estados de loading, error, y retry automático
5. **Reducir código boilerplate** eliminando useState para loading/error
6. **Mantener funcionalidad existente** sin cambios en el comportamiento del usuario

## Beneficios Esperados

- ✅ Caché automático de respuestas
- ✅ Deduplicación de peticiones simultáneas
- ✅ Revalidación en background
- ✅ Retry automático en caso de error
- ✅ Estados de loading/error gestionados automáticamente
- ✅ Mejor performance (menos peticiones al servidor)
- ✅ Código más limpio y mantenible
- ✅ Resolver 3 de los 4 errores críticos de react-doctor

## Restricciones

- No cambiar la funcionalidad existente
- Mantener la misma UX para el usuario
- No romper componentes dependientes
- Usar la infraestructura de React Query ya configurada (Task 1.1 completado)
- Seguir el patrón de API proxy existente (`/api/supabase-proxy`)

## Métricas de Éxito

- React-doctor score: 81 → ~85 (+4 puntos)
- Errores críticos: 4 → 1 (75% reducción)
- Todos los tests pasan
- No hay regresiones en funcionalidad
- Compilación exitosa sin errores TypeScript

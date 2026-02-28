# Diseño de Migración: fetch() en useEffect → React Query

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ReportesITEA │  │ReportesTlax  │  │GlobalIncAlert│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  React Query   │                        │
│                    │   useQuery()   │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  API Functions │                        │
│                    │  (src/lib/api) │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   API Routes     │
                    │  /api/colores    │
                    │  /api/auth/...   │
                    │  /api/supabase...│
                    └──────────────────┘
```

## Estructura de Archivos

```
src/
├── lib/
│   ├── api/
│   │   ├── types.ts                    # Ya existe (Task 1.1)
│   │   ├── colors.ts                   # NUEVO - API de colores
│   │   ├── estatus.ts                  # NUEVO - API de estatus
│   │   └── auth.ts                     # NUEVO - API de autenticación
│   └── queryClient.ts                  # Ya existe (Task 1.1)
├── hooks/
│   ├── queries/
│   │   ├── useColorsQuery.ts           # NUEVO - Hook para colores
│   │   ├── useEstatusQuery.ts          # NUEVO - Hook para estatus
│   │   └── useAuthQuery.ts             # NUEVO - Hook para auth
└── components/
    ├── reportes/
    │   ├── itea.tsx                    # MODIFICAR
    │   └── tlaxcala.tsx                # MODIFICAR
    └── GlobalInconsistencyAlert.tsx    # MODIFICAR
```

## Caso 1: Colores API (Reportes ITEA)

### API Function: `src/lib/api/colors.ts`

```typescript
import { ApiError } from './types';

export interface Color {
  id: number;
  nombre: string;
}

export interface ColorsResponse {
  colors: Color[];
}

/**
 * Fetch colors from API
 * @returns Promise with colors array
 * @throws ApiError if request fails
 */
export async function fetchColors(): Promise<ColorsResponse> {
  const response = await fetch('/api/colores', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError(
      'Error al cargar colores',
      response.status,
      await response.text()
    );
  }

  return response.json();
}
```

### Custom Hook: `src/hooks/queries/useColorsQuery.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchColors } from '@/lib/api/colors';

/**
 * React Query hook for fetching colors
 * Caches results for 5 minutes
 */
export function useColorsQuery() {
  return useQuery({
    queryKey: ['colors'],
    queryFn: fetchColors,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });
}
```

### Uso en Componente: `src/components/reportes/itea.tsx`

```typescript
// ANTES
const [loadingReportes, setLoadingReportes] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchEstatus = async () => {
    try {
      setLoadingReportes(true);
      if (viewMode === 'colores') {
        const response = await fetch('/api/colores');
        if (!response.ok) throw new Error('Error al cargar colores');
        const { colors } = await response.json();
        // ... procesamiento
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingReportes(false);
    }
  };
  fetchEstatus();
}, [viewMode]);

// DESPUÉS
import { useColorsQuery } from '@/hooks/queries/useColorsQuery';

const { 
  data: colorsData, 
  isLoading: loadingColores, 
  error: colorsError 
} = useColorsQuery();

// Usar colorsData?.colors directamente
// isLoading y error son gestionados por React Query
```

## Caso 2: Estatus API (Reportes Tlaxcala)

### API Function: `src/lib/api/estatus.ts`

```typescript
import { ApiError } from './types';

export interface Estatus {
  id: number;
  concepto: string;
}

export interface EstatusResponse {
  estatus: Estatus[];
}

/**
 * Fetch estatus from config table
 * @returns Promise with estatus array
 * @throws ApiError if request fails
 */
export async function fetchEstatus(): Promise<EstatusResponse> {
  // Usar API proxy para consistencia
  const response = await fetch(
    '/api/supabase-proxy?target=' + 
    encodeURIComponent('/rest/v1/config?tipo=eq.estatus&select=id,concepto&order=concepto'),
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new ApiError(
      'Error al cargar estatus',
      response.status,
      await response.text()
    );
  }

  const data = await response.json();
  return { estatus: data };
}
```

### Custom Hook: `src/hooks/queries/useEstatusQuery.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchEstatus } from '@/lib/api/estatus';

/**
 * React Query hook for fetching estatus
 * Caches results for 10 minutes (estatus changes rarely)
 */
export function useEstatusQuery() {
  return useQuery({
    queryKey: ['estatus'],
    queryFn: fetchEstatus,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
  });
}
```

### Uso en Componente: `src/components/reportes/tlaxcala.tsx`

```typescript
// ANTES
const [loadingReportes, setLoadingReportes] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchEstatus = async () => {
    try {
      setLoadingReportes(true);
      const { data: estatusData, error } = await supabase
        .from('config')
        .select('id, concepto')
        .eq('tipo', 'estatus')
        .order('concepto');
      if (error) throw error;
      // ... procesamiento
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingReportes(false);
    }
  };
  fetchEstatus();
}, []);

// DESPUÉS
import { useEstatusQuery } from '@/hooks/queries/useEstatusQuery';

const { 
  data: estatusData, 
  isLoading: loadingReportes, 
  error: estatusError 
} = useEstatusQuery();

// Usar estatusData?.estatus directamente
```

## Caso 3: Auth Session API (GlobalInconsistencyAlert)

### API Function: `src/lib/api/auth.ts`

```typescript
import { ApiError } from './types';

export interface AuthSession {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

/**
 * Check current authentication session
 * @returns Promise with auth session data
 * @throws ApiError if request fails
 */
export async function fetchAuthSession(): Promise<AuthSession> {
  const response = await fetch('/api/auth/session', {
    credentials: 'include',
  });

  if (!response.ok) {
    // No lanzar error si no está autenticado, solo retornar false
    return { isAuthenticated: false };
  }

  const data = await response.json();
  return {
    isAuthenticated: data.isAuthenticated === true,
    user: data.user,
  };
}
```

### Custom Hook: `src/hooks/queries/useAuthQuery.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchAuthSession } from '@/lib/api/auth';

/**
 * React Query hook for checking authentication
 * Caches for 2 minutes, refetches on window focus
 * 
 * @param pathname - Current pathname to invalidate cache on route change
 */
export function useAuthQuery(pathname?: string) {
  return useQuery({
    queryKey: ['auth', 'session', pathname],
    queryFn: fetchAuthSession,
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    refetchOnWindowFocus: true, // Revalidar cuando el usuario vuelve a la ventana
  });
}
```

### Uso en Componente: `src/components/GlobalInconsistencyAlert.tsx`

```typescript
// ANTES
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [isLoading, setIsLoading] = useState(true);

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

// DESPUÉS
import { useAuthQuery } from '@/hooks/queries/useAuthQuery';

const { 
  data: authData, 
  isLoading 
} = useAuthQuery(pathname);

const isAuthenticated = authData?.isAuthenticated ?? false;
```

## Configuración de Query Keys

Las query keys siguen una convención jerárquica:

```typescript
// Colores
['colors'] // Todos los colores

// Estatus
['estatus'] // Todos los estatus

// Auth
['auth', 'session'] // Sesión actual
['auth', 'session', pathname] // Sesión por ruta (para invalidación)
```

## Gestión de Errores

Todos los errores usan la clase `ApiError` ya definida en `src/lib/api/types.ts`:

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

Los componentes pueden manejar errores así:

```typescript
const { data, error, isError } = useColorsQuery();

if (isError) {
  // error es de tipo ApiError
  console.error('Error:', error.message);
  // Mostrar mensaje al usuario
}
```

## Optimizaciones de Performance

### 1. Prefetching
Para mejorar UX, podemos prefetch datos antes de que el usuario los necesite:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { fetchColors } from '@/lib/api/colors';

const queryClient = useQueryClient();

// Prefetch colores cuando el usuario hover sobre el botón
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['colors'],
    queryFn: fetchColors,
  });
};
```

### 2. Invalidación Selectiva
Invalidar caché cuando los datos cambian:

```typescript
// Después de crear/actualizar un color
queryClient.invalidateQueries({ queryKey: ['colors'] });
```

### 3. Optimistic Updates
Para operaciones de escritura (futuro):

```typescript
const mutation = useMutation({
  mutationFn: updateColor,
  onMutate: async (newColor) => {
    // Cancelar queries en curso
    await queryClient.cancelQueries({ queryKey: ['colors'] });
    
    // Snapshot del valor anterior
    const previousColors = queryClient.getQueryData(['colors']);
    
    // Actualizar optimísticamente
    queryClient.setQueryData(['colors'], (old) => ({
      ...old,
      colors: [...old.colors, newColor]
    }));
    
    return { previousColors };
  },
  onError: (err, newColor, context) => {
    // Revertir en caso de error
    queryClient.setQueryData(['colors'], context.previousColors);
  },
});
```

## Consideraciones de Testing

Los hooks de React Query son fáciles de testear:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorsQuery } from './useColorsQuery';

test('fetches colors successfully', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  const { result } = renderHook(() => useColorsQuery(), { wrapper });
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  
  expect(result.current.data?.colors).toBeDefined();
});
```

## Migración Gradual

La migración se puede hacer de forma incremental:

1. **Fase 1:** Crear API functions y hooks
2. **Fase 2:** Migrar un componente a la vez
3. **Fase 3:** Validar cada migración antes de continuar
4. **Fase 4:** Limpiar código antiguo (useState, useEffect)

Esto permite:
- Detectar problemas temprano
- Hacer rollback fácilmente si algo falla
- Mantener la aplicación funcionando durante la migración

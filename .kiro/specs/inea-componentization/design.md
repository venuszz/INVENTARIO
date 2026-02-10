# Diseño de Refactorización INEA - Componentización y Migración Relacional

## 1. Arquitectura General

### 1.1 Estructura de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     index.tsx (Orquestador)                  │
│  - Coordina hooks y componentes                              │
│  - Maneja estado global                                      │
│  - Gestiona modales                                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  Hooks  │          │Components│         │ Modals  │
   └─────────┘          └──────────┘         └─────────┘
```

### 1.2 Flujo de Datos

```
useIneaIndexation (Context)
        │
        ▼
   index.tsx (State)
        │
        ├──► useSearchAndFilters ──► SearchBar, FilterChips
        ├──► useItemEdit ──────────► DetailPanel, ActionButtons
        ├──► useDirectorManagement ► DirectorModal
        ├──► useAreaManagement ────► AreaSelectionModal
        └──► useResguardoData ─────► InventoryTable
```

## 2. Plan de Implementación por Fases

### FASE 1: Preparación y Estructura Base
**Objetivo**: Crear estructura de carpetas y archivos base

### FASE 2: Tipos y Definiciones
**Objetivo**: Definir interfaces TypeScript y tipos

### FASE 3: Hooks Personalizados
**Objetivo**: Extraer lógica de negocio a hooks reutilizables

### FASE 4: Componentes de UI Básicos
**Objetivo**: Crear componentes de presentación simples

### FASE 5: Componentes de UI Complejos
**Objetivo**: Crear tabla, panel de detalles y paginación

### FASE 6: Modales
**Objetivo**: Implementar modales de interacción

### FASE 7: Integración y Orquestación
**Objetivo**: Ensamblar todo en index.tsx

### FASE 8: Migración Relacional
**Objetivo**: Cambiar de texto plano a IDs relacionales

### FASE 9: Sistema de Sincronización
**Objetivo**: Implementar skeletons y feedback visual

### FASE 10: Refinamiento y Optimización
**Objetivo**: Pulir detalles, optimizar rendimiento

## 3. Detalles de Implementación por Fase


### FASE 1: Preparación y Estructura Base

#### 1.1 Crear Estructura de Carpetas
```bash
src/components/consultas/inea/
├── components/
├── hooks/
├── modals/
└── types.ts
```

#### 1.2 Crear Store de Sincronización
**Archivo**: `src/stores/ineaStore.ts`

```typescript
import { create } from 'zustand';

interface IneaStore {
  syncingIds: string[];
  isSyncing: boolean;
  addSyncingId: (id: string) => void;
  removeSyncingId: (id: string) => void;
  setSyncing: (syncing: boolean) => void;
}

export const useIneaStore = create<IneaStore>((set) => ({
  syncingIds: [],
  isSyncing: false,
  addSyncingId: (id) => set((state) => ({
    syncingIds: [...state.syncingIds, id],
    isSyncing: true
  })),
  removeSyncingId: (id) => set((state) => {
    const newIds = state.syncingIds.filter(i => i !== id);
    return {
      syncingIds: newIds,
      isSyncing: newIds.length > 0
    };
  }),
  setSyncing: (syncing) => set({ isSyncing: syncing })
}));
```

### FASE 2: Tipos y Definiciones

#### 2.1 Crear types.ts
**Archivo**: `src/components/consultas/inea/types.ts`

```typescript
// Importar tipo base desde indexation
export type { MuebleINEA as Mueble } from '@/types/indexation';

export interface Message {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

export interface FilterOptions {
  estados: string[];
  estatus: string[];
  areas: string[];
  rubros: string[];
  formasAdq: string[];
  directores: { nombre: string; area: string }[];
}

export interface Area {
  id_area: number;
  nombre: string;
}

export interface Directorio {
  id_directorio: number;
  nombre: string | null;
  area: string | null;
  puesto: string | null;
}

export interface ResguardoDetalle {
  folio: string;
  f_resguardo: string;
  area_resguardo: string | null;
  dir_area: string;
  puesto: string;
  origen: string;
  usufinal: string | null;
  descripcion: string;
  rubro: string;
  condicion: string;
  created_by: string;
}

export interface ActiveFilter {
  term: string;
  type: 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | null;
}
```

#### 2.2 Actualizar types/indexation.ts
**Archivo**: `src/types/indexation.ts`

Agregar definición de MuebleINEA con campos relacionales:

```typescript
export interface MuebleINEA {
  id: string;
  id_inv: string;
  rubro: string | null;
  descripcion: string | null;
  valor: string | null;
  f_adq: string | null;
  formadq: string | null;
  proveedor: string | null;
  factura: string | null;
  ubicacion_es: string | null;
  ubicacion_mu: string | null;
  ubicacion_no: string | null;
  estado: string | null;
  estatus: string | null;
  
  // Campos relacionales (nuevos)
  id_area: number | null;
  id_directorio: number | null;
  area: { id_area: number; nombre: string } | null;
  directorio: { id_directorio: number; nombre: string; puesto: string } | null;
  
  // Campos legacy (mantener por compatibilidad)
  usufinal: string | null;
  
  resguardante: string | null;
  fechabaja: string | null;
  causadebaja: string | null;
  image_path: string | null;
}
```


### FASE 3: Hooks Personalizados

#### 3.1 useDirectorManagement
**Archivo**: `src/components/consultas/inea/hooks/useDirectorManagement.ts`

```typescript
import { useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { FilterOptions } from '../types';

export function useDirectorManagement() {
  const fetchDirectorio = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('directorio')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      return data?.map(item => ({
        id_directorio: item.id_directorio,
        nombre: item.nombre?.trim().toUpperCase() || null,
        area: item.area?.trim().toUpperCase() || null,
        puesto: item.puesto?.trim().toUpperCase() || null
      })) || [];
    } catch (error) {
      console.error('Error fetching directores:', error);
      return [];
    }
  }, []);

  const fetchFilterOptions = useCallback(async (): Promise<Partial<FilterOptions>> => {
    try {
      const { data: estados } = await supabase
        .from('muebles')
        .select('estado')
        .filter('estado', 'not.is', null)
        .limit(1000);

      const { data: rubros } = await supabase
        .from('config')
        .select('concepto')
        .eq('tipo', 'rubro');

      const { data: estatus } = await supabase
        .from('config')
        .select('concepto')
        .eq('tipo', 'estatus');

      const { data: formasAdq } = await supabase
        .from('config')
        .select('concepto')
        .eq('tipo', 'formadq');

      return {
        estados: [...new Set(estados?.map(item => item.estado?.trim()).filter(Boolean))] as string[],
        rubros: rubros?.map(item => item.concepto?.trim()).filter(Boolean) || [],
        estatus: estatus?.map(item => item.concepto?.trim()).filter(Boolean) || [],
        formasAdq: formasAdq?.map(item => item.concepto?.trim()).filter(Boolean) || []
      };
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
      return { estados: [], rubros: [], estatus: [], formasAdq: [] };
    }
  }, []);

  return { fetchDirectorio, fetchFilterOptions };
}
```

#### 3.2 useAreaManagement
**Archivo**: `src/components/consultas/inea/hooks/useAreaManagement.ts`

```typescript
import { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { Area } from '../types';

export function useAreaManagement() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [directorAreasMap, setDirectorAreasMap] = useState<{ [id_directorio: number]: number[] }>({});

  useEffect(() => {
    async function fetchAreasAndRelations() {
      const { data: areasData } = await supabase
        .from('area')
        .select('*')
        .order('nombre');

      setAreas(areasData || []);

      const { data: rels } = await supabase
        .from('directorio_areas')
        .select('*');

      if (rels) {
        const map: { [id_directorio: number]: number[] } = {};
        rels.forEach((rel: { id_directorio: number; id_area: number }) => {
          if (!map[rel.id_directorio]) map[rel.id_directorio] = [];
          map[rel.id_directorio].push(rel.id_area);
        });
        setDirectorAreasMap(map);
      }
    }

    fetchAreasAndRelations();
  }, []);

  return { areas, directorAreasMap };
}
```

#### 3.3 useResguardoData
**Archivo**: `src/components/consultas/inea/hooks/useResguardoData.ts`

```typescript
import { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { Mueble, ResguardoDetalle } from '../types';

export function useResguardoData(muebles: Mueble[]) {
  const [foliosResguardo, setFoliosResguardo] = useState<{ [id_inv: string]: string | null }>({});
  const [resguardoDetalles, setResguardoDetalles] = useState<{ [folio: string]: ResguardoDetalle }>({});

  useEffect(() => {
    async function fetchFoliosYDetalles() {
      if (!muebles.length) return;

      const { data, error } = await supabase
        .from('resguardos')
        .select('*');

      if (!error && data) {
        const folioMap: { [id_inv: string]: string } = {};
        const detallesMap: { [folio: string]: ResguardoDetalle } = {};

        data.forEach(r => {
          if (r.num_inventario && r.folio) {
            folioMap[r.num_inventario] = r.folio;
            if (!detallesMap[r.folio]) {
              detallesMap[r.folio] = {
                folio: r.folio,
                f_resguardo: r.f_resguardo,
                area_resguardo: r.area_resguardo,
                dir_area: r.dir_area,
                puesto: r.puesto,
                origen: r.origen,
                usufinal: r.usufinal,
                descripcion: r.descripcion,
                rubro: r.rubro,
                condicion: r.condicion,
                created_by: r.created_by
              };
            }
          }
        });

        setFoliosResguardo(folioMap);
        setResguardoDetalles(detallesMap);
      } else {
        setFoliosResguardo({});
        setResguardoDetalles({});
      }
    }

    fetchFoliosYDetalles();
  }, [muebles]);

  return { foliosResguardo, resguardoDetalles };
}
```


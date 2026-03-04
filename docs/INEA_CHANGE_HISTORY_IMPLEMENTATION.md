# Implementación del Historial de Cambios - INEA

## Resumen

Se ha implementado un sistema de historial de cambios para el módulo INEA que detecta automáticamente las modificaciones realizadas a los bienes y solicita al usuario un motivo antes de confirmar los cambios.

## Estado Actual

✅ **Implementado (UI)**:
- Detección automática de cambios entre el estado original y editado
- Modal de confirmación que muestra todos los cambios realizados
- Campo obligatorio para motivo del cambio
- Formateo inteligente de valores (fechas, moneda, campos relacionales)
- Preparación de datos para guardado en BD

⏳ **Pendiente (Integración BD)**:
- Creación de tabla `change_history` en Supabase
- Endpoint API para guardar historial
- Visualización del historial de un bien

## Arquitectura

### Archivos Creados

```
src/components/consultas/inea/
├── utils/
│   └── changeDetection.ts          # Lógica de detección y formateo
├── hooks/
│   ├── useItemEdit.ts              # Modificado para integrar cambios
│   └── useChangeDetection.ts       # Hook de detección (opcional)
├── modals/
│   └── ChangeConfirmationModal.tsx # Modal de confirmación
└── types.ts                        # Tipos actualizados
```

### Flujo de Funcionamiento

1. **Usuario edita campos** → Modifica valores en el DetailPanel
2. **Click en "Guardar"** → Se ejecuta `saveChanges()`
3. **Detección de cambios** → `detectChanges()` compara original vs editado
4. **Validación** → Si no hay cambios, muestra mensaje informativo
5. **Modal de confirmación** → Muestra lista de cambios y solicita motivo
6. **Usuario confirma** → Ingresa motivo y confirma
7. **Guardado** → Se ejecuta `confirmAndSaveChanges()` con el motivo
8. **Preparación de historial** → `prepareChangeHistoryForDB()` estructura los datos
9. **Log en consola** → Por ahora solo se registra en console.log
10. **Guardado en BD** → Se guarda el bien actualizado (historial pendiente)

## Tipos de Datos

### Change
```typescript
interface Change {
  field: string;              // Nombre del campo (id_inv, rubro, etc.)
  label: string;              // Etiqueta legible (ID Inventario, Rubro, etc.)
  oldValue: string | null;    // Valor anterior formateado
  newValue: string | null;    // Valor nuevo formateado
  fieldType: 'simple' | 'relational' | 'image';
}
```

### ChangeHistory
```typescript
interface ChangeHistory {
  id?: string;                // UUID generado por BD
  mueble_id: string;          // ID del bien modificado
  changes: Change[];          // Array de cambios
  reason: string;             // Motivo del cambio
  changed_by: string;         // Usuario que realizó el cambio
  changed_at?: string;        // Timestamp ISO
}
```

## Campos Detectados

El sistema detecta cambios en los siguientes campos:

### Campos Simples
- `id_inv` - ID Inventario
- `rubro` - Rubro
- `descripcion` - Descripción
- `estado` - Estado
- `valor` - Valor (formateado como moneda)
- `f_adq` - Fecha de Adquisición (formateado)
- `formadq` - Forma de Adquisición
- `proveedor` - Proveedor
- `factura` - Factura
- `ubicacion_es` - Estado (Ubicación)
- `ubicacion_mu` - Municipio
- `ubicacion_no` - Nomenclatura

### Campos Relacionales
- `id_estatus` - Estatus (muestra concepto de config)
- `id_area` - Área (muestra nombre del área)
- `id_directorio` - Director (muestra nombre del director)

### Campos Especiales
- `image_path` - Imagen (detecta si cambió)

## Formateo de Valores

El sistema formatea automáticamente los valores para mostrarlos de forma legible:

- **Valores nulos**: "No especificado"
- **Fechas**: "15 de marzo de 2024"
- **Moneda**: "$1,234.56 MXN"
- **Campos relacionales**: Muestra el nombre en lugar del ID
- **Imagen**: "Imagen actualizada" o "Sin imagen"

## Integración Futura con Base de Datos

### Paso 1: Crear Tabla en Supabase

```sql
-- Tabla para historial de cambios
CREATE TABLE change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mueble_id TEXT NOT NULL REFERENCES muebles(id) ON DELETE CASCADE,
  changes JSONB NOT NULL,
  reason TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para búsquedas eficientes
  CONSTRAINT changes_not_empty CHECK (jsonb_array_length(changes) > 0),
  CONSTRAINT reason_not_empty CHECK (length(trim(reason)) > 0)
);

-- Índices
CREATE INDEX idx_change_history_mueble_id ON change_history(mueble_id);
CREATE INDEX idx_change_history_changed_at ON change_history(changed_at DESC);
CREATE INDEX idx_change_history_changed_by ON change_history(changed_by);

-- RLS Policies
ALTER TABLE change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver historial"
  ON change_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admins pueden insertar historial"
  ON change_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );
```

### Paso 2: Crear Endpoint API (Opcional)

Si prefieres usar un endpoint dedicado en lugar de supabase-proxy:

```typescript
// src/app/api/change-history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mueble_id, changes, reason, changed_by } = body;

    // Validaciones
    if (!mueble_id || !changes || !reason || !changed_by) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insertar historial
    const { data, error } = await supabase
      .from('change_history')
      .insert({
        mueble_id,
        changes,
        reason,
        changed_by
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error guardando historial:', error);
    return NextResponse.json(
      { error: 'Error al guardar historial' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const muebleId = searchParams.get('mueble_id');

    if (!muebleId) {
      return NextResponse.json(
        { error: 'mueble_id es requerido' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('change_history')
      .select('*')
      .eq('mueble_id', muebleId)
      .order('changed_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}
```

### Paso 3: Activar Guardado en BD

En `src/components/consultas/inea/utils/changeDetection.ts`, descomentar:

```typescript
export const saveChangeHistoryToDB = async (
  history: ChangeHistory
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Opción 1: Usar endpoint dedicado
    const response = await fetch('/api/change-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(history)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar historial');
    }

    return { success: true };

    // Opción 2: Usar supabase-proxy
    /*
    const response = await fetch(
      '/api/supabase-proxy?target=' + encodeURIComponent('/rest/v1/change_history'),
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(history)
      }
    );

    if (!response.ok) throw new Error('Error al guardar historial');
    return { success: true };
    */
  } catch (error) {
    console.error('Error guardando historial:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};
```

En `src/components/consultas/inea/hooks/useItemEdit.ts`, descomentar:

```typescript
// Línea ~180
await saveChangeHistoryToDB(changeHistory);
```

### Paso 4: Crear Componente de Visualización

```typescript
// src/components/consultas/inea/components/ChangeHistoryPanel.tsx
interface ChangeHistoryPanelProps {
  muebleId: string;
  isDarkMode: boolean;
}

export default function ChangeHistoryPanel({ muebleId, isDarkMode }: ChangeHistoryPanelProps) {
  const [history, setHistory] = useState<ChangeHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/change-history?mueble_id=${muebleId}`);
        const data = await response.json();
        setHistory(data.data || []);
      } catch (error) {
        console.error('Error cargando historial:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [muebleId]);

  // Renderizar historial...
}
```

## Ventajas del Sistema

1. **No invasivo**: Solo intercepta el flujo de guardado
2. **Modular**: Fácil de mantener y extender
3. **Reutilizable**: Puede adaptarse a ITEA, No Listado, etc.
4. **Type-safe**: Usa TypeScript para prevenir errores
5. **Preparado para BD**: Estructura lista para integración
6. **UX mejorada**: Usuario ve claramente qué cambió

## Próximos Pasos

1. ✅ Implementar UI y lógica de detección
2. ⏳ Crear tabla en Supabase
3. ⏳ Activar guardado en BD
4. ⏳ Crear componente de visualización de historial
5. ⏳ Replicar en otros módulos (ITEA, No Listado, etc.)

## Notas Técnicas

- Los cambios se detectan comparando el objeto original con el editado
- Se normalizan valores nulos/undefined para comparación consistente
- Los campos relacionales se formatean mostrando nombres en lugar de IDs
- El motivo del cambio es obligatorio (validación en UI)
- Los datos se preparan en formato JSON para almacenamiento en JSONB
- El sistema registra quién hizo el cambio y cuándo

## Autor

Implementado el 3 de marzo de 2026

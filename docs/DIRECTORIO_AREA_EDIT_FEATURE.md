# Directorio - Edición de Nombres de Áreas

## Resumen
Se implementó la funcionalidad para editar nombres de áreas directamente desde el componente de directorio, **solo cuando el director está en modo de edición**, con validaciones de seguridad para proteger la integridad de los datos.

## Flujo de Usuario

```
1. Usuario ve lista de directores (modo visualización)
   └─> Áreas mostradas como chips de solo lectura
   
2. Usuario hace clic en "Editar" de un director
   └─> Entra en modo edición del director
       └─> Áreas ahora muestran icono de lápiz al hacer hover (si cumplen validaciones)
       
3. Usuario hace clic en icono de lápiz de un área
   └─> Área entra en modo edición inline
       └─> Input de texto con nombre actual
       └─> Botones de guardar/cancelar
       
4. Usuario edita y guarda
   └─> Actualización en base de datos
       └─> Propagación automática vía indexación
           └─> Actualización en tiempo real en toda la aplicación
```

## Fecha de Implementación
23 de febrero de 2026

## Componentes Creados

### 1. EditableAreaChip (`src/components/admin/directorio/components/EditableAreaChip.tsx`)
Componente reutilizable que muestra un chip de área con capacidad de edición inline.

**Características:**
- Edición inline con input de texto
- Validaciones de seguridad integradas
- Animaciones suaves con Framer Motion
- Indicadores visuales de estado (bienes, resguardos, conflictos)
- Botones de acción contextuales (editar, guardar, cancelar, eliminar)

**Props:**
```typescript
interface EditableAreaChipProps {
    areaId: number;
    areaName: string;
    directorId: number;
    bienesCount: number;
    resguardosCount: number;
    hasConflict: boolean;
    conflictTooltip?: string;
    isHighlighted?: boolean;
    onRemove?: () => void;
    canRemove?: boolean;
    onAreaNameUpdate?: (areaId: number, newName: string) => Promise<void>;
    isEditMode?: boolean; // Indica si el director está en modo edición
}
```

## Reglas de Validación

### Cuándo SE PUEDE editar un área:
✅ El director está en modo de edición (`isEditMode === true`)
✅ El área NO tiene resguardos activos (`resguardosCount === 0`)
✅ El área NO está en conflicto (`hasConflict === false`)
✅ Se proporciona la función `onAreaNameUpdate`

### Cuándo NO SE PUEDE editar un área:
❌ El director NO está en modo de edición (modo visualización)
❌ El área tiene resguardos activos
❌ El área está en conflicto (asignada a múltiples directores)
❌ No se proporciona la función de actualización

## Flujo de Edición

### Requisito Previo
El usuario debe hacer clic en el botón "Editar" del director para entrar en modo de edición. Solo en este modo se podrá editar los nombres de las áreas.

1. **Activación del modo edición del área:**
   - Usuario hace clic en el icono de lápiz (Edit2) que aparece al hacer hover sobre el chip
   - Solo visible si el director está en modo edición Y el área cumple las validaciones

2. **Modo edición del área:**
   - Input de texto con el nombre actual seleccionado
   - Conversión automática a mayúsculas
   - Botones de guardar (✓) y cancelar (✗)

3. **Guardado:**
   - Validación: nombre no vacío y diferente al actual
   - Llamada a API para actualizar el nombre
   - Actualización automática en tiempo real vía indexación

4. **Cancelación:**
   - Restaura el valor original
   - Sale del modo edición del área

## Atajos de Teclado

- **Enter:** Guardar cambios
- **Escape:** Cancelar edición

## Integración con el Sistema

### Actualización en `src/components/admin/directorio/index.tsx`

1. **Nueva función handler:**
```typescript
const handleAreaNameUpdate = async (areaId: number, newName: string) => {
    const response = await fetch(
        `/api/supabase-proxy?target=${encodeURIComponent(`/rest/v1/area?id_area=eq.${areaId}`)}`,
        {
            method: 'PATCH',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ nombre: newName })
        }
    );
};
```

2. **Reemplazo de chips estáticos:**
   - Modo edición del director: chips con `isEditMode={true}` (permite editar y eliminar)
   - Modo visualización del director: chips con `isEditMode={false}` (solo visualización)

## Indicadores Visuales

### Estados del Chip

1. **Normal (Modo Visualización):**
   - Fondo semi-transparente
   - Borde sutil
   - Sin icono de editar (no editable fuera del modo edición)

2. **Normal (Modo Edición del Director):**
   - Fondo semi-transparente
   - Borde sutil
   - Icono de editar visible al hover (si cumple validaciones)

3. **Con Conflicto:**
   - Fondo rojo semi-transparente
   - Borde rojo
   - Punto rojo pulsante en la esquina
   - Tooltip explicativo
   - Edición deshabilitada (incluso en modo edición del director)

4. **Con Resguardos:**
   - Badge azul con icono de documento y contador
   - Edición deshabilitada (incluso en modo edición del director)

5. **Con Bienes:**
   - Badge verde con icono de paquete y contador
   - Edición permitida (solo afecta el nombre, no los bienes)

6. **Modo Edición del Área:**
   - Input de texto con fondo destacado
   - Botones de acción visibles
   - Indicador de carga durante guardado

## Comportamiento de Actualización

### Sincronización Automática
- Los cambios se propagan automáticamente a través del sistema de indexación
- No requiere recargar la página
- Actualización en tiempo real en todos los componentes que usan áreas

### Áreas Afectadas
- Directorio de personal
- Inventarios (INEA, ITEA, No Listado)
- Resguardos
- Levantamiento
- Reportes

## Consideraciones de UX

1. **Feedback Visual:**
   - Animaciones suaves al entrar/salir del modo edición
   - Indicador de carga durante el guardado
   - Estados hover claros

2. **Prevención de Errores:**
   - Validación antes de permitir edición
   - Tooltips explicativos cuando no se puede editar
   - Confirmación visual de cambios guardados

3. **Accesibilidad:**
   - Tooltips descriptivos
   - Indicadores visuales claros
   - Atajos de teclado intuitivos

## Seguridad

### Validaciones del Cliente
- Verificación de resguardos activos
- Verificación de conflictos
- Validación de nombre no vacío

### Validaciones del Servidor
- RLS policies de Supabase
- Autenticación requerida (`credentials: 'include'`)
- Validación de permisos de usuario

## Testing Recomendado

### Casos de Prueba

1. **Edición Exitosa:**
   - ✅ Entrar en modo edición del director
   - ✅ Editar área sin resguardos ni conflictos
   - ✅ Verificar actualización en tiempo real
   - ✅ Verificar propagación a otros componentes

2. **Validaciones:**
   - ✅ Verificar que NO se puede editar en modo visualización
   - ✅ Intentar editar área con resguardos (debe estar deshabilitado)
   - ✅ Intentar editar área en conflicto (debe estar deshabilitado)
   - ✅ Intentar guardar nombre vacío (debe cancelar)
   - ✅ Intentar guardar mismo nombre (debe cancelar)

3. **Interacción:**
   - ✅ Icono de editar solo visible en modo edición del director
   - ✅ Cancelar edición con Escape
   - ✅ Guardar con Enter
   - ✅ Cancelar con botón X
   - ✅ Guardar con botón ✓

4. **Estados:**
   - ✅ Hover muestra icono de editar (solo en modo edición)
   - ✅ Modo edición muestra input
   - ✅ Loading durante guardado
   - ✅ Tooltips informativos

## Mejoras Futuras

1. **Validación de Duplicados:**
   - Verificar si el nuevo nombre ya existe
   - Mostrar advertencia antes de guardar

2. **Historial de Cambios:**
   - Registrar cambios de nombres de áreas
   - Auditoría de modificaciones

3. **Edición Masiva:**
   - Permitir renombrar múltiples áreas a la vez
   - Operaciones batch

4. **Confirmación de Cambios:**
   - Modal de confirmación para cambios importantes
   - Preview de áreas afectadas

## Notas Técnicas

- El componente usa `AnimatePresence` de Framer Motion para transiciones suaves
- La actualización se realiza mediante PATCH a la API de Supabase
- El sistema de indexación propaga los cambios automáticamente
- No se requiere refetch manual de datos

## Archivos Modificados

1. `src/components/admin/directorio/components/EditableAreaChip.tsx` (nuevo)
2. `src/components/admin/directorio/index.tsx` (modificado)

## Dependencias

- React (hooks: useState, useRef, useEffect)
- Framer Motion (animaciones)
- Lucide React (iconos)
- Context API (tema)
- Supabase (API)

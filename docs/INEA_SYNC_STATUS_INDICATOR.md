# Indicador de Estado de Sincronización INEA

## Resumen

Implementación de un indicador visual flotante y minimalista que muestra el estado de sincronización en tiempo real cuando se actualizan áreas o directores que afectan múltiples registros en el módulo INEA.

**Fecha:** 2024
**Módulo:** Consultas INEA General
**Tipo:** Feature - UI/UX Enhancement

---

## Problema

Cuando se actualizaba un área o director en la base de datos, múltiples registros se sincronizaban en tiempo real mostrando skeletons en las celdas afectadas. Sin embargo, no había un indicador global que:

1. Informara al usuario que hay una sincronización en progreso
2. Previniera ediciones durante el proceso de sincronización
3. Mostrara cuántos registros están siendo actualizados
4. Proporcionara feedback visual claro del estado del sistema

Esto causaba confusión cuando los usuarios intentaban editar registros durante la sincronización, resultando en operaciones bloqueadas sin explicación clara.

---

## Solución Implementada

### 1. Nuevo Componente: SyncStatusBanner

**Archivo:** `src/components/consultas/inea/components/SyncStatusBanner.tsx`

Componente flotante minimalista que aparece en la esquina superior izquierda durante sincronizaciones.

#### Características:

- **Posicionamiento flotante:** `position: fixed` en `top-[5.5rem] left-6`
- **Glassmorphism:** Efecto de vidrio esmerilado con `backdrop-blur-xl`
- **Animaciones fluidas:** 
  - Entrada/salida con spring animation
  - Spinner giratorio con efecto pulse
  - Tres puntos animados secuencialmente
- **Información clara:**
  - Texto "Sincronizando" prominente
  - Contador de registros afectados
  - Múltiples indicadores visuales
- **Adaptable al tema:** Estilos para modo oscuro y claro

#### Código:

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface SyncStatusBannerProps {
  isSyncing: boolean;
  syncingCount: number;
  isDarkMode: boolean;
}

export default function SyncStatusBanner({ isSyncing, syncingCount, isDarkMode }: SyncStatusBannerProps) {
  return (
    <AnimatePresence>
      {isSyncing && (
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.9 }}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          className="fixed top-[5.5rem] left-6 z-50"
        >
          <div className={`
            flex items-center gap-3 px-4 py-3 rounded-xl
            backdrop-blur-xl shadow-2xl border
            ${isDarkMode
              ? 'bg-black/80 border-white/10 text-white shadow-black/50'
              : 'bg-white/80 border-black/10 text-black shadow-black/20'
            }
          `}>
            {/* Spinner Icon */}
            <div className="relative">
              <RefreshCw 
                className={`h-5 w-5 animate-spin ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}
              />
              {/* Pulse effect */}
              <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
              }`} />
            </div>
            
            {/* Text Content */}
            <div className="flex flex-col">
              <span className="text-sm font-medium tracking-tight">
                Sincronizando
              </span>
              <span className={`text-xs font-light ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                {syncingCount} {syncingCount === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {/* Progress indicator dots */}
            <div className="flex gap-1 ml-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                  }`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

### 2. Actualización del Componente Principal

**Archivo:** `src/components/consultas/inea/index.tsx`

#### Cambios realizados:

1. **Importación del nuevo componente:**
```typescript
import SyncStatusBanner from './components/SyncStatusBanner';
```

2. **Obtención del estado de sincronización:**
```typescript
const syncingIds = useIneaStore(state => state.syncingIds) || [];
const isSyncing = useIneaStore(state => state.isSyncing);
```

3. **Integración del banner flotante:**
```typescript
{/* Floating Sync Status Banner */}
<SyncStatusBanner
  isSyncing={isSyncing}
  syncingCount={syncingIds.length}
  isDarkMode={isDarkMode}
/>
```

4. **Deshabilitación de botones de acción durante sincronización:**
```typescript
<motion.button
  onClick={handleStartEdit}
  disabled={isSyncing}
  className={`flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] rounded-lg border text-[0.875rem] font-light tracking-tight transition-all ${
    isSyncing
      ? isDarkMode
        ? 'bg-white/[0.02] border-white/10 text-white/30 cursor-not-allowed'
        : 'bg-black/[0.02] border-black/10 text-black/30 cursor-not-allowed'
      : isDarkMode
        ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
        : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
  }`}
  whileHover={!isSyncing ? { scale: 1.02 } : {}}
  whileTap={!isSyncing ? { scale: 0.98 } : {}}
  title={isSyncing ? 'Espera a que termine la sincronización' : 'Editar registro'}
>
  <Edit className="h-[0.875vw] w-[0.875vw] min-h-[12px] min-w-[12px]" />
  Editar
</motion.button>
```

5. **Propagación del estado al DetailPanel:**
```typescript
<DetailPanel
  // ... otras props
  isGlobalSyncing={isSyncing}
/>
```

---

### 3. Actualización del DetailPanel

**Archivo:** `src/components/consultas/inea/components/DetailPanel.tsx`

#### Cambios en la interfaz principal:

```typescript
interface DetailPanelProps {
  // ... props existentes
  isSyncing?: boolean;
  isGlobalSyncing?: boolean;
}
```

#### Lógica de deshabilitación:

```typescript
export default function DetailPanel({
  // ... props
  isSyncing = false,
  isGlobalSyncing = false
}: DetailPanelProps) {
  if (!selectedItem) return null;

  // Disable editing if global sync is in progress
  const isDisabled = isGlobalSyncing;
  
  // ... resto del componente
}
```

#### Cambios en EditMode:

1. **Actualización de la interfaz:**
```typescript
interface EditModeProps {
  // ... props existentes
  isDisabled?: boolean;
}
```

2. **Recepción de la prop:**
```typescript
function EditMode({
  // ... props existentes
  isDisabled = false,
  // ... resto de props
}: EditModeProps) {
```

3. **Propagación al componente:**
```typescript
<EditMode
  // ... props existentes
  isDisabled={isDisabled}
  // ... resto de props
/>
```

#### Deshabilitación de campos de entrada:

Todos los campos de entrada (inputs, textareas, selects) fueron actualizados para incluir:

```typescript
// Ejemplo para input de texto
<input
  type="text"
  value={editFormData?.id_inv || ''}
  onChange={(e) => onFormChange(e, 'id_inv')}
  disabled={isDisabled}
  className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
  } ${
    isDarkMode
      ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
      : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
  }`}
  placeholder="Ingrese el ID de inventario"
/>

// Ejemplo para CustomSelect
<CustomSelect
  value={editFormData?.rubro || ''}
  onChange={(val) => onFormChange({ target: { value: val } } as any, 'rubro')}
  options={(filterOptions.rubros ?? []).map(rubro => ({ value: rubro, label: rubro }))}
  placeholder="Seleccione el rubro"
  isDarkMode={isDarkMode}
  disabled={isDisabled}
/>
```

**Campos actualizados:**
- ID Inventario
- Rubro
- Descripción
- Estado
- Valor
- Fecha de Adquisición
- Forma de Adquisición
- Proveedor
- Factura
- Ubicación (Estado, Municipio, Nomenclatura)
- Estatus
- Área
- Director/Jefe de Área

---

## Flujo de Funcionamiento

### 1. Detección del Cambio
Cuando se actualiza un área o director en la base de datos:

```typescript
// En useIneaIndexation.ts
.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'area' },
  async (payload: any) => {
    const { new: updatedArea } = payload;
    updateLastEventReceived(MODULE_KEY);
    
    try {
      processBatchUpdates([], 'area', updatedArea.id_area);
    } catch (error) {
      console.error('Error handling area update:', error);
    }
  }
)
```

### 2. Marcado de IDs en Sincronización
```typescript
// En processBatchUpdates
const ids = affectedMuebles.map(m => m.id);
setSyncingIds(ids);  // ← Activa el banner y skeletons
setIsSyncing(true);  // ← Activa el estado global
```

### 3. Visualización del Banner
El banner aparece automáticamente cuando `isSyncing = true`:
- Animación de entrada suave
- Muestra contador de registros
- Spinner y dots animados

### 4. Deshabilitación de Controles
- Botones de acción (Editar, Inactivo, Dar de Baja) se deshabilitan
- Campos de formulario en modo edición se deshabilitan
- Tooltips informativos aparecen al hacer hover

### 5. Actualización Progresiva
```typescript
// Actualiza en lotes de 50 con delay de 100ms
const UI_BATCH_SIZE = 50;
for (let i = 0; i < allFetchedMuebles.length; i += UI_BATCH_SIZE) {
  const batch = allFetchedMuebles.slice(i, i + UI_BATCH_SIZE);
  updateMuebleBatch(batch);
  
  const syncedIds = batch.map(m => m.id);
  removeSyncingIds(syncedIds);
  
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### 6. Finalización
```typescript
clearSyncingIds();
setIsSyncing(false);
// Banner desaparece con animación de salida
// Controles se rehabilitan automáticamente
```

---

## Archivos Modificados

### Nuevos Archivos
1. `src/components/consultas/inea/components/SyncStatusBanner.tsx` - Componente del banner flotante

### Archivos Modificados
1. `src/components/consultas/inea/index.tsx` - Integración del banner y lógica de deshabilitación
2. `src/components/consultas/inea/components/DetailPanel.tsx` - Propagación de estado y deshabilitación de campos

---

## Características Técnicas

### Animaciones
- **Entrada/Salida:** Spring animation con `stiffness: 500, damping: 30`
- **Spinner:** Rotación continua con `animate-spin`
- **Pulse:** Efecto de onda con `animate-ping`
- **Dots:** Animación secuencial con delays de 0.2s

### Estilos
- **Glassmorphism:** `backdrop-blur-xl` para efecto de vidrio
- **Sombras:** `shadow-2xl` con opacidad adaptativa al tema
- **Bordes:** Sutiles con opacidad 10%
- **Colores:** Azul para indicar proceso activo

### Responsividad
- Tamaños fijos para mantener consistencia
- Posicionamiento absoluto que no afecta el layout
- z-index alto (50) para estar siempre visible

---

## Beneficios

1. **Feedback Visual Claro:** Los usuarios saben exactamente cuándo hay una sincronización en progreso
2. **Prevención de Conflictos:** No se pueden hacer ediciones durante la sincronización
3. **Información Contextual:** Muestra cuántos registros están siendo actualizados
4. **UX Mejorada:** Diseño minimalista que no interrumpe el flujo de trabajo
5. **Consistencia:** Mismo patrón de diseño que el resto de la aplicación

---

## Consideraciones Futuras

### Posibles Mejoras
1. Agregar un botón para cancelar la sincronización (si es necesario)
2. Mostrar progreso porcentual en lugar de solo contador
3. Agregar sonido o notificación al completar
4. Implementar el mismo patrón en otros módulos (ITEA, No Listado, etc.)
5. Agregar logs de sincronización para debugging

### Mantenimiento
- El componente es reutilizable y puede ser extraído a una ubicación compartida
- Los estilos siguen el sistema de diseño existente
- Las animaciones son configurables mediante props si se necesita

---

## Testing

### Casos de Prueba
1. ✅ Banner aparece cuando se actualiza un área
2. ✅ Banner aparece cuando se actualiza un director
3. ✅ Contador muestra el número correcto de registros
4. ✅ Botones se deshabilitan durante sincronización
5. ✅ Campos de formulario se deshabilitan durante sincronización
6. ✅ Banner desaparece al completar la sincronización
7. ✅ Controles se rehabilitan al completar
8. ✅ Funciona correctamente en modo oscuro y claro
9. ✅ Animaciones son fluidas y no causan lag
10. ✅ No interfiere con otros elementos de la UI

---

## Conclusión

La implementación del indicador de estado de sincronización mejora significativamente la experiencia del usuario al proporcionar feedback visual claro y prevenir conflictos durante actualizaciones masivas. El diseño minimalista y flotante mantiene la interfaz limpia mientras proporciona información crítica del estado del sistema.

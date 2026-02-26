# Fix: Debouncing para Actualizaciones Masivas de Estatus

## Problema Identificado

Cuando se actualiza un estatus en la tabla `config`, se disparan miles de eventos UPDATE en tiempo real porque todos los registros con ese `id_estatus` se ven afectados. El sistema intentaba procesar cada evento individualmente, causando:

1. **Maximum update depth exceeded**: Demasiadas actualizaciones de estado en React
2. **Problemas de rendimiento**: Miles de re-renders simultáneos
3. **Bloqueo de UI**: La interfaz se congela durante las actualizaciones

### Error Original
```
Maximum update depth exceeded. This can happen when a component calls setState 
inside useEffect, but useEffect either doesn't have a dependency array, or one 
of the dependencies changes on every render.
```

## Solución Implementada

### Estrategia: Debouncing + Batching

En lugar de procesar cada evento UPDATE inmediatamente, implementamos un sistema que:

1. **Acumula eventos** en un Set durante un período de tiempo
2. **Espera 2 segundos** de inactividad después del último evento
3. **Procesa todos los IDs únicos** en un solo batch

### Implementación Técnica

#### 1. Nuevas Referencias
```typescript
const configUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const pendingConfigUpdatesRef = useRef<Set<number>>(new Set());
```

- `configUpdateTimeoutRef`: Almacena el timeout de debouncing
- `pendingConfigUpdatesRef`: Set de IDs de config pendientes de procesar

#### 2. Listener Modificado

**Antes (Procesamiento Inmediato)**
```typescript
.on('postgres_changes', { 
  event: 'UPDATE', 
  schema: 'public', 
  table: 'config',
  filter: 'tipo=eq.estatus'
},
  async (payload: any) => {
    const { new: updatedConfig } = payload;
    updateLastEventReceived(MODULE_KEY);
    
    try {
      if (updatedConfig.tipo === 'estatus') {
        processBatchUpdates([], 'estatus', updatedConfig.id); // ❌ Inmediato
      }
    } catch (error) {
      console.error('Error handling config estatus update:', error);
    }
  }
)
```

**Después (Debouncing + Batching)**
```typescript
.on('postgres_changes', { 
  event: 'UPDATE', 
  schema: 'public', 
  table: 'config',
  filter: 'tipo=eq.estatus'
},
  async (payload: any) => {
    const { new: updatedConfig } = payload;
    updateLastEventReceived(MODULE_KEY);
    
    try {
      if (updatedConfig.tipo === 'estatus') {
        // ✅ Agregar a Set de pendientes
        pendingConfigUpdatesRef.current.add(updatedConfig.id);
        
        // ✅ Cancelar timeout anterior
        if (configUpdateTimeoutRef.current) {
          clearTimeout(configUpdateTimeoutRef.current);
        }
        
        // ✅ Nuevo timeout de 2 segundos
        configUpdateTimeoutRef.current = setTimeout(async () => {
          const configIds = Array.from(pendingConfigUpdatesRef.current);
          pendingConfigUpdatesRef.current.clear();
          
          // ✅ Procesar todos los IDs únicos
          for (const configId of configIds) {
            await processBatchUpdates([], 'estatus', configId);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error handling config estatus update:', error);
    }
  }
)
```

#### 3. Limpieza en useEffect
```typescript
return () => {
  if (reconnectionTimeoutRef.current) {
    clearTimeout(reconnectionTimeoutRef.current);
  }
  if (configUpdateTimeoutRef.current) {
    clearTimeout(configUpdateTimeoutRef.current); // ✅ Limpiar timeout
  }
};
```

## Flujo de Ejecución

### Escenario: Actualizar Estatus "EN USO" que afecta 5000 registros

#### Antes (Sin Debouncing)
```
Evento 1 → processBatchUpdates(estatus_id) → 5000 registros
Evento 2 → processBatchUpdates(estatus_id) → 5000 registros
Evento 3 → processBatchUpdates(estatus_id) → 5000 registros
...
Evento N → processBatchUpdates(estatus_id) → 5000 registros

Resultado: N × 5000 operaciones = CRASH
```

#### Después (Con Debouncing)
```
Evento 1 → Add to Set → Start timeout (2s)
Evento 2 → Add to Set → Reset timeout (2s)
Evento 3 → Add to Set → Reset timeout (2s)
...
Evento N → Add to Set → Reset timeout (2s)
[2 segundos de inactividad]
→ Process unique IDs → processBatchUpdates(estatus_id) → 5000 registros

Resultado: 1 × 5000 operaciones = ✅ OK
```

## Beneficios

### 1. Rendimiento
- **Antes**: N eventos × 5000 registros = Millones de operaciones
- **Después**: 1 batch × 5000 registros = Miles de operaciones
- **Mejora**: ~99% reducción en operaciones

### 2. Estabilidad
- No más "Maximum update depth exceeded"
- No más congelamiento de UI
- Actualizaciones suaves y predecibles

### 3. Eficiencia de Red
- Menos consultas a Supabase
- Menos tráfico de red
- Mejor uso de recursos

### 4. Experiencia de Usuario
- UI responsiva durante actualizaciones masivas
- Feedback visual claro (skeleton loaders)
- Sin interrupciones en el flujo de trabajo

## Configuración del Debouncing

### Tiempo de Espera: 2 segundos
```typescript
setTimeout(async () => {
  // Process updates
}, 2000); // 2 segundos
```

**¿Por qué 2 segundos?**
- Suficiente para agrupar eventos relacionados
- No tan largo como para parecer lento
- Balance entre responsividad y eficiencia

**Ajustable según necesidad:**
- Más eventos → Aumentar tiempo (3-5s)
- Menos eventos → Reducir tiempo (1-1.5s)

## Archivos Modificados

1. `src/hooks/indexation/useIneaIndexation.ts`
   - Agregado `configUpdateTimeoutRef` y `pendingConfigUpdatesRef`
   - Modificado listener de config con debouncing
   - Agregado cleanup de timeout

2. `src/hooks/indexation/useIteaIndexation.ts`
   - Agregado `configUpdateTimeoutRef` y `pendingConfigUpdatesRef`
   - Modificado listener de config con debouncing
   - Agregado cleanup de timeout

3. `src/hooks/indexation/useNoListadoIndexation.ts`
   - Agregado `configUpdateTimeoutRef` y `pendingConfigUpdatesRef`
   - Modificado listener de config con debouncing
   - Agregado cleanup de timeout

4. `src/hooks/indexation/useIneaObsoletosIndexation.ts`
   - Agregado `configUpdateTimeoutRef` y `pendingConfigUpdatesRef`
   - Modificado listener de config con debouncing
   - Agregado cleanup de timeout

## Listeners Mantenidos

**IMPORTANTE**: Los listeners de tiempo real se mantienen activos:

✅ **Listeners Activos**:
- Cambios en tabla `muebles` / `mueblesitea` / `mueblestlax`
- Cambios en tabla `area`
- Cambios en tabla `directorio`
- Cambios en tabla `config` (con debouncing)
- Cambios en tabla `resguardos`

La única diferencia es que los eventos de `config` ahora se procesan en batch después de un período de inactividad.

## Testing

### Caso de Prueba 1: Actualizar Estatus Individual
1. Editar un solo registro y cambiar su estatus
2. Verificar que se actualiza inmediatamente
3. ✅ Funciona normalmente

### Caso de Prueba 2: Actualizar Estatus en Config
1. Ir a Admin → Configuración de Estatus
2. Editar el concepto de un estatus (ej: "EN USO" → "EN USO ACTUALIZADO")
3. Esperar 2 segundos
4. Verificar que todos los registros con ese estatus se actualizan
5. ✅ Sin errores, sin congelamiento

### Caso de Prueba 3: Múltiples Actualizaciones Rápidas
1. Editar varios estatus en config rápidamente
2. Esperar 2 segundos después de la última edición
3. Verificar que todos los cambios se reflejan
4. ✅ Todos los cambios procesados correctamente

## Monitoreo

Para verificar que el debouncing funciona:

```typescript
// En el timeout, agregar log:
configUpdateTimeoutRef.current = setTimeout(async () => {
  const configIds = Array.from(pendingConfigUpdatesRef.current);
  console.log(`🔄 Processing ${configIds.length} config updates:`, configIds);
  pendingConfigUpdatesRef.current.clear();
  
  for (const configId of configIds) {
    await processBatchUpdates([], 'estatus', configId);
  }
}, 2000);
```

## Fecha
Febrero 26, 2026

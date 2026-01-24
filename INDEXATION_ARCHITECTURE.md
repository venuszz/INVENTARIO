# Arquitectura de Indexación en Tiempo Real

## Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Principales](#componentes-principales)
4. [Proceso de Implementación](#proceso-de-implementación)
5. [Sistema de Tiempo Real](#sistema-de-tiempo-real)
6. [Manejo de Reconexión](#manejo-de-reconexión)
7. [Gestión de Caché](#gestión-de-caché)
8. [Estados de UI](#estados-de-ui)
9. [Mejores Prácticas](#mejores-prácticas)

---

## Visión General

Este documento describe cómo implementar un sistema de indexación de datos en tiempo real para aplicaciones web que requieren sincronización instantánea con una base de datos.

### Objetivos del Sistema

- **Cargar datos iniciales** de manera eficiente con progreso visible
- **Mantener sincronización en tiempo real** usando WebSockets
- **Manejar desconexiones** con reconexión automática
- **Cachear datos** para carga instantánea en futuras sesiones
- **Proporcionar feedback visual** claro del estado del sistema

### Stack Tecnológico Recomendado

- **State Management**: Zustand con middleware de persistencia
- **Animaciones**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Realtime) o similar con WebSockets
- **Caché**: localStorage
- **Framework**: React/Next.js

---

## Arquitectura del Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                      APLICACIÓN                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ UI Component │───▶│ Custom Hook  │───▶│ Module Store │ │
│  │ (Popover +   │    │ (Indexation  │    │ (Zustand)    │ │
│  │  Indicator)  │    │     Hook)    │    │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Indexation Store (Estado Global)             │  │
│  │  - Progreso de indexación                            │  │
│  │  - Estado de conexión                                │  │
│  │  - Manejo de reconexión                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────────┐
              │    BACKEND (Supabase/Similar)   │
              ├─────────────────────────────────┤
              │  ┌──────────────────────────┐  │
              │  │   Base de Datos          │  │
              │  │  - Tablas con triggers   │  │
              │  └──────────────────────────┘  │
              │              │                  │
              │              ▼                  │
              │  ┌──────────────────────────┐  │
              │  │   Canales Realtime       │  │
              │  │  - Conexiones WebSocket  │  │
              │  │  - Broadcasting eventos  │  │
              │  └──────────────────────────┘  │
              └─────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────────┐
              │      localStorage Cache          │
              │  - Datos de módulos              │
              │  - Estado de indexación          │
              │  - Timestamps                    │
              └─────────────────────────────────┘
```

### Flujo de Datos

1. **Inicio**: Verificar caché válido en localStorage
2. **Indexación**: Si no hay caché, cargar datos por etapas
3. **Tiempo Real**: Establecer conexión WebSocket
4. **Sincronización**: Propagar cambios automáticamente
5. **Persistencia**: Guardar en localStorage

---

## Componentes Principales

### 1. Indexation Store (Estado Global)

**Propósito**: Gestionar el estado de indexación para todos los módulos de la aplicación.

**Responsabilidades**:
- Trackear progreso de indexación (0-100%)
- Gestionar estado de conexión en tiempo real
- Manejar intentos de reconexión
- Persistir estado esencial

**Estructura de Estado por Módulo**:
- `isIndexed`: Indica si el módulo está completamente indexado
- `isIndexing`: Indica si la indexación está en progreso
- `progress`: Porcentaje de progreso (0-100)
- `currentStage`: Descripción de la etapa actual
- `error`: Mensaje de error si falla
- `realtimeConnected`: Estado de la conexión WebSocket
- `lastIndexedAt`: Timestamp de última indexación exitosa
- `lastEventReceivedAt`: Timestamp del último evento recibido
- `disconnectedAt`: Timestamp de desconexión
- `reconnectionAttempts`: Contador de intentos de reconexión
- `reconnectionStatus`: Estado actual de reconexión (idle/reconnecting/reconciling/failed)
- `maxReconnectionAttempts`: Límite de intentos

**Acciones Necesarias**:
- Iniciar indexación
- Actualizar progreso
- Completar indexación
- Manejar errores
- Actualizar estado de conexión
- Gestionar reconexión
- Resetear módulo

**Persistencia Selectiva**:
Solo persistir en localStorage:
- Estado de indexación completada
- Timestamp de última indexación
- Timestamp de último evento

NO persistir estados transitorios:
- Progreso actual
- Estado de indexación en curso
- Errores
- Estado de reconexión

---

### 2. Module Store (Datos del Módulo)

**Propósito**: Almacenar y gestionar los datos específicos de cada módulo.

**Responsabilidades**:
- Almacenar colecciones de datos (usuarios, servicios, pagos, etc.)
- Proporcionar métodos CRUD
- Validar frescura del caché
- Persistir datos en localStorage

**Estructura Típica**:
- Colecciones de datos (arrays de objetos)
- Metadata (lastFetchedAt)
- Métodos set/add/update/remove para cada colección
- Método de validación de caché
- Método de limpieza

**Validación de Caché**:
Implementar lógica para verificar si los datos en caché son recientes:
- Verificar existencia de timestamp
- Calcular tiempo transcurrido
- Comparar contra duración máxima de caché (ej: 30 minutos)
- Retornar true/false

---

### 3. Custom Indexation Hook

**Propósito**: Orquestar el proceso de indexación para un módulo específico.

**Responsabilidades**:
- Ejecutar proceso de indexación por etapas
- Configurar suscripciones de tiempo real
- Manejar reconexión automática
- Proporcionar interfaz simple al componente

**Referencias Necesarias**:
- Cliente de Supabase (o similar)
- Canal de WebSocket
- Flag de indexación en progreso
- Timeout de reconexión

**Funciones Principales**:
- `startIndexation`: Iniciar proceso completo
- `setupRealtimeSubscriptions`: Configurar WebSocket
- `handleReconnection`: Gestionar reconexión
- `retryIndexation`: Reintentar después de error

**Retorno del Hook**:
- Estados de indexación
- Estados de conexión
- Funciones de control

---

## Proceso de Implementación

### Paso 1: Definir Etapas de Indexación

Cada módulo debe definir sus etapas con:
- **key**: Identificador único
- **label**: Descripción para mostrar al usuario
- **weight**: Peso para calcular progreso (suma total = 100)

Ejemplo de distribución:
- Datos principales: 40-50%
- Datos relacionados: 30-40%
- Configuración realtime: 5-10%

### Paso 2: Implementar Verificación de Caché

Al iniciar indexación:
1. Verificar si hay indexación en progreso (prevenir duplicados)
2. Verificar si existe caché válido
3. Si caché es válido: solo conectar realtime
4. Si no hay caché: proceder con indexación completa

### Paso 3: Ejecutar Indexación por Etapas

Para cada etapa:
1. Actualizar estado con etapa actual
2. Hacer fetch de datos con retry automático
3. Guardar datos en store
4. Calcular y actualizar progreso
5. Marcar etapa como completada

### Paso 4: Implementar Retry con Exponential Backoff

Configuración recomendada:
- Intentos máximos: 3
- Delay base: 1000ms
- Delay máximo: 10000ms
- Multiplicador: 2

Lógica:
- Intentar operación
- Si falla, esperar delay calculado
- Incrementar delay exponencialmente
- Reintentar hasta máximo de intentos

### Paso 5: Configurar Tiempo Real

Después de indexación exitosa:
1. Crear canal de WebSocket
2. Suscribirse a cambios en tablas relevantes
3. Configurar handlers para INSERT/UPDATE/DELETE
4. Manejar cambios de estado de conexión

### Paso 6: Persistir Datos

Al completar indexación:
1. Guardar timestamp actual
2. Marcar módulo como indexado
3. Zustand automáticamente persiste en localStorage

---

## Sistema de Tiempo Real

### Configuración de WebSocket

**Pasos**:
1. Crear cliente de WebSocket (Supabase Realtime o similar)
2. Crear canal único por módulo
3. Suscribirse a eventos de PostgreSQL (o base de datos equivalente)
4. Configurar handlers para cada tipo de evento
5. Manejar cambios de estado de conexión

### Tipos de Eventos a Escuchar

**INSERT**: Nuevo registro creado
- Fetch registro completo con relaciones
- Agregar a store local
- Emitir evento para UI

**UPDATE**: Registro modificado
- Refetch registro para obtener datos actualizados
- Actualizar en store local
- Emitir evento para UI

**DELETE**: Registro eliminado
- Remover de store local
- Limpiar registros relacionados (cascada)
- Emitir evento para UI

### Event Emitter Pattern

Implementar sistema de eventos para notificar a componentes UI:
1. Mantener Set de callbacks registrados
2. Función para registrar listener (retorna función de cleanup)
3. Función para emitir eventos a todos los listeners
4. Componentes se suscriben en useEffect

### Manejo de Relaciones

**Estrategia**: Siempre refetch registro completo
- No confiar solo en datos del evento
- Hacer fetch a API para obtener relaciones
- Asegura consistencia de datos
- Maneja campos calculados

**Cascada en DELETE**:
- Identificar registros relacionados
- Remover manualmente del store
- Base de datos puede no emitir eventos CASCADE

---

## Manejo de Reconexión

### Detección de Desconexión

Monitorear cambios en estado de conexión:
- Guardar estado anterior
- Comparar con estado actual
- Si cambió de conectado a desconectado: iniciar reconexión
- Guardar timestamp de desconexión

### Reconexión Automática con Exponential Backoff

Configuración recomendada:
- Intentos máximos: 5
- Delay base: 2000ms
- Delay máximo: 30000ms
- Multiplicador: 2

**Proceso**:
1. Verificar si se alcanzó límite de intentos
2. Calcular delay con exponential backoff
3. Programar timeout para reconexión
4. Incrementar contador de intentos
5. Remover canal viejo
6. Crear nueva suscripción

### Estados de Reconexión

**idle**: Conexión normal, todo funcionando

**reconnecting**: Intentando reconectar
- Mostrar indicador de reconexión
- Mostrar número de intento

**reconciling**: Reconectado, sincronizando datos
- Verificar duración de desconexión
- Si >5 segundos: considerar refetch de datos
- Mostrar indicador de sincronización

**failed**: Falló después de máximo de intentos
- Mostrar error al usuario
- Ofrecer botón de retry manual
- Recomendar reindexación

### Reconciliación de Datos

Si estuvo desconectado por tiempo significativo (>5 segundos):
1. Marcar estado como "reconciling"
2. Opcionalmente: refetch datos modificados durante desconexión
3. Actualizar stores con datos frescos
4. Marcar como "idle" cuando termine

---

## Gestión de Caché

### Configuración de Persistencia

Usar middleware de Zustand:
- Nombre único para cada store
- Storage: localStorage
- Partialización: controlar qué se persiste

### Estrategia de Partialización

**Persistir**:
- Datos del módulo (usuarios, servicios, etc.)
- Timestamp de última actualización
- Estado de indexación completada

**NO Persistir**:
- Estados transitorios (isIndexing, progress)
- Errores
- Estados de reconexión
- Conexión realtime

### Validación de Caché

Implementar lógica de validación:
1. Verificar existencia de timestamp
2. Calcular tiempo transcurrido desde última actualización
3. Definir duración máxima de caché (ej: 30 minutos)
4. Retornar válido/inválido

### Restauración desde Caché

Al montar componente:
1. Esperar hidratación de Zustand (delay pequeño)
2. Verificar si hay caché válido
3. Si válido: solo conectar realtime
4. Si inválido: iniciar indexación completa

**Importante**: Implementar múltiples verificaciones con delays para permitir hidratación completa desde localStorage.

### Limpieza de Caché

Proporcionar método para limpiar:
- Resetear todos los datos
- Limpiar timestamps
- Resetear estados
- Útil para logout o cambio de usuario

---

## Estados de UI

### IndexationPopover Component

Componente flotante que muestra el estado de indexación y conexión.

**Ubicación Recomendada**: Esquina superior derecha, fixed position

**Estados a Implementar**:

#### 1. Estado de Indexación (Cargando)

**Elementos visuales**:
- Ícono del módulo con animación de pulso
- Texto de etapa actual (pequeño, opacidad reducida)
- Porcentaje de progreso (grande, bold)
- Barra de progreso animada

**Diseño**:

```typescript
{isIndexing && (
  <div className="flex items-start gap-3">
    <motion.div
      className="p-2 rounded-xl bg-blue-500/20"
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <Icon className="w-4 h-4 text-blue-400" />
    </motion.div>
    
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs opacity-50">
          {currentStage}
        </span>
        <span className="text-xs font-bold">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </div>
  </div>
)}
```

#### 2. Estado Indexado (Éxito con Contadores)

**Elementos visuales**:
- Ícono del módulo con gradiente
- Badge de tiempo real (check verde o rayo amarillo)
- Contadores de datos con íconos
- Animación de entrada suave

**Diseño**:

```typescript
{isSuccess && dataCounts && (
  <div className="flex items-center gap-3">
    <motion.div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 relative">
      <Icon className="w-4 h-4 text-blue-400" />
      
      {/* Indicador de tiempo real */}
      <motion.div
        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
          showSyncIndicator 
            ? 'bg-yellow-500 shadow-yellow-500/40' 
            : 'bg-emerald-500 shadow-emerald-500/40'
        }`}
        animate={{ 
          scale: showSyncIndicator ? [1, 1.2, 1] : 1
        }}
      >
        {showSyncIndicator ? (
          <Zap className="w-2.5 h-2.5 text-white" />
        ) : (
          <Check className="w-2.5 h-2.5 text-white" />
        )}
      </motion.div>
    </motion.div>
    
    {/* Contadores de datos */}
    <div className="flex items-center gap-2.5">
      <motion.div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
        <Users className="w-3 h-3 opacity-50" />
        <span className="text-xs font-semibold">{dataCounts.users}</span>
      </motion.div>
      
      <motion.div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
        <Wrench className="w-3 h-3 opacity-50" />
        <span className="text-xs font-semibold">{dataCounts.services}</span>
      </motion.div>
      
      <motion.div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
        <Receipt className="w-3 h-3 opacity-50" />
        <span className="text-xs font-semibold">{dataCounts.payments}</span>
      </motion.div>
    </div>
  </div>
)}
```

#### 3. Estado de Reconexión

**Elementos visuales**:
- Ícono del módulo con pulso
- Spinner de reconexión (amarillo)
- Texto de estado
- Contador de intentos

**Diseño**:

```typescript
{(isReconnecting || isReconciling) && (
  <div className="flex items-center gap-3">
    <motion.div
      className="p-2 rounded-xl bg-blue-500/20 relative"
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <Icon className="w-4 h-4 text-blue-400" />
      
      <motion.div
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-yellow-500 shadow-lg"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-2.5 h-2.5 text-white" />
      </motion.div>
    </motion.div>
    
    <div className="flex-1 flex flex-col gap-1">
      <span className="text-xs font-medium text-yellow-400">
        {isReconnecting ? 'Reconectando...' : 'Sincronizando...'}
      </span>
      <span className="text-[10px] opacity-50">
        {isReconnecting 
          ? `Intento ${reconnectionAttempts + 1}/${maxReconnectionAttempts}`
          : 'Recuperando datos perdidos'
        }
      </span>
    </div>
  </div>
)}
```

#### 4. Estado de Error de Conexión

**Elementos visuales**:
- Ícono del módulo
- Badge de WiFi desconectado (naranja)
- Mensaje de error
- Botón de retry

**Diseño**:

```typescript
{reconnectionFailed && (
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-xl bg-orange-500/20 relative">
      <Icon className="w-4 h-4 text-orange-400" />
      
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-orange-500 shadow-lg">
        <WifiOff className="w-2.5 h-2.5 text-white" />
      </div>
    </div>
    
    <div className="flex-1 flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-orange-400">
          Conexión perdida
        </span>
        <span className="text-[10px] opacity-50">
          Se recomienda reindexar
        </span>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRetry?.(moduleKey)}
        className="p-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30"
      >
        <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
      </motion.button>
    </div>
  </div>
)}
```

#### 5. Estado de Error de Indexación

**Elementos visuales**:
- Ícono del módulo (fondo rojo)
- Ícono de alerta
- Mensaje de error truncado
- Botón de retry

**Diseño**:

```typescript
{isError && (
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-xl bg-red-500/20">
      <Icon className="w-4 h-4 text-red-400" />
    </div>
    
    <div className="flex-1 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
        <span className="text-xs text-red-400/80 truncate max-w-[120px]">
          {error || 'Error'}
        </span>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRetry?.(moduleKey)}
        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30"
      >
        <RefreshCw className="w-3.5 h-3.5 text-red-400" />
      </motion.button>
    </div>
  </div>
)}
```

#### 6. Notificación de Sincronización en Tiempo Real

**Elementos visuales**:
- Ícono de rayo con pulso
- Tipo de actualización
- Subtítulo descriptivo
- Barra de progreso de auto-hide

**Diseño**:

```typescript
{showSyncPopover && (
  <motion.div
    initial={{ opacity: 0, x: 40, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 40, scale: 0.9 }}
    className="bg-black dark:bg-white rounded-2xl shadow-2xl"
  >
    <div className="p-3">
      <div className="flex items-center gap-3">
        <motion.div
          className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.5, repeat: showSyncIndicator ? Infinity : 0 }}
        >
          <Zap className="w-4 h-4 text-yellow-400" />
        </motion.div>
        
        <div className="flex flex-col">
          <span className="text-xs font-medium">
            {lastUpdateType ? UPDATE_TYPE_LABELS[lastUpdateType] : 'Sincronizando'}
          </span>
          <span className="text-[10px] opacity-50">
            Datos actualizados en tiempo real
          </span>
        </div>
      </div>
    </div>
    
    {/* Barra de auto-hide */}
    <div className="px-3 pb-2.5">
      <motion.div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-yellow-500/50 rounded-full"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 4, ease: 'linear' }}
        />
      </motion.div>
    </div>
  </motion.div>
)}
```

#### 7. Animación de Éxito (Partículas)

**Elementos visuales**:
- 8 partículas que vuelan hacia el popover
- Ícono de check que se absorbe
- Efecto de glow
- Flash de color del módulo

**Diseño**:

```typescript
{isAbsorbing && showSuccessFlash && (
  <>
    {/* Partículas */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={`p-${i}`}
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{ background: MODULE_CONFIG[showSuccessFlash].glowColor }}
        initial={{ 
          x: -60 - (i * 12), 
          y: -25 + Math.sin(i) * 35, 
          scale: 1.2, 
          opacity: 1 
        }}
        animate={{ x: 10, y: 15, scale: 0, opacity: 0 }}
        transition={{ duration: 0.5, delay: i * 0.03, ease: [0.32, 0.72, 0, 1] }}
      />
    ))}
    
    {/* Ícono de check */}
    <motion.div
      className="absolute pointer-events-none z-10"
      initial={{ x: -70, y: 5, scale: 1.3, opacity: 1 }}
      animate={{ x: 15, y: 12, scale: 0, opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
    >
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${glowColor}, #10b981)`,
          boxShadow: `0 0 16px ${glowColor}`
        }}
      >
        <Check className="w-3 h-3 text-white" />
      </div>
    </motion.div>
  </>
)}
```

**Comportamiento del Popover**:
- Auto-hide después de 5 segundos cuando todos los módulos están indexados
- Barra de progreso visual del auto-hide
- Reaparece si hay nuevos eventos de indexación
- Se puede dismissar manualmente

---

### RealtimeIndicator Component

Indicador minimalista de conexión en tiempo real.

**Ubicación Recomendada**: Topbar, junto a otros indicadores de estado

**Variantes a Implementar**:

#### 1. Minimal (Solo punto)

**Elementos visuales**:
- Punto de 2x2px
- Verde con pulso cuando conectado
- Amarillo parpadeante cuando desconectado

**Diseño**:

```typescript
{variant === 'minimal' && (
  <div className="relative">
    {isConnected ? (
      <>
        <motion.div
          className="w-2 h-2 rounded-full bg-green-500 relative z-10"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500"
          animate={{
            scale: [1, 2.5],
            opacity: [0.6, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </>
    ) : (
      <motion.div
        className="w-2 h-2 rounded-full bg-yellow-500"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    )}
  </div>
)}
```

#### 2. Default (Ícono + Label)

**Elementos visuales**:
- Ícono WiFi/WifiOff
- Label "Online"/"Offline"
- Pulso radial sutil
- Transiciones suaves

**Diseño**:

```typescript
{variant === 'default' && (
  <div className="flex items-center gap-1.5">
    <AnimatePresence mode="wait">
      {isConnected ? (
        <motion.div key="connected" className="relative">
          <Wifi className="w-3 h-3 text-green-500/60" />
          
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 60%)',
            }}
            animate={{
              scale: [1, 1.5],
              opacity: [0.3, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      ) : (
        <motion.div key="disconnected">
          <motion.div
            animate={{ opacity: [0.6, 0.3, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <WifiOff className="w-3 h-3 text-yellow-500/60" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    
    <span className={`text-[9px] font-semibold uppercase tracking-wider ${
      isConnected ? 'text-green-500/60' : 'text-yellow-500/60'
    }`}>
      {isConnected ? 'Online' : 'Offline'}
    </span>
  </div>
)}
```

#### 3. Detailed (Con barras de señal)

**Elementos visuales**:
- Punto indicador con pulso
- Texto de estado en dos líneas
- Barras de señal animadas (solo cuando conectado)
- Colores diferenciados

**Diseño**:

```typescript
{variant === 'detailed' && (
  <div className="flex items-center gap-2.5">
    {/* Punto indicador */}
    <div className="relative w-2 h-2">
      {isConnected ? (
        <>
          <motion.div
            className="w-2 h-2 rounded-full bg-green-500 relative z-10"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-green-500"
            animate={{
              scale: [1, 2.5],
              opacity: [0.6, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </>
      ) : (
        <motion.div
          className="w-2 h-2 rounded-full bg-yellow-500"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
    
    {/* Texto de estado */}
    <div className="flex flex-col">
      <span className={`text-xs font-semibold ${
        isConnected ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
      }`}>
        {isConnected ? 'Conectado' : 'Desconectado'}
      </span>
      <span className="text-[9px] text-black/40 dark:text-white/40 uppercase tracking-wider">
        Tiempo real
      </span>
    </div>
    
    {/* Barras de señal */}
    {isConnected && (
      <div className="flex items-end gap-0.5 ml-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-0.5 bg-green-500 rounded-full"
            animate={{ height: ['4px', '8px', '4px'] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    )}
  </div>
)}
```

#### 4. Tooltip Mejorado (Offline)

**Elementos visuales**:
- Tooltip grande con información
- Título en bold
- Descripción del problema
- Botón de acción
- Flecha del tooltip

**Diseño**:

```typescript
{showTooltip && !isConnected && (
  <motion.div
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    className="absolute top-full left-0 mt-2 z-50"
  >
    <div className="bg-black/95 dark:bg-white/95 rounded-lg shadow-2xl w-[280px]">
      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-white dark:text-black">
            Conexión perdida
          </p>
          <p className="text-xs opacity-90 leading-relaxed text-white dark:text-black">
            Los cambios podrían no sincronizarse correctamente. 
            Se recomienda reindexar el contenido.
          </p>
        </div>
        
        <div className="pt-2 border-t border-white/10 dark:border-black/10">
          <button
            onClick={handleReindexClick}
            className="w-full text-center px-3 py-2.5 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/15 dark:hover:bg-black/15 transition-all"
          >
            <p className="text-xs font-semibold text-white dark:text-black">
              ¿Cómo reindexar la página?
            </p>
          </button>
        </div>
      </div>
      
      <div className="absolute -top-1 left-3 w-2 h-2 bg-black/95 dark:bg-white/95 transform rotate-45" />
    </div>
  </motion.div>
)}
```

**Comportamiento del Indicador**:
- Tooltip solo aparece en hover
- Tooltip offline tiene más información y acción
- Tooltip online es simple y minimalista
- Transiciones suaves entre estados

---

## Mejores Prácticas

### 1. Prevenir Indexación Concurrente

Usar ref para trackear si indexación está en progreso:
- Verificar al inicio de indexación
- Retornar early si ya está indexando
- Marcar como false en finally block

### 2. Verificar Caché Antes de Indexar

Siempre verificar caché válido:
- Verificar existencia de datos
- Verificar frescura con timestamp
- Si válido: solo conectar realtime
- Si inválido: indexación completa

### 3. Refetch Completo en Eventos de Tiempo Real

No confiar solo en datos del evento:
- Siempre hacer fetch completo a API
- Obtener todas las relaciones
- Asegura consistencia
- Maneja campos calculados

### 4. Manejar Eliminaciones en Cascada

Limpiar manualmente registros relacionados:
- Identificar registros hijos
- Remover de stores
- Base de datos puede no emitir eventos CASCADE

### 5. Delay en Eventos INSERT

Agregar pequeño delay antes de fetch:
- Permite que triggers de BD se completen
- Asegura que datos estén disponibles
- 300ms es suficiente

### 6. Logging de Errores al Servidor

Implementar logging robusto:
- Capturar errores en try/catch
- Enviar a endpoint de logging
- Incluir contexto (módulo, etapa, datos)
- No bloquear flujo si logging falla

### 7. Mantener Canal de Realtime Activo

No desconectar en unmount de componentes:
- Canal persiste entre navegaciones
- Solo limpiar timeouts
- Mejora performance
- Evita reconexiones innecesarias

### 8. Hidratación de Zustand

Esperar hidratación desde localStorage:
- Implementar múltiples verificaciones
- Usar delays pequeños (50-100ms)
- Verificar existencia de datos
- Máximo de intentos para evitar loops

### 9. Actualizar Descuentos en Pagos

Cuando se aplica descuento:
- Extraer información del descuento
- Identificar tipo de pago
- Actualizar pago en store
- Mantener consistencia

### 10. Auto-hide de Notificaciones

Implementar auto-hide inteligente:
- Solo cuando todos los módulos están OK
- Mostrar barra de progreso
- Permitir dismissal manual
- Reaparece si hay nuevos eventos

---

## Resumen de Implementación

### Checklist de Implementación

**Stores**:
- [ ] Crear Indexation Store con Zustand
- [ ] Configurar persistencia selectiva
- [ ] Crear Module Stores para cada módulo
- [ ] Implementar validación de caché

**Hooks**:
- [ ] Crear custom hook de indexación por módulo
- [ ] Implementar función de indexación por etapas
- [ ] Configurar retry con exponential backoff
- [ ] Implementar setup de realtime
- [ ] Implementar manejo de reconexión

**Tiempo Real**:
- [ ] Configurar cliente WebSocket
- [ ] Crear canales por módulo
- [ ] Implementar handlers INSERT/UPDATE/DELETE
- [ ] Implementar event emitter pattern
- [ ] Manejar cambios de estado de conexión

**UI**:
- [ ] Crear IndexationPopover component
- [ ] Implementar todos los estados visuales
- [ ] Crear RealtimeIndicator component
- [ ] Implementar variantes del indicador
- [ ] Agregar animaciones con Framer Motion

**Testing**:
- [ ] Probar indexación completa
- [ ] Probar restauración desde caché
- [ ] Simular desconexiones
- [ ] Probar reconexión automática
- [ ] Verificar sincronización en tiempo real

### Flujo Completo

1. **Inicio**: Verificar caché → Restaurar o Indexar
2. **Indexación**: Etapas → Progreso → Completar
3. **Tiempo Real**: Conectar → Suscribir → Sincronizar
4. **Desconexión**: Detectar → Reconectar → Reconciliar
5. **Persistencia**: Guardar → Validar → Restaurar

### Ventajas del Sistema

✅ **Performance**: Caché inteligente para carga instantánea  
✅ **Confiabilidad**: Retry automático y manejo robusto de errores  
✅ **UX**: Feedback visual claro y animaciones fluidas  
✅ **Escalabilidad**: Arquitectura modular fácil de extender  
✅ **Resiliencia**: Reconexión automática con exponential backoff  
✅ **Sincronización**: Datos siempre actualizados en tiempo real  

### Consideraciones de Producción

⚠️ **Reconciliación**: Implementar fetch incremental durante desconexión larga  
⚠️ **Paginación**: Para datasets grandes, implementar carga por páginas  
⚠️ **Virtualización**: Para listas largas, usar windowing  
⚠️ **Monitoreo**: Agregar telemetría para detectar problemas  
⚠️ **Testing**: Simular condiciones de red adversas  
⚠️ **Seguridad**: Validar permisos en eventos de tiempo real  
⚠️ **Optimización**: Debounce de eventos frecuentes  

---

## Conclusión

Esta arquitectura proporciona un sistema robusto y escalable para indexación de datos en tiempo real. La combinación de caché inteligente, reconexión automática y feedback visual claro asegura una excelente experiencia de usuario.

El sistema está diseñado para ser resiliente ante fallos de red, eficiente en el uso de recursos y fácil de mantener y extender.

---

**Documento creado**: Enero 2026  
**Versión**: 2.0  
**Tipo**: Guía de Implementación

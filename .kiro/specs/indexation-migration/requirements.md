# Requirements Document

## Introduction

Este documento describe los requisitos para migrar el sistema de indexación actual basado en React Context API a una arquitectura moderna basada en Zustand con soporte completo de tiempo real, reconexión automática, y UI mejorada con animaciones avanzadas.

El sistema actual utiliza 7 contextos independientes para gestionar la indexación de diferentes módulos (INEA, ITEA, NoListado, Resguardos, etc.), con funcionalidad básica de caché en localStorage y suscripciones de tiempo real mediante Supabase Realtime. La nueva arquitectura proporcionará un sistema más robusto, escalable y con mejor experiencia de usuario.

## Glossary

- **Indexation_System**: Sistema completo de carga y sincronización de datos desde la base de datos
- **Module**: Unidad lógica de datos (INEA, ITEA, NoListado, Resguardos, etc.)
- **Zustand_Store**: Store de gestión de estado usando la librería Zustand
- **Global_Store**: Store de Zustand que gestiona el estado de indexación de todos los módulos
- **Module_Store**: Store de Zustand específico para los datos de un módulo
- **Indexation_Stage**: Etapa individual del proceso de indexación con peso asignado
- **Progress**: Porcentaje de completitud de la indexación (0-100)
- **Realtime_Connection**: Conexión WebSocket para sincronización en tiempo real
- **Exponential_Backoff**: Estrategia de reintento con delays incrementales exponenciales
- **Reconnection_Status**: Estado del proceso de reconexión (idle/reconnecting/reconciling/failed)
- **Cache_Validation**: Proceso de verificar si los datos en caché son recientes y válidos
- **Event_Emitter**: Patrón para notificar a componentes de cambios en tiempo real
- **Persistence**: Almacenamiento de datos en localStorage
- **Reconciliation**: Proceso de sincronización de datos después de una desconexión
- **IndexationPopover**: Componente UI que muestra el estado de indexación
- **RealtimeIndicator**: Componente UI que muestra el estado de conexión en tiempo real
- **Framer_Motion**: Librería de animaciones para React
- **Supabase_Realtime**: Sistema de WebSockets de Supabase para cambios en tiempo real

## Requirements

### Requirement 1: Instalación de Dependencias

**User Story:** Como desarrollador, quiero instalar las dependencias necesarias, para que el proyecto tenga todas las librerías requeridas para la nueva arquitectura.

#### Acceptance Criteria

1. THE System SHALL instalar Zustand versión 4.x o superior
2. THE System SHALL instalar Framer Motion versión 11.x o superior
3. THE System SHALL verificar que Supabase client esté instalado
4. THE System SHALL verificar que TypeScript esté configurado correctamente

### Requirement 2: Definición de Tipos TypeScript

**User Story:** Como desarrollador, quiero definir todos los tipos TypeScript necesarios, para que el código tenga type safety completo.

#### Acceptance Criteria

1. THE System SHALL definir tipos para el estado de indexación de módulos
2. THE System SHALL definir tipos para etapas de indexación con key, label y weight
3. THE System SHALL definir tipos para estados de reconexión (idle/reconnecting/reconciling/failed)
4. THE System SHALL definir tipos para eventos de tiempo real (INSERT/UPDATE/DELETE)
5. THE System SHALL definir tipos para configuración de módulos
6. THE System SHALL definir tipos para datos de cada módulo (MuebleINEA, MuebleITEA, etc.)
7. THE System SHALL definir tipos para callbacks de event emitter

### Requirement 3: Store Global de Indexación

**User Story:** Como desarrollador, quiero un store global de Zustand para gestionar el estado de indexación, para que todos los módulos compartan un estado centralizado.

#### Acceptance Criteria

1. THE Global_Store SHALL mantener el estado de indexación para cada módulo
2. WHEN se inicia indexación, THE Global_Store SHALL actualizar isIndexing a true
3. WHEN se actualiza progreso, THE Global_Store SHALL calcular porcentaje basado en pesos de etapas
4. WHEN se completa indexación, THE Global_Store SHALL marcar isIndexed como true
5. WHEN ocurre un error, THE Global_Store SHALL almacenar el mensaje de error
6. THE Global_Store SHALL mantener estado de conexión en tiempo real por módulo
7. THE Global_Store SHALL mantener contador de intentos de reconexión
8. THE Global_Store SHALL mantener timestamps de última indexación y último evento
9. THE Global_Store SHALL persistir solo datos esenciales (isIndexed, timestamps)
10. THE Global_Store SHALL NO persistir estados transitorios (progress, isIndexing, errors)

### Requirement 4: Stores de Módulos

**User Story:** Como desarrollador, quiero stores individuales para cada módulo, para que los datos estén organizados y sean fáciles de acceder.

#### Acceptance Criteria

1. THE System SHALL crear un Module_Store para INEA (tabla: muebles)
2. THE System SHALL crear un Module_Store para ITEA (tabla: mueblestlax)
3. THE System SHALL crear un Module_Store para INEA Obsoletos (tabla: muebles con estatus BAJA)
4. THE System SHALL crear un Module_Store para ITEA Obsoletos (tabla: mueblestlax con estatus BAJA)
5. THE System SHALL crear un Module_Store para No Listado (tabla: mueblestlaxcala)
6. THE System SHALL crear un Module_Store para Resguardos (tabla: resguardos)
7. THE System SHALL crear un Module_Store para Resguardos Bajas (tabla: resguardos_bajas)
8. WHEN se almacenan datos, THE Module_Store SHALL guardar timestamp de última actualización
9. THE Module_Store SHALL proporcionar métodos para agregar, actualizar y eliminar registros
10. THE Module_Store SHALL persistir datos en localStorage
11. THE Module_Store SHALL proporcionar método de validación de caché

### Requirement 5: Validación de Caché

**User Story:** Como usuario, quiero que el sistema valide si los datos en caché son recientes, para que no se usen datos obsoletos.

#### Acceptance Criteria

1. WHEN se verifica caché, THE System SHALL comprobar existencia de timestamp
2. WHEN existe timestamp, THE System SHALL calcular tiempo transcurrido
3. IF tiempo transcurrido es mayor a 30 minutos, THEN THE System SHALL considerar caché inválido
4. IF caché es válido, THEN THE System SHALL cargar datos desde localStorage
5. IF caché es inválido, THEN THE System SHALL iniciar indexación completa

### Requirement 6: Indexación por Etapas

**User Story:** Como usuario, quiero ver el progreso de indexación por etapas, para que sepa qué está cargando el sistema.

#### Acceptance Criteria

1. THE System SHALL definir etapas de indexación para cada módulo con pesos
2. WHEN se ejecuta una etapa, THE System SHALL actualizar currentStage con descripción
3. WHEN se completa una etapa, THE System SHALL calcular progreso acumulado
4. THE System SHALL asegurar que la suma de pesos de todas las etapas sea 100
5. WHEN se completan todas las etapas, THE System SHALL marcar progreso como 100%

### Requirement 7: Retry con Exponential Backoff

**User Story:** Como usuario, quiero que el sistema reintente operaciones fallidas automáticamente, para que errores temporales no interrumpan la indexación.

#### Acceptance Criteria

1. WHEN una operación falla, THE System SHALL reintentar hasta 3 veces
2. WHEN se reintenta, THE System SHALL esperar delay calculado con exponential backoff
3. THE System SHALL usar delay base de 1000ms
4. THE System SHALL usar multiplicador de 2 para calcular delays
5. THE System SHALL limitar delay máximo a 10000ms
6. IF se agotan los reintentos, THEN THE System SHALL reportar error al usuario

### Requirement 8: Configuración de Tiempo Real

**User Story:** Como usuario, quiero que los datos se sincronicen automáticamente en tiempo real, para que siempre vea información actualizada.

#### Acceptance Criteria

1. WHEN indexación se completa, THE System SHALL establecer conexión WebSocket
2. THE System SHALL suscribirse a cambios en la tabla correspondiente del módulo
3. WHEN ocurre INSERT, THE System SHALL agregar nuevo registro al store
4. WHEN ocurre UPDATE, THE System SHALL refetch registro completo y actualizar store
5. WHEN ocurre DELETE, THE System SHALL remover registro del store
6. THE System SHALL manejar eliminaciones en cascada para registros relacionados
7. THE System SHALL agregar delay de 300ms antes de fetch en eventos INSERT

### Requirement 8: Reconexión Automática

**User Story:** Como usuario, quiero que el sistema se reconecte automáticamente si pierde conexión, para que no tenga que recargar la página.

#### Acceptance Criteria

1. WHEN conexión se pierde, THE System SHALL detectar cambio de estado
2. WHEN se detecta desconexión, THE System SHALL guardar timestamp de desconexión
3. WHEN se inicia reconexión, THE System SHALL actualizar reconnectionStatus a "reconnecting"
4. THE System SHALL reintentar conexión hasta 5 veces
5. THE System SHALL usar exponential backoff con delay base de 2000ms
6. THE System SHALL usar multiplicador de 2 para calcular delays de reconexión
7. THE System SHALL limitar delay máximo de reconexión a 30000ms
8. IF reconexión es exitosa, THEN THE System SHALL actualizar reconnectionStatus a "reconciling"
9. IF se agotan intentos, THEN THE System SHALL actualizar reconnectionStatus a "failed"

### Requirement 9: Reconciliación de Datos

**User Story:** Como usuario, quiero que el sistema sincronice datos perdidos después de una desconexión, para que no pierda información.

#### Acceptance Criteria

1. WHEN reconexión es exitosa, THE System SHALL calcular duración de desconexión
2. IF desconexión duró más de 5 segundos, THEN THE System SHALL iniciar reconciliación
3. WHEN se reconcilia, THE System SHALL refetch datos modificados durante desconexión
4. WHEN reconciliación completa, THE System SHALL actualizar reconnectionStatus a "idle"
5. THE System SHALL actualizar timestamp de último evento recibido

### Requirement 10: Event Emitter Pattern

**User Story:** Como desarrollador, quiero un sistema de eventos para notificar cambios, para que los componentes UI se actualicen automáticamente.

#### Acceptance Criteria

1. THE System SHALL mantener Set de callbacks registrados por módulo
2. THE System SHALL proporcionar función para registrar listeners
3. WHEN se registra listener, THE System SHALL retornar función de cleanup
4. WHEN ocurre evento, THE System SHALL notificar a todos los listeners registrados
5. THE System SHALL pasar datos del evento a los callbacks

### Requirement 11: Utilidad de Exponential Backoff

**User Story:** Como desarrollador, quiero una utilidad reutilizable de exponential backoff, para que sea fácil implementar reintentos en todo el sistema.

#### Acceptance Criteria

1. THE Exponential_Backoff SHALL aceptar configuración de intentos máximos
2. THE Exponential_Backoff SHALL aceptar configuración de delay base
3. THE Exponential_Backoff SHALL aceptar configuración de delay máximo
4. THE Exponential_Backoff SHALL aceptar configuración de multiplicador
5. WHEN se calcula delay, THE Exponential_Backoff SHALL usar fórmula: min(delayBase * (multiplicador ^ intento), delayMax)
6. THE Exponential_Backoff SHALL ejecutar función proporcionada con reintentos automáticos

### Requirement 12: Custom Hooks de Indexación

**User Story:** Como desarrollador, quiero hooks personalizados para cada módulo, para que sea fácil usar la indexación en componentes.

#### Acceptance Criteria

1. THE System SHALL crear hook useIneaIndexation
2. THE System SHALL crear hook useIteaIndexation
3. THE System SHALL crear hook useNoListadoIndexation
4. THE System SHALL crear hook useResguardosIndexation
5. THE System SHALL crear hook useIneaObsoletosIndexation
6. THE System SHALL crear hook useIteaObsoletosIndexation
7. THE System SHALL crear hook useResguardosBajasIndexation
8. WHEN se monta componente, THE hook SHALL verificar caché válido
9. IF caché es válido, THEN THE hook SHALL solo conectar realtime
10. IF caché es inválido, THEN THE hook SHALL iniciar indexación completa
11. THE hook SHALL configurar suscripciones de tiempo real
12. THE hook SHALL manejar reconexión automática
13. THE hook SHALL retornar estados y funciones de control

### Requirement 13: IndexationPopover Mejorado

**User Story:** Como usuario, quiero ver un popover mejorado con el estado de indexación, para que tenga feedback visual claro del progreso.

#### Acceptance Criteria

1. THE IndexationPopover SHALL mostrar estado de indexación para todos los módulos
2. WHEN está indexando, THE IndexationPopover SHALL mostrar ícono con animación de pulso
3. WHEN está indexando, THE IndexationPopover SHALL mostrar etapa actual
4. WHEN está indexando, THE IndexationPopover SHALL mostrar porcentaje de progreso
5. WHEN está indexando, THE IndexationPopover SHALL mostrar barra de progreso animada
6. WHEN indexación completa, THE IndexationPopover SHALL mostrar ícono con gradiente
7. WHEN indexación completa, THE IndexationPopover SHALL mostrar badge de tiempo real
8. WHEN indexación completa, THE IndexationPopover SHALL mostrar contadores de datos
9. WHEN está reconectando, THE IndexationPopover SHALL mostrar spinner amarillo
10. WHEN está reconectando, THE IndexationPopover SHALL mostrar contador de intentos
11. WHEN reconexión falla, THE IndexationPopover SHALL mostrar badge de WiFi desconectado
12. WHEN reconexión falla, THE IndexationPopover SHALL mostrar botón de retry
13. WHEN ocurre error, THE IndexationPopover SHALL mostrar ícono de alerta
14. WHEN ocurre error, THE IndexationPopover SHALL mostrar mensaje de error
15. WHEN ocurre error, THE IndexationPopover SHALL mostrar botón de retry
16. WHEN se recibe evento en tiempo real, THE IndexationPopover SHALL mostrar notificación temporal
17. WHEN todos los módulos están completos, THE IndexationPopover SHALL auto-ocultarse después de 5 segundos
18. THE IndexationPopover SHALL mostrar barra de progreso de auto-hide

### Requirement 14: Animación de Éxito con Partículas

**User Story:** Como usuario, quiero ver una animación de éxito cuando se completa la indexación, para que tenga feedback visual satisfactorio.

#### Acceptance Criteria

1. WHEN indexación se completa, THE System SHALL mostrar 8 partículas volando hacia el popover
2. THE System SHALL mostrar ícono de check que se absorbe en el popover
3. THE System SHALL aplicar efecto de glow con color del módulo
4. THE System SHALL aplicar flash de color del módulo
5. THE System SHALL animar partículas con duración de 0.5 segundos
6. THE System SHALL escalonar animación de partículas con delay de 0.03s entre cada una

### Requirement 15: RealtimeIndicator Component

**User Story:** Como usuario, quiero ver un indicador de conexión en tiempo real, para que sepa si el sistema está sincronizado.

#### Acceptance Criteria

1. THE RealtimeIndicator SHALL soportar variante "minimal" (solo punto)
2. THE RealtimeIndicator SHALL soportar variante "default" (ícono + label)
3. THE RealtimeIndicator SHALL soportar variante "detailed" (punto + texto + barras)
4. WHEN está conectado en variante minimal, THE RealtimeIndicator SHALL mostrar punto verde con pulso
5. WHEN está desconectado en variante minimal, THE RealtimeIndicator SHALL mostrar punto amarillo parpadeante
6. WHEN está conectado en variante default, THE RealtimeIndicator SHALL mostrar ícono WiFi con pulso radial
7. WHEN está desconectado en variante default, THE RealtimeIndicator SHALL mostrar ícono WifiOff parpadeante
8. WHEN está conectado en variante detailed, THE RealtimeIndicator SHALL mostrar barras de señal animadas
9. WHEN está desconectado, THE RealtimeIndicator SHALL mostrar tooltip con información y botón de acción
10. THE RealtimeIndicator SHALL ubicarse en el topbar junto a otros indicadores

### Requirement 16: Persistencia Selectiva

**User Story:** Como desarrollador, quiero que solo se persistan datos importantes, para que localStorage no se llene de datos innecesarios.

#### Acceptance Criteria

1. THE System SHALL persistir estado de indexación completada (isIndexed)
2. THE System SHALL persistir timestamp de última indexación (lastIndexedAt)
3. THE System SHALL persistir timestamp de último evento (lastEventReceivedAt)
4. THE System SHALL persistir datos de módulos en Module_Stores
5. THE System SHALL NO persistir progreso actual (progress)
6. THE System SHALL NO persistir estado de indexación en curso (isIndexing)
7. THE System SHALL NO persistir errores (error)
8. THE System SHALL NO persistir estado de reconexión (reconnectionStatus)
9. THE System SHALL NO persistir estado de conexión realtime (realtimeConnected)

### Requirement 17: Migración Gradual por Módulo

**User Story:** Como desarrollador, quiero migrar módulos uno por uno, para que la migración sea segura y no rompa funcionalidad existente.

#### Acceptance Criteria

1. THE System SHALL migrar INEA como módulo piloto primero
2. WHEN INEA está migrado y probado, THE System SHALL migrar ITEA
3. WHEN ITEA está migrado y probado, THE System SHALL migrar No Listado
4. WHEN No Listado está migrado y probado, THE System SHALL migrar Resguardos
5. WHEN Resguardos está migrado y probado, THE System SHALL migrar módulos obsoletos
6. THE System SHALL mantener contextos viejos funcionando durante migración
7. THE System SHALL permitir rollback a contextos viejos si hay problemas

### Requirement 18: Limpieza de Código Legacy

**User Story:** Como desarrollador, quiero eliminar código legacy después de la migración, para que el código esté limpio y mantenible.

#### Acceptance Criteria

1. WHEN todos los módulos están migrados, THE System SHALL eliminar IneaIndexationContext.tsx
2. WHEN todos los módulos están migrados, THE System SHALL eliminar IteaIndexationContext.tsx
3. WHEN todos los módulos están migrados, THE System SHALL eliminar IneaObsoletosIndexationContext.tsx
4. WHEN todos los módulos están migrados, THE System SHALL eliminar IteaObsoletosIndexationContext.tsx
5. WHEN todos los módulos están migrados, THE System SHALL eliminar NoListadoIndexationContext.tsx
6. WHEN todos los módulos están migrados, THE System SHALL eliminar ResguardosIndexationContext.tsx
7. WHEN todos los módulos están migrados, THE System SHALL eliminar ResguardosBajasIndexationContext.tsx
8. WHEN todos los módulos están migrados, THE System SHALL actualizar IndexationPopover.tsx para usar nuevos hooks

### Requirement 19: Testing de Componentes

**User Story:** Como desarrollador, quiero tests para cada componente, para que el sistema sea confiable y mantenible.

#### Acceptance Criteria

1. THE System SHALL tener tests para Global_Store
2. THE System SHALL tener tests para cada Module_Store
3. THE System SHALL tener tests para cada custom hook
4. THE System SHALL tener tests para IndexationPopover
5. THE System SHALL tener tests para RealtimeIndicator
6. THE System SHALL tener tests para utilidad de exponential backoff
7. THE System SHALL tener tests para event emitter
8. THE System SHALL simular desconexiones en tests
9. THE System SHALL simular eventos de tiempo real en tests
10. THE System SHALL verificar persistencia en localStorage en tests

### Requirement 20: Documentación

**User Story:** Como desarrollador, quiero documentación clara del nuevo sistema, para que sea fácil mantener y extender.

#### Acceptance Criteria

1. THE System SHALL documentar arquitectura general en README
2. THE System SHALL documentar cada store con JSDoc
3. THE System SHALL documentar cada hook con JSDoc
4. THE System SHALL documentar componentes UI con JSDoc
5. THE System SHALL incluir ejemplos de uso en documentación
6. THE System SHALL documentar proceso de migración
7. THE System SHALL documentar cómo agregar nuevos módulos

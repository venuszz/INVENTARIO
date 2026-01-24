# Implementation Plan: Indexation System Migration

## Overview

Este plan describe la migración completa del sistema de indexación desde React Context API a Zustand, implementando indexación por etapas, reconexión automática, y UI mejorada con animaciones. La migración se realizará de forma gradual, módulo por módulo, comenzando con INEA como piloto para validar la arquitectura antes de migrar el resto.

## Tasks

- [x] 1. Fase 1: Setup y Dependencias
  - [x] 1.1 Instalar dependencias necesarias
    - Ejecutar `npm install zustand@^4.0.0 framer-motion@^11.0.0`
    - Verificar que las dependencias se instalen correctamente
    - Verificar versiones en package.json
    - _Requirements: 1.1, 1.2_
  
  - [x] 1.2 Crear archivo de tipos TypeScript
    - Crear src/types/indexation.ts
    - Definir tipos para estados de indexación (ModuleIndexationState)
    - Definir tipos para etapas (IndexationStage)
    - Definir tipos para reconexión (ReconnectionStatus)
    - Definir tipos para eventos (RealtimeEventType)
    - Definir tipos para configuración (ModuleConfig, ExponentialBackoffConfig)
    - Definir tipos para datos de módulos (MuebleINEA, MuebleITEA, etc.)
    - Definir tipos para callbacks (EventCallback)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 2. Fase 2: Utilidades Base
  - [x] 2.1 Implementar utilidad de Exponential Backoff
    - Crear src/lib/indexation/exponentialBackoff.ts
    - Implementar función withExponentialBackoff con configuración
    - Implementar cálculo de delay: min(baseDelay * (multiplier ^ attempt), maxDelay)
    - Implementar loop de reintentos con manejo de errores
    - Agregar logging de intentos
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [ ]* 2.2 Escribir property test para Exponential Backoff
    - **Property 12: Exponential backoff correcto**
    - **Validates: Requirements 7.2, 7.5, 8.5, 11.5**
    - Generar configuraciones aleatorias de backoff
    - Verificar que delay calculado siga fórmula correcta
    - Verificar que delay nunca exceda maxDelay
    - Configurar 100 iteraciones mínimo
  
  - [x] 2.3 Implementar Event Emitter
    - Crear src/lib/indexation/eventEmitter.ts
    - Implementar clase EventEmitter con Set de listeners
    - Implementar método subscribe que retorna cleanup function
    - Implementar método emit que notifica a todos los listeners
    - Implementar método clear
    - Crear instancias de emitters para cada módulo
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 2.4 Escribir property tests para Event Emitter
    - **Property 19: Event emitter retorna cleanup**
    - **Validates: Requirements 10.3**
    - **Property 20: Event emitter notifica a todos los listeners**
    - **Validates: Requirements 10.4**
    - Generar número aleatorio de listeners
    - Verificar que cleanup remueva listener correctamente
    - Verificar que todos los listeners sean notificados
    - Configurar 100 iteraciones mínimo


- [x] 3. Fase 3: Stores Base
  - [x] 3.1 Crear Global Indexation Store
    - Crear src/stores/indexationStore.ts
    - Implementar store con Zustand
    - Definir estado modules como Record<string, ModuleIndexationState>
    - Implementar acción startIndexation
    - Implementar acción updateProgress
    - Implementar acción completeIndexation
    - Implementar acción setError
    - Implementar acción updateRealtimeConnection
    - Implementar acción updateReconnectionStatus
    - Implementar acción incrementReconnectionAttempts
    - Implementar acción resetReconnectionAttempts
    - Implementar acción setDisconnectedAt
    - Implementar acción updateLastEventReceived
    - Implementar acción resetModule
    - Configurar middleware de persistencia con partialize
    - Persistir solo: isIndexed, lastIndexedAt, lastEventReceivedAt
    - NO persistir: progress, isIndexing, error, reconnectionStatus, realtimeConnected
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_
  
  - [ ]* 3.2 Escribir property tests para Global Store
    - **Property 1: Iniciar indexación actualiza estado**
    - **Validates: Requirements 3.2**
    - **Property 3: Completar indexación actualiza estado**
    - **Validates: Requirements 3.4**
    - **Property 4: Almacenamiento de errores**
    - **Validates: Requirements 3.5**
    - **Property 5: Persistencia selectiva**
    - **Validates: Requirements 3.9, 3.10, 16.1-16.9**
    - Generar módulos aleatorios
    - Verificar estados después de cada acción
    - Verificar persistencia en localStorage
    - Configurar 100 iteraciones mínimo
  
  - [x] 3.3 Crear INEA Store (módulo piloto)
    - Crear src/stores/ineaStore.ts
    - Implementar store con Zustand y persistencia
    - Definir estado: muebles array, lastFetchedAt
    - Implementar acción setMuebles
    - Implementar acción addMueble
    - Implementar acción updateMueble
    - Implementar acción removeMueble
    - Implementar método isCacheValid con parámetro maxAgeMinutes
    - Implementar acción clearCache
    - Configurar persistencia completa del store
    - _Requirements: 4.1, 4.8, 4.9, 4.10, 4.11_
  
  - [ ]* 3.4 Escribir property tests para INEA Store
    - **Property 6: Timestamp de actualización en stores**
    - **Validates: Requirements 4.8**
    - **Property 7: Persistencia de datos en localStorage**
    - **Validates: Requirements 4.10**
    - **Property 9: Validación de caché por antigüedad**
    - **Validates: Requirements 5.3**
    - Generar muebles aleatorios
    - Verificar timestamp después de operaciones
    - Verificar persistencia en localStorage
    - Verificar validación de caché con diferentes timestamps
    - Configurar 100 iteraciones mínimo

- [x] 4. Fase 4: Migración INEA (Módulo Piloto)
  - [x] 4.1 Crear configuración de módulo INEA
    - Crear src/config/modules.ts
    - Definir configuración para INEA con key, name, table, stages, glowColor, icon
    - Definir etapas: fetch_muebles (90%), setup_realtime (10%)
    - Exportar MODULE_CONFIGS como Record
    - _Requirements: 6.1, 6.4_
  
  - [ ]* 4.2 Escribir property test para configuración de módulos
    - **Property 10: Suma de pesos de etapas**
    - **Validates: Requirements 6.4**
    - Verificar que suma de pesos sea exactamente 100 para cada módulo
    - Configurar 100 iteraciones mínimo
  
  - [x] 4.3 Crear custom hook useIneaIndexation
    - Crear src/hooks/indexation/useIneaIndexation.ts
    - Importar stores y utilidades necesarias
    - Definir constante MODULE_KEY = 'inea'
    - Definir STAGES con pesos
    - Implementar función indexData con indexación por etapas
    - Implementar Etapa 1: Fetch muebles con retry (3 intentos, delay base 1000ms)
    - Implementar actualización de progreso después de cada etapa
    - Implementar Etapa 2: Setup realtime
    - Implementar función setupRealtimeSubscription
    - Configurar canal de Supabase Realtime para tabla 'muebles'
    - Implementar handler para evento INSERT con delay de 300ms y refetch completo
    - Implementar handler para evento UPDATE con refetch completo
    - Implementar handler para evento DELETE con limpieza de relacionados
    - Implementar handler para cambios de estado de conexión (system events)
    - Implementar función handleReconnection con exponential backoff (5 intentos, delay base 2000ms)
    - Implementar función handleReconciliation para desconexiones >5 segundos
    - Implementar useEffect para inicialización con verificación de caché
    - Si caché válido: solo conectar realtime
    - Si caché inválido: indexación completa
    - Implementar cleanup de timeouts en unmount
    - Retornar estados y funciones (isIndexing, isIndexed, progress, etc.)
    - _Requirements: 12.1, 12.8, 12.9, 12.10, 12.11, 12.12, 12.13, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.1-8.9, 9.1-9.5_
  
  - [ ]* 4.4 Escribir property tests para hook de indexación
    - **Property 11: Número de reintentos**
    - **Validates: Requirements 7.1**
    - **Property 13: Evento INSERT agrega registro**
    - **Validates: Requirements 8.3**
    - **Property 14: Evento UPDATE actualiza registro**
    - **Validates: Requirements 8.4**
    - **Property 15: Evento DELETE remueve registro**
    - **Validates: Requirements 8.5**
    - **Property 16: Timestamp de desconexión**
    - **Validates: Requirements 8.2**
    - **Property 17: Número de intentos de reconexión**
    - **Validates: Requirements 8.4**
    - **Property 18: Reconciliación después de desconexión larga**
    - **Validates: Requirements 9.2**
    - Mockear Supabase client
    - Simular fallos de red
    - Simular eventos de tiempo real
    - Simular desconexiones y reconexiones
    - Configurar 100 iteraciones mínimo
  
  - [x] 4.5 Actualizar componentes para usar nuevo hook INEA
    - Identificar componentes que usan useIneaIndexation del contexto viejo
    - Actualizar imports para usar nuevo hook
    - Verificar que la interfaz del hook sea compatible
    - Probar funcionalidad en desarrollo
    - _Requirements: 17.1_
  
  - [x] 4.6 Checkpoint - Validar migración INEA
    - Verificar que indexación de INEA funcione correctamente
    - Verificar que caché funcione correctamente
    - Verificar que tiempo real funcione correctamente
    - Verificar que reconexión funcione correctamente
    - Probar en diferentes escenarios (caché válido, inválido, desconexiones)
    - Asegurar que todos los tests pasen
    - Preguntar al usuario si hay problemas antes de continuar

- [-] 5. Fase 5: Migración Resto de Módulos
  - [x] 5.1 Crear ITEA Store
    - Crear src/stores/iteaStore.ts
    - Implementar estructura similar a INEA Store
    - Adaptar tipos para MuebleITEA
    - Configurar persistencia
    - _Requirements: 4.2_
  
  - [x] 5.2 Crear hook useIteaIndexation
    - Crear src/hooks/indexation/useIteaIndexation.ts
    - Implementar estructura similar a useIneaIndexation
    - Adaptar para tabla 'mueblestlax'
    - Configurar etapas y pesos
    - _Requirements: 12.2_
  
  - [ ]* 5.3 Escribir tests para ITEA
    - Adaptar tests de INEA para ITEA
    - Verificar comportamiento específico de ITEA
  
  - [x] 5.4 Actualizar componentes para usar ITEA
    - Actualizar imports en componentes
    - Verificar funcionalidad
    - _Requirements: 17.2_
  
  - [x] 5.5 Crear No Listado Store
    - Crear src/stores/noListadoStore.ts
    - Implementar estructura similar a INEA Store
    - Adaptar tipos para MuebleNoListado
    - Configurar persistencia
    - _Requirements: 4.5_
  
  - [x] 5.6 Crear hook useNoListadoIndexation
    - Crear src/hooks/indexation/useNoListadoIndexation.ts
    - Implementar estructura similar a useIneaIndexation
    - Adaptar para tabla 'mueblestlaxcala'
    - Configurar etapas y pesos
    - _Requirements: 12.3_
  
  - [ ]* 5.7 Escribir tests para No Listado
    - Adaptar tests de INEA para No Listado
    - Verificar comportamiento específico
  
  - [x] 5.8 Actualizar componentes para usar No Listado
    - Actualizar imports en componentes
    - Verificar funcionalidad
    - _Requirements: 17.3_
  
  - [x] 5.9 Crear Resguardos Store
    - Crear src/stores/resguardosStore.ts
    - Implementar estructura similar a INEA Store
    - Adaptar tipos para Resguardo
    - Configurar persistencia
    - _Requirements: 4.6_
  
  - [x] 5.10 Crear hook useResguardosIndexation
    - Crear src/hooks/indexation/useResguardosIndexation.ts
    - Implementar estructura similar a useIneaIndexation
    - Adaptar para tabla 'resguardos'
    - Configurar etapas y pesos
    - _Requirements: 12.4_
  
  - [ ]* 5.11 Escribir tests para Resguardos
    - Adaptar tests de INEA para Resguardos
    - Verificar comportamiento específico
  
  - [x] 5.12 Actualizar componentes para usar Resguardos
    - Actualizar imports en componentes
    - Verificar funcionalidad
    - _Requirements: 17.4_
  
  - [x] 5.13 Crear INEA Obsoletos Store
    - Crear src/stores/ineaObsoletosStore.ts
    - Implementar estructura similar a INEA Store
    - Adaptar para filtrar estatus BAJA
    - Configurar persistencia
    - _Requirements: 4.3_
  
  - [x] 5.14 Crear hook useIneaObsoletosIndexation
    - Crear src/hooks/indexation/useIneaObsoletosIndexation.ts
    - Implementar estructura similar a useIneaIndexation
    - Adaptar query para estatus = 'BAJA'
    - Configurar etapas y pesos
    - _Requirements: 12.5_
  
  - [ ]* 5.15 Escribir tests para INEA Obsoletos
    - Adaptar tests de INEA para Obsoletos
    - Verificar filtrado por estatus
  
  - [x] 5.16 Actualizar componentes para usar INEA Obsoletos
    - Actualizar imports en componentes
    - Verificar funcionalidad
    - _Requirements: 17.5_
  
  - [x] 5.17 Crear ITEA Obsoletos Store
    - Crear src/stores/iteaObsoletosStore.ts
    - Implementar estructura similar a INEA Store
    - Adaptar para filtrar estatus BAJA
    - Configurar persistencia
    - _Requirements: 4.4_
  
  - [x] 5.18 Crear hook useIteaObsoletosIndexation
    - Crear src/hooks/indexation/useIteaObsoletosIndexation.ts
    - Implementar estructura similar a useIneaIndexation
    - Adaptar query para estatus = 'BAJA'
    - Configurar etapas y pesos
    - _Requirements: 12.6_
  
  - [ ]* 5.19 Escribir tests para ITEA Obsoletos
    - Adaptar tests de INEA para Obsoletos
    - Verificar filtrado por estatus
  
  - [x] 5.20 Actualizar componentes para usar ITEA Obsoletos
    - Actualizar imports en componentes
    - Verificar funcionalidad
    - _Requirements: 17.5_
  
  - [x] 5.21 Crear Resguardos Bajas Store
    - Crear src/stores/resguardosBajasStore.ts
    - Implementar estructura similar a INEA Store
    - Adaptar tipos para ResguardoBaja
    - Configurar persistencia
    - _Requirements: 4.7_
  
  - [x] 5.22 Crear hook useResguardosBajasIndexation
    - Crear src/hooks/indexation/useResguardosBajasIndexation.ts
    - Implementar estructura similar a useIneaIndexation
    - Adaptar para tabla 'resguardos_bajas'
    - Configurar etapas y pesos
    - _Requirements: 12.7_
  
  - [ ]* 5.23 Escribir tests para Resguardos Bajas
    - Adaptar tests de INEA para Resguardos Bajas
    - Verificar comportamiento específico
  
  - [x] 5.24 Actualizar componentes para usar Resguardos Bajas
    - Actualizar imports en componentes
    - Verificar funcionalidad
    - _Requirements: 17.5_
  
  - [x] 5.25 Checkpoint - Validar migración de todos los módulos
    - Verificar que todos los módulos funcionen correctamente
    - Verificar que no haya regresiones
    - Probar escenarios de uso real
    - Asegurar que todos los tests pasen
    - Preguntar al usuario si hay problemas antes de continuar


- [-] 6. Fase 6: UI Mejorada
  - [x] 6.1 Crear RealtimeIndicator Component
    - Crear src/components/RealtimeIndicator.tsx
    - Implementar props: variant ('minimal' | 'default' | 'detailed'), isConnected
    - Implementar variante 'minimal': punto con pulso (verde conectado, amarillo desconectado)
    - Implementar variante 'default': ícono WiFi/WifiOff con label y pulso radial
    - Implementar variante 'detailed': punto + texto + barras de señal animadas
    - Implementar tooltip para estado desconectado con información y botón de acción
    - Usar Framer Motion para todas las animaciones
    - Implementar transiciones suaves entre estados
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10_
  
  - [ ]* 6.2 Escribir tests para RealtimeIndicator
    - Test de renderizado de cada variante
    - Test de cambio de estado conectado/desconectado
    - Test de tooltip en hover
    - Snapshot tests para regresión visual
  
  - [x] 6.3 Refactorizar IndexationPopover - Parte 1: Estructura base
    - Actualizar src/components/IndexationPopover.tsx
    - Importar todos los nuevos hooks de indexación
    - Importar Framer Motion components (motion, AnimatePresence)
    - Importar íconos necesarios de lucide-react
    - Definir estados locales para UI (isExpanded, showSyncPopover, etc.)
    - Implementar lógica de visibilidad y auto-hide
    - _Requirements: 13.1_
  
  - [x] 6.4 Refactorizar IndexationPopover - Parte 2: Estado de Indexación
    - Implementar renderizado de estado "indexando"
    - Mostrar ícono del módulo con animación de pulso
    - Mostrar texto de etapa actual con opacidad reducida
    - Mostrar porcentaje de progreso grande y bold
    - Implementar barra de progreso animada con Framer Motion
    - _Requirements: 13.2, 13.3, 13.4, 13.5_
  
  - [x] 6.5 Refactorizar IndexationPopover - Parte 3: Estado Indexado
    - Implementar renderizado de estado "éxito"
    - Mostrar ícono del módulo con gradiente
    - Implementar badge de tiempo real (check verde o rayo amarillo)
    - Implementar contadores de datos con íconos
    - Usar Framer Motion para animación de entrada suave
    - _Requirements: 13.6, 13.7, 13.8_
  
  - [x] 6.6 Refactorizar IndexationPopover - Parte 4: Estado de Reconexión
    - Implementar renderizado de estado "reconectando"
    - Mostrar ícono del módulo con pulso
    - Mostrar spinner de reconexión amarillo rotando
    - Mostrar texto de estado y contador de intentos
    - Implementar estado "reconciling" con texto diferente
    - _Requirements: 13.9, 13.10_
  
  - [x] 6.7 Refactorizar IndexationPopover - Parte 5: Estados de Error
    - Implementar renderizado de error de conexión
    - Mostrar badge de WiFi desconectado naranja
    - Mostrar mensaje y botón de retry
    - Implementar renderizado de error de indexación
    - Mostrar ícono de alerta rojo
    - Mostrar mensaje de error truncado
    - Implementar botón de retry con animación
    - _Requirements: 13.11, 13.12, 13.13, 13.14, 13.15_
  
  - [x] 6.8 Refactorizar IndexationPopover - Parte 6: Notificación de Sincronización
    - Implementar popover temporal para eventos de tiempo real
    - Mostrar ícono de rayo con pulso
    - Mostrar tipo de actualización (INSERT/UPDATE/DELETE)
    - Mostrar subtítulo descriptivo
    - Implementar barra de progreso de auto-hide (4 segundos)
    - Usar AnimatePresence para entrada/salida suave
    - _Requirements: 13.16_
  
  - [x] 6.9 Refactorizar IndexationPopover - Parte 7: Animación de Éxito
    - Implementar animación de partículas cuando se completa indexación
    - Generar 8 partículas que vuelan hacia el popover
    - Implementar ícono de check que se absorbe
    - Aplicar efecto de glow con color del módulo
    - Aplicar flash de color del módulo
    - Configurar duración de 0.5 segundos
    - Escalonar animación con delay de 0.03s entre partículas
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  
  - [x] 6.10 Refactorizar IndexationPopover - Parte 8: Auto-hide
    - Implementar lógica de auto-hide después de 5 segundos
    - Solo auto-hide cuando todos los módulos están completos
    - Mostrar barra de progreso visual del auto-hide
    - Permitir dismissal manual
    - Reaparecer si hay nuevos eventos de indexación
    - _Requirements: 13.17, 13.18_
  
  - [ ]* 6.11 Escribir tests para IndexationPopover
    - Test de renderizado de cada estado
    - Test de transiciones entre estados
    - Test de auto-hide
    - Test de interacciones (expand/collapse, retry)
    - Snapshot tests para regresión visual
  
  - [x] 6.12 Integrar RealtimeIndicator en Header/Topbar
    - Identificar componente de Header/Topbar
    - Agregar RealtimeIndicator con variante apropiada
    - Calcular estado de conexión global (todos los módulos)
    - Implementar callback para botón de reindexación
    - Ajustar estilos para integración visual
    - _Requirements: 15.10_
  
  - [x] 6.13 Checkpoint - Validar UI mejorada
    - Verificar que IndexationPopover muestre todos los estados correctamente
    - Verificar animaciones suaves y sin glitches
    - Verificar RealtimeIndicator en diferentes estados
    - Probar en diferentes tamaños de pantalla
    - Verificar accesibilidad (contraste, keyboard navigation)
    - Asegurar que todos los tests pasen
    - Preguntar al usuario si hay problemas antes de continuar

- [ ] 7. Fase 7: Testing y Validación
  - [x] 7.1 Configurar fast-check para property testing
    - Instalar fast-check: `npm install --save-dev fast-check`
    - Configurar integración con Jest/Vitest
    - Crear helpers para generadores personalizados
    - Documentar cómo escribir property tests
  
  - [x] 7.2 Ejecutar todos los property tests
    - Ejecutar suite completa de property tests
    - Verificar que todos pasen con 100 iteraciones
    - Investigar y corregir fallos si los hay
    - Documentar casos edge encontrados
  
  - [x] 7.3 Ejecutar todos los unit tests
    - Ejecutar suite completa de unit tests
    - Verificar cobertura de código
    - Agregar tests faltantes si es necesario
    - Asegurar cobertura mínima del 80%
  
  - [x] 7.4 Testing de integración end-to-end
    - Probar flujo completo de indexación desde cero
    - Probar restauración desde caché válido
    - Probar invalidación de caché y reindexación
    - Probar eventos de tiempo real (INSERT/UPDATE/DELETE)
    - Probar desconexión y reconexión automática
    - Probar desconexión larga y reconciliación
    - Probar múltiples módulos simultáneamente
  
  - [x] 7.5 Testing de performance
    - Medir tiempo de indexación inicial
    - Medir tiempo de restauración desde caché
    - Medir uso de memoria durante indexación
    - Medir tamaño de localStorage
    - Verificar que no haya memory leaks
    - Optimizar si es necesario
  
  - [x] 7.6 Testing de UI/UX
    - Verificar que todas las animaciones sean suaves
    - Verificar que los estados sean claros y comprensibles
    - Verificar que los mensajes de error sean útiles
    - Verificar accesibilidad (WCAG 2.1 AA)
    - Probar en diferentes navegadores (Chrome, Firefox, Safari, Edge)
    - Probar en diferentes dispositivos (desktop, tablet, mobile)
  
  - [x] 7.7 Checkpoint - Validar testing completo
    - Revisar resultados de todos los tests
    - Documentar issues encontrados y resoluciones
    - Asegurar que todos los tests pasen
    - Preguntar al usuario si hay problemas antes de continuar

- [ ] 8. Fase 8: Limpieza y Documentación
  - [x] 8.1 Eliminar contextos legacy
    - Eliminar src/context/IneaIndexationContext.tsx
    - Eliminar src/context/IteaIndexationContext.tsx
    - Eliminar src/context/IneaObsoletosIndexationContext.tsx
    - Eliminar src/context/IteaObsoletosIndexationContext.tsx
    - Eliminar src/context/NoListadoIndexationContext.tsx
    - Eliminar src/context/ResguardosIndexationContext.tsx
    - Eliminar src/context/ResguardosBajasIndexationContext.tsx
    - Verificar que no haya imports residuales
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_
  
  - [x] 8.2 Limpiar código no utilizado
    - Buscar y eliminar imports no utilizados
    - Buscar y eliminar funciones no utilizadas
    - Buscar y eliminar tipos no utilizados
    - Ejecutar linter y corregir warnings
    - Formatear código con Prettier
  
  - [x] 8.3 Crear documentación de arquitectura
    - Crear docs/indexation-architecture.md
    - Documentar arquitectura general con diagramas
    - Documentar flujo de datos
    - Documentar stores y sus responsabilidades
    - Documentar hooks y su uso
    - Documentar componentes UI
    - Incluir ejemplos de código
    - _Requirements: 20.1_
  
  - [x] 8.4 Documentar stores con JSDoc
    - Agregar JSDoc a indexationStore
    - Agregar JSDoc a cada Module_Store
    - Documentar cada acción y su propósito
    - Documentar tipos de parámetros y retorno
    - Incluir ejemplos de uso
    - _Requirements: 20.2_
  
  - [x] 8.5 Documentar hooks con JSDoc
    - Agregar JSDoc a cada custom hook
    - Documentar parámetros y valores de retorno
    - Documentar comportamiento de caché
    - Documentar comportamiento de reconexión
    - Incluir ejemplos de uso en componentes
    - _Requirements: 20.3_
  
  - [x] 8.6 Documentar componentes UI con JSDoc
    - Agregar JSDoc a IndexationPopover
    - Agregar JSDoc a RealtimeIndicator
    - Documentar props y su propósito
    - Documentar estados visuales
    - Incluir ejemplos de uso
    - _Requirements: 20.4, 20.5_
  
  - [x] 8.7 Crear guía de migración para nuevos módulos
    - Crear docs/adding-new-modules.md
    - Documentar paso a paso cómo agregar un nuevo módulo
    - Incluir checklist de tareas
    - Incluir ejemplos de código
    - Documentar configuración necesaria
    - _Requirements: 20.6, 20.7_
  
  - [x] 8.8 Crear CHANGELOG
    - Crear CHANGELOG.md
    - Documentar cambios principales de la migración
    - Documentar breaking changes
    - Documentar nuevas features
    - Documentar mejoras de performance
    - Documentar bugs corregidos
  
  - [x] 8.9 Actualizar README principal
    - Actualizar README.md del proyecto
    - Agregar sección sobre sistema de indexación
    - Agregar links a documentación detallada
    - Agregar badges de tests y cobertura
    - Actualizar instrucciones de desarrollo
  
  - [x] 8.10 Checkpoint final - Validar migración completa
    - Revisar que todos los módulos funcionen correctamente
    - Revisar que toda la documentación esté completa
    - Revisar que no haya código legacy residual
    - Ejecutar suite completa de tests
    - Hacer demo completa del sistema al usuario
    - Obtener aprobación final del usuario

## Notes

- Las tareas marcadas con `*` son opcionales (tests) y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requirements específicos que implementa
- Los checkpoints aseguran validación incremental y permiten detectar problemas temprano
- La migración gradual (módulo por módulo) permite rollback si es necesario
- Los property tests usan fast-check con mínimo 100 iteraciones
- Cada property test debe referenciar su propiedad del documento de diseño
- La documentación es crítica para mantenibilidad a largo plazo

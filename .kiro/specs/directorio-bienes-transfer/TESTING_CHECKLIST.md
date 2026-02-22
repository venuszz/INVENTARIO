# Testing Checklist - Transferencia de Bienes

## Task 28: Testing Manual de Flujos Principales

### Flujo Completo de Complete Area Transfer
- [ ] Activar transfer mode desde directorio
- [ ] Seleccionar director origen
- [ ] Verificar que se cargan las áreas del director
- [ ] Seleccionar un área completa
- [ ] Verificar que se muestra el preview con estadísticas correctas
- [ ] Seleccionar director destino (diferente al origen)
- [ ] Verificar que el preview se actualiza
- [ ] Confirmar transferencia
- [ ] Verificar modal de confirmación con todos los detalles
- [ ] Ejecutar transferencia
- [ ] Verificar completion screen con breakdown por tabla
- [ ] Verificar que se regresa al directorio después de 3 segundos
- [ ] Verificar que los datos se actualizaron correctamente en la base de datos

### Flujo Completo de Partial Bienes Transfer
- [ ] Activar transfer mode
- [ ] Seleccionar director origen
- [ ] Seleccionar un área
- [ ] Seleccionar bienes individuales (no todos)
- [ ] Verificar que el preview muestra "Transferencia Parcial"
- [ ] Seleccionar director destino
- [ ] Seleccionar área destino
- [ ] Verificar que el preview se actualiza con área destino
- [ ] Confirmar transferencia
- [ ] Verificar modal de confirmación
- [ ] Ejecutar transferencia
- [ ] Verificar completion screen
- [ ] Verificar que solo los bienes seleccionados se transfirieron

### Validación de Resguardos Activos
- [ ] Crear un resguardo activo para un área
- [ ] Intentar transferir esa área completa
- [ ] Verificar que el área aparece deshabilitada con badge de warning
- [ ] Verificar tooltip con count de resguardos
- [ ] Verificar que no se puede seleccionar el área
- [ ] Verificar mensaje de error en validación

### Validación de Área Duplicada
- [ ] Seleccionar un área que el director destino ya tiene
- [ ] Intentar transferencia completa
- [ ] Verificar error de validación "área duplicada"
- [ ] Verificar que el botón de confirmación está deshabilitado

### Validación de Source = Target
- [ ] Seleccionar director origen
- [ ] Intentar seleccionar el mismo director como destino
- [ ] Verificar que el director origen no aparece en la lista de destinos
- [ ] Verificar que no se puede seleccionar

### Manejo de Errores de Red
- [ ] Simular error de red (desconectar internet)
- [ ] Intentar ejecutar transferencia
- [ ] Verificar que se muestra error en modal
- [ ] Verificar botón "Reintentar"
- [ ] Reconectar y reintentar
- [ ] Verificar que funciona correctamente

### Manejo de Errores de Base de Datos
- [ ] Simular error de base de datos (permisos insuficientes)
- [ ] Intentar ejecutar transferencia
- [ ] Verificar que se muestra error específico
- [ ] Verificar que se hace rollback (no hay cambios parciales)
- [ ] Verificar logging de error en consola

### Rollback en Caso de Fallo
- [ ] Simular fallo durante transferencia (después de actualizar INEA pero antes de ITEA)
- [ ] Verificar que se hace rollback completo
- [ ] Verificar que no hay cambios en la base de datos
- [ ] Verificar logging de rollback

## Task 29: Testing de Edge Cases

### Transferir Área Sin Bienes
- [ ] Crear un área sin bienes asignados
- [ ] Intentar transferir esa área
- [ ] Verificar que el preview muestra 0 bienes
- [ ] Ejecutar transferencia
- [ ] Verificar que se completa exitosamente
- [ ] Verificar que solo se actualiza la relación directorio-área

### Transferir 1 Solo Bien
- [ ] Seleccionar exactamente 1 bien
- [ ] Verificar preview con count = 1
- [ ] Ejecutar transferencia
- [ ] Verificar completion screen con singular "1 bien transferido"
- [ ] Verificar que solo ese bien se transfirió

### Transferir >1000 Bienes
- [ ] Crear área con >1000 bienes
- [ ] Seleccionar todos los bienes
- [ ] Verificar que se muestra progress indicator
- [ ] Verificar que se procesa en batches de 50
- [ ] Verificar actualización de progreso después de cada batch
- [ ] Verificar estimación de tiempo restante
- [ ] Verificar que se completa exitosamente

### Cancelar Durante Ejecución
- [ ] Iniciar transferencia grande (>100 bienes)
- [ ] Intentar cancelar durante ejecución
- [ ] Verificar que no se puede cancelar (botón deshabilitado)
- [ ] Esperar a que termine
- [ ] Verificar que se completó correctamente

### Cambiar Selección Múltiples Veces
- [ ] Seleccionar director origen A
- [ ] Seleccionar área 1
- [ ] Cambiar a director origen B
- [ ] Verificar que se limpia la selección de área
- [ ] Seleccionar área 2
- [ ] Seleccionar bienes
- [ ] Cambiar a área 3
- [ ] Verificar que se limpia la selección de bienes
- [ ] Verificar que el preview se actualiza correctamente

### Salir del Modo Sin Guardar
- [ ] Hacer selecciones (director, área, bienes)
- [ ] Presionar "Volver al directorio" sin confirmar
- [ ] Verificar que se sale del modo
- [ ] Verificar que no hay cambios en la base de datos
- [ ] Volver a entrar al modo
- [ ] Verificar que no hay selecciones previas

### Múltiples Usuarios Simultáneos
- [ ] Usuario A inicia transferencia de área X
- [ ] Usuario B intenta transferir la misma área X simultáneamente
- [ ] Verificar que ambos pueden iniciar el proceso
- [ ] Usuario A completa primero
- [ ] Usuario B intenta completar después
- [ ] Verificar que se maneja correctamente (error o éxito según el caso)

## Task 30: Optimización de Performance

### Memoización de Componentes
- [ ] Verificar que componentes pesados usan React.memo
- [ ] Verificar que no hay re-renders innecesarios
- [ ] Usar React DevTools Profiler para medir

### useMemo para Cálculos Costosos
- [ ] Verificar que cálculos de preview usan useMemo
- [ ] Verificar que filtros de directores usan useMemo
- [ ] Verificar que agregaciones de estadísticas usan useMemo

### useCallback para Funciones Estables
- [ ] Verificar que handlers usan useCallback
- [ ] Verificar que funciones pasadas como props usan useCallback

### Virtualización de Listas Largas
- [ ] Crear lista de >100 bienes
- [ ] Verificar que se usa scroll nativo eficiente
- [ ] Verificar que no hay lag al scrollear
- [ ] Considerar react-window si hay problemas de performance

### Debounce de Search Inputs
- [ ] Verificar que búsqueda de bienes tiene debounce de 300ms
- [ ] Verificar que no se hacen búsquedas en cada keystroke
- [ ] Verificar que la UX es fluida

### Lazy Load de TransferMode
- [ ] Verificar que TransferMode se carga solo cuando se activa
- [ ] Verificar que no afecta el bundle inicial
- [ ] Medir tamaño del bundle con y sin lazy loading

### Animaciones a 60fps
- [ ] Verificar que todas las animaciones corren suavemente
- [ ] Usar Chrome DevTools Performance para medir
- [ ] Verificar que no hay frame drops
- [ ] Optimizar animaciones si es necesario

## Task 31: Refinamiento de UX

### Timing de Animaciones
- [ ] Verificar que las animaciones no son muy rápidas ni muy lentas
- [ ] Ajustar durations si es necesario
- [ ] Verificar que las transiciones son suaves

### Mensajes de Error
- [ ] Verificar que todos los mensajes de error son claros
- [ ] Verificar que incluyen información útil para el usuario
- [ ] Verificar que no exponen detalles técnicos innecesarios

### Tooltips Informativos
- [ ] Agregar tooltips donde sea útil
- [ ] Verificar que los tooltips son claros y concisos
- [ ] Verificar que no obstruyen la UI

### Contraste de Colores
- [ ] Verificar contraste en modo claro
- [ ] Verificar contraste en modo oscuro
- [ ] Usar herramientas de accesibilidad para verificar WCAG AA

### Micro-interacciones
- [ ] Agregar hover effects donde sea apropiado
- [ ] Agregar focus states visibles
- [ ] Agregar feedback visual en interacciones

### Transiciones
- [ ] Pulir transiciones entre estados
- [ ] Verificar que no hay saltos bruscos
- [ ] Verificar que las transiciones son consistentes

### Feedback del Usuario
- [ ] Solicitar feedback sobre la UX
- [ ] Identificar puntos de fricción
- [ ] Hacer ajustes basados en feedback

## Task 32: Checkpoint Final

### Verificación de Requirements
- [ ] Revisar todos los requirements del spec
- [ ] Verificar que cada requirement está implementado
- [ ] Documentar cualquier desviación o decisión de diseño

### Verificación de Tests
- [ ] Ejecutar todos los tests unitarios
- [ ] Ejecutar todos los tests de integración
- [ ] Verificar que todos pasan

### Verificación de TypeScript
- [ ] Ejecutar `npm run type-check` o equivalente
- [ ] Verificar que no hay errores de TypeScript
- [ ] Verificar que no hay uso de `any`

### Verificación de Warnings
- [ ] Ejecutar la aplicación en modo desarrollo
- [ ] Verificar que no hay warnings en consola
- [ ] Resolver cualquier warning encontrado

### Verificación de Documentación
- [ ] Verificar que todos los componentes tienen JSDoc
- [ ] Verificar que el README está actualizado
- [ ] Verificar que hay ejemplos de uso

### Preguntas al Usuario
- [ ] ¿Hay alguna funcionalidad adicional que desees?
- [ ] ¿Hay algún cambio en el diseño que prefieras?
- [ ] ¿Hay algún problema o bug que hayas encontrado?
- [ ] ¿Estás satisfecho con la implementación actual?

## Notas de Testing

### Herramientas Recomendadas
- React DevTools (para profiling y debugging)
- Chrome DevTools Performance (para medir performance)
- Lighthouse (para accesibilidad y performance)
- axe DevTools (para accesibilidad)
- Network throttling (para simular conexiones lentas)

### Datos de Prueba
- Crear directores de prueba con diferentes cantidades de áreas
- Crear áreas con diferentes cantidades de bienes
- Crear resguardos activos para testing de validación
- Crear bienes en las tres tablas (INEA, ITEA, No Listado)

### Entornos de Testing
- Desktop (Chrome, Firefox, Safari)
- Tablet (iPad, Android tablet)
- Mobile (iPhone, Android phone)
- Diferentes tamaños de pantalla
- Modo claro y modo oscuro

### Criterios de Éxito
- Todos los flujos principales funcionan correctamente
- Todos los edge cases están manejados
- No hay errores de TypeScript
- No hay warnings en consola
- Performance es aceptable (animaciones a 60fps)
- UX es intuitiva y fluida
- Accesibilidad cumple con estándares básicos
- Dark mode funciona correctamente

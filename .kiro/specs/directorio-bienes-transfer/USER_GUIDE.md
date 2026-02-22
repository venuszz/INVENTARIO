# Guía de Usuario - Transferencia de Bienes entre Directores

## ¿Qué es esta funcionalidad?

El sistema de Transferencia de Bienes permite a los administradores transferir bienes (activos) de un director a otro de manera segura y controlada. Soporta dos tipos de transferencias:

1. **Transferencia Completa de Área**: Transfiere todos los bienes de un área completa a otro director
2. **Transferencia Parcial de Bienes**: Transfiere solo bienes seleccionados a un área específica de otro director

## ¿Cómo usar la funcionalidad?

### Paso 1: Activar el Modo de Transferencia

1. Navega al módulo de **Administración → Directorio**
2. Haz clic en el botón **"Transferir Bienes"** en el header (ícono de paquete)
3. Se abrirá la interfaz de transferencia con dos paneles

### Paso 2: Seleccionar Origen (Panel Izquierdo)

#### Seleccionar Director Origen
1. En el panel izquierdo, verás la lista de directores
2. Haz clic en un director para seleccionarlo
3. Se cargarán automáticamente las áreas asignadas a ese director

#### Seleccionar Área(s)
1. Verás la lista de áreas del director seleccionado
2. Cada área muestra:
   - Nombre del área
   - Cantidad de bienes
   - Badge de warning si tiene resguardos activos (⚠️)
3. Puedes seleccionar:
   - **Una sola área completa** → Transferencia Completa
   - **Múltiples áreas** → Transferencia Completa de múltiples áreas
   - **Una área y luego bienes individuales** → Transferencia Parcial

#### Seleccionar Bienes (Opcional - Solo para Transferencia Parcial)
1. Si seleccionas una sola área, aparecerá la lista de bienes
2. Usa los checkboxes para seleccionar bienes específicos
3. Puedes usar la búsqueda para filtrar bienes
4. Cada bien muestra: ID, Descripción, Valor

### Paso 3: Seleccionar Destino (Panel Derecho)

#### Seleccionar Director Destino
1. En el panel derecho, usa el dropdown para seleccionar el director destino
2. El director origen no aparecerá en la lista (no puedes transferir a ti mismo)

#### Seleccionar Área Destino (Solo para Transferencia Parcial)
1. Si estás haciendo una transferencia parcial, aparecerá un segundo dropdown
2. Selecciona el área destino donde se transferirán los bienes

### Paso 4: Revisar Vista Previa

El panel derecho muestra automáticamente:
- **Tipo de transferencia**: Completa o Parcial
- **Resumen**: Director origen → Director destino
- **Estadísticas**:
  - Total de bienes a transferir
  - Valor total
  - Resguardos afectados
- **Lista de bienes**: Expandible para ver detalles

### Paso 5: Confirmar Transferencia

1. Revisa que toda la información es correcta
2. Si hay errores de validación, aparecerán en rojo debajo del botón
3. Haz clic en **"Confirmar Transferencia"**
4. Se abrirá un modal de confirmación final

### Paso 6: Confirmación Final

El modal muestra:
- Resumen completo de la transferencia
- ⚠️ **Warning**: La operación es irreversible
- Botones: **Cancelar** o **Confirmar Transferencia**

1. Revisa cuidadosamente toda la información
2. Si estás seguro, haz clic en **"Confirmar Transferencia"**
3. Verás un spinner mientras se procesa

### Paso 7: Completado

Después de una transferencia exitosa:
- Verás una pantalla de éxito con animación de celebración 🎉
- Se muestra el desglose por tabla (INEA, ITEA, No Listado)
- Puedes hacer clic en **"Volver al Directorio"** o esperar 3 segundos para regresar automáticamente

## Validaciones y Restricciones

### ❌ No puedes transferir si:

1. **Área con resguardos activos**: Las áreas con resguardos activos no se pueden transferir (aparecen deshabilitadas con badge ⚠️)
2. **Área duplicada**: El director destino ya tiene esa área asignada
3. **Mismo director**: Intentas transferir al mismo director (origen = destino)
4. **Sin selección**: No has seleccionado bienes o áreas
5. **Sin área destino**: En transferencia parcial, no has seleccionado área destino

### ✅ Validaciones automáticas:

- El sistema verifica automáticamente todas las reglas de negocio
- Los errores se muestran claramente en la interfaz
- Los controles se deshabilitan cuando no son aplicables

## Tipos de Transferencia

### Transferencia Completa de Área

**Cuándo usar:**
- Quieres transferir todas las responsabilidades de un área a otro director
- El área completa cambia de responsable

**Qué sucede:**
- Todos los bienes del área se transfieren al director destino
- La relación directorio-área se actualiza (se elimina del origen, se crea en destino)
- Los bienes mantienen su área original

**Ejemplo:**
- Director A tiene el área "Sistemas" con 50 bienes
- Transferencia completa a Director B
- Resultado: Director B ahora tiene el área "Sistemas" con los 50 bienes

### Transferencia Parcial de Bienes

**Cuándo usar:**
- Solo quieres transferir algunos bienes específicos
- Los bienes se reasignan a un área diferente

**Qué sucede:**
- Solo los bienes seleccionados se transfieren
- Los bienes cambian de director Y de área
- El área origen se mantiene con el director origen
- El área destino debe existir en el director destino

**Ejemplo:**
- Director A tiene el área "Sistemas" con 50 bienes
- Seleccionas 10 bienes específicos
- Los transfieres al área "Administración" de Director B
- Resultado: 
  - Director A mantiene el área "Sistemas" con 40 bienes
  - Director B tiene 10 bienes más en su área "Administración"

## Características Especiales

### 📱 Responsive Design
- **Desktop**: Vista de dos paneles lado a lado (40/60)
- **Tablet**: Vista de dos paneles lado a lado (50/50)
- **Mobile**: Vista de un panel a la vez con tabs de navegación

### 🌙 Dark Mode
- Soporte completo para modo oscuro
- Cambia automáticamente según la preferencia del sistema

### ⌨️ Navegación por Teclado
- **Escape**: Salir del modo de transferencia (cuando no hay operación en curso)
- **Tab**: Navegar entre controles
- **Enter/Space**: Activar botones y checkboxes

### 🔄 Transferencias Grandes
- Para transferencias de >100 bienes, se muestra un indicador de progreso
- Los bienes se procesan en batches de 50 para mejor performance
- Se muestra el tiempo estimado restante

### 📊 Logging
- Todas las operaciones se registran en la consola del servidor
- Incluye: usuario, timestamp, origen, destino, resultado
- Útil para auditoría y debugging

## Manejo de Errores

### Si algo sale mal:

1. **Error de red**: Se muestra un mensaje de error con opción de reintentar
2. **Error de validación**: Se muestran los errores específicos debajo del botón de confirmación
3. **Error de base de datos**: Se hace rollback automático (no hay cambios parciales)
4. **Error durante ejecución**: Se muestra el error en el modal con opción de reintentar

### Rollback Automático

Si ocurre un error durante la transferencia:
- Se revierten todos los cambios
- No quedan datos inconsistentes
- Se registra el error en los logs
- Se notifica al usuario

## Tips y Mejores Prácticas

### ✅ Recomendaciones:

1. **Verifica antes de confirmar**: Revisa cuidadosamente el preview antes de confirmar
2. **Resuelve resguardos primero**: Si un área tiene resguardos activos, resuélvelos antes de transferir
3. **Usa transferencia parcial para reorganización**: Si solo necesitas mover algunos bienes, usa transferencia parcial
4. **Revisa el breakdown**: Después de la transferencia, verifica el desglose por tabla

### ⚠️ Precauciones:

1. **Operación irreversible**: No hay "deshacer" - asegúrate antes de confirmar
2. **Resguardos activos**: No se pueden transferir áreas con resguardos activos
3. **Múltiples usuarios**: Si varios usuarios están haciendo transferencias simultáneamente, pueden ocurrir conflictos

## Preguntas Frecuentes

### ¿Puedo cancelar una transferencia en progreso?
No, una vez que se inicia la ejecución, no se puede cancelar. Asegúrate de revisar todo antes de confirmar.

### ¿Qué pasa con los resguardos cuando transfiero bienes?
Los resguardos se mantienen asociados a los bienes. Si un bien tiene un resguardo activo, el resguardo se actualiza automáticamente con el nuevo director.

### ¿Puedo transferir bienes de múltiples áreas a la vez?
Sí, puedes seleccionar múltiples áreas para transferencia completa. Para transferencia parcial, solo puedes seleccionar bienes de una área a la vez.

### ¿Qué pasa si el director destino ya tiene el área?
En transferencia completa, no puedes transferir un área que el director destino ya tiene (validación de área duplicada). En transferencia parcial, puedes transferir bienes a cualquier área existente del director destino.

### ¿Cuánto tiempo toma una transferencia?
- Transferencias pequeñas (<100 bienes): 1-2 segundos
- Transferencias medianas (100-500 bienes): 5-10 segundos
- Transferencias grandes (>500 bienes): 10-30 segundos

### ¿Puedo ver un historial de transferencias?
Actualmente no hay una interfaz de historial, pero todas las transferencias se registran en los logs del servidor.

## Soporte

Si encuentras algún problema o tienes dudas:
1. Verifica que tienes permisos de administrador
2. Revisa los mensajes de error en la interfaz
3. Contacta al equipo de desarrollo con detalles del error

---

**Última actualización:** 2026-02-22  
**Versión:** 1.0.0

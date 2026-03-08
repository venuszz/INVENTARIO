# Guía de Usuario: Transferencia en Lote de Origen

## Descripción General

La funcionalidad de Transferencia en Lote de Origen permite a los administradores transferir múltiples items de inventario entre instituciones (INEA, ITEJPA, TLAXCALA) en una sola operación, mejorando significativamente la eficiencia en reasignaciones masivas.

## Requisitos Previos

- Rol de usuario: **Administrador** o **Superadministrador**
- Acceso al módulo de Levantamiento Unificado
- Filtro de origen activo en la vista

## Paso a Paso

### 1. Activar el Modo de Transferencia

1. Navega al módulo **Levantamiento Unificado**
2. Aplica un filtro de **Origen** (INEA, ITEJPA, o TLAXCALA)
3. Haz clic en el botón **"Transferir Origen"** que aparece junto a los botones de exportación

![Botón Transferir Origen](./images/transfer-button.png)

**Nota:** El botón solo aparece cuando hay al menos un filtro de origen activo.

### 2. Seleccionar Items

Una vez activado el modo de transferencia:

- Aparecerá una columna de checkboxes a la izquierda de la tabla
- Los badges de origen estarán deshabilitados (no se puede hacer clic)
- El botón cambiará a **"Cancelar Transferencia"**

**Opciones de selección:**

- **Selección individual:** Haz clic en el checkbox de cada item
- **Seleccionar todos:** Usa el checkbox en el encabezado de la tabla
- **Items bloqueados:** Los items con resguardo activo o estatus BAJA aparecerán deshabilitados con un ícono de advertencia (⚠)

![Modo de Transferencia Activo](./images/transfer-mode.png)

### 3. Confirmar Selección

Cuando hayas seleccionado al menos un item:

- Aparecerá un **Botón de Acción Flotante (FAB)** en la esquina inferior derecha
- El botón mostrará el número de items seleccionados
- Haz clic en **"Confirmar Transferencia (X)"**

![FAB con Contador](./images/transfer-fab.png)

### 4. Configurar Transferencia

Se abrirá el modal de confirmación con:

**Resumen:**
- Total de items seleccionados
- Desglose por origen actual (INEA: X, ITEJPA: Y, TLAXCALA: Z)
- Número de items bloqueados (si aplica)

**Configuración:**
- Selecciona el **Origen Destino** del menú desplegable
- Revisa la lista de items a transferir

**Advertencias (si aplica):**
- Lista de items bloqueados con razones:
  - "Tiene resguardo activo"
  - "Estatus BAJA"
  - "Sin permisos"
- Marca el checkbox **"Confirmo que entiendo las advertencias"** para continuar

![Modal de Confirmación](./images/confirmation-modal.png)

### 5. Monitorear Progreso

Durante la transferencia:

- Se mostrará un modal de progreso con:
  - Barra de progreso visual
  - Estado de cada item (⏳ Pendiente, 🔄 Procesando, ✓ Exitoso, ✗ Fallido, ⊘ Omitido)
  - El item actual se resaltará con animación pulsante
- El botón "Cerrar" estará deshabilitado durante el procesamiento

![Modal de Progreso](./images/progress-modal.png)

### 6. Revisar Resultados

Al completar la transferencia:

**Resumen de resultados:**
- Exitosas: Número de transferencias completadas
- Fallidas: Número de transferencias con error
- Omitidas: Número de items bloqueados

**Acciones disponibles:**
- **Descargar Reporte:** Genera un archivo CSV con detalles completos
- **Cerrar:** Cierra el modal y actualiza la vista

![Resultados Completos](./images/completion-summary.png)

### 7. Descargar Reporte

El reporte CSV incluye:

- Fecha y hora de la operación
- Usuario que realizó la transferencia
- Origen destino seleccionado
- Lista de transferencias exitosas (ID, descripción, origen anterior, origen nuevo)
- Lista de transferencias fallidas (ID, descripción, error)
- Lista de items omitidos (ID, descripción, razón)

## Casos de Uso Comunes

### Reasignación por Cambio Institucional

**Escenario:** Transferir todos los bienes de ITEJPA a INEA debido a reorganización administrativa.

1. Filtra por origen "ITEJPA"
2. Activa modo de transferencia
3. Selecciona todos los items (checkbox de encabezado)
4. Confirma y selecciona "INEA" como destino
5. Descarga el reporte para auditoría

### Corrección de Errores de Captura

**Escenario:** Varios items fueron registrados incorrectamente en TLAXCALA cuando deberían estar en INEA.

1. Filtra por origen "TLAXCALA"
2. Aplica filtros adicionales para identificar los items incorrectos
3. Activa modo de transferencia
4. Selecciona solo los items incorrectos
5. Transfiere a "INEA"

## Limitaciones y Restricciones

### Items que NO se pueden transferir:

1. **Items con resguardo activo**
   - Razón: El item está asignado a un usuario
   - Solución: Dar de baja el resguardo primero

2. **Items con estatus BAJA**
   - Razón: El item ya fue dado de baja
   - Solución: Reactivar el item si es necesario

3. **Sin permisos de administrador**
   - Razón: Solo administradores pueden transferir
   - Solución: Contactar a un administrador

### Consideraciones Importantes:

- La transferencia es **irreversible** desde la interfaz (requiere otra transferencia para revertir)
- Los items se procesan **secuencialmente** (uno por uno)
- Si hay errores, los items restantes continúan procesándose
- La operación crea **registros de auditoría** automáticamente
- El inventario se **actualiza en tiempo real** durante la transferencia

## Atajos de Teclado

- **Escape:** Cerrar modal de confirmación o progreso (solo cuando no está procesando)
- **Enter:** Confirmar transferencia (en modal de confirmación)
- **Tab:** Navegar entre elementos del formulario
- **Espacio:** Marcar/desmarcar checkboxes

## Solución de Problemas

### El botón "Transferir Origen" no aparece

**Causa:** No hay filtro de origen activo  
**Solución:** Aplica un filtro de origen (INEA, ITEJPA, o TLAXCALA)

### No puedo seleccionar algunos items

**Causa:** Los items están bloqueados  
**Solución:** Revisa el ícono de advertencia (⚠) para ver la razón. Resuelve el bloqueo antes de transferir.

### La transferencia falló para algunos items

**Causa:** Errores de red, validación, o permisos  
**Solución:** 
1. Revisa el mensaje de error en el modal de progreso
2. Descarga el reporte para ver detalles
3. Corrige los problemas y vuelve a intentar con los items fallidos

### El reporte no se descarga

**Causa:** Bloqueador de pop-ups o error del navegador  
**Solución:** 
1. Permite descargas desde el sitio
2. Verifica que no haya bloqueadores activos
3. Intenta nuevamente

## Mejores Prácticas

1. **Verifica los filtros:** Asegúrate de que los filtros muestren exactamente los items que deseas transferir
2. **Revisa la selección:** Usa el resumen en el modal de confirmación para verificar
3. **Descarga reportes:** Siempre descarga el reporte para mantener registro de auditoría
4. **Transferencias grandes:** Para más de 100 items, considera dividir en lotes más pequeños
5. **Horarios:** Realiza transferencias masivas en horarios de bajo tráfico

## Preguntas Frecuentes

**P: ¿Puedo cancelar una transferencia en progreso?**  
R: No, una vez iniciada la transferencia no se puede cancelar. Los items ya procesados permanecerán transferidos.

**P: ¿Se notifica a los usuarios afectados?**  
R: No, la transferencia no envía notificaciones automáticas. Comunica los cambios manualmente si es necesario.

**P: ¿Qué pasa con los resguardos al transferir?**  
R: Los items con resguardo activo no se pueden transferir. Debes dar de baja el resguardo primero.

**P: ¿Puedo transferir items de diferentes orígenes al mismo tiempo?**  
R: Sí, puedes seleccionar items de diferentes orígenes y transferirlos todos al mismo destino.

**P: ¿Cuánto tiempo toma una transferencia?**  
R: Aproximadamente 100ms por item. Una transferencia de 50 items toma alrededor de 5 segundos.

## Soporte

Para asistencia adicional, contacta al equipo de soporte técnico o consulta la documentación técnica en `BATCH_ORIGEN_TRANSFER_TECHNICAL.md`.

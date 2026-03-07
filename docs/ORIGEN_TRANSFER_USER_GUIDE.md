# Guía de Usuario: Transferencia de Origen

**Versión:** 1.0  
**Fecha:** 2026-03-05  
**Audiencia:** Administradores del sistema

## Introducción

La funcionalidad de Transferencia de Origen permite a los administradores mover registros de inventario entre las diferentes tablas del sistema (INEA, ITEA, No Listado) de manera segura y con auditoría completa.

## Requisitos

### Permisos Necesarios
- Rol de **Administrador** en el sistema
- Sesión activa y autenticada

### Restricciones
- El registro NO debe tener un resguardo activo
- El ID de inventario NO debe existir en la tabla destino
- Solo los administradores pueden realizar transferencias

## Cómo Usar la Funcionalidad

### Paso 1: Acceder a una Tabla de Inventario

Navega a cualquiera de las siguientes secciones:
- **Consultas → INEA General**
- **Consultas → ITEA General**
- **Consultas → No Listado**
- **Consultas → INEA Obsoletos**
- **Consultas → ITEA Obsoletos**

### Paso 2: Identificar el Registro

Localiza el registro que deseas transferir en la tabla. Cada registro muestra:
- ID de Inventario
- Badge de Origen (columna "Origen")
- Descripción
- Área
- Director/Jefe de Área

### Paso 3: Abrir el Selector de Origen

1. Haz clic en el **badge de origen** del registro (ej: "INEA", "ITEA", "No Listado")
2. Se desplegará un menú con las opciones de destino disponibles
3. Las opciones mostradas excluyen el origen actual

**Ejemplo:**
- Si estás en INEA, verás opciones: "ITEA" y "No Listado"
- Si estás en ITEA, verás opciones: "INEA" y "No Listado"

### Paso 4: Seleccionar Destino

1. Haz clic en la opción de destino deseada
2. Se abrirá un modal de confirmación

### Paso 5: Confirmar Transferencia

El modal de confirmación muestra:

**Información del Registro:**
- ID de Inventario
- Descripción
- Área actual
- Director actual

**Visualización de Transferencia:**
```
[ORIGEN ACTUAL] → [DESTINO SELECCIONADO]
```

**Advertencias (si aplican):**
- ⚠️ El registro será eliminado de la tabla origen
- ⚠️ Se creará un nuevo registro en la tabla destino
- ⚠️ Se registrará el cambio en el historial de auditoría

**Acciones:**
- **Cancelar**: Cierra el modal sin realizar cambios
- **Confirmar Transferencia**: Ejecuta la transferencia

### Paso 6: Verificar Resultado

Después de confirmar:

**Si la transferencia es exitosa:**
- ✅ Aparece un toast verde: "Registro transferido exitosamente"
- ✅ El registro desaparece de la tabla actual
- ✅ El registro aparece en la tabla destino
- ✅ Se actualiza el historial de cambios

**Si hay un error:**
- ❌ Aparece un toast rojo con el mensaje de error
- ❌ El registro permanece en la tabla origen
- ❌ No se realizan cambios

## Casos de Uso Comunes

### Caso 1: Reclasificar Bien de INEA a ITEA

**Escenario:** Un bien fue registrado incorrectamente en INEA y pertenece a ITEA.

**Pasos:**
1. Ir a Consultas → INEA General
2. Buscar el registro por ID de inventario
3. Hacer clic en el badge "INEA"
4. Seleccionar "ITEA"
5. Confirmar la transferencia
6. Verificar en Consultas → ITEA General

### Caso 2: Mover Bien de No Listado a INEA

**Escenario:** Un bien temporal en No Listado ahora debe ser parte del inventario oficial de INEA.

**Pasos:**
1. Ir a Consultas → No Listado
2. Localizar el registro
3. Hacer clic en el badge "No Listado"
4. Seleccionar "INEA"
5. Confirmar la transferencia
6. Verificar en Consultas → INEA General

### Caso 3: Transferir Bien Obsoleto

**Escenario:** Un bien obsoleto de ITEA debe moverse a INEA.

**Pasos:**
1. Ir a Consultas → ITEA Obsoletos
2. Localizar el registro
3. Hacer clic en el badge "ITEA"
4. Seleccionar "INEA"
5. Confirmar la transferencia
6. Verificar en Consultas → INEA Obsoletos

## Validaciones y Restricciones

### Resguardo Activo

**Problema:** El registro tiene un resguardo activo.

**Mensaje de Error:**
```
No se puede transferir: el registro tiene un resguardo activo
```

**Solución:**
1. Dar de baja el resguardo activo
2. Intentar la transferencia nuevamente

**Identificación Visual:**
- El badge de origen aparece deshabilitado (gris)
- No se puede hacer clic en el badge

### ID Duplicado

**Problema:** El ID de inventario ya existe en la tabla destino.

**Mensaje de Error:**
```
El ID de inventario ya existe en la tabla destino
```

**Solución:**
1. Verificar si el registro ya fue transferido previamente
2. Si es un duplicado legítimo, contactar al administrador del sistema
3. Considerar cambiar el ID de inventario antes de transferir

### Permisos Insuficientes

**Problema:** El usuario no tiene rol de administrador.

**Mensaje de Error:**
```
No tienes permisos para realizar esta acción
```

**Solución:**
1. Contactar a un administrador del sistema
2. Solicitar permisos de administrador si es necesario

### Error de Conexión

**Problema:** Pérdida de conexión durante la transferencia.

**Mensaje de Error:**
```
Error al procesar la transferencia. Intenta nuevamente
```

**Solución:**
1. Verificar conexión a internet
2. Refrescar la página
3. Intentar la transferencia nuevamente
4. Si persiste, contactar soporte técnico

## Auditoría y Trazabilidad

### Registro de Cambios

Cada transferencia se registra en la tabla `cambios_inventario` con:

**Información Registrada:**
- ID de Inventario
- Campo modificado: "origen"
- Valor anterior: origen actual (ej: "inea")
- Valor nuevo: origen destino (ej: "itea")
- Usuario que realizó el cambio
- Timestamp de la operación

### Consultar Historial

Para ver el historial de transferencias:

1. Ir a la tabla destino
2. Localizar el registro transferido
3. Hacer clic en el ícono de historial (si está disponible)
4. Ver el registro de cambio de origen

**Ejemplo de Registro:**
```
Campo: origen
Valor Anterior: inea
Valor Nuevo: itea
Usuario: admin@example.com
Fecha: 2026-03-05 14:30:00
```

## Preguntas Frecuentes (FAQ)

### ¿Puedo deshacer una transferencia?

Sí, puedes transferir el registro de vuelta a su origen original siguiendo los mismos pasos. El historial de cambios mantendrá el registro de ambas transferencias.

### ¿Se pierden datos durante la transferencia?

No, todos los campos del registro se copian a la tabla destino. La transferencia es una operación de copia + eliminación, no una modificación.

### ¿Qué pasa si hay un error durante la transferencia?

La operación usa transacciones SQL, por lo que si hay un error, todos los cambios se revierten automáticamente. El registro permanece en su ubicación original sin modificaciones.

### ¿Puedo transferir múltiples registros a la vez?

Actualmente no. Cada registro debe transferirse individualmente. La funcionalidad de transferencia masiva está planificada para una versión futura.

### ¿Cuánto tiempo tarda una transferencia?

Una transferencia típica tarda menos de 2 segundos. Si tarda más, puede haber un problema de conexión o rendimiento del servidor.

### ¿Los registros obsoletos se pueden transferir?

Sí, los registros en las tablas de obsoletos (INEA Obsoletos, ITEA Obsoletos) pueden transferirse igual que los registros activos.

### ¿Se notifica a otros usuarios de la transferencia?

Actualmente no hay notificaciones automáticas. Los usuarios verán el cambio cuando refresquen o accedan a las tablas correspondientes.

### ¿Puedo transferir si el registro tiene imágenes?

Sí, las imágenes asociadas al registro se mantienen. La ruta de la imagen se copia a la tabla destino.

## Troubleshooting

### El badge de origen no responde al clic

**Posibles causas:**
1. El registro tiene un resguardo activo
2. No tienes permisos de administrador
3. Problema de carga de la página

**Soluciones:**
1. Verificar si el badge está deshabilitado (gris)
2. Verificar tu rol de usuario
3. Refrescar la página (F5)

### El modal no se abre

**Posibles causas:**
1. Error de JavaScript en la página
2. Bloqueador de pop-ups activo
3. Problema de caché del navegador

**Soluciones:**
1. Abrir la consola del navegador (F12) y buscar errores
2. Desactivar bloqueadores de pop-ups
3. Limpiar caché del navegador (Ctrl+Shift+Delete)

### La transferencia se queda "cargando"

**Posibles causas:**
1. Problema de conexión al servidor
2. Timeout de la operación
3. Error en el servidor

**Soluciones:**
1. Esperar 30 segundos
2. Si no responde, refrescar la página
3. Verificar si el registro fue transferido
4. Contactar soporte técnico si persiste

### El registro no aparece en la tabla destino

**Posibles causas:**
1. Filtros activos en la tabla destino
2. Paginación (registro en otra página)
3. Error en la transferencia

**Soluciones:**
1. Limpiar todos los filtros
2. Buscar por ID de inventario
3. Verificar el historial de cambios
4. Intentar la transferencia nuevamente

## Soporte Técnico

Si encuentras problemas no cubiertos en esta guía:

1. **Documentar el problema:**
   - ID de inventario afectado
   - Origen y destino de la transferencia
   - Mensaje de error exacto
   - Captura de pantalla si es posible

2. **Contactar soporte:**
   - Email: soporte@example.com
   - Teléfono: (555) 123-4567
   - Horario: Lunes a Viernes, 9:00 - 18:00

3. **Información a proporcionar:**
   - Tu nombre de usuario
   - Fecha y hora del problema
   - Navegador y versión utilizada
   - Pasos para reproducir el problema

## Mejores Prácticas

1. **Verificar antes de transferir:**
   - Confirma que el registro es el correcto
   - Verifica que no tiene resguardo activo
   - Asegúrate de seleccionar el destino correcto

2. **Documentar transferencias importantes:**
   - Anota el motivo de la transferencia
   - Informa a tu equipo si es necesario
   - Mantén un registro externo si es crítico

3. **Revisar después de transferir:**
   - Verifica que el registro aparece en destino
   - Confirma que los datos son correctos
   - Revisa el historial de cambios

4. **Evitar transferencias innecesarias:**
   - Planifica bien antes de registrar bienes
   - Usa la tabla correcta desde el inicio
   - Consulta con tu equipo si tienes dudas

## Actualizaciones Futuras

Funcionalidades planificadas:

- **Transferencia masiva:** Seleccionar múltiples registros
- **Deshacer transferencia:** Botón de rollback en 30 segundos
- **Notificaciones realtime:** Alertas a otros usuarios
- **Historial visual:** Timeline de transferencias
- **Exportar historial:** Descargar registro de cambios

---

**Última actualización:** 2026-03-05  
**Versión del documento:** 1.0  
**Autor:** Equipo de Desarrollo

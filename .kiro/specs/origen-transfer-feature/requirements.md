---
status: draft
created: 2026-03-05
---

# Transferencia de Origen entre Tablas de Inventario

## Objetivo

Implementar funcionalidad para transferir registros de inventario entre las tablas `inea`, `itea` y `no-listado`, eliminando el registro de la tabla origen e insertándolo en la tabla destino, manteniendo integridad referencial y auditoría completa.

## Contexto

Actualmente, los registros de inventario están distribuidos en tres tablas según su origen:
- `inea` - Inventario INEA
- `itea` - Inventario ITEA  
- `no-listado` - Inventario no listado

No existe forma de transferir un registro entre estas tablas cuando se requiere cambiar su clasificación de origen. Esta funcionalidad es necesaria para corregir clasificaciones erróneas o reclasificar bienes según cambios administrativos.

## Alcance

### En Alcance
- Transferencia individual de registros entre las 3 tablas
- Validación de integridad antes de transferir
- Transacción atómica (delete + insert)
- Auditoría completa en `cambios_inventario`
- UI con badge de origen y dropdown de cambio rápido
- Modal de confirmación con preview
- Notificaciones de éxito/error
- Restricción a usuarios admin

### Fuera de Alcance
- Transferencia masiva/batch (fase futura)
- Rollback/deshacer después de 30 segundos
- Transferencia entre tablas obsoletas
- Cambio de origen durante creación de resguardo

## Requisitos Funcionales

### RF-1: Validación Pre-Transferencia
El sistema debe validar antes de permitir la transferencia:
- Usuario tiene rol `admin`
- Registro no tiene resguardo activo (verificar en `resguardos`)
- Registro no está en proceso de baja
- `id_inventario` no existe en tabla destino
- Todos los campos requeridos tienen valores válidos

### RF-2: Proceso de Transferencia
La transferencia debe ejecutarse como transacción atómica:
1. Iniciar transacción
2. Leer registro completo de tabla origen
3. Insertar en tabla destino (nuevo UUID, mantener `id_inventario`)
4. Eliminar de tabla origen
5. Registrar cambio en `cambios_inventario`
6. Commit o rollback completo

### RF-3: Auditoría
Cada transferencia debe registrarse en `cambios_inventario`:
- `campo`: "origen"
- `valor_anterior`: tabla origen (ej: "inea")
- `valor_nuevo`: tabla destino (ej: "itea")
- `usuario_id`: ID del usuario que ejecuta
- `timestamp`: Fecha/hora de la transferencia

### RF-4: Interfaz de Usuario
En las tablas de consulta (inea, itea, no-listado):
- Badge visual mostrando origen actual
- Dropdown al hacer clic en badge con opciones de destino
- Modal de confirmación mostrando:
  - Origen actual → Destino
  - Datos del registro
  - Advertencias si aplican
- Toast de éxito con mensaje claro
- Indicador de loading durante proceso

### RF-5: Sincronización de Estado
Después de transferencia exitosa:
- Actualizar stores de Zustand (remover de origen, agregar a destino)
- Invalidar queries de React Query
- Actualizar contadores de registros
- Notificar a otros usuarios vía realtime (opcional)

## Requisitos No Funcionales

### RNF-1: Seguridad
- Solo usuarios con rol `admin` pueden transferir
- Validación de permisos en API
- Prevenir race conditions con locks de DB

### RNF-2: Performance
- Transferencia debe completarse en < 2 segundos
- No bloquear UI durante proceso
- Usar transacciones optimizadas

### RNF-3: Integridad de Datos
- Garantizar atomicidad (todo o nada)
- Mantener todas las relaciones (id_area, id_director, id_estatus)
- No perder datos en el proceso

### RNF-4: Usabilidad
- Proceso intuitivo con máximo 3 clicks
- Feedback visual claro en cada paso
- Mensajes de error descriptivos

## Restricciones

1. No se puede transferir si existe resguardo activo
2. Solo usuarios admin pueden ejecutar transferencias
3. No se puede transferir a la misma tabla origen
4. El `id_inventario` debe ser único en tabla destino

## Dependencias

- Sistema de autenticación y roles
- Tabla `cambios_inventario` existente
- Stores de Zustand para cada tabla
- React Query para invalidación de cache

## Criterios de Aceptación

1. ✅ Usuario admin puede ver badge de origen en cada registro
2. ✅ Al hacer clic en badge, aparece dropdown con opciones válidas
3. ✅ Modal de confirmación muestra información completa
4. ✅ Transferencia se ejecuta como transacción atómica
5. ✅ Registro desaparece de tabla origen y aparece en destino
6. ✅ Cambio se registra en `cambios_inventario`
7. ✅ Toast muestra confirmación de éxito
8. ✅ Validaciones previenen transferencias inválidas
9. ✅ Usuarios no-admin no ven opción de transferir
10. ✅ Estado se sincroniza correctamente en frontend

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pérdida de datos por fallo en transacción | Baja | Alto | Usar transacciones SQL con rollback automático |
| Race condition en transferencias simultáneas | Media | Medio | Implementar locks optimistas en DB |
| Inconsistencia en relaciones foráneas | Baja | Alto | Validar todas las FK antes de transferir |
| Usuario transfiere registro con resguardo | Media | Alto | Validación estricta pre-transferencia |

## Métricas de Éxito

- 100% de transferencias completan sin pérdida de datos
- < 2 segundos tiempo promedio de transferencia
- 0 inconsistencias en auditoría
- Tasa de error < 1%

# Lógica Completa de Transferencia de Bienes entre Directores

## Resumen Ejecutivo

El sistema de transferencia de bienes permite mover activos (bienes) entre directores de manera controlada y segura. Soporta dos modos principales:

1. **Transferencia de Área Completa**: Mueve todos los bienes de un área a otro director
2. **Transferencia Parcial de Bienes**: Mueve bienes seleccionados a un área específica de otro director

## Flujo de Usuario (UI)

### Panel 1: Selección de Origen (SourceSelectionPanel)

**Wizard de 2 pasos:**

1. **Paso 1: Seleccionar Director Origen**
   - Lista de todos los directores con searchbar
   - Al seleccionar, avanza automáticamente al Paso 2

2. **Paso 2: Seleccionar Área del Director**
   - Muestra áreas del director seleccionado
   - Cada área muestra:
     - Nombre del área
     - Cantidad de bienes
     - Cantidad de resguardos activos (si hay)
   - Al seleccionar área, aparece el Panel 2

### Panel 2: Selección de Bienes (BienesSelectionPanel)

**Aparece cuando:**
- Hay director origen seleccionado Y
- Hay área seleccionada

**Funcionalidad:**
- Muestra tabla de bienes del área seleccionada
- Permite seleccionar bienes individuales (checkboxes)
- Muestra estadísticas: total bienes, bienes seleccionados, valor total
- Botón "Continuar" para avanzar al Panel 3

**Detección automática:**
- Si el usuario selecciona TODOS los bienes del área, el sistema lo detecta automáticamente
- Esto se usa para determinar si es transferencia completa o parcial

### Panel 3: Selección de Destino y Confirmación (TransferPreviewPanel)

**Wizard de 3 pasos:**

#### Paso 1: Seleccionar Director Destino
- Lista de directores (excluye el director origen)
- Searchbar para filtrar
- Al seleccionar, avanza al Paso 2

#### Paso 2: Seleccionar Área Destino

**Para Transferencia Completa (todos los bienes seleccionados):**

El usuario ve DOS opciones:

**Opción A: Transferir área completa**
```
┌─────────────────────────────────────────────────┐
│  [Icono]  Transferir área completa              │
│           El área "X" se moverá al director     │
│           destino y se eliminará del origen     │
└─────────────────────────────────────────────────┘
```
- Al hacer clic, `targetAreaId = -1`
- Significa: "Crear nueva relación con el mismo nombre de área"
- El área se ELIMINA del director origen
- Se CREA la relación en el director destino

**Divisor visual:**
```
─────────── o fusionar a área existente ───────────
```

**Opción B: Fusionar a área existente**
- Lista de áreas del director destino
- Searchbar para filtrar
- Al seleccionar un área, `targetAreaId = número del área`
- Significa: "Fusionar todos los bienes a esta área existente"
- El área origen permanece pero sin bienes

**Para Transferencia Parcial (algunos bienes seleccionados):**
- Solo muestra la lista de áreas existentes del director destino
- No muestra la opción de "Transferir área completa"
- El usuario DEBE seleccionar un área destino existente

#### Paso 3: Revisar y Confirmar

**Visualización:**
```
┌─────────────────────────────────────────────────┐
│  DESDE                                          │
│  [Director Origen]                              │
│  [Puesto]                                       │
│  ÁREA: [Nombre del área]                        │
├─────────────────────────────────────────────────┤
│              ↓ [Flecha]                         │
├─────────────────────────────────────────────────┤
│  HACIA                                          │
│  [Director Destino]                             │
│  [Puesto]                                       │
│  NUEVA ÁREA: [Nombre] o ÁREA: [Nombre]         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  TIPO DE TRANSFERENCIA                          │
│  Área Completa / Bienes Seleccionados           │
├─────────────────────────────────────────────────┤
│  BIENES: 45    VALOR TOTAL: $123,456           │
├─────────────────────────────────────────────────┤
│  ⚠ ACCIÓN IRREVERSIBLE                         │
│  [Mensaje explicativo según el tipo]            │
└─────────────────────────────────────────────────┘
```

**Mensajes de advertencia:**

- **Transferencia completa (nueva área):**
  > El área "X" se transferirá completamente al director destino. **El área se eliminará del director origen** ya que no puede pertenecer a dos directores simultáneamente. Se actualizarán INEA, ITEA y No Listado.

- **Transferencia completa (fusión):**
  > Todos los bienes del área origen se fusionarán al área destino seleccionada. El área origen permanecerá con el director pero sin bienes. Se actualizarán INEA, ITEA y No Listado.

- **Transferencia parcial:**
  > Los X bienes seleccionados se moverán al área destino. El área origen conservará sus bienes restantes.

## Flujo de Lógica Backend

### Endpoint: `/api/admin/directorio/transfer-bienes`

**Método:** POST

**Autenticación:**
- Requiere token Bearer en header Authorization
- Valida que el usuario sea admin o superadmin

### Request Body

**Para Transferencia Completa:**
```typescript
{
  action: 'transfer_complete_area',
  sourceDirectorId: number,
  targetDirectorId: number,
  sourceAreaId: number,
  targetAreaId: number | null  // -1 o null = crear nueva, número = fusionar
}
```

**Para Transferencia Parcial:**
```typescript
{
  action: 'transfer_partial_bienes',
  sourceDirectorId: number,
  targetDirectorId: number,
  targetAreaId: number,  // DEBE ser un número válido
  bienIds: {
    inea: number[],
    itea: number[],
    no_listado: number[]
  }
}
```

### Validaciones

#### 1. Validación de Input (`validateInput`)

Verifica:
- `action` es válido ('transfer_complete_area' o 'transfer_partial_bienes')
- `sourceDirectorId` y `targetDirectorId` son números positivos
- Para transferencia completa:
  - `sourceAreaId` es número positivo
  - `targetAreaId` es null, -1, o número positivo
- Para transferencia parcial:
  - `targetAreaId` es número positivo
  - `bienIds` es objeto con arrays válidos
  - Al menos un bien para transferir

#### 2. Validación de Reglas de Negocio (`validateBusinessRules`)

Verifica:
- Director origen ≠ director destino
- Para transferencia completa:
  - No hay resguardos activos en el área origen
  - Si `targetAreaId` es -1 o null: el director destino no tiene ya esa área
- Para transferencia parcial:
  - El área destino existe y pertenece al director destino

### Ejecución de Transferencia

#### Transferencia Completa (`handleCompleteAreaTransfer`)

**Parámetros:**
```typescript
sourceDirectorId: number
targetDirectorId: number
sourceAreaId: number
targetAreaId: number | null  // null o -1 = crear nueva, número = fusionar
```

**Lógica:**

1. **Determinar modo:**
   ```typescript
   const isCreatingNewArea = targetAreaId === null || targetAreaId === -1;
   const finalTargetAreaId = isCreatingNewArea ? sourceAreaId : targetAreaId;
   ```

2. **Contar bienes en cada tabla:**
   - `muebles` (INEA)
   - `mueblesitea` (ITEA)
   - `mueblestlaxcala` (No Listado)

3. **Actualizar bienes en cada tabla:**
   ```sql
   UPDATE muebles
   SET id_directorio = targetDirectorId,
       id_area = finalTargetAreaId
   WHERE id_directorio = sourceDirectorId
     AND id_area = sourceAreaId
   ```
   - Se repite para las 3 tablas

4. **Eliminar relación origen:**
   ```sql
   DELETE FROM directorio_areas
   WHERE id_directorio = sourceDirectorId
     AND id_area = sourceAreaId
   ```
   - **SIEMPRE se elimina**, independientemente del modo

5. **Crear relación destino (solo si es nueva área):**
   ```sql
   INSERT INTO directorio_areas (id_directorio, id_area)
   VALUES (targetDirectorId, sourceAreaId)
   ```
   - Solo si `isCreatingNewArea === true`
   - Si es fusión, la relación ya existe

**Resultado:**

- **Modo "Crear nueva área":**
  - Área se mueve del director origen al destino
  - Todos los bienes se actualizan
  - Relación origen eliminada
  - Relación destino creada

- **Modo "Fusionar":**
  - Todos los bienes se mueven al área destino
  - Relación origen eliminada
  - Área origen desaparece del director origen
  - Bienes se fusionan en área destino existente

#### Transferencia Parcial (`handlePartialBienesTransfer`)

**Parámetros:**
```typescript
sourceDirectorId: number
targetDirectorId: number
targetAreaId: number  // DEBE ser un área existente
bienIds: {
  inea: number[],
  itea: number[],
  no_listado: number[]
}
```

**Lógica:**

1. **Procesar bienes en batches (50 items por batch):**
   - Para cada tabla (INEA, ITEA, No Listado)
   - Divide los IDs en grupos de 50
   - Actualiza cada batch:
     ```sql
     UPDATE muebles
     SET id_directorio = targetDirectorId,
         id_area = targetAreaId
     WHERE id IN (batch_ids)
     ```

2. **NO modifica relaciones directorio-área:**
   - Las relaciones permanecen intactas
   - Solo se mueven los bienes específicos

**Resultado:**
- Bienes seleccionados se mueven al área destino
- Área origen conserva sus bienes restantes
- Relaciones directorio-área no cambian

### Logging

Cada operación se registra en 3 momentos:

1. **Inicio (`status: 'started'`):**
   ```typescript
   {
     action, userId, sourceDirectorId, targetDirectorId,
     areaId, targetAreaId, status: 'started', timestamp
   }
   ```

2. **Éxito (`status: 'success'`):**
   ```typescript
   {
     ..., status: 'success',
     bienesTransferred, ineaUpdated, iteaUpdated,
     noListadoUpdated, duration, timestamp
   }
   ```

3. **Error (`status: 'error'`):**
   ```typescript
   {
     ..., status: 'error',
     error: errorMessage, duration, timestamp
   }
   ```

Los logs se escriben en:
- Console (siempre)
- Tabla `transfer_logs` (si existe, best-effort)

### Invalidación de Cache

Después de una transferencia exitosa, se invalidan los caches de:
- `adminStore` (directorio, areas, directorio_areas)
- `ineaStore` (muebles INEA)
- `iteaStore` (muebles ITEA)
- `noListadoStore` (muebles No Listado)

Esto asegura que la UI refleje los cambios inmediatamente.

## Casos de Uso

### Caso 1: Transferir área completa con nuevo nombre

**Escenario:**
- Director A tiene área "Recursos Humanos" con 50 bienes
- Queremos mover toda el área al Director B

**Flujo:**
1. Usuario selecciona Director A → Área "Recursos Humanos"
2. Selecciona TODOS los 50 bienes (o usa el botón "Seleccionar todos")
3. Selecciona Director B como destino
4. En Paso 2, hace clic en "Transferir área completa"
5. `targetAreaId = -1`

**Backend:**
```typescript
handleCompleteAreaTransfer(
  directorA_id,
  directorB_id,
  recursosHumanos_id,
  -1  // Crear nueva área
)
```

**Resultado:**
- 50 bienes actualizados en las 3 tablas
- Relación `directorio_areas` eliminada para Director A
- Relación `directorio_areas` creada para Director B
- Director A ya NO tiene el área "Recursos Humanos"
- Director B ahora TIENE el área "Recursos Humanos"

### Caso 2: Fusionar área completa a área existente

**Escenario:**
- Director A tiene área "Finanzas" con 30 bienes
- Director B ya tiene área "Finanzas" con 20 bienes
- Queremos fusionar todos los bienes de A a B

**Flujo:**
1. Usuario selecciona Director A → Área "Finanzas"
2. Selecciona TODOS los 30 bienes
3. Selecciona Director B como destino
4. En Paso 2, selecciona el área "Finanzas" existente de Director B
5. `targetAreaId = finanzas_id`

**Backend:**
```typescript
handleCompleteAreaTransfer(
  directorA_id,
  directorB_id,
  finanzas_id,
  finanzas_id  // Fusionar a área existente
)
```

**Resultado:**
- 30 bienes actualizados para apuntar a Director B, área "Finanzas"
- Relación `directorio_areas` eliminada para Director A
- Director A ya NO tiene el área "Finanzas"
- Director B tiene área "Finanzas" con 50 bienes (20 + 30)

### Caso 3: Transferir bienes seleccionados

**Escenario:**
- Director A tiene área "Sistemas" con 100 bienes
- Queremos mover solo 15 bienes específicos al Director B, área "TI"

**Flujo:**
1. Usuario selecciona Director A → Área "Sistemas"
2. Selecciona solo 15 bienes específicos
3. Selecciona Director B como destino
4. En Paso 2, selecciona área "TI" de Director B
5. `targetAreaId = ti_id`

**Backend:**
```typescript
handlePartialBienesTransfer(
  directorA_id,
  directorB_id,
  ti_id,
  { inea: [1,2,3], itea: [4,5], no_listado: [6,7,8,9,10,11,12,13,14,15] }
)
```

**Resultado:**
- 15 bienes actualizados para apuntar a Director B, área "TI"
- Director A conserva área "Sistemas" con 85 bienes
- Director B tiene área "TI" con los 15 bienes adicionales
- Relaciones `directorio_areas` NO cambian

## Diferencias Clave

| Aspecto | Transferencia Completa (Nueva) | Transferencia Completa (Fusión) | Transferencia Parcial |
|---------|-------------------------------|--------------------------------|----------------------|
| `targetAreaId` | `-1` o `null` | Número del área destino | Número del área destino |
| Bienes movidos | Todos del área | Todos del área | Solo seleccionados |
| Relación origen | Eliminada | Eliminada | Mantenida |
| Relación destino | Creada | Ya existe | Ya existe |
| Área origen | Desaparece | Desaparece | Permanece |
| Área destino | Se crea | Se fusiona | Se fusiona |

## Validaciones Importantes

1. **No puede haber resguardos activos** en el área origen para transferencia completa
2. **Director origen ≠ director destino** siempre
3. **Para crear nueva área:** el director destino no debe tener ya esa área
4. **Para fusionar:** el área destino debe existir y pertenecer al director destino
5. **Para transferencia parcial:** debe haber al menos 1 bien seleccionado

## Manejo de Errores

- Todos los errores se registran en logs
- Si falla una operación, se lanza excepción
- No hay rollback automático (las operaciones son atómicas por tabla)
- El frontend muestra el error al usuario
- Los caches NO se invalidan si hay error

## Consideraciones de Performance

- **Batch processing:** Transferencias parciales procesan en batches de 50 items
- **Indexación:** Después de transferencia exitosa, se reindexan todos los stores
- **Logging:** Los logs a base de datos son best-effort (no fallan la operación)

## Estado Final

Después de cualquier transferencia exitosa:
- Los bienes están en el director/área correctos
- Las relaciones `directorio_areas` están actualizadas
- Los caches están invalidados
- Los logs están registrados
- La UI refleja los cambios inmediatamente

# Fase 3: Plan de Testing y Validación

## Objetivo

Verificar que la migración del campo `resguardante` a relacional funciona correctamente en todos los módulos y escenarios.

## Módulos a Probar

1. **INEA General** (`useIneaIndexation`)
2. **INEA Obsoletos** (`useIneaObsoletosIndexation`)
3. **ITEA General** (`useIteaIndexation`)
4. **ITEA Obsoletos** (`useIteaObsoletosIndexation`)
5. **NO-LISTADO** (`useNoListadoIndexation`)

---

## Task 3.1: Testing de Indexación

### Objetivo
Verificar que la indexación inicial carga correctamente el campo `resguardante` desde la tabla relacional.

### Casos de Prueba

#### Caso 3.1.1: Mueble sin resguardo
**Precondición**: Mueble existe en tabla de muebles pero NO tiene registro en tabla `resguardos`

**Pasos**:
1. Limpiar IndexedDB
2. Recargar página para forzar reindexación
3. Buscar el mueble en la vista correspondiente
4. Verificar campo `resguardante` en el objeto

**Resultado Esperado**:
- `resguardante: null`
- UI muestra "Sin resguardante"

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.1.2: Mueble con resguardo vacío
**Precondición**: Mueble tiene registro en `resguardos` pero campo `resguardante` es `""` o `NULL`

**Pasos**:
1. Crear registro en `resguardos` con `resguardante = ''`
2. Limpiar IndexedDB
3. Recargar página
4. Buscar el mueble
5. Verificar campo `resguardante`

**Resultado Esperado**:
- `resguardante: null`
- UI muestra "Sin resguardante"

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.1.3: Mueble con resguardante
**Precondición**: Mueble tiene registro en `resguardos` con campo `resguardante` poblado

**Pasos**:
1. Crear registro en `resguardos` con `resguardante = 'Juan Pérez'`
2. Limpiar IndexedDB
3. Recargar página
4. Buscar el mueble
5. Verificar campo `resguardante`

**Resultado Esperado**:
- `resguardante: 'Juan Pérez'`
- UI muestra "Juan Pérez"

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.1.4: Mueble con múltiples resguardos
**Precondición**: Mueble tiene varios registros en `resguardos` con diferentes fechas

**Pasos**:
1. Crear 3 registros en `resguardos` para el mismo mueble:
   - Registro 1: `f_resguardo = '2024-01-01'`, `resguardante = 'María López'`
   - Registro 2: `f_resguardo = '2024-06-01'`, `resguardante = 'Carlos Ruiz'`
   - Registro 3: `f_resguardo = '2024-12-01'`, `resguardante = 'Ana García'`
2. Limpiar IndexedDB
3. Recargar página
4. Buscar el mueble
5. Verificar campo `resguardante`

**Resultado Esperado**:
- `resguardante: 'Ana García'` (el más reciente)
- UI muestra "Ana García"

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.1.5: Indexación completa sin errores
**Objetivo**: Verificar que la indexación completa se ejecuta sin errores

**Pasos**:
1. Abrir consola del navegador
2. Limpiar IndexedDB
3. Recargar página
4. Observar logs de indexación
5. Verificar que no hay errores en consola

**Resultado Esperado**:
- Indexación completa al 100%
- No hay errores en consola
- Todos los muebles cargados correctamente
- Campo `resguardante` presente en todos los registros

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.1.6: ITEA mantiene colores
**Objetivo**: Verificar que ITEA sigue mostrando colores correctamente

**Pasos**:
1. Limpiar IndexedDB
2. Recargar página
3. Ir a vista ITEA General
4. Verificar que muebles con color asignado lo muestran
5. Verificar que también tienen `resguardante`

**Resultado Esperado**:
- Campo `colores` presente y correcto
- Campo `resguardante` presente y correcto
- Ambos campos coexisten sin conflicto

**Módulos**: ITEA General, ITEA Obsoletos

---

## Task 3.2: Testing de Realtime

### Objetivo
Verificar que los cambios en tiempo real actualizan correctamente el campo `resguardante`.

### Casos de Prueba

#### Caso 3.2.1: Crear nuevo resguardo
**Precondición**: Mueble existe sin resguardo

**Pasos**:
1. Abrir vista del módulo correspondiente
2. Localizar mueble sin resguardante
3. Desde otra pestaña o herramienta SQL, insertar registro en `resguardos`:
   ```sql
   INSERT INTO resguardos (folio, f_resguardo, id_directorio, id_mueble, origen, puesto_resguardo, resguardante, created_by, id_area)
   VALUES ('F-001', '2024-12-01', 1, 'uuid-del-mueble', 'INEA', 'Director', 'Pedro Sánchez', 'uuid-usuario', 1);
   ```
4. Observar la UI (sin recargar)

**Resultado Esperado**:
- UI se actualiza automáticamente
- Campo `resguardante` cambia de null a 'Pedro Sánchez'
- Cambio visible en menos de 2 segundos

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.2.2: Modificar resguardante
**Precondición**: Mueble tiene resguardo existente

**Pasos**:
1. Abrir vista del módulo
2. Localizar mueble con resguardante
3. Desde SQL, actualizar el registro:
   ```sql
   UPDATE resguardos 
   SET resguardante = 'Nuevo Nombre'
   WHERE id_mueble = 'uuid-del-mueble' AND origen = 'INEA';
   ```
4. Observar la UI

**Resultado Esperado**:
- UI se actualiza automáticamente
- Campo `resguardante` muestra 'Nuevo Nombre'
- Cambio visible en menos de 2 segundos

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.2.3: Eliminar resguardo
**Precondición**: Mueble tiene resguardo existente

**Pasos**:
1. Abrir vista del módulo
2. Localizar mueble con resguardante
3. Desde SQL, eliminar el registro:
   ```sql
   DELETE FROM resguardos 
   WHERE id_mueble = 'uuid-del-mueble' AND origen = 'INEA';
   ```
4. Observar la UI

**Resultado Esperado**:
- UI se actualiza automáticamente
- Campo `resguardante` cambia a null
- UI muestra "Sin resguardante"
- Cambio visible en menos de 2 segundos

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.2.4: Cambios en tabla muebles siguen funcionando
**Objetivo**: Verificar que los listeners existentes no se rompieron

**Pasos**:
1. Abrir vista del módulo
2. Desde SQL, actualizar un campo del mueble:
   ```sql
   UPDATE muebles 
   SET descripcion = 'Nueva descripción'
   WHERE id = 'uuid-del-mueble';
   ```
3. Observar la UI

**Resultado Esperado**:
- UI se actualiza automáticamente
- Campo modificado se refleja en la UI
- Campo `resguardante` se mantiene correcto

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.2.5: Cambios en tabla area siguen funcionando
**Objetivo**: Verificar batch updates de área

**Pasos**:
1. Abrir vista del módulo
2. Identificar un área con varios muebles
3. Desde SQL, actualizar el nombre del área:
   ```sql
   UPDATE area 
   SET nombre = 'Área Actualizada'
   WHERE id_area = 1;
   ```
4. Observar la UI

**Resultado Esperado**:
- UI muestra skeletons para muebles afectados
- Después de ~800ms, muebles se actualizan
- Nombre de área actualizado en todos los muebles
- Campo `resguardante` se mantiene correcto en todos

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.2.6: Cambios en tabla directorio siguen funcionando
**Objetivo**: Verificar batch updates de directorio

**Pasos**:
1. Abrir vista del módulo
2. Identificar un director con varios muebles
3. Desde SQL, actualizar el nombre del director:
   ```sql
   UPDATE directorio 
   SET nombre = 'Director Actualizado'
   WHERE id_directorio = 1;
   ```
4. Observar la UI

**Resultado Esperado**:
- UI muestra skeletons para muebles afectados
- Después de ~800ms, muebles se actualizan
- Nombre de director actualizado en todos los muebles
- Campo `resguardante` se mantiene correcto en todos

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

## Task 3.3: Testing de Búsqueda y Filtros

### Objetivo
Verificar que las búsquedas y filtros funcionan correctamente con el nuevo campo relacional.

### Casos de Prueba

#### Caso 3.3.1: Buscar por resguardante
**Precondición**: Varios muebles con diferentes resguardantes

**Pasos**:
1. Ir a vista del módulo
2. En barra de búsqueda, escribir nombre de resguardante
3. Presionar Enter o esperar búsqueda automática
4. Verificar resultados

**Resultado Esperado**:
- Resultados filtrados muestran solo muebles con ese resguardante
- Búsqueda es case-insensitive
- Búsqueda parcial funciona (ej: "Juan" encuentra "Juan Pérez")

**Módulos**: INEA, ITEA, NO-LISTADO

---

#### Caso 3.3.2: Filtrar por resguardante
**Objetivo**: Verificar filtros de resguardante si existen en la UI

**Pasos**:
1. Ir a vista del módulo
2. Abrir panel de filtros
3. Seleccionar un resguardante específico
4. Aplicar filtro
5. Verificar resultados

**Resultado Esperado**:
- Solo muebles con ese resguardante se muestran
- Contador de resultados es correcto

**Módulos**: INEA, ITEA, NO-LISTADO (si aplica)

---

#### Caso 3.3.3: Sugerencias de resguardante
**Objetivo**: Verificar que autocompletado funciona

**Pasos**:
1. Ir a vista del módulo
2. Hacer clic en campo de búsqueda
3. Escribir primeras letras de un resguardante
4. Observar sugerencias

**Resultado Esperado**:
- Dropdown muestra sugerencias de resguardantes
- Sugerencias coinciden con lo escrito
- Al seleccionar, se aplica el filtro

**Módulos**: INEA, ITEA, NO-LISTADO (si aplica)

---

#### Caso 3.3.4: Distinguir con/sin resguardante
**Objetivo**: Verificar filtro de muebles sin resguardante

**Pasos**:
1. Ir a vista del módulo
2. Aplicar filtro "Sin resguardante" (si existe)
3. Verificar resultados

**Resultado Esperado**:
- Solo muebles con `resguardante = null` se muestran
- UI muestra "Sin resguardante" en todos

**Módulos**: INEA, ITEA, NO-LISTADO (si aplica)

---

#### Caso 3.3.5: Filtros múltiples
**Objetivo**: Verificar que resguardante funciona con otros filtros

**Pasos**:
1. Ir a vista del módulo
2. Aplicar filtro de área
3. Aplicar filtro de resguardante
4. Verificar resultados

**Resultado Esperado**:
- Resultados cumplen AMBOS filtros
- Contador es correcto
- Paginación funciona

**Módulos**: INEA, ITEA, NO-LISTADO

---

## Task 3.4: Testing de UI

### Objetivo
Verificar que la UI muestra correctamente el campo `resguardante` en todos los componentes.

### Casos de Prueba

#### Caso 3.4.1: Tablas muestran resguardante
**Objetivo**: Verificar columna de resguardante en tablas

**Pasos**:
1. Ir a cada vista de módulo
2. Verificar que tabla tiene columna "Resguardante"
3. Verificar valores en la columna

**Resultado Esperado**:
- Columna "Resguardante" visible
- Valores correctos mostrados
- "Sin resguardante" para valores null
- Texto truncado si es muy largo

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.4.2: Paneles de detalle muestran resguardante
**Objetivo**: Verificar campo en panel lateral de detalles

**Pasos**:
1. Ir a vista del módulo
2. Hacer clic en un mueble para ver detalles
3. Buscar campo "Resguardante" en panel

**Resultado Esperado**:
- Campo "Resguardante" presente
- Valor correcto mostrado
- "Sin resguardante" si es null
- Formato consistente con otros campos

**Módulos**: INEA, INEA Obsoletos, ITEA, ITEA Obsoletos, NO-LISTADO

---

#### Caso 3.4.3: Exportaciones incluyen resguardante
**Objetivo**: Verificar que exportaciones a Excel incluyen el campo

**Pasos**:
1. Ir a vista del módulo
2. Exportar datos a Excel
3. Abrir archivo Excel
4. Verificar columna "Resguardante"

**Resultado Esperado**:
- Columna "Resguardante" presente en Excel
- Valores correctos exportados
- Celdas vacías para valores null

**Módulos**: INEA, ITEA, NO-LISTADO (si tienen exportación)

---

#### Caso 3.4.4: PDFs incluyen resguardante
**Objetivo**: Verificar que PDFs de resguardos incluyen el campo

**Pasos**:
1. Ir a módulo de resguardos
2. Generar PDF de un resguardo
3. Abrir PDF
4. Verificar que muestra resguardante

**Resultado Esperado**:
- Campo "Resguardante" visible en PDF
- Valor correcto mostrado
- Formato profesional

**Módulos**: Resguardos (crear/consultar)

---

#### Caso 3.4.5: Levantamiento muestra resguardante
**Objetivo**: Verificar vista unificada de levantamiento

**Pasos**:
1. Ir a vista de Levantamiento
2. Verificar columna de resguardante
3. Filtrar por diferentes orígenes

**Resultado Esperado**:
- Columna "Resguardante" presente
- Valores correctos para INEA, ITEA y NO-LISTADO
- Filtros funcionan correctamente

**Módulos**: Levantamiento

---

## Checklist de Validación Final

### Indexación
- [ ] Muebles sin resguardo muestran `resguardante: null`
- [ ] Muebles con resguardo muestran el nombre correcto
- [ ] Muebles con resguardo vacío muestran `resguardante: null`
- [ ] Muebles con múltiples resguardos muestran el más reciente
- [ ] Indexación completa sin errores para INEA
- [ ] Indexación completa sin errores para ITEA
- [ ] Indexación completa sin errores para NO-LISTADO
- [ ] Indexación completa sin errores para obsoletos

### Realtime
- [ ] Crear nuevo resguardo → UI se actualiza
- [ ] Modificar resguardante → UI se actualiza
- [ ] Eliminar resguardo → UI muestra "Sin resguardante"
- [ ] Cambios en tabla `muebles` siguen funcionando
- [ ] Cambios en tabla `area` siguen funcionando
- [ ] Cambios en tabla `directorio` siguen funcionando

### Búsqueda y Filtros
- [ ] Buscar por resguardante encuentra resultados
- [ ] Filtrar por resguardante funciona
- [ ] Sugerencias de resguardante se generan correctamente
- [ ] Búsqueda distingue entre con/sin resguardante
- [ ] Filtros múltiples funcionan correctamente

### UI
- [ ] Tablas muestran resguardante correctamente
- [ ] Paneles de detalle muestran resguardante
- [ ] "Sin resguardante" se muestra cuando es null
- [ ] Exportaciones incluyen resguardante correcto
- [ ] PDFs incluyen resguardante correcto

---

## Criterios de Aceptación

Para considerar la Fase 3 completada, se deben cumplir:

1. **100% de casos de prueba ejecutados** en al menos un módulo de cada tipo (INEA, ITEA, NO-LISTADO)
2. **95% de casos de prueba pasados** (se permiten fallos menores no críticos)
3. **Cero errores críticos** que impidan el uso normal del sistema
4. **Documentación de bugs** encontrados con severidad y pasos para reproducir
5. **Plan de corrección** para bugs encontrados

---

## Notas de Ejecución

### Ambiente de Testing
- **Navegador**: Chrome/Edge (última versión)
- **Base de datos**: Staging o desarrollo (NO producción)
- **Datos de prueba**: Crear datos específicos para testing

### Herramientas
- **Consola del navegador**: Para verificar logs y errores
- **DevTools Network**: Para verificar queries de Supabase
- **IndexedDB Inspector**: Para verificar datos en caché
- **SQL Client**: Para manipular datos directamente

### Registro de Resultados
Documentar cada caso de prueba con:
- ✅ PASS: Funciona como esperado
- ⚠️ WARN: Funciona pero con issues menores
- ❌ FAIL: No funciona, requiere corrección
- 🔄 SKIP: No aplicable o no se pudo probar


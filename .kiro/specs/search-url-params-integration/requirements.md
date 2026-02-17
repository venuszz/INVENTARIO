# Integración de Parámetros URL en Búsqueda Universal

## Descripción General
Actualmente, la barra de búsqueda universal redirige correctamente a las páginas de consulta, pero no abre automáticamente el panel de detalles del bien buscado. Los componentes de consulta necesitan leer el parámetro `id` de la URL y abrir automáticamente el panel de detalles correspondiente.

## Problema Actual
1. Usuario busca un bien en la barra de búsqueda universal
2. La búsqueda redirige correctamente a la página (ej: `/consultas/no-listado?id=123`)
3. **PROBLEMA**: El panel de detalles no se abre automáticamente
4. Usuario debe buscar manualmente el bien en la tabla y hacer clic para ver detalles

## Solución Propuesta
Implementar lectura de parámetros URL en todos los componentes de consulta para:
1. Detectar parámetro `id` o `folio` en la URL al cargar el componente
2. Buscar automáticamente el bien/resguardo correspondiente
3. Abrir el panel de detalles automáticamente
4. Limpiar el parámetro de la URL después de abrir el panel (opcional, para mantener URL limpia)

## User Stories

### 1. Búsqueda de Bien en No Listado (TLAXCALA)
**Como** usuario del sistema  
**Quiero** que al buscar un bien de TLAXCALA en la barra de búsqueda universal  
**Para** ver automáticamente el panel de detalles del bien sin tener que buscarlo manualmente en la tabla

**Criterios de Aceptación:**
- 1.1: Al hacer clic en un resultado de "No Listado" en la búsqueda universal, se redirige a `/consultas/no-listado?id={id}`
- 1.2: El componente lee el parámetro `id` de la URL al cargar
- 1.3: El componente busca el bien con ese `id` en los datos indexados
- 1.4: Si el bien existe, se abre automáticamente el panel de detalles
- 1.5: Si el bien no existe, se muestra un mensaje informativo
- 1.6: El parámetro `id` se limpia de la URL después de abrir el panel (comportamiento opcional)

### 2. Búsqueda de Bien en INEA General
**Como** usuario del sistema  
**Quiero** que al buscar un bien de INEA en la barra de búsqueda universal  
**Para** ver automáticamente el panel de detalles del bien

**Criterios de Aceptación:**
- 2.1: Al hacer clic en un resultado de "INEA" en la búsqueda universal, se redirige a `/consultas/inea/general?id={id}`
- 2.2: El componente lee el parámetro `id` de la URL al cargar
- 2.3: El componente busca el bien con ese `id` en los datos indexados
- 2.4: Si el bien existe, se abre automáticamente el panel de detalles
- 2.5: Si el bien no existe, se muestra un mensaje informativo

### 3. Búsqueda de Bien en ITEA General
**Como** usuario del sistema  
**Quiero** que al buscar un bien de ITEA en la barra de búsqueda universal  
**Para** ver automáticamente el panel de detalles del bien

**Criterios de Aceptación:**
- 3.1: Al hacer clic en un resultado de "ITEA" en la búsqueda universal, se redirige a `/consultas/itea/general?id={id}`
- 3.2: El componente lee el parámetro `id` de la URL al cargar
- 3.3: El componente busca el bien con ese `id` en los datos indexados
- 3.4: Si el bien existe, se abre automáticamente el panel de detalles
- 3.5: Si el bien no existe, se muestra un mensaje informativo

### 4. Búsqueda de Bien en INEA Obsoletos
**Como** usuario del sistema  
**Quiero** que al buscar un bien obsoleto de INEA en la barra de búsqueda universal  
**Para** ver automáticamente el panel de detalles del bien

**Criterios de Aceptación:**
- 4.1: Al hacer clic en un resultado de "INEA Obsoletos" en la búsqueda universal, se redirige a `/consultas/inea/obsoletos?id={id}`
- 4.2: El componente lee el parámetro `id` de la URL al cargar
- 4.3: El componente busca el bien con ese `id` en los datos indexados
- 4.4: Si el bien existe, se abre automáticamente el panel de detalles
- 4.5: Si el bien no existe, se muestra un mensaje informativo

### 5. Búsqueda de Bien en ITEA Obsoletos
**Como** usuario del sistema  
**Quiero** que al buscar un bien obsoleto de ITEA en la barra de búsqueda universal  
**Para** ver automáticamente el panel de detalles del bien

**Criterios de Aceptación:**
- 5.1: Al hacer clic en un resultado de "ITEA Obsoletos" en la búsqueda universal, se redirige a `/consultas/itea/obsoletos?id={id}`
- 5.2: El componente lee el parámetro `id` de la URL al cargar
- 5.3: El componente busca el bien con ese `id` en los datos indexados
- 5.4: Si el bien existe, se abre automáticamente el panel de detalles
- 5.5: Si el bien no existe, se muestra un mensaje informativo

### 6. Búsqueda de Resguardo
**Como** usuario del sistema  
**Quiero** que al buscar un resguardo en la barra de búsqueda universal  
**Para** ver automáticamente el panel de detalles del resguardo

**Criterios de Aceptación:**
- 6.1: Al hacer clic en un resultado de "Resguardos" en la búsqueda universal, se redirige a `/resguardos/consultar?folio={folio}`
- 6.2: El componente lee el parámetro `folio` de la URL al cargar
- 6.3: El componente busca el resguardo con ese `folio` en los datos indexados
- 6.4: Si el resguardo existe, se abre automáticamente el panel de detalles
- 6.5: Si el resguardo no existe, se muestra un mensaje informativo

### 7. Búsqueda de Resguardo de Baja
**Como** usuario del sistema  
**Quiero** que al buscar un resguardo de baja en la barra de búsqueda universal  
**Para** ver automáticamente el panel de detalles del resguardo de baja

**Criterios de Aceptación:**
- 7.1: Al hacer clic en un resultado de "Resguardos de Bajas" en la búsqueda universal, se redirige a `/resguardos/consultar/bajas?folio={folio}`
- 7.2: El componente lee el parámetro `folio` de la URL al cargar
- 7.3: El componente busca el resguardo de baja con ese `folio` en los datos indexados
- 7.4: Si el resguardo de baja existe, se abre automáticamente el panel de detalles
- 7.5: Si el resguardo de baja no existe, se muestra un mensaje informativo

## Componentes Afectados

### Componentes de Consulta de Inventario
1. `src/components/consultas/no-listado/index.tsx` - No Listado (TLAXCALA)
2. `src/components/consultas/inea/index.tsx` - INEA General
3. `src/components/consultas/itea/index.tsx` - ITEA General
4. `src/components/consultas/inea/obsoletos/index.tsx` - INEA Obsoletos
5. `src/components/consultas/itea/obsoletos/index.tsx` - ITEA Obsoletos

### Componentes de Resguardos
6. `src/components/resguardos/consultar/index.tsx` - Consultar Resguardos
7. `src/components/resguardos/consultarBajas/index.tsx` - Consultar Bajas

## Consideraciones Técnicas

### Hooks de Next.js
- Usar `useSearchParams()` de `next/navigation` para leer parámetros de URL
- Usar `useRouter()` para limpiar parámetros después de abrir panel (opcional)

### Timing
- Esperar a que los datos estén cargados antes de buscar el item
- Manejar caso donde los datos aún están indexando

### UX
- Mostrar indicador de carga mientras se busca el item
- Scroll automático al panel de detalles si es necesario
- Mensaje claro si el item no se encuentra

### Limpieza de URL
- **Opción A**: Limpiar parámetro inmediatamente después de abrir panel
- **Opción B**: Mantener parámetro en URL para permitir compartir link directo
- **Recomendación**: Opción B para mejor UX y compartibilidad

## Notas Adicionales

### Cambio de Nombre: "No Listado" → "TLAXCALA"
El usuario mencionó que "No Listado" debería llamarse "TLAXCALA". Este cambio debe aplicarse en:
- Título del componente
- Breadcrumbs
- Menú de navegación
- Resultados de búsqueda universal
- Documentación

### Prioridad
Alta - Esta funcionalidad es crítica para la experiencia de usuario de la búsqueda universal.

## Dependencias
- Next.js 14+ (para `useSearchParams`)
- Stores de Zustand ya implementados
- Hooks de indexación ya implementados

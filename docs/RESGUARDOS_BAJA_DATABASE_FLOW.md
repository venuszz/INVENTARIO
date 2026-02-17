# Flujo de Base de Datos: Baja de Resguardos

## Índice
1. [Tablas Involucradas](#tablas-involucradas)
2. [Flujo de Datos Paso a Paso](#flujo-de-datos-paso-a-paso)
3. [Generación de Folio de Baja](#generación-de-folio-de-baja)
4. [Operaciones SQL](#operaciones-sql)
5. [Diagrama de Flujo](#diagrama-de-flujo)

---

## Tablas Involucradas

### 1. Tabla `folios`
**Propósito:** Gestionar contadores de folios para resguardos y bajas

```sql
CREATE TABLE folios (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,           -- 'RESGUARDO' o 'BAJA'
  anio INTEGER NOT NULL,        -- Año actual
  contador INTEGER NOT NULL,    -- Contador secuencial
  UNIQUE(tipo, anio)
);
```

**Datos de ejemplo:**
```sql
| id | tipo       | anio | contador |
|----|------------|------|----------|
| 1  | RESGUARDO  | 2024 | 125      |
| 2  | BAJA       | 2024 | 45       |
```

### 2. Tabla `resguardos` (Activos)
**Propósito:** Almacenar resguardos activos

```sql
CREATE TABLE resguardos (
  id SERIAL PRIMARY KEY,
  folio TEXT NOT NULL,
  f_resguardo DATE NOT NULL,
  id_directorio INTEGER NOT NULL,
  id_mueble UUID NOT NULL,
  origen TEXT NOT NULL,
  resguardante TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  id_area INTEGER NOT NULL,
  CONSTRAINT resguardos_directorio_fk 
    FOREIGN KEY (id_directorio) REFERENCES directorio(id_directorio),
  CONSTRAINT fk_resguardos_area 
    FOREIGN KEY (id_area) REFERENCES area(id_area)
);
```

**Datos de ejemplo:**
```sql
| id | folio      | f_resguardo | id_directorio | id_mueble | origen | resguardante | id_area |
|----|------------|-------------|---------------|-----------|--------|--------------|---------|
| 1  | R-2024-001 | 2024-01-15  | 5             | uuid-123  | INEA   | Juan Pérez   | 3       |
| 2  | R-2024-001 | 2024-01-15  | 5             | uuid-456  | INEA   | Juan Pérez   | 3       |
| 3  | R-2024-001 | 2024-01-15  | 5             | uuid-789  | ITEA   | Juan Pérez   | 3       |
```

### 3. Tabla `resguardos_bajas` (Histórico)
**Propósito:** Almacenar histórico de bajas

```sql
CREATE TABLE resguardos_bajas (
  id SERIAL PRIMARY KEY,
  folio_resguardo TEXT NOT NULL,    -- Folio original del resguardo
  folio_baja TEXT NOT NULL,         -- Folio de la baja
  f_resguardo DATE NOT NULL,        -- Fecha del resguardo original
  area_resguardo TEXT,              -- Área (desnormalizado)
  dir_area TEXT,                    -- Director (desnormalizado)
  num_inventario TEXT,              -- Número de inventario
  descripcion TEXT,                 -- Descripción del bien
  rubro TEXT,                       -- Rubro
  condicion TEXT,                   -- Condición
  usufinal TEXT,                    -- Resguardante (legacy name)
  puesto TEXT,                      -- Puesto del director
  origen TEXT,                      -- INEA, ITEA, NO_LISTADO
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Datos de ejemplo después de baja:**
```sql
| id | folio_resguardo | folio_baja  | f_resguardo | area_resguardo | dir_area      | num_inventario | descripcion | rubro    | condicion | usufinal   | puesto    | origen |
|----|-----------------|-------------|-------------|----------------|---------------|----------------|-------------|----------|-----------|------------|-----------|--------|
| 1  | R-2024-001      | BAJA-2024-1 | 2024-01-15  | SISTEMAS       | María García  | INV-001        | Laptop      | Cómputo  | Bueno     | Juan Pérez | Director  | INEA   |
```

### 4. Tablas de Inventario (inea, itea, no_listado)
**Propósito:** Almacenar bienes muebles

```sql
-- Ejemplo con tabla inea
CREATE TABLE inea (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_inv TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  rubro TEXT,
  estado TEXT,
  resguardante TEXT,              -- Campo a limpiar en baja
  id_directorio INTEGER,
  id_area INTEGER,
  -- ... otros campos
);
```

---

## Flujo de Datos Paso a Paso

### Escenario: Dar de baja 1 artículo del resguardo R-2024-001

**Estado Inicial:**

**Tabla `folios`:**
```sql
| tipo       | anio | contador |
|------------|------|----------|
| RESGUARDO  | 2024 | 125      |
| BAJA       | 2024 | 44       |  ← Último folio de baja usado
```

**Tabla `resguardos`:**
```sql
| id | folio      | id_mueble | origen | resguardante | id_area |
|----|------------|-----------|--------|--------------|---------|
| 1  | R-2024-001 | uuid-123  | INEA   | Juan Pérez   | 3       |
| 2  | R-2024-001 | uuid-456  | INEA   | Juan Pérez   | 3       |
| 3  | R-2024-001 | uuid-789  | ITEA   | Juan Pérez   | 3       |
```

**Tabla `inea`:**
```sql
| id       | id_inv  | descripcion | resguardante | id_area |
|----------|---------|-------------|--------------|---------|
| uuid-123 | INV-001 | Laptop      | Juan Pérez   | 3       |
| uuid-456 | INV-002 | Monitor     | Juan Pérez   | 3       |
```

---

### Paso 1: Generar Folio de Baja

**Query 1: Obtener o crear registro de folio**
```sql
-- Buscar registro existente para el año actual
SELECT * FROM folios 
WHERE tipo = 'BAJA' AND anio = 2024;

-- Si existe: contador = 44
-- Si no existe: INSERT INTO folios (tipo, anio, contador) VALUES ('BAJA', 2024, 0);
```

**Query 2: Incrementar contador**
```sql
UPDATE folios 
SET contador = contador + 1 
WHERE tipo = 'BAJA' AND anio = 2024
RETURNING contador;

-- Resultado: contador = 45
```

**Folio generado:** `BAJA-2024-0045`

**Estado después:**
```sql
| tipo       | anio | contador |
|------------|------|----------|
| BAJA       | 2024 | 45       |  ← Incrementado
```

---

### Paso 2: Obtener Datos del Artículo

**Query 3: Obtener datos del resguardo**
```sql
SELECT 
  r.*,
  d.nombre as director_nombre,
  d.puesto as director_puesto,
  a.nombre as area_nombre
FROM resguardos r
JOIN directorio d ON r.id_directorio = d.id_directorio
JOIN area a ON r.id_area = a.id_area
WHERE r.id = 1;  -- ID del artículo a dar de baja
```

**Resultado:**
```sql
| id | folio      | f_resguardo | id_mueble | origen | resguardante | director_nombre | director_puesto | area_nombre |
|----|------------|-------------|-----------|--------|--------------|-----------------|-----------------|-------------|
| 1  | R-2024-001 | 2024-01-15  | uuid-123  | INEA   | Juan Pérez   | María García    | Directora       | SISTEMAS    |
```

**Query 4: Obtener datos del mueble**
```sql
-- Determinar tabla según origen (INEA)
SELECT id_inv, descripcion, rubro, estado 
FROM inea 
WHERE id = 'uuid-123';
```

**Resultado:**
```sql
| id_inv  | descripcion | rubro   | estado |
|---------|-------------|---------|--------|
| INV-001 | Laptop      | Cómputo | Bueno  |
```

---

### Paso 3: Insertar en Tabla de Bajas

**Query 5: Copiar a resguardos_bajas**
```sql
INSERT INTO resguardos_bajas (
  folio_resguardo,
  folio_baja,
  f_resguardo,
  area_resguardo,
  dir_area,
  num_inventario,
  descripcion,
  rubro,
  condicion,
  usufinal,
  puesto,
  origen
) VALUES (
  'R-2024-001',        -- folio_resguardo
  'BAJA-2024-0045',    -- folio_baja (generado)
  '2024-01-15',        -- f_resguardo (original)
  'SISTEMAS',          -- area_resguardo
  'María García',      -- dir_area
  'INV-001',           -- num_inventario
  'Laptop',            -- descripcion
  'Cómputo',           -- rubro
  'Bueno',             -- condicion
  'Juan Pérez',        -- usufinal (resguardante)
  'Directora',         -- puesto
  'INEA'               -- origen
);
```

**Estado después:**
```sql
-- Tabla resguardos_bajas
| id | folio_resguardo | folio_baja    | num_inventario | descripcion | usufinal   |
|----|-----------------|---------------|----------------|-------------|------------|
| 1  | R-2024-001      | BAJA-2024-0045| INV-001        | Laptop      | Juan Pérez |
```

---

### Paso 4: Eliminar de Tabla Activa

**Query 6: Eliminar de resguardos**
```sql
DELETE FROM resguardos 
WHERE id = 1;
```

**Estado después:**
```sql
-- Tabla resguardos (artículo eliminado)
| id | folio      | id_mueble | origen | resguardante |
|----|------------|-----------|--------|--------------|
| 2  | R-2024-001 | uuid-456  | INEA   | Juan Pérez   |  ← Permanece
| 3  | R-2024-001 | uuid-789  | ITEA   | Juan Pérez   |  ← Permanece
```

---

### Paso 5: Limpiar Campo Resguardante

**Query 7: Actualizar tabla de inventario**
```sql
-- Determinar tabla según origen (INEA)
UPDATE inea 
SET resguardante = '' 
WHERE id_inv = 'INV-001';
```

**Estado después:**
```sql
-- Tabla inea
| id       | id_inv  | descripcion | resguardante | id_area |
|----------|---------|-------------|--------------|---------|
| uuid-123 | INV-001 | Laptop      | ''           | 3       |  ← Limpiado
| uuid-456 | INV-002 | Monitor     | Juan Pérez   | 3       |  ← Sin cambios
```

---

## Generación de Folio de Baja

### Algoritmo Completo

```typescript
async function generateFolio(tipo: 'BAJA'): Promise<string> {
  const anioActual = new Date().getFullYear();
  
  // 1. Buscar o crear registro
  let { data: folioRecord } = await supabase
    .from('folios')
    .select('*')
    .eq('tipo', tipo)
    .eq('anio', anioActual)
    .single();
  
  if (!folioRecord) {
    // Crear nuevo registro para el año
    const { data: newRecord } = await supabase
      .from('folios')
      .insert({ tipo, anio: anioActual, contador: 0 })
      .select()
      .single();
    
    folioRecord = newRecord;
  }
  
  // 2. Incrementar contador
  const { data: updated } = await supabase
    .from('folios')
    .update({ contador: folioRecord.contador + 1 })
    .eq('tipo', tipo)
    .eq('anio', anioActual)
    .select()
    .single();
  
  // 3. Formatear folio
  const contador = updated.contador.toString().padStart(4, '0');
  return `BAJA-${anioActual}-${contador}`;
}
```

### Ejemplos de Folios Generados

```
BAJA-2024-0001  ← Primer folio del año
BAJA-2024-0002
BAJA-2024-0045
BAJA-2024-0123
BAJA-2025-0001  ← Se reinicia cada año
```

---

## Operaciones SQL Completas

### Baja Individual (1 artículo)

```sql
-- 1. Generar folio
UPDATE folios SET contador = contador + 1 
WHERE tipo = 'BAJA' AND anio = 2024 
RETURNING contador;

-- 2. Copiar a histórico
INSERT INTO resguardos_bajas (
  folio_resguardo, folio_baja, f_resguardo, 
  area_resguardo, dir_area, num_inventario, 
  descripcion, rubro, condicion, usufinal, puesto, origen
)
SELECT 
  r.folio,
  'BAJA-2024-0045',
  r.f_resguardo,
  a.nombre,
  d.nombre,
  m.id_inv,
  m.descripcion,
  m.rubro,
  m.estado,
  r.resguardante,
  d.puesto,
  r.origen
FROM resguardos r
JOIN directorio d ON r.id_directorio = d.id_directorio
JOIN area a ON r.id_area = a.id_area
JOIN inea m ON r.id_mueble = m.id
WHERE r.id = 1;

-- 3. Eliminar de activos
DELETE FROM resguardos WHERE id = 1;

-- 4. Limpiar inventario
UPDATE inea SET resguardante = '' WHERE id_inv = 'INV-001';
```

### Baja Total (todos los artículos del folio)

```sql
-- 1. Generar folio
UPDATE folios SET contador = contador + 1 
WHERE tipo = 'BAJA' AND anio = 2024 
RETURNING contador;

-- 2. Copiar todos los artículos a histórico
INSERT INTO resguardos_bajas (
  folio_resguardo, folio_baja, f_resguardo, 
  area_resguardo, dir_area, num_inventario, 
  descripcion, rubro, condicion, usufinal, puesto, origen
)
SELECT 
  r.folio,
  'BAJA-2024-0045',
  r.f_resguardo,
  a.nombre,
  d.nombre,
  COALESCE(inea.id_inv, itea.id_inv, nl.id_inv),
  COALESCE(inea.descripcion, itea.descripcion, nl.descripcion),
  COALESCE(inea.rubro, itea.rubro, nl.rubro),
  COALESCE(inea.estado, itea.estado, nl.estado),
  r.resguardante,
  d.puesto,
  r.origen
FROM resguardos r
JOIN directorio d ON r.id_directorio = d.id_directorio
JOIN area a ON r.id_area = a.id_area
LEFT JOIN inea ON r.id_mueble = inea.id AND r.origen = 'INEA'
LEFT JOIN itea ON r.id_mueble = itea.id AND r.origen = 'ITEA'
LEFT JOIN no_listado nl ON r.id_mueble = nl.id AND r.origen = 'NO_LISTADO'
WHERE r.folio = 'R-2024-001';

-- 3. Eliminar todos de activos
DELETE FROM resguardos WHERE folio = 'R-2024-001';

-- 4. Limpiar inventario (por cada artículo)
UPDATE inea SET resguardante = '' WHERE id_inv IN ('INV-001', 'INV-002');
UPDATE itea SET resguardante = '' WHERE id_inv IN ('INV-003');
```

---

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│ INICIO: Usuario solicita baja                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TABLA: folios                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SELECT * FROM folios                                    │ │
│ │ WHERE tipo = 'BAJA' AND anio = 2024                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ UPDATE folios SET contador = contador + 1              │ │
│ │ WHERE tipo = 'BAJA' AND anio = 2024                     │ │
│ │ RETURNING contador                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Resultado: BAJA-2024-0045                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TABLA: resguardos (lectura)                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SELECT r.*, d.nombre, d.puesto, a.nombre               │ │
│ │ FROM resguardos r                                       │ │
│ │ JOIN directorio d ON r.id_directorio = d.id_directorio │ │
│ │ JOIN area a ON r.id_area = a.id_area                   │ │
│ │ WHERE r.id = 1                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TABLA: inea/itea/no_listado (lectura)                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SELECT id_inv, descripcion, rubro, estado              │ │
│ │ FROM inea WHERE id = 'uuid-123'                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TABLA: resguardos_bajas (escritura)                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ INSERT INTO resguardos_bajas (                          │ │
│ │   folio_resguardo, folio_baja, f_resguardo,            │ │
│ │   area_resguardo, dir_area, num_inventario,            │ │
│ │   descripcion, rubro, condicion, usufinal,             │ │
│ │   puesto, origen                                        │ │
│ │ ) VALUES (...)                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ✅ Histórico guardado permanentemente                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TABLA: resguardos (escritura)                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ DELETE FROM resguardos WHERE id = 1                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ✅ Registro eliminado de activos                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ TABLA: inea/itea/no_listado (escritura)                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ UPDATE inea                                             │ │
│ │ SET resguardante = ''                                   │ │
│ │ WHERE id_inv = 'INV-001'                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ✅ Bien liberado para nuevo resguardo                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FIN: Baja completada                                        │
│ - Folio de baja generado: BAJA-2024-0045                   │
│ - Histórico guardado en resguardos_bajas                   │
│ - Registro eliminado de resguardos                         │
│ - Bien liberado en inventario                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Resumen de Cambios en Base de Datos

### Tabla `folios`
- ✅ **UPDATE**: Incrementa contador de bajas
- 📊 **Estado**: `contador` aumenta de 44 a 45

### Tabla `resguardos`
- ❌ **DELETE**: Elimina registro(s) del resguardo
- 📊 **Estado**: Registro(s) eliminado(s)

### Tabla `resguardos_bajas`
- ✅ **INSERT**: Copia datos del resguardo + folio de baja
- 📊 **Estado**: Nuevo registro con histórico

### Tabla `inea/itea/no_listado`
- ✅ **UPDATE**: Limpia campo `resguardante`
- 📊 **Estado**: `resguardante = ''` (bien liberado)

---

## Notas Importantes

1. **Atomicidad**: Las operaciones NO están en una transacción, pueden fallar parcialmente
2. **Histórico**: Los datos en `resguardos_bajas` son permanentes y no se eliminan
3. **Folio único**: Cada baja tiene un folio único e incremental
4. **Liberación**: El bien queda disponible para un nuevo resguardo
5. **Desnormalización**: `resguardos_bajas` guarda datos desnormalizados para histórico

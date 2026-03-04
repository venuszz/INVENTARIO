# Ejemplos de Uso: Historial de Cambios INEA

## Ejemplo 1: Cambio de Estatus

### Escenario
Usuario cambia el estatus de un bien de "ACTIVO" a "INACTIVO"

### Datos Detectados
```typescript
{
  field: "id_estatus",
  label: "Estatus",
  oldValue: "ACTIVO",
  newValue: "INACTIVO",
  fieldType: "relational"
}
```

### Vista en Modal
```
┌─────────────────────────────────────────────────┐
│ 📄 Confirmar Cambios                      ✕    │
│ 1 campo modificado                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ CAMBIOS REALIZADOS                              │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ ESTATUS                                     │ │
│ │                                             │ │
│ │ Valor Anterior    →    Valor Nuevo         │ │
│ │ ┌─────────────┐        ┌─────────────┐     │ │
│ │ │   ACTIVO    │   →    │  INACTIVO   │     │ │
│ │ └─────────────┘        └─────────────┘     │ │
│ │   (rojo)                 (verde)            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ⚠ MOTIVO DEL CAMBIO *                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ BIEN DAÑADO, REQUIERE REPARACIÓN           │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│ 38/500 caracteres                               │
│                                                 │
├─────────────────────────────────────────────────┤
│                        [Cancelar] [Confirmar]   │
└─────────────────────────────────────────────────┘
```

## Ejemplo 2: Actualización de Valor y Proveedor

### Escenario
Usuario actualiza el valor de $1,500.00 a $2,000.00 y cambia el proveedor

### Datos Detectados
```typescript
[
  {
    field: "valor",
    label: "Valor",
    oldValue: "$1,500.00 MXN",
    newValue: "$2,000.00 MXN",
    fieldType: "simple"
  },
  {
    field: "proveedor",
    label: "Proveedor",
    oldValue: "OFFICE DEPOT",
    newValue: "COSTCO",
    fieldType: "simple"
  }
]
```

### Vista en Modal
```
┌─────────────────────────────────────────────────┐
│ 📄 Confirmar Cambios                      ✕    │
│ 2 campos modificados                            │
├─────────────────────────────────────────────────┤
│                                                 │
│ CAMBIOS REALIZADOS                              │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ VALOR                                       │ │
│ │                                             │ │
│ │ Valor Anterior      →      Valor Nuevo     │ │
│ │ ┌──────────────┐          ┌──────────────┐ │ │
│ │ │$1,500.00 MXN │    →     │$2,000.00 MXN │ │ │
│ │ └──────────────┘          └──────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ PROVEEDOR                                   │ │
│ │                                             │ │
│ │ Valor Anterior      →      Valor Nuevo     │ │
│ │ ┌──────────────┐          ┌──────────────┐ │ │
│ │ │OFFICE DEPOT  │    →     │   COSTCO     │ │ │
│ │ └──────────────┘          └──────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ⚠ MOTIVO DEL CAMBIO *                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ ACTUALIZACIÓN DE PRECIO POR INFLACIÓN Y    │ │
│ │ CAMBIO DE PROVEEDOR POR MEJOR PRECIO       │ │
│ └─────────────────────────────────────────────┘ │
│ 78/500 caracteres                               │
│                                                 │
├─────────────────────────────────────────────────┤
│                        [Cancelar] [Confirmar]   │
└─────────────────────────────────────────────────┘
```

## Ejemplo 3: Cambio de Director y Área

### Escenario
Usuario reasigna un bien a otro director y área

### Datos Detectados
```typescript
[
  {
    field: "id_area",
    label: "Área",
    oldValue: "DIRECCIÓN DE ADMINISTRACIÓN",
    newValue: "DIRECCIÓN DE FINANZAS",
    fieldType: "relational"
  },
  {
    field: "id_directorio",
    label: "Director/Jefe de Área",
    oldValue: "JUAN PÉREZ GARCÍA",
    newValue: "MARÍA LÓPEZ HERNÁNDEZ",
    fieldType: "relational"
  }
]
```

### Vista en Modal
```
┌─────────────────────────────────────────────────┐
│ 📄 Confirmar Cambios                      ✕    │
│ 2 campos modificados                            │
├─────────────────────────────────────────────────┤
│                                                 │
│ CAMBIOS REALIZADOS                              │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ ÁREA                                        │ │
│ │                                             │ │
│ │ Valor Anterior           →  Valor Nuevo    │ │
│ │ ┌──────────────────┐     ┌───────────────┐ │ │
│ │ │DIRECCIÓN DE      │  →  │DIRECCIÓN DE   │ │ │
│ │ │ADMINISTRACIÓN    │     │FINANZAS       │ │ │
│ │ └──────────────────┘     └───────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ DIRECTOR/JEFE DE ÁREA                       │ │
│ │                                             │ │
│ │ Valor Anterior           →  Valor Nuevo    │ │
│ │ ┌──────────────────┐     ┌───────────────┐ │ │
│ │ │JUAN PÉREZ        │  →  │MARÍA LÓPEZ    │ │ │
│ │ │GARCÍA            │     │HERNÁNDEZ      │ │ │
│ │ └──────────────────┘     └───────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ⚠ MOTIVO DEL CAMBIO *                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ REESTRUCTURACIÓN ORGANIZACIONAL, EL BIEN   │ │
│ │ AHORA PERTENECE A FINANZAS                 │ │
│ └─────────────────────────────────────────────┘ │
│ 72/500 caracteres                               │
│                                                 │
├─────────────────────────────────────────────────┤
│                        [Cancelar] [Confirmar]   │
└─────────────────────────────────────────────────┘
```

## Ejemplo 4: Sin Cambios

### Escenario
Usuario entra a modo edición pero no modifica nada y presiona "Guardar"

### Resultado
```
┌─────────────────────────────────────────────────┐
│ ℹ️ No hay cambios para guardar                  │
└─────────────────────────────────────────────────┘
```

No se muestra el modal, solo un mensaje informativo.

## Ejemplo 5: Cambio de Fecha de Adquisición

### Escenario
Usuario corrige la fecha de adquisición

### Datos Detectados
```typescript
{
  field: "f_adq",
  label: "Fecha de Adquisición",
  oldValue: "15 de enero de 2023",
  newValue: "20 de febrero de 2023",
  fieldType: "simple"
}
```

### Vista en Modal
```
┌─────────────────────────────────────────────────┐
│ 📄 Confirmar Cambios                      ✕    │
│ 1 campo modificado                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ CAMBIOS REALIZADOS                              │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ FECHA DE ADQUISICIÓN                        │ │
│ │                                             │ │
│ │ Valor Anterior        →    Valor Nuevo     │ │
│ │ ┌─────────────────┐      ┌────────────────┐│ │
│ │ │15 de enero de   │  →   │20 de febrero de││ │
│ │ │2023             │      │2023            ││ │
│ │ └─────────────────┘      └────────────────┘│ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ⚠ MOTIVO DEL CAMBIO *                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ CORRECCIÓN DE FECHA SEGÚN FACTURA ORIGINAL │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│ 46/500 caracteres                               │
│                                                 │
├─────────────────────────────────────────────────┤
│                        [Cancelar] [Confirmar]   │
└─────────────────────────────────────────────────┘
```

## Ejemplo 6: Cambio de Imagen

### Escenario
Usuario sube una nueva imagen del bien

### Datos Detectados
```typescript
{
  field: "image_path",
  label: "Imagen",
  oldValue: "Sin imagen",
  newValue: "Imagen actualizada",
  fieldType: "image"
}
```

### Vista en Modal
```
┌─────────────────────────────────────────────────┐
│ 📄 Confirmar Cambios                      ✕    │
│ 1 campo modificado                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ CAMBIOS REALIZADOS                              │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ IMAGEN                                      │ │
│ │                                             │ │
│ │ Valor Anterior      →      Valor Nuevo     │ │
│ │ ┌──────────────┐          ┌──────────────┐ │ │
│ │ │ Sin imagen   │    →     │   Imagen     │ │ │
│ │ │              │          │ actualizada  │ │ │
│ │ └──────────────┘          └──────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ⚠ MOTIVO DEL CAMBIO *                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ AGREGAR FOTOGRAFÍA DEL BIEN PARA REGISTRO  │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│ 44/500 caracteres                               │
│                                                 │
├─────────────────────────────────────────────────┤
│                        [Cancelar] [Confirmar]   │
└─────────────────────────────────────────────────┘
```

## Ejemplo 7: Múltiples Cambios (Actualización Completa)

### Escenario
Usuario actualiza varios campos a la vez

### Datos Detectados
```typescript
[
  {
    field: "descripcion",
    label: "Descripción",
    oldValue: "ESCRITORIO DE MADERA",
    newValue: "ESCRITORIO EJECUTIVO DE MADERA CON CAJONES",
    fieldType: "simple"
  },
  {
    field: "estado",
    label: "Estado",
    oldValue: "BUENO",
    newValue: "REGULAR",
    fieldType: "simple"
  },
  {
    field: "valor",
    label: "Valor",
    oldValue: "$3,500.00 MXN",
    newValue: "$2,800.00 MXN",
    fieldType: "simple"
  },
  {
    field: "ubicacion_mu",
    label: "Municipio",
    oldValue: "TLAXCALA",
    newValue: "APIZACO",
    fieldType: "simple"
  }
]
```

### Vista en Modal (Scrolleable)
```
┌─────────────────────────────────────────────────┐
│ 📄 Confirmar Cambios                      ✕    │
│ 4 campos modificados                            │
├─────────────────────────────────────────────────┤
│ ▲                                               │
│ CAMBIOS REALIZADOS                              │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ DESCRIPCIÓN                                 │ │
│ │ Valor Anterior        →    Valor Nuevo     │ │
│ │ ESCRITORIO DE MADERA → ESCRITORIO EJECUT...│ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ ESTADO                                      │ │
│ │ Valor Anterior        →    Valor Nuevo     │ │
│ │ BUENO                 →    REGULAR         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ VALOR                                       │ │
│ │ Valor Anterior        →    Valor Nuevo     │ │
│ │ $3,500.00 MXN         →    $2,800.00 MXN   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ MUNICIPIO                                   │ │
│ │ Valor Anterior        →    Valor Nuevo     │ │
│ │ TLAXCALA              →    APIZACO         │ │
│ └─────────────────────────────────────────────┘ │
│ ▼                                               │
├─────────────────────────────────────────────────┤
│ ⚠ MOTIVO DEL CAMBIO *                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ ACTUALIZACIÓN GENERAL DEL INVENTARIO,      │ │
│ │ CORRECCIÓN DE DESCRIPCIÓN Y DEPRECIACIÓN   │ │
│ │ DEL VALOR POR USO. BIEN REUBICADO A       │ │
│ │ OFICINAS DE APIZACO                        │ │
│ └─────────────────────────────────────────────┘ │
│ 142/500 caracteres                              │
│                                                 │
├─────────────────────────────────────────────────┤
│                        [Cancelar] [Confirmar]   │
└─────────────────────────────────────────────────┘
```

## Datos Guardados en Console (Ejemplo)

Cuando se confirman los cambios, se registra en consola:

```javascript
📝 [Change History] Cambios registrados: {
  mueble_id: "INV-2024-001234",
  changes: [
    {
      field: "id_estatus",
      label: "Estatus",
      oldValue: "ACTIVO",
      newValue: "INACTIVO",
      fieldType: "relational"
    }
  ],
  reason: "BIEN DAÑADO, REQUIERE REPARACIÓN",
  changed_by: "JUAN PÉREZ GARCÍA",
  changed_at: "2026-03-03T15:30:45.123Z"
}
```

## Validaciones Implementadas

### 1. Sin Cambios
```
Usuario presiona "Guardar" sin modificar nada
→ Mensaje: "No hay cambios para guardar"
→ No se muestra modal
```

### 2. Motivo Vacío
```
Usuario intenta confirmar sin escribir motivo
→ Botón "Confirmar" deshabilitado
→ Tooltip: "Debe proporcionar un motivo del cambio"
```

### 3. Límite de Caracteres
```
Usuario escribe más de 500 caracteres
→ Textarea limita a 500 caracteres
→ Contador muestra: "500/500 caracteres"
```

### 4. Durante Guardado
```
Mientras se guarda:
→ Botón "Confirmar" muestra spinner
→ Texto cambia a "Guardando..."
→ Botón "Cancelar" deshabilitado
→ Textarea deshabilitado
```

## Casos Especiales

### Valor Nulo → Valor
```
oldValue: "No especificado"
newValue: "NUEVO VALOR"
```

### Valor → Valor Nulo
```
oldValue: "VALOR ANTERIOR"
newValue: "No especificado"
```

### Campo Relacional sin JOIN
```
Si no se carga el JOIN:
oldValue: "123" (ID)
newValue: "456" (ID)
```

### Imagen Existente → Nueva Imagen
```
oldValue: "Imagen actualizada"
newValue: "Imagen actualizada"
(Ambos muestran el mismo texto, pero la ruta cambió)
```

## Notas de UX

1. **Animaciones**: Entrada/salida suave del modal (200ms)
2. **Colores**: Rojo para valores anteriores, verde para nuevos
3. **Scroll**: Lista de cambios scrolleable si hay muchos
4. **Responsive**: Modal se adapta a pantallas pequeñas
5. **Accesibilidad**: Campos con labels apropiados
6. **Feedback**: Mensajes claros de éxito/error
7. **Prevención**: Validaciones antes de permitir guardado

# Sistema de Historial de Cambios - INEA

## 🎯 Descripción

Sistema que detecta automáticamente cambios en bienes INEA y solicita un motivo antes de guardar. Preparado para integración futura con base de datos.

## 📁 Estructura de Archivos

```
src/components/consultas/inea/
├── utils/
│   └── changeDetection.ts          # Lógica de detección y formateo
├── hooks/
│   ├── useItemEdit.ts              # Hook principal (modificado)
│   └── useChangeDetection.ts       # Hook de detección (opcional)
├── modals/
│   └── ChangeConfirmationModal.tsx # Modal de confirmación
└── types.ts                        # Tipos (actualizado)
```

## 🚀 Uso Rápido

### 1. El usuario edita un bien
```typescript
// En DetailPanel, el usuario modifica campos
editFormData.estatus = "INACTIVO";
editFormData.valor = 2000;
```

### 2. Click en "Guardar"
```typescript
// Se ejecuta automáticamente
saveChanges() → detecta cambios → muestra modal
```

### 3. Usuario confirma con motivo
```typescript
// Usuario ingresa motivo y confirma
confirmAndSaveChanges(user) → guarda cambios + registra historial
```

## 🔧 Funciones Principales

### `detectChanges(original, edited)`
Detecta diferencias entre dos objetos Mueble.

```typescript
const changes = detectChanges(selectedItem, editFormData);
// Retorna: Change[]
```

### `formatFieldValue(field, value, item)`
Formatea valores para visualización.

```typescript
formatFieldValue('valor', 1500, item);
// Retorna: "$1,500.00 MXN"

formatFieldValue('f_adq', '2024-03-15', item);
// Retorna: "15 de marzo de 2024"
```

### `prepareChangeHistoryForDB(muebleId, changes, reason, changedBy)`
Prepara datos para guardar en BD.

```typescript
const history = prepareChangeHistoryForDB(
  'INV-001',
  changes,
  'MOTIVO DEL CAMBIO',
  'JUAN PÉREZ'
);
// Retorna: ChangeHistory
```

## 📊 Tipos de Datos

### Change
```typescript
interface Change {
  field: string;              // 'id_inv', 'rubro', etc.
  label: string;              // 'ID Inventario', 'Rubro', etc.
  oldValue: string | null;    // Valor anterior formateado
  newValue: string | null;    // Valor nuevo formateado
  fieldType: 'simple' | 'relational' | 'image';
}
```

### ChangeHistory
```typescript
interface ChangeHistory {
  id?: string;                // UUID (BD)
  mueble_id: string;          // ID del bien
  changes: Change[];          // Array de cambios
  reason: string;             // Motivo del cambio
  changed_by: string;         // Usuario
  changed_at?: string;        // Timestamp
}
```

## 🎨 Componentes

### ChangeConfirmationModal
Modal que muestra los cambios y solicita motivo.

```typescript
<ChangeConfirmationModal
  show={showChangeConfirmModal}
  changes={pendingChanges}
  changeReason={changeReason}
  onReasonChange={setChangeReason}
  onConfirm={() => confirmAndSaveChanges(user)}
  onCancel={() => {
    setShowChangeConfirmModal(false);
    setChangeReason('');
    setPendingChanges([]);
  }}
  isDarkMode={isDarkMode}
  isSaving={isSaving}
/>
```

## 🔌 Integración con BD (Futuro)

### Paso 1: Crear tabla
```sql
CREATE TABLE change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mueble_id TEXT NOT NULL REFERENCES muebles(id),
  changes JSONB NOT NULL,
  reason TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Paso 2: Activar guardado
En `useItemEdit.ts` línea ~180:
```typescript
// Descomentar esta línea:
await saveChangeHistoryToDB(changeHistory);
```

### Paso 3: Implementar función
En `changeDetection.ts`:
```typescript
export const saveChangeHistoryToDB = async (history: ChangeHistory) => {
  const response = await fetch('/api/change-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(history)
  });
  
  if (!response.ok) throw new Error('Error al guardar');
  return { success: true };
};
```

## 📝 Campos Detectados

### Simples (11)
- `id_inv` - ID Inventario
- `rubro` - Rubro
- `descripcion` - Descripción
- `estado` - Estado
- `valor` - Valor
- `f_adq` - Fecha de Adquisición
- `formadq` - Forma de Adquisición
- `proveedor` - Proveedor
- `factura` - Factura
- `ubicacion_es` - Estado (Ubicación)
- `ubicacion_mu` - Municipio
- `ubicacion_no` - Nomenclatura

### Relacionales (3)
- `id_estatus` - Estatus
- `id_area` - Área
- `id_directorio` - Director

### Especiales (1)
- `image_path` - Imagen

## ✅ Validaciones

- ✅ No permite guardar sin cambios
- ✅ Motivo obligatorio (campo requerido)
- ✅ Límite de 500 caracteres en motivo
- ✅ Conversión automática a mayúsculas
- ✅ Botones deshabilitados durante guardado
- ✅ Validación de campos relacionales

## 🐛 Debugging

### Ver cambios detectados
```typescript
console.log('Cambios detectados:', changes);
```

### Ver historial preparado
```typescript
console.log('Historial preparado:', changeHistory);
```

### Verificar en consola del navegador
```
📝 [Change History] Cambios registrados: {...}
```

## 📚 Documentación Completa

- `docs/INEA_CHANGE_HISTORY_IMPLEMENTATION.md` - Guía completa
- `docs/INEA_CHANGE_HISTORY_UI_SUMMARY.md` - Resumen de implementación
- `docs/INEA_CHANGE_HISTORY_EXAMPLES.md` - Ejemplos visuales

## 🔄 Replicar en Otros Módulos

Para adaptar a ITEA, No Listado, etc:

1. Copiar archivos de `utils/` y `modals/`
2. Modificar `useItemEdit` del módulo objetivo
3. Agregar modal al componente principal
4. Ajustar tipos si es necesario
5. Probar flujo completo

## ⚠️ Notas Importantes

- **NO guarda en BD actualmente** (solo console.log)
- Los cambios en el bien SÍ se guardan normalmente
- El motivo es obligatorio
- Preparado para auditoría
- Type-safe con TypeScript

## 👤 Soporte

Para dudas o problemas, revisar:
1. Console del navegador (errores)
2. Documentación completa en `/docs`
3. Ejemplos de uso en este README

---

Implementado el 3 de marzo de 2026

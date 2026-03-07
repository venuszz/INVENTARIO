# Rediseño: Transferencia de Origen - Solo en Levantamiento

**Fecha:** 2026-03-05  
**Cambio:** Mover funcionalidad de transferencia solo a tabla de Levantamiento

## Cambios Requeridos

### 1. Remover OrigenBadge de 5 Tablas

**Tablas a modificar:**
1. `src/components/consultas/inea/components/InventoryTable.tsx`
2. `src/components/consultas/itea/components/InventoryTable.tsx`
3. `src/components/consultas/no-listado/components/InventoryTable.tsx`
4. `src/components/consultas/inea/obsoletos/components/InventoryTable.tsx`
5. `src/components/consultas/itea/obsoletos/components/InventoryTable.tsx`

**Cambios por tabla:**
- Remover import de `OrigenBadge`
- Remover columna header "Origen"
- Remover celda con `<OrigenBadge>`
- Revertir colSpan a valores originales
- Remover prop `onRefetch` si no se usa para otra cosa

### 2. Adaptar OrigenBadge para Levantamiento

**Archivo:** `src/components/consultas/levantamiento/components/InventoryTable.tsx`

**Diseño actual en Levantamiento:**
```tsx
<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
  origenColors[item.origen]
}`}>
  {item.origen}
</span>
```

**Nuevo diseño con transferencia:**
- Mantener el badge visual existente
- Agregar funcionalidad de dropdown al hacer clic
- Solo para usuarios admin
- Deshabilitar si tiene resguardo activo

### 3. Actualizar OrigenBadge Component

**Cambios necesarios:**
- Adaptar estilos para coincidir con diseño de Levantamiento
- Usar colores de `getOrigenColors()` de Levantamiento
- Mantener funcionalidad de dropdown y modal
- Agregar soporte para "ITEJPA" (ITEA en Levantamiento)

## Implementación

### Paso 1: Remover de Tablas (Revertir Fase 3)

Revertir cambios en las 5 tablas a su estado original antes de la integración.

### Paso 2: Adaptar OrigenBadge

Modificar `OrigenBadge` para usar el diseño de Levantamiento:
- Colores consistentes
- Tamaño y padding igual
- Agregar indicador de color para ITEJPA

### Paso 3: Integrar en Levantamiento

Reemplazar el badge estático en Levantamiento con el `OrigenBadge` interactivo.

## Resultado Final

- ✅ Funcionalidad de transferencia solo en Levantamiento
- ✅ Diseño consistente con tabla existente
- ✅ Backend y modal sin cambios
- ✅ Documentación actualizada

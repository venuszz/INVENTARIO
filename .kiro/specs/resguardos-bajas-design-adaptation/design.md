# Resguardos Bajas - Diseño de Adaptación Visual

## 1. Visión General del Diseño

Este documento detalla los cambios visuales específicos que se aplicarán al módulo de Consulta de Resguardos Dados de Baja para alinearlo con el diseño moderno de los módulos `crear` y `consultar`. Todos los cambios son puramente visuales - no se modifica ninguna lógica funcional.

## 2. Principios de Diseño

### 2.1 Consistencia Visual
- Usar el mismo sistema de colores entre módulos
- Aplicar bordes y sombras consistentes
- Mantener espaciado y tipografía uniforme
- Transiciones suaves entre estados

### 2.2 Modo Claro/Oscuro
- Fondos: `bg-black` / `bg-white`
- Texto: `text-white` / `text-black`
- Bordes sutiles: `border-white/10` / `border-black/10`
- Fondos semi-transparentes: `bg-white/[0.02]` / `bg-black/[0.02]`

### 2.3 Layout Moderno
- Altura fija con scroll interno
- Scrollbars personalizados
- Grid responsive (lg:grid-cols-5)
- Espaciado consistente con gap-6

## 3. Componente Principal (index.tsx)

### 3.1 Estructura de Layout

**ANTES:**
```tsx
<div className="min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 ...">
  <div className="w-full mx-auto rounded-lg sm:rounded-xl shadow-2xl ...">
```

**DESPUÉS:**
```tsx
<div className="h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ...">
  <div className="h-full overflow-y-auto p-4 md:p-8 scrollbar-thin ...">
    <div className="w-full max-w-7xl mx-auto pb-8">
```

### 3.2 Loading Overlay

**MANTENER** pero simplificar:
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
  <div className="p-6 rounded-lg shadow-xl bg-gray-900/bg-white">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
    <p className="mt-4">Cargando folio...</p>
  </div>
</div>
```

### 3.3 Grid Layout

**MANTENER** estructura pero ajustar clases:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
  <div className="lg:col-span-3 space-y-6">
    {/* Left panel */}
  </div>
  <div className="lg:col-span-2 space-y-6">
    {/* Right panel */}
  </div>
</div>
```

### 3.4 Scrollbar Personalizado

**AGREGAR** al final del componente:
```tsx
<style jsx>{`
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
    border-radius: 3px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    border-radius: 3px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
  }
`}</style>
```


## 4. Header Component

### 4.1 Diseño Actual vs Nuevo

**ANTES:**
```tsx
<div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-2 sm:gap-0
  bg-gray-900/30 border-gray-800 / bg-gray-50/50 border-gray-200">
```

**DESPUÉS (simplificado):**
```tsx
<div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-4
  bg-white/[0.02] border-white/10 / bg-black/[0.02] border-black/10">
```

### 4.2 Badge "BAJ"

**MANTENER** pero simplificar estilos:
```tsx
<span className="mr-3 p-2 rounded-lg border text-base shadow-sm
  bg-red-600 text-white border-red-600/50">
  BAJ
</span>
```

### 4.3 Contador

**SIMPLIFICAR** diseño:
```tsx
<div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border
  text-gray-400 bg-white/[0.02] border-white/10 / text-gray-600 bg-black/[0.02] border-black/10">
  <ListChecks className="h-4 w-4 text-red-400/text-red-600" />
  <span>{totalCount} resguardos dados de baja</span>
</div>
```

## 5. SearchAndFilters Component

### 5.1 Contenedor Principal

**ACTUALIZAR** a diseño moderno:
```tsx
<div className="rounded-lg border p-4 space-y-4
  bg-white/[0.02] border-white/10 / bg-black/[0.02] border-black/10">
```

### 5.2 Input de Búsqueda

**APLICAR** estilo consistente:
```tsx
<input
  className="w-full px-4 py-2 rounded-lg border text-sm transition-colors
    bg-white/[0.02] border-white/10 text-white placeholder-white/40 focus:border-white/30 focus:ring-1 focus:ring-white/20
    / bg-black/[0.02] border-black/10 text-black placeholder-black/40 focus:border-black/30 focus:ring-1 focus:ring-black/20"
/>
```

### 5.3 Filtros de Fecha, Director, Resguardante

**MANTENER** funcionalidad, actualizar estilos:
```tsx
<input
  type="date"
  className="px-3 py-2 rounded-lg border text-sm transition-colors
    bg-white/[0.02] border-white/10 text-white focus:border-white/30
    / bg-black/[0.02] border-black/10 text-black focus:border-black/30"
/>
```

### 5.4 Botones de Acción

**SIMPLIFICAR** diseño:
```tsx
<button className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors
  border-white/10 hover:bg-white/5 text-white
  / border-black/10 hover:bg-black/5 text-black">
  Limpiar
</button>
```

## 6. BajasTable Component

### 6.1 Contenedor de Tabla

**ACTUALIZAR:**
```tsx
<div className="rounded-lg border overflow-hidden
  bg-white/[0.02] border-white/10 / bg-black/[0.02] border-black/10">
```

### 6.2 Encabezados de Tabla

**SIMPLIFICAR:**
```tsx
<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer
  text-white/60 hover:text-white / text-black/60 hover:text-black">
```

### 6.3 Filas de Tabla

**APLICAR** hover sutil:
```tsx
<tr className="border-t transition-colors cursor-pointer
  border-white/10 hover:bg-white/[0.02] / border-black/10 hover:bg-black/[0.02]">
```

### 6.4 Fila Seleccionada

**DESTACAR** con color sutil:
```tsx
<tr className="border-t transition-colors cursor-pointer
  border-white/10 bg-blue-500/10 / border-black/10 bg-blue-500/10">
```

### 6.5 Estados de Carga y Error

**MANTENER** lógica, actualizar estilos:
```tsx
<div className="flex flex-col items-center justify-center py-12 text-white/60 / text-black/60">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/20 / border-black/20"></div>
  <p className="mt-4 text-sm">Cargando...</p>
</div>
```


## 7. Pagination Component

### 7.1 Contenedor

**SIMPLIFICAR:**
```tsx
<div className="flex items-center justify-between p-4 rounded-lg border
  bg-white/[0.02] border-white/10 / bg-black/[0.02] border-black/10">
```

### 7.2 Selector de Filas

**ACTUALIZAR:**
```tsx
<select className="border rounded-lg text-sm py-2 px-3 transition-colors
  bg-white/[0.02] border-white/10 text-white focus:border-white/30
  / bg-black/[0.02] border-black/10 text-black focus:border-black/30">
```

### 7.3 Botones de Navegación

**SIMPLIFICAR:**
```tsx
<button className="p-2 rounded-lg border transition-colors
  border-white/10 hover:bg-white/5 text-white
  / border-black/10 hover:bg-black/5 text-black
  disabled:opacity-30 disabled:cursor-not-allowed">
  <ChevronLeft className="h-5 w-5" />
</button>
```

## 8. BajaDetailsPanel Component

### 8.1 Contenedor Principal

**ACTUALIZAR:**
```tsx
<div className="rounded-lg border p-4 space-y-4
  bg-white/[0.02] border-white/10 / bg-black/[0.02] border-black/10">
```

### 8.2 Información del Folio

**MANTENER** estructura, actualizar estilos:
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <span className="text-sm text-white/60 / text-black/60">Folio:</span>
    <span className="text-sm font-medium">{folio}</span>
  </div>
</div>
```

### 8.3 Botones de Acción

**APLICAR** estilos consistentes:
```tsx
<button className="w-full px-4 py-2 rounded-lg border text-sm font-medium transition-colors
  border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20
  / border-blue-500/50 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
  Generar PDF
</button>

<button className="w-full px-4 py-2 rounded-lg border text-sm font-medium transition-colors
  border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20
  / border-red-500/50 bg-red-500/10 text-red-600 hover:bg-red-500/20">
  Eliminar Folio
</button>
```

### 8.4 Estado Vacío

**SIMPLIFICAR:**
```tsx
<div className="rounded-lg border p-8 flex flex-col items-center justify-center
  bg-white/[0.02] border-white/10 / bg-black/[0.02] border-black/10">
  <p className="text-sm text-white/60 / text-black/60">Seleccione un folio para ver detalles</p>
</div>
```

## 9. ArticulosListPanel Component

### 9.1 Contenedor de Grupos

**ACTUALIZAR:**
```tsx
<div className="space-y-4">
  {Object.entries(groupedItems).map(([folioBaja, items]) => (
    <div key={folioBaja} className="rounded-lg border overflow-hidden
      bg-white/[0.02] border-white/10 / bg-black/[0.02] border-black/10">
```

### 9.2 Header de Grupo

**SIMPLIFICAR:**
```tsx
<div className="p-3 border-b flex items-center justify-between
  border-white/10 bg-white/[0.01] / border-black/10 bg-black/[0.01]">
  <div className="flex items-center gap-2">
    <input type="checkbox" className="rounded" />
    <span className="text-sm font-medium">Folio Baja: {folioBaja}</span>
  </div>
</div>
```

### 9.3 Items de Artículos

**APLICAR** hover sutil:
```tsx
<div className="p-3 border-t flex items-center justify-between transition-colors
  border-white/10 hover:bg-white/[0.02] / border-black/10 hover:bg-black/[0.02]">
```

### 9.4 Botones de Acción en Items

**SIMPLIFICAR:**
```tsx
<button className="p-1.5 rounded-lg border transition-colors
  border-red-500/30 text-red-400 hover:bg-red-500/10
  / border-red-500/30 text-red-600 hover:bg-red-500/10">
  <Trash2 className="h-4 w-4" />
</button>
```

### 9.5 Controles de Selección

**MANTENER** funcionalidad, actualizar estilos:
```tsx
<div className="p-3 border-t flex items-center justify-between
  border-white/10 bg-white/[0.01] / border-black/10 bg-black/[0.01]">
  <button className="text-sm text-white/60 hover:text-white / text-black/60 hover:text-black">
    Limpiar selección
  </button>
  <button className="px-3 py-1.5 rounded-lg border text-sm transition-colors
    border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20
    / border-red-500/50 bg-red-500/10 text-red-600 hover:bg-red-500/20">
    Eliminar seleccionados
  </button>
</div>
```


## 10. Modales

### 10.1 PDFDownloadModal

**ESTRUCTURA:**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm
  bg-black/80 / bg-black/50">
  <div className="rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl
    bg-black/95 border-white/10 / bg-white/95 border-black/10">
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-medium">Descargar PDF</h3>
      
      <div className="rounded-lg border p-3
        bg-white/[0.02] border-white/10 / bg-black/[0.02] border-black/10">
        <p className="text-sm text-white/80 / text-black/80">
          Folio: {pdfData?.folio_baja}
        </p>
      </div>
      
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
          border-white/10 hover:bg-white/5 text-white
          / border-black/10 hover:bg-black/5 text-black">
          Cancelar
        </button>
        <button className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
          bg-blue-600 hover:bg-blue-500 text-white">
          Descargar
        </button>
      </div>
    </div>
  </div>
</div>
```

### 10.2 DeleteModal

**ESTRUCTURA:**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm
  bg-black/80 / bg-black/50">
  <div className="rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl
    bg-black/95 border-white/10 / bg-white/95 border-black/10">
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400 / text-red-600" />
        </div>
        <h3 className="text-lg font-medium">Confirmar Eliminación</h3>
      </div>
      
      <p className="text-sm text-white/80 / text-black/80">
        {deleteMessage}
      </p>
      
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
          border-white/10 hover:bg-white/5 text-white
          / border-black/10 hover:bg-black/5 text-black">
          Cancelar
        </button>
        <button className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
          bg-red-600 hover:bg-red-500 text-white">
          Eliminar
        </button>
      </div>
    </div>
  </div>
</div>
```

### 10.3 ErrorAlert

**ESTRUCTURA (Toast en esquina inferior):**
```tsx
<div className="fixed bottom-4 right-4 w-96 px-4 py-3 rounded-lg shadow-lg border z-50 backdrop-blur-sm animate-fade-in
  bg-red-900/80 text-red-100 border-red-800 / bg-red-50 text-red-900 border-red-200">
  <div className="flex items-center">
    <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 animate-pulse
      text-red-400 / text-red-600" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{error}</p>
    </div>
    <button className="ml-4 flex-shrink-0 p-1 rounded-full transition-colors
      text-red-200 hover:text-white hover:bg-red-800
      / text-red-600 hover:text-red-800 hover:bg-red-100">
      <X className="h-4 w-4" />
    </button>
  </div>
</div>
```

## 11. Animaciones y Transiciones

### 11.1 Transiciones de Color

**APLICAR** a todos los elementos interactivos:
```tsx
transition-colors duration-200
```

### 11.2 Fade In para Modales

**AGREGAR** animación CSS:
```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
```

### 11.3 Hover Effects

**APLICAR** consistentemente:
- Botones: `hover:bg-white/5` / `hover:bg-black/5`
- Filas de tabla: `hover:bg-white/[0.02]` / `hover:bg-black/[0.02]`
- Links: `hover:text-white` / `hover:text-black`

## 12. Responsive Design

### 12.1 Breakpoints

**MANTENER** estructura responsive:
- Mobile: `col-span-1`
- Desktop: `lg:col-span-3` y `lg:col-span-2`

### 12.2 Padding Adaptativo

**APLICAR:**
- Mobile: `p-4`
- Desktop: `md:p-8`

### 12.3 Grid Gaps

**USAR:**
- `gap-4` para mobile
- `gap-6` para desktop


## 13. Sistema de Colores

### 13.1 Paleta Base

**Modo Oscuro:**
- Fondo principal: `bg-black`
- Texto principal: `text-white`
- Texto secundario: `text-white/60`
- Bordes: `border-white/10`
- Fondos de panel: `bg-white/[0.02]`
- Hover: `hover:bg-white/5`

**Modo Claro:**
- Fondo principal: `bg-white`
- Texto principal: `text-black`
- Texto secundario: `text-black/60`
- Bordes: `border-black/10`
- Fondos de panel: `bg-black/[0.02]`
- Hover: `hover:bg-black/5`

### 13.2 Colores de Acción

**Azul (Acciones primarias):**
- Modo oscuro: `text-blue-400`, `border-blue-500/50`, `bg-blue-500/10`
- Modo claro: `text-blue-600`, `border-blue-500/50`, `bg-blue-500/10`

**Rojo (Acciones destructivas):**
- Modo oscuro: `text-red-400`, `border-red-500/50`, `bg-red-500/10`
- Modo claro: `text-red-600`, `border-red-500/50`, `bg-red-500/10`

**Verde (Éxito):**
- Modo oscuro: `text-green-400`, `border-green-500/50`, `bg-green-500/10`
- Modo claro: `text-green-600`, `border-green-500/50`, `bg-green-500/10`

### 13.3 Badge "BAJ"

**Color específico:**
- Fondo: `bg-red-600`
- Texto: `text-white`
- Borde: `border-red-600/50`

## 14. Tipografía

### 14.1 Tamaños de Fuente

**Aplicar consistentemente:**
- Títulos principales: `text-2xl md:text-3xl`
- Subtítulos: `text-lg`
- Texto normal: `text-sm`
- Texto pequeño: `text-xs`

### 14.2 Pesos de Fuente

**Usar:**
- Títulos: `font-bold`
- Subtítulos: `font-medium`
- Texto normal: `font-normal`

### 14.3 Tracking

**Para encabezados de tabla:**
```tsx
uppercase tracking-wider
```

## 15. Espaciado

### 15.1 Padding

**Contenedores:**
- Pequeño: `p-3`
- Medio: `p-4`
- Grande: `p-6`

**Botones:**
- Pequeño: `px-3 py-1.5`
- Medio: `px-4 py-2`

### 15.2 Gaps

**Entre elementos:**
- Pequeño: `gap-2`
- Medio: `gap-4`
- Grande: `gap-6`

### 15.3 Espacios (space-y)

**Stacks verticales:**
- Pequeño: `space-y-2`
- Medio: `space-y-4`
- Grande: `space-y-6`

## 16. Bordes y Sombras

### 16.1 Border Radius

**Aplicar:**
- Pequeño: `rounded-lg` (8px)
- Completo: `rounded-full`

### 16.2 Bordes

**Grosor:**
- Estándar: `border` (1px)

**Colores:**
- Modo oscuro: `border-white/10`
- Modo claro: `border-black/10`

### 16.3 Sombras

**ELIMINAR** sombras pesadas como `shadow-2xl`

**USAR** sombras sutiles solo en modales:
```tsx
shadow-lg
```

## 17. Estados Interactivos

### 17.1 Focus

**Inputs y selects:**
```tsx
focus:border-white/30 focus:ring-1 focus:ring-white/20
/ focus:border-black/30 focus:ring-1 focus:ring-black/20
```

### 17.2 Disabled

**Botones deshabilitados:**
```tsx
disabled:opacity-30 disabled:cursor-not-allowed
```

### 17.3 Loading

**Spinners:**
```tsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2
  border-white/20 / border-black/20"></div>
```

## 18. Iconos

### 18.1 Tamaños

**Aplicar consistentemente:**
- Pequeño: `h-4 w-4`
- Medio: `h-5 w-5`
- Grande: `h-6 w-6`

### 18.2 Colores

**Seguir el color del texto padre o usar:**
- Modo oscuro: `text-white/60`
- Modo claro: `text-black/60`

## 19. Checklist de Implementación

### 19.1 Archivos a Modificar

- [ ] `index.tsx` - Layout principal y scrollbar
- [ ] `components/Header.tsx` - Simplificar diseño
- [ ] `components/SearchAndFilters.tsx` - Actualizar inputs y botones
- [ ] `components/BajasTable.tsx` - Simplificar tabla
- [ ] `components/Pagination.tsx` - Actualizar controles
- [ ] `components/BajaDetailsPanel.tsx` - Actualizar paneles
- [ ] `components/ArticulosListPanel.tsx` - Actualizar lista
- [ ] `modals/PDFDownloadModal.tsx` - Aplicar backdrop blur
- [ ] `modals/DeleteModal.tsx` - Aplicar backdrop blur
- [ ] `modals/ErrorAlert.tsx` - Simplificar toast

### 19.2 Verificaciones

- [ ] Modo claro funciona correctamente
- [ ] Modo oscuro funciona correctamente
- [ ] Transiciones son suaves
- [ ] Scrollbars personalizados funcionan
- [ ] Responsive design funciona en mobile
- [ ] Todos los botones tienen hover effects
- [ ] Todos los inputs tienen focus states
- [ ] Modales tienen backdrop blur
- [ ] No hay errores de TypeScript
- [ ] No hay warnings en consola

### 19.3 Testing Funcional

- [ ] Búsqueda funciona
- [ ] Filtros funcionan
- [ ] Paginación funciona
- [ ] Selección de folio funciona
- [ ] Selección de items funciona
- [ ] Generación de PDF funciona
- [ ] Eliminación de folio funciona
- [ ] Eliminación de items funciona
- [ ] Modales se abren y cierran correctamente

## 20. Notas Importantes

### 20.1 NO Modificar

- Hooks existentes
- Lógica de negocio
- Tipos TypeScript
- Props de componentes
- Event handlers
- Flujo de datos

### 20.2 SOLO Modificar

- Clases de Tailwind CSS
- Estructura JSX (solo para layout)
- Estilos inline (solo scrollbars)
- Orden visual de elementos

### 20.3 Principio Guía

**"Si no es visual, no lo toques"**

Cada cambio debe ser puramente cosmético. Si un cambio afecta la funcionalidad, no debe hacerse.

# Resguardos Bajas - Adaptación de Diseño

## 1. Visión General

Actualizar el diseño visual del módulo de Consulta de Resguardos Dados de Baja (`consultarBajas`) para que siga el mismo patrón de diseño moderno y consistente utilizado en los módulos `crear` y `consultar`, sin modificar absolutamente nada de la lógica funcional existente.

## 2. Objetivos

- Aplicar el patrón de diseño moderno de `crear` y `consultar` a `consultarBajas`
- Mantener toda la lógica funcional intacta (hooks, state management, data flow)
- Mejorar la consistencia visual entre los módulos de resguardos
- Actualizar el layout para usar el patrón de scroll interno
- Modernizar los estilos de componentes y modales

## 3. Historias de Usuario

### 3.1 Como usuario, quiero que la interfaz de consulta de bajas tenga el mismo diseño moderno que los otros módulos de resguardos

**Criterios de Aceptación:**
- El layout principal usa el patrón de altura fija con scroll interno
- Los colores, bordes y sombras siguen el mismo sistema de diseño
- Los componentes tienen la misma apariencia visual que `crear` y `consultar`
- La transición entre modo claro y oscuro es consistente

### 3.2 Como usuario, quiero que todos los componentes visuales sigan el mismo patrón de diseño

**Criterios de Aceptación:**
- Header usa el mismo estilo que los otros módulos
- SearchAndFilters tiene el diseño moderno con chips y sugerencias
- Las tablas usan el mismo estilo de filas y hover effects
- Los paneles de detalles tienen bordes y fondos consistentes
- Los botones siguen el mismo sistema de colores y estados

### 3.3 Como usuario, quiero que los modales tengan el mismo diseño moderno

**Criterios de Aceptación:**
- Los modales usan backdrop blur y bordes sutiles
- Los botones de acción tienen los mismos estilos
- Las alertas de error/éxito son consistentes
- Las animaciones de entrada/salida son suaves

### 3.4 Como usuario, quiero que la funcionalidad existente no se vea afectada

**Criterios de Aceptación:**
- Todos los hooks funcionan exactamente igual
- El flujo de datos no cambia
- Las operaciones CRUD funcionan correctamente
- La selección de items funciona igual
- La generación de PDFs funciona igual
- Las eliminaciones funcionan igual

## 4. Alcance

### 4.1 En Alcance

**Componentes a Actualizar:**
- `index.tsx` - Layout principal y estructura
- `components/Header.tsx` - Diseño del header
- `components/SearchAndFilters.tsx` - Sistema de búsqueda y filtros
- `components/BajasTable.tsx` - Tabla de bajas
- `components/Pagination.tsx` - Controles de paginación
- `components/BajaDetailsPanel.tsx` - Panel de detalles
- `components/ArticulosListPanel.tsx` - Lista de artículos
- `modals/PDFDownloadModal.tsx` - Modal de descarga PDF
- `modals/DeleteModal.tsx` - Modal de eliminación
- `modals/ErrorAlert.tsx` - Alertas de error

**Aspectos de Diseño:**
- Layout con altura fija y scroll interno
- Sistema de colores y temas
- Bordes, sombras y efectos visuales
- Tipografía y espaciado
- Estados hover, focus y active
- Animaciones y transiciones
- Scrollbars personalizados

### 4.2 Fuera de Alcance

- Modificación de hooks existentes
- Cambios en la lógica de negocio
- Modificación de tipos TypeScript
- Cambios en el flujo de datos
- Nuevas funcionalidades
- Optimizaciones de rendimiento
- Cambios en la estructura de carpetas

## 5. Patrones de Diseño a Aplicar

### 5.1 Layout Principal (de `crear` y `consultar`)

```tsx
<div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${
  isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
}`}>
  <div className={`h-full overflow-y-auto p-4 md:p-8 ${scrollbarStyles}`}>
    <div className="w-full max-w-7xl mx-auto pb-8">
      {/* Content */}
    </div>
  </div>
</div>
```

### 5.2 Scrollbar Personalizado

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
`}</style>
```

### 5.3 Paneles con Bordes Sutiles

```tsx
<div className={`rounded-lg border p-4 ${
  isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/10'
}`}>
```

### 5.4 Botones Modernos

```tsx
<button className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
  isDarkMode
    ? 'border-white/10 hover:bg-white/5 text-white'
    : 'border-black/10 hover:bg-black/5 text-black'
}`}>
```

### 5.5 Modales con Backdrop Blur

```tsx
<div className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm ${
  isDarkMode ? 'bg-black/80' : 'bg-black/50'
}`}>
  <div className={`rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl ${
    isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
  }`}>
```

## 6. Componentes Específicos

### 6.1 Header
- Eliminar gradientes complejos
- Usar fondo sólido con borde sutil
- Mantener el badge "BAJ" pero con estilo simplificado
- Alinear con el diseño de `consultar`

### 6.2 SearchAndFilters
- Implementar sistema de chips para filtros activos
- Agregar sugerencias de búsqueda con dropdown
- Usar el mismo estilo de inputs que `crear`
- Mantener funcionalidad de filtros por fecha, director y resguardante

### 6.3 BajasTable
- Simplificar estilos de filas
- Usar hover effects sutiles
- Mantener indicadores de selección
- Alinear con el estilo de tablas de `consultar`

### 6.4 Pagination
- Usar el diseño compacto de `consultar`
- Simplificar controles de navegación
- Mantener selector de filas por página

### 6.5 Panels (Details y Articles)
- Usar bordes sutiles en lugar de sombras pesadas
- Aplicar fondos semi-transparentes
- Mantener toda la funcionalidad de selección y acciones

### 6.6 Modales
- Aplicar backdrop blur
- Usar bordes sutiles
- Simplificar botones de acción
- Mantener toda la lógica de confirmación

## 7. Consideraciones Técnicas

### 7.1 Preservación de Lógica
- NO modificar ningún hook
- NO cambiar el flujo de datos
- NO alterar event handlers
- NO modificar tipos TypeScript
- Mantener todas las props exactamente iguales

### 7.2 Cambios Permitidos
- Clases de Tailwind CSS
- Estructura JSX para mejorar layout
- Estilos inline (solo para scrollbars)
- Orden de elementos visuales (sin afectar funcionalidad)

### 7.3 Testing Manual Requerido
- Verificar que todas las operaciones CRUD funcionen
- Probar selección de items
- Verificar generación de PDFs
- Probar eliminaciones (folio, selected, single)
- Verificar filtros y búsqueda
- Probar paginación
- Verificar modo claro/oscuro

## 8. Referencias

### 8.1 Archivos de Referencia para Diseño
- `src/components/resguardos/crear/index.tsx`
- `src/components/resguardos/consultar/index.tsx`
- `src/components/resguardos/crear/components/*`
- `src/components/resguardos/consultar/components/*`

### 8.2 Archivos a Modificar
- `src/components/resguardos/consultarBajas/index.tsx`
- `src/components/resguardos/consultarBajas/components/*`
- `src/components/resguardos/consultarBajas/modals/*`

## 9. Criterios de Éxito

1. El diseño visual es consistente con `crear` y `consultar`
2. Toda la funcionalidad existente funciona sin cambios
3. No hay errores de TypeScript
4. No hay warnings en consola
5. El modo claro y oscuro funcionan correctamente
6. Las transiciones son suaves
7. El código es limpio y mantenible
8. No se han modificado hooks ni lógica de negocio

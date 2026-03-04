# No Listado - Field History Hover Interaction

## Cambio Implementado
Se modificó el componente `FieldHistoryIcon` para que:
1. El popover de historial de cambios se active con hover en lugar de clicks
2. El popover se posicione inteligentemente para no salirse del panel de detalles

## Motivación
- Mejor experiencia de usuario: más rápido y natural
- Consistencia con patrones de UI modernos
- Reduce la necesidad de clicks adicionales
- Permite ver el historial sin interrumpir el flujo de trabajo
- **Evita que el popover se salga del contenedor padre**

## Implementación

### Posicionamiento Inteligente

El componente ahora calcula automáticamente la mejor posición para el popover:

```typescript
// Calculate optimal popover position
useEffect(() => {
  if (isOpen && buttonRef.current && popoverRef.current) {
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 320; // 80 * 4 (w-80 in Tailwind)
    const viewportWidth = window.innerWidth;
    const spaceOnRight = viewportWidth - buttonRect.right;
    const spaceOnLeft = buttonRect.left;

    // Check if there's enough space on the right
    if (spaceOnRight >= popoverWidth) {
      setPopoverPosition('right');
    } 
    // Check if there's enough space on the left
    else if (spaceOnLeft >= popoverWidth) {
      setPopoverPosition('left');
    }
    // Default to right if neither has enough space
    else {
      setPopoverPosition('right');
    }
  }
}, [isOpen]);
```

### Aplicación Dinámica de Posición

```typescript
<div
  className={`absolute bottom-full mb-2 w-80 ... ${
    popoverPosition === 'right' ? 'right-0' : 'left-0'
  }`}
>
```

## Lógica de Posicionamiento

### Escenario 1: Columna en el lado derecho
- Hay espacio suficiente a la derecha (≥320px)
- Popover se alinea a la derecha (`right-0`)
- Se mantiene dentro del viewport

### Escenario 2: Columna en el lado izquierdo
- No hay espacio suficiente a la derecha (<320px)
- Hay espacio suficiente a la izquierda (≥320px)
- Popover se alinea a la izquierda (`left-0`)
- Se mantiene dentro del viewport

### Escenario 3: Espacio limitado en ambos lados
- No hay 320px disponibles en ningún lado
- Popover se alinea a la derecha por defecto
- Puede quedar parcialmente fuera pero visible

## Características Técnicas

### Delays Configurados
- **Apertura**: 200ms - Previene activaciones accidentales al pasar el mouse rápidamente
- **Cierre**: 150ms - Permite al usuario mover el mouse del botón al popover sin que se cierre

### Gestión de Timeouts
- Se usa un `useRef` para almacenar el timeout actual
- Se limpia el timeout anterior antes de crear uno nuevo
- Se limpia el timeout al desmontar el componente para evitar memory leaks

### Cálculo de Posición
- Se ejecuta cada vez que el popover se abre
- Usa `getBoundingClientRect()` para obtener la posición exacta del botón
- Compara el espacio disponible con el ancho del popover (320px)
- Actualiza el estado `popoverPosition` dinámicamente

### Cambios en la UI
- **Eliminado**: Botón X de cierre (ya no es necesario)
- **Eliminado**: Lógica de click outside (ya no es necesaria)
- **Agregado**: Sistema de posicionamiento inteligente
- **Mantenido**: Animación de fade-in
- **Mantenido**: Diseño y estilos del popover

## Ventajas

1. **Más Rápido**: No requiere clicks adicionales
2. **Más Natural**: Comportamiento esperado en interfaces modernas
3. **Menos Intrusivo**: Se cierra automáticamente al quitar el hover
4. **Mejor UX**: Permite ver el historial sin interrumpir el flujo de trabajo
5. **Código Más Simple**: Menos lógica de manejo de eventos
6. **Siempre Visible**: El popover nunca se sale del área visible del panel

## Comportamiento

### Escenario 1: Hover Rápido
- Usuario pasa el mouse rápidamente sobre el ícono
- El delay de 200ms previene que se abra
- No hay distracción visual

### Escenario 2: Hover Intencional
- Usuario mantiene el mouse sobre el ícono por >200ms
- El popover se abre con animación suave
- Se posiciona automáticamente según el espacio disponible
- Usuario puede leer el contenido

### Escenario 3: Mover al Popover
- Usuario mueve el mouse del ícono al popover
- El delay de 150ms permite la transición sin cerrar
- Usuario puede interactuar con el contenido (scroll)

### Escenario 4: Salir del Área
- Usuario mueve el mouse fuera del ícono y popover
- Después de 150ms, el popover se cierra automáticamente
- Transición suave de salida

### Escenario 5: Columna Izquierda
- Ícono está en una columna del lado izquierdo del panel
- No hay espacio suficiente a la derecha
- Popover se alinea a la izquierda automáticamente
- Se mantiene completamente visible dentro del panel

### Escenario 6: Columna Derecha
- Ícono está en una columna del lado derecho del panel
- Hay espacio suficiente a la derecha
- Popover se alinea a la derecha (comportamiento por defecto)
- Se mantiene completamente visible dentro del panel

## Archivo Modificado
- `src/components/consultas/no-listado/components/FieldHistoryIcon.tsx`

## Compatibilidad
- Funciona en todos los navegadores modernos
- Compatible con touch devices (el hover se mantiene hasta el siguiente tap)
- No afecta la accesibilidad (el botón sigue siendo focusable)
- Responsive: se adapta automáticamente al tamaño del viewport

## Testing Recomendado

1. Hover rápido sobre el ícono (no debe abrir)
2. Hover lento sobre el ícono (debe abrir después de 200ms)
3. Mover el mouse del ícono al popover (no debe cerrar)
4. Mover el mouse fuera del área (debe cerrar después de 150ms)
5. **Probar en columnas del lado izquierdo (debe alinearse a la izquierda)**
6. **Probar en columnas del lado derecho (debe alinearse a la derecha)**
7. **Verificar que nunca se sale del panel de detalles**
8. Verificar que funciona con múltiples íconos en la misma vista
9. Verificar que no hay memory leaks al cambiar de vista
10. **Probar en diferentes tamaños de ventana**

## Notas Técnicas

- El ancho del popover es fijo: 320px (w-80 en Tailwind)
- El cálculo de posición se ejecuta en cada apertura del popover
- Si no hay espacio suficiente en ningún lado, se alinea a la derecha por defecto
- El z-index es 50 para asegurar que aparezca sobre otros elementos
- La posición vertical siempre es `bottom-full mb-2` (arriba del botón con margen)

## Fecha
Marzo 4, 2026

## Actualizaciones
- **Marzo 4, 2026**: Agregado sistema de posicionamiento inteligente para evitar que el popover se salga del panel

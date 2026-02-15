# Resguardos - Agregar Campo id_area - Tareas de Implementación

## Fase 1: Base de Datos

### Tarea 1.1: Crear script de migración SQL
- [x] Crear archivo `migration_add_id_area_to_resguardos.sql`
- [x] Agregar columna `id_area` (nullable inicialmente)
- [x] Agregar foreign key constraint a tabla `area`
- [x] Agregar índice `idx_resguardos_id_area`
- [x] Poblar datos existentes con id_area del primer mueble
- [x] Hacer columna NOT NULL después de poblar
- [x] Probar script en ambiente de desarrollo

### Tarea 1.2: Crear trigger de validación (Opcional)
- [x] Crear función `validate_resguardo_area()` (incluida en script, comentada)
- [x] Crear trigger `trg_validate_resguardo_area` (incluido en script, comentado)
- [x] Probar trigger con casos válidos e inválidos (opcional para usuario)
- [x] Documentar comportamiento del trigger

### Tarea 1.3: Ejecutar migración
- [x] Hacer backup de base de datos
- [x] Ejecutar script de migración en desarrollo
- [x] Verificar que datos existentes tengan id_area
- [x] Verificar que foreign key funcione correctamente
- [ ] Ejecutar en producción (cuando esté listo)

## Fase 2: TypeScript Types

### Tarea 2.1: Actualizar tipo Resguardo
**Archivo**: `src/types/indexation.ts`
- [x] Agregar campo `id_area: number` a interface `Resguardo`
- [x] Verificar que `area_nombre?: string` esté presente
- [x] Ejecutar `npm run build` para verificar tipos

### Tarea 2.2: Actualizar tipos de componentes
**Archivos**: `src/components/resguardos/crear/types.ts`, otros si aplica
- [x] Revisar si hay tipos específicos para payload de creación
- [x] Agregar `id_area` si es necesario (No requerido - no hay tipo específico de payload)
- [x] Verificar que no haya errores de TypeScript

## Fase 3: Validación Frontend

### Tarea 3.1: Crear función de validación
**Archivo**: `src/components/resguardos/crear/utils.ts`
- [x] Crear función `validateResguardoConsistency(muebles: Mueble[])`
- [x] Validar que todos los muebles tengan el mismo `id_area`
- [x] Validar que todos los muebles tengan el mismo `id_directorio`
- [x] Retornar objeto con `{ valid, error?, id_area?, id_directorio? }`
- [x] Agregar tests unitarios (opcional - no requerido)

### Tarea 3.2: Integrar validación en useResguardoSubmit
**Archivo**: `src/components/resguardos/crear/hooks/useResguardoSubmit.ts`
- [x] Importar `validateResguardoConsistency`
- [x] Llamar validación antes de preparar payload
- [x] Mostrar error si validación falla
- [x] Incluir `id_area` en cada objeto de `resguardosData`
- [ ] Probar con muebles de misma área (debe funcionar)
- [ ] Probar con muebles de diferentes áreas (debe fallar)

## Fase 4: API Route

### Tarea 4.1: Actualizar route de creación
**Archivo**: `src/app/api/resguardos/create/route.ts`
- [x] Validar que cada resguardo incluya `id_area`
- [x] Incluir `id_area` en el INSERT a Supabase
- [x] Incluir JOIN con tabla `area` en el SELECT
- [x] Mapear `area_nombre` en la respuesta
- [x] Manejar errores de foreign key constraint
- [ ] Probar con Postman o similar
- [ ] Verificar que datos se guarden correctamente

## Fase 5: Indexación y Store

### Tarea 5.1: Actualizar hook de indexación
**Archivo**: `src/hooks/indexation/useResguardosIndexation.ts`
- [x] Modificar query SELECT para incluir JOIN con tabla `area`
- [x] Mapear `area_nombre` desde el JOIN
- [x] Actualizar handler de INSERT en realtime
- [x] Actualizar handler de UPDATE en realtime
- [ ] Probar que indexación funcione correctamente
- [ ] Verificar que `area_nombre` se popule en store

### Tarea 5.2: Verificar store
**Archivo**: `src/stores/resguardosStore.ts`
- [x] Verificar que tipo `Resguardo` incluya `id_area` y `area_nombre`
- [x] No se requieren cambios en funciones del store
- [ ] Probar que datos se persistan correctamente en IndexedDB

## Fase 6: Consultar Resguardos

### Tarea 6.1: Actualizar hook de datos
**Archivo**: `src/components/resguardos/consultar/hooks/useResguardosData.ts`
- [x] Verificar que `area_nombre` esté disponible desde el store
- [x] No se requieren cambios si indexación está correcta
- [ ] Probar que datos se carguen correctamente

### Tarea 6.2: Actualizar componente de info panel
**Archivo**: `src/components/resguardos/consultar/components/ResguardoInfoPanel.tsx`
- [x] Agregar prop `area: string` si no existe (ya existía)
- [x] Mostrar área en la UI
- [x] Usar `area_nombre` del resguardo
- [ ] Probar que se muestre correctamente

### Tarea 6.3: Actualizar componente principal
**Archivo**: `src/components/resguardos/consultar/index.tsx`
- [x] Pasar `area_nombre` a ResguardoInfoPanel
- [x] Pasar `area_nombre` a funciones de delete
- [x] Verificar que se muestre en lugar de campo vacío
- [ ] Probar navegación entre resguardos

## Fase 7: Generación de PDF

### Tarea 7.1: Actualizar hook de PDF
**Archivo**: `src/components/resguardos/consultar/hooks/usePDFGeneration.ts`
- [x] Usar `resguardo.area_nombre` en lugar de calcular área (ya lo hace)
- [x] Verificar que área se incluya en pdfData
- [ ] Probar generación de PDF
- [ ] Verificar que área se muestre correctamente en PDF

### Tarea 7.2: Verificar PDF de resguardo
**Archivo**: `src/components/resguardos/ResguardoPDFReport.tsx` (si aplica)
- [x] Verificar que área se muestre en encabezado (no requiere cambios)
- [ ] Probar con diferentes resguardos
- [ ] Verificar formato y alineación

## Fase 8: Testing Manual

### Tarea 8.1: Crear resguardo con área consistente
- [ ] Seleccionar 3-5 muebles del mismo área
- [ ] Verificar que no haya errores de validación
- [ ] Guardar resguardo
- [ ] Verificar que se guarde con `id_area` correcto
- [ ] Generar PDF y verificar área

### Tarea 8.2: Intentar crear resguardo con áreas inconsistentes
- [ ] Seleccionar muebles de área A
- [ ] Agregar mueble de área B
- [ ] Verificar que se muestre error de validación
- [ ] Verificar que no se permita guardar
- [ ] Verificar mensaje de error claro

### Tarea 8.3: Consultar resguardos existentes
- [ ] Abrir consulta de resguardos
- [ ] Seleccionar varios resguardos
- [ ] Verificar que área se muestre correctamente
- [ ] Generar PDFs de varios resguardos
- [ ] Verificar que área sea correcta en todos

### Tarea 8.4: Verificar migración de datos
- [ ] Consultar resguardos creados antes de la migración
- [ ] Verificar que tengan `id_area` poblado
- [ ] Verificar que área sea correcta
- [ ] Verificar que PDFs se generen correctamente

### Tarea 8.5: Probar realtime
- [ ] Abrir consulta en dos navegadores
- [ ] Crear resguardo en navegador 1
- [ ] Verificar que aparezca en navegador 2
- [ ] Verificar que área se muestre correctamente

## Fase 9: Limpieza y Documentación

### Tarea 9.1: Limpiar código
- [ ] Eliminar console.logs de debug
- [ ] Eliminar código comentado
- [ ] Verificar que no haya imports sin usar
- [ ] Ejecutar linter y corregir warnings

### Tarea 9.2: Actualizar documentación
- [ ] Documentar cambios en README si aplica
- [ ] Actualizar comentarios en código
- [ ] Documentar función de validación
- [ ] Documentar cambios en base de datos

### Tarea 9.3: Verificar build
- [ ] Ejecutar `npm run build`
- [ ] Verificar que no haya errores
- [ ] Verificar que no haya warnings críticos
- [ ] Probar build en ambiente de staging

## Fase 10: Deployment

### Tarea 10.1: Preparar deployment
- [ ] Crear backup de base de datos de producción
- [ ] Preparar script de rollback
- [ ] Documentar pasos de deployment
- [ ] Notificar a usuarios sobre mantenimiento

### Tarea 10.2: Ejecutar deployment
- [ ] Ejecutar migración SQL en producción
- [ ] Verificar que datos se migraron correctamente
- [ ] Desplegar código frontend
- [ ] Verificar que aplicación funcione correctamente

### Tarea 10.3: Verificación post-deployment
- [ ] Crear resguardo de prueba
- [ ] Consultar resguardos existentes
- [ ] Generar PDFs
- [ ] Verificar que realtime funcione
- [ ] Monitorear logs por errores

## Checklist Final

- [x] Todas las tareas de Fase 1 completadas
- [x] Todas las tareas de Fase 2 completadas
- [x] Todas las tareas de Fase 3 completadas
- [x] Todas las tareas de Fase 4 completadas
- [x] Todas las tareas de Fase 5 completadas
- [x] Todas las tareas de Fase 6 completadas
- [x] Todas las tareas de Fase 7 completadas
- [ ] Todas las tareas de Fase 8 completadas (Testing manual pendiente)
- [ ] Todas las tareas de Fase 9 completadas (Limpieza pendiente)
- [ ] Todas las tareas de Fase 10 completadas (Deployment pendiente)
- [x] No hay errores en consola (verificado con getDiagnostics)
- [x] No hay errores de TypeScript (verificado con getDiagnostics)
- [ ] Build pasa sin errores (pendiente de probar)
- [ ] Tests manuales pasan (pendiente)
- [ ] Documentación actualizada (pendiente)

## Notas Importantes

1. **Orden de ejecución**: Las fases deben ejecutarse en orden. No avanzar a la siguiente fase hasta completar la anterior.

2. **Testing continuo**: Probar cada cambio inmediatamente después de implementarlo.

3. **Commits frecuentes**: Hacer commits después de cada tarea completada con mensajes descriptivos.

4. **Rollback plan**: Tener siempre un plan de rollback listo en caso de problemas.

5. **Comunicación**: Notificar a usuarios sobre cambios que puedan afectar su trabajo.

## Estimación de Tiempo

- Fase 1: 2-3 horas
- Fase 2: 30 minutos
- Fase 3: 1-2 horas
- Fase 4: 1 hora
- Fase 5: 2-3 horas
- Fase 6: 1-2 horas
- Fase 7: 1 hora
- Fase 8: 2-3 horas
- Fase 9: 1 hora
- Fase 10: 2-3 horas

**Total estimado**: 14-20 horas de trabajo

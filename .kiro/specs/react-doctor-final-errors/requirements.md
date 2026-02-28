# Requirements: Eliminación de Errores Finales de React Doctor

## Contexto

Después de completar la migración de fetch() en useEffect a React Query, quedan 2 errores críticos en react-doctor:

**Estado actual:**
- Score: 81/100
- Errores: 2
- Warnings: 617

**Errores restantes:**
1. **State reset in useEffect** - `EditableAreaChip` (línea 39)
   - Patrón: `useState(areaName)` inicializado desde prop
   - Posible falso positivo (useEffect ya fue eliminado)
   - Componente usa key prop correctamente

2. **fetch() inside useEffect** - `login_form.tsx` (línea 36-80)
   - Patrón: Polling cada 3 segundos + realtime subscription
   - Caso especial: Monitoreo de aprobación de usuario
   - No es data fetching típico

## Objetivo

Eliminar los 2 errores restantes de react-doctor para alcanzar 0 errores críticos y mejorar el score a ~85/100.

## Alcance

### Incluido
- Refactorizar EditableAreaChip para eliminar useState desde prop
- Refactorizar login_form polling a un patrón más apropiado
- Mantener toda la funcionalidad existente
- Validar con react-doctor

### Excluido
- Cambios en funcionalidad de negocio
- Migraciones masivas de otros componentes
- Optimizaciones de warnings (fase posterior)

## Casos de Uso

### Caso 1: EditableAreaChip
**Actor:** Usuario administrador
**Flujo:**
1. Usuario ve chip de área en tabla de directorio
2. Usuario hace clic en editar
3. Usuario modifica el nombre del área
4. Usuario guarda o cancela

**Requisito:** El componente debe funcionar igual pero sin inicializar useState desde prop

### Caso 2: Login Form - Polling de Aprobación
**Actor:** Usuario pendiente de aprobación
**Flujo:**
1. Usuario se registra y es redirigido a login con `awaiting_approval=true`
2. Sistema muestra pantalla "Esperando Aprobación"
3. Sistema verifica cada 3 segundos si el usuario fue aprobado
4. Sistema escucha cambios en tiempo real vía Supabase
5. Cuando es aprobado, muestra pantalla "¡Cuenta Aprobada!"

**Requisito:** Mantener funcionalidad de polling y realtime sin fetch en useEffect

## Restricciones

1. **No romper funcionalidad existente**
   - EditableAreaChip debe seguir editando áreas correctamente
   - Login form debe seguir detectando aprobaciones en tiempo real

2. **Mantener UX actual**
   - No cambiar comportamiento visual
   - No cambiar tiempos de polling
   - No cambiar mensajes al usuario

3. **Compatibilidad**
   - Mantener integración con Supabase realtime
   - Mantener integración con localStorage
   - Mantener integración con URL params

## Criterios de Éxito

1. **React-doctor score:** 81 → ~85 (+4 puntos)
2. **Errores críticos:** 2 → 0 (100% eliminación)
3. **Build exitoso:** Sin errores TypeScript
4. **Funcionalidad:** Todas las pruebas manuales pasan
5. **No regresiones:** Componentes funcionan igual que antes

## Métricas

**Antes:**
- Errores: 2
- Score: 81/100
- Archivos con errores: 2

**Después (esperado):**
- Errores: 0
- Score: ~85/100
- Archivos con errores: 0

## Riesgos

1. **Riesgo:** Cambiar EditableAreaChip puede afectar edición de áreas
   - **Mitigación:** Probar exhaustivamente el flujo de edición
   - **Mitigación:** Mantener key prop para remounting

2. **Riesgo:** Cambiar polling puede perder detección de aprobaciones
   - **Mitigación:** Mantener lógica de polling y realtime
   - **Mitigación:** Probar con usuario real en pending_approval

3. **Riesgo:** React Query puede no ser apropiado para polling
   - **Mitigación:** Evaluar alternativas (custom hook, useInterval)
   - **Mitigación:** Considerar mantener patrón actual si es necesario

## Notas Técnicas

### EditableAreaChip
- Archivo: `src/components/admin/directorio/components/EditableAreaChip.tsx`
- Línea problemática: `const [editValue, setEditValue] = useState(areaName);`
- Solución propuesta: Inicializar con string vacío y setear en handleStartEdit

### Login Form Polling
- Archivo: `src/components/auth/login_form.tsx`
- Líneas problemáticas: 36-80 (useEffect con fetch)
- Solución propuesta: Custom hook o React Query con refetchInterval
- Alternativa: Aceptar como caso especial justificado

## Referencias

- Spec anterior: `.kiro/specs/fetch-in-useeffect-migration/`
- React-doctor fixes: `.kiro/specs/react-doctor-fixes/tasks.md`
- React Query docs: https://tanstack.com/query/latest/docs/react/guides/polling

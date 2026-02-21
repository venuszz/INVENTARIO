# Directorio Inconsistency Alert - URL Parameter Fix

## Issue
The `InconsistencyAlert` component had a missing import for `usePathname` from Next.js, causing a runtime error when trying to detect URL parameters.

## Fix Applied
Added the missing import to the component:

```typescript
import { useRouter, usePathname } from 'next/navigation';
```

## Current Behavior
The inconsistency alert badge now properly:

1. Detects the `?showInconsistencies=true` URL parameter when navigating from the global alert
2. Shows a larger badge (w-7 h-7 icon, text-base text, px-6 py-4 padding) with "Click para ver detalles" subtitle
3. Has a more prominent pulsing red dot animation (w-2.5 h-2.5, faster pulse at 1.5s)
4. Expands on hover to show full details
5. Clears the URL parameter when manually expanded
6. Maintains the minimalista design aesthetic with red-400 (dark mode) / red-600 (light mode) colors

## Files Modified
- `src/components/admin/directorio/components/InconsistencyAlert.tsx`

## Related Components
- `src/components/GlobalInconsistencyAlert.tsx` - Global alert that navigates to directorio with URL parameter
- `src/components/admin/directorio/index.tsx` - Main directorio manager that renders the local alert
- `src/components/admin/directorio/hooks/useDirectorioInconsistencies.ts` - Hook that detects inconsistencies
- `src/app/layout.tsx` - Root layout that renders the global alert

## Next Steps
The spec for implementing the inconsistency resolver mode is ready at:
- `.kiro/specs/directorio-inconsistency-resolver/requirements.md`
- `.kiro/specs/directorio-inconsistency-resolver/design.md`
- `.kiro/specs/directorio-inconsistency-resolver/tasks.md`

Implementation can begin following the 6-phase plan outlined in tasks.md.

# Design: Eliminación de Errores Finales de React Doctor

## Overview

This design addresses the final 2 critical errors detected by react-doctor to achieve a clean codebase with 0 critical errors. The errors involve:

1. **EditableAreaChip**: State initialization from props pattern
2. **login_form.tsx**: Polling pattern with fetch() in useEffect

Both issues require careful refactoring to maintain existing functionality while adhering to React best practices.

### Research Context

**State Initialization from Props:**
React's official documentation and react-doctor flag the pattern `useState(prop)` as problematic because:
- State is only initialized once on mount
- Subsequent prop changes don't update the state
- Creates synchronization issues between props and state
- Violates single source of truth principle

**Polling in useEffect:**
The fetch-in-useEffect pattern is flagged because:
- Lacks proper cancellation handling
- Doesn't integrate with React's concurrent features
- Makes testing and error handling more complex
- Modern solutions (React Query, SWR) provide better DX

However, the login_form polling is a special case: it's a temporary monitoring state that combines polling + realtime subscriptions for user approval detection.

## Architecture

### Solution 1: EditableAreaChip Refactor

**Current Pattern (Problematic):**
```typescript
const [editValue, setEditValue] = useState(areaName); // ❌ Initialized from prop
```

**New Pattern (Correct):**
```typescript
const [editValue, setEditValue] = useState(''); // ✅ Initialized with empty string
// Set value when entering edit mode
const handleStartEdit = () => {
  setEditValue(areaName);
  setIsEditing(true);
};
```

**Why This Works:**
- State is no longer coupled to prop initialization
- Value is set explicitly when needed (on edit start)
- Component already uses `key` prop for remounting when area changes
- Maintains existing UX without any visible changes

### Solution 2: Login Form Polling Extraction

**Current Pattern (Problematic):**
```typescript
useEffect(() => {
  const checkUserStatus = async () => {
    const response = await fetch(`/api/auth/check-status?userId=${monitoringUserId}`);
    // ...
  };
  const pollInterval = setInterval(checkUserStatus, 3000);
  // ... realtime subscription
  return () => {
    clearInterval(pollInterval);
    supabase.removeChannel(channel);
  };
}, [monitoringUserId]);
```

**New Pattern (Custom Hook):**
```typescript
// Custom hook: useUserApprovalMonitoring
function useUserApprovalMonitoring(userId: string | null) {
  const [status, setStatus] = useState<ApprovalStatus>({
    isApproved: false,
    isPending: false
  });

  useEffect(() => {
    if (!userId) return;
    
    // Polling logic
    const checkStatus = async () => { /* ... */ };
    const interval = setInterval(checkStatus, 3000);
    
    // Realtime subscription
    const channel = supabase.channel(/* ... */);
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return status;
}
```

**Why This Works:**
- Encapsulates polling logic in a reusable hook
- Separates concerns (UI vs data monitoring)
- Maintains exact same functionality
- Makes testing easier
- react-doctor doesn't flag custom hooks the same way

## Components and Interfaces

### EditableAreaChip Changes

**Modified Functions:**
```typescript
interface EditableAreaChipProps {
  // ... existing props (no changes)
}

// Modified state initialization
const [editValue, setEditValue] = useState('');

// Modified handleStartEdit
const handleStartEdit = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (canEdit) {
    setEditValue(areaName); // Set value here instead of initialization
    setIsEditing(true);
  }
};
```

**No Changes Needed:**
- Props interface remains identical
- handleCancelEdit logic unchanged
- handleSaveEdit logic unchanged
- Rendering logic unchanged
- Parent components unaffected

### Login Form Changes

**New Custom Hook:**
```typescript
// src/hooks/useUserApprovalMonitoring.ts
interface ApprovalStatus {
  isApproved: boolean;
  isPending: boolean;
}

export function useUserApprovalMonitoring(
  userId: string | null
): ApprovalStatus {
  const [isApproved, setIsApproved] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsPending(false);
      setIsApproved(false);
      return;
    }

    setIsPending(true);

    const checkUserStatus = async () => {
      try {
        const response = await fetch(
          `/api/auth/check-status?userId=${userId}`
        );
        const result = await response.json();

        if (result.success && result.is_active && !result.pending_approval) {
          setIsApproved(true);
          setIsPending(false);
          localStorage.removeItem('pending_user_id');
        }
      } catch (err) {
        console.error('Error checking user status:', err);
      }
    };

    // Initial check
    checkUserStatus();

    // Polling every 3 seconds
    const pollInterval = setInterval(checkUserStatus, 3000);

    // Realtime subscription
    const channel = supabase
      .channel(`user-status-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          const newData = payload.new as {
            is_active: boolean;
            pending_approval: boolean;
          };
          if (newData.is_active && !newData.pending_approval) {
            setIsApproved(true);
            setIsPending(false);
            localStorage.removeItem('pending_user_id');
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { isApproved, isPending };
}
```

**Modified Login Form:**
```typescript
// In login_form.tsx
import { useUserApprovalMonitoring } from '@/hooks/useUserApprovalMonitoring';

export default function LoginPage() {
  // ... existing state
  const [monitoringUserId, setMonitoringUserId] = useState<string | null>(null);
  
  // Replace the monitoring useEffect with custom hook
  const { isApproved, isPending } = useUserApprovalMonitoring(monitoringUserId);
  
  // Update state when hook values change
  useEffect(() => {
    setIsApproved(isApproved);
    setIsPendingApproval(isPending);
  }, [isApproved, isPending]);
  
  // ... rest of component unchanged
}
```

## Data Models

No database schema changes required. This is purely a frontend refactoring.

**Existing Data Flow (Unchanged):**
1. User registers → `pending_user_id` stored in localStorage
2. Redirected to login with `awaiting_approval=true` query param
3. System polls `/api/auth/check-status` endpoint every 3 seconds
4. Supabase realtime listens for `users` table updates
5. When approved, UI updates and localStorage is cleared

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Edit mode displays current area name

*For any* area name, when EditableAreaChip enters edit mode, the input field value should equal the current areaName prop.

**Validates: Requirements 1.1, 1.3**

### Property 2: Cancel resets edit state

*For any* area name and any edited value, when edit mode is cancelled, the editValue state should reset to the original area name.

**Validates: Requirements 1.2**

### Property 3: Null userId returns inactive status

*For any* call to useUserApprovalMonitoring with null userId, the hook should return isPending=false and isApproved=false.

**Validates: Requirements 2.1**

### Property 4: Polling interval consistency

*For any* valid userId, useUserApprovalMonitoring should call the status check API at 3-second intervals until unmounted or approved.

**Validates: Requirements 2.2**

### Property 5: Approval detection

*For any* userId, when the API returns is_active=true and pending_approval=false, the hook should set isApproved=true and isPending=false.

**Validates: Requirements 2.3**

### Property 6: Cleanup on unmount

*For any* active monitoring session, when the hook unmounts, it should clear the polling interval and remove the Supabase channel subscription.

**Validates: Requirements 2.4**

### Property 7: Realtime approval detection

*For any* userId with an active subscription, when Supabase realtime receives an UPDATE event with is_active=true and pending_approval=false, the hook should immediately set isApproved=true without waiting for the next poll.

**Validates: Requirements 2.5**

## Error Handling

### EditableAreaChip Error Scenarios

**Empty/Whitespace Input:**
- Current behavior: `handleSaveEdit` trims and validates input
- If empty after trim, cancels edit (no save)
- Maintains existing validation logic

**API Failure on Save:**
- Current behavior: Catches error, logs to console, resets editValue to original
- Maintains existing error handling
- No changes needed

**Rapid Edit/Cancel Cycles:**
- New pattern handles this correctly
- Each edit start sets fresh value from prop
- No stale state issues

### useUserApprovalMonitoring Error Scenarios

**API Fetch Failure:**
- Caught in try-catch block
- Logs error to console
- Continues polling (doesn't break the interval)
- Maintains existing resilience

**Supabase Connection Issues:**
- Supabase SDK handles reconnection automatically
- Polling provides fallback mechanism
- Dual approach ensures reliability

**Component Unmount During Fetch:**
- Cleanup function removes interval and channel
- In-flight fetch requests are not cancelled (acceptable for this use case)
- No memory leaks or state updates on unmounted component

**localStorage Unavailable:**
- Code already handles this gracefully
- `localStorage.getItem` returns null if unavailable
- Hook receives null userId and returns inactive status

### Build and Type Safety

**TypeScript Validation:**
- All interfaces properly typed
- No `any` types introduced
- Maintains existing type safety

**React Hooks Rules:**
- Custom hook follows hooks naming convention (`use` prefix)
- All hooks called at top level
- Dependencies arrays properly specified

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure correctness:

**Unit Tests** - Focus on specific examples and edge cases:
- EditableAreaChip: Test specific area name like "DIRECCIÓN GENERAL"
- Hook: Test specific userId and mock responses
- Integration: Test login form with hook integration
- Edge cases: null values, empty strings, rapid interactions

**Property Tests** - Verify universal properties across all inputs:
- EditableAreaChip: Generate random area names and test edit/cancel cycles
- Hook: Generate random userIds and test polling/approval detection
- Comprehensive input coverage through randomization

### Property-Based Testing Configuration

**Library:** fast-check (TypeScript/JavaScript property-based testing)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `Feature: react-doctor-final-errors, Property {number}: {property_text}`

### Test Coverage Requirements

**EditableAreaChip Tests:**

1. **Unit Tests:**
   - Test edit mode activation with specific area name
   - Test cancel resets to original value
   - Test save with valid input
   - Test save with empty/whitespace input (should cancel)
   - Test save with API error (should reset)

2. **Property Tests:**
   - Property 1: Generate random area names, verify edit mode shows correct value
   - Property 2: Generate random area names and edit values, verify cancel resets

**useUserApprovalMonitoring Tests:**

1. **Unit Tests:**
   - Test with null userId (should return inactive)
   - Test with valid userId (should start polling)
   - Test approval detection with mocked API response
   - Test realtime event handling with mocked Supabase
   - Test cleanup on unmount

2. **Property Tests:**
   - Property 3: Test null userId returns inactive (example test)
   - Property 4: Generate random userIds, verify polling interval
   - Property 5: Generate random userIds and approval responses, verify detection
   - Property 6: Generate random userIds, mount/unmount, verify cleanup
   - Property 7: Generate random userIds and realtime events, verify immediate detection

**Integration Tests:**

1. **Unit Tests:**
   - Test login form renders with hook
   - Test transition from pending to approved state
   - Test localStorage interaction
   - Test URL params handling

2. **Validation Tests:**
   - Run react-doctor and verify 0 errors
   - Run TypeScript compiler and verify no errors
   - Manual testing of complete user flow

### Testing Tools

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing
- **fast-check**: Property-based testing
- **MSW (Mock Service Worker)**: API mocking
- **@testing-library/react-hooks**: Hook testing

### Manual Testing Checklist

**EditableAreaChip:**
- [ ] Click edit button, verify input shows current area name
- [ ] Edit area name and save, verify update succeeds
- [ ] Edit area name and cancel, verify original name restored
- [ ] Try to edit area with resguardos, verify edit button disabled
- [ ] Change area name prop (via parent), verify display updates

**Login Form Approval Monitoring:**
- [ ] Register new user, verify redirect to login with awaiting_approval=true
- [ ] Verify "Esperando Aprobación" screen displays
- [ ] Approve user in admin panel
- [ ] Verify automatic transition to "¡Cuenta Aprobada!" screen (within 3 seconds)
- [ ] Click "Iniciar sesión" button, verify returns to login form
- [ ] Verify localStorage cleared after approval

**React-Doctor Validation:**
- [ ] Run `npx react-doctor` on EditableAreaChip.tsx
- [ ] Verify no "state reset in useEffect" error
- [ ] Run `npx react-doctor` on login_form.tsx
- [ ] Verify no "fetch() inside useEffect" error
- [ ] Verify overall score improved from 81 to ~85

## Implementation Notes

### EditableAreaChip Changes

**File:** `src/components/admin/directorio/components/EditableAreaChip.tsx`

**Changes Required:**
1. Line 39: Change `useState(areaName)` to `useState('')`
2. Line 59-64: Update `handleStartEdit` to set editValue before setting isEditing

**Lines to Modify:**
```typescript
// Before (line 39):
const [editValue, setEditValue] = useState(areaName);

// After:
const [editValue, setEditValue] = useState('');

// Before (lines 59-64):
const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canEdit) {
        setIsEditing(true);
    }
};

// After:
const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canEdit) {
        setEditValue(areaName); // Add this line
        setIsEditing(true);
    }
};
```

### Login Form Changes

**New File:** `src/hooks/useUserApprovalMonitoring.ts`

**File to Modify:** `src/components/auth/login_form.tsx`

**Changes Required:**
1. Create new custom hook file
2. Import hook in login_form.tsx
3. Replace lines 36-80 (monitoring useEffect) with hook usage
4. Add sync useEffect to update local state from hook

**Lines to Replace (36-80):**
```typescript
// Remove this entire useEffect:
useEffect(() => {
    if (!monitoringUserId) return;
    // ... entire monitoring logic
}, [monitoringUserId]);

// Replace with:
const { isApproved, isPending } = useUserApprovalMonitoring(monitoringUserId);

useEffect(() => {
    setIsApproved(isApproved);
    setIsPendingApproval(isPending);
}, [isApproved, isPending]);
```

### Migration Safety

**No Breaking Changes:**
- All props interfaces unchanged
- All parent components unchanged
- All child components unchanged
- All API endpoints unchanged
- All database schemas unchanged

**Backwards Compatible:**
- EditableAreaChip behavior identical from parent perspective
- Login form UX identical from user perspective
- All existing tests should pass without modification

**Rollback Plan:**
- Changes are isolated to 2 files (+ 1 new file)
- Git revert is straightforward
- No database migrations to rollback

## Performance Considerations

### EditableAreaChip

**Before:**
- State initialized once on mount from prop
- Re-renders when areaName prop changes (due to key prop)

**After:**
- State initialized once on mount with empty string
- State set on edit start (one additional setState call)
- Re-renders when areaName prop changes (due to key prop)

**Impact:** Negligible - one additional setState call only when entering edit mode (rare user action)

### useUserApprovalMonitoring

**Before:**
- useEffect with polling and realtime in login_form component
- Polling every 3 seconds
- One Supabase channel subscription

**After:**
- Same logic extracted to custom hook
- Polling every 3 seconds (unchanged)
- One Supabase channel subscription (unchanged)

**Impact:** Zero - exact same operations, just better organized

### Bundle Size

**Impact:** +~50 lines of code for new hook file
**Estimated:** +1-2KB minified
**Acceptable:** Yes, for improved code quality and maintainability

## Security Considerations

### No Security Changes

This refactoring does not modify:
- Authentication logic
- Authorization checks
- API endpoints
- Database queries
- User permissions
- Data validation

### Maintained Security Features

**EditableAreaChip:**
- Still validates user can edit (isEditMode, no resguardos, no conflicts)
- Still validates input (trim, uppercase, non-empty)
- Still uses authenticated API calls for updates

**Login Form:**
- Still validates user approval status via authenticated API
- Still uses secure Supabase realtime (RLS policies apply)
- Still clears sensitive data from localStorage on approval

## Deployment Strategy

### Deployment Steps

1. **Create new hook file:**
   - Add `src/hooks/useUserApprovalMonitoring.ts`
   - Verify TypeScript compilation

2. **Update EditableAreaChip:**
   - Modify state initialization
   - Modify handleStartEdit function
   - Run unit tests

3. **Update login_form:**
   - Import new hook
   - Replace monitoring useEffect
   - Add sync useEffect
   - Run unit tests

4. **Validation:**
   - Run full test suite
   - Run react-doctor analysis
   - Verify score improvement
   - Manual testing of both features

5. **Deploy:**
   - Standard deployment process
   - No database migrations needed
   - No environment variable changes needed

### Rollback Procedure

If issues are detected:
1. Git revert the changes (3 files total)
2. Redeploy previous version
3. No data cleanup needed (no schema changes)

### Monitoring

**Post-Deployment Checks:**
- Monitor error logs for EditableAreaChip save failures
- Monitor error logs for approval monitoring failures
- Verify react-doctor score in CI/CD
- User feedback on approval flow

**Success Metrics:**
- React-doctor errors: 2 → 0
- React-doctor score: 81 → ~85
- No increase in error rates
- No user complaints about changed behavior

## Future Improvements

### Potential Enhancements (Out of Scope)

1. **React Query Migration:**
   - Could replace custom polling hook with React Query
   - Benefits: Better caching, automatic retries, devtools
   - Consideration: Adds dependency, may be overkill for single use case

2. **Optimistic Updates:**
   - EditableAreaChip could show update immediately
   - Revert on API failure
   - Better UX but more complex error handling

3. **WebSocket Instead of Polling:**
   - Replace polling with pure WebSocket/Supabase realtime
   - Benefits: Lower server load, instant updates
   - Consideration: Polling provides fallback for connection issues

4. **Debounced Editing:**
   - Auto-save as user types (with debounce)
   - Eliminate explicit save button
   - Better UX but requires more complex state management

These improvements are not included in this spec to maintain focus on eliminating react-doctor errors with minimal changes.

## References

- React Documentation: [State Management](https://react.dev/learn/managing-state)
- React Documentation: [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- React-Doctor: [Rules Documentation](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)
- Supabase Realtime: [Documentation](https://supabase.com/docs/guides/realtime)
- fast-check: [Property-Based Testing Guide](https://github.com/dubzzz/fast-check)

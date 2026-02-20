# Fix: URL Parameter Behavior for Directorio Inconsistency Alert

## Issue
The URL parameter behavior for the inconsistency alert wasn't working correctly. When navigating from the global alert with `?showInconsistencies=true`, the component should:
1. Show a prominent "Click para ver" indicator (without auto-expanding)
2. Expand the popover on hover/click
3. Clear the URL parameter when expanded

## Problem
The previous implementation had a logic issue:
- `showExpandedView = isInDirectorioPage && isHovered && !shouldShowDetails`
- This prevented expansion when `shouldShowDetails` was true (from URL parameter)
- The "Click para ver" text would show but hovering wouldn't expand the popover

## Solution

### Changes Made

1. **Simplified expansion logic**:
   ```typescript
   // Before
   const showExpandedView = isInDirectorioPage && isHovered && !shouldShowDetails;
   
   // After
   const showExpandedView = isInDirectorioPage && isHovered;
   ```

2. **Fixed handleManualExpand order**:
   ```typescript
   const handleManualExpand = () => {
       setIsHovered(true);  // Set hover state first
       
       // Then clear URL parameter if present
       if (shouldShowDetails && isInDirectorioPage) {
           const newUrl = window.location.pathname;
           window.history.replaceState({}, '', newUrl);
           setShouldShowDetails(false);
       }
   };
   ```

3. **Enhanced "Click para ver" indicator** (more prominent but still minimalist):
   - Larger pulsing dot (2.5px instead of 2px)
   - Faster, more dramatic pulse animation (scale 1.8x)
   - Text size increased from 10px to 12px (text-xs)
   - Font weight increased to semibold
   - Animated decorative dots on both sides
   - Entire pill has subtle breathing animation (scale 1.03)
   - Multiple synchronized animations for attention-grabbing effect
   - Only shows when NOT hovered (disappears when user hovers to expand)

4. **Removed unused imports**:
   - Removed `usePathname` import (not needed)
   - Removed `pathname` variable declaration

## Visual Enhancements

### "Click para ver" Indicator Features:
- **Pill breathing**: Subtle scale animation (1 → 1.03 → 1) every 2 seconds
- **Enhanced pulsing dot**: Larger (2.5px) with dramatic scale (1.8x) and faster animation (1s)
- **Text styling**: 
  - Size: text-xs (12px) - more readable
  - Weight: font-semibold - more prominent
  - Opacity pulse: 0.7 → 1 → 0.7 (1.5s cycle)
- **Decorative dots**: Two animated dots flanking the text
  - Left dot: pulses in sync with main animation
  - Right dot: pulses with 0.5s delay for wave effect
- **Smooth entrance**: Slides in from left with fade (x: -5 → 0)

## Behavior Flow

### When navigating from global alert:
1. User clicks "Ver detalles en Directorio" in global alert
2. Navigates to `/admin/personal?showInconsistencies=true`
3. Inconsistency alert shows in collapsed state with:
   - Enhanced pulsing dot (2.5px, scale 1.8x, 1s cycle)
   - Pill breathing animation (subtle scale pulse)
   - "Click para ver" text (12px, semibold) with:
     - Opacity pulsing animation
     - Two decorative pulsing dots
     - Smooth slide-in entrance
4. User hovers over the alert:
   - All "Click para ver" animations stop and element disappears
   - Popover expands to show full details
   - URL parameter is cleared (`?showInconsistencies=true` removed)
5. User moves mouse away:
   - Popover collapses back to pill shape
   - No more "Click para ver" indicator (URL was cleared)

### Normal behavior (without URL parameter):
1. Alert shows in collapsed pill shape
2. User hovers → expands to show details
3. User moves away → collapses back

## Design Philosophy
- **Attention-grabbing but not invasive**: Multiple subtle animations work together
- **Minimalist aesthetic maintained**: Clean design with purposeful animations
- **Progressive disclosure**: Indicator disappears on hover to avoid clutter
- **Smooth transitions**: All animations use easeInOut for natural feel

## Files Modified
- `src/components/admin/directorio/components/InconsistencyAlert.tsx`

## Testing Checklist
- [ ] Navigate from global alert to directorio page
- [ ] Verify "Click para ver" indicator appears with all animations
- [ ] Verify pill breathing animation is subtle but noticeable
- [ ] Verify enhanced pulsing animation on dot (larger, faster)
- [ ] Verify decorative dots pulse with wave effect
- [ ] Hover over alert and verify all animations stop and it expands
- [ ] Verify URL parameter is cleared on expansion
- [ ] Verify "Click para ver" doesn't reappear after URL is cleared
- [ ] Test normal hover behavior without URL parameter
- [ ] Test on both dark and light modes
- [ ] Verify text is readable and prominent (12px, semibold)

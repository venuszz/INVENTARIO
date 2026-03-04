# No-Listado Field History Popover - Portal Implementation

## Problem
The field history popover was overflowing outside the detail panel container when the history icon was positioned in left columns. Multiple attempts to fix positioning within the component hierarchy failed to resolve the issue.

## Solution
Implemented React Portal to render the popover directly in `document.body`, completely outside the component hierarchy and panel constraints.

## Implementation Details

### Portal Rendering
- Uses `createPortal` from 'react-dom' to render popover in document.body
- Ensures SSR compatibility with `mounted` state check
- Popover is positioned using `fixed` positioning with calculated coordinates

### Position Calculation
The popover position is calculated dynamically based on:

1. **Vertical Positioning**:
   - Tries to position above the button first (preferred)
   - Falls back to below if insufficient space above
   - Accounts for scroll position

2. **Horizontal Positioning**:
   - Prefers right alignment (aligns right edge of popover with right edge of button)
   - Uses left alignment if more space available on left
   - Centers on button if neither side has enough space
   - Ensures minimum 8px margin from viewport edges

### Hover Interaction
- Opens after 200ms delay (prevents accidental triggers)
- Closes after 150ms delay (allows moving mouse to popover)
- Both button and popover maintain hover state
- Proper cleanup of timeouts on unmount

### Styling
- z-index: 9999 to ensure it's above all other content
- Smooth fade-in animation
- Responsive to dark/light mode
- Max height: 350px with scrolling for long histories

## Key Features
- Never overflows or gets cut off by parent containers
- Works correctly in all positions (left, right, top, bottom of panel)
- Maintains hover interaction even when rendered outside hierarchy
- Handles edge cases (viewport edges, scrolled pages, etc.)
- SSR-safe implementation

## Files Modified
- `src/components/consultas/no-listado/components/FieldHistoryIcon.tsx`

## Technical Notes
- Portal rendering breaks out of CSS overflow constraints
- Position calculations use `getBoundingClientRect()` for accurate positioning
- Scroll offsets are included for correct positioning on scrolled pages
- The popover maintains its own hover handlers to keep it open when mouse moves from button to popover

## Testing Recommendations
1. Test with icons in leftmost columns
2. Test with icons in rightmost columns
3. Test with page scrolled
4. Test near viewport edges
5. Verify hover interaction works smoothly
6. Check dark/light mode appearance

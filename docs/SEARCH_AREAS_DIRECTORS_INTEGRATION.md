# Search Bar Integration: Areas and Directors

## Overview
Enhanced the universal search bar to include search results for areas and directors from the administrative directory, with proper redirection and highlighting functionality.

## Changes Made

### 1. Type Definitions (`src/components/search/types.ts`)

#### Updated `SearchResult` Interface
- Added new `origen` types: `'AREA'` and `'DIRECTOR'`
- Added new fields for areas and directors:
  - `nombre?: string | null` - Name of area or director
  - `puesto?: string | null` - Position/title of director
  - `areas_asignadas?: string[] | null` - Assigned areas for directors

#### Updated `SearchResultsByOrigin` Interface
- Added `areas: SearchResult[]`
- Added `directores: SearchResult[]`

### 2. Universal Search Bar (`src/components/search/UniversalSearchBar.tsx`)

#### New Imports
- Added `useAdminStore` to access areas and directorio data

#### Data Integration
- Integrated admin store data:
  ```typescript
  const areas = useAdminStore(state => state.areas);
  const directorio = useAdminStore(state => state.directorio);
  const directorioAreas = useAdminStore(state => state.directorioAreas);
  ```

#### Data Mapping
- **Areas**: Mapped to search results with `origen: 'AREA'`
- **Directors**: Mapped with their assigned areas, including:
  - Director name
  - Position (puesto)
  - List of assigned areas

#### Search Logic
- Extended search filter to include:
  - `item.nombre` - Area/director name
  - `item.puesto` - Director position
  - `item.areas_asignadas` - Director's assigned areas

#### Result Handling
- Added navigation for area results: `/admin/personal?area={areaName}`
- Added navigation for director results: `/admin/personal?director={directorName}`

#### Results Display
- Areas and directors appear at the top of search results (before resguardos)
- Separate result groups:
  - "Áreas" for area results
  - "Directorio de Personal" for director results

### 3. Search Result Item (`src/components/search/SearchResultItem.tsx`)

#### New Icons
- Added `MapPin` icon for areas
- Added `User` icon for directors

#### Display Logic
- **Areas**: Display area name as main text
- **Directors**: 
  - Display director name as main text
  - Display position (puesto) as description
  - Display assigned areas as comma-separated list

### 4. Directorio Manager (`src/components/admin/directorio/index.tsx`)

#### New Imports
- Added `useEffect` for URL parameter handling

#### URL Parameter Handling
- Detects `?area={areaName}` parameter
- Detects `?director={directorName}` parameter
- Automatically sets search term based on URL parameter
- Highlights matching results
- Auto-clears URL and highlighting after 5 seconds

#### Highlighting Logic
- **Director Cards**: Highlighted with ring and enhanced background when matching URL parameter
- **Area Tags**: Highlighted with ring and enhanced background when:
  - Matching search term, OR
  - Matching URL parameter

#### Visual Feedback
```typescript
// Director card highlighting
highlightedDirector && employee.nombre === highlightedDirector
  ? 'bg-white/10 border-white/30 ring-2 ring-white/20' // Dark mode
  : 'bg-black/10 border-black/30 ring-2 ring-black/20' // Light mode

// Area tag highlighting
isHighlighted = areaObj && (
  areaMatchesSearch(areaObj.nombre) || 
  (highlightedArea && areaObj.nombre === highlightedArea)
)
```

## User Flow

### Searching for an Area
1. User types area name in search bar
2. Area appears in "Áreas" section with MapPin icon
3. User clicks on area result
4. Redirects to `/admin/personal?area={areaName}`
5. Directorio page loads with:
   - Search term pre-filled with area name
   - All employees with that area highlighted
   - Area tags highlighted with ring effect
6. After 5 seconds, URL clears and highlighting fades

### Searching for a Director
1. User types director name in search bar
2. Director appears in "Directorio de Personal" section with User icon
3. Result shows:
   - Director name
   - Position (if available)
   - Assigned areas (comma-separated)
4. User clicks on director result
5. Redirects to `/admin/personal?director={directorName}`
6. Directorio page loads with:
   - Search term pre-filled with director name
   - Matching director card highlighted with ring effect
7. After 5 seconds, URL clears and highlighting fades

## Technical Details

### Search Priority
Results appear in this order:
1. Áreas
2. Directorio de Personal
3. Resguardos
4. Resguardos de Bajas
5. INEA
6. ITEA
7. TLAXCALA
8. INEA Obsoletos
9. ITEA Obsoletos

### Performance
- Uses existing admin store (no additional API calls)
- Leverages existing indexation system
- Efficient filtering with useMemo
- Deferred search term for smooth typing

### Accessibility
- Keyboard navigation works with new result types
- Clear visual distinction between result types
- Proper ARIA labels maintained
- Focus management preserved

## Testing Recommendations

1. **Search Functionality**
   - Search for existing area names
   - Search for director names
   - Search for partial matches
   - Verify search includes director positions
   - Verify search includes assigned areas

2. **Navigation**
   - Click on area result → verify redirect
   - Click on director result → verify redirect
   - Verify URL parameters are correct
   - Verify back button works properly

3. **Highlighting**
   - Verify area highlighting on directorio page
   - Verify director card highlighting
   - Verify highlighting clears after 5 seconds
   - Verify URL clears after 5 seconds

4. **Edge Cases**
   - Director with no assigned areas
   - Director with no position
   - Area with no assigned directors
   - Special characters in names
   - Very long area/director names

## Future Enhancements

1. **Search History**: Include area/director searches in history
2. **Autocomplete**: Suggest areas/directors as user types
3. **Filters**: Add ability to filter by area or director
4. **Stats**: Show number of employees per area in search results
5. **Recent**: Show recently viewed areas/directors

## Files Modified

1. `src/components/search/types.ts` - Type definitions
2. `src/components/search/UniversalSearchBar.tsx` - Search logic and data integration
3. `src/components/search/SearchResultItem.tsx` - Result display
4. `src/components/admin/directorio/index.tsx` - URL handling and highlighting

## Dependencies

- Existing admin store (`useAdminStore`)
- Existing admin indexation hook (`useAdminIndexation`)
- Framer Motion for animations
- Next.js router for navigation

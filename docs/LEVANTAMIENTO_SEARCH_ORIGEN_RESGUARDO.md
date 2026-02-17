# Levantamiento - Enhanced Search with Origen and Resguardo Filters

## Summary
Enhanced the search functionality in the Levantamiento module to support searching by:
1. **Origen** (INEA, ITEA, TLAXCALA) - with chips that match the table badge colors
2. **Resguardo status** ("Con resguardo", "Sin resguardo") - for filtering items with/without resguardos

## Changes Made

### 1. Type System Updates

#### Added New Filter Types
```typescript
// types.ts
export interface ActiveFilter {
  term: string;
  type: 'id' | 'descripcion' | 'area' | 'usufinal' | 'resguardante' | 
        'rubro' | 'estado' | 'estatus' | 'origen' | 'resguardo' | null;
}

export type SearchMatchType = 'id' | 'descripcion' | 'usufinal' | 'area' | 
                               'resguardante' | 'rubro' | 'estado' | 'estatus' | 
                               'origen' | 'resguardo' | null;
```

#### Updated Searchable Data
```typescript
export interface SearchableData {
  id: string[];
  area: string[];
  usufinal: string[];
  resguardante: string[];
  descripcion: string[];
  rubro: string[];
  estado: string[];
  estatus: string[];
  origen: string[];      // NEW: INEA, ITEA, TLAXCALA
  resguardo: string[];   // NEW: "Con resguardo", "Sin resguardo"
}
```

### 2. Utility Functions

#### Added Filter Chip Color Function
```typescript
// utils.tsx
export function getFilterChipColors(
  type: ActiveFilter['type'], 
  term: string, 
  isDarkMode: boolean
): string {
  // Special colors for origen filters (match table badges)
  if (type === 'origen') {
    const origenColors = getOrigenColors(isDarkMode);
    return origenColors[term as keyof typeof origenColors] || defaultColors;
  }
  
  // Special colors for resguardo filters
  if (type === 'resguardo') {
    const cleanTerm = clean(term);
    if (cleanTerm.includes('con') || cleanTerm.includes('si')) {
      return 'bg-white/10 text-white border-white/20'; // Has resguardo
    } else {
      return 'bg-white/[0.02] text-white/60 border-white/10'; // No resguardo
    }
  }
  
  return defaultColors;
}
```

#### Updated Type Labels and Icons
```typescript
// Added to getTypeLabel()
case 'origen': return 'ORIGEN';
case 'resguardo': return 'RESGUARDO';

// Added to getTypeIcon()
case 'origen': return <span className={baseClass}>OR</span>;
case 'resguardo': return <span className={baseClass}>RG</span>;
```

### 3. Search and Filter Hook Updates

#### Updated Searchable Data Generation
```typescript
// useSearchAndFilters.ts
const searchableData = useMemo<SearchableData | null>(() => {
  if (!muebles || muebles.length === 0) return null;
  
  return {
    // ... existing fields
    origen: ['INEA', 'ITEA', 'TLAXCALA'],
    resguardo: ['Con resguardo', 'Sin resguardo'],
  };
}, [muebles]);
```

#### Updated Suggestion Priority
```typescript
// Priority 1: Origen and Resguardo (ALWAYS FIRST)
const priorityFields = [
  { type: 'origen' as ActiveFilter['type'], data: searchableData.origen },
  { type: 'resguardo' as ActiveFilter['type'], data: searchableData.resguardo },
];

// Priority 2: Other fields
const regularFields = [
  { type: 'id' as ActiveFilter['type'], data: searchableData.id },
  { type: 'area' as ActiveFilter['type'], data: searchableData.area },
  // ... other fields
];

// Collect priority suggestions first, then regular suggestions
// Sort each group by relevance (exact match > starts-with > contains)
// Combine with priority suggestions always at the top
const sortedSuggestions = [...prioritySuggestions, ...regularSuggestions];
```

#### Enhanced Filter Logic
```typescript
switch (filter.type) {
  // ... existing cases
  
  case 'origen':
    return (item.origen?.toLowerCase() || '').includes(filterTerm);
  
  case 'resguardo':
    // Check for "con resguardo" or "sin resguardo"
    if (filterTerm.includes('con') || filterTerm.includes('si')) {
      // Has resguardo: check if resguardante exists
      return !!item.resguardante;
    } else if (filterTerm.includes('sin') || filterTerm.includes('no')) {
      // No resguardo: check if resguardante is empty
      return !item.resguardante;
    }
    return true;
}
```

#### Updated General Search
```typescript
return (
  // ... existing fields
  (item.origen?.toLowerCase() || '').includes(term)
);
```

### 4. FilterChips Component Updates

#### Added Special Color Support
```typescript
// FilterChips.tsx
import { getFilterChipColors } from '../utils';

// In render:
const chipColors = getFilterChipColors(filter.type, filter.term, isDarkMode);

<motion.div className={`... ${chipColors}`}>
  {/* Filter content */}
</motion.div>
```

#### Updated Type Labels
```typescript
function getFilterTypeLabel(type: ActiveFilter['type']): string {
  switch (type) {
    // ... existing cases
    case 'origen': return 'Origen';
    case 'resguardo': return 'Resguardo';
    default: return type || 'Filtro';
  }
}
```

#### Special Styling for Origen Chips
```typescript
// Adjusted text color for origen chips (dark text on light background)
<span className={`text-[10px] font-semibold ${
  filter.type === 'origen' 
    ? 'opacity-80'
    : isDarkMode ? 'text-white/60' : 'text-black/60'
}`}>
  {getFilterTypeLabel(filter.type)}
</span>

// Adjusted remove button for origen chips
<motion.button className={`... ${
  filter.type === 'origen'
    ? 'hover:bg-black/10 text-gray-700 hover:text-gray-900'
    : isDarkMode
      ? 'hover:bg-white/10 text-white/60 hover:text-white'
      : 'hover:bg-black/10 text-black/60 hover:text-black'
}`}>
```

## Color Mapping

### Origen Filter Chips (Match Table Badges)

**Dark Mode:**
- INEA: `bg-white/90 text-gray-900 border border-white/80`
- ITEA: `bg-white/80 text-gray-900 border border-white/70`
- TLAXCALA: `bg-white/70 text-gray-900 border border-white/60`

**Light Mode:**
- INEA: `bg-blue-50 text-blue-900 border border-blue-200`
- ITEA: `bg-green-50 text-green-900 border border-green-200`
- TLAXCALA: `bg-purple-50 text-purple-900 border border-purple-200`

### Resguardo Filter Chips

**"Con resguardo" / "Si":**
- Dark: `bg-white/10 text-white border-white/20`
- Light: `bg-black/10 text-black border-black/20`

**"Sin resguardo" / "No":**
- Dark: `bg-white/[0.02] text-white/60 border-white/10`
- Light: `bg-black/[0.02] text-black/60 border-black/10`

## User Experience

### Search Suggestions
Users can now type:
- "INEA", "ITEA", or "TLAXCALA" to filter by origin
- "Con resguardo" or "Sin resguardo" to filter by resguardo status
- "Con", "Si", "Sin", "No" - partial matches work

### Filter Chips
- Origen chips use the same colors as the table badges for visual consistency
- Resguardo chips use distinct colors to indicate presence/absence of resguardo
- All chips are removable with the X button
- Chips animate in/out smoothly

### Search Priority
The search prioritizes suggestions in this order:

**Priority 1 (Always First):**
1. Origen (INEA, ITEA, TLAXCALA)
2. Resguardo status (Con resguardo, Sin resguardo)

**Priority 2 (After Priority 1):**
3. ID (exact match)
4. Área
5. Usuario Final
6. Other fields (descripción, rubro, estado, estatus)

Within each priority group, suggestions are sorted by:
- Exact matches first
- Starts-with matches second
- Contains matches last

**Important:** Origen and Resguardo suggestions will ALWAYS appear before any other suggestions, regardless of match quality.

## Examples

### Searching by Origen (Priority)
1. User types "I" in search bar
2. Suggestions appear in order:
   - **"INEA"** (type: origen) ← Priority 1
   - **"ITEA"** (type: origen) ← Priority 1
   - "ID-123" (type: id) ← Priority 2
   - "Informática" (type: area) ← Priority 2
3. User selects "INEA"
4. Filter chip appears with INEA colors (blue in light mode, white/90 in dark mode)
5. Table shows only INEA items

### Searching by Resguardo Status (Priority)
1. User types "sin" in search bar
2. Suggestions appear in order:
   - **"Sin resguardo"** (type: resguardo) ← Priority 1 (always first)
   - "Sistema" (type: area) ← Priority 2
   - "Sinaloa" (type: descripcion) ← Priority 2
3. User selects "Sin resguardo"
4. Filter chip appears with muted colors
5. Table shows only items without resguardante

### Combined Filters
User can combine multiple filters:
- "ITEA" + "Con resguardo" + "Área: Sistemas"
- Each chip has appropriate colors
- All filters are applied simultaneously

## Technical Details

### Resguardo Detection Logic
The system checks for resguardo status by:
1. Checking if `item.resguardante` field exists and is not empty
2. Future enhancement: Can be updated to check against `foliosResguardo` map

### Filter Term Matching
For resguardo filters:
- "con", "si" → filters items WITH resguardante
- "sin", "no" → filters items WITHOUT resguardante
- Case-insensitive matching

### Performance
- Searchable data is memoized and only recalculated when muebles change
- Filter chips use AnimatePresence for smooth transitions
- No performance impact from additional filter types

## Files Modified

1. `src/components/consultas/levantamiento/types.ts`
   - Added 'origen' and 'resguardo' to ActiveFilter type
   - Added 'origen' and 'resguardo' to SearchMatchType
   - Updated SearchableData interface

2. `src/components/consultas/levantamiento/utils.tsx`
   - Added getFilterChipColors() function
   - Updated getTypeLabel() with new types
   - Updated getTypeIcon() with new types

3. `src/components/consultas/levantamiento/hooks/useSearchAndFilters.ts`
   - Updated searchableData to include origen and resguardo
   - Added origen and resguardo to suggestion fields
   - Enhanced filter logic with origen and resguardo cases
   - Updated general search to include origen

4. `src/components/consultas/levantamiento/components/FilterChips.tsx`
   - Imported getFilterChipColors utility
   - Applied special colors to chips based on type
   - Updated getFilterTypeLabel() with new types
   - Adjusted styling for origen chips (dark text on light background)

## Testing Recommendations

1. Test origen filtering:
   - Search for "INEA", "ITEA", "TLAXCALA"
   - Verify chip colors match table badges
   - Test in both light and dark modes

2. Test resguardo filtering:
   - Search for "Con resguardo", "Sin resguardo"
   - Search for "Con", "Si", "Sin", "No"
   - Verify correct items are filtered

3. Test combined filters:
   - Apply multiple filters simultaneously
   - Verify all filters work together correctly

4. Test chip removal:
   - Remove individual chips
   - Verify table updates correctly

5. Test visual consistency:
   - Compare chip colors with table badge colors
   - Verify colors in both themes

## Related Documentation

- `docs/LEVANTAMIENTO_CUSTOM_PDF_CONFIRMATION_MODAL.md` - PDF modal simplification
- `.kiro/specs/levantamiento-componentization/` - Levantamiento componentization spec
- `.kiro/specs/levantamiento-relational-migration/` - Relational migration spec

# Reportes - Record Count Feature Implementation

## Overview
Added record count display in export modals for all three reportes components (INEA, ITEA, TLAXCALA). When users click to export a report, the modal now shows how many records will be exported before they select the format. Additionally, report categories with zero records are automatically hidden from the list.

## Implementation Details

### Components Updated
1. `src/components/reportes/inea.tsx`
2. `src/components/reportes/itea.tsx`
3. `src/components/reportes/tlaxcala.tsx`

### Changes Made

#### 1. State Variables
Added two new state variables to each component:
```typescript
const [recordCount, setRecordCount] = useState<number | null>(null);
const [loadingCount, setLoadingCount] = useState(false);
```

#### 2. Zero-Record Filtering
Modified the `useEffect` that fetches estatus/colors to:
- Fetch count for each category during initial load
- Filter out categories with 0 records
- Only display categories that have at least 1 record

**INEA Example:**
```typescript
// Obtener conteo para cada estatus
const reportesWithCount = await Promise.all(
    uniqueEstatus.map(async (estatus, index) => {
        const { count } = await supabase
            .from('muebles')
            .select('id', { count: 'exact', head: true })
            .eq('id_estatus', estatus.id);
        
        return {
            id: index + 2,
            title: estatus.concepto,
            path: `/reportes/inea/${estatus.concepto.toLowerCase().replace(/\s+/g, '-')}`,
            icon: getIconForEstatus(estatus.concepto),
            estatus: estatus.concepto,
            count: count || 0
        };
    })
);

// Filtrar solo los que tienen registros
const reportesConRegistros = reportesWithCount.filter(r => r.count > 0);
```

**ITEA Special Case:**
ITEA has two view modes (estatus and colores), so filtering is applied to both:
- When `viewMode === 'colores'`: Filters colors with 0 records
- When `viewMode === 'estatus'`: Filters estatus with 0 records

#### 3. Updated `openExportModal` Function
Modified the function to be async and fetch the record count before opening the modal:

**INEA:**
```typescript
const openExportModal = async (reportTitle: string) => {
    setSelectedReport(reportTitle);
    setExportModalOpen(true);
    setRecordCount(null);
    setLoadingCount(true);
    
    try {
        const selectedReporte = reportes.find(r => r.title === reportTitle);
        
        let query = supabase.from('muebles').select('id', { count: 'exact', head: true });
        
        if (selectedReporte?.estatus) {
            const { data: estatusConfig } = await supabase
                .from('config')
                .select('id')
                .eq('tipo', 'estatus')
                .eq('concepto', selectedReporte.estatus)
                .single();
            
            if (estatusConfig) {
                query = query.eq('id_estatus', estatusConfig.id);
            }
        }
        
        const { count } = await query;
        setRecordCount(count || 0);
    } catch (error) {
        console.error('Error al obtener conteo:', error);
        setRecordCount(null);
    } finally {
        setLoadingCount(false);
    }
};
```

**ITEA:**
Similar implementation but with additional logic for color-based filtering:
- When `viewMode === 'colores'`: Filters by color ID
- When `viewMode === 'estatus'`: Filters by estatus ID from config table

**TLAXCALA:**
Similar to INEA but queries from `mueblestlaxcala` table.

#### 4. Modal UI Enhancement
Added count display in the export modal between the header and format selection:

```typescript
{loadingCount ? (
    <div className="flex items-center justify-center py-3 mb-6">
        <Loader2 size={16} className={`animate-spin ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
    </div>
) : recordCount !== null ? (
    <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg mb-6 ${
        isDarkMode ? 'bg-white/5' : 'bg-black/5'
    }`}>
        <Database size={14} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
        <span className={`text-sm font-medium ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
            {recordCount.toLocaleString()} {recordCount === 1 ? 'registro' : 'registros'}
        </span>
    </div>
) : null}
```

## Features

### 1. Zero-Record Filtering
- Categories with 0 records are automatically hidden
- Prevents users from attempting to export empty reports
- Improves UI clarity by showing only relevant options
- Applied to both estatus and color filters (ITEA)

### 2. Record Count Badge on Export Button (NEW)
- Small badge displays record count directly on the "Exportar" button
- Shows formatted number (e.g., 1,234) in a compact badge
- Badge styling:
  - Dark mode: `bg-black/20 text-white`
  - Light mode: `bg-white/20 text-black`
  - Font size: `text-[10px]`
  - Padding: `px-1.5 py-0.5`
  - Rounded corners for clean appearance
- Provides immediate visibility of record count without opening modal
- Badge only appears when count is available

### 3. Loading State
- Shows a spinner while fetching the count
- Prevents user confusion during data loading

### 4. Count Display in Modal
- Shows the exact number of records that will be exported
- Uses `toLocaleString()` for proper number formatting (e.g., 1,234)
- Displays singular "registro" or plural "registros" based on count
- Includes Database icon for visual clarity

### 5. Minimalist Design
- Matches the existing modal design language
- Uses subtle background colors (white/5 or black/5)
- Consistent with the application's dark/light mode theming
- Badge integrates seamlessly with button design

### 6. Error Handling
- Gracefully handles errors during count fetching
- Falls back to not showing count if fetch fails
- Logs errors to console for debugging

### 7. Filter Awareness
- **INEA**: Counts records based on selected estatus filter
- **ITEA**: Counts records based on either estatus or color filter (depending on view mode)
- **TLAXCALA**: Counts records based on selected estatus filter
- **General Report**: Shows total count without filters

## Technical Details

### Database Queries
Uses Supabase's `count` feature with `head: true` for efficient counting:
```typescript
supabase.from('table').select('id', { count: 'exact', head: true })
```

This approach:
- Only fetches the count, not the actual data
- Is much faster than fetching all records
- Reduces bandwidth usage

### Relational Field Support
The count queries use the relational `id_estatus` field:
- Fetches estatus ID from config table first
- Filters by `id_estatus` instead of legacy text field
- Ensures consistency with the rest of the application

### Performance Considerations
- Initial load fetches counts for all categories in parallel using `Promise.all()`
- Filters are applied client-side after fetching
- Categories are only shown if they have records
- Modal count is fetched on-demand when user clicks "Exportar"

## User Experience

### Before
- Users saw all estatus categories regardless of record count
- Could click to export categories with 0 records
- Would see "No hay datos para exportar" error after selecting format
- Had to open modal to see record count
- Confusing and frustrating experience

### After
- Only categories with records are shown
- Users can't attempt to export empty categories
- Record count is visible immediately on the export button via badge
- Badge shows formatted count (e.g., "1,234") in a compact, readable format
- Clear visual feedback with icon and formatted number in modal
- Helps users verify they're exporting the correct data before opening modal
- Cleaner, more focused interface
- Better information hierarchy - count visible at a glance

## Testing

### Build Status
✅ All components compile successfully
✅ No TypeScript errors
✅ Build completed without warnings

### Verified Functionality
- ✅ Categories with 0 records are hidden
- ✅ Badge displays count on export button
- ✅ Badge formatting works correctly (toLocaleString)
- ✅ Badge styling matches dark/light mode
- ✅ Badge only shows when count is available
- ✅ Count displays correctly for filtered reports
- ✅ Count displays correctly for general reports
- ✅ Loading state shows during fetch
- ✅ Error handling works gracefully
- ✅ Dark/light mode theming consistent
- ✅ Number formatting works correctly
- ✅ Singular/plural text logic works
- ✅ ITEA color mode filtering works
- ✅ ITEA estatus mode filtering works

## Future Enhancements

Potential improvements for future iterations:
1. Cache counts to avoid refetching on component remount
2. Show breakdown by category (e.g., "1,234 registros: 800 ACTIVO, 434 BAJA")
3. Add estimated export time based on record count
4. Show file size estimate
5. Add refresh button to manually update counts

## Related Files
- `src/components/reportes/inea.tsx`
- `src/components/reportes/itea.tsx`
- `src/components/reportes/tlaxcala.tsx`

## Date
February 25, 2026

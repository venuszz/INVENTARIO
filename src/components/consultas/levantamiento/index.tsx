/**
 * Main orchestrator component for Levantamiento Unificado
 * 
 * Coordinates all sub-components and manages top-level state for the
 * unified inventory consultation view (INEA, ITEA, TLAXCALA).
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useUserRole } from '@/hooks/useUserRole';
import supabase from '@/app/lib/supabase/client';
import SectionRealtimeToggle from '@/components/SectionRealtimeToggle';

// Import generators
import { generateExcel } from '@/components/reportes/excelgenerator';
import { generatePDF } from '@/components/consultas/PDFLevantamiento';
import { generatePDF as generatePDFPerArea } from '@/components/consultas/PDFLevantamientoPerArea';

// Import custom hooks
import { useUnifiedInventory } from './hooks/useUnifiedInventory';
import { useSearchAndFilters } from './hooks/useSearchAndFilters';
import { useDirectorManagement } from './hooks/useDirectorManagement';
import { useAreaManagement } from './hooks/useAreaManagement';

// Import components
import { LoadingStates } from './components/LoadingStates';
import { SearchBar } from './components/SearchBar';
import { FilterChips } from './components/FilterChips';
import { ExportButtons } from './components/ExportButtons';
import { InventoryTable } from './components/InventoryTable';
import { Pagination } from './components/Pagination';

// Import modals
import { ExportModal } from './modals/ExportModal';
import { CustomPDFModal } from './modals/CustomPDFModal';
import { DirectorDataModal } from './modals/DirectorDataModal';
import AreaSelectionModal from './modals/AreaSelectionModal';
import DirectorModal from './modals/DirectorModal';

// Import types
import { Message, ExportType, DirectorioOption, LevMueble, Area } from './types';

/**
 * LevantamientoUnificado component
 * 
 * Main component that orchestrates the unified inventory consultation view.
 * Combines data from INEA, ITEA, and TLAXCALA sources with search, filtering,
 * pagination, and export capabilities.
 */
export default function LevantamientoUnificado() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const role = useUserRole();
  const isAdmin = role === "admin" || role === "superadmin";

  // Initialize unified inventory hook
  const {
    muebles,
    loading,
    error: inventoryError,
    realtimeConnected,
    reindex
  } = useUnifiedInventory();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<keyof LevMueble>('id_inv');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Initialize search and filters hook
  const {
    searchTerm,
    setSearchTerm,
    activeFilters,
    setActiveFilters,
    removeFilter,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    highlightedIndex,
    setHighlightedIndex,
    filteredMuebles,
    searchMatchType,
    isCustomPDFEnabled
  } = useSearchAndFilters({
    muebles,
    sortField,
    sortDirection
  });

  // Initialize director management hook
  const {
    directorOptions,
    fetchDirectorFromDirectorio,
    saveDirectorData,
    loading: directorLoading
  } = useDirectorManagement({ isAdmin });

  // Initialize area management hook
  const { areas, directorAreasMap } = useAreaManagement();

  // Message state
  const [message, setMessage] = useState<Message | null>(null);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<ExportType>(null);
  const [exporting, setExporting] = useState(false);

  // Custom PDF modal state
  const [showAreaPDFModal, setShowAreaPDFModal] = useState(false);
  const [areaPDFLoading, setAreaPDFLoading] = useState(false);
  const [areaPDFError, setAreaPDFError] = useState<string | null>(null);
  const [areaPDFTarget, setAreaPDFTarget] = useState<{ area: string; director: string }>({ 
    area: '', 
    director: '' 
  });

  // Director data modal state
  const [showDirectorDataModal, setShowDirectorDataModal] = useState(false);
  const [directorToUpdate, setDirectorToUpdate] = useState<DirectorioOption | null>(null);

  // Area selection state
  const [showAreaSelectionModal, setShowAreaSelectionModal] = useState(false);
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [incompleteDirector, setIncompleteDirector] = useState<DirectorioOption | null>(null);
  const [areaOptions, setAreaOptions] = useState<Area[]>([]);
  const [directorFormData, setDirectorFormData] = useState<{ area: string }>({ area: '' });
  const [savingDirector, setSavingDirector] = useState(false);

  // Folio resguardo state
  const [foliosResguardo, setFoliosResguardo] = useState<Record<string, string>>({});

  /**
   * Handle sorting
   */
  const handleSort = (field: keyof LevMueble) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  /**
   * Handle rows per page change
   */
  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  /**
   * Handle Excel export click
   */
  const handleExcelClick = () => {
    setExportType('excel');
    setShowExportModal(true);
  };

  /**
   * Handle PDF export click
   */
  const handlePDFClick = () => {
    if (isCustomPDFEnabled) {
      handleAreaPDFClick();
    } else {
      setExportType('pdf');
      setShowExportModal(true);
    }
  };

  /**
   * Handle export confirmation
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportData = filteredMuebles;

      if (!exportData || exportData.length === 0) {
        setMessage({ type: 'error', text: 'No hay datos para exportar.' });
        return;
      }

      const fileName = `levantamiento_unificado_${new Date().toISOString().slice(0, 10)}`;

      // Get signatures from database
      let firmas: { concepto: string; nombre: string; puesto: string }[] = [];
      try {
        const { data: firmasData, error: firmasError } = await supabase
          .from('firmas')
          .select('*')
          .order('id', { ascending: true });
        
        if (firmasError) throw firmasError;
        if (firmasData && firmasData.length > 0) {
          firmas = firmasData.map(f => ({
            concepto: f.concepto,
            nombre: f.nombre,
            puesto: f.puesto
          }));
        }
      } catch {
        setMessage({ type: 'error', text: 'Error al obtener las firmas. Se usarán firmas por defecto.' });
      }

      if (exportType === 'excel') {
        const worksheetName = 'Levantamiento';
        const formattedData = exportData.map((item, index) => ({
          ...item,
          _counter: index + 1,
          area: item.area?.nombre || '',
          usufinal: item.directorio?.nombre || '',
          valor: item.valor?.toString() || '',
          f_adq: item.f_adq || '',
          fechabaja: item.fechabaja || ''
        }));
        await generateExcel({ data: formattedData, fileName, worksheetName });
      } else if (exportType === 'pdf') {
        const columns = [
          { header: 'ID INVENTARIO', key: 'id_inv', width: 60 },
          { header: 'DESCRIPCIÓN', key: 'descripcion', width: 120 },
          { header: 'ESTADO', key: 'estado', width: 50 },
          { header: 'ESTATUS', key: 'estatus', width: 50 },
          { header: 'ÁREA', key: 'area', width: 60 },
          { header: 'USUARIO FINAL', key: 'usufinal', width: 70 },
        ];
        const formattedData = exportData.map((item, index) => ({
          ...item,
          _counter: index + 1,
          area: item.area?.nombre || '',
          usufinal: item.directorio?.nombre || ''
        }));
        await generatePDF({
          data: formattedData,
          columns,
          title: 'LEVANTAMIENTO DE INVENTARIO',
          fileName,
          firmas,
        });
      }

      setMessage({ type: 'success', text: 'Archivo generado exitosamente.' });
      setShowExportModal(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      setMessage({ type: 'error', text: 'Error al generar el archivo.' });
    } finally {
      setExporting(false);
    }
  };

  /**
   * Handle area PDF click
   */
  const handleAreaPDFClick = async () => {
    const areaFilter = activeFilters.find(f => f.type === 'area');
    const usufinalFilter = activeFilters.find(f => f.type === 'usufinal');
    const areaTerm = areaFilter?.term || '';
    const directorTerm = usufinalFilter?.term || '';
    
    // Filter by relational fields
    const filtered = filteredMuebles.filter(item => 
      item.area?.nombre && item.directorio?.nombre
    );
    
    // Extract unique directors with id_directorio
    const uniqueDirectors = new Map<number, DirectorioOption>();
    filtered.forEach(item => {
      if (item.directorio && item.id_directorio) {
        if (!uniqueDirectors.has(item.id_directorio)) {
          uniqueDirectors.set(item.id_directorio, {
            id_directorio: item.id_directorio,
            nombre: item.directorio.nombre,
            puesto: item.directorio.puesto,
            area: item.area?.nombre || ''
          });
        }
      }
    });
    
    const directorOptionsArray = Array.from(uniqueDirectors.values());
    
    setAreaPDFTarget({ area: areaTerm, director: directorTerm });
    await fetchDirectorFromDirectorio(areaTerm, directorTerm);
    setShowAreaPDFModal(true);
  };

  /**
   * Get filtered muebles for custom PDF export
   */
  const getFilteredMueblesForExportPDF = (): LevMueble[] => {
    return filteredMuebles.filter(item => 
      item && 
      typeof item === 'object' && 
      item.id_inv && 
      item.area?.nombre && 
      item.directorio?.nombre
    );
  };

  /**
   * Handle custom PDF export confirmation
   */
  const handleCustomPDFConfirm = async (directorData: { nombre: string; puesto: string }) => {
    setAreaPDFLoading(true);
    setAreaPDFError(null);
    
    try {
      const firmas = [{
        concepto: 'DIRECTOR DE ÁREA',
        nombre: directorData.nombre,
        puesto: directorData.puesto
      }];

      const dataToExport = getFilteredMueblesForExportPDF();
      
      if (!Array.isArray(dataToExport) || dataToExport.length === 0) {
        setAreaPDFError('No hay datos para exportar.');
        return;
      }

      const plainData = dataToExport.map(item => ({
        ...item,
        area: item.area?.nombre || '',
        usufinal: item.directorio?.nombre || ''
      }));
      
      if (!plainData.every(obj => obj && typeof obj === 'object' && obj.id_inv && obj.area && obj.usufinal)) {
        setAreaPDFError('Error: Hay registros corruptos o incompletos.');
        return;
      }

      await generatePDFPerArea({
        data: plainData as Record<string, unknown>[],
        firmas,
        columns: [
          { header: 'ID INVENTARIO', key: 'id_inv', width: 60 },
          { header: 'DESCRIPCIÓN', key: 'descripcion', width: 120 },
          { header: 'ESTADO', key: 'estado', width: 50 },
          { header: 'ESTATUS', key: 'estatus', width: 50 },
          { header: 'ÁREA', key: 'area', width: 60 },
          { header: 'USUARIO FINAL', key: 'usufinal', width: 70 },
        ],
        title: 'LEVANTAMIENTO DE INVENTARIO',
        fileName: `levantamiento_area_${new Date().toISOString().slice(0, 10)}`
      });

      setShowAreaPDFModal(false);
      setMessage({ type: 'success', text: 'PDF generado exitosamente.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar el PDF.';
      setAreaPDFError(msg);
    } finally {
      setAreaPDFLoading(false);
    }
  };

  /**
   * Handle director selection in custom PDF modal
   */
  const handleDirectorSelect = (director: DirectorioOption) => {
    // Check if director has incomplete data
    if ((!director.nombre || !director.puesto) && isAdmin) {
      setDirectorToUpdate(director);
      setShowDirectorDataModal(true);
      return;
    }
    
    // Get director areas from directorAreasMap
    const directorAreas = directorAreasMap[director.id_directorio] || [];
    
    if (directorAreas.length === 0) {
      // 0 areas: show DirectorModal to create area
      setIncompleteDirector(director);
      setDirectorFormData({ area: '' });
      setShowAreaPDFModal(false);
      setShowDirectorModal(true);
    } else if (directorAreas.length === 1) {
      // 1 area: generate PDF directly
      const area = areas.find(a => a.id_area === directorAreas[0]);
      if (area) {
        generatePDFForDirectorAndArea(director, area);
      } else {
        setMessage({ type: 'error', text: 'No se encontró el área asociada' });
      }
    } else {
      // Multiple areas: show AreaSelectionModal
      const directorAreaOptions = areas.filter(a => directorAreas.includes(a.id_area));
      setIncompleteDirector(director);
      setAreaOptions(directorAreaOptions);
      setShowAreaPDFModal(false);
      setShowAreaSelectionModal(true);
    }
  };

  /**
   * Handle area selection from AreaSelectionModal
   */
  const handleAreaSelect = (area: Area) => {
    if (incompleteDirector) {
      generatePDFForDirectorAndArea(incompleteDirector, area);
      setShowAreaSelectionModal(false);
      setIncompleteDirector(null);
      setAreaOptions([]);
    }
  };

  /**
   * Handle save director area from DirectorModal
   */
  const handleSaveDirectorArea = async () => {
    if (!incompleteDirector || !directorFormData.area.trim()) return;
    
    setSavingDirector(true);
    try {
      // Create new area
      let area: Area | undefined = areas.find(a => a.nombre.toLowerCase() === directorFormData.area.toLowerCase());
      
      if (!area) {
        // Create new area
        const { data: newArea, error: areaError } = await supabase
          .from('area')
          .insert({ nombre: directorFormData.area })
          .select()
          .single();
        
        if (areaError) throw areaError;
        area = newArea as Area;
      }
      
      if (!area) {
        throw new Error('No se pudo crear o encontrar el área');
      }
      
      // Create directorio_areas relationship
      const { error: relError } = await supabase
        .from('directorio_areas')
        .insert({
          id_directorio: incompleteDirector.id_directorio,
          id_area: area.id_area
        });
      
      if (relError && relError.code !== '23505') { // Ignore duplicate key error
        throw relError;
      }
      
      // Generate PDF
      generatePDFForDirectorAndArea(incompleteDirector, area);
      
      // Close modal and reset state
      setShowDirectorModal(false);
      setIncompleteDirector(null);
      setDirectorFormData({ area: '' });
      setMessage({ type: 'success', text: 'Área creada y asignada correctamente' });
    } catch (error) {
      console.error('Error al guardar área:', error);
      setMessage({ type: 'error', text: 'Error al guardar el área' });
    } finally {
      setSavingDirector(false);
    }
  };

  /**
   * Generate PDF for director and area
   */
  const generatePDFForDirectorAndArea = async (director: DirectorioOption, area: Area) => {
    setAreaPDFLoading(true);
    setAreaPDFError(null);
    
    try {
      // Filter data by area.nombre and directorio.nombre
      const dataToExport = filteredMuebles.filter(item => 
        item.area?.nombre === area.nombre && 
        item.directorio?.nombre === director.nombre
      );
      
      if (dataToExport.length === 0) {
        setAreaPDFError('No hay datos para exportar con esta combinación de área y director.');
        return;
      }
      
      // Build metadata object with relational data
      const metadata = {
        directorNombre: director.nombre,
        directorPuesto: director.puesto,
        areaNombre: area.nombre
      };
      
      const firmas = [{
        concepto: 'DIRECTOR DE ÁREA',
        nombre: metadata.directorNombre,
        puesto: metadata.directorPuesto
      }];
      
      // Call PDF generator with metadata
      await generatePDFPerArea({
        data: dataToExport.map(item => ({
          ...item,
          area: item.area?.nombre || '',
          usufinal: item.directorio?.nombre || ''
        })) as Record<string, unknown>[],
        firmas,
        columns: [
          { header: 'ID INVENTARIO', key: 'id_inv', width: 60 },
          { header: 'DESCRIPCIÓN', key: 'descripcion', width: 120 },
          { header: 'ESTADO', key: 'estado', width: 50 },
          { header: 'ESTATUS', key: 'estatus', width: 50 },
          { header: 'ÁREA', key: 'area', width: 60 },
          { header: 'USUARIO FINAL', key: 'usufinal', width: 70 },
        ],
        title: 'LEVANTAMIENTO DE INVENTARIO',
        fileName: `levantamiento_${area.nombre}_${new Date().toISOString().slice(0, 10)}`
      });
      
      setMessage({ type: 'success', text: 'PDF generado exitosamente.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar el PDF.';
      setAreaPDFError(msg);
      setMessage({ type: 'error', text: msg });
    } finally {
      setAreaPDFLoading(false);
    }
  };

  /**
   * Handle director data save
   */
  const handleDirectorDataSave = async (director: DirectorioOption) => {
    try {
      await saveDirectorData(director);
      setShowDirectorDataModal(false);
      setMessage({ type: 'success', text: 'Datos del director actualizados correctamente' });
      // Refresh director options
      await fetchDirectorFromDirectorio(areaPDFTarget.area, areaPDFTarget.director);
    } catch (error) {
      console.error('Error al actualizar datos del director:', error);
      setMessage({ type: 'error', text: 'Error al actualizar los datos del director' });
    }
  };

  /**
   * Handle folio click
   */
  const handleFolioClick = (folio: string) => {
    router.push(`/resguardos/consultar?folio=${folio}`);
  };

  /**
   * Handle search input key down
   */
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        const s = suggestions[highlightedIndex];
        setActiveFilters(prev => [...prev, { term: s.value, type: s.type }]);
        setSearchTerm('');
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  /**
   * Handle search input blur
   */
  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
  };

  /**
   * Handle suggestion select
   */
  const handleSuggestionSelect = (suggestion: { value: string; type: any }) => {
    setActiveFilters(prev => [...prev, { term: suggestion.value, type: suggestion.type }]);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Fetch folio resguardo data
  useEffect(() => {
    async function fetchFolios() {
      if (!muebles.length) return;
      
      const { data, error } = await supabase
        .from('resguardos')
        .select('num_inventario, folio');
      
      if (!error && data) {
        const map: Record<string, string> = {};
        data.forEach(r => {
          if (r.num_inventario && r.folio) {
            map[r.num_inventario] = r.folio;
          }
        });
        setFoliosResguardo(map);
      } else {
        setFoliosResguardo({});
      }
    }
    fetchFolios();
  }, [muebles]);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Calculate pagination
  const totalFilteredCount = filteredMuebles.length;
  const totalPages = Math.ceil(totalFilteredCount / rowsPerPage);
  const paginatedMuebles = filteredMuebles.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <>
      <div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <div className={`h-full overflow-y-auto p-4 md:p-8 ${
          isDarkMode 
            ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
            : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
        }`}>
          <div className="w-full max-w-7xl mx-auto pb-8">
            {/* Header */}
            <div className={`flex justify-between items-center mb-8 pb-6 border-b ${
              isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}>
              <div>
                <h1 className="text-3xl font-light tracking-tight mb-1">
                  Levantamiento Unificado
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                  Consulta integrada de inventario INEA, ITEA y TLAXCALA
                </p>
              </div>
              <SectionRealtimeToggle
                sectionName="levantamiento"
                isConnected={realtimeConnected}
              />
            </div>

            {/* Search and filters */}
            <div className="mb-6 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={(term) => {
                      setSearchTerm(term);
                      setCurrentPage(1);
                      setShowSuggestions(true);
                    }}
                    suggestions={suggestions}
                    showSuggestions={showSuggestions}
                    highlightedIndex={highlightedIndex}
                    onSuggestionSelect={handleSuggestionSelect}
                    onKeyDown={handleInputKeyDown}
                    onBlur={handleInputBlur}
                    searchMatchType={searchMatchType}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <ExportButtons
                  onExcelClick={handleExcelClick}
                  onPDFClick={handlePDFClick}
                  onRefreshClick={reindex}
                  isCustomPDFEnabled={isCustomPDFEnabled}
                  loading={loading}
                  isDarkMode={isDarkMode}
                />
              </div>

              {activeFilters.length > 0 && (
                <FilterChips
                  activeFilters={activeFilters}
                  onRemoveFilter={removeFilter}
                  isDarkMode={isDarkMode}
                />
              )}
            </div>

            {/* Message banner */}
            {message && (
              <div className={`p-3 mb-4 rounded-lg border ${
                isDarkMode
                  ? message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    message.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                    message.type === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''
                  : message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                    message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
                    message.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                    message.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' : ''
              }`}>
                {message.text}
              </div>
            )}

            {/* Content */}
            <div>
              <LoadingStates
                loading={loading}
                error={inventoryError}
                isEmpty={filteredMuebles.length === 0}
                onRetry={reindex}
                isDarkMode={isDarkMode}
              />

              {!loading && !inventoryError && filteredMuebles.length > 0 && (
                <>
                  <InventoryTable
                    muebles={paginatedMuebles}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    foliosResguardo={foliosResguardo}
                    onFolioClick={handleFolioClick}
                    isDarkMode={isDarkMode}
                  />

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    rowsPerPage={rowsPerPage}
                    totalCount={totalFilteredCount}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    isDarkMode={isDarkMode}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scrollbar styles */}
        <style jsx>{`
          .scrollbar-thin {
            scrollbar-width: thin;
          }
          
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-track {
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
            border-radius: 3px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
            border-radius: 3px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
          }
        `}</style>
      </div>

      {/* Modals */}
      <ExportModal
        show={showExportModal}
        exportType={exportType}
        onConfirm={handleExport}
        onCancel={() => setShowExportModal(false)}
        loading={exporting}
        isDarkMode={isDarkMode}
      />

      <CustomPDFModal
        show={showAreaPDFModal}
        area={areaPDFTarget.area}
        director={areaPDFTarget.director}
        directorOptions={directorOptions}
        onConfirm={handleCustomPDFConfirm}
        onCancel={() => setShowAreaPDFModal(false)}
        onDirectorSelect={handleDirectorSelect}
        loading={areaPDFLoading}
        error={areaPDFError}
        recordCount={getFilteredMueblesForExportPDF().length}
        isDarkMode={isDarkMode}
      />

      <DirectorDataModal
        show={showDirectorDataModal}
        director={directorToUpdate}
        onSave={handleDirectorDataSave}
        onCancel={() => setShowDirectorDataModal(false)}
        loading={directorLoading}
        isDarkMode={isDarkMode}
      />

      <AreaSelectionModal
        show={showAreaSelectionModal}
        areaOptions={areaOptions}
        incompleteDirector={incompleteDirector}
        isDarkMode={isDarkMode}
        onClose={() => {
          setShowAreaSelectionModal(false);
          setIncompleteDirector(null);
          setAreaOptions([]);
        }}
        onSelectArea={handleAreaSelect}
      />

      <DirectorModal
        show={showDirectorModal}
        incompleteDirector={incompleteDirector}
        directorFormData={directorFormData}
        savingDirector={savingDirector}
        isDarkMode={isDarkMode}
        onClose={() => {
          setShowDirectorModal(false);
          setIncompleteDirector(null);
          setDirectorFormData({ area: '' });
        }}
        onSave={handleSaveDirectorArea}
        onAreaChange={(area) => setDirectorFormData({ area })}
      />
    </>
  );
}

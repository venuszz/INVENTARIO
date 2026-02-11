"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { generateResguardoPDF } from '../ResguardoPDFReport';
import { useUserRole } from "@/hooks/useUserRole";
import { useSession } from "@/hooks/useSession";
import { useTheme } from '@/context/ThemeContext';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useNoListadoIndexation } from '@/hooks/indexation/useNoListadoIndexation';
import { useResguardosCrearStore } from '@/stores/resguardosCrearStore';

// Import types
import { Mueble, Directorio, PdfData } from './types';

// Import hooks
import { useFolioGeneration } from './hooks/useFolioGeneration';
import { useResguardoForm } from './hooks/useResguardoForm';
import { useInventoryData } from './hooks/useInventoryData';
import { useItemSelection } from './hooks/useItemSelection';
import { useDirectorAutocomplete } from './hooks/useDirectorAutocomplete';
import { useSearchAndFilters } from './hooks/useSearchAndFilters';
import { usePagination } from './hooks/usePagination';
import { useResguardoSubmit } from './hooks/useResguardoSubmit';

// Import UI components
import { Header } from './components/Header';
import { FolioInfoPanel } from './components/FolioInfoPanel';
import { DataStatsPanel } from './components/DataStatsPanel';
import { SearchAndFilters } from './components/SearchAndFilters';
import { InventoryTable } from './components/InventoryTable';
import { Pagination } from './components/Pagination';
import { DirectorSelection } from './components/DirectorSelection';
import { AreaPuestoInputs } from './components/AreaPuestoInputs';
import { ResguardanteInput } from './components/ResguardanteInput';
import { SelectedItemsList } from './components/SelectedItemsList';
import { ActionButtons } from './components/ActionButtons';

// Import modals
import DirectorModal from './modals/DirectorModal';
import UsufinalConflictModal from './modals/UsufinalConflictModal';
import AreaConflictModal from './modals/AreaConflictModal';
import PDFDownloadModal from './modals/PDFDownloadModal';
import WarningModal from './modals/WarningModal';
import SelectAllErrorModal from './modals/SelectAllErrorModal';
import MissingDirectorDataAlert from './modals/MissingDirectorDataAlert';

/**
 * CrearResguardos Component
 * 
 * Main orchestrator component for creating resguardos (custody documents).
 * Integrates all custom hooks, UI components, and modals to provide a complete
 * workflow for selecting inventory items, assigning a director and custodian,
 * and generating PDF documents.
 */
export default function CrearResguardos() {
  const { isDarkMode } = useTheme();
  const { user } = useSession();
  const role = useUserRole();
  const isUsuario = role === "usuario";
  
  // Realtime connections
  const { muebles: ineaData, realtimeConnected: ineaConnected } = useIneaIndexation();
  const { muebles: iteaData, realtimeConnected: iteaConnected } = useIteaIndexation();
  const { muebles: noListadoData, realtimeConnected: noListadoConnected } = useNoListadoIndexation();

  // Refs
  const detailRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const directorInputRef = useRef<HTMLInputElement>(null);

  // State for directorio and areas
  const [directorio, setDirectorio] = useState<Directorio[]>([]);
  const [areas, setAreas] = useState<{ id_area: number; nombre: string }[]>([]);
  const [directorAreasMap, setDirectorAreasMap] = useState<{ [id_directorio: number]: number[] }>({});

  // State for sorting
  const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // State for director modal
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
  const [directorFormData, setDirectorFormData] = useState({ area: '', puesto: '' });
  const [savingDirector, setSavingDirector] = useState(false);
  const [showMissingDirectorDataError, setShowMissingDirectorDataError] = useState(false);
  const [directorInputDisabled, setDirectorInputDisabled] = useState(false);

  // State for alerts and messages
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSelectAllErrorModal, setShowSelectAllErrorModal] = useState(false);
  const [selectAllErrorMsg, setSelectAllErrorMsg] = useState('');

  // Initialize hooks
  const { folio, generateFolio, resetFolio, loadPreview } = useFolioGeneration();
  const { formData, setFormData, updateField, resetForm, isFormValid: formValid } = useResguardoForm(folio);
  const { allMuebles, loading, error: dataError, refetch, stats } = useInventoryData(sortField, sortDirection);
  
  // Get syncing state from store
  const syncingIds = useResguardosCrearStore(state => state.syncingIds) || [];
  const isSyncing = useResguardosCrearStore(state => state.isSyncing);
  
  const {
    selectedMuebles,
    toggleSelection,
    removeItem,
    clearSelection,
    updateItemResguardante,
    selectAllPage,
    areAllPageSelected,
    isSomePageSelected,
    canSelectAllPage,
    usufinalConflict,
    areaConflict,
    clearConflicts
  } = useItemSelection();

  const initialDirectorSuggestion = selectedMuebles.length > 0 
    ? (selectedMuebles[0]?.directorio?.nombre || '')
    : '';
  
  const {
    searchTerm,
    setSearchTerm,
    deferredSearchTerm,
    searchMatchType,
    activeFilters,
    addFilter,
    removeFilter,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    highlightedIndex,
    setHighlightedIndex,
    handleKeyDown: handleSearchKeyDown,
    handleBlur: handleSearchBlur,
    saveCurrentFilter
  } = useSearchAndFilters(allMuebles);

  const {
    searchTerm: directorSearchTerm,
    setSearchTerm: setDirectorSearchTerm,
    showSuggestions: showDirectorSuggestions,
    setShowSuggestions: setShowDirectorSuggestions,
    highlightedIndex: highlightedDirectorIndex,
    setHighlightedIndex: setHighlightedDirectorIndex,
    filteredDirectors,
    suggestedDirector: directorSugerido,
    forceShowAll: forceShowAllDirectors,
    setForceShowAll: setForceShowAllDirectors,
    handleKeyDown: handleDirectorKeyDown,
    handleBlur: handleDirectorBlur
  } = useDirectorAutocomplete(directorio, initialDirectorSuggestion);

  // Apply filters to get filtered muebles
  const filteredMuebles = React.useMemo(() => {
    const term = deferredSearchTerm.toLowerCase().trim();
    
    return allMuebles.filter(item => {
      if (activeFilters.length === 0 && !term) return true;

      // Apply active filters
      const passesActiveFilters = activeFilters.every(filter => {
        const filterTerm = filter.term.toLowerCase();
        if (!filterTerm) return true;

        // Helper to get string value from relational field
        const getAreaValue = (area: typeof item.area): string => {
          if (!area) return '';
          return typeof area === 'object' ? area.nombre.toLowerCase() : '';
        };
        
        const getDirectorValue = (directorio: typeof item.directorio): string => {
          if (!directorio) return '';
          return typeof directorio === 'object' ? directorio.nombre.toLowerCase() : '';
        };

        switch (filter.type) {
          case 'id': return (item.id_inv?.toLowerCase() || '').includes(filterTerm);
          case 'descripcion': return (item.descripcion?.toLowerCase() || '').includes(filterTerm);
          case 'rubro': return (item.rubro?.toLowerCase() || '').includes(filterTerm);
          case 'estado': return (item.estado?.toLowerCase() || '').includes(filterTerm);
          case 'estatus': return (item.estatus?.toLowerCase() || '').includes(filterTerm);
          case 'area': return getAreaValue(item.area).includes(filterTerm);
          case 'director': return getDirectorValue(item.directorio).includes(filterTerm);
          default: return true;
        }
      });

      if (!passesActiveFilters) return false;

      // Apply current search term
      if (!term) return true;

      const getAreaValue = (area: typeof item.area): string => {
        if (!area) return '';
        return typeof area === 'object' ? area.nombre.toLowerCase() : '';
      };
      
      const getDirectorValue = (directorio: typeof item.directorio): string => {
        if (!directorio) return '';
        return typeof directorio === 'object' ? directorio.nombre.toLowerCase() : '';
      };

      return (
        (item.id_inv?.toLowerCase() || '').includes(term) ||
        (item.descripcion?.toLowerCase() || '').includes(term) ||
        (item.rubro?.toLowerCase() || '').includes(term) ||
        (item.estado?.toLowerCase() || '').includes(term) ||
        (item.estatus?.toLowerCase() || '').includes(term) ||
        getAreaValue(item.area).includes(term) ||
        getDirectorValue(item.directorio).includes(term)
      );
    });
  }, [allMuebles, deferredSearchTerm, activeFilters]);

  const {
    currentPage,
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage,
    totalPages,
    paginatedItems: paginatedMuebles
  } = usePagination(filteredMuebles, 10);

  const {
    handleSubmit: submitResguardo,
    loading: submitting,
    error: submitError,
    successMessage: submitSuccess,
    pdfData,
    showPDFButton,
    setShowPDFButton,
    generatePDF: handleGeneratePDF,
    generatingPDF
  } = useResguardoSubmit(formData, selectedMuebles, directorio, generateFolio, () => {
    // On success callback
    clearSelection();
    resetForm();
    loadPreview(); // Load preview of next folio (doesn't increment)
    setDirectorInputDisabled(false);
  });

  // Get areas for selected director
  const getAreasForDirector = useCallback((directorId: string) => {
    if (!directorId) return [];
    const id = parseInt(directorId);
    const areaIds = directorAreasMap[id] || [];
    return areas.filter(a => areaIds.includes(a.id_area));
  }, [directorAreasMap, areas]);

  // Handle item selection with director autocomplete logic
  const handleToggleSelection = useCallback((mueble: Mueble) => {
    const isAlreadySelected = selectedMuebles.some(m => m.id === mueble.id);
    
    // Call the hook's toggle function
    toggleSelection(mueble);
    
    // If deselecting, clear form
    if (isAlreadySelected) {
      const newSelectedMuebles = selectedMuebles.filter(m => m.id !== mueble.id);
      if (newSelectedMuebles.length === 0) {
        setFormData(prev => ({ ...prev, directorId: '', area: '', puesto: '', resguardante: '' }));
        setDirectorInputDisabled(false);
      }
      return;
    }
    
    // If selecting the first item, try to autocomplete director
    if (selectedMuebles.length === 0) {
      // Get director value from relational field
      const directorValue = mueble.directorio?.nombre;
      
      const matchingDirector = directorio.find(dir => 
        dir.nombre?.toLowerCase() === directorValue?.toLowerCase()
      );
      
      if (matchingDirector) {
        const areasForDirector = getAreasForDirector(matchingDirector.id_directorio.toString());
        
        // If director is missing puesto or areas, show modal
        if (!matchingDirector.puesto || !areasForDirector.length) {
          setIncompleteDirector(matchingDirector);
          setDirectorFormData({ 
            area: areasForDirector.length > 0 ? areasForDirector[0].nombre : '', 
            puesto: matchingDirector.puesto || '' 
          });
          setShowDirectorModal(true);
          setShowMissingDirectorDataError(false);
          setFormData(prev => ({ 
            ...prev, 
            directorId: matchingDirector.id_directorio.toString(), 
            area: '', 
            puesto: '' 
          }));
          setDirectorInputDisabled(true);
          return;
        }
        
        // Director is complete, autocomplete form
        setFormData(prev => ({
          ...prev,
          directorId: matchingDirector.id_directorio.toString(),
          area: areasForDirector.length > 0 ? areasForDirector[0].nombre : '',
          puesto: matchingDirector.puesto || ''
        }));
        setDirectorInputDisabled(true);
        setShowMissingDirectorDataError(false);
      } else {
        // No matching director found
        setFormData(prev => ({ ...prev, directorId: '', area: '', puesto: '' }));
        setDirectorInputDisabled(false);
        setShowMissingDirectorDataError(false);
      }
    }
    
    // Scroll to details panel on mobile
    if (window.innerWidth < 768 && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [selectedMuebles, toggleSelection, directorio, getAreasForDirector, setFormData]);

  // Computed values
  const isFormValid = formValid && selectedMuebles.length > 0;
  // Disable all inputs when items are selected (data comes from relational IDs)
  const inputsDisabled = selectedMuebles.length > 0;

  // Fetch directorio and areas on mount
  useEffect(() => {
    const fetchDirectorioAndAreas = async () => {
      try {
        const { data: directorioData, error: dirError } = await supabase
          .from('directorio')
          .select('*')
          .order('nombre', { ascending: true });

        if (dirError) throw dirError;

        if (directorioData) {
          const formattedDirectorio = directorioData.map(item => ({
            id_directorio: item.id_directorio,
            nombre: item.nombre?.trim().toUpperCase() || '',
            area: item.area?.trim().toUpperCase() || null,
            puesto: item.puesto?.trim().toUpperCase() || null
          }));
          setDirectorio(formattedDirectorio);
        }

        const { data: areasData, error: areasError } = await supabase
          .from('area')
          .select('*')
          .order('nombre', { ascending: true });

        if (areasError) throw areasError;
        if (areasData) setAreas(areasData);

        const { data: relData, error: relError } = await supabase
          .from('directorio_areas')
          .select('*');

        if (relError) throw relError;

        if (relData) {
          const map: { [id_directorio: number]: number[] } = {};
          relData.forEach((rel: { id_directorio: number, id_area: number }) => {
            if (!map[rel.id_directorio]) map[rel.id_directorio] = [];
            map[rel.id_directorio].push(rel.id_area);
          });
          setDirectorAreasMap(map);
        }
      } catch (err) {
        console.error('Error fetching directorio/areas:', err);
      }
    };

    fetchDirectorioAndAreas();
  }, []);

  // Load folio preview on mount (doesn't increment counter)
  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  // Update error state from data loading
  useEffect(() => {
    if (dataError) setError(dataError);
  }, [dataError]);

  // Update error state from submission
  useEffect(() => {
    if (submitError) setError(submitError);
  }, [submitError]);

  // Update success message from submission
  useEffect(() => {
    if (submitSuccess) {
      setSuccessMessage(submitSuccess);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [submitSuccess]);

  // Handle sorting
  const handleSort = useCallback((field: keyof Mueble) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Check if there's an area mismatch
  const hasAreaMismatch = React.useMemo(() => {
    if (!formData.area || selectedMuebles.length === 0) return false;
    return selectedMuebles.some(m => {
      if (!m.area) return false;
      const areaValue = typeof m.area === 'object' ? m.area.nombre : m.area;
      return areaValue !== formData.area;
    });
  }, [formData.area, selectedMuebles]);

  // Get area suggestion from selected items
  const areaSuggestion = React.useMemo(() => {
    if (selectedMuebles.length === 0) return null;
    const firstArea = selectedMuebles[0]?.area;
    if (!firstArea) return null;
    
    const firstAreaValue = typeof firstArea === 'object' ? firstArea.nombre : firstArea;
    const allSameArea = selectedMuebles.every(m => {
      if (!m.area) return false;
      const areaValue = typeof m.area === 'object' ? m.area.nombre : m.area;
      return areaValue === firstAreaValue;
    });
    
    return allSameArea ? firstAreaValue : null;
  }, [selectedMuebles]);

  // Handle director selection from suggestions
  const handleDirectorSuggestionClick = useCallback((director: Directorio) => {
    console.log('[DIRECTOR] Seleccionado:', director.nombre || 'Sin nombre');
    
    if (!director.area || !director.puesto) {
      console.log('[DIRECTOR] Faltan datos, abriendo modal');
      setIncompleteDirector(director);
      setDirectorFormData({ area: director.area || '', puesto: director.puesto || '' });
      setShowDirectorModal(true);
      setShowMissingDirectorDataError(false);
      setFormData(prev => ({ ...prev, directorId: director.id_directorio.toString(), area: '', puesto: '' }));
    } else {
      setFormData(prev => ({
        ...prev,
        directorId: director.id_directorio.toString(),
        area: director.area || '',
        puesto: director.puesto || ''
      }));
      setDirectorSearchTerm(director.nombre || '');
      setShowMissingDirectorDataError(false);
    }
    
    setShowDirectorSuggestions(false);
    setDirectorInputDisabled(true);
  }, [setFormData]);

  // Handle director input change
  const handleDirectorInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDirectorSearchTerm(value);
    setShowDirectorSuggestions(true);
    
    if (!value) {
      setFormData(prev => ({ ...prev, directorId: '', area: '', puesto: '' }));
      setShowMissingDirectorDataError(false);
    }
  }, [setFormData]);

  // Save director info from modal
  const saveDirectorInfo = useCallback(async () => {
    if (!incompleteDirector || !directorFormData.area || !directorFormData.puesto) return;

    setSavingDirector(true);
    try {
      const areaNombre = directorFormData.area.trim().toUpperCase();
      let id_area: number | null = null;
      
      // 1. Buscar o crear el área
      const { data: existingAreas, error: searchError } = await supabase
        .from('area')
        .select('id_area, nombre')
        .ilike('nombre', areaNombre);
      
      if (searchError) throw searchError;
      
      if (existingAreas && existingAreas.length > 0) {
        id_area = existingAreas[0].id_area;
      } else {
        // Crear nueva área
        const { data: newArea, error: createError } = await supabase
          .from('area')
          .insert({ nombre: areaNombre })
          .select('id_area')
          .single();
        
        if (createError) throw createError;
        id_area = newArea.id_area;
      }

      // 2. Actualizar solo el puesto del director
      const { error: updateError } = await supabase
        .from('directorio')
        .update({ puesto: directorFormData.puesto.trim().toUpperCase() })
        .eq('id_directorio', incompleteDirector.id_directorio);
      
      if (updateError) throw updateError;

      // 3. Eliminar relaciones viejas
      const { error: deleteError } = await supabase
        .from('directorio_areas')
        .delete()
        .eq('id_directorio', incompleteDirector.id_directorio);
      
      if (deleteError) throw deleteError;

      // 4. Insertar nueva relación
      const { error: insertError } = await supabase
        .from('directorio_areas')
        .insert({ 
          id_directorio: incompleteDirector.id_directorio, 
          id_area 
        });
      
      if (insertError) throw insertError;

      // 5. Actualizar estado local
      if (id_area === null) throw new Error('No se pudo obtener el ID del área');
      
      setDirectorio(prev => prev.map(d =>
        d.id_directorio === incompleteDirector.id_directorio
          ? { ...d, puesto: directorFormData.puesto.trim().toUpperCase() }
          : d
      ));
      
      // Actualizar el mapa de relaciones
      setDirectorAreasMap(prev => ({
        ...prev,
        [incompleteDirector.id_directorio]: [id_area]
      }));
      
      // Actualizar áreas si es nueva
      if (!areas.find(a => a.id_area === id_area)) {
        setAreas(prev => [...prev, { id_area, nombre: areaNombre }]);
      }
      
      setFormData(prev => ({
        ...prev,
        directorId: incompleteDirector.id_directorio.toString(),
        area: areaNombre,
        puesto: directorFormData.puesto.trim().toUpperCase()
      }));
      setShowDirectorModal(false);
      setSuccessMessage('Información del director actualizada correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating director:', err);
      setError('Error al actualizar la información del director');
    } finally {
      setSavingDirector(false);
    }
  }, [incompleteDirector, directorFormData, setFormData, areas]);

  // Handle closing director modal
  const handleCloseDirectorModal = useCallback(() => {
    if (!directorFormData.area || !directorFormData.puesto) {
      setFormData(prev => ({ ...prev, directorId: '', area: '', puesto: '' }));
      setDirectorSearchTerm('');
      setShowMissingDirectorDataError(true);
    }
    setShowDirectorModal(false);
  }, [directorFormData, setFormData]);

  // Handle select all page
  const handleSelectAllPage = useCallback(() => {
    const canAdd = canSelectAllPage(paginatedMuebles);
    if (!canAdd) {
      setSelectAllErrorMsg('No puedes seleccionar todos los artículos de la página porque no pertenecen al mismo responsable o área.');
      setShowSelectAllErrorModal(true);
      return;
    }
    selectAllPage(paginatedMuebles);
  }, [paginatedMuebles, canSelectAllPage, selectAllPage]);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    clearSelection();
    setFormData(prev => ({
      ...prev,
      resguardante: '',
      area: '',
      puesto: '',
      directorId: ''
    }));
    setDirectorInputDisabled(false);
  }, [clearSelection, setFormData]);

  // Handle PDF modal close
  const handlePDFModalClose = useCallback(() => {
    const hasPdfBeenDownloaded = sessionStorage.getItem('pdfDownloaded') === 'true';
    if (!hasPdfBeenDownloaded) {
      setShowWarningModal(true);
    } else {
      setShowPDFButton(false);
    }
  }, [setShowPDFButton]);

  // Handle warning modal confirm
  const handleWarningConfirm = useCallback(() => {
    setShowWarningModal(false);
    setShowPDFButton(false);
  }, [setShowPDFButton]);

  return (
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
          <Header
            selectedCount={selectedMuebles.length}
            ineaConnected={ineaConnected}
            iteaConnected={iteaConnected}
            noListadoConnected={noListadoConnected}
          />

          {/* Main container */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
            {/* Left panel - Muebles table */}
            <div className="lg:col-span-3 space-y-6">
              <FolioInfoPanel
                folio={folio}
                directorName={
                  formData.directorId
                    ? directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre || ''
                    : ''
                }
                onResetFolio={resetFolio}
              />

              {/* Data statistics panel */}
              <DataStatsPanel
                ineaTotal={stats.ineaTotal}
                ineaTotalWithBaja={stats.ineaTotalWithBaja}
                ineaActive={stats.ineaActive}
                ineaBaja={stats.ineaBaja}
                iteaTotal={stats.iteaTotal}
                iteaActive={stats.iteaActive}
                iteaInactive={stats.iteaInactive}
                tlaxcalaTotal={stats.tlaxcalaTotal}
                totalRaw={stats.totalRaw}
                excludedByStatus={stats.excludedByStatus}
                excludedByResguardo={stats.excludedByResguardo}
                availableCount={stats.availableCount}
                filteredCount={filteredMuebles.length}
                hasActiveFilters={activeFilters.length > 0 || searchTerm.length > 0}
              />

              {/* Search and filters */}
              <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                suggestions={suggestions}
                showSuggestions={showSuggestions}
                highlightedIndex={highlightedIndex}
                onSuggestionClick={(index: number) => {
                  const suggestion = suggestions[index];
                  if (suggestion) {
                    addFilter({ term: suggestion.value, type: suggestion.type });
                    setSearchTerm('');
                    setShowSuggestions(false);
                  }
                }}
                onKeyDown={handleSearchKeyDown}
                onBlur={handleSearchBlur}
                onSaveFilter={saveCurrentFilter}
                searchMatchType={searchMatchType}
                inputRef={searchInputRef}
                onShowSuggestionsChange={setShowSuggestions}
                onHighlightChange={setHighlightedIndex}
                totalRecords={filteredMuebles.length}
                activeFilters={activeFilters}
                onRemoveFilter={removeFilter}
              />

              <InventoryTable
                items={paginatedMuebles}
                selectedItems={selectedMuebles}
                onToggleSelection={handleToggleSelection}
                onSelectAllPage={handleSelectAllPage}
                areAllPageSelected={areAllPageSelected(paginatedMuebles)}
                isSomePageSelected={isSomePageSelected(paginatedMuebles)}
                canSelectAllPage={canSelectAllPage(paginatedMuebles)}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                loading={loading}
                error={dataError}
                onRetry={refetch}
                searchTerm={searchTerm}
                onClearSearch={() => setSearchTerm('')}
                syncingIds={syncingIds}
              />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={setRowsPerPage}
              />
            </div>

            {/* Right panel - Details */}
            <div ref={detailRef} className="lg:col-span-2 space-y-6">
              <div className={`rounded-lg border p-4 ${
                isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/10'
              }`}>
                <h2 className={`text-sm font-medium mb-4 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Información del Resguardo
                </h2>

                <DirectorSelection
                  value={directorSearchTerm}
                  onChange={(value: string) => handleDirectorInputChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
                  onFocus={() => { setShowDirectorSuggestions(true); setForceShowAllDirectors(false); }}
                  onKeyDown={handleDirectorKeyDown}
                  onBlur={handleDirectorBlur}
                  disabled={inputsDisabled}
                  suggestions={filteredDirectors}
                  showSuggestions={showDirectorSuggestions}
                  highlightedIndex={highlightedDirectorIndex}
                  onSuggestionClick={handleDirectorSuggestionClick}
                  suggestedDirector={directorSugerido}
                  showAllDirectors={forceShowAllDirectors}
                  onShowAllDirectors={() => {
                  setShowDirectorSuggestions(true);
                  setForceShowAllDirectors(true);
                  setHighlightedDirectorIndex(-1);
                }}
                inputRef={directorInputRef}
                initialSuggestion={initialDirectorSuggestion}
                selectedDirectorId={formData.directorId}
                directorio={directorio}
                onHighlightChange={setHighlightedDirectorIndex}
                forceShowAll={forceShowAllDirectors}
              />

              <AreaPuestoInputs
                puesto={formData.puesto}
                area={formData.area}
                onPuestoChange={(value: string) => updateField('puesto', value)}
                onAreaChange={(value: string) => updateField('area', value)}
                disabled={inputsDisabled}
                availableAreas={getAreasForDirector(formData.directorId)}
                hasAreaMismatch={hasAreaMismatch}
                areaSuggestion={areaSuggestion}
                onAcceptAreaSuggestion={() => {
                  if (areaSuggestion) updateField('area', areaSuggestion);
                }}
                directorSelected={!!formData.directorId}
              />

              <ResguardanteInput
                value={formData.resguardante}
                onChange={(value: string) => updateField('resguardante', value)}
                disabled={inputsDisabled}
              />
            </div>

            <SelectedItemsList
              items={selectedMuebles}
              onRemoveItem={removeItem}
              onUpdateItemResguardante={updateItemResguardante}
              onClearAll={handleClearSelection}
              syncingIds={syncingIds}
            />

            <ActionButtons
              onClear={handleClearSelection}
              onSave={submitResguardo}
              canClear={selectedMuebles.length > 0}
              canSave={isFormValid}
              isSaving={submitting}
              selectedCount={selectedMuebles.length}
            />
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

      {/* Error Alert */}
      {error && (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 px-4 py-3 rounded-lg shadow-lg border z-50 backdrop-blur-sm animate-fade-in ${
          isDarkMode ? 'bg-red-900/80 text-red-100 border-red-800' : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          <div className="flex items-center">
            <AlertTriangle className={`h-5 w-5 mr-3 flex-shrink-0 animate-pulse ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              title='Cerrar alerta'
              onClick={() => setError(null)}
              className={`ml-4 flex-shrink-0 p-1 rounded-full transition-colors ${
                isDarkMode ? 'text-red-200 hover:text-white hover:bg-red-800' : 'text-red-600 hover:text-red-800 hover:bg-red-100'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 px-4 py-3 rounded-lg shadow-lg border z-50 backdrop-blur-sm animate-fade-in ${
          isDarkMode ? 'bg-green-900/80 text-green-100 border-green-800' : 'bg-green-50 text-green-900 border-green-200'
        }`}>
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className={`ml-4 flex-shrink-0 p-1 rounded-full transition-colors ${
                isDarkMode ? 'text-green-200 hover:text-white hover:bg-green-800' : 'text-green-600 hover:text-green-800 hover:bg-green-100'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <MissingDirectorDataAlert
        show={showMissingDirectorDataError}
        onComplete={() => setShowDirectorModal(true)}
      />

      <DirectorModal
        show={showDirectorModal}
        director={incompleteDirector}
        area={directorFormData.area}
        puesto={directorFormData.puesto}
        onAreaChange={(value) => setDirectorFormData(prev => ({ ...prev, area: value }))}
        onPuestoChange={(value) => setDirectorFormData(prev => ({ ...prev, puesto: value }))}
        onSave={saveDirectorInfo}
        onClose={handleCloseDirectorModal}
        isSaving={savingDirector}
        isUsuario={isUsuario}
      />

      <UsufinalConflictModal
        show={!!usufinalConflict}
        conflictUsufinal={usufinalConflict || ''}
        onClose={clearConflicts}
      />

      <AreaConflictModal
        show={!!areaConflict}
        conflictArea={areaConflict || ''}
        onClose={clearConflicts}
      />

      <PDFDownloadModal
        show={showPDFButton}
        pdfData={pdfData}
        onDownload={handleGeneratePDF}
        onClose={handlePDFModalClose}
        isGenerating={generatingPDF}
      />

      <WarningModal
        show={showWarningModal}
        onConfirm={handleWarningConfirm}
        onCancel={() => setShowWarningModal(false)}
      />

      <SelectAllErrorModal
        show={showSelectAllErrorModal}
        message={selectAllErrorMsg}
        onClose={() => setShowSelectAllErrorModal(false)}
      />
    </div>
  );
}
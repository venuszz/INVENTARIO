"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { generateResguardoPDF } from '../ResguardoPDFReport';
import { useUserRole } from "@/hooks/useUserRole";
import { useSession } from "@/hooks/useSession";
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/context/ThemeContext';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useNoListadoIndexation } from '@/hooks/indexation/useNoListadoIndexation';

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
import { FilterChips } from './components/FilterChips';
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
  const { createNotification } = useNotifications();
  
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
  const { folio, generateFolio, resetFolio } = useFolioGeneration();
  const { formData, setFormData, updateField, resetForm, isFormValid: formValid } = useResguardoForm(folio);
  const { allMuebles, loading, error: dataError, refetch, stats } = useInventoryData(sortField, sortDirection);
  
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

  const initialDirectorSuggestion = selectedMuebles.length > 0 ? (selectedMuebles[0]?.usufinal || '') : '';
  
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

        switch (filter.type) {
          case 'id': return (item.id_inv?.toLowerCase() || '').includes(filterTerm);
          case 'descripcion': return (item.descripcion?.toLowerCase() || '').includes(filterTerm);
          case 'rubro': return (item.rubro?.toLowerCase() || '').includes(filterTerm);
          case 'estado': return (item.estado?.toLowerCase() || '').includes(filterTerm);
          case 'estatus': return (item.estatus?.toLowerCase() || '').includes(filterTerm);
          case 'area': return (item.area?.toLowerCase() || '').includes(filterTerm);
          case 'usufinal': return (item.usufinal?.toLowerCase() || '').includes(filterTerm);
          case 'resguardante': return (item.resguardante?.toLowerCase() || '').includes(filterTerm);
          default: return true;
        }
      });

      if (!passesActiveFilters) return false;

      // Apply current search term
      if (!term) return true;

      return (
        (item.id_inv?.toLowerCase() || '').includes(term) ||
        (item.descripcion?.toLowerCase() || '').includes(term) ||
        (item.rubro?.toLowerCase() || '').includes(term) ||
        (item.estado?.toLowerCase() || '').includes(term) ||
        (item.estatus?.toLowerCase() || '').includes(term) ||
        (item.area?.toLowerCase() || '').includes(term) ||
        (item.usufinal?.toLowerCase() || '').includes(term) ||
        (item.resguardante?.toLowerCase() || '').includes(term)
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
  } = useResguardoSubmit(formData, selectedMuebles, directorio, () => {
    // On success callback
    clearSelection();
    resetForm();
    generateFolio();
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
      const matchingDirector = directorio.find(dir => dir.nombre.toLowerCase() === mueble.usufinal?.toLowerCase());
      
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
  const inputsDisabled = selectedMuebles.length > 0 && directorInputDisabled;

  // Fetch directorio and areas on mount
  useEffect(() => {
    const fetchDirectorioAndAreas = async () => {
      try {
        // Usar el proxy para acceder a las tablas protegidas
        const [dirRes, areasRes, relRes] = await Promise.all([
          fetch('/api/supabase-proxy?target=/rest/v1/directorio?select=*&order=nombre.asc', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          }),
          fetch('/api/supabase-proxy?target=/rest/v1/area?select=*&order=nombre.asc', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          }),
          fetch('/api/supabase-proxy?target=/rest/v1/directorio_areas?select=*', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          })
        ]);

        if (dirRes.ok) {
          const dirData = await dirRes.json();
          setDirectorio(dirData || []);
        }

        if (areasRes.ok) {
          const areasData = await areasRes.json();
          setAreas(areasData || []);
        }
        
        if (relRes.ok) {
          const rels = await relRes.json();
          
          if (rels) {
            const map: { [id_directorio: number]: number[] } = {};
            rels.forEach((rel: { id_directorio: number, id_area: number }) => {
              if (!map[rel.id_directorio]) map[rel.id_directorio] = [];
              map[rel.id_directorio].push(rel.id_area);
            });
            setDirectorAreasMap(map);
          }
        }
      } catch (err) {
        console.error('Error fetching directorio/areas:', err);
      }
    };

    fetchDirectorioAndAreas();
  }, []);

  // Generate folio on mount
  useEffect(() => {
    generateFolio();
  }, [generateFolio]);

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
    return selectedMuebles.some(m => m.area && m.area !== formData.area);
  }, [formData.area, selectedMuebles]);

  // Get area suggestion from selected items
  const areaSuggestion = React.useMemo(() => {
    if (selectedMuebles.length === 0) return null;
    const firstArea = selectedMuebles[0]?.area;
    if (!firstArea) return null;
    const allSameArea = selectedMuebles.every(m => m.area === firstArea);
    return allSameArea ? firstArea : null;
  }, [selectedMuebles]);

  // Handle director selection from suggestions
  const handleDirectorSuggestionClick = useCallback((director: Directorio) => {
    console.log('[DIRECTOR] Seleccionado:', director.nombre);
    
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
      setDirectorSearchTerm(director.nombre);
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
      // 1. Buscar o crear el área
      const areaNombre = directorFormData.area.trim();
      let id_area: number | null = null;
      
      // Buscar área por nombre usando el proxy
      const areaSearchResponse = await fetch(
        `/api/supabase-proxy?target=/rest/v1/area?select=id_area&nombre=eq.${encodeURIComponent(areaNombre)}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!areaSearchResponse.ok) throw new Error('Error buscando área');
      
      const areaData = await areaSearchResponse.json();
      
      if (!areaData || areaData.length === 0) {
        // Si no existe, crearla
        const createAreaResponse = await fetch(
          '/api/supabase-proxy?target=/rest/v1/area',
          {
            method: 'POST',
            credentials: 'include',
            headers: { 
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ nombre: areaNombre })
          }
        );
        
        if (!createAreaResponse.ok) throw new Error('Error creando área');
        
        const newArea = await createAreaResponse.json();
        id_area = newArea[0].id_area;
      } else {
        id_area = areaData[0].id_area;
      }

      // 2. Actualizar solo el puesto
      const updateDirectorResponse = await fetch(
        `/api/supabase-proxy?target=/rest/v1/directorio?id_directorio=eq.${incompleteDirector.id_directorio}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ puesto: directorFormData.puesto })
        }
      );
      
      if (!updateDirectorResponse.ok) throw new Error('Error actualizando director');

      // 3. Eliminar relaciones viejas
      await fetch(
        `/api/supabase-proxy?target=/rest/v1/directorio_areas?id_directorio=eq.${incompleteDirector.id_directorio}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // 4. Insertar nueva relación
      const createRelResponse = await fetch(
        '/api/supabase-proxy?target=/rest/v1/directorio_areas',
        {
          method: 'POST',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ 
            id_directorio: incompleteDirector.id_directorio, 
            id_area 
          })
        }
      );
      
      if (!createRelResponse.ok) throw new Error('Error creando relación');

      // 5. Actualizar estado local (solo si id_area no es null)
      if (id_area === null) throw new Error('No se pudo obtener el ID del área');
      
      setDirectorio(prev => prev.map(d =>
        d.id_directorio === incompleteDirector.id_directorio
          ? { ...d, puesto: directorFormData.puesto }
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
        puesto: directorFormData.puesto
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
  }, [incompleteDirector, directorFormData, setFormData]);

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
    <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <div className={`w-full mx-auto rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border ${
        isDarkMode ? 'bg-black border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <Header
          selectedCount={selectedMuebles.length}
          ineaConnected={ineaConnected}
          iteaConnected={iteaConnected}
          noListadoConnected={noListadoConnected}
        />

        {/* Main container */}
        <div className="grid grid-cols-1 lg:grid-cols-5 h-full flex-1">
          {/* Left panel - Muebles table */}
          <div className="flex-1 min-w-0 flex flex-col p-4 lg:col-span-3">
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

            {/* Search and filters container */}
            <div className={`mb-6 p-4 rounded-xl border shadow-inner hover:shadow-lg transition-shadow ${
              isDarkMode
                ? 'bg-gray-900/30 border-gray-800'
                : 'bg-gray-50/50 border-gray-200'
            }`}>
              <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                suggestions={suggestions}
                showSuggestions={showSuggestions}
                highlightedIndex={highlightedIndex}
                onSuggestionClick={(index: number) => {
                  const suggestion = suggestions[index];
                  if (suggestion) {
                    setSearchTerm(suggestion.value);
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
              />

              <FilterChips
                filters={activeFilters}
                onRemoveFilter={removeFilter}
                onClearAll={() => {
                  activeFilters.forEach((_, index) => removeFilter(index));
                }}
              />

              <div className={`flex items-center gap-2 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <RefreshCw
                  className={`h-4 w-4 cursor-pointer transition-colors ${loading ? 'animate-spin' : ''} ${
                    isDarkMode
                      ? 'text-white hover:text-gray-300'
                      : 'text-gray-900 hover:text-gray-700'
                  }`}
                  onClick={() => refetch()}
                />
                <span>Total: <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {filteredMuebles.length}
                </span> registros</span>
              </div>
            </div>

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
          <div ref={detailRef} className={`flex-1 p-4 border-t lg:border-t-0 lg:border-l flex flex-col lg:col-span-2 ${
            isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50/30 border-gray-200'
          }`}>
            <div className={`rounded-xl border p-4 mb-4 shadow-inner hover:shadow-lg transition-shadow ${
              isDarkMode ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  Información del Resguardo
                </span>
              </h2>

              <DirectorSelection
                value={directorSearchTerm}
                onChange={(value: string) => handleDirectorInputChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
                onFocus={() => { setShowDirectorSuggestions(true); setForceShowAllDirectors(false); }}
                onKeyDown={handleDirectorKeyDown}
                onBlur={handleDirectorBlur}
                disabled={inputsDisabled || directorInputDisabled}
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
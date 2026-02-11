"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSession } from '@/hooks/useSession';
import { useUserRole } from '@/hooks/useUserRole';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useIteaStore } from '@/stores/iteaStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useColorManagement } from '@/hooks/useColorManagement';

// Import custom hooks
import { useResguardoData } from './hooks/useResguardoData';
import { useAreaManagement } from './hooks/useAreaManagement';
import { useDirectorManagement } from './hooks/useDirectorManagement';
import { useSearchAndFilters } from './hooks/useSearchAndFilters';
import { useItemEdit } from './hooks/useItemEdit';

// Import components
import Header from './components/Header';
import ValueStatsPanel from './components/ValueStatsPanel';
import SearchBar from './components/SearchBar';
import FilterChips from './components/FilterChips';
import InventoryTable from './components/InventoryTable';
import DetailPanel from './components/DetailPanel';
import Pagination from './components/Pagination';

// Import modals
import InactiveModal from './modals/InactiveModal';
import BajaModal from './modals/BajaModal';
import AreaSelectionModal from './modals/AreaSelectionModal';
import DirectorModal from './modals/DirectorModal';
import ColorAssignmentModal from './modals/ColorAssignmentModal';

// Import types
import { Mueble, Message, FilterOptions, Directorio, Area } from './types';
import { Save, X, Edit, AlertTriangle, Trash2, Plus, Palette } from 'lucide-react';

export default function ConsultasIteaGeneral() {
  const { isDarkMode } = useTheme();
  const { user } = useSession();
  const userRole = useUserRole();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  // Initialize indexation hook
  const { muebles, isIndexing, realtimeConnected, reindex } = useIteaIndexation();
  const syncingIds = useIteaStore(state => state.syncingIds) || [];
  const isSyncing = useIteaStore(state => state.isSyncing);

  // Initialize color management hook
  const { colors, assignColor, removeColor, getColorById, getColorHex } = useColorManagement();

  // Color assignment modal state
  const [showColorModal, setShowColorModal] = useState(false);
  const [isAssigningColor, setIsAssigningColor] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state (managed by useSearchAndFilters)
  const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter options state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    estados: [],
    estatus: [],
    areas: [],
    rubros: [],
    formasAdq: [],
    directores: []
  });

  // Director modal states
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
  const [directorFormData, setDirectorFormData] = useState({ area: '' });
  const [savingDirector, setSavingDirector] = useState(false);

  // Area selection modal states
  const [showAreaSelectModal, setShowAreaSelectModal] = useState(false);
  const [areaOptionsForDirector, setAreaOptionsForDirector] = useState<Area[]>([]);

  // Message state
  const [message, setMessage] = useState<Message | null>(null);

  // Store full director data
  const [directorioData, setDirectorioData] = useState<Directorio[]>([]);

  // Initialize resguardo data hook
  const { foliosResguardo, resguardoDetalles } = useResguardoData(muebles);

  // Initialize area management hook
  const { areas, directorAreasMap } = useAreaManagement();

  // Initialize director management hook
  const { fetchDirectorio, fetchFilterOptions } = useDirectorManagement();

  // Initialize search and filters hook
  const {
    searchTerm,
    setSearchTerm,
    searchMatchType,
    activeFilters,
    suggestions,
    highlightedIndex,
    showSuggestions,
    filteredMueblesOmni,
    saveCurrentFilter,
    removeFilter,
    clearAllFilters,
    handleSuggestionClick,
    handleInputKeyDown,
    handleInputBlur
  } = useSearchAndFilters(muebles);

  // Initialize item edit hook
  const {
    selectedItem,
    isEditing,
    editFormData,
    setEditFormData,
    imagePreview,
    uploading,
    showBajaModal,
    setShowBajaModal,
    bajaCause,
    setBajaCause,
    showInactiveModal,
    setShowInactiveModal,
    handleSelectItem,
    handleStartEdit,
    cancelEdit,
    closeDetail,
    handleImageChange,
    saveChanges,
    handleEditFormChange,
    markAsBaja,
    confirmBaja,
    markAsInactive,
    confirmMarkAsInactive
  } = useItemEdit();

  // Load filter options and directorio on mount
  useEffect(() => {
    const loadData = async () => {
      const options = await fetchFilterOptions();
      const directores = await fetchDirectorio();
      
      setFilterOptions({
        estados: options.estados || [],
        estatus: options.estatus || [],
        areas: [],
        rubros: options.rubros || [],
        formasAdq: options.formasAdq || [],
        directores: directores.map(d => ({ nombre: d.nombre || '', area: d.area || '' }))
      });
      
      // Store full director data separately for selection logic
      setDirectorioData(directores);
    };
    loadData();
  }, [fetchFilterOptions, fetchDirectorio]);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle director selection
  const handleSelectDirector = (idDirectorio: number) => {
    const selected = directorioData.find(d => d.id_directorio === idDirectorio);
    if (!selected) return;

    const areaIds = directorAreasMap[selected.id_directorio] || [];
    const areasForDirector = areas.filter(a => areaIds.includes(a.id_area));

    if (areasForDirector.length === 0) {
      setIncompleteDirector(selected);
      setDirectorFormData({ area: '' });
      setShowDirectorModal(true);
      return;
    }

    if (areasForDirector.length > 1) {
      setAreaOptionsForDirector(areasForDirector);
      setIncompleteDirector(selected);
      setShowAreaSelectModal(true);
      return;
    }

    if (editFormData) {
      setEditFormData(prev => ({
        ...prev!,
        id_directorio: selected.id_directorio,
        id_area: areasForDirector[0].id_area,
        directorio: { 
          id_directorio: selected.id_directorio, 
          nombre: selected.nombre || '', 
          puesto: selected.puesto || '' 
        },
        area: { id_area: areasForDirector[0].id_area, nombre: areasForDirector[0].nombre }
      }) as Mueble);
    }
  };

  // Save director info
  const saveDirectorInfo = async () => {
    if (!incompleteDirector || !directorFormData.area) return;

    setSavingDirector(true);
    try {
      const areaName = directorFormData.area.trim().toUpperCase();
      let areaId: number | null = null;
      
      const checkAreaResponse = await fetch(
        '/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/area?nombre=ilike.${areaName}&select=id_area,nombre`),
        { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
      );
      
      if (checkAreaResponse.ok) {
        const existingAreas = await checkAreaResponse.json();
        if (existingAreas && existingAreas.length > 0) {
          areaId = existingAreas[0].id_area;
        }
      }
      
      if (!areaId) {
        const createAreaResponse = await fetch(
          '/api/supabase-proxy?target=' + encodeURIComponent('/rest/v1/area?select=id_area'),
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
            body: JSON.stringify({ nombre: areaName })
          }
        );
        
        if (!createAreaResponse.ok) throw new Error('Error al crear área');
        const newArea = await createAreaResponse.json();
        areaId = newArea[0].id_area;
      }

      if (areaId) {
        const checkRelResponse = await fetch(
          '/api/supabase-proxy?target=' + encodeURIComponent(
            `/rest/v1/directorio_areas?id_directorio=eq.${incompleteDirector.id_directorio}&id_area=eq.${areaId}&select=id`
          ),
          { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
        );
        
        if (checkRelResponse.ok) {
          const existingRels = await checkRelResponse.json();
          
          if (!existingRels || existingRels.length === 0) {
            await fetch(
              '/api/supabase-proxy?target=' + encodeURIComponent('/rest/v1/directorio_areas'),
              {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                body: JSON.stringify({
                  id_directorio: incompleteDirector.id_directorio,
                  id_area: areaId
                })
              }
            );
          }
        }

        if (editFormData) {
          setEditFormData(prev => ({
            ...prev!,
            id_directorio: incompleteDirector.id_directorio,
            id_area: areaId,
            directorio: { 
              id_directorio: incompleteDirector.id_directorio, 
              nombre: incompleteDirector.nombre || '', 
              puesto: incompleteDirector.puesto || '' 
            },
            area: { id_area: areaId, nombre: areaName }
          }) as Mueble);
        }
      }

      setShowDirectorModal(false);
      setMessage({ type: 'success', text: 'Información del director actualizada correctamente' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al actualizar la información del director' });
      console.error(err);
    } finally {
      setSavingDirector(false);
    }
  };

  // Handle color assignment
  const handleAssignColor = async (colorId: string) => {
    if (!selectedItem) return;
    
    setIsAssigningColor(true);
    try {
      const success = await assignColor(selectedItem.id, colorId);
      if (success) {
        setMessage({ type: 'success', text: 'Color asignado correctamente' });
        setShowColorModal(false);
        // The realtime subscription will update the UI automatically
      } else {
        setMessage({ type: 'error', text: 'Error al asignar el color' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al asignar el color' });
    } finally {
      setIsAssigningColor(false);
    }
  };

  // Handle color removal
  const handleRemoveColor = async () => {
    if (!selectedItem) return;
    
    setIsAssigningColor(true);
    try {
      const success = await removeColor(selectedItem.id);
      if (success) {
        setMessage({ type: 'success', text: 'Color removido correctamente' });
        setShowColorModal(false);
        // The realtime subscription will update the UI automatically
      } else {
        setMessage({ type: 'error', text: 'Error al remover el color' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al remover el color' });
    } finally {
      setIsAssigningColor(false);
    }
  };

  // Sort filtered muebles
  const sortedMuebles = useMemo(() => {
    const sorted = [...filteredMueblesOmni];
    sorted.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredMueblesOmni, sortField, sortDirection]);

  // Calculate pagination
  const totalFilteredCount = sortedMuebles.length;
  const totalPages = Math.ceil(totalFilteredCount / rowsPerPage);
  const paginatedMuebles = sortedMuebles.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Handle sorting
  const handleSort = (field: keyof Mueble) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  // Handle item selection
  const onItemSelect = (item: Mueble) => {
    handleSelectItem(item);
  };

  return (
    <>
      <div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <motion.div 
          className={`h-full overflow-y-auto p-4 md:p-8 ${
            isDarkMode 
              ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
              : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full max-w-7xl mx-auto pb-8">
            {/* Header */}
            <Header isDarkMode={isDarkMode} realtimeConnected={realtimeConnected} onReindex={reindex} />

            {/* Value Stats Panel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ValueStatsPanel
                filteredCount={totalFilteredCount}
                totalCount={muebles.length}
                filteredValue={sortedMuebles.reduce((sum, m) => sum + (parseFloat(m.valor || '0') || 0), 0)}
                totalValue={muebles.reduce((sum, m) => sum + (parseFloat(m.valor || '0') || 0), 0)}
                hasActiveFilters={activeFilters.length > 0 || searchTerm.length > 0}
                isDarkMode={isDarkMode}
              />
            </motion.div>

            {/* Message Banner */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 mb-4 rounded-lg border ${
                    isDarkMode
                      ? message.type === 'success'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : message.type === 'error'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : message.type === 'warning'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : message.type === 'success'
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : message.type === 'error'
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : message.type === 'warning'
                      ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Bar - Siempre ocupa todo el ancho */}
            <motion.div 
              className="mb-6 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    searchMatchType={searchMatchType}
                    showSuggestions={showSuggestions}
                    suggestions={suggestions}
                    highlightedIndex={highlightedIndex}
                    onSuggestionClick={handleSuggestionClick}
                    onKeyDown={handleInputKeyDown}
                    onBlur={handleInputBlur}
                    isDarkMode={isDarkMode}
                    inputRef={inputRef}
                  />
                </div>
                <motion.button
                  onClick={saveCurrentFilter}
                  disabled={!searchTerm || !searchMatchType}
                  className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm font-light tracking-tight transition-all ${searchTerm && searchMatchType
                    ? (isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                      : 'bg-black/5 hover:bg-black/10 border-black/10 text-black'
                    )
                    : (isDarkMode
                      ? 'bg-white/[0.02] border-white/10 text-white/20 cursor-not-allowed'
                      : 'bg-black/[0.02] border-black/10 text-black/20 cursor-not-allowed'
                    )
                    }`}
                  title="Agregar filtro actual a la lista de filtros activos"
                  whileHover={searchTerm && searchMatchType ? { scale: 1.02 } : {}}
                  whileTap={searchTerm && searchMatchType ? { scale: 0.98 } : {}}
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              </div>
              
              {/* Filtros activos */}
              {activeFilters.length > 0 && (
                <FilterChips
                  activeFilters={activeFilters}
                  onRemoveFilter={removeFilter}
                  onClearAll={clearAllFilters}
                  isDarkMode={isDarkMode}
                />
              )}
            </motion.div>

            {/* Main Content */}
            <motion.div 
              className={selectedItem 
                ? "grid grid-cols-1 lg:grid-cols-2 gap-6" 
                : "w-full"
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Table Section */}
              <div className={`flex-1 min-w-0 flex flex-col ${selectedItem ? '' : 'w-full'}`}>
                <div className={selectedItem ? 'h-[600px]' : ''}>
                  <InventoryTable
                    muebles={muebles}
                    paginatedMuebles={paginatedMuebles}
                    loading={isIndexing}
                    error={null}
                    selectedItem={selectedItem}
                    foliosResguardo={Object.fromEntries(
                      Object.entries(foliosResguardo).filter(([_, v]) => v !== null)
                    ) as Record<string, string>}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    isDarkMode={isDarkMode}
                    onSort={handleSort}
                    onSelectItem={onItemSelect}
                    syncingIds={syncingIds}
                  />
                </div>
                
                {/* Pagination pegada a la tabla */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  rowsPerPage={rowsPerPage}
                  totalCount={totalFilteredCount}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Detail Panel */}
              {selectedItem && (
                <AnimatePresence mode="wait">
                  <motion.div 
                    className="flex flex-col"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DetailPanel
                      selectedItem={selectedItem}
                      detailRef={detailRef}
                      isEditing={isEditing}
                      editFormData={editFormData}
                      imagePreview={imagePreview}
                      uploading={uploading}
                      filterOptions={filterOptions}
                      directorio={directorioData}
                      foliosResguardo={Object.fromEntries(
                        Object.entries(foliosResguardo).filter(([_, v]) => v !== null)
                      ) as Record<string, string>}
                      resguardoDetalles={resguardoDetalles}
                      onClose={closeDetail}
                      onImageChange={handleImageChange}
                      onFormChange={handleEditFormChange}
                      onSelectDirector={handleSelectDirector}
                      isDarkMode={isDarkMode}
                      isSyncing={selectedItem ? (Array.isArray(syncingIds) && syncingIds.includes(selectedItem.id)) : false}
                    />
                    
                    {/* Action Buttons - mismo diseño que Pagination */}
                    <div className={`mt-6 flex items-center justify-end gap-2 px-4 py-3 ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {isEditing ? (
                        <>
                          <motion.button
                            onClick={saveChanges}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-light tracking-tight transition-all ${
                              isDarkMode
                                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Save className="h-3.5 w-3.5" />
                            Guardar
                          </motion.button>
                          <motion.button
                            onClick={cancelEdit}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-light tracking-tight transition-all ${
                              isDarkMode
                                ? 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                                : 'bg-black/[0.02] border-black/10 text-black/60 hover:bg-black/5 hover:text-black'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                          </motion.button>
                        </>
                      ) : (
                        userRole && ['admin', 'superadmin'].includes(userRole) && (
                          <>
                            <motion.button
                              onClick={() => setShowColorModal(true)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-light tracking-tight transition-all ${
                                isDarkMode
                                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                  : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Palette className="h-3.5 w-3.5" />
                              Color
                            </motion.button>
                            <motion.button
                              onClick={handleStartEdit}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-light tracking-tight transition-all ${
                                isDarkMode
                                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                  : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Editar
                            </motion.button>
                            <motion.button
                              onClick={markAsInactive}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-light tracking-tight transition-all ${
                                isDarkMode
                                  ? 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                                  : 'bg-black/[0.02] border-black/10 text-black/60 hover:bg-black/5 hover:text-black'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Inactivo
                            </motion.button>
                            <motion.button
                              onClick={markAsBaja}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-light tracking-tight transition-all ${
                                isDarkMode
                                  ? 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                                  : 'bg-black/[0.02] border-black/10 text-black/60 hover:bg-black/5 hover:text-black'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Dar de Baja
                            </motion.button>
                          </>
                        )
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>
          </div>
        </motion.div>

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
      <InactiveModal
        show={showInactiveModal}
        selectedItem={selectedItem}
        onConfirm={confirmMarkAsInactive}
        onClose={() => setShowInactiveModal(false)}
        isDarkMode={isDarkMode}
      />

      <BajaModal
        show={showBajaModal}
        selectedItem={selectedItem}
        bajaCause={bajaCause}
        onCauseChange={setBajaCause}
        onConfirm={() => confirmBaja(user)}
        onClose={() => setShowBajaModal(false)}
        isDarkMode={isDarkMode}
      />

      <AreaSelectionModal
        show={showAreaSelectModal}
        areaOptions={areaOptionsForDirector}
        incompleteDirector={incompleteDirector}
        isDarkMode={isDarkMode}
        onSelectArea={(area: Area) => {
          if (editFormData && incompleteDirector) {
            setEditFormData((prev) => ({
              ...prev!,
              id_directorio: incompleteDirector.id_directorio,
              id_area: area.id_area,
              directorio: {
                id_directorio: incompleteDirector.id_directorio,
                nombre: incompleteDirector.nombre || '',
                puesto: incompleteDirector.puesto || ''
              },
              area: { id_area: area.id_area, nombre: area.nombre }
            }) as Mueble);
          }
          setShowAreaSelectModal(false);
        }}
        onClose={() => setShowAreaSelectModal(false)}
      />

      <DirectorModal
        show={showDirectorModal}
        incompleteDirector={incompleteDirector}
        directorFormData={directorFormData}
        savingDirector={savingDirector}
        onAreaChange={(area: string) => setDirectorFormData({ area })}
        onSave={saveDirectorInfo}
        onClose={() => setShowDirectorModal(false)}
        isDarkMode={isDarkMode}
      />

      <ColorAssignmentModal
        show={showColorModal}
        itemIdInv={selectedItem?.id_inv || null}
        currentColor={selectedItem?.colores ? getColorById(selectedItem.color) : null}
        colors={colors}
        onAssign={handleAssignColor}
        onRemove={handleRemoveColor}
        onClose={() => setShowColorModal(false)}
        isDarkMode={isDarkMode}
        isAssigning={isAssigningColor}
      />
    </>
  );
}

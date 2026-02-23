"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useIneaObsoletosIndexation } from '@/hooks/indexation/useIneaObsoletosIndexation';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Import custom hooks
import { useSearchAndFilters } from '@/components/consultas/inea/hooks/useSearchAndFilters';
import { useItemEdit } from './hooks/useItemEdit';
import { useDirectorManagement } from './hooks/useDirectorManagement';
import { useAreaManagement } from './hooks/useAreaManagement';
import { useBajaInfo } from './hooks/useBajaInfo';
import { useURLParamHandler } from '@/hooks/useURLParamHandler';

// Import components
import { Header } from './components/Header';
import { ValueStatsPanel } from './components/ValueStatsPanel';
import { SearchBar } from './components/SearchBar';
import FilterChips from '@/components/consultas/inea/components/FilterChips';
import SuggestionDropdown from '@/components/consultas/inea/components/SuggestionDropdown';
import { InventoryTable } from './components/InventoryTable';
import { DetailPanel } from './components/DetailPanel';
import { Pagination } from './components/Pagination';

// Import modals
import { ReactivarModal } from './modals/ReactivarModal';
import { DirectorModal } from './modals/DirectorModal';
import { AreaSelectionModal } from './modals/AreaSelectionModal';

// Import types
import { Mueble, Message, FilterOptions, Directorio } from './types';
import { Edit, Save, X, RotateCw, Plus } from 'lucide-react';

export default function ConsultasIneaObsoletos() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const userRole = useUserRole();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Initialize indexation hook
  const { muebles, isIndexing, realtimeConnected, reindex: reindexObsoletos } = useIneaObsoletosIndexation();
  const syncingIds: string[] = [];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Sorting state
  const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Message state
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter options state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    estados: [],
    estatus: [],
    areas: [],
    rubros: [],
    formadq: [],
    directores: []
  });

  // Initialize search and filters hook
  // Initialize search and filters hook with empty folios map (obsoletos don't have resguardos)
  const emptyFoliosMap = useMemo(() => ({}), []);
  
  const {
    searchTerm,
    setSearchTerm,
    searchMatchType,
    activeFilters,
    filteredMueblesOmni,
    suggestions,
    highlightedIndex,
    showSuggestions,
    saveCurrentFilter,
    removeFilter,
    clearAllFilters,
    handleSuggestionClick,
    handleInputKeyDown,
    handleInputBlur
  } = useSearchAndFilters(muebles, emptyFoliosMap);

  // Initialize item edit hook
  const {
    selectedItem,
    isEditing,
    editFormData,
    imagePreview,
    uploading,
    isSaving,
    showReactivarModal,
    reactivating,
    detailRef,
    handleSelectItem,
    handleStartEdit,
    cancelEdit,
    closeDetail,
    handleImageChange,
    saveChanges,
    handleEditFormChange,
    setShowReactivarModal,
    reactivarArticulo,
    setSelectedItem,
  } = useItemEdit({
    muebles,
    fetchMuebles: reindexObsoletos,
    sortField,
    sortDirection,
    searchTerm,
    filters: { estado: '', area: '', rubro: '' },
    rowsPerPage,
    setCurrentPage,
    setMessage,
    setLoading,
  });

  // Initialize area management hook
  const { areas, directorAreasMap } = useAreaManagement();

  // Initialize director management hook
  const {
    directorio,
    showDirectorModal,
    incompleteDirector,
    directorFormData,
    savingDirector,
    showAreaSelectModal,
    areaOptionsForDirector,
    fetchDirectorio,
    fetchFilterOptions,
    handleSelectDirector: handleSelectDirectorHook,
    saveDirectorInfo,
    setShowDirectorModal,
    setDirectorFormData,
    setShowAreaSelectModal,
    handleAreaSelection,
  } = useDirectorManagement({
    setMessage,
    setFilterOptions,
  });

  // Initialize baja info hook
  const { bajaInfo, loading: bajaInfoLoading, error: bajaInfoError } = useBajaInfo({
    selectedItem,
    isEditing,
  });

  // Initialize URL parameter handler
  const { paramNotFound, foundItem, clearParamNotFound } = useURLParamHandler({
    paramName: 'id',
    items: muebles,
    isLoading: isIndexing,
    getItemKey: (item) => item.id,
    onItemSelect: handleSelectItem
  });

  // Load directorio and filter options on mount
  useEffect(() => {
    const loadData = async () => {
      const options = await fetchFilterOptions();
      await fetchDirectorio();
      
      setFilterOptions(prev => ({
        ...prev,
        estados: options.estados || [],
        rubros: options.rubros || [],
        estatus: options.estatus || [],
        formadq: options.formadq || []
      }));
    };
    loadData();
  }, [fetchDirectorio, fetchFilterOptions]);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle URL parameter not found
  useEffect(() => {
    if (paramNotFound) {
      setMessage({
        type: 'warning',
        text: 'El bien buscado no se encontró en los datos actuales'
      });
      clearParamNotFound();
    }
  }, [paramNotFound, clearParamNotFound]);

  // Handle director selection wrapper
  const handleSelectDirector = (nombre: string) => {
    handleSelectDirectorHook(nombre, selectedItem, editFormData, (data) => {
      // This is a workaround since editFormData is read-only from the hook
      // The actual update happens inside the hook
    }, setSelectedItem);
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

  // Navigate to the correct page when item is found via URL parameter
  useEffect(() => {
    if (foundItem && sortedMuebles.length > 0) {
      // Find the index of the item in the sorted and filtered list
      const itemIndex = sortedMuebles.findIndex(
        (item) => item.id === foundItem.id
      );
      
      if (itemIndex !== -1) {
        // Calculate which page the item is on
        const correctPage = Math.floor(itemIndex / rowsPerPage) + 1;
        setCurrentPage(correctPage);
      }
    }
  }, [foundItem, sortedMuebles, rowsPerPage]);

  // Reset to page 1 when filters change and current page is out of range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalFilteredCount, currentPage, totalPages]);

  // Calculate filtered value
  const filteredValue = sortedMuebles.reduce((sum, m) => 
    sum + (typeof m.valor === 'number' ? m.valor : parseFloat(m.valor || '0') || 0), 0
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

  return (
    <>
      <div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <motion.div 
          className={`h-full overflow-y-auto p-[2vw] md:p-[3vw] lg:p-[2vw] ${
            isDarkMode 
              ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
              : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full max-w-[95vw] mx-auto pb-[2vw]">
            {/* Header */}
            <Header 
              isDarkMode={isDarkMode}
              realtimeConnected={realtimeConnected}
            />

            {/* Value Stats Panel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ValueStatsPanel
                filteredCount={totalFilteredCount}
                totalValue={filteredValue}
                loading={isIndexing}
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
              className="mb-[1.5vw] space-y-[0.75vw]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex gap-[0.5vw]">
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
                  className={`px-[1vw] py-[0.5vw] rounded-lg border flex items-center gap-[0.5vw] text-[0.875rem] font-light tracking-tight transition-all ${searchTerm && searchMatchType
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
                  <Plus className="h-[1vw] w-[1vw] min-h-[14px] min-w-[14px]" />
                </motion.button>
              </div>
              
              {/* Filtros activos */}
              {activeFilters.length > 0 && (
                <FilterChips
                  activeFilters={activeFilters}
                  removeFilter={removeFilter}
                  clearAllFilters={clearAllFilters}
                  isDarkMode={isDarkMode}
                />
              )}
            </motion.div>
            {/* Main Content */}
            <motion.div 
              className={selectedItem 
                ? "grid grid-cols-1 lg:grid-cols-2 gap-[1.5vw] items-start" 
                : "w-full"
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Table Section */}
              <div className={`flex-1 min-w-0 flex flex-col ${selectedItem ? '' : 'w-full'}`}>
                <div className={selectedItem ? 'h-[150vh] flex flex-col' : ''}>
                  <InventoryTable
                    muebles={muebles}
                    paginatedMuebles={paginatedMuebles}
                    loading={isIndexing}
                    error={null}
                    selectedItem={selectedItem}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    isDarkMode={isDarkMode}
                    onSort={handleSort}
                    onSelectItem={handleSelectItem}
                    onRetry={reindexObsoletos}
                    onClearFilters={clearAllFilters}
                    hasActiveFilters={activeFilters.length > 0 || searchTerm.length > 0}
                    syncingIds={syncingIds}
                  />
                </div>
                
                {/* Pagination */}
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
                    className="flex flex-col h-[150vh]"
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
                      isSaving={isSaving}
                      filterOptions={filterOptions}
                      directorio={directorio}
                      bajaInfo={bajaInfo}
                      bajaInfoLoading={bajaInfoLoading}
                      onClose={closeDetail}
                      onImageChange={handleImageChange}
                      onFormChange={handleEditFormChange}
                      onSelectDirector={handleSelectDirector}
                      onStartEdit={handleStartEdit}
                      onSaveChanges={saveChanges}
                      onCancelEdit={cancelEdit}
                      onReactivate={() => setShowReactivarModal(true)}
                      isDarkMode={isDarkMode}
                      isSyncing={selectedItem ? (Array.isArray(syncingIds) && syncingIds.includes(selectedItem.id)) : false}
                      saving={loading}
                    />
                    
                    {/* Action Buttons */}
                    <div className={`mt-[1.5vw] flex items-center justify-end gap-[0.5vw] px-[1vw] py-[0.75vw] ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {isEditing ? (
                        <>
                          <motion.button
                            onClick={saveChanges}
                            disabled={isSaving}
                            className={`flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] rounded-lg border text-[0.875rem] font-light tracking-tight transition-all ${
                              isSaving
                                ? isDarkMode
                                  ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                                  : 'bg-black/5 border-black/10 text-black/40 cursor-not-allowed'
                                : isDarkMode
                                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                  : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
                            }`}
                            whileHover={!isSaving ? { scale: 1.02 } : {}}
                            whileTap={!isSaving ? { scale: 0.98 } : {}}
                          >
                            {isSaving ? (
                              <>
                                <div className="h-[0.875vw] w-[0.875vw] min-h-[12px] min-w-[12px] border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <Save className="h-[0.875vw] w-[0.875vw] min-h-[12px] min-w-[12px]" />
                                Guardar
                              </>
                            )}
                          </motion.button>
                          <motion.button
                            onClick={cancelEdit}
                            disabled={isSaving}
                            className={`flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] rounded-lg border text-[0.875rem] font-light tracking-tight transition-all ${
                              isSaving
                                ? isDarkMode
                                  ? 'bg-white/[0.02] border-white/10 text-white/30 cursor-not-allowed'
                                  : 'bg-black/[0.02] border-black/10 text-black/30 cursor-not-allowed'
                                : isDarkMode
                                  ? 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                                  : 'bg-black/[0.02] border-black/10 text-black/60 hover:bg-black/5 hover:text-black'
                            }`}
                            whileHover={!isSaving ? { scale: 1.02 } : {}}
                            whileTap={!isSaving ? { scale: 0.98 } : {}}
                          >
                            <X className="h-[0.875vw] w-[0.875vw] min-h-[12px] min-w-[12px]" />
                            Cancelar
                          </motion.button>
                        </>
                      ) : (
                        userRole && ['admin', 'superadmin'].includes(userRole) && (
                          <>
                            <motion.button
                              onClick={handleStartEdit}
                              className={`flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] rounded-lg border text-[0.875rem] font-light tracking-tight transition-all ${
                                isDarkMode
                                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                  : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Edit className="h-[0.875vw] w-[0.875vw] min-h-[12px] min-w-[12px]" />
                              Editar
                            </motion.button>
                            <motion.button
                              onClick={() => setShowReactivarModal(true)}
                              className={`flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] rounded-lg border text-[0.875rem] font-light tracking-tight transition-all ${
                                isDarkMode
                                  ? 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                                  : 'bg-black/[0.02] border-black/10 text-black/60 hover:bg-black/5 hover:text-black'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <RotateCw className="h-[0.875vw] w-[0.875vw] min-h-[12px] min-w-[12px]" />
                              Reactivar
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
      <ReactivarModal
        show={showReactivarModal}
        selectedItem={selectedItem}
        reactivating={reactivating}
        onConfirm={reactivarArticulo}
        onClose={() => setShowReactivarModal(false)}
        isDarkMode={isDarkMode}
      />

      <AreaSelectionModal
        show={showAreaSelectModal}
        areaOptions={areaOptionsForDirector}
        incompleteDirector={incompleteDirector}
        isDarkMode={isDarkMode}
        onSelectArea={(area: string) => {
          handleAreaSelection(area, editFormData, selectedItem, (data) => {
            // Workaround for read-only editFormData
          }, setSelectedItem);
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
    </>
  );
}

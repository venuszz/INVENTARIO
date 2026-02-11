'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, Plus } from 'lucide-react';

// Types
import type { 
  MuebleITEA, 
  FilterOptions, 
  FilterState, 
  Message,
  Directorio
} from './types';

// Hooks
import { useIteaObsoletosIndexation } from '@/hooks/indexation/useIteaObsoletosIndexation';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  useAreaManagement,
  useBajaInfo,
  useDirectorManagement,
  useItemEdit,
  useSearchAndFilters
} from './hooks';

// Components
import {
  Header,
  ValueStatsPanel,
  InventoryTable,
  DetailPanel,
  Pagination,
  SearchBar,
  FilterChips,
  SuggestionDropdown
} from './components';

// Modals
import {
  ReactivarModal,
  DirectorModal,
  AreaSelectionModal
} from './modals';

/**
 * ITEA Obsoletos Component
 * 
 * Main component for managing ITEA obsolete/deprecated inventory items.
 * Displays items that have been marked as "BAJA" (deprecated).
 */
export default function IteaObsoletosComponent() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = useUserRole();

  // Indexation and data
  const {
    muebles: mueblesOmni,
    isIndexing: loadingOmni,
    error: errorOmni,
    realtimeConnected,
    reindex
  } = useIteaObsoletosIndexation();
  const syncingIds: string[] = [];

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<keyof MuebleITEA>('id_inv');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
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
  } = useSearchAndFilters(mueblesOmni);

  // Custom hooks
  const { areas, directorAreasMap, fetchAreas } = useAreaManagement();
  
  const {
    directorio,
    showDirectorModal,
    incompleteDirector,
    directorFormData,
    savingDirector,
    showAreaSelectModal,
    areaOptionsForDirector,
    setShowDirectorModal,
    setDirectorFormData,
    setShowAreaSelectModal,
    fetchDirectorio,
    handleSelectDirector: handleSelectDirectorBase,
    saveDirectorInfo,
    handleAreaSelection
  } = useDirectorManagement();

  const {
    selectedItem,
    isEditing,
    editFormData,
    imageFile,
    imagePreview,
    uploading,
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
    setEditFormData
  } = useItemEdit({
    muebles: mueblesOmni,
    fetchMuebles: reindex,
    sortField,
    sortDirection,
    searchTerm,
    filters: { estado: '', area: '', rubro: '' },
    rowsPerPage,
    setCurrentPage,
    setMessage,
    setLoading
  });

  const { bajaInfo, loading: bajaInfoLoading } = useBajaInfo(selectedItem, isEditing);

  // Part 6: Effect hooks for fetching directors and areas on mount
  useEffect(() => {
    fetchDirectorio(setFilterOptions);
  }, [fetchDirectorio]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  // Part 8: Sorting logic with useMemo (using filteredMueblesOmni from hook)
  const sortedMuebles = useMemo(() => {
    const sorted = [...filteredMueblesOmni];
    
    sorted.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      // Handle null/undefined values
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      // Numeric comparison
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [filteredMueblesOmni, sortField, sortDirection]);

  // Part 9: Pagination calculations
  const totalFilteredCount = sortedMuebles.length;
  const totalPages = Math.ceil(totalFilteredCount / rowsPerPage);
  const paginatedMuebles = sortedMuebles.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const filteredValue = sortedMuebles.reduce((sum, m) => 
    sum + (typeof m.valor === 'number' ? m.valor : parseFloat(m.valor?.toString() || '0') || 0), 
    0
  );

  // Part 10: Handler functions
  const handleSort = (field: keyof MuebleITEA) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  // Part 11: Wrapper for handleSelectDirector
  const handleSelectDirector = (director: Directorio) => {
    handleSelectDirectorBase(director, selectedItem, editFormData, (data) => {
      // The actual update happens inside the hook
      // This callback is for compatibility
    }, setSelectedItem);
  };

  // Part 12: Message auto-dismiss effect
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Task 19: URL parameter handling for direct item linking
  useEffect(() => {
    const itemId = searchParams.get('id');
    if (itemId && sortedMuebles.length > 0) {
      const itemIndex = sortedMuebles.findIndex(m => m.id === itemId);
      if (itemIndex !== -1) {
        const targetPage = Math.floor(itemIndex / rowsPerPage) + 1;
        setCurrentPage(targetPage);
        
        setTimeout(() => {
          const item = sortedMuebles[itemIndex];
          handleSelectItem(item);
          
          if (detailRef.current) {
            detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [searchParams, sortedMuebles, rowsPerPage, handleSelectItem, detailRef]);

  // Clear URL parameter when closing detail
  useEffect(() => {
    if (!selectedItem && searchParams.get('id')) {
      router.replace('/consultas/itea/obsoletos', { scroll: false });
    }
  }, [selectedItem, searchParams, router]);

  // Part 13: Main JSX structure - Container, Header, ValueStatsPanel, Message Banner
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
                loading={loadingOmni}
                isDarkMode={isDarkMode}
              />
            </motion.div>

            {/* Search Bar with Plus Button */}
            <motion.div 
              className="mb-6 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex gap-2 relative">
                <div className="flex-1 relative">
                  <SearchBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    searchMatchType={searchMatchType}
                    handleInputKeyDown={handleInputKeyDown}
                    handleInputBlur={handleInputBlur}
                    isDarkMode={isDarkMode}
                  />
                  {/* Suggestion Dropdown */}
                  {showSuggestions && (
                    <SuggestionDropdown
                      suggestions={suggestions}
                      highlightedIndex={highlightedIndex}
                      onSuggestionClick={handleSuggestionClick}
                      isDarkMode={isDarkMode}
                    />
                  )}
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
              
              {/* Active Filters */}
              {activeFilters.length > 0 && (
                <FilterChips
                  activeFilters={activeFilters}
                  removeFilter={removeFilter}
                  clearAllFilters={clearAllFilters}
                  isDarkMode={isDarkMode}
                />
              )}
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
                    muebles={mueblesOmni}
                    paginatedMuebles={paginatedMuebles}
                    loading={loadingOmni}
                    error={errorOmni}
                    selectedItem={selectedItem}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    isDarkMode={isDarkMode}
                    onSort={handleSort}
                    onSelectItem={handleSelectItem}
                    onRetry={reindex}
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
        onSelectArea={(area) => {
          handleAreaSelection(area, selectedItem, editFormData, (data) => {
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
        onAreaChange={(area: string) => setDirectorFormData({ ...directorFormData, areaName: area })}
        onSave={() => saveDirectorInfo(setFilterOptions, selectedItem, editFormData, (data) => {
          // Workaround for read-only editFormData
        }, setSelectedItem)}
        onClose={() => setShowDirectorModal(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
}

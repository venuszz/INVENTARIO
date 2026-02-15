"use client";
import { useEffect, useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useUserRole } from "@/hooks/useUserRole";
import { useResguardosBajasIndexation } from '@/hooks/indexation/useResguardosBajasIndexation';
import supabase from '@/app/lib/supabase/client';

// Hooks
import { useBajasData } from './hooks/useBajasData';
import { useBajaDetails } from './hooks/useBajaDetails';
import { useSearchAndFilters } from './hooks/useSearchAndFilters';
import { useBajaDelete } from './hooks/useBajaDelete';
import { usePDFGeneration } from './hooks/usePDFGeneration';
import { useItemSelection } from './hooks/useItemSelection';

// Components
import { Header } from './components/Header';
import { SearchAndFilters } from './components/SearchAndFilters';
import { Pagination } from './components/Pagination';
import { BajasTable } from './components/BajasTable';
import { BajaDetailsPanel } from './components/BajaDetailsPanel';
import { ArticulosListPanel } from './components/ArticulosListPanel';

// Modals
import { PDFDownloadModal } from './modals/PDFDownloadModal';
import { DeleteModal } from './modals/DeleteModal';
import { ErrorAlert } from './modals/ErrorAlert';

// Types
import type { DeleteType, ItemToDelete } from './types';

const ConsultarBajasResguardos = () => {
  // Theme and user
  const { isDarkMode } = useTheme();
  const userRole = useUserRole();
  const { realtimeConnected } = useResguardosBajasIndexation();
  const searchParams = useSearchParams();
  
  // Refs
  const detailRef = useRef<HTMLDivElement>(null);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize hooks - order matters!
  // First, initialize search hook with empty data (will be populated after first fetch)
  const searchAndFilters = useSearchAndFilters([]);

  const {
    bajas,
    allBajas,
    loading: bajasLoading,
    error: bajasError,
    currentPage,
    rowsPerPage,
    totalCount,
    sortField,
    sortDirection,
    totalPages,
    foliosUnicos,
    fetchBajas,
    setCurrentPage,
    setRowsPerPage,
    setSort,
    refetch: refetchBajas,
    setAllBajas
  } = useBajasData({ 
    activeFilters: searchAndFilters.activeFilters
  });

  const {
    selectedBaja,
    groupedItems,
    loading: detailsLoading,
    error: detailsError,
    fetchBajaDetails,
    clearSelection,
    getArticuloCount
  } = useBajaDetails(allBajas);

  const {
    deleting,
    error: deleteError,
    pdfBajaData: deletePdfData,
    deleteFolio,
    deleteSelected,
    deleteSingle,
    clearPdfBajaData: clearDeletePdfData
  } = useBajaDelete({ 
    allBajas, 
    selectedBaja, 
    onSuccess: () => {
      refetchBajas();
      clearSelection();
    }
  });

  const {
    pdfBajaData,
    generating,
    error: pdfError,
    preparePDFData,
    generatePDF: generatePDFHook,
    clearPDFData
  } = usePDFGeneration();

  const {
    selectedItems,
    selectedCount,
    hasSelection,
    handleItemSelection,
    handleGroupSelection,
    clearSelections,
    getSelectedItemsGroupedByFolio
  } = useItemSelection();

  // Modal states
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<DeleteType | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const [folioParamLoading, setFolioParamLoading] = useState(false);

  // Combined loading and error states
  const loading = bajasLoading || detailsLoading || deleting || generating;
  const error = bajasError || detailsError || deleteError || pdfError;

  // Effect: Load folio from URL parameter
  useEffect(() => {
    const folioParam = searchParams?.get('folio');
    if (folioParam) {
      setFolioParamLoading(true);
      fetchBajaDetails(folioParam)
        .then(() => {
          if (detailRef.current) {
            detailRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        })
        .catch((error) => {
          console.error('Error en fetchBajaDetails:', error);
        })
        .finally(() => {
          setFolioParamLoading(false);
        });
    }
  }, [searchParams, fetchBajaDetails]);

  // Effect: Update search hook data when allBajas changes
  useEffect(() => {
    searchAndFilters.updateData(allBajas);
  }, [allBajas, searchAndFilters]);

  // Effect: Fetch bajas when filters change
  // Note: fetchBajas already handles activeFilters internally, so we only need to call it once
  useEffect(() => {
    fetchBajas();
  }, [fetchBajas]);

  // Event handlers
  const handleFolioClick = useCallback((folioResguardo: string) => {
    fetchBajaDetails(folioResguardo);
  }, [fetchBajaDetails]);

  const handleSort = useCallback((field: 'id' | 'folio_resguardo' | 'f_resguardo' | 'dir_area') => {
    setSort(field);
  }, [setSort]);

  const handleRefresh = useCallback(() => {
    clearSelection();
    clearPDFData();
    clearDeletePdfData();
    fetchBajas();
  }, [clearSelection, clearPDFData, clearDeletePdfData, fetchBajas]);

  const handleGeneratePDF = useCallback(async () => {
    if (!selectedBaja) return;
    
    await preparePDFData(selectedBaja, selectedItems);
    setShowPDFModal(true);
  }, [selectedBaja, selectedItems, preparePDFData]);

  const handleDeleteFolio = useCallback((folioResguardo: string) => {
    setDeleteType('folio');
    setItemToDelete({ folioResguardo });
    setShowDeleteModal(true);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedBaja) return;
    const selectedArticulos = selectedBaja.articulos.filter(art => selectedItems[art.id]);
    setDeleteType('selected');
    setItemToDelete({ articulos: selectedArticulos });
    setShowDeleteModal(true);
  }, [selectedBaja, selectedItems]);

  const handleDeleteSingle = useCallback((articulo: any) => {
    setDeleteType('single');
    setItemToDelete({ singleArticulo: articulo });
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteType || !itemToDelete) return;

    try {
      switch (deleteType) {
        case 'folio':
          if (itemToDelete.folioResguardo) {
            await deleteFolio(itemToDelete.folioResguardo);
          }
          break;
        case 'selected':
          if (itemToDelete.articulos) {
            await deleteSelected(itemToDelete.articulos);
          }
          break;
        case 'single':
          if (itemToDelete.singleArticulo) {
            await deleteSingle(itemToDelete.singleArticulo);
          }
          break;
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteType(null);
      clearSelections();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  }, [deleteType, itemToDelete, deleteFolio, deleteSelected, deleteSingle, clearSelections]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setItemToDelete(null);
    setDeleteType(null);
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (pdfBajaData) {
      // Import the PDF generation function
      const { generateBajaPDF } = await import('../BajaPDFReport');
      
      const foliosBaja = Array.from(new Set(pdfBajaData.articulos.map(a => a.folio_baja)));
      const showFolioBajaColumn = foliosBaja.length > 1;
      const columns = [
        { header: 'No. Inventario', key: 'id_inv' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Rubro', key: 'rubro' },
        { header: 'Condición', key: 'estado' },
        { header: 'Origen', key: 'origen' },
        { header: 'Resguardante', key: 'resguardante' },
      ];
      if (showFolioBajaColumn) {
        columns.splice(1, 0, { header: 'Folio Baja', key: 'folio_baja' });
      }
      const firmas = pdfBajaData.firmas ?? [];
      const pdfData = pdfBajaData.articulos.map(a => ({
        id_inv: a.id_inv,
        descripcion: a.descripcion,
        rubro: a.rubro,
        estado: a.estado,
        origen: a.origen || '',
        resguardante: a.resguardante,
        folio_baja: a.folio_baja
      }));
      const title = `BAJA DE RESGUARDO FOLIO ${pdfBajaData.folio_baja}`;
      const fileName = `baja_${pdfBajaData.folio_baja}`;
      await generateBajaPDF({
        data: pdfData,
        columns,
        title,
        fileName,
        firmas,
        encabezado: pdfBajaData
      });
      setShowPDFModal(false);
    }
  }, [pdfBajaData]);

  return (
    <div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Loading overlay for URL parameter */}
      {folioParamLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className={`mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cargando folio...</p>
          </div>
        </div>
      )}

      <div className={`h-full overflow-y-auto p-4 md:p-8 ${
        isDarkMode 
          ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
          : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
      }`}>
        <div className="w-full max-w-7xl mx-auto pb-8">
          {/* Header */}
          <Header 
            totalCount={totalCount}
            realtimeConnected={realtimeConnected}
            isDarkMode={isDarkMode}
          />

          {/* Main container */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
          {/* Left panel - Bajas table */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Filters */}
            <SearchAndFilters
              searchTerm={searchAndFilters.searchTerm}
              onSearchChange={searchAndFilters.setSearchTerm}
              suggestions={searchAndFilters.suggestions}
              showSuggestions={searchAndFilters.showSuggestions}
              highlightedIndex={searchAndFilters.highlightedIndex}
              onSuggestionClick={(index: number) => {
                const suggestion = searchAndFilters.suggestions[index];
                if (suggestion) {
                  searchAndFilters.addFilter({ term: suggestion.value, type: suggestion.type });
                  searchAndFilters.setSearchTerm('');
                  searchAndFilters.setShowSuggestions(false);
                }
              }}
              onKeyDown={searchAndFilters.handleKeyDown}
              onBlur={searchAndFilters.handleBlur}
              searchMatchType={searchAndFilters.searchMatchType}
              inputRef={searchInputRef}
              onShowSuggestionsChange={searchAndFilters.setShowSuggestions}
              onHighlightChange={searchAndFilters.setHighlightedIndex}
              totalRecords={totalCount}
              activeFilters={searchAndFilters.activeFilters}
              onRemoveFilter={searchAndFilters.removeFilter}
              isDarkMode={isDarkMode}
            />

            {/* Table */}
            <BajasTable
              bajas={foliosUnicos}
              loading={bajasLoading}
              error={bajasError || null}
              sortField={sortField}
              sortDirection={sortDirection}
              selectedFolioResguardo={selectedBaja?.folio_resguardo ?? null}
              allBajas={allBajas}
              onSort={handleSort}
              onRowClick={handleFolioClick}
              onRetry={fetchBajas}
              getArticuloCount={getArticuloCount}
              isDarkMode={isDarkMode}
            />

            {/* Pagination */}
            {foliosUnicos.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                rowsPerPage={rowsPerPage}
                setCurrentPage={setCurrentPage}
                setRowsPerPage={setRowsPerPage}
                isDarkMode={isDarkMode}
              />
            )}
          </div>

          {/* Right panel - Details */}
          <div ref={detailRef} className="lg:col-span-2 space-y-6">
            {/* Details Panel */}
            <BajaDetailsPanel
              selectedBaja={selectedBaja}
              selectedItemsCount={selectedCount}
              onGeneratePDF={handleGeneratePDF}
              onDeleteFolio={() => selectedBaja && handleDeleteFolio(selectedBaja.folio_resguardo)}
              userRole={userRole ?? null}
              isDarkMode={isDarkMode}
            />

            {/* Articles List Panel */}
            <ArticulosListPanel
              selectedBaja={selectedBaja}
              groupedItems={groupedItems}
              selectedItems={selectedItems}
              onItemSelection={handleItemSelection}
              onGroupSelection={(folioBaja) => {
                const groupArticles = groupedItems[folioBaja] || [];
                handleGroupSelection(folioBaja, groupArticles);
              }}
              onClearSelections={clearSelections}
              onDeleteSelected={handleDeleteSelected}
              onDeleteSingle={handleDeleteSingle}
              userRole={userRole ?? null}
              isDarkMode={isDarkMode}
            />
          </div>
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

      {/* Modals */}
      <PDFDownloadModal
        show={showPDFModal}
        pdfData={pdfBajaData}
        onClose={() => setShowPDFModal(false)}
        onDownload={handleDownloadPDF}
        isDarkMode={isDarkMode}
      />

      <DeleteModal
        show={showDeleteModal}
        deleteType={deleteType}
        itemToDelete={itemToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDarkMode={isDarkMode}
      />

      <ErrorAlert
        error={error || null}
        onClose={() => {
          // Clear all errors
          // Note: Individual hooks should handle their own error clearing
        }}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default ConsultarBajasResguardos;

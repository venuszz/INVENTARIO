"use client";
/**
 * ConsultarResguardos - Main orchestrator component
 * 
 * Integrates all modular pieces (hooks, components, modals) to provide
 * complete resguardos consultation functionality with search, filters,
 * details view, editing, deletion, and PDF generation.
 * 
 * @module ConsultarResguardos
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useUserRole } from '@/hooks/useUserRole';

// Custom hooks
import { useResguardosData } from './hooks/useResguardosData';
import { useResguardoDetails } from './hooks/useResguardoDetails';
import { useResguardantesEdit } from './hooks/useResguardantesEdit';
import { useResguardoDelete } from './hooks/useResguardoDelete';
import { usePDFGeneration } from './hooks/usePDFGeneration';
import { useSearchAndFilters } from './hooks/useSearchAndFilters';

// UI Components
import { Header } from './components/Header';
import { SearchAndFilters } from './components/SearchAndFilters';
import ResguardosTable from './components/ResguardosTable';
import { Pagination } from './components/Pagination';
import ResguardoInfoPanel from './components/ResguardoInfoPanel';
import ArticulosListPanel from './components/ArticulosListPanel';
import ConsultarSkeleton from './components/ConsultarSkeleton';
import { FileText, ListChecks, X } from 'lucide-react';

// Modals
import ErrorAlert from './modals/ErrorAlert';
import DeleteAllModal from './modals/DeleteAllModal';
import DeleteItemModal from './modals/DeleteItemModal';
import DeleteSelectedModal from './modals/DeleteSelectedModal';

// Types
import { ResguardoArticulo } from './types';

// PDF generation utilities
import { generateResguardoPDF } from '@/components/resguardos/ResguardoPDFReport';
import { generateBajaPDF } from '@/components/resguardos/BajaPDFReport';

interface ConsultarResguardosProps {
  folioParam?: string | null;
}

/**
 * Main orchestrator component for Consultar Resguardos
 * 
 * Coordinates state management across multiple hooks and renders
 * the complete UI with all features.
 */
export default function ConsultarResguardos({ folioParam }: ConsultarResguardosProps) {
  const { isDarkMode } = useTheme();
  const userRoleValue = useUserRole();
  const userRole = userRoleValue ?? null;
  const searchParams = useSearchParams();
  const detailRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Local UI state - Modals
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState<{ articulo: ResguardoArticulo } | null>(null);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showPDFBajaModal, setShowPDFBajaModal] = useState(false);

  // Local UI state - Selection
  const [selectedArticulos, setSelectedArticulos] = useState<string[]>([]);

  // Local UI state - Loading
  const [folioParamLoading, setFolioParamLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Initialize custom hooks
  const resguardosData = useResguardosData();

  // Initialize unified search hook
  const searchAndFilters = useSearchAndFilters(resguardosData.resguardos);

  // Sync activeFilters with resguardosData
  useEffect(() => {
    resguardosData.setActiveFilters(searchAndFilters.activeFilters);
  }, [searchAndFilters.activeFilters]);

  const resguardoDetails = useResguardoDetails();

  const resguardantesEdit = useResguardantesEdit(() => {
    // Refetch details after successful save
    if (resguardoDetails.selectedFolio) {
      resguardoDetails.refetch();
    }
  });

  const resguardoDelete = useResguardoDelete(() => {
    // Refetch list and details after successful deletion
    resguardosData.refetch();
    if (resguardoDetails.selectedFolio) {
      // Force refetch of details to update article list
      resguardoDetails.refetch();
    }
  });

  const pdfGeneration = usePDFGeneration();

  // Event Handlers - Selection
  const toggleArticuloSelection = useCallback((num_inventario: string) => {
    setSelectedArticulos(prev =>
      prev.includes(num_inventario)
        ? prev.filter(n => n !== num_inventario)
        : [...prev, num_inventario]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedArticulos([]);
  }, []);

  // Event Handlers - Delete
  const handleDeleteAll = useCallback(async () => {
    if (!resguardoDetails.resguardoDetails || !resguardoDetails.articulos.length) return;

    const firstArticulo = resguardoDetails.articulos[0];
    await resguardoDelete.deleteAll(
      resguardoDetails.articulos,
      resguardoDetails.resguardoDetails.folio,
      resguardoDetails.resguardoDetails.fecha,
      resguardoDetails.resguardoDetails.director,
      resguardoDetails.resguardoDetails.area_nombre || '',
      resguardoDetails.resguardoDetails.puesto || '',
      firstArticulo.resguardante || ''
    );

    setShowDeleteAllModal(false);
    resguardoDetails.clearSelection();
  }, [resguardoDetails, resguardoDelete]);

  const handleDeleteItem = useCallback(async (articulo: ResguardoArticulo) => {
    if (!resguardoDetails.resguardoDetails) return;

    await resguardoDelete.deleteArticulo(
      articulo,
      resguardoDetails.resguardoDetails.folio,
      resguardoDetails.resguardoDetails.fecha,
      resguardoDetails.resguardoDetails.director,
      resguardoDetails.resguardoDetails.area_nombre || '',
      resguardoDetails.resguardoDetails.puesto || '',
      articulo.resguardante || ''
    );

    setShowDeleteItemModal(null);
  }, [resguardoDetails, resguardoDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (!resguardoDetails.resguardoDetails || selectedArticulos.length === 0) return;

    const articulosToDelete = resguardoDetails.articulos.filter(
      art => selectedArticulos.includes(art.num_inventario)
    );

    const firstArticulo = articulosToDelete[0];
    await resguardoDelete.deleteSelected(
      articulosToDelete,
      resguardoDetails.resguardoDetails.folio,
      resguardoDetails.resguardoDetails.fecha,
      resguardoDetails.resguardoDetails.director,
      resguardoDetails.resguardoDetails.area_nombre || '',
      resguardoDetails.resguardoDetails.puesto || '',
      firstArticulo.resguardante || ''
    );

    setShowDeleteSelectedModal(false);
    clearSelection();
  }, [resguardoDetails, selectedArticulos, resguardoDelete, clearSelection]);

  // Event Handlers - PDF
  const handleGeneratePDF = useCallback(async () => {
    if (!resguardoDetails.resguardoDetails) return;

    setGeneratingPDF(true);
    try {
      const pdfData = await pdfGeneration.generateResguardoPDF(
        resguardoDetails.resguardoDetails.folio
      );

      if (pdfData) {
        await generateResguardoPDF(pdfData);
      }
    } finally {
      setGeneratingPDF(false);
      setShowPDFModal(false);
    }
  }, [resguardoDetails, pdfGeneration]);

  const handleGeneratePDFByResguardante = useCallback(async (
    resguardante: string
  ) => {
    if (!resguardoDetails.resguardoDetails) return;

    setGeneratingPDF(true);
    try {
      const pdfData = await pdfGeneration.generateResguardoPDF(
        resguardoDetails.resguardoDetails.folio,
        resguardante
      );

      if (pdfData) {
        await generateResguardoPDF(pdfData);
      }
    } finally {
      setGeneratingPDF(false);
    }
  }, [resguardoDetails, pdfGeneration]);

  const handleGenerateBajaPDF = useCallback(async () => {
    if (!resguardoDelete.pdfBajaData) return;

    setGeneratingPDF(true);
    try {
      const pdfBajaData = resguardoDelete.pdfBajaData;
      
      // Prepare columns
      const columns = [
        { header: 'No. Inventario', key: 'id_inv' },
        { header: 'Descripción', key: 'descripcion' },
        { header: 'Rubro', key: 'rubro' },
        { header: 'Estado', key: 'estado' },
        { header: 'Origen', key: 'origen' },
        { header: 'Resguardante', key: 'resguardante' },
      ];

      const firmas = pdfBajaData.firmas ?? [];
      const pdfData = pdfBajaData.articulos.map(a => ({
        id_inv: a.id_inv,
        descripcion: a.descripcion,
        rubro: a.rubro,
        estado: a.estado,
        origen: a.origen || '',
        resguardante: a.resguardante
      }));

      const title = `BAJA DE RESGUARDO FOLIO ${pdfBajaData.folioBaja}`;
      const fileName = `baja_${pdfBajaData.folioBaja}`;

      await generateBajaPDF({
        data: pdfData,
        columns,
        title,
        fileName,
        firmas,
        encabezado: {
          folio_resguardo: pdfBajaData.folioOriginal,
          folio_baja: pdfBajaData.folioBaja,
          fecha: pdfBajaData.fecha,
          director: pdfBajaData.director || '',
          area: pdfBajaData.area,
          puesto: pdfBajaData.puesto,
          resguardante: pdfBajaData.resguardante,
          articulos: pdfBajaData.articulos.map(articulo => ({
            ...articulo,
            id_inv: articulo.id_inv || '',
            descripcion: articulo.descripcion || '',
            rubro: articulo.rubro || '',
            estado: articulo.estado || '',
            folio_baja: pdfBajaData.folioBaja,
            resguardante: articulo.resguardante || ''
          }))
        }
      });
    } finally {
      setGeneratingPDF(false);
      setShowPDFBajaModal(false);
      resguardoDelete.clearPdfBajaData();
    }
  }, [resguardoDelete]);

  // Effects - URL parameter loading
  useEffect(() => {
    const folio = folioParam || searchParams.get('folio');
    
    // Only attempt to load folio if we have data in the store
    if (folio && resguardosData.resguardos.length > 0 && !resguardosData.loading) {
      setFolioParamLoading(true);
      resguardoDetails.selectFolio(folio).finally(() => {
        setFolioParamLoading(false);
        
        // Auto-scroll to details on mobile
        if (window.innerWidth < 768 && detailRef.current) {
          setTimeout(() => {
            detailRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      });
    }
  }, [folioParam, searchParams, resguardosData.resguardos.length, resguardosData.loading]);

  // Effects - Clear selection when resguardo changes
  useEffect(() => {
    clearSelection();
  }, [resguardoDetails.selectedFolio, clearSelection]);

  // Effects - Show PDF baja modal when pdfBajaData is available
  useEffect(() => {
    if (resguardoDelete.pdfBajaData) {
      setShowPDFBajaModal(true);
    }
  }, [resguardoDelete.pdfBajaData]);

  // Effects - Refetch details when modal closes to ensure panel updates
  useEffect(() => {
    if (!showPDFBajaModal && resguardoDetails.selectedFolio) {
      // Small delay to ensure database has been updated
      const timer = setTimeout(() => {
        resguardoDetails.refetch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showPDFBajaModal, resguardoDetails]);

  // Collect all errors
  const allErrors = [
    resguardosData.error,
    resguardoDetails.error,
    resguardantesEdit.error,
    resguardoDelete.error,
    pdfGeneration.error
  ].filter(Boolean);

  const hasError = allErrors.length > 0;
  const errorMessage = allErrors[0] || null;

  const clearAllErrors = useCallback(() => {
    resguardantesEdit.clearMessages();
    resguardoDelete.clearMessages();
  }, [resguardantesEdit, resguardoDelete]);

  // Show skeleton while initial data is loading
  if (resguardosData.loading && resguardosData.resguardos.length === 0) {
    return <ConsultarSkeleton isDarkMode={isDarkMode} />;
  }

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
          {/* Loading overlay for URL parameter */}
          {folioParamLoading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className={`p-6 rounded-lg shadow-xl ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className={`mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cargando resguardo...</p>
              </div>
            </div>
          )}

          {/* Header */}
          <Header 
            totalResguardos={resguardosData.totalCount}
          />

          {/* Main container */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
            {/* Left panel - List */}
            <div className="lg:col-span-3 space-y-6">
              {/* Unified search and filters */}
              <SearchAndFilters
                searchTerm={searchAndFilters.searchTerm}
                onSearchChange={searchAndFilters.setSearchTerm}
                suggestions={searchAndFilters.suggestions}
                showSuggestions={searchAndFilters.showSuggestions}
                highlightedIndex={searchAndFilters.highlightedIndex}
                onSuggestionClick={(index) => {
                  const suggestion = searchAndFilters.suggestions[index];
                  if (suggestion) {
                    searchAndFilters.addFilter({ term: suggestion.value, type: suggestion.type });
                    searchAndFilters.setSearchTerm('');
                  }
                }}
                onKeyDown={searchAndFilters.handleKeyDown}
                onBlur={searchAndFilters.handleBlur}
                searchMatchType={searchAndFilters.searchMatchType}
                inputRef={searchInputRef}
                onShowSuggestionsChange={searchAndFilters.setShowSuggestions}
                onHighlightChange={searchAndFilters.setHighlightedIndex}
                totalRecords={resguardosData.totalCount}
                activeFilters={searchAndFilters.activeFilters}
                onRemoveFilter={searchAndFilters.removeFilter}
              />

              {/* Resguardos table */}
              <ResguardosTable
                resguardos={resguardosData.resguardos.map(r => ({
                  folio: r.folio,
                  f_resguardo: r.fecha,
                  dir_area: r.director,
                  area_resguardo: r.area,
                  articulos_count: r.articulosCount
                }))}
                allResguardos={resguardosData.resguardos.map(r => ({
                  folio: r.folio,
                  f_resguardo: r.fecha,
                  dir_area: r.director,
                  area_resguardo: r.area,
                  articulos_count: r.articulosCount
                }))}
                selectedFolio={resguardoDetails.selectedFolio}
                onFolioClick={resguardoDetails.selectFolio}
                sortField={resguardosData.sortField === 'fecha' ? 'f_resguardo' : resguardosData.sortField === 'director' ? 'dir_area' : 'folio'}
                sortDirection={resguardosData.sortDirection}
                onSort={(field) => {
                  const mappedField = field === 'f_resguardo' ? 'fecha' : field === 'dir_area' ? 'director' : 'folio';
                  resguardosData.setSort(mappedField as any);
                }}
                loading={resguardosData.loading}
                error={resguardosData.error}
                searchTerm={searchAndFilters.searchTerm}
                filterResguardante=""
                onRetry={resguardosData.refetch}
                onResetSearch={() => {
                  searchAndFilters.setSearchTerm('');
                  resguardosData.clearFilters();
                }}
                rowsPerPage={resguardosData.rowsPerPage}
              />

              {/* Pagination */}
              {resguardosData.resguardos.length > 0 && (
                <Pagination
                  currentPage={resguardosData.currentPage}
                  totalPages={resguardosData.totalPages}
                  rowsPerPage={resguardosData.rowsPerPage}
                  totalItems={resguardosData.totalCount}
                  onPageChange={resguardosData.setCurrentPage}
                  onRowsPerPageChange={resguardosData.setRowsPerPage}
                />
              )}
            </div>

            {/* Right panel - Details */}
            <div ref={detailRef} className="lg:col-span-2 flex flex-col gap-6">
              {/* Resguardo Info Panel - Always visible */}
              {resguardoDetails.resguardoDetails && resguardoDetails.articulos.length > 0 ? (
                <ResguardoInfoPanel
                  folio={resguardoDetails.resguardoDetails.folio}
                  fecha={resguardoDetails.resguardoDetails.fecha}
                  director={resguardoDetails.resguardoDetails.director}
                  area={resguardoDetails.resguardoDetails.area_nombre || ''}
                  articulosCount={resguardoDetails.articulos.length}
                  resguardantes={Array.from(new Set(
                    resguardoDetails.articulos.map(a => a.resguardante || 'Sin asignar')
                  ))}
                  onGeneratePDF={handleGeneratePDF}
                  onDeleteAll={() => setShowDeleteAllModal(true)}
                  userRole={userRole}
                  disableDelete={false}
                />
              ) : (
                <div className={`rounded-lg border p-4 h-[45vh] flex flex-col ${
                  isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/10'
                }`}>
                  <h2 className={`text-sm font-medium mb-4 ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    Información del Resguardo
                  </h2>
                  <div className={`flex flex-col items-center justify-center flex-1 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`}>
                    <FileText className="h-12 w-12 mb-3" />
                    <p className="text-sm">Seleccione un resguardo</p>
                    <p className="text-xs mt-1">Haga clic en un folio para ver los detalles</p>
                  </div>
                </div>
              )}

              {/* Articulos List Panel - Always visible */}
              {resguardoDetails.articulos.length > 0 ? (
                <ArticulosListPanel
                  articulos={resguardoDetails.articulos}
                  selectedArticulos={selectedArticulos}
                  onToggleSelection={toggleArticuloSelection}
                  onDeleteSelected={() => setShowDeleteSelectedModal(true)}
                  onDeleteSingle={(articulo) => setShowDeleteItemModal({ articulo })}
                  onGeneratePDFByResguardante={handleGeneratePDFByResguardante}
                  onClearSelection={clearSelection}
                  userRole={userRole}
                  disableDelete={false}
                />
              ) : (
                <div className={`rounded-lg border h-[45vh] flex flex-col overflow-hidden ${
                  isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/10'
                }`}>
                  <div className={`px-4 py-3 border-b flex-shrink-0 ${
                    isDarkMode ? 'border-white/10' : 'border-black/10'
                  }`}>
                    <h2 className={`text-sm font-medium ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Artículos del Resguardo
                    </h2>
                  </div>
                  <div className={`flex-1 flex flex-col items-center justify-center p-8 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`}>
                    <ListChecks className="h-12 w-12 mb-3" />
                    <p className="text-sm">No hay artículos</p>
                    <p className="text-xs mt-1">Seleccione un resguardo para ver sus artículos</p>
                  </div>
                </div>
              )}
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
      <DeleteAllModal
        show={showDeleteAllModal}
        folio={resguardoDetails.resguardoDetails?.folio || ''}
        articulosCount={resguardoDetails.articulos.length}
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteAllModal(false)}
        isDeleting={resguardoDelete.deleting}
      />

      {showDeleteItemModal && (
        <DeleteItemModal
          show={true}
          articulo={showDeleteItemModal.articulo}
          folio={resguardoDetails.resguardoDetails?.folio || ''}
          onConfirm={() => handleDeleteItem(showDeleteItemModal.articulo)}
          onCancel={() => setShowDeleteItemModal(null)}
          isDeleting={resguardoDelete.deleting}
        />
      )}

      <DeleteSelectedModal
        show={showDeleteSelectedModal}
        selectedCount={selectedArticulos.length}
        articulos={resguardoDetails.articulos}
        selectedArticulos={selectedArticulos}
        folio={resguardoDetails.resguardoDetails?.folio || ''}
        onConfirm={handleDeleteSelected}
        onCancel={() => setShowDeleteSelectedModal(false)}
        isDeleting={resguardoDelete.deleting}
      />

      {/* PDF Baja Modal */}
      {showPDFBajaModal && resguardoDelete.pdfBajaData && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm ${
          isDarkMode ? 'bg-black/80' : 'bg-black/50'
        }`}>
          <div className={`rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl ${
            isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
          }`}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-green-500/10' : 'bg-green-50'
                  }`}>
                    <FileText size={20} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Baja generada
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Listo para descargar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPDFBajaModal(false);
                    resguardoDelete.clearPdfBajaData();
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'hover:bg-white/10 text-white'
                      : 'hover:bg-black/10 text-black'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Folio info */}
              <div className={`rounded-lg border p-3 mb-6 ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <label className={`block text-xs font-medium mb-1.5 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Folio de baja
                </label>
                <div className="flex items-center gap-2">
                  <FileText size={16} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {resguardoDelete.pdfBajaData.folioBaja}
                  </span>
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={handleGenerateBajaPDF}
                disabled={generatingPDF}
                className={`w-full px-4 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  generatingPDF
                    ? isDarkMode
                      ? 'bg-black border-white/5 text-white/40 cursor-not-allowed'
                      : 'bg-white border-black/5 text-black/40 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-white text-black border-white hover:bg-white/90'
                      : 'bg-black text-white border-black hover:bg-black/90'
                }`}
              >
                {generatingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <FileText size={14} />
                    Descargar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      <ErrorAlert
        show={hasError}
        message={errorMessage}
        onClose={clearAllErrors}
      />
    </div>
  );
}

"use client";
import { useState, useEffect } from 'react';
import {
    FileText, FileSpreadsheet, File, 
    FileDigit, X, AlertCircle,
    UserX, MapPin, Trash2, CheckCircle,
    Database, ListChecks,
    
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
//import { generateExcel } from './excelgenerator';
//import { generatePDF } from './pdfgenerator';

interface Mueble {
    id: number;
    id_inv: string;
    rubro: string | null;
    descripcion: string | null;
    valor: number | null;
    f_adq: string | null;
    formadq: string | null;
    proveedor: string | null;
    factura: string | null;
    ubicacion_es: string | null;
    ubicacion_mu: string | null;
    ubicacion_no: string | null;
    estado: string | null;
    estatus: string | null;
    area: string | null;
    usufinal: string | null;
    fechabaja: string | null;
    causadebaja: string | null;
    resguardante: string | null;
    image_path: string | null;
}

export default function ReportesIneaDashboard() {
    // Estado para controlar el modal de exportación
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estados para el conteo y suma total de bienes
    const [totalMuebles, setTotalMuebles] = useState<number | null>(null);
    const [totalValorMuebles, setTotalValorMuebles] = useState<number | null>(null);

    // Estado para los datos por rubro y estatus
    const [rubrosPorEstatus, setRubrosPorEstatus] = useState<{
        [estatus: string]: Array<{ rubro: string; count: number; sum: number }>;
    }>({});

    // Estado para el modal de detalle de tarjeta
    const [modalReporte, setModalReporte] = useState<null | string>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Función para abrir el modal de detalle
    const handleOpenModal = (reporteTitle: string) => {
        setModalReporte(reporteTitle);
        setModalVisible(true);
    };
    // Función para cerrar el modal
    const handleCloseModal = () => {
        setModalVisible(false);
        setTimeout(() => setModalReporte(null), 300); // Espera la transición
    };

    // Fetch firmas on component mount
    useEffect(() => {
        const fetchFirmas = async () => {
            const { error } = await supabase
                .from('firmas')
                .select('*')
                .order('id', { ascending: true });
            
            if (error) {
                setError('Error al cargar las firmas: ' + error.message);
                return;
            }            
        };

        fetchFirmas();
    }, []);

    // Obtener el total de bienes y suma de valores al cargar el dashboard
    useEffect(() => {
        (async () => {
            // Contar bienes
            const { count } = await supabase
                .from('muebles')
                .select('*', { count: 'exact', head: true });
            setTotalMuebles(count || 0);
            // Sumar valores
            let total = 0;
            let from = 0;
            const pageSize = 1000;
            let keepGoing = true;
            while (keepGoing) {
                const { data, error } = await supabase
                    .from('muebles')
                    .select('valor')
                    .neq('estatus', 'BAJA')
                    .range(from, from + pageSize - 1);
                if (error) break;
                if (data && data.length > 0) {
                    total += data.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
                    if (data.length < pageSize) {
                        keepGoing = false;
                    } else {
                        from += pageSize;
                    }
                } else {
                    keepGoing = false;
                }
            }
            setTotalValorMuebles(total);
        })();
    }, []);

    // Cargar resumen por rubro y estatus
    useEffect(() => {
        (async () => {
            const estatuses = [
                { key: 'Activos', value: 'ACTIVO' },
                { key: 'Inactivos', value: 'INACTIVO' },
                { key: 'No localizados', value: 'NO LOCALIZADO' },
                { key: 'Obsoletos', value: 'OBSOLETO' }
            ];
            const result: { [estatus: string]: Array<{ rubro: string; count: number; sum: number }> } = {};
            for (const est of estatuses) {
                let from = 0;
                const pageSize = 1000;
                let keepGoing = true;
                const rubrosMap: { [rubro: string]: { count: number; sum: number } } = {};
                while (keepGoing) {
                    const { data, error } = await supabase
                        .from('muebles')
                        .select('rubro,valor')
                        .eq('estatus', est.value)
                        .range(from, from + pageSize - 1);
                    if (error) break;
                    if (data && data.length > 0) {
                        data.forEach((item) => {
                            if (!item.rubro) return;
                            if (!rubrosMap[item.rubro]) rubrosMap[item.rubro] = { count: 0, sum: 0 };
                            rubrosMap[item.rubro].count++;
                            rubrosMap[item.rubro].sum += parseFloat(item.valor) || 0;
                        });
                        if (data.length < pageSize) {
                            keepGoing = false;
                        } else {
                            from += pageSize;
                        }
                    } else {
                        keepGoing = false;
                    }
                }
                result[est.key] = Object.entries(rubrosMap).map(([rubro, v]) => ({ rubro, ...v }));
            }
            setRubrosPorEstatus(result);
        })();
    }, []);

    // Columnas a exportar
    const exportColumns = [
        { header: 'ID Inventario', key: 'id_inv', width: 18 },
        { header: 'Rubro', key: 'rubro', width: 18 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Valor', key: 'valor', width: 12 },
        { header: 'Fecha Adquisición', key: 'f_adq', width: 16 },
        { header: 'Forma Adq.', key: 'formadq', width: 14 },
        { header: 'Proveedor', key: 'proveedor', width: 20 },
        { header: 'Factura', key: 'factura', width: 14 },
        { header: 'Ubicación ES', key: 'ubicacion_es', width: 10 },
        { header: 'Ubicación MU', key: 'ubicacion_mu', width: 10 },
        { header: 'Ubicación NO', key: 'ubicacion_no', width: 12 },
        { header: 'Estado', key: 'estado', width: 14 },
        { header: 'Estatus', key: 'estatus', width: 14 },
        { header: 'Área', key: 'area', width: 18 },
        { header: 'Usuario Final', key: 'usufinal', width: 20 },
        { header: 'Fecha Baja', key: 'fechabaja', width: 16 },
        { header: 'Causa de Baja', key: 'causadebaja', width: 24 },
        { header: 'Resguardante', key: 'resguardante', width: 18 },
    ];

    // Obtiene el filtro de estatus según el reporte
    function getEstatusFilter(report: string | null) {
        if (!report) return null;
        switch (report) {
            case 'Activos':
                return 'ACTIVO';
            case 'Inactivos':
                return 'INACTIVO';
            case 'No localizados':
                return 'NO LOCALIZADO';
            case 'Obsoletos':
                return 'OBSOLETO';
            default:
                return null; // General: sin filtro
        }
    }

    // Datos de reportes INEA con íconos y colores específicos
    const reportes = [
        {
            id: 1,
            title: 'General',
            path: '/reportes/inea/general',
            icon: <Database className="h-5 w-5" />,
            color: 'bg-blue-900/20',
            borderColor: 'border-blue-800',
            hoverColor: 'hover:border-blue-500',
            iconColor: 'text-blue-400'
        },
        {
            id: 2,
            title: 'Activos',
            path: '/reportes/inea/activos',
            icon: <CheckCircle className="h-5 w-5" />,
            color: 'bg-green-900/20',
            borderColor: 'border-green-800',
            hoverColor: 'hover:border-green-500',
            iconColor: 'text-green-400'
        },
        {
            id: 3,
            title: 'Inactivos',
            path: '/reportes/inea/inactivos',
            icon: <UserX className="h-5 w-5" />,
            color: 'bg-yellow-900/20',
            borderColor: 'border-yellow-800',
            hoverColor: 'hover:border-yellow-500',
            iconColor: 'text-yellow-400'
        },
        {
            id: 4,
            title: 'No localizados',
            path: '/reportes/inea/no-localizados',
            icon: <MapPin className="h-5 w-5" />,
            color: 'bg-orange-900/20',
            borderColor: 'border-orange-800',
            hoverColor: 'hover:border-orange-500',
            iconColor: 'text-orange-400'
        },
        {
            id: 5,
            title: 'Obsoletos',
            path: '/reportes/inea/obsoletos',
            icon: <Trash2 className="h-5 w-5" />,
            color: 'bg-red-900/20',
            borderColor: 'border-red-800',
            hoverColor: 'hover:border-red-500',
            iconColor: 'text-red-400'
        },
    ];

    // Exporta el reporte real trayendo todos los datos (paginación manual)
    const handleExport = async (format: string) => {
        setError(null);
        if (!modalReporte) return;

        try {
            let query = supabase.from('muebles').select('*', { count: 'exact', head: false });
            const estatus = getEstatusFilter(modalReporte);
            if (estatus) query = query.eq('estatus', estatus);

            // Traer todos los datos paginando manualmente
            let allData: Mueble[] = [];
            let from = 0;
            const pageSize = 1000;
            let keepGoing = true;
            while (keepGoing) {
                const { data: pageData, error: fetchError } = await query.range(from, from + pageSize - 1);
                if (fetchError) throw fetchError;
                if (pageData && pageData.length > 0) {
                    allData = allData.concat(pageData);
                    if (pageData.length < pageSize) {
                        keepGoing = false;
                    } else {
                        from += pageSize;
                    }
                } else {
                    keepGoing = false;
                }
            }
            if (!allData || allData.length === 0) {
                setError('No hay datos para exportar en este reporte.');
                return;
            }

            // Nombre de archivo y hoja            
            const fileName = `reporte_inea_${modalReporte.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}`;

            const exportData: Record<string, unknown>[] = allData.map(item => ({
                ...item,
                valor: item.valor?.toString() || '',
                f_adq: item.f_adq || '',
                fechabaja: item.fechabaja || ''
            }));

            if (format === 'Excel') {
                //await generateExcel({ data: exportData, fileName, worksheetName });
            } else if (format === 'PDF') {
                /*await generatePDF({ 
                    data: exportData, 
                    columns: exportColumns, 
                    title: `INVENTARIO DE BIENES MUEBLES ${modalReporte.toUpperCase()}`,
                    fileName
                });*/
            } else {
                // CSV with type-safe key access
                const csv = [
                    exportColumns.map(c => c.header).join(','),
                    ...exportData.map(row => 
                        exportColumns.map(c => `"${row[c.key] ?? ''}"`)
                        .join(',')
                    )
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${fileName}.csv`;
                a.click();
            }
            setExportModalOpen(false);
        } catch (error: Error | unknown) {
            setError('Error al exportar el reporte: ' + (error instanceof Error ? error.message : 'Error desconocido'));
            console.error(error);
        }
    };

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden border border-gray-800 transition-all duration-500 transform">
                {/* Header */}
                <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">
                            <FileText className="h-4 w-4 inline mr-1" />
                            REP
                        </span>
                        Reportes INEA
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <ListChecks className="h-4 w-4 text-blue-400" />
                            <span>{reportes.length} categorías de reportes</span>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="p-4 sm:p-6 flex justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 w-full max-w-7xl mx-auto">
                        {reportes.map((reporte) => (
                            <div
                                key={reporte.id}
                                className={`${reporte.color} rounded-xl border ${reporte.borderColor} p-2 sm:p-2 md:p-1 cursor-pointer transition-all shadow-lg hover:shadow-2xl hover:scale-105 flex flex-col items-center w-full min-h-[140px] max-h-[220px] max-w-xs mx-auto text-[10px] md:text-xs min-w-0`} 
                                onClick={() => handleOpenModal(reporte.title)}
                            >
                                <div className="flex justify-between items-center mb-2 w-full">
                                    <div className="flex items-center mx-auto">
                                        <div className={`bg-gray-800 p-1 rounded-lg mr-2 border ${reporte.borderColor}`}>
                                            <span className={reporte.iconColor}>{reporte.icon}</span>
                                        </div>
                                        <h3 className="text-xs font-medium whitespace-normal break-words leading-tight">Reporte {reporte.title}</h3>
                                    </div>
                                </div>
                                <p className="text-gray-400 mb-2 text-[10px] text-center whitespace-normal break-words leading-tight">
                                    {reporte.title === 'General' ? 'Información completa de todos los registros del sistema' :
                                        reporte.title === 'Activos' ? 'Registros actualmente en uso, agrupados por rubro' :
                                            reporte.title === 'Inactivos' ? 'Registros dados de baja temporalmente, agrupados por rubro' :
                                                reporte.title === 'No localizados' ? 'Registros con paradero desconocido, agrupados por rubro' :
                                                    reporte.title === 'Obsoletos' ? 'Registros marcados para desecho, agrupados por rubro' :
                                                        reporte.title === 'Inventario' ? 'Listado completo de bienes patrimoniales' :
                                                            reporte.title === 'Auditoría' ? 'Reportes de revisiones y verificaciones' :
                                                                'Datos estadísticos y métricas de uso'}
                                </p>
                                {['Activos','Inactivos','No localizados','Obsoletos'].includes(reporte.title) && (
                                    <div className="w-full flex flex-col items-center justify-center mt-1 overflow-hidden">
                                        {rubrosPorEstatus[reporte.title]?.length ? (
                                            <table className="w-full text-center text-[10px] mt-1 border-separate border-spacing-y-1">
                                                <thead>
                                                    <tr className="text-blue-200">
                                                        <th className="px-1 py-1">Rubro</th>
                                                        <th className="px-1 py-1">Total bienes</th>
                                                        <th className="px-1 py-1">Suma valores</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rubrosPorEstatus[reporte.title].slice(0, 4).map((rubro, idx) => (
                                                        <tr key={rubro.rubro+idx} className="bg-black/30 hover:bg-black/50 rounded-lg">
                                                            <td className="px-1 py-1 font-semibold text-blue-100 whitespace-normal break-words max-w-[90px] text-[10px] leading-tight">{rubro.rubro}</td>
                                                            <td className="px-1 py-1 text-blue-100 text-[10px] leading-tight">{rubro.count}</td>
                                                            <td className="px-1 py-1 text-blue-100 text-[10px] leading-tight">${rubro.sum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <span className="text-[10px] text-gray-400">Sin datos</span>
                                        )}
                                        {rubrosPorEstatus[reporte.title]?.length > 4 && (
                                            <span className="text-[10px] text-gray-400 mt-1">+ más rubros...</span>
                                        )}
                                    </div>
                                )}
                                {reporte.title === 'General' && (
                                    <div className="mt-1 w-full flex flex-col items-center gap-1 justify-center text-center text-[10px]">
                                        <span className="text-blue-300">Total de bienes: <b>{totalMuebles !== null ? totalMuebles : '...'}</b></span>
                                        <span className="text-blue-300">Suma total de valores: <b>${totalValorMuebles !== null ? totalValorMuebles.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}</b></span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal de detalle de tarjeta */}
                {modalReporte && (
                    <div
                        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${modalVisible ? 'opacity-100 bg-black/80 backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}
                        onClick={handleCloseModal}
                    >
                        <div
                            className={`rounded-2xl shadow-2xl border-2 px-4 py-10 sm:px-8 w-full max-w-3xl flex flex-col items-center scale-100 transition-transform duration-300 ${modalVisible ? 'scale-100' : 'scale-90'} ${(() => {
                                const r = reportes.find(r => r.title === modalReporte);
                                return r ? `${r.color} ${r.borderColor}` : 'bg-black border-gray-800';
                            })()} min-h-[50vh] max-h-[98vh] overflow-hidden justify-center`}
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-lg sm:text-2xl font-bold mb-6 text-blue-200 text-center drop-shadow-lg">{modalReporte}</h2>
                            {modalReporte === 'General' && (
                                <div className="flex flex-col items-center gap-6 text-base sm:text-lg text-blue-100 justify-center text-center h-full w-full">
                                    <span>Total de bienes: <b>{totalMuebles !== null ? totalMuebles : '...'}</b></span>
                                    <span>Suma total de valores: <b>${totalValorMuebles !== null ? totalValorMuebles.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}</b></span>
                                </div>
                            )}
                            {['Activos','Inactivos','No localizados','Obsoletos'].includes(modalReporte) && (
                                <div className="w-full flex flex-col items-center justify-center mt-2 h-full">
                                    {rubrosPorEstatus[modalReporte]?.length ? (
                                        <table className="w-full text-center text-xs sm:text-sm mt-2 border-separate border-spacing-y-2">
                                            <thead>
                                                <tr className="text-blue-300">
                                                    <th className="px-4 py-2">Rubro</th>
                                                    <th className="px-4 py-2">Total bienes</th>
                                                    <th className="px-4 py-2">Suma valores</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rubrosPorEstatus[modalReporte].slice(0, modalReporte === 'Activos' ? 8 : 20).map((rubro, idx) => (
                                                    <tr key={rubro.rubro+idx} className="bg-black/40 hover:bg-black/60 rounded-lg">
                                                        <td className="px-4 py-2 font-bold text-blue-100 text-xs sm:text-sm whitespace-normal break-words max-w-[320px]">{rubro.rubro}</td>
                                                        <td className="px-4 py-2 text-blue-100 text-xs sm:text-sm">{rubro.count}</td>
                                                        <td className="px-4 py-2 text-blue-100 text-xs sm:text-sm">${rubro.sum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <span className="text-base text-gray-400">Sin datos</span>
                                    )}
                                </div>
                            )}
                            <div className="mt-6 text-center text-gray-400 text-xs">Haz clic en cualquier parte para cerrar</div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="bg-black p-4 border-t border-gray-800 text-center text-sm text-gray-500">
                    <p>Selecciona un reporte para exportarlo en PDF, Excel o CSV</p>
                </div>
            </div>

            {/* Modal de exportación */}
            {exportModalOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-yellow-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform flex flex-col items-center">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900 flex flex-col items-center w-full">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/60 via-yellow-400 to-yellow-500/60"></div>
                            <button
                                onClick={() => setExportModalOpen(false)}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-gray-900 text-yellow-400 hover:text-yellow-500 border border-yellow-500/30 transition-colors"
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <div className="flex flex-col items-center text-center mb-4 w-full">
                                <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/30 mb-3 mx-auto">
                                    <FileDigit className="h-8 w-8 text-yellow-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Exportar Reporte</h3>
                                <p className="text-gray-400 mt-2">
                                    Selecciona el formato para exportar el reporte <span className="text-yellow-300 font-bold">{modalReporte}</span>
                                </p>
                                {/* Mostrar totales solo para General */}
                                {modalReporte === 'General' && (
                                    <div className="mt-4 w-full flex flex-col items-center gap-1">
                                        <span className="text-sm text-blue-300">Total de bienes: <b>{totalMuebles !== null ? totalMuebles : '...'}</b></span>
                                        <span className="text-sm text-blue-300">Suma total de valores: <b>${totalValorMuebles !== null ? totalValorMuebles.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}</b></span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-5 mt-6 w-full">
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => handleExport('PDF')}
                                        className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 hover:border-red-500 transition-all transform hover:scale-[1.02]"
                                    >
                                        <File size={32} className="text-red-400 mb-2" />
                                        <span className="font-medium">PDF</span>
                                        <span className="text-xs text-gray-400">Documento</span>
                                    </button>
                                    <button
                                        onClick={() => handleExport('Excel')}
                                        className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 hover:border-green-500 transition-all transform hover:scale-[1.02]"
                                    >
                                        <FileSpreadsheet size={32} className="text-green-400 mb-2" />
                                        <span className="font-medium">Excel</span>
                                        <span className="text-xs text-gray-400">Hoja cálculo</span>
                                    </button>
                                    <button
                                        onClick={() => handleExport('CSV')}
                                        className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 hover:border-blue-500 transition-all transform hover:scale-[1.02]"
                                    >
                                        <FileText size={32} className="text-blue-400 mb-2" />
                                        <span className="font-medium">CSV</span>
                                        <span className="text-xs text-gray-400">Datos crudos</span>
                                    </button>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => setExportModalOpen(false)}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm border border-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-900/80 text-red-100 px-4 py-3 rounded-lg shadow-lg border border-red-800 z-50 backdrop-blur-sm animate-fade-in">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <button
                            title='Cerrar alerta'
                            onClick={() => setError(null)}
                            className="ml-4 flex-shrink-0 p-1 rounded-full text-red-200 hover:text-white hover:bg-red-800"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
    FileText, Download, FileSpreadsheet, File, 
    FileDigit, X, AlertCircle,
    CheckCircle, Database, ListChecks, Settings2,
    Pencil
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { generateExcel } from './excelgenerator';
import { generatePDF } from './pdfgenerator';
import { useUserRole } from "@/hooks/useUserRole";
import RoleGuard from "@/components/roleGuard";
import { useNotifications } from '@/hooks/useNotifications';

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

interface Firma {
    id: number;
    concepto: string;
    nombre: string | null;
    puesto: string | null;
}

export default function ReportesIneaDashboard() {
    const { isDarkMode } = useTheme();
    // Estado para controlar el modal de exportación
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Estados para la gestión de firmas
    const [firmasModalOpen, setFirmasModalOpen] = useState(false);
    const [firmas, setFirmas] = useState<Firma[]>([]);
    const [editingFirma, setEditingFirma] = useState<Firma | null>(null);

    // Loader de exportación
    const [isExporting, setIsExporting] = useState(false);
    const [exportingFormat, setExportingFormat] = useState<string | null>(null);

    const { createNotification } = useNotifications();

    // Fetch firmas on component mount
    useEffect(() => {
        const fetchFirmas = async () => {
            const { data, error } = await supabase
                .from('firmas')
                .select('*')
                .order('id', { ascending: true });
            
            if (error) {
                setError('Error al cargar las firmas: ' + error.message);
                return;
            }
            
            if (data) {
                setFirmas(data);
            }
        };

        fetchFirmas();
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
    function getEstatusFilter(report: string) {
        switch (report) {
            case 'En Uso*':
                return 'EN USO*';
            case 'En Uso':
                return 'EN USO';
            case 'Sin Uso e Integrado PADFBM':
                return 'SIN USO E INTEGRADO AL PADFBM INEA';
            case 'Sin Uso y No Integrado PADFBM':
                return 'SIN USO Y NO INTEGRADO AL PADFBM INEA (REALIZAR BAJA)';
            default:
                return null; // General: sin filtro
        }
    }

    // Datos de reportes INEA con íconos coloridos y fondos adaptativos
    const reportes = [
        {
            id: 1,
            title: 'General',
            path: '/reportes/inea/general',
            icon: <Database className="h-5 w-5" />,
            color: isDarkMode ? 'bg-gray-900/40' : 'bg-blue-50',
            borderColor: isDarkMode ? 'border-gray-600/50' : 'border-blue-200',
            hoverColor: isDarkMode ? 'hover:border-gray-400' : 'hover:border-blue-400',
            iconColor: isDarkMode ? 'text-blue-400' : 'text-blue-600'
        },
        {
            id: 2,
            title: 'En Uso*',
            path: '/reportes/inea/en-uso-asterisk',
            icon: <CheckCircle className="h-5 w-5" />,
            color: isDarkMode ? 'bg-white/5' : 'bg-emerald-50',
            borderColor: isDarkMode ? 'border-gray-700/50' : 'border-emerald-200',
            hoverColor: isDarkMode ? 'hover:border-gray-500' : 'hover:border-emerald-400',
            iconColor: isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
        },
        {
            id: 3,
            title: 'Sin Uso e Integrado PADFBM',
            path: '/reportes/inea/integrado',
            icon: <ListChecks className="h-5 w-5" />,
            color: isDarkMode ? 'bg-gray-800/30' : 'bg-amber-50',
            borderColor: isDarkMode ? 'border-gray-600/40' : 'border-amber-200',
            hoverColor: isDarkMode ? 'hover:border-gray-400' : 'hover:border-amber-400',
            iconColor: isDarkMode ? 'text-amber-400' : 'text-amber-600'
        },
        {
            id: 4,
            title: 'Sin Uso y No Integrado PADFBM',
            path: '/reportes/inea/no-integrado',
            icon: <AlertCircle className="h-5 w-5" />,
            color: isDarkMode ? 'bg-gray-950/50' : 'bg-rose-50',
            borderColor: isDarkMode ? 'border-gray-800/60' : 'border-rose-200',
            hoverColor: isDarkMode ? 'hover:border-gray-600' : 'hover:border-rose-400',
            iconColor: isDarkMode ? 'text-rose-400' : 'text-rose-600'
        },
        {
            id: 5,
            title: 'En Uso',
            path: '/reportes/inea/en-uso',
            icon: <CheckCircle className="h-5 w-5" />,
            color: isDarkMode ? 'bg-white/10' : 'bg-violet-50',
            borderColor: isDarkMode ? 'border-gray-700/50' : 'border-violet-200',
            hoverColor: isDarkMode ? 'hover:border-gray-500' : 'hover:border-violet-400',
            iconColor: isDarkMode ? 'text-violet-400' : 'text-violet-600'
        }
    ];

    // Función para abrir el modal de exportación
    const openExportModal = (reportTitle: string) => {
        setSelectedReport(reportTitle);
        setExportModalOpen(true);
    };

    // Exporta el reporte real trayendo todos los datos (paginación manual)
    const handleExport = async (format: string) => {
        setError(null);
        setIsExporting(true);
        setExportingFormat(format);
        try {
            let query = supabase.from('muebles').select('*', { count: 'exact', head: false });
            const estatus = getEstatusFilter(selectedReport);
            if (estatus) query = query.eq('estatus', estatus);

            // Obtener firmas
            const { data: firmasData, error: firmasError } = await supabase
                .from('firmas')
                .select('*')
                .order('id', { ascending: true });

            if (firmasError) throw firmasError;

            // Traer todos los datos paginando manualmente
            let allData: Mueble[] = [];
            let from = 0;
            const pageSize = 1000;
            let keepGoing = true;
            while (keepGoing) {
                const { data, error: fetchError } = await query.range(from, from + pageSize - 1);
                if (fetchError) throw fetchError;
                if (data && data.length > 0) {
                    allData = allData.concat(data);
                    if (data.length < pageSize) {
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
            // Nombre de hoja de Excel simple y seguro
            let worksheetName = selectedReport.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 28);
            if (!worksheetName) worksheetName = 'Reporte';
            const fileName = `reporte_inea_${selectedReport.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}`;

            // Convert Mueble[] to Record<string, unknown>[] for export functions
            const exportData: Record<string, unknown>[] = allData.map(item => ({
                ...item,
                valor: item.valor?.toString() || '',
                f_adq: item.f_adq || '',
                fechabaja: item.fechabaja || ''
            }));

            if (format === 'Excel') {
                await generateExcel({ data: exportData, fileName, worksheetName });
            } else if (format === 'PDF') {
                // Determinar el título específico según el tipo de reporte
                let reportTitle;
                switch(selectedReport) {
                    case 'Activos':
                        reportTitle = 'INVENTARIO DE BIENES MUEBLES ACTIVOS';
                        break;
                    case 'Inactivos':
                        reportTitle = 'INVENTARIO DE BIENES MUEBLES INACTIVOS';
                        break;
                    case 'No localizados':
                        reportTitle = 'INVENTARIO DE BIENES MUEBLES NO LOCALIZADOS';
                        break;
                    case 'Obsoletos':
                        reportTitle = 'INVENTARIO DE BIENES MUEBLES OBSOLETOS';
                        break;
                    default:
                        reportTitle = 'INVENTARIO GENERAL DE BIENES MUEBLES';
                }

                const pdfColumns = [
                    { header: 'Id Inv', key: 'id_inv', width: 45 },
                    { header: 'DESCRIPCIÓN', key: 'descripcion', width: 150 },
                    { header: 'VALOR', key: 'valor', width: 45 },
                    { header: 'PROVEEDOR', key: 'proveedor', width: 65 },
                    { header: 'FACTURA', key: 'factura', width: 45 },
                    { header: 'RUBRO', key: 'rubro', width: 65 },
                    { header: 'ESTADO', key: 'estado', width: 40 },
                    { header: 'ESTATUS', key: 'estatus', width: 40 },
                    { header: 'FECHA ADQ.', key: 'f_adq', width: 40 },
                    { header: 'FORMA ADQ.', key: 'formadq', width: 40 },
                    { header: 'UBICACIÓN', key: 'ubicacion_es', width: 66 },
                    { header: 'AREA', key: 'area', width: 65 },
                    { header: 'USUARIO FINAL', key: 'usufinal', width: 80 }
                ];

                await generatePDF({ 
                    data: exportData, 
                    columns: pdfColumns, 
                    title: reportTitle, 
                    fileName,
                    firmas: firmasData 
                });
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
            // Notificación de exportación exitosa
            await createNotification({
                title: `Reporte INEA exportado (${format})`,
                description: `El usuario exportó el reporte INEA en formato ${format} para la categoría "${selectedReport}".`,
                type: 'success',
                category: 'reportes',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Exportación de reporte: ${selectedReport}`], affectedTables: ['muebles'] }
            });
        } catch (error: Error | unknown) {
            setError('Error al exportar el reporte: ' + (error instanceof Error ? error.message : 'Error desconocido'));
            console.error(error);
            // Notificación de error al exportar
            await createNotification({
                title: 'Error al exportar reporte INEA',
                description: `Error al exportar el reporte INEA: ${(error instanceof Error ? error.message : 'Error desconocido')}`,
                type: 'danger',
                category: 'reportes',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['muebles'] }
            });
        } finally {
            setIsExporting(false);
            setExportingFormat(null);
        }
    };

    const userRole = useUserRole();

    return (
        <div className={`min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 transition-colors duration-500 ${
            isDarkMode 
                ? 'bg-black text-white' 
                : 'bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-900'
        }`}>
            <div className={`w-full mx-auto rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform ${
                isDarkMode 
                    ? 'bg-gradient-to-br from-gray-900/30 via-black to-gray-900/20 border border-gray-800/30' 
                    : 'bg-gradient-to-br from-white via-blue-50/30 to-white border border-gray-200'
            }`}>
                {/* Header */}
                <div className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 transition-colors duration-500 ${
                    isDarkMode 
                        ? 'bg-black/50 border-b border-gray-800/30' 
                        : 'bg-white/80 border-b border-gray-200'
                }`}>
                    <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold flex items-center transition-colors duration-500 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        <span className={`mr-2 sm:mr-3 p-1 sm:p-2 rounded-lg text-sm sm:text-base transition-colors duration-500 ${
                            isDarkMode 
                                ? 'bg-gray-900/30 text-white border border-gray-700/50' 
                                : 'bg-gray-600 text-white border border-gray-700'
                        }`}>
                            <FileText className="h-4 w-4 inline mr-1" />
                            REP
                        </span>
                        Reportes INEA
                    </h1>
                    <div className="flex items-center gap-4">
                        <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
                            <button
                                onClick={() => setFirmasModalOpen(true)}
                                className={`p-2 rounded-lg transition-colors ${
                                    isDarkMode 
                                        ? 'text-gray-400 hover:text-rose-400 border border-gray-800 hover:border-rose-500/30'
                                        : 'text-gray-600 hover:text-rose-600 border border-gray-300 hover:border-rose-400/50'
                                }`}
                                title="Configurar Firmas"
                            >
                                <Settings2 className="h-5 w-5" />
                            </button>
                        </RoleGuard>
                        <div className={`flex items-center gap-2 text-sm transition-colors duration-500 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            <ListChecks className={`h-4 w-4 ${
                                isDarkMode ? 'text-rose-400' : 'text-rose-600'
                            }`} />
                            <span>{reportes.length} categorías de reportes</span>
                        </div>
                    </div>
                </div>

                {/* Main content - Nueva disposición con efectos de glassmorphism */}
                <div className="p-4 sm:p-6 flex justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 place-items-center w-full">
                        {reportes.map((reporte) => (
                            <div
                                key={reporte.id}
                                className={`${reporte.color} backdrop-blur-sm rounded-lg border ${reporte.borderColor} p-4 ${reporte.hoverColor} transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex flex-col items-center w-full min-h-[260px] relative overflow-hidden`}
                            >
                                {/* Efecto de brillo en la esquina */}
                                <div className={`absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br transform rotate-45 ${
                                    isDarkMode ? 'from-white/10 to-transparent' : 'from-blue-200/30 to-transparent'
                                }`}></div>
                                
                                <div className="flex justify-between items-center mb-4 w-full relative">
                                    <div className="flex items-center mx-auto">
                                        <div className={`p-2 rounded-lg mr-3 border ${reporte.borderColor} transition-colors duration-500 ${
                                            isDarkMode ? 'bg-black' : 'bg-white'
                                        }`}>
                                            <span className={reporte.iconColor}>{reporte.icon}</span>
                                        </div>
                                        <h3 className={`text-lg font-medium transition-colors duration-500 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>{reporte.title}</h3>
                                    </div>
                                </div>

                                <p className={`mb-4 text-sm text-center transition-colors duration-500 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    {reporte.title === 'General' ? 'Información completa de todos los registros del sistema' :
                                        reporte.title === 'En Uso*' ? 'Registros marcados como principales en uso' :
                                            reporte.title === 'Sin Uso e Integrado PADFBM' ? 'Bienes sin uso e integrados al PADFBM' :
                                                reporte.title === 'Sin Uso y No Integrado PADFBM' ? 'Bienes sin uso pendientes de integrar' :
                                                    'Registros en uso normal del sistema'}
                                </p>

                                <button
                                    onClick={() => openExportModal(reporte.title)}
                                    className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 border ${reporte.borderColor} hover:${reporte.hoverColor} group ${
                                        isDarkMode ? 'bg-black/40 hover:bg-black/60' : 'bg-white/60 hover:bg-white/80'
                                    }`}
                                >
                                    <Download size={16} className={`${reporte.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                                    <span className={reporte.iconColor}>Exportar</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer con nuevo diseño */}
                <div className={`p-4 text-center text-sm transition-colors duration-500 ${
                    isDarkMode 
                        ? 'bg-black/50 border-t border-gray-800/30 text-gray-300/70' 
                        : 'bg-white/80 border-t border-gray-200 text-gray-600'
                }`}>
                    <p>Selecciona un reporte para exportarlo en PDF, Excel o CSV</p>
                </div>
            </div>

            {/* Modal de exportación - Actualizado con nuevo esquema de colores */}
            {exportModalOpen && (
                <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn backdrop-blur-sm ${
                    isDarkMode ? 'bg-black/90' : 'bg-black/60'
                }`}>
                    <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300 transform flex flex-col items-center ${
                        isDarkMode 
                            ? 'bg-gradient-to-br from-gray-900/50 via-black to-gray-900/30 border border-gray-600/30' 
                            : 'bg-gradient-to-br from-white via-blue-50/30 to-white border border-gray-300'
                    }`}>
                        <div className="relative p-6 flex flex-col items-center w-full">
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                                isDarkMode 
                                    ? 'from-gray-500/60 via-gray-400 to-gray-500/60' 
                                    : 'from-blue-400/60 via-blue-500 to-blue-400/60'
                            }`}></div>
                            <button
                                onClick={() => setExportModalOpen(false)}
                                className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                                    isDarkMode 
                                        ? 'bg-black/60 hover:bg-gray-900/30 text-gray-400 hover:text-gray-300 border border-gray-500/30'
                                        : 'bg-white/80 hover:bg-gray-100 text-gray-600 hover:text-gray-800 border border-gray-300'
                                }`}
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <div className="flex flex-col items-center text-center mb-4 w-full">
                                <div className={`p-3 rounded-full mb-3 mx-auto transition-colors duration-500 ${
                                    isDarkMode 
                                        ? 'bg-gray-500/10 border border-gray-500/30' 
                                        : 'bg-blue-100 border border-blue-200'
                                }`}>
                                    <FileDigit className={`h-8 w-8 transition-colors duration-500 ${
                                        isDarkMode ? 'text-gray-400' : 'text-blue-600'
                                    }`} />
                                </div>
                                <h3 className={`text-2xl font-bold transition-colors duration-500 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>Exportar Reporte</h3>
                                <p className={`mt-2 transition-colors duration-500 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    Selecciona el formato para exportar el reporte <span className={`font-bold ${
                                        isDarkMode ? 'text-gray-300' : 'text-gray-800'
                                    }`}>{selectedReport}</span>
                                </p>
                            </div>
                            <div className="space-y-5 mt-6 w-full">
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => handleExport('PDF')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all transform hover:scale-[1.02] group ${
                                            isDarkMode 
                                                ? 'bg-black hover:bg-rose-900/20 border border-rose-800/30 hover:border-rose-500/50'
                                                : 'bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-400'
                                        }`}
                                        disabled={isExporting}
                                    >
                                        <File size={32} className={`transition-colors mb-2 ${
                                            isDarkMode 
                                                ? 'text-rose-400 group-hover:text-rose-300' 
                                                : 'text-rose-600 group-hover:text-rose-700'
                                        }`} />
                                        <span className={`font-medium ${
                                            isDarkMode ? 'text-rose-100' : 'text-rose-800'
                                        }`}>PDF</span>
                                        <span className={`text-xs ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>Documento</span>
                                    </button>
                                    <button
                                        onClick={() => handleExport('Excel')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all transform hover:scale-[1.02] group ${
                                            isDarkMode 
                                                ? 'bg-black hover:bg-rose-900/20 border border-rose-800/30 hover:border-rose-500/50'
                                                : 'bg-white hover:bg-pink-50 border border-pink-200 hover:border-pink-400'
                                        }`}
                                        disabled={isExporting}
                                    >
                                        <FileSpreadsheet size={32} className={`transition-colors mb-2 ${
                                            isDarkMode 
                                                ? 'text-pink-400 group-hover:text-pink-300' 
                                                : 'text-pink-600 group-hover:text-pink-700'
                                        }`} />
                                        <span className={`font-medium ${
                                            isDarkMode ? 'text-rose-100' : 'text-pink-800'
                                        }`}>Excel</span>
                                        <span className={`text-xs ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>Hoja cálculo</span>
                                    </button>
                                    <button
                                        onClick={() => handleExport('CSV')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all transform hover:scale-[1.02] group ${
                                            isDarkMode 
                                                ? 'bg-black hover:bg-rose-900/20 border border-rose-800/30 hover:border-rose-500/50'
                                                : 'bg-white hover:bg-fuchsia-50 border border-fuchsia-200 hover:border-fuchsia-400'
                                        }`}
                                        disabled={isExporting}
                                    >
                                        <FileText size={32} className={`transition-colors mb-2 ${
                                            isDarkMode 
                                                ? 'text-fuchsia-400 group-hover:text-fuchsia-300' 
                                                : 'text-fuchsia-600 group-hover:text-fuchsia-700'
                                        }`} />
                                        <span className={`font-medium ${
                                            isDarkMode ? 'text-rose-100' : 'text-fuchsia-800'
                                        }`}>CSV</span>
                                        <span className={`text-xs ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>Datos crudos</span>
                                    </button>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => setExportModalOpen(false)}
                                        className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                                            isDarkMode 
                                                ? 'bg-black hover:bg-gray-900/20 border border-gray-800/30 text-gray-300 hover:text-gray-200'
                                                : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 hover:text-gray-800'
                                        }`}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Firmas - Con tema adaptativo */}
            {firmasModalOpen && (
                <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 backdrop-blur-md animate-fadeIn ${
                    isDarkMode ? 'bg-black/95' : 'bg-black/60'
                }`}>
                    <div className={`w-full max-w-md rounded-2xl overflow-hidden transition-colors duration-500 ${
                        isDarkMode 
                            ? 'bg-gradient-to-br from-rose-950/30 via-black to-rose-950/20 border border-rose-800/30'
                            : 'bg-gradient-to-br from-white via-rose-50/30 to-white border border-rose-200'
                    }`}>
                        {/* Barra superior */}
                        <div className={`h-0.5 w-full bg-gradient-to-r ${
                            isDarkMode 
                                ? 'from-rose-700/80 via-rose-400 to-rose-700/80' 
                                : 'from-rose-400/80 via-rose-500 to-rose-400/80'
                        }`}></div>
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-colors duration-500 ${
                                        isDarkMode 
                                            ? 'bg-black border border-rose-700/30' 
                                            : 'bg-white border border-rose-200'
                                    }`}>
                                        <Settings2 className={`h-5 w-5 ${
                                            isDarkMode ? 'text-rose-400' : 'text-rose-600'
                                        }`} />
                                    </div>
                                    <h3 className={`text-lg font-semibold transition-colors duration-500 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>Configuración de Firmas</h3>
                                </div>
                                <button
                                    onClick={() => setFirmasModalOpen(false)}
                                    className={`p-1.5 rounded-lg transition-colors focus:outline-none ${
                                        isDarkMode 
                                            ? 'text-gray-500 hover:text-rose-400' 
                                            : 'text-gray-600 hover:text-rose-600'
                                    }`}
                                    title="Cerrar"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-3 mt-2">
                                {firmas.map((firma) => {
                                    const isEditing = editingFirma?.id === firma.id;
                                    return (
                                        <div 
                                            key={firma.id} 
                                            className={`group p-4 relative rounded-xl transition-all duration-300 ${
                                                isEditing 
                                                    ? isDarkMode 
                                                        ? 'bg-rose-900/20 border border-rose-700/50' 
                                                        : 'bg-rose-50 border border-rose-300'
                                                    : isDarkMode
                                                        ? 'bg-black border border-rose-800/30 hover:border-rose-600/40'
                                                        : 'bg-white border border-rose-200 hover:border-rose-400/60'
                                            }`}
                                        >
                                            {isEditing ? (
                                                <form onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    const updates = {
                                                        nombre: formData.get('nombre'),
                                                        puesto: formData.get('puesto'),
                                                    };
                                                    
                                                    const { error } = await supabase
                                                        .from('firmas')
                                                        .update(updates)
                                                        .eq('id', firma.id);
                                                    
                                                    if (!error) {
                                                        setFirmas(firmas.map(f => 
                                                            f.id === firma.id 
                                                                ? { ...f, 
                                                                    nombre: updates.nombre as string,
                                                                    puesto: updates.puesto as string
                                                                }
                                                                : f
                                                        ));
                                                        setEditingFirma(null);
                                                        // Notificación de edición de firma exitosa
                                                        await createNotification({
                                                            title: 'Firma editada',
                                                            description: `La firma "${firma.concepto}" fue editada correctamente.`,
                                                            type: 'info',
                                                            category: 'firmas',
                                                            device: 'web',
                                                            importance: 'medium',
                                                            data: { changes: [`Edición de firma: ${firma.concepto}`], affectedTables: ['firmas'] }
                                                        });
                                                    } else {
                                                        setError('Error al actualizar la firma');
                                                        // Notificación de error al editar firma
                                                        await createNotification({
                                                            title: 'Error al editar firma',
                                                            description: 'Error al editar la firma.',
                                                            type: 'danger',
                                                            category: 'firmas',
                                                            device: 'web',
                                                            importance: 'high',
                                                            data: { affectedTables: ['firmas'] }
                                                        });
                                                    }
                                                }} className="space-y-3">
                                                    <h4 className={`font-medium text-sm mb-2 transition-colors duration-500 ${
                                                        isDarkMode ? 'text-rose-500' : 'text-rose-700'
                                                    }`}>{firma.concepto}</h4>
                                                    
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className={`block text-xs font-medium mb-1 transition-colors duration-500 ${
                                                                isDarkMode ? 'text-rose-500/70' : 'text-rose-700/80'
                                                            }`}>
                                                                Nombre
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="nombre"
                                                                defaultValue={firma.nombre || ''}
                                                                className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 text-sm transition-all ${
                                                                    isDarkMode 
                                                                        ? 'bg-black border border-gray-800 focus:border-rose-700/60 focus:ring-rose-700/30 text-white'
                                                                        : 'bg-white border border-gray-300 focus:border-rose-500 focus:ring-rose-500/30 text-gray-900'
                                                                }`}
                                                                autoFocus
                                                                title="Nombre de la persona que firma"
                                                                placeholder="Nombre completo"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={`block text-xs font-medium mb-1 transition-colors duration-500 ${
                                                                isDarkMode ? 'text-rose-500/70' : 'text-rose-700/80'
                                                            }`}>
                                                                Puesto
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="puesto"
                                                                defaultValue={firma.puesto || ''}
                                                                className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 text-sm transition-all ${
                                                                    isDarkMode 
                                                                        ? 'bg-black border border-gray-800 focus:border-rose-700/60 focus:ring-rose-700/30 text-white'
                                                                        : 'bg-white border border-gray-300 focus:border-rose-500 focus:ring-rose-500/30 text-gray-900'
                                                                }`}
                                                                title="Puesto de la persona que firma"
                                                                placeholder="Cargo o puesto"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex justify-end gap-2 pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingFirma(null)}
                                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all focus:outline-none ${
                                                                isDarkMode 
                                                                    ? 'bg-gray-900 hover:bg-gray-800 text-gray-400'
                                                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                                                            }`}
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="px-3 py-1.5 bg-gradient-to-r from-rose-800 to-rose-700 hover:from-rose-700 hover:to-rose-600 rounded-md text-white text-xs font-medium transition-all focus:outline-none"
                                                        >
                                                            Guardar
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className={`font-medium text-sm transition-colors duration-500 ${
                                                            isDarkMode ? 'text-rose-500' : 'text-rose-700'
                                                        }`}>{firma.concepto}</h4>
                                                        <p className={`text-sm mt-1.5 transition-colors duration-500 ${
                                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                                        }`}>{firma.nombre || 'Sin asignar'}</p>
                                                        <p className={`text-xs mt-0.5 transition-colors duration-500 ${
                                                            isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                                        }`}>{firma.puesto || 'Sin asignar'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingFirma(firma)}
                                                        className={`p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:outline-none ${
                                                            isDarkMode 
                                                                ? 'bg-black text-gray-500 hover:text-rose-500 border border-gray-800 hover:border-rose-700/30'
                                                                : 'bg-white text-gray-600 hover:text-rose-600 border border-gray-300 hover:border-rose-400/50'
                                                        }`}
                                                        title="Editar firma"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Línea separadora */}
                            <div className={`mt-5 mb-4 h-px w-full bg-gradient-to-r from-transparent to-transparent ${
                                isDarkMode ? 'via-rose-800/30' : 'via-rose-300/50'
                            }`}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Alert - Actualizado con el nuevo esquema de colores */}
            {error && (
                <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 px-4 py-3 rounded-lg shadow-lg z-50 backdrop-blur-sm animate-fade-in transition-colors duration-500 ${
                    isDarkMode 
                        ? 'bg-gray-900/80 text-gray-100 border border-gray-800'
                        : 'bg-white/90 text-gray-900 border border-gray-300'
                }`}>
                    <div className="flex items-center">
                        <AlertCircle className={`h-5 w-5 mr-3 flex-shrink-0 transition-colors duration-500 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <button
                            title='Cerrar alerta'
                            onClick={() => setError(null)}
                            className={`ml-4 flex-shrink-0 p-1 rounded-full transition-colors ${
                                isDarkMode 
                                    ? 'text-gray-200 hover:text-white hover:bg-gray-800/60'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/60'
                            }`}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Loader de exportación moderno */}
            {isExporting && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-fadeIn ${
                    isDarkMode ? 'bg-black/80' : 'bg-black/60'
                }`}>
                    <div className={`rounded-2xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center relative transition-colors duration-500 ${
                        isDarkMode 
                            ? 'bg-gradient-to-br from-gray-900/60 via-black to-gray-900/30 border border-gray-600/30'
                            : 'bg-gradient-to-br from-white via-blue-50/30 to-white border border-gray-300'
                    }`}>
                        {/* Barra animada */}
                        <div className={`w-full h-2 rounded-full overflow-hidden mb-6 mt-2 ${
                            isDarkMode ? 'bg-gray-900/30' : 'bg-gray-200'
                        }`}>
                            <div className={`h-full animate-loader-bar rounded-full ${
                                isDarkMode 
                                    ? 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600'
                                    : 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'
                            }`} style={{ width: '40%' }}></div>
                        </div>
                        <div className="flex flex-col items-center">
                            <FileDigit className={`h-10 w-10 mb-4 animate-pulse transition-colors duration-500 ${
                                isDarkMode ? 'text-gray-400' : 'text-blue-600'
                            }`} />
                            <h3 className={`text-lg font-bold mb-2 transition-colors duration-500 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{exportingFormat === 'PDF' ? 'Generando PDF...' : exportingFormat === 'Excel' ? 'Generando Excel...' : 'Generando CSV...'}</h3>
                            <p className={`text-sm text-center max-w-xs transition-colors duration-500 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                                {exportingFormat === 'PDF'
                                    ? 'Por favor espera mientras se genera el PDF. Este proceso puede tardar varios minutos si hay muchos registros.'
                                    : exportingFormat === 'Excel'
                                        ? 'Por favor espera mientras se genera el archivo Excel.'
                                        : 'Por favor espera mientras se genera el archivo CSV.'}
                            </p>
                        </div>
                    </div>
                    {/* Animación de barra (keyframes) */}
                    <style jsx>{`
                        @keyframes loader-bar {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(250%); }
                        }
                        .animate-loader-bar {
                            animation: loader-bar 1.5s infinite linear;
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
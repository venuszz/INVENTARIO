"use client";
import { useState, useEffect } from 'react';
import {
    FileText, Download, FileSpreadsheet, File,
    FileDigit, X, AlertCircle,
    UserX, MapPin, Trash2, CheckCircle,
    Database, ListChecks, Settings2, Pencil
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { generateExcel } from './excelgenerator';
import { generatePDF } from './pdfgenerator';
import { useUserRole } from "@/hooks/useUserRole";
import RoleGuard from "@/components/roleGuard";

// Firma interface
interface Firma {
    id: number;
    concepto: string;
    nombre: string | null;
    puesto: string | null;
}

export default function ReportesIteaDashboard() {
    // Estado para controlar el modal de exportación
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Estados para la gestión de firmas
    const [firmasModalOpen, setFirmasModalOpen] = useState(false);
    const [firmas, setFirmas] = useState<Firma[]>([]);
    const [editingFirma, setEditingFirma] = useState<Firma | null>(null);

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

    // Datos de reportes ITEA con íconos y colores específicos
    const reportes = [
        {
            id: 1,
            title: 'General',
            path: '/reportes/itea/general',
            icon: <Database className="h-5 w-5" />,
            color: 'bg-blue-900/20',
            borderColor: 'border-blue-800',
            hoverColor: 'hover:border-blue-500',
            iconColor: 'text-blue-400'
        },
        {
            id: 2,
            title: 'Activos',
            path: '/reportes/itea/activos',
            icon: <CheckCircle className="h-5 w-5" />,
            color: 'bg-green-900/20',
            borderColor: 'border-green-800',
            hoverColor: 'hover:border-green-500',
            iconColor: 'text-green-400'
        },
        {
            id: 3,
            title: 'Inactivos',
            path: '/reportes/itea/inactivos',
            icon: <UserX className="h-5 w-5" />,
            color: 'bg-yellow-900/20',
            borderColor: 'border-yellow-800',
            hoverColor: 'hover:border-yellow-500',
            iconColor: 'text-yellow-400'
        },
        {
            id: 4,
            title: 'No localizados',
            path: '/reportes/itea/no-localizados',
            icon: <MapPin className="h-5 w-5" />,
            color: 'bg-orange-900/20',
            borderColor: 'border-orange-800',
            hoverColor: 'hover:border-orange-500',
            iconColor: 'text-orange-400'
        },
        {
            id: 5,
            title: 'Obsoletos',
            path: '/reportes/itea/obsoletos',
            icon: <Trash2 className="h-5 w-5" />,
            color: 'bg-red-900/20',
            borderColor: 'border-red-800',
            hoverColor: 'hover:border-red-500',
            iconColor: 'text-red-400'
        },
    ];

    // Función para abrir el modal de exportación
    const openExportModal = (reportTitle: string) => {
        setSelectedReport(reportTitle);
        setExportModalOpen(true);
    };

    // Exporta el reporte real trayendo todos los datos (paginación manual)
    const handleExport = async (format: string) => {
        setError(null);
        try {
            let query = supabase.from('mueblesitea').select('*', { count: 'exact', head: false });
            const estatus = getEstatusFilter(selectedReport);
            if (estatus) query = query.eq('estatus', estatus);

            // Obtener firmas
            const { data: firmasData, error: firmasError } = await supabase
                .from('firmas')
                .select('*')
                .order('id', { ascending: true });

            if (firmasError) throw firmasError;

            // Traer todos los datos paginando manualmente
            interface MuebleItea {
                id_inv: number;
                rubro: string;
                descripcion: string;
                valor: number;
                f_adq: string;
                formadq: string;
                proveedor: string;
                factura: string;
                ubicacion_es: string;
                ubicacion_mu: string;
                ubicacion_no: string;
                estado: string;
                estatus: string;
                area: string;
                usufinal: string;
                fechabaja: string | null;
                causadebaja: string | null;
                resguardante: string;
                [key: string]: string | number | null; // Add index signature
            }

            let allData: MuebleItea[] = [];
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
            const fileName = `reporte_itea_${selectedReport.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().slice(0, 10)}`;
            if (format === 'Excel') {
                await generateExcel({ 
                    data: allData as Record<string, unknown>[], 
                    columns: exportColumns, 
                    fileName, 
                    worksheetName 
                });
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
                    data: allData, 
                    columns: pdfColumns, 
                    title: reportTitle, 
                    fileName,
                    firmas: firmasData 
                });
            } else {
                // CSV with type-safe key access
                const csv = [
                    exportColumns.map(c => c.header).join(','), 
                    ...allData.map(row => 
                        exportColumns.map(c => `"${(row[c.key as keyof MuebleItea] ?? '')}"`)
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
        } catch (error: unknown) {
            setError('Error al exportar el reporte: ' + (error instanceof Error ? error.message : 'Error desconocido'));
            console.error(error);
        }
    };

    const userRole = useUserRole();

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
                        Reportes ITEA
                    </h1>
                    <div className="flex items-center gap-4">
                        <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
                        <button
                            onClick={() => setFirmasModalOpen(true)}
                            className="p-2 rounded-lg text-gray-400 hover:text-amber-500 transition-colors border border-gray-800 hover:border-amber-500/30"
                            title="Configurar Firmas"
                        >
                            <Settings2 className="h-5 w-5" />
                        </button>
                        </RoleGuard>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <ListChecks className="h-4 w-4 text-blue-400" />
                            <span>{reportes.length} categorías de reportes</span>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="p-4 sm:p-6 flex justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 place-items-center w-full">
                        {reportes.map((reporte) => (
                            <div
                                key={reporte.id}
                                className={`${reporte.color} rounded-xl border ${reporte.borderColor} p-4 ${reporte.hoverColor} transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex flex-col items-center w-full min-h-[260px]`}
                            >
                                <div className="flex justify-between items-center mb-4 w-full">
                                    <div className="flex items-center mx-auto">
                                        <div className={`bg-gray-800 p-2 rounded-lg mr-3 border ${reporte.borderColor}`}>
                                            <span className={reporte.iconColor}>{reporte.icon}</span>
                                        </div>
                                        <h3 className="text-lg font-medium">Reporte {reporte.title}</h3>
                                    </div>
                                </div>

                                <p className="text-gray-400 mb-4 text-sm text-center">
                                    {reporte.title === 'General' ? 'Información completa de todos los registros del sistema' :
                                        reporte.title === 'Activos' ? 'Registros actualmente en uso, con sus diferentes estados' :
                                            reporte.title === 'Inactivos' ? 'Registros dados de baja temporalmente' :
                                                reporte.title === 'No localizados' ? 'Registros con paradero desconocido' :
                                                    reporte.title === 'Obsoletos' ? 'Registros marcados para desecho' :
                                                        'Datos estadísticos y métricas de uso'}
                                </p>

                                <button
                                    onClick={() => openExportModal(reporte.title)}
                                    className={`w-full py-2.5 ${reporte.color.replace('/20', '/40')} hover:${reporte.color.replace('/20', '/60')} rounded-lg flex items-center justify-center gap-2 transition-colors border ${reporte.borderColor} hover:${reporte.hoverColor}`}
                                >
                                    <Download size={16} className={reporte.iconColor} />
                                    <span className={reporte.iconColor}>Exportar</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

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
                                    Selecciona el formato para exportar el reporte <span className="text-yellow-300 font-bold">{selectedReport}</span>
                                </p>
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

            {/* Modal de Firmas con Edición Inline - Negro & Dorado */}
            {firmasModalOpen && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 px-4 backdrop-blur-md animate-fadeIn">
                    <div 
                        className="bg-black w-full max-w-md rounded-2xl overflow-hidden border border-gray-900 firmas-modal-shadow"
                    >
                        {/* Barra superior dorada */}
                        <div className="h-0.5 w-full bg-gradient-to-r from-amber-700/80 via-yellow-500 to-amber-700/80"></div>
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-black rounded-lg border border-amber-700/30">
                                        <Settings2 className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">Configuración de Firmas</h3>
                                </div>
                                <button
                                    onClick={() => setFirmasModalOpen(false)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-amber-500 transition-colors focus:outline-none"
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
                                            className={`group p-4 relative rounded-xl transition-all duration-300 ${isEditing 
                                                ? 'bg-gray-900 border border-amber-700/50' 
                                                : 'bg-gray-950 border border-gray-800 hover:border-amber-800/40'}`}
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
                                                    } else {
                                                        setError('Error al actualizar la firma');
                                                    }
                                                }} className="space-y-3">
                                                    <h4 className="font-medium text-amber-500 text-sm mb-2">{firma.concepto}</h4>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-amber-500/70 mb-1">
                                                                Nombre
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="nombre"
                                                                defaultValue={firma.nombre || ''}
                                                                className="w-full px-3 py-2 bg-black border border-gray-800 focus:border-amber-700/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700/30 text-white text-sm transition-all"
                                                                autoFocus
                                                                title="Nombre de la persona que firma"
                                                                placeholder="Nombre completo"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-amber-500/70 mb-1">
                                                                Puesto
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="puesto"
                                                                defaultValue={firma.puesto || ''}
                                                                className="w-full px-3 py-2 bg-black border border-gray-800 focus:border-amber-700/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700/30 text-white text-sm transition-all"
                                                                title="Puesto de la persona que firma"
                                                                placeholder="Cargo o puesto"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2 pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingFirma(null)}
                                                            className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-md text-gray-400 text-xs font-medium transition-all focus:outline-none"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="px-3 py-1.5 bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-700 hover:to-amber-600 rounded-md text-white text-xs font-medium transition-all focus:outline-none"
                                                        >
                                                            Guardar
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-amber-500 text-sm">{firma.concepto}</h4>
                                                        <p className="text-white text-sm mt-1.5">{firma.nombre || 'Sin asignar'}</p>
                                                        <p className="text-gray-500 text-xs mt-0.5">{firma.puesto || 'Sin asignar'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingFirma(firma)}
                                                        className="p-1.5 rounded-md bg-black opacity-0 group-hover:opacity-100 text-gray-500 hover:text-amber-500 transition-all border border-gray-800 hover:border-amber-700/30 focus:outline-none"
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
                            {/* Línea separadora dorada sutil */}
                            <div className="mt-5 mb-4 h-px w-full bg-gradient-to-r from-transparent via-amber-800/30 to-transparent"></div>
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
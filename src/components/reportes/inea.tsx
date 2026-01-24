"use client";
import { useState } from 'react';
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
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';
import type { Firma } from '@/types/admin';
import { motion, AnimatePresence } from 'framer-motion';

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
    const { isDarkMode } = useTheme();
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [firmasModalOpen, setFirmasModalOpen] = useState(false);
    const [editingFirma, setEditingFirma] = useState<Firma | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportingFormat, setExportingFormat] = useState<string | null>(null);

    const { createNotification } = useNotifications();
    const { firmas } = useAdminIndexation();

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
                return null;
        }
    }

    const reportes = [
        {
            id: 1,
            title: 'General',
            path: '/reportes/inea/general',
            icon: <Database className="h-5 w-5" />
        },
        {
            id: 2,
            title: 'En Uso*',
            path: '/reportes/inea/en-uso-asterisk',
            icon: <CheckCircle className="h-5 w-5" />
        },
        {
            id: 3,
            title: 'Sin Uso e Integrado PADFBM',
            path: '/reportes/inea/integrado',
            icon: <ListChecks className="h-5 w-5" />
        },
        {
            id: 4,
            title: 'Sin Uso y No Integrado PADFBM',
            path: '/reportes/inea/no-integrado',
            icon: <AlertCircle className="h-5 w-5" />
        },
        {
            id: 5,
            title: 'En Uso',
            path: '/reportes/inea/en-uso',
            icon: <CheckCircle className="h-5 w-5" />
        }
    ];

    const openExportModal = (reportTitle: string) => {
        setSelectedReport(reportTitle);
        setExportModalOpen(true);
    };

    const handleExport = async (format: string) => {
        setError(null);
        setIsExporting(true);
        setExportingFormat(format);
        try {
            let query = supabase.from('muebles').select('*', { count: 'exact', head: false });
            const estatus = getEstatusFilter(selectedReport);
            if (estatus) query = query.eq('estatus', estatus);

            const firmasData = firmas;

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
            let worksheetName = selectedReport.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 28);
            if (!worksheetName) worksheetName = 'Reporte';
            const fileName = `reporte_inea_${selectedReport.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}`;

            const exportData: Record<string, unknown>[] = allData.map(item => ({
                ...item,
                valor: item.valor?.toString() || '',
                f_adq: item.f_adq || '',
                fechabaja: item.fechabaja || ''
            }));

            if (format === 'Excel') {
                await generateExcel({ data: exportData, fileName, worksheetName });
            } else if (format === 'PDF') {
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
        <div className={`h-screen overflow-hidden transition-colors duration-300 ${
            isDarkMode 
                ? 'bg-black text-white' 
                : 'bg-white text-black'
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
                <div className="w-full max-w-5xl mx-auto">
                {/* Header */}
                <div className={`flex justify-between items-center mb-8 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                    <div>
                        <h1 className="text-3xl font-light tracking-tight mb-1">
                            Reportes INEA
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            Exporta reportes en diferentes formatos
                        </p>
                    </div>
                    <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
                        <motion.button
                            onClick={() => setFirmasModalOpen(true)}
                            className={`p-2 rounded-lg transition-colors ${
                                isDarkMode 
                                    ? 'hover:bg-white/5'
                                    : 'hover:bg-black/5'
                            }`}
                            title="Configurar Firmas"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Settings2 size={20} />
                        </motion.button>
                    </RoleGuard>
                </div>

                {/* Main content */}
                <motion.div 
                    className="space-y-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <AnimatePresence mode="popLayout">
                        {reportes.map((reporte, index) => (
                            <motion.div
                                key={reporte.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ 
                                    delay: index * 0.05,
                                    layout: { type: 'spring', stiffness: 350, damping: 30 }
                                }}
                                className={`group flex items-center justify-between px-4 py-3.5 rounded-lg border transition-all ${
                                    isDarkMode
                                        ? 'bg-black border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                        : 'bg-white border-black/5 hover:border-black/10 hover:bg-black/[0.02]'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <motion.div 
                                        className={`p-2 rounded-lg transition-colors ${
                                            isDarkMode ? 'bg-white/5' : 'bg-black/5'
                                        }`}
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        transition={{ type: 'spring', stiffness: 400 }}
                                    >
                                        {reporte.icon}
                                    </motion.div>
                                    <div>
                                        <h3 className="text-sm font-medium">{reporte.title}</h3>
                                        <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                                            {reporte.title === 'General' ? 'Información completa de todos los registros' :
                                                reporte.title === 'En Uso*' ? 'Registros marcados como principales en uso' :
                                                    reporte.title === 'Sin Uso e Integrado PADFBM' ? 'Bienes sin uso e integrados al PADFBM' :
                                                        reporte.title === 'Sin Uso y No Integrado PADFBM' ? 'Bienes sin uso pendientes de integrar' :
                                                            'Registros en uso normal del sistema'}
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={() => openExportModal(reporte.title)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                                        isDarkMode
                                            ? 'bg-white text-black hover:bg-white/90'
                                            : 'bg-black text-white hover:bg-black/90'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Download size={14} />
                                    Exportar
                                </motion.button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Footer */}
                <motion.div 
                    className={`mt-8 pt-4 border-t text-xs ${isDarkMode ? 'border-white/10 text-white/40' : 'border-black/10 text-black/40'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {reportes.length} categorías de reportes disponibles
                </motion.div>
                </div>
            </motion.div>

            {/* Modal de exportación */}
            <AnimatePresence>
                {exportModalOpen && (
                    <motion.div 
                        className={`fixed inset-0 flex items-center justify-center z-50 px-4 backdrop-blur-sm ${
                            isDarkMode ? 'bg-black/90' : 'bg-black/60'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setExportModalOpen(false)}
                    >
                        <motion.div 
                            className={`rounded-xl w-full max-w-lg overflow-hidden transition-all ${
                                isDarkMode 
                                    ? 'bg-black border border-white/10' 
                                    : 'bg-white border border-black/10'
                            }`}
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <motion.div 
                                            className={`p-3 rounded-lg ${
                                                isDarkMode ? 'bg-white/5' : 'bg-black/5'
                                            }`}
                                            initial={{ rotate: -10 }}
                                            animate={{ rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 200 }}
                                        >
                                            <FileDigit size={24} />
                                        </motion.div>
                                        <div>
                                            <h3 className="text-xl font-medium">Exportar Reporte</h3>
                                            <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                                {selectedReport}
                                            </p>
                                        </div>
                                    </div>
                                    <motion.button
                                        onClick={() => setExportModalOpen(false)}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                            isDarkMode 
                                                ? 'hover:bg-white/5'
                                                : 'hover:bg-black/5'
                                        }`}
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Cerrar"
                                    >
                                        <X size={18} />
                                    </motion.button>
                                </div>
                                
                                <p className={`text-sm mb-6 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                                    Selecciona el formato de exportación
                                </p>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    <motion.button
                                        onClick={() => handleExport('PDF')}
                                        className={`relative flex flex-col items-center justify-center p-6 rounded-xl transition-all border overflow-hidden group ${
                                            isDarkMode 
                                                ? 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                                : 'border-black/10 hover:border-black/20 hover:bg-black/5'
                                        }`}
                                        disabled={isExporting}
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{
                                                background: isDarkMode 
                                                    ? 'radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)'
                                                    : 'radial-gradient(circle at center, rgba(0,0,0,0.03) 0%, transparent 70%)'
                                            }}
                                        />
                                        <motion.div
                                            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <File size={32} className="mb-3" />
                                        </motion.div>
                                        <span className="text-sm font-medium mb-1">PDF</span>
                                        <span className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                                            Documento
                                        </span>
                                    </motion.button>
                                    
                                    <motion.button
                                        onClick={() => handleExport('Excel')}
                                        className={`relative flex flex-col items-center justify-center p-6 rounded-xl transition-all border overflow-hidden group ${
                                            isDarkMode 
                                                ? 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                                : 'border-black/10 hover:border-black/20 hover:bg-black/5'
                                        }`}
                                        disabled={isExporting}
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{
                                                background: isDarkMode 
                                                    ? 'radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)'
                                                    : 'radial-gradient(circle at center, rgba(0,0,0,0.03) 0%, transparent 70%)'
                                            }}
                                        />
                                        <motion.div
                                            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <FileSpreadsheet size={32} className="mb-3" />
                                        </motion.div>
                                        <span className="text-sm font-medium mb-1">Excel</span>
                                        <span className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                                            Hoja de cálculo
                                        </span>
                                    </motion.button>
                                    
                                    <motion.button
                                        onClick={() => handleExport('CSV')}
                                        className={`relative flex flex-col items-center justify-center p-6 rounded-xl transition-all border overflow-hidden group ${
                                            isDarkMode 
                                                ? 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                                : 'border-black/10 hover:border-black/20 hover:bg-black/5'
                                        }`}
                                        disabled={isExporting}
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{
                                                background: isDarkMode 
                                                    ? 'radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)'
                                                    : 'radial-gradient(circle at center, rgba(0,0,0,0.03) 0%, transparent 70%)'
                                            }}
                                        />
                                        <motion.div
                                            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <FileText size={32} className="mb-3" />
                                        </motion.div>
                                        <span className="text-sm font-medium mb-1">CSV</span>
                                        <span className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                                            Datos crudos
                                        </span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Firmas */}
            <AnimatePresence>
                {firmasModalOpen && (
                    <motion.div 
                        className={`fixed inset-0 flex items-center justify-center z-50 px-4 backdrop-blur-sm ${
                            isDarkMode ? 'bg-black/90' : 'bg-black/60'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setFirmasModalOpen(false)}
                    >
                        <motion.div 
                            className={`w-full max-w-md rounded-xl overflow-hidden transition-colors ${
                                isDarkMode 
                                    ? 'bg-black border border-white/10'
                                    : 'bg-white border border-black/10'
                            }`}
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <motion.div 
                                            className={`p-2 rounded-lg transition-colors ${
                                                isDarkMode 
                                                    ? 'bg-white/5' 
                                                    : 'bg-black/5'
                                            }`}
                                            whileHover={{ rotate: 180 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Settings2 size={18} />
                                        </motion.div>
                                        <h3 className="text-lg font-medium">Configuración de Firmas</h3>
                                    </div>
                                    <motion.button
                                        onClick={() => setFirmasModalOpen(false)}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                            isDarkMode 
                                                ? 'hover:bg-white/5' 
                                                : 'hover:bg-black/5'
                                        }`}
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Cerrar"
                                    >
                                        <X size={16} />
                                    </motion.button>
                                </div>

                                <div className="space-y-3 mt-2">
                                    <AnimatePresence mode="popLayout">
                                        {firmas.map((firma, index) => {
                                            const isEditing = editingFirma?.id === firma.id;
                                            return (
                                                <motion.div 
                                                    key={firma.id}
                                                    layout
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ 
                                                        delay: index * 0.05,
                                                        layout: { type: 'spring', stiffness: 350, damping: 30 }
                                                    }}
                                                    className={`group p-4 relative rounded-lg transition-all border ${
                                                        isEditing 
                                                            ? isDarkMode 
                                                                ? 'bg-white/5 border-white/20' 
                                                                : 'bg-black/5 border-black/20'
                                                            : isDarkMode
                                                                ? 'bg-black border-white/5 hover:border-white/10'
                                                                : 'bg-white border-black/5 hover:border-black/10'
                                                    }`}
                                                >
                                                    {isEditing ? (
                                                        <motion.form 
                                                            onSubmit={async (e) => {
                                                                e.preventDefault();
                                                                const formData = new FormData(e.currentTarget);
                                                                const updates = {
                                                                    nombre: formData.get('nombre'),
                                                                    puesto: formData.get('puesto'),
                                                                };
                                                                
                                                                try {
                                                                    const response = await fetch(`/api/supabase-proxy?target=${encodeURIComponent(`/rest/v1/firmas?id=eq.${firma.id}`)}`, {
                                                                        method: 'PATCH',
                                                                        credentials: 'include',
                                                                        headers: { 
                                                                            'Content-Type': 'application/json',
                                                                            'Prefer': 'return=representation'
                                                                        },
                                                                        body: JSON.stringify(updates)
                                                                    });
                                                                    
                                                                    if (!response.ok) {
                                                                        throw new Error('Error al actualizar la firma');
                                                                    }
                                                                    
                                                                    setEditingFirma(null);
                                                                    
                                                                    await createNotification({
                                                                        title: 'Firma editada',
                                                                        description: `La firma "${firma.concepto}" fue editada correctamente.`,
                                                                        type: 'info',
                                                                        category: 'firmas',
                                                                        device: 'web',
                                                                        importance: 'medium',
                                                                        data: { changes: [`Edición de firma: ${firma.concepto}`], affectedTables: ['firmas'] }
                                                                    });
                                                                } catch (error) {
                                                                    setError('Error al actualizar la firma');
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
                                                            }} 
                                                            className="space-y-3"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                        >
                                                            <h4 className={`font-medium text-sm mb-2 ${
                                                                isDarkMode ? 'text-white/80' : 'text-black/80'
                                                            }`}>{firma.concepto}</h4>
                                                            
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className={`block text-xs font-medium mb-1 ${
                                                                        isDarkMode ? 'text-white/60' : 'text-black/60'
                                                                    }`}>
                                                                        Nombre
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        name="nombre"
                                                                        defaultValue={firma.nombre || ''}
                                                                        className={`w-full px-3 py-2 rounded-lg text-sm transition-all border ${
                                                                            isDarkMode 
                                                                                ? 'bg-black border-white/10 text-white focus:border-white/20'
                                                                                : 'bg-white border-black/10 text-black focus:border-black/20'
                                                                        } focus:outline-none`}
                                                                        autoFocus
                                                                        placeholder="Nombre completo"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className={`block text-xs font-medium mb-1 ${
                                                                        isDarkMode ? 'text-white/60' : 'text-black/60'
                                                                    }`}>
                                                                        Puesto
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        name="puesto"
                                                                        defaultValue={firma.puesto || ''}
                                                                        className={`w-full px-3 py-2 rounded-lg text-sm transition-all border ${
                                                                            isDarkMode 
                                                                                ? 'bg-black border-white/10 text-white focus:border-white/20'
                                                                                : 'bg-white border-black/10 text-black focus:border-black/20'
                                                                        } focus:outline-none`}
                                                                        placeholder="Cargo o puesto"
                                                                    />
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex justify-end gap-2 pt-2">
                                                                <motion.button
                                                                    type="button"
                                                                    onClick={() => setEditingFirma(null)}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                                        isDarkMode 
                                                                            ? 'hover:bg-white/5'
                                                                            : 'hover:bg-black/5'
                                                                    }`}
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                >
                                                                    Cancelar
                                                                </motion.button>
                                                                <motion.button
                                                                    type="submit"
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                                        isDarkMode
                                                                            ? 'bg-white text-black hover:bg-white/90'
                                                                            : 'bg-black text-white hover:bg-black/90'
                                                                    }`}
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                >
                                                                    Guardar
                                                                </motion.button>
                                                            </div>
                                                        </motion.form>
                                                    ) : (
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-medium text-sm">{firma.concepto}</h4>
                                                                <p className="text-sm mt-1.5">{firma.nombre || 'Sin asignar'}</p>
                                                                <p className={`text-xs mt-0.5 ${
                                                                    isDarkMode ? 'text-white/40' : 'text-black/40'
                                                                }`}>{firma.puesto || 'Sin asignar'}</p>
                                                            </div>
                                                            <motion.button
                                                                onClick={() => setEditingFirma(firma)}
                                                                className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                                                    isDarkMode 
                                                                        ? 'hover:bg-white/5'
                                                                        : 'hover:bg-black/5'
                                                                }`}
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Editar firma"
                                                            >
                                                                <Pencil size={14} />
                                                            </motion.button>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Alert */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg z-50 backdrop-blur-sm transition-colors border ${
                            isDarkMode 
                                ? 'bg-black/90 text-white border-white/10'
                                : 'bg-white/90 text-black border-black/10'
                        }`}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 10, 0] }}
                                transition={{ duration: 0.5 }}
                            >
                                <AlertCircle size={18} />
                            </motion.div>
                            <p className="text-sm font-medium">{error}</p>
                            <motion.button
                                onClick={() => setError(null)}
                                className={`p-1 rounded-lg transition-colors ${
                                    isDarkMode 
                                        ? 'hover:bg-white/10'
                                        : 'hover:bg-black/10'
                                }`}
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <X size={14} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loader de exportación */}
            <AnimatePresence>
                {isExporting && (
                    <motion.div 
                        className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
                            isDarkMode ? 'bg-black/80' : 'bg-black/60'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className={`rounded-xl w-full max-w-xs p-8 flex flex-col items-center transition-colors border ${
                                isDarkMode 
                                    ? 'bg-black border-white/10'
                                    : 'bg-white border-black/10'
                            }`}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        >
                            <div className={`w-full h-1 rounded-full overflow-hidden mb-6 ${
                                isDarkMode ? 'bg-white/10' : 'bg-black/10'
                            }`}>
                                <motion.div 
                                    className={`h-full rounded-full ${
                                        isDarkMode 
                                            ? 'bg-white'
                                            : 'bg-black'
                                    }`} 
                                    style={{ width: '40%' }}
                                    animate={{ x: ['-100%', '250%'] }}
                                    transition={{ 
                                        repeat: Infinity, 
                                        duration: 1.5, 
                                        ease: 'linear' 
                                    }}
                                />
                            </div>
                            <motion.div
                                animate={{ 
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ 
                                    repeat: Infinity, 
                                    duration: 2,
                                    ease: 'easeInOut'
                                }}
                            >
                                <FileDigit size={40} className="mb-4" />
                            </motion.div>
                            <h3 className="text-lg font-medium mb-2">
                                {exportingFormat === 'PDF' ? 'Generando PDF...' : exportingFormat === 'Excel' ? 'Generando Excel...' : 'Generando CSV...'}
                            </h3>
                            <motion.p 
                                className={`text-sm text-center ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                {exportingFormat === 'PDF'
                                    ? 'Por favor espera mientras se genera el PDF'
                                    : exportingFormat === 'Excel'
                                        ? 'Por favor espera mientras se genera el Excel'
                                        : 'Por favor espera mientras se genera el CSV'}
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

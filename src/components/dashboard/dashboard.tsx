"use client";
import { useState, useEffect, JSX } from 'react';
import {
    FileText,
    X, AlertCircle,
    CheckCircle,
    ClipboardList, Layers, Layers3, AlertTriangle, Archive, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import supabase from '@/app/lib/supabase/client';
import { generateDashboardPDF } from './dashboardPDF';

export interface Rubro {
    id: number | string;
    numeroPartida: string;
    rubro: string;
    count: number;
    sum: number;
    isPreFilled: boolean;
    [key: string]: string | number | boolean | undefined;
}

export default function ReportesIneaDashboard() {
    // Estados principales
    const [] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportDate, setExportDate] = useState('');
    const [editableRubros, setEditableRubros] = useState<Rubro[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [totalMuebles, setTotalMuebles] = useState<number | null>(null);
    const [totalValorMuebles, setTotalValorMuebles] = useState<number | null>(null);
    const [rubrosPorEstatus, setRubrosPorEstatus] = useState<{
        [estatus: string]: Array<{ rubro: string; count: number; sum: number }>;
    }>({});
    const [resumenGeneral, setResumenGeneral] = useState<Array<{ rubro: string; count: number; sum: number }>>([]);
    const [modalReporte, setModalReporte] = useState<null | string>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [dashboardType, setDashboardType] = useState<'INEA' | 'ITEA' | null>(null);
    const [activeWarehouse] = useState<'INEA' | 'ITEA'>('INEA');
    const [estatusData, setEstatusData] = useState<Array<{ estatus: string; count: number; sum: number }>>([]);
    const [sinEstatusData, setSinEstatusData] = useState<{ count: number; sum: number }>({ count: 0, sum: 0 });
    const tableName = dashboardType === 'ITEA' ? 'mueblesitea' : 'muebles';

    // Funciones auxiliares
    const handleOpenModal = (reporteTitle: string) => {
        setModalReporte(reporteTitle);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setTimeout(() => setModalReporte(null), 300);
    };

    const addNewRubro = () => {
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${editableRubros.length}`;
        setEditableRubros([
            ...editableRubros,
            { id: uniqueId, numeroPartida: '', rubro: '', count: 0, sum: 0, isPreFilled: false },
        ]);
    };

    const updateRubro = (index: number, field: string, value: string | number | boolean) => {
        const updatedRubros = [...editableRubros];
        updatedRubros[index][field] = value;
        setEditableRubros(updatedRubros);
    };

    const removeRubro = (index: number) => {
        const updatedRubros = [...editableRubros];
        updatedRubros.splice(index, 1);
        setEditableRubros(updatedRubros);
    };

    const reorderRubros = (fromIndex: number, toIndex: number) => {
        const updatedRubros = [...editableRubros];
        const [movedRubro] = updatedRubros.splice(fromIndex, 1);
        updatedRubros.splice(toIndex, 0, movedRubro);
        setEditableRubros(updatedRubros);
    };

    const handleExportPDFWithData = () => {
        const formatDate = (dateString: string) => {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC'
            }).toLowerCase();
        };

        generateDashboardPDF({
            title: dashboardType === 'ITEA' ? 'Dashboard ITEA' : 'Dashboard INEA',
            totalBienes: editableRubros.reduce((acc, rubro) => acc + rubro.count, 0),
            sumaValores: editableRubros.reduce((acc, rubro) => acc + rubro.sum, 0),
            rubros: editableRubros,
            fileName: `dashboard_${activeWarehouse.toLowerCase()}`,
            warehouse: activeWarehouse as 'INEA' | 'ITEA',
            date: formatDate(exportDate)
        });
        setShowExportModal(false);
    };

    // Nueva función para exportar PDF general
    const handleExportClick = () => {
        const initialRubros = resumenGeneral.map((r, index) => ({
            id: `${Date.now() + index}_${Math.random().toString(36).substr(2, 9)}`,
            numeroPartida: '',
            rubro: r.rubro,
            count: r.count,
            sum: r.sum,
            isPreFilled: true
        }));
        
        setEditableRubros(initialRubros);
        setShowExportModal(true);
    };

    // Efectos para cargar datos
    useEffect(() => {
        const fetchFirmas = async () => {
            const { error } = await supabase
                .from('firmas')
                .select('*')
                .order('id', { ascending: true });

            if (error) setError('Error al cargar las firmas: ' + error.message);
        };

        fetchFirmas();
    }, []);

    useEffect(() => {
        if (!dashboardType) return;

        const fetchTotalBienes = async () => {
            const { count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            setTotalMuebles(count || 0);
        };

        const fetchSumaValores = async () => {
            let total = 0;
            let from = 0;
            const pageSize = 1000;
            let keepGoing = true;

            while (keepGoing) {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('valor')
                    .neq('estatus', 'BAJA')
                    .range(from, from + pageSize - 1);

                if (error) break;
                if (data && data.length > 0) {
                    total += data.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
                    if (data.length < pageSize) keepGoing = false;
                    else from += pageSize;
                } else {
                    keepGoing = false;
                }
            }
            setTotalValorMuebles(total);
        };

        fetchTotalBienes();
        fetchSumaValores();
    }, [tableName, dashboardType]);

    useEffect(() => {
        if (!dashboardType) return;

        const fetchEstatusCounts = async () => {
            const { data, error } = await supabase
                .from(tableName)
                .select('estatus,valor');

            if (error) {
                console.error('Error fetching estatus data:', error);
                return;
            }

            const estatusMap: { [key: string]: { count: number; sum: number } } = {};
            let sinEstatusCount = 0;
            let sinEstatusSum = 0;

            data.forEach(item => {
                if (!item.estatus) {
                    sinEstatusCount++;
                    sinEstatusSum += parseFloat(item.valor) || 0;
                    return;
                }

                if (!estatusMap[item.estatus]) {
                    estatusMap[item.estatus] = { count: 0, sum: 0 };
                }

                estatusMap[item.estatus].count++;
                estatusMap[item.estatus].sum += parseFloat(item.valor) || 0;
            });

            const estatusArray = Object.entries(estatusMap).map(([estatus, { count, sum }]) => ({
                estatus,
                count,
                sum
            }));

            setEstatusData(estatusArray);
            setSinEstatusData({ count: sinEstatusCount, sum: sinEstatusSum });
        };

        fetchEstatusCounts();
    }, [tableName, dashboardType]);

    useEffect(() => {
        if (!dashboardType) return;

        const fetchRubrosPorEstatus = async () => {
            const estatuses = dashboardType === 'ITEA'
                ? estatusData.map(item => ({ key: item.estatus, value: item.estatus }))
                : [
                    { key: 'EN USO', value: 'EN USO' },
                    { key: 'EN USO*', value: 'EN USO*' },
                    {
                        key: 'SIN USO Y NO INTEGRADO AL PADFBM INEA (REALIZAR BAJA)',
                        value: 'SIN USO Y NO INTEGRADO AL PADFBM INEA (REALIZAR BAJA)'
                    },
                    {
                        key: 'SIN USO E INTEGRADO AL PADFBM INEA',
                        value: 'SIN USO E INTEGRADO AL PADFBM INEA'
                    }
                ];

            const result: { [estatus: string]: Array<{ rubro: string; count: number; sum: number }> } = {};

            // Agregar también los datos sin estatus
            estatuses.push({ key: 'SIN ESTATUS', value: '' });

            for (const est of estatuses) {
                let from = 0;
                const pageSize = 1000;
                let keepGoing = true;
                const rubrosMap: { [rubro: string]: { count: number; sum: number } } = {};

                while (keepGoing) {
                    const { data, error } = await supabase
                        .from(tableName)
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

                        if (data.length < pageSize) keepGoing = false;
                        else from += pageSize;
                    } else {
                        keepGoing = false;
                    }
                }

                result[est.key] = Object.entries(rubrosMap).map(([rubro, v]) => ({ rubro, ...v }));
            }

            setRubrosPorEstatus(result);
        };

        fetchRubrosPorEstatus();
    }, [tableName, dashboardType, estatusData]);

    useEffect(() => {
        if (!dashboardType) return;

        const fetchResumenGeneral = async () => {
            let from = 0;
            const pageSize = 1000;
            let keepGoing = true;
            const rubrosMap: { [rubro: string]: { count: number; sum: number } } = {};

            while (keepGoing) {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('rubro,valor')
                    .range(from, from + pageSize - 1);

                if (error) break;

                if (data && data.length > 0) {
                    data.forEach((item) => {
                        if (!item.rubro) return;
                        if (item.rubro.trim().toLowerCase() === 'comunicación') return;
                        if (!rubrosMap[item.rubro]) rubrosMap[item.rubro] = { count: 0, sum: 0 };
                        rubrosMap[item.rubro].count++;
                        rubrosMap[item.rubro].sum += parseFloat(item.valor) || 0;
                    });

                    if (data.length < pageSize) keepGoing = false;
                    else from += pageSize;
                } else {
                    keepGoing = false;
                }
            }

            const resumenData = Object.entries(rubrosMap)
                .map(([rubro, v]) => ({ rubro, ...v }))
                .sort((a, b) => b.sum - a.sum);

            setResumenGeneral(resumenData);
        };

        fetchResumenGeneral();
    }, [tableName, dashboardType]);

    // Configuración de las tarjetas de reporte
    type Reporte = {
        id: number;
        title: string;
        icon: JSX.Element;
        color: string;
        borderColor: string;
        hoverColor: string;
        iconColor: string;
        description: string;
        estatusValue?: string;
    };

    const reportesBase: Reporte[] = dashboardType === 'ITEA'
        ? [
            {
                id: 1,
                title: 'General',
                icon: <ClipboardList className="h-5 w-5" />,
                color: 'bg-violet-900/20',
                borderColor: 'border-violet-800',
                hoverColor: 'hover:border-violet-500',
                iconColor: 'text-violet-400',
                description: 'Información completa de todos los registros del sistema ITEA'
            },
            ...estatusData.map((estatusItem, index) => {
                // Paleta de colores igual a reportes/itea.tsx
                const colors = [
                    { bg: 'bg-teal-900/20', border: 'border-teal-800', hover: 'hover:border-teal-500', icon: 'text-teal-400' },
                    { bg: 'bg-pink-900/20', border: 'border-pink-800', hover: 'hover:border-pink-500', icon: 'text-pink-400' },
                    { bg: 'bg-cyan-900/20', border: 'border-cyan-800', hover: 'hover:border-cyan-500', icon: 'text-cyan-400' },
                    { bg: 'bg-rose-900/20', border: 'border-rose-800', hover: 'hover:border-rose-500', icon: 'text-rose-400' },
                    { bg: 'bg-violet-900/20', border: 'border-violet-800', hover: 'hover:border-violet-500', icon: 'text-violet-400' }
                ];
                const colorIndex = index % colors.length;
                const selectedColor = colors[colorIndex];
                return {
                    id: 100 + index,
                    title: estatusItem.estatus,
                    icon: estatusItem.estatus.includes('EN USO')
                        ? <CheckCircle className="h-5 w-5" />
                        : estatusItem.estatus.includes('SIN USO')
                            ? <Archive className="h-5 w-5" />
                            : <FileText className="h-5 w-5" />,
                    color: selectedColor.bg,
                    borderColor: selectedColor.border,
                    hoverColor: selectedColor.hover,
                    iconColor: selectedColor.icon,
                    description: `Bienes ITEA con estatus: ${estatusItem.estatus}`,
                    estatusValue: estatusItem.estatus
                };
            }),
            // Tarjeta para registros sin estatus
            {
                id: 999,
                title: 'SIN ESTATUS',
                icon: <AlertCircle className="h-5 w-5" />,
                color: 'bg-gray-900/20',
                borderColor: 'border-gray-700',
                hoverColor: 'hover:border-gray-500',
                iconColor: 'text-gray-400',
                description: 'Bienes sin estatus asignado',
                estatusValue: ''
            }
        ]
        : [
            {
                id: 1,
                title: 'General',
                icon: <ClipboardList className="h-5 w-5" />,
                color: 'bg-violet-900/20',
                borderColor: 'border-violet-800',
                hoverColor: 'hover:border-violet-500',
                iconColor: 'text-violet-400',
                description: 'Información completa de todos los registros del sistema INEA'
            },
            {
                id: 2,
                title: 'EN USO',
                icon: <CheckCircle className="h-5 w-5" />,
                color: 'bg-teal-900/20',
                borderColor: 'border-teal-800',
                hoverColor: 'hover:border-teal-500',
                iconColor: 'text-teal-400',
                description: 'Registros INEA actualmente en uso',
                estatusValue: 'EN USO'
            },
            {
                id: 3,
                title: 'EN USO*',
                icon: <CheckCircle className="h-5 w-5" />,
                color: 'bg-pink-900/20',
                borderColor: 'border-pink-800',
                hoverColor: 'hover:border-pink-500',
                iconColor: 'text-pink-400',
                description: 'Registros INEA en uso con observaciones',
                estatusValue: 'EN USO*'
            },
            {
                id: 4,
                title: 'SIN USO Y NO INTEGRADO AL PADFBM INEA (REALIZAR BAJA)',
                icon: <AlertTriangle className="h-5 w-5" />,
                color: 'bg-cyan-900/20',
                borderColor: 'border-cyan-800',
                hoverColor: 'hover:border-cyan-500',
                iconColor: 'text-cyan-400',
                description: 'Bienes INEA sin uso y no integrados al PADFBM (para baja)',
                estatusValue: 'SIN USO Y NO INTEGRADO AL PADFBM INEA (REALIZAR BAJA)'
            },
            {
                id: 5,
                title: 'SIN USO E INTEGRADO AL PADFBM INEA',
                icon: <Archive className="h-5 w-5" />,
                color: 'bg-rose-900/20',
                borderColor: 'border-rose-800',
                hoverColor: 'hover:border-rose-500',
                iconColor: 'text-rose-400',
                description: 'Bienes INEA sin uso pero integrados al PADFBM',
                estatusValue: 'SIN USO E INTEGRADO AL PADFBM INEA'
            },
            {
                id: 999,
                title: 'SIN ESTATUS',
                icon: <AlertCircle className="h-5 w-5" />,
                color: 'bg-gray-900/20',
                borderColor: 'border-gray-700',
                hoverColor: 'hover:border-gray-500',
                iconColor: 'text-gray-400',
                description: 'Bienes sin estatus asignado',
                estatusValue: ''
            }
        ];

    const reportes = [...reportesBase];

    // Renderizado del componente
    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
            {/* Selector de dashboard */}
            <div className="flex flex-col items-center justify-center mb-8">
                <span className="block text-[14px] font-bold text-blue-300 tracking-wide uppercase mb-3 text-center w-full">
                    CLASIFICACIÓN DEL GASTO
                </span>
                <div className="flex flex-row gap-2 justify-start">
                    <div className="flex flex-col items-center">
                        <div
                            className={`flex flex-col items-center justify-center cursor-pointer border-2 rounded-lg p-2 shadow-md transition-all min-w-[70px] max-w-[90px]
                            ${dashboardType === 'INEA' ? 'bg-green-600 border-green-600 scale-105 text-white' : 'bg-green-900/20 border-green-700 hover:border-green-400 text-green-300 hover:scale-105'}`}
                            onClick={() => setDashboardType('INEA')}
                            >
                            <Layers className={`h-5 w-5 mb-1 ${dashboardType === 'INEA' ? 'text-white' : 'text-green-400'}`} />
                            <span className={`text-sm font-bold ${dashboardType === 'INEA' ? 'text-white' : 'text-green-300'}`}>INEA</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div
                            className={`flex flex-col items-center justify-center cursor-pointer border-2 rounded-lg p-2 shadow-md transition-all min-w-[70px] max-w-[90px]
                            ${dashboardType === 'ITEA' ? 'bg-purple-600 border-purple-600 scale-105 text-white' : 'bg-purple-900/20 border-purple-700 hover:border-purple-400 text-purple-300 hover:scale-105'}`}
                            onClick={() => setDashboardType('ITEA')}
                            >
                            <Layers3 className={`h-5 w-5 mb-1 ${dashboardType === 'ITEA' ? 'text-white' : 'text-purple-400'}`} />
                            <span className={`text-sm font-bold ${dashboardType === 'ITEA' ? 'text-white' : 'text-purple-300'}`}>ITEA</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard principal */}
            {dashboardType && (
                <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden border border-gray-800 transition-all duration-500 transform">
                    {/* Header */}
                    <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                                <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">
                                    <FileText className="h-4 w-4 inline mr-1" />
                                    DAS
                                </span>
                                {dashboardType === 'ITEA' ? 'Dashboard ITEA' : 'Dashboard INEA'}
                            </h1>
                            {/* Botón de exportar PDF */}
                            {dashboardType === 'INEA' && (
                                <button
                                    onClick={handleExportClick}
                                    className="ml-3 flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 bg-gradient-to-br from-purple-900/80 via-purple-800/80 to-purple-900/80 border-purple-500/30 text-purple-200 hover:bg-purple-800/90"
                                    title={`Exportar PDF Totales ${dashboardType}`}
                                    disabled={!resumenGeneral.length}
                                >
                                    <Download size={18} className="text-purple-300" />
                                    <span className="font-medium">Exportar PDF</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tarjetas de reportes */}
                    <div className="p-4 sm:p-6 flex justify-center">
                        <div className="w-full flex flex-col items-center">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto justify-items-center">
                                {reportes.map((reporte) => {
                                    const estatusItem = estatusData.find(item => item.estatus === reporte.estatusValue);
                                    const rubrosData = rubrosPorEstatus[reporte.estatusValue || reporte.title];
                                    const isSinEstatus = reporte.title === 'SIN ESTATUS';

                                    return (
                                        <div
                                            key={reporte.id}
                                            className={`${reporte.color} rounded-xl border ${reporte.borderColor} p-4 cursor-pointer transition-all shadow-lg hover:shadow-2xl hover:scale-105 flex flex-col items-center w-full h-[200px] max-w-xs mx-auto text-[10px] md:text-xs min-w-0 justify-between`}
                                            onClick={() => handleOpenModal(reporte.title)}
                                        >
                                            <div className="flex flex-col items-center w-full gap-2">
                                                <div className="flex items-center justify-center w-full">
                                                    <div className={`bg-gray-800 p-2 rounded-lg mr-2 border ${reporte.borderColor}`}>
                                                        <span className={reporte.iconColor}>{reporte.icon}</span>
                                                    </div>
                                                    <h3 className="text-base font-medium whitespace-normal break-words leading-tight">
                                                        Reporte {reporte.title}
                                                    </h3>
                                                </div>
                                                <p className="text-gray-400 text-[10px] text-center whitespace-normal break-words leading-tight">
                                                    {reporte.description}
                                                </p>
                                            </div>

                                            {/* Contenido inferior de la tarjeta */}
                                            <div className="w-full flex flex-col items-center justify-end h-full">
                                                {reporte.title === 'General' && dashboardType === 'ITEA' ? (
                                                    <>
                                                        <span className="text-xs text-purple-300">
                                                            Total de bienes: <b>{totalMuebles !== null ? totalMuebles : '...'}</b>
                                                        </span>
                                                        <span className="text-xs text-purple-300">
                                                            Suma total: <b>${totalValorMuebles !== null ? totalValorMuebles.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}</b>
                                                        </span>
                                                    </>
                                                ) : reporte.title === 'General' ? (
                                                    <>
                                                        <span className="text-xs text-purple-300">
                                                            Total de bienes: <b>{resumenGeneral.reduce((sum, r) => sum + r.count, 0)}</b>
                                                        </span>
                                                        <span className="text-xs text-purple-300">
                                                            Suma total: <b>${resumenGeneral.reduce((sum, r) => sum + r.sum, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                                                        </span>
                                                    </>
                                                ) : isSinEstatus ? (
                                                    <>
                                                        <span className="text-xs text-gray-300">
                                                            Total de bienes: <b>{sinEstatusData.count}</b>
                                                        </span>
                                                        <span className="text-xs text-gray-300">
                                                            Suma total: <b>${sinEstatusData.sum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                                                        </span>
                                                    </>
                                                ) : rubrosData ? (
                                                    <>
                                                        <span className="text-xs text-blue-300">
                                                            Total de bienes: <b>{rubrosData.reduce((sum, r) => sum + r.count, 0)}</b>
                                                        </span>
                                                        <span className="text-xs text-blue-300">
                                                            Suma total: <b>${rubrosData.reduce((sum, r) => sum + r.sum, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                                                        </span>
                                                    </>
                                                ) : estatusItem ? (
                                                    <>
                                                        <span className="text-xs text-blue-300">
                                                            Total de bienes: <b>{estatusItem.count}</b>
                                                        </span>
                                                        <span className="text-xs text-blue-300">
                                                            Suma total: <b>${estatusItem.sum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Sin datos</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Modal de detalle */}
                    {modalReporte && (
                        <div
                            className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${modalVisible ? 'opacity-100 bg-black/80 backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}
                            onClick={handleCloseModal}
                        >
                            <div
                                className={`rounded-2xl shadow-2xl border-2 px-2 py-3 w-full max-w-2xl flex flex-col items-center scale-100 transition-transform duration-300 ${modalVisible ? 'scale-100' : 'scale-90'} ${(() => {
                                    const r = reportes.find(r => r.title === modalReporte);
                                    return r ? `${r.color} ${r.borderColor}` : 'bg-black border-gray-800';
                                })()} mx-2`}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex flex-col items-center w-full">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        {(() => {
                                            const r = reportes.find(r => r.title === modalReporte);
                                            return r ? (
                                                <div className={`bg-gray-800 p-1.5 rounded-lg border ${r.borderColor}`}>
                                                    <span className={r.iconColor}>{r.icon}</span>
                                                </div>
                                            ) : null;
                                        })()}
                                        <h2 className="text-lg sm:text-xl font-bold text-blue-200 text-center drop-shadow-lg">
                                            Reporte {modalReporte}
                                        </h2>
                                    </div>

                                    {modalReporte === 'General' ? (
                                        <div className="w-full flex flex-col items-center p-1">
                                            {resumenGeneral.length ? (
                                                <>
                                                    <div className="bg-black/30 rounded-lg p-1.5 mb-1.5 w-full">
                                                        <div className="grid grid-cols-2 gap-1.5 text-center">
                                                            <div className="flex flex-col">
                                                                <span className="text-purple-300 text-xs sm:text-sm">Total de bienes</span>
                                                                <span className="text-white text-sm sm:text-base font-bold">
                                                                    {resumenGeneral.reduce((sum, r) => sum + r.count, 0)}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-purple-300 text-xs sm:text-sm">Suma total de valores</span>
                                                                <span className="text-white text-sm sm:text-base font-bold">
                                                                    ${resumenGeneral.reduce((sum, r) => sum + r.sum, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="w-full rounded-lg border border-gray-800 bg-black/20 mt-1">
                                                        <table className="w-full text-left border-separate border-spacing-0">
                                                            <thead>
                                                                <tr className="bg-black/50">
                                                                    <th className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold text-purple-300 text-left">Rubro</th>
                                                                    <th className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold text-purple-300 text-center">Total bienes</th>
                                                                    <th className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold text-purple-300 text-right">Suma valores</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-[10px] sm:text-xs">
                                                                {resumenGeneral.map((rubro, idx) => (
                                                                    <tr
                                                                        key={`${rubro.rubro}-${idx}`}
                                                                        className="hover:bg-black/40 transition-colors"
                                                                    >
                                                                        <td className="px-1.5 py-0.5 text-purple-100 font-medium border-t border-gray-800/50">{rubro.rubro}</td>
                                                                        <td className="px-1.5 py-0.5 text-purple-100 text-center border-t border-gray-800/50">{rubro.count}</td>
                                                                        <td className="px-1.5 py-0.5 text-purple-100 text-right border-t border-gray-800/50">${rubro.sum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-400">Sin datos</span>
                                            )}
                                        </div>
                                    ) : modalReporte === 'SIN ESTATUS' ? (
                                        <div className="w-full flex flex-col items-center p-1">
                                            <div className="bg-black/30 rounded-lg p-2 mb-2 w-full">
                                                <div className="grid grid-cols-2 gap-2 text-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-300 text-sm">Total de bienes</span>
                                                        <span className="text-white text-base font-bold">
                                                            {sinEstatusData.count}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-300 text-sm">Suma total de valores</span>
                                                        <span className="text-white text-base font-bold">
                                                            ${sinEstatusData.sum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {rubrosPorEstatus['SIN ESTATUS'] && rubrosPorEstatus['SIN ESTATUS'].length > 0 ? (
                                                <div className="w-full rounded-lg border border-gray-800 bg-black/20">
                                                    <table className="w-full text-left border-separate border-spacing-0 text-[10px] sm:text-xs">
                                                        <thead>
                                                            <tr className="bg-black/50">
                                                                <th className="px-2 py-1 text-sm font-semibold text-gray-300 text-left">Rubro</th>
                                                                <th className="px-2 py-1 text-sm font-semibold text-gray-300 text-center">Total bienes</th>
                                                                <th className="px-2 py-1 text-sm font-semibold text-gray-300 text-right">Suma valores</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="text-sm">
                                                            {rubrosPorEstatus['SIN ESTATUS'].map((rubro, idx) => (
                                                                <tr
                                                                    key={`${rubro.rubro}-${idx}`}
                                                                    className="hover:bg-black/40 transition-colors"
                                                                >
                                                                    <td className="px-2 py-1 text-gray-200 font-medium border-t border-gray-800/50">{rubro.rubro}</td>
                                                                    <td className="px-2 py-1 text-gray-200 text-center border-t border-gray-800/50">{rubro.count}</td>
                                                                    <td className="px-2 py-1 text-gray-200 text-right border-t border-gray-800/50">${rubro.sum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="w-full text-center text-sm text-gray-400">
                                                    No hay datos desglosados por rubro para registros sin estatus
                                                </div>
                                            )}
                                        </div>
                                    ) : rubrosPorEstatus[reportes.find(r => r.title === modalReporte)?.estatusValue || modalReporte] ? (
                                        <div className="w-full flex flex-col items-center p-1">
                                            <div className="bg-black/30 rounded-lg p-2 mb-2 w-full">
                                                <div className="grid grid-cols-2 gap-2 text-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-300 text-sm">Total de bienes</span>
                                                        <span className="text-white text-base font-bold">
                                                            {rubrosPorEstatus[reportes.find(r => r.title === modalReporte)?.estatusValue || modalReporte].reduce((sum, r) => sum + r.count, 0)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-300 text-sm">Suma total de valores</span>
                                                        <span className="text-white text-base font-bold">
                                                            ${rubrosPorEstatus[reportes.find(r => r.title === modalReporte)?.estatusValue || modalReporte].reduce((sum, r) => sum + r.sum, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full rounded-lg border border-gray-800 bg-black/20">
                                                <table className="w-full text-left border-separate border-spacing-0 text-[10px] sm:text-xs">
                                                    <thead>
                                                        <tr className="bg-black/50">
                                                            <th className="px-2 py-1 text-sm font-semibold text-blue-300 text-left">Rubro</th>
                                                            <th className="px-2 py-1 text-sm font-semibold text-blue-300 text-center">Total bienes</th>
                                                            <th className="px-2 py-1 text-sm font-semibold text-blue-300 text-right">Suma valores</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-sm">
                                                        {rubrosPorEstatus[reportes.find(r => r.title === modalReporte)?.estatusValue || modalReporte].map((rubro, idx) => (
                                                            <tr
                                                                key={`${rubro.rubro}-${idx}`}
                                                                className="hover:bg-black/40 transition-colors"
                                                            >
                                                                <td className="px-2 py-1 text-blue-100 font-medium border-t border-gray-800/50">{rubro.rubro}</td>
                                                                <td className="px-2 py-1 text-blue-100 text-center border-t border-gray-800/50">{rubro.count}</td>
                                                                <td className="px-2 py-1 text-blue-100 text-right border-t border-gray-800/50">${rubro.sum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full flex flex-col items-center p-1">
                                            {(() => {
                                                const estatusItem = estatusData.find(item => item.estatus === modalReporte);
                                                if (!estatusItem) return <span className="text-sm text-gray-400">Sin datos</span>;

                                                return (
                                                    <>
                                                        <div className="bg-black/30 rounded-lg p-2 mb-2 w-full">
                                                            <div className="grid grid-cols-2 gap-2 text-center">
                                                                <div className="flex flex-col">
                                                                    <span className="text-blue-300 text-sm">Total de bienes</span>
                                                                    <span className="text-white text-base font-bold">
                                                                        {estatusItem.count}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-blue-300 text-sm">Suma total de valores</span>
                                                                    <span className="text-white text-base font-bold">
                                                                        ${estatusItem.sum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-full text-center text-sm text-gray-400">
                                                            No hay datos desglosados por rubro para este estatus
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    <div className="mt-2 text-center text-gray-400 text-xs">
                                        Haz clic en cualquier parte para cerrar
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="bg-black p-4 border-t border-gray-800 text-center text-sm text-gray-500">
                        <p>Selecciona un reporte para visualizar a detalle los datos por concepto clasificado del Gasto</p>
                    </div>
                </div>
            )}

            {/* Modal de exportación */}
            {showExportModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowExportModal(false);
                        }
                    }}
                >
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, scale: 0.95 },
                            visible: { opacity: 1, scale: 1 },
                            exit: { opacity: 0, scale: 0.95 },
                        }}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full max-w-4xl bg-black border border-gray-800 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-xl"
                        style={{ boxShadow: "0 2px 24px 0 rgba(0,0,0,0.18)" }}
                    >
                        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black">
                            <h3 className="text-lg font-semibold text-white">Editar datos para exportación</h3>
                            <button
                                title='Cerrar'
                                onClick={() => setShowExportModal(false)}
                                className="p-2 rounded hover:bg-white/10 transition-colors text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
                            <div className="flex flex-col">
                                <label className="text-sm text-gray-400">Fecha</label>
                                <input
                                    title='Fecha de exportación'
                                    type="date"
                                    value={exportDate}
                                    onChange={(e) => setExportDate(e.target.value)}
                                    className="mt-1 px-3 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto px-6 py-4">
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-black">
                                        <th className="px-3 py-2 text-gray-400 font-semibold">No. Partida</th>
                                        <th className="px-3 py-2 text-gray-400 font-semibold">Rubro</th>
                                        <th className="px-3 py-2 text-gray-400 font-semibold text-center">Total</th>
                                        <th className="px-3 py-2 text-gray-400 font-semibold text-right">Valor</th>
                                        <th className="px-3 py-2 text-gray-400 font-semibold w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="relative">
                                    {editableRubros.map((rubro, index) => (
                                        <tr 
                                            key={rubro.id}
                                            className="border-t border-gray-800 cursor-move group"
                                            draggable={true}
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('text/plain', index.toString());
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                const tr = e.currentTarget as HTMLTableRowElement;
                                                const rect = tr.getBoundingClientRect();
                                                const midPoint = (rect.bottom + rect.top) / 2;
                                                if (e.clientY < midPoint) {
                                                    tr.style.borderTop = '2px solid purple';
                                                    tr.style.borderBottom = '';
                                                } else {
                                                    tr.style.borderBottom = '2px solid purple';
                                                    tr.style.borderTop = '';
                                                }
                                            }}
                                            onDragLeave={(e) => {
                                                const tr = e.currentTarget as HTMLTableRowElement;
                                                tr.style.borderTop = '';
                                                tr.style.borderBottom = '';
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                                if (draggedIndex === index) return;
                                                
                                                const tr = e.currentTarget as HTMLTableRowElement;
                                                tr.style.borderTop = '';
                                                tr.style.borderBottom = '';
                                                
                                                const rect = tr.getBoundingClientRect();
                                                const midPoint = (rect.bottom + rect.top) / 2;
                                                const newIndex = e.clientY < midPoint ? index : index + 1;
                                                
                                                reorderRubros(draggedIndex, newIndex);
                                            }}
                                        >
                                            <td className="px-3 py-2">
                                                <input
                                                    title='No. Partida'
                                                    type="text"
                                                    value={rubro.numeroPartida}
                                                    onChange={(e) => updateRubro(index, 'numeroPartida', e.target.value)}
                                                    className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-500"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                {rubro.isPreFilled ? (
                                                    <div className="w-full px-2 py-1 text-white bg-gray-800/50 rounded">
                                                        {rubro.rubro}
                                                    </div>
                                                ) : (
                                                    <input
                                                        title='Rubro'
                                                        type="text"
                                                        value={rubro.rubro}
                                                        onChange={(e) => updateRubro(index, 'rubro', e.target.value)}
                                                        className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {rubro.isPreFilled ? (
                                                    <div className="w-full px-2 py-1 text-white bg-gray-800/50 rounded text-center">
                                                        {rubro.count}
                                                    </div>
                                                ) : (
                                                    <input
                                                        title='Total'
                                                        type="number"
                                                        value={rubro.count}
                                                        onChange={(e) => updateRubro(index, 'count', parseInt(e.target.value) || 0)}
                                                        className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-500 text-center"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {rubro.isPreFilled ? (
                                                    <div className="w-full px-2 py-1 text-white bg-gray-800/50 rounded text-right">
                                                        ${rubro.sum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                    </div>
                                                ) : (
                                                    <input
                                                        title='Valor'
                                                        type="number"
                                                        value={rubro.sum}
                                                        onChange={(e) => updateRubro(index, 'sum', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-purple-500 text-right"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {!rubro.isPreFilled && (
                                                    <button
                                                        title='Eliminar rubro'
                                                        onClick={() => removeRubro(index)}
                                                        className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-full top-1/2 -translate-y-1/2 pr-2">
                                                    <div className="bg-gray-800 rounded p-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                                            <line x1="4" y1="12" x2="20" y2="12"></line>
                                                            <line x1="4" y1="6" x2="20" y2="6"></line>
                                                            <line x1="4" y1="18" x2="20" y2="18"></line>
                                                        </svg>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t border-gray-800">
                                    <tr>
                                        <td colSpan={2} className="px-3 py-3 text-right text-gray-400">Total:</td>
                                        <td className="px-3 py-3 text-center text-white">
                                            {editableRubros.reduce((acc, rubro) => acc + rubro.count, 0)}
                                        </td>
                                        <td className="px-3 py-3 text-right text-white">
                                            ${editableRubros.reduce((acc, rubro) => acc + rubro.sum, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
                            <button
                                onClick={addNewRubro}
                                className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
                            >
                                Agregar rubro
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleExportPDFWithData}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    Exportar PDF
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Manejo de errores */}
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
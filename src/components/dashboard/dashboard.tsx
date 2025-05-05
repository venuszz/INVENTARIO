"use client";
import { useState, useEffect, JSX } from 'react';
import {
    FileText,
    FileDigit, X, AlertCircle,
    CheckCircle,
    ClipboardList, Layers, Layers3, AlertTriangle, Archive
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';

export default function ReportesIneaDashboard() {
    // Estados principales
    const [exportModalOpen, setExportModalOpen] = useState(false);
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
                color: 'bg-purple-900/20',
                borderColor: 'border-purple-800',
                hoverColor: 'hover:border-purple-500',
                iconColor: 'text-purple-400',
                description: 'Información completa de todos los registros del sistema ITEA'
            },
            ...estatusData.map((estatusItem, index) => {
                // Asigna colores diferentes basados en el índice
                const colors = [
                    { bg: 'bg-blue-900/20', border: 'border-blue-800', hover: 'hover:border-blue-500', icon: 'text-blue-400' },
                    { bg: 'bg-green-900/20', border: 'border-green-800', hover: 'hover:border-green-500', icon: 'text-green-400' },
                    { bg: 'bg-amber-900/20', border: 'border-amber-800', hover: 'hover:border-amber-500', icon: 'text-amber-400' },
                    { bg: 'bg-red-900/20', border: 'border-red-800', hover: 'hover:border-red-500', icon: 'text-red-400' },
                    { bg: 'bg-indigo-900/20', border: 'border-indigo-800', hover: 'hover:border-indigo-500', icon: 'text-indigo-400' },
                    { bg: 'bg-teal-900/20', border: 'border-teal-800', hover: 'hover:border-teal-500', icon: 'text-teal-400' },
                    { bg: 'bg-cyan-900/20', border: 'border-cyan-800', hover: 'hover:border-cyan-500', icon: 'text-cyan-400' },
                    { bg: 'bg-emerald-900/20', border: 'border-emerald-800', hover: 'hover:border-emerald-500', icon: 'text-emerald-400' }
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
                color: 'bg-purple-900/20',
                borderColor: 'border-purple-800',
                hoverColor: 'hover:border-purple-500',
                iconColor: 'text-purple-400',
                description: 'Información completa de todos los registros del sistema INEA'
            },
            {
                id: 2,
                title: 'EN USO',
                icon: <CheckCircle className="h-5 w-5" />,
                color: 'bg-green-900/20',
                borderColor: 'border-green-800',
                hoverColor: 'hover:border-green-500',
                iconColor: 'text-green-400',
                description: 'Registros INEA actualmente en uso',
                estatusValue: 'EN USO'
            },
            {
                id: 3,
                title: 'EN USO*',
                icon: <CheckCircle className="h-5 w-5" />,
                color: 'bg-teal-900/20',
                borderColor: 'border-teal-800',
                hoverColor: 'hover:border-teal-500',
                iconColor: 'text-teal-400',
                description: 'Registros INEA en uso con observaciones',
                estatusValue: 'EN USO*'
            },
            {
                id: 4,
                title: 'SIN USO Y NO INTEGRADO AL PADFBM INEA (REALIZAR BAJA)',
                icon: <AlertTriangle className="h-5 w-5" />,
                color: 'bg-amber-900/20',
                borderColor: 'border-amber-800',
                hoverColor: 'hover:border-amber-500',
                iconColor: 'text-amber-400',
                description: 'Bienes INEA sin uso y no integrados al PADFBM (para baja)',
                estatusValue: 'SIN USO Y NO INTEGRADO AL PADFBM INEA (REALIZAR BAJA)'
            },
            {
                id: 5,
                title: 'SIN USO E INTEGRADO AL PADFBM INEA',
                icon: <Archive className="h-5 w-5" />,
                color: 'bg-indigo-900/20',
                borderColor: 'border-indigo-800',
                hoverColor: 'hover:border-indigo-500',
                iconColor: 'text-indigo-400',
                description: 'Bienes INEA sin uso pero integrados al PADFBM',
                estatusValue: 'SIN USO E INTEGRADO AL PADFBM INEA'
            },
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
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                            <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">
                                <FileText className="h-4 w-4 inline mr-1" />
                                DAS
                            </span>
                            {dashboardType === 'ITEA' ? 'Dashboard ITEA' : 'Dashboard INEA'}
                        </h1>
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
                                {modalReporte === 'General' && (
                                    <div className="mt-4 w-full flex flex-col items-center gap-1">
                                        <span className="text-sm text-blue-300">Total de bienes: <b>{totalMuebles !== null ? totalMuebles : '...'}</b></span>
                                        <span className="text-sm text-blue-300">Suma total de valores: <b>${totalValorMuebles !== null ? totalValorMuebles.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}</b></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
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
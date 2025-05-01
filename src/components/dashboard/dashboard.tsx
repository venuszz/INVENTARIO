"use client";
import { useState, useEffect } from 'react';
import {
    FileText,
    FileDigit, X, AlertCircle,
    UserX, MapPin, Trash2, CheckCircle,
ListChecks, ClipboardList, Layers, Layers3
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
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

    // Estado para almacenar el resumen general por rubro
    const [resumenGeneral, setResumenGeneral] = useState<Array<{ rubro: string; count: number; sum: number }>>([]);

    // Estado para el modal de detalle de tarjeta
    const [modalReporte, setModalReporte] = useState<null | string>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Estado para alternar entre dashboard INEA e ITEA
    const [dashboardType, setDashboardType] = useState<'INEA' | 'ITEA' | null>(null);
    // Cambia la tabla según el dashboard seleccionado
    const tableName = dashboardType === 'ITEA' ? 'mueblesitea' : 'muebles';

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
        if (!dashboardType) return;
        (async () => {
            // Contar bienes
            const { count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            setTotalMuebles(count || 0);
            // Sumar valores
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
    }, [tableName, dashboardType]);

    // Cargar resumen por rubro y estatus
    useEffect(() => {
        if (!dashboardType) return;
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
    }, [tableName, dashboardType]);

    // Cargar datos del resumen general al montar el componente
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
                        if (item.rubro.trim().toLowerCase() === 'comunicación') return; // Eliminar comunicación desde aquí
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

            const resumenData = Object.entries(rubrosMap)
                .map(([rubro, v]) => ({ rubro, ...v }))
                .sort((a, b) => b.sum - a.sum); // Ordenar por valor total descendente

            setResumenGeneral(resumenData);
        };

        fetchResumenGeneral();
    }, [tableName, dashboardType]);

    // Datos de reportes INEA con íconos y colores específicos
    const reportes = [
        {
            id: 1,
            title: 'General',
            path: '/reportes/inea/resumen',
            icon: <ClipboardList className="h-5 w-5" />,
            color: 'bg-purple-900/20',
            borderColor: 'border-purple-800',
            hoverColor: 'hover:border-purple-500',
            iconColor: 'text-purple-400'
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
        }
    ];

   

    // Render principal
    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
            {/* Tarjetas principales centradas */}
            <div className="flex flex-col items-center justify-center mb-8">
                <span className="block text-[16px] font-bold text-blue-300 tracking-wide uppercase mb-3 text-center w-full">CLASIFICACIÓN DEL GASTO</span>
                <div className="flex flex-row gap-6 justify-center">
                    {/* Tarjeta INEA */}
                    <div className="flex flex-col items-center">
                        <div
                            className={`flex flex-col items-center justify-center cursor-pointer border-2 rounded-xl p-4 shadow-lg transition-all min-w-[120px] max-w-[160px]
                                ${dashboardType === 'INEA' ? 'bg-green-600 border-green-600 scale-105 text-white' : 'bg-green-900/20 border-green-700 hover:border-green-400 text-green-300 hover:scale-105'}`}
                            onClick={() => setDashboardType('INEA')}
                        >
                            <Layers className={`h-7 w-7 mb-1 ${dashboardType === 'INEA' ? 'text-white' : 'text-green-400'}`} />
                            <span className={`text-base font-bold ${dashboardType === 'INEA' ? 'text-white' : 'text-green-300'}`}>INEA</span>
                        </div>
                    </div>
                    {/* Tarjeta ITEA */}
                    <div className="flex flex-col items-center">
                        <div
                            className={`flex flex-col items-center justify-center cursor-pointer border-2 rounded-xl p-4 shadow-lg transition-all min-w-[120px] max-w-[160px]
                                ${dashboardType === 'ITEA' ? 'bg-purple-600 border-purple-600 scale-105 text-white' : 'bg-purple-900/20 border-purple-700 hover:border-purple-400 text-purple-300 hover:scale-105'}`}
                            onClick={() => setDashboardType('ITEA')}
                        >
                            <Layers3 className={`h-7 w-7 mb-1 ${dashboardType === 'ITEA' ? 'text-white' : 'text-purple-400'}`} />
                            <span className={`text-base font-bold ${dashboardType === 'ITEA' ? 'text-white' : 'text-purple-300'}`}>ITEA</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Mostrar dashboard solo si se seleccionó una tarjeta */}
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
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <ListChecks className="h-4 w-4 text-blue-400" />
                                <span>{reportes.length} categorías de reportes</span>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="p-4 sm:p-6 flex justify-center">
                        <div className="w-full flex flex-col items-center">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-7xl mx-auto justify-items-center">
                                {reportes.map((reporte) => (
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
                                                <h3 className="text-base font-medium whitespace-normal break-words leading-tight">Reporte {reporte.title}</h3>
                                            </div>
                                            <p className="text-gray-400 text-[10px] text-center whitespace-normal break-words leading-tight">
                                                {reporte.title === 'General' ? 'Información completa de todos los registros del sistema' :
                                                    reporte.title === 'Activos' ? 'Registros actualmente en uso' :
                                                        reporte.title === 'Inactivos' ? 'Registros dados de baja temporalmente' :
                                                            reporte.title === 'No localizados' ? 'Registros con paradero desconocido' :
                                                                reporte.title === 'Obsoletos' ? 'Registros marcados para desecho' : ''}
                                            </p>
                                        </div>
                                        {['Activos','Inactivos','No localizados','Obsoletos'].includes(reporte.title) && (
                                            <div className="w-full flex flex-col items-center justify-end h-full">
                                                {rubrosPorEstatus[reporte.title]?.length ? (
                                                    <div className="flex flex-col items-center gap-2 text-center">
                                                        <span className="text-xs text-blue-300">
                                                            Total de bienes: <b>{rubrosPorEstatus[reporte.title].reduce((sum, r) => sum + r.count, 0)}</b>
                                                        </span>
                                                        <span className="text-xs text-blue-300">
                                                            Suma total: <b>${rubrosPorEstatus[reporte.title].reduce((sum, r) => sum + r.sum, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Sin datos</span>
                                                )}
                                            </div>
                                        )}
                                        {reporte.title === 'General' && (
                                            <div className="w-full flex flex-col items-center justify-end h-full">
                                                {(() => {
                                                    // Filtrar rubros para excluir 'comunicación' (robusto ante nulos y espacios)
                                                    const rubrosFiltrados = resumenGeneral.filter(r => (r.rubro || '').trim().toLowerCase() !== 'comunicación');
                                                    const totalBienes = rubrosFiltrados.reduce((sum, r) => sum + r.count, 0);
                                                    const sumaValores = rubrosFiltrados.reduce((sum, r) => sum + r.sum, 0);
                                                    return (
                                                        <div className="flex flex-col items-center gap-2 text-center">
                                                            <span className="text-xs text-purple-300">
                                                                Total de bienes: <b>{totalBienes}</b>
                                                            </span>
                                                            <span className="text-xs text-purple-300">
                                                                Suma total: <b>${sumaValores.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                        {reporte.title === 'Resumen' && (
                                            <div className="w-full flex flex-col items-center justify-end h-full">
                                                {resumenGeneral?.length ? (
                                                    <div className="flex flex-col items-center gap-2 text-center">
                                                        <span className="text-xs text-purple-300">
                                                            Total de bienes: <b>{resumenGeneral.reduce((sum, r) => sum + r.count, 0)}</b>
                                                        </span>
                                                        <span className="text-xs text-purple-300">
                                                            Suma total: <b>${resumenGeneral.reduce((sum, r) => sum + r.sum, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Sin datos</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Modal de detalle de tarjeta */}
                    {modalReporte && (
                        <div
                            className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${modalVisible ? 'opacity-100 bg-black/80 backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}
                            onClick={handleCloseModal}
                        >
                            <div
                                className={`rounded-2xl shadow-2xl border-2 px-2 py-3 w-full
                ${dashboardType === 'ITEA' && modalReporte === 'Activos' ? 'max-w-2xl' : dashboardType === 'ITEA' ? 'max-w-xl' : 'max-w-2xl'}
                flex flex-col items-center scale-100 transition-transform duration-300 ${modalVisible ? 'scale-100' : 'scale-90'} ${(() => {
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
                                        <h2 className="text-lg sm:text-xl font-bold text-blue-200 text-center drop-shadow-lg">Reporte {modalReporte}</h2>
                                    </div>

                                    {modalReporte === 'General' && (
                                        <div className="w-full flex flex-col items-center p-1">
                                            {(() => {
                                                // Filtrar rubros para excluir 'comunicación' (robusto ante nulos y espacios)
                                                const rubrosFiltrados = resumenGeneral.filter(r => (r.rubro || '').trim().toLowerCase() !== 'comunicación');
                                                const totalBienes = rubrosFiltrados.reduce((sum, r) => sum + r.count, 0);
                                                const sumaValores = rubrosFiltrados.reduce((sum, r) => sum + r.sum, 0);
                                                return rubrosFiltrados.length ? (
                                                    <>
                                                        <div className="bg-black/30 rounded-lg p-1.5 mb-1.5 w-full">
                                                            <div className="grid grid-cols-2 gap-1.5 text-center">
                                                                <div className="flex flex-col">
                                                                    <span className="text-purple-300 text-xs sm:text-sm">Total de bienes</span>
                                                                    <span className="text-white text-sm sm:text-base font-bold">
                                                                        {totalBienes}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-purple-300 text-xs sm:text-sm">Suma total de valores</span>
                                                                    <span className="text-white text-sm sm:text-base font-bold">
                                                                        ${sumaValores.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                                                    {rubrosFiltrados.map((rubro, idx) => (
                                                                        <tr 
                                                                            key={rubro.rubro+idx} 
                                                                            className="hover:bg-black/40 transition-colors"
                                                                        >
                                                                            <td className="px-1.5 py-0.5 text-purple-100 font-medium border-t border-gray-800/50">{rubro.rubro}</td>
                                                                            <td className="px-1.5 py-0.5 text-purple-100 text-center border-t border-gray-800/50">{rubro.count}</td>
                                                                            <td className="px-1.5 py-0.5 text-purple-100 text-right border-t border-gray-800/50">${rubro.sum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                        </tr>
                                                                    ))}
                                                                    <tr className="bg-black/50 border-t border-purple-800/50">
                                                                        <td className="px-1.5 py-1 text-[10px] sm:text-xs font-bold text-purple-300">Totales:</td>
                                                                        <td className="px-1.5 py-1 text-[10px] sm:text-xs font-bold text-purple-300 text-center">{totalBienes}</td>
                                                                        <td className="px-1.5 py-1 text-[10px] sm:text-xs font-bold text-purple-300 text-right">${sumaValores.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Sin datos</span>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {['Activos','Inactivos','No localizados','Obsoletos'].includes(modalReporte) && (
                                        <div className="w-full flex flex-col items-center p-1">
                                            {rubrosPorEstatus[modalReporte]?.length ? (
                                                <>
                                                    <div className="bg-black/30 rounded-lg p-2 mb-2 w-full">
                                                        <div className="grid grid-cols-2 gap-2 text-center">
                                                            <div className="flex flex-col">
                                                                <span className="text-blue-300 text-sm">Total de bienes</span>
                                                                <span className="text-white text-base font-bold">
                                                                    {rubrosPorEstatus[modalReporte].reduce((sum, r) => sum + r.count, 0)}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-blue-300 text-sm">Suma total de valores</span>
                                                                <span className="text-white text-base font-bold">
                                                                    ${rubrosPorEstatus[modalReporte].reduce((sum, r) => sum + r.sum, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="w-full rounded-lg border border-gray-800 bg-black/20">
                                                        <table className="w-full text-left border-separate border-spacing-0 text-[10px] sm:text-xs md:text-xs lg:text-xs xl:text-xs">
                                                            <thead>
                                                                <tr className="bg-black/50">
                                                                    <th className="px-2 py-1 text-sm font-semibold text-blue-300 text-left">Rubro</th>
                                                                    <th className="px-2 py-1 text-sm font-semibold text-blue-300 text-center">Total bienes</th>
                                                                    <th className="px-2 py-1 text-sm font-semibold text-blue-300 text-right">Suma valores</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-sm">
                                                                {rubrosPorEstatus[modalReporte].map((rubro, idx) => (
                                                                    <tr 
                                                                        key={rubro.rubro+idx} 
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
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-400">Sin datos</span>
                                            )}
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
                                {/* Mostrar totales solo para General */}
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
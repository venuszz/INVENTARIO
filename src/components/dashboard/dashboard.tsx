"use client"
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import {
    Package,
    X,
    Truck,
    Monitor,
    Cpu,
    Printer,
    Database,
    ShieldCheck,
    Info,
    FileDown,
    Loader2,
    ChevronRight,
    Calendar,
    Plus,
    Trash2,
} from 'lucide-react';
import { generateDashboardPDF } from './dashboardPDF';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useIneaObsoletosIndexation } from '@/hooks/indexation/useIneaObsoletosIndexation';
import { useIteaObsoletosIndexation } from '@/hooks/indexation/useIteaObsoletosIndexation';

const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
};

interface EditableRubro {
    numeroPartida: string;
    rubro: string;
    count: number;
    sum: number;
    isPreFilled?: boolean;
    id?: string;
    colorIndex?: number;
}

type InventoryCategory = {
    estatus: string[];
    rubros: string[];
};

type Category = {
    name: string;
    count: number;
    value: string;
    valueNum?: number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
};

type InventoryCard = {
    id: string;
    title: string;
    count: number;
    value: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    bgColor: string;
    categories: Category[];
};

type InventoryData = {
    [key: string]: {
        title: string;
        categories: InventoryCategory;
        cards: InventoryCard[];
    };
    INEA: {
        title: string;
        categories: InventoryCategory;
        cards: InventoryCard[];
    };
    ITEA: {
        title: string;
        categories: InventoryCategory;
        cards: InventoryCard[];
    };
};

export default function InventoryDashboard() {
    const { isDarkMode } = useTheme();
    const [activeWarehouse, setActiveWarehouse] = useState('INEA');
    const [selectedCard, setSelectedCard] = useState<InventoryCard | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [editableRubros, setEditableRubros] = useState<EditableRubro[]>([]);
    const [exportDate, setExportDate] = useState<string>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString().split('T')[0];
    });
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Usar hooks de indexación
    const { muebles: ineaData, isIndexing: ineaLoading } = useIneaIndexation();
    const { muebles: iteaData, isIndexing: iteaLoading } = useIteaIndexation();
    const { muebles: ineaObsoletosData, isIndexing: ineaObsoletosLoading } = useIneaObsoletosIndexation();
    const { muebles: iteaObsoletosData, isIndexing: iteaObsoletosLoading } = useIteaObsoletosIndexation();

    const loading = ineaLoading || iteaLoading || ineaObsoletosLoading || iteaObsoletosLoading;

    // Procesar datos de INEA para obtener estatus y rubros únicos
    const ineaCategories = useMemo(() => {
        const estatusSet = new Set<string>();
        const rubrosSet = new Set<string>();
        
        ineaData.forEach(item => {
            if (item.estatus) estatusSet.add(item.estatus);
            if (item.rubro) rubrosSet.add(item.rubro);
        });
        
        return {
            estatus: Array.from(estatusSet),
            rubros: Array.from(rubrosSet)
        };
    }, [ineaData]);

    // Procesar datos de ITEA para obtener estatus y rubros únicos
    const iteaCategories = useMemo(() => {
        const estatusSet = new Set<string>();
        const rubrosSet = new Set<string>();
        
        iteaData.forEach(item => {
            if (item.estatus) estatusSet.add(item.estatus);
            if (item.rubro) rubrosSet.add(item.rubro);
        });
        
        return {
            estatus: Array.from(estatusSet),
            rubros: Array.from(rubrosSet)
        };
    }, [iteaData]);

    const [inventoryData, setInventoryData] = useState<InventoryData>({
        INEA: {
            title: "Inventario INEA",
            categories: {
                estatus: [],
                rubros: []
            },
            cards: []
        },
        ITEA: {
            title: "Inventario ITEA",
            categories: {
                estatus: [],
                rubros: []
            },
            cards: []
        }
    });

    const handleExportClick = () => {
        const totalCard = currentData.cards.find(card => card.id === `${activeWarehouse.toLowerCase()}-total`);
        if (!totalCard) return;

        // Obtener todas las tarjetas relevantes (incluyendo BAJA y obsoletos)
        const bajaCard = currentData.cards.find(card => card.id === `${activeWarehouse.toLowerCase()}-baja`);
        const obsoletosCard = currentData.cards.find(card => card.id === `${activeWarehouse.toLowerCase()}-obsoletos`);

        let index = 0;
        const initialRubros: EditableRubro[] = [];

        // Agregar rubros del total
        totalCard.categories.forEach((cat) => {
            initialRubros.push({
                numeroPartida: '',
                rubro: cat.name,
                count: cat.count,
                sum: cat.valueNum || 0,
                isPreFilled: true,
                id: `rubro-${index}`,
                colorIndex: index % 6
            });
            index++;
        });

        // Agregar BAJA si existe
        if (bajaCard) {
            initialRubros.push({
                numeroPartida: '',
                rubro: 'BAJA',
                count: bajaCard.count,
                sum: bajaCard.categories.reduce((acc, cat) => acc + (cat.valueNum || 0), 0),
                isPreFilled: true,
                id: `rubro-${index}`,
                colorIndex: index % 6
            });
            index++;
        }

        // Agregar obsoletos si existe
        if (obsoletosCard) {
            initialRubros.push({
                numeroPartida: '',
                rubro: 'BAJA (Obsoletos)',
                count: obsoletosCard.count,
                sum: obsoletosCard.categories.reduce((acc, cat) => acc + (cat.valueNum || 0), 0),
                isPreFilled: true,
                id: `rubro-${index}`,
                colorIndex: index % 6
            });
            index++;
        }

        setEditableRubros(initialRubros);
        setShowExportModal(true);
    };

    const addNewRubro = () => {
        const newIndex = editableRubros.length;
        setEditableRubros([...editableRubros, {
            numeroPartida: '',
            rubro: '',
            count: 0,
            sum: 0,
            isPreFilled: false,
            id: `rubro-${Date.now()}`,
            colorIndex: newIndex % 6
        }]);
    };

    const updateRubro = (index: number, field: keyof EditableRubro, value: string | number) => {
        const newRubros = [...editableRubros];
        newRubros[index] = {
            ...newRubros[index],
            [field]: value
        };
        setEditableRubros(newRubros);
    };

    const removeRubro = (index: number) => {
        setEditableRubros(editableRubros.filter((_, i) => i !== index));
    };

    const reorderRubros = (dragIndex: number, hoverIndex: number) => {
        setEditableRubros(prevRubros => {
            const newRubros = [...prevRubros];
            const draggedItem = newRubros[dragIndex];
            newRubros.splice(dragIndex, 1);
            newRubros.splice(hoverIndex, 0, draggedItem);
            return newRubros;
        });
    };

    const handleExportPDFWithData = () => {
        const formatDate = (dateString: string) => {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC'
            });
        };

        // Marcar rubros de BAJA y obsoletos
        const rubrosWithFlags = editableRubros.map(rubro => ({
            ...rubro,
            isBaja: rubro.rubro === 'BAJA',
            isObsoleto: rubro.rubro.includes('Obsoletos') || rubro.rubro.includes('BAJA (Obsoletos)')
        }));

        generateDashboardPDF({
            title: currentData.title,
            totalBienes: editableRubros.reduce((acc, rubro) => acc + rubro.count, 0),
            sumaValores: editableRubros.reduce((acc, rubro) => acc + rubro.sum, 0),
            rubros: rubrosWithFlags,
            fileName: `dashboard_${activeWarehouse.toLowerCase()}`,
            warehouse: activeWarehouse as 'INEA' | 'ITEA',
            date: formatDate(exportDate)
        });
        setShowExportModal(false);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(value);
    };
    const getIconForRubro = (rubro: string) => {
        const rubroLower = rubro.toLowerCase();
        if (rubroLower.includes('computo') || rubroLower.includes('computadora')) return Monitor;
        if (rubroLower.includes('impresora')) return Printer;
        if (rubroLower.includes('servidor')) return Database;
        if (rubroLower.includes('procesador') || rubroLower.includes('cpu')) return Cpu;
        if (rubroLower.includes('vehiculo')) return Truck;
        if (rubroLower.includes('licencia') || rubroLower.includes('software')) return ShieldCheck;
        return Info;
    };

    const getStatusIcon = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('activo')) return Package;
        if (statusLower.includes('inactivo')) return X;
        if (statusLower.includes('no localizado')) return Info;
        return Package;
    };

    const getStatusColor = (status: string) => {
        const statusLower = status.toLowerCase();
        if (isDarkMode) {
            if (statusLower.includes('activo')) return "text-white";
            if (statusLower.includes('inactivo')) return "text-white/90";
            if (statusLower.includes('no localizado')) return "text-white/80";
            return "text-white/70";
        } else {
            if (statusLower.includes('activo')) return "text-gray-900";
            if (statusLower.includes('inactivo')) return "text-gray-700";
            if (statusLower.includes('no localizado')) return "text-gray-600";
            return "text-gray-500";
        }
    };

    const getStatusBgColor = (status: string) => {
        const statusLower = status.toLowerCase();
        if (isDarkMode) {
            if (statusLower.includes('activo')) return "bg-white/5";
            if (statusLower.includes('inactivo')) return "bg-white/4";
            if (statusLower.includes('no localizado')) return "bg-white/3";
            return "bg-white/2";
        } else {
            if (statusLower.includes('activo')) return "bg-blue-50";
            if (statusLower.includes('inactivo')) return "bg-gray-50";
            if (statusLower.includes('no localizado')) return "bg-orange-50";
            return "bg-gray-25";
        }
    };

    // Función para procesar datos de inventario desde indexación
    const processInventoryData = (
        origin: 'INEA' | 'ITEA', 
        data: Array<{ estatus?: string | null; rubro?: string | null; valor?: string | number | null }>, 
        estatusList: string[],
        obsoletosData: Array<{ estatus?: string | null; rubro?: string | null; valor?: string | number | null }>
    ) => {
        const cards: InventoryCard[] = [];
        let totalCount = 0;
        let totalValue = 0;
        let bajaCard: InventoryCard | null = null;

        // Procesar cada estatus (excepto BAJA)
        for (const status of estatusList) {
            if (status === 'BAJA') continue; // Saltar BAJA, se procesará al final
            
            const statusData = data.filter(item => item.estatus === status);
            const count = statusData.length;
            const total = statusData.reduce((sum, item) => sum + (parseFloat(String(item.valor || 0))), 0);
            
            // Agrupar por rubro
            const categories: Category[] = [];
            const rubroMap = new Map<string, { count: number; value: number }>();
            
            statusData.forEach(item => {
                if (item.rubro) {
                    const existing = rubroMap.get(item.rubro);
                    const itemValue = parseFloat(String(item.valor || 0));
                    if (existing) {
                        existing.count++;
                        existing.value += itemValue;
                    } else {
                        rubroMap.set(item.rubro, { count: 1, value: itemValue });
                    }
                }
            });
            
            rubroMap.forEach((data, rubro) => {
                categories.push({
                    name: rubro,
                    count: data.count,
                    valueNum: data.value,
                    value: formatCurrency(data.value),
                    icon: getIconForRubro(rubro)
                });
            });

            totalCount += count;
            totalValue += total;
            
            cards.push({
                id: `${origin.toLowerCase()}-${status || 'sin-estatus'}`,
                title: status || 'Sin estatus',
                count,
                value: formatCurrency(total),
                icon: getStatusIcon(status || ''),
                color: getStatusColor(status || ''),
                bgColor: getStatusBgColor(status || ''),
                categories
            });
        }

        // Procesar artículos sin estatus
        const noStatusData = data.filter(item => !item.estatus || item.estatus === '');
        if (noStatusData.length > 0) {
            const count = noStatusData.length;
            const total = noStatusData.reduce((sum, item) => sum + (parseFloat(String(item.valor || 0))), 0);
            
            const categories: Category[] = [];
            const rubroMap = new Map<string, { count: number; value: number }>();
            
            noStatusData.forEach(item => {
                if (item.rubro) {
                    const existing = rubroMap.get(item.rubro);
                    const itemValue = parseFloat(String(item.valor || 0));
                    if (existing) {
                        existing.count++;
                        existing.value += itemValue;
                    } else {
                        rubroMap.set(item.rubro, { count: 1, value: itemValue });
                    }
                }
            });
            
            rubroMap.forEach((data, rubro) => {
                categories.push({
                    name: rubro,
                    count: data.count,
                    valueNum: data.value,
                    value: formatCurrency(data.value),
                    icon: getIconForRubro(rubro)
                });
            });

            totalCount += count;
            totalValue += total;
            
            cards.push({
                id: `${origin.toLowerCase()}-sin-estatus`,
                title: 'Sin estatus',
                count,
                value: formatCurrency(total),
                icon: getStatusIcon(''),
                color: getStatusColor(''),
                bgColor: getStatusBgColor(''),
                categories
            });
        }

        // Procesar BAJA del inventario principal (se resta del total)
        const bajaData = data.filter(item => item.estatus === 'BAJA');
        if (bajaData.length > 0) {
            const count = bajaData.length;
            const total = bajaData.reduce((sum, item) => sum + (parseFloat(String(item.valor || 0))), 0);
            
            const categories: Category[] = [];
            const rubroMap = new Map<string, { count: number; value: number }>();
            
            bajaData.forEach(item => {
                if (item.rubro) {
                    const existing = rubroMap.get(item.rubro);
                    const itemValue = parseFloat(String(item.valor || 0));
                    if (existing) {
                        existing.count++;
                        existing.value += itemValue;
                    } else {
                        rubroMap.set(item.rubro, { count: 1, value: itemValue });
                    }
                }
            });
            
            rubroMap.forEach((data, rubro) => {
                categories.push({
                    name: rubro,
                    count: data.count,
                    valueNum: data.value,
                    value: formatCurrency(data.value),
                    icon: getIconForRubro(rubro)
                });
            });

            // BAJA se resta del total
            totalCount -= count;
            totalValue -= total;
            
            bajaCard = {
                id: `${origin.toLowerCase()}-baja`,
                title: 'BAJA',
                count,
                value: formatCurrency(total),
                icon: X,
                color: "text-red-400",
                bgColor: isDarkMode ? "bg-red-500/10" : "bg-red-50",
                categories
            };
        }

        // Procesar obsoletos (BAJA de tabla obsoletos - NO se resta)
        if (obsoletosData.length > 0) {
            const count = obsoletosData.length;
            const total = obsoletosData.reduce((sum, item) => sum + (parseFloat(String(item.valor || 0))), 0);
            
            const categories: Category[] = [];
            const rubroMap = new Map<string, { count: number; value: number }>();
            
            obsoletosData.forEach(item => {
                if (item.rubro) {
                    const existing = rubroMap.get(item.rubro);
                    const itemValue = parseFloat(String(item.valor || 0));
                    if (existing) {
                        existing.count++;
                        existing.value += itemValue;
                    } else {
                        rubroMap.set(item.rubro, { count: 1, value: itemValue });
                    }
                }
            });
            
            rubroMap.forEach((data, rubro) => {
                categories.push({
                    name: rubro,
                    count: data.count,
                    valueNum: data.value,
                    value: formatCurrency(data.value),
                    icon: getIconForRubro(rubro)
                });
            });

            // Agregar tarjeta de obsoletos (NO se resta del total)
            cards.push({
                id: `${origin.toLowerCase()}-obsoletos`,
                title: 'BAJA (Obsoletos)',
                count,
                value: formatCurrency(total),
                icon: X,
                color: "text-red-400",
                bgColor: isDarkMode ? "bg-red-500/10" : "bg-red-50",
                categories
            });
        }

        // Tarjeta de total con rubros consolidados
        const rubrosTotalesMap = new Map<string, { count: number; value: number }>();
        
        data.forEach(item => {
            if (item.rubro && item.estatus !== 'BAJA') {
                const existing = rubrosTotalesMap.get(item.rubro);
                const itemValue = parseFloat(String(item.valor || 0));
                if (existing) {
                    existing.count++;
                    existing.value += itemValue;
                } else {
                    rubrosTotalesMap.set(item.rubro, { count: 1, value: itemValue });
                }
            }
        });
        
        const rubrosTotales: Category[] = [];
        rubrosTotalesMap.forEach((data, rubro) => {
            rubrosTotales.push({
                name: rubro,
                count: data.count,
                valueNum: data.value,
                value: formatCurrency(data.value),
                icon: getIconForRubro(rubro)
            });
        });

        // Agregar BAJA antes del total si existe
        if (bajaCard) {
            cards.push(bajaCard);
        }

        cards.push({
            id: `${origin.toLowerCase()}-total`,
            title: `Total ${origin}`,
            count: totalCount,
            value: formatCurrency(totalValue),
            icon: Package,
            color: "text-blue-400",
            bgColor: "bg-blue-500/10",
            categories: rubrosTotales
        });

        return cards;
    };

    // Actualizar inventoryData cuando cambien los datos indexados
    useEffect(() => {
        if (!loading && ineaData.length > 0 && iteaData.length > 0) {
            const ineaCards = processInventoryData('INEA', ineaData, ineaCategories.estatus, ineaObsoletosData);
            const iteaCards = processInventoryData('ITEA', iteaData, iteaCategories.estatus, iteaObsoletosData);
            
            setInventoryData({
                INEA: {
                    title: "Inventario INEA",
                    categories: ineaCategories,
                    cards: ineaCards
                },
                ITEA: {
                    title: "Inventario ITEA",
                    categories: iteaCategories,
                    cards: iteaCards
                }
            });
        }
    }, [ineaData, iteaData, ineaObsoletosData, iteaObsoletosData, ineaCategories, iteaCategories, loading]);

    const toggleWarehouse = () => {
        setActiveWarehouse(prev => prev === 'INEA' ? 'ITEA' : 'INEA');
    };

    const openModal = (card: InventoryCard) => {
        setSelectedCard(card);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setSelectedCard(null);
        document.body.style.overflow = 'auto';
    };

    const currentData = inventoryData[activeWarehouse];

    return (
        <div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${isDarkMode
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
                <div className="w-full max-w-5xl mx-auto pb-8">
                {/* Header */}
                <div className={`flex justify-between items-center mb-8 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                    <div>
                        <h1 className="text-3xl font-light tracking-tight mb-1">
                            Clasificación del Gasto
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            Análisis de inventario por categorías
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <motion.div 
                    className="mb-8 space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex gap-3 items-center flex-wrap">
                        {/* Selector de bodega */}
                        <div className={`flex rounded-lg overflow-hidden ${isDarkMode
                            ? 'bg-white/5 border border-white/10'
                            : 'bg-black/5 border border-black/10'
                            }`}>
                            <motion.button
                                onClick={() => setActiveWarehouse('INEA')}
                                disabled={loading}
                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                whileTap={{ scale: loading ? 1 : 0.98 }}
                                className={`px-5 py-2.5 text-sm font-medium transition-all ${
                                    activeWarehouse === 'INEA'
                                        ? (isDarkMode
                                            ? 'bg-white text-black'
                                            : 'bg-black text-white'
                                        )
                                        : (isDarkMode
                                            ? 'text-white/60 hover:text-white hover:bg-white/5'
                                            : 'text-black/60 hover:text-black hover:bg-black/5'
                                        )
                                } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                INEA
                            </motion.button>
                            <motion.button
                                onClick={() => setActiveWarehouse('ITEA')}
                                disabled={loading}
                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                whileTap={{ scale: loading ? 1 : 0.98 }}
                                className={`px-5 py-2.5 text-sm font-medium transition-all ${
                                    activeWarehouse === 'ITEA'
                                        ? (isDarkMode
                                            ? 'bg-white text-black'
                                            : 'bg-black text-white'
                                        )
                                        : (isDarkMode
                                            ? 'text-white/60 hover:text-white hover:bg-white/5'
                                            : 'text-black/60 hover:text-black hover:bg-black/5'
                                        )
                                } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                ITEA
                            </motion.button>
                        </div>
                        
                        {/* Botón de exportar */}
                        <motion.button
                            onClick={handleExportClick}
                            disabled={loading || currentData.cards.length === 0}
                            whileHover={{ scale: (loading || currentData.cards.length === 0) ? 1 : 1.02 }}
                            whileTap={{ scale: (loading || currentData.cards.length === 0) ? 1 : 0.98 }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                loading || currentData.cards.length === 0
                                    ? (isDarkMode 
                                        ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10' 
                                        : 'bg-black/5 text-black/30 cursor-not-allowed border border-black/10'
                                    )
                                    : (isDarkMode
                                        ? 'bg-white text-black hover:bg-white/90'
                                        : 'bg-black text-white hover:bg-black/90'
                                    )
                            }`}
                        >
                            <FileDown size={16} />
                            Exportar PDF
                        </motion.button>
                    </div>
                </motion.div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeWarehouse}
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-1"
                    >
                        {loading ? (
                            /* Loading State simple */
                            <div className="flex items-center justify-center py-20">
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className={`h-12 w-12 animate-spin ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                    <p className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        Cargando datos...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Data Display - Lista minimalista con animaciones mejoradas */
                            <div className="space-y-1">
                                <AnimatePresence mode="popLayout">
                                    {currentData.cards.length === 0 ? (
                                        <motion.div 
                                            className={`text-center py-16 text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            No hay datos disponibles
                                        </motion.div>
                                    ) : (
                                        currentData.cards.map((card, i) => (
                                            <motion.div
                                                key={card.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ 
                                                    layout: { type: 'spring', stiffness: 350, damping: 30 },
                                                    opacity: { duration: 0.2 },
                                                    y: { duration: 0.3 }
                                                }}
                                                whileHover={{ 
                                                    x: 4,
                                                    transition: { duration: 0.2 }
                                                }}
                                                onClick={() => openModal(card)}
                                                className={`group flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                                                    card.title === 'BAJA' || card.title === 'BAJA (Obsoletos)'
                                                        ? (isDarkMode
                                                            ? 'bg-red-500/5 border border-red-500/20 hover:border-red-500/30 hover:bg-red-500/10'
                                                            : 'bg-red-50 border border-red-200 hover:border-red-300 hover:bg-red-100'
                                                        )
                                                        : (isDarkMode
                                                            ? 'bg-black border border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                                            : 'bg-white border border-black/5 hover:border-black/10 hover:bg-black/[0.02]'
                                                        )
                                                }`}
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <motion.div 
                                                        className={`p-2.5 rounded-lg transition-all duration-200 ${
                                                            card.title === 'BAJA' || card.title === 'BAJA (Obsoletos)'
                                                                ? (isDarkMode
                                                                    ? 'bg-red-500/10 group-hover:bg-red-500/20'
                                                                    : 'bg-red-100 group-hover:bg-red-200'
                                                                )
                                                                : (isDarkMode
                                                                    ? 'bg-white/5 group-hover:bg-white/10'
                                                                    : 'bg-black/5 group-hover:bg-black/10'
                                                                )
                                                        }`}
                                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <card.icon size={20} className={
                                                            card.title === 'BAJA' || card.title === 'BAJA (Obsoletos)'
                                                                ? 'text-red-400'
                                                                : (isDarkMode ? 'text-white/80' : 'text-black/80')
                                                        } />
                                                    </motion.div>
                                                    <div className="flex-1">
                                                        <h3 className={`text-sm font-medium mb-0.5 transition-colors ${
                                                            card.title === 'BAJA' || card.title === 'BAJA (Obsoletos)'
                                                                ? 'text-red-400'
                                                                : (isDarkMode ? 'text-white' : 'text-black')
                                                        }`}>
                                                            {card.title}
                                                        </h3>
                                                        <p className={`text-xs transition-colors ${isDarkMode ? 'text-white/50 group-hover:text-white/60' : 'text-black/50 group-hover:text-black/60'}`}>
                                                            {card.count.toLocaleString('es-MX')} artículos
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-lg font-semibold transition-colors ${
                                                        card.title === 'BAJA' || card.title === 'BAJA (Obsoletos)'
                                                            ? 'text-red-400'
                                                            : (isDarkMode ? 'text-white' : 'text-black')
                                                    }`}>
                                                        {card.title === 'BAJA' ? '- ' : ''}{card.value}
                                                    </span>
                                                    <motion.div
                                                        animate={{ x: 0 }}
                                                        whileHover={{ x: 4 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <ChevronRight size={20} className={`transition-colors ${
                                                            isDarkMode ? 'text-white/40 group-hover:text-white/60' : 'text-black/40 group-hover:text-black/60'
                                                        }`} />
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Footer */}
                {!loading && currentData.cards.length > 0 && (
                    <motion.div 
                        className={`mt-8 pt-4 border-t text-xs ${isDarkMode ? 'border-white/10 text-white/40' : 'border-black/10 text-black/40'}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {currentData.cards.length} categorías
                    </motion.div>
                )}
                </div>
            </motion.div>

            {/* Modal de detalles */}
            <AnimatePresence>
                {selectedCard && typeof selectedCard !== 'string' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
                            isDarkMode ? 'bg-black/95' : 'bg-black/60'
                        }`}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                closeModal();
                            }
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`w-full max-w-3xl rounded-xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl ${isDarkMode
                                ? 'bg-black border border-white/10'
                                : 'bg-white border border-gray-200'
                                }`}
                        >
                            {/* Modal Header */}
                            <div className={`flex justify-between items-center px-6 py-4 ${isDarkMode
                                ? 'border-b border-white/10'
                                : 'border-b border-black/10'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                        <selectedCard.icon size={18} className={isDarkMode ? 'text-white' : 'text-black'} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                            {selectedCard.title}
                                        </h3>
                                        <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                                            Desglose por rubro
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className={`p-2 rounded-lg transition-colors ${isDarkMode
                                        ? 'hover:bg-white/10 text-white'
                                        : 'hover:bg-black/10 text-black'
                                        }`}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Content con animaciones mejoradas */}
                            <div className={`overflow-y-auto p-6 ${
                                isDarkMode 
                                    ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
                                    : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
                            }`}>
                                {selectedCard.categories.length > 0 ? (
                                    <div className="space-y-1">
                                        <AnimatePresence mode="popLayout">
                                            {selectedCard.categories.map((category, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    layout
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ 
                                                        layout: { type: 'spring', stiffness: 350, damping: 30 },
                                                        opacity: { duration: 0.2 },
                                                        y: { duration: 0.3 }
                                                    }}
                                                    whileHover={{ 
                                                        x: 4,
                                                        transition: { duration: 0.2 }
                                                    }}
                                                    className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${isDarkMode
                                                        ? 'bg-black border border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                                        : 'bg-white border border-black/5 hover:border-black/10 hover:bg-black/[0.02]'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <motion.div 
                                                            className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}
                                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <category.icon size={16} className={isDarkMode ? 'text-white/70' : 'text-black/70'} />
                                                        </motion.div>
                                                        <div className="flex-1">
                                                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                                {category.name}
                                                            </p>
                                                            <p className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                                                                {category.count} artículos
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                        {category.value}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className={isDarkMode ? 'text-white/50' : 'text-black/50'}>
                                            No hay datos disponibles
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className={`px-6 py-4 ${isDarkMode
                                ? 'border-t border-white/10'
                                : 'border-t border-black/10'
                                }`}>
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                        Total General
                                    </span>
                                    <div className="text-right">
                                        <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                            {selectedCard.value}
                                        </p>
                                        <p className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                                            {selectedCard.count.toLocaleString('es-MX')} artículos
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de exportación rediseñado */}
            <AnimatePresence>
                {showExportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
                            isDarkMode ? 'bg-black/95' : 'bg-black/60'
                        }`}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowExportModal(false);
                            }
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`w-full max-w-5xl rounded-xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl ${isDarkMode
                                ? 'bg-black border border-white/10'
                                : 'bg-white border border-gray-200'
                                }`}
                        >
                            {/* Header */}
                            <div className={`flex justify-between items-center px-6 py-4 ${isDarkMode
                                ? 'border-b border-white/10'
                                : 'border-b border-black/10'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                        <FileDown size={18} className={isDarkMode ? 'text-white' : 'text-black'} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                            Exportar Reporte PDF
                                        </h3>
                                        <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                                            Configura los datos para el reporte
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className={`p-2 rounded-lg transition-colors ${isDarkMode
                                        ? 'hover:bg-white/10 text-white'
                                        : 'hover:bg-black/10 text-black'
                                        }`}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Fecha */}
                            <div className={`px-6 py-4 ${isDarkMode ? 'border-b border-white/10' : 'border-b border-black/10'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                        <Calendar size={16} className={isDarkMode ? 'text-white/70' : 'text-black/70'} />
                                    </div>
                                    <div className="flex-1">
                                        <label className={`text-sm font-medium block mb-1 ${
                                            isDarkMode ? 'text-white' : 'text-black'
                                        }`}>
                                            Fecha del reporte
                                        </label>
                                        <input
                                            type="date"
                                            value={exportDate}
                                            onChange={(e) => setExportDate(e.target.value)}
                                            className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-all ${isDarkMode
                                                ? 'bg-white/5 border border-white/10 text-white focus:border-white/20'
                                                : 'bg-white border border-black/10 text-black focus:border-black/20'
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Lista de rubros con drag & drop mejorado y colores pasteles */}
                            <div className={`overflow-y-auto px-6 py-4 flex-1 ${
                                isDarkMode 
                                    ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
                                    : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
                            }`}>
                                <div className="space-y-2">
                                    {editableRubros.map((rubro, index) => {
                                        // Usar el colorIndex del rubro, no el índice de posición
                                        const colorIndex = rubro.colorIndex ?? (index % 6);
                                        const isBajaRow = rubro.rubro === 'BAJA' || rubro.rubro.includes('Obsoletos');
                                        
                                        const getPastelClass = () => {
                                            if (dragOverIndex === index && draggedIndex !== index) {
                                                return isDarkMode 
                                                    ? 'bg-blue-500/20 border-2 border-blue-400/40 shadow-lg shadow-blue-500/10' 
                                                    : 'bg-blue-100 border-2 border-blue-300 shadow-lg shadow-blue-200/50';
                                            }
                                            
                                            // Si es BAJA, usar estilo rojo
                                            if (isBajaRow) {
                                                return isDarkMode
                                                    ? 'bg-red-500/10 border border-red-400/20 hover:border-red-400/30 hover:bg-red-500/20'
                                                    : 'bg-red-50 border border-red-200 hover:border-red-300 hover:bg-red-100';
                                            }
                                            
                                            if (isDarkMode) {
                                                switch(colorIndex) {
                                                    case 0: return 'bg-blue-500/5 border border-blue-400/10 hover:border-blue-400/20 hover:bg-blue-500/10';
                                                    case 1: return 'bg-purple-500/5 border border-purple-400/10 hover:border-purple-400/20 hover:bg-purple-500/10';
                                                    case 2: return 'bg-pink-500/5 border border-pink-400/10 hover:border-pink-400/20 hover:bg-pink-500/10';
                                                    case 3: return 'bg-green-500/5 border border-green-400/10 hover:border-green-400/20 hover:bg-green-500/10';
                                                    case 4: return 'bg-yellow-500/5 border border-yellow-400/10 hover:border-yellow-400/20 hover:bg-yellow-500/10';
                                                    case 5: return 'bg-cyan-500/5 border border-cyan-400/10 hover:border-cyan-400/20 hover:bg-cyan-500/10';
                                                    default: return 'bg-blue-500/5 border border-blue-400/10 hover:border-blue-400/20';
                                                }
                                            } else {
                                                switch(colorIndex) {
                                                    case 0: return 'bg-blue-50/50 border border-blue-100 hover:border-blue-200 hover:bg-blue-50';
                                                    case 1: return 'bg-purple-50/50 border border-purple-100 hover:border-purple-200 hover:bg-purple-50';
                                                    case 2: return 'bg-pink-50/50 border border-pink-100 hover:border-pink-200 hover:bg-pink-50';
                                                    case 3: return 'bg-green-50/50 border border-green-100 hover:border-green-200 hover:bg-green-50';
                                                    case 4: return 'bg-yellow-50/50 border border-yellow-100 hover:border-yellow-200 hover:bg-yellow-50';
                                                    case 5: return 'bg-cyan-50/50 border border-cyan-100 hover:border-cyan-200 hover:bg-cyan-50';
                                                    default: return 'bg-blue-50/50 border border-blue-100 hover:border-blue-200';
                                                }
                                            }
                                        };
                                        
                                        return (
                                        <div
                                            key={rubro.id}
                                            draggable={true}
                                            onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                                                setDraggedIndex(index);
                                                const target = e.currentTarget;
                                                if (target) {
                                                    target.style.cursor = 'grabbing';
                                                    const dragImage = target.cloneNode(true) as HTMLElement;
                                                    dragImage.style.position = 'absolute';
                                                    dragImage.style.top = '-1000px';
                                                    dragImage.style.opacity = '0.8';
                                                    document.body.appendChild(dragImage);
                                                    e.dataTransfer.setDragImage(dragImage, 0, 0);
                                                    setTimeout(() => document.body.removeChild(dragImage), 0);
                                                }
                                            }}
                                            onDragEnd={(e: React.DragEvent<HTMLDivElement>) => {
                                                setDraggedIndex(null);
                                                setDragOverIndex(null);
                                                const target = e.currentTarget;
                                                if (target) {
                                                    target.style.cursor = 'grab';
                                                }
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                if (draggedIndex !== null && draggedIndex !== index) {
                                                    setDragOverIndex(index);
                                                }
                                            }}
                                            onDragLeave={() => {
                                                setDragOverIndex(null);
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                if (draggedIndex !== null && draggedIndex !== index) {
                                                    reorderRubros(draggedIndex, index);
                                                }
                                                setDraggedIndex(null);
                                                setDragOverIndex(null);
                                            }}
                                            style={{
                                                opacity: draggedIndex === index ? 0.5 : 1,
                                                transform: draggedIndex === index ? 'scale(0.98)' : 'scale(1)',
                                                transition: 'all 0.2s ease'
                                            }}
                                            className={`group flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 ${getPastelClass()} ${
                                                dragOverIndex === index && draggedIndex !== index ? 'scale-105' : ''
                                            }`}
                                        >
                                            {/* Drag handle mejorado */}
                                            <motion.div 
                                                className={`flex-shrink-0 p-1 rounded transition-colors ${
                                                    isDarkMode ? 'text-white/30 group-hover:text-white/50' : 'text-gray-400 group-hover:text-gray-600'
                                                }`}
                                                whileHover={{ scale: 1.2 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                    <circle cx="6" cy="5" r="1.5"/>
                                                    <circle cx="14" cy="5" r="1.5"/>
                                                    <circle cx="6" cy="10" r="1.5"/>
                                                    <circle cx="14" cy="10" r="1.5"/>
                                                    <circle cx="6" cy="15" r="1.5"/>
                                                    <circle cx="14" cy="15" r="1.5"/>
                                                </svg>
                                            </motion.div>

                                            {/* Número de partida */}
                                            <input
                                                type="text"
                                                value={rubro.numeroPartida}
                                                onChange={(e) => updateRubro(index, 'numeroPartida', e.target.value)}
                                                placeholder="No. Partida"
                                                className={`w-32 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${isDarkMode
                                                    ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:ring-white/20 focus:border-white/30'
                                                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                                                    }`}
                                            />

                                            {/* Rubro */}
                                            {rubro.isPreFilled ? (
                                                <div className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                                                    isBajaRow
                                                        ? (isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-400/20' : 'bg-red-100 text-red-700 border border-red-300')
                                                        : (isDarkMode ? 'bg-white/5 text-white/70 border border-white/10' : 'bg-gray-100 text-gray-700 border border-gray-200')
                                                }`}>
                                                    {rubro.rubro}
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={rubro.rubro}
                                                    onChange={(e) => updateRubro(index, 'rubro', e.target.value)}
                                                    placeholder="Nombre del rubro"
                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${isDarkMode
                                                        ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:ring-white/20 focus:border-white/30'
                                                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                                                        }`}
                                                />
                                            )}

                                            {/* Cantidad */}
                                            {rubro.isPreFilled ? (
                                                <div className={`w-24 px-3 py-2 rounded-lg text-sm text-center font-medium ${
                                                    isBajaRow
                                                        ? (isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-400/20' : 'bg-red-100 text-red-700 border border-red-300')
                                                        : (isDarkMode ? 'bg-white/5 text-white/70 border border-white/10' : 'bg-gray-100 text-gray-700 border border-gray-200')
                                                }`}>
                                                    {rubro.rubro === 'BAJA' ? '- ' : ''}{rubro.count}
                                                </div>
                                            ) : (
                                                <input
                                                    type="number"
                                                    value={rubro.count}
                                                    onChange={(e) => updateRubro(index, 'count', parseInt(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className={`w-24 px-3 py-2 rounded-lg text-sm text-center focus:outline-none focus:ring-2 transition-all ${isDarkMode
                                                        ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:ring-white/20 focus:border-white/30'
                                                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                                                        }`}
                                                />
                                            )}

                                            {/* Valor */}
                                            {rubro.isPreFilled ? (
                                                <div className={`w-40 px-3 py-2 rounded-lg text-sm text-right font-medium ${
                                                    isBajaRow
                                                        ? (isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-400/20' : 'bg-red-100 text-red-700 border border-red-300')
                                                        : (isDarkMode ? 'bg-white/5 text-white/70 border border-white/10' : 'bg-gray-100 text-gray-700 border border-gray-200')
                                                }`}>
                                                    {rubro.rubro === 'BAJA' ? '- ' : ''}${rubro.sum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </div>
                                            ) : (
                                                <input
                                                    type="number"
                                                    value={rubro.sum}
                                                    onChange={(e) => updateRubro(index, 'sum', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    className={`w-40 px-3 py-2 rounded-lg text-sm text-right focus:outline-none focus:ring-2 transition-all ${isDarkMode
                                                        ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:ring-white/20 focus:border-white/30'
                                                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                                                        }`}
                                                />
                                            )}

                                            {/* Botón eliminar mejorado */}
                                            {!rubro.isPreFilled && (
                                                <motion.button
                                                    onClick={() => removeRubro(index)}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode
                                                        ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                                                        : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                                                        }`}
                                                >
                                                    <Trash2 size={16} />
                                                </motion.button>
                                            )}
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer mejorado */}
                            <div className={`px-6 py-4 ${isDarkMode
                                ? 'border-t border-white/10'
                                : 'border-t border-black/10'
                                }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <motion.button
                                        onClick={addNewRubro}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDarkMode
                                            ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                            : 'bg-black/5 text-black hover:bg-black/10 border border-black/10'
                                            }`}
                                    >
                                        <Plus size={16} />
                                        Agregar rubro
                                    </motion.button>
                                    <div className="text-right">
                                        <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                                            Total: {editableRubros.reduce((acc, r) => {
                                                if (r.rubro === 'BAJA') return acc - r.count;
                                                if (r.rubro.includes('Obsoletos')) return acc;
                                                return acc + r.count;
                                            }, 0)} artículos
                                        </p>
                                        <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                            ${editableRubros.reduce((acc, r) => {
                                                if (r.rubro === 'BAJA') return acc - r.sum;
                                                if (r.rubro.includes('Obsoletos')) return acc;
                                                return acc + r.sum;
                                            }, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowExportModal(false)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDarkMode
                                            ? 'border border-white/10 text-white hover:bg-white/5'
                                            : 'border border-black/10 text-black hover:bg-black/5'
                                            }`}
                                    >
                                        Cancelar
                                    </button>
                                    <motion.button
                                        onClick={handleExportPDFWithData}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDarkMode
                                            ? 'bg-white text-black hover:bg-white/90'
                                            : 'bg-black text-white hover:bg-black/90'
                                            }`}
                                    >
                                        <FileDown size={16} />
                                        Generar PDF
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
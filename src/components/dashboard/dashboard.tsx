"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import supabase from '@/app/lib/supabase/client';
import {
    BarChart3,
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
    Building2,
    ChevronRight,
    Calendar,
    Plus,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import { generateDashboardPDF } from './dashboardPDF';

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
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('Iniciando...');
    const [showExportModal, setShowExportModal] = useState(false);
    const [editableRubros, setEditableRubros] = useState<EditableRubro[]>([]);
    const [exportDate, setExportDate] = useState<string>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString().split('T')[0];
    });
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

        const initialRubros = totalCard.categories.map((cat, index) => ({
            numeroPartida: '',
            rubro: cat.name,
            count: cat.count,
            sum: cat.valueNum || 0,
            isPreFilled: true,
            id: `rubro-${index}`,
            colorIndex: index % 6
        }));

        setEditableRubros(initialRubros);
        setShowExportModal(true);
    };

    const handleRefresh = async () => {
        setLoading(true);
        setLoadingProgress(0);
        setLoadingMessage('Iniciando...');
        await loadCategories();
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

        generateDashboardPDF({
            title: currentData.title,
            totalBienes: editableRubros.reduce((acc, rubro) => acc + rubro.count, 0),
            sumaValores: editableRubros.reduce((acc, rubro) => acc + rubro.sum, 0),
            rubros: editableRubros,
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
    const loadCategories = async () => {
        setLoadingProgress(10);
        setLoadingMessage('Conectando con la base de datos...');
        
        const fetchPaginatedData = async (table: string, fields: string[]) => {
            let data: unknown[] = [];
            let from = 0;
            const pageSize = 1000;
            let keepGoing = true;

            while (keepGoing) {
                const { data: pageData, error } = await supabase
                    .from(table)
                    .select(fields.join(','))
                    .range(from, from + pageSize - 1);

                if (error) {
                    console.error(`Error fetching data from ${table}:`, error);
                    break;
                }

                if (pageData && pageData.length > 0) {
                    data = data.concat(pageData);
                    if (pageData.length < pageSize) {
                        keepGoing = false;
                    } else {
                        from += pageSize;
                    }
                } else {
                    keepGoing = false;
                }
            }
            return data;
        };

        try {
            setLoadingProgress(30);
            setLoadingMessage('Obteniendo datos de INEA...');
            const ineaData = await fetchPaginatedData('muebles', ['estatus', 'rubro']);
            const ineaEstatus = Array.from(new Set((ineaData as { estatus?: string }[]).map(item => item.estatus).filter((v): v is string => typeof v === 'string')));
            const ineaRubros = Array.from(new Set((ineaData as { rubro?: string }[]).map(item => item.rubro).filter((v): v is string => typeof v === 'string')));

            setLoadingProgress(60);
            setLoadingMessage('Obteniendo datos de ITEA...');
            const iteaData = await fetchPaginatedData('mueblesitea', ['estatus', 'rubro']);
            const iteaEstatus = Array.from(new Set((iteaData as { estatus?: string }[]).map(item => item.estatus).filter((v): v is string => typeof v === 'string')));
            const iteaRubros = Array.from(new Set((iteaData as { rubro?: string }[]).map(item => item.rubro).filter((v): v is string => typeof v === 'string')));

            setLoadingProgress(80);
            setLoadingMessage('Procesando información...');
            
            setInventoryData(prev => ({
                INEA: {
                    ...prev.INEA,
                    categories: {
                        estatus: ineaEstatus,
                        rubros: ineaRubros
                    }
                },
                ITEA: {
                    ...prev.ITEA,
                    categories: {
                        estatus: iteaEstatus,
                        rubros: iteaRubros
                    }
                }
            }));
        } catch (error) {
            console.error('Error loading categories:', error);
            setLoadingMessage('Error al cargar datos');
        }
    };

    // Función para cargar datos de inventario por estatus
    const loadInventoryData = async (origin: 'INEA' | 'ITEA', estatusList: string[]) => {
        const tableName = origin === 'INEA' ? 'muebles' : 'mueblesitea';
        const pageSize = 1000;
        const cards: InventoryCard[] = [];
        let totalCount = 0;
        let totalValue = 0;

        // Procesar estatus definidos
        for (const status of estatusList) {
            let count = 0;
            let total = 0;
            const categories: Category[] = [];
            let from = 0;
            let keepGoing = true;

            while (keepGoing) {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('valor, rubro')
                    .eq('estatus', status)
                    .range(from, from + pageSize - 1);

                if (error) {
                    console.error(`Error fetching ${status} data:`, error);
                    break;
                }

                if (data && data.length > 0) {
                    count += data.length;
                    total += data.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
                    // Agrupar por rubro
                    data.forEach(item => {
                        if (item.rubro) {
                            const existing = categories.find(c => c.name === item.rubro);
                            if (existing) {
                                existing.count++;
                                existing.valueNum = (existing.valueNum || 0) + (parseFloat(item.valor) || 0);
                            } else {
                                categories.push({
                                    name: item.rubro,
                                    count: 1,
                                    valueNum: parseFloat(item.valor) || 0,
                                    value: '', // se llenará después
                                    icon: getIconForRubro(item.rubro)
                                });
                            }
                        }
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
                categories: categories.map(c => ({
                    ...c,
                    value: formatCurrency(c.valueNum || 0)
                }))
            });
        }

        // Procesar artículos sin estatus
        let countNoStatus = 0;
        let totalNoStatus = 0;
        const categoriesNoStatus: Category[] = [];
        let keepGoingNoStatus = true;
        while (keepGoingNoStatus) {
            const { data, error } = await supabase
                .from(tableName)
                .select('valor, rubro')
                .or('estatus.is.null,estatus.eq.""'); // Solo null o vacío
            if (error) {
                console.error(`Error fetching sin estatus data:`, error);
                break;
            }
            if (data && data.length > 0) {
                countNoStatus += data.length;
                totalNoStatus += data.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
                data.forEach(item => {
                    if (item.rubro) {
                        const existing = categoriesNoStatus.find(c => c.name === item.rubro);
                        if (existing) {
                            existing.count++;
                            existing.valueNum = (existing.valueNum || 0) + (parseFloat(item.valor) || 0);
                        } else {
                            categoriesNoStatus.push({
                                name: item.rubro,
                                count: 1,
                                valueNum: parseFloat(item.valor) || 0,
                                value: '',
                                icon: getIconForRubro(item.rubro)
                            });
                        }
                    }
                });
                if (data.length < pageSize) {
                    keepGoingNoStatus = false;
                } else {
                }
            } else {
                keepGoingNoStatus = false;
            }
        }
        // Evitar duplicado: solo agregar si no existe ya una tarjeta con ese id
        if (countNoStatus > 0 && !cards.some(c => c.id === `${origin.toLowerCase()}-sin-estatus`)) {
            totalCount += countNoStatus;
            totalValue += totalNoStatus;
            cards.push({
                id: `${origin.toLowerCase()}-sin-estatus`,
                title: 'Sin estatus',
                count: countNoStatus,
                value: formatCurrency(totalNoStatus),
                icon: getStatusIcon(''),
                color: getStatusColor(''),
                bgColor: getStatusBgColor(''),
                categories: categoriesNoStatus.map(c => ({
                    ...c,
                    value: formatCurrency(c.valueNum || 0)
                }))
            });
        }

        // Tarjeta de total
        // Calcular rubros totales sumando todos los rubros de todas las tarjetas (excepto la de total)
        const rubrosTotalesMap = new Map();
        let sinRubroCount = 0;
        let sinRubroValue = 0;
        cards.forEach(card => {
            if (card.categories && card.categories.length > 0) {
                card.categories.forEach(cat => {
                    // Usar SIEMPRE el valor numérico real
                    const catValueNum = cat.valueNum !== undefined ? cat.valueNum : (typeof cat.value === 'string' ? Number((cat.value as string).replace(/[^\d.-]+/g, '')) : cat.value);
                    if (!cat.name || cat.name.trim() === '' || cat.name.toLowerCase() === 'sin rubro') {
                        sinRubroCount += cat.count;
                        sinRubroValue += catValueNum;
                    } else {
                        if (!rubrosTotalesMap.has(cat.name)) {
                            rubrosTotalesMap.set(cat.name, { ...cat, count: 0, valueNum: 0 });
                        }
                        const entry = rubrosTotalesMap.get(cat.name);
                        entry.count += cat.count;
                        entry.valueNum += catValueNum;
                    }
                });
            }
        });
        const rubrosTotales = Array.from(rubrosTotalesMap.values()).map(r => ({
            ...r,
            value: formatCurrency(r.valueNum || 0)
        }));
        if (sinRubroCount > 0) {
            rubrosTotales.push({
                name: 'Sin rubro',
                count: sinRubroCount,
                value: formatCurrency(sinRubroValue),
                icon: Info
            });
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
        setInventoryData(prev => ({
            ...prev,
            [origin]: {
                ...prev[origin],
                cards
            }
        }));
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            setLoadingProgress(0);
            setLoadingMessage('Iniciando...');
            await loadCategories();
        };
        loadAll();
    }, []);

    // Cuando cambian los estatus, cargar los datos de inventario
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setLoadingProgress(85);
            setLoadingMessage('Calculando totales...');
            
            if (inventoryData.INEA.categories.estatus.length > 0) {
                await loadInventoryData('INEA', inventoryData.INEA.categories.estatus);
            }
            if (inventoryData.ITEA.categories.estatus.length > 0) {
                await loadInventoryData('ITEA', inventoryData.ITEA.categories.estatus);
            }
            
            setLoadingProgress(100);
            setLoadingMessage('¡Completado!');
            setTimeout(() => {
                setLoading(false);
            }, 300);
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inventoryData.INEA.categories.estatus, inventoryData.ITEA.categories.estatus]);

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
        <div className={`min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 transition-colors duration-300 ${isDarkMode
            ? 'bg-black text-white'
            : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900'
            }`}>
            <div className={`w-full mx-auto rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${isDarkMode
                ? 'bg-black border border-white/10'
                : 'bg-white border border-gray-200'
                }`}>
                
                {/* Header */}
                <div className={`p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors duration-300 ${isDarkMode
                    ? 'bg-black border-b border-white/10'
                    : 'bg-white border-b border-gray-200'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode
                            ? 'bg-white/5 border border-white/10'
                            : 'bg-gray-100 border border-gray-200'
                            }`}>
                            <BarChart3 className={isDarkMode ? 'text-white' : 'text-gray-900'} size={20} />
                        </div>
                        <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Clasificación del Gasto
                        </h1>
                    </div>
                    
                    <div className="flex gap-2 items-center flex-wrap">
                        {/* Selector de bodega */}
                        <div className={`flex rounded-lg overflow-hidden ${isDarkMode
                            ? 'bg-white/5'
                            : 'bg-gray-100'
                            }`}>
                            <motion.button
                                onClick={() => setActiveWarehouse('INEA')}
                                disabled={loading}
                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                whileTap={{ scale: loading ? 1 : 0.98 }}
                                className={`px-5 py-2.5 text-sm font-medium transition-all ${
                                    activeWarehouse === 'INEA'
                                        ? (isDarkMode
                                            ? 'bg-white text-black shadow-lg'
                                            : 'bg-gray-900 text-white shadow-lg'
                                        )
                                        : (isDarkMode
                                            ? 'text-white/60 hover:text-white hover:bg-white/5'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
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
                                            ? 'bg-white text-black shadow-lg'
                                            : 'bg-gray-900 text-white shadow-lg'
                                        )
                                        : (isDarkMode
                                            ? 'text-white/60 hover:text-white hover:bg-white/5'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                        )
                                } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                ITEA
                            </motion.button>
                        </div>
                        
                        {/* Botón de refresh */}
                        <motion.button
                            onClick={handleRefresh}
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.05, rotate: loading ? 0 : 90 }}
                            whileTap={{ scale: loading ? 1 : 0.95 }}
                            className={`p-2.5 rounded-lg transition-all ${
                                loading
                                    ? (isDarkMode 
                                        ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    )
                                    : (isDarkMode
                                        ? 'bg-white/5 text-white hover:bg-white/10'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    )
                            }`}
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </motion.button>
                        
                        {/* Botón de exportar */}
                        <motion.button
                            onClick={handleExportClick}
                            disabled={loading || currentData.cards.length === 0}
                            whileHover={{ scale: (loading || currentData.cards.length === 0) ? 1 : 1.02 }}
                            whileTap={{ scale: (loading || currentData.cards.length === 0) ? 1 : 0.98 }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                loading || currentData.cards.length === 0
                                    ? (isDarkMode 
                                        ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    )
                                    : (isDarkMode
                                        ? 'bg-white text-black hover:bg-white/90 shadow-lg'
                                        : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg'
                                    )
                            }`}
                        >
                            <FileDown size={16} />
                            Exportar PDF
                        </motion.button>
                    </div>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeWarehouse}
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="p-6"
                    >
                        {loading ? (
                            /* Loading State con barra de progreso */
                            <div className="flex items-center justify-center py-20">
                                <div className="flex flex-col items-center gap-6 w-full max-w-md px-4">
                                    <Loader2 className={`h-12 w-12 animate-spin ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
                                    
                                    {/* Mensaje de carga */}
                                    <p className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {loadingMessage}
                                    </p>
                                    
                                    {/* Barra de progreso */}
                                    <div className="w-full">
                                        <div className={`w-full h-2 rounded-full overflow-hidden ${
                                            isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                                        }`}>
                                            <motion.div
                                                className={`h-full rounded-full ${
                                                    isDarkMode ? 'bg-white' : 'bg-gray-900'
                                                }`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${loadingProgress}%` }}
                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                            />
                                        </div>
                                        <p className={`text-xs text-center mt-2 ${
                                            isDarkMode ? 'text-white/50' : 'text-gray-500'
                                        }`}>
                                            {loadingProgress}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Data Display - Lista minimalista con animaciones mejoradas */
                            <div className="space-y-2">
                                {currentData.cards.map((card, i) => (
                                    <motion.div
                                        key={card.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ 
                                            delay: i * 0.05,
                                            duration: 0.4,
                                            ease: [0.23, 1, 0.32, 1]
                                        }}
                                        whileHover={{ 
                                            x: 4,
                                            transition: { duration: 0.2 }
                                        }}
                                        onClick={() => openModal(card)}
                                        className={`group flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 ${isDarkMode
                                            ? 'hover:bg-white/5 border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/5'
                                            : 'hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <motion.div 
                                                className={`p-2.5 rounded-lg transition-all duration-200 ${isDarkMode
                                                    ? 'bg-white/5 group-hover:bg-white/10'
                                                    : 'bg-gray-100 group-hover:bg-gray-200'
                                                    }`}
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <card.icon size={20} className={isDarkMode ? 'text-white/80' : 'text-gray-700'} />
                                            </motion.div>
                                            <div className="flex-1">
                                                <h3 className={`text-sm font-medium mb-0.5 transition-colors ${isDarkMode ? 'text-white group-hover:text-white' : 'text-gray-900'}`}>
                                                    {card.title}
                                                </h3>
                                                <p className={`text-xs transition-colors ${isDarkMode ? 'text-white/50 group-hover:text-white/60' : 'text-gray-500 group-hover:text-gray-600'}`}>
                                                    {card.count.toLocaleString('es-MX')} artículos
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-lg font-semibold transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {card.value}
                                            </span>
                                            <motion.div
                                                animate={{ x: 0 }}
                                                whileHover={{ x: 4 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ChevronRight size={20} className={`transition-colors ${
                                                    isDarkMode ? 'text-white/40 group-hover:text-white/60' : 'text-gray-400 group-hover:text-gray-600'
                                                }`} />
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

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
                                : 'border-b border-gray-200'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                                        <selectedCard.icon size={18} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {selectedCard.title}
                                        </h3>
                                        <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                                            Desglose por rubro
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className={`p-2 rounded-lg transition-colors ${isDarkMode
                                        ? 'hover:bg-white/10 text-white'
                                        : 'hover:bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Content con animaciones mejoradas */}
                            <div className="overflow-y-auto p-6">
                                {selectedCard.categories.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedCard.categories.map((category, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ 
                                                    delay: idx * 0.05,
                                                    duration: 0.3,
                                                    ease: [0.23, 1, 0.32, 1]
                                                }}
                                                whileHover={{ 
                                                    x: 4,
                                                    transition: { duration: 0.2 }
                                                }}
                                                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${isDarkMode
                                                    ? 'hover:bg-white/5 border border-white/10 hover:border-white/20'
                                                    : 'hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <motion.div 
                                                        className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <category.icon size={16} className={isDarkMode ? 'text-white/70' : 'text-gray-600'} />
                                                    </motion.div>
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {category.name}
                                                        </p>
                                                        <p className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                                                            {category.count} artículos
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {category.value}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className={isDarkMode ? 'text-white/50' : 'text-gray-500'}>
                                            No hay datos disponibles
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className={`px-6 py-4 ${isDarkMode
                                ? 'border-t border-white/10 bg-white/5'
                                : 'border-t border-gray-200 bg-gray-50'
                                }`}>
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                                        Total General
                                    </span>
                                    <div className="text-right">
                                        <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {selectedCard.value}
                                        </p>
                                        <p className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
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
                                : 'border-b border-gray-200'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                                        <FileDown size={18} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Exportar Reporte PDF
                                        </h3>
                                        <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                                            Configura los datos para el reporte
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className={`p-2 rounded-lg transition-colors ${isDarkMode
                                        ? 'hover:bg-white/10 text-white'
                                        : 'hover:bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Fecha */}
                            <div className={`px-6 py-4 ${isDarkMode ? 'border-b border-white/10' : 'border-b border-gray-200'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                                        <Calendar size={16} className={isDarkMode ? 'text-white/70' : 'text-gray-600'} />
                                    </div>
                                    <div className="flex-1">
                                        <label className={`text-sm font-medium block mb-1 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            Fecha del reporte
                                        </label>
                                        <input
                                            type="date"
                                            value={exportDate}
                                            onChange={(e) => setExportDate(e.target.value)}
                                            className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${isDarkMode
                                                ? 'bg-white/5 border border-white/10 text-white focus:ring-white/20 focus:border-white/20'
                                                : 'bg-white border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Lista de rubros con drag & drop mejorado y colores pasteles */}
                            <div className="overflow-y-auto px-6 py-4 flex-1">
                                <div className="space-y-2">
                                    {editableRubros.map((rubro, index) => {
                                        // Usar el colorIndex del rubro, no el índice de posición
                                        const colorIndex = rubro.colorIndex ?? (index % 6);
                                        const getPastelClass = () => {
                                            if (dragOverIndex === index && draggedIndex !== index) {
                                                return isDarkMode 
                                                    ? 'bg-blue-500/20 border-2 border-blue-400/40 shadow-lg shadow-blue-500/10' 
                                                    : 'bg-blue-100 border-2 border-blue-300 shadow-lg shadow-blue-200/50';
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
                                                <div className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${isDarkMode
                                                    ? 'bg-white/5 text-white/70 border border-white/10'
                                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
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
                                                <div className={`w-24 px-3 py-2 rounded-lg text-sm text-center font-medium ${isDarkMode
                                                    ? 'bg-white/5 text-white/70 border border-white/10'
                                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                    }`}>
                                                    {rubro.count}
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
                                                <div className={`w-40 px-3 py-2 rounded-lg text-sm text-right font-medium ${isDarkMode
                                                    ? 'bg-white/5 text-white/70 border border-white/10'
                                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                    }`}>
                                                    ${rubro.sum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
                                ? 'border-t border-white/10 bg-white/5'
                                : 'border-t border-gray-200 bg-gray-50'
                                }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <motion.button
                                        onClick={addNewRubro}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDarkMode
                                            ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                            : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300'
                                            }`}
                                    >
                                        <Plus size={16} />
                                        Agregar rubro
                                    </motion.button>
                                    <div className="text-right">
                                        <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                                            Total: {editableRubros.reduce((acc, r) => acc + r.count, 0)} artículos
                                        </p>
                                        <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            ${editableRubros.reduce((acc, r) => acc + r.sum, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowExportModal(false)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDarkMode
                                            ? 'border border-white/10 text-white hover:bg-white/5'
                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
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
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
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
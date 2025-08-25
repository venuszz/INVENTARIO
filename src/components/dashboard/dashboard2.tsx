"use client"
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '@/app/lib/supabase/client';
import {
    BarChart3,
    Package,
    AlertTriangle,
    CheckCircle,
    X,
    Truck,
    Monitor,
    Cpu,
    Printer,
    Database,
    Repeat,
    ShieldCheck,
    Info,
    Download,
} from 'lucide-react';
import { generateDashboardPDF } from './dashboardPDF';

// Variantes mejoradas para animación de cambio de bodega (slide lateral + fade)
const containerVariants = {
    exit: (direction: number) => ({
        x: direction > 0 ? -80 : 80,
        opacity: 0,
        scale: 0.98,
        transition: {
            duration: 0.35,
            ease: [0.43, 0.13, 0.23, 0.96]
        }
    }),
    enter: (direction: number) => ({
        x: direction > 0 ? 80 : -80,
        opacity: 0,
        scale: 0.98
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.45,
            ease: [0.43, 0.13, 0.23, 0.96]
        }
    }
};

const cardVariants = {
    hidden: { 
        opacity: 0, 
        y: 50,
        scale: 0.9,
        rotateX: -15
    },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.5,
            type: "spring",
            stiffness: 100,
            damping: 10
        }
    }),
    hover: {
        scale: 1.02,
        rotateX: 5,
        y: -5,
        transition: { 
            duration: 0.3,
            type: "spring",
            stiffness: 400,
            damping: 10
        }
    }
};

const modalVariants = {
    hidden: { 
        opacity: 0,
        scale: 0.95,
        y: 10
    },
    visible: { 
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 10,
        transition: {
            duration: 0.2,
            ease: "easeIn"
        }
    }
};

// Componente de carga

interface EditableRubro {
    numeroPartida: string;
    rubro: string;
    count: number;
    sum: number;
    isPreFilled?: boolean; // Nuevo campo para identificar rubros pre-rellenados
    id?: string; // Para drag and drop
}

// Componente para animar el conteo de valores
interface AnimatedCounterProps {
    value: number | string;
    className?: string;
    prefix?: string;
    suffix?: string;
    loading?: boolean;
    isInteger?: boolean;
    isCurrency?: boolean;
}

const AnimatedCounter = ({ value, className, prefix = '', suffix = '', loading = false, isInteger = false, isCurrency = false }: AnimatedCounterProps) => {
    // Estado para el valor actual mostrado
    const [displayValue, setDisplayValue] = useState<number>(0);
    
    // Referencia para el intervalo de animación
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Convertir valor a número si es string
    const numericValue = typeof value === 'string' ? 
        parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
    
    // Formatear el número según sea entero, decimal o moneda
    const formatNumber = (num: number) => {
        if (isCurrency) {
            return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
        } else if (isInteger) {
            return Math.floor(num).toLocaleString('es-MX');
        } else {
            return num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    };
    
    // Efecto para animar el contador
    useEffect(() => {
        // Limpiar intervalo anterior si existe
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        
        if (loading) {
            // Durante la carga, mostrar números aleatorios
            intervalRef.current = setInterval(() => {
                const randomValue = isInteger ? 
                    Math.floor(Math.random() * 1000) : 
                    Math.random() * 10000;
                setDisplayValue(randomValue);
            }, 100);
        } else {
            // Animación de conteo hasta el valor final
            const duration = 1500; // duración total en ms
            const steps = 20; // número de pasos
            const increment = (numericValue - displayValue) / steps;
            let currentStep = 0;
            
            intervalRef.current = setInterval(() => {
                if (currentStep >= steps) {
                    setDisplayValue(numericValue);
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return;
                }
                
                setDisplayValue(prev => prev + increment);
                currentStep++;
            }, duration / steps);
        }
        
        // Limpiar intervalo al desmontar
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [numericValue, loading, isInteger, isCurrency]);
    
    return (
        <span className={className}>
            {prefix}
            {formatNumber(displayValue)}
            {suffix}
        </span>
    );
};

// Skeletons para loading (mantenemos para compatibilidad)
const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-white/10 rounded ${className}`}></div>
);

const HeaderSkeleton = () => (
    <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 gap-2 sm:gap-0">
        <div className="flex items-center">
            <Skeleton className="w-12 h-12 mr-3 rounded-xl" />
            <Skeleton className="w-48 h-8" />
        </div>
        <div className="flex gap-2">
            <Skeleton className="w-32 h-10 rounded-xl" />
            <Skeleton className="w-40 h-10 rounded-xl" />
        </div>
    </div>
);

const TableSkeleton = () => (
    <div className="overflow-y-auto px-6 py-4 space-y-2">
        <Skeleton className="h-6 w-full mb-2" />
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-2 mb-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-1/4" />
            </div>
        ))}
    </div>
);

export default function InventoryDashboard() {
    const [activeWarehouse, setActiveWarehouse] = useState('INEA');
    const [selectedCard, setSelectedCard] = useState<InventoryCard | null>(null);
    const [direction, setDirection] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showExportModal, setShowExportModal] = useState(false);
    const [editableRubros, setEditableRubros] = useState<EditableRubro[]>([]);
    const [exportDate, setExportDate] = useState<string>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Asegurarse de que no haya desfase de zona horaria
        return today.toISOString().split('T')[0];
    });

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

    // Firma de ejemplo (ajusta según tu base de datos o lógica real)

    // Función para exportar PDF de totales

    const handleExportClick = () => {
        // Inicializar editableRubros con los datos actuales
        const totalCard = currentData.cards.find(card => card.id === `${activeWarehouse.toLowerCase()}-total`);
        if (!totalCard) return;
        
        const initialRubros = totalCard.categories.map((cat, index) => ({
            numeroPartida: '',
            rubro: cat.name,
            count: cat.count,
            sum: cat.valueNum || 0,
            isPreFilled: true, // Marcar como pre-rellenado
            id: `rubro-${index}` // Agregar ID único
        }));
        
        setEditableRubros(initialRubros);
        setShowExportModal(true);
    };

    const addNewRubro = () => {
        setEditableRubros([...editableRubros, {
            numeroPartida: '',
            rubro: '',
            count: 0,
            sum: 0,
            isPreFilled: false, // Nuevos rubros no son pre-rellenados
            id: `rubro-${Date.now()}` // ID único para nuevos rubros
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
            const date = new Date(dateString + 'T00:00:00'); // Agregar tiempo para evitar problemas de zona horaria
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC' // Usar UTC para evitar ajustes de zona horaria
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

    // Función para formatear valores monetarios
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(value);
    };

    // Función auxiliar para asignar íconos según el rubro
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

    // Función para obtener el ícono según el estatus
    const getStatusIcon = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('activo')) return CheckCircle;
        if (statusLower.includes('inactivo')) return X;
        if (statusLower.includes('no localizado')) return AlertTriangle;
        return Package;
    };

    // Función para obtener el color según el estatus
    const getStatusColor = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('activo')) return "text-white";
        if (statusLower.includes('inactivo')) return "text-white/90";
        if (statusLower.includes('no localizado')) return "text-white/80";
        return "text-white/70";
    };

    // Función para obtener el color de fondo según el estatus
    const getStatusBgColor = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('activo')) return "bg-white/5";
        if (statusLower.includes('inactivo')) return "bg-white/4";
        if (statusLower.includes('no localizado')) return "bg-white/3";
        return "bg-white/2";
    };

    // Función para cargar datos de estatus y rubros
    const loadCategories = async () => {
        // Función auxiliar para obtener datos paginados
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
            // Obtener datos de INEA
            const ineaData = await fetchPaginatedData('muebles', ['estatus', 'rubro']);
            const ineaEstatus = Array.from(new Set((ineaData as { estatus?: string }[]).map(item => item.estatus).filter((v): v is string => typeof v === 'string')));
            const ineaRubros = Array.from(new Set((ineaData as { rubro?: string }[]).map(item => item.rubro).filter((v): v is string => typeof v === 'string')));

            // Obtener datos de ITEA
            const iteaData = await fetchPaginatedData('mueblesitea', ['estatus', 'rubro']);
            const iteaEstatus = Array.from(new Set((iteaData as { estatus?: string }[]).map(item => item.estatus).filter((v): v is string => typeof v === 'string')));
            const iteaRubros = Array.from(new Set((iteaData as { rubro?: string }[]).map(item => item.rubro).filter((v): v is string => typeof v === 'string')));

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
            await loadCategories();
        };
        loadAll();
    }, []);

    // Cuando cambian los estatus, cargar los datos de inventario
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Mostrar loader antes de cargar tarjetas
            if (inventoryData.INEA.categories.estatus.length > 0) {
                await loadInventoryData('INEA', inventoryData.INEA.categories.estatus);
            }
            if (inventoryData.ITEA.categories.estatus.length > 0) {
                await loadInventoryData('ITEA', inventoryData.ITEA.categories.estatus);
            }
            setLoading(false); // Ocultar loader después de cargar tarjetas
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inventoryData.INEA.categories.estatus, inventoryData.ITEA.categories.estatus]);

    const toggleWarehouse = () => {
        setDirection(activeWarehouse === 'INEA' ? 1 : -1);
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

    // Función para obtener un color aleatorio para cada tarjeta

    // Nuevo: obtiene el colorScheme de la tarjeta seleccionada

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="w-full mx-auto bg-black rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/10 transition-all duration-500">
                {/* Header Section */}
                {loading ? (
                    <HeaderSkeleton />
                ) : (
                <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 gap-2 sm:gap-0">
                    <motion.h1 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center"
                    >
                        <motion.span 
                            className="mr-2 sm:mr-3 bg-black text-white p-2 sm:p-3 rounded-xl border border-white/10 text-base sm:text-lg shadow-lg"
                            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 0.5 }}
                        >
                            DSH
                        </motion.span>
                        Clasificación del Gasto
                    </motion.h1>
                    <div className="flex gap-2 items-center">
                        <motion.button
                            onClick={toggleWarehouse}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center space-x-2 px-5 py-2 bg-black rounded-xl border border-white/20 shadow-sm group focus:outline-none focus:ring-1 focus:ring-white/10 transition-all hover:border-white/40 relative overflow-hidden"
                        >
                            <motion.div
                                animate={{ rotate: direction ? 360 : 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Repeat size={16} className="text-white/90" />
                            </motion.div>
                            <span className="text-white/90 font-medium tracking-wide">
                                {activeWarehouse === 'INEA' ? 'Ver ITEA' : 'Ver INEA'}
                            </span>
                            <motion.div 
                                className={`absolute top-0 right-0 w-2 h-2 rounded-full ${activeWarehouse === 'INEA' ? 'bg-blue-500' : 'bg-green-500'} m-1.5`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />
                            <motion.div 
                                className="absolute bottom-0 left-0 text-[8px] text-white/50 m-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                Actual: {activeWarehouse}
                            </motion.div>
                        </motion.button>
                        <motion.button
                            onClick={handleExportClick}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-black transition-all duration-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-white/10 hover:border-white/40"
                            title={`Exportar PDF Totales ${activeWarehouse}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Download size={18} className="text-white/90" />
                            <span className="font-medium text-white/90">
                                Exportar PDF {activeWarehouse}
                            </span>
                        </motion.button>
                    </div>
                </div>
                )}
                {/* Main Content */}
                <AnimatePresence custom={direction} initial={false} mode="wait">
                    <motion.div
                        key={activeWarehouse}
                        custom={direction}
                        variants={containerVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="p-4 sm:p-8"
                    >
                        <div className="mb-8 flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-black border border-white/10 shadow-md">
                                <BarChart3 className="text-white" size={28} />
                            </div>
                            <h2 className="text-xl font-semibold text-white tracking-wide">
                                {currentData.title}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {currentData.cards.map((card, i) => {
                                    return (
                                        <motion.div
                                            key={card.id}
                                            custom={i}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="visible"
                                            whileHover="hover"
                                            onClick={() => openModal(card)}
                                            className="group relative flex flex-col p-7 rounded-2xl bg-black border border-white/20 cursor-pointer transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.03)] backdrop-blur-lg transform-gpu overflow-hidden"
                                            style={{
                                                boxShadow: "0 2px 24px 0 rgba(255,255,255,0.02)"
                                            }}
                                        >
                                            <div className="flex justify-between items-start flex-grow w-full">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2 truncate">
                                                        <span className={`w-2.5 h-2.5 rounded-full ${card.bgColor}`}></span>
                                                        {card.title}
                                                    </h3>
                                                    <p className="text-4xl font-light text-white truncate">
                                                        <AnimatedCounter value={card.value} loading={false} isCurrency={true} />
                                                    </p>
                                                </div>
                                                <motion.div 
                                                    className="flex-shrink-0 ml-4 p-2.5 rounded-xl bg-white/5 group-hover:scale-110 transition-transform duration-300 border border-white/10"
                                                    whileHover={{ rotate: 8 }}
                                                >
                                                    <card.icon className="text-white/90 w-5 h-5" />
                                                </motion.div>
                                            </div>
                                            <div className="mt-auto pt-5 text-base text-white/70 border-t border-white/10 group-hover:text-white/90 transition-colors font-medium tracking-wide truncate">
                                                <AnimatedCounter value={card.count} loading={false} isInteger={true} suffix=" artículos" />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Modal con cierre al hacer click fuera */}
            <AnimatePresence>
                {selectedCard && typeof selectedCard !== 'string' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                closeModal();
                            }
                        }}
                    >
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className={`w-full max-w-md bg-black border border-white/20 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-xl`}
                            style={{ boxShadow: "0 2px 24px 0 rgba(255,255,255,0.02)" }}
                        >
                            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                                    <span className={`w-2.5 h-2.5 rounded-full ${selectedCard?.bgColor}`}></span>
                                    {selectedCard?.title}
                                </h3>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="p-2 rounded hover:bg-white/10 transition-colors text-white"
                                    aria-label="Cerrar"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            {/* Mostrar rubros si existen (incluido para el total) */}
                            {loading ? (
                                <TableSkeleton />
                            ) : selectedCard?.categories.length > 0 && (
                                <div className="overflow-y-auto px-6 py-4 space-y-2">
                                    <table className="w-full text-left border-separate border-spacing-0 text-xs bg-black">
                                        <thead>
                                            <tr className="bg-black">
                                                <th className="px-2 py-1 text-white/60 font-semibold">Rubro</th>
                                                <th className="px-2 py-1 text-white/60 font-semibold text-center">Total</th>
                                                <th className="px-2 py-1 text-white/60 font-semibold text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedCard.categories.map((category, idx) => (
                                                <tr key={idx} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                                                    <td className="px-2 py-1 text-white/90 flex items-center gap-2">
                                                        <category.icon size={14} className="text-white/60" />
                                                        {category.name}
                                                    </td>
                                                    <td className="px-2 py-1 text-white/80 text-center">{category.count}</td>
                                                    <td className="px-2 py-1 text-white/80 text-right">{category.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="px-6 py-4 border-t border-white/10 bg-black">
                                <div className="flex justify-between items-center">
                                    <span className="text-white/70 text-sm">Total</span>
                                    <div className="text-right">
                                        <span className="text-lg font-semibold text-white">{selectedCard.value}</span>
                                        <div className="text-xs text-white/50">{selectedCard.count} artículos</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de exportación */}
            <AnimatePresence>
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
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="w-full max-w-4xl bg-black border border-white/20 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-xl"
                            style={{ boxShadow: "0 2px 24px 0 rgba(255,255,255,0.02)" }}
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
                                        className="mt-1 px-3 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                                    />
                                </div>
                            </div>

                            <div className="overflow-y-auto px-6 py-4">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-black">
                                            <th className="px-3 py-2 text-white/60 font-semibold">No. Partida</th>
                                            <th className="px-3 py-2 text-white/60 font-semibold">Rubro</th>
                                            <th className="px-3 py-2 text-white/60 font-semibold text-center">Total</th>
                                            <th className="px-3 py-2 text-white/60 font-semibold text-right">Valor</th>
                                            <th className="px-3 py-2 text-white/60 font-semibold w-16"></th>
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
            </AnimatePresence>
        </div>
    );
}
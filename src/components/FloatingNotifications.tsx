"use client";
import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useTheme } from "@/context/ThemeContext";
import { usePathname } from 'next/navigation';
import NotificationsPanel from './NotificationCenter';
import RoleGuard from "@/components/roleGuard";
import { useSession } from '@/hooks/useSession';
import { motion, AnimatePresence } from 'framer-motion';
import { useIndexationStore } from '@/stores/indexationStore';

export default function FloatingNotifications() {
    const { isDarkMode } = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const { user: sessionUser } = useSession();
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hasEnteredPanelRef = useRef(false);
    const pathname = usePathname();
    
    // Obtener estado de visibilidad del popover de indexación
    const isPopoverVisible = useIndexationStore(state => state.isPopoverVisible);

    // Detectar si estamos en una página que tiene RealtimeIndicator
    const hasRealtimeIndicator = pathname?.startsWith('/consultas/');

    const handleMouseEnter = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        if (hasEnteredPanelRef.current) {
            setIsHovered(false);
            hasEnteredPanelRef.current = false;
        } else {
            closeTimerRef.current = setTimeout(() => {
                setIsHovered(false);
                hasEnteredPanelRef.current = false;
            }, 300);
        }
    };

    const handlePanelMouseEnter = () => {
        hasEnteredPanelRef.current = true;
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
        };
    }, []);
    
    // Solo no renderizar si el popover de indexación está visible
    if (isPopoverVisible) return null;

    return (
        <RoleGuard roles={["superadmin", "admin"]} userRole={sessionUser?.rol ?? undefined}>
            <motion.div 
                className="fixed top-20 right-4 z-30"
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ 
                    duration: 0.4, 
                    ease: [0.16, 1, 0.3, 1]
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <motion.div
                    className={`overflow-hidden select-none shadow-2xl backdrop-blur-md ${
                        isDarkMode
                            ? 'bg-neutral-900 border border-white/10'
                            : 'bg-neutral-100 border border-gray-200'
                    }`}
                    animate={{ 
                        borderRadius: isHovered ? '12px' : '9999px',
                        width: isHovered ? '320px' : '28px',
                        height: isHovered ? 'auto' : '28px',
                    }}
                    transition={{ 
                        duration: 0.3,
                        ease: [0.16, 1, 0.3, 1]
                    }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {!isHovered ? (
                            <motion.button
                                key="collapsed"
                                className={`flex items-center justify-center w-7 h-7 transition-all duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Notificaciones"
                            >
                                <Bell className="flex-shrink-0 h-3 w-3" />
                            </motion.button>
                        ) : (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onMouseEnter={handlePanelMouseEnter}
                            >
                                <NotificationsPanel onClose={() => setIsHovered(false)} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </RoleGuard>
    );
}

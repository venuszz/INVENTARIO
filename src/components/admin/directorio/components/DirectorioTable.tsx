import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2, AlertTriangle, FileText, Package } from 'lucide-react';

interface Directorio {
    id_directorio: number;
    nombre: string | null;
    area: string | null;
    puesto: string | null;
}

interface Area {
    id_area: number;
    nombre: string;
}

interface DirectorioTableProps {
    filteredDirectorio: Directorio[];
    directorAreasMap: { [id_directorio: number]: number[] };
    areasFromStore: Area[];
    directorioStats: Map<number, { resguardosActivos: number; bienesACargo: number }>;
    areaStats: Map<number, { resguardosActivos: number; bienesACargo: number }>;
    editingId: number | null;
    editEmployee: Directorio;
    editSelectedAreas: number[];
    newAreaInput: string;
    isSubmitting: boolean;
    isDarkMode: boolean;
    highlightedArea: string | null;
    highlightedDirector: string | null;
    areaMatchesSearch: (areaName: string) => boolean;
    inconsistencies: any[];
    isAreaInConflict: (id_area: number, inconsistencies: any[]) => boolean;
    getConflictTooltip: (id_directorio: number, id_area: number, inconsistencies: any[]) => string;
    countBienesByArea: (id_directorio: number, id_area: number) => number;
    countResguardosByArea: (id_directorio: number, id_area: number) => number;
    onEdit: (employee: Directorio) => void;
    onCancelEdit: () => void;
    onSubmitEdit: () => void;
    onDelete: (id: number) => void;
    onAreaInputChange: (value: string) => void;
    onAreaInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onRemoveArea: (id_area: number) => void;
    onShowBienesModal: (id_directorio: number, id_area: number) => void;
    onShowResguardosModal: (id_directorio: number, id_area: number) => void;
    editInputRef: React.RefObject<HTMLInputElement>;
}

export const DirectorioTable = memo(function DirectorioTable({
    filteredDirectorio,
    directorAreasMap,
    areasFromStore,
    directorioStats,
    areaStats,
    editingId,
    editEmployee,
    editSelectedAreas,
    newAreaInput,
    isSubmitting,
    isDarkMode,
    highlightedArea,
    highlightedDirector,
    areaMatchesSearch,
    inconsistencies,
    isAreaInConflict,
    getConflictTooltip,
    countBienesByArea,
    countResguardosByArea,
    onEdit,
    onCancelEdit,
    onSubmitEdit,
    onDelete,
    onAreaInputChange,
    onAreaInputKeyDown,
    onRemoveArea,
    onShowBienesModal,
    onShowResguardosModal,
    editInputRef
}: DirectorioTableProps) {
    return (
        <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
        >
            <AnimatePresence mode="popLayout">
                {filteredDirectorio.map((employee) => {
                    const isEditing = editingId === employee.id_directorio;
                    const employeeAreas = directorAreasMap[employee.id_directorio] || [];
                    const stats = directorioStats.get(employee.id_directorio);
                    const isHighlighted = highlightedDirector === employee.nombre;

                    return (
                        <motion.div
                            key={employee.id_directorio}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0,
                                scale: isHighlighted ? 1.02 : 1,
                                boxShadow: isHighlighted 
                                    ? (isDarkMode ? '0 0 0 2px rgba(255,255,255,0.2)' : '0 0 0 2px rgba(0,0,0,0.2)')
                                    : 'none'
                            }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className={`p-4 rounded-lg border transition-all ${
                                isDarkMode
                                    ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                                    : 'border-black/10 bg-black/[0.02] hover:bg-black/[0.04]'
                            }`}
                        >
                            {isEditing ? (
                                /* Edit Mode */
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            value={editEmployee.nombre || ''}
                                            onChange={(e) => onEdit({ ...editEmployee, nombre: e.target.value.toUpperCase() })}
                                            className={`flex-1 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                                isDarkMode
                                                    ? 'bg-black border-white/10 text-white focus:border-white/20'
                                                    : 'bg-white border-black/10 text-black focus:border-black/20'
                                            } focus:outline-none`}
                                            placeholder="Nombre"
                                        />
                                        <input
                                            type="text"
                                            value={editEmployee.puesto || ''}
                                            onChange={(e) => onEdit({ ...editEmployee, puesto: e.target.value.toUpperCase() })}
                                            className={`flex-1 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                                isDarkMode
                                                    ? 'bg-black border-white/10 text-white focus:border-white/20'
                                                    : 'bg-white border-black/10 text-black focus:border-black/20'
                                            } focus:outline-none`}
                                            placeholder="Puesto"
                                        />
                                    </div>

                                    {/* Areas */}
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-1.5">
                                            {Array.from(new Set(editSelectedAreas)).map(id_area => {
                                                const areaObj = areasFromStore.find(a => a.id_area === id_area);
                                                const hasConflict = isAreaInConflict(id_area, inconsistencies);
                                                const conflictTooltip = getConflictTooltip(employee.id_directorio, id_area, inconsistencies);
                                                
                                                return areaObj ? (
                                                    <span 
                                                        key={`edit-area-${id_area}`}
                                                        className={`relative flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                                            hasConflict
                                                                ? isDarkMode
                                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                                    : 'bg-red-50 text-red-600 border border-red-200'
                                                                : isDarkMode
                                                                    ? 'bg-white/10 text-white border border-white/20'
                                                                    : 'bg-black/10 text-black border border-black/20'
                                                        }`}
                                                        title={conflictTooltip || undefined}
                                                    >
                                                        {hasConflict && (
                                                            <AlertTriangle size={10} className="flex-shrink-0" />
                                                        )}
                                                        {areaObj.nombre}
                                                        <button
                                                            onClick={() => onRemoveArea(id_area)}
                                                            className={`ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors`}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                        <input
                                            type="text"
                                            value={newAreaInput}
                                            onChange={(e) => onAreaInputChange(e.target.value)}
                                            onKeyDown={onAreaInputKeyDown}
                                            placeholder="Agregar área..."
                                            className={`w-full px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                                isDarkMode
                                                    ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                                                    : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                                            } focus:outline-none`}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 justify-end">
                                        <motion.button
                                            onClick={onSubmitEdit}
                                            disabled={isSubmitting}
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                                isSubmitting
                                                    ? isDarkMode
                                                        ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                                                        : 'bg-black/5 border-black/10 text-black/40 cursor-not-allowed'
                                                    : isDarkMode
                                                        ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                                        : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
                                            }`}
                                            whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                                            whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                                        >
                                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                                        </motion.button>
                                        <motion.button
                                            onClick={onCancelEdit}
                                            disabled={isSubmitting}
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                                isDarkMode
                                                    ? 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5'
                                                    : 'bg-black/[0.02] border-black/10 text-black/60 hover:bg-black/5'
                                            }`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Cancelar
                                        </motion.button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-base font-medium truncate">
                                                {employee.nombre || 'Sin nombre'}
                                            </h3>
                                            {employee.puesto && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    isDarkMode
                                                        ? 'bg-white/5 text-white/60'
                                                        : 'bg-black/5 text-black/60'
                                                }`}>
                                                    {employee.puesto}
                                                </span>
                                            )}
                                        </div>

                                        {/* Areas */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {employeeAreas.map(id_area => {
                                                const areaObj = areasFromStore.find(a => a.id_area === id_area);
                                                if (!areaObj) return null;

                                                const hasConflict = isAreaInConflict(id_area, inconsistencies);
                                                const conflictTooltip = getConflictTooltip(employee.id_directorio, id_area, inconsistencies);
                                                const isAreaHighlighted = highlightedArea === areaObj.nombre || areaMatchesSearch(areaObj.nombre);
                                                const areaStatsData = areaStats.get(id_area);
                                                const bienesCount = countBienesByArea(employee.id_directorio, id_area);
                                                const resguardosCount = countResguardosByArea(employee.id_directorio, id_area);

                                                return (
                                                    <motion.div
                                                        key={`area-${id_area}`}
                                                        className={`relative flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                                                            hasConflict
                                                                ? isDarkMode
                                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                                    : 'bg-red-50 text-red-600 border border-red-200'
                                                                : isAreaHighlighted
                                                                    ? isDarkMode
                                                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                                                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                                                                    : isDarkMode
                                                                        ? 'bg-white/5 text-white/80 border border-white/10'
                                                                        : 'bg-black/5 text-black/80 border border-black/10'
                                                        }`}
                                                        title={conflictTooltip || undefined}
                                                        animate={isAreaHighlighted ? { scale: [1, 1.05, 1] } : {}}
                                                        transition={{ duration: 0.5, repeat: isAreaHighlighted ? Infinity : 0, repeatDelay: 1 }}
                                                    >
                                                        {hasConflict && (
                                                            <AlertTriangle size={10} className="flex-shrink-0" />
                                                        )}
                                                        <span>{areaObj.nombre}</span>
                                                        
                                                        {/* Bienes count badge */}
                                                        {bienesCount > 0 && (
                                                            <button
                                                                onClick={() => onShowBienesModal(employee.id_directorio, id_area)}
                                                                className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] transition-colors ${
                                                                    isDarkMode
                                                                        ? 'bg-white/10 hover:bg-white/20 text-white/80'
                                                                        : 'bg-black/10 hover:bg-black/20 text-black/80'
                                                                }`}
                                                                title={`${bienesCount} bien(es) a cargo en esta área`}
                                                            >
                                                                <Package size={8} />
                                                                {bienesCount}
                                                            </button>
                                                        )}
                                                        
                                                        {/* Resguardos count badge */}
                                                        {resguardosCount > 0 && (
                                                            <button
                                                                onClick={() => onShowResguardosModal(employee.id_directorio, id_area)}
                                                                className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] transition-colors ${
                                                                    isDarkMode
                                                                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                                                                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                                                }`}
                                                                title={`${resguardosCount} resguardo(s) activo(s) en esta área`}
                                                            >
                                                                <FileText size={8} />
                                                                {resguardosCount}
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>

                                        {/* Stats */}
                                        {stats && (stats.resguardosActivos > 0 || stats.bienesACargo > 0) && (
                                            <div className={`flex gap-3 text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                                                {stats.resguardosActivos > 0 && (
                                                    <span>📋 {stats.resguardosActivos} resguardo(s)</span>
                                                )}
                                                {stats.bienesACargo > 0 && (
                                                    <span>📦 {stats.bienesACargo} bien(es)</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <motion.button
                                            onClick={() => onEdit(employee)}
                                            className={`p-2 rounded-lg border transition-all ${
                                                isDarkMode
                                                    ? 'border-white/10 hover:bg-white/5'
                                                    : 'border-black/10 hover:bg-black/5'
                                            }`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            title="Editar"
                                        >
                                            <Edit size={14} />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => onDelete(employee.id_directorio)}
                                            className={`p-2 rounded-lg border transition-all ${
                                                isDarkMode
                                                    ? 'border-white/10 hover:bg-red-500/10 hover:border-red-500/20'
                                                    : 'border-black/10 hover:bg-red-50 hover:border-red-200'
                                            }`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </motion.div>
    );
});

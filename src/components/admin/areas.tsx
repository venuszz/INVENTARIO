"use client"
import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Save, Trash2, Edit, AlertTriangle, CheckCircle, X, Search, RefreshCw } from 'lucide-react';
import supabase from "@/app/lib/supabase/client";

interface Area {
    id_area: number;
    itea: string | null;
}

interface Message {
    type: 'success' | 'error' | '';
    text: string;
}

export default function AreasManagementComponent() {
    // Estados
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [formMode, setFormMode] = useState<'add' | 'edit' | 'delete' | ''>('');
    const [currentArea, setCurrentArea] = useState<Area>({ id_area: 0, itea: '' });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [message, setMessage] = useState<Message>({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const inputRef = useRef<HTMLInputElement>(null);

    // Cargar datos de áreas
    const fetchAreas = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('areas')
                .select('*')
                .order('id_area', { ascending: true });

            if (error) throw error;
            setAreas(data || []);
        } catch (error) {
            console.error('Error cargando áreas:', error);
            setError('Error al cargar las áreas');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchAreas();
    }, [fetchAreas]);

    // Función para obtener el próximo ID disponible
    const getNextAvailableId = useCallback(() => {
        if (areas.length === 0) return 1;
        const maxId = Math.max(...areas.map(area => area.id_area));
        return maxId + 1;
    }, [areas]);

    // Filtrar áreas según el término de búsqueda
    const filteredAreas = areas.filter(area =>
        area.itea?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.id_area.toString().includes(searchTerm)
    );

    // Manejadores de eventos
    const handleAdd = () => {
        setFormMode('add');
        setCurrentArea({ id_area: getNextAvailableId(), itea: '' });
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleEdit = (area: Area) => {
        setFormMode('edit');
        setCurrentArea({ ...area });
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleDelete = (area: Area) => {
        setFormMode('delete');
        setCurrentArea({ ...area });
    };

    const handleCancel = () => {
        setFormMode('');
        setCurrentArea({ id_area: 0, itea: '' });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Validación de campos
            if (formMode !== 'delete' && (!currentArea.itea || currentArea.itea.trim() === '')) {
                throw new Error('Nombre del área es obligatorio');
            }

            // Convertir a mayúsculas y trim
            const areaName = currentArea.itea?.trim().toUpperCase() || '';

            if (formMode === 'add') {
                // Verificar si el área ya existe
                const existingArea = areas.find(area =>
                    area.itea?.toUpperCase() === areaName
                );

                if (existingArea) {
                    throw new Error('El área ya existe');
                }

                // Agregar nueva área
                const { error } = await supabase
                    .from('areas')
                    .insert([{ itea: areaName }])
                    .select();

                if (error) throw error;

                setMessage({ type: 'success', text: 'Área agregada correctamente' });
            } else if (formMode === 'edit') {
                // Verificar si el nuevo nombre ya existe (excluyendo el área actual)
                const existingArea = areas.find(area =>
                    area.itea?.toUpperCase() === areaName &&
                    area.id_area !== currentArea.id_area
                );

                if (existingArea) {
                    throw new Error('El área ya existe');
                }

                // Editar área existente
                const { error } = await supabase
                    .from('areas')
                    .update({ itea: areaName })
                    .eq('id_area', currentArea.id_area);

                if (error) throw error;

                setMessage({ type: 'success', text: 'Área actualizada correctamente' });
            } else if (formMode === 'delete') {
                // Eliminar área
                const { error } = await supabase
                    .from('areas')
                    .delete()
                    .eq('id_area', currentArea.id_area);

                if (error) throw error;

                setMessage({ type: 'success', text: 'Área eliminada correctamente' });
            }

            // Recargar datos después de la operación
            fetchAreas();
            setFormMode('');
            setCurrentArea({ id_area: 0, itea: '' });
        } catch (error: unknown) {
            console.error('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            setError(errorMessage);
            setMessage({ type: 'error', text: errorMessage || 'Ha ocurrido un error al procesar la solicitud' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseMessage = () => setMessage({ type: '', text: '' });

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border border-gray-800">
                {/* Header con título */}
                <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">ADM</span>
                        Gestión de Áreas
                    </h1>
                </div>

                {/* Mensajes de notificación */}
                {message.text && (
                    <div className={`mx-2 sm:mx-4 md:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg flex items-center justify-between transition-all duration-500 animate-fadeIn ${message.type === 'success' ? 'bg-green-900' : 'bg-red-900'} border ${message.type === 'success' ? 'border-green-700' : 'border-red-700'}`}>
                        <div className="flex items-center">
                            {message.type === 'success' ?
                                <CheckCircle className="mr-2 sm:mr-3" size={20} /> :
                                <AlertTriangle className="mr-2 sm:mr-3" size={20} />
                            }
                            <span className="font-medium text-sm sm:text-base">{message.text}</span>
                        </div>
                        <button onClick={handleCloseMessage} className="p-1 rounded-full hover:bg-black transition-colors" title='Cerrar'>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Contenido principal */}
                <div className="px-2 sm:px-4 md:px-6 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
                        {/* Búsqueda */}
                        <div className="w-full sm:w-auto relative mb-2 sm:mb-0">
                            <input
                                type="text"
                                placeholder="Buscar área..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 bg-black border border-gray-700 rounded-lg p-2 pl-8 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm"
                            />
                            <Search size={18} className="absolute left-2 top-2.5 text-gray-500" />
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleAdd}
                                className="flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                                title="Agregar nueva área"
                            >
                                <Plus size={16} className="mr-1" />
                                Agregar Área
                            </button>
                            <button
                                onClick={fetchAreas}
                                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Refrescar datos"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Formulario (visible solo en modos add, edit o delete) */}
                    {formMode !== '' && (
                        <div className="mb-6 bg-gray-900 p-4 rounded-lg border border-gray-800 animate-fadeIn">
                            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-800">
                                {formMode === 'add' ? 'Agregar Nueva Área' :
                                    formMode === 'edit' ? 'Editar Área' : 'Eliminar Área'}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                {formMode !== 'delete' ? (
                                    <div className="mb-4">
                                        <label className="block mb-1 text-sm font-medium">
                                            Nombre del Área <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={currentArea.itea || ''}
                                            onChange={(e) => setCurrentArea({ ...currentArea, itea: e.target.value })}
                                            className={`w-full bg-black border ${error ? 'border-red-500' : 'border-gray-700'} rounded-lg p-2 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all`}
                                            placeholder="Nombre del área"
                                            disabled={(formMode as string) === 'delete'}
                                            onBlur={(e) => {
                                                // Convertir a mayúsculas al salir del campo
                                                setCurrentArea({ ...currentArea, itea: e.target.value.toUpperCase() });
                                            }}
                                        />
                                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                                    </div>
                                ) : (
                                    <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-800 rounded-lg">
                                        <p className="text-sm">
                                            ¿Estás seguro de que deseas eliminar el área <strong>{currentArea.itea}</strong>?
                                            Esta acción no se puede deshacer.
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center ${formMode === 'delete'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-white text-black hover:bg-gray-200'
                                            }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-gray-400 border-t-white rounded-full animate-spin mr-2"></div>
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                {formMode === 'add' && <Plus size={16} className="mr-1" />}
                                                {formMode === 'edit' && <Save size={16} className="mr-1" />}
                                                {formMode === 'delete' && <Trash2 size={16} className="mr-1" />}

                                                {formMode === 'add' && 'Agregar'}
                                                {formMode === 'edit' && 'Guardar'}
                                                {formMode === 'delete' && 'Eliminar'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Tabla de áreas */}
                    <div className="overflow-x-auto border border-gray-800 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Área
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-black divide-y divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-center text-sm">
                                            <div className="flex justify-center items-center">
                                                <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin mr-2"></div>
                                                Cargando áreas...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredAreas.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-center text-sm">
                                            {searchTerm ? 'No se encontraron áreas con el término de búsqueda.' : 'No hay áreas registradas.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAreas.map((area) => (
                                        <tr key={area.id_area} className="hover:bg-gray-900 transition-colors">
                                            <td className="px-4 py-3 text-sm">{area.id_area}</td>
                                            <td className="px-4 py-3 text-sm">{area.itea}</td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <button
                                                        onClick={() => handleEdit(area)}
                                                        className="p-1 hover:bg-gray-700 rounded-md transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(area)}
                                                        className="p-1 hover:bg-red-900 rounded-md transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Contador de resultados */}
                    <div className="mt-4 text-sm text-gray-400">
                        Mostrando {filteredAreas.length} de {areas.length} áreas
                    </div>
                </div>
            </div>

            {/* Estilos CSS adicionales */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
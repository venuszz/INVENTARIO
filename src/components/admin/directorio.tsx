"use client"
import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Edit, AlertTriangle, CheckCircle, X, Search, RefreshCw, CheckSquare, XSquare } from 'lucide-react';
import supabase from "@/app/lib/supabase/client";

interface Directorio {
    id_directorio: number;
    nombre: string | null;
    area: string | null;
    puesto: string | null;
}

interface Message {
    type: 'success' | 'error' | '';
    text: string;
}

export default function DirectorioManagementComponent() {
    // Estados
    const [directorio, setDirectorio] = useState<Directorio[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [newEmployee, setNewEmployee] = useState<Directorio>({ id_directorio: 0, nombre: '', area: '', puesto: '' });
    const [editEmployee, setEditEmployee] = useState<Directorio>({ id_directorio: 0, nombre: '', area: '', puesto: '' });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [message, setMessage] = useState<Message>({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const addInputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    // Cargar datos del directorio
    const fetchDirectorio = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('directorio')
                .select('*')
                .order('id_directorio', { ascending: true });

            if (error) throw error;
            setDirectorio(data || []);
        } catch (error) {
            console.error('Error cargando directorio:', error);
            setError('Error al cargar el directorio de personal');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchDirectorio();
    }, [fetchDirectorio]);

    // Función para obtener el próximo ID disponible
    const getNextAvailableId = useCallback(() => {
        if (directorio.length === 0) return 1;
        const maxId = Math.max(...directorio.map(item => item.id_directorio));
        return maxId + 1;
    }, [directorio]);

    // Filtrar directorio según el término de búsqueda
    const filteredDirectorio = directorio.filter(item =>
        item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id_directorio.toString().includes(searchTerm)
    );

    // Manejadores de eventos
    const handleAddNew = () => {
        setIsAddingNew(true);
        setNewEmployee({ id_directorio: getNextAvailableId(), nombre: '', area: '', puesto: '' });
        setTimeout(() => addInputRef.current?.focus(), 100);
    };

    const handleCancelAdd = () => {
        setIsAddingNew(false);
        setNewEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
        setError('');
    };

    const handleEdit = (employee: Directorio) => {
        setEditingId(employee.id_directorio);
        setEditEmployee({ ...employee });
        setTimeout(() => editInputRef.current?.focus(), 100);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
        setError('');
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
    };

    const handleCancelDelete = () => {
        setDeletingId(null);
    };

    const handleSubmitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Validación de campos
            if (!newEmployee.nombre || newEmployee.nombre.trim() === '') {
                throw new Error('El nombre del empleado es obligatorio');
            }

            // Ya no necesitamos convertir aquí porque se convierte en tiempo real
            const nombreEmployee = newEmployee.nombre;
            const areaEmployee = newEmployee.area || '';
            const puestoEmployee = newEmployee.puesto || '';

            // Verificar si el empleado ya existe
            const existingEmployee = directorio.find((item: Directorio) =>
                item.nombre?.toUpperCase() === nombreEmployee &&
                item.area?.toUpperCase() === areaEmployee &&
                item.puesto?.toUpperCase() === puestoEmployee
            );

            if (existingEmployee) {
                throw new Error('El empleado ya existe');
            }

            // Agregar nuevo empleado
            const { error } = await supabase
                .from('directorio')
                .insert([{ nombre: nombreEmployee, area: areaEmployee, puesto: puestoEmployee }])
                .select();

            if (error) throw error;

            setMessage({ type: 'success', text: 'Empleado agregado correctamente' });
            setIsAddingNew(false);
            setNewEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
            fetchDirectorio();
        } catch (error: unknown) {
            console.error('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            setError(errorMessage);
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Validación
            if (!editEmployee.nombre || editEmployee.nombre.trim() === '') {
                throw new Error('El nombre del empleado es obligatorio');
            }

            // Ya no necesitamos convertir aquí porque se convierte en tiempo real
            const nombreEmployee = editEmployee.nombre;
            const areaEmployee = editEmployee.area || '';
            const puestoEmployee = editEmployee.puesto || '';

            // Verificar si el nuevo nombre ya existe (excluyendo el empleado actual)
            const existingEmployee = directorio.find((item: Directorio) =>
                item.nombre?.toUpperCase() === nombreEmployee &&
                item.area?.toUpperCase() === areaEmployee &&
                item.puesto?.toUpperCase() === puestoEmployee &&
                item.id_directorio !== editEmployee.id_directorio
            );

            if (existingEmployee) {
                throw new Error('El empleado ya existe');
            }

            // Editar empleado existente
            const { error } = await supabase
                .from('directorio')
                .update({ nombre: nombreEmployee, area: areaEmployee, puesto: puestoEmployee })
                .eq('id_directorio', editEmployee.id_directorio);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Empleado actualizado correctamente' });
            setEditingId(null);
            setEditEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
            fetchDirectorio();
        } catch (error: unknown) {
            console.error('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            setError(errorMessage);
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async (id: number) => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('directorio')
                .delete()
                .eq('id_directorio', id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Empleado eliminado correctamente' });
            setDeletingId(null);
            fetchDirectorio();
        } catch (error: unknown) {
            console.error('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            setMessage({ type: 'error', text: errorMessage });
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
                        <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">DIR</span>
                        Directorio de Personal Autorizado
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
                                placeholder="Buscar personal autorizado..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 bg-black border border-gray-700 rounded-lg p-2 pl-8 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm"
                            />
                            <Search size={18} className="absolute left-2 top-2.5 text-gray-500" />
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddNew}
                                className="flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                                title="Agregar nuevo personal autorizado"
                                disabled={isAddingNew}
                            >
                                <Plus size={16} className="mr-1" />
                                Agregar Personal
                            </button>
                            <button
                                onClick={fetchDirectorio}
                                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Refrescar datos"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Tabla de directorio */}
                    <div className="overflow-x-auto border border-gray-800 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        NOMBRE DEL PERSONAL
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        ÁREA DE ADSCRIPCIÓN
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        PUESTO
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        ACCIONES
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-black divide-y divide-gray-800">
                                {/* Fila para agregar nuevo empleado */}
                                {isAddingNew && (
                                    <tr className="bg-gray-900 bg-opacity-50 animate-fadeIn">
                                        <td className="px-4 py-2 text-sm">
                                            <span className="text-gray-500">Auto</span>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <input
                                                ref={addInputRef}
                                                type="text"
                                                value={newEmployee.nombre || ''}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, nombre: e.target.value.toUpperCase() })}
                                                placeholder="Nombre completo"
                                                className="w-full bg-black border border-gray-700 rounded p-1.5 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <input
                                                type="text"
                                                value={newEmployee.area || ''}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, area: e.target.value.toUpperCase() })}
                                                placeholder="Área de adscripción"
                                                className="w-full bg-black border border-gray-700 rounded p-1.5 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <input
                                                type="text"
                                                value={newEmployee.puesto || ''}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, puesto: e.target.value.toUpperCase() })}
                                                placeholder="Puesto a desempeñar"
                                                className="w-full bg-black border border-gray-700 rounded p-1.5 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right">
                                            <div className="flex justify-end space-x-1">
                                                <button
                                                    onClick={handleSubmitAdd}
                                                    disabled={isSubmitting}
                                                    className="p-1 bg-green-900 hover:bg-green-800 rounded-md transition-colors"
                                                    title="Guardar"
                                                >
                                                    {isSubmitting ? (
                                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <CheckSquare size={16} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={handleCancelAdd}
                                                    className="p-1 bg-red-900 hover:bg-red-800 rounded-md transition-colors"
                                                    title="Cancelar"
                                                >
                                                    <XSquare size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-4 text-center text-sm">
                                            <div className="flex justify-center items-center">
                                                <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin mr-2"></div>
                                                Cargando directorio de personal...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredDirectorio.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-4 text-center text-sm">
                                            {searchTerm ? 'No se encontró personal con el término de búsqueda.' : 'No hay personal registrado.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDirectorio.map((employee) => (
                                        <tr key={employee.id_directorio} className={`hover:bg-gray-900 transition-colors ${editingId === employee.id_directorio ? 'bg-gray-900 bg-opacity-80' : ''}`}>
                                            <td className="px-4 py-3 text-sm">{employee.id_directorio}</td>

                                            {editingId === employee.id_directorio ? (
                                                <>
                                                    <td className="px-4 py-2 text-sm">
                                                        <input
                                                            title='Nombre'
                                                            ref={editInputRef}
                                                            type="text"
                                                            value={editEmployee.nombre || ''}
                                                            onChange={(e) => setEditEmployee({ ...editEmployee, nombre: e.target.value.toUpperCase() })}
                                                            className="w-full bg-black border border-gray-700 rounded p-1.5 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        <input
                                                            title='Área'
                                                            type="text"
                                                            value={editEmployee.area || ''}
                                                            onChange={(e) => setEditEmployee({ ...editEmployee, area: e.target.value.toUpperCase() })}
                                                            className="w-full bg-black border border-gray-700 rounded p-1.5 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        <input
                                                            title='Puesto'
                                                            type="text"
                                                            value={editEmployee.puesto || ''}
                                                            onChange={(e) => setEditEmployee({ ...editEmployee, puesto: e.target.value.toUpperCase() })}
                                                            className="w-full bg-black border border-gray-700 rounded p-1.5 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right">
                                                        <div className="flex justify-end space-x-1">
                                                            <button
                                                                onClick={handleSubmitEdit}
                                                                disabled={isSubmitting}
                                                                className="p-1 bg-green-900 hover:bg-green-800 rounded-md transition-colors"
                                                                title="Guardar cambios"
                                                            >
                                                                {isSubmitting ? (
                                                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                                                ) : (
                                                                    <CheckSquare size={16} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="p-1 bg-red-900 hover:bg-red-800 rounded-md transition-colors"
                                                                title="Cancelar edición"
                                                            >
                                                                <XSquare size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : deletingId === employee.id_directorio ? (
                                                <>
                                                    <td colSpan={3} className="px-4 py-3 text-sm">
                                                        <div className="flex items-center text-red-400">
                                                            <AlertTriangle size={16} className="mr-2" />
                                                            <span>¿Confirma eliminar a <strong>{employee.nombre}</strong>?</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right">
                                                        <div className="flex justify-end space-x-1">
                                                            <button
                                                                onClick={() => handleConfirmDelete(employee.id_directorio)}
                                                                disabled={isSubmitting}
                                                                className="p-1 bg-red-700 hover:bg-red-600 rounded-md transition-colors"
                                                                title="Confirmar eliminación"
                                                            >
                                                                {isSubmitting ? (
                                                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                                                ) : (
                                                                    <CheckSquare size={16} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={handleCancelDelete}
                                                                className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                                                                title="Cancelar eliminación"
                                                            >
                                                                <XSquare size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`px-4 py-3 text-sm font-medium ${!employee.nombre || employee.nombre.trim() === '' ? 'bg-amber-900 bg-opacity-50 border-l-2 border-amber-500' : ''}`}>
                                                        {employee.nombre || (
                                                            <span className="text-amber-400 flex items-center gap-1">
                                                                <AlertTriangle size={14} />
                                                                <span>Sin nombre</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={`px-4 py-3 text-sm ${!employee.area || employee.area.trim() === '' ? 'bg-amber-900 bg-opacity-50 border-l-2 border-amber-500' : ''}`}>
                                                        {employee.area || (
                                                            <span className="text-amber-400 flex items-center gap-1">
                                                                <AlertTriangle size={14} />
                                                                <span>Sin área</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={`px-4 py-3 text-sm ${!employee.puesto || employee.puesto.trim() === '' ? 'bg-amber-900 bg-opacity-50 border-l-2 border-amber-500' : ''}`}>
                                                        {employee.puesto || (
                                                            <span className="text-amber-400 flex items-center gap-1">
                                                                <AlertTriangle size={14} />
                                                                <span>Sin puesto</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right">
                                                        <div className="flex justify-end space-x-1">
                                                            <button
                                                                onClick={() => handleEdit(employee)}
                                                                className="p-1 hover:bg-gray-700 rounded-md transition-colors"
                                                                title="Editar"
                                                                disabled={editingId !== null || deletingId !== null || isAddingNew}
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(employee.id_directorio)}
                                                                className="p-1 hover:bg-red-900 rounded-md transition-colors"
                                                                title="Eliminar"
                                                                disabled={editingId !== null || deletingId !== null || isAddingNew}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mt-3 text-red-500 text-sm bg-red-900 bg-opacity-20 p-2 rounded border border-red-800">
                            {error}
                        </div>
                    )}

                    {/* Contador de resultados */}
                    <div className="mt-4 text-sm text-gray-400">
                        Mostrando {filteredDirectorio.length} de {directorio.length} empleados en el directorio
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
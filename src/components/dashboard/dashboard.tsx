import { useState } from 'react';
import {
    FileText, Download, FileSpreadsheet, File, 
    FileDigit, X, AlertCircle,
    UserX, MapPin, Trash2, CheckCircle,
    Database, ListChecks
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
// import { generatePDF } from './pdfgenerator';

interface Mueble {
    id: number;
    id_inv: string;
    rubro: string | null;
    descripcion: string | null;
    valor: number | null;
    f_adq: string | null;
    formadq: string | null;
    proveedor: string | null;
    factura: string | null;
    ubicacion_es: string | null;
    ubicacion_mu: string | null;
    ubicacion_no: string | null;
    estado: string | null;
    estatus: string | null;
    area: string | null;
    usufinal: string | null;
    fechabaja: string | null;
    causadebaja: string | null;
    resguardante: string | null;
    image_path: string | null;
}

export default function ReportesIneaDashboard() {
    // Estado para controlar el modal de exportación
   

    // Columnas a exportar
    const exportColumns = [
        { header: 'ID Inventario', key: 'id_inv', width: 18 },
        { header: 'Rubro', key: 'rubro', width: 18 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Valor', key: 'valor', width: 12 },
        { header: 'Fecha Adquisición', key: 'f_adq', width: 16 },
        { header: 'Forma Adq.', key: 'formadq', width: 14 },
        { header: 'Proveedor', key: 'proveedor', width: 20 },
        { header: 'Factura', key: 'factura', width: 14 },
        { header: 'Ubicación ES', key: 'ubicacion_es', width: 10 },
        { header: 'Ubicación MU', key: 'ubicacion_mu', width: 10 },
        { header: 'Ubicación NO', key: 'ubicacion_no', width: 12 },
        { header: 'Estado', key: 'estado', width: 14 },
        { header: 'Estatus', key: 'estatus', width: 14 },
        { header: 'Área', key: 'area', width: 18 },
        { header: 'Usuario Final', key: 'usufinal', width: 20 },
        { header: 'Fecha Baja', key: 'fechabaja', width: 16 },
        { header: 'Causa de Baja', key: 'causadebaja', width: 24 },
        { header: 'Resguardante', key: 'resguardante', width: 18 },
    ];

    // Obtiene el filtro de estatus según el reporte
    function getEstatusFilter(report: string) {
        switch (report) {
            case 'Activos':
                return 'ACTIVO';
            case 'Inactivos':
                return 'INACTIVO';
            case 'No localizados':
                return 'NO LOCALIZADO';
            case 'Obsoletos':
                return 'OBSOLETO';
            default:
                return null; // General: sin filtro
        }
    }

    // Datos de reportes INEA con íconos y colores específicos
    const reportes = [
        {
            id: 1,
            title: 'General',
            path: '/reportes/inea/general',
            icon: <Database className="h-5 w-5" />,
            color: 'bg-blue-900/20',
            borderColor: 'border-blue-800',
            hoverColor: 'hover:border-blue-500',
            iconColor: 'text-blue-400'
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
        },
    ];

    // Función para abrir el modal de exportación
    

    // Exporta el reporte real trayendo todos los datos (paginación manual)
    
    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden border border-gray-800 transition-all duration-500 transform">
                {/* Header */}
                <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">
                            <FileText className="h-4 w-4 inline mr-1" />
                            DAS
                        </span>
                        DASHBOARD GENERAL
                    </h1>                    
                </div>

                {/* Main content */}
                <div className="p-4 sm:p-6 flex justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 place-items-center w-full">
                        {reportes.map((reporte) => (
                            <div
                                key={reporte.id}
                                className={`${reporte.color} rounded-xl border ${reporte.borderColor} p-4 ${reporte.hoverColor} transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex flex-col items-center w-full min-h-[260px]`}
                            >
                                <div className="flex justify-between items-center mb-4 w-full">
                                    <div className="flex items-center mx-auto">
                                        <div className={`bg-gray-800 p-2 rounded-lg mr-3 border ${reporte.borderColor}`}>
                                            <span className={reporte.iconColor}>{reporte.icon}</span>
                                        </div>
                                        <h3 className="text-lg font-medium"> {reporte.title}</h3>
                                    </div>
                                </div>

                                <p className="text-gray-400 mb-4 text-sm text-center">
                                    {reporte.title === 'General' ? 'Información completa de todos los Bienes Muebles.' :
                                        reporte.title === 'Activos' ? 'Bienes que actualmente se encuentran en resguardo por cada área.' :
                                            reporte.title === 'Inactivos' ? 'Bienes dados de baja temporalmente.' :
                                                reporte.title === 'No localizados' ? 'Bienes con paradero desconocido.' :
                                                    reporte.title === 'Obsoletos' ? 'Bienes que ya se encuentran en etapa de Baja Definitiva.' :
                                                        reporte.title === 'Inventario' ? 'Listado completo de bienes patrimoniales.' :
                                                            reporte.title === 'Auditoría' ? 'Reportes de revisiones y verificaciones' :
                                                                'Datos estadísticos y métricas de uso'}
                                </p>

                                
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                
            </div>

            {/* Modal de exportación */}
            
        </div>
    );
}
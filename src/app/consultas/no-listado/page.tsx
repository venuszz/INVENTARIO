import { Suspense } from 'react';
import NoListadoGeneral from '@/components/consultas/no-listado/general';

export default function NoListadoPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Cargando...</div>}>
            <NoListadoGeneral />
        </Suspense>
    );
}

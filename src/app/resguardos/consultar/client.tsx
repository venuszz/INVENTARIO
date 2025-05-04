'use client';

import { useSearchParams } from 'next/navigation';
import Consultar from "@/components/resguardos/consultar";

export default function ConsultarClient() {
    const searchParams = useSearchParams();

    // Get the folio parameter using the useSearchParams hook
    const folioParam = searchParams.get('folio');

    return (
        <div className="w-full h-full overflow-auto">
            <Consultar folioParam={folioParam} />
        </div>
    );
}
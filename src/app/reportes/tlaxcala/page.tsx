import ReportesTlaxcalaDashboard from '@/components/reportes/tlaxcala';
import ProtectedPage from '@/components/ProtectedPage';

export default function ReportesTlaxcalaPage() {
    return (
        <ProtectedPage requiredRoles={['admin', 'superadmin', 'usuario']}>
            <ReportesTlaxcalaDashboard />
        </ProtectedPage>
    );
}

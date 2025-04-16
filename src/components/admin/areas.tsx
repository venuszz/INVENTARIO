import supabase from '@/app/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function () {
    const [areas, setAreas] = useState<{ id: number; name: string; itea: string }[] | null>(null);

    const getAreas = async () => {
        const { data, error } = await supabase
            .from('areas')
            .select('*')
            .order('itea', { ascending: true });

        if (error) {
            console.error('Error fetching areas:', error);
            return null;
        }
        return data;
    };

    useEffect(() => {
        const fetchAreas = async () => {
            const data = await getAreas();
            setAreas(data);
        };
        fetchAreas();
    }, []);

    return (
        <div className="max-h-full overflow-auto">
                    {areas && areas.map((area: { id: number; name: string; itea: string }) => (
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Itea</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {areas && areas.map((area) => (
                        <tr key={area.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{area.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{area.itea}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
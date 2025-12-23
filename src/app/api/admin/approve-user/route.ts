import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación del admin
        const cookieStore = await cookies();
        const userDataCookie = cookieStore.get('userData');

        if (!userDataCookie) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        const userData = JSON.parse(userDataCookie.value);

        // Verificar que sea superadmin
        if (userData.rol !== 'superadmin') {
            return NextResponse.json(
                { error: 'No tienes permisos para realizar esta acción' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, rol, action } = body;

        if (!userId || !action) {
            return NextResponse.json(
                { error: 'Faltan parámetros requeridos' },
                { status: 400 }
            );
        }

        if (action === 'approve' && !rol) {
            return NextResponse.json(
                { error: 'El rol es requerido para aprobar' },
                { status: 400 }
            );
        }

        // Aprobar usuario
        if (action === 'approve') {
            const { data, error } = await supabaseAdmin
                .from('users')
                .update({
                    rol: rol,
                    is_active: true,
                    pending_approval: false,
                    approved_by: userData.id,
                    approved_at: new Date().toISOString(),
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                console.error('Error aprobando usuario:', error);
                return NextResponse.json(
                    { error: 'Error aprobando usuario' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Usuario aprobado exitosamente',
                user: data
            });
        }

        // Rechazar usuario
        if (action === 'reject') {
            const { error } = await supabaseAdmin
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) {
                console.error('Error rechazando usuario:', error);
                return NextResponse.json(
                    { error: 'Error rechazando usuario' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Usuario rechazado y eliminado'
            });
        }

        return NextResponse.json(
            { error: 'Acción no válida' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error en approve-user:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('pending_approval', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending users:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Obtener la lista de usuarios de Auth para recuperar la metadata (avatar)
        // Nota: listUsers() tiene paginación, si hay muchos usuarios pendientes, deberíamos manejar paginación.
        // Por ahora obtenemos un batch razonable.
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error('Error fetching auth users:', authError);
            // Continuamos sin avatares si falla Auth
        }

        // Mapear los usuarios de la BD con la metadata de Auth
        const usersWithAvatar = data.map(dbUser => {
            const authUser = authUsers?.find(u => u.id === dbUser.id);
            return {
                ...dbUser,
                avatar_url: authUser?.user_metadata?.avatar_url || null
            };
        });

        return NextResponse.json({ users: usersWithAvatar });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

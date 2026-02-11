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
        const url = new URL(request.url);
        const filterType = url.searchParams.get('type') || 'all';

        let query = supabase
            .from('users')
            .select('*')
            .eq('pending_approval', true)
            .eq('is_active', false);

        if (filterType === 'oauth') {
            query = query.eq('oauth_provider', 'axpert');
        } else if (filterType === 'local') {
            query = query.eq('oauth_provider', 'traditional');
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending users:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error('Error fetching auth users:', authError);
        }

        const usersWithAvatar = data.map(dbUser => {
            const authUser = authUsers?.find(u => u.id === dbUser.id);
            return {
                ...dbUser,
                avatar_url: authUser?.user_metadata?.avatar_url || null,
                user_type: dbUser.oauth_provider === 'traditional' ? 'local' : 'oauth'
            };
        });

        return NextResponse.json({ users: usersWithAvatar });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

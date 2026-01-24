import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return handleProxy(request);
}

export async function POST(request: NextRequest) {
    return handleProxy(request);
}

export async function PATCH(request: NextRequest) {
    return handleProxy(request);
}

export async function PUT(request: NextRequest) {
    return handleProxy(request);
}

export async function DELETE(request: NextRequest) {
    return handleProxy(request);
}

async function handleProxy(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
        return NextResponse.json(
            { error: 'Supabase configuration missing' },
            { status: 500 }
        );
    }

    const method = request.method;
    const isWriteMethod = method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';

    // Leer cookies HttpOnly del servidor
    const authToken = request.cookies.get('sb-access-token')?.value;
    const userDataCookie = request.cookies.get('userData')?.value;
    
    if (!authToken || !userDataCookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let oauthProvider: string | undefined;
    let userRole: string | undefined;
    try {
        const parsed = JSON.parse(userDataCookie);
        oauthProvider = parsed?.oauthProvider;
        userRole = parsed?.rol;
    } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');

    if (!target || !target.startsWith('/rest/v1/')) {
        return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
    }

    const allowedPrefixes = [
        '/rest/v1/muebles',
        '/rest/v1/mueblesitea',
        '/rest/v1/mueblestlaxcala',
        '/rest/v1/resguardos',
        '/rest/v1/resguardos_bajas',
        '/rest/v1/config',
        '/rest/v1/directorio',
        '/rest/v1/area',
        '/rest/v1/directorio_areas',
        '/rest/v1/firmas',
        '/rest/v1/rpc/get_admin_notifications',
        '/rest/v1/users',
        '/rest/v1/notifications',
        '/rest/v1/admin_notification_states',
    ];

    const isAllowed = allowedPrefixes.some((p) => target.startsWith(p));
    
    if (!isAllowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isAdminTableTarget =
        target.startsWith('/rest/v1/config') ||
        target.startsWith('/rest/v1/directorio') ||
        target.startsWith('/rest/v1/area') ||
        target.startsWith('/rest/v1/directorio_areas') ||
        target.startsWith('/rest/v1/firmas') ||
        target.startsWith('/rest/v1/notifications') ||
        target.startsWith('/rest/v1/admin_notification_states') ||
        target.startsWith('/rest/v1/users');

    // Tablas de inventario que los admins pueden modificar
    const isInventoryTableTarget =
        target.startsWith('/rest/v1/muebles') ||
        target.startsWith('/rest/v1/mueblesitea') ||
        target.startsWith('/rest/v1/mueblestlaxcala') ||
        target.startsWith('/rest/v1/resguardos');

    const isRpcNotifications = target.startsWith('/rest/v1/rpc/get_admin_notifications');

    // Validar permisos de escritura
    if (isWriteMethod) {
        const isAdminRole = userRole === 'admin' || userRole === 'superadmin';
        
        if (!isAdminRole) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!isAdminTableTarget && !isInventoryTableTarget && !isRpcNotifications) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    const upstreamUrl = `${supabaseUrl}${target}`;

    const upstreamHeaders = new Headers();
    const contentType = request.headers.get('content-type');
    const accept = request.headers.get('accept');
    const prefer = request.headers.get('prefer');
    const range = request.headers.get('range');

    if (contentType) upstreamHeaders.set('content-type', contentType);
    if (accept) upstreamHeaders.set('accept', accept);
    if (prefer) upstreamHeaders.set('prefer', prefer);
    if (range) upstreamHeaders.set('range', range);

    upstreamHeaders.set('apikey', supabaseAnonKey);
    
    // Usar service key para usuarios AXpert, authToken para usuarios locales
    if (oauthProvider === 'axpert') {
        upstreamHeaders.set('Authorization', `Bearer ${supabaseServiceKey}`);
    } else {
        upstreamHeaders.set('Authorization', `Bearer ${authToken}`);
    }

    const hasBody = method === 'POST' || method === 'PATCH' || method === 'PUT';
    let body: ArrayBuffer | undefined;
    
    if (hasBody) {
        body = await request.arrayBuffer();
    }

    try {
        const upstreamRes = await fetch(upstreamUrl, {
            method,
            headers: upstreamHeaders,
            body,
        });

        const resHeaders = new Headers();
        const upstreamContentType = upstreamRes.headers.get('content-type');
        if (upstreamContentType) resHeaders.set('content-type', upstreamContentType);

        const upstreamContentRange = upstreamRes.headers.get('content-range');
        if (upstreamContentRange) resHeaders.set('content-range', upstreamContentRange);

        const upstreamPrefer = upstreamRes.headers.get('preference-applied');
        if (upstreamPrefer) resHeaders.set('preference-applied', upstreamPrefer);

        const buf = await upstreamRes.arrayBuffer();

        // Manejar 204 No Content
        if (upstreamRes.status === 204) {
            return new NextResponse(null, {
                status: 204,
                headers: resHeaders,
            });
        }

        return new NextResponse(buf, {
            status: upstreamRes.status,
            headers: resHeaders,
        });
    } catch (error) {
        console.error('Proxy error:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { error: 'Proxy request failed' },
            { status: 500 }
        );
    }
}

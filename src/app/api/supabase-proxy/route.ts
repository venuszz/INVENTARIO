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
            { error: 'Supabase env missing' },
            { status: 500 }
        );
    }

    const method = request.method;
    const isReadMethod = method === 'GET' || method === 'HEAD';
    const isWriteMethod = method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';

    const userDataCookie = request.cookies.get('userData')?.value;
    if (!userDataCookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let oauthProvider: string | undefined;
    let userRole: string | undefined;
    try {
        const parsed = JSON.parse(userDataCookie);
        oauthProvider = parsed?.oauthProvider;
        userRole = parsed?.rol;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (oauthProvider !== 'axpert') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');

    if (!target || !target.startsWith('/rest/v1/')) {
        return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
    }

    const allowedPrefixes = [
        '/rest/v1/muebles?',
        '/rest/v1/mueblesitea?',
        '/rest/v1/resguardos?',
        '/rest/v1/resguardos_bajas?',
        '/rest/v1/config',
        '/rest/v1/directorio',
        '/rest/v1/area',
        '/rest/v1/directorio_areas',
        '/rest/v1/rpc/get_admin_notifications',
    ];

    const isAllowed = allowedPrefixes.some((p) => target.startsWith(p));
    if (!isAllowed) {
        return NextResponse.json({ error: 'Target not allowed' }, { status: 403 });
    }

    const isAdminTableTarget =
        target.startsWith('/rest/v1/config') ||
        target.startsWith('/rest/v1/directorio') ||
        target.startsWith('/rest/v1/area') ||
        target.startsWith('/rest/v1/directorio_areas');

    const isRpcNotifications = target.startsWith('/rest/v1/rpc/get_admin_notifications');

    if (!isReadMethod && isWriteMethod) {
        const isAdminRole = userRole === 'admin' || userRole === 'superadmin';
        if (!isAdminRole) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!isAdminTableTarget) {
            return NextResponse.json({ error: 'Target not allowed' }, { status: 403 });
        }
    }

    if (method === 'POST' && isRpcNotifications === false && isAdminTableTarget === false) {
        return NextResponse.json({ error: 'Target not allowed' }, { status: 403 });
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
    upstreamHeaders.set('Authorization', `Bearer ${supabaseServiceKey}`);

    const hasBody = method === 'POST' || method === 'PATCH' || method === 'PUT';
    const body = hasBody ? await request.arrayBuffer() : undefined;

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
    return new NextResponse(buf, {
        status: upstreamRes.status,
        headers: resHeaders,
    });
}

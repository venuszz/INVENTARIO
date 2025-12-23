import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
        return NextResponse.json(
            { error: "Configuration Error" },
            { status: 500 }
        );
    }

    const configuredProviderUrl = process.env.SUPABASE_OAUTH_PROVIDER_URL;
    const providerUrl = configuredProviderUrl || supabaseUrl;
    const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID;

    if (!clientId) {
        return NextResponse.json(
            { error: "OAuth Not Configured" },
            { status: 500 }
        );
    }

    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/auth/callback`;

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    // Estado base para OAuth
    const statePayload: any = {
        timestamp: Date.now(),
        nonce: Math.random().toString(36),
    };

    // Si es modo vinculación, validamos sesión y añadimos metadata
    if (mode === 'linking') {
        const userDataCookie = request.cookies.get('userData');

        if (!userDataCookie) {
            return NextResponse.json(
                { error: "Unauthorized: Must be logged in to link accounts" },
                { status: 401 }
            );
        }

        try {
            const userData = JSON.parse(userDataCookie.value);
            if (!userData.id) throw new Error("No user ID found");
            statePayload.mode = 'linking';
            statePayload.original_user_id = userData.id;
        } catch (e) {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 401 }
            );
        }
    }

    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const authorizeUrl = `${providerUrl}/auth/v1/oauth/authorize?${new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
    }).toString()}`;

    const response = NextResponse.redirect(authorizeUrl);

    response.cookies.set('oauth_code_verifier', codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600
    });

    response.cookies.set('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600
    });

    return response;
}

function generateCodeVerifier(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return Buffer.from(randomBytes).toString('base64url');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Buffer.from(hash).toString('base64url');
}

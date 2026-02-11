export interface PendingUser {
    id: string;
    email: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    oauth_provider: string | null;
    created_at: string;
    avatar_url?: string | null;
    user_type?: 'oauth' | 'local';
}

export interface Role {
    value: string;
    label: string;
    description: string;
    color: string;
}

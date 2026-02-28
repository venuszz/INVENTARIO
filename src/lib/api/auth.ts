/**
 * User information from auth session
 */
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Authentication session data
 */
export interface AuthSession {
  isAuthenticated: boolean;
  user?: AuthUser;
}

/**
 * Check current authentication session
 * 
 * This function checks if the user is authenticated by calling the session endpoint.
 * Unlike other API functions, this does NOT throw an error if the user is not authenticated.
 * Instead, it returns { isAuthenticated: false }.
 * 
 * @returns Promise with auth session data
 * 
 * @example
 * ```typescript
 * const session = await fetchAuthSession();
 * if (session.isAuthenticated) {
 *   console.log('User:', session.user?.email);
 * } else {
 *   console.log('Not authenticated');
 * }
 * ```
 */
export async function fetchAuthSession(): Promise<AuthSession> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    });

    if (!response.ok) {
      // Not authenticated is not an error, just return false
      return { isAuthenticated: false };
    }

    const data = await response.json();
    return {
      isAuthenticated: data.isAuthenticated === true,
      user: data.user,
    };
  } catch (error) {
    // Network errors or other issues - treat as not authenticated
    console.error('Error checking auth session:', error);
    return { isAuthenticated: false };
  }
}

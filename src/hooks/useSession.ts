"use client";

import { useState, useEffect, useCallback } from 'react';

/**
 * Tipos de datos de sesión
 */
export interface UserData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  rol: string | null;
  oauthProvider?: 'axpert' | 'local';
  loginMethod?: 'local' | 'axpert';
}

export interface AxpertProfile {
  avatarUrl?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface PendingUser {
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string | null;
}

export interface SessionData {
  user: UserData | null;
  pendingUser: PendingUser | null;
  axpertProfile: AxpertProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook useSession
 * 
 * Proporciona acceso seguro a los datos de sesión del usuario.
 * Reemplaza la lectura directa de cookies desde JavaScript.
 * 
 * Los datos se obtienen desde el servidor mediante /api/auth/session,
 * que lee las cookies HttpOnly de manera segura.
 * 
 * @returns {SessionData} Datos de sesión y funciones de control
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, isLoading } = useSession();
 *   
 *   if (isLoading) return <div>Cargando...</div>;
 *   if (!isAuthenticated) return <div>No autenticado</div>;
 *   
 *   return <div>Hola, {user.firstName}</div>;
 * }
 * ```
 */
export function useSession(): SessionData {
  const [user, setUser] = useState<UserData | null>(null);
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null);
  const [axpertProfile, setAxpertProfile] = useState<AxpertProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Función para obtener datos de sesión desde el servidor
   */
  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include', // Importante: enviar cookies HttpOnly
        cache: 'no-store', // No cachear para obtener datos frescos
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setUser(data.user);
      setPendingUser(data.pendingUser || null);
      setAxpertProfile(data.axpertProfile || null);
      setIsAuthenticated(data.isAuthenticated);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error fetching session:', errorMessage);
      
      setError(errorMessage);
      setUser(null);
      setPendingUser(null);
      setAxpertProfile(null);
      setIsAuthenticated(false);
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cargar sesión al montar el componente
   */
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    user,
    pendingUser,
    axpertProfile,
    isAuthenticated,
    isLoading,
    error,
    refresh: fetchSession,
  };
}

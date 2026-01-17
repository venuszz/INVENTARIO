"use client";

import { ReactNode } from "react";
import { useSession } from "@/hooks/useSession";
import AccessDenied from "./AccessDenied";

interface ProtectedPageProps {
  children: ReactNode;
  requiredRoles: string[];
}

export default function ProtectedPage({
  children,
  requiredRoles,
}: ProtectedPageProps) {
  const { user, isAuthenticated, isLoading } = useSession();

  // Mostrar nada mientras carga
  if (isLoading) {
    return null;
  }

  // Si no está autenticado, denegar acceso
  if (!isAuthenticated || !user) {
    return <AccessDenied />;
  }

  // Verificar si el usuario tiene uno de los roles requeridos
  const hasAccess = user.rol && requiredRoles.includes(user.rol);

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

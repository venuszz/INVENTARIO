"use client";

import { ReactNode, useEffect, useState } from "react";
import Cookies from "js-cookie";
import AccessDenied from "./AccessDenied";

interface ProtectedPageProps {
  children: ReactNode;
  requiredRoles: string[];
}

export default function ProtectedPage({
  children,
  requiredRoles,
}: ProtectedPageProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userDataCookie = Cookies.get("userData");
    if (userDataCookie) {
      try {
        const parsed = JSON.parse(userDataCookie);
        setUserRole(parsed.rol || null);
      } catch {
        setUserRole(null);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return null;
  }

  const hasAccess = userRole && requiredRoles.includes(userRole);

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

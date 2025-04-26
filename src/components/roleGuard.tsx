import React from "react";

type RoleGuardProps = {
    roles: string[];
    userRole?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
};

const RoleGuard: React.FC<RoleGuardProps> = ({ roles, userRole, children, fallback = null }) => {
    if (!userRole || !roles.includes(userRole)) return <>{fallback}</>;
    return <>{children}</>;
};

export default RoleGuard;
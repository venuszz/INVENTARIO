"use client";

import Crear from "@/components/resguardos/crear"
import ProtectedPage from "@/components/ProtectedPage";

export default function Page() {
    return (
        <ProtectedPage requiredRoles={["admin", "superadmin"]}>
            <div className="w-full h-full overflow-auto">
                <Crear />
            </div>
        </ProtectedPage>
    )
}
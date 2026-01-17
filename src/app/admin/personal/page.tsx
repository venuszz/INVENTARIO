"use client";

import Personal from "@/components/admin/directorio"
import ProtectedPage from "@/components/ProtectedPage";

export default function Add() {
    return (
        <ProtectedPage requiredRoles={["superadmin", "admin"]}>
            <div className="max-h-full overflow-auto">
                <Personal />
            </div>
        </ProtectedPage>
    )
}
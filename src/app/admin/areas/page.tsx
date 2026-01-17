"use client";

import Areas from "@/components/admin/areas"
import ProtectedPage from "@/components/ProtectedPage";

export default function Add() {
    return (
        <ProtectedPage requiredRoles={["superadmin"]}>
            <div className="max-h-full overflow-auto">
                <Areas />
            </div>
        </ProtectedPage>
    )
}
"use client";

import { DirectorioManager } from "@/components/admin/directorio"
import ProtectedPage from "@/components/ProtectedPage";

export default function Add() {
    return (
        <ProtectedPage requiredRoles={["superadmin", "admin"]}>
            <DirectorioManager />
        </ProtectedPage>
    )
}
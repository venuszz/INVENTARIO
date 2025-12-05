"use client";

import Registro from "@/components/inventario/registro"
import ProtectedPage from "@/components/ProtectedPage";

export default function Add() {
    return (
        <ProtectedPage requiredRoles={["superadmin"]}>
            <div className="max-h-full overflow-hidden">
                <Registro />
            </div>            
        </ProtectedPage>
    )
}
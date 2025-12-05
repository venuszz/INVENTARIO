"use client";

import Dasboard from "@/components/dashboard/dashboard2"
import ProtectedPage from "@/components/ProtectedPage";

export default function Add() {
    return (
        <ProtectedPage requiredRoles={["admin", "superadmin"]}>
            <div className="max-h-full overflow-auto">
                <Dasboard />
            </div>            
        </ProtectedPage>
    )
}
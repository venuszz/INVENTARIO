import Areas from "@/components/admin/areas"
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'INVENTARIO | ADMIN | ÁREAS',
    description: 'Admin page for managing áreas',
}

export default function Add() {
    return (
        <div className="max-h-full overflow-auto">
            <Areas />
        </div>            
    )
}
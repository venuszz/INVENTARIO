import Personal from "@/components/admin/directorio"
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'INVENTARIO | ADMIN | PERSONAL',
    description: 'Admin page for managing personal',
}

export default function Add() {
    return (
        <div className="max-h-full overflow-auto">
            <Personal />
        </div>            
    )
}
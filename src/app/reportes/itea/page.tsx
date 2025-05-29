import Reportes from "@/components/reportes/itea";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "INVENTARIO | OBSOLETOS",
    description: "Generar Reportes de Bienes Obsoletos",
};

export default function Add() {
    return (
        <div className="max-h-full overflow-hidden">
            <Reportes />
        </div>            
    )
}
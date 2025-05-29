import Reportes from "@/components/reportes/inea";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "INVENTARIO | REPORTES",
    description: "Generar Reportes de bienes No Obsoletos",
};

export default function Add() {
    return (
        <div className="max-h-full overflow-hidden">
            <Reportes />
        </div>            
    )
}
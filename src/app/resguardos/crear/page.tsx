import Crear from "@/components/resguardos/crear"
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "INVENTARIO | RESGUARDOS",
    description: "Generated by create next app",
};

export default function Page() {
    return (
        <div className="w-full h-full overflow-auto">
            <Crear />
        </div>
    )
}
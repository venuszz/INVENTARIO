import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ExcelOptions {
    data: Record<string, unknown>[];
    columns?: Column[]; // Ahora opcional
    fileName: string;
    worksheetName: string; // Nuevo parámetro para el nombre seguro de la hoja
}

interface Column {
    header: string;
    key: string;
    width?: number;
}

export const generateExcel = async ({ data, columns, fileName, worksheetName }: ExcelOptions) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(worksheetName || 'Reporte');

    // Estilos profesionales
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' } };
    const headerFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1F2937' } };
    const dateFont = { bold: true, size: 12 };

    // Agregar fecha de creación
    const currentDate = new Date();
    worksheet.getCell('A1').value = `Fecha de creación: ${currentDate.toLocaleDateString()}`;
    worksheet.getCell('A1').font = dateFont;
    worksheet.mergeCells('A1:C1');

    // Dejar espacio para la tabla
    worksheet.addRow([]);

    // Columnas por defecto si no se pasan
    const defaultColumns: Column[] = [
        { header: 'ID Inventario', key: 'id_inv', width: 18 },
        { header: 'Rubro', key: 'rubro', width: 18 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Valor', key: 'valor', width: 12 },
        { header: 'Fecha Adquisición', key: 'f_adq', width: 16 },
        { header: 'Forma Adq.', key: 'formadq', width: 14 },
        { header: 'Proveedor', key: 'proveedor', width: 20 },
        { header: 'Factura', key: 'factura', width: 14 },
        { header: 'Ubicación ES', key: 'ubicacion_es', width: 10 },
        { header: 'Ubicación MU', key: 'ubicacion_mu', width: 10 },
        { header: 'Ubicación NO', key: 'ubicacion_no', width: 12 },
        { header: 'Estado', key: 'estado', width: 14 },
        { header: 'Estatus', key: 'estatus', width: 14 },
        { header: 'Área', key: 'area_nombre', width: 18 },
        { header: 'Director/Responsable', key: 'director_nombre', width: 20 },
        { header: 'Fecha Baja', key: 'fechabaja', width: 16 },
        { header: 'Causa de Baja', key: 'causadebaja', width: 24 },
        { header: 'Resguardante', key: 'resguardante', width: 18 },
    ];
    const cols = columns && columns.length > 0 ? columns : defaultColumns;

    // Columnas (sin encabezados automáticos)
    worksheet.columns = cols.map(col => ({
        key: col.key,
        width: col.width || 15
    }));

    // Agregar encabezados manualmente con formato
    const headerRow = worksheet.addRow(cols.map(col => col.header));
    headerRow.font = headerFont;
    headerRow.fill = headerFill;

    // Datos
    data.forEach(item => {
        worksheet.addRow(
            cols.map(col => {
                if (col.key === 'f_adq' || col.key === 'fechabaja') {
                    return item[col.key] ? new Date(item[col.key] as string) : '';
                }
                return item[col.key];
            })
        );
    });

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${fileName}.xlsx`);
};
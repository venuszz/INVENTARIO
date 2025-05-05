import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';

export interface DashboardRubrosRow {
    rubro: string;
    count: number;
    sum: number;
}

export interface DashboardPDFOptions {
    title: string;
    totalBienes: number;
    sumaValores: number;
    rubros: DashboardRubrosRow[];
    firma: {
        concepto: string;
        nombre: string;
        puesto: string;
    };
    fileName?: string;
    warehouse?: 'INEA' | 'ITEA';
}

export async function generateDashboardPDF({
    title,
    totalBienes,
    sumaValores,
    rubros,
    firma,
    fileName = 'reporte_dashboard',
    warehouse = 'INEA',
}: DashboardPDFOptions) {
    const pdfDoc = await PDFDocument.create();
    const ineaImageBytes = await fetch('/images/INEA NACIONAL.png').then(res => res.arrayBuffer());
    const iteaImageBytes = await fetch('/images/LOGO-ITEA.png').then(res => res.arrayBuffer());
    const ineaImage = await pdfDoc.embedPng(ineaImageBytes);
    const iteaImage = await pdfDoc.embedPng(iteaImageBytes);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const margin = 40;
    const pageWidth = 595;
    const pageHeight = 842;
    const headerFontSize = 11;
    const fontSize = 9;
    const minCellPadding = 2;

    // Paleta morada
    const mainColor = rgb(0.36, 0.22, 0.53); // morado
    const tableHeaderBg = rgb(0.36, 0.22, 0.53);
    const tableHeaderText = rgb(1, 1, 1);
    const tableRowBg = rgb(0.97, 0.95, 1);
    const tableRowText = rgb(0.2, 0.15, 0.3);

    const normalizeText = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

    // Columnas de la tabla
    const columns = [
        { header: 'Rubro', key: 'rubro', width: 220 },
        { header: 'Total bienes', key: 'count', width: 90 },
        { header: 'Suma valores', key: 'sum', width: 120 },
    ];
    const totalTableWidth = columns.reduce((acc, c) => acc + c.width, 0);
    const tableStartX = (pageWidth - totalTableWidth) / 2;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Logos
    const ineaAspectRatio = ineaImage.width / ineaImage.height;
    const iteaAspectRatio = iteaImage.width / iteaImage.height;
    const maxImageHeight = 32;
    const ineaHeight = maxImageHeight;
    const iteaHeight = maxImageHeight;
    const ineaWidth = ineaHeight * ineaAspectRatio;
    const iteaWidth = iteaHeight * iteaAspectRatio;
    page.drawImage(ineaImage, {
        x: margin,
        y: y - ineaHeight,
        width: ineaWidth,
        height: ineaHeight,
    });
    page.drawImage(iteaImage, {
        x: pageWidth - margin - iteaWidth,
        y: y - iteaHeight,
        width: iteaWidth,
        height: iteaHeight,
    });

    // Títulos
    y -= 10;
    const dashboardTitle = warehouse === 'INEA'
        ? 'DASHBOARD DE INVENTARIO INEA'
        : 'DASHBOARD DE INVENTARIO ITEA';
    const titles = [
        'INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS',
        dashboardTitle,
        title.toUpperCase(),
    ];
    titles.forEach((text, idx) => {
        const size = idx === 0 ? headerFontSize : headerFontSize + 1;
        const textWidth = font.widthOfTextAtSize(text, size);
        page.drawText(normalizeText(text), {
            x: (pageWidth - textWidth) / 2,
            y: y - (idx * 18),
            size,
            font,
            color: mainColor,
        });
    });
    y -= 18 * titles.length + 10;

    // Resumen totales
    const resumenLines = [
        `Total de bienes: ${totalBienes}`,
        `Suma total de valores: $${sumaValores.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ];
    resumenLines.forEach((line, idx) => {
        page.drawText(line, {
            x: tableStartX,
            y: y - (idx * 14),
            size: fontSize,
            font: regularFont,
            color: mainColor,
        });
    });
    y -= resumenLines.length * 14 + 18;

    // Tabla de rubros
    // Header
    let x = tableStartX;
    columns.forEach((col) => {
        page.drawRectangle({
            x,
            y: y - 24,
            width: col.width,
            height: 24,
            color: tableHeaderBg,
        });
        page.drawText(col.header, {
            x: x + minCellPadding,
            y: y - 10,
            size: fontSize,
            font,
            color: tableHeaderText,
        });
        x += col.width;
    });
    y -= 24;

    // Filas
    rubros.forEach((row) => {
        let x = tableStartX;
        columns.forEach((col) => {
            page.drawRectangle({
                x,
                y: y - 20,
                width: col.width,
                height: 20,
                color: tableRowBg,
                opacity: 1,
            });
            let value = row[col.key as keyof DashboardRubrosRow];
            if (col.key === 'sum') {
                value = `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            page.drawText(String(value), {
                x: x + minCellPadding,
                y: y - 8,
                size: fontSize,
                font: regularFont,
                color: tableRowText,
            });
            x += col.width;
        });
        y -= 20;
    });

    // Firma (solo una, como PDFLevantamiento)
    y -= 40;
    const signatureBoxWidth = 260;
    const xFirma = (pageWidth - signatureBoxWidth) / 2;
    const lineY = y;
    page.drawText(normalizeText(firma.concepto.toUpperCase()), {
        x: xFirma + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.concepto.toUpperCase(), fontSize) / 2),
        y: lineY + 30,
        size: fontSize,
        font: regularFont,
        color: mainColor,
    });
    page.drawLine({
        start: { x: xFirma + 20, y: lineY },
        end: { x: xFirma + signatureBoxWidth - 20, y: lineY },
        thickness: 1,
        color: mainColor,
    });
    page.drawText(normalizeText(firma.nombre.toUpperCase()), {
        x: xFirma + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.nombre.toUpperCase(), fontSize) / 2),
        y: lineY - 15,
        size: fontSize,
        font: regularFont,
        color: mainColor,
    });
    page.drawText(normalizeText(firma.puesto.toUpperCase()), {
        x: xFirma + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.puesto.toUpperCase(), fontSize) / 2),
        y: lineY - 30,
        size: fontSize,
        font: regularFont,
        color: mainColor,
    });

    // Pie de página
    const pageText = 'REPORTE DE TOTALES POR RUBRO';
    const pageTextWidth = regularFont.widthOfTextAtSize(pageText, 10);
    page.drawText(pageText, {
        x: (pageWidth - pageTextWidth) / 2,
        y: margin - 20,
        size: 10,
        font: regularFont,
        color: mainColor,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, `${fileName}.pdf`);
}
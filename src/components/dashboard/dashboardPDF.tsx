import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import supabase from '@/app/lib/supabase/client';

export interface DashboardRubrosRow {
    rubro: string;
    count: number;
    sum: number;
}

export interface Firma {
    concepto: string;
    nombre: string;
    puesto: string;
}

export interface DashboardPDFOptions {
    title: string;
    totalBienes: number;
    sumaValores: number;
    rubros: DashboardRubrosRow[];
    fileName?: string;
    warehouse?: 'INEA' | 'ITEA';
}

export async function generateDashboardPDF({
    rubros,
    fileName = 'reporte_dashboard',
    warehouse = 'INEA',
}: DashboardPDFOptions) {
    // Obtener las tres firmas desde Supabase (sin filtro de concepto, igual que PDFLevantamiento)
    const { data: firmas, error } = await supabase
        .from('firmas')
        .select('*')
        .order('id', { ascending: true });
    if (error || !firmas || firmas.length < 3) {
        alert('No se encontraron las tres firmas.');
        return;
    }

    const pdfDoc = await PDFDocument.create();
    const ineaImageBytes = await fetch('/images/INEA NACIONAL.png').then(res => res.arrayBuffer());
    const iteaImageBytes = await fetch('/images/LOGO-ITEA.png').then(res => res.arrayBuffer());
    const ineaImage = await pdfDoc.embedPng(ineaImageBytes);
    const iteaImage = await pdfDoc.embedPng(iteaImageBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const margin = 40;
    const pageWidth = 595;
    const pageHeight = 842;
    const minCellPadding = 2;
    const headerFontSize = 8;

    const normalizeText = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

    // Columnas más angostas y proporcionales, tabla centrada
    const totalTableWidth = pageWidth - 2 * margin - 60; // deja más margen a los lados
    const colProps = [0.45, 0.18, 0.22];
    const columns = [
        { header: 'RUBRO', key: 'rubro', width: totalTableWidth * colProps[0] },
        { header: 'TOTAL', key: 'count', width: totalTableWidth * colProps[1] },
        { header: 'VALOR', key: 'sum', width: totalTableWidth * colProps[2] },
    ];
    const totalTableWidthCalculated = columns.reduce((acc, c) => acc + c.width, 0);
    const tableStartX = (pageWidth - totalTableWidthCalculated) / 2;

    // Helpers para wrap y centrado
    const wrapText = (text: string, maxWidth: number, font: import('pdf-lib').PDFFont, fontSize: number) => {
        const words = text.toString().split(' ');
        const lines: string[] = [];
        let currentLine = '';
        for (const word of words) {
            if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
                if (currentLine !== '') {
                    lines.push(currentLine);
                    currentLine = '';
                }
                let remainingWord = word;
                while (remainingWord !== '') {
                    let i = 1;
                    while (i <= remainingWord.length && font.widthOfTextAtSize(remainingWord.slice(0, i), fontSize) <= maxWidth) {
                        i++;
                    }
                    i--;
                    if (i === 0) i = 1;
                    lines.push(remainingWord.slice(0, i));
                    remainingWord = remainingWord.slice(i);
                }
                continue;
            }
            const testLine = currentLine === '' ? word : `${currentLine} ${word}`;
            if (font.widthOfTextAtSize(testLine, fontSize) <= maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        if (currentLine !== '') lines.push(currentLine);
        return lines;
    };

    // --- Página única ---
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Logos
    const ineaAspectRatio = ineaImage.width / ineaImage.height;
    const iteaAspectRatio = iteaImage.width / iteaImage.height;
    const maxImageHeight = 24;
    const ineaHeight = maxImageHeight;
    const iteaHeight = maxImageHeight;
    const ineaWidth = ineaHeight * ineaAspectRatio;
    const iteaWidth = iteaHeight * iteaAspectRatio;
    page.drawImage(ineaImage, {
        x: margin,
        y: y - maxImageHeight,
        width: ineaWidth,
        height: ineaHeight,
    });
    page.drawImage(iteaImage, {
        x: pageWidth - margin - iteaWidth,
        y: y - maxImageHeight,
        width: iteaWidth,
        height: iteaHeight,
    });

    // Títulos pequeños
    const titles = [
        'INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS',
        warehouse === 'INEA' ? 'DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS' : 'DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS',
        warehouse === 'INEA' ? 'OFICINA DE RECURSOS MATERIALES' : 'OFICINA DE RECURSOS MATERIALES',
        'REPORTE CLASIFICACIÓN DEL GASTO'
    ];
    y -= 5;
    titles.forEach((text, idx) => {
        const size = headerFontSize;
        const textWidth = font.widthOfTextAtSize(text, size);
        page.drawText(normalizeText(text), {
            x: (pageWidth - textWidth) / 2,
            y: y - (idx * 11),
            size,
            font,
            color: rgb(0, 0, 0),
        });
    });
    y -= titles.length * 11 + 8;

    // Tabla de rubros
    let x = tableStartX;
    // Header (mayúsculas, negritas, más pequeño, wrap, alineado a la derecha, centrado vertical)
    const headerFontSizeBig = 9;
    const headerCellHeight = 22;
    columns.forEach((col) => {
        page.drawRectangle({
            x,
            y: y - headerCellHeight,
            width: col.width,
            height: headerCellHeight,
            color: rgb(0.9, 0.9, 0.9),
        });
        const headerLines = wrapText(col.header.toUpperCase(), col.width - 2 * minCellPadding, font, headerFontSizeBig);
        const totalHeaderHeight = headerLines.length * (headerFontSizeBig + 2);
        const verticalOffset = (headerCellHeight - totalHeaderHeight) / 2;
        headerLines.forEach((line, idx) => {
            const textWidth = font.widthOfTextAtSize(line, headerFontSizeBig);
            page.drawText(line, {
                x: x + col.width - textWidth - minCellPadding,
                y: y - verticalOffset - (idx * (headerFontSizeBig + 2)) - headerFontSizeBig,
                size: headerFontSizeBig,
                font: font,
                color: rgb(0, 0, 0),
            });
        });
        x += col.width;
    });
    y -= headerCellHeight;
    // Filas (wrap, más pequeño, alineado a la derecha, más espacio entre filas)
    const rowFontSize = 7;
    let totalBienes = 0;
    let totalValores = 0;
    rubros.forEach((row) => {
        let x = tableStartX;
        let maxLines = 1;
        columns.forEach((col) => {
            let value = row[col.key as keyof DashboardRubrosRow];
            if (col.key === 'sum') {
                value = `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            const lines = wrapText(String(value).toUpperCase(), col.width - 2 * minCellPadding, regularFont, rowFontSize);
            maxLines = Math.max(maxLines, lines.length);
        });
        const rowCellHeight = 15 * maxLines;
        columns.forEach((col) => {
            page.drawRectangle({
                x,
                y: y - rowCellHeight,
                width: col.width,
                height: rowCellHeight,
                color: rgb(1, 1, 1),
                opacity: 1,
            });
            let value = row[col.key as keyof DashboardRubrosRow];
            if (col.key === 'sum') {
                value = `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            const lines = wrapText(String(value).toUpperCase(), col.width - 2 * minCellPadding, regularFont, rowFontSize);
            const totalRowHeight = lines.length * (rowFontSize + 2);
            const verticalOffset = (rowCellHeight - totalRowHeight) / 2;
            lines.forEach((line, idx) => {
                const textWidth = regularFont.widthOfTextAtSize(line, rowFontSize);
                page.drawText(line, {
                    x: x + col.width - textWidth - minCellPadding,
                    y: y - verticalOffset - (idx * (rowFontSize + 2)) - rowFontSize,
                    size: rowFontSize,
                    font: regularFont,
                    color: rgb(0, 0, 0),
                });
            });
            x += col.width;
        });
        y -= rowCellHeight;
        totalBienes += Number(row.count);
        totalValores += Number(row.sum);
    });
    // Fila de totales (alineado a la derecha)
    let xTot = tableStartX;
    const totalCellHeight = 18;
    columns.forEach((col) => {
        page.drawRectangle({
            x: xTot,
            y: y - totalCellHeight,
            width: col.width,
            height: totalCellHeight,
            color: rgb(0.92, 0.92, 0.92),
        });
        let value = '';
        if (col.key === 'rubro') value = 'TOTAL';
        if (col.key === 'count') value = totalBienes.toLocaleString('es-MX');
        if (col.key === 'sum') value = `$${totalValores.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const fontSizeTotal = rowFontSize + 1;
        const textWidth = font.widthOfTextAtSize(String(value).toUpperCase(), fontSizeTotal);
        const verticalOffset = (totalCellHeight - fontSizeTotal) / 2;
        page.drawText(String(value).toUpperCase(), {
            x: xTot + col.width - textWidth - minCellPadding,
            y: y - verticalOffset - fontSizeTotal,
            size: fontSizeTotal,
            font: font,
            color: rgb(0, 0, 0),
        });
        xTot += col.width;
    });
    y -= totalCellHeight;

    // Firmas SIEMPRE al pie de la última página (pegadas al margen inferior)
    const signatureBoxWidth = (pageWidth - 2 * margin) / 3;
    const signatureSectionY = margin + 30; // margen inferior fijo
    const lineY = signatureSectionY + 40;
    const signatureFontSize = 7;
    firmas.slice(0, 3).forEach((firma, index) => {
        const xPos = margin + (index * signatureBoxWidth);
        page.drawText(normalizeText(firma.concepto.toUpperCase()), {
            x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.concepto.toUpperCase(), signatureFontSize) / 2),
            y: lineY + 30,
            size: signatureFontSize,
            font: regularFont,
            color: rgb(0, 0, 0),
        });
        page.drawLine({
            start: { x: xPos + 20, y: lineY },
            end: { x: xPos + signatureBoxWidth - 20, y: lineY },
            thickness: 1.2,
            color: rgb(0, 0, 0),
        });
        page.drawText(normalizeText(firma.nombre.toUpperCase()), {
            x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.nombre.toUpperCase(), signatureFontSize) / 2),
            y: lineY - 15,
            size: signatureFontSize,
            font: regularFont,
            color: rgb(0, 0, 0),
        });
        page.drawText(normalizeText(firma.puesto.toUpperCase()), {
            x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.puesto.toUpperCase(), signatureFontSize) / 2),
            y: lineY - 30,
            size: signatureFontSize,
            font: regularFont,
            color: rgb(0, 0, 0),
        });
    });

    // Pie de página igual que PDFLevantamiento
    const pageText = 'PÁGINA 1 DE 1';
    const pageTextWidth = regularFont.widthOfTextAtSize(pageText, 10);
    page.drawText(pageText, {
        x: pageWidth - margin - pageTextWidth,
        y: margin - 20,
        size: 10,
        font: regularFont,
        color: rgb(0.6, 0.6, 0.6)
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, `${fileName}.pdf`);
}
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import supabase from '@/app/lib/supabase/client';

export interface DashboardRubrosRow {
    numeroPartida: string;
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
    date?: string;
}

export async function generateDashboardPDF({
    rubros,
    fileName = 'reporte_dashboard',
    warehouse = 'INEA',
    date,
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
    const colProps = [0.15, 0.35, 0.18, 0.22]; // Nueva distribución con columna No. Partida
    const columns = [
        { header: 'RUBRO', key: 'combined', width: totalTableWidth * (colProps[0] + colProps[1]) }, // Combinar No. Partida y Rubro
        { header: 'TOTAL', key: 'count', width: totalTableWidth * colProps[2] },
        { header: 'VALOR', key: 'sum', width: totalTableWidth * colProps[3] },
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
        'INSTITUTO NACIONAL PARA LA EDUCACIÓN DE LOS LOS ADULTOS',
        warehouse === 'INEA' ? 'UNIDAD DE ADMINISTRACIÓN Y FINANZAS' : 'UNIDAD DE ADMINISTRACIÓN Y FINANZAS',
        warehouse === 'INEA' ? 'SUBDIRECCIÓN DE RECURSOS MATERIALES Y SERVICIOS' : 'SUBDIRECCIÓN DE RECURSOS MATERIALES Y SERVICIOS',
        'DEPARTAMENTO DE CONTROL PATRIMONIAL',
        'CONCENTRADO GENERAL DE BIENES MUEBLES',
        '',
        'INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS',
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

    // Después de los títulos
    y -= titles.length * 11 + 8;

    // Agregar fecha después de los títulos
    if (date) {
        const dateText = `Fecha: ${date}`;
        const textWidth = font.widthOfTextAtSize(dateText, headerFontSize);
        page.drawText(normalizeText(dateText), {
            x: (pageWidth - textWidth) / 2,
            y: y,
            size: headerFontSize,
            font,
            color: rgb(0, 0, 0),
        });
        y -= 20; // Más espacio para la fecha
    }

    // Tabla de rubros con nueva columna y encabezado compartido
    const headerFontSizeBig = 9;
    const headerCellHeight = 22;
    
    // Primero dibujamos todos los rectángulos de fondo de los encabezados
    const rubroHeaderWidth = totalTableWidth * (colProps[0] + colProps[1]);
    
    // Dibujamos los fondos de todas las columnas
    page.drawRectangle({
        x: tableStartX,
        y: y - headerCellHeight,
        width: rubroHeaderWidth,
        height: headerCellHeight,
        color: rgb(0.9, 0.9, 0.9),
    });

    // Columnas de Total y Valor
    page.drawRectangle({
        x: tableStartX + rubroHeaderWidth,
        y: y - headerCellHeight,
        width: totalTableWidth * colProps[2],
        height: headerCellHeight,
        color: rgb(0.9, 0.9, 0.9),
    });

    page.drawRectangle({
        x: tableStartX + rubroHeaderWidth + totalTableWidth * colProps[2],
        y: y - headerCellHeight,
        width: totalTableWidth * colProps[3],
        height: headerCellHeight,
        color: rgb(0.9, 0.9, 0.9),
    });

    // Ahora dibujamos los textos de los encabezados
    const rubroHeaderText = "RUBRO";
    const rubroHeaderTextWidth = font.widthOfTextAtSize(rubroHeaderText, headerFontSizeBig);
    page.drawText(rubroHeaderText, {
        x: tableStartX + (rubroHeaderWidth - rubroHeaderTextWidth) / 2,
        y: y - headerCellHeight/2 - headerFontSizeBig/2,
        size: headerFontSizeBig,
        font: font,
        color: rgb(0, 0, 0),
    });

    // Dibujamos los encabezados de Total y Valor
    const totalHeaderText = "TOTAL";
    const totalHeaderTextWidth = font.widthOfTextAtSize(totalHeaderText, headerFontSizeBig);
    page.drawText(totalHeaderText, {
        x: tableStartX + rubroHeaderWidth + (totalTableWidth * colProps[2] - totalHeaderTextWidth) / 2,
        y: y - headerCellHeight/2 - headerFontSizeBig/2,
        size: headerFontSizeBig,
        font: font,
        color: rgb(0, 0, 0),
    });

    const valorHeaderText = "VALOR";
    const valorHeaderTextWidth = font.widthOfTextAtSize(valorHeaderText, headerFontSizeBig);
    page.drawText(valorHeaderText, {
        x: tableStartX + rubroHeaderWidth + totalTableWidth * colProps[2] + (totalTableWidth * colProps[3] - valorHeaderTextWidth) / 2,
        y: y - headerCellHeight/2 - headerFontSizeBig/2,
        size: headerFontSizeBig,
        font: font,
        color: rgb(0, 0, 0),
    });

    // Dibujamos las líneas divisorias verticales entre las columnas bajo RUBRO
    page.drawLine({
        start: { x: tableStartX + totalTableWidth * colProps[0], y: y - headerCellHeight },
        end: { x: tableStartX + totalTableWidth * colProps[0], y: y },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
    });

    y -= headerCellHeight;

    // Filas (modificadas para mantener las columnas separadas y altura dinámica)
    const rowFontSize = 7;
    let totalBienes = 0;
    let totalValores = 0;

    rubros.forEach((row) => {
        const x = tableStartX;

        // Calcular líneas y altura dinámica para cada celda
        const partidaValue = row.numeroPartida || '';
        const partidaLines = wrapText(partidaValue.toUpperCase(), totalTableWidth * colProps[0] - 2 * minCellPadding, regularFont, rowFontSize);

        const rubroValue = row.rubro || '';
        const rubroLines = wrapText(rubroValue.toUpperCase(), totalTableWidth * colProps[1] - 2 * minCellPadding, regularFont, rowFontSize);

        // Calcular la altura máxima de la fila según el mayor número de líneas
        const linesCount = Math.max(partidaLines.length, rubroLines.length, 1);
        const rowHeight = linesCount * (rowFontSize + 2) + 4; // 4 de padding vertical

        // Columna No. Partida (centrado)
        page.drawRectangle({
            x,
            y: y - rowHeight,
            width: totalTableWidth * colProps[0],
            height: rowHeight,
            color: rgb(1, 1, 1),
            opacity: 1,
        });

        // Centrar vertical y horizontalmente cada línea
        partidaLines.forEach((line, idx) => {
            const textWidth = regularFont.widthOfTextAtSize(line, rowFontSize);
            const cellWidth = totalTableWidth * colProps[0];
            const totalTextHeight = partidaLines.length * (rowFontSize + 2);
            const yOffset = (rowHeight - totalTextHeight) / 2;
            page.drawText(line, {
                x: x + (cellWidth - textWidth) / 2,
                y: y - yOffset - (idx * (rowFontSize + 2)) - rowFontSize,
                size: rowFontSize,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
        });

        // Columna Rubro (alineado a la izquierda)
        page.drawRectangle({
            x: x + totalTableWidth * colProps[0],
            y: y - rowHeight,
            width: totalTableWidth * colProps[1],
            height: rowHeight,
            color: rgb(1, 1, 1),
            opacity: 1,
        });

        rubroLines.forEach((line, idx) => {
            const totalTextHeight = rubroLines.length * (rowFontSize + 2);
            const yOffset = (rowHeight - totalTextHeight) / 2;
            page.drawText(line, {
                x: x + totalTableWidth * colProps[0] + minCellPadding,
                y: y - yOffset - (idx * (rowFontSize + 2)) - rowFontSize,
                size: rowFontSize,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
        });

        // Columna Total (igual que antes)
        page.drawRectangle({
            x: x + totalTableWidth * (colProps[0] + colProps[1]),
            y: y - rowHeight,
            width: totalTableWidth * colProps[2],
            height: rowHeight,
            color: rgb(1, 1, 1),
            opacity: 1,
        });

        const countValue = row.count.toString();
        const countWidth = regularFont.widthOfTextAtSize(countValue, rowFontSize);
        page.drawText(countValue, {
            x: x + totalTableWidth * (colProps[0] + colProps[1]) + totalTableWidth * colProps[2] - countWidth - minCellPadding,
            y: y - 4 - rowFontSize,
            size: rowFontSize,
            font: regularFont,
            color: rgb(0, 0, 0),
        });

        // Columna Valor (igual que antes)
        page.drawRectangle({
            x: x + totalTableWidth * (colProps[0] + colProps[1] + colProps[2]),
            y: y - rowHeight,
            width: totalTableWidth * colProps[3],
            height: rowHeight,
            color: rgb(1, 1, 1),
            opacity: 1,
        });

        const sumValue = `$${row.sum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const sumWidth = regularFont.widthOfTextAtSize(sumValue, rowFontSize);
        page.drawText(sumValue, {
            x: x + totalTableWidth * (colProps[0] + colProps[1] + colProps[2]) + totalTableWidth * colProps[3] - sumWidth - minCellPadding,
            y: y - 4 - rowFontSize,
            size: rowFontSize,
            font: regularFont,
            color: rgb(0, 0, 0),
        });

        y -= rowHeight;
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
        if (col.key === 'combined') value = 'TOTAL';
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
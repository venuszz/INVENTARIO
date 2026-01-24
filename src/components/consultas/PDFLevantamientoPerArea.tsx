import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';

interface Firma {
    concepto: string;
    nombre: string | null;
    puesto: string | null;
}

interface PDFOptions {
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
    fileName: string;
    firmas?: Firma[];
    valorTotal?: number;
}

interface Column {
    header: string;
    key?: string;
    width?: number;
    isComposite?: boolean;
    keys?: string[];
}

export const generatePDF = async ({ data, columns, title, fileName, firmas = [] }: PDFOptions) => {
    const pdfDoc = await PDFDocument.create();

    const ineaImageBytes = await fetch('/images/INEA NACIONAL.png').then(res => res.arrayBuffer());
    const iteaImageBytes = await fetch('/images/LOGO-ITEA.png').then(res => res.arrayBuffer());
    
    const ineaImage = await pdfDoc.embedPng(ineaImageBytes);
    const iteaImage = await pdfDoc.embedPng(iteaImageBytes);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const normalizeText = (text: string) => {
        return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    };

    const margin = 40;
    const pageWidth = 595;
    const pageHeight = 842;
    const minCellPadding = 2;
    const fontSize = 6;
    const headerFontSize = 8;
    const verticalPadding = 3;

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
                    while (i <= remainingWord.length && 
                            font.widthOfTextAtSize(remainingWord.slice(0, i), fontSize) <= maxWidth) {
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
        
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        
        return lines;
    };

    const calculateRowHeight = (row: Record<string, unknown>, columnWidths: number[]) => {
        let maxLines = 1;
        columns.forEach((col, index) => {
            let value = '';
            if (col.isComposite && col.keys) {
                value = col.keys.map(key => row[key]?.toString() || '').filter(Boolean).join(' / ');
            } else if (col.key === 'ubicacion_es') {
                value = [row['ubicacion_es'], row['ubicacion_mu'], row['ubicacion_no']]
                    .map(v => (v ?? '').toString().toUpperCase())
                    .filter(Boolean)
                    .join(' ');
            } else {
                value = col.key ? row[col.key]?.toString() || '' : '';
            }
            const availableWidth = columnWidths[index] - (2 * minCellPadding);
            const lines = wrapText(value, availableWidth, regularFont, fontSize);
            maxLines = Math.max(maxLines, lines.length);
        });
        return Math.max(25, (maxLines * (fontSize + 2)) + (2 * verticalPadding));
    };

    const centerTextInCell = (text: string, cellWidth: number, font: import('pdf-lib').PDFFont, fontSize: number) => {
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        return (cellWidth - textWidth) / 2;
    };

    const bienesPorOrigen: Record<string, Record<string, unknown>[]> = {};
    for (const row of data) {
        const origen = (row.origen as string)?.toUpperCase() || 'SIN ORIGEN';
        if (!bienesPorOrigen[origen]) bienesPorOrigen[origen] = [];
        bienesPorOrigen[origen].push(row);
    }

    const origenColors: Record<string, { bg: [number, number, number], text: [number, number, number] }> = {
        'INEA': { bg: [0.063, 0.157, 0.251], text: [1, 1, 1] },
        'ITEA': { bg: [0.075, 0.196, 0.102], text: [1, 1, 1] },
        'SIN ORIGEN': { bg: [0.5, 0.5, 0.5], text: [1, 1, 1] },
    };

    const numberColWidth = 40;
    const totalWidth = pageWidth - (2 * margin);
    const contentWidth = totalWidth - numberColWidth;
    const totalDefinedWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0);
    const scaleFactor = contentWidth / totalDefinedWidth;
    const adjustedWidths = columns.map(col => Math.floor((col.width || 0) * scaleFactor));
    let remainingWidth = contentWidth - adjustedWidths.reduce((sum, width) => sum + width, 0);
    while (remainingWidth > 0) {
        for (let i = 0; i < adjustedWidths.length && remainingWidth > 0; i++) {
            adjustedWidths[i]++;
            remainingWidth--;
        }
    }

    const wrapHeaderText = (text: string, colWidth: number) => wrapText(text, colWidth - 2 * minCellPadding, font, headerFontSize);
    const drawTableHeader = (page: import('pdf-lib').PDFPage, yPos: number, origen: string) => {
        const color = origenColors[origen] || origenColors['SIN ORIGEN'];
        let xPos = margin;
        page.drawRectangle({ x: xPos, y: yPos - 25, width: numberColWidth, height: 25, color: rgb(...color.bg) });
        const numberHeaderLines = wrapHeaderText('No.', numberColWidth);
        numberHeaderLines.forEach((line: string, idx: number) => {
            page.drawText(normalizeText(line), {
                x: xPos + centerTextInCell(line, numberColWidth, font, headerFontSize),
                y: yPos - 18 - (idx * (headerFontSize + 1)),
                size: headerFontSize,
                font: font,
                color: rgb(...color.text)
            });
        });
        xPos += numberColWidth;
        columns.forEach((col, idx) => {
            const colWidth = adjustedWidths[idx];
            page.drawRectangle({ x: xPos, y: yPos - 25, width: colWidth, height: 25, color: rgb(...color.bg) });
            const headerLines = wrapHeaderText(col.header, colWidth);
            headerLines.forEach((line: string, lineIdx: number) => {
                page.drawText(normalizeText(line), {
                    x: xPos + centerTextInCell(line, colWidth, font, headerFontSize),
                    y: yPos - 18 - (lineIdx * (headerFontSize + 1)),
                    size: headerFontSize,
                    font: font,
                    color: rgb(...color.text)
                });
            });
            xPos += colWidth;
        });
        return yPos - 25;
    };
    const drawTableRow = (page: import('pdf-lib').PDFPage, row: Record<string, unknown>, yPos: number, rowHeight: number, rowNumber: number) => {
        let xPos = margin;
        page.drawLine({ start: { x: margin, y: yPos }, end: { x: pageWidth - margin, y: yPos }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
        page.drawRectangle({ x: xPos, y: yPos - rowHeight, width: numberColWidth, height: rowHeight, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5, color: rgb(1, 1, 1), opacity: 0 });
        const numberText = rowNumber.toString();
        page.drawText(numberText, {
            x: xPos + centerTextInCell(numberText, numberColWidth, regularFont, fontSize),
            y: yPos - (rowHeight / 2) + (fontSize / 2),
            size: fontSize,
            font: regularFont,
            color: rgb(0.2, 0.2, 0.2)
        });
        xPos += numberColWidth;
        columns.forEach((col, idx) => {
            const colWidth = adjustedWidths[idx];
            page.drawRectangle({ x: xPos, y: yPos - rowHeight, width: colWidth, height: rowHeight, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5, color: rgb(1, 1, 1), opacity: 0 });
            let value = '';
            if (col.isComposite && col.keys) {
                value = col.keys.map(key => (row[key]?.toString() || '').toUpperCase()).filter(Boolean).join(' / ');
            } else if (col.key) {
                value = (row[col.key]?.toString() || '').toUpperCase();
            }
            const lines = wrapText(value, colWidth - (2 * minCellPadding), regularFont, fontSize);
            lines.forEach((line, lineIndex) => {
                const lineX = xPos + centerTextInCell(line.trim(), colWidth, regularFont, fontSize);
                const lineY = yPos - verticalPadding - (fontSize + 4) - (lineIndex * (fontSize + 2)) - ((rowHeight - (verticalPadding * 2) - ((lines.length * (fontSize + 2)))) / 2);
                page.drawText(normalizeText(line.trim()), {
                    x: lineX,
                    y: lineY,
                    size: fontSize,
                    font: regularFont,
                    color: rgb(0.2, 0.2, 0.2)
                });
            });
            xPos += colWidth;
        });
        return yPos - rowHeight;
    };
    const drawSignatureSection = (page: import('pdf-lib').PDFPage, yPosition: number) => {
        const signatureBoxWidth = (pageWidth - (2 * margin)) / 2;
        const signatureSectionY = yPosition - 80;
        const lineY = signatureSectionY + 40;
        const signatureFontSize = 8;
        const xLeft = margin;
        const xRight = margin + signatureBoxWidth;
        page.drawLine({
            start: { x: xLeft + 20, y: lineY },
            end: { x: xLeft + signatureBoxWidth - 20, y: lineY },
            thickness: 1,
            color: rgb(0, 0, 0),
        });
        page.drawText(normalizeText('NOMBRE Y FIRMA'), {
            x: xLeft + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize('NOMBRE Y FIRMA', signatureFontSize) / 2),
            y: lineY - 15,
            size: signatureFontSize,
            font: regularFont,
            color: rgb(0, 0, 0),
        });
        page.drawText(normalizeText('PERSONA QUE LEVANTA EL REPORTE'), {
            x: xLeft + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize('PERSONA QUE LEVANTA EL REPORTE', signatureFontSize) / 2),
            y: lineY - 30,
            size: signatureFontSize,
            font: regularFont,
            color: rgb(0, 0, 0),
        });
        if (firmas && firmas.length > 0) {
            const responsable = firmas.find(f => f.concepto === 'Responsable') || firmas[0];
            page.drawText(normalizeText('RESPONSABLE'), {
                x: xRight + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize('RESPONSABLE', signatureFontSize) / 2),
                y: lineY + 30,
                size: signatureFontSize,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
            page.drawLine({
                start: { x: xRight + 20, y: lineY },
                end: { x: xRight + signatureBoxWidth - 20, y: lineY },
                thickness: 1,
                color: rgb(0, 0, 0),
            });
            
            const nombreText = (responsable.nombre || 'SIN ASIGNAR').toUpperCase();
            const puestoText = (responsable.puesto || 'SIN ASIGNAR').toUpperCase();
            
            page.drawText(normalizeText(nombreText), {
                x: xRight + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(nombreText, signatureFontSize) / 2),
                y: lineY - 15,
                size: signatureFontSize,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
            page.drawText(normalizeText(puestoText), {
                x: xRight + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(puestoText, signatureFontSize) / 2),
                y: lineY - 30,
                size: signatureFontSize,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
        }
        return signatureSectionY;
    };

    let globalPageCount = 0;
    let globalIndex = 0;
    let currentPage: import('pdf-lib').PDFPage | null = null;
    let currentYPos: number = 0;
    const headerHeight = 25;
    const margenInferior = margin;
    const paginarPorAltura = (dataArr: Record<string, unknown>[]) => {
        const pages: Record<string, unknown>[][] = [];
        let idx = 0;
        let pageIndex = 0;
        while (idx < dataArr.length) {
            let yDisponible = pageHeight - margin - headerHeight - margenInferior;
            if (pageIndex === 0) yDisponible -= 180 - headerHeight;
            const pageRows: Record<string, unknown>[] = [];
            while (idx < dataArr.length) {
                const row = dataArr[idx];
                const rowHeight = calculateRowHeight(row, adjustedWidths);
                if (pageRows.length === 0 && rowHeight > yDisponible) {
                    pageRows.push(row);
                    idx++;
                    break;
                }
                if (rowHeight > yDisponible) break;
                pageRows.push(row);
                yDisponible -= rowHeight;
                idx++;
            }
            pages.push(pageRows);
            pageIndex++;
        }
        return pages;
    };

    const origenesList = Object.keys(bienesPorOrigen);
    // Obtener datos generales para el encabezado de la primera página
    const areaGeneral = (data[0]?.area || '').toString().toUpperCase();
    const directorGeneral = (data[0]?.usufinal || '').toString().toUpperCase();
    // Formatear la fecha como '1 de enero de 2025'
    const fechaActual = new Date();
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const fechaFormateada = `${fechaActual.getDate()} de ${meses[fechaActual.getMonth()]} de ${fechaActual.getFullYear()}`;
    const drawGeneralInfo = (page: import('pdf-lib').PDFPage, yPos: number) => {
        const infoFontSize = 8;
        const x = margin;
        // Bajamos más la sección de datos generales
        const y = yPos - 30; // antes era yPos, ahora bajamos 30 puntos más
        const lineSpacing = 13;
        const labelColor = rgb(0.2, 0.2, 0.2);
        const valueColor = rgb(0, 0, 0);
        const info = [
            { label: 'ÁREA:', value: areaGeneral },
            { label: 'DIRECTOR:', value: directorGeneral },
            { label: 'FECHA:', value: fechaFormateada },
            { label: 'FECHA DE EJECUCIÓN:', value: '' },
        ];
        info.forEach((item, idx) => {
            page.drawText(item.label, {
                x,
                y: y - (idx * lineSpacing),
                size: infoFontSize,
                font: regularFont,
                color: labelColor,
            });
            page.drawText(item.value, {
                x: x + 70,
                y: y - (idx * lineSpacing),
                size: infoFontSize,
                font: regularFont,
                color: valueColor,
            });
        });
        return y - (info.length * lineSpacing);
    };
    let headerDrawnOnPage = false; // Global para la página
    for (let o = 0; o < origenesList.length; o++) {
        const origen = origenesList[o];
        const color = origenColors[origen] || origenColors['SIN ORIGEN'];
        const articulos = bienesPorOrigen[origen];
        const paginadas = paginarPorAltura(articulos);
        for (let currentPageIndex = 0; currentPageIndex < paginadas.length; currentPageIndex++) {
            const pageData = paginadas[currentPageIndex];
            const isFirstPageOfOrigen = currentPageIndex === 0;
            if (!currentPage || currentYPos < 120) {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                currentYPos = pageHeight - margin;
                headerDrawnOnPage = false;
                if (globalPageCount === 0) {
                    // Logos y títulos generales
                    const ineaAspectRatio = ineaImage.width / ineaImage.height;
                    const iteaAspectRatio = iteaImage.width / iteaImage.height;
                    const maxImageHeight = 28;
                    const ineaHeight = maxImageHeight;
                    const iteaHeight = 35; // Aumentado de 28 a 35
                    const ineaWidth = ineaHeight * ineaAspectRatio;
                    const iteaWidth = iteaHeight * iteaAspectRatio;
                    if (currentPage) {
                        currentPage.drawImage(ineaImage, { x: margin, y: currentYPos - ineaHeight, width: ineaWidth, height: ineaHeight });
                        currentPage.drawImage(iteaImage, { x: pageWidth - margin - iteaWidth, y: currentYPos - iteaHeight, width: iteaWidth, height: iteaHeight });
                        const titles = [
                            'INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS',
                            'DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS',
                            'OFICINA DE RECURSOS MATERIALES',
                            title.toUpperCase()
                        ];
                        titles.forEach((text, index) => {
                            const textWidth = font.widthOfTextAtSize(text, 9);
                            const xPos = (pageWidth - textWidth) / 2;
                            if (currentPage) {
                                currentPage.drawText(normalizeText(text), {
                                    x: xPos,
                                    y: currentYPos - (index * 12),
                                    size: 9,
                                    font: font,
                                    color: rgb(0, 0, 0)
                                });
                            }
                        });
                        // Dibujar datos generales en la esquina superior izquierda
                        currentYPos -= 50;
                        currentYPos = drawGeneralInfo(currentPage, currentYPos + 10); // +10 para dejar espacio tras los títulos
                    }
                }
            }
            // Encabezado de ORIGEN solo en la primera página del origen
            if (isFirstPageOfOrigen) {
                const origenTitle = `ORIGEN: ${origen}`;
                const titleWidth = font.widthOfTextAtSize(origenTitle, 10);
                currentYPos -= 10;
                currentPage.drawRectangle({ x: margin, y: currentYPos - 20, width: pageWidth - 2 * margin, height: 20, color: rgb(...color.bg) });
                currentPage.drawText(origenTitle, { x: (pageWidth - titleWidth) / 2, y: currentYPos - 15, size: 10, font: font, color: rgb(...color.text) });
                currentYPos -= 25;
            }
            // Encabezado de columnas solo si no se ha dibujado en esta página
            if (!headerDrawnOnPage) {
                currentYPos = drawTableHeader(currentPage, currentYPos, origen);
                headerDrawnOnPage = true;
            }
            for (let i = 0; i < pageData.length; i++) {
                const row = pageData[i];
                const rowHeight = calculateRowHeight(row, adjustedWidths);
                if (currentYPos - rowHeight < 80) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    currentYPos = pageHeight - margin;
                    headerDrawnOnPage = false;
                }
                // Encabezado de columnas solo si no se ha dibujado en esta página
                if (!headerDrawnOnPage) {
                    currentYPos = drawTableHeader(currentPage, currentYPos, origen);
                    headerDrawnOnPage = true;
                }
                currentYPos = drawTableRow(currentPage, row, currentYPos, rowHeight, globalIndex + i + 1);
            }
            globalIndex += pageData.length;
            globalPageCount++;
            const pageText = `PÁGINA ${globalPageCount}`;
            const pageTextWidth = regularFont.widthOfTextAtSize(pageText, 10);
            currentPage.drawText(normalizeText(pageText), {
                x: pageWidth - margin - pageTextWidth,
                y: margin - 20,
                size: 10,
                font: regularFont,
                color: rgb(0.6, 0.6, 0.6)
            });
        }
    }
    if (currentPage && firmas.length > 0) {
        const signatureBoxHeight = 100;
        const minYForSignatures = margin + signatureBoxHeight + 10;
        if (currentYPos > minYForSignatures) {
            drawSignatureSection(currentPage, signatureBoxHeight + margin);
        } else {
            const signaturePage = pdfDoc.addPage([pageWidth, pageHeight]);
            drawSignatureSection(signaturePage, signatureBoxHeight + margin);
            const pageText = `PÁGINA ${globalPageCount + 1}`;
            const pageTextWidth = regularFont.widthOfTextAtSize(pageText, 10);
            signaturePage.drawText(normalizeText(pageText), {
                x: pageWidth - margin - pageTextWidth,
                y: margin - 20,
                size: 10,
                font: regularFont,
                color: rgb(0.6, 0.6, 0.6)
            });
        }
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    saveAs(blob, `${fileName}.pdf`);
};
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';

interface Firma {
    concepto: string;
    nombre: string;
    puesto: string;
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
    const fontSize = 6; // antes 7
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

    const numberColWidth = 30;
    const availableTableWidth = pageWidth - 2 * margin - numberColWidth;
    const adjustedWidths = columns.map(() => availableTableWidth / columns.length);

    const wrapHeaderText = (text: string, colWidth: number) => {
        return wrapText(text, colWidth - 2 * minCellPadding, font, headerFontSize);
    };

    const encabezadoCompleto = 180;
    const headerHeight = 25;
    const margenInferior = margin;

    const paginarPorAltura = (dataArr: Record<string, unknown>[]) => {
        const pages: Record<string, unknown>[][] = [];
        let idx = 0;
        let pageIndex = 0;
        while (idx < dataArr.length) {
            let yDisponible = pageHeight - margin - headerHeight - margenInferior;
            if (pageIndex === 0) yDisponible -= (encabezadoCompleto - headerHeight);
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

    const drawHeaders = (page: import('pdf-lib').PDFPage, startY: number) => {
        let xPos = margin;
        const currentY = startY;

        page.drawRectangle({
            x: xPos,
            y: currentY - 25,
            width: numberColWidth,
            height: 25,
            color: rgb(0.9, 0.9, 0.9),
        });

        const numberHeaderLines = wrapHeaderText('No.', numberColWidth);
        numberHeaderLines.forEach((line, idx) => {
            page.drawText(normalizeText(line), {
                x: xPos + centerTextInCell(line, numberColWidth, font, headerFontSize),
                y: currentY - 18 - (idx * (headerFontSize + 1)),
                size: headerFontSize,
                font: font,
                color: rgb(0.2, 0.2, 0.2)
            });
        });

        xPos += numberColWidth;

        columns.forEach((col, idx) => {
            const colWidth = adjustedWidths[idx];
            page.drawRectangle({
                x: xPos,
                y: currentY - 25,
                width: colWidth,
                height: 25,
                color: rgb(0.9, 0.9, 0.9),
            });

            const headerLines = wrapHeaderText(col.header, colWidth);
            headerLines.forEach((line, lineIdx) => {
                page.drawText(normalizeText(line), {
                    x: xPos + centerTextInCell(line, colWidth, font, headerFontSize),
                    y: currentY - 18 - (lineIdx * (headerFontSize + 1)),
                    size: headerFontSize,
                    font: font,
                    color: rgb(0.2, 0.2, 0.2)
                });
            });

            xPos += colWidth;
        });

        return currentY - 25;
    };

    const processPage = async (pageData: Record<string, unknown>[], pageIndex: number, totalPages: number, globalStartIndex: number) => {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const { height } = page.getSize();
        let yPos = height - margin;

        const fontTitleSize = 8;
        const fontSubtitleSize = 7;
        const maxImageHeight = 28;

        if (pageIndex === 0) {
            const ineaAspectRatio = ineaImage.width / ineaImage.height;
            const iteaAspectRatio = iteaImage.width / iteaImage.height;
            const ineaHeight = maxImageHeight;
            const iteaHeight = maxImageHeight;
            const ineaWidth = ineaHeight * ineaAspectRatio;
            const iteaWidth = iteaHeight * iteaAspectRatio;
            page.drawImage(ineaImage, {
                x: margin,
                y: yPos - maxImageHeight,
                width: ineaWidth,
                height: ineaHeight,
            });
            page.drawImage(iteaImage, {
                x: pageWidth - margin - iteaWidth,
                y: yPos - maxImageHeight,
                width: iteaWidth,
                height: iteaHeight,
            });

            const titles = [
                'INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS',
                'DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS',
                'OFICINA DE RECURSOS MATERIALES',
                title.toUpperCase()
            ];

            titles.forEach((text, index) => {
                const textWidth = font.widthOfTextAtSize(text, fontTitleSize);
                const xPos = (pageWidth - textWidth) / 2;
                page.drawText(normalizeText(text), {
                    x: xPos,
                    y: yPos - (index * 12),
                    size: fontTitleSize,
                    font: font,
                    color: rgb(0, 0, 0)
                });
            });

            yPos -= 48;

            const directoraFirma = firmas[firmas.length - 1];
            const fecha = new Date();
            const dia = fecha.getDate();
            const mes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fecha);
            const año = fecha.getFullYear();
            const currentDate = `${dia} de ${mes} de ${año}`;

            const infoLines = [
                `NOMBRE: ${directoraFirma.nombre.toUpperCase()}`,
                'ADSCRIPCIÓN: DIRECCIÓN GENERAL',
                `CARGO: ${directoraFirma.puesto.toUpperCase()}`,
                `FECHA: ${currentDate.toUpperCase()}`
            ];

            infoLines.forEach((line, index) => {
                page.drawText(normalizeText(line), {
                    x: margin,
                    y: yPos - (index * 12),
                    size: fontSubtitleSize,
                    font: regularFont,
                    color: rgb(0, 0, 0)
                });
            });

            const minTableY = yPos - (infoLines.length * 12) - 40; // margen extra mayor
            const tableYPos = Math.max(pageHeight - 140, minTableY); // baja más la tabla
            yPos = await drawHeaders(page, tableYPos);
        } else {
            yPos = height - margin - 5; // solo 5 de margen superior
        }

        for (let i = 0; i < pageData.length; i++) {
            const row = pageData[i];
            const rowHeight = calculateRowHeight(row, adjustedWidths);
            let xPos = margin;

            page.drawLine({
                start: { x: margin, y: yPos },
                end: { x: pageWidth - margin, y: yPos },
                thickness: 0.5,
                color: rgb(0.7, 0.7, 0.7),
            });

            const numberText = (globalStartIndex + i + 1).toString();
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
                if (col.key === 'ubicacion_es') {
                    const value = [row['ubicacion_es'], row['ubicacion_mu'], row['ubicacion_no']]
                        .map(v => (v ?? '').toString().toUpperCase())
                        .filter(Boolean)
                        .join(' ');

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
                } else if (col.isComposite && col.keys) {
                    const combinedValue = col.keys
                        .map(key => (row[key]?.toString() || '').toUpperCase())
                        .filter(Boolean)
                        .join(' / ');

                    const lines = wrapText(combinedValue, colWidth - (2 * minCellPadding), regularFont, fontSize);
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
                } else if (col.key) {
                    const value = (row[col.key]?.toString() || '').toUpperCase();

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
                }

                xPos += colWidth;
            });

            yPos -= rowHeight;
        }

        const pageText = `PÁGINA ${pageIndex + 1} DE ${totalPages}`;
        const pageTextWidth = regularFont.widthOfTextAtSize(pageText, 10);
        
        page.drawText(normalizeText(pageText), {
            x: pageWidth - margin - pageTextWidth,
            y: margin - 20,
            size: 10,
            font: regularFont,
            color: rgb(0.6, 0.6, 0.6)
        });

        return yPos;
    };

    const drawSignatureSection = (page: import('pdf-lib').PDFPage, yPosition: number) => {
        const signatureBoxWidth = (pageWidth - (2 * margin)) / 3;
        const signatureSectionY = yPosition - 100;
        const lineY = signatureSectionY + 40;
        const signatureFontSize = 6;

        firmas.forEach((firma, index) => {
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
                thickness: 1,
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

        return signatureSectionY;
    };

    const paginadas = paginarPorAltura(data);
    const totalPages = paginadas.length;
    let globalIndex = 0;
    for (let currentPage = 0; currentPage < paginadas.length; currentPage++) {
        const pageData = paginadas[currentPage];
        const yPos = await processPage(pageData, currentPage, totalPages, globalIndex);
        if (currentPage === paginadas.length - 1 && firmas.length > 0) {
            const page = pdfDoc.getPages()[currentPage];
            const signatureBoxHeight = 100;
            const minYForSignatures = margin + signatureBoxHeight + 10; // 10 de margen extra
            // Si la tabla deja suficiente espacio al pie, dibujar firmas al pie
            if (yPos > minYForSignatures) {
                drawSignatureSection(page, signatureBoxHeight + margin);
            } else {
                // Si no hay espacio suficiente, crear nueva página solo para firmas
                const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
                drawSignatureSection(newPage, signatureBoxHeight + margin);
                // Número de página
                const pageText = `PÁGINA ${totalPages + 1} DE ${totalPages + 1}`;
                const pageTextWidth = regularFont.widthOfTextAtSize(pageText, 10);
                newPage.drawText(normalizeText(pageText), {
                    x: pageWidth - margin - pageTextWidth,
                    y: margin - 20,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.6, 0.6, 0.6)
                });
            }
        }
        globalIndex += pageData.length;
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, `${fileName}.pdf`);
};
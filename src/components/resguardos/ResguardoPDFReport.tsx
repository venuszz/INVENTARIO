import React from 'react';
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { saveAs } from 'file-saver';

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
};

interface PdfArticulo {
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    estado: string | null;
    origen?: string | null;
    resguardante?: string | null;
}

interface PdfFirma {
    cargo: string;
    nombre: string;
    firma?: string;
    concepto: string;
    puesto: string;
}

interface PdfData {
    folio: string;
    fecha: string;
    director: string | undefined;
    area: string;
    puesto: string;
    resguardante: string;
    articulos: PdfArticulo[];
    firmas?: PdfFirma[];
    usufinal?: string;
    usufinalPuesto?: string;
}

interface Column {
    header: string;
    key?: string;
    width?: number;
    isComposite?: boolean;
    keys?: string[];
}

export async function generateResguardoPDF(data: PdfData) {
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
    const minCellPadding = 2;
    const fontSize = 8;
    const headerFontSize = 9;
    const verticalPadding = 4;

    const origenColors: Record<string, { bg: [number, number, number], text: [number, number, number] }> = {
        'INEA': { bg: [0.063, 0.157, 0.251], text: [1, 1, 1] },
        'ITEA': { bg: [0.075, 0.196, 0.102], text: [1, 1, 1] },
        'SIN ORIGEN': { bg: [0.5, 0.5, 0.5], text: [1, 1, 1] },
    };

    const wrapText = (text: string, maxWidth: number, font: PDFFont, fontSize: number) => {
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
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        return lines;
    };

    const calculateRowHeight = (row: Record<string, unknown>, columnWidths: number[], columns: Column[]) => {
        let maxLines = 1;
        columns.forEach((col: Column, index: number) => {
            let value = '';
            if (col.isComposite && col.keys) {
                value = col.keys.map((key: string) => row[key]?.toString() || '').filter(Boolean).join(' / ');
            } else {
                value = col.key ? row[col.key]?.toString() || '' : '';
            }
            const availableWidth = columnWidths[index] - (2 * minCellPadding);
            const lines = wrapText(value, availableWidth, regularFont, fontSize);
            maxLines = Math.max(maxLines, lines.length);
        });
        return Math.max(25, (maxLines * (fontSize + 2)) + (2 * verticalPadding));
    };

    const centerTextInCell = (text: string, cellWidth: number, font: PDFFont, fontSize: number) => {
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        return (cellWidth - textWidth) / 2;
    };

    const showResguardanteColumn = data.articulos.some(a => a.resguardante);
    const columns: Column[] = [
        { header: 'No. Inventario', key: 'id_inv', width: 80 },
        { header: 'Descripción', key: 'descripcion', width: 200 },
        { header: 'Rubro', key: 'rubro', width: 100 },
        { header: 'Condición', key: 'estado', width: 70 },
    ];
    if (showResguardanteColumn) {
        columns.push({ header: 'Resguardante', key: 'resguardante', width: 120 });
    }

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

    // Agrupar artículos por origen
    const articulosPorOrigen: Record<string, PdfArticulo[]> = {};
    for (const articulo of data.articulos) {
        const origen = articulo.origen || 'SIN ORIGEN';
        if (!articulosPorOrigen[origen]) articulosPorOrigen[origen] = [];
        articulosPorOrigen[origen].push(articulo);
    }

    const defaultFirmas: PdfFirma[] = [
        {
            concepto: 'Autoriza',
            cargo: 'Autoriza',
            nombre: 'Por asignar',
            puesto: 'DIRECTOR(A) ADMIN. Y FINANZAS'
        },
        {
            concepto: 'Conocimiento',
            cargo: 'Conocimiento',
            nombre: 'Por asignar',
            puesto: 'DIRECTOR(A) RECURSOS MATERIALES'
        },
        {
            concepto: 'Responsable',
            cargo: 'Responsable',
            nombre: data.director || '',
            puesto: data.puesto || ''
        }
    ];
    const firmas = data.firmas?.length ? data.firmas : defaultFirmas;

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
                const rowHeight = calculateRowHeight(row, adjustedWidths, columns);
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

    const wrapHeaderText = (text: string, colWidth: number) => {
        return wrapText(text, colWidth - 2 * minCellPadding, font, headerFontSize);
    };

    const drawTableHeader = (page: PDFPage, yPos: number, origen: string, isFirstPage: boolean) => {
        if (!isFirstPage) return yPos;

        const color = origenColors[origen] || origenColors['SIN ORIGEN'];
        let xPos = margin;

        page.drawRectangle({
            x: xPos,
            y: yPos - headerHeight,
            width: numberColWidth,
            height: headerHeight,
            color: rgb(...color.bg),
        });
        const numberHeaderLines = wrapHeaderText('No.', numberColWidth);
        numberHeaderLines.forEach((line, idx) => {
            page.drawText(normalizeText(line), {
                x: xPos + centerTextInCell(line, numberColWidth, font, headerFontSize),
                y: yPos - 18 - (idx * (headerFontSize + 1)),
                size: headerFontSize,
                font: font,
                color: rgb(...color.text)
            });
        });
        xPos += numberColWidth;

        columns.forEach((col: Column, idx: number) => {
            const colWidth = adjustedWidths[idx];
            page.drawRectangle({
                x: xPos,
                y: yPos - headerHeight,
                width: colWidth,
                height: headerHeight,
                color: rgb(...color.bg),
            });
            const headerLines = wrapHeaderText(col.header, colWidth);
            headerLines.forEach((line, lineIdx) => {
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

        return yPos - headerHeight;
    };

    const drawTableRow = (page: PDFPage, row: Record<string, unknown>, yPos: number, rowHeight: number, rowNumber: number) => {
        let xPos = margin;

        page.drawLine({
            start: { x: margin, y: yPos },
            end: { x: pageWidth - margin, y: yPos },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
        });

        page.drawRectangle({
            x: xPos,
            y: yPos - rowHeight,
            width: numberColWidth,
            height: rowHeight,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 0.5,
            color: rgb(1, 1, 1),
            opacity: 0
        });
        const numberText = rowNumber.toString();
        page.drawText(numberText, {
            x: xPos + centerTextInCell(numberText, numberColWidth, regularFont, fontSize),
            y: yPos - (rowHeight / 2) + (fontSize / 2),
            size: fontSize,
            font: regularFont,
            color: rgb(0.2, 0.2, 0.2)
        });
        xPos += numberColWidth;

        columns.forEach((col: Column, idx: number) => {
            const colWidth = adjustedWidths[idx];
            page.drawRectangle({
                x: xPos,
                y: yPos - rowHeight,
                width: colWidth,
                height: rowHeight,
                borderColor: rgb(0.7, 0.7, 0.7),
                borderWidth: 0.5,
                color: rgb(1, 1, 1),
                opacity: 0
            });

            let value = '';
            if (col.isComposite && col.keys) {
                value = col.keys.map((key: string) => (row[key]?.toString() || '').toUpperCase()).filter(Boolean).join(' / ');
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

    const drawHeaderContent = (page: PDFPage, yPos: number) => {
        const ineaAspectRatio = ineaImage.width / ineaImage.height;
        const iteaAspectRatio = iteaImage.width / iteaImage.height;
        const maxImageHeight = 28;
        const ineaHeight = maxImageHeight;
        const iteaHeight = maxImageHeight;
        const ineaWidth = ineaHeight * ineaAspectRatio;
        const iteaWidth = iteaHeight * iteaAspectRatio;

        page.drawImage(ineaImage, {
            x: margin,
            y: yPos - ineaHeight,
            width: ineaWidth,
            height: ineaHeight,
        });
        page.drawImage(iteaImage, {
            x: pageWidth - margin - iteaWidth,
            y: yPos - iteaHeight,
            width: iteaWidth,
            height: iteaHeight,
        });

        const titles = [
            'INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS',
            'DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS',
            'OFICINA DE RECURSOS MATERIALES',
            'RESGUARDO DE BIENES MUEBLES'
        ];
        titles.forEach((text, index) => {
            const textWidth = font.widthOfTextAtSize(text, 9);
            const xPos = (pageWidth - textWidth) / 2;
            page.drawText(normalizeText(text), {
                x: xPos,
                y: yPos - (index * 12),
                size: 9,
                font: font,
                color: rgb(0, 0, 0)
            });
        });
        yPos -= 50;

        const infoLines = [
            `FOLIO:  ${data.folio}`,
            `DIRECTOR:  ${data.director || ''}`,
            `ÁREA:  ${data.area}`,
            `PUESTO:  ${data.puesto}`,
            `FECHA:  ${data.fecha}`
        ];
        if (!data.articulos.some(a => a.resguardante)) {
            infoLines.push(`RESGUARDANTE: ${data.resguardante || ''}`);
        }
        infoLines.forEach((line, index) => {
            page.drawText(normalizeText(line), {
                x: margin,
                y: yPos - (index * 12),
                size: 8,
                font: regularFont,
                color: rgb(0, 0, 0)
            });
        });

        return yPos - (infoLines.length * 12) - 15;
    };

    const drawSignatureSection = (page: PDFPage, yPosition: number) => {
        const signatureCount = Math.min(2, firmas.length);
        const signatureBoxWidth = (pageWidth - (2 * margin)) / (signatureCount + 1);
        const signatureSectionY = yPosition - 100;
        const lineY = signatureSectionY + 40;
        const signatureFontSize = 8;

        for (let i = 0; i < signatureCount; i++) {
            const firma = firmas[i];
            const xPos = margin + (i * signatureBoxWidth);

            page.drawText(normalizeText(firma.concepto?.toUpperCase() || ''), {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.concepto?.toUpperCase() || '', signatureFontSize) / 2),
                y: lineY + 30,
                size: signatureFontSize,
                font: font,
                color: rgb(0, 0, 0)
            });

            page.drawLine({
                start: { x: xPos + 20, y: lineY },
                end: { x: xPos + signatureBoxWidth - 20, y: lineY },
                thickness: 1,
                color: rgb(0, 0, 0),
            });

            page.drawText(normalizeText(firma.nombre?.toUpperCase() || ''), {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.nombre?.toUpperCase() || '', signatureFontSize) / 2),
                y: lineY - 15,
                size: signatureFontSize,
                font: regularFont,
                color: rgb(0, 0, 0)
            });

            page.drawText(normalizeText(firma.puesto?.toUpperCase() || ''), {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.puesto?.toUpperCase() || '', signatureFontSize) / 2),
                y: lineY - 30,
                size: signatureFontSize,
                font: regularFont,
                color: rgb(0, 0, 0)
            });
        }

        // Última firma (RESGUARDANTE) igual que antes
        const xPos = margin + (signatureCount) * signatureBoxWidth;
        page.drawText('RESGUARDANTE', {
            x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize('RESGUARDANTE', signatureFontSize) / 2),
            y: lineY + 30,
            size: signatureFontSize,
            font: font,
            color: rgb(0, 0, 0)
        });
        page.drawLine({
            start: { x: xPos + 20, y: lineY },
            end: { x: xPos + signatureBoxWidth - 20, y: lineY },
            thickness: 1,
            color: rgb(0, 0, 0),
        });
        page.drawText(normalizeText(data.director?.toUpperCase() || ''), {
            x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(data.director?.toUpperCase() || '', signatureFontSize) / 2),
            y: lineY - 15,
            size: signatureFontSize,
            font: regularFont,
            color: rgb(0, 0, 0)
        });
        const puestoArea = `${data.puesto?.toUpperCase() || ''} DE ${data.area?.toUpperCase() || ''}`;
        page.drawText(normalizeText(puestoArea), {
            x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(puestoArea, signatureFontSize) / 2),
            y: lineY - 30,
            size: signatureFontSize,
            font: regularFont,
            color: rgb(0, 0, 0)
        });

        return signatureSectionY;
    };

    let globalPageCount = 0;
    let globalIndex = 0;
    const origenes = Object.keys(articulosPorOrigen);
    let currentPage: PDFPage | null = null;
    let currentYPos: number = 0;

    for (let o = 0; o < origenes.length; o++) {
        const origen = origenes[o];
        const color = origenColors[origen] || origenColors['SIN ORIGEN'];
        const articulos = articulosPorOrigen[origen].map((a) => ({
            id_inv: a.id_inv || '',
            descripcion: a.descripcion || '',
            rubro: a.rubro || '',
            estado: a.estado || '',
            resguardante: a.resguardante || data.resguardante || '',
        }));

        const paginadas = paginarPorAltura(articulos);

        for (let currentPageIndex = 0; currentPageIndex < paginadas.length; currentPageIndex++) {
            const pageData = paginadas[currentPageIndex];

            if (!currentPage || currentYPos < 120) {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                currentYPos = pageHeight - margin;
                if (globalPageCount === 0) {
                    currentYPos = drawHeaderContent(currentPage, currentYPos);
                }
            }

            // Mostrar título de origen para todos los orígenes en su primera página
            if (currentPageIndex === 0) {
                const origenTitle = `ORIGEN: ${origen}`;
                const titleWidth = font.widthOfTextAtSize(origenTitle, 10);

                currentYPos -= 10;
                currentPage.drawRectangle({
                    x: margin,
                    y: currentYPos - 20,
                    width: pageWidth - 2 * margin,
                    height: 20,
                    color: rgb(...color.bg),
                });
                currentPage.drawText(origenTitle, {
                    x: (pageWidth - titleWidth) / 2,
                    y: currentYPos - 15,
                    size: 10,
                    font: font,
                    color: rgb(...color.text)
                });
                currentYPos -= 25;
            }

            currentYPos = drawTableHeader(currentPage, currentYPos, origen, currentPageIndex === 0);

            for (let i = 0; i < pageData.length; i++) {
                const row = pageData[i];
                const rowHeight = calculateRowHeight(row, adjustedWidths, columns);

                if (currentYPos - rowHeight < 80) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    currentYPos = pageHeight - margin;
                    globalPageCount++;
                    currentYPos = drawTableHeader(currentPage, currentYPos, origen, true);
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

            if (o < origenes.length - 1 && currentPageIndex === paginadas.length - 1) {
                currentYPos -= 15;
            }
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
    saveAs(blob, `resguardo_${data.folio}.pdf`);
}

interface ResguardoPDFReportProps {
    data: PdfData;
    onClose?: () => void;
}

const ResguardoPDFReport: React.FC<ResguardoPDFReportProps> = ({ data }) => {
    React.useEffect(() => {
        const generatePDF = async () => {
            try {
                await generateResguardoPDF(data);
            } catch (error) {
                console.error('Error generating PDF:', error);
            }
        };

        generatePDF();
    }, [data]);

    return null;
};

export default ResguardoPDFReport;
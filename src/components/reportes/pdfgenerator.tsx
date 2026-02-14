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
    valorTotal?: number; // Agregamos el valor total calculado
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

    // Cargar y embedear las imágenes
    const ineaImageBytes = await fetch('/images/INEA NACIONAL.png').then(res => res.arrayBuffer());
    const iteaImageBytes = await fetch('/images/LOGO-ITEA.png').then(res => res.arrayBuffer());

    const ineaImage = await pdfDoc.embedPng(ineaImageBytes);
    const iteaImage = await pdfDoc.embedPng(iteaImageBytes);

    // Configuración de página y fuentes
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Función para normalizar texto (convertir caracteres acentuados a su versión UTF-16)
    const normalizeText = (text: string) => {
        return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    };

    // Configuración de tabla
    const margin = 40;
    const pageWidth = 842;
    const pageHeight = 595;
    const minCellPadding = 2;
    const fontSize = 6; // Increased table content font size from 4 to 6
    const headerFontSize = 7; // Increased header font size from 5 to 7
    const verticalPadding = 3;

    // Función para sanitizar texto y remover caracteres no soportados por WinAnsi
    const sanitizeText = (text: string): string => {
        if (!text) return '';
        // Reemplazar caracteres especiales comunes que no están en WinAnsi
        return text
            // Primero remover caracteres de control problemáticos (newlines, carriage returns, tabs)
            .replace(/\r\n/g, ' ')  // Windows line endings
            .replace(/\r/g, ' ')    // Mac line endings
            .replace(/\n/g, ' ')    // Unix line endings
            .replace(/\t/g, ' ')    // Tabs
            .replace(/\v/g, ' ')    // Vertical tabs
            .replace(/\f/g, ' ')    // Form feeds
            // Reemplazar múltiples espacios con uno solo
            .replace(/\s+/g, ' ')
            .replace(/Ω/g, 'Ohm')
            .replace(/μ/g, 'u')
            .replace(/α/g, 'alpha')
            .replace(/β/g, 'beta')
            .replace(/γ/g, 'gamma')
            .replace(/δ/g, 'delta')
            .replace(/π/g, 'pi')
            .replace(/Σ/g, 'Sigma')
            .replace(/θ/g, 'theta')
            .replace(/λ/g, 'lambda')
            .replace(/φ/g, 'phi')
            .replace(/ψ/g, 'psi')
            .replace(/€/g, 'EUR')
            .replace(/£/g, 'GBP')
            .replace(/¥/g, 'YEN')
            .replace(/©/g, '(c)')
            .replace(/®/g, '(R)')
            .replace(/™/g, '(TM)')
            .replace(/°/g, ' grados')
            .replace(/±/g, '+/-')
            .replace(/×/g, 'x')
            .replace(/÷/g, '/')
            .replace(/≤/g, '<=')
            .replace(/≥/g, '>=')
            .replace(/≠/g, '!=')
            .replace(/≈/g, '~')
            .replace(/∞/g, 'infinito')
            .replace(/√/g, 'raiz')
            .replace(/∑/g, 'suma')
            .replace(/∫/g, 'integral')
            .replace(/∂/g, 'd')
            .replace(/∆/g, 'Delta')
            .replace(/∏/g, 'Pi')
            .replace(/∈/g, 'en')
            .replace(/∉/g, 'no en')
            .replace(/∅/g, 'vacio')
            .replace(/∩/g, 'interseccion')
            .replace(/∪/g, 'union')
            .replace(/⊂/g, 'subconjunto')
            .replace(/⊃/g, 'superconjunto')
            .replace(/⊆/g, 'subconjunto o igual')
            .replace(/⊇/g, 'superconjunto o igual')
            // Remover cualquier otro carácter no ASCII que pueda causar problemas
            .replace(/[^\x00-\xFF]/g, '?')
            // Trim espacios al inicio y final
            .trim();
    };

    // Función para dividir texto en líneas, incluyendo palabras largas
    const wrapText = (text: string, maxWidth: number, font: import('pdf-lib').PDFFont, fontSize: number) => {
        // Sanitizar el texto antes de procesarlo
        const sanitizedText = sanitizeText(text);
        const words = sanitizedText.toString().split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            // Si la palabra es más larga que el ancho máximo, dividirla en partes
            if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
                if (currentLine !== '') {
                    lines.push(currentLine);
                    currentLine = '';
                }

                let remainingWord = word;
                while (remainingWord !== '') {
                    let i = 1;
                    // Encontrar la porción más larga que cabe en el ancho
                    while (i <= remainingWord.length &&
                        font.widthOfTextAtSize(remainingWord.slice(0, i), fontSize) <= maxWidth) {
                        i++;
                    }
                    i--; // Retroceder al último carácter que cabía

                    if (i === 0) i = 1; // Asegurar que al menos un carácter se incluya

                    lines.push(remainingWord.slice(0, i));
                    remainingWord = remainingWord.slice(i);
                }
                continue;
            }

            // Manejo normal de palabras que caben en el ancho
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

    // Función para calcular altura necesaria para el contenido
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
        // Agregar padding vertical adicional arriba y abajo
        return Math.max(25, (maxLines * (fontSize + 2)) + (2 * verticalPadding));
    };

    // Función para centrar texto en una celda
    const centerTextInCell = (text: string, cellWidth: number, font: import('pdf-lib').PDFFont, fontSize: number) => {
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        return (cellWidth - textWidth) / 2;
    };

    // --- Ajuste automático de anchos de columna para que no se salgan de la hoja ---
    const numberColWidth = 30;
    const availableTableWidth = pageWidth - 2 * margin - numberColWidth;
    const originalWidths = columns.map(col => col.width ?? 80);
    const totalOriginalWidth = originalWidths.reduce((a, b) => a + b, 0);
    let adjustedWidths = [...originalWidths];
    if (totalOriginalWidth > availableTableWidth) {
        adjustedWidths = originalWidths.map(w => (w / totalOriginalWidth) * availableTableWidth);
    }

    // --- Helper para wrap de encabezados de columna ---
    const wrapHeaderText = (text: string, colWidth: number) => {
        // Usa el mismo wrapText pero con fuente de encabezado
        return wrapText(text, colWidth - 2 * minCellPadding, font, headerFontSize);
    };

    // --- Optimización: aprovechar mejor el espacio vertical en cada página ---
    const encabezadoCompleto = 180; // Altura del encabezado institucional y datos (solo en la primera página)
    const headerHeight = 25; // Altura del encabezado de la tabla
    const margenInferior = margin; // Ya definido

    // Calcula cuántas filas caben en cada página según el contenido y el espacio realmente disponible
    const paginarPorAltura = (dataArr: Record<string, unknown>[]) => {
        const pages: Record<string, unknown>[][] = [];
        let idx = 0;
        let pageIndex = 0;
        while (idx < dataArr.length) {
            let yDisponible = pageHeight - margin - headerHeight - margenInferior;
            if (pageIndex === 0) yDisponible -= (encabezadoCompleto - headerHeight); // Solo en la primera página se descuenta el encabezado completo
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

    // Función para dibujar el encabezado de las columnas
    const drawHeaders = (page: import('pdf-lib').PDFPage, startY: number) => {
        let xPos = margin;
        const currentY = startY;

        // Agregar encabezado para la columna de numeración
        page.drawRectangle({
            x: xPos,
            y: currentY - 25,
            width: numberColWidth,
            height: 25,
            color: rgb(0.9, 0.9, 0.9),
        });

        // Wrap para el encabezado de la columna de numeración
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

            // Wrap para encabezado
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

    // Modificar processPage para numeración global y usar anchos ajustados
    const processPage = async (pageData: Record<string, unknown>[], pageIndex: number, totalPages: number, globalStartIndex: number) => {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const { height } = page.getSize();
        let yPos = height - margin;

        // Solo dibujar el título, imágenes e información adicional en la primera página
        if (pageIndex === 0) {
            // Calcular dimensiones para las imágenes (altura máxima de 50 puntos)
            const maxImageHeight = 50;
            const ineaAspectRatio = ineaImage.width / ineaImage.height;
            const iteaAspectRatio = iteaImage.width / iteaImage.height;

            const ineaHeight = maxImageHeight;
            const iteaHeight = maxImageHeight; // Mismo tamaño que el logo izquierdo
            const ineaWidth = ineaHeight * ineaAspectRatio;
            const iteaWidth = iteaHeight * iteaAspectRatio;

            // Dibujar las imágenes
            page.drawImage(ineaImage, {
                x: margin,
                y: yPos - ineaHeight,
                width: ineaWidth,
                height: ineaHeight,
            });

            page.drawImage(iteaImage, {
                x: pageWidth - margin - iteaWidth,
                y: yPos - iteaHeight, // Misma posición vertical que el logo izquierdo
                width: iteaWidth,
                height: iteaHeight,
            });

            // Título institucional centrado
            const titles = [
                'INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS',
                'DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS',
                'OFICINA DE RECURSOS MATERIALES',
                title.toUpperCase()
            ];

            // Dibujar cada línea del título
            titles.forEach((text, index) => {
                const textWidth = font.widthOfTextAtSize(text, 10);
                const xPos = (pageWidth - textWidth) / 2;
                page.drawText(normalizeText(text), {
                    x: xPos,
                    y: yPos - (index * 16),
                    size: 10,
                    font: font,
                    color: rgb(0, 0, 0)
                });
            });

            yPos -= 80;

            // Obtener la información de la última firma (la que está a la derecha)
            const directoraFirma = firmas[firmas.length - 1];

            // Formatear la fecha actual en español
            const fecha = new Date();
            const dia = fecha.getDate();
            const mes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fecha);
            const año = fecha.getFullYear();
            const currentDate = `${dia} de ${mes} de ${año}`;

            // Agregar la información adicional en su posición original
            const infoLines = [
                `NOMBRE: ${(directoraFirma.nombre || 'SIN ASIGNAR').toUpperCase()}`,
                'ADSCRIPCIÓN: DIRECCIÓN GENERAL',
                `CARGO: ${(directoraFirma.puesto || 'SIN ASIGNAR').toUpperCase()}`,
                `FECHA: ${currentDate.toUpperCase()}`
            ];

            infoLines.forEach((line, index) => {
                page.drawText(normalizeText(line), {
                    x: margin,
                    y: yPos - (index * 16),
                    size: 8,
                    font: regularFont,
                    color: rgb(0, 0, 0)
                });
            });

            // Ajustar la posición de la tabla para que aparezca un poco más abajo
            const tableYPos = height - 180; // Cambiado de 160 a 180
            yPos = await drawHeaders(page, tableYPos);
        } else {
            yPos -= 20; // Solo un pequeño espacio en las páginas siguientes
        }

        // Dibujar filas de datos
        for (let i = 0; i < pageData.length; i++) {
            const row = pageData[i];
            const rowHeight = calculateRowHeight(row, adjustedWidths);
            // NO break: siempre renderizar todos los ítems del bloque
            let xPos = margin;

            // Dibujar línea horizontal superior de la fila
            page.drawLine({
                start: { x: margin, y: yPos },
                end: { x: pageWidth - margin, y: yPos },
                thickness: 0.5,
                color: rgb(0.7, 0.7, 0.7),
            });

            // Numeración global
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

        // Agregar pie de página con número de página
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

    // Función para dibujar el resumen antes de las firmas
    const drawSummary = (page: import('pdf-lib').PDFPage, yPosition: number, totalItems: number, totalValue: number) => {
        const summaryY = yPosition - 40; // Espacio antes del resumen

        // Formatear el valor total con separadores de miles y dos decimales
        const formattedValue = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(totalValue);

        const summaryText = `${totalItems.toLocaleString('es-MX')} BIENES MUEBLES CON UN VALOR DE $${formattedValue}`;

        // Dibujar un rectángulo de fondo
        const textWidth = font.widthOfTextAtSize(summaryText, 12);

        page.drawRectangle({
            x: margin,
            y: summaryY - 5,
            width: pageWidth - (2 * margin),
            height: 30,
            color: rgb(0.95, 0.95, 0.95),
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 1,
        });

        // Centrar el texto en el rectángulo
        const textX = margin + ((pageWidth - (2 * margin) - textWidth) / 2);

        page.drawText(normalizeText(summaryText), {
            x: textX,
            y: summaryY,
            size: 10, // Reduced from 12 to 10
            font: font,
            color: rgb(0, 0, 0),
        });

        return summaryY - 30; // Retornar la nueva posición Y para las firmas
    };

    // Función para dibujar la sección de firmas
    const drawSignatureSection = (page: import('pdf-lib').PDFPage, yPosition: number) => {
        const signatureBoxWidth = (pageWidth - (2 * margin)) / 3;
        const signatureBoxHeight = 100;
        const signatureSectionY = yPosition - 100;
        const lineY = signatureSectionY + 40;

        // Dibujar el borde rectangular que rodea toda la sección de firmas
        page.drawRectangle({
            x: margin,
            y: signatureSectionY,
            width: pageWidth - (2 * margin),
            height: signatureBoxHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
        });

        firmas.forEach((firma, index) => {
            const xPos = margin + (index * signatureBoxWidth);

            // Dibujar concepto arriba de la línea con más espacio
            page.drawText(normalizeText(firma.concepto.toUpperCase()), {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.concepto.toUpperCase(), 8) / 2),
                y: lineY + 30, // Aumentado de 20 a 30 para más espacio
                size: 8,
                font: regularFont,
                color: rgb(0, 0, 0),
            });

            // Dibujar línea para firma
            page.drawLine({
                start: { x: xPos + 20, y: lineY },
                end: { x: xPos + signatureBoxWidth - 20, y: lineY },
                thickness: 1,
                color: rgb(0, 0, 0),
            });

            // El resto de los textos mantienen su espaciado relativo a la línea
            const nombreText = (firma.nombre || 'SIN ASIGNAR').toUpperCase();
            const puestoText = (firma.puesto || 'SIN ASIGNAR').toUpperCase();
            
            page.drawText(normalizeText(nombreText), {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(nombreText, 8) / 2),
                y: lineY - 15,
                size: 8,
                font: regularFont,
                color: rgb(0, 0, 0),
            });

            page.drawText(normalizeText(puestoText), {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(puestoText, 8) / 2),
                y: lineY - 30,
                size: 8,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
        });

        return signatureSectionY;
    };

    // Procesar todas las páginas con numeración global y bloques según altura
    const paginadas = paginarPorAltura(data);
    const totalPages = paginadas.length;
    let globalIndex = 0;
    for (let currentPage = 0; currentPage < paginadas.length; currentPage++) {
        const pageData = paginadas[currentPage];
        const yPos = await processPage(pageData, currentPage, totalPages, globalIndex);

        // Si es la última página y hay firmas
        if (currentPage === paginadas.length - 1 && firmas.length > 0) {
            const page = pdfDoc.getPages()[currentPage];

            // Verificar si hay espacio suficiente para el resumen y las firmas
            if (yPos - margin < 160) {
                // No hay suficiente espacio, crear nueva página
                const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
                const summaryY = await drawSummary(newPage, pageHeight - margin, data.length, data.reduce((sum, item) => sum + (parseFloat(item.valor?.toString() || '0') || 0), 0));
                drawSignatureSection(newPage, summaryY);

                // Agregar número de página a la nueva página
                const pageText = `PÁGINA ${currentPage + 2} DE ${totalPages}`;
                const pageTextWidth = regularFont.widthOfTextAtSize(pageText, 10);

                newPage.drawText(normalizeText(pageText), {
                    x: pageWidth - margin - pageTextWidth,
                    y: margin - 20,
                    size: 10,
                    font: regularFont,
                    color: rgb(0.6, 0.6, 0.6)
                });
            } else {
                // Hay suficiente espacio, dibujar en la página actual
                const summaryY = await drawSummary(page, yPos, data.length, data.reduce((sum, item) => sum + (parseFloat(item.valor?.toString() || '0') || 0), 0));
                drawSignatureSection(page, summaryY);
            }
        }

        globalIndex += pageData.length;
    }

    // Guardar PDF
    const pdfBytes = await pdfDoc.save();
    const uint8Array = new Uint8Array(pdfBytes);
    const blob = new Blob([uint8Array], { type: 'application/pdf' });
    saveAs(blob, `${fileName}.pdf`);
};
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
    const minCellPadding = 2; // Aumentado de 1 a 2
    const fontSize = 4;
    const headerFontSize = 5;
    const verticalPadding = 3; // Nuevo: padding vertical para separar el texto de las líneas

    // Función para dividir texto en líneas, incluyendo palabras largas
    const wrapText = (text: string, maxWidth: number, font: import('pdf-lib').PDFFont, fontSize: number) => {
        const words = text.toString().split(' ');
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

    // Función para dibujar el encabezado de las columnas
    const drawHeaders = (page: import('pdf-lib').PDFPage, startY: number) => {
        let xPos = margin;
        const currentY = startY;

        columns.forEach((col) => {
            const colWidth = col.width ?? 80;
            // Dibujar el fondo del encabezado
            page.drawRectangle({
                x: xPos,
                y: currentY - 25,
                width: colWidth,
                height: 25,
                color: rgb(0.9, 0.9, 0.9),
            });

            // Centrar el texto del encabezado
            const headerX = xPos + centerTextInCell(col.header, colWidth, font, headerFontSize);
            page.drawText(normalizeText(col.header), {
                x: headerX,
                y: currentY - 18,
                size: headerFontSize,
                font: font,
                color: rgb(0.2, 0.2, 0.2)
            });

            xPos += colWidth;
        });

        return currentY - 25;
    };

    // Modificar processPage para incluir el padding vertical en el posicionamiento del texto
    const processPage = async (pageData: Record<string, unknown>[], pageIndex: number, totalPages: number) => {
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
            const iteaHeight = maxImageHeight;
            const ineaWidth = ineaHeight * ineaAspectRatio;
            const iteaWidth = iteaHeight * iteaAspectRatio;

            // Dibujar las imágenes
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

            // Título institucional centrado
            const titles = [
                'INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS',
                'DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS',
                'OFICINA DE RECURSOS MATERIALES',
                title
            ];

            // Dibujar cada línea del título
            titles.forEach((text, index) => {
                const textWidth = font.widthOfTextAtSize(text, 12);
                const xPos = (pageWidth - textWidth) / 2;
                page.drawText(normalizeText(text), {
                    x: xPos,
                    y: yPos - (index * 20),
                    size: 12,
                    font: font,
                    color: rgb(0, 0, 0)
                });
            });

            yPos -= 100;

            // Obtener la información de la última firma (la que está a la derecha)
            const directoraFirma = firmas[firmas.length - 1];
            
            // Formatear la fecha actual en español
            const fecha = new Date();
            const dia = fecha.getDate();
            const mes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fecha);
            const año = fecha.getFullYear();
            const currentDate = `${dia} de ${mes} de ${año}`;

            // Agregar la información adicional justificada a la izquierda
            const infoLines = [
                `NOMBRE: ${directoraFirma.nombre}`,
                'ADSCRIPCIÓN: DIRECCIÓN GENERAL',
                `CARGO: ${directoraFirma.puesto}`,
                `FECHA: ${currentDate}`
            ];

            infoLines.forEach((line, index) => {
                page.drawText(normalizeText(line), {
                    x: margin,
                    y: yPos - (index * 20),
                    size: 11,
                    font: regularFont,
                    color: rgb(0, 0, 0)
                });
            });

            yPos -= 100; // Espacio después de la información adicional
        } else {
            yPos -= 20; // Solo un pequeño espacio en las páginas siguientes
        }

        // Dibujar los encabezados usando la nueva función
        yPos = await drawHeaders(page, height - (pageIndex === 0 ? 220 : 70));

        // Dibujar filas de datos
        for (const row of pageData) {
            const rowHeight = calculateRowHeight(row, columns.map(col => col.width ?? 80));
            if (yPos - rowHeight < margin) break;

            let xPos = margin;

            // Dibujar línea horizontal superior de la fila
            page.drawLine({
                start: { x: margin, y: yPos },
                end: { x: pageWidth - margin, y: yPos },
                thickness: 0.5,
                color: rgb(0.7, 0.7, 0.7),
            });

            columns.forEach((col) => {
                const colWidth = col.width ?? 80;
                if (col.isComposite && col.keys) {
                    const combinedValue = col.keys
                        .map(key => row[key]?.toString() || '')
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
                    const value = row[col.key]?.toString() || '';

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
        const pageText = `Página ${pageIndex + 1} de ${totalPages}`;
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
            size: 12,
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

            // Dibujar línea para firma
            page.drawLine({
                start: { x: xPos + 20, y: lineY },
                end: { x: xPos + signatureBoxWidth - 20, y: lineY },
                thickness: 1,
                color: rgb(0, 0, 0),
            });

            // Dibujar concepto arriba de la línea (aumentando el espacio a 25 puntos)
            page.drawText(normalizeText(firma.concepto), {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.concepto, 10) / 2),
                y: lineY + 25, // Cambiado de 15 a 25 para más espacio
                size: 10,
                font: regularFont,
                color: rgb(0, 0, 0),
            });

            // Dibujar nombre debajo de la línea
            page.drawText(normalizeText(firma.nombre), {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.nombre, 10) / 2),
                y: lineY - 20,
                size: 10,
                font: regularFont,
                color: rgb(0, 0, 0),
            });

            // Dibujar puesto debajo del nombre
            page.drawText(normalizeText(firma.puesto), {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(firma.puesto, 10) / 2),
                y: lineY - 35,
                size: 10,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
        });

        return signatureSectionY;
    };

    // Función para verificar si se necesitará una página adicional para firmas
    const needsExtraPage = (yPos: number) => {
        return yPos - margin < 160; // El mismo criterio que usamos para decidir crear nueva página
    };

    // Pre-procesar los datos para determinar el número total de páginas
    let totalPages = 0;
    let tempYPos = pageHeight - margin;
    let tempCurrentIndex = 0;

    while (tempCurrentIndex < data.length) {
        const pageData = data.slice(tempCurrentIndex, tempCurrentIndex + 20);
        let rowsHeight = 0;
        
        // Simular el procesamiento de la página para calcular el espacio usado
        pageData.forEach(row => {
            rowsHeight += calculateRowHeight(row, columns.map(col => col.width ?? 80));
        });

        // Si es la última página, verificar si necesitará página adicional para firmas
        if (tempCurrentIndex + pageData.length >= data.length && firmas.length > 0) {
            const remainingSpace = tempYPos - rowsHeight - margin;
            if (needsExtraPage(remainingSpace)) {
                totalPages++; // Agregar una página extra para las firmas
            }
        }

        totalPages++;
        tempCurrentIndex += pageData.length;
        tempYPos = pageHeight - margin;
    }

    // Procesar todas las páginas con el número total correcto
    let currentPage = 0;
    let currentIndex = 0;
    
    // Calcular el valor total sumando la propiedad 'valor' de cada elemento
    const totalItems = data.length;
    const totalValue = data.reduce((sum, item) => {
        const valor = parseFloat(item.valor?.toString() || '0');
        return sum + (isNaN(valor) ? 0 : valor);
    }, 0);

    while (currentIndex < data.length) {
        const pageData = data.slice(currentIndex, currentIndex + 20);
        const yPos = await processPage(pageData, currentPage, totalPages);
        
        // Si es la última página y hay firmas
        if (currentIndex + pageData.length >= data.length && firmas.length > 0) {
            const page = pdfDoc.getPages()[currentPage];
            
            // Verificar si hay espacio suficiente para el resumen y las firmas
            if (yPos - margin < 160) {
                // No hay suficiente espacio, crear nueva página
                const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
                const summaryY = await drawSummary(newPage, pageHeight - margin, totalItems, totalValue);
                drawSignatureSection(newPage, summaryY);

                // Agregar número de página a la nueva página
                const pageText = `Página ${currentPage + 2} de ${totalPages}`;
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
                const summaryY = await drawSummary(page, yPos, totalItems, totalValue);
                drawSignatureSection(page, summaryY);
            }
        }

        currentIndex += pageData.length;
        currentPage++;
    }

    // Guardar PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, `${fileName}.pdf`);
};
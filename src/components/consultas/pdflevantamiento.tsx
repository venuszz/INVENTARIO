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

export const generatePDF = async ({ data, columns, fileName, firmas = [] }: PDFOptions) => {
    const pdfDoc = await PDFDocument.create();

    // Cargar y embedear las imágenes
    const ineaImageBytes = await fetch('/images/INEA NACIONAL.png').then(res => res.arrayBuffer());
    const iteaImageBytes = await fetch('/images/LOGO-ITEA.png').then(res => res.arrayBuffer());
    
    const ineaImage = await pdfDoc.embedPng(ineaImageBytes);
    const iteaImage = await pdfDoc.embedPng(iteaImageBytes);

    // Configuración de página y fuentes
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Configuración de tabla ajustada para formato vertical A4
    const margin = 50; // Aumentado para centrar mejor la tabla
    const pageWidth = 595.28; // Ancho A4 en puntos
    const pageHeight = 841.89; // Alto A4 en puntos
    const minCellPadding = 2;
    const fontSize = 7;
    const headerFontSize = 8;
    const verticalPadding = 3;

    // Columnas ajustadas para formato vertical con ancho total calculado
    columns = [
        { header: 'No INVENTARIO', key: 'id_inv', width: 65 },
        { header: 'DESCRIPCIÓN', key: 'descripcion', width: 175 },
        { header: 'ESTADO', key: 'estado', width: 65 },
        { header: 'ESTATUS', key: 'estatus', width: 65 },
        { header: 'AREA', key: 'area', width: 65 },
        { header: 'USUARIO FINAL', key: 'usufinal', width: 60 }
    ];

    // Función para normalizar texto (convertir caracteres acentuados a su versión UTF-16)
    const normalizeText = (text: string) => {
        return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    };

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

    const processPage = async (pageData: Record<string, unknown>[], pageIndex: number, totalPages: number) => {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const { height } = page.getSize();
        let yPos = height - margin;

        if (pageIndex === 0) {
            // Calcular dimensiones para las imágenes (tamaño aumentado)
            const maxImageHeight = 35; // Aumentado a 35
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
                height: ineaHeight,
            });

            // Mover los títulos más abajo después de las imágenes
            yPos -= maxImageHeight + 20; // Espacio adicional después de las imágenes

            // Títulos principales
            const titles = [
                'INSTITUTO TLAXCALTECA PARA LA EDUCACIÓN DE LOS ADULTOS',
                'DIRECCIÓN DE ADMINISTRACIÓN Y FINANZAS',
                'OFICINA DE RECURSOS MATERIALES',
                'REPORTE LEVANTAMIENTO DE INVENTARIO'
            ];

            titles.forEach((text, index) => {
                const textWidth = boldFont.widthOfTextAtSize(text, 11);
                const xPos = (pageWidth - textWidth) / 2;
                page.drawText(normalizeText(text), {
                    x: xPos,
                    y: yPos - (index * 13) - 10,
                    size: 11,
                    font: boldFont,
                    color: rgb(0, 0, 0)
                });
            });

            // Aumentar el espacio después de los títulos
            yPos -= 80; // Aumentado a 80

            // Información del director
            const directoraFirma = firmas[firmas.length - 1];
            
            // Formatear la fecha
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
                    y: yPos - (index * 13),
                    size: 10,
                    font: regularFont,
                    color: rgb(0, 0, 0)
                });
            });

            yPos -= 70; // Espacio antes de la tabla

        }

        // Dibujar la tabla para todas las páginas (no solo la primera)
        yPos = await drawHeaders(page, yPos);

        // Procesar los datos de la tabla
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

                // Dibujar línea vertical para separar columnas
                page.drawLine({
                    start: { x: xPos, y: yPos },
                    end: { x: xPos, y: yPos - rowHeight },
                    thickness: 0.5,
                    color: rgb(0.7, 0.7, 0.7),
                });

                xPos += colWidth;
            });

            // Dibujar última línea vertical
            page.drawLine({
                start: { x: xPos, y: yPos },
                end: { x: xPos, y: yPos - rowHeight },
                thickness: 0.5,
                color: rgb(0.7, 0.7, 0.7),
            });

            // Dibujar línea horizontal inferior de la fila
            page.drawLine({
                start: { x: margin, y: yPos - rowHeight },
                end: { x: pageWidth - margin, y: yPos - rowHeight },
                thickness: 0.5,
                color: rgb(0.7, 0.7, 0.7),
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

    // Ajustar la sección de firmas para formato vertical
    const drawSignatureSection = (page: import('pdf-lib').PDFPage, yPosition: number) => {
        // Aumentar el espacio antes de la sección de firmas
        const signatureBoxWidth = (pageWidth - (2 * margin)) / 2; // Cambiado de 3 a 2 divisiones
        const signatureBoxHeight = 80;
        const signatureSectionY = yPosition - 120; // Aumentado de 80 a 120 para más espacio
        const lineY = signatureSectionY + 35;

        // Dibujar el borde de la sección de firmas
        page.drawRectangle({
            x: margin,
            y: signatureSectionY,
            width: pageWidth - (2 * margin),
            height: signatureBoxHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5,
        });

        // Tomar solo las dos primeras firmas
        const firmasAMostrar = firmas.slice(0, 2);

        firmasAMostrar.forEach((firma, index) => {
            const xPos = margin + (index * signatureBoxWidth);

            // Línea para firma
            page.drawLine({
                start: { x: xPos + 15, y: lineY },
                end: { x: xPos + signatureBoxWidth - 15, y: lineY },
                thickness: 0.5,
                color: rgb(0, 0, 0),
            });

            // Texto de firma ajustado
            const textoConcepto = normalizeText(firma.concepto.toUpperCase());
            const textoNombre = normalizeText(firma.nombre.toUpperCase());
            const textoPuesto = normalizeText(firma.puesto.toUpperCase());

            // Dibujar textos con tamaño reducido
            page.drawText(textoConcepto, {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(textoConcepto, 9) / 2),
                y: lineY + 20,
                size: 9,
                font: regularFont,
                color: rgb(0, 0, 0),
            });

            page.drawText(textoNombre, {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(textoNombre, 9) / 2),
                y: lineY - 15,
                size: 9,
                font: regularFont,
                color: rgb(0, 0, 0),
            });

            page.drawText(textoPuesto, {
                x: xPos + (signatureBoxWidth / 2) - (regularFont.widthOfTextAtSize(textoPuesto, 9) / 2),
                y: lineY - 30,
                size: 9,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
        });

        return signatureSectionY;
    };

    // Función para verificar si se necesitará una página adicional para firmas
    const needsExtraPage = (yPos: number) => {
        return yPos - margin < 200; // Aumentado de 160 a 200 para asegurar suficiente espacio
    };

    // Pre-procesar los datos para determinar el número total de páginas
    let totalPages = 0;
    let tempYPos = pageHeight - margin;
    let tempCurrentIndex = 0;

    while (tempCurrentIndex < data.length) {
        const pageData = data.slice(tempCurrentIndex, tempCurrentIndex + 30); // Increased from 20 to 30 items per page
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

    while (currentIndex < data.length) {
        const pageData = data.slice(currentIndex, currentIndex + 30);
        const yPos = await processPage(pageData, currentPage, totalPages);
        
        // Si es la última página y hay firmas
        if (currentIndex + pageData.length >= data.length && firmas.length > 0) {
            const page = pdfDoc.getPages()[currentPage];
            
            // Verificar si hay espacio suficiente para las firmas
            if (yPos - margin < 160) {
                // No hay suficiente espacio, crear nueva página
                const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
                drawSignatureSection(newPage, pageHeight - margin);

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
                drawSignatureSection(page, yPos);
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
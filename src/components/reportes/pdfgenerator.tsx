import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';

interface PDFOptions {
    data: Record<string, unknown>[];
    columns: Column[];
    title: string;
    fileName: string;
}

interface Column {
    header: string;
    key: string;
    width?: number;
}

export const generatePDF = async ({ data, columns, title, fileName }: PDFOptions) => {
    const pdfDoc = await PDFDocument.create();
    const dateString = format(new Date(), "dd MMMM yyyy");

    // Configuración de página y fuentes
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Configuración de tabla
    const margin = 50;
    const pageWidth = 842; // A4 landscape
    const pageHeight = 595;
    const tableWidth = pageWidth - (2 * margin);
    const minCellPadding = 5;
    const fontSize = 8;
    const headerFontSize = 9;

    // Calcular anchos de columna basados en el contenido y el ancho disponible
    const calculateColumnWidths = () => {
        const totalWeight = columns.reduce((acc, col) => acc + (col.width || 1), 0);
        return columns.map(col => {
            const width = ((col.width || 1) / totalWeight) * tableWidth;
            return Math.max(width, 40); // Ancho mínimo de 40 puntos
        });
    };
    const columnWidths = calculateColumnWidths();

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
            const value = row[col.key]?.toString() || '';
            const availableWidth = columnWidths[index] - (2 * minCellPadding);
            const lines = wrapText(value, availableWidth, regularFont, fontSize);
            maxLines = Math.max(maxLines, lines.length);
        });
        return Math.max(25, (maxLines * (fontSize + 2)) + (2 * minCellPadding));
    };

    // Calcular cuántas filas caben por página (dinámico basado en altura de contenido)
    const processPage = async (pageData: Record<string, unknown>[], pageIndex: number, totalPages: number) => {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const { height } = page.getSize();
        let yPos = height - margin;

        // Encabezado
        page.drawText(`Reporte INEA - ${title}`, {
            x: margin,
            y: yPos,
            size: 16,
            font,
            color: rgb(0.2, 0.2, 0.2)
        });

        yPos -= 20;
        page.drawText(`Generado: ${dateString} - Página ${pageIndex + 1} de ${totalPages}`, {
            x: margin,
            y: yPos,
            size: 10,
            font: regularFont,
            color: rgb(0.6, 0.6, 0.6)
        });

        yPos -= 30;

        // Encabezados de columna
        let xPos = margin;
        columns.forEach((col, index) => {
            page.drawRectangle({
                x: xPos,
                y: yPos - 25,
                width: columnWidths[index],
                height: 25,
                color: rgb(0.9, 0.9, 0.9),
                borderColor: rgb(0.4, 0.4, 0.4),
                borderWidth: 1,
            });

            const headerLines = wrapText(col.header, columnWidths[index] - (2 * minCellPadding), font, headerFontSize);
            headerLines.forEach((line, lineIndex) => {
                page.drawText(line, {
                    x: xPos + minCellPadding,
                    y: yPos - 18 - (lineIndex * (headerFontSize + 2)),
                    size: headerFontSize,
                    font,
                    color: rgb(0.2, 0.2, 0.2)
                });
            });

            xPos += columnWidths[index];
        });

        yPos -= 25;

        // Dibujar filas de datos
        for (const row of pageData) {
            const rowHeight = calculateRowHeight(row, columnWidths);
            if (yPos - rowHeight < margin) break; // Nueva página si no hay espacio

            let xPos = margin;
            columns.forEach((col, colIndex) => {
                const value = row[col.key]?.toString() || '';

                // Dibujar celda
                page.drawRectangle({
                    x: xPos,
                    y: yPos - rowHeight,
                    width: columnWidths[colIndex],
                    height: rowHeight,
                    borderColor: rgb(0.7, 0.7, 0.7),
                    borderWidth: 0.5,
                });

                // Dibujar texto con wrap (sin truncamiento)
                const lines = wrapText(value, columnWidths[colIndex] - (2 * minCellPadding), regularFont, fontSize);
                
                lines.forEach((line, lineIndex) => {
                    page.drawText(line.trim(), {
                        x: xPos + minCellPadding,
                        y: yPos - (fontSize + 4) - (lineIndex * (fontSize + 2)) - minCellPadding,
                        size: fontSize,
                        font: regularFont,
                        color: rgb(0.2, 0.2, 0.2),
                        maxWidth: columnWidths[colIndex] - (2 * minCellPadding)
                    });
                });

                xPos += columnWidths[colIndex];
            });

            yPos -= rowHeight;
        }

        return yPos;
    };

    // Procesar todas las páginas
    let currentPage = 0;
    let currentIndex = 0;
    const totalPages = Math.ceil(data.length / 20); // Estimación inicial

    while (currentIndex < data.length) {
        const pageData = data.slice(currentIndex, currentIndex + 20);
        await processPage(pageData, currentPage, totalPages);
        
        // Actualizar índice basado en cuántas filas se procesaron
        const processedRows = pageData.length;
        currentIndex += processedRows;
        currentPage++;
    }

    // Guardar PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, `${fileName}.pdf`);
};
/**
 * Report generation utilities for batch origen transfer
 * 
 * Generates downloadable CSV/text reports with transfer results
 */

import { BatchTransferResult, OrigenType, TransferReport, ReportItem } from '@/types/batchOrigenTransfer';

/**
 * Generate a transfer report from batch transfer results
 * 
 * @param result - Batch transfer result
 * @param targetOrigen - Target origen for the transfer
 * @param userId - User ID who performed the transfer
 * @param userName - User name who performed the transfer
 * @returns Transfer report object
 */
export function generateTransferReport(
  result: BatchTransferResult,
  targetOrigen: OrigenType,
  userId: string,
  userName: string
): TransferReport {
  const timestamp = new Date().toISOString();

  // Map successful items
  const successfulItems: ReportItem[] = result.successful.map(item => ({
    idInventario: item.idInventario,
    descripcion: item.descripcion,
    origenAnterior: item.currentOrigen,
    origenNuevo: targetOrigen,
  }));

  // Map failed items
  const failedItems: ReportItem[] = result.failed.map(item => ({
    idInventario: item.idInventario,
    descripcion: item.descripcion,
    origenAnterior: item.currentOrigen,
    error: item.error || 'Error desconocido',
  }));

  // Map skipped items
  const skippedItems: ReportItem[] = result.skipped.map(item => ({
    idInventario: item.idInventario,
    descripcion: item.descripcion,
    origenAnterior: item.currentOrigen,
    reason: item.reason || 'Razón desconocida',
  }));

  return {
    timestamp,
    userId,
    userName,
    targetOrigen,
    summary: {
      total: result.successful.length + result.failed.length + result.skipped.length,
      successful: result.successful.length,
      failed: result.failed.length,
      skipped: result.skipped.length,
    },
    items: {
      successful: successfulItems,
      failed: failedItems,
      skipped: skippedItems,
    },
  };
}

/**
 * Format transfer report as CSV string
 * 
 * @param report - Transfer report object
 * @returns CSV formatted string
 */
export function formatReportAsCSV(report: TransferReport): string {
  const lines: string[] = [];

  // Header
  lines.push('REPORTE DE TRANSFERENCIA EN LOTE');
  lines.push('');
  lines.push(`Fecha y Hora:,${new Date(report.timestamp).toLocaleString('es-MX')}`);
  lines.push(`Usuario:,${report.userName} (${report.userId})`);
  lines.push(`Origen Destino:,${report.targetOrigen}`);
  lines.push('');

  // Summary
  lines.push('RESUMEN');
  lines.push(`Total de Items:,${report.summary.total}`);
  lines.push(`Exitosos:,${report.summary.successful}`);
  lines.push(`Fallidos:,${report.summary.failed}`);
  lines.push(`Omitidos:,${report.summary.skipped}`);
  lines.push('');

  // Successful transfers
  if (report.items.successful.length > 0) {
    lines.push('TRANSFERENCIAS EXITOSAS');
    lines.push('ID Inventario,Descripción,Origen Anterior,Origen Nuevo');
    report.items.successful.forEach(item => {
      lines.push(
        `${escapeCSV(item.idInventario)},${escapeCSV(item.descripcion)},${item.origenAnterior},${item.origenNuevo || ''}`
      );
    });
    lines.push('');
  }

  // Failed transfers
  if (report.items.failed.length > 0) {
    lines.push('TRANSFERENCIAS FALLIDAS');
    lines.push('ID Inventario,Descripción,Origen Anterior,Error');
    report.items.failed.forEach(item => {
      lines.push(
        `${escapeCSV(item.idInventario)},${escapeCSV(item.descripcion)},${item.origenAnterior},${escapeCSV(item.error || '')}`
      );
    });
    lines.push('');
  }

  // Skipped items
  if (report.items.skipped.length > 0) {
    lines.push('ITEMS OMITIDOS');
    lines.push('ID Inventario,Descripción,Origen Anterior,Razón');
    report.items.skipped.forEach(item => {
      lines.push(
        `${escapeCSV(item.idInventario)},${escapeCSV(item.descripcion)},${item.origenAnterior},${escapeCSV(item.reason || '')}`
      );
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Escape CSV field value
 * 
 * @param value - Field value to escape
 * @returns Escaped value
 */
function escapeCSV(value: string): string {
  if (!value) return '';
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}

/**
 * Download report as CSV file
 * 
 * @param report - Transfer report object
 * @param fileName - Optional custom file name (without extension)
 */
export function downloadReport(report: TransferReport, fileName?: string): void {
  const csv = formatReportAsCSV(report);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  // Generate file name
  const timestamp = new Date(report.timestamp).toISOString().slice(0, 10);
  const defaultFileName = `transferencia_lote_${timestamp}`;
  const finalFileName = `${fileName || defaultFileName}.csv`;
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', finalFileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

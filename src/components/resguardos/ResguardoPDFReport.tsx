import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface PdfArticulo {
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    estado: string | null;
}

interface PdfData {
    folio: string;
    fecha: string;
    director: string | undefined;
    area: string;
    puesto: string;
    resguardante: string;
    articulos: PdfArticulo[];
}

interface ResguardoPDFReportProps {
    data: PdfData;
    onClose: () => void;
}

const styles = StyleSheet.create({
    page: {
        fontSize: 12,
        padding: 32,
        backgroundColor: '#f8fafc',
        color: '#222',
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1e293b',
        textAlign: 'center',
    },
    section: {
        marginBottom: 12,
    },
    label: {
        fontWeight: 'bold',
        color: '#334155',
    },
    table: {
        width: 'auto',
        marginTop: 8,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#64748b',
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableHeader: {
        backgroundColor: '#e0e7ef',
    },
    tableCell: {
        padding: 6,
        fontSize: 11,
        borderRightWidth: 1,
        borderRightColor: '#64748b',
        borderBottomWidth: 1,
        borderBottomColor: '#64748b',
        flexGrow: 1,
    },
    tableCellHeader: {
        fontWeight: 'bold',
        backgroundColor: '#e0e7ef',
    },
    signature: {
        marginTop: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '40%',
        borderTopWidth: 1,
        borderTopColor: '#64748b',
        textAlign: 'center',
        paddingTop: 8,
        fontSize: 11,
    },
});

export const ResguardoPDF = ({ data }: { data: PdfData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Resguardo de Bienes</Text>
            <View style={styles.section}>
                <Text><Text style={styles.label}>Folio:</Text> {data.folio}</Text>
                <Text><Text style={styles.label}>Fecha:</Text> {data.fecha}</Text>
                <Text><Text style={styles.label}>Director:</Text> {data.director}</Text>
                <Text><Text style={styles.label}>Área:</Text> {data.area}</Text>
                <Text><Text style={styles.label}>Puesto:</Text> {data.puesto}</Text>
                <Text><Text style={styles.label}>Resguardante:</Text> {data.resguardante}</Text>
            </View>
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableCellHeader]}>ID Inventario</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader]}>Descripción</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader]}>Rubro</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader]}>Estado</Text>
                </View>
                {data.articulos.map((art: PdfArticulo, idx: number) => (
                    <View style={styles.tableRow} key={idx}>
                        <Text style={styles.tableCell}>{art.id_inv}</Text>
                        <Text style={styles.tableCell}>{art.descripcion}</Text>
                        <Text style={styles.tableCell}>{art.rubro}</Text>
                        <Text style={styles.tableCell}>{art.estado}</Text>
                    </View>
                ))}
            </View>
            <View style={styles.signature}>
                <View style={styles.signatureBox}>
                    <Text>Firma Director</Text>
                </View>
                <View style={styles.signatureBox}>
                    <Text>Firma Resguardante</Text>
                </View>
            </View>
        </Page>
    </Document>
);

const ResguardoPDFReport: React.FC<ResguardoPDFReportProps> = ({ data }) => {
    return (
        <div style={{ width: '100%' }}>
            <PDFDownloadLink
                document={<ResguardoPDF data={data} />}
                fileName={`resguardo_${data.folio}.pdf`}
                style={{ display: 'none' }}
            >
                {() => null}
            </PDFDownloadLink>
        </div>
    );
};

export default ResguardoPDFReport;
